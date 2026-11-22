"""The Cyber Ops quick actions: what each button really does, step by step.

Every action returns the same shape, so the page can show any of them:
    {"summary": str, "score": 0-100 | None, "findings": [{severity, title, detail, fix, area?, owasp?}],
     "sections": [{"title", "type": "kv" | "table" | "devices" | "bars" | "text", ...}]}
severity: ok | info | low | medium | high | critical.

No action changes anything on this PC or any other device. Discovery and network audits are
limited to the PC's own private network and need the user's "I own or may test this network" consent.
"""
from __future__ import annotations

import ipaddress
import os
import platform
import re
import socket
import subprocess
import time
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
from pathlib import Path

import httpx
import psutil

from app.ops import net_probe as net
from app.ops import system_probe as sysp
from app.ops import web_probe as web
from app.ops.jobs import JobContext, parse_json_tail
from app.routers import security_center

HERE = Path(__file__).parent
SEV_ORDER = ["critical", "high", "medium", "low", "info", "ok"]
PENALTY = {"critical": 25, "high": 12, "medium": 6, "low": 2}


class NeedsConsent(Exception):
    pass


# ---------- helpers ----------

def finding(sev, title, detail="", fix="", **extra):
    return {"severity": sev, "title": title, "detail": detail, "fix": fix, **extra}


def kv(title, items):
    return {"title": title, "type": "kv", "items": [[k, v] for k, v in items if v not in (None, "", [])]}


def table(title, columns, rows, note=None):
    return {"title": title, "type": "table", "columns": columns, "rows": rows, "note": note}


def bars(title, items):
    return {"title": title, "type": "bars", "items": items}


def score_of(findings) -> int:
    return max(0, 100 - sum(PENALTY.get(f["severity"], 0) for f in findings))


def sort_findings(findings):
    return sorted(findings, key=lambda f: SEV_ORDER.index(f["severity"]) if f["severity"] in SEV_ORDER else 9)


def count_line(findings) -> str:
    c = {s: sum(f["severity"] == s for f in findings) for s in ("critical", "high", "medium", "low")}
    parts = [f"{n} {s}" for s, n in c.items() if n]
    return ", ".join(parts) if parts else "no problems found"


def ps_file(ctx: JobContext, name: str, timeout: float = 60):
    return parse_json_tail(ctx.powershell((HERE / name).read_text(encoding="utf-8"), timeout))


def as_list(x):
    if x is None:
        return []
    return x if isinstance(x, list) else [x]


def join(xs, limit: int | None = None) -> str:
    """Comma list of the non-empty values (PowerShell gives nulls inside arrays)."""
    vals = [str(x) for x in as_list(xs) if x not in (None, "")]
    return ", ".join(vals[:limit] if limit else vals)


def is_windows() -> bool:
    return platform.system() == "Windows"


# ---------- CPU & RAM ----------

def cpu_ram_findings(s: dict) -> list:
    f = []
    if s["ram_percent"] >= 90:
        top = ", ".join(f"{g['name']} ({sysp.gb(g['mem'])})" for g in s["top_mem"][:3])
        f.append(finding("high", f"Memory is {s['ram_percent']:.0f}% full", f"Windows is moving data to the disk, which makes everything slow. Biggest users: {top}.", "Close programs you aren't using (browser tabs first). With 8 GB or less, adding RAM is the best upgrade."))
    elif s["ram_percent"] >= 80:
        f.append(finding("medium", f"Memory is {s['ram_percent']:.0f}% used", "Little room is left for new programs.", "Close unused apps and browser tabs."))
    else:
        f.append(finding("ok", f"Memory {s['ram_percent']:.0f}% used", f"{sysp.gb(s['ram_total'] - s['ram_used'])} free."))
    if s["cpu_percent"] >= 85:
        f.append(finding("high", f"Processor is {s['cpu_percent']:.0f}% busy", f"Top: {s['top_cpu'][0]['name']} ({s['top_cpu'][0]['cpu']:.0f}%).", "Wait for it to finish, or end it in Task Manager if it isn't needed."))
    elif s["cpu_percent"] >= 60:
        f.append(finding("medium", f"Processor is {s['cpu_percent']:.0f}% busy", f"Top: {s['top_cpu'][0]['name']}.", ""))
    else:
        f.append(finding("ok", f"Processor {s['cpu_percent']:.0f}% busy", "Plenty of headroom."))
    if s["uptime_hours"] > 24 * 7:
        f.append(finding("low", f"Not restarted for {s['uptime_hours'] / 24:.0f} days", "Long uptimes collect memory leaks and leave updates uninstalled.", "Restart the PC."))
    return f


def cpu_ram_sections(s: dict) -> list:
    return [
        bars("Load now", [
            {"label": "CPU", "value": s["cpu_percent"], "max": 100, "unit": "%"},
            {"label": "RAM", "value": s["ram_percent"], "max": 100, "unit": "%", "note": f"{sysp.gb(s['ram_used'])} of {sysp.gb(s['ram_total'])}"},
            {"label": "Page file", "value": s["swap_percent"], "max": 100, "unit": "%"},
        ] + [{"label": f"Core {i + 1}", "value": v, "max": 100, "unit": "%"} for i, v in enumerate(s["per_cpu"])]),
        table("Top programs by CPU", ["Program", "CPU %", "Memory", "Processes"], [[g["name"], round(g["cpu"], 1), sysp.gb(g["mem"]), g["count"]] for g in s["top_cpu"]]),
        table("Top programs by memory", ["Program", "Memory", "CPU %", "Processes"], [[g["name"], sysp.gb(g["mem"]), round(g["cpu"], 1), g["count"]] for g in s["top_mem"]]),
    ]


def act_cpu_ram(ctx, params):
    with ctx.step("Sampling CPU and memory for 1.5 s") as st:
        s = sysp.cpu_ram_sample(1.5)
        st["detail"] = f"CPU {s['cpu_percent']}%, RAM {s['ram_percent']}%, {s['process_count']} processes"
    f = cpu_ram_findings(s)
    return {"summary": f"CPU {s['cpu_percent']:.0f}% · RAM {s['ram_percent']:.0f}% ({sysp.gb(s['ram_used'])} of {sysp.gb(s['ram_total'])}) · {s['process_count']} processes · up {s['uptime_hours']:.0f} h",
            "score": score_of(f), "findings": sort_findings(f),
            "sections": [kv("Processor", [("Logical cores", s["cores_logical"]), ("Physical cores", s["cores_physical"]), ("Clock now", f"{s['freq_mhz']} MHz" if s["freq_mhz"] else None), ("Uptime", f"{s['uptime_hours']} h")])] + cpu_ram_sections(s)}


# ---------- disks ----------

DISK_PS = r"""$ErrorActionPreference='SilentlyContinue'; @(Get-PhysicalDisk | ForEach-Object { @{ name = $_.FriendlyName; media = "$($_.MediaType)"; bus = "$($_.BusType)"; health = "$($_.HealthStatus)"; op = "$($_.OperationalStatus)"; bytes = [int64]$_.Size } }) | ConvertTo-Json -Compress"""


def disk_findings(vols, disks, temp_bytes) -> list:
    f = []
    for d in disks:
        if d.get("health") and d["health"] != "Healthy":
            f.append(finding("critical", f"Disk '{d['name']}' reports {d['health']}", f"Status: {d.get('op')}. The drive may be failing.", "Back up your files NOW, then replace the drive."))
        elif d.get("health"):
            f.append(finding("ok", f"{d['name']} is healthy", f"{d.get('media')} on {d.get('bus')}, {sysp.gb(d.get('bytes'))}."))
        if d.get("media") == "HDD":
            f.append(finding("low", f"{d['name']} is a spinning hard disk", "Hard disks are many times slower than SSDs.", "Moving Windows to an SSD is the biggest speed-up for an older PC."))
    for v in vols:
        if v["percent"] >= 95:
            f.append(finding("high", f"Drive {v['mount']} is {v['percent']:.0f}% full", f"Only {sysp.gb(v['free'])} free: Windows Update and apps can fail.", "Settings → System → Storage → Cleanup recommendations; empty Downloads and the Recycle Bin."))
        elif v["percent"] >= 85:
            f.append(finding("medium", f"Drive {v['mount']} is {v['percent']:.0f}% full", f"{sysp.gb(v['free'])} free.", "Turn on Storage Sense and remove large files you don't need."))
        else:
            f.append(finding("ok", f"Drive {v['mount']} has space", f"{sysp.gb(v['free'])} free of {sysp.gb(v['total'])}."))
    if temp_bytes and temp_bytes > 2 * 1024 ** 3:
        f.append(finding("low", f"Temporary files use {sysp.gb(temp_bytes)}", "Leftovers from installers and apps.", "Settings → System → Storage → Temporary files → Remove."))
    return f


