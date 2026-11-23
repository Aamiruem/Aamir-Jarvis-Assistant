"""The booking engine: quote -> explicit confirmation -> payment -> provider booking -> verification.

Rules it enforces (from the spec, and because money is involved):
- Prices come from the provider at quote time and are re-checked before payment; a changed price
  needs a new confirmation.
- Nothing is reserved or charged without the user's explicit confirmation of the full summary.
- A booking is "confirmed" only after the provider returns it AND a re-read from the provider shows it.
- If payment succeeded but the provider booking fails, the payment is refunded automatically.
- If the provider call's outcome is unknown (timeout), nothing is refunded or retried blindly: the
  booking goes to needs_review with what to check, because the order may exist.
- Card/UPI details never reach Jarvis (Razorpay Checkout); dates of birth are deleted once booked.
"""
from __future__ import annotations

import re
import threading
from datetime import date
from decimal import Decimal

from app.booking import duffel, razorpay, store
from app.booking.duffel import ProviderError
from app.config import settings

_locks: dict[str, threading.Lock] = {}
_locks_guard = threading.Lock()

TITLES = {"mr", "ms", "mrs", "miss", "dr"}
PHONE = re.compile(r"^\+[1-9]\d{6,14}$")
EMAIL = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


class BookingError(Exception):
    def __init__(self, message: str, status: int = 400):
        super().__init__(message)
        self.message, self.status = message, status


def _lock(booking_id: str) -> threading.Lock:
    with _locks_guard:
        return _locks.setdefault(booking_id, threading.Lock())


# ---------- validation ----------

def check_traveller(t: dict, need_dob: bool = True) -> dict:
    out = {k: (t.get(k) or "").strip() for k in ("title", "gender", "given_name", "family_name", "born_on")}
    if not out["given_name"] or not out["family_name"]:
        raise BookingError("Each traveller needs a first and last name exactly as on their ID.")
    if need_dob:
        try:
            dob = date.fromisoformat(out["born_on"])
        except ValueError:
            raise BookingError(f"Date of birth for {out['given_name']} must be YYYY-MM-DD.") from None
        if dob >= date.today():
            raise BookingError(f"Date of birth for {out['given_name']} is in the future.")
        if out["title"].lower() not in TITLES:
            raise BookingError("Title must be Mr, Ms, Mrs, Miss or Dr.")
        if out["gender"].lower() not in ("m", "f"):
            raise BookingError("Gender must be m or f (as the airline requires).")
        out["title"], out["gender"] = out["title"].lower(), out["gender"].lower()
    return out


def check_contact(c: dict) -> dict:
    email, phone = (c.get("email") or "").strip(), (c.get("phone") or "").replace(" ", "").strip()
    if not EMAIL.match(email):
        raise BookingError("Enter a valid email for the booking confirmation.")
    if not PHONE.match(phone):
        raise BookingError("Enter the phone number in international format, e.g. +919876543210.")
    return {"email": email, "phone": phone}


def _flight_title(o: dict) -> str:
    s = o["slices"]
    if len(s) == 2 and s[1]["destination"] == s[0]["origin"]:
        route = f"{s[0]['origin']} ⇄ {s[0]['destination']} (return)"
    else:
        route = " · ".join(f"{x['origin']} → {x['destination']}" for x in s)
    return f"{o.get('airline') or 'Flight'}: {route}, {(s[0]['departing_at'] or '')[:10]}"


# ---------- quotes ----------

def quote_flight(user_id: str, offer_id: str, travellers: list[dict], contact: dict) -> dict:
    offer = duffel.get_offer(offer_id)
    pax = offer["passengers"]
    if len(travellers) != len(pax):
        raise BookingError(f"This fare is for {len(pax)} traveller(s); details were given for {len(travellers)}.")
    clean = [check_traveller(t) for t in travellers]
    for p, t in zip(pax, clean):
        t["id"], t["type"] = p["id"], p["type"]
    return store.create(user_id, kind="flight", provider="duffel", live_mode=offer["live_mode"], status="awaiting_confirmation",
                        title=_flight_title(offer), amount=offer["total_amount"], currency=offer["total_currency"], item_id=offer["id"],
                        summary=offer, travellers=clean, contact=check_contact(contact))


