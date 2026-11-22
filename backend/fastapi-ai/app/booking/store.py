"""Booking records (SQL, same database as tasks and memories). One row per booking attempt, with its
state, provider and payment references, and an audit timeline of every step.

States: awaiting_confirmation -> awaiting_payment -> paid -> booking -> confirmed
        (failed | refunded | refund_failed | needs_review | expired | cancelled on the way)
Transitions go through `transition()`, which only moves a booking that is in an expected state,
so two clicks (or two tabs) can't pay or book the same thing twice.
"""
from __future__ import annotations

import json
import time
import uuid
from datetime import datetime, timezone

from sqlalchemy import DateTime, String, Text, select, update
from sqlalchemy.orm import Mapped, mapped_column

from app.db.sql import Base, SessionLocal, engine

FINAL = {"confirmed", "failed", "refunded", "refund_failed", "expired", "cancelled"}


def _now() -> datetime:
    return datetime.now(timezone.utc)


class Booking(Base):
    __tablename__ = "bookings"

    id: Mapped[str] = mapped_column(String(32), primary_key=True)
    user_id: Mapped[str] = mapped_column(String(64), index=True)
    kind: Mapped[str] = mapped_column(String(16))  # flight | stay
    provider: Mapped[str] = mapped_column(String(32))
    live_mode: Mapped[bool] = mapped_column(default=False)
    status: Mapped[str] = mapped_column(String(32), index=True)
    title: Mapped[str] = mapped_column(String(300))
    amount: Mapped[str] = mapped_column(String(32))  # decimal string, as the provider sent it
    currency: Mapped[str] = mapped_column(String(8))
    item_id: Mapped[str] = mapped_column(String(80))  # Duffel offer id or stay quote id
    summary: Mapped[str] = mapped_column(Text, default="{}")  # the offer/stay the user approved (JSON)
    travellers: Mapped[str] = mapped_column(Text, default="[]")  # JSON; dates of birth removed once booked
    contact: Mapped[str] = mapped_column(Text, default="{}")
    payment_method: Mapped[str | None] = mapped_column(String(32), nullable=True)  # razorpay | duffel_balance | test_balance
    payment_order_id: Mapped[str | None] = mapped_column(String(64), nullable=True)
    payment_id: Mapped[str | None] = mapped_column(String(64), nullable=True)
    provider_ref: Mapped[str | None] = mapped_column(String(80), nullable=True)  # Duffel order / stay booking id
    booking_reference: Mapped[str | None] = mapped_column(String(64), nullable=True)  # airline PNR / hotel reference
    error: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    events: Mapped[str] = mapped_column(Text, default="[]")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)


_ready = False


def _ensure():
    global _ready
    if not _ready:
        Base.metadata.create_all(engine, tables=[Booking.__table__])
        _ready = True


JSON_COLS = ("summary", "travellers", "contact", "events")


def to_dict(b: Booking) -> dict:
    d = {c: getattr(b, c) for c in ("id", "kind", "provider", "live_mode", "status", "title", "amount", "currency", "item_id",
                                    "payment_method", "payment_order_id", "payment_id", "provider_ref", "booking_reference", "error")}
    for c in JSON_COLS:
        d[c] = json.loads(getattr(b, c) or ("[]" if c in ("travellers", "events") else "{}"))
    d["created_at"] = b.created_at.replace(tzinfo=timezone.utc).isoformat() if b.created_at else None
    d["updated_at"] = b.updated_at.replace(tzinfo=timezone.utc).isoformat() if b.updated_at else None
    return d


def create(user_id: str, **fields) -> dict:
    _ensure()
    for c in JSON_COLS:
        if c in fields:
            fields[c] = json.dumps(fields[c])
    fields.setdefault("events", json.dumps([{"t": time.time(), "what": "Quoted and priced with the provider"}]))
    with SessionLocal.begin() as s:
        b = Booking(id=uuid.uuid4().hex[:16], user_id=user_id, **fields)
        s.add(b)
        s.flush()
        return to_dict(b)


def get(user_id: str, booking_id: str) -> dict | None:
    _ensure()
    with SessionLocal() as s:
        b = s.get(Booking, booking_id)
        return to_dict(b) if b and b.user_id == user_id else None


def list_for(user_id: str, limit: int = 100) -> list[dict]:
    _ensure()
    with SessionLocal() as s:
        rows = s.scalars(select(Booking).where(Booking.user_id == user_id).order_by(Booking.created_at.desc()).limit(limit))
        return [to_dict(b) for b in rows]


def transition(user_id: str, booking_id: str, frm: tuple[str, ...], to: str, event: str | None = None, **fields) -> dict | None:
    """Atomically move a booking from one of `frm` to `to` (None if it was not in `frm`)."""
    _ensure()
    with SessionLocal.begin() as s:
        b = s.get(Booking, booking_id, with_for_update=True)
        if not b or b.user_id != user_id or b.status not in frm:
            return None
        res = s.execute(update(Booking).where(Booking.id == booking_id, Booking.status == b.status).values(status=to, updated_at=_now()))
        if res.rowcount != 1:  # someone else moved it in between
            return None
        s.refresh(b)
        _apply(b, fields, event)
        return to_dict(b)


def patch(user_id: str, booking_id: str, event: str | None = None, **fields) -> dict | None:
    _ensure()
    with SessionLocal.begin() as s:
        b = s.get(Booking, booking_id)
        if not b or b.user_id != user_id:
            return None
        _apply(b, fields, event)
        b.updated_at = _now()
        return to_dict(b)


def _apply(b: Booking, fields: dict, event: str | None):
    for k, v in fields.items():
        setattr(b, k, json.dumps(v) if k in JSON_COLS else v)
    if event:
        ev = json.loads(b.events or "[]")
        ev.append({"t": time.time(), "what": event})
        b.events = json.dumps(ev[-60:])


def delete_for_user(user_id: str) -> int:
    _ensure()
    from sqlalchemy import delete
    with SessionLocal.begin() as s:
        return s.execute(delete(Booking).where(Booking.user_id == user_id)).rowcount