def act_disk(ctx, params):
    with ctx.step("Reading drive space") as st:
        vols = sysp.volumes()
        st["detail"] = ", ".join(f"{v['mount']} {v['percent']:.0f}%" for v in vols)
    disks = []
    if is_windows():
        disks = as_list(ctx.soft_step("Asking Windows for disk health (SMART status)", lambda: parse_json_tail(ctx.powershell(DISK_PS, 30)))) or []
    temp = Path(os.environ.get("TEMP", Path.home() / "AppData/Local/Temp"))
    with ctx.step("Measuring temporary files") as st:
        temp_bytes, n, complete = sysp.folder_size(temp)
        st["detail"] = f"{sysp.gb(temp_bytes)} in {n}{'' if complete else '+'} files"
    f = disk_findings(vols, disks, temp_bytes)
    return {"summary": " · ".join(f"{v['mount']} {sysp.gb(v['free'])} free ({v['percent']:.0f}% used)" for v in vols) + (f" · {len(disks)} physical disk(s): " + ", ".join(d.get("health", "?") for d in disks) if disks else ""),
            "score": score_of(f), "findings": sort_findings(f),
            "sections": [bars("Drive space used", [{"label": v["mount"], "value": v["percent"], "max": 100, "unit": "%", "note": f"{sysp.gb(v['free'])} free of {sysp.gb(v['total'])}"} for v in vols]),
                         table("Physical disks", ["Disk", "Type", "Bus", "Size", "Health"], [[d.get("name"), d.get("media"), d.get("bus"), sysp.gb(d.get("bytes")), d.get("health")] for d in disks])]}


# ---------- hardware ----------

def battery_findings(b) -> list:
    if not b:
        return []
    f = []
    full, design = b.get("fullMWh"), b.get("designMWh")
    if full and design:
        health = full / design * 100
        sev = "ok" if health >= 80 else "medium" if health >= 60 else "high"
        f.append(finding(sev, f"Battery health {health:.0f}%", f"Holds {full / 1000:.1f} Wh of its original {design / 1000:.1f} Wh.", "" if sev == "ok" else "The battery has worn; consider a replacement if runtime is too short."))
    return f


def act_hardware(ctx, params):
    if not is_windows():
        raise RuntimeError("The hardware inventory supports Windows for now.")
    with ctx.step("Reading the hardware inventory from Windows (WMI)") as st:
        h = ps_file(ctx, "hardware.ps1", 90) or {}
        st["detail"] = f"{h.get('maker')} {h.get('model')}"
    f = []
    ram_total = sum(r.get("bytes") or 0 for r in as_list(h.get("ram")))
    if ram_total and ram_total <= 8 * 1024 ** 3:
        f.append(finding("low", f"Only {sysp.gb(ram_total)} of RAM", "Modern browsers and dev tools want 16 GB.", "Check whether a free RAM slot exists for an upgrade."))
    for p in as_list(h.get("driverProblems")):
        f.append(finding("medium", f"Driver problem: {p.get('name')}", f"Device Manager error code {p.get('code')}.", "Device Manager → right-click the device → Update driver, or reinstall it from the PC maker's support site."))
    f += battery_findings(h.get("battery"))
    if h.get("thermalC") and h["thermalC"] > 85:
        f.append(finding("high", f"Running hot ({h['thermalC']} °C)", "Heat throttles speed and wears parts.", "Clean the vents and use it on a hard surface."))
    if not f:
        f.append(finding("ok", "No hardware problems reported", "Windows reports every device working."))
    b = h.get("battery") or {}
    cpu = h.get("cpu") or {}
    os_ = h.get("os") or {}
    return {
        "summary": f"{h.get('maker')} {h.get('model')} · {cpu.get('name')} · {sysp.gb(ram_total)} RAM · {os_.get('name')} build {os_.get('build')}",
        "score": score_of(f), "findings": sort_findings(f),
        "sections": [
            kv("System", [("Maker", h.get("maker")), ("Model", h.get("model")), ("Type", h.get("systemType")), ("Windows", f"{os_.get('name')} ({os_.get('version')}, {os_.get('arch')})"),
                          ("Installed", os_.get("installedAt")), ("Last start", (os_.get("bootedAt") or "")[:16].replace("T", " ")), ("BIOS", f"{(h.get('bios') or {}).get('version')} ({(h.get('bios') or {}).get('date')})")]),
            kv("Processor", [("Model", cpu.get("name")), ("Cores / threads", f"{cpu.get('cores')} / {cpu.get('threads')}"), ("Max clock", f"{cpu.get('maxMHz')} MHz"), ("Temperature", f"{h['thermalC']} °C" if h.get("thermalC") else "not exposed by this PC")]),
            table("Graphics", ["GPU", "Memory", "Driver", "Driver date"], [[g.get("name"), sysp.gb(g.get("vramBytes")), g.get("driver"), g.get("driverDate")] for g in as_list(h.get("gpus"))]),
            table("Memory modules", ["Size", "Speed", "Maker", "Part"], [[sysp.gb(r.get("bytes")), f"{r.get('speed')} MHz" if r.get("speed") else "", r.get("maker"), r.get("part")] for r in as_list(h.get("ram"))]),
            table("Disks", ["Disk", "Type", "Bus", "Size", "Health"], [[d.get("name"), d.get("media"), d.get("bus"), sysp.gb(d.get("bytes")), d.get("health")] for d in as_list(h.get("disks"))]),
            kv("Battery", [("Charge", f"{b.get('percent')}%" if b.get("percent") is not None else None), ("Full charge", f"{b['fullMWh'] / 1000:.1f} Wh" if b.get("fullMWh") else None),
                           ("Design capacity", f"{b['designMWh'] / 1000:.1f} Wh" if b.get("designMWh") else "not reported"), ("Cycles", b.get("cycles") or None)]) if b else {"title": "Battery", "type": "text", "text": "No battery (desktop PC)."},
            table("Devices with driver problems", ["Device", "Class", "Error code"], [[p.get("name"), p.get("cls"), p.get("code")] for p in as_list(h.get("driverProblems"))]),
            table("Startup programs", ["Name", "Where", "Command"], [[s.get("name"), s.get("location"), (s.get("command") or "")[:120]] for s in as_list(h.get("startup"))]),
            table(f"Installed apps ({len(as_list(h.get('apps')))})", ["App", "Version", "Publisher", "Installed"], [[a.get("name"), a.get("version"), a.get("publisher"), a.get("installed")] for a in as_list(h.get("apps"))]),
        ],
        "data": {"hardware": {k: v for k, v in h.items() if k not in ("apps",)}},
    }


# ---------- system security ----------

def security_findings(ctx) -> tuple[list, dict]:
    f, raw_extra = [], {}
    if not is_windows():
        raise RuntimeError("The system security check supports Windows for now.")
    with ctx.step("Checking Defender, firewall, UAC and Windows Update") as st:
        raw = parse_json_tail(ctx.powershell(security_center.SCRIPT, security_center.TIMEOUT)) or {}
        checks = security_center.interpret(raw)
        sev = {"ok": "ok", "warn": "medium", "bad": "high", "unknown": "info"}
        f += [finding(sev[c["status"]], f"{c['label']}: {c['detail']}" if c["status"] != "ok" else c["label"], c["detail"], c.get("fix", "")) for c in checks]
        st["detail"] = ", ".join(f"{c['label']} {c['status']}" for c in checks)
    with ctx.step("Checking Remote Desktop, SMBv1, Secure Boot, encryption, accounts, threats") as st:
        raw_extra = parse_json_tail(ctx.powershell(sysp.SECURITY_EXTRA_PS, 60)) or {}
        extra = sysp.interpret_security_extra(raw_extra)
        f += extra
        st["detail"] = f"{len(extra)} checks"
    return f, raw_extra


def act_security(ctx, params):
    f, raw = security_findings(ctx)
    return {"summary": f"System security: {count_line(f)}.", "score": score_of(f), "findings": sort_findings(f),
            "sections": [table("Administrators", ["Account"], [[a] for a in as_list(raw.get("admins"))]),
                         table("Recent Defender detections", ["Threat", "When", "Where"], [[t.get("name"), t.get("when"), join(t.get("resources")).replace(", ", "; ")[:160]] for t in as_list(raw.get("threats"))])]}


# ---------- open ports on this PC ----------

LOCAL_RISKY = {
    3389: ("medium", "Remote Desktop"), 5985: ("medium", "Windows Remote Management (HTTP)"), 5986: ("low", "Windows Remote Management (HTTPS)"),
    22: ("low", "SSH server"), 23: ("high", "Telnet server"), 21: ("medium", "FTP server"), 5900: ("medium", "VNC remote control"),
    3306: ("medium", "MySQL database"), 5432: ("medium", "PostgreSQL database"), 27017: ("high", "MongoDB database"), 6379: ("high", "Redis database"),
    9200: ("high", "Elasticsearch"), 11434: ("medium", "Ollama AI API (no password)"), 5555: ("high", "Android debug bridge"),
}
DEV_PORTS = {3000, 3001, 4000, 4200, 5000, 5173, 5174, 8000, 8001, 8080, 8888, 9000}
WINDOWS_STD = {135, 139, 445, 5040, 7680, 5357}


def listening_ports() -> list[dict]:
    names = {}
    rows = {}
    for c in psutil.net_connections(kind="inet"):
        if not c.laddr:
            continue
        is_tcp = c.type == socket.SOCK_STREAM
        if is_tcp and c.status != psutil.CONN_LISTEN:
            continue
        if not is_tcp and c.raddr:
            continue
        if c.pid and c.pid not in names:
            try:
                names[c.pid] = psutil.Process(c.pid).name()
            except psutil.Error:
                names[c.pid] = "?"
        ip = c.laddr.ip
        exposure = "this PC only" if ip.startswith("127.") or ip == "::1" else "all networks" if ip in ("0.0.0.0", "::") else f"network ({ip})"
        key = ("tcp" if is_tcp else "udp", c.laddr.port, c.pid)
        prev = rows.get(key)
        if prev and prev["exposure"] != "this PC only":
            continue
        rows[key] = {"proto": key[0], "port": c.laddr.port, "address": ip, "exposure": exposure, "pid": c.pid, "program": names.get(c.pid, "System" if c.pid in (0, 4) else "?")}
    return sorted(rows.values(), key=lambda r: (r["proto"], r["port"]))


