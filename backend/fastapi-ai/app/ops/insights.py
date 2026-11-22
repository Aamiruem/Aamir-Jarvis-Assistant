"""Two read-only roll-ups for the Cyber Ops dashboards, built only from what really ran.

overview(jobs)        -> the security posture: score + trend, open alerts by severity, critical
                         incidents, threat categories, asset health from the last device scan, and
                         which checks are missing or stale. Source: the Cyber Ops job history.
mission(jobs, runs)   -> mission control: the ten specialist agents with their real work (Cyber Ops
                         jobs + orchestrator subtasks), human approvals, completions per day.

Both take plain dicts (Job.to_dict() / Run.to_dict()), so they are pure and unit-tested. Nothing is
estimated: a check that never ran is reported as "not run", not as a guess.
"""
from __future__ import annotations

import re
import time
from datetime import datetime

SEVERITIES = ("critical", "high", "medium", "low")
PROBLEM = set(SEVERITIES)
STALE_DAYS = 7
# Lookups about someone else's software or domain: research, not alerts on your own systems.
NOT_ALERTS = {"cve", "investigate", "toolbox"}

# Checks whose score describes this PC and its own network (a website or code score does not).
POSTURE = ("report", "security", "ports", "wifi", "network", "files", "connections", "laptop", "emergency")

# What a complete picture needs, in order of importance.
COVERAGE = [
    ("security", "System security"), ("ports", "Open ports"), ("network", "Network audit"), ("wifi", "Wi-Fi security"),
    ("files", "Suspicious files"), ("deps", "Dependency CVEs"), ("code_audit", "Code secrets"), ("website", "Website security"),
]

THREAT_GROUPS = [
    ("exposure", "Network exposure", ("network", "ports", "devices", "connections", "bluetooth")),
    ("malware", "Malware & suspicious files", ("files",)),
    ("hardening", "System hardening", ("security", "laptop", "emergency", "report", "hardware", "disk", "cpu_ram")),
    ("wireless", "Wireless", ("wifi",)),
    ("appsec", "Web & application", ("website", "deps", "code_audit")),
    ("connectivity", "Connectivity", ("netfix", "speed", "traceroute", "ip")),
]


def _day(t: float) -> str:
    return datetime.fromtimestamp(t).strftime("%Y-%m-%d")


def _last_days(n: int, now: float) -> list[str]:
    return [_day(now - 86400 * i) for i in range(n - 1, -1, -1)]


def _latest_done(jobs: list[dict]) -> dict[str, dict]:
    """The newest finished job per action (jobs come newest first)."""
    out: dict[str, dict] = {}
    for j in jobs:
        if j.get("status") == "done" and j.get("result") and j["action"] not in out:
            out[j["action"]] = j
    return out


def overview(jobs: list[dict], now: float | None = None) -> dict:
    now = now or time.time()
    latest = _latest_done(jobs)

    # Open alerts = problems in the newest run of each check (fixed issues disappear on re-scan).
    alerts = []
    for action, j in latest.items():
        if action in NOT_ALERTS:
            continue
        for f in j["result"].get("findings") or []:
            if f.get("severity") in PROBLEM:
                alerts.append({**{k: f.get(k) for k in ("severity", "title", "detail", "fix")}, "action": action,
                               "check": j["title"], "job_id": j["id"], "at": j.get("finished_at") or j["created_at"]})
    alerts.sort(key=lambda a: (SEVERITIES.index(a["severity"]), -a["at"]))
    counts = {s: sum(a["severity"] == s for a in alerts) for s in SEVERITIES}

    # Posture: the newest full report if it is the most recent word, else the mean of the latest scores.
    scored = {a: j for a, j in latest.items() if a in POSTURE and j["result"].get("score") is not None}
    posture = None
    # A posture needs the core check (or a full report): one connections check alone isn't "100% secure".
    if scored and ("security" in scored or "report" in scored):
        rep = scored.get("report")
        newer = [j for a, j in scored.items() if a != "report" and rep and j["created_at"] > rep["created_at"]]
        if rep and not newer:
            posture = {"score": rep["result"]["score"], "basis": "Latest full security report", "checks": 1}
        else:
            vals = [j["result"]["score"] for j in scored.values()]
            posture = {"score": round(sum(vals) / len(vals)), "basis": f"Average of the latest {len(vals)} PC/network check{'s' if len(vals) > 1 else ''}", "checks": len(vals)}
    trend = [{"t": j.get("finished_at") or j["created_at"], "score": j["result"]["score"], "check": j["title"]}
             for j in reversed(jobs) if j.get("status") == "done" and j["action"] in POSTURE and (j.get("result") or {}).get("score") is not None][-30:]

    # Problems found per day (all runs, not only the latest) for the alert bars.
    days = _last_days(7, now)
    per_day = {d: {s: 0 for s in SEVERITIES} for d in days}
    for j in jobs:
        d = _day(j["created_at"])
        if d in per_day and j.get("status") == "done" and j["action"] not in NOT_ALERTS:
            for f in (j.get("result") or {}).get("findings") or []:
                if f.get("severity") in PROBLEM:
                    per_day[d][f["severity"]] += 1

    threats = []
    for gid, label, acts in THREAT_GROUPS:
        mine = [a for a in alerts if a["action"] in acts]
        ran = [a for a in acts if a in latest]
        threats.append({"id": gid, "label": label, "open": len(mine), "worst": mine[0]["severity"] if mine else None,
                        "checked": bool(ran), "last": max((latest[a].get("finished_at") or latest[a]["created_at"] for a in ran), default=None)})

    coverage = []
    for action, label in COVERAGE:
        j = latest.get(action)
        at = (j.get("finished_at") or j["created_at"]) if j else None
        coverage.append({"action": action, "label": label, "last": at, "score": (j or {}).get("result", {}).get("score") if j else None,
                         "state": "never" if not j else ("stale" if now - at > STALE_DAYS * 86400 else "fresh")})

    return {"posture": posture, "trend": trend, "counts": counts, "alerts_total": len(alerts), "incidents": alerts[:10],
            "per_day": [{"day": d, **per_day[d]} for d in days], "threats": threats, "assets": assets(latest),
            "coverage": coverage, "jobs_total": len(jobs), "running": sum(j.get("status") in ("queued", "running") for j in jobs)}


