"""Multi-agent orchestrator: plan validation, parallel and dependent subtasks, retries, skipping,
cancel/pause/resume, approvals, and the agent tool rules. The planner, agents and verifier are
fakes, so no Claude API calls are made."""
import asyncio
import json

import pytest

from app.agent.tools import ToolContext, run_tool
from app.orchestrator.planner import Plan, PlanError, validate_plan
from app.orchestrator.runner import Runner


def plan_of(*subtasks, summary="test plan"):
    return validate_plan({"summary": summary, "subtasks": [
        {"id": i, "title": f"task {i}", "agent": agent, "instruction": f"do {i}", "depends_on": deps} for i, agent, deps in subtasks
    ]})


async def until_finished(runner, run, timeout=5):
    for _ in range(int(timeout / 0.01)):
        if run.status in ("done", "done_with_errors", "needs_approval", "failed", "cancelled"):
            return run
        await asyncio.sleep(0.01)
    raise AssertionError(f"run stuck in {run.status}")


# ---------- planning ----------

def test_plan_validation_fixes_agents_and_dependencies():
    plan = validate_plan({"summary": "", "subtasks": [
        {"id": "t1", "title": "a", "agent": "made-up", "instruction": "x", "depends_on": ["t1", "nope"]},
        {"id": "t2", "title": "b", "agent": "email", "instruction": "y", "depends_on": ["t1", "t1"]},
    ]})
    assert plan.subtasks[0].agent == "assistant" and plan.subtasks[0].depends_on == []
    assert plan.subtasks[1].depends_on == ["t1"]


def test_plan_validation_rejects_cycles_and_duplicates():
    with pytest.raises(PlanError):
        validate_plan({"summary": "", "subtasks": [
            {"id": "a", "title": "a", "agent": "research", "instruction": "x", "depends_on": ["b"]},
            {"id": "b", "title": "b", "agent": "research", "instruction": "y", "depends_on": ["a"]},
        ]})
    with pytest.raises(PlanError):
        validate_plan({"summary": "", "subtasks": [
            {"id": "a", "title": "a", "agent": "research", "instruction": "x", "depends_on": []},
            {"id": "a", "title": "b", "agent": "research", "instruction": "y", "depends_on": []},
        ]})


# ---------- running ----------

def test_independent_subtasks_run_in_parallel_and_dependents_get_their_inputs():
    async def scenario():
        live = {"now": 0, "max": 0}
        prompts = {}

        async def agent(prompt, ctx, role):
            live["now"] += 1
            live["max"] = max(live["max"], live["now"])
            await asyncio.sleep(0.05)
            live["now"] -= 1
            prompts[role] = prompt
            return f"result for {prompt.split('Your subtask: ')[1].splitlines()[0]}", ["web_search"]

        async def plan(_):
            return plan_of(("t1", "research", []), ("t2", "career", []), ("t3", "email", []), ("t4", "calendar", ["t1", "t2"]))

        async def verify(run):
            return "verified report"

        r = Runner(plan=plan, agent=agent, verify=verify)
        run = await until_finished(r, r.start("u1", "prepare my job applications"))
        assert run.status == "done" and run.report == "verified report"
        assert live["max"] == 3  # t1, t2, t3 together; t4 after its inputs
        t4_prompt = next(p for role, p in prompts.items() if "task t4" in role)
        assert "result for do t1" in t4_prompt and "result for do t2" in t4_prompt
        assert all(s.status == "done" for s in run.subtasks.values())

    asyncio.run(scenario())


def test_failed_subtask_is_retried_once_then_dependents_skip_and_manual_retry_recovers():
    async def scenario():
        calls = {"t1": 0}
        broken = {"on": True}

        async def agent(prompt, ctx, role):
            if "do t1" in prompt:
                calls["t1"] += 1
                if broken["on"]:
                    raise RuntimeError("site timed out")
            return "ok", []

        async def plan(_):
            return plan_of(("t1", "research", []), ("t2", "email", ["t1"]))

        async def verify(run):
            return "report"

        r = Runner(plan=plan, agent=agent, verify=verify)
        run = await until_finished(r, r.start("u1", "x"))
        assert run.status == "done_with_errors"
        assert calls["t1"] == 2  # automatic retry
        assert run.subtasks["t1"].status == "failed" and "timed out" in run.subtasks["t1"].error
        assert run.subtasks["t2"].status == "skipped"

        broken["on"] = False
        assert r.retry(run, "t1")
        await until_finished(r, run)
        assert run.status == "done" and run.subtasks["t2"].status == "done"

    asyncio.run(scenario())