def quote_stay(user_id: str, rate_id: str, guests: list[dict], contact: dict, stay: dict | None = None, rate: dict | None = None) -> dict:
    q = duffel.stay_quote(rate_id)
    clean = [check_traveller(g, need_dob=False) for g in guests]
    if not clean:
        raise BookingError("Add the lead guest's name.")
    summary = {**(stay or {}), "quote": q, "rate_id": rate_id, "rate": rate or {}}
    return store.create(user_id, kind="stay", provider="duffel", live_mode=q["live_mode"], status="awaiting_confirmation",
                        title=f"{q.get('accommodation') or (stay or {}).get('name') or 'Hotel'}: {q.get('check_in')} → {q.get('check_out')}",
                        amount=q["total_amount"], currency=q["total_currency"], item_id=q["id"], summary=summary, travellers=clean,
                        contact=check_contact(contact))


# ---------- confirmation & payment ----------

def payment_plan(b: dict) -> str:
    """How this booking will be paid: razorpay, test_balance (sandbox, no money) or duffel_balance."""
    if razorpay.configured():
        rp = razorpay.mode()
        if rp is None:
            raise BookingError("The Razorpay key isn't recognised (it should start with rzp_live_ or rzp_test_).", 409)
        if rp == "live" and not b["live_mode"]:
            raise BookingError("Razorpay is in LIVE mode but this booking is a provider TEST booking: real money can't pay for a sandbox ticket. "
                               "Use a live provider token, or Razorpay test keys.", 409)
        if rp == "test" and b["live_mode"]:
            raise BookingError("This is a LIVE booking but Razorpay has TEST keys: a real ticket can't be issued against test money. "
                               "Switch to rzp_live_ keys.", 409)
        return "razorpay"
    if not b["live_mode"]:
        return "test_balance"
    if settings.booking_pay_from_balance:
        return "duffel_balance"
    raise BookingError("Live bookings need a way to pay: connect Razorpay (RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET), "
                       "or set BOOKING_PAY_FROM_BALANCE=true to pay from your own Duffel balance.", 409)


def confirm(user_id: str, booking_id: str, accepted: bool) -> dict:
    """The user approved the full summary. Re-checks the price, then starts payment (or books, in test mode)."""
    if accepted is not True:
        raise BookingError("Confirm that the summary, names and price are correct first.", 428)
    b = store.get(user_id, booking_id)
    if not b:
        raise BookingError("Booking not found.", 404)
    if b["status"] == "awaiting_payment":  # idempotent: same Razorpay order again
        return {**b, "checkout": checkout_params(b)}
    if b["status"] != "awaiting_confirmation":
        raise BookingError(f"This booking is already {b['status'].replace('_', ' ')}.", 409)
    if b["kind"] == "flight":
        fresh = duffel.get_offer(b["item_id"])
        if Decimal(fresh["total_amount"]) != Decimal(b["amount"]) or fresh["total_currency"] != b["currency"]:
            store.patch(user_id, booking_id, f"Price changed from {b['amount']} to {fresh['total_amount']} {fresh['total_currency']}: needs a new confirmation",
                        amount=fresh["total_amount"], currency=fresh["total_currency"], summary=fresh)
            raise BookingError(f"The airline changed the price to {fresh['total_amount']} {fresh['total_currency']}. Review and confirm again.", 409)
    plan = payment_plan(b)
    if plan == "razorpay":
        order = razorpay.create_order(b["amount"], b["currency"], receipt=booking_id, notes={"booking": booking_id, "title": b["title"][:200]})
        b = store.transition(user_id, booking_id, ("awaiting_confirmation",), "awaiting_payment", f"You confirmed; Razorpay order {order['id']} created",
                             payment_method="razorpay", payment_order_id=order["id"])
        if not b:
            raise BookingError("This booking changed in another window; reload it.", 409)
        return {**b, "checkout": checkout_params(b)}
    label = "Test mode: paid from the Duffel sandbox balance (no real money)" if plan == "test_balance" else "Paying from your Duffel balance"
    b = store.transition(user_id, booking_id, ("awaiting_confirmation",), "paid", f"You confirmed. {label}", payment_method=plan)
    if not b:
        raise BookingError("This booking changed in another window; reload it.", 409)
    return book(user_id, booking_id)


