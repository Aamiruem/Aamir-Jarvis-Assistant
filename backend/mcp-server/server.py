"""Azarvis MCP server: exposes Azarvis's abilities to any MCP client
(Claude Desktop, Claude Code, Cursor, ...) over the Model Context Protocol.

MCP standardises how an AI app discovers and calls tools, so the same Azarvis
skills you built for the web app become available inside other AI clients.

Run standalone (stdio):   python backend/mcp-server/server.py
Add to Claude Code:       claude mcp add azarvis -e AZARVIS_USER_ID=<your user id> -- python "<full path>/backend/mcp-server/server.py"
The AI service must be running (npm run dev, or uvicorn on :8001).

AZARVIS_USER_ID picks whose data the tools see: your user id (shown on the web app's
Account tab), or "local" (the default for the CLI and Streamlit). JARVIS_USER_ID is
still accepted for older setups.

Transport: stdio by default. Set MCP_TRANSPORT=streamable-http (with MCP_HTTP_PORT,
default 8090) to serve several clients over HTTP instead.

Every tool is async and shares one pooled HTTP connection to the AI service, so a slow
call (ask_azarvis can take a minute) never blocks the others. Tools carry MCP annotations
(read-only / destructive / idempotent) so clients can auto-approve reads and ask before deletes.
"""
import asyncio
import json
import os
from typing import Any

import httpx
from mcp.server.fastmcp import Context, FastMCP
from mcp.types import ToolAnnotations

AI_URL = os.environ.get("AI_SERVICE_URL", "http://localhost:8001").rstrip("/")
TIMEOUT = float(os.environ.get("MCP_TIMEOUT", "120"))  # longest wait for the service to send anything
HEADERS = {
    "X-Internal-Key": os.environ.get("INTERNAL_API_KEY", "change-me-internal-key"),
    # AZARVIS_USER_ID is the new name; JARVIS_USER_ID keeps older configs working.
    "X-User-Id": os.environ.get("AZARVIS_USER_ID") or os.environ.get("JARVIS_USER_ID", "local"),
}
MAX_SEARCH_RESULTS = 10  # the AI service rejects k > 10
# Safe to send twice: a retry after a 502/503 can't create a duplicate.
IDEMPOTENT = {"GET", "PUT", "PATCH", "DELETE"}

READ = ToolAnnotations(readOnlyHint=True, openWorldHint=False)
WRITE = ToolAnnotations(readOnlyHint=False, destructiveHint=False, idempotentHint=False, openWorldHint=False)
SET = ToolAnnotations(readOnlyHint=False, destructiveHint=False, idempotentHint=True, openWorldHint=False)
DELETE = ToolAnnotations(readOnlyHint=False, destructiveHint=True, idempotentHint=True, openWorldHint=False)

mcp = FastMCP("azarvis")
_client: httpx.AsyncClient | None = None


class ServiceError(RuntimeError):
    """A clean, human-readable failure the MCP client can show without a stack trace."""


def _http() -> httpx.AsyncClient:
    """One keep-alive connection pool for every tool call (created on first use)."""
    global _client
    if _client is None:
        _client = httpx.AsyncClient(
            base_url=AI_URL,
            headers=HEADERS,
            timeout=httpx.Timeout(TIMEOUT, connect=5.0),
            limits=httpx.Limits(max_connections=20, max_keepalive_connections=10),
        )
    return _client


def _detail(resp: httpx.Response) -> str:
    """The most useful message out of a FastAPI error response."""
    try:
        data = resp.json()
    except ValueError:
        return (resp.text or "").strip()[:300] or f"HTTP {resp.status_code}"
    detail = data.get("detail", data) if isinstance(data, dict) else data
    if isinstance(detail, list):  # pydantic validation errors
        return "; ".join(
            f"{'.'.join(str(p) for p in d.get('loc', []) if p != 'body')}: {d.get('msg', '')}".lstrip(": ")
            for d in detail
        )
    return str(detail)[:300]


def _unreachable() -> str:
    return (
        f"Can't reach the Azarvis AI service at {AI_URL}. Start everything with "
        '"npm run dev" in the project folder (or run uvicorn on :8001), then try again.'
    )


