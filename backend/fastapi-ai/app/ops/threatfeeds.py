"""Public threat-intelligence blocklists, checked locally.

- abuse.ch Feodo Tracker: IPs of botnet command-and-control servers (Emotet, QakBot, Dridex…).
- Spamhaus DROP (v4): networks hijacked or run by criminals ("don't route or peer").

Both are free and published for exactly this use. They are downloaded at most every REFRESH seconds,
cached in data_dir (so an offline PC still uses the last copy), and every lookup is local: no
address you check is sent anywhere. A match is strong evidence, not proof: lists lag reality, and an
"offline" C2 entry may since have been reassigned, so results show the list, the date and status.
"""
from __future__ import annotations

import ipaddress
import json
import logging
import threading
import time

import httpx

from app.config import settings

log = logging.getLogger("jarvis.ops")

REFRESH = 6 * 3600
FEEDS = {
    "feodo": {"name": "abuse.ch Feodo Tracker (botnet C2)", "url": "https://feodotracker.abuse.ch/downloads/ipblocklist.json"},
    "drop": {"name": "Spamhaus DROP (hijacked / criminal networks)", "url": "https://www.spamhaus.org/drop/drop_v4.json"},
}
CACHE = settings.data_dir / "threat_feeds.json"

_lock = threading.Lock()
_state: dict | None = None  # {"fetched": {feed: ts}, "feodo": {ip: entry}, "drop": [(net, sblid)], ...}


def parse_feodo(text: str) -> dict[str, dict]:
    out = {}
    for e in json.loads(text):
        ip = e.get("ip_address")
        if ip:
            out[ip] = {k: e.get(k) for k in ("port", "status", "malware", "first_seen", "last_online", "as_name", "country")}
    return out


def parse_drop(text: str) -> list[tuple[str, str]]:
    nets = []
    for line in text.splitlines():
        line = line.strip()
        if not line.startswith("{"):
            continue
        try:
            d = json.loads(line)
        except ValueError:
            continue
        if d.get("cidr"):
            nets.append((d["cidr"], d.get("sblid") or ""))
    return nets


def _load_cache() -> dict:
    try:
        return json.loads(CACHE.read_text(encoding="utf-8"))
    except (OSError, ValueError):
        return {"fetched": {}, "feodo": {}, "drop": []}


def _compile(state: dict) -> dict:
    state["_drop_nets"] = [(ipaddress.ip_network(c, strict=False), s) for c, s in state.get("drop", [])]
    return state


def ensure(force: bool = False) -> dict:
    """The feeds, refreshed when stale. Never raises: a failed download keeps the last copy."""
    global _state
    with _lock:
        if _state is None:
            _state = _compile(_load_cache())
        now = time.time()
        stale = [f for f in FEEDS if force or now - _state["fetched"].get(f, 0) > REFRESH]
        if not stale:
            return _state
        changed = False
        with httpx.Client(timeout=20, follow_redirects=True, headers={"User-Agent": "Azarvis-ThreatFeeds/1.0"}) as c:
            for f in stale:
                try:
                    r = c.get(FEEDS[f]["url"])
                    r.raise_for_status()
                    _state[f] = parse_feodo(r.text) if f == "feodo" else parse_drop(r.text)
                    _state["fetched"][f] = now
                    changed = True
                except Exception as e:  # offline or the list moved: keep using the cached copy
                    _state.setdefault("errors", {})[f] = str(e)[:200]
                    _state["fetched"].setdefault(f, 0)
                    log.warning("threat feed %s not refreshed: %s", f, e)
        if changed:
            _compile(_state)
            try:
                CACHE.write_text(json.dumps({k: v for k, v in _state.items() if not k.startswith("_")}), encoding="utf-8")
            except OSError as e:
                log.warning("could not cache threat feeds: %s", e)
        return _state


def check(ip: str, state: dict | None = None) -> list[dict]:
    """Every list this address is on (empty = on none). Local lookup only."""
    st = state if state is not None else ensure()
    try:
        addr = ipaddress.ip_address(ip)
    except ValueError:
        return []
    hits = []
    e = st.get("feodo", {}).get(ip)
    if e:
        hits.append({"feed": FEEDS["feodo"]["name"], "severity": "critical" if e.get("status") == "online" else "high",
                     "detail": f"{e.get('malware') or 'Botnet'} C2 server, port {e.get('port')}, {e.get('status')} (first seen {e.get('first_seen')}, last online {e.get('last_online')})"})
    if addr.version == 4:
        for net, sbl in st.get("_drop_nets", []):
            if addr in net:
                hits.append({"feed": FEEDS["drop"]["name"], "severity": "high", "detail": f"In {net} ({sbl}): a network Spamhaus advises never to route to."})
                break
    return hits


def status() -> dict:
    st = ensure()
    return {f: {"name": FEEDS[f]["name"], "entries": len(st.get(f) or []), "updated": st["fetched"].get(f) or None,
                "error": (st.get("errors") or {}).get(f)} for f in FEEDS}
