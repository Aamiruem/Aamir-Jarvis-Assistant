"""Checks for one project. Every number is measured now or read from the source named next to it;
a check that can't run says why (no key, rate-limited, unreachable) instead of guessing.

- site():      one GET of the live URL: status, time to first byte, total time, size, compression,
               caching, HTTP version, redirects; TLS certificate; security headers (graded like Cyber Ops).
- seo():       the HTML itself: title, description, canonical, robots, viewport, lang, h1, Open Graph,
               JSON-LD, image alt text, Google verification / GA4 tag, robots.txt, sitemap.xml, broken links.
- assets():    JavaScript / CSS / image weight the page asks for.
- api():       an API's health endpoint (JSON status).
- pagespeed(): Lighthouse scores + Core Web Vitals from Google PageSpeed Insights (lab) and CrUX (field).
- github():    repository facts and the latest GitHub Actions run (public API).
"""
from __future__ import annotations

import json
import re
import time
from concurrent.futures import ThreadPoolExecutor
from html.parser import HTMLParser
from urllib.parse import urljoin, urlsplit

import httpx

from app.config import settings

def _can_brotli() -> bool:
    try:
        import brotli  # noqa: F401
        return True
    except ImportError:
        try:
            import brotlicffi  # noqa: F401
            return True
        except ImportError:
            return False


# Only ask for brotli when httpx can decode it, or the "HTML" would be compressed bytes.
UA = {"User-Agent": "AzarvisProjectHQ/1.0 (+site owner health check)", "Accept": "text/html,application/xhtml+xml,application/json;q=0.9,*/*;q=0.8",
      "Accept-Encoding": "gzip, deflate, br" if _can_brotli() else "gzip, deflate"}


def _finding(sev, title, detail="", fix="", area=""):
    return {"severity": sev, "title": title, "detail": detail, "fix": fix, "area": area}


# ---------- the page fetch ----------

def fetch(url: str, timeout: float = 25) -> dict:
    """GET with timings. ttfb = until response headers arrived; total = until the body was read."""
    t0 = time.perf_counter()
    with httpx.Client(follow_redirects=True, timeout=timeout, headers=UA, http2=False) as c:
        with c.stream("GET", url) as r:
            ttfb = time.perf_counter() - t0
            body = r.read()
            total = time.perf_counter() - t0
            return {"url": str(r.url), "status": r.status_code, "ttfb_ms": round(ttfb * 1000), "total_ms": round(total * 1000),
                    "bytes": len(body), "headers": {k.lower(): v for k, v in r.headers.items()}, "http_version": r.http_version,
                    "redirects": [str(h.url) for h in r.history], "text": body.decode(r.encoding or "utf-8", errors="replace")[:2_000_000],
                    "cookies": r.headers.get_list("set-cookie")}


def site(url: str) -> dict:
    from app.ops import web_probe
    out: dict = {"url": url, "findings": []}
    try:
        page = fetch(url)
    except httpx.HTTPError as e:
        out.update(up=False, error=f"Unreachable: {type(e).__name__}: {e}"[:300])
        out["findings"].append(_finding("critical", "Site is down or unreachable", out["error"], "Check the hosting dashboard and recent deployments.", "uptime"))
        return out
    h = page["headers"]
    up = page["status"] < 400
    out.update(up=up, page=page, status=page["status"], ttfb_ms=page["ttfb_ms"], total_ms=page["total_ms"], bytes=page["bytes"],
               final_url=page["url"], redirects=page["redirects"], http_version=page["http_version"],
               compression=h.get("content-encoding"), cache_control=h.get("cache-control"), server="Vercel" if "x-vercel-id" in h else h.get("server"))
    if not up:
        out["findings"].append(_finding("critical", f"Homepage answers HTTP {page['status']}", "", "Open the deployment logs: the latest build or a route may be broken.", "uptime"))
    if page["status"] == 200 and page["ttfb_ms"] > 1800:
        out["findings"].append(_finding("medium", f"Slow first byte: {page['ttfb_ms']} ms", "Users wait this long before anything arrives (cold start, slow server-side rendering or region far from users).",
                                        "Cache the page at the edge, pre-render it, or keep the server warm.", "performance"))
    if page["bytes"] > 50_000 and not out["compression"]:
        out["findings"].append(_finding("medium", "HTML is sent uncompressed", f"{page['bytes'] // 1024} KB without gzip/brotli.", "Enable compression on the server or CDN.", "performance"))
    host = urlsplit(page["url"]).hostname or ""
    tls, tls_error = None, None
    if page["url"].startswith("https://"):
        try:
            tls = web_probe.tls_info(host)
        except Exception as e:  # noqa: BLE001 - any TLS failure is a finding
            tls_error = str(e)[:200]
    out["tls"] = tls
    https_redirect = None
    if url.startswith("https://"):
        try:
            r = httpx.get("http://" + url[len("https://"):], follow_redirects=False, timeout=10, headers=UA)
            https_redirect = r.status_code in (301, 302, 307, 308) and r.headers.get("location", "").startswith("https://")
        except httpx.HTTPError:
            https_redirect = None
    sec = web_probe.grade_headers(page["headers"], page["cookies"], https_redirect, tls, tls_error)
    for f in sec:
        f["area"] = "security"
    out["findings"] += sec
    return out


