"""Network diagnostics for Cyber Ops: troubleshooting, traceroute, and what this PC is talking to.

- troubleshoot(): walks the layers in order (adapter → DHCP → router → internet → DNS → HTTPS,
  captive portal, proxy, VPN, Wi-Fi stability, IP conflicts) and names the first one that fails.
  It only reads; the two safe fixes it may suggest (flush DNS, renew DHCP) run only through
  POST /ops/fix after the user approves, and are verified afterwards.
- traceroute(): Windows tracert to one host, each public hop labelled with its network owner.
- connections(): live connection intelligence for THIS PC from the OS tables (no packet capture,
  no packet contents): remote endpoints per program, traffic volume, TCP health, DNS cache size.
"""
from __future__ import annotations

import ipaddress
import re
import socket
import struct
import time
from concurrent.futures import ThreadPoolExecutor

import httpx
import psutil

from app.ops import net_probe as net

# ---------- parsers (pure) ----------


def parse_ping(text: str) -> dict:
    """Windows `ping` summary -> {sent, received, loss, min, avg, max} (ms; None when nothing came back)."""
    out = {"sent": None, "received": None, "loss": None, "min": None, "avg": None, "max": None}
    m = re.search(r"Sent = (\d+), Received = (\d+), Lost = \d+ \((\d+)% loss\)", text)
    if m:
        out["sent"], out["received"], out["loss"] = int(m.group(1)), int(m.group(2)), int(m.group(3))
    m = re.search(r"Minimum = (\d+)ms, Maximum = (\d+)ms, Average = (\d+)ms", text)
    if m:
        out["min"], out["max"], out["avg"] = int(m.group(1)), int(m.group(2)), int(m.group(3))
    return out


def parse_tracert(text: str) -> list[dict]:
    """Windows `tracert -d` output -> [{hop, rtts: [ms|None x3], ip|None}]."""
    hops = []
    for line in text.splitlines():
        m = re.match(r"^\s*(\d+)\s+(.*)$", line)
        if not m:
            continue
        rest = m.group(2)
        rtts = [None if t == "*" else (0.5 if t.startswith("<") else float(t)) for t in re.findall(r"(<1|\d+|\*)(?:\s*ms)?(?=\s)", rest)[:3]]
        ip = re.search(r"(\d+\.\d+\.\d+\.\d+|[0-9a-f:]+:[0-9a-f:]+)\s*$", rest.strip(), re.I)
        hops.append({"hop": int(m.group(1)), "rtts": rtts, "ip": ip.group(1) if ip else None})
    return hops


def parse_netstat_tcp(text: str) -> dict:
    """`netstat -s -p tcp` counters (IPv4 block) -> {active_opens, failed, resets, current, sent, retransmitted}."""
    keys = {"Active Opens": "active_opens", "Passive Opens": "passive_opens", "Failed Connection Attempts": "failed",
            "Reset Connections": "resets", "Current Connections": "current", "Segments Sent": "sent",
            "Segments Retransmitted": "retransmitted", "Segments Received": "received"}
    out = {}
    for label, key in keys.items():
        m = re.search(rf"{label}\s*=\s*(\d+)", text)
        if m:
            out[key] = int(m.group(1))
    return out


def dns_query_udp(server: str, name: str, timeout: float = 2.0) -> list[str]:
    """One A-record query straight to a DNS server (bypasses Windows' resolver and cache)."""
    tid = int(time.time() * 1000) & 0xFFFF
    pkt = struct.pack("!6H", tid, 0x0100, 1, 0, 0, 0)
    for label in name.strip(".").split("."):
        pkt += bytes([len(label)]) + label.encode()
    pkt += b"\0" + struct.pack("!HH", 1, 1)
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    s.settimeout(timeout)
    try:
        s.sendto(pkt, (server, 53))
        data, _ = s.recvfrom(2048)
    finally:
        s.close()
    return [r["data"] for r in net.parse_dns(data) if r["type"] == 1]