def assets(latest: dict[str, dict]) -> dict | None:
    """Device health from the newest network audit or device discovery."""
    src = max((latest[a] for a in ("network", "devices") if a in latest), key=lambda j: j["created_at"], default=None)
    if not src:
        return None
    devices = []
    for s in src["result"].get("sections") or []:
        if s.get("type") == "devices" and not devices:
            devices = s.get("devices") or []
    flagged: dict[str, str] = {}
    for f in src["result"].get("findings") or []:
        m = re.search(r"\((\d{1,3}(?:\.\d{1,3}){3})\)", f.get("title") or "")
        if m and f.get("severity") in PROBLEM:
            ip = m.group(1)
            if ip not in flagged or SEVERITIES.index(f["severity"]) < SEVERITIES.index(flagged[ip]):
                flagged[ip] = f["severity"]
    groups: dict[str, dict] = {}
    for d in devices:
        cat = d.get("category") or "Unknown device"
        g = groups.setdefault(cat, {"category": cat, "total": 0, "at_risk": 0})
        g["total"] += 1
        if d.get("ip") in flagged:
            g["at_risk"] += 1
    rows = sorted(groups.values(), key=lambda g: (-g["at_risk"], -g["total"]))
    for g in rows:
        g["health"] = round(100 * (g["total"] - g["at_risk"]) / g["total"])
    total = sum(g["total"] for g in rows)
    risky = sum(g["at_risk"] for g in rows)
    nodes = [{"name": d.get("name"), "ip": d.get("ip"), "category": d.get("category"), "is_self": bool(d.get("is_self")),
              "is_gateway": bool(d.get("is_gateway")), "risk": flagged.get(d.get("ip"))} for d in devices[:40]]
    return {"source": src["title"], "job_id": src["id"], "at": src.get("finished_at") or src["created_at"], "total": total,
            "at_risk": risky, "health": round(100 * (total - risky) / total) if total else None, "groups": rows, "nodes": nodes}


# ---------- mission control ----------

# The ten specialists from the spec, each backed by real orchestrator agents and Cyber Ops actions.
SPECIALISTS = [
    {"id": "cyber", "name": "Cybersecurity Agent", "icon": "shield", "agents": ("security", "ethical_hacker"),
     "actions": ("security", "ports", "files", "website", "report", "investigate", "cve", "toolbox")},
    {"id": "discovery", "name": "Device Discovery Agent", "icon": "radar", "agents": ("devices", "network"),
     "actions": ("devices", "network", "bluetooth", "wifi", "ip")},
    {"id": "python", "name": "Python Developer Agent", "icon": "code", "agents": ("coding",), "match": "python",
     "actions": ("code_audit", "deps")},
    {"id": "fullstack", "name": "Full-Stack Developer Agent", "icon": "workflow", "agents": ("coding", "database", "qa"), "match": "!python",
     "actions": ()},
    {"id": "data", "name": "Data Science Agent", "icon": "flask", "agents": ("data", "ml_research", "math"), "actions": ()},
    {"id": "sysadmin", "name": "System Administrator Agent", "icon": "cpu", "agents": ("system",),
     "actions": ("laptop", "hardware", "cpu_ram", "disk"), "prefix": "fix_"},
    {"id": "research", "name": "Research Agent", "icon": "search", "agents": ("research", "science", "electronics", "career"), "actions": ()},
    {"id": "browser", "name": "Browser Automation Agent", "icon": "globe", "agents": ("automation",), "actions": ()},
    {"id": "assistant", "name": "Personal Assistant Agent", "icon": "user", "agents": ("assistant", "email", "calendar", "memory"), "actions": ()},
    {"id": "troubleshoot", "name": "Troubleshooting Agent", "icon": "target", "agents": ("troubleshoot",),
     "actions": ("netfix", "emergency", "speed", "traceroute", "connections")},
]
PYTHON = re.compile(r"\b(python|pandas|numpy|django|flask|fastapi|pip|pytest|\.py)\b", re.I)
RUN_ACTIVE = ("planning", "running", "paused", "verifying", "needs_approval")


