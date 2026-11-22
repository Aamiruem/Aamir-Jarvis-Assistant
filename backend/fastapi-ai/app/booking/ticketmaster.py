"""Ticketmaster Discovery API: real concerts, sports and shows. Search only: tickets are bought on
Ticketmaster's own site (the Discovery API has no purchase endpoint).
Docs: https://developer.ticketmaster.com/products-and-docs/apis/discovery-api/v2/
"""
from __future__ import annotations

import httpx

from app.booking.duffel import ProviderError
from app.config import settings

BASE = "https://app.ticketmaster.com/discovery/v2"


def configured() -> bool:
    return bool(settings.ticketmaster_api_key.strip())


def norm_event(e: dict) -> dict:
    venue = ((e.get("_embedded") or {}).get("venues") or [{}])[0]
    start = (e.get("dates") or {}).get("start") or {}
    prices = e.get("priceRanges") or []
    cls = (e.get("classifications") or [{}])[0]
    imgs = sorted(e.get("images") or [], key=lambda i: -(i.get("width") or 0))
    return {
        "id": e.get("id"), "kind": "event", "provider": "ticketmaster", "name": e.get("name"), "url": e.get("url"),
        "date": start.get("localDate"), "time": start.get("localTime"), "status": ((e.get("dates") or {}).get("status") or {}).get("code"),
        "venue": venue.get("name"), "city": (venue.get("city") or {}).get("name"), "country": (venue.get("country") or {}).get("countryCode"),
        "lat": (venue.get("location") or {}).get("latitude"), "lng": (venue.get("location") or {}).get("longitude"),
        "segment": (cls.get("segment") or {}).get("name"), "genre": (cls.get("genre") or {}).get("name"),
        "price_min": prices[0].get("min") if prices else None, "price_max": prices[0].get("max") if prices else None,
        "currency": prices[0].get("currency") if prices else None, "image": imgs[0].get("url") if imgs else None,
    }


def search_events(keyword: str = "", city: str = "", country: str = "", start: str = "", size: int = 30) -> dict:
    if not configured():
        raise ProviderError("Ticketmaster isn't connected: add TICKETMASTER_API_KEY to .env (free at developer.ticketmaster.com).", 428, "not_configured")
    params = {"apikey": settings.ticketmaster_api_key.strip(), "size": max(1, min(size, 100)), "sort": "date,asc"}
    for k, v in (("keyword", keyword), ("city", city), ("countryCode", country.upper()), ("startDateTime", f"{start}T00:00:00Z" if start else "")):
        if v:
            params[k] = v
    try:
        r = httpx.get(f"{BASE}/events.json", params=params, timeout=20)
    except httpx.HTTPError as e:
        raise ProviderError(f"Could not reach Ticketmaster: {e}", 503, "unreachable") from e
    if r.status_code >= 400:
        raise ProviderError(f"Ticketmaster answered HTTP {r.status_code}" + (" (check the API key)" if r.status_code in (401, 403) else ""), r.status_code)
    d = r.json()
    events = [norm_event(e) for e in (d.get("_embedded") or {}).get("events") or []]
    return {"events": events, "total": (d.get("page") or {}).get("totalElements", len(events))}
