"""Website security check (passive) and internet speed test.

The website check only does what a browser does on a normal visit: one HTTPS request (plus the
plain-HTTP one to see if it redirects), the TLS certificate, the response headers and cookies, and
/.well-known/security.txt. No crawling, no attack payloads, no login attempts, so it is safe to run
against any public site; findings are mapped to the OWASP Top 10 (2021) categories they relate to.
Addresses inside private networks are refused unless Azarvis runs on this PC (no server-side SSRF).
"""
from __future__ import annotations

import ipaddress
import socket
import ssl
import statistics
import time
from datetime import datetime, timezone
from urllib.parse import urlsplit

import httpx

UA = {"User-Agent": "Azarvis-SecurityCheck/1.0 (passive header and TLS review)"}

OWASP = {
    "A02": "A02:2021 Cryptographic Failures",
    "A05": "A05:2021 Security Misconfiguration",
    "A06": "A06:2021 Vulnerable and Outdated Components",
    "A07": "A07:2021 Identification and Authentication Failures",
}


def normalize_url(raw: str) -> str:
    raw = (raw or "").strip()
    if not raw:
        raise ValueError("Enter a website address, e.g. example.com")
    if "://" not in raw:
        raw = "https://" + raw
    parts = urlsplit(raw)
    if parts.scheme not in ("http", "https") or not parts.hostname:
        raise ValueError("Only http:// and https:// website addresses can be checked.")
    return f"https://{parts.netloc}{parts.path or '/'}"


def check_target_allowed(host: str, allow_private: bool) -> list[str]:
    """Resolve the host; refuse link-local (cloud metadata) always and private ranges on a server."""
    try:
        addrs = sorted({ai[4][0] for ai in socket.getaddrinfo(host, 443, proto=socket.IPPROTO_TCP)})
    except socket.gaierror:
        raise ValueError(f"{host} does not resolve: check the spelling.")
    for a in addrs:
        ip = ipaddress.ip_address(a)
        if ip.is_link_local or ip.is_multicast or ip.is_unspecified:
            raise ValueError("That address is not a website.")
        if (ip.is_private or ip.is_loopback) and not allow_private:
            raise ValueError("Private network addresses can only be checked from Azarvis on your own PC.")
    return addrs


def tls_info(host: str, port: int = 443) -> dict:
    ctx = ssl.create_default_context()
    with socket.create_connection((host, port), timeout=8) as sock:
        with ctx.wrap_socket(sock, server_hostname=host) as tls:
            cert = tls.getpeercert()
            version = tls.version()
            cipher = tls.cipher()
    not_after = datetime.strptime(cert["notAfter"], "%b %d %H:%M:%S %Y %Z").replace(tzinfo=timezone.utc)
    issuer = dict(x[0] for x in cert.get("issuer", []))
    subject = dict(x[0] for x in cert.get("subject", []))
    sans = [v for k, v in cert.get("subjectAltName", []) if k == "DNS"]
    return {
        "version": version, "cipher": cipher[0] if cipher else None, "issuer": issuer.get("organizationName") or issuer.get("commonName"),
        "subject": subject.get("commonName"), "sans": sans[:12], "expires": not_after.date().isoformat(),
        "days_left": (not_after - datetime.now(timezone.utc)).days,
    }


