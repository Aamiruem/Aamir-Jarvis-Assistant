"""Bookings: real flights and hotels (Duffel), events (Ticketmaster, search only), Razorpay payment.

GET  /booking/providers                  -> what is connected, mode (test/live), what each can do
GET  /booking/places?q=                  -> airports and cities (autocomplete)
POST /booking/flights/search             -> live offers, ranked: cheapest / fastest / best value / refundable
GET  /booking/flights/offers/{id}        -> one offer re-priced now, with fare rules and baggage
POST /booking/stays/search               -> hotels around a place
POST /booking/stays/{search_result_id}/rates -> rooms and rates with cancellation policy
GET  /booking/events                     -> Ticketmaster events (buy on Ticketmaster)
POST /booking/quote                      -> a priced booking awaiting your confirmation
POST /booking/{id}/confirm {accept}      -> explicit approval: re-checks price, starts payment (or books in test mode)
POST /booking/{id}/pay                   -> Razorpay Checkout result: verified, then the provider booking
GET  /booking                            -> your bookings; GET /booking/{id}?refresh=1 re-reads the provider
POST /booking/{id}/cancel/quote          -> refund quote; POST /booking/{id}/cancel {accept, cancellation_id}

Search endpoints are plain reads. Nothing reserves or charges without POST /confirm with accept=true.
"""
from __future__ import annotations

import logging
from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field, field_validator

from app.booking import duffel, engine, store, ticketmaster
from app.booking.duffel import ProviderError
from app.booking.engine import BookingError
from app.security import Caller, get_caller

router = APIRouter(prefix="/booking", tags=["booking"])
log = logging.getLogger("jarvis.booking")


def _wrap(fn, *a, **kw):
    try:
        return fn(*a, **kw)
    except BookingError as e:
        raise HTTPException(e.status, e.message) from None
    except ProviderError as e:
        log.warning("booking provider error: %s (%s)", e.message, e.code)
        raise HTTPException(e.status if e.status in (400, 404, 409, 422, 428, 429) else 502, e.message) from None


IATA = r"^[A-Za-z]{3}$"


def _future(d: date | None, field: str):
    if d and d < date.today():
        raise ValueError(f"{field} is in the past")
    return d


class FlightSearch(BaseModel):
    origin: str = Field(pattern=IATA)
    destination: str = Field(pattern=IATA)
    departure_date: date
    return_date: date | None = None
    adults: int = Field(1, ge=1, le=9)
    children_ages: list[int] = Field(default_factory=list, max_length=8)
    cabin_class: str | None = Field(None, pattern=r"^(economy|premium_economy|business|first)$")
    max_connections: int | None = Field(None, ge=0, le=2)

    @field_validator("departure_date", "return_date")
    @classmethod
    def not_past(cls, v, info):
        return _future(v, info.field_name.replace("_", " "))


class StaySearch(BaseModel):
    lat: float = Field(ge=-90, le=90)
    lng: float = Field(ge=-180, le=180)
    radius_km: float = Field(5, gt=0, le=50)
    check_in: date
    check_out: date
    rooms: int = Field(1, ge=1, le=8)
    adults: int = Field(1, ge=1, le=16)

    @field_validator("check_in", "check_out")
    @classmethod
    def not_past(cls, v, info):
        return _future(v, info.field_name.replace("_", " "))


class Traveller(BaseModel):
    title: str = Field("", max_length=8)
    gender: str = Field("", max_length=2)
    given_name: str = Field(min_length=1, max_length=60)
    family_name: str = Field(min_length=1, max_length=60)
    born_on: str = Field("", max_length=10)


class Contact(BaseModel):
    email: str = Field(max_length=254)
    phone: str = Field(max_length=20)


class QuoteIn(BaseModel):
    kind: str = Field(pattern=r"^(flight|stay)$")
    offer_id: str | None = Field(None, max_length=80)
    rate_id: str | None = Field(None, max_length=80)
    travellers: list[Traveller] = Field(min_length=1, max_length=9)
    contact: Contact
    stay: dict | None = None
    rate: dict | None = None


class ConfirmIn(BaseModel):
    accept: bool = False


class PayIn(BaseModel):
    razorpay_order_id: str = Field(max_length=64)
    razorpay_payment_id: str = Field(max_length=64)
    razorpay_signature: str = Field(max_length=256)


