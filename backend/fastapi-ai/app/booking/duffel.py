"""Duffel adapter: flights (search, offer, order, cancel) and Stays hotels (search, rates, quote, booking).

API: https://duffel.com/docs/api/v2 (Bearer token + `Duffel-Version: v2`). A test token searches and
books against Duffel's sandbox ("Duffel Airways" and test hotels): real API, no real tickets.
Every response is normalised here into small plain dicts the UI and the agent share; prices stay
the strings Duffel returns (no float rounding on money).
"""
from __future__ import annotations

import re

import httpx

from app.config import settings

BASE = "https://api.duffel.com"


class ProviderError(Exception):
    """A provider said no (or could not be reached). `message` is safe to show the user."""

    def __init__(self, message: str, status: int | None = None, code: str | None = None):
        super().__init__(message)
        self.message, self.status, self.code = message, status, code


def token() -> str:
    return settings.duffel_access_token.strip()


def configured() -> bool:
    return bool(token())


def token_mode() -> str | None:
    """'test' / 'live' from the token prefix; None when unknown (Duffel's live_mode on results is the truth)."""
    t = token()
    if t.startswith("duffel_test"):
        return "test"
    if t.startswith("duffel_live"):
        return "live"
    return None


def _client() -> httpx.Client:
    if not configured():
        raise ProviderError("Duffel isn't connected: add DUFFEL_ACCESS_TOKEN to .env (a free test token works).", 428, "not_configured")
    return httpx.Client(base_url=BASE, timeout=httpx.Timeout(70, connect=10), headers={
        "Authorization": f"Bearer {token()}", "Duffel-Version": "v2", "Accept": "application/json", "Content-Type": "application/json"})


def _errors(r: httpx.Response) -> ProviderError:
    try:
        errs = r.json().get("errors") or []
    except ValueError:
        errs = []
    msg = "; ".join(e.get("message") or e.get("title") or "" for e in errs if isinstance(e, dict)).strip() or f"Duffel answered HTTP {r.status_code}"
    code = next((e.get("code") for e in errs if isinstance(e, dict) and e.get("code")), None)
    if r.status_code in (401, 403) and code in (None, "unauthorized", "forbidden", "access_token_not_found"):
        msg = f"Duffel refused the request ({msg}). Check the access token, or ask Duffel to enable this product (Stays needs approval)."
    return ProviderError(msg, r.status_code, code)


def call(method: str, path: str, client: httpx.Client | None = None, **kw) -> dict:
    own = client is None
    c = client or _client()
    try:
        r = c.request(method, path, **kw)
    except httpx.HTTPError as e:
        raise ProviderError(f"Could not reach Duffel: {e}", 503, "unreachable") from e
    finally:
        if own:
            c.close()
    if r.status_code >= 400:
        raise _errors(r)
    return r.json() if r.content else {}


# ---------- normalisers (pure) ----------

def iso_minutes(duration: str | None) -> int | None:
    """'PT2H26M' / 'P1DT3H' -> minutes."""
    if not duration:
        return None
    m = re.fullmatch(r"P(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?)?", duration)
    if not m:
        return None
    d, h, mi = (int(x or 0) for x in m.groups())
    return d * 1440 + h * 60 + mi


def _cond(c: dict | None) -> dict | None:
    if c is None:
        return None
    return {"allowed": bool(c.get("allowed")), "penalty": c.get("penalty_amount"), "currency": c.get("penalty_currency")}


