"""Cyber Ops advanced modules: network diagnostics, vulnerability intel, code audit, toolbox,
universal command routing, safe mode and authorization profiles. Parsers are pure; no network."""
import asyncio
import json

import pytest
from fastapi import HTTPException

from app.ops import codeaudit, command, netdiag, safemode, toolbox, vuln
from app.routers import ops as ops_router
from app.security import Caller

ME = Caller(user_id="ops-adv-tester")


# ---------- network diagnostics ----------

PING = """
Ping statistics for 192.168.1.1:
    Packets: Sent = 8, Received = 7, Lost = 1 (12% loss),
Approximate round trip times in milli-seconds:
    Minimum = 1ms, Maximum = 9ms, Average = 3ms
"""
TRACERT = """
Tracing route to 1.1.1.1 over a maximum of 30 hops

  1     2 ms     4 ms     1 ms  192.168.1.1
  2    <1 ms     2 ms     2 ms  163.223.103.10
  3     *        *        *     Request timed out.
  4    21 ms    13 ms    21 ms  104.23.231.30

Trace complete.
"""


def test_parse_ping_and_tracert():
    p = netdiag.parse_ping(PING)
    assert (p["sent"], p["received"], p["loss"], p["avg"]) == (8, 7, 12, 3)
    assert netdiag.parse_ping("Request timed out.")["avg"] is None
    hops = netdiag.parse_tracert(TRACERT)
    assert [h["hop"] for h in hops] == [1, 2, 3, 4]
    assert hops[0]["ip"] == "192.168.1.1" and hops[1]["rtts"][0] == 0.5
    assert hops[2]["ip"] is None and hops[2]["rtts"] == [None, None, None]


def test_parse_netstat_tcp():
    text = "TCP Statistics for IPv4\n  Active Opens = 120\n  Failed Connection Attempts = 7\n  Segments Sent = 1000\n  Segments Retransmitted = 30\n"
    assert netdiag.parse_netstat_tcp(text) == {"active_opens": 120, "failed": 7, "sent": 1000, "retransmitted": 30}


def test_trace_target_validation():
    assert netdiag.resolve_trace_target("8.8.8.8") == ("8.8.8.8", "8.8.8.8")
    with pytest.raises(ValueError):
        netdiag.resolve_trace_target("224.0.0.1")
    with pytest.raises(ValueError):
        netdiag.resolve_trace_target("bad host; rm -rf")


def test_only_whitelisted_fixes_exist():
    assert set(netdiag.FIXES) == {"flush_dns", "renew_dhcp"}
    assert all(f["cmd"][0] == "ipconfig" for f in netdiag.FIXES.values())


# ---------- vulnerability intel ----------

def test_dependency_parsers():
    assert vuln.parse_requirements("Flask==2.0.1  # web\nrequests>=2.0\nJinja2[i18n]==2.10\n") == [("flask", "2.0.1"), ("jinja2", "2.10")]
    lock = {"lockfileVersion": 3, "packages": {"": {}, "node_modules/lodash": {"version": "4.17.15"},
                                               "node_modules/a/node_modules/@scope/b": {"version": "1.0.0"}, "node_modules/linked": {"link": True}}}
    assert sorted(vuln.parse_package_lock(json.dumps(lock))) == [("@scope/b", "1.0.0"), ("lodash", "4.17.15")]
    assert vuln.parse_poetry_lock('[[package]]\nname = "Django"\nversion = "3.2.0"\n') == [("django", "3.2.0")]


def test_collect_reads_lockfiles_and_venv(tmp_path):
    (tmp_path / "requirements.txt").write_text("httpx==0.20.0\n")
    meta = tmp_path / ".venv" / "Lib" / "site-packages" / "PyYAML-5.3.dist-info"
    meta.mkdir(parents=True)
    (meta / "METADATA").write_text("Metadata-Version: 2.1\nName: PyYAML\nVersion: 5.3\n")
    (tmp_path / "node_modules").mkdir()
    (tmp_path / "node_modules" / "package-lock.json").write_text("{}")  # must be skipped
    pkgs, _ = vuln.collect(tmp_path)
    assert {(p["ecosystem"], p["name"], p["version"]) for p in pkgs} == {("PyPI", "httpx", "0.20.0"), ("PyPI", "pyyaml", "5.3")}