def port_findings(rows) -> list:
    f = []
    exposed_tcp = [r for r in rows if r["proto"] == "tcp" and r["exposure"] != "this PC only"]
    for r in exposed_tcp:
        if r["port"] in LOCAL_RISKY:
            sev, what = LOCAL_RISKY[r["port"]]
            f.append(finding(sev, f"{what} is open to the network (port {r['port']})", f"Program: {r['program']} (PID {r['pid']}), listening on {r['address']}.", "Stop it if you don't use it, bind it to 127.0.0.1, or allow only trusted devices in Windows Firewall."))
        elif r["port"] in DEV_PORTS:
            f.append(finding("low", f"Development server on port {r['port']} is reachable from the network", f"{r['program']} listens on {r['address']}: other devices on this Wi-Fi may open it.", "Bind dev servers to 127.0.0.1 (e.g. --host 127.0.0.1) unless you test from a phone."))
    std = sorted({r["port"] for r in exposed_tcp if r["port"] in WINDOWS_STD})
    if std:
        f.append(finding("info", "Standard Windows services listening", f"Ports {', '.join(map(str, std))} (RPC, file sharing, discovery). Normal; the firewall decides who may reach them."))
    others = [r for r in exposed_tcp if r["port"] not in LOCAL_RISKY and r["port"] not in DEV_PORTS and r["port"] not in WINDOWS_STD and r["port"] < 49152]
    if others:
        f.append(finding("info", f"{len(others)} other program port(s) open to the network", ", ".join(f"{r['port']} ({r['program']})" for r in others[:12]), "Check you recognise each program."))
    if not any(x["severity"] in ("high", "medium", "low") for x in f):
        f.append(finding("ok", "No risky services exposed", f"{len(exposed_tcp)} TCP port(s) listen beyond this PC; none is a known risk."))
    return f


def act_ports(ctx, params):
    with ctx.step("Listing every listening port and its program") as st:
        rows = listening_ports()
        st["detail"] = f"{sum(r['proto'] == 'tcp' for r in rows)} TCP, {sum(r['proto'] == 'udp' for r in rows)} UDP"
    f = port_findings(rows)
    tcp = [r for r in rows if r["proto"] == "tcp"]
    return {"summary": f"{len(tcp)} TCP ports listening ({sum(r['exposure'] != 'this PC only' for r in tcp)} reachable beyond this PC) · {count_line(f)}",
            "score": score_of(f), "findings": sort_findings(f),
            "sections": [table("Listening ports", ["Proto", "Port", "Reachable from", "Program", "PID"], [[r["proto"].upper(), r["port"], r["exposure"], r["program"], r["pid"]] for r in rows if r["proto"] == "tcp" or r["exposure"] != "this PC only"],
                               note="'all networks' = any device that can reach this PC, if Windows Firewall lets it through.")]}


# ---------- IP address ----------

def act_ip(ctx, params):
    adapters = []
    if is_windows():
        adapters = as_list(ctx.soft_step("Reading adapters, gateway and DNS servers", lambda: parse_json_tail(ctx.powershell(net.IPCONFIG_PS, 40)))) or []
        extras = net.adapter_extras()
        for a in adapters:
            a.update({k: v for k, v in extras.get(a.get("alias"), {}).items() if v})
    if not adapters:
        with ctx.step("Reading adapters") as st:
            adapters = [{"alias": n["interface"], "ipv4": [n["ip"]], "prefix": [n["network"].split("/")[1]]} for n in net.local_networks()]
    pub = None
    with ctx.step("Asking the internet what our public address is") as st:
        pub = net.public_ip()
        st["detail"] = f"{pub.get('ip')} ({pub.get('isp') or pub.get('source')})"
    f = []
    local_ips = [ip for a in adapters for ip in as_list(a.get("ipv4")) if ip]
    if pub and pub.get("ip") in local_ips:
        f.append(finding("high", "This PC is directly on the internet", "Its own address is public: no router stands between it and the internet.", "Connect through a router, or make sure Windows Firewall is on for the Public profile."))
    for a in adapters:
        prof = a.get("profile") or {}
        if prof.get("category") == "Public":
            f.append(finding("ok", f"{a.get('alias')}: network type Public", "Windows hides this PC and its shares from other devices on this network."))
        elif prof.get("category") == "Private":
            f.append(finding("info", f"{a.get('alias')}: network type Private", "Other devices can discover this PC. Fine at home; choose Public on shared Wi-Fi."))
        if [x for x in as_list(a.get("ipv6")) if x and not str(x).lower().startswith("fe80")]:
            f.append(finding("info", f"{a.get('alias')} has a public IPv6 address", "IPv6 addresses are reachable end to end; the firewall is what protects the PC.", ""))
    sections = [kv("Public address", [("IP", pub.get("ip") if pub else None), ("Provider", pub.get("isp") if pub else None), ("Location (approximate)", ", ".join(filter(None, [pub.get("city"), pub.get("region"), pub.get("country")])) if pub else None)])]
    for a in adapters:
        sections.append(kv(f"Adapter: {a.get('alias')}", [("IPv4", ", ".join(f"{ip}/{p}" for ip, p in zip(as_list(a.get("ipv4")), as_list(a.get("prefix"))))),
                                                          ("IPv6", join(a.get("ipv6"), 3)), ("Gateway", join(a.get("gateway"))), ("DNS servers", join(a.get("dns"))),
                                                          ("MAC", a.get("mac")), ("Link speed", a.get("speed")), ("Network", (a.get("profile") or {}).get("name")), ("Network type", (a.get("profile") or {}).get("category"))]))
    return {"summary": f"Local {', '.join(local_ips) or '?'} · public {pub.get('ip') if pub else '?'}" + (f" ({pub.get('isp')})" if pub and pub.get("isp") else ""),
            "score": None, "findings": sort_findings(f), "sections": sections}


# ---------- Wi-Fi ----------

def wifi_analysis(iface_text: str, networks_text: str, profile_category: str | None = None) -> tuple[dict | None, list, list]:
    """(connected network, nearby networks, findings) from netsh output (pure)."""
    ifaces = [b for b in net.parse_netsh_blocks(iface_text) if b.get("state")]
    conn = next((b for b in ifaces if b.get("state", "").lower() == "connected"), None)
    nearby = []
    for b in net.parse_netsh_blocks(networks_text):
        if "ssid" not in b:
            continue
        nearby.append({"ssid": b["ssid"] or "(hidden)", "auth": b.get("authentication"), "cipher": b.get("encryption"), "signal": b.get("signal"), "channel": b.get("channel"), "band": b.get("band"), "bssids": len(b.get("bssids") or [])})
    f = []
    if conn:
        sev, why, fix = net.grade_wifi(conn.get("authentication", ""), conn.get("cipher", ""))
        f.append(finding(sev, f"Your Wi-Fi '{conn.get('ssid')}': {conn.get('authentication')} / {conn.get('cipher')}", why, fix))
        try:
            sig = int(conn.get("signal", "0").rstrip("% "))
            if sig < 40:
                f.append(finding("low", f"Weak signal ({sig}%)", "Slow and unstable connection.", "Move closer to the router, or use the 5 GHz band if available."))
        except ValueError:
            pass
        if (conn.get("band") or "").startswith("2.4"):
            f.append(finding("info", "Connected on 2.4 GHz", "2.4 GHz is slower and more crowded than 5 GHz.", "If your router has a 5 GHz network, prefer it when you're near the router."))
        twins = [n for n in nearby if n["ssid"] == conn.get("ssid") and n["auth"] and n["auth"] != conn.get("authentication")]
        if twins:
            f.append(finding("high", f"Another network is also called '{conn.get('ssid')}' with different security", f"It uses {twins[0]['auth']}. This is how 'evil twin' fake hotspots work.", "Only connect to the copy you know; ask the network owner if unsure."))
        if profile_category == "Private":
            f.append(finding("info", "This Wi-Fi is set as a Private network", "Your PC is discoverable here.", "Choose Public unless this is your own home network."))
    else:
        f.append(finding("info", "Not connected to Wi-Fi", "This PC is on a cable or offline."))
    open_nets = [n for n in nearby if net.grade_wifi(n["auth"] or "", n["cipher"] or "")[0] == "high"]
    if open_nets:
        f.append(finding("info", f"{len(open_nets)} nearby network(s) are open or use broken security", ", ".join(n["ssid"] for n in open_nets[:8]), "Don't join them without a VPN."))
    return conn, nearby, f


