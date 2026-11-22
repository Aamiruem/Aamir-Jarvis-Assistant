"""Bookings: provider responses are normalised, offers ranked, and the engine never books or charges
without explicit confirmation, re-verifies with the provider, and refunds when booking fails."""
import hashlib
import hmac

import pytest

from app.booking import duffel, engine, razorpay, store
from app.booking.duffel import ProviderError
from app.booking.engine import BookingError
from app.config import settings

USER = "booking-tester"


def offer_json(oid="off_1", amount="120.50", currency="GBP", minutes=150, stops=0, refundable=True, live=False):
    segs = [{"departing_at": "2027-03-01T08:00:00", "arriving_at": "2027-03-01T10:30:00", "duration": f"PT{minutes // 60}H{minutes % 60}M",
             "origin": {"iata_code": "LHR", "city_name": "London"}, "destination": {"iata_code": "JFK", "city_name": "New York"},
             "marketing_carrier": {"iata_code": "ZZ", "name": "Duffel Airways"}, "marketing_carrier_flight_number": "100",
             "operating_carrier": {"name": "Duffel Airways"}, "aircraft": {"name": "A320"},
             "passengers": [{"passenger_id": "pas_1", "cabin_class_marketing_name": "Economy", "baggages": [{"type": "checked", "quantity": 1}, {"type": "carry_on", "quantity": 1}]}]}]
    segs += [dict(segs[0])] * stops
    return {"id": oid, "total_amount": amount, "total_currency": currency, "live_mode": live, "owner": {"name": "Duffel Airways", "iata_code": "ZZ"},
            "expires_at": "2027-03-01T00:30:00Z", "payment_requirements": {"requires_instant_payment": True},
            "conditions": {"refund_before_departure": {"allowed": refundable, "penalty_amount": "20.00", "penalty_currency": currency}, "change_before_departure": None},
            "passengers": [{"id": "pas_1", "type": "adult"}],
            "slices": [{"duration": f"PT{minutes // 60}H{minutes % 60}M", "origin": {"iata_code": "LHR", "city_name": "London"},
                        "destination": {"iata_code": "JFK", "city_name": "New York"}, "fare_brand_name": "Basic", "segments": segs}]}


TRAVELLER = {"title": "Mr", "gender": "m", "given_name": "Aamir", "family_name": "Azad", "born_on": "1995-04-12"}
CONTACT = {"email": "test@example.com", "phone": "+919876543210"}


# ---------- normalising and ranking ----------

def test_iso_durations():
    assert duffel.iso_minutes("PT2H26M") == 146 and duffel.iso_minutes("P1DT3H") == 1620 and duffel.iso_minutes(None) is None


def test_offer_is_normalised_with_fare_rules_and_baggage():
    o = duffel.norm_offer(offer_json())
    assert o["total_amount"] == "120.50" and o["airline"] == "Duffel Airways" and o["minutes"] == 150
    assert o["refund"] == {"allowed": True, "penalty": "20.00", "currency": "GBP"} and o["change"] is None
    assert o["slices"][0]["baggage"] == {"checked": 1, "carry_on": 1} and o["slices"][0]["segments"][0]["flight"] == "ZZ100"
    assert o["passengers"] == [{"id": "pas_1", "type": "adult", "age": None}]


def test_rank_tags_cheapest_fastest_best_and_refundable():
    offers = [duffel.norm_offer(offer_json("a", "300.00", minutes=120)), duffel.norm_offer(offer_json("b", "100.00", minutes=600, stops=1, refundable=False)),
              duffel.norm_offer(offer_json("c", "140.00", minutes=180))]
    r = {o["id"]: o["tags"] for o in duffel.rank(offers)}
    assert "cheapest" in r["b"] and "fastest" in r["a"] and "best value" in r["c"]
    assert "refundable" in r["a"] and "refundable" not in r["b"]
    assert [o["id"] for o in duffel.rank(offers)] == ["b", "c", "a"]


