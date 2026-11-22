"""Global Intelligence: passive OSINT on a domain or public IP, from public records only.

Everything here reads information that is already public, through public services:
- DNS records over DNS-over-HTTPS (Cloudflare), including SPF/DMARC and DNSSEC validation;
- domain / IP registration via RDAP (the modern WHOIS), a public JSON API;
- the owner, ASN and approximate location of an IP via ipinfo.io;
- the TLS certificate, by making one ordinary HTTPS connection to the host;
- other names on the same certificate authority logs via crt.sh (Certificate Transparency);
- the site's public HTTP security headers, from one normal GET.

It never scans ports, logs in, sends attack traffic, or touches anything private: private and
reserved addresses are refused (use the local-network scanner for your own devices). So it is safe
to run against any public domain or address, and it says plainly what is verified vs estimated.
"""
from __future__ import annotations

import ipaddress
import re
import socket
from urllib.parse import urlsplit

import httpx

from app.ops import web_probe as web

UA = {"User-Agent": "Azarvis-OSINT/1.0 (passive public-records lookup)", "Accept": "application/json"}
DOH = "https://cloudflare-dns.com/dns-query"
RECORD_TYPES = ["A", "AAAA", "MX", "NS", "TXT", "SOA", "CAA"]


def normalize_target(raw: str) -> tuple[str, str, list[str]]:
    """('domain'|'ip', host, public_ips). Refuses private/reserved targets and URLs with a path only."""
    raw = (raw or "").strip().strip('"')
    if "://" in raw:
        raw = urlsplit(raw).hostname or ""
    raw = raw.strip("/").split("/")[0].strip()
    if not raw:
        raise ValueError("Enter a domain or public IP, e.g. example.com or 1.1.1.1")
    try:
        ip = ipaddress.ip_address(raw)
    except ValueError:
        ip = None
    if ip is not None:
        if not ip.is_global:
            raise ValueError("That is a private or reserved address. Use 'Scan authorized network' for your own devices.")
        return "ip", str(ip), [str(ip)]
    host = raw.lower().rstrip(".")
    if len(host) > 253 or not re.fullmatch(r"(?=.{1,253}$)([a-z0-9](-?[a-z0-9])*\.)+[a-z]{2,}", host):
        raise ValueError("Enter a valid domain (example.com) or a public IP address.")
    try:
        addrs = sorted({ai[4][0] for ai in socket.getaddrinfo(host, None, proto=socket.IPPROTO_TCP)})
    except socket.gaierror:
        raise ValueError(f"{host} does not resolve: check the spelling.")
    public = [a for a in addrs if ipaddress.ip_address(a).is_global]
    if not public:
        raise ValueError("That name resolves only to private addresses, so there is no public infrastructure to investigate.")
    return "domain", host, public


def doh(client: httpx.Client, name: str, rtype: str) -> dict:
    r = client.get(DOH, params={"name": name, "type": rtype}, headers={"accept": "application/dns-json"}, timeout=8)
    r.raise_for_status()
    return r.json()


def dns_lookup(client: httpx.Client, domain: str) -> dict:
    """{records: {type: [values]}, dnssec: bool, spf: str|None, dmarc: str|None}."""
    out: dict[str, list[str]] = {}
    dnssec = False
    for rt in RECORD_TYPES:
        try:
            d = doh(client, domain, rt)
        except httpx.HTTPError:
            continue
        dnssec = dnssec or bool(d.get("AD"))
        want = {"A": 1, "AAAA": 28, "MX": 15, "NS": 2, "TXT": 16, "SOA": 6, "CAA": 257}.get(rt)
        vals = [(a.get("data", "").strip('"') if rt == "TXT" else a.get("data", "")) for a in d.get("Answer", []) if a.get("type") == want]
        if vals:
            out[rt] = vals
    spf = next((t for t in out.get("TXT", []) if t.lower().startswith("v=spf1")), None)
    dmarc = None
    try:
        d = doh(client, f"_dmarc.{domain}", "TXT")
        dmarc = next((a["data"].strip('"') for a in d.get("Answer", []) if a.get("type") == 16 and "v=dmarc1" in a.get("data", "").lower()), None)
    except httpx.HTTPError:
        pass
    return {"records": out, "dnssec": dnssec, "spf": spf, "dmarc": dmarc}