def act_wifi(ctx, params):
    if not is_windows():
        raise RuntimeError("The Wi-Fi check supports Windows for now.")
    with ctx.step("Reading the current Wi-Fi connection") as st:
        iface = ctx.run(["netsh", "wlan", "show", "interfaces"], 20).stdout
        st["detail"] = "connected" if re.search(r"State\s*:\s*connected", iface, re.I) else "not connected"
    networks = ""
    with ctx.step("Listing nearby Wi-Fi networks and their security") as st:
        out = ctx.run(["netsh", "wlan", "show", "networks", "mode=bssid"], 25)
        networks = out.stdout
        if re.search(r"location", networks + out.stderr, re.I) and "SSID" not in networks:
            st["detail"] = "Windows needs Location turned on to list nearby networks (Settings → Privacy → Location)."
            networks = ""
    prof = None
    if is_windows():
        prof_raw = ctx.soft_step("Reading the network type (Public/Private)", lambda: parse_json_tail(ctx.powershell("Get-NetConnectionProfile | Where-Object { $_.InterfaceAlias -like '*Wi*' } | Select-Object -First 1 @{n='category';e={\"$($_.NetworkCategory)\"}} | ConvertTo-Json -Compress", 20)))
        prof = (prof_raw or {}).get("category") if isinstance(prof_raw, dict) else None
    conn, nearby, f = wifi_analysis(iface, networks, prof)
    sections = []
    if conn:
        sections.append(kv("Connected network", [("Name (SSID)", conn.get("ssid")), ("Security", conn.get("authentication")), ("Encryption", conn.get("cipher")), ("Signal", conn.get("signal")), ("RSSI", conn.get("rssi")),
                                                 ("Band", conn.get("band")), ("Channel", conn.get("channel")), ("Standard", conn.get("radio type")), ("Speed", f"{conn.get('receive rate (mbps)')} Mbps" if conn.get("receive rate (mbps)") else None), ("Adapter", conn.get("description"))]))
    sections.append(table(f"Nearby networks ({len(nearby)})", ["Network", "Security", "Encryption", "Signal", "Channel", "Band", "Access points"],
                          [[n["ssid"], n["auth"], n["cipher"], n["signal"], n["channel"], n["band"], n["bssids"]] for n in sorted(nearby, key=lambda n: -int((n["signal"] or "0").rstrip("% ") or 0))],
                          note=None if networks else "Nearby networks need Windows Location permission (Settings → Privacy & security → Location)."))
    return {"summary": (f"'{conn.get('ssid')}' · {conn.get('authentication')} / {conn.get('cipher')} · signal {conn.get('signal')}" if conn else "Not on Wi-Fi") + f" · {len(nearby)} networks nearby",
            "score": score_of(f), "findings": sort_findings(f), "sections": sections}


# ---------- Bluetooth ----------

def bt_category(name: str) -> str:
    n = (name or "").lower()
    rules = [
        (r"bud|pod|rockerz|airdope|headphone|headset|earphone|earbud|wh-|wf-|jbl|sony|boat|zeb|soundcore|speaker|bar\b|tune|neckband|evolve", "Audio"),
        (r"watch|band|fit|gear|amazfit|noise|fire-boltt|mi band", "Wearable"),
        (r"keyboard|mouse|mx |logi|trackpad|pen\b|controller|gamepad|xbox|dualsense", "Input device"),
        (r"iphone|galaxy|redmi|oneplus|pixel|vivo|oppo|realme|poco|phone|moto", "Phone"),
        (r"tv|bravia|fire|roku|chromecast", "TV / media"),
        (r"fob|tag|tile|airtag|tracker", "Tracker / key fob"),
        (r"laptop|desktop|pc\b|macbook|thinkpad|inspiron", "Computer"),
        (r"fridge|washer|ac\b|bulb|light|plug|lock|camera|printer|car|ble_", "Smart home / appliance"),
    ]
    for rx, cat in rules:
        if re.search(rx, n):
            return cat
    return "Bluetooth device"


def bluetooth_devices(raw: list, oui: dict) -> list[dict]:
    seen: dict[str, dict] = {}
    for d in as_list(raw):
        addr = (d.get("address") or "").upper()
        name = d.get("name") or ""
        if name.lower() == "bluetooth" and not d.get("paired") == "True":
            name = ""
        key = addr or name
        if not key:
            continue
        paired = d.get("paired") == "True"
        connected = d.get("connected") == "True"
        rssi = None
        try:
            rssi = int(d["rssi"]) if d.get("rssi") not in (None, "") else None
        except ValueError:
            pass
        if paired and not connected:
            rssi = None  # Windows keeps an old cached value for paired devices that aren't around
        prev = seen.get(key)
        dev = {
            "id": f"bt-{key}", "name": name or "(no name broadcast)", "connection": "bluetooth" if d.get("kind") == "classic" else "bluetooth-le",
            "category": bt_category(name), "mac": addr or None, "vendor": net.vendor_for(addr, oui) if addr else None, "mac_private": net.is_private_mac(addr) if addr else None,
            "status": "connected" if connected else "paired" if paired else "nearby", "rssi": rssi,
        }
        if prev:  # the same device seen over classic and LE: keep the best of both
            if dev["name"] == "(no name broadcast)":
                dev["name"] = prev["name"]
            dev["rssi"] = dev["rssi"] if dev["rssi"] is not None else prev["rssi"]
            if prev["status"] in ("connected", "paired") and dev["status"] == "nearby":
                dev["status"] = prev["status"]
        seen[key] = dev
    return sorted(seen.values(), key=lambda d: ({"connected": 0, "paired": 1, "nearby": 2}[d["status"]], -(d["rssi"] or -200)))


def scan_bluetooth(ctx) -> list[dict]:
    with ctx.step("Searching for Bluetooth devices (classic + LE, about 30 s)") as st:
        raw = ps_file(ctx, "bluetooth.ps1", 75) or []
        devs = bluetooth_devices(raw, net.load_oui(download=False) or {})
        st["detail"] = f"{len(devs)} found: {sum(d['status'] != 'nearby' for d in devs)} paired, {sum(d['status'] == 'nearby' for d in devs)} nearby"
    return devs


def act_bluetooth(ctx, params):
    if not is_windows():
        raise RuntimeError("Bluetooth discovery supports Windows for now.")
    devs = scan_bluetooth(ctx)
    f = []
    near = [d for d in devs if d["status"] == "nearby"]
    if any(d["status"] == "paired" for d in devs):
        f.append(finding("info", f"{sum(d['status'] != 'nearby' for d in devs)} paired device(s)", ", ".join(d["name"] for d in devs if d["status"] != "nearby"), "Remove pairings you no longer use (Settings → Bluetooth & devices)."))
    if near:
        f.append(finding("info", f"{len(near)} other Bluetooth device(s) in range", "Devices that are advertising nearby; this PC has not connected to them.", ""))
    if not devs:
        f.append(finding("info", "No Bluetooth devices found", "Bluetooth may be off: Settings → Bluetooth & devices."))
    return {"summary": f"{len(devs)} Bluetooth devices: {sum(d['status'] == 'connected' for d in devs)} connected, {sum(d['status'] == 'paired' for d in devs)} paired, {len(near)} nearby",
            "score": None, "findings": f, "sections": [{"title": "Bluetooth devices", "type": "devices", "devices": devs}]}


# ---------- device discovery / network audit ----------

def os_hint(d: dict) -> str | None:
    ports = set(d.get("open_ports") or [])
    text = " ".join(filter(None, [d.get("hostname"), d.get("model"), " ".join(d.get("names") or []), d.get("server")])).lower()
    if 62078 in ports or re.search(r"iphone|ipad", text):
        return "iOS / iPadOS"
    if re.search(r"macbook|imac|macos|mac-mini", text):
        return "macOS"
    if 5555 in ports or re.search(r"android", text):
        return "Android"
    if {135, 3389} & ports or (d.get("netbios") and 445 in ports and not d.get("is_gateway")):
        return "Windows"
    if re.search(r"linux|ubuntu|debian|raspberry", text):
        return "Linux"
    return None