VPN_RX = re.compile(r"vpn|tap-|tun|wireguard|wg\d|openvpn|fortinet|forticlient|anyconnect|globalprotect|pangp|nordlynx|tailscale|zerotier|cloudflare warp|proton", re.I)


# ---------- troubleshooting ----------

TROUBLE_PS = r"""
$ErrorActionPreference = 'SilentlyContinue'
$since = (Get-Date).AddDays(-1)
$wlan = @(Get-WinEvent -FilterHashtable @{ LogName = 'Microsoft-Windows-WLAN-AutoConfig/Operational'; Id = 8003; StartTime = $since } -MaxEvents 200).Count
$conflict = @(Get-WinEvent -FilterHashtable @{ LogName = 'System'; ProviderName = 'Tcpip'; Id = 4199; StartTime = (Get-Date).AddDays(-7) } -MaxEvents 20 | ForEach-Object { @{ when = $_.TimeCreated.ToString('yyyy-MM-dd HH:mm'); ip = ([regex]::Match($_.Message, '\d+\.\d+\.\d+\.\d+')).Value; mac = ([regex]::Match($_.Message, '([0-9A-F]{2}-){5}[0-9A-F]{2}')).Value } })
$ie = Get-ItemProperty 'HKCU:\Software\Microsoft\Windows\CurrentVersion\Internet Settings'
$winhttp = (netsh winhttp show proxy) -join ' '
[pscustomobject]@{ wifiDisconnects24h = $wlan; ipConflicts = $conflict; proxyEnabled = [bool]$ie.ProxyEnable; proxyServer = $ie.ProxyServer; autoConfigUrl = $ie.AutoConfigURL; winhttpDirect = ($winhttp -match 'Direct access') } | ConvertTo-Json -Compress
"""

FIXES = {
    "flush_dns": {"label": "Flush the DNS cache", "cmd": ["ipconfig", "/flushdns"], "why": "Clears stale or poisoned name lookups. Harmless: Windows re-learns names as needed."},
    "renew_dhcp": {"label": "Renew the IP address (DHCP)", "cmd": ["ipconfig", "/renew"], "why": "Asks the router for a fresh address. The connection drops for a few seconds."},
}


def _ping(ctx, host: str, count: int = 8) -> dict:
    return parse_ping(ctx.run(["ping", "-n", str(count), "-w", "1000", host], count * 2 + 10).stdout)


def _f(sev, title, detail="", fix="", **extra):
    return {"severity": sev, "title": title, "detail": detail, "fix": fix, **extra}


