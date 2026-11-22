"""Vulnerability intelligence: known vulnerabilities in a project's dependencies, and CVE lookups.

- dependency_scan(): reads exact versions from lock files and installed Python packages
  (package-lock.json, poetry.lock, Pipfile.lock, requirements*.txt with ==, a project .venv) and asks
  OSV.dev, Google's open vulnerability database (GitHub advisories, PyPA, npm, NVD aliases).
- cve_lookup(): one CVE id, or a keyword search, from NIST's National Vulnerability Database, with
  CVSS score, weakness (CWE), publication date and CISA's "known exploited" flag.
Every finding names its source and date, as the spec asks. Read-only: no package is changed.
"""
from __future__ import annotations

import json
import os
import re
from concurrent.futures import ThreadPoolExecutor
from datetime import date
from pathlib import Path

import httpx

OSV_BATCH = "https://api.osv.dev/v1/querybatch"
OSV_VULN = "https://api.osv.dev/v1/vulns/{}"
NVD = "https://services.nvd.nist.gov/rest/json/cves/2.0"
UA = {"User-Agent": "Azarvis-VulnIntel/1.0"}
REPO_ROOT = Path(__file__).resolve().parents[4]
SKIP = {"node_modules", ".git", "dist", "build", "__pycache__", ".next", "coverage", "site-packages"}
SEV_MAP = {"CRITICAL": "critical", "HIGH": "high", "MODERATE": "medium", "MEDIUM": "medium", "LOW": "low"}
ORDER = ["critical", "high", "medium", "low", "info"]


# ---------- reading dependencies (pure) ----------

def norm_py(name: str) -> str:
    return re.sub(r"[-_.]+", "-", name).lower()


def parse_requirements(text: str) -> list[tuple[str, str]]:
    out = []
    for line in text.splitlines():
        line = line.split("#")[0].strip()
        m = re.match(r"^([A-Za-z0-9][A-Za-z0-9._-]*)(?:\[[^\]]*\])?\s*==\s*([A-Za-z0-9.+!_-]+)", line)
        if m:
            out.append((norm_py(m.group(1)), m.group(2)))
    return out


def parse_package_lock(text: str) -> list[tuple[str, str]]:
    d = json.loads(text)
    out = []
    for path, info in (d.get("packages") or {}).items():
        if not path or "node_modules/" not in path or info.get("link"):
            continue
        name = path.rsplit("node_modules/", 1)[1]
        if info.get("version"):
            out.append((name, info["version"]))
    if not out:  # lockfileVersion 1
        def walk(deps):
            for name, info in (deps or {}).items():
                if info.get("version"):
                    out.append((name, info["version"]))
                walk(info.get("dependencies"))
        walk(d.get("dependencies"))
    return out


def parse_poetry_lock(text: str) -> list[tuple[str, str]]:
    return [(norm_py(n), v) for n, v in re.findall(r'\[\[package\]\]\s*\nname = "([^"]+)"\s*\nversion = "([^"]+)"', text)]


def parse_pipfile_lock(text: str) -> list[tuple[str, str]]:
    d = json.loads(text)
    out = []
    for section in ("default", "develop"):
        for name, info in (d.get(section) or {}).items():
            v = str(info.get("version", "")).lstrip("=")
            if v:
                out.append((norm_py(name), v))
    return out


def site_packages(venv: Path) -> list[tuple[str, str]]:
    out = []
    for sp in list(venv.glob("Lib/site-packages")) + list(venv.glob("lib/python*/site-packages")):
        for meta in sp.glob("*.dist-info/METADATA"):
            try:
                head = meta.read_text(encoding="utf-8", errors="replace")[:2000]
            except OSError:
                continue
            n = re.search(r"^Name: (.+)$", head, re.M)
            v = re.search(r"^Version: (.+)$", head, re.M)
            if n and v:
                out.append((norm_py(n.group(1).strip()), v.group(1).strip()))
    return out


