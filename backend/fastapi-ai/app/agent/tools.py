"""Tools Jarvis's agent can call.

Each tool = a Pydantic input model (gives us the JSON schema for Claude AND
validation of what Claude sends back) + a plain Python function that receives
the validated input and a ToolContext (who the user is).
Add a tool by writing both and registering it in TOOLS.
"""
import ast
import json
import math
import operator
from dataclasses import dataclass
from datetime import datetime
from urllib.parse import quote, urlencode
from zoneinfo import ZoneInfo

import httpx
from pydantic import BaseModel, Field

from app.config import settings
from app.db import sql
from app.rag.store import get_store
from app.system_control import ACTIONS, FOLDERS, app_names, run_action, system_status
from app.timeutil import parse_when

HTTP_HEADERS = {"User-Agent": "JarvisLearningProject/1.0 (educational assistant)"}


@dataclass(frozen=True)
class ToolContext:
    user_id: str


# ---------- input models ----------

class GetTime(BaseModel):
    timezone: str = Field(settings.default_timezone, description="IANA timezone, e.g. 'Asia/Kolkata', 'America/New_York'.")


class Calculate(BaseModel):
    expression: str = Field(description="Math expression, e.g. '0.18 * 5000' or 'sqrt(144)'. Supports + - * / ** % and math functions.")


class SearchKnowledge(BaseModel):
    query: str = Field(description="What to look for in the user's uploaded documents.")
    k: int = Field(4, ge=1, le=10, description="Number of passages to return.")


class CreateTask(BaseModel):
    title: str = Field(description="Short description of the task.")
    due: str | None = Field(None, description="Optional human-readable due date, e.g. 'Friday 5pm'.")
    remind_at: str | None = Field(
        None,
        description="When to send a reminder notification, as ISO-8601 with offset, e.g. '2026-11-02T17:00:00+05:30'. "
        "Work it out from the current time in your context. Omit if the user didn't ask to be reminded.",
    )


class ListTasks(BaseModel):
    include_done: bool = Field(False, description="Also include completed tasks.")


class CompleteTask(BaseModel):
    task_id: int = Field(description="ID of the task to mark as done.")


class GetWeather(BaseModel):
    city: str = Field(description="City name, e.g. 'Mumbai'.")


class Remember(BaseModel):
    fact: str = Field(description="One durable fact about the user, written in third person, e.g. 'Prefers vegetarian food.'")


class Forget(BaseModel):
    memory_id: int = Field(description="ID of the memory to delete (IDs are shown in your context).")


class Wikipedia(BaseModel):
    topic: str = Field(description="Topic, person, place or concept to look up.")


class OpenWebsite(BaseModel):
    url: str = Field(
        description="Full https URL to open in the user's browser, e.g. 'https://www.youtube.com' or a search URL "
        "like 'https://www.youtube.com/results?search_query=lofi+music'."
    )



class SystemControl(BaseModel):
    action: str = Field(description=f"One of: {', '.join(ACTIONS)}.")
    target: str | None = Field(
        None,
        description=f"open_app / close_app: one of {', '.join(app_names())}. open_folder: one of {', '.join(FOLDERS)}. "
        "open_url: a full https URL. Leave empty for the other actions.",
    )


class SystemStatus(BaseModel):
    pass


class ComposeEmail(BaseModel):
    to: str = Field("", description="Recipient email address(es), comma-separated. Empty if the user didn't say.")
    subject: str = Field(description="Email subject line.")
    body: str = Field(description="The full email text, ready to send, signed with the user's name if known.")


class FindContact(BaseModel):
    query: str = Field(description="A name, part of a name, company, email or phone number to look up.")


class AddContact(BaseModel):
    name: str = Field(description="The person's name.")
    phone: str | None = Field(None, description="Phone number with country code if known, e.g. +91 98765 43210.")
    email: str | None = Field(None, description="Email address.")
    company: str | None = Field(None, description="Company or relationship, e.g. 'Manager at Infosys' or 'Sister'.")
    notes: str | None = Field(None, description="Anything else worth keeping.")


# ---------- implementations ----------

def get_time(args: GetTime, ctx: ToolContext) -> dict:
    now = datetime.now(ZoneInfo(args.timezone))
    return {"timezone": args.timezone, "datetime": now.isoformat(timespec="seconds"), "weekday": now.strftime("%A")}


_OPS = {
    ast.Add: operator.add, ast.Sub: operator.sub, ast.Mult: operator.mul, ast.Div: operator.truediv,
    ast.Pow: operator.pow, ast.Mod: operator.mod, ast.FloorDiv: operator.floordiv,
    ast.USub: operator.neg, ast.UAdd: operator.pos,
}
_FUNCS = {name: getattr(math, name) for name in ("sqrt", "sin", "cos", "tan", "log", "log10", "exp", "radians", "degrees", "factorial")}
_FUNCS |= {"abs": abs, "round": round}
_CONSTS = {"pi": math.pi, "e": math.e}