def checkout_params(b: dict) -> dict:
    return {"key": settings.razorpay_key_id.strip(), "order_id": b["payment_order_id"], "amount": razorpay.to_subunits(b["amount"], b["currency"]),
            "currency": b["currency"], "name": "Azarvis Bookings", "description": b["title"][:250],
            "prefill": {"email": b["contact"].get("email"), "contact": b["contact"].get("phone")}}


def pay(user_id: str, booking_id: str, order_id: str, payment_id: str, signature: str) -> dict:
    b = store.get(user_id, booking_id)
    if not b:
        raise BookingError("Booking not found.", 404)
    if b["status"] != "awaiting_payment":
        if b["status"] in ("paid", "booking", "confirmed") and b.get("payment_id") == payment_id:
            return b  # the same payment reported twice
        raise BookingError(f"This booking is {b['status'].replace('_', ' ')}, not waiting for payment.", 409)
    if order_id != b["payment_order_id"] or not razorpay.signature_ok(order_id, payment_id, signature):
        store.patch(user_id, booking_id, "Rejected a payment callback with a wrong signature")
        raise BookingError("The payment could not be verified (signature mismatch). Nothing was booked.", 400)
    p = razorpay.get_payment(payment_id)
    want = razorpay.to_subunits(b["amount"], b["currency"])
    if p.get("order_id") != order_id or int(p.get("amount") or -1) != want or (p.get("currency") or "").upper() != b["currency"].upper():
        raise BookingError("Razorpay reports a different order or amount for this payment. Nothing was booked; contact support with the payment id.", 400)
    if p.get("status") == "authorized":
        p = razorpay.capture(payment_id, want, b["currency"])
    if p.get("status") != "captured":
        raise BookingError(f"The payment is {p.get('status')}, not captured. Nothing was booked.", 402)
    return _settle(user_id, booking_id, p, "checkout")


def _settle(user_id: str, booking_id: str, p: dict, via: str) -> dict:
    """A captured payment for this booking: record it and book (exactly once, from checkout or webhook)."""
    info = razorpay.payment_details(p)
    how = info.get("method", "payment")
    b = store.transition(user_id, booking_id, ("awaiting_payment",), "paid",
                         f"{how.upper() if how == 'upi' else how.title()} payment {p['id']} captured and verified with Razorpay (via {via})",
                         payment_id=p["id"], payment_info=info)
    if not b:
        return store.get(user_id, booking_id)
    return book(user_id, booking_id)


