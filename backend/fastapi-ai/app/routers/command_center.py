"""The Command Center dashboard: one request, everything on the screen, all of it real.

GET /command-center -> {
  status,            "optimal" | "attention" | "degraded", and why
  core,              AI core: model, Claude key, memory, voice, agents, providers, system control
  agents,            the agent's tool groups and how much each was used in the last 24 h
  timeline,          today's timed tasks (reminders) in order
  feed,              live intelligence: unread notifications, overdue tasks, resource warnings
  device,            this PC's CPU, memory, disk, network, battery (None where psutil can't run)
  memory,            memories, documents, messages, tool calls
  providers,         which AI providers and coding tools are really set up on this PC
  recent,            the last few requests and the tools they used
}
Nothing is simulated: a provider with no key says "not linked", an agent that hasn't run says "ready".
Polled by frontend/src/components/CommandCenter.jsx every few seconds while it is on screen.
"""
from __future__ import annotations

import asyncio
import glob
import importlib.util
import os
import shutil
import time
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends

from app.config import settings
from app.db import sql
from app.llm.claude import key_status
from app.rag.store import get_store
from app.security import Caller, get_caller
from app.timeutil import now_local

router = APIRouter(prefix="/command-center", tags=["command center"])

# The main agent's tools, grouped into the specialist "agents" the dashboard shows.
AGENTS = [
    {"id": "research", "name": "Research Agent", "icon": "search", "does": "Web search, pages, Wikipedia, your documents, weather",
     "tools": ["web_search", "web_fetch", "wikipedia", "search_knowledge", "get_weather"]},
    {"id": "tasks", "name": "Task Agent", "icon": "tasks", "does": "To-dos, reminders, your schedule",
     "tools": ["create_task", "list_tasks", "complete_task"]},
    {"id": "memory", "name": "Memory Agent", "icon": "brain", "does": "Remembers and forgets facts about you",
     "tools": ["remember", "forget"]},
    {"id": "system", "name": "System Agent", "icon": "cpu", "does": "Apps, files, clipboard, screen, PC health",
     "tools": ["system_control", "system_status", "find_files", "open_file", "read_clipboard", "copy_to_clipboard", "look_at_screen", "open_website"]},
    {"id": "comms", "name": "Communication Agent", "icon": "mail", "does": "Email drafts and contacts",
     "tools": ["compose_email", "find_contact", "add_contact"]},
    {"id": "data", "name": "Data & ML Agent", "icon": "flask", "does": "Exact maths and your trained ML models",
     "tools": ["calculate", "predict_house_price", "predict_crop_yield", "list_ml_models", "predict_with_model"]},
]
ACTIVE_MINUTES = 15  # an agent counts as "active" if one of its tools ran this recently

_providers_cache: tuple[float, list[dict]] | None = None
PROVIDERS_TTL = 30


def _agents(tool_uses: list[tuple[str, datetime]], now: datetime) -> list[dict]:
    out = []
    for a in AGENTS:
        uses = [at for name, at in tool_uses if name in a["tools"]]
        last = max(uses) if uses else None
        if a["id"] == "system" and not settings.system_control:
            state = "off"
        elif last and now - last < timedelta(minutes=ACTIVE_MINUTES):
            state = "active"
        else:
            state = "ready"
        out.append({k: a[k] for k in ("id", "name", "icon", "does")} | {
            "state": state, "uses_24h": len(uses), "last_used": last.isoformat(timespec="seconds") if last else None,
        })
    return out


def _has(path_glob: str) -> bool:
    return bool(glob.glob(os.path.expanduser(os.path.expandvars(path_glob))))


async def _ollama() -> dict:
    """Ollama on this PC: how many local models it has. Quick timeout: it's usually not running."""
    url = os.environ.get("OLLAMA_HOST", "http://127.0.0.1:11434").rstrip("/")
    if not url.startswith("http"):
        url = f"http://{url}"
    try:
        import httpx

        async with httpx.AsyncClient(timeout=0.8) as client:
            r = await client.get(f"{url}/api/tags")
        models = len(r.json().get("models", [])) if r.status_code == 200 else 0
        return {"state": "connected" if models else "no_models", "detail": f"{models} local model{'s' if models != 1 else ''}" if models else "Running, no models"}
    except Exception:
        return {"state": "not_found", "detail": "Not running"}


async def _providers() -> list[dict]:
    global _providers_cache
    if _providers_cache and time.monotonic() - _providers_cache[0] < PROVIDERS_TTL:
        return _providers_cache[1]
    claude = key_status()
    claude_detail = {
        "ok": "Connected · powers Jarvis", "no_key": "No API key", "invalid_key": "Key rejected",
        "no_credits": "Out of credits", "unreachable": "Can't reach the API", "unknown": "Checking…",
    }.get(claude, claude)

    def key(value: str, used_for: str) -> dict:
        return {"state": "key_set", "detail": f"Key set · {used_for}"} if value else {"state": "not_linked", "detail": "Not linked"}

    def installed(found: bool, what: str) -> dict:
        return {"state": "installed", "detail": f"{what} found"} if found else {"state": "not_found", "detail": "Not installed"}

    localapp = os.environ.get("LOCALAPPDATA", "")
    providers = [
        {"id": "claude", "name": "Claude", "kind": "llm", "state": "connected" if claude == "ok" else ("not_linked" if claude == "no_key" else "problem" if claude != "unknown" else "checking"), "detail": claude_detail},
        {"id": "groq", "name": "Groq", "kind": "llm", **key(settings.groq_api_key, "Whisper voice notes")},
        {"id": "openai", "name": "OpenAI", "kind": "llm", **key(settings.openai_api_key, "not used by Jarvis yet")},
        {"id": "gemini", "name": "Gemini", "kind": "llm", **key(settings.gemini_api_key, "not used by Jarvis yet")},
        {"id": "openrouter", "name": "OpenRouter", "kind": "llm", **key(settings.openrouter_api_key, "not used by Jarvis yet")},
        {"id": "ollama", "name": "Ollama", "kind": "llm", **(await _ollama())},
        {"id": "claude_code", "name": "Claude Code", "kind": "tool", **installed(bool(shutil.which("claude")), "CLI")},
        {"id": "cursor", "name": "Cursor", "kind": "tool", **installed(bool(shutil.which("cursor") or (localapp and _has(os.path.join(localapp, "Programs", "cursor", "Cursor.exe")))), "App")},
        {"id": "copilot", "name": "Copilot", "kind": "tool", **installed(_has("~/.vscode/extensions/github.copilot*"), "VS Code extension")},
    ]
    _providers_cache = (time.monotonic(), providers)
    return providers


