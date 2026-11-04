"""Unit tests for the parts that don't need an API key.  Run: pytest -q"""
import json
from datetime import timezone

from app.agent.tools import ToolContext, run_tool, tool_specs
from app.nlp.analyzer import analyze, sentiment
from app.rag.store import chunk_text
from app.timeutil import parse_when

CTX = ToolContext(user_id="unit")


def test_calculator_and_safety():
    out, err = run_tool("calculate", {"expression": "0.18 * 5000 + sqrt(144)"}, CTX)
    assert not err and json.loads(out)["result"] == 912.0
    out, err = run_tool("calculate", {"expression": "__import__('os').system('dir')"}, CTX)
    assert err
    _, err = run_tool("calculate", {"expression": "9 ** 9999999"}, CTX)
    assert err


def test_invalid_tool_input_is_rejected():
    _, err = run_tool("complete_task", {"task_id": "not-a-number"}, CTX)
    assert err


def test_tool_specs_have_schemas():
    names = {t["name"] for t in tool_specs()}
    assert {"calculate", "search_knowledge", "create_task", "remember", "forget", "wikipedia"} <= names
    assert all(t["input_schema"]["type"] == "object" for t in tool_specs())


def test_intent_classifier():
    assert analyze("remind me to submit the report tomorrow")["intent"] == "task"
    assert analyze("what's the weather in kolkata")["intent"] == "weather"


def test_sentiment_handles_negation():
    assert sentiment("this is great") > 0
    assert sentiment("this is not great") < 0


def test_chunking_overlap():
    text = "\n\n".join(f"Paragraph {i} " + "word " * 60 for i in range(20))
    chunks = chunk_text(text)
    assert len(chunks) > 1
    assert all(len(c) <= 1100 for c in chunks)


def test_parse_when():
    assert parse_when("2026-11-02T17:00:00+05:30").hour == 11  # converted to UTC
    naive = parse_when("2026-11-02T17:00")                      # DEFAULT_TIMEZONE = Asia/Kolkata
    assert naive.tzinfo == timezone.utc and naive.hour == 11 and naive.minute == 30
    assert parse_when(None) is None


def test_spoken_requests_get_the_conversational_style():
    from app.agent.agent import SYSTEM_PROMPT, VOICE_STYLE, _user_context
    from app.db.sql import init_db

    init_db()
    assert VOICE_STYLE in _user_context("unit", voice=True)
    assert VOICE_STYLE not in _user_context("unit")
    assert VOICE_STYLE not in SYSTEM_PROMPT  # the cached prompt stays identical for both