def handle_webhook(event: dict) -> str:
    """Razorpay webhook (signature already verified): settles payments the browser didn't report, refunds
    duplicate or orphan payments, records refunds. Idempotent: Razorpay may deliver an event twice."""
    kind = event.get("event", "")
    payload = event.get("payload") or {}
    pay = (payload.get("payment") or {}).get("entity") or {}
    if kind == "payment.captured" and pay.get("order_id"):
        found = store.find_by_payment_order(pay["order_id"])
        if not found:
            return "ignored: unknown order"
        user_id, b = found
        if b.get("payment_id") == pay["id"]:
            return "already settled"
        want = razorpay.to_subunits(b["amount"], b["currency"])
        if b["status"] == "awaiting_payment" and int(pay.get("amount") or -1) == want and (pay.get("currency") or "").upper() == b["currency"].upper():
            _settle(user_id, b["id"], pay, "webhook")
            return "settled"
        # Paid twice, or paid for a booking that can no longer be completed: give the money back.
        try:
            rf = razorpay.refund(pay["id"], notes={"booking": b["id"], "reason": "duplicate or orphan payment"})
            store.patch(user_id, b["id"], f"Extra payment {pay['id']} received while the booking was {b['status'].replace('_', ' ')}: refunded in full ({rf.get('id')})")
            return "refunded duplicate"
        except ProviderError as e:
            store.patch(user_id, b["id"], f"Extra payment {pay['id']} received; automatic refund failed ({e.message}). Refund it from the Razorpay dashboard.")
            return "duplicate: refund failed"
    if kind == "payment.failed" and pay.get("order_id"):
        found = store.find_by_payment_order(pay["order_id"])
        if found:
            reason = pay.get("error_description") or pay.get("error_reason") or "declined"
            store.patch(found[0], found[1]["id"], f"A payment attempt failed ({pay.get('method') or 'payment'}): {reason}. Nothing was booked.")
            return "recorded failure"
        return "ignored: unknown order"
    if kind in ("refund.processed", "refund.failed", "refund.created"):
        rf = (payload.get("refund") or {}).get("entity") or {}
        pay_order = pay.get("order_id")
        found = store.find_by_payment_order(pay_order) if pay_order else None
        if found:
            amount = f"{(rf.get('amount') or 0) / 100:.2f} {(rf.get('currency') or found[1]['currency'])}"
            word = {"refund.processed": "processed: the money is on its way back", "refund.failed": "FAILED: refund it from the Razorpay dashboard",
                    "refund.created": "started"}[kind]
            store.patch(found[0], found[1]["id"], f"Refund {rf.get('id')} of {amount} {word}")
            return "recorded refund"
        return "ignored: unknown order"
    return f"ignored: {kind}"


# ---------- the provider booking ----------

def book(user_id: str, booking_id: str) -> dict:
    with _lock(booking_id):
        b = store.transition(user_id, booking_id, ("paid",), "booking", "Sending the reservation to the provider")
        if not b:
            return store.get(user_id, booking_id)  # already booked/booking: idempotent
        try:
            if b["kind"] == "flight":
                pax = [{k: t[k] for k in ("id", "title", "gender", "given_name", "family_name", "born_on")} | {"email": b["contact"]["email"], "phone_number": b["contact"]["phone"]}
                       for t in b["travellers"]]
                order = duffel.create_order(b["summary"], pax, booking_id)
                ref_id, ref = order["id"], order["booking_reference"]
                verify = duffel.get_order(ref_id)
                ok = bool(verify.get("booking_reference")) and not verify.get("cancelled_at") and not verify.get("awaiting_payment")
            else:
                bk = duffel.create_stay_booking(b["item_id"], b["travellers"], b["contact"]["email"], b["contact"]["phone"], booking_id)
                ref_id, ref = bk["id"], bk["booking_reference"]
                verify = duffel.get_stay_booking(ref_id)
                ok = verify.get("status") == "confirmed"
        except ProviderError as e:
            if e.code == "unreachable" or (e.status or 0) >= 500:
                return store.transition(user_id, booking_id, ("booking",), "needs_review",
                                        f"The provider didn't answer clearly ({e.message}). Not refunded or retried automatically: the reservation may exist.",
                                        error="Outcome unknown: check Duffel's dashboard for metadata jarvis_booking_id=" + booking_id)
            return _fail_and_refund(user_id, booking_id, b, e.message)
        if not ok:
            return store.transition(user_id, booking_id, ("booking",), "needs_review", "The provider created the reservation but its status isn't confirmed yet",
                                    provider_ref=ref_id, booking_reference=ref, error="Waiting for the provider to confirm; refresh later.")
        travellers = [{k: v for k, v in t.items() if k != "born_on"} for t in b["travellers"]]  # no need to keep dates of birth
        return store.transition(user_id, booking_id, ("booking",), "confirmed", f"Confirmed by the provider and re-verified: reference {ref}",
                                provider_ref=ref_id, booking_reference=ref, travellers=travellers, error=None)


