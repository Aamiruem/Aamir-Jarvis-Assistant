"""Threat blocklists are checked locally; investigations add indexed services, routing and
reputation, and label what is verified vs estimated vs unavailable."""
import json

import httpx

from app.ops import geomap, osint, threatfeeds

FEODO = json.dumps([{"ip_address": "45.9.9.9", "port": 443, "status": "online", "malware": "QakBot", "first_seen": "2026-11-01", "last_online": "2026-11-21"}])
DROP = '{"cidr":"198.51.100.0/24","sblid":"SBL1","rir":"arin"}\n{"type":"metadata","records":1}\n'


def state():
    return threatfeeds._compile({"fetched": {}, "feodo": threatfeeds.parse_feodo(FEODO), "drop": threatfeeds.parse_drop(DROP)})


def test_blocklists_match_c2_ips_and_hijacked_networks_locally():
    st = state()
    c2 = threatfeeds.check("45.9.9.9", st)
    assert c2[0]["severity"] == "critical" and "QakBot" in c2[0]["detail"]  # online C2 = critical
    assert threatfeeds.check("198.51.100.77", st)[0]["detail"].startswith("In 198.51.100.0/24")
    assert threatfeeds.check("1.1.1.1", st) == [] and threatfeeds.check("not-an-ip", st) == []


def test_map_marks_blocklisted_hosts_malicious():
    hosts = [{"ip": "45.9.9.9", "ports": {443}, "programs": {"evil.exe"}, "exes": set(), "count": 1, "established": 1},
             {"ip": "8.8.8.8", "ports": {443}, "programs": {"chrome.exe"}, "exes": set(), "count": 1, "established": 1}]
    m = geomap.build(hosts, {}, {}, state())
    bad = next(h for h in m["hosts"] if h["ip"] == "45.9.9.9")
    assert bad["malicious"] and bad["flagged"] and "Feodo" in bad["reasons"][0]
    assert m["malicious"] == 1


class Ctx:
    def soft_step(self, label, fn, *a):
        try:
            return fn(*a)
        except Exception:
            return None


def client(routes):
    def handler(req):
        for frag, (code, body) in routes.items():
            if frag in str(req.url):
                return httpx.Response(code, json=body)
        return httpx.Response(500)
    return httpx.Client(transport=httpx.MockTransport(handler))


def test_exposure_reports_indexed_cves_risky_ports_routing_and_blocklists(monkeypatch):
    monkeypatch.setattr(threatfeeds, "ensure", state)
    c = client({
        "internetdb.shodan.io/45.9.9.9": (200, {"ip": "45.9.9.9", "ports": [22, 3389], "cpes": ["cpe:/a:openbsd:openssh:8.9"], "hostnames": [], "tags": ["c2"], "vulns": ["CVE-2023-38408"]}),
        "internetdb.shodan.io/192.0.2.1": (404, {"detail": "No information available"}),
        "stat.ripe.net": (200, {"data": {"resource": "45.9.9.0/24", "announced": True, "asns": [{"asn": 64500, "holder": "EXAMPLE"}], "block": {"desc": "TEST-NET"}}}),
    })
    findings, sections, unavailable = [], [], []
    osint.exposure(Ctx(), c, ["45.9.9.9", "192.0.2.1"], findings, sections, unavailable)
    titles = [f["title"] for f in findings]
    assert any("1 known CVE" in t for t in titles)
    assert any("port 3389" in t for t in titles)
    assert any("tagged 'c2'" in t for t in titles)
    assert any("on a threat blocklist" in t for t in titles)
    idx = next(s for s in sections if s["title"].startswith("Publicly indexed"))
    assert idx["rows"][1][1] == "not in Shodan's index"
    route = next(s for s in sections if s["title"].startswith("Routing"))
    assert route["rows"][0][3] == "AS64500 EXAMPLE"
    assert not unavailable


def test_failed_sources_are_listed_as_unavailable(monkeypatch):
    monkeypatch.setattr(threatfeeds, "ensure", state)
    findings, sections, unavailable = [], [], []
    osint.exposure(Ctx(), client({}), ["192.0.2.50"], findings, sections, unavailable)
    assert any("Shodan" in u for u in unavailable) and any("BGP" in u for u in unavailable)
    ev = osint.evidence_table("ip", unavailable)
    kinds = [r[0] for r in ev["rows"]]
    assert kinds[:4] == ["Verified", "Indexed (third-party, may be days old)", "Estimate", "Cannot be known from public data"]
    assert kinds.count("Unavailable this time") == 2


def test_virustotal_is_skipped_without_a_key(monkeypatch):
    monkeypatch.setattr("app.config.settings.virustotal_api_key", "")
    unavailable = []
    osint.reputation(Ctx(), client({}), "domain", "example.com", [], [], [], unavailable)
    assert "VIRUSTOTAL_API_KEY" in unavailable[0]