def rdap(client: httpx.Client, kind: str, target: str) -> dict:
    """Registration facts from RDAP (registrar, created/expires, nameservers, or IP network owner)."""
    try:
        r = client.get(f"https://rdap.org/{'ip' if kind == 'ip' else 'domain'}/{target}", timeout=10, follow_redirects=True)
        if r.status_code != 200:
            return {}
        d = r.json()
    except (httpx.HTTPError, ValueError):
        return {}
    events = {e.get("eventAction"): (e.get("eventDate") or "")[:10] for e in d.get("events", [])}

    def entity_name(roles):
        for e in d.get("entities", []):
            if set(roles) & set(e.get("roles", [])):
                for item in (e.get("vcardArray", [None, []])[1] or []):
                    if item and item[0] == "fn":
                        return item[3]
                return e.get("handle")
        return None

    if kind == "ip":
        return {"network": d.get("name"), "handle": d.get("handle"), "range": f"{d.get('startAddress')} – {d.get('endAddress')}" if d.get("startAddress") else None,
                "country": d.get("country"), "type": d.get("type"), "owner": entity_name(["registrant", "administrative"]), "registered": events.get("registration"), "updated": events.get("last changed")}
    return {"registrar": entity_name(["registrar"]), "created": events.get("registration"), "expires": events.get("expiration"), "updated": events.get("last changed"),
            "status": ", ".join(d.get("status", [])[:6]) or None, "nameservers": [ns.get("ldhName", "").lower() for ns in d.get("nameservers", [])]}


def ip_intel(client: httpx.Client, ip: str) -> dict:
    try:
        r = client.get(f"https://ipinfo.io/{ip}/json", timeout=8, headers=UA)
        r.raise_for_status()
        d = r.json()
        return {"ip": ip, "owner": d.get("org"), "hostname": d.get("hostname"), "city": d.get("city"), "region": d.get("region"), "country": d.get("country"), "loc": d.get("loc")}
    except (httpx.HTTPError, ValueError):
        return {"ip": ip}


def cert_transparency(client: httpx.Client, domain: str, limit: int = 100) -> list[str]:
    """Other sub-domains of this domain seen in public Certificate Transparency logs (crt.sh)."""
    try:
        r = client.get("https://crt.sh/", params={"q": f"%.{domain}", "output": "json"}, timeout=12, follow_redirects=True)
        if r.status_code != 200:
            return []
        names = set()
        for row in r.json():
            for n in (row.get("name_value") or "").split("\n"):
                n = n.strip().lower().lstrip("*.")
                if n.endswith(domain) and "@" not in n:
                    names.add(n)
        return sorted(names)[:limit]
    except (httpx.HTTPError, ValueError):
        return []