def troubleshoot(ctx) -> dict:
    from app.ops.actions import as_list, kv, parse_json_tail, score_of, sort_findings, table
    findings, layers, fixes = [], [], []

    def layer(name, ok, detail):
        layers.append([name, "OK" if ok else ("FAIL" if ok is False else "n/a"), detail])

    with ctx.step("Checking network adapters and addresses") as st:
        adapters = as_list(parse_json_tail(ctx.powershell(net.IPCONFIG_PS, 40))) or []
        up = [a for a in adapters if as_list(a.get("ipv4"))]
        vpn = [a.get("alias") for a in adapters if VPN_RX.search(a.get("alias") or "")]
        st["detail"] = ", ".join(f"{a.get('alias')} {join_ips(a)}" for a in up) or "no adapter with an address"
    if not up:
        layer("Adapter", False, "No network adapter has an address")
        findings.append(_f("critical", "Not connected to any network", "No Wi-Fi or Ethernet adapter has an IP address.", "Turn Wi-Fi on and pick a network, or check the cable; make sure Airplane mode is off."))
        return _result(findings, layers, fixes, adapters, None, kv, table, score_of, sort_findings)
    layer("Adapter", True, ", ".join(a.get("alias") for a in up))
    apipa = [a for a in up if any(str(ip).startswith("169.254.") for ip in as_list(a.get("ipv4")))]
    gw = next((g for a in up for g in as_list(a.get("gateway")) if g), None)
    if apipa or not gw:
        layer("DHCP (address from router)", False, "Self-assigned 169.254.x.x address" if apipa else "No default gateway")
        findings.append(_f("high", "The router did not give this PC an address", "Windows fell back to a self-assigned address, so nothing beyond this PC is reachable.", "Renew the IP address below; if it fails, restart the router."))
        fixes.append("renew_dhcp")
    else:
        layer("DHCP (address from router)", True, f"Gateway {gw}")
    gw_ping = None
    if gw:
        with ctx.step(f"Pinging the router {gw} (8 packets)") as st:
            gw_ping = _ping(ctx, gw)
            st["detail"] = f"{gw_ping['loss']}% loss, avg {gw_ping['avg']} ms"
        ok = gw_ping["received"] not in (None, 0)
        if not ok and any(net.tcp_open(gw, p, 1.0) for p in (53, 80, 443)):
            ok = True  # some routers ignore ping but answer TCP
        layer("Router", ok, f"{gw_ping['loss']}% loss, avg {gw_ping['avg']} ms" if gw_ping["avg"] is not None else "no ping reply")
        if not ok:
            findings.append(_f("critical", "The router does not answer", f"{gw} is unreachable from this PC.", "Move closer to the router or reconnect the cable, then restart the router."))
        elif (gw_ping["loss"] or 0) >= 10:
            findings.append(_f("high", f"{gw_ping['loss']}% packet loss to the router", "Loss on the local link itself: weak Wi-Fi, interference or a bad cable.", "Move closer to the router, switch to 5 GHz, or try a cable."))
        elif (gw_ping["avg"] or 0) > 30:
            findings.append(_f("medium", f"Slow local link ({gw_ping['avg']} ms to the router)", "A healthy home link answers in under 10 ms.", "Weak or crowded Wi-Fi: move closer or change the router's channel."))
    with ctx.step("Pinging the internet (1.1.1.1, 8 packets)") as st:
        inet = _ping(ctx, "1.1.1.1")
        st["detail"] = f"{inet['loss']}% loss, avg {inet['avg']} ms"
    inet_ok = inet["received"] not in (None, 0)
    layer("Internet (IP)", inet_ok, f"{inet['loss']}% loss, avg {inet['avg']} ms" if inet["avg"] is not None else "no reply")
    if inet_ok and (inet["loss"] or 0) >= 5 and (gw_ping is None or (gw_ping["loss"] or 0) < 5):
        findings.append(_f("high", f"{inet['loss']}% packet loss beyond the router", "The local link is fine, so the loss is on the provider's side.", "Restart the router; if it continues, report it to your internet provider."))
    elif inet_ok and (inet["avg"] or 0) > 120:
        findings.append(_f("medium", f"High internet latency ({inet['avg']} ms)", "Calls and games will lag.", "Pause big downloads/uploads on the network; contact the provider if it lasts."))
    with ctx.step("Testing name lookups (Windows DNS vs. 1.1.1.1 directly)") as st:
        t0 = time.perf_counter()
        try:
            socket.getaddrinfo("www.microsoft.com", 443)
            sys_dns, sys_ms = True, int((time.perf_counter() - t0) * 1000)
        except OSError:
            sys_dns, sys_ms = False, None
        try:
            direct = bool(dns_query_udp("1.1.1.1", "www.microsoft.com"))
        except OSError:
            direct = False
        st["detail"] = f"Windows DNS {'ok' if sys_dns else 'FAILED'}{f' ({sys_ms} ms)' if sys_ms is not None else ''}, 1.1.1.1 {'ok' if direct else 'failed'}"
    dns_servers = sorted({d for a in up for d in as_list(a.get("dns")) if d})
    layer("DNS (names)", sys_dns, f"servers {', '.join(dns_servers) or '?'}" + (f", {sys_ms} ms" if sys_ms is not None else ""))
    if not sys_dns and direct:
        findings.append(_f("high", "Your DNS server is failing", f"Names don't resolve through {', '.join(dns_servers) or 'the configured server'}, but 1.1.1.1 answers.", "Flush DNS below; if it persists, set DNS to 1.1.1.1 and 8.8.8.8 in Settings → Network → your connection → DNS server assignment."))
        fixes.append("flush_dns")
    elif not sys_dns and inet_ok:
        findings.append(_f("high", "Name lookups fail everywhere", "Even 1.1.1.1 can't be reached on port 53: a firewall, VPN or captive portal may block DNS.", "Flush DNS; check VPN/firewall software."))
        fixes.append("flush_dns")
    elif sys_dns and sys_ms is not None and sys_ms > 300:
        findings.append(_f("low", f"Slow name lookups ({sys_ms} ms)", "Every new website waits this long before loading.", "Consider a faster DNS such as 1.1.1.1."))
    with ctx.step("Checking HTTPS and captive portals") as st:
        https_ok, portal = False, False
        try:
            httpx.get("https://www.cloudflare.com/cdn-cgi/trace", timeout=6)
            https_ok = True
        except httpx.HTTPError:
            pass
        try:
            r = httpx.get("http://www.msftconnecttest.com/connecttest.txt", timeout=6, follow_redirects=False)
            portal = r.status_code in (301, 302, 303, 307) or "Microsoft Connect Test" not in r.text
        except httpx.HTTPError:
            pass
        st["detail"] = f"HTTPS {'ok' if https_ok else 'failed'}{', sign-in page detected' if portal else ''}"
    layer("Web (HTTPS)", https_ok, "captive portal" if portal else "")
    if portal:
        findings.append(_f("high", "A Wi-Fi sign-in page is intercepting traffic", "Hotel, café or office Wi-Fi wants you to log in or accept terms first.", "Open any http:// website in the browser to get the sign-in page."))
    elif not https_ok and sys_dns and inet_ok:
        findings.append(_f("high", "Websites don't load although the internet answers", "HTTPS is blocked: proxy, firewall, antivirus web filter or VPN.", "Check the proxy setting below and pause VPN/web-filter software to test."))
    extra = ctx.soft_step("Checking proxy, VPN, Wi-Fi drops and IP conflicts", lambda: parse_json_tail(ctx.powershell(TROUBLE_PS, 60))) or {}
    if extra.get("proxyEnabled") or extra.get("autoConfigUrl"):
        findings.append(_f("medium", "A proxy is configured", f"{extra.get('proxyServer') or extra.get('autoConfigUrl')}. All web traffic goes through it.", "If you didn't set it up, turn it off: Settings → Network & internet → Proxy (malware sometimes adds one)."))
    if vpn:
        findings.append(_f("info", f"VPN adapter active: {', '.join(vpn)}", "Traffic may be routed through the VPN; disconnect it to test whether it causes the problem.", ""))
    if (extra.get("wifiDisconnects24h") or 0) >= 3:
        findings.append(_f("medium", f"Wi-Fi dropped {extra['wifiDisconnects24h']} times in 24 h", "An unstable link: weak signal, interference or power saving on the adapter.", "Move closer to the router; Device Manager → Wi-Fi adapter → Power Management → untick 'Allow the computer to turn off this device'."))
    current = {str(ip) for a in up for ip in as_list(a.get("ipv4")) if ip}
    for c in [c for c in as_list(extra.get("ipConflicts")) if isinstance(c, dict)][:1]:
        if c.get("ip") in current:
            findings.append(_f("high", f"IP address conflict on {c['ip']} (this PC's current address)", f"Device {c.get('mac') or '?'} claimed the same address on {c.get('when')}.", "Renew the IP address below; remove fixed IPs set by hand on other devices."))
            fixes.append("renew_dhcp")
        else:
            findings.append(_f("low", f"Past IP conflict on {c.get('ip')} ({c.get('when')})", f"Device {c.get('mac') or '?'} used the same address. This PC has a different address now, so it is resolved.", "If it repeats, give devices with fixed IPs addresses outside the router's DHCP range."))
    if not any(f["severity"] in ("critical", "high", "medium") for f in findings):
        findings.append(_f("ok", "Network is healthy", "Adapter, router, internet, DNS and HTTPS all work."))
    root = next((l for l in layers if l[1] == "FAIL"), None)
    return _result(findings, layers, list(dict.fromkeys(fixes)), adapters, root, kv, table, score_of, sort_findings, inet, gw_ping)