def collect(root: Path, max_files: int = 40) -> tuple[list[dict], list[str]]:
    """[{ecosystem, name, version, source}] (deduplicated) and the files read."""
    found: dict[tuple, dict] = {}
    files: list[str] = []

    def add(eco, pairs, src):
        for name, ver in pairs:
            found.setdefault((eco, name, ver), {"ecosystem": eco, "name": name, "version": ver, "source": src})

    for dirpath, dirs, names in os.walk(root):
        dirs[:] = [d for d in dirs if d not in SKIP and not (d.startswith(".") and d != ".venv")]
        here = Path(dirpath)
        if here.name in (".venv", "venv"):
            add("PyPI", site_packages(here), str(here.relative_to(root)) or here.name)
            files.append(str(here))
            dirs[:] = []
            continue
        for n in names:
            p = here / n
            try:
                if n == "package-lock.json":
                    add("npm", parse_package_lock(p.read_text(encoding="utf-8")), str(p.relative_to(root)))
                elif n == "poetry.lock":
                    add("PyPI", parse_poetry_lock(p.read_text(encoding="utf-8")), str(p.relative_to(root)))
                elif n == "Pipfile.lock":
                    add("PyPI", parse_pipfile_lock(p.read_text(encoding="utf-8")), str(p.relative_to(root)))
                elif re.fullmatch(r"requirements.*\.txt", n):
                    add("PyPI", parse_requirements(p.read_text(encoding="utf-8", errors="replace")), str(p.relative_to(root)))
                else:
                    continue
                files.append(str(p.relative_to(root)))
            except (OSError, ValueError):
                continue
            if len(files) >= max_files:
                return list(found.values()), files
    return list(found.values()), files


# ---------- OSV ----------

def severity_of(v: dict) -> str:
    sev = (v.get("database_specific") or {}).get("severity")
    if sev and sev.upper() in SEV_MAP:
        return SEV_MAP[sev.upper()]
    for s in v.get("severity") or []:
        score = s.get("score", "")
        m = re.search(r"/AV:[NALP]/AC:[LH]", score)
        if s.get("type", "").startswith("CVSS") and m:
            return "high" if "/AV:N/" in score and "/C:H" in score else "medium"
    return "medium"


def fixed_versions(v: dict, name: str) -> list[str]:
    out = []
    for a in v.get("affected") or []:
        if (a.get("package") or {}).get("name", "").lower() not in (name.lower(), norm_py(name)):
            continue
        for r in a.get("ranges") or []:
            out += [e["fixed"] for e in r.get("events") or [] if "fixed" in e]
    return sorted(set(out), key=lambda x: [int(p) if p.isdigit() else p for p in re.split(r"[.\-]", x)])[:3]


