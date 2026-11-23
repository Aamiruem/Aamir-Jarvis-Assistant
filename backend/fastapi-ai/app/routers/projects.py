"""Project HQ: every project the user owns, checked for real from one place.

GET    /projects                      -> projects + their last results + which optional keys are set
POST   /projects                      -> add a project; PUT /projects/{id} edit; DELETE /projects/{id} remove
POST   /projects/{id}/check           -> live check now: uptime, TLS, security headers, SEO, page weight, API health,
                                         GitHub CI, local git state (whichever apply); saved as the project's status
POST   /projects/{id}/pagespeed       -> Lighthouse scores + Core Web Vitals (Google PageSpeed Insights), mobile/desktop
POST   /projects/{id}/tests           -> run the project's own lint/typecheck/test/build commands on this PC (a job)
GET    /projects/jobs, /projects/jobs/{id}, POST /projects/jobs/{id}/cancel

Read-only towards the live sites: normal page loads only (the user's own sites). Nothing is deployed,
changed or pushed from here.
"""
from __future__ import annotations

import logging
import os
import time
from urllib.parse import urlsplit

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field, field_validator

from app.config import settings
from app.ops.jobs import JobRunner
from app.projects import checks, registry
from app.security import Caller, get_caller

router = APIRouter(prefix="/projects", tags=["projects"])
log = logging.getLogger("jarvis.projects")
jobs = JobRunner(history_file=settings.data_dir / "project_jobs.json")


class ProjectIn(BaseModel):
    name: str = Field(min_length=1, max_length=80)
    description: str = Field("", max_length=200)
    kind: str = Field("web", pattern=r"^(web|api|repo)$")
    platform: str = Field("", max_length=30)
    url: str = Field("", max_length=300)
    health_url: str = Field("", max_length=300)
    repo: str = Field("", max_length=120, pattern=r"^([\w.-]+/[\w.-]+)?$")
    local_path: str = Field("", max_length=200)
    stack: str = Field("", max_length=80)

    @field_validator("url", "health_url")
    @classmethod
    def http_url(cls, v):
        if v and urlsplit(v).scheme not in ("http", "https"):
            raise ValueError("must start with http:// or https://")
        return v

    @field_validator("local_path")
    @classmethod
    def inside_repo(cls, v):
        if v and (".." in v.replace("\\", "/").split("/") or os.path.isabs(v)):
            raise ValueError("a folder inside this repository, e.g. frontend")
        return v


def _project(pid: str) -> dict:
    p = registry.get(pid)
    if not p:
        raise HTTPException(404, "Project not found.")
    return p


# Hosts that control headers, redirects and the server for you: their findings aren't fixable in your code.
MANAGED = {"streamlit": "Streamlit Community Cloud", "render": "Render"}
MANAGED_AREAS = {"streamlit": {"security", "uptime", "performance"}, "render": {"security"}}


def platform_notes(p: dict, part: dict) -> dict:
    host = MANAGED.get(p.get("platform") or "")
    if not host:
        return part
    for f in part.get("findings") or []:
        if (f.get("area") in MANAGED_AREAS[p["platform"]] and f["severity"] in ("high", "medium")
                and not f["title"].startswith(("Homepage answers", "Site is down"))):  # an outage is always yours to see
            f["severity"], f["platform"] = "low", host
            f["fix"] = f"Controlled by {host}, not by your code. " + (f.get("fix") or "")
    return part


def health(entry: dict) -> dict:
    """One status per project from its latest results: healthy / warning / critical / unknown."""
    findings = [f for part in ("site", "seo", "assets", "api", "github", "pagespeed") for f in (entry.get(part) or {}).get("findings") or []]
    if not entry:
        return {"state": "unknown", "score": None, "counts": {}}
    counts = {s: sum(f["severity"] == s for f in findings) for s in ("critical", "high", "medium", "low")}
    state = "critical" if counts["critical"] else "warning" if counts["high"] or counts["medium"] else "healthy"
    return {"state": state, "score": checks.score(findings), "counts": counts}


@router.get("")
def list_projects():
    st = registry.statuses()
    out = []
    for p in registry.projects():
        e = st.get(p["id"], {})
        out.append({**p, "status": e, "health": health(e)})
    return {"projects": out, "keys": {"pagespeed": bool(settings.pagespeed_api_key), "github": bool(settings.github_token)},
            "local": settings.system_control, "google": {"search_console": "not_connected", "analytics": "not_connected"}}


@router.post("")
def add(body: ProjectIn):
    return registry.upsert(body.model_dump())


@router.put("/{pid}")
def edit(pid: str, body: ProjectIn):
    _project(pid)
    return registry.upsert(body.model_dump(), pid)


@router.delete("/{pid}")
def delete(pid: str):
    if not registry.remove(pid):
        raise HTTPException(404, "Project not found.")
    return {"deleted": pid}


