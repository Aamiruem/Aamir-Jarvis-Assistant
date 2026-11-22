"""Cyber Ops: the quick actions (scans and diagnostics of this PC and its own network).

GET  /ops/actions                 -> the buttons: id, title, what it does, consent / input needed
POST /ops/run {action, params}    -> a new job (runs in the background; poll it)
GET  /ops/jobs                    -> this user's jobs, newest first (running + history)
GET  /ops/jobs/{id}               -> one job with live steps and its result
GET  /ops/jobs/{id}/report.md     -> the result as a Markdown report
POST /ops/jobs/{id}/cancel        -> cancel one job (kills its PowerShell/Defender child processes)
POST /ops/stop-all                -> cancel every running job

Only where Azarvis runs on the user's own computer (SYSTEM_CONTROL on): a cloud server has no
laptop, Wi-Fi or Bluetooth of the user's to look at. Nothing here changes the PC or any device.
"""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import PlainTextResponse
from pydantic import BaseModel, Field

from app.config import settings
from app.ops import actions
from app.ops.jobs import MAX_RUNNING, runner
from app.security import Caller, get_caller

router = APIRouter(prefix="/ops", tags=["ops"])


class RunIn(BaseModel):
    action: str = Field(min_length=2, max_length=40)
    params: dict = Field(default_factory=dict)


def _check_params(action: str, params: dict) -> dict:
    """Keep only the inputs an action takes, validated (they reach PowerShell and the network)."""
    meta = actions.ACTIONS[action]
    clean: dict = {"authorized": params.get("authorized") is True}
    if meta.get("consent") and not clean["authorized"]:
        raise HTTPException(428, "Scanning a network needs your confirmation that you own it or have the owner's permission.")
    if meta.get("input") == "url":
        url = str(params.get("url") or "").strip()
        if not url or len(url) > 300 or any(c.isspace() for c in url):
            raise HTTPException(422, "Enter one website address, e.g. example.com")
        clean["url"] = url
    if meta.get("input") == "path" and params.get("path"):
        path = str(params["path"]).strip().strip('"')
        if len(path) > 500 or "\n" in path or "\0" in path:
            raise HTTPException(422, "That file path is not valid.")
        clean["path"] = path
    if action == "devices":
        clean["bluetooth"] = params.get("bluetooth", True) is not False
    return clean


def _job_or_404(caller: Caller, job_id: str):
    job = runner.get(caller.user_id, job_id)
    if not job:
        raise HTTPException(404, "Job not found")
    return job


@router.get("/actions")
async def list_actions():
    return {"supported": settings.system_control, "reason": None if settings.system_control else "Cyber Ops scans the computer Azarvis runs on. Start Azarvis on your PC to use it.",
            "actions": actions.catalog()}


@router.post("/run")
async def run(body: RunIn, caller: Caller = Depends(get_caller)):
    if not settings.system_control:
        raise HTTPException(409, "Cyber Ops runs only where Azarvis is installed on your own PC.")
    if body.action not in actions.ACTIONS:
        raise HTTPException(404, f"Unknown action '{body.action}'")
    if len(runner.running(caller.user_id)) >= MAX_RUNNING:
        raise HTTPException(429, f"{MAX_RUNNING} scans are already running. Wait for one or stop them.")
    params = _check_params(body.action, body.params)
    meta = actions.ACTIONS[body.action]
    return runner.start(caller.user_id, body.action, meta["title"], params, meta["fn"]).to_dict()


@router.get("/jobs")
async def jobs(caller: Caller = Depends(get_caller)):
    return [j.to_dict(full=False) for j in runner.list(caller.user_id)]


@router.get("/jobs/{job_id}")
async def job(job_id: str, caller: Caller = Depends(get_caller)):
    return _job_or_404(caller, job_id).to_dict()


@router.get("/jobs/{job_id}/report.md", response_class=PlainTextResponse)
async def report(job_id: str, caller: Caller = Depends(get_caller)):
    j = _job_or_404(caller, job_id)
    if not j.result:
        raise HTTPException(409, "This job has no result yet.")
    if j.result.get("markdown"):
        return j.result["markdown"]
    from datetime import datetime
    when = datetime.fromtimestamp(j.finished_at or j.created_at).strftime("%Y-%m-%d %H:%M")
    return actions.to_markdown(j.title, when, [(j.title, j.result)], j.result.get("score") if j.result.get("score") is not None else actions.score_of(j.result.get("findings", [])))


@router.post("/jobs/{job_id}/cancel")
async def cancel(job_id: str, caller: Caller = Depends(get_caller)):
    j = _job_or_404(caller, job_id)
    runner.cancel(j)
    return j.to_dict()


@router.post("/stop-all")
async def stop_all(caller: Caller = Depends(get_caller)):
    return {"stopped": runner.stop_all(caller.user_id)}