def discover(ctx: JobContext, audit: bool) -> dict:
    with ctx.step("Finding this PC's own networks") as st:
        nets = net.local_networks()
        if not nets:
            raise RuntimeError("This PC is not connected to a private network (Wi-Fi or Ethernet), so there is nothing to discover.")
        st["detail"] = ", ".join(f"{n['interface']} {n['ip']} → {n['scan']}" for n in nets)
    adapters = []
    if is_windows():
        adapters = as_list(ctx.soft_step("Reading the gateway and this PC's adapters", lambda: parse_json_tail(ctx.powershell(net.IPCONFIG_PS, 40)))) or []
    gateways = {g for a in adapters for g in as_list(a.get("gateway")) if g}
    local_ips = [n["ip"] for n in nets]
    hosts = net.hosts_to_probe(nets)
    with ctx.step(f"Knocking on {len(hosts)} addresses so devices answer ARP") as st:
        for n in nets:
            scope = ipaddress.IPv4Network(n["scan"])
            net.wake_neighbours([h for h in hosts if ipaddress.IPv4Address(h) in scope], n["ip"])
        time.sleep(2.5)
    with ctx.step("Reading the neighbour (ARP) table") as st:
        arp = as_list(parse_json_tail(ctx.powershell(net.ARP_PS, 30))) if is_windows() else []
        if not arp:
            arp = net.parse_arp_a(ctx.run(["arp", "-a"], 20).stdout)
        in_scope = {h for h in hosts}
        arp = [a for a in arp if a["ip"] in in_scope]
        st["detail"] = f"{len(arp)} devices answered"
    oui = ctx.soft_step("Loading the MAC manufacturer list (IEEE)", net.load_oui) or {}
    with ctx.step("Listening for mDNS and UPnP announcements") as st:
        with ThreadPoolExecutor(2) as pool:
            m_f, s_f = pool.submit(net.mdns_browse, local_ips, 3.0), pool.submit(net.ssdp_search, local_ips, 3.0)
            mdns, ssdp = m_f.result(), s_f.result()
        st["detail"] = f"{len(mdns)} mDNS, {len(ssdp)} UPnP replies" + ("" if mdns or ssdp else " (this network may block multicast)")
    ips = sorted({a["ip"] for a in arp} | {ip for ip in list(mdns) + list(ssdp) if ip in hosts}, key=lambda s: tuple(int(x) for x in s.split(".")))
    with ctx.step(f"Looking up names for {len(ips)} devices (DNS, NetBIOS)") as st:
        with ThreadPoolExecutor(32) as pool:
            rdns = dict(zip(ips, pool.map(net.reverse_dns, ips)))
            nb = dict(zip(ips, pool.map(net.netbios_name, ips)))
        upnp = {}
        for ip, d in ssdp.items():
            for loc in d["locations"][:2]:
                try:
                    upnp[ip] = net.upnp_description(loc, ip)
                    if upnp[ip]:
                        break
                except Exception:
                    continue
        st["detail"] = f"{sum(1 for v in rdns.values() if v)} DNS names, {sum(1 for v in nb.values() if v)} NetBIOS names"
    ports = {}
    if audit:
        port_list = list(net.AUDIT_PORTS)
        with ctx.step(f"Checking {len(port_list)} common ports on {len(ips)} devices") as st:
            ports = net.scan_ports(ips, port_list, lambda: ctx.cancelled)
            ctx.check()
            st["detail"] = f"{sum(len(v) for v in ports.values())} open ports"
    elif ips:
        with ctx.step("Identifying device types (4 tell-tale ports)") as st:
            ports = net.scan_ports(ips, [445, 631, 8009, 62078], lambda: ctx.cancelled)
            ctx.check()
    now = datetime.now(timezone.utc).isoformat(timespec="seconds")
    extras = net.adapter_extras()
    devices = []
    for n in nets:
        ad = extras.get(n["interface"], {})
        devices.append({"id": f"ip-{n['ip']}", "ip": n["ip"], "mac": (ad.get("mac") or "").upper() or None, "is_self": True, "hostname": socket.gethostname(), "status": "online", "connection": "network", "interface": n["interface"]})
    for ip in ips:
        a = next((x for x in arp if x["ip"] == ip), {})
        mac = (a.get("mac") or "").upper().replace(":", "-") or None
        md = mdns.get(ip, {})
        up = upnp.get(ip, {})
        d = {
            "id": f"ip-{ip}", "ip": ip, "mac": mac, "mac_private": net.is_private_mac(mac) if mac else None, "vendor": net.vendor_for(mac, oui) if mac else None,
            "hostname": rdns.get(ip), "netbios": nb.get(ip), "names": md.get("names", []) + md.get("hosts", []), "services": md.get("services", []),
            "upnp_types": ssdp.get(ip, {}).get("types", []), "server": ssdp.get(ip, {}).get("server"),
            "manufacturer": up.get("manufacturer") or md.get("txt", {}).get("manufacturer") or md.get("txt", {}).get("usb_mfg"),
            "model": up.get("model") or md.get("txt", {}).get("md") or md.get("txt", {}).get("model") or md.get("txt", {}).get("am") or md.get("txt", {}).get("ty") or md.get("txt", {}).get("rpmd"),
            "friendly": up.get("friendly") or md.get("txt", {}).get("fn"), "open_ports": sorted(ports.get(ip, [])), "is_gateway": ip in gateways,
            "arp_state": a.get("state"), "status": "online" if (a.get("state") or "").lower() in ("reachable", "delay", "probe", "dynamic") or md or ip in ssdp or ports.get(ip) else "seen recently",
            "connection": "network", "interface": a.get("alias"), "last_seen": now,
        }
        devices.append(d)
    for d in devices:
        d["category"] = net.classify(d)
        d["os"] = os_hint(d) or ("Windows" if d.get("is_self") and is_windows() else None)
        d["name"] = d.get("friendly") or (d.get("names") or [None])[0] or d.get("netbios") or (d.get("hostname") or "").split(".")[0] or (d.get("model") and f"{d.get('manufacturer') or ''} {d['model']}".strip()) or (f"{d['vendor']} device" if d.get("vendor") else None) or d["category"]
        d["security"] = net.device_security(d) if not d.get("is_self") else {"level": "ok", "notes": ["This computer: see Check system security and Check open ports."]}
        d.setdefault("last_seen", now)
    return {"networks": nets, "devices": devices, "multicast": bool(mdns or ssdp)}


def require_consent(params):
    if not params.get("authorized"):
        raise NeedsConsent("Confirm that you own this network or have the owner's permission to scan it.")


def device_findings(devices, audit: bool) -> list:
    f = []
    for d in devices:
        if d.get("is_self"):
            continue
        for p in d.get("open_ports") or []:
            if p in net.RISKY_PORTS:
                sev, why, fix = net.RISKY_PORTS[p]
                if d["category"] == "Computer" and p in (445, 3389):
                    sev = "low"
                f.append(finding(sev, f"{d['name']} ({d['ip']}): port {p} {net.AUDIT_PORTS.get(p, '')} open", why, fix))
        if d.get("is_gateway") and 80 in (d.get("open_ports") or []) and 443 not in (d.get("open_ports") or []):
            f.append(finding("low", f"Router admin page uses plain HTTP ({d['ip']})", "The admin password crosses the network unencrypted.", "Enable HTTPS admin in the router, or only log in over a cable."))
    unknown = [d for d in devices if d["category"] == "Unknown device" and not d.get("is_self")]
    if unknown:
        f.append(finding("info", f"{len(unknown)} device(s) could not be identified", ", ".join(f"{d['ip']} ({d.get('mac') or 'no MAC'})" for d in unknown[:8]), "Compare with your router's list of connected clients; block any you don't recognise."))
    if audit and not any(x["severity"] in ("high", "medium") for x in f):
        f.append(finding("ok", "No high-risk services found on the network", "None of the devices answer on Telnet, ADB, FTP, VNC or other risky ports."))
    return f


def act_devices(ctx, params):
    require_consent(params)
    res = discover(ctx, audit=False)
    bt = []
    if is_windows() and params.get("bluetooth", True):
        try:
            bt = scan_bluetooth(ctx)
        except Exception as e:
            if ctx.cancelled:
                raise
            ctx.job.steps[-1]["detail"] = f"Bluetooth not available: {e}"[:200]
    devs = res["devices"]
    cats = {}
    for d in devs + bt:
        cats[d["category"]] = cats.get(d["category"], 0) + 1
    f = device_findings(devs, audit=False)
    if not res["multicast"]:
        f.append(finding("info", "This network blocks device announcements", "No mDNS/UPnP replies (common on office and guest Wi-Fi with client isolation), so some names and models are unknown.", ""))
    return {"summary": f"{len(devs) - 1} devices on {', '.join(n['scan'] for n in res['networks'])} + {len(bt)} Bluetooth · " + ", ".join(f"{n} {c}" for c, n in sorted(cats.items(), key=lambda x: -x[1])),
            "score": None, "findings": sort_findings(f),
            "sections": [{"title": "Devices on your network", "type": "devices", "devices": devs}, {"title": "Bluetooth", "type": "devices", "devices": bt}] if bt else [{"title": "Devices on your network", "type": "devices", "devices": devs}]}


def act_network(ctx, params):
    from app.ops import toolbox
    require_consent(params)
    res = discover(ctx, audit=True)
    devs = res["devices"]
    nm_used = None
    if toolbox.nmap_path():
        targets = [d["ip"] for d in devs if not d.get("is_self") and d.get("open_ports")]
        if targets:
            with ctx.step(f"Nmap service/version detection on {len(targets)} devices (same scope)") as st:
                nm = toolbox.nmap_service_scan(ctx, targets, sorted({p for d in devs for p in d.get("open_ports") or []}))
                for d in devs:
                    info = nm.get(d.get("ip"))
                    if info:
                        d["service_versions"] = [f"{x['port']}/{x['service'] or '?'} {x['product'] or ''} {x['version'] or ''}".strip() for x in info["ports"]]
                        d["hostname"] = d.get("hostname") or info.get("hostname")
                nm_used = f"Nmap: {sum(len(v['ports']) for v in nm.values())} services identified"
                st["detail"] = nm_used
    f = device_findings(devs, audit=True)
    rows = [[d["name"], d["ip"], ", ".join(f"{p} {net.AUDIT_PORTS.get(p, '')}" for p in d.get("open_ports") or []) or "none of the checked ports", "; ".join(d.get("service_versions") or [])] for d in devs if not d.get("is_self")]
    return {"summary": f"Audited {len(devs) - 1} devices on {', '.join(n['scan'] for n in res['networks'])} · {count_line(f)}",
            "score": score_of(f), "findings": sort_findings(f),
            "sections": [{"title": "Devices and open ports", "type": "devices", "devices": devs},
                         {"title": "Network map", "type": "topology", "devices": devs},
                         table("Open ports by device", ["Device", "IP", "Open ports", "Service versions (Nmap)"], rows,
                               note=None if nm_used else "Install Nmap to also see software versions on each port (see 'Security toolbox').")]}


# ---------- suspicious files ----------