def grade_headers(headers: dict, cookies: list[str], https_redirect: bool | None, tls: dict | None, tls_error: str | None) -> list[dict]:
    """Findings for one site from its headers, cookies, redirect and TLS (pure: easy to test)."""
    h = {k.lower(): v for k, v in headers.items()}
    f = []

    def add(sev, title, detail, fix="", owasp=None):
        f.append({"severity": sev, "title": title, "detail": detail, "fix": fix, "owasp": OWASP.get(owasp) if owasp else None})

    if tls_error:
        add("critical", "HTTPS certificate problem", tls_error, "Install a valid certificate (e.g. free from Let's Encrypt) for this exact host name.", "A02")
    elif tls:
        if tls["days_left"] < 0:
            add("critical", "Certificate expired", f"It expired on {tls['expires']}.", "Renew the certificate now.", "A02")
        elif tls["days_left"] < 14:
            add("high", "Certificate expires soon", f"{tls['days_left']} days left (until {tls['expires']}).", "Renew it, or turn on automatic renewal.", "A02")
        else:
            add("ok", "Valid HTTPS certificate", f"Issued by {tls['issuer']}, valid until {tls['expires']} ({tls['days_left']} days).")
        if tls["version"] in ("TLSv1", "TLSv1.1", "SSLv3"):
            add("high", f"Outdated {tls['version']}", "Old TLS versions have known weaknesses.", "Allow only TLS 1.2 and 1.3.", "A02")
        else:
            add("ok", f"Modern encryption ({tls['version']})", f"Cipher {tls['cipher']}.")
    if https_redirect is False:
        add("medium", "Plain HTTP is not redirected to HTTPS", "Visitors who type the address without https:// stay on an unencrypted page.", "Redirect every http:// request to https:// (301).", "A02")
    elif https_redirect:
        add("ok", "HTTP redirects to HTTPS", "Unencrypted visits are sent to the secure site.")

    hsts = h.get("strict-transport-security")
    if not hsts:
        add("medium", "No HSTS header", "Browsers may still try plain HTTP first, which can be intercepted on public Wi-Fi.", "Add: Strict-Transport-Security: max-age=31536000; includeSubDomains", "A05")
    else:
        try:
            age = int(next((p.split("=")[1] for p in hsts.split(";") if p.strip().lower().startswith("max-age")), "0"))
        except ValueError:
            age = 0
        add("ok" if age >= 15552000 else "low", "HSTS enabled" if age >= 15552000 else "HSTS max-age is short", hsts, "" if age >= 15552000 else "Use max-age of at least 6 months (15552000).")

    csp = h.get("content-security-policy")
    if not csp:
        add("medium", "No Content-Security-Policy", "Without a CSP, an injected script (XSS) can run freely.", "Start with: Content-Security-Policy: default-src 'self'; then allow the sources you need.", "A05")
    elif "unsafe-inline" in csp and "script-src" in csp and "nonce-" not in csp and "strict-dynamic" not in csp:
        add("low", "CSP allows inline scripts", "'unsafe-inline' in script-src weakens XSS protection.", "Use nonces or hashes instead of 'unsafe-inline'.", "A05")
    else:
        add("ok", "Content-Security-Policy set", csp[:160])

    if not h.get("x-frame-options") and "frame-ancestors" not in (csp or ""):
        add("low", "Page can be framed (clickjacking)", "No X-Frame-Options or CSP frame-ancestors.", "Add: X-Frame-Options: DENY (or CSP frame-ancestors 'self').", "A05")
    if (h.get("x-content-type-options") or "").lower() != "nosniff":
        add("low", "Missing X-Content-Type-Options", "Browsers may guess file types, which can turn an upload into a script.", "Add: X-Content-Type-Options: nosniff", "A05")
    if not h.get("referrer-policy"):
        add("info", "No Referrer-Policy", "Full page addresses may leak to other sites in the Referer header.", "Add: Referrer-Policy: strict-origin-when-cross-origin", "A05")
    if not h.get("permissions-policy"):
        add("info", "No Permissions-Policy", "The page doesn't say which browser features (camera, location…) it never needs.", "Add e.g. Permissions-Policy: camera=(), microphone=(), geolocation=()", "A05")

    server = h.get("server", "")
    powered = h.get("x-powered-by", "")
    if any(ch.isdigit() for ch in server) or powered:
        add("low", "Server software version is advertised", f"{('Server: ' + server) if server else ''} {('X-Powered-By: ' + powered) if powered else ''}".strip(), "Hide version numbers so attackers can't look up matching exploits.", "A06")

    for c in cookies:
        name = c.split("=", 1)[0].strip()
        low = c.lower()
        missing = [flag for flag, ok in (("Secure", "secure" in low), ("HttpOnly", "httponly" in low), ("SameSite", "samesite" in low)) if not ok]
        if missing:
            looks_session = any(k in name.lower() for k in ("sess", "auth", "token", "sid", "login", "jwt"))
            add("medium" if looks_session else "low", f"Cookie '{name}' lacks {', '.join(missing)}", "Session cookies without these flags are easier to steal or misuse.", "Set cookies with Secure; HttpOnly; SameSite=Lax (or Strict).", "A07" if looks_session else "A05")
    return f