def test_cancel_stops_running_work():
    async def scenario():
        async def agent(prompt, ctx, role):
            await asyncio.sleep(10)
            return "never", []

        async def plan(_):
            return plan_of(("t1", "research", []), ("t2", "email", ["t1"]))

        r = Runner(plan=plan, agent=agent, verify=lambda run: None)
        run = r.start("u1", "x")
        await asyncio.sleep(0.05)
        r.cancel(run)
        await asyncio.sleep(0.05)
        assert run.status == "cancelled"
        assert {s.status for s in run.subtasks.values()} == {"cancelled"}

    asyncio.run(scenario())


def test_pause_holds_new_subtasks_until_resume():
    async def scenario():
        started = []

        async def agent(prompt, ctx, role):
            started.append(prompt)
            return "ok", []

        gate = asyncio.Event()

        async def plan(_):
            await gate.wait()
            return plan_of(("t1", "research", []))

        async def verify(run):
            return "report"

        r = Runner(plan=plan, agent=agent, verify=verify)
        run = r.start("u1", "x")
        await asyncio.sleep(0.01)
        run.status = "running"  # pause is allowed once running
        r.pause(run)
        gate.set()
        await asyncio.sleep(0.05)
        assert started == [] and run.status == "paused"
        r.resume(run)
        await until_finished(r, run)
        assert run.status == "done" and len(started) == 1

    asyncio.run(scenario())


def test_actions_wait_for_approval_and_run_only_when_approved(monkeypatch):
    async def scenario():
        async def agent(prompt, ctx, role):
            # what the real agent loop does when it calls compose_email in an orchestrated run
            ctx.proposals.append({"tool": "calculate", "input": {"expression": "6*7"}})
            ctx.proposals.append({"tool": "calculate", "input": {"expression": "1+1"}})
            return "draft ready, waiting for approval", ["compose_email"]

        async def plan(_):
            return plan_of(("t1", "email", []))

        async def verify(run):
            return "report"

        r = Runner(plan=plan, agent=agent, verify=verify)
        run = await until_finished(r, r.start("u1", "x"))
        assert run.status == "needs_approval"
        first, second = run.approvals
        await r.decide(run, first.id, True)
        assert first.status == "approved" and json.loads(first.result)["result"] == 42
        assert run.status == "needs_approval"
        await r.decide(run, second.id, False)
        assert second.status == "rejected" and second.result == ""
        assert run.status == "done"

    asyncio.run(scenario())


def test_runs_are_private_to_their_user():
    async def scenario():
        async def plan(_):
            return plan_of(("t1", "research", []))

        async def agent(*_):
            return "ok", []

        async def verify(_):
            return "r"

        r = Runner(plan=plan, agent=agent, verify=verify)
        run = r.start("alice", "x")
        assert r.get("bob", run.id) is None and r.list("bob") == []
        await until_finished(r, run)

    asyncio.run(scenario())


# ---------- the agent's tool rules in an orchestrated run ----------

def test_agents_only_use_their_own_tools():
    out, is_error = run_tool("calculate", {"expression": "2+2"}, ToolContext(user_id="u", allowed_tools=frozenset({"get_time"})))
    assert is_error and "not one of this agent's tools" in out


def test_acting_tools_are_prepared_not_done():
    ctx = ToolContext(user_id="u", propose_only=True)
    out, is_error = run_tool("compose_email", {"to": "priya@example.com", "subject": "Hi", "body": "Hello"}, ctx)
    assert not is_error and json.loads(out)["status"] == "awaiting_approval"
    assert ctx.proposals == [{"tool": "compose_email", "input": ctx.proposals[0]["input"]}]
    assert ctx.proposals[0]["input"]["to"] == "priya@example.com"