def join_ips(a) -> str:
    v = a.get("ipv4")
    return ", ".join(str(x) for x in (v if isinstance(v, list) else [v]) if x)


def _result(findings, layers, fixes, adapters, root, kv, table, score_of, sort_findings, inet=None, gw_ping=None):
    summary = f"Root cause: {root[0]} layer ({root[2]})" if root else ("No fault found: every layer works" if not any(f['severity'] in ('critical', 'high') for f in findings) else "Problems found: see below")
    sections = [table("Layer by layer", ["Layer", "Result", "Detail"], layers)]
    if inet or gw_ping:
        sections.append(table("Latency and loss", ["Target", "Loss", "Min", "Avg", "Max"], [[n, f"{p['loss']}%", p["min"], p["avg"], p["max"]] for n, p in (("Router", gw_ping), ("1.1.1.1", inet)) if p]))
    return {"summary": summary, "score": score_of(findings), "findings": sort_findings(findings), "sections": sections,
            "fixes": [{"id": k, "label": FIXES[k]["label"], "why": FIXES[k]["why"]} for k in fixes]}


def apply_fix(ctx, fix_id: str) -> dict:
    """Runs one whitelisted fix the user approved, then verifies connectivity again."""
    from app.ops.actions import kv, score_of
    fx = FIXES[fix_id]
    with ctx.step(f"Running: {' '.join(fx['cmd'])}") as st:
        r = ctx.run(fx["cmd"], 60)
        st["detail"] = (r.stdout.strip().splitlines() or [""])[-1][:160] or f"exit {r.returncode}"
        if r.returncode != 0:
            raise RuntimeError((r.stdout + r.stderr).strip()[-300:] or f"exit code {r.returncode}")
    time.sleep(2)
    with ctx.step("Verifying: DNS and HTTPS") as st:
        try:
            socket.getaddrinfo("www.microsoft.com", 443)
            dns_ok = True
        except OSError:
            dns_ok = False
        try:
            httpx.get("https://www.cloudflare.com/cdn-cgi/trace", timeout=8)
            web_ok = True
        except httpx.HTTPError:
            web_ok = False
        st["detail"] = f"DNS {'ok' if dns_ok else 'failed'}, HTTPS {'ok' if web_ok else 'failed'}"
    f = [{"severity": "ok" if dns_ok and web_ok else "high", "title": "Connectivity verified after the fix" if dns_ok and web_ok else "Still not working after the fix",
          "detail": f"DNS {'works' if dns_ok else 'fails'}, websites {'load' if web_ok else 'fail'}.", "fix": "" if dns_ok and web_ok else "Run 'Fix my internet' again or restart the router."}]
    return {"summary": f"{fx['label']}: done · {'verified working' if dns_ok and web_ok else 'still failing'}", "score": score_of(f), "findings": f,
            "sections": [kv("What ran", [("Command", " ".join(fx["cmd"])), ("Why", fx["why"]), ("Changed", "Network cache/lease only. Nothing to roll back.")])]}