async def _call(method: str, path: str, *, retries: int = 2, **kwargs) -> Any:
    """Call the Azarvis AI service, retrying briefly while it is starting up.

    A refused connection never reached the service, so it is always safe to retry. A 502/503
    (service still booting) is retried only for idempotent methods, and a timeout is never
    retried: the service may have done the work already, and a second try would double it.
    Raises ServiceError with a plain message on anything that can't be recovered.
    """
    last = "the Azarvis AI service did not respond"
    for attempt in range(retries + 1):
        try:
            resp = await _http().request(method, path, **kwargs)
        except (httpx.ConnectError, httpx.ConnectTimeout):
            last = _unreachable()
        except httpx.TimeoutException:
            raise ServiceError(f"The Azarvis AI service at {AI_URL} took longer than {TIMEOUT:.0f}s to answer.")
        else:
            if resp.status_code < 400:
                if resp.status_code == 204 or not resp.content:
                    return {"ok": True}
                try:
                    return resp.json()
                except ValueError:
                    return {"text": resp.text}
            if resp.status_code in (502, 503) and method in IDEMPOTENT and attempt < retries:
                last = f"the AI service returned {resp.status_code}"
            else:
                raise ServiceError(f"Azarvis AI service error {resp.status_code}: {_detail(resp)}")
        if attempt < retries:
            await asyncio.sleep(0.8 * (attempt + 1))
    raise ServiceError(f"Couldn't complete the request: {last}.")


# ---------- Knowledge base (uploaded PDFs, notes, web pages) ----------

@mcp.tool(title="Search knowledge base", annotations=READ)
async def search_knowledge(query: str, k: int = 4) -> list[dict]:
    """Search the user's Azarvis knowledge base (uploaded PDFs, notes and saved web pages) and return matching passages (k: 1-10)."""
    hits = await _call("POST", "/rag/search", json={"query": query, "k": max(1, min(k, MAX_SEARCH_RESULTS))})
    return [{"source": h.get("source"), "score": h.get("score"), "text": h.get("text")} for h in hits]


@mcp.tool(title="Add note", annotations=WRITE)
async def add_note(title: str, text: str) -> dict:
    """Save a text note into the Azarvis knowledge base so it can be searched later."""
    return await _call("POST", "/rag/text", json={"title": title, "text": text})


@mcp.tool(title="Add web page", annotations=ToolAnnotations(readOnlyHint=False, destructiveHint=False, openWorldHint=True))
async def add_web_page(url: str) -> dict:
    """Fetch a web page and add its text to the Azarvis knowledge base (blocked for private/local addresses)."""
    return await _call("POST", "/rag/url", json={"url": url})


# ---------- Tasks & reminders ----------

@mcp.tool(title="List tasks", annotations=READ)
async def list_tasks(include_done: bool = False) -> list[dict]:
    """List the user's Azarvis tasks."""
    return await _call("GET", "/tasks", params={"include_done": include_done})


@mcp.tool(title="Add task", annotations=WRITE)
async def add_task(title: str, due: str | None = None, remind_at: str | None = None) -> dict:
    """Add a task to the user's Azarvis to-do list.

    due: free text like 'friday 5pm'. remind_at: ISO-8601 time for a reminder notification,
    e.g. '2026-11-02T17:00:00+05:30'.
    """
    return await _call("POST", "/tasks", json={"title": title, "due": due, "remind_at": remind_at})


@mcp.tool(title="Complete task", annotations=SET)
async def complete_task(task_id: int) -> dict:
    """Mark an Azarvis task as done."""
    return await _call("PATCH", f"/tasks/{task_id}", json={"done": True})


@mcp.tool(title="Delete task", annotations=DELETE)
async def delete_task(task_id: int) -> dict:
    """Delete an Azarvis task permanently."""
    return await _call("DELETE", f"/tasks/{task_id}")


# ---------- Long-term memory ----------

@mcp.tool(title="Remember a fact", annotations=WRITE)
async def remember(fact: str) -> dict:
    """Save a durable fact about the user to Azarvis's long-term memory."""
    return await _call("POST", "/memories", json={"fact": fact})


@mcp.tool(title="Recall memories", annotations=READ)
async def recall() -> list[dict]:
    """List everything Azarvis remembers about the user."""
    return await _call("GET", "/memories")


@mcp.tool(title="Forget a memory", annotations=DELETE)
async def forget(memory_id: int) -> dict:
    """Delete one remembered fact by its id (see recall() for ids)."""
    return await _call("DELETE", f"/memories/{memory_id}")


# ---------- Contacts ----------

@mcp.tool(title="List contacts", annotations=READ)
async def list_contacts(query: str = "") -> list[dict]:
    """List the user's contacts, optionally filtered by a name/email/company search."""
    return await _call("GET", "/contacts", params={"q": query})


@mcp.tool(title="Add contact", annotations=WRITE)
async def add_contact(name: str, phone: str | None = None, email: str | None = None, company: str | None = None, notes: str | None = None) -> dict:
    """Add a contact to the user's Azarvis address book."""
    body = {"name": name, "phone": phone, "email": email, "company": company, "notes": notes}
    return await _call("POST", "/contacts", json={k: v for k, v in body.items() if v is not None})


