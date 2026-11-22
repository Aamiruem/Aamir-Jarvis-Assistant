"""Cyber Ops: quick actions (scans and diagnostics of this PC, its own network and public records).

GET  /ops/actions                 -> the buttons: id, title, what it does, consent / input needed, tools used
POST /ops/run {action, params}    -> a new job (runs in the background; poll it)
POST /ops/command {text}          -> universal command: which action answers it (or 'agents' for the team)
GET  /ops/jobs                    -> this user's jobs, newest first (running + history)
GET  /ops/jobs/{id}               -> one job with live steps and its result
GET  /ops/jobs/{id}/report.md     -> the result as a Markdown report
POST /ops/jobs/{id}/cancel        -> cancel one job (kills its child processes)
POST /ops/stop-all                -> cancel every running job
POST /ops/fix {fix, approve}      -> run one whitelisted network fix the user approved, then verify
GET/POST /ops/safe-mode {on}      -> emergency safe mode (switching on also stops everything)

Only where Azarvis runs on the user's own computer (SYSTEM_CONTROL on). Active network scans need
the user's authorization (a profile, plus who authorized it for an organisation network).
"""
from __future__ import annotations

import logging
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import PlainTextResponse
from pydantic import BaseModel, Field

from app.config import settings
from app.ops import actions, command, netdiag, safemode
from app.ops.jobs import MAX_RUNNING, runner
from app.security import Caller, get_caller

router = APIRouter(prefix="/ops", tags=["ops"])
log = logging.getLogger("jarvis.ops")

PROFILES = {
    "home": "My own home network",
    "org": "Organisation network I am authorized to test",
    "lab": "My own training lab",
}
TOOLS_USED = {
    "laptop": "psutil · WMI/CIM · Defender status", "devices": "ARP · mDNS · SSDP/UPnP · NetBIOS · IEEE OUI · TCP probes · WinRT Bluetooth",
    "network": "ARP · mDNS · UPnP · NetBIOS · TCP connect (24 ports) · Nmap -sV when installed", "ip": "Windows IP config · route table · ipinfo.io",
    "security": "Microsoft Defender · firewall/UAC registry · Windows Update agent · local accounts", "hardware": "WMI/CIM", "cpu_ram": "psutil",
    "disk": "Get-PhysicalDisk · psutil", "files": "file signatures · Mark of the Web · Authenticode · Microsoft Defender (no quarantine)",
    "speed": "speed.cloudflare.com", "bluetooth": "WinRT DeviceInformation", "wifi": "netsh wlan", "website": "TLS handshake · HTTP headers · security.txt",
    "ports": "psutil connection table", "report": "all local checks", "investigate": "DNS-over-HTTPS · RDAP · ipinfo.io · crt.sh · TLS",
    "emergency": "psutil · event logs · ping · DNS · HTTPS", "netfix": "ping · system DNS vs 1.1.1.1 · captive-portal probe · proxy/VPN/event-log checks",
    "traceroute": "tracert (ICMP) · ipinfo.io", "connections": "connection table · adapter counters · netstat -s · ipinfo.io",
    "deps": "OSV.dev", "cve": "NIST NVD API 2.0 · CISA KEV", "code_audit": "secret rules · Bandit · JS/TS rules", "toolbox": "PATH / Program Files detection",
}


class RunIn(BaseModel):
    action: str = Field(min_length=2, max_length=40)
    params: dict = Field(default_factory=dict)


class CommandIn(BaseModel):
    text: str = Field(min_length=1, max_length=2000)


class FixIn(BaseModel):
    fix: str = Field(min_length=2, max_length=40)
    approve: bool = False


class SafeIn(BaseModel):
    on: bool


def _one_line(value, field: str, limit: int = 300) -> str:
    v = str(value or "").strip().strip('"')
    if len(v) > limit or "\n" in v or "\0" in v:
        raise HTTPException(422, f"That {field} is not valid.")
    return v


def _check_params(action: str, params: dict) -> dict:
    """Keep only the inputs an action takes, validated (they reach PowerShell and the network)."""
    meta = actions.ACTIONS[action]
    clean: dict = {"authorized": params.get("authorized") is True}
    if meta.get("consent"):
        if not clean["authorized"]:
            raise HTTPException(428, "Scanning a network needs your confirmation that you own it or have the owner's permission.")
        profile = params.get("profile") or "home"
        if profile not in PROFILES:
            raise HTTPException(422, "Unknown authorization profile.")
        clean["profile"] = profile
        by = _one_line(params.get("authorized_by"), "authorization note", 160)
        if profile == "org" and not by:
            raise HTTPException(422, "For an organisation network, say who authorized the test (name, ticket or contract).")
        if by:
            clean["authorized_by"] = by
    kind = meta.get("input")
    if kind == "url":
        url = _one_line(params.get("url"), "website address")
        if not url or any(c.isspace() for c in url):
            raise HTTPException(422, "Enter one website address, e.g. example.com")
        clean["url"] = url
    if kind in ("path", "folder") and params.get("path"):
        clean["path"] = _one_line(params["path"], "path", 500)
    if kind == "target":
        target = _one_line(params.get("target"), "target")
        if not target or any(c.isspace() for c in target):
            raise HTTPException(422, "Enter one domain, host or public IP, e.g. example.com")
        clean["target"] = target
    if kind == "query":
        q = _one_line(params.get("query"), "search", 120)
        if not q:
            raise HTTPException(422, "Enter a CVE id (CVE-2021-44228) or a product name.")
        clean["query"] = q
    if action == "devices":
        clean["bluetooth"] = params.get("bluetooth", True) is not False
    return clean