def test_osv_severity_and_fixes():
    v = {"database_specific": {"severity": "MODERATE"},
         "affected": [{"package": {"name": "lodash"}, "ranges": [{"events": [{"introduced": "0"}, {"fixed": "4.17.21"}]}]}]}
    assert vuln.severity_of(v) == "medium"
    assert vuln.fixed_versions(v, "lodash") == ["4.17.21"]


def test_cve_summary_reads_cvss_and_kev():
    item = {"cve": {"id": "CVE-2021-44228", "published": "2021-12-10T10:15:09", "lastModified": "2026-01-01T00:00:00", "vulnStatus": "Analyzed",
                    "descriptions": [{"lang": "en", "value": "Log4Shell"}], "cisaExploitAdd": "2021-12-10", "cisaRequiredAction": "Apply updates",
                    "metrics": {"cvssMetricV31": [{"cvssData": {"baseScore": 10.0, "baseSeverity": "CRITICAL", "vectorString": "CVSS:3.1/AV:N"}}]},
                    "weaknesses": [{"description": [{"value": "CWE-502"}]}], "references": [{"url": "https://x"}]}}
    s = vuln.cve_summary(item)
    assert s["score"] == 10.0 and s["severity"] == "CRITICAL" and s["kev"] and s["cwe"] == ["CWE-502"] and s["published"] == "2021-12-10"


# ---------- code audit ----------

def test_secret_rules_find_real_keys_and_skip_placeholders():
    text = "\n".join([
        'AWS = "AKIAABCDEFGHIJKLMNOP"',
        "token = ghp_" + "a" * 36,
        'password = "changeme-please"',
        'password = "Tr0ub4dor&3xyz"',
        "-----BEGIN OPENSSH PRIVATE KEY-----",
        'api_key = os.environ["KEY"]',
    ])
    hits = codeaudit.scan_text_for_secrets(text)
    assert [h["rule"] for h in hits] == ["aws-access-key", "github-token", "password-assignment", "private-key"]
    assert "AKIAABCDEFGHIJKLMNOP" not in json.dumps(hits)


def test_js_rules():
    hits = codeaudit.scan_text_js("const x = eval(input);\n// eval(old)\nhttps.request({ rejectUnauthorized: false })\n")
    assert [h["rule"] for h in hits] == ["eval", "tls-off"]


# ---------- toolbox ----------

NMAP_XML = """<?xml version="1.0"?><nmaprun><host><address addr="192.168.1.4" addrtype="ipv4"/><address addr="48:EA:62:57:C9:5E" addrtype="mac"/>
<hostnames><hostname name="printer.lan"/></hostnames><ports>
<port protocol="tcp" portid="631"><state state="open"/><service name="ipp" product="HP HTTP Server" version="2.0"/></port>
<port protocol="tcp" portid="22"><state state="closed"/></port></ports></host></nmaprun>"""


def test_parse_nmap_xml():
    d = toolbox.parse_nmap_xml(NMAP_XML)
    assert d["192.168.1.4"]["hostname"] == "printer.lan"
    assert d["192.168.1.4"]["ports"] == [{"port": 631, "proto": "tcp", "state": "open", "service": "ipp", "product": "HP HTTP Server", "version": "2.0"}]


def test_exploitation_tools_are_never_driven():
    assert {t["id"] for t in toolbox.TOOLS if t["driven"]} == {"nmap", "bandit"}
    assert {"metasploit", "sqlmap", "nikto"} <= {t["id"] for t in toolbox.TOOLS}


# ---------- universal command ----------