def norm_offer(o: dict) -> dict:
    slices = []
    for s in o.get("slices") or []:
        segs = s.get("segments") or []
        bags = {}
        for p in (segs[0].get("passengers") if segs else None) or []:
            for b in p.get("baggages") or []:
                bags[b.get("type")] = max(bags.get(b.get("type"), 0), b.get("quantity") or 0)
        slices.append({
            "origin": (s.get("origin") or {}).get("iata_code"), "origin_city": (s.get("origin") or {}).get("city_name"),
            "destination": (s.get("destination") or {}).get("iata_code"), "destination_city": (s.get("destination") or {}).get("city_name"),
            "departing_at": segs[0].get("departing_at") if segs else None, "arriving_at": segs[-1].get("arriving_at") if segs else None,
            "minutes": iso_minutes(s.get("duration")), "stops": max(0, len(segs) - 1), "fare_brand": s.get("fare_brand_name"),
            "cabin": ((segs[0].get("passengers") or [{}])[0].get("cabin_class_marketing_name") if segs else None),
            "baggage": bags,
            "segments": [{
                "flight": f"{(g.get('marketing_carrier') or {}).get('iata_code', '')}{g.get('marketing_carrier_flight_number', '')}",
                "operated_by": (g.get("operating_carrier") or {}).get("name"), "aircraft": (g.get("aircraft") or {}).get("name"),
                "from": (g.get("origin") or {}).get("iata_code"), "to": (g.get("destination") or {}).get("iata_code"),
                "departing_at": g.get("departing_at"), "arriving_at": g.get("arriving_at"), "minutes": iso_minutes(g.get("duration")),
            } for g in segs],
        })
    cond = o.get("conditions") or {}
    owner = o.get("owner") or {}
    pay = o.get("payment_requirements") or {}
    return {
        "id": o.get("id"), "kind": "flight", "provider": "duffel", "live_mode": bool(o.get("live_mode")),
        "total_amount": o.get("total_amount"), "total_currency": o.get("total_currency"),
        "base_amount": o.get("base_amount"), "tax_amount": o.get("tax_amount"),
        "airline": owner.get("name"), "airline_code": owner.get("iata_code"), "airline_logo": owner.get("logo_symbol_url"),
        "conditions_url": owner.get("conditions_of_carriage_url"),
        "expires_at": o.get("expires_at"), "emissions_kg": o.get("total_emissions_kg"),
        "refund": _cond(cond.get("refund_before_departure")), "change": _cond(cond.get("change_before_departure")),
        "instant_payment": bool(pay.get("requires_instant_payment")), "price_guaranteed_until": pay.get("price_guarantee_expires_at"),
        "id_documents_required": bool(o.get("passenger_identity_documents_required")),
        "passengers": [{"id": p.get("id"), "type": p.get("type") or ("adult" if (p.get("age") or 18) >= 18 else "child"), "age": p.get("age")} for p in o.get("passengers") or []],
        "slices": slices,
        "minutes": sum(s["minutes"] or 0 for s in slices) or None,
        "stops": sum(s["stops"] for s in slices),
    }


def rank(offers: list[dict]) -> list[dict]:
    """Sort by price and tag the cheapest, fastest and best-value offers (pure)."""
    if not offers:
        return []
    price = lambda o: float(o["total_amount"] or "inf")  # noqa: E731
    mins = lambda o: o["minutes"] or 10 ** 6  # noqa: E731
    out = sorted(offers, key=lambda o: (price(o), mins(o)))
    lo_p, hi_p = price(out[0]), max(price(o) for o in out)
    lo_m, hi_m = min(mins(o) for o in out), max(mins(o) for o in out)

    def score(o):  # 0 = best: 60 % price, 40 % time, a stop costs a little extra
        p = (price(o) - lo_p) / (hi_p - lo_p) if hi_p > lo_p else 0
        t = (mins(o) - lo_m) / (hi_m - lo_m) if hi_m > lo_m else 0
        return 0.6 * p + 0.4 * t + 0.03 * o["stops"]

    tags = {out[0]["id"]: ["cheapest"]}
    fastest = min(out, key=lambda o: (mins(o), price(o)))
    tags.setdefault(fastest["id"], []).append("fastest")
    best = min(out, key=score)
    tags.setdefault(best["id"], []).append("best value")
    for o in out:
        o["tags"] = tags.get(o["id"], []) + (["refundable"] if (o.get("refund") or {}).get("allowed") else [])
    return out


# ---------- flights ----------

def places(query: str) -> list[dict]:
    d = call("GET", "/places/suggestions", params={"query": query})
    return [{"type": p.get("type"), "code": p.get("iata_code"), "name": p.get("name"), "city": p.get("city_name"),
             "country": p.get("iata_country_code"), "lat": p.get("latitude"), "lng": p.get("longitude")} for p in d.get("data") or []]