def _eval(node):
    # Walks the syntax tree and only allows arithmetic - never use eval() on model output.
    if isinstance(node, ast.Constant) and isinstance(node.value, (int, float)):
        return node.value
    if isinstance(node, ast.BinOp) and type(node.op) in _OPS:
        if isinstance(node.op, ast.Pow) and abs(_eval(node.right)) > 1000:
            raise ValueError("Exponent too large")
        return _OPS[type(node.op)](_eval(node.left), _eval(node.right))
    if isinstance(node, ast.UnaryOp) and type(node.op) in _OPS:
        return _OPS[type(node.op)](_eval(node.operand))
    if isinstance(node, ast.Call) and isinstance(node.func, ast.Name) and node.func.id in _FUNCS:
        return _FUNCS[node.func.id](*[_eval(a) for a in node.args])
    if isinstance(node, ast.Name) and node.id in _CONSTS:
        return _CONSTS[node.id]
    raise ValueError(f"Unsupported expression element: {ast.dump(node)[:60]}")


def calculate(args: Calculate, ctx: ToolContext) -> dict:
    return {"expression": args.expression, "result": _eval(ast.parse(args.expression, mode="eval").body)}


def search_knowledge(args: SearchKnowledge, ctx: ToolContext) -> dict:
    hits = get_store().search(ctx.user_id, args.query, k=args.k)
    if not hits:
        return {"results": [], "note": "No matching passages in the user's knowledge base."}
    return {"results": [{"source": h["source"], "score": h["score"], "text": h["text"]} for h in hits]}


def create_task(args: CreateTask, ctx: ToolContext) -> dict:
    return sql.create_task(ctx.user_id, args.title, args.due, parse_when(args.remind_at))


def list_tasks(args: ListTasks, ctx: ToolContext) -> dict:
    return {"tasks": sql.list_tasks(ctx.user_id, args.include_done)}


def complete_task(args: CompleteTask, ctx: ToolContext) -> dict:
    task = sql.set_task_done(ctx.user_id, args.task_id)
    if task is None:
        raise ValueError(f"No task with id {args.task_id}")
    return task


def get_weather(args: GetWeather, ctx: ToolContext) -> dict:
    # Open-Meteo is free and needs no API key.
    geo = httpx.get(
        "https://geocoding-api.open-meteo.com/v1/search",
        params={"name": args.city, "count": 1}, timeout=10,
    ).json()
    if not geo.get("results"):
        raise ValueError(f"City '{args.city}' not found")
    place = geo["results"][0]
    wx = httpx.get(
        "https://api.open-meteo.com/v1/forecast",
        params={
            "latitude": place["latitude"], "longitude": place["longitude"],
            "current": "temperature_2m,relative_humidity_2m,wind_speed_10m,precipitation,weather_code",
            "daily": "temperature_2m_max,temperature_2m_min,precipitation_probability_max",
            "forecast_days": 2, "timezone": "auto",
        },
        timeout=10,
    ).json()
    return {"place": f"{place['name']}, {place.get('country', '')}", "current": wx.get("current"), "daily": wx.get("daily")}


def remember(args: Remember, ctx: ToolContext) -> dict:
    return sql.add_memory(ctx.user_id, args.fact)


def forget(args: Forget, ctx: ToolContext) -> dict:
    if not sql.delete_memory(ctx.user_id, args.memory_id):
        raise ValueError(f"No memory with id {args.memory_id}")
    return {"forgotten": args.memory_id}


def open_website(args: OpenWebsite, ctx: ToolContext) -> dict:
    # The browser does the opening: it watches for this tool call in the chat stream.
    if not args.url.startswith(("https://", "http://")):
        raise ValueError("url must start with https://")
    return {"opened": args.url, "note": "The user's browser opens this in a new tab."}


def system_control(args: SystemControl, ctx: ToolContext) -> dict:
    return run_action(args.action, args.target)


def get_system_status(args: SystemStatus, ctx: ToolContext) -> dict:
    return system_status()


def compose_email(args: ComposeEmail, ctx: ToolContext) -> dict:
    """Opens a ready-to-send Gmail draft in the browser; the user reviews it and presses Send."""
    url = "https://mail.google.com/mail/?" + urlencode({"view": "cm", "fs": "1", "to": args.to, "su": args.subject, "body": args.body})
    try:
        run_action("open_url", url)
        opened = True
    except Exception:  # system control off: the draft is still in the reply for the user to copy
        opened = False
    return {"opened_in_gmail": opened, "to": args.to, "subject": args.subject}