def _fail_and_refund(user_id: str, booking_id: str, b: dict, reason: str) -> dict:
    if b.get("payment_method") == "razorpay" and b.get("payment_id"):
        try:
            rf = razorpay.refund(b["payment_id"], notes={"booking": booking_id, "reason": "provider booking failed"})
            return store.transition(user_id, booking_id, ("booking",), "refunded", f"Booking failed ({reason}); full refund {rf.get('id')} issued",
                                    error=reason)
        except ProviderError as e:
            return store.transition(user_id, booking_id, ("booking",), "refund_failed", f"Booking failed ({reason}) and the automatic refund failed: {e.message}",
                                    error=f"{reason}. Refund payment {b['payment_id']} from the Razorpay dashboard.")
    return store.transition(user_id, booking_id, ("booking",), "failed", f"The provider refused the booking: {reason}. No money was taken.", error=reason)


# ---------- after booking ----------

def refresh(user_id: str, booking_id: str) -> dict:
    """Re-read the booking from the provider (cancellations made elsewhere, late confirmation)."""
    b = store.get(user_id, booking_id)
    if not b:
        raise BookingError("Booking not found.", 404)
    if not b.get("provider_ref"):
        return b
    if b["kind"] == "flight":
        o = duffel.get_order(b["provider_ref"])
        if o.get("cancelled_at") and b["status"] != "cancelled":
            return store.transition(user_id, booking_id, ("confirmed", "needs_review"), "cancelled", f"The airline order was cancelled ({o['cancelled_at']})") or store.get(user_id, booking_id)
        if b["status"] == "needs_review" and o.get("booking_reference") and not o.get("awaiting_payment"):
            return store.transition(user_id, booking_id, ("needs_review",), "confirmed", f"Provider now confirms reference {o['booking_reference']}",
                                    booking_reference=o["booking_reference"], error=None) or store.get(user_id, booking_id)
    else:
        s = duffel.get_stay_booking(b["provider_ref"])
        if s.get("status") == "cancelled" and b["status"] != "cancelled":
            return store.transition(user_id, booking_id, ("confirmed", "needs_review"), "cancelled", "The hotel booking was cancelled") or store.get(user_id, booking_id)
        if b["status"] == "needs_review" and s.get("status") == "confirmed":
            return store.transition(user_id, booking_id, ("needs_review",), "confirmed", f"Provider now confirms reference {s.get('booking_reference')}",
                                    booking_reference=s.get("booking_reference"), error=None) or store.get(user_id, booking_id)
    return store.patch(user_id, booking_id, None)


def cancellation_quote(user_id: str, booking_id: str) -> dict:
    b = store.get(user_id, booking_id)
    if not b or b["status"] != "confirmed":
        raise BookingError("Only confirmed bookings can be cancelled.", 409)
    if b["kind"] != "flight":
        return {"kind": "stay", "note": "Hotel refunds follow the rate's cancellation policy shown when you booked.",
                "free_cancel_until": (b["summary"].get("rate") or {}).get("free_cancel_until")}
    q = duffel.cancellation_quote(b["provider_ref"])
    store.patch(user_id, booking_id, f"Cancellation quoted: refund {q['refund_amount']} {q['refund_currency']} to {q['refund_to']}")
    return q