def search_flights(q: dict) -> dict:
    """q: origin, destination, departure_date, return_date?, adults, children_ages[], cabin_class?, max_connections?"""
    slices = [{"origin": q["origin"], "destination": q["destination"], "departure_date": q["departure_date"]}]
    if q.get("return_date"):
        slices.append({"origin": q["destination"], "destination": q["origin"], "departure_date": q["return_date"]})
    pax = [{"type": "adult"} for _ in range(q.get("adults", 1))] + [{"age": a} for a in q.get("children_ages") or []]
    body = {"data": {"slices": slices, "passengers": pax, **({"cabin_class": q["cabin_class"]} if q.get("cabin_class") else {}),
                     **({"max_connections": q["max_connections"]} if q.get("max_connections") is not None else {})}}
    d = call("POST", "/air/offer_requests", params={"return_offers": "true", "supplier_timeout": 20000}, json=body)["data"]
    offers = rank([norm_offer(o) for o in d.get("offers") or []])
    return {"offer_request_id": d.get("id"), "live_mode": bool(d.get("live_mode")), "offers": offers[:60], "total": len(offers)}


def get_offer(offer_id: str) -> dict:
    """The offer re-priced now (offers go stale within minutes)."""
    return norm_offer(call("GET", f"/air/offers/{offer_id}", params={"return_available_services": "false"})["data"])


def create_order(offer: dict, passengers: list[dict], booking_id: str, pay_now: bool = True) -> dict:
    body = {"data": {"type": "instant" if pay_now else "hold", "selected_offers": [offer["id"]], "passengers": passengers,
                     "metadata": {"jarvis_booking_id": booking_id}}}
    if pay_now:
        body["data"]["payments"] = [{"type": "balance", "amount": offer["total_amount"], "currency": offer["total_currency"]}]
    return norm_order(call("POST", "/air/orders", json=body)["data"])


def norm_order(o: dict) -> dict:
    ps = o.get("payment_status") or {}
    return {"id": o.get("id"), "booking_reference": o.get("booking_reference"), "live_mode": bool(o.get("live_mode")),
            "total_amount": o.get("total_amount"), "total_currency": o.get("total_currency"), "cancelled_at": o.get("cancelled_at"),
            "awaiting_payment": bool(ps.get("awaiting_payment")), "paid_at": ps.get("paid_at"),
            "documents": [{"type": d.get("type"), "number": d.get("unique_identifier")} for d in o.get("documents") or []]}


def get_order(order_id: str) -> dict:
    return norm_order(call("GET", f"/air/orders/{order_id}")["data"])


def cancellation_quote(order_id: str) -> dict:
    d = call("POST", "/air/order_cancellations", json={"data": {"order_id": order_id}})["data"]
    return {"id": d.get("id"), "refund_amount": d.get("refund_amount"), "refund_currency": d.get("refund_currency"),
            "refund_to": d.get("refund_to"), "expires_at": d.get("expires_at")}


def confirm_cancellation(cancellation_id: str) -> dict:
    d = call("POST", f"/air/order_cancellations/{cancellation_id}/actions/confirm")["data"]
    return {"id": d.get("id"), "confirmed_at": d.get("confirmed_at"), "refund_amount": d.get("refund_amount"),
            "refund_currency": d.get("refund_currency"), "refund_to": d.get("refund_to")}


# ---------- stays (hotels) ----------

def norm_stay(r: dict) -> dict:
    a = r.get("accommodation") or {}
    loc = a.get("location") or {}
    addr = loc.get("address") or {}
    geo = loc.get("geographic_coordinates") or {}
    return {
        "id": r.get("id"), "kind": "stay", "provider": "duffel", "name": a.get("name"), "rating": a.get("rating"),
        "review_score": a.get("review_score"), "review_count": a.get("review_count"),
        "address": ", ".join(x for x in (addr.get("line_one"), addr.get("city_name"), addr.get("country_code")) if x),
        "lat": geo.get("latitude"), "lng": geo.get("longitude"), "photo": ((a.get("photos") or [{}])[0] or {}).get("url"),
        "amenities": [m.get("description") or m.get("type") for m in (a.get("amenities") or [])[:8]],
        "from_amount": r.get("cheapest_rate_total_amount"), "from_currency": r.get("cheapest_rate_currency"),
        "check_in": r.get("check_in_date"), "check_out": r.get("check_out_date"),
        "check_in_after": (a.get("check_in_information") or {}).get("check_in_after_time"),
    }


