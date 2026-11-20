"""Command Center: real counts per user, agents from the tool log, honest provider states.
Calls the route function directly (no HTTP stack), so it also runs where TestClient can't load."""
import asyncio
from datetime import datetime, timedelta, timezone

import pytest

from app.db import sql
from app.routers import command_center as cc
from app.security import Caller


@pytest.fixture(autouse=True)
def fresh(monkeypatch):
    sql.init_db()
    cc._providers_cache = None
    # No network or local programs in tests: fixed answers for the slow checks.
    monkeypatch.setattr(cc, "_device", lambda: {
        "cpu": {"percent": 12}, "memory": {"percent": 40}, "disk": {"percent": 97, "free_gb": 6.0}, "battery": None,
    })

    async def no_ollama():
        return {"state": "not_found", "detail": "Not running"}

    monkeypatch.setattr(cc, "_ollama", no_ollama)
    monkeypatch.setattr(cc, "key_status", lambda: "ok")
    monkeypatch.setattr(cc, "claude_key_status", lambda: "ok")
    monkeypatch.setattr(cc, "openai_key_status", lambda: "no_key")
    monkeypatch.setattr(cc, "provider", lambda: "anthropic")


def run(user_id):
    return asyncio.run(cc.command_center(Caller(user_id=user_id)))


def test_counts_are_per_user_and_agents_follow_the_tool_log():
    now = datetime.now(timezone.utc)
    sql.create_task("cc-a", "Send invoice", None, now - timedelta(minutes=10))
    sql.create_task("cc-b", "Not mine", None, now - timedelta(minutes=10))
    sql.add_memory("cc-a", "Likes tea")
    sql.log_chat(user_id="cc-a", message="weather?", intent="weather", tools_used="get_weather,web_search", latency_ms=100)

    out = run("cc-a")
    assert out["open_tasks"] == 1 and out["overdue_count"] == 1
    assert out["memory"] == {"memories": 1, "documents": 0, "messages": 1, "tool_calls": 2}
    agents = {a["id"]: a for a in out["agents"]}
    assert agents["research"]["state"] == "active" and agents["research"]["uses_24h"] == 2
    assert agents["memory"]["state"] == "ready" and agents["memory"]["uses_24h"] == 0
    titles = [f["title"] for f in out["feed"]]
    assert "1 task is overdue" in titles and "Disk is 97% full" in titles
    assert out["status"]["level"] == "attention"

    other = run("cc-b")
    assert other["memory"]["memories"] == 0 and other["memory"]["messages"] == 0


def test_providers_say_not_linked_without_keys(monkeypatch):
    monkeypatch.setattr(cc.settings, "openai_api_key", "")
    monkeypatch.setattr(cc.settings, "groq_api_key", "gsk_test")
    providers = {p["id"]: p for p in run("cc-c")["providers"]}
    assert providers["claude"]["state"] == "connected"
    assert providers["openai"]["state"] == "not_linked"
    assert providers["groq"]["state"] == "key_set"
    assert providers["ollama"]["state"] == "not_found"


def test_no_claude_key_means_degraded(monkeypatch):
    monkeypatch.setattr(cc, "key_status", lambda: "no_key")
    out = run("cc-d")
    assert out["status"]["level"] == "degraded"
    assert out["feed"][0]["title"] == "Claude isn't connected"