def website_check(url: str, allow_private: bool, step) -> dict:
    """step(label) is a context manager from the job (progress lines)."""
    url = normalize_url(url)
    host = urlsplit(url).hostname
    with step(f"Resolving {host}") as s:
        addrs = check_target_allowed(host, allow_private)
        s["detail"] = ", ".join(addrs[:4])
    tls, tls_error = None, None
    with step("Checking the HTTPS certificate") as s:
        try:
            tls = tls_info(host)
            s["detail"] = f"{tls['version']}, expires {tls['expires']}"
        except ssl.SSLCertVerificationError as e:
            tls_error = e.verify_message or str(e)
        except (OSError, ssl.SSLError) as e:
            tls_error = f"HTTPS did not connect: {e}"
    headers, cookies, status, final = {}, [], None, url
    with step("Reading the response headers") as s:
        with httpx.Client(headers=UA, timeout=12, follow_redirects=True, verify=tls_error is None) as c:
            r = c.get(url)
            headers, status, final = dict(r.headers), r.status_code, str(r.url)
            cookies = r.headers.get_list("set-cookie")
        s["detail"] = f"HTTP {status}"
    https_redirect = None
    with step("Checking that http:// redirects to https://") as s:
        try:
            r = httpx.get(f"http://{urlsplit(url).netloc}/", headers=UA, timeout=8, follow_redirects=False)
            loc = r.headers.get("location", "")
            https_redirect = r.status_code in (301, 302, 307, 308) and loc.startswith("https://")
            s["detail"] = f"HTTP {r.status_code} → {loc or '(no redirect)'}"
        except httpx.HTTPError as e:
            s["detail"] = f"Plain HTTP not reachable ({type(e).__name__}): fine if the site is HTTPS-only."
    sec_txt = None
    with step("Looking for /.well-known/security.txt") as s:
        try:
            r = httpx.get(f"https://{urlsplit(url).netloc}/.well-known/security.txt", headers=UA, timeout=6, verify=tls_error is None)
            sec_txt = r.status_code == 200 and "contact:" in r.text.lower()
        except httpx.HTTPError:
            sec_txt = False
        s["detail"] = "found" if sec_txt else "not found"
    findings = grade_headers(headers, cookies, https_redirect, tls, tls_error)
    if not sec_txt:
        findings.append({"severity": "info", "title": "No security.txt", "detail": "Researchers who find a problem have no published way to report it.", "fix": "Publish /.well-known/security.txt with a Contact: line (RFC 9116).", "owasp": None})
    interesting = ["strict-transport-security", "content-security-policy", "x-frame-options", "x-content-type-options", "referrer-policy", "permissions-policy", "server", "x-powered-by"]
    return {
        "url": final, "status": status, "addresses": addrs, "tls": tls, "tls_error": tls_error,
        "headers": {k: v for k, v in headers.items() if k.lower() in interesting}, "cookies": len(cookies),
        "findings": findings,
    }


# ---------- speed ----------

SPEED_HOST = "https://speed.cloudflare.com"


def speed_test(step, check, seconds: float = 8.0) -> dict:
    """Latency, download and upload against Cloudflare's public speed test servers."""
    with httpx.Client(timeout=20, headers=UA) as c:
        with step("Measuring latency (10 pings)") as s:
            times = []
            for _ in range(10):
                check()
                t = time.perf_counter()
                c.get(f"{SPEED_HOST}/__down", params={"bytes": 0})
                times.append((time.perf_counter() - t) * 1000)
            latency = statistics.median(times)
            jitter = statistics.mean(abs(a - b) for a, b in zip(times, times[1:]))
            s["detail"] = f"{latency:.0f} ms (jitter {jitter:.0f} ms)"
        with step("Measuring download speed") as s:
            got, t0 = 0, time.perf_counter()
            while time.perf_counter() - t0 < seconds:
                check()
                with c.stream("GET", f"{SPEED_HOST}/__down", params={"bytes": 25_000_000}) as r:
                    for chunk in r.iter_bytes(65536):
                        got += len(chunk)
                        if time.perf_counter() - t0 > seconds:
                            break
            down = got * 8 / (time.perf_counter() - t0) / 1e6
            s["detail"] = f"{down:.1f} Mbps ({got / 1e6:.0f} MB)"
        with step("Measuring upload speed") as s:
            blob = b"0" * 4_000_000
            sent, t0 = 0, time.perf_counter()
            while time.perf_counter() - t0 < seconds * 0.75:
                check()
                c.post(f"{SPEED_HOST}/__up", content=blob)
                sent += len(blob)
            up = sent * 8 / (time.perf_counter() - t0) / 1e6
            s["detail"] = f"{up:.1f} Mbps ({sent / 1e6:.0f} MB)"
    return {"latency_ms": round(latency, 1), "jitter_ms": round(jitter, 1), "download_mbps": round(down, 1), "upload_mbps": round(up, 1), "server": "speed.cloudflare.com"}