# ---------- SEO (pure parser + network extras) ----------

class _Page(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.title, self.lang, self.metas, self.links, self.jsonld = None, None, [], [], []
        self.h1 = 0
        self.imgs = self.imgs_no_alt = 0
        self.scripts, self.styles, self.anchors = [], [], []
        self._in_title = self._in_jsonld = False
        self._buf: list[str] = []
        self.text_len = 0
        self._skip = 0
        self._svg = 0  # <title> inside inline SVG is a chart label, not the page title

    def handle_starttag(self, tag, attrs):
        a = {k.lower(): (v or "") for k, v in attrs}
        if tag == "html":
            self.lang = a.get("lang") or None
        elif tag == "svg":
            self._svg += 1
        elif tag == "title" and not self._svg and self.title is None:
            self._in_title, self._buf = True, []
        elif tag == "meta":
            self.metas.append(a)
        elif tag == "link":
            self.links.append(a)
            if "stylesheet" in a.get("rel", "").lower() and a.get("href"):
                self.styles.append(a["href"])
        elif tag == "h1":
            self.h1 += 1
        elif tag == "img":
            self.imgs += 1
            if "alt" not in a:
                self.imgs_no_alt += 1
        elif tag == "script":
            self._skip += 1
            if a.get("type", "").lower() == "application/ld+json":
                self._in_jsonld, self._buf = True, []
            elif a.get("src"):
                self.scripts.append(a["src"])
        elif tag == "style":
            self._skip += 1
        elif tag == "a" and a.get("href"):
            self.anchors.append(a["href"])

    def handle_endtag(self, tag):
        if tag == "svg":
            self._svg = max(0, self._svg - 1)
        elif tag == "title" and self._in_title:
            self.title, self._in_title = "".join(self._buf).strip(), False
        elif tag == "script":
            if self._in_jsonld:
                self.jsonld.append("".join(self._buf))
                self._in_jsonld = False
            self._skip = max(0, self._skip - 1)
        elif tag == "style":
            self._skip = max(0, self._skip - 1)

    def handle_data(self, data):
        if self._in_title or self._in_jsonld:
            self._buf.append(data)
        elif not self._skip:
            self.text_len += len(data.strip())


def parse_html(html: str) -> _Page:
    p = _Page()
    try:
        p.feed(html)
    except Exception:  # noqa: BLE001 - malformed HTML still gives partial results
        pass
    return p


def _meta(p: _Page, key: str, attr: str = "name") -> str | None:
    for m in p.metas:
        if m.get(attr, "").lower() == key:
            return m.get("content")
    return None


GA4 = re.compile(r"\bG-[A-Z0-9]{6,12}\b")


def seo_from_html(html: str, url: str) -> dict:
    """Everything SEO that the HTML alone shows (pure, tested)."""
    p = parse_html(html)
    f = []
    title, desc = p.title, _meta(p, "description")
    canonical = next((l.get("href") for l in p.links if l.get("rel", "").lower() == "canonical"), None)
    robots = _meta(p, "robots") or ""
    og = {k: _meta(p, f"og:{k}", "property") for k in ("title", "description", "image", "url")}
    viewport = _meta(p, "viewport")
    verify = _meta(p, "google-site-verification")
    ga4 = sorted(set(GA4.findall(html)))
    types, bad_ld = [], 0
    for raw in p.jsonld:
        try:
            d = json.loads(raw)
            for item in d if isinstance(d, list) else d.get("@graph", [d]) if isinstance(d, dict) else []:
                t = item.get("@type") if isinstance(item, dict) else None
                types += t if isinstance(t, list) else [t] if t else []
        except ValueError:
            bad_ld += 1
    if not title:
        f.append(_finding("high", "No <title>", "Search results show the URL instead.", "Add a unique title of 30–60 characters.", "seo"))
    elif not 15 <= len(title) <= 65:
        f.append(_finding("low", f"Title is {len(title)} characters", f"“{title[:80]}”", "Aim for 30–60 characters so Google doesn't cut it.", "seo"))
    if not desc:
        f.append(_finding("medium", "No meta description", "Google writes its own snippet, often poorly.", "Add a 70–160 character description.", "seo"))
    elif not 50 <= len(desc) <= 170:
        f.append(_finding("low", f"Meta description is {len(desc)} characters", "", "Aim for 70–160 characters.", "seo"))
    if not canonical:
        f.append(_finding("low", "No canonical URL", "Duplicate URLs (with / without slash, query strings) can split ranking.", "Add <link rel=\"canonical\">.", "seo"))
    elif urlsplit(urljoin(url, canonical)).hostname != urlsplit(url).hostname:
        f.append(_finding("medium", "Canonical points to another domain", canonical, "Make sure this is intended: Google will index the other domain instead.", "seo"))
    if "noindex" in robots.lower():
        f.append(_finding("high", "Page is set to noindex", f"robots meta: {robots}", "Remove noindex if this page should appear on Google.", "seo"))
    if not viewport:
        f.append(_finding("high", "No viewport meta tag", "Phones show the desktop layout zoomed out.", "Add <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">.", "mobile"))
    if not p.lang:
        f.append(_finding("low", "No lang attribute on <html>", "Screen readers and search engines must guess the language.", "Add lang=\"en\" (or the page's language).", "accessibility"))
    if p.h1 == 0:
        f.append(_finding("low", "No <h1> in the HTML", "The main heading is missing or only added later by JavaScript.", "Render one descriptive h1.", "seo"))
    elif p.h1 > 1:
        f.append(_finding("info", f"{p.h1} <h1> headings", "", "One main heading per page is clearer.", "seo"))
    if not og["title"] or not og["image"]:
        f.append(_finding("low", "Open Graph tags incomplete", f"missing: {', '.join(k for k in ('title', 'image') if not og[k])}", "Add og:title, og:description and og:image for good link previews.", "seo"))
    if bad_ld:
        f.append(_finding("medium", f"{bad_ld} JSON-LD block(s) are not valid JSON", "", "Fix the structured data; Google ignores invalid blocks.", "seo"))
    if p.imgs_no_alt:
        f.append(_finding("low", f"{p.imgs_no_alt} of {p.imgs} images have no alt text", "", "Describe each image (alt=\"\" for decorative ones).", "accessibility"))
    if p.text_len < 200 and p.scripts:
        f.append(_finding("medium", "Almost no text in the HTML: content is rendered by JavaScript",
                          f"{p.text_len} characters of text before scripts run.", "Pre-render or server-render key pages so every crawler and link preview sees the content.", "seo"))
    return {
        "title": title, "description": desc, "canonical": canonical, "robots": robots or None, "viewport": bool(viewport), "lang": p.lang,
        "h1": p.h1, "og": og, "jsonld_types": [t for t in types if t][:10], "images": p.imgs, "images_no_alt": p.imgs_no_alt,
        "google_verification": bool(verify), "ga4_ids": ga4, "text_chars": p.text_len,
        "scripts": p.scripts, "styles": p.styles, "anchors": p.anchors, "findings": f,
    }


def seo(page: dict) -> dict:
    url, html = page["url"], page["text"]
    s = seo_from_html(html, url)
    base = f"{urlsplit(url).scheme}://{urlsplit(url).netloc}"
    with httpx.Client(timeout=12, headers=UA, follow_redirects=True) as c:
        try:
            r = c.get(base + "/robots.txt")
            robots_txt = r.text if r.status_code == 200 and "text/html" not in r.headers.get("content-type", "") else None
        except httpx.HTTPError:
            robots_txt = None
        sitemaps = re.findall(r"(?im)^\s*sitemap:\s*(\S+)", robots_txt or "") or [base + "/sitemap.xml"]
        sm_urls = None
        try:
            r = c.get(sitemaps[0])
            if r.status_code == 200 and ("<urlset" in r.text or "<sitemapindex" in r.text):
                sm_urls = len(re.findall(r"<loc>", r.text))
        except httpx.HTTPError:
            pass
        # Broken internal links (first 15 distinct same-site links).
        internal = []
        for a in s["anchors"]:
            u = urljoin(url, a).split("#")[0]
            if u.startswith(base) and u not in internal and u.rstrip("/") != url.rstrip("/"):
                internal.append(u)
        broken = []

        def probe(u):
            try:
                rr = c.head(u)
                if rr.status_code in (405, 501):
                    rr = c.get(u)
                return u, rr.status_code
            except httpx.HTTPError:
                return u, None

        with ThreadPoolExecutor(6) as pool:
            for u, code in pool.map(probe, internal[:15]):
                if code is None or code >= 400:
                    broken.append([u, code or "no answer"])
    f = s["findings"]
    if robots_txt is None:
        f.append(_finding("low", "No robots.txt", "", "Publish /robots.txt with a Sitemap: line.", "seo"))
    elif re.search(r"(?im)^\s*disallow:\s*/\s*$", robots_txt):
        f.append(_finding("high", "robots.txt blocks the whole site", "Disallow: /", "Allow crawling of public pages.", "seo"))
    if sm_urls is None:
        f.append(_finding("medium", "No XML sitemap found", sitemaps[0], "Publish a sitemap and submit it in Search Console.", "seo"))
    for u, code in broken:
        f.append(_finding("medium", f"Broken link: {u}", f"answers {code}", "Fix or remove the link.", "seo"))
    if not s["google_verification"]:
        f.append(_finding("info", "No Google Search Console verification tag", "Ownership may still be verified by DNS or a file.", "Add the google-site-verification meta tag (or verify by DNS).", "google"))
    if not s["ga4_ids"]:
        f.append(_finding("info", "No Google Analytics 4 tag in the page", "Visits aren't being measured (unless loaded later by a consent manager).", "Add the GA4 measurement ID.", "google"))
    s.update(robots_txt=robots_txt is not None, sitemap=sitemaps[0] if sm_urls is not None else None, sitemap_urls=sm_urls,
             links_checked=min(15, len(internal)), broken_links=broken)
    s["score"] = score(f)
    for k in ("anchors",):
        s.pop(k, None)
    return s


def assets(page: dict, scripts: list[str], styles: list[str]) -> dict:
    """Bytes of the JS and CSS the page loads (transfer size as served, compressed when the server compresses)."""
    url = page["url"]
    items = [("js", urljoin(url, s)) for s in scripts[:20]] + [("css", urljoin(url, s)) for s in styles[:10]]
    sizes = {"js": 0, "css": 0}
    count = {"js": 0, "css": 0}
    uncompressed = []
    with httpx.Client(timeout=15, headers=UA, follow_redirects=True) as c:
        def get(item):
            kind, u = item
            try:
                with c.stream("GET", u) as r:
                    raw = sum(len(chunk) for chunk in r.iter_raw())
                    return kind, u, raw, r.headers.get("content-encoding"), r.status_code
            except httpx.HTTPError:
                return kind, u, 0, None, None

        with ThreadPoolExecutor(6) as pool:
            for kind, u, n, enc, code in pool.map(get, items):
                if code and code < 400:
                    sizes[kind] += n
                    count[kind] += 1
                    if n > 30_000 and not enc:
                        uncompressed.append(u)
    f = []
    if sizes["js"] > 500_000:
        f.append(_finding("medium", f"{sizes['js'] // 1024} KB of JavaScript on the first page", "Phones on slow networks take seconds to download and run it.",
                          "Code-split routes and lazy-load heavy libraries.", "performance"))
    for u in uncompressed[:3]:
        f.append(_finding("low", "Asset served without compression", u, "Enable gzip/brotli.", "performance"))
    return {"js_kb": sizes["js"] // 1024, "css_kb": sizes["css"] // 1024, "js_files": count["js"], "css_files": count["css"], "findings": f}


# ---------- API ----------

def api(health_url: str) -> dict:
    t0 = time.perf_counter()
    try:
        r = httpx.get(health_url, timeout=20, headers={**UA, "Accept": "application/json"})
    except httpx.HTTPError as e:
        return {"up": False, "error": str(e)[:200], "findings": [_finding("critical", "API unreachable", str(e)[:200], "Check the API deployment and its logs.", "api")]}
    ms = round((time.perf_counter() - t0) * 1000)
    try:
        body = r.json()
    except ValueError:
        body = None
    f = []
    if r.status_code >= 500:
        f.append(_finding("critical", f"API health answers HTTP {r.status_code}", json.dumps(body)[:300] if body else r.text[:200], "Open the API logs: a dependency (database, AI service) may be down.", "api"))
    elif r.status_code >= 400:
        f.append(_finding("high", f"API health answers HTTP {r.status_code}", "", "Check the health route path.", "api"))
    down = [k for k, v in (body or {}).items() if isinstance(v, str) and v.lower() in ("down", "error", "unavailable", "fail", "failed")] if isinstance(body, dict) else []
    for k in down:
        f.append(_finding("high", f"API reports '{k}' is {body[k]}", "", f"Fix the {k} dependency.", "api"))
    if ms > 2500:
        f.append(_finding("medium", f"API health took {ms} ms", "", "Cold starts or a slow dependency.", "api"))
    return {"up": r.status_code < 500, "status": r.status_code, "ms": ms, "body": body if isinstance(body, dict) else None, "findings": f}


# ---------- Lighthouse via PageSpeed Insights ----------

PSI = "https://www.googleapis.com/pagespeedonline/v5/runPagespeed"


def parse_psi(d: dict) -> dict:
    lr = d.get("lighthouseResult") or {}
    cats = {k: round((v.get("score") or 0) * 100) for k, v in (lr.get("categories") or {}).items() if v.get("score") is not None}
    au = lr.get("audits") or {}
    lab = {k: (au.get(a) or {}).get("displayValue") for k, a in (("lcp", "largest-contentful-paint"), ("cls", "cumulative-layout-shift"), ("tbt", "total-blocking-time"),
                                                               ("fcp", "first-contentful-paint"), ("ttfb", "server-response-time"), ("si", "speed-index"))}
    le = (d.get("loadingExperience") or {}).get("metrics") or {}
    field = {k: {"p75": (le.get(m) or {}).get("percentile"), "category": (le.get(m) or {}).get("category")}
             for k, m in (("lcp", "LARGEST_CONTENTFUL_PAINT_MS"), ("inp", "INTERACTION_TO_NEXT_PAINT"), ("cls", "CUMULATIVE_LAYOUT_SHIFT_SCORE"), ("ttfb", "EXPERIMENTAL_TIME_TO_FIRST_BYTE"))
             if le.get(m)}
    return {"scores": cats, "lab": lab, "field": field or None, "fetched": lr.get("fetchTime")}


def pagespeed(url: str, strategy: str = "mobile") -> dict:
    params = [("url", url), ("strategy", strategy)] + [("category", c) for c in ("performance", "accessibility", "best-practices", "seo")]
    if settings.pagespeed_api_key:
        params.append(("key", settings.pagespeed_api_key))
    try:
        r = httpx.get(PSI, params=params, timeout=120)
    except httpx.HTTPError as e:
        return {"error": f"PageSpeed Insights unreachable: {e}"[:200]}
    if r.status_code == 429:
        return {"error": "Google's shared PageSpeed quota is used up. Add a free PAGESPEED_API_KEY (Google Cloud → APIs → PageSpeed Insights API) to .env.", "needs_key": True}
    if r.status_code >= 400:
        try:
            msg = r.json()["error"]["message"]
        except (ValueError, KeyError, TypeError):
            msg = f"HTTP {r.status_code}"
        return {"error": f"PageSpeed Insights: {msg}"[:300]}
    out = parse_psi(r.json())
    f = []
    sc = out["scores"]
    if sc.get("performance") is not None and sc["performance"] < 50:
        f.append(_finding("high", f"Lighthouse performance {sc['performance']}/100 ({strategy})", f"LCP {out['lab']['lcp']}, TBT {out['lab']['tbt']}, CLS {out['lab']['cls']}", "Reduce JavaScript, optimise the largest image, preload the main font.", "performance"))
    elif sc.get("performance") is not None and sc["performance"] < 90:
        f.append(_finding("medium", f"Lighthouse performance {sc['performance']}/100 ({strategy})", f"LCP {out['lab']['lcp']}, TBT {out['lab']['tbt']}", "See the Lighthouse opportunities in PageSpeed Insights.", "performance"))
    if sc.get("accessibility") is not None and sc["accessibility"] < 90:
        f.append(_finding("medium", f"Lighthouse accessibility {sc['accessibility']}/100", "", "Fix contrast, labels and alt text it lists.", "accessibility"))
    for k, v in (out["field"] or {}).items():
        if v.get("category") == "SLOW":
            f.append(_finding("high", f"Real users: {k.upper()} is poor (p75 {v['p75']})", "Chrome UX Report, last 28 days.", "", "performance"))
    out["findings"] = f
    out["strategy"] = strategy
    return out


# ---------- GitHub ----------

def github(repo: str) -> dict:
    headers = {"Accept": "application/vnd.github+json", "User-Agent": "AzarvisProjectHQ"}
    if settings.github_token:
        headers["Authorization"] = f"Bearer {settings.github_token}"
    with httpx.Client(base_url="https://api.github.com", headers=headers, timeout=15) as c:
        try:
            r = c.get(f"/repos/{repo}")
        except httpx.HTTPError as e:
            return {"error": f"GitHub unreachable: {e}"[:200]}
        if r.status_code == 403 and r.headers.get("x-ratelimit-remaining") == "0":
            return {"error": "GitHub's hourly limit for unauthenticated requests is used up. Add GITHUB_TOKEN (read-only) to raise it."}
        if r.status_code == 404:
            return {"error": "Repository not found or private (add GITHUB_TOKEN with read access for private repos)."}
        if r.status_code >= 400:
            return {"error": f"GitHub answered HTTP {r.status_code}"}
        d = r.json()
        out = {"full_name": d.get("full_name"), "url": d.get("html_url"), "private": d.get("private"), "default_branch": d.get("default_branch"),
               "language": d.get("language"), "stars": d.get("stargazers_count"), "open_issues": d.get("open_issues_count"), "pushed_at": d.get("pushed_at"),
               "archived": d.get("archived"), "homepage": d.get("homepage") or None, "ci": None, "findings": []}
        try:
            runs = c.get(f"/repos/{repo}/actions/runs", params={"per_page": 1, "branch": d.get("default_branch")})
            run = ((runs.json() if runs.status_code == 200 else {}).get("workflow_runs") or [None])[0]
        except (httpx.HTTPError, ValueError):
            run = None
        if run:
            out["ci"] = {"name": run.get("name"), "status": run.get("status"), "conclusion": run.get("conclusion"), "url": run.get("html_url"), "at": run.get("updated_at"),
                         "commit": (run.get("head_commit") or {}).get("message", "").split("\n")[0][:120]}
            if run.get("conclusion") in ("failure", "timed_out", "startup_failure"):
                out["findings"].append(_finding("high", f"CI is failing: {run.get('name')}", out["ci"]["commit"], "Open the run, fix the failing job, push again.", "ci"))
    return out


# ---------- scoring ----------

PENALTY = {"critical": 30, "high": 12, "medium": 6, "low": 2, "info": 0}


def score(findings: list[dict]) -> int:
    return max(0, 100 - sum(PENALTY.get(f["severity"], 0) for f in findings))