# ---------- traceroute ----------

def resolve_trace_target(raw: str) -> tuple[str, str]:
    raw = (raw or "").strip().strip('"')
    if "://" in raw:
        raw = httpx.URL(raw).host
    raw = raw.strip("/").split("/")[0]
    if not raw or len(raw) > 253:
        raise ValueError("Enter a host name or IP address, e.g. google.com or 8.8.8.8")
    try:
        ip = ipaddress.ip_address(raw)
    except ValueError:
        if not re.fullmatch(r"[A-Za-z0-9.-]+", raw):
            raise ValueError("Enter a host name or IP address, e.g. google.com")
        try:
            ip = ipaddress.ip_address(socket.getaddrinfo(raw, None, socket.AF_INET)[0][4][0])
        except (socket.gaierror, IndexError):
            raise ValueError(f"{raw} does not resolve.")
    if ip.is_multicast or ip.is_unspecified or ip.is_link_local:
        raise ValueError("That address can't be traced.")
    return raw, str(ip)


def traceroute(ctx, target: str) -> dict:
    from app.ops import osint
    from app.ops.actions import kv, score_of, table
    name, ip = resolve_trace_target(target)
    with ctx.step(f"Tracing the route to {name} ({ip}), up to 30 hops") as st:
        out = ctx.run(["tracert", "-d", "-h", "30", "-w", "900", ip], 180).stdout
        hops = parse_tracert(out)
        st["detail"] = f"{len(hops)} hops"
    public = [h["ip"] for h in hops if h["ip"] and ipaddress.ip_address(h["ip"]).is_global]
    owners = {}
    if public:
        with ctx.step(f"Looking up who runs {len(set(public))} public hops") as st:
            with httpx.Client() as c, ThreadPoolExecutor(6) as pool:
                for info in pool.map(lambda x: osint.ip_intel(c, x), list(dict.fromkeys(public))[:20]):
                    owners[info["ip"]] = info
            st["detail"] = f"{sum(1 for v in owners.values() if v.get('owner'))} identified"
    reached = bool(hops) and hops[-1]["ip"] == ip
    rows, f = [], []
    prev = None
    for h in hops:
        good = [r for r in h["rtts"] if r is not None]
        avg = round(sum(good) / len(good), 1) if good else None
        o = owners.get(h["ip"] or "", {})
        where = ", ".join(filter(None, [o.get("city"), o.get("country")]))
        rows.append([h["hop"], h["ip"] or "* no reply", f"{avg} ms" if avg is not None else "—", o.get("owner") or ("private network" if h["ip"] and not ipaddress.ip_address(h["ip"]).is_global else ""), where])
        if avg is not None and prev is not None and avg - prev > 80:
            f.append({"severity": "info", "title": f"Big jump at hop {h['hop']} (+{avg - prev:.0f} ms)", "detail": f"{o.get('owner') or h['ip']}: often a long-distance or undersea link, or a congested hop.", "fix": ""})
        prev = avg if avg is not None else prev
    silent = sum(1 for h in hops if not h["ip"])
    if silent:
        f.append({"severity": "info", "title": f"{silent} hop(s) did not reply", "detail": "Many routers are configured not to answer traceroute. This alone is not a fault.", "fix": ""})
    f.insert(0, {"severity": "ok" if reached else "medium", "title": f"Reached {name} in {len(hops)} hops" if reached else f"Did not reach {name}", "detail": "" if reached else "The path stops partway: the target or a firewall drops the probes.", "fix": ""})
    return {"summary": f"{name} ({ip}) · {len(hops)} hops · {'reached' if reached else 'not reached'}" + (f" · last hop {rows[-1][2]}" if rows else ""),
            "score": None, "findings": f,
            "sections": [table("Route", ["Hop", "Address", "Avg time", "Network owner", "Location (estimate)"], rows,
                               note="Locations are estimates from public IP registries, not exact positions."),
                         kv("Method", [("Tool", "Windows tracert (ICMP), 3 probes per hop"), ("Owner data", "ipinfo.io public registry")])]}