def test_stay_and_rate_normalised():
    s = duffel.norm_stay({"id": "srr_1", "cheapest_rate_total_amount": "80.00", "cheapest_rate_currency": "INR",
                          "accommodation": {"name": "Hotel Pink City", "rating": 4, "location": {"address": {"line_one": "MI Road", "city_name": "Jaipur", "country_code": "IN"},
                                                                                              "geographic_coordinates": {"latitude": 26.9, "longitude": 75.8}},
                                            "photos": [{"url": "https://x/p.jpg"}], "amenities": [{"type": "wifi", "description": "Free Wi-Fi"}]}})
    assert s["name"] == "Hotel Pink City" and s["address"] == "MI Road, Jaipur, IN" and s["amenities"] == ["Free Wi-Fi"] and s["from_amount"] == "80.00"
    r = duffel.norm_rate({"id": "rat_1", "total_amount": "90.00", "total_currency": "INR", "board_type": "breakfast",
                          "cancellation_timeline": [{"refund_amount": "90.00", "before": "2027-02-27T12:00:00Z"}], "quantity_available": 2},
                         {"name": "Deluxe", "beds": [{"type": "king", "count": 1}]})
    assert r["refundable"] and r["free_cancel_until"] == "2027-02-27T12:00:00Z" and r["beds"] == "1 king"


def test_duffel_errors_become_readable_provider_errors(monkeypatch):
    import httpx

    def handler(req):
        assert req.headers["Duffel-Version"] == "v2" and req.headers["Authorization"] == "Bearer duffel_test_x"
        return httpx.Response(422, json={"errors": [{"message": "Offer has expired", "code": "offer_no_longer_available"}]})

    monkeypatch.setattr(settings, "duffel_access_token", "duffel_test_x")
    c = httpx.Client(base_url=duffel.BASE, transport=httpx.MockTransport(handler), headers={"Authorization": "Bearer duffel_test_x", "Duffel-Version": "v2"})
    with pytest.raises(ProviderError) as e:
        duffel.call("GET", "/air/offers/x", client=c)
    assert e.value.message == "Offer has expired" and e.value.code == "offer_no_longer_available"


def test_not_configured_is_explicit(monkeypatch):
    monkeypatch.setattr(settings, "duffel_access_token", "")
    with pytest.raises(ProviderError) as e:
        duffel.places("jaipur")
    assert e.value.code == "not_configured" and "DUFFEL_ACCESS_TOKEN" in e.value.message


# ---------- razorpay ----------

def test_money_is_converted_without_floats():
    assert razorpay.to_subunits("1234.50", "INR") == 123450 and razorpay.to_subunits("0.10", "USD") == 10 and razorpay.to_subunits("500", "JPY") == 500


def test_signature_check(monkeypatch):
    monkeypatch.setattr(settings, "razorpay_key_secret", "secret")
    good = hmac.new(b"secret", b"order_1|pay_1", hashlib.sha256).hexdigest()
    assert razorpay.signature_ok("order_1", "pay_1", good)
    assert not razorpay.signature_ok("order_1", "pay_2", good) and not razorpay.signature_ok("order_1", "pay_1", "")


# ---------- the engine ----------

class FakeDuffel:
    def __init__(self, live=False):
        self.price, self.live = "120.50", live
        self.orders, self.fail = [], None

    def get_offer(self, oid):
        return duffel.norm_offer(offer_json(oid, self.price, live=self.live))

    def create_order(self, offer, pax, booking_id):
        if self.fail:
            raise self.fail
        self.orders.append((offer["id"], pax, booking_id))
        return {"id": "ord_1", "booking_reference": "ABC123"}

    def get_order(self, oid):
        return {"id": oid, "booking_reference": "ABC123", "cancelled_at": None, "awaiting_payment": False}

    def cancellation_quote(self, oid):
        return {"id": "ore_1", "refund_amount": "100.50", "refund_currency": "GBP", "refund_to": "balance"}

    def confirm_cancellation(self, cid):
        return {"id": cid, "confirmed_at": "now", "refund_amount": "100.50", "refund_currency": "GBP", "refund_to": "balance"}


@pytest.fixture
def fake(monkeypatch):
    f = FakeDuffel()
    for name in ("get_offer", "create_order", "get_order", "cancellation_quote", "confirm_cancellation"):
        monkeypatch.setattr(duffel, name, getattr(f, name))
    monkeypatch.setattr(settings, "razorpay_key_id", "")
    monkeypatch.setattr(settings, "razorpay_key_secret", "")
    monkeypatch.setattr(settings, "booking_pay_from_balance", False)
    return f


def test_quote_validates_travellers_and_contact(fake):
    with pytest.raises(BookingError):
        engine.quote_flight(USER, "off_1", [{**TRAVELLER, "born_on": "2999-01-01"}], CONTACT)
    with pytest.raises(BookingError):
        engine.quote_flight(USER, "off_1", [TRAVELLER], {"email": "x", "phone": "+911"})
    with pytest.raises(BookingError):
        engine.quote_flight(USER, "off_1", [TRAVELLER, TRAVELLER], CONTACT)  # fare is for one person
    b = engine.quote_flight(USER, "off_1", [TRAVELLER], CONTACT)
    assert b["status"] == "awaiting_confirmation" and b["amount"] == "120.50" and b["travellers"][0]["id"] == "pas_1"
    assert "LHR → JFK" in b["title"] and not fake.orders