def investigate(ctx, target_raw: str) -> dict:
    """The passive workup. ctx.step(label) gives progress lines; returns the standard result dict."""
    from app.ops.actions import finding, kv, table, score_of, sort_findings, count_line

    with ctx.step("Checking the target") as s:
        kind, host, public_ips = normalize_target(target_raw)
        s["detail"] = f"{kind}: {host} → {', '.join(public_ips[:4])}"

    findings: list[dict] = []
    sections: list[dict] = []
    client = httpx.Client(headers=UA, timeout=10)
    try:
        dns = {"records": {}, "dnssec": False, "spf": None, "dmarc": None}
        if kind == "domain":
            dns = ctx.soft_step("Reading public DNS records (DNS-over-HTTPS)", lambda: dns_lookup(client, host)) or dns
            rec = dns["records"]
            sections.append(kv("DNS", [("A (IPv4)", ", ".join(rec.get("A", []))), ("AAAA (IPv6)", ", ".join(rec.get("AAAA", [])[:4])),
                                       ("Mail (MX)", ", ".join(m.split()[-1] for m in rec.get("MX", []))), ("Name servers", ", ".join(rec.get("NS", []))),
                                       ("CAA", ", ".join(rec.get("CAA", [])) or "none"), ("DNSSEC", "validated" if dns["dnssec"] else "not signed")]))
            if not dns["spf"]:
                findings.append(finding("medium", "No SPF record", "Without SPF, anyone can send email that claims to come from this domain.", "Add a TXT record 'v=spf1 ...' listing who may send mail for the domain."))
            else:
                findings.append(finding("ok", "SPF published", dns["spf"][:120]))
            if not dns["dmarc"]:
                findings.append(finding("medium", "No DMARC record", "Mailbox providers have no policy telling them to reject spoofed mail from this domain.", "Add a TXT record at _dmarc with 'v=DMARC1; p=quarantine' (or p=reject)."))
            elif re.search(r"p=\s*none", dns["dmarc"], re.I):
                findings.append(finding("low", "DMARC is monitor-only (p=none)", dns["dmarc"][:120], "Once your reports look clean, move to p=quarantine or p=reject to actually block spoofing."))
            else:
                findings.append(finding("ok", "DMARC enforced", dns["dmarc"][:120]))
            if not dns["dnssec"]:
                findings.append(finding("low", "DNSSEC not enabled", "DNS answers for this domain are not cryptographically signed, so they can be tampered with in transit.", "Enable DNSSEC at your DNS host and add the DS record at the registrar."))

        reg = ctx.soft_step("Looking up registration (RDAP / WHOIS)", lambda: rdap(client, kind, host)) or {}
        if kind == "domain" and reg:
            sections.append(kv("Domain registration", [("Registrar", reg.get("registrar")), ("Registered", reg.get("created")), ("Expires", reg.get("expires")),
                                                       ("Last changed", reg.get("updated")), ("Status", reg.get("status"))]))
            exp = reg.get("expires")
            if exp and exp < __import__("datetime").date.today().isoformat():
                findings.append(finding("high", "Domain registration has expired", f"Expiry date {exp}.", "Renew it immediately before someone else can register it."))

        intel_rows = []
        for ip in public_ips[:4]:
            info = ctx.soft_step(f"Owner, ASN and location of {ip}", lambda ip=ip: ip_intel(client, ip)) or {"ip": ip}
            intel_rows.append([ip, info.get("owner"), info.get("hostname"), ", ".join(filter(None, [info.get("city"), info.get("region"), info.get("country")]))])
        sections.append(table("IP addresses", ["IP", "Owner / ASN", "Reverse DNS", "Location (approx.)"], intel_rows))
        if kind == "ip":
            ipreg = reg or {}
            sections.append(kv("IP registration (RDAP)", [("Network", ipreg.get("network")), ("Range", ipreg.get("range")), ("Owner", ipreg.get("owner")),
                                                          ("Type", ipreg.get("type")), ("Country", ipreg.get("country")), ("Registered", ipreg.get("registered"))]))

        if kind == "domain":
            def tls_block():
                t = web.tls_info(host)
                findings.append(finding("ok" if t["days_left"] > 14 else "high", "HTTPS certificate" if t["days_left"] > 14 else "Certificate expires soon",
                                        f"Issued by {t['issuer']}, {t['version']}, valid until {t['expires']} ({t['days_left']} days).", "" if t["days_left"] > 14 else "Renew the certificate."))
                sections.append(kv("TLS certificate", [("Issuer", t["issuer"]), ("Subject", t["subject"]), ("Protocol", t["version"]), ("Cipher", t["cipher"]),
                                                       ("Valid until", t["expires"]), ("Also covers", ", ".join(t["sans"][:10]))]))
                return t
            ctx.soft_step("Reading the TLS certificate (one HTTPS connection)", tls_block)

            subs = ctx.soft_step("Finding other names in Certificate Transparency logs (crt.sh)", lambda: cert_transparency(client, host)) or []
            if subs:
                sections.append(table(f"Subdomains in public CT logs ({len(subs)})", ["Hostname"], [[s] for s in subs]))
                findings.append(finding("info", f"{len(subs)} subdomain(s) are publicly listed", "Every name a certificate was ever issued for is public. Make sure none are forgotten test or staging sites.", ""))

            hdr = ctx.soft_step("Reading public HTTP security headers (one visit)", lambda: web.website_check(f"https://{host}/", allow_private=False, step=_null_step()))
            if hdr:
                for f in hdr["findings"]:
                    if f["severity"] not in ("ok",):
                        findings.append(f)
    finally:
        client.close()

    sections.append({"title": "Scope", "type": "text", "text": "Passive public-records lookup only: DNS, RDAP/WHOIS, Certificate Transparency, the TLS certificate and public HTTP headers. "
                     "No ports were scanned and nothing on the target was accessed beyond one normal HTTPS visit. Active testing (port scans, vulnerability scans) is only for systems you own or are authorized to test."})
    summary = f"{host} · {len(public_ips)} IP(s)" + (f" · {reg.get('registrar')}" if kind == "domain" and reg.get("registrar") else "") + f" · {count_line(findings)}"
    return {"summary": summary, "score": score_of(findings) if any(f["severity"] != "info" for f in findings) else None, "findings": sort_findings(findings), "sections": sections}


class _null_step:
    """A step() stand-in so web.website_check can report progress into nothing when called inside another step."""
    def __call__(self, label):
        return self

    def __enter__(self):
        return {"status": "running", "detail": ""}

    def __exit__(self, *a):
        return False
