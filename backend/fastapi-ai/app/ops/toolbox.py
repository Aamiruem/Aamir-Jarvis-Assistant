"""The professional security tools on this PC, and the Nmap adapter.

detect() finds which tools are installed (PATH and their usual Windows folders) and their versions.
Jarvis drives the ones that inspect *your own* systems: Nmap (service versions in the authorized
network audit), Bandit (code audit), Semgrep/Trivy/Gitleaks when present. Exploitation and
brute-force tools (Metasploit, SQLMap, Masscan, Nikto) are listed but never run by Jarvis: they
belong in a lab you control, operated by you.
"""
from __future__ import annotations

import os
import re
import shutil
import subprocess
import sys
import xml.etree.ElementTree as ET
from pathlib import Path

PF = [os.environ.get("ProgramFiles", r"C:\Program Files"), os.environ.get("ProgramFiles(x86)", r"C:\Program Files (x86)")]

TOOLS: list[dict] = [
    {"id": "nmap", "name": "Nmap", "exe": "nmap", "dirs": ["Nmap"], "ver": ["--version"], "use": "Service and version detection in 'Scan authorized network'.", "driven": True, "url": "https://nmap.org/download"},
    {"id": "bandit", "name": "Bandit", "python": "bandit", "use": "Python security linting in 'Audit my code'.", "driven": True, "url": "https://bandit.readthedocs.io (pip install bandit)"},
    {"id": "semgrep", "name": "Semgrep", "exe": "semgrep", "ver": ["--version"], "use": "Multi-language code rules (not yet wired; detected only).", "driven": False, "url": "https://semgrep.dev"},
    {"id": "trivy", "name": "Trivy", "exe": "trivy", "ver": ["--version"], "use": "Container/IaC scanning (dependency CVEs already covered via OSV.dev).", "driven": False, "url": "https://trivy.dev"},
    {"id": "gitleaks", "name": "Gitleaks", "exe": "gitleaks", "ver": ["version"], "use": "Secret scanning (Jarvis has built-in Gitleaks-style rules).", "driven": False, "url": "https://github.com/gitleaks/gitleaks"},
    {"id": "tshark", "name": "Wireshark / TShark", "exe": "tshark", "dirs": ["Wireshark"], "ver": ["--version"], "use": "Packet capture: run it yourself on networks you own; Jarvis reads connection tables instead.", "driven": False, "url": "https://www.wireshark.org"},
    {"id": "zap", "name": "OWASP ZAP", "exe": "zap", "dirs": ["ZAP\\Zed Attack Proxy", "OWASP\\Zed Attack Proxy"], "file": "zap.bat", "use": "Active web app testing of sites you own (Jarvis does the passive check).", "driven": False, "url": "https://www.zaproxy.org"},
    {"id": "yara", "name": "YARA", "exe": "yara64", "alt": ["yara"], "ver": ["--version"], "use": "Malware pattern matching (Jarvis uses Defender + its own file checks).", "driven": False, "url": "https://virustotal.github.io/yara/"},
    {"id": "metasploit", "name": "Metasploit Framework", "exe": "msfconsole", "dirs": ["metasploit-framework\\bin"], "use": "Exploitation framework. Never run by Jarvis: use only in your own lab.", "driven": False, "url": "https://www.metasploit.com"},
    {"id": "sqlmap", "name": "SQLMap", "exe": "sqlmap", "use": "SQL-injection exploitation. Never run by Jarvis: authorized testers only.", "driven": False, "url": "https://sqlmap.org"},
    {"id": "nikto", "name": "Nikto", "exe": "nikto", "use": "Aggressive web server scanner. Never run by Jarvis against sites you don't own.", "driven": False, "url": "https://github.com/sullo/nikto"},
]


def find_exe(t: dict) -> str | None:
    for name in [t.get("exe")] + t.get("alt", []):
        if name and (p := shutil.which(name)):
            return p
    for base in PF:
        for d in t.get("dirs", []):
            for name in [t.get("file"), (t.get("exe") or "") + ".exe"]:
                if name and (p := Path(base) / d / name).exists():
                    return str(p)
    return None