def dependency_scan(ctx, path: str | None) -> dict:
    from app.ops.actions import kv, score_of, sort_findings, table
    root = Path(os.path.expandvars(os.path.expanduser(path.strip().strip('"')))) if path else REPO_ROOT
    with ctx.step(f"Reading lock files and installed packages in {root}") as st:
        if not root.is_dir():
            raise FileNotFoundError(f"No folder at {root}")
        pkgs, files = collect(root)
        st["detail"] = f"{len(pkgs)} package versions from {len(files)} sources"
    if not pkgs:
        return {"summary": f"No dependency files found in {root}", "score": None, "findings": [{"severity": "info", "title": "Nothing to check", "detail": "No package-lock.json, poetry.lock, Pipfile.lock, pinned requirements.txt or .venv found.", "fix": ""}], "sections": []}
    hits: dict[int, list[str]] = {}
    with ctx.step(f"Asking OSV.dev about {len(pkgs)} packages") as st:
        with httpx.Client(timeout=40, headers=UA) as c:
            for i in range(0, len(pkgs), 900):
                ctx.check()
                chunk = pkgs[i:i + 900]
                r = c.post(OSV_BATCH, json={"queries": [{"package": {"name": p["name"], "ecosystem": p["ecosystem"]}, "version": p["version"]} for p in chunk]})
                r.raise_for_status()
                for j, res in enumerate(r.json().get("results", [])):
                    ids = [v["id"] for v in res.get("vulns") or []]
                    if ids:
                        hits[i + j] = ids
        st["detail"] = f"{len(hits)} vulnerable packages"
    details: dict[str, dict] = {}
    ids = list(dict.fromkeys(i for v in hits.values() for i in v))[:150]
    if ids:
        with ctx.step(f"Fetching details for {len(ids)} advisories") as st:
            with httpx.Client(timeout=20, headers=UA) as c, ThreadPoolExecutor(8) as pool:
                for vid, d in zip(ids, pool.map(lambda x: _get_json(c, OSV_VULN.format(x)), ids)):
                    details[vid] = d or {}
            st["detail"] = f"{len(details)} loaded"
    rows, f = [], []
    for idx, vids in hits.items():
        p = pkgs[idx]
        vs = [details.get(v, {"id": v}) for v in vids]
        worst = min((severity_of(v) for v in vs), key=ORDER.index)
        fixes = sorted({fv for v in vs for fv in fixed_versions(v, p["name"])}, key=lambda x: [int(q) if q.isdigit() else q for q in re.split(r"[.\-]", x)])
        cves = sorted({a for v in vs for a in v.get("aliases") or [] if a.startswith("CVE-")})
        summary = next((v.get("summary") for v in vs if v.get("summary")), "")
        rows.append([worst, p["name"], p["version"], p["ecosystem"], len(vids), ", ".join(cves[:3]) or vids[0], f"≥ {fixes[-1]}" if fixes else "no fix yet", p["source"]])
        f.append({"severity": worst, "title": f"{p['name']} {p['version']} ({p['ecosystem']}): {len(vids)} known vulnerabilit{'y' if len(vids) == 1 else 'ies'}",
                  "detail": f"{summary} {'(' + ', '.join(cves[:4]) + ')' if cves else ''} · in {p['source']}".strip(),
                  "fix": f"Upgrade {p['name']} to {fixes[-1]} or later." if fixes else "No fixed version published yet: check whether you use the affected feature, or replace the package."})
    rows.sort(key=lambda r: ORDER.index(r[0]))
    if not f:
        f.append({"severity": "ok", "title": "No known vulnerabilities", "detail": f"All {len(pkgs)} package versions are clean in OSV.dev today.", "fix": ""})
    return {"summary": f"{len(pkgs)} packages checked · {len(hits)} with known vulnerabilities" + (f" ({sum(r[0] in ('critical', 'high') for r in rows)} critical/high)" if hits else ""),
            "score": score_of(f[:40]), "findings": sort_findings(f)[:60],
            "sections": [table("Vulnerable packages", ["Risk", "Package", "Version", "Ecosystem", "Advisories", "CVE / ID", "Fixed in", "Found in"], rows),
                         table("Sources read", ["File"], [[x] for x in files]),
                         kv("Method", [("Database", "OSV.dev (GitHub Security Advisories, PyPA, npm, NVD aliases)"), ("Checked", date.today().isoformat()), ("Scope", str(root)),
                                       ("Limits", "Only exact versions are checked: requirements with >= ranges are skipped unless a lock file or .venv shows the installed version.")])]}


def _get_json(c: httpx.Client, url: str):
    try:
        r = c.get(url)
        r.raise_for_status()
        return r.json()
    except (httpx.HTTPError, ValueError):
        return None


# ---------- NVD ----------

def cve_summary(item: dict) -> dict:
    """The useful parts of one NVD CVE record (pure)."""
    cve = item.get("cve", item)
    desc = next((d["value"] for d in cve.get("descriptions", []) if d.get("lang") == "en"), "")
    metrics = cve.get("metrics") or {}
    score = vector = sev = None
    for key in ("cvssMetricV40", "cvssMetricV31", "cvssMetricV30", "cvssMetricV2"):
        if metrics.get(key):
            m = metrics[key][0]
            data = m.get("cvssData", {})
            score, vector = data.get("baseScore"), data.get("vectorString")
            sev = data.get("baseSeverity") or m.get("baseSeverity")
            break
    cwes = sorted({d["value"] for w in cve.get("weaknesses") or [] for d in w.get("description", []) if d.get("value", "").startswith("CWE-")})
    return {"id": cve.get("id"), "published": (cve.get("published") or "")[:10], "modified": (cve.get("lastModified") or "")[:10], "status": cve.get("vulnStatus"),
            "description": desc, "score": score, "severity": (sev or "").upper() or None, "vector": vector, "cwe": cwes,
            "kev": bool(cve.get("cisaExploitAdd")), "kev_added": cve.get("cisaExploitAdd"), "kev_action": cve.get("cisaRequiredAction"),
            "references": [r["url"] for r in (cve.get("references") or [])[:6]]}


