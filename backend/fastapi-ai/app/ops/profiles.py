"""Safe testing profiles: one click runs a bundle of real checks, concurrently, as one job.

Each profile states its scope up front and only uses checks that already respect it: public
records for third-party targets, active probing only on your own network (with your authorization),
read-only everywhere. 'Vulnerability verification' re-runs every check that last reported a problem
and says what is now fixed, what is still open, and what is new: evidence, not a claim.
"""
from __future__ import annotations

import time
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime
from urllib.parse import urlparse

from app.ops.actions import count_line, finding, score_of, sort_findings, table, to_markdown

PARALLEL = 3  # checks at once inside one profile (each may start its own processes)

PROFILES: dict[str, dict] = {
    "lab_passive": {
        "title": "Passive reconnaissance", "icon": "eye", "input": "target",
        "scope": "Public records only: DNS, WHOIS/RDAP, owner/ASN, TLS certificate, Certificate Transparency, mail security. No port is scanned.",
        "checks": [("Public intelligence", "investigate")],
    },
    "lab_local": {
        "title": "Local network audit", "icon": "network", "consent": True,
        "scope": "Your own network only (at most 254 addresses): devices, 24 common ports each, this PC's listening ports, Wi-Fi and Bluetooth.",
        "checks": [("Network devices & ports", "network"), ("This PC's open ports", "ports"), ("Wi-Fi security", "wifi"), ("Bluetooth", "bluetooth")],
    },
    "lab_webapp": {
        "title": "Authorized web application audit", "icon": "lock", "input": "url",
        "scope": "Your own site: HTTPS/TLS, security headers, cookies (OWASP Top 10 mapping), public records and the network path. Normal requests only; no attack payloads.",
        "checks": [("Web security", "website"), ("Domain intelligence", "investigate"), ("Network path", "traceroute")],
    },
    "lab_code": {
        "title": "Source-code security analysis", "icon": "code", "input": "folder",
        "scope": "A project folder on this PC: committed secrets, Bandit and JS/TS rules, dependency CVEs from OSV.dev. Files are only read.",
        "checks": [("Code audit", "code_audit"), ("Dependency vulnerabilities", "deps")],
    },
    "lab_verify": {
        "title": "Vulnerability verification", "icon": "check",
        "scope": "Re-runs every check whose last result had problems (same inputs) and compares: fixed, still open, new.",
        "checks": [],
    },
    "lab_incident": {
        "title": "Defensive incident investigation", "icon": "siren",
        "scope": "This PC now: protection status, suspicious files, live connections and their programs, listening ports, crashes and overload.",
        "checks": [("System security", "security"), ("Suspicious files", "files"), ("Live connections", "connections"), ("Open ports", "ports"), ("Emergency triage", "emergency")],
    },
}

PROBLEM = ("critical", "high", "medium", "low")


def _host(url: str) -> str:
    u = url if "://" in url else f"https://{url}"
    return urlparse(u).hostname or url


def params_for(action: str, params: dict) -> dict:
    """The sub-check's own inputs, derived from the profile's single input."""
    p = {k: v for k, v in params.items() if k in ("authorized", "profile", "authorized_by", "path")}
    if action == "website":
        p["url"] = params.get("url") or params.get("target", "")
    if action in ("investigate", "traceroute"):
        p["target"] = params.get("target") or _host(params.get("url", ""))
    if action == "files":
        p.pop("path", None)  # incident triage scans the usual folders, not one file
    return p


def run_checks(ctx, checks: list[tuple[str, str, dict]]) -> list[tuple[str, dict]]:
    """Runs (area, action, params) concurrently; a failed check is reported, never fatal."""
    from app.ops.actions import ACTIONS

    def one(item):
        area, action, p = item
        ctx.check()
        try:
            return area, ACTIONS[action]["fn"](ctx, p)
        except Exception as e:
            if ctx.cancelled:
                raise
            return area, {"summary": f"Could not run: {e}"[:200], "score": None, "findings": [finding("info", f"{area} could not run", str(e)[:200])]}

    with ThreadPoolExecutor(PARALLEL) as pool:
        return list(pool.map(one, checks))


def combine(title: str, parts: list[tuple[str, dict]], extra_sections: list | None = None, summary_prefix: str = "") -> dict:
    allf = [dict(x, area=area) for area, r in parts for x in r.get("findings") or []]
    score = score_of(allf)
    md = to_markdown(title, datetime.now().strftime("%Y-%m-%d %H:%M"), parts, score)
    sections = (extra_sections or []) + [table("Checks in this profile", ["Check", "Result", "Score"], [[a, r.get("summary"), r.get("score")] for a, r in parts])]
    for area, r in parts:  # keep each check's own evidence (tables, device maps) under its name
        for s in r.get("sections") or []:
            sections.append({**s, "title": f"{area}: {s.get('title', '')}"})
    return {"summary": f"{summary_prefix}{title}: {count_line(allf)} across {len(parts)} checks · score {score}/100",
            "score": score, "findings": sort_findings(allf), "sections": sections, "markdown": md}


