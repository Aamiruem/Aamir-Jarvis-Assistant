"""Multi-agent runs: one instruction, several specialist agents, verified results, approvals.

POST /orchestrator/runs                         {instruction}  → the new run (it plans and runs in the background)
GET  /orchestrator/runs                          → this user's runs, newest first
GET  /orchestrator/runs/{id}                     → one run: subtasks, approvals, report
POST /orchestrator/runs/{id}/pause | resume | cancel
POST /orchestrator/runs/{id}/subtasks/{sid}/retry
POST /orchestrator/runs/{id}/approvals/{aid}     {approve: bool} → runs the approved action, or rejects it
GET  /orchestrator/agents                        → the specialist agents and their tools
"""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from app.orchestrator.agents import AGENTS
from app.orchestrator.runner import runner
from app.security import Caller, get_caller

router = APIRouter(prefix="/orchestrator", tags=["orchestrator"])


class RunIn(BaseModel):
    instruction: str = Field(min_length=3, max_length=2000)


class DecisionIn(BaseModel):
    approve: bool


def _run_or_404(caller: Caller, run_id: str):
    run = runner.get(caller.user_id, run_id)
    if not run:
        raise HTTPException(404, "Run not found")
    return run


@router.get("/agents")
async def agents():
    return [{"id": k, "name": a["name"], "does": a["does"], "tools": sorted(a["tools"]) if a["tools"] is not None else "all"} for k, a in AGENTS.items()]


@router.post("/runs")
async def start(body: RunIn, caller: Caller = Depends(get_caller)):
    if sum(r.status in ("planning", "running", "paused", "verifying") for r in runner.list(caller.user_id)) >= 3:
        raise HTTPException(429, "Three runs are already in progress. Wait for one to finish or cancel one.")
    return runner.start(caller.user_id, body.instruction).to_dict()


@router.get("/runs")
async def runs(caller: Caller = Depends(get_caller)):
    return [r.to_dict() for r in runner.list(caller.user_id)]


@router.get("/runs/{run_id}")
async def one(run_id: str, caller: Caller = Depends(get_caller)):
    return _run_or_404(caller, run_id).to_dict()


@router.post("/runs/{run_id}/{action}")
async def control(run_id: str, action: str, caller: Caller = Depends(get_caller)):
    run = _run_or_404(caller, run_id)
    if action not in ("pause", "resume", "cancel"):
        raise HTTPException(404, "Unknown action")
    getattr(runner, action)(run)
    return run.to_dict()


@router.post("/runs/{run_id}/subtasks/{subtask_id}/retry")
async def retry(run_id: str, subtask_id: str, caller: Caller = Depends(get_caller)):
    run = _run_or_404(caller, run_id)
    if not runner.retry(run, subtask_id):
        raise HTTPException(409, "Only a failed or skipped subtask of a finished run can be retried.")
    return run.to_dict()


@router.post("/runs/{run_id}/approvals/{approval_id}")
async def decide(run_id: str, approval_id: str, body: DecisionIn, caller: Caller = Depends(get_caller)):
    run = _run_or_404(caller, run_id)
    if not await runner.decide(run, approval_id, body.approve):
        raise HTTPException(404, "Approval not found")
    return run.to_dict()
