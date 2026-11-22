"""The universal command: "JARVIS, solve this problem" → the fastest real workflow.

route(text) recognises requests one quick action answers directly (seconds, no AI model needed)
and pulls out the target: a domain, IP, URL, CVE id or folder. Anything else is a multi-step
problem for the agent team (the orchestrator plans, runs agents in parallel and verifies).
"""
from __future__ import annotations

import re

DOMAIN = r"(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}"
IPV4 = r"\b(?:\d{1,3}\.){3}\d{1,3}\b"

# (action, pattern) in priority order: the first match wins.
ROUTES: list[tuple[str, str]] = [
    ("cve", r"\bcve-\d{4}-\d{4,}\b|\b(cve|vulnerabilit(y|ies))\b.*\b(for|in|of|about)\b\s+(?!my\b)[a-z]"),
    ("deps", r"\b(dependenc|packages?|npm|pip|libraries)\b.*\b(vulnerab|cve|outdated|insecure|security)|\b(vulnerab|cve)\w*\b.*\b(dependenc|packages|libraries)"),
    ("code_audit", r"\b(audit|review|scan|check)\b.*\b(my |the )?(code|repo|repository|project|source)\b|\b(secrets?|api keys?)\b.*\b(code|repo|leak)"),
    ("traceroute", r"\btrace ?route\b|\btracert\b|\b(path|route|hops)\b.*\bto\b"),
    ("investigate", r"\b(investigate|whois|rdap|dns records?|subdomains?|who (owns|hosts)|ownership|asn)\b"),
    ("website", r"\b(website|web ?site|site|web app)\b.*\b(security|secure|headers|ssl|tls|https|owasp)\b|\b(scan|check|test)\b.*https?://"),
    ("netfix", r"\b(no|lost|losing|bad|slow|unstable|keeps? (dropping|disconnecting))\b.*\b(internet|wi-?fi|connection|network|dns)\b|\b(internet|wi-?fi|dns|network)\b.*\b(not working|down|broken|slow|drops|disconnect|problem|issue)\b|\bfix (my )?(internet|wi-?fi|network|dns)\b|\bpacket loss\b|\blatency\b"),
    ("speed", r"\b(speed ?test|internet speed|bandwidth|download speed|upload speed)\b"),
    ("connections", r"\b(who|what) is (my )?(pc|computer|laptop) (talking|connecting|connected) to\b|\b(live )?connections\b|\btraffic\b|\bpacket"),
    ("network", r"\b(security )?audit\b.*\bnetwork\b|\bscan (my |the |our )?(authori[sz]ed |local |home |office )?(network|subnet|lan)\b|\bnetwork (security|audit|vulnerab)"),
    ("devices", r"\b(find|discover|scan|list|show)\b.*\b(devices?|phones?|tvs?|printers?|cameras?|electronics|gadgets)\b|\bnearby devices\b|\bwho is on my (wi-?fi|network)\b"),
    ("bluetooth", r"\bbluetooth\b|\bble\b"),
    ("wifi", r"\bwi-?fi\b.*\b(security|secure|encryption|password strength|wpa)\b|\bevil twin\b"),
    ("ports", r"\bopen ports?\b|\blistening\b|\bports?\b.*\b(open|exposed)\b"),
    ("ip", r"\b(my|what'?s my|public|local) ip\b|\bip address\b"),
    ("emergency", r"\bemergency\b|\bblue ?screen\b|\bbsod\b|\bcrash(ing|es|ed)?\b|\bfreez(e|es|ing)\b|\bnot responding\b"),
    ("files", r"\b(malware|virus|trojan|suspicious|infected|ransomware)\b|\bis (this|the) file safe\b"),
    ("disk", r"\b(disk|drive|ssd|hdd|storage)\b.*\b(health|space|full|smart|failing)\b|\bdisk (health|space)\b"),
    ("cpu_ram", r"\b(cpu|ram|memory|processor)\b.*\b(usage|use|load|high|full|check)\b"),
    ("hardware", r"\bhardware\b|\b(gpu|graphics card|battery health|drivers?|specs|specifications)\b"),
    ("report", r"\b(security|full|complete|cyber ?security) report\b"),
    ("security", r"\b(system|pc|laptop|computer|windows) security\b|\b(check|audit) (my )?(pc|laptop|computer|system)'?s? security\b|\bdefender\b|\bfirewall\b|\bantivirus\b"),
    ("toolbox", r"\b(nmap|wireshark|metasploit|burp|zap|trivy|semgrep|gitleaks|yara|nikto|sqlmap|security tools?|toolbox)\b"),
    ("laptop", r"\b(analy[sz]e|scan|check|diagnose)\b.*\b(my |the |entire )?(laptop|computer|pc|device|system)\b|\b(slow|lag(gy|ging)?|optimi[sz]e|speed up)\b"),
]
_RX = [(a, re.compile(p, re.I)) for a, p in ROUTES]
MULTI = re.compile(r"\b(and then|then|after that|also|build|create|write|develop|fix (the|my|this) (code|app|bug)|repair my app|research|explain why|compare|plan)\b", re.I)


def extract(text: str) -> dict:
    out = {}
    if m := re.search(r"\bCVE-\d{4}-\d{4,}\b", text, re.I):
        out["query"] = m.group(0).upper()
    if m := re.search(r"https?://\S+", text):
        out["url"] = m.group(0).rstrip(".,)")
    if m := re.search(IPV4, text):
        out["target"] = m.group(0)
    elif m := re.search(DOMAIN, text.lower()):
        if not re.fullmatch(r"(e\.g|i\.e|etc)\.?", m.group(0)):
            out["target"] = m.group(0)
    if m := re.search(r"[A-Za-z]:\\[^\"<>|?*\n]+", text):
        out["path"] = m.group(0).strip().rstrip(".")
    return out


def route(text: str) -> dict:
    """{mode: 'action', action, params, missing} or {mode: 'agents', reason}."""
    from app.ops.actions import ACTIONS
    t = (text or "").strip()
    t = re.sub(r"^(hey |ok |hi )?(jarvis|azarvis)[,:!]?\s*", "", t, flags=re.I)
    if not t:
        return {"mode": "agents", "reason": "empty"}
    hits = [a for a, rx in _RX if rx.search(t)]
    if not hits or (MULTI.search(t) and len(t.split()) > 9 and len(set(hits)) != 1) or len(set(hits)) > 2:
        return {"mode": "agents", "reason": "multi-step or open problem: the agent team plans it", "candidates": hits[:3]}
    action = hits[0]
    ex = extract(t)
    meta = ACTIONS[action]
    params: dict = {}
    missing = None
    kind = meta.get("input")
    if kind == "url":
        params["url"] = ex.get("url") or ex.get("target") or ""
        missing = None if params["url"] else "url"
    elif kind == "target":
        params["target"] = ex.get("target") or (ex.get("url") and re.sub(r"^https?://", "", ex["url"]).split("/")[0]) or ""
        missing = None if params["target"] else "target"
    elif kind == "query":
        q = ex.get("query") or re.sub(r"^.*?\b(?:cves?|vulnerabilit(?:y|ies))\b\s*(?:for|in|of|about)?\s*", "", t, flags=re.I).strip(" ?.")
        params["query"] = q
        missing = None if q else "query"
    elif kind in ("path", "folder") and ex.get("path"):
        params["path"] = ex["path"]
    return {"mode": "action", "action": action, "title": meta["title"], "params": params, "missing": missing, "consent": bool(meta.get("consent"))}