def _owner(sub: dict) -> str | None:
    """Which specialist did an orchestrator subtask (coding is split by whether it is Python work)."""
    py = bool(PYTHON.search(f"{sub.get('title', '')} {sub.get('instruction', '')}"))
    for sp in SPECIALISTS:
        if sub.get("agent") in sp["agents"]:
            m = sp.get("match")
            if m == "python" and not py or m == "!python" and py:
                continue
            return sp["id"]
    return "assistant"


def _job_owner(action: str) -> str | None:
    for sp in SPECIALISTS:
        if action in sp["actions"] or (sp.get("prefix") and action.startswith(sp["prefix"])):
            return sp["id"]
    return None


def mission(jobs: list[dict], runs: list[dict], now: float | None = None) -> dict:
    now = now or time.time()
    work: dict[str, list[dict]] = {sp["id"]: [] for sp in SPECIALISTS}
    for j in jobs:
        owner = _job_owner(j["action"])
        if owner:
            work[owner].append({"kind": "scan", "title": j["title"], "status": "running" if j["status"] in ("queued", "running") else j["status"],
                                "at": j.get("finished_at") or j.get("started_at") or j["created_at"]})
    pending_by_sub: dict[str, int] = {}
    for r in runs:
        for a in r.get("approvals") or []:
            if a.get("status") == "pending":
                pending_by_sub[a["subtask_id"]] = pending_by_sub.get(a["subtask_id"], 0) + 1
        for s in r.get("subtasks") or []:
            status = {"queued": "queued", "running": "running", "done": "done", "failed": "failed"}.get(s.get("status"), s.get("status"))
            if status == "queued" and r.get("status") not in RUN_ACTIVE:
                status = "cancelled"
            work[_owner(s)].append({"kind": "subtask", "title": s.get("title"), "status": status, "at": r.get("finished_at") or r.get("created_at"),
                                    "waiting": pending_by_sub.get(s.get("id"), 0)})

    agents = []
    for sp in SPECIALISTS:
        w = sorted(work[sp["id"]], key=lambda x: -(x["at"] or 0))
        running = sum(x["status"] in ("running", "queued") for x in w)
        waiting = sum(x.get("waiting", 0) for x in w)
        state = "working" if running else "waiting" if waiting else "ready"
        agents.append({"id": sp["id"], "name": sp["name"], "icon": sp["icon"], "state": state, "running": running, "waiting": waiting,
                       "done": sum(x["status"] == "done" for x in w), "failed": sum(x["status"] == "failed" for x in w),
                       "last": w[0] if w else None, "backed_by": list(sp["agents"]), "actions": list(sp["actions"])})

    # Human in the loop: every authorized network scan, approved fix and decided agent action.
    approvals = {"authorized_scans": sum(bool((j.get("params") or {}).get("authorized")) and j["action"] in ("devices", "network") for j in jobs),
                 "approved_fixes": sum(j["action"].startswith("fix_") for j in jobs),
                 "approved": 0, "rejected": 0, "pending": 0}
    for r in runs:
        for a in r.get("approvals") or []:
            st = a.get("status")
            if st in ("approved", "failed"):
                approvals["approved"] += 1
            elif st == "rejected":
                approvals["rejected"] += 1
            elif st == "pending":
                approvals["pending"] += 1
    decided = approvals["authorized_scans"] + approvals["approved_fixes"] + approvals["approved"] + approvals["rejected"]
    actions_total = len(jobs) + sum(len(r.get("subtasks") or []) for r in runs)

    days = _last_days(7, now)
    per_day = {d: 0 for d in days}
    for j in jobs:
        if j["status"] == "done" and _day(j.get("finished_at") or j["created_at"]) in per_day:
            per_day[_day(j.get("finished_at") or j["created_at"])] += 1
    for r in runs:
        for s in r.get("subtasks") or []:
            if s.get("status") == "done" and _day(r.get("finished_at") or r["created_at"]) in per_day:
                per_day[_day(r.get("finished_at") or r["created_at"])] += 1

    done = sum(a["done"] for a in agents)
    failed = sum(a["failed"] for a in agents)
    return {
        "agents": agents,
        "totals": {"completed": done, "failed": failed, "running": sum(a["running"] for a in agents),
                   "success_rate": round(100 * done / (done + failed)) if done + failed else None,
                   "runs": len(runs), "runs_active": sum(r.get("status") in RUN_ACTIVE for r in runs), "actions": actions_total},
        "approvals": {**approvals, "decided": decided, "human_rate": round(100 * decided / actions_total) if actions_total else None},
        "per_day": [{"day": d, "done": per_day[d]} for d in days],
        "recent_runs": [{"id": r["id"], "instruction": r["instruction"], "status": r["status"], "created_at": r["created_at"],
                         "subtasks": len(r.get("subtasks") or []), "pending": sum(a.get("status") == "pending" for a in r.get("approvals") or [])}
                        for r in runs[:5]],
        "note": "Agent-team runs are kept in memory since the AI service started; Cyber Ops scans are kept on disk (newest 60).",
    }
