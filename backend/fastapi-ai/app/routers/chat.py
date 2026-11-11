import json
import logging
import time
from typing import Literal

import anthropic

from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

from app.agent.agent import run_agent
from app.db import sql
from app.llm.claude import note_api_error
from app.mind import understand
from app.nlp.analyzer import analyze
from app.security import Caller, get_caller

router = APIRouter(prefix="/chat", tags=["chat"])


class HistoryItem(BaseModel):
    role: Literal["user", "assistant"]
    content: str


class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=20000)
    history: list[HistoryItem] = Field(default=[], max_length=100)
    voice: bool = False  # spoken request: answer fast (low effort), the reply is read aloud


def _log(caller: Caller, req: ChatRequest, nlp: dict, started: float, done_event: dict | None) -> None:
    usage = (done_event or {}).get("usage", {})
    sql.log_chat(
        user_id=caller.user_id,
        message=req.message[:2000],
        intent=nlp["intent"],
        sentiment=nlp["sentiment"],
        tools_used=",".join((done_event or {}).get("tools", []))[:300],
        latency_ms=int((time.perf_counter() - started) * 1000),
        input_tokens=usage.get("input_tokens", 0),
        output_tokens=usage.get("output_tokens", 0),
    )


def _friendly_error(e: Exception) -> str:
    """Plain-language message for the chat window; the full error still goes to the server log."""
    if isinstance(e, anthropic.AuthenticationError):
        return ("Azarvis can't reach Claude: the ANTHROPIC_API_KEY in .env was rejected (invalid or revoked). "
                "Create a new key at console.anthropic.com/settings/keys, then run \"npm run set-key\" in the "
                "project folder and paste it. It works right away, no restart needed.")
    if isinstance(e, anthropic.PermissionDeniedError):
        return "This API key isn't allowed to use the configured model. Check CLAUDE_MODEL in .env and your Anthropic plan."
    if isinstance(e, anthropic.RateLimitError):
        return "Claude is rate-limiting requests right now. Wait a moment and try again."
    if isinstance(e, anthropic.APIConnectionError):
        return "Can't connect to the Claude API. Check your internet connection."
    if "credit balance" in str(e).lower():
        return "Your Anthropic account is out of credits. Add credits at console.anthropic.com, then try again."
    return f"{type(e).__name__}: {e}"


def _mind_event(insight) -> dict:
    """What the browser may show and use: the reading, the plan and the voice style (not the full prompt)."""
    e = insight.emotion
    return {
        "emotion": e.emotion, "label": e.label, "intensity": e.intensity, "valence": e.valence,
        "need": insight.need, "tone": insight.tone, "realizations": insight.realizations,
        "voice": insight.voice, "trend": insight.mood.trend, "crisis": e.crisis,
    }


@router.post("/stream")
async def chat_stream(req: ChatRequest, caller: Caller = Depends(get_caller)):
    """Server-Sent Events stream of agent events (used by the Node gateway / React UI / CLI)."""
    started = time.perf_counter()
    nlp = analyze(req.message)
    insight = understand(caller.user_id, req.message, nlp["intent"])

    async def events():
        yield f"data: {json.dumps({'type': 'nlp', **nlp})}\n\n"
        # How the user seems and how Azarvis will answer (the browser uses "voice" to set the spoken tone).
        yield f"data: {json.dumps({'type': 'mind', **_mind_event(insight)})}\n\n"
        done = None
        try:
            async for ev in run_agent(req.message, [h.model_dump() for h in req.history], caller.user_id, fast=req.voice, guidance=insight.guidance()):
                if ev["type"] == "done":
                    done = ev
                yield f"data: {json.dumps(ev, default=str)}\n\n"
        except Exception as e:  # surface API/auth errors to the UI instead of a dead stream
            logging.getLogger("jarvis.chat").warning("chat failed: %s: %s", type(e).__name__, e)
            note_api_error(e)
            yield f"data: {json.dumps({'type': 'error', 'message': _friendly_error(e)})}\n\n"
            yield f"data: {json.dumps({'type': 'done', 'usage': {}, 'tools': []})}\n\n"
        finally:
            _log(caller, req, nlp, started, done)

    return StreamingResponse(events(), media_type="text/event-stream", headers={"Cache-Control": "no-cache"})


@router.post("")
async def chat(req: ChatRequest, caller: Caller = Depends(get_caller)):
    """Non-streaming variant (used by Streamlit and the MCP server)."""
    started = time.perf_counter()
    nlp = analyze(req.message)
    insight = understand(caller.user_id, req.message, nlp["intent"])
    reply, tools, done, errors = "", [], None, []
    async for ev in run_agent(req.message, [h.model_dump() for h in req.history], caller.user_id, fast=req.voice, guidance=insight.guidance()):
        if ev["type"] == "text":
            reply += ev["text"]
        elif ev["type"] == "tool":
            tools.append(ev)
        elif ev["type"] == "error":
            errors.append(ev["message"])
        elif ev["type"] == "done":
            done = ev
    _log(caller, req, nlp, started, done)
    return {"reply": reply or " ".join(errors), "tools": tools, "nlp": nlp, "mind": _mind_event(insight), "usage": (done or {}).get("usage")}