def wikipedia(args: Wikipedia, ctx: ToolContext) -> dict:
    search = httpx.get(
        "https://en.wikipedia.org/w/api.php",
        params={"action": "opensearch", "search": args.topic, "limit": 1, "format": "json"},
        headers=HTTP_HEADERS, timeout=10,
    ).json()
    if not search[1]:
        raise ValueError(f"No Wikipedia article found for '{args.topic}'")
    title = search[1][0]
    page = httpx.get(
        f"https://en.wikipedia.org/api/rest_v1/page/summary/{quote(title.replace(' ', '_'))}",
        headers=HTTP_HEADERS, timeout=10,
    ).json()
    return {"title": page.get("title"), "summary": page.get("extract"), "url": page.get("content_urls", {}).get("desktop", {}).get("page")}


# ---------- registry ----------

def find_contact(args: FindContact, ctx: ToolContext) -> dict:
    found = sql.list_contacts(ctx.user_id, args.query, limit=10)
    return {"contacts": found} if found else {"contacts": [], "note": f"No contact matches '{args.query}'."}


def add_contact(args: AddContact, ctx: ToolContext) -> dict:
    return sql.create_contact(ctx.user_id, **args.model_dump())


TOOLS: dict[str, tuple[str, type[BaseModel], callable]] = {
    "get_time": ("Get the current date and time in a timezone.", GetTime, get_time),
    "calculate": ("Evaluate a math expression exactly. Use for any arithmetic.", Calculate, calculate),
    "search_knowledge": (
        "Search the user's uploaded documents (PDFs, notes). Use whenever the user asks about their files, notes, or documents.",
        SearchKnowledge, search_knowledge,
    ),
    "create_task": ("Add a task to the user's to-do list, optionally with a timed reminder notification.", CreateTask, create_task),
    "list_tasks": ("List the user's tasks.", ListTasks, list_tasks),
    "complete_task": ("Mark a task as done by its ID.", CompleteTask, complete_task),
    "get_weather": ("Get current weather and a 2-day forecast for a city.", GetWeather, get_weather),
    "remember": (
        "Save a durable fact about the user (preferences, people, goals, recurring details) to long-term memory. "
        "Use when the user shares something worth knowing in future conversations, or asks you to remember it. "
        "Don't store secrets such as passwords or card numbers.",
        Remember, remember,
    ),
    "forget": ("Delete a fact from long-term memory when the user asks you to forget it or it's no longer true.", Forget, forget),
    "wikipedia": ("Get a short encyclopedia summary of a topic from Wikipedia.", Wikipedia, wikipedia),
    "open_website": (
        "Open a website or web search in the user's browser (YouTube, Google, Gmail, WhatsApp Web, maps, etc.). "
        "Use when the user asks to open, launch, play or search something on a site. You can't see or control "
        "the page after it opens, and you can't read private data such as WhatsApp messages or status.",
        OpenWebsite, open_website,
    ),
    "system_control": (
        "Do something on the user's computer (Windows, Linux or macOS): open or close an app, open a folder, "
        "open a link in the default browser, change volume, mute, play/pause/next/previous media, lock, "
        "take a screenshot, sleep, shut down, restart, or cancel a pending shutdown/restart. "
        "Shutdown and restart happen after a 60-second delay; ONLY use them after the user has clearly confirmed "
        "(ask 'Shall I shut down the computer?' first unless they already said yes), and tell them they can say "
        "'cancel shutdown'. Prefer this over open_website for links when the user is on their own computer. "
        "Only the listed actions exist; you cannot run arbitrary commands or delete anything.",
        SystemControl, system_control,
    ),
    "compose_email": (
        "Write an email for the user and open it as a Gmail draft in their browser so they can review and send it. "
        "Use for any request to write, draft or send an email (leave requests, replies, follow-ups). You can't send "
        "email yourself; the user presses Send. Also show the draft text in your reply.",
        ComposeEmail, compose_email,
    ),
    "find_contact": (
        "Look up people in the user's contact list by name, company, email or phone. Use it whenever the user "
        "mentions a person by name and you need their email or number (e.g. 'email Priya', 'what's Rahul's number').",
        FindContact, find_contact,
    ),
    "add_contact": ("Save a new person to the user's contact list.", AddContact, add_contact),
    "system_status": ("Get this PC's CPU, memory and disk usage, free disk space and battery level.", SystemStatus, get_system_status),
}


def tool_specs() -> list[dict]:
    """Tool definitions in the shape the Claude API expects."""
    return [
        {
            "name": name,
            "description": description,
            "input_schema": model.model_json_schema(),
            "eager_input_streaming": True,
        }
        for name, (description, model, _) in TOOLS.items()
    ]


def run_tool(name: str, raw_input, ctx: ToolContext) -> tuple[str, bool]:
    """Validate and execute one tool call. Returns (json_result, is_error)."""
    if name not in TOOLS:
        return json.dumps({"error": f"Unknown tool {name}"}), True
    _, model, fn = TOOLS[name]
    try:
        args = model.model_validate(raw_input)
    except Exception as e:
        return json.dumps({"error": "INVALID_INPUT", "detail": str(e)[:500]}), True
    try:
        return json.dumps(fn(args, ctx), default=str), False
    except Exception as e:
        return json.dumps({"error": str(e)[:500]}), True
