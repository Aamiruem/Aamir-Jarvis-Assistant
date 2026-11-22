"""The global network map: where in the world this PC is talking to, right now.

Reads the Windows connection table (no packet capture, no contents), groups the remote hosts, and
places the public ones on the map with their owner, city and country from the ipinfo.io public
registry, the same lookup the 'Live connections' check uses. Lookups are cached for a day and at
most NEW_PER_CALL new addresses are looked up per refresh, so polling stays light. Hosts are
flagged with the same rules as 'Live connections' (backdoor-style ports, programs running from
Temp/Downloads). Locations are the registry's approximate city, not a precise position.
"""
from __future__ import annotations

import ipaddress
import json
import re
import socket
import threading
import time
from concurrent.futures import ThreadPoolExecutor

import httpx
import psutil

CACHE_TTL = 24 * 3600
NEW_PER_CALL = 20
MAX_HOSTS = 60

_cache: dict[str, tuple[float, dict]] = {}
_home: tuple[float, dict] | None = None
_lock = threading.Lock()


def _loc(info: dict) -> tuple[float, float] | None:
    try:
        lat, lon = (float(v) for v in (info.get("loc") or "").split(","))
        return lat, lon
    except ValueError:
        return None


def home() -> dict:
    """This connection's public address and approximate location (cached for an hour)."""
    global _home
    if _home and time.time() - _home[0] < 3600:
        return _home[1]
    try:
        r = httpx.get("https://ipinfo.io/json", timeout=6, headers={"Accept": "application/json"})
        r.raise_for_status()
        d = r.json()
        info = {"ip": d.get("ip"), "owner": d.get("org"), "city": d.get("city"), "country": d.get("country"), "loc": d.get("loc")}
    except (httpx.HTTPError, ValueError):
        info = {}
    _home = (time.time(), info)
    return info


def remote_hosts() -> list[dict]:
    """Remote TCP peers from the connection table, grouped by address, with their programs."""
    names: dict[int, tuple[str, str]] = {}
    hosts: dict[str, dict] = {}
    for c in psutil.net_connections(kind="inet"):
        if c.type != socket.SOCK_STREAM or not c.raddr or c.status == psutil.CONN_LISTEN:
            continue
        ip = c.raddr.ip
        if ip.startswith("127.") or ip == "::1":
            continue
        if c.pid and c.pid not in names:
            try:
                p = psutil.Process(c.pid)
                names[c.pid] = (p.name(), p.exe())
            except psutil.Error:
                names[c.pid] = ("?", "")
        name, exe = names.get(c.pid, ("System" if c.pid in (0, 4) else "?", ""))
        h = hosts.setdefault(ip, {"ip": ip, "ports": set(), "programs": set(), "exes": set(), "count": 0, "established": 0})
        h["ports"].add(c.raddr.port)
        h["programs"].add(name)
        if exe:
            h["exes"].add(exe)
        h["count"] += 1
        h["established"] += c.status == psutil.CONN_ESTABLISHED
    return sorted(hosts.values(), key=lambda h: -h["count"])


def flags(h: dict) -> list[str]:
    from app.ops.netdiag import ODD_PORTS, RISKY_DIRS
    out = [f"port {p}: {ODD_PORTS[p]}" for p in sorted(h["ports"]) if p in ODD_PORTS]
    out += [f"program runs from a Temp/Downloads folder ({e})" for e in sorted(h["exes"]) if RISKY_DIRS.search(e)]
    return out


def lookup(ips: list[str]) -> dict[str, dict]:
    """Cached owner/location for public IPs; looks up at most NEW_PER_CALL new ones."""
    from app.ops.osint import ip_intel
    now = time.time()
    with _lock:
        fresh = {ip: v for ip in ips if (e := _cache.get(ip)) and now - e[0] < CACHE_TTL for v in [e[1]]}
    todo = [ip for ip in ips if ip not in fresh][:NEW_PER_CALL]
    if todo:
        with httpx.Client() as c, ThreadPoolExecutor(6) as pool:
            for info in pool.map(lambda ip: ip_intel(c, ip), todo):
                with _lock:
                    _cache[info["ip"]] = (now, info)
                fresh[info["ip"]] = info
    return fresh


