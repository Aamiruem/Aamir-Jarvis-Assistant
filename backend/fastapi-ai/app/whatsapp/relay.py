"""Talks to the Express relay on Vercel (backend/express-api/src/routes/whatsapp.js).

The WhatsApp access token lives only there; this PC proves itself with WHATSAPP_RELAY_KEY.
"""
from __future__ import annotations

import httpx

TIMEOUT = httpx.Timeout(20.0, connect=10.0)


class RelayError(Exception):
    pass


class Relay:
    def __init__(self, url: str, key: str, client: httpx.AsyncClient | None = None):
        self.base = url.rstrip("/") + "/api/whatsapp/relay"
        self.headers = {"X-Relay-Key": key}
        self.client = client or httpx.AsyncClient(timeout=TIMEOUT)

    async def _call(self, method: str, path: str, **kw) -> httpx.Response:
        try:
            r = await self.client.request(method, self.base + path, headers=self.headers, **kw)
        except httpx.HTTPError as e:
            raise RelayError(f"relay unreachable: {type(e).__name__}") from e
        if r.status_code >= 400:
            raise RelayError(f"relay answered {r.status_code}: {r.text[:200]}")
        return r

    async def pull(self) -> list[dict]:
        """New messages since the last pull (the relay marks them delivered)."""
        return (await self._call("GET", "/pull")).json().get("messages", [])

    async def send(self, text: str, to: str | None = None) -> dict:
        """Sends a text (to the owner by default). WhatsApp allows 4096 characters per message."""
        out = {}
        for part in split(text):
            out = (await self._call("POST", "/send", json={"to": to, "text": part})).json()
        return out

    async def media(self, media_id: str) -> tuple[bytes, str]:
        r = await self._call("GET", f"/media/{media_id}")
        return r.content, r.headers.get("content-type", "application/octet-stream")


def split(text: str, limit: int = 3900) -> list[str]:
    """Long replies become several messages, cut at paragraph or line breaks."""
    text = text.strip() or "…"
    parts = []
    while len(text) > limit:
        cut = max(text.rfind("\n\n", 0, limit), text.rfind("\n", 0, limit))
        cut = cut if cut > limit // 2 else limit
        parts.append(text[:cut].rstrip())
        text = text[cut:].lstrip()
    parts.append(text)
    return parts