@router.post("/{pid}/check")
def check(pid: str):
    """Runs every check that applies to this project (a few seconds to ~20 s)."""
    p = _project(pid)
    t0 = time.time()
    entry = {}
    if p.get("kind") == "web" and p.get("url"):
        s = platform_notes(p, checks.site(p["url"]))
        page = s.pop("page", None)
        entry = registry.save_status(pid, "site", s)
        if page and s.get("up"):
            seo = checks.seo(page)
            scripts, styles = seo.pop("scripts", []), seo.pop("styles", [])
            entry = registry.save_status(pid, "seo", seo)
            entry = registry.save_status(pid, "assets", platform_notes(p, checks.assets(page, scripts, styles)))
    if p.get("health_url"):
        if p.get("platform") == "local" and not settings.system_control:
            entry = registry.save_status(pid, "api", {"up": None, "findings": [], "note": "Runs on the owner's PC; not reachable from this server."})
        else:
            entry = registry.save_status(pid, "api", checks.api(p["health_url"]))
    if p.get("repo"):
        entry = registry.save_status(pid, "github", checks.github(p["repo"]))
    d = registry.local_dir(p) if settings.system_control else None
    if d:
        entry = registry.save_status(pid, "local", {**registry.git_info(d), "commands": [c for c, _ in registry.test_commands(d)], "findings": []})
    log.info("project %s checked in %.1fs", pid, time.time() - t0)
    return {**p, "status": entry, "health": health(entry)}


@router.post("/{pid}/pagespeed")
def pagespeed(pid: str, strategy: str = "mobile"):
    p = _project(pid)
    if strategy not in ("mobile", "desktop"):
        raise HTTPException(422, "strategy is mobile or desktop")
    if not p.get("url") or p.get("kind") != "web":
        raise HTTPException(409, "Lighthouse runs on websites.")
    r = checks.pagespeed(p["url"], strategy)
    if r.get("error"):
        raise HTTPException(429 if r.get("needs_key") else 502, r["error"])
    entry = registry.save_status(pid, "pagespeed", r)
    return {**p, "status": entry, "health": health(entry)}


def _run_tests(d, cmds):
    def fn(ctx, params):
        results, failed = [], 0
        env = {**os.environ, "CI": "true", "NEXT_TELEMETRY_DISABLED": "1", "FORCE_COLOR": "0", "PYTHONUTF8": "1"}
        for label, args in cmds:
            with ctx.step(label) as st:
                exe = args[0]
                if os.name == "nt" and exe == "npm":
                    args = ["npm.cmd", *args[1:]]
                t0 = time.time()
                r = ctx.run(args, timeout=900, cwd=str(d), env=env)
                secs = round(time.time() - t0)
                out = (r.stdout + "\n" + r.stderr).strip()
                tail = "\n".join(out.splitlines()[-25:])
                ok = r.returncode == 0
                failed += not ok
                st["detail"] = f"{'passed' if ok else f'FAILED (exit {r.returncode})'} in {secs} s"
                results.append({"command": label, "ok": ok, "exit": r.returncode, "seconds": secs, "tail": tail})
                if not ok:
                    st["status"] = "failed"
        findings = [{"severity": "high", "title": f"{x['command']} failed (exit {x['exit']})", "detail": x["tail"][-600:], "fix": "Open the output, fix the first error, run again."}
                    for x in results if not x["ok"]] or [{"severity": "ok", "title": f"All {len(results)} commands passed", "detail": ""}]
        return {"summary": f"{len(results) - failed}/{len(results)} passed", "score": 100 if not failed else max(0, 100 - 40 * failed),
                "findings": findings, "results": results, "sections": []}
    return fn


@router.post("/{pid}/tests")
def run_tests(pid: str, caller: Caller = Depends(get_caller)):
    p = _project(pid)
    if not settings.system_control:
        raise HTTPException(409, "Tests run only where Azarvis runs on your own PC.")
    d = registry.local_dir(p)
    if not d:
        raise HTTPException(409, "This project has no local folder in this repository.")
    cmds = registry.test_commands(d)
    if not cmds:
        raise HTTPException(409, "No test, lint or build commands found in this project.")
    if any(j.action == pid for j in jobs.running(caller.user_id)):
        raise HTTPException(409, "Tests for this project are already running.")
    log.info("project tests %s by user=%s: %s", pid, caller.user_id, [c for c, _ in cmds])
    return jobs.start(caller.user_id, pid, f"Tests: {p['name']}", {"commands": [c for c, _ in cmds]}, _run_tests(d, cmds)).to_dict()


@router.get("/jobs/all")
def list_jobs(caller: Caller = Depends(get_caller)):
    return [j.to_dict(full=False) for j in jobs.list(caller.user_id)]


@router.get("/jobs/{job_id}")
def job(job_id: str, caller: Caller = Depends(get_caller)):
    j = jobs.get(caller.user_id, job_id)
    if not j:
        raise HTTPException(404, "Job not found")
    return j.to_dict()


@router.post("/jobs/{job_id}/cancel")
def cancel(job_id: str, caller: Caller = Depends(get_caller)):
    j = jobs.get(caller.user_id, job_id)
    if not j:
        raise HTTPException(404, "Job not found")
    jobs.cancel(j)
    return j.to_dict()