@pytest.mark.parametrize("text,action,params", [
    ("JARVIS, analyze my entire laptop", "laptop", {}),
    ("why is my computer so slow", "laptop", {}),
    ("find all discoverable devices on my network", "devices", {}),
    ("perform an authorized security audit of my network", "network", {}),
    ("my internet is not working", "netfix", {}),
    ("traceroute to google.com", "traceroute", {"target": "google.com"}),
    ("investigate example.com", "investigate", {"target": "example.com"}),
    ("tell me about CVE-2021-44228", "cve", {"query": "CVE-2021-44228"}),
    ("are there vulnerable dependencies in my project", "deps", {}),
    ("check https://example.com website security headers", "website", {"url": "https://example.com"}),
    ("audit my code for leaked secrets", "code_audit", {}),
    ("who is my pc talking to", "connections", {}),
    ("what's my ip", "ip", {}),
    ("is nmap installed", "toolbox", {}),
])
def test_route_to_action(text, action, params):
    r = command.route(text)
    assert r["mode"] == "action" and r["action"] == action, r
    for k, v in params.items():
        assert r["params"][k] == v


def test_route_missing_input_and_agents():
    assert command.route("traceroute")["missing"] == "target"
    assert command.route("build an advanced AI application with a React frontend and then deploy it")["mode"] == "agents"
    assert command.route("research this scientific question about superconductors")["mode"] == "agents"


# ---------- authorization profiles, safe mode, fixes ----------

def test_org_profile_needs_who_authorized():
    with pytest.raises(HTTPException) as e:
        ops_router._check_params("network", {"authorized": True, "profile": "org"})
    assert e.value.status_code == 422
    p = ops_router._check_params("network", {"authorized": True, "profile": "org", "authorized_by": "IT ticket #42"})
    assert p["profile"] == "org" and p["authorized_by"] == "IT ticket #42"
    assert ops_router._check_params("devices", {"authorized": True})["profile"] == "home"
    with pytest.raises(HTTPException):
        ops_router._check_params("network", {"authorized": True, "profile": "anyone"})


def test_query_and_folder_inputs():
    assert ops_router._check_params("cve", {"query": "openssh 9.6"})["query"] == "openssh 9.6"
    with pytest.raises(HTTPException):
        ops_router._check_params("cve", {"query": ""})
    assert "path" not in ops_router._check_params("deps", {})


def test_safe_mode_blocks_actions(tmp_path, monkeypatch):
    monkeypatch.setattr(safemode, "FILE", tmp_path / "safe.json")
    monkeypatch.setattr(safemode, "_state", None)
    r = asyncio.run(ops_router.set_safe_mode(ops_router.SafeIn(on=True), ME))
    assert r["on"] is True and safemode.is_on()
    with pytest.raises(HTTPException) as e:
        asyncio.run(ops_router.run(ops_router.RunIn(action="network", params={"authorized": True}), ME))
    assert e.value.status_code == 423
    with pytest.raises(HTTPException) as e:
        asyncio.run(ops_router.apply_fix(ops_router.FixIn(fix="flush_dns", approve=True), ME))
    assert e.value.status_code == 423
    from app.agent.tools import ToolContext, run_tool
    out, err = run_tool("system_control", {"action": "volume_up"}, ToolContext(user_id="x"))
    assert err and "safe mode" in out
    asyncio.run(ops_router.set_safe_mode(ops_router.SafeIn(on=False), ME))
    assert not safemode.is_on()


def test_fix_needs_approval_and_whitelist():
    with pytest.raises(HTTPException) as e:
        asyncio.run(ops_router.apply_fix(ops_router.FixIn(fix="flush_dns", approve=False), ME))
    assert e.value.status_code == 428
    with pytest.raises(HTTPException) as e:
        asyncio.run(ops_router.apply_fix(ops_router.FixIn(fix="netsh_reset_everything", approve=True), ME))
    assert e.value.status_code == 404


def test_every_action_lists_its_tools():
    listing = asyncio.run(ops_router.list_actions())
    assert all(a["tools"] for a in listing["actions"])
    assert set(listing["profiles"]) == {"home", "org", "lab"}