def build(hosts: list[dict], intel: dict[str, dict], here: dict, feeds: dict | None = None) -> dict:
    """The map payload (pure, tested). feeds: threatfeeds state; None skips the blocklist check."""
    from app.ops import threatfeeds
    out, local, countries, owners = [], 0, {}, {}
    for h in hosts[:MAX_HOSTS]:
        ip = ipaddress.ip_address(h["ip"])
        if not ip.is_global:
            local += 1
            continue
        info = intel.get(h["ip"], {})
        ll = _loc(info)
        threats = threatfeeds.check(h["ip"], feeds) if feeds is not None else []
        reasons = [f"{t['feed']}: {t['detail']}" for t in threats] + flags(h)
        row = {"ip": h["ip"], "programs": sorted(h["programs"]), "ports": sorted(h["ports"])[:6], "count": h["count"],
               "established": h["established"], "owner": info.get("owner"), "city": info.get("city"), "country": info.get("country"),
               "lat": ll[0] if ll else None, "lon": ll[1] if ll else None, "flagged": bool(reasons), "malicious": bool(threats), "reasons": reasons}
        out.append(row)
        cc = row["country"] or ("pending" if h["ip"] not in intel else "unknown")
        c = countries.setdefault(cc, {"country": cc, "hosts": 0, "connections": 0, "flagged": 0})
        c["hosts"] += 1
        c["connections"] += h["count"]
        c["flagged"] += row["flagged"]
        if row["owner"]:  # one company often owns several network numbers (ASNs): count it once
            name = re.sub(r"^AS\d+\s*", "", row["owner"]) or row["owner"]
            owners[name] = owners.get(name, 0) + h["count"]
    hl = _loc(here)
    return {
        "home": {**{k: here.get(k) for k in ("ip", "owner", "city", "country")}, "lat": hl[0] if hl else None, "lon": hl[1] if hl else None},
        "hosts": out, "local_peers": local, "flagged": sum(r["flagged"] for r in out), "malicious": sum(r["malicious"] for r in out),
        "located": sum(r["lat"] is not None for r in out),
        "countries": sorted(countries.values(), key=lambda c: (-c["flagged"], -c["connections"])),
        "owners": [{"owner": o, "connections": n} for o, n in sorted(owners.items(), key=lambda x: -x[1])[:8]],
        "at": time.time(),
        "source": "Windows connection table · ipinfo.io public registry (approximate city)",
    }


def snapshot() -> dict:
    hosts = remote_hosts()
    public = [h["ip"] for h in hosts[:MAX_HOSTS] if ipaddress.ip_address(h["ip"]).is_global]
    from app.ops import threatfeeds
    feeds = threatfeeds.ensure()
    m = build(hosts, lookup(public), home(), feeds)
    m["feeds"] = threatfeeds.status()
    m["dns"] = dns_cache()
    m["dns_note"] = None if m["dns"] else _dns_note
    return m


_dns: tuple[float, list] | None = None
_dns_note = "Windows DNS cache is empty."


def dns_cache() -> list[dict]:
    """Names this PC looked up recently (Windows DNS client cache; no packet capture). Cached 60 s."""
    global _dns
    if _dns and time.time() - _dns[0] < 60:
        return _dns[1]
    rows: list[dict] = []
    try:
        import subprocess
        import sys
        if sys.platform == "win32":
            ps = ("Get-DnsClientCache -ErrorAction SilentlyContinue | Where-Object { $_.Type -in 1,28,5 } | "
                  "Select-Object -First 400 Entry,Type,Data,TimeToLive | ConvertTo-Json -Compress")
            out = subprocess.run(["powershell", "-NoProfile", "-NonInteractive", "-Command", ps], capture_output=True, text=True, timeout=20,
                                 creationflags=getattr(subprocess, "CREATE_NO_WINDOW", 0)).stdout.strip()
            data = json.loads(out) if out.startswith(("[", "{")) else []
            seen: dict[str, dict] = {}
            for d in data if isinstance(data, list) else [data]:
                name = (d.get("Entry") or "").lower()
                if not name or name.endswith((".local", ".arpa")):
                    continue
                e = seen.setdefault(name, {"name": name, "answers": []})
                if d.get("Data") and len(e["answers"]) < 3:
                    e["answers"].append(d["Data"])
            rows = list(seen.values())[:80]
            if not rows:
                probe = subprocess.run(["ipconfig", "/displaydns"], capture_output=True, text=True, timeout=15,
                                       creationflags=getattr(subprocess, "CREATE_NO_WINDOW", 0))
                global _dns_note
                _dns_note = ("Windows shares its DNS cache only with programs running as administrator; start Jarvis elevated to see recent lookups."
                             if "elevation" in (probe.stdout + probe.stderr).lower() else
                             "Windows DNS cache is empty (browsers using secure DNS skip it).")
    except Exception:  # DNS cache unreadable: the map still works
        rows = []
    _dns = (time.time(), rows)
    return rows