# ---------- The agent, NLP and notifications ----------

@mcp.tool(title="Ask Azarvis", annotations=ToolAnnotations(readOnlyHint=False, destructiveHint=False, openWorldHint=True))
async def ask_azarvis(message: str, ctx: Context) -> str:
    """Ask the Azarvis agent itself (it can use all of its own tools: web search, the user's data, the computer) and return its reply."""
    # Streams the agent's events, so the client sees each tool Azarvis uses as it happens, and
    # TIMEOUT applies to silence between events rather than to the whole (possibly long) answer.
    reply, errors, steps = [], [], 0
    try:
        async with _http().stream("POST", "/chat/stream", json={"message": message}) as resp:
            if resp.status_code >= 400:
                await resp.aread()
                raise ServiceError(f"Azarvis AI service error {resp.status_code}: {_detail(resp)}")
            async for line in resp.aiter_lines():
                if not line.startswith("data:"):
                    continue
                try:
                    ev = json.loads(line[5:])
                except ValueError:
                    continue
                kind = ev.get("type")
                if kind == "text":
                    reply.append(ev.get("text", ""))
                elif kind == "tool":
                    steps += 1
                    await ctx.report_progress(steps, message=f"Used {ev.get('name')}")
                    await ctx.info(f"Azarvis used {ev.get('name')}" + ("" if ev.get("ok", True) else " (it failed)"))
                elif kind == "error":
                    errors.append(ev.get("message", "Unknown error"))
    except (httpx.ConnectError, httpx.ConnectTimeout):
        raise ServiceError(_unreachable())
    except httpx.TimeoutException:
        raise ServiceError(f"Azarvis went quiet for more than {TIMEOUT:.0f}s, so the request was stopped.")
    text = "".join(reply).strip()
    if not text and errors:
        raise ServiceError(" ".join(errors))
    return text


@mcp.tool(title="Analyze text", annotations=READ)
async def analyze_text(text: str) -> dict:
    """Run Azarvis's NLP pipeline on some text: intent classification, sentiment and named entities."""
    return await _call("POST", "/nlp/analyze", json={"text": text})


@mcp.tool(title="Read emotions", annotations=READ)
async def read_emotions(text: str) -> dict:
    """Read how a message feels, the way Azarvis does before it answers: the emotion and its
    intensity (e.g. frustrated 0.8), what the writer needs (fix, learn, act, decide, vent...),
    the tone and approach to answer with, and a voice style. Use it to answer people more humanly.
    Looks only: it does not change the user's conversation mood."""
    return await _call("POST", "/mind/understand", json={"text": text, "track": False})


@mcp.tool(title="Mark notifications read", annotations=SET)
async def mark_notifications_read(ids: list[int]) -> dict:
    """Mark the given reminder notifications as read."""
    return await _call("POST", "/notifications/read", json={"ids": ids})


@mcp.tool(title="Health check", annotations=READ)
async def health() -> dict:
    """Check that the Azarvis AI service is reachable and whether its Claude API key works.

    Returns status, the configured model, the operating system and whether the service may
    control the computer. Use this first if other tools are failing.
    """
    return await _call("GET", "/health", retries=0)


# ---------- Resources ----------

@mcp.resource("azarvis://stats")
async def stats() -> dict:
    """The user's usage analytics from the Azarvis chat logs."""
    return await _call("GET", "/stats")


@mcp.resource("azarvis://notifications")
async def notifications() -> list[dict]:
    """The user's recent reminder notifications."""
    return await _call("GET", "/notifications")


# ---------- Prompts ----------

@mcp.prompt()
def plan_my_day() -> str:
    """A ready-made prompt that asks Azarvis to plan the day from the user's tasks and reminders."""
    return (
        "Look at my Azarvis tasks and reminders (use list_tasks) and plan my day: "
        "what to do first, what to follow up on, and what can wait. Keep it short and specific."
    )


@mcp.prompt()
def catch_up() -> str:
    """A ready-made prompt that summarises what needs the user's attention right now."""
    return (
        "Check my Azarvis notifications and open tasks, then tell me in a few lines what "
        "needs my attention right now and what I can ignore."
    )


if __name__ == "__main__":
    transport = os.environ.get("MCP_TRANSPORT", "stdio")
    if transport == "stdio":
        mcp.run()
    elif transport in ("streamable-http", "sse"):
        # HTTP transports let several clients share one running server.
        mcp.settings.port = int(os.environ.get("MCP_HTTP_PORT", "8090"))
        mcp.run(transport=transport)
    else:
        raise SystemExit(f'MCP_TRANSPORT must be "stdio", "streamable-http" or "sse", not "{transport}".')