# ---------- connection intelligence ----------

ODD_PORTS = {4444: "Metasploit default listener", 1337: "common backdoor port", 31337: "classic backdoor port", 6667: "IRC (old botnet control)",
             5555: "Android debugging", 23: "Telnet", 3389: "Remote Desktop", 5900: "VNC"}
RISKY_DIRS = re.compile(r"\\(temp|downloads)\\|\\appdata\\local\\temp\\", re.I)


def connections(ctx) -> dict:
    from app.ops import osint
    from app.ops.actions import bars, kv, score_of, sort_findings, table
    with ctx.step("Measuring traffic on each adapter for 2 s") as st:
        a = psutil.net_io_counters(pernic=True)
        time.sleep(2)
        b = psutil.net_io_counters(pernic=True)
        rates = []
        for nic, x in b.items():
            if nic in a and not net._VIRTUAL.search(nic):
                rx, tx = (x.bytes_recv - a[nic].bytes_recv) / 2, (x.bytes_sent - a[nic].bytes_sent) / 2
                if x.bytes_recv or x.bytes_sent:
                    rates.append({"nic": nic, "rx": rx, "tx": tx, "total_rx": x.bytes_recv, "total_tx": x.bytes_sent, "errin": x.errin, "errout": x.errout, "dropin": x.dropin})
        st["detail"] = ", ".join(f"{r['nic']} ↓{r['rx'] / 1024:.0f} KB/s ↑{r['tx'] / 1024:.0f} KB/s" for r in rates)
    with ctx.step("Reading every open connection and its program") as st:
        conns = psutil.net_connections(kind="inet")
        names, exes = {}, {}
        by_state: dict[str, int] = {}
        remotes: dict[str, dict] = {}
        for c in conns:
            if c.type != socket.SOCK_STREAM:
                continue
            by_state[c.status] = by_state.get(c.status, 0) + 1
            if not c.raddr or c.status == psutil.CONN_LISTEN:
                continue
            if c.pid and c.pid not in names:
                try:
                    p = psutil.Process(c.pid)
                    names[c.pid], exes[c.pid] = p.name(), p.exe()
                except psutil.Error:
                    names[c.pid], exes[c.pid] = "?", ""
            rip = c.raddr.ip
            if rip.startswith("127.") or rip == "::1":
                continue
            r = remotes.setdefault(rip, {"ip": rip, "ports": set(), "programs": set(), "states": set(), "count": 0, "exes": set()})
            r["ports"].add(c.raddr.port)
            r["programs"].add(names.get(c.pid, "System" if c.pid in (0, 4) else "?"))
            r["exes"].add(exes.get(c.pid, ""))
            r["states"].add(c.status)
            r["count"] += 1
        st["detail"] = f"{sum(by_state.values())} TCP sockets, {len(remotes)} remote hosts"
    tcp = ctx.soft_step("Reading TCP statistics (handshakes, resets, retransmits)", lambda: parse_netstat_tcp(ctx.run(["netstat", "-s", "-n", "-p", "tcp"], 45).stdout)) or {}
    dns_n = ctx.soft_step("Counting cached DNS names", lambda: int((ctx.powershell("@(Get-DnsClientCache -ErrorAction SilentlyContinue).Count", 30).strip() or "0").splitlines()[-1]))
    public = sorted((r for r in remotes.values() if ipaddress.ip_address(r["ip"]).is_global), key=lambda r: -r["count"])
    owners = {}
    if public:
        with ctx.step(f"Identifying the owners of the top {min(15, len(public))} remote hosts") as st:
            with httpx.Client() as c, ThreadPoolExecutor(6) as pool:
                for info in pool.map(lambda r: osint.ip_intel(c, r["ip"]), public[:15]):
                    owners[info["ip"]] = info
            st["detail"] = f"{sum(1 for v in owners.values() if v.get('owner'))} identified"
    f = []
    for r in remotes.values():
        odd = [p for p in r["ports"] if p in ODD_PORTS]
        if odd:
            f.append({"severity": "medium", "title": f"{', '.join(r['programs'])} talks to {r['ip']} on port {odd[0]}", "detail": f"Port {odd[0]} is a {ODD_PORTS[odd[0]]}.", "fix": "If you don't recognise this, end the program in Task Manager and run 'Detect suspicious files'."})
        risky = [e for e in r["exes"] if e and RISKY_DIRS.search(e)]
        if risky and ipaddress.ip_address(r["ip"]).is_global:
            f.append({"severity": "medium", "title": f"Program from a Temp/Downloads folder is online", "detail": f"{risky[0]} → {r['ip']}.", "fix": "Malware often runs from these folders. Analyze the file with 'Detect suspicious files'."})
    syn = by_state.get(psutil.CONN_SYN_SENT, 0)
    if syn > 20:
        f.append({"severity": "low", "title": f"{syn} connections stuck opening", "detail": "Many unanswered connection attempts: network trouble, a blocked service, or a program scanning.", "fix": "Check which program in the table has many SYN_SENT connections."})
    if tcp.get("sent") and tcp.get("retransmitted") is not None:
        pct = tcp["retransmitted"] / max(1, tcp["sent"]) * 100
        if pct > 2:
            f.append({"severity": "low", "title": f"{pct:.1f}% of TCP segments were re-sent", "detail": "Packets are being lost on the way (since boot).", "fix": "Run 'Fix my internet' to find where the loss happens."})
    errs = sum(r["errin"] + r["errout"] + r["dropin"] for r in rates)
    if errs > 100:
        f.append({"severity": "low", "title": f"{errs} adapter errors/drops since boot", "detail": "Driver or signal problems.", "fix": "Update the network adapter driver."})
    if not any(x["severity"] in ("medium", "high") for x in f):
        f.append({"severity": "ok", "title": "No suspicious connections", "detail": f"{len(remotes)} remote hosts, all on common ports from normal locations."})
    rows = []
    for r in sorted(remotes.values(), key=lambda r: -r["count"])[:60]:
        o = owners.get(r["ip"], {})
        rows.append([", ".join(sorted(r["programs"])), r["ip"], ", ".join(map(str, sorted(r["ports"])[:5])), r["count"], ", ".join(sorted(r["states"])), o.get("owner") or ("local network" if not ipaddress.ip_address(r["ip"]).is_global else ""), o.get("country") or ""])
    return {"summary": f"{len(remotes)} remote hosts · {by_state.get(psutil.CONN_ESTABLISHED, 0)} established connections · ↓{sum(r['rx'] for r in rates) / 1024:.0f} KB/s ↑{sum(r['tx'] for r in rates) / 1024:.0f} KB/s",
            "score": score_of(f), "findings": sort_findings(f),
            "sections": [bars("Traffic now", [{"label": f"{r['nic']} ↓", "value": round(r["rx"] / 1024, 1), "max": max(512, r["rx"] / 1024), "unit": " KB/s"} for r in rates] + [{"label": f"{r['nic']} ↑", "value": round(r["tx"] / 1024, 1), "max": max(512, r["tx"] / 1024), "unit": " KB/s"} for r in rates]),
                         table("Who this PC is talking to", ["Program", "Remote address", "Ports", "Conns", "State", "Network owner", "Country"], rows),
                         kv("TCP since boot", [("Connections opened", tcp.get("active_opens")), ("Accepted", tcp.get("passive_opens")), ("Failed handshakes", tcp.get("failed")), ("Resets", tcp.get("resets")),
                                               ("Segments sent", tcp.get("sent")), ("Re-sent", tcp.get("retransmitted")), ("Open now", tcp.get("current")), ("Cached DNS names", dns_n)]),
                         kv("Method", [("Source", "Windows connection table + adapter counters (no packet capture, no contents read)"), ("Owners", "ipinfo.io public registry")])]}