def act_files(ctx, params):
    if params.get("path"):
        return analyze_file(ctx, params["path"])
    if not is_windows():
        raise RuntimeError("The suspicious-file scan supports Windows for now.")
    flagged: dict[str, dict] = {}
    to_sign: list[Path] = []
    recent = time.time() - 60 * 86400
    scanned = 0
    for root, depth, label in sysp.scan_targets():
        if not root.exists():
            continue
        with ctx.step(f"Scanning {label}") as st:
            n0 = len(flagged)
            for p in sysp.walk_candidates(root, depth):
                scanned += 1
                if scanned % 500 == 0:
                    ctx.check()
                ext = p.suffix.lower()
                reasons = [(s, r) for s, r in sysp.name_flags(p.name)]
                is_exec = ext in sysp.EXEC_EXT
                if label.startswith("Startup") and is_exec and ext != ".ini":
                    reasons.append(("medium" if ext in sysp.SCRIPT_EXT else "info", "starts automatically when you sign in"))
                if label == "Temp" and ext in {".exe", ".scr", ".vbs", ".ps1", ".bat", ".hta"}:
                    try:
                        if p.stat().st_mtime > time.time() - 7 * 86400:
                            reasons.append(("low", "program in the Temp folder (malware often runs from here)"))
                    except OSError:
                        pass
                if is_exec and label in ("Downloads", "Desktop", "Documents"):
                    try:
                        if p.stat().st_mtime > recent and ext in {".exe", ".msi", ".scr", ".dll", ".ps1", ".js", ".vbs", ".hta", ".bat", ".cmd"}:
                            to_sign.append(p)
                    except OSError:
                        pass
                if ext in sysp.SCRIPT_EXT and (label != "Temp"):
                    flags = sysp.script_flags(p)
                    if len(flags) >= 2:
                        reasons.append(("high" if len(flags) >= 3 else "medium", "script that " + "; ".join(flags[:4])))
                if ext in sysp.EXEC_EXT or reasons:
                    try:
                        with open(p, "rb") as fh:
                            mm = sysp.type_mismatch(p, fh.read(16))
                        if mm:
                            reasons.append(mm)
                    except OSError:
                        pass
                if reasons:
                    flagged[str(p)] = {"path": str(p), "where": label, "reasons": reasons}
            st["detail"] = f"{len(flagged) - n0} flagged"
    to_sign = to_sign[:60]
    if to_sign:
        with ctx.step(f"Checking digital signatures of {len(to_sign)} recent programs") as st:
            res = as_list(parse_json_tail(ctx.powershell(sysp.signature_ps([str(p) for p in to_sign]), 120)))
            unsigned = 0
            for r in res:
                status = r.get("status")
                if status == "Valid":
                    continue
                if status == "HashMismatch":
                    sev, why = "high", "its signature is broken: the file was changed after signing"
                elif status in ("NotSigned", "UnknownError", "NotTrusted"):
                    unsigned += 1
                    sev, why = ("low", "not digitally signed: the publisher can't be verified")
                else:
                    continue
                e = flagged.setdefault(r["path"], {"path": r["path"], "where": "Downloads/Desktop", "reasons": []})
                e["reasons"].append((sev, why))
            st["detail"] = f"{unsigned} unsigned"
    for e in flagged.values():
        z = sysp.zone_of(Path(e["path"]))
        if z and z.get("zone") == 3:
            e["source"] = z.get("referrer") or z.get("url")
    threats = ctx.soft_step("Reading Microsoft Defender's detections", lambda: as_list(parse_json_tail(ctx.powershell("$ErrorActionPreference='SilentlyContinue'; @(Get-MpThreatDetection | Sort-Object InitialDetectionTime -Descending | Select-Object -First 10 | ForEach-Object { @{ id = $_.ThreatID; when = $_.InitialDetectionTime.ToString('yyyy-MM-dd HH:mm'); resources = @($_.Resources | Select-Object -First 2) } }) | ConvertTo-Json -Compress", 40))))
    f = []
    order = ["high", "medium", "low", "info"]
    rows = []
    for e in sorted(flagged.values(), key=lambda e: min(order.index(s) for s, _ in e["reasons"])):
        worst = min((s for s, _ in e["reasons"]), key=order.index)
        why = "; ".join(r for _, r in e["reasons"])
        rows.append([worst, Path(e["path"]).name, e["where"], why, e.get("source") or "", e["path"]])
        if worst in ("high", "medium"):
            f.append(finding(worst, Path(e["path"]).name, f"{why}. {e['path']}" + (f" Downloaded from {e['source']}." if e.get("source") else ""), "Don't open it. Use 'Analyze a file' for a Defender scan, then delete it if you don't trust it."))
    for t in threats or []:
        f.append(finding("high", f"Defender detection on {t.get('when')}", join(t.get("resources")).replace(", ", "; ")[:240], "Windows Security → Protection history: make sure it was removed."))
    if not f:
        f.append(finding("ok", "Nothing clearly suspicious", f"Checked {scanned} files in Downloads, Desktop, Documents, Startup and Temp."))
    lows = sum(1 for r in rows if r[0] in ("low", "info"))
    if lows:
        f.append(finding("info", f"{lows} lower-risk item(s) to review", "Unsigned programs, startup items or Office files with macros; listed in the table.", ""))
    return {"summary": f"Scanned {scanned} files · {sum(1 for r in rows if r[0] in ('high', 'medium'))} suspicious, {lows} to review", "score": score_of(f), "findings": sort_findings(f),
            "sections": [table("Flagged files", ["Risk", "File", "Folder", "Why", "Downloaded from", "Path"], rows, note="Nothing was opened, run, moved or deleted.")]}


def analyze_file(ctx, raw_path: str):
    p = Path(os.path.expandvars(os.path.expanduser(raw_path.strip().strip('"'))))
    with ctx.step("Opening the file details") as st:
        if not p.is_file():
            raise FileNotFoundError(f"No file at {p}")
        size = p.stat().st_size
        with open(p, "rb") as fh:
            head = fh.read(64)
        kind = sysp.magic_type(head)
        st["detail"] = f"{size:,} bytes, {kind or 'unknown type'}"
    f = []
    for sev, why in sysp.name_flags(p.name):
        f.append(finding(sev, "Suspicious name", why))
    mm = sysp.type_mismatch(p, head)
    if mm:
        f.append(finding(mm[0], "File type doesn't match its extension", mm[1], "Treat it as a program: don't open it unless you trust the source."))
    digest = None
    with ctx.step("Calculating SHA-256 fingerprint") as st:
        digest = sysp.sha256(p)
        st["detail"] = digest or "file too large to hash"
    z = sysp.zone_of(p)
    if z and z.get("zone") == 3:
        f.append(finding("info", "Downloaded from the internet", z.get("referrer") or z.get("url") or "", ""))
    sig = None
    if is_windows() and (p.suffix.lower() in sysp.EXEC_EXT or kind == "Windows program (PE)"):
        sig = ctx.soft_step("Checking the digital signature", lambda: (as_list(parse_json_tail(ctx.powershell(sysp.signature_ps([str(p)]), 40))) or [{}])[0])
        if sig:
            status = sig.get("status")
            if status == "Valid":
                f.append(finding("ok", f"Signed by {sig.get('signer')}", "The publisher is verified and the file is unchanged since signing."))
            elif status == "HashMismatch":
                f.append(finding("high", "Signature is broken", "The file was modified after it was signed.", "Do not run it."))
            else:
                f.append(finding("low", "Not digitally signed", "The publisher can't be verified.", "Only run it if you trust where it came from."))
    if p.suffix.lower() in sysp.SCRIPT_EXT or kind == "script":
        flags = sysp.script_flags(p)
        if flags:
            f.append(finding("high" if len(flags) >= 3 else "medium", "Script behaviour red flags", "It " + "; ".join(flags) + ".", "Don't run it unless you wrote it or fully trust it."))
    defender = None
    if is_windows() and sysp.DEFENDER.exists():
        with ctx.step("Scanning it with Microsoft Defender (no quarantine)") as st:
            r = ctx.run([str(sysp.DEFENDER), "-Scan", "-ScanType", "3", "-File", str(p), "-DisableRemediation"], 180)
            defender = "threat" if r.returncode == 2 else "clean" if r.returncode == 0 else f"error {r.returncode}"
            st["detail"] = defender
        if defender == "threat":
            m = re.search(r"Threat\s*:\s*(.+)", r.stdout)
            f.append(finding("critical", "Microsoft Defender detected a threat", m.group(1).strip() if m else "See Windows Security → Protection history.", "Delete the file, or let Windows Security remove it."))
        elif defender == "clean":
            f.append(finding("ok", "Microsoft Defender found no threat", "Scanned with the current definitions."))
    if not f:
        f.append(finding("ok", "No warning signs", ""))
    return {"summary": f"{p.name} · {kind or 'unknown type'} · {size:,} bytes" + (f" · Defender: {defender}" if defender else ""), "score": score_of(f), "findings": sort_findings(f),
            "sections": [kv("File", [("Path", str(p)), ("Size", f"{size:,} bytes"), ("Real type", kind), ("SHA-256", digest), ("Downloaded from", (z or {}).get("referrer") or (z or {}).get("url")),
                                     ("Signature", f"{sig.get('status')} ({sig.get('signer')})" if sig else None), ("Look up the hash", f"https://www.virustotal.com/gui/file/{digest}" if digest else None)])]}


# ---------- speed, website ----------