def _device() -> dict | None:
    try:
        from app.device_info import device_details

        return device_details()
    except Exception:  # psutil missing (cloud host) or blocked
        return None


def _feed(db: dict, device: dict | None, claude_state: str, now: datetime) -> list[dict]:
    feed = []
    if claude_state not in ("connected", "checking"):
        feed.append({"level": "warn", "title": "Claude isn't connected", "body": "Jarvis can't answer until the API key works. Check it in Account.", "action": "account"})
    if db["overdue"]:
        n = len(db["overdue"])
        first = db["overdue"][0]["title"]
        feed.append({"level": "warn", "title": f"{n} task{'s are' if n > 1 else ' is'} overdue", "body": f"“{first}”" + (f" and {n - 1} more" if n > 1 else ""), "action": "tasks"})
    if device:
        if device["cpu"]["percent"] >= 85:
            feed.append({"level": "warn", "title": f"CPU is busy at {device['cpu']['percent']}%", "body": "Something is working hard on this PC.", "action": "device"})
        if device["memory"]["percent"] >= 90:
            feed.append({"level": "warn", "title": f"Memory is {device['memory']['percent']}% full", "body": "Closing unused apps will speed things up.", "action": "device"})
        if device["disk"]["percent"] >= 90:
            feed.append({"level": "warn", "title": f"Disk is {device['disk']['percent']}% full", "body": f"{device['disk']['free_gb']} GB free.", "action": "device"})
        bat = device.get("battery")
        if bat and not bat["plugged"] and bat["percent"] <= 20:
            feed.append({"level": "warn", "title": f"Battery at {bat['percent']}%", "body": "Plug in the charger soon.", "action": "device"})
    for n in db["unread"]:
        feed.append({"level": "info", "title": n["title"], "body": n["body"], "at": n["at"], "action": "notifications"})
    upcoming = [t for t in db["today"] if not t["done"] and t["remind_at"] and datetime.fromisoformat(t["remind_at"]) > now]
    if upcoming:
        feed.append({"level": "tip", "title": f"Next up: {upcoming[0]['title']}", "body": "From your schedule today.", "at": upcoming[0]["remind_at"], "action": "tasks"})
    if device and not feed:
        feed.append({"level": "live", "title": f"CPU at {device['cpu']['percent']}% · all clear", "body": "No warnings, nothing overdue.", "action": "device"})
    return feed[:8]


@router.get("")
async def command_center(caller: Caller = Depends(get_caller)):
    now = datetime.now(timezone.utc)
    local = now_local()
    day_start = local.replace(hour=0, minute=0, second=0, microsecond=0).astimezone(timezone.utc)
    db, device, docs, providers = await asyncio.gather(
        asyncio.to_thread(sql.command_center_data, caller.user_id, day_start, day_start + timedelta(days=1), now - timedelta(hours=24)),
        asyncio.to_thread(_device),
        asyncio.to_thread(lambda: get_store().list_documents(caller.user_id)),
        _providers(),
    )
    claude_state = providers[0]["state"]
    agents = _agents(db.pop("tool_uses"), now)
    feed = _feed(db, device, claude_state, now)
    voice_neural = importlib.util.find_spec("edge_tts") is not None

    reasons = []
    if claude_state not in ("connected", "checking"):
        reasons.append("Claude not connected")
    if device and (device["cpu"]["percent"] >= 90 or device["memory"]["percent"] >= 92 or device["disk"]["percent"] >= 95):
        reasons.append("PC resources high")
    if db["overdue"]:
        reasons.append(f"{len(db['overdue'])} overdue")
    status = "degraded" if "Claude not connected" in reasons else "attention" if reasons else "optimal"

    linked = [p for p in providers if p["state"] in ("connected", "key_set", "installed")]
    return {
        "status": {"level": status, "reasons": reasons},
        "time": local.isoformat(timespec="seconds"),
        "timezone": settings.default_timezone,
        "core": {
            "model": settings.claude_model,
            "claude": claude_state,
            "memories": db["memories"],
            "voice": {"neural": voice_neural, "listen": "browser speech recognition", "languages": 39},
            "agents_total": len(agents),
            "agents_active": sum(a["state"] == "active" for a in agents),
            "providers_linked": len(linked),
            "system_control": settings.system_control,
            "database": settings.sqlalchemy_url.split(":")[0],
        },
        "agents": agents,
        "timeline": db["today"],
        "open_tasks": db["open_tasks"],
        "overdue_count": len(db["overdue"]),
        "unread_count": db["unread_count"],
        "feed": feed,
        "device": device,
        "memory": {"memories": db["memories"], "documents": len(docs), "messages": db["messages"], "tool_calls": db["tool_calls"]},
        "providers": providers,
        "recent": db["recent"],
    }