def _sev_level(s: dict) -> str:
    return {"CRITICAL": "critical", "HIGH": "high", "MEDIUM": "medium", "LOW": "low"}.get(s.get("severity") or "", "info")


def cve_lookup(ctx, query: str) -> dict:
    from app.ops.actions import kv, table
    q = (query or "").strip()
    if not q or len(q) > 120:
        raise ValueError("Enter a CVE id (CVE-2021-44228) or a product name (e.g. openssh 9.6).")
    one = re.fullmatch(r"(?i)cve-\d{4}-\d{4,}", q)
    with httpx.Client(timeout=30, headers=UA) as c:
        with ctx.step(f"Querying NIST NVD for {q}") as st:
            if one:
                r = c.get(NVD, params={"cveId": q.upper()})
                r.raise_for_status()
                items = r.json().get("vulnerabilities", [])
            else:
                r = c.get(NVD, params={"keywordSearch": q, "resultsPerPage": 1})
                r.raise_for_status()
                total = r.json().get("totalResults", 0)
                start = max(0, total - 20)  # NVD lists oldest first: take the newest 20
                r = c.get(NVD, params={"keywordSearch": q, "resultsPerPage": 20, "startIndex": start})
                r.raise_for_status()
                items = list(reversed(r.json().get("vulnerabilities", [])))
            st["detail"] = f"{len(items)} record(s)"
    recs = [cve_summary(i) for i in items]
    if not recs:
        return {"summary": f"No NVD records for '{q}'", "score": None, "findings": [{"severity": "info", "title": "Nothing found", "detail": "Try the vendor and product name, e.g. 'apache tomcat'.", "fix": ""}], "sections": []}
    f = []
    for s in recs[:20]:
        sev = _sev_level(s)
        f.append({"severity": "critical" if s["kev"] else sev, "title": f"{s['id']}: CVSS {s['score'] if s['score'] is not None else '—'} {s['severity'] or ''}" + (" · KNOWN EXPLOITED" if s["kev"] else ""),
                  "detail": f"{s['description'][:400]} (published {s['published']}{', ' + ', '.join(s['cwe']) if s['cwe'] else ''})",
                  "fix": (f"CISA: {s['kev_action']}" if s["kev"] and s["kev_action"] else "Apply the vendor's patch; see the references.")})
    sections = []
    if one:
        s = recs[0]
        sections.append(kv("Record", [("CVE", s["id"]), ("Status", s["status"]), ("Published", s["published"]), ("Last modified", s["modified"]), ("CVSS", f"{s['score']} {s['severity']}" if s["score"] is not None else None),
                                      ("Vector", s["vector"]), ("Weakness", ", ".join(s["cwe"])), ("CISA known exploited", f"yes, added {s['kev_added']}" if s["kev"] else "no")]))
        sections.append(table("References", ["URL"], [[u] for u in s["references"]]))
    else:
        sections.append(table("Newest matching CVEs", ["CVE", "CVSS", "Severity", "Published", "Exploited", "Description"],
                              [[s["id"], s["score"], s["severity"], s["published"], "yes" if s["kev"] else "", s["description"][:160]] for s in recs]))
    sections.append(kv("Source", [("Database", "NIST National Vulnerability Database (NVD API 2.0)"), ("Queried", date.today().isoformat())]))
    worst = recs[0]
    return {"summary": (f"{worst['id']} · CVSS {worst['score']} {worst['severity'] or ''}" + (" · known exploited (CISA KEV)" if worst["kev"] else "")) if one else f"{len(recs)} newest CVEs matching '{q}' · {sum(s['kev'] for s in recs)} known exploited",
            "score": None, "findings": f, "sections": sections}