def act_speed(ctx, params):
    r = web.speed_test(ctx.step, ctx.check)
    f = []
    if r["download_mbps"] < 10:
        f.append(finding("medium", f"Slow download ({r['download_mbps']} Mbps)", "Video calls and large downloads will struggle.", "Restart the router, move closer, or check your plan with the ISP."))
    if r["latency_ms"] > 100:
        f.append(finding("low", f"High latency ({r['latency_ms']:.0f} ms)", "Calls and games feel laggy.", "Use 5 GHz Wi-Fi or a cable; close downloads running in the background."))
    if not f:
        f.append(finding("ok", "Connection is healthy", f"{r['download_mbps']} Mbps down, {r['upload_mbps']} Mbps up, {r['latency_ms']:.0f} ms."))
    return {"summary": f"↓ {r['download_mbps']} Mbps · ↑ {r['upload_mbps']} Mbps · {r['latency_ms']:.0f} ms ping (jitter {r['jitter_ms']:.0f} ms)", "score": None, "findings": f,
            "sections": [bars("Speed", [{"label": "Download", "value": r["download_mbps"], "max": max(100, r["download_mbps"]), "unit": " Mbps"}, {"label": "Upload", "value": r["upload_mbps"], "max": max(100, r["upload_mbps"]), "unit": " Mbps"},
                                        {"label": "Ping", "value": r["latency_ms"], "max": 200, "unit": " ms", "lower_is_better": True}]),
                         kv("Test", [("Server", r["server"]), ("Jitter", f"{r['jitter_ms']} ms")])]}


def act_website(ctx, params):
    from app.config import settings
    url = params.get("url") or ""
    r = web.website_check(url, allow_private=settings.system_control, step=ctx.step)
    f = r["findings"]
    return {"summary": f"{r['url']} · HTTP {r['status']} · {count_line(f)}", "score": score_of(f), "findings": sort_findings(f),
            "sections": [kv("Site", [("Address", r["url"]), ("Resolves to", ", ".join(r["addresses"][:4])), ("TLS", (r["tls"] or {}).get("version")), ("Certificate issuer", (r["tls"] or {}).get("issuer")),
                                     ("Valid until", (r["tls"] or {}).get("expires")), ("Cookies set", r["cookies"])]),
                         table("Security headers", ["Header", "Value"], [[k, v[:200]] for k, v in r["headers"].items()]),
                         {"title": "Scope", "type": "text", "text": "Passive check only: one normal visit, the certificate and response headers. No crawling, attack payloads or login attempts. Run deeper tests (e.g. OWASP ZAP) only on sites you own or are authorised to test."}]}


# ---------- composite: laptop, report, emergency ----------

def act_laptop(ctx, params):
    s = None
    with ctx.step("Sampling CPU, memory and processes") as st:
        s = sysp.cpu_ram_sample(1.0)
        st["detail"] = f"CPU {s['cpu_percent']}%, RAM {s['ram_percent']}%"
    f = cpu_ram_findings(s)
    with ctx.step("Reading drive space") as st:
        vols = sysp.volumes()
        st["detail"] = ", ".join(f"{v['mount']} {v['percent']:.0f}%" for v in vols)
    f += [x for x in disk_findings(vols, [], 0)]
    hw = {}
    if is_windows():
        hw = ctx.soft_step("Reading hardware, battery, drivers and startup apps", lambda: ps_file(ctx, "hardware.ps1", 90)) or {}
    if hw:
        startup = as_list(hw.get("startup"))
        if len(startup) > 8:
            f.append(finding("low", f"{len(startup)} programs start with Windows", ", ".join(x.get("name", "?") for x in startup[:10]), "Task Manager → Startup apps → disable what you don't need right away."))
        for p in as_list(hw.get("driverProblems")):
            f.append(finding("medium", f"Driver problem: {p.get('name')}", f"Device Manager error code {p.get('code')}.", "Update or reinstall the driver from the PC maker's support site."))
        f += battery_findings(hw.get("battery"))
        if any((d.get("media") == "HDD") for d in as_list(hw.get("disks"))):
            f.append(finding("low", "Windows is on a hard disk", "The main cause of slowness on older PCs.", "Upgrade to an SSD."))
        if any(d.get("health") not in (None, "Healthy") for d in as_list(hw.get("disks"))):
            f.append(finding("critical", "A disk reports a health problem", "", "Back up now."))
    sec = []
    if is_windows():
        sec = ctx.soft_step("Quick security check (Defender, firewall, UAC, updates)", lambda: [
            finding({"ok": "ok", "warn": "medium", "bad": "high", "unknown": "info"}[c["status"]], c["label"] if c["status"] == "ok" else f"{c['label']}: {c['detail']}", c["detail"], c.get("fix", ""))
            for c in security_center.interpret(parse_json_tail(ctx.powershell(security_center.SCRIPT, security_center.TIMEOUT)) or {})]) or []
    f += sec
    cpu = (hw.get("cpu") or {})
    ram_total = s["ram_total"]
    bottleneck = "memory" if s["ram_percent"] >= 85 else "processor" if s["cpu_percent"] >= 80 else "disk space" if any(v["percent"] >= 90 for v in vols) else None
    summary = f"{hw.get('maker', '')} {hw.get('model', '')} · {cpu.get('name') or platform.processor()} · {sysp.gb(ram_total)} RAM".strip(" ·")
    summary += f" · main bottleneck: {bottleneck}" if bottleneck else " · no bottleneck right now"
    return {"summary": summary, "score": score_of(f), "findings": sort_findings(f),
            "sections": cpu_ram_sections(s) + [bars("Drive space used", [{"label": v["mount"], "value": v["percent"], "max": 100, "unit": "%", "note": f"{sysp.gb(v['free'])} free"} for v in vols]),
                                               table("Startup programs", ["Name", "Where"], [[x.get("name"), x.get("location")] for x in as_list(hw.get("startup"))])]}


def act_emergency(ctx, params):
    f = []
    with ctx.step("Checking load (CPU, memory, disk)") as st:
        s = sysp.cpu_ram_sample(0.6)
        vols = sysp.volumes()
        st["detail"] = f"CPU {s['cpu_percent']}%, RAM {s['ram_percent']}%"
    f += [x for x in cpu_ram_findings(s) if x["severity"] != "ok"]
    f += [x for x in disk_findings(vols, [], 0) if x["severity"] != "ok"]
    gw = None
    if is_windows():
        adapters = as_list(ctx.soft_step("Finding the router", lambda: parse_json_tail(ctx.powershell(net.IPCONFIG_PS, 30)))) or []
        gw = next((g for a in adapters for g in as_list(a.get("gateway")) if g), None)
    with ctx.step("Testing the connection: router, DNS, internet") as st:
        results = []
        if gw:
            ok = any(net.tcp_open(gw, p, 1.0) for p in (53, 80, 443))
            if not ok:
                ok = ctx.run(["ping", "-n", "2", "-w", "800", gw], 10).returncode == 0
            results.append(("Router", ok))
            if not ok:
                f.append(finding("critical", "The router does not answer", f"Gateway {gw} is unreachable.", "Check the Wi-Fi/cable, then restart the router."))
        try:
            socket.getaddrinfo("www.microsoft.com", 443)
            results.append(("DNS", True))
        except OSError:
            results.append(("DNS", False))
            f.append(finding("high", "Names don't resolve (DNS)", "Websites can't be found by name.", "Restart the router, or set DNS to 1.1.1.1 / 8.8.8.8 in adapter settings."))
        try:
            httpx.get("https://www.cloudflare.com/cdn-cgi/trace", timeout=6)
            results.append(("Internet", True))
        except httpx.HTTPError:
            results.append(("Internet", False))
            f.append(finding("high", "No internet access", "HTTPS requests fail.", "Check the router's internet light or your ISP."))
        st["detail"] = ", ".join(f"{n} {'ok' if ok else 'FAIL'}" for n, ok in results)
    ev = {}
    if is_windows():
        ev = ctx.soft_step("Reading crashes and critical errors from the event logs (48 h)", lambda: ps_file_text(ctx, sysp.EVENTS_PS)) or {}
        power = as_list(ev.get("powerEvents"))
        bsod = [e for e in power if e.get("id") == 1001]
        dirty = [e for e in power if e.get("id") in (41, 6008)]
        if bsod:
            f.append(finding("high", f"{len(bsod)} blue-screen crash(es) in 14 days", ", ".join(e["when"] for e in bsod[:5]), "Update drivers (graphics, chipset, Wi-Fi) and Windows; run 'Check disk health'."))
        if dirty:
            f.append(finding("medium", f"{len(dirty)} unexpected shutdown(s) in 14 days", ", ".join(e["when"] for e in dirty[:5]), "Power loss, overheating or a forced power-off. Check the charger and vents."))
        crashes = as_list(ev.get("appCrashes"))
        if crashes:
            f.append(finding("medium" if sum(c["count"] for c in crashes) >= 5 else "low", "Apps crashed in the last 48 h", ", ".join(f"{c['app']} ×{c['count']}" for c in crashes[:6]), "Update or reinstall the app that crashes most."))
        sys_err = as_list(ev.get("systemErrors"))
        if sys_err:
            f.append(finding("info", f"{sum(e['count'] for e in sys_err)} system errors in 48 h", ", ".join(f"{e['source']} ×{e['count']}" for e in sys_err[:5]), "Usually harmless; repeating disk, driver or WHEA errors are not."))
        sec = ctx.soft_step("Checking antivirus and firewall", lambda: security_center.interpret(parse_json_tail(ctx.powershell(security_center.SCRIPT, security_center.TIMEOUT)) or {})) or []
        for c in sec:
            if c["id"] in ("antivirus", "firewall") and c["status"] == "bad":
                f.append(finding("critical", c["detail"], "", c.get("fix", "")))
    bat = psutil.sensors_battery()
    if bat and not bat.power_plugged and bat.percent < 15:
        f.append(finding("high", f"Battery at {bat.percent:.0f}% and unplugged", "The PC will shut down soon.", "Plug in the charger."))
    if not f:
        f.append(finding("ok", "No emergency found", "Load, storage, network, crashes and protection all look normal."))
    return {"summary": f"Emergency check: {count_line(f)}", "score": score_of(f), "findings": sort_findings(f),
            "sections": cpu_ram_sections(s)[:2] + [table("System errors (48 h)", ["Source", "Count", "Last", "Message"], [[e.get("source"), e.get("count"), e.get("last"), (e.get("message") or "")[:140]] for e in as_list(ev.get("systemErrors"))]),
                                                   table("App crashes (48 h)", ["App", "Crashes"], [[c.get("app"), c.get("count")] for c in as_list(ev.get("appCrashes"))])]}


