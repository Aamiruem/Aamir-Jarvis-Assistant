"""Razorpay: orders, Checkout signature verification, capture and refunds.

The browser opens Razorpay Checkout (card/UPI details go to Razorpay, never to Jarvis). Jarvis only
creates the order, verifies the returned signature with the key secret, re-reads the payment from
Razorpay's API (status and amount must match), and refunds when a provider booking fails.
Docs: https://razorpay.com/docs/api/orders/ and /payments/.
"""
from __future__ import annotations

import hashlib
import hmac
from decimal import ROUND_HALF_UP, Decimal

import httpx

from app.booking.duffel import ProviderError
from app.config import settings

BASE = "https://api.razorpay.com/v1"
# Currencies Razorpay expresses in 1/100 units; zero-decimal ones are listed separately.
ZERO_DECIMAL = {"JPY", "KRW", "VND", "CLP", "PYG", "UGX", "XAF", "XOF"}


def configured() -> bool:
    return bool(settings.razorpay_key_id.strip() and settings.razorpay_key_secret.strip())


def mode() -> str | None:
    k = settings.razorpay_key_id.strip()
    return "test" if k.startswith("rzp_test_") else "live" if k.startswith("rzp_live_") else None


def to_subunits(amount: str, currency: str) -> int:
    """'1234.50' INR -> 123450 paise. Decimal, never float, for money."""
    d = Decimal(amount)
    return int(d.quantize(Decimal("1"), ROUND_HALF_UP)) if currency.upper() in ZERO_DECIMAL else int((d * 100).quantize(Decimal("1"), ROUND_HALF_UP))


def _call(method: str, path: str, **kw) -> dict:
    if not configured():
        raise ProviderError("Razorpay isn't connected: add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to .env.", 428, "not_configured")
    try:
        r = httpx.request(method, BASE + path, auth=(settings.razorpay_key_id.strip(), settings.razorpay_key_secret.strip()), timeout=30, **kw)
    except httpx.HTTPError as e:
        raise ProviderError(f"Could not reach Razorpay: {e}", 503, "unreachable") from e
    if r.status_code >= 400:
        try:
            msg = (r.json().get("error") or {}).get("description")
        except ValueError:
            msg = None
        raise ProviderError(f"Razorpay: {msg or f'HTTP {r.status_code}'}", r.status_code, "razorpay")
    return r.json()


def create_order(amount: str, currency: str, receipt: str, notes: dict | None = None) -> dict:
    return _call("POST", "/orders", json={"amount": to_subunits(amount, currency), "currency": currency.upper(), "receipt": receipt[:40],
                                          "notes": notes or {}, "payment_capture": 1})


def signature_ok(order_id: str, payment_id: str, signature: str) -> bool:
    """Checkout's signature is HMAC-SHA256(order_id|payment_id) with the key secret."""
    if not (order_id and payment_id and signature):
        return False
    expected = hmac.new(settings.razorpay_key_secret.strip().encode(), f"{order_id}|{payment_id}".encode(), hashlib.sha256).hexdigest()
    return hmac.compare_digest(expected, signature)


def get_payment(payment_id: str) -> dict:
    return _call("GET", f"/payments/{payment_id}")


def capture(payment_id: str, amount_subunits: int, currency: str) -> dict:
    return _call("POST", f"/payments/{payment_id}/capture", json={"amount": amount_subunits, "currency": currency.upper()})


def refund(payment_id: str, amount_subunits: int | None = None, notes: dict | None = None) -> dict:
    body: dict = {"notes": notes or {}}
    if amount_subunits is not None:
        body["amount"] = amount_subunits
    return _call("POST", f"/payments/{payment_id}/refund", json=body)