def cancel(user_id: str, booking_id: str, cancellation_id: str | None, accepted: bool) -> dict:
    if accepted is not True:
        raise BookingError("Confirm the cancellation and refund amount first.", 428)
    b = store.get(user_id, booking_id)
    if not b or b["status"] != "confirmed":
        raise BookingError("Only confirmed bookings can be cancelled.", 409)
    if b["kind"] == "flight":
        if not cancellation_id:
            raise BookingError("Get the cancellation quote first.", 428)
        c = duffel.confirm_cancellation(cancellation_id)
        b = store.transition(user_id, booking_id, ("confirmed",), "cancelled",
                             f"Cancelled with the airline; refund {c.get('refund_amount')} {c.get('refund_currency')} to {c.get('refund_to')}")
        amount, cur, to = c.get("refund_amount"), c.get("refund_currency"), c.get("refund_to")
    else:
        duffel.cancel_stay_booking(b["provider_ref"])
        b = store.transition(user_id, booking_id, ("confirmed",), "cancelled", "Cancelled with the hotel")
        amount, cur, to = None, None, None
    # Money the provider returns to the Duffel balance is passed back to the customer's Razorpay payment.
    if b and b.get("payment_method") == "razorpay" and b.get("payment_id") and to == "balance" and amount and Decimal(amount) > 0 and cur == b["currency"]:
        try:
            rf = razorpay.refund(b["payment_id"], razorpay.to_subunits(amount, cur), notes={"booking": booking_id, "reason": "cancelled"})
            b = store.patch(user_id, booking_id, f"Refunded {amount} {cur} to your payment method (Razorpay {rf.get('id')})")
        except ProviderError as e:
            b = store.patch(user_id, booking_id, f"Cancelled, but the Razorpay refund failed: {e.message}. Refund it from the Razorpay dashboard.")
    return b


def providers() -> list[dict]:
    """What is connected, in which mode, and what each provider can do (search-only vs book)."""
    from app.booking import ticketmaster
    d = duffel.configured()
    return [
        {"id": "duffel_flights", "category": "flights", "name": "Duffel (300+ airlines)", "connected": d, "mode": duffel.token_mode() if d else None,
         "can": ["search", "price", "fare rules", "book", "cancel"], "env": "DUFFEL_ACCESS_TOKEN", "signup": "https://app.duffel.com/join"},
        {"id": "duffel_stays", "category": "hotels", "name": "Duffel Stays (hotels)", "connected": d, "mode": duffel.token_mode() if d else None,
         "can": ["search", "rates", "book", "cancel"], "env": "DUFFEL_ACCESS_TOKEN", "note": "Duffel enables Stays on request (contact Duffel after sign-up).",
         "signup": "https://duffel.com/stays"},
        {"id": "ticketmaster", "category": "events", "name": "Ticketmaster Discovery", "connected": ticketmaster.configured(), "mode": "live" if ticketmaster.configured() else None,
         "can": ["search"], "env": "TICKETMASTER_API_KEY", "note": "Search only: tickets are bought on Ticketmaster.", "signup": "https://developer.ticketmaster.com/"},
        {"id": "razorpay", "category": "payments", "name": "Razorpay", "connected": razorpay.configured(), "mode": razorpay.mode(),
         "can": ["checkout", "verify", "refund"], "env": "RAZORPAY_KEY_ID + RAZORPAY_KEY_SECRET", "signup": "https://dashboard.razorpay.com/signup"},
        {"id": "irctc", "category": "trains", "name": "IRCTC (Indian Railways)", "connected": False, "mode": None, "can": [],
         "note": "Booking APIs are only for IRCTC-authorised agents. Book on IRCTC; Jarvis can plan around it.", "link": "https://www.irctc.co.in/nget/train-search"},
        {"id": "buses", "category": "buses", "name": "Bus operators", "connected": False, "mode": None, "can": [],
         "note": "No public booking API (partner-only).", "link": "https://www.redbus.in/"},
        {"id": "movies", "category": "movies", "name": "Cinemas", "connected": False, "mode": None, "can": [],
         "note": "No public booking API (partner-only).", "link": "https://in.bookmyshow.com/"},
    ]