def ps_file_text(ctx, script):
    return parse_json_tail(ctx.powershell(script, 60))


def to_markdown(title: str, generated: str, parts: list[tuple[str, dict]], score: int) -> str:
    lines = [f"# {title}", "", f"Generated {generated} by Azarvis on {socket.gethostname()}. Overall score: **{score}/100**.", ""]
    allf = [dict(x, area=area) for area, r in parts for x in r.get("findings", [])]
    lines += ["## Summary", ""] + [f"- **{area}**: {r.get('summary')}" for area, r in parts] + [""]
    lines += ["## Findings to act on", ""]
    act = [x for x in sort_findings(allf) if x["severity"] in ("critical", "high", "medium", "low")]
    if not act:
        lines.append("Nothing to fix.")
    for x in act:
        lines.append(f"- **[{x['severity'].upper()}] {x['area']}: {x['title']}**" + (f"  \n  {x['detail']}" if x.get("detail") else "") + (f"  \n  Fix: {x['fix']}" if x.get("fix") else ""))
    lines += ["", "## Passed checks", ""] + [f"- {x['area']}: {x['title']}" for x in allf if x["severity"] == "ok"]
    lines += ["", "---", "Read-only assessment: nothing on this PC or network was changed."]
    return "\n".join(lines)


def act_report(ctx, params):
    parts = []
    for area, fn in (("System security", act_security), ("Open ports", act_ports), ("Wi-Fi", act_wifi), ("CPU & memory", act_cpu_ram), ("Disks", act_disk), ("IP address", act_ip)):
        try:
            parts.append((area, fn(ctx, params)))
        except Exception as e:
            if ctx.cancelled:
                raise
            parts.append((area, {"summary": f"Could not run: {e}"[:200], "findings": [finding("info", f"{area} check failed", str(e)[:200])]}))
    if params.get("authorized"):
        try:
            parts.append(("Network devices", act_network(ctx, params)))
        except Exception as e:
            if ctx.cancelled:
                raise
            parts.append(("Network devices", {"summary": f"Could not run: {e}"[:200], "findings": []}))
    allf = [dict(x, area=area) for area, r in parts for x in r.get("findings", [])]
    score = score_of(allf)
    generated = datetime.now().strftime("%Y-%m-%d %H:%M")
    md = to_markdown("Azarvis Security Report", generated, parts, score)
    return {"summary": f"Security report: score {score}/100 · {count_line(allf)} across {len(parts)} areas", "score": score, "findings": sort_findings(allf),
            "sections": [table("Areas", ["Area", "Result", "Score"], [[a, r.get("summary"), r.get("score")] for a, r in parts])], "markdown": md}




def act_investigate(ctx, params):
    from app.ops import osint
    return osint.investigate(ctx, params.get("target", ""))


def _nd():
    from app.ops import netdiag
    return netdiag


def _vuln():
    from app.ops import vuln
    return vuln


def _code():
    from app.ops import codeaudit
    return codeaudit


def _tb():
    from app.ops import toolbox
    return toolbox


# ---------- registry ----------

ACTIONS: dict[str, dict] = {
    "laptop": {"title": "Scan my laptop", "fn": act_laptop, "icon": "monitor", "does": "Performance, hardware, startup apps and a quick security check, with the main bottleneck."},
    "devices": {"title": "Find nearby devices", "fn": act_devices, "icon": "radar", "consent": True, "does": "Devices on your own Wi-Fi/LAN (ARP, mDNS, UPnP, NetBIOS) plus Bluetooth in range."},
    "network": {"title": "Scan authorized network", "fn": act_network, "icon": "network", "consent": True, "does": "Every device on your network plus 24 common ports each; flags risky services."},
    "ip": {"title": "Check IP address", "fn": act_ip, "icon": "globe", "does": "Local and public IP, gateway, DNS servers and the network type."},
    "security": {"title": "Check system security", "fn": act_security, "icon": "shield", "does": "Defender, firewall, UAC, updates, RDP, SMBv1, Secure Boot, encryption, accounts, threats."},
    "hardware": {"title": "Analyze hardware", "fn": act_hardware, "icon": "cpu", "does": "CPU, GPU, RAM modules, disks, battery health, drivers, startup and installed apps."},
    "cpu_ram": {"title": "Check CPU & RAM", "fn": act_cpu_ram, "icon": "pulse", "does": "Live load per core and the programs using the most CPU and memory."},
    "disk": {"title": "Check disk health", "fn": act_disk, "icon": "database", "does": "Physical disk health status, free space per drive, temporary files."},
    "files": {"title": "Detect suspicious files", "fn": act_files, "icon": "alert", "input": "path", "does": "Double extensions, disguised programs, risky scripts, unsigned downloads, startup items, Defender detections."},
    "speed": {"title": "Test internet speed", "fn": act_speed, "icon": "zap", "does": "Ping, jitter, download and upload against Cloudflare's speed servers."},
    "bluetooth": {"title": "Check Bluetooth devices", "fn": act_bluetooth, "icon": "bluetooth", "does": "Paired, connected and nearby Bluetooth / BLE devices with signal strength."},
    "wifi": {"title": "Analyze Wi-Fi security", "fn": act_wifi, "icon": "wifi", "does": "Your Wi-Fi's encryption and signal, nearby networks, evil-twin and open-network warnings."},
    "website": {"title": "Scan website security", "fn": act_website, "icon": "lock", "input": "url", "does": "HTTPS certificate, TLS version, security headers, cookies, mapped to OWASP Top 10."},
    "ports": {"title": "Check open ports", "fn": act_ports, "icon": "plug", "does": "Every port this PC listens on, the program behind it and who can reach it."},
    "report": {"title": "Generate security report", "fn": act_report, "icon": "report", "does": "Runs the security, ports, Wi-Fi, CPU, disk and IP checks and writes a report you can download."},
    "investigate": {"title": "Investigate domain / IP", "fn": act_investigate, "icon": "globe", "input": "target", "does": "Passive public-records intelligence on any domain or public IP: DNS, WHOIS/RDAP, owner & ASN, TLS certificate, subdomains, SPF/DMARC."},
    "netfix": {"title": "Fix my internet", "fn": lambda ctx, p: _nd().troubleshoot(ctx), "icon": "wifi", "does": "Layer-by-layer diagnosis (adapter, DHCP, router, loss, DNS, HTTPS, captive portal, proxy, VPN, Wi-Fi drops, IP conflicts) with approved one-click fixes."},
    "traceroute": {"title": "Traceroute", "fn": lambda ctx, p: _nd().traceroute(ctx, p.get("target", "")), "icon": "timeline", "input": "target", "does": "The network path to any host, hop by hop, with latency and who runs each hop."},
    "connections": {"title": "Live connections", "fn": lambda ctx, p: _nd().connections(ctx), "icon": "chart", "does": "Who this PC is talking to right now: programs, remote hosts and owners, traffic, TCP health. No packet contents read."},
    "deps": {"title": "Dependency vulnerabilities", "fn": lambda ctx, p: _vuln().dependency_scan(ctx, p.get("path")), "icon": "database", "input": "folder", "does": "Exact package versions from lock files and .venv checked against OSV.dev (GitHub advisories, PyPA, npm)."},
    "cve": {"title": "CVE lookup", "fn": lambda ctx, p: _vuln().cve_lookup(ctx, p.get("query", "")), "icon": "search", "input": "query", "does": "Any CVE id or product name from NIST NVD: CVSS, weakness, date, and CISA known-exploited status."},
    "code_audit": {"title": "Audit my code", "fn": lambda ctx, p: _code().code_audit(ctx, p.get("path")), "icon": "code", "input": "folder", "does": "Committed secrets (masked), Bandit Python findings and risky JS/TS patterns in a project folder."},
    "toolbox": {"title": "Security toolbox", "fn": lambda ctx, p: _tb().act_toolbox(ctx, p), "icon": "briefcase", "does": "Which professional tools (Nmap, Bandit, Wireshark, ZAP, Trivy…) are installed and how Jarvis uses them."},
    "emergency": {"title": "Emergency system diagnostics", "fn": act_emergency, "icon": "siren", "does": "Fast triage: overload, full disks, network down, crashes, blue screens, antivirus off."},
}


def _register_profiles():
    from app.ops import profiles
    for pid, pr in profiles.PROFILES.items():
        ACTIONS[pid] = {"title": pr["title"], "fn": profiles.act_profile(pid), "icon": pr["icon"], "does": pr["scope"],
                        "consent": bool(pr.get("consent")), "input": pr.get("input"), "profile": True}


_register_profiles()


def catalog() -> list[dict]:
    return [{"id": k, "title": a["title"], "icon": a["icon"], "does": a["does"], "consent": bool(a.get("consent")), "input": a.get("input"),
             "profile": bool(a.get("profile"))} for k, a in ACTIONS.items()]