def norm_rate(rate: dict, room: dict) -> dict:
    tl = rate.get("cancellation_timeline") or []
    refundable = any(float(t.get("refund_amount") or 0) > 0 for t in tl)
    return {"id": rate.get("id"), "room": room.get("name"), "beds": ", ".join(f"{b.get('count')} {b.get('type')}" for b in room.get("beds") or []),
            "total_amount": rate.get("total_amount"), "total_currency": rate.get("total_currency"), "board": rate.get("board_type"),
            "payment_type": rate.get("payment_type"), "available": rate.get("quantity_available"), "refundable": refundable,
            "free_cancel_until": next((t.get("before") for t in tl if float(t.get("refund_amount") or 0) > 0), None),
            "conditions": [c.get("title") for c in rate.get("conditions") or [] if c.get("title")]}


def search_stays(q: dict) -> dict:
    """q: lat, lng, radius_km?, check_in, check_out, rooms, adults."""
    body = {"data": {"location": {"radius": q.get("radius_km", 5), "geographic_coordinates": {"latitude": q["lat"], "longitude": q["lng"]}},
                     "check_in_date": q["check_in"], "check_out_date": q["check_out"], "rooms": q.get("rooms", 1),
                     "guests": [{"type": "adult"} for _ in range(q.get("adults", 1))]}}
    d = call("POST", "/stays/search", json=body)["data"]
    res = [norm_stay(r) for r in d.get("results") or []]
    res.sort(key=lambda s: float(s["from_amount"] or "inf"))
    return {"results": res[:50], "total": len(res)}


def stay_rates(search_result_id: str) -> dict:
    d = call("POST", f"/stays/search_results/{search_result_id}/actions/fetch_all_rates")["data"]
    acc = d.get("accommodation") or {}
    rates = [norm_rate(rt, room) for room in acc.get("rooms") or [] for rt in room.get("rates") or []]
    rates.sort(key=lambda x: float(x["total_amount"] or "inf"))
    return {"stay": norm_stay(d), "rates": rates}


def stay_quote(rate_id: str) -> dict:
    d = call("POST", "/stays/quotes", json={"data": {"rate_id": rate_id}})["data"]
    return {"id": d.get("id"), "total_amount": d.get("total_amount"), "total_currency": d.get("total_currency"),
            "check_in": d.get("check_in_date"), "check_out": d.get("check_out_date"), "live_mode": bool(d.get("live_mode")),
            "accommodation": (d.get("accommodation") or {}).get("name")}


def create_stay_booking(quote_id: str, guests: list[dict], email: str, phone: str, booking_id: str) -> dict:
    body = {"data": {"quote_id": quote_id, "email": email, "phone_number": phone,
                     "guests": [{"given_name": g["given_name"], "family_name": g["family_name"], **({"born_on": g["born_on"]} if g.get("born_on") else {})} for g in guests],
                     "metadata": {"jarvis_booking_id": booking_id}}}
    d = call("POST", "/stays/bookings", json=body)["data"]
    return {"id": d.get("id"), "booking_reference": d.get("reference"), "status": d.get("status"), "live_mode": bool(d.get("live_mode"))}


def get_stay_booking(booking_id: str) -> dict:
    d = call("GET", f"/stays/bookings/{booking_id}")["data"]
    return {"id": d.get("id"), "booking_reference": d.get("reference"), "status": d.get("status"), "cancelled_at": d.get("cancelled_at")}


def cancel_stay_booking(booking_id: str) -> dict:
    d = call("POST", f"/stays/bookings/{booking_id}/actions/cancel")["data"]
    return {"id": d.get("id"), "status": d.get("status"), "cancelled_at": d.get("cancelled_at")}