def _with_context(action: str, fn):
    """Adds the tools used and, for authorized scans, the authorization record to the result."""
    def wrapped(ctx, params):
        r = fn(ctx, params)
        if isinstance(r, dict):
            r["tools"] = TOOLS_USED.get(action)
            if params.get("profile"):
                r.setdefault("sections", []).insert(0, actions.kv("Authorization & scope", [
                    ("Profile", PROFILES[params["profile"]]), ("Authorized by", params.get("authorized_by") or "you (owner)"),
                    ("Confirmed at", datetime.now().strftime("%Y-%m-%d %H:%M")),
                    ("Scope", "This PC's own network(s), at most 254 addresses each; no logins, no exploitation")]))
        return r
    return wrapped


def _job_or_404(caller: Caller, job_id: str):
    job = runner.get(caller.user_id, job_id)
    if not job:
        raise HTTPException(404, "Job not found")
    return job


def _require_pc():
    if not settings.system_control:
        raise HTTPException(409, "Cyber Ops runs only where Azarvis is installed on your own PC.")


@router.get("/actions")
async def list_actions():
    cat = actions.catalog()
    for a in cat:
        a["tools"] = TOOLS_USED.get(a["id"])
    return {"supported": settings.system_control, "reason": None if settings.system_control else "Cyber Ops scans the computer Azarvis runs on. Start Azarvis on your PC to use it.",
            "safe_mode": safemode.state(), "profiles": PROFILES, "actions": cat}


@router.post("/run")
async def run(body: RunIn, caller: Caller = Depends(get_caller)):
    _require_pc()
    if body.action not in actions.ACTIONS:
        raise HTTPException(404, f"Unknown action '{body.action}'")
    meta = actions.ACTIONS[body.action]
    if safemode.is_on() and meta.get("consent"):
        raise HTTPException(423, safemode.BLOCK_MESSAGE)
    if len(runner.running(caller.user_id)) >= MAX_RUNNING:
        raise HTTPException(429, f"{MAX_RUNNING} scans are already running. Wait for one or stop them.")
    params = _check_params(body.action, body.params)
    if params.get("profile"):
        log.info("ops authorized scan %s by user=%s profile=%s authorized_by=%r", body.action, caller.user_id, params["profile"], params.get("authorized_by"))
    return runner.start(caller.user_id, body.action, meta["title"], params, _with_context(body.action, meta["fn"])).to_dict()


@router.post("/command")
async def universal_command(body: CommandIn):
    return command.route(body.text)


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


@router.post("/fix")
async def apply_fix(body: FixIn, caller: Caller = Depends(get_caller)):
    _require_pc()
    if body.fix not in netdiag.FIXES:
        raise HTTPException(404, "Unknown fix.")
    if safemode.is_on():
        raise HTTPException(423, safemode.BLOCK_MESSAGE)
    if not body.approve:
        raise HTTPException(428, "This changes a network setting: approve it first.")
    fx = netdiag.FIXES[body.fix]
    log.info("ops fix %s approved by user=%s", body.fix, caller.user_id)
    return runner.start(caller.user_id, f"fix_{body.fix}", f"Fix: {fx['label']}", {"fix": body.fix, "approved": True}, lambda ctx, p: netdiag.apply_fix(ctx, body.fix)).to_dict()


@router.get("/safe-mode")
async def get_safe_mode():
    return safemode.state()


@router.post("/safe-mode")
async def set_safe_mode(body: SafeIn, caller: Caller = Depends(get_caller)):
    stopped = 0
    if body.on:
        stopped = runner.stop_all(caller.user_id)
        try:
            from app.orchestrator.runner import runner as orch
            for r in orch.list(caller.user_id):
                if r.status in ("planning", "running", "paused", "verifying", "needs_approval"):
                    orch.cancel(r)
                    stopped += 1
        except Exception as e:  # the switch must work even if the orchestrator can't be reached
            log.warning("safe mode: could not cancel agent runs: %s", e)
    log.warning("safe mode %s by user=%s (stopped %d)", "ON" if body.on else "off", caller.user_id, stopped)
    return {**safemode.set_on(body.on, caller.user_id), "stopped": stopped}
