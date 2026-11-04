"""Read a public web page into plain text, for the knowledge base ("Add a web page").

Safety: only http(s), never an address on this computer or the local network (so a link can't be
used to reach the router, other PCs or Jarvis's own services), every redirect is checked the same
way, and pages are size- and time-limited.
"""
import html as htmllib
import ipaddress
import re
import socket
from html.parser import HTMLParser
from urllib.parse import urljoin, urlparse

import httpx

MAX_BYTES = 5 * 1024 * 1024
MAX_REDIRECTS = 5
TIMEOUT = 15
HEADERS = {"User-Agent": "Mozilla/5.0 (compatible; JarvisAssistant/1.0; +https://github.com/Aamiruem)"}


class PageError(ValueError):
    pass


def check_url(url: str) -> str:
    parsed = urlparse(url.strip())
    if parsed.scheme not in ("http", "https") or not parsed.hostname:
        raise PageError("Use a full web address starting with http:// or https://")
    try:
        infos = socket.getaddrinfo(parsed.hostname, parsed.port or (443 if parsed.scheme == "https" else 80))
    except socket.gaierror:
        raise PageError(f"Can't find the website {parsed.hostname}.")
    for info in infos:
        ip = ipaddress.ip_address(info[4][0])
        if ip.is_private or ip.is_loopback or ip.is_link_local or ip.is_reserved or ip.is_multicast or ip.is_unspecified:
            raise PageError("That address is on this computer or the local network; only public websites can be added.")
    return url.strip()


class _Text(HTMLParser):
    SKIP = {"script", "style", "noscript", "svg", "template", "iframe"}
    BLOCK = {"p", "div", "section", "article", "li", "h1", "h2", "h3", "h4", "h5", "h6", "br", "tr", "header", "footer", "main", "pre", "blockquote"}

    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.parts: list[str] = []
        self.skip = 0
        self.title = ""
        self._in_title = False

    def handle_starttag(self, tag, attrs):
        if tag in self.SKIP:
            self.skip += 1
        elif tag == "title" and not self.skip and not self.title:  # the page title, not an SVG's
            self._in_title = True
        if tag in self.BLOCK:
            self.parts.append("\n")

    def handle_endtag(self, tag):
        if tag in self.SKIP and self.skip:
            self.skip -= 1
        elif tag == "title":
            self._in_title = False
        if tag in self.BLOCK:
            self.parts.append("\n")

    def handle_data(self, data):
        if self._in_title:
            self.title += data
        elif not self.skip:
            self.parts.append(data)


def html_to_text(page: str) -> tuple[str, str]:
    """(title, readable text) of an HTML page."""
    p = _Text()
    p.feed(page)
    text = re.sub(r"[ \t\r\f\v]+", " ", "".join(p.parts))
    text = re.sub(r"\n\s*\n+", "\n\n", text).strip()
    desc = re.search(r'<meta[^>]+name=["\']description["\'][^>]+content=["\']([^"\']*)', page, re.I)
    if desc:
        text = htmllib.unescape(desc.group(1)).strip() + "\n\n" + text
    return htmllib.unescape(p.title).strip(), text


def fetch_page(url: str) -> dict:
    """{"url", "title", "text"} of a public page (follows up to 5 redirects, each one checked)."""
    current = check_url(url)
    with httpx.Client(timeout=TIMEOUT, headers=HEADERS, follow_redirects=False) as client:
        for _ in range(MAX_REDIRECTS + 1):
            with client.stream("GET", current) as r:
                if r.is_redirect:
                    current = check_url(urljoin(current, r.headers.get("location", "")))
                    continue
                if r.status_code >= 400:
                    raise PageError(f"The website answered {r.status_code}.")
                kind = r.headers.get("content-type", "")
                if not any(t in kind for t in ("text/html", "text/plain", "application/xhtml")):
                    raise PageError("That link isn't a web page (for PDFs, download the file and upload it).")
                body = b""
                for chunk in r.iter_bytes():
                    body += chunk
                    if len(body) > MAX_BYTES:
                        raise PageError("That page is too large (5 MB max).")
                page = body.decode(r.encoding or "utf-8", errors="replace")
                break
        else:
            raise PageError("Too many redirects.")
    if "text/plain" in kind:
        title, text = urlparse(current).path.rsplit("/", 1)[-1] or current, page
    else:
        title, text = html_to_text(page)
    if len(text) < 50:
        raise PageError("That page has almost no readable text (it may need JavaScript to show its content).")
    return {"url": current, "title": (title or urlparse(current).hostname)[:200], "text": text[:500_000]}