def _version(cmd: list[str]) -> str | None:
    try:
        r = subprocess.run(cmd, capture_output=True, text=True, timeout=15, creationflags=getattr(subprocess, "CREATE_NO_WINDOW", 0))
    except (OSError, subprocess.TimeoutExpired):
        return None
    m = re.search(r"\d+\.\d+(\.\d+)?", r.stdout + r.stderr)
    return m.group(0) if m else "installed"


def detect() -> list[dict]:
    out = []
    for t in TOOLS:
        path = ver = None
        if t.get("python"):
            try:
                r = subprocess.run([sys.executable, "-m", t["python"], "--version"], capture_output=True, text=True, timeout=20, creationflags=getattr(subprocess, "CREATE_NO_WINDOW", 0))
                if r.returncode == 0:
                    path, ver = f"{Path(sys.executable).name} -m {t['python']}", (re.search(r"\d+\.\d+(\.\d+)?", r.stdout) or [None])[0]
            except (OSError, subprocess.TimeoutExpired):
                pass
        else:
            path = find_exe(t)
            if path and t.get("ver"):
                ver = _version([path] + t["ver"])
            elif path:
                ver = "installed"
        out.append({"id": t["id"], "name": t["name"], "installed": bool(path), "version": ver, "path": path, "use": t["use"], "driven": t["driven"], "url": t["url"]})
    return out


def nmap_path() -> str | None:
    return find_exe(TOOLS[0])


def parse_nmap_xml(xml_text: str) -> dict[str, dict]:
    """Nmap -oX output -> {ip: {hostname, ports: [{port, proto, state, service, product, version}], os}} (pure)."""
    out: dict[str, dict] = {}
    root = ET.fromstring(xml_text)
    for host in root.findall("host"):
        addr = next((a.get("addr") for a in host.findall("address") if a.get("addrtype") == "ipv4"), None)
        if not addr:
            continue
        hn = host.find("hostnames/hostname")
        ports = []
        for p in host.findall("ports/port"):
            st = p.find("state")
            if st is None or st.get("state") != "open":
                continue
            svc = p.find("service")
            ports.append({"port": int(p.get("portid")), "proto": p.get("protocol"), "state": "open",
                          "service": svc.get("name") if svc is not None else None,
                          "product": svc.get("product") if svc is not None else None,
                          "version": svc.get("version") if svc is not None else None})
        osm = host.find("os/osmatch")
        out[addr] = {"hostname": hn.get("name") if hn is not None else None, "ports": ports, "os": osm.get("name") if osm is not None else None}
    return out


def nmap_service_scan(ctx, ips: list[str], ports: list[int]) -> dict[str, dict]:
    """Service/version detection on hosts already found on the user's own network (same scope)."""
    exe = nmap_path()
    if not exe or not ips:
        return {}
    args = [exe, "-sV", "--version-light", "-Pn", "-T4", "--max-retries", "1", "--host-timeout", "60s", "-p", ",".join(map(str, ports)), "-oX", "-"] + ips
    r = ctx.run(args, 600)
    return parse_nmap_xml(r.stdout[r.stdout.find("<?xml"):]) if "<?xml" in r.stdout else {}


def act_toolbox(ctx, params):
    from app.ops.actions import table
    with ctx.step("Looking for installed security tools") as st:
        tools = detect()
        st["detail"] = ", ".join(t["name"] for t in tools if t["installed"]) or "none of the external tools"
    f = []
    for t in tools:
        if t["installed"] and t["driven"]:
            f.append({"severity": "ok", "title": f"{t['name']} {t['version'] or ''} is used by Jarvis", "detail": t["use"], "fix": ""})
        elif not t["installed"] and t["driven"]:
            f.append({"severity": "info", "title": f"{t['name']} not installed", "detail": t["use"], "fix": f"Install from {t['url']} to enable it."})
    return {"summary": f"{sum(t['installed'] for t in tools)} of {len(tools)} tools installed · Jarvis drives: {', '.join(t['name'] for t in tools if t['driven'] and t['installed']) or 'built-in checks only'}",
            "score": None, "findings": f,
            "sections": [table("Security toolbox", ["Tool", "Installed", "Version", "How Jarvis uses it", "Get it"], [[t["name"], "yes" if t["installed"] else "no", t["version"] or "", t["use"], t["url"]] for t in tools],
                               note="Exploitation tools are detected only. Jarvis never launches attacks; active tests stay on networks and sites you own.")]}