def test_nothing_happens_without_explicit_confirmation(fake):
    b = engine.quote_flight(USER, "off_1", [TRAVELLER], CONTACT)
    with pytest.raises(BookingError) as e:
        engine.confirm(USER, b["id"], accepted=False)
    assert e.value.status == 428 and not fake.orders and store.get(USER, b["id"])["status"] == "awaiting_confirmation"


def test_test_mode_books_verifies_and_forgets_dates_of_birth(fake):
    b = engine.quote_flight(USER, "off_1", [TRAVELLER], CONTACT)
    done = engine.confirm(USER, b["id"], accepted=True)
    assert done["status"] == "confirmed" and done["booking_reference"] == "ABC123" and done["payment_method"] == "test_balance"
    assert "born_on" not in done["travellers"][0]
    assert len(fake.orders) == 1 and fake.orders[0][2] == b["id"]
    # confirming again doesn't book twice
    with pytest.raises(BookingError):
        engine.confirm(USER, b["id"], accepted=True)
    assert len(fake.orders) == 1


def test_price_change_needs_a_new_confirmation(fake):
    b = engine.quote_flight(USER, "off_1", [TRAVELLER], CONTACT)
    fake.price = "150.00"
    with pytest.raises(BookingError) as e:
        engine.confirm(USER, b["id"], accepted=True)
    assert "150.00" in e.value.message and not fake.orders
    again = store.get(USER, b["id"])
    assert again["amount"] == "150.00" and again["status"] == "awaiting_confirmation"
    assert engine.confirm(USER, b["id"], accepted=True)["status"] == "confirmed"


def test_live_mode_without_a_payment_method_is_refused(fake):
    fake.live = True
    b = engine.quote_flight(USER, "off_1", [TRAVELLER], CONTACT)
    with pytest.raises(BookingError) as e:
        engine.confirm(USER, b["id"], accepted=True)
    assert e.value.status == 409 and "Razorpay" in e.value.message and not fake.orders


def test_provider_refusal_without_payment_fails_cleanly(fake):
    fake.fail = ProviderError("Offer no longer available", 422, "offer_no_longer_available")
    b = engine.quote_flight(USER, "off_1", [TRAVELLER], CONTACT)
    r = engine.confirm(USER, b["id"], accepted=True)
    assert r["status"] == "failed" and "No money was taken" in r["events"][-1]["what"]


def test_unknown_outcome_goes_to_review_not_refund(fake):
    fake.fail = ProviderError("timeout", 503, "unreachable")
    b = engine.quote_flight(USER, "off_1", [TRAVELLER], CONTACT)
    r = engine.confirm(USER, b["id"], accepted=True)
    assert r["status"] == "needs_review" and b["id"] in r["error"]


class FakeRazorpay:
    def __init__(self):
        self.refunds, self.payment_status = [], "captured"

    def create_order(self, amount, currency, receipt, notes=None):
        return {"id": "order_9"}

    def get_payment(self, pid):
        return {"id": pid, "order_id": "order_9", "amount": 12050, "currency": "GBP", "status": self.payment_status}

    def capture(self, pid, amount, currency):
        return {"id": pid, "status": "captured"}

    def refund(self, pid, amount=None, notes=None):
        self.refunds.append((pid, amount))
        return {"id": "rfnd_1"}


@pytest.fixture
def rp(monkeypatch, fake):
    r = FakeRazorpay()
    monkeypatch.setattr(settings, "razorpay_key_id", "rzp_test_key")
    monkeypatch.setattr(settings, "razorpay_key_secret", "secret")
    for name in ("create_order", "get_payment", "capture", "refund"):
        monkeypatch.setattr(razorpay, name, getattr(r, name))
    return r


def sig(order, pay):
    return hmac.new(b"secret", f"{order}|{pay}".encode(), hashlib.sha256).hexdigest()