# ---------- vulnerability verification ----------

def _problems(result: dict | None) -> set[str]:
    return {f["title"] for f in (result or {}).get("findings") or [] if f.get("severity") in PROBLEM}


def verify_plan(jobs: list[dict], authorized: bool) -> tuple[list[dict], list[str]]:
    """Which previous checks to re-run: the newest done run of each action that had problems (pure)."""
    from app.ops.actions import ACTIONS

    seen, plan, skipped = set(), [], []
    for j in jobs:  # newest first
        a = j["action"]
        if a in seen or j.get("status") != "done" or a not in ACTIONS or a.startswith("lab_") or a in ("report", "cve", "toolbox"):
            continue
        seen.add(a)
        if not _problems(j.get("result")):
            continue
        if ACTIONS[a].get("consent") and not authorized:
            skipped.append(f"{ACTIONS[a]['title']} (needs your network authorization)")
            continue
        plan.append(j)
    return plan, skipped


def compare(before: dict, after: dict) -> dict:
    b, a = _problems(before), _problems(after)
    return {"fixed": sorted(b - a), "open": sorted(b & a), "new": sorted(a - b)}


def act_verify(ctx, params):
    from app.ops.jobs import runner

    jobs = [j.to_dict() for j in runner.list(ctx.job.user_id) if j.id != ctx.job.id]
    with ctx.step("Finding checks that last reported problems") as st:
        plan, skipped = verify_plan(jobs, bool(params.get("authorized")))
        st["detail"] = f"{len(plan)} to re-run" + (f", {len(skipped)} skipped" if skipped else "")
    if not plan:
        f = [finding("ok", "Nothing to verify", "No previous check has open problems." if not skipped else "Only checks that need your network authorization have open problems.")]
        f += [finding("info", "Skipped", s) for s in skipped]
        return {"summary": "Nothing to verify: no open problems in earlier checks", "score": None, "findings": f, "sections": []}
    checks = [(j["title"], j["action"], {**(j.get("params") or {}), **{k: params[k] for k in ("authorized", "profile", "authorized_by") if k in params}}) for j in plan]
    parts = run_checks(ctx, checks)
    rows, findings = [], []
    for j, (area, r) in zip(plan, parts):
        c = compare(j["result"], r)
        when = datetime.fromtimestamp(j.get("finished_at") or j["created_at"]).strftime("%d %b %H:%M")
        rows.append([area, when, len(c["fixed"]), len(c["open"]), len(c["new"])])
        findings += [finding("ok", f"Fixed: {t}", f"{area}: reported {when}, gone now.") for t in c["fixed"]]
        findings += [dict(x, title=f"Still open: {x['title']}") for x in r.get("findings") or [] if x["title"] in c["open"]]
        findings += [dict(x, title=f"New: {x['title']}") for x in r.get("findings") or [] if x["title"] in c["new"]]
    findings += [finding("info", "Not re-run", s) for s in skipped]
    fixed = sum(r[2] for r in rows)
    still = sum(r[3] for r in rows)
    new = sum(r[4] for r in rows)
    res = combine("Vulnerability verification", parts, [table("Before → after", ["Check", "Earlier run", "Fixed", "Still open", "New"], rows)])
    res["findings"] = sort_findings([dict(x, area=x.get("area", "Verification")) for x in findings])
    res["score"] = score_of(res["findings"])
    res["summary"] = f"Verified {len(plan)} checks: {fixed} fixed · {still} still open · {new} new"
    return res


# ---------- entry point ----------

def act_profile(profile_id: str):
    prof = PROFILES[profile_id]

    def run(ctx, params):
        if profile_id == "lab_verify":
            return act_verify(ctx, params)
        started = time.time()
        parts = run_checks(ctx, [(area, action, params_for(action, params)) for area, action in prof["checks"]])
        res = combine(prof["title"], parts)
        res["sections"].insert(0, table("Scope", ["What", "Detail"], [["Profile", prof["title"]], ["Scope", prof["scope"]],
                                                                       ["Ran", f"{len(parts)} checks, up to {PARALLEL} at once, {time.time() - started:.0f} s"]]))
        return res

    return run