class CancelIn(BaseModel):
    accept: bool = False
    cancellation_id: str | None = Field(None, max_length=80)


@router.get("/providers")
def providers():
    return {"providers": engine.providers()}


@router.get("/places")
def places(q: str = Query(min_length=2, max_length=60)):
    return {"places": _wrap(duffel.places, q)}


@router.post("/flights/search")
def search_flights(body: FlightSearch):
    q = body.model_dump()
    q["origin"], q["destination"] = q["origin"].upper(), q["destination"].upper()
    q["departure_date"] = q["departure_date"].isoformat()
    q["return_date"] = q["return_date"].isoformat() if q["return_date"] else None
    if q["return_date"] and q["return_date"] < q["departure_date"]:
        raise HTTPException(422, "The return date is before the departure date.")
    return _wrap(duffel.search_flights, q)


@router.get("/flights/offers/{offer_id}")
def offer(offer_id: str):
    return _wrap(duffel.get_offer, offer_id)


@router.post("/stays/search")
def search_stays(body: StaySearch):
    if body.check_out <= body.check_in:
        raise HTTPException(422, "Check-out must be after check-in.")
    q = body.model_dump()
    q["check_in"], q["check_out"] = body.check_in.isoformat(), body.check_out.isoformat()
    return _wrap(duffel.search_stays, q)


@router.post("/stays/{search_result_id}/rates")
def stay_rates(search_result_id: str):
    return _wrap(duffel.stay_rates, search_result_id)


@router.get("/events")
def events(keyword: str = Query("", max_length=80), city: str = Query("", max_length=60), country: str = Query("", max_length=2),
           start: str = Query("", pattern=r"^(\d{4}-\d{2}-\d{2})?$")):
    return _wrap(ticketmaster.search_events, keyword, city, country, start)


@router.post("/quote")
def quote(body: QuoteIn, caller: Caller = Depends(get_caller)):
    travellers = [t.model_dump() for t in body.travellers]
    if body.kind == "flight":
        if not body.offer_id:
            raise HTTPException(422, "Pick a flight offer first.")
        return _wrap(engine.quote_flight, caller.user_id, body.offer_id, travellers, body.contact.model_dump())
    if not body.rate_id:
        raise HTTPException(422, "Pick a room rate first.")
    return _wrap(engine.quote_stay, caller.user_id, body.rate_id, travellers, body.contact.model_dump(), body.stay, body.rate)


@router.get("")
def my_bookings(caller: Caller = Depends(get_caller)):
    return {"bookings": store.list_for(caller.user_id)}


@router.get("/{booking_id}")
def one(booking_id: str, refresh: bool = False, caller: Caller = Depends(get_caller)):
    if refresh:
        return _wrap(engine.refresh, caller.user_id, booking_id)
    b = store.get(caller.user_id, booking_id)
    if not b:
        raise HTTPException(404, "Booking not found.")
    return b


@router.post("/{booking_id}/confirm")
def confirm(booking_id: str, body: ConfirmIn, caller: Caller = Depends(get_caller)):
    log.info("booking %s confirm by user=%s accept=%s", booking_id, caller.user_id, body.accept)
    return _wrap(engine.confirm, caller.user_id, booking_id, body.accept)


@router.post("/{booking_id}/pay")
def pay(booking_id: str, body: PayIn, caller: Caller = Depends(get_caller)):
    log.info("booking %s payment callback by user=%s payment=%s", booking_id, caller.user_id, body.razorpay_payment_id)
    return _wrap(engine.pay, caller.user_id, booking_id, body.razorpay_order_id, body.razorpay_payment_id, body.razorpay_signature)


@router.post("/{booking_id}/cancel/quote")
def cancel_quote(booking_id: str, caller: Caller = Depends(get_caller)):
    return _wrap(engine.cancellation_quote, caller.user_id, booking_id)


@router.post("/{booking_id}/cancel")
def cancel(booking_id: str, body: CancelIn, caller: Caller = Depends(get_caller)):
    log.info("booking %s cancel by user=%s accept=%s", booking_id, caller.user_id, body.accept)
    return _wrap(engine.cancel, caller.user_id, booking_id, body.cancellation_id, body.accept)