def test_razorpay_flow_verifies_payment_then_books(fake, rp):
    b = engine.quote_flight(USER, "off_1", [TRAVELLER], CONTACT)
    c = engine.confirm(USER, b["id"], accepted=True)
    assert c["status"] == "awaiting_payment" and c["checkout"]["order_id"] == "order_9" and c["checkout"]["amount"] == 12050
    assert not fake.orders  # nothing booked before payment
    with pytest.raises(BookingError):
        engine.pay(USER, b["id"], "order_9", "pay_1", "forged")
    assert not fake.orders
    done = engine.pay(USER, b["id"], "order_9", "pay_1", sig("order_9", "pay_1"))
    assert done["status"] == "confirmed" and done["payment_id"] == "pay_1" and len(fake.orders) == 1
    # the same callback again is harmless
    assert engine.pay(USER, b["id"], "order_9", "pay_1", sig("order_9", "pay_1"))["status"] == "confirmed" and len(fake.orders) == 1


def test_failed_provider_booking_is_refunded_automatically(fake, rp):
    fake.fail = ProviderError("Seats sold out", 422)
    b = engine.quote_flight(USER, "off_1", [TRAVELLER], CONTACT)
    engine.confirm(USER, b["id"], accepted=True)
    r = engine.pay(USER, b["id"], "order_9", "pay_1", sig("order_9", "pay_1"))
    assert r["status"] == "refunded" and rp.refunds == [("pay_1", None)]


def test_uncaptured_payment_books_nothing(fake, rp):
    rp.payment_status = "failed"
    b = engine.quote_flight(USER, "off_1", [TRAVELLER], CONTACT)
    engine.confirm(USER, b["id"], accepted=True)
    with pytest.raises(BookingError) as e:
        engine.pay(USER, b["id"], "order_9", "pay_1", sig("order_9", "pay_1"))
    assert e.value.status == 402 and not fake.orders


def test_cancellation_passes_the_airline_refund_back_to_the_card(fake, rp):
    b = engine.quote_flight(USER, "off_1", [TRAVELLER], CONTACT)
    engine.confirm(USER, b["id"], accepted=True)
    engine.pay(USER, b["id"], "order_9", "pay_1", sig("order_9", "pay_1"))
    q = engine.cancellation_quote(USER, b["id"])
    assert q["refund_amount"] == "100.50"
    with pytest.raises(BookingError):
        engine.cancel(USER, b["id"], q["id"], accepted=False)
    r = engine.cancel(USER, b["id"], q["id"], accepted=True)
    assert r["status"] == "cancelled" and rp.refunds == [("pay_1", 10050)]


def test_bookings_are_private_per_user(fake):
    b = engine.quote_flight(USER, "off_1", [TRAVELLER], CONTACT)
    assert store.get("someone-else", b["id"]) is None
    with pytest.raises(BookingError):
        engine.confirm("someone-else", b["id"], accepted=True)


def test_providers_list_is_honest_about_partner_only_categories(monkeypatch):
    monkeypatch.setattr(settings, "duffel_access_token", "")
    p = {x["id"]: x for x in engine.providers()}
    assert p["duffel_flights"]["connected"] is False
    assert p["irctc"]["can"] == [] and "authorised agents" in p["irctc"]["note"]
    assert p["ticketmaster"]["can"] == ["search"]


# ---------- chat / voice tools ----------

def test_agent_flight_search_resolves_cities_and_never_books(monkeypatch):
    from app.agent import tools
    monkeypatch.setattr(duffel, "places", lambda q: [{"type": "city", "code": {"delhi": "DEL", "dubai": "DXB"}[q.lower()], "name": q, "city": q, "lat": 1, "lng": 2}])
    seen = {}

    def fake_search(q):
        seen.update(q)
        return {"live_mode": False, "total": 1, "offers": duffel.rank([duffel.norm_offer(offer_json())])}

    monkeypatch.setattr(duffel, "search_flights", fake_search)
    r = tools.search_flights(tools.SearchFlights(origin="Delhi", destination="Dubai", departure_date="2027-03-01", direct_only=True), None)
    assert seen["origin"] == "DEL" and seen["destination"] == "DXB" and seen["max_connections"] == 0
    assert r["test_mode"] and r["top"][0]["price"] == "120.50 GBP" and "cannot book from chat" in r["note"]


def test_agent_tools_report_missing_keys_instead_of_inventing(monkeypatch):
    from app.agent import tools
    monkeypatch.setattr(settings, "duffel_access_token", "")
    monkeypatch.setattr(settings, "ticketmaster_api_key", "")
    assert "DUFFEL_ACCESS_TOKEN" in tools.search_hotels(tools.SearchHotels(city="Jaipur", check_in="2027-01-10", check_out="2027-01-12"), None)["error"]
    assert "TICKETMASTER_API_KEY" in tools.search_events(tools.SearchEvents(keyword="coldplay"), None)["error"]
