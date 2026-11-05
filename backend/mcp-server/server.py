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
"""
import os
import time

import httpx
from mcp.server.fastmcp import FastMCP

AI_URL = os.environ.get("AI_SERVICE_URL", "http://localhost:8001").rstrip("/")
TIMEOUT = float(os.environ.get("MCP_TIMEOUT", "120"))
HEADERS = {
    "X-Internal-Key": os.environ.get("INTERNAL_API_KEY", "change-me-internal-key"),
    # AZARVIS_USER_ID is the new name; JARVIS_USER_ID keeps older configs working.
    "X-User-Id": os.environ.get("AZARVIS_USER_ID") or os.environ.get("JARVIS_USER_ID", "local"),
}

mcp = FastMCP("azarvis")


class ServiceError(RuntimeError):
    """A clean, human-readable failure the MCP client can show without a stack trace."""


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


def _call(method: str, path: str, *, retries: int = 2, **kwargs):
    """Call the Azarvis AI service, retrying briefly while it is starting up.

    Connection refused or a 502/503 usually means the service is still booting (or
    restarting after an edit), so we wait and try again instead of failing at once.
    Raises ServiceError with a plain message on anything that can't be recovered.
    """
    last = "the Azarvis AI service did not respond"
    for attempt in range(retries + 1):
        try:
            resp = httpx.request(method, f"{AI_URL}{path}", headers=HEADERS, timeout=TIMEOUT, **kwargs)
        except httpx.ConnectError:
            last = (
                f"Can't reach the Azarvis AI service at {AI_URL}. Start everything with "
                '"npm run dev" in the project folder (or run uvicorn on :8001), then try again.'
            )
        except httpx.TimeoutException:
            last = f"The Azarvis AI service at {AI_URL} took longer than {TIMEOUT:.0f}s to answer."
        else:
            if resp.status_code < 400:
                if resp.status_code == 204 or not resp.content:
                    return {"ok": True}
                try:
                    return resp.json()
                except ValueError:
                    return {"text": resp.text}
            # 502/503 = gateway/service not ready yet: worth one more try.
            if resp.status_code in (502, 503) and attempt < retries:
                last = f"the AI service returned {resp.status_code}"
            else:
                raise ServiceError(f"Azarvis AI service error {resp.status_code}: {_detail(resp)}")
        if attempt < retries:
            time.sleep(0.8 * (attempt + 1))
    raise ServiceError(f"Couldn't complete the request: {last}.")


# ---------- Knowledge base (uploaded PDFs, notes, web pages) ----------

@mcp.tool()
def search_knowledge(query: str, k: int = 4) -> list[dict]:
    """Search the user's Azarvis knowledge base (uploaded PDFs, notes and saved web pages) and return matching passages."""
    hits = _call("POST", "/rag/search", json={"query": query, "k": max(1, min(k, 20))})
    return [{"source": h["source"], "score": h["score"], "text": h["text"]} for h in hits]


@mcp.tool()
def add_note(title: str, text: str) -> dict:
    """Save a text note into the Azarvis knowledge base so it can be searched later."""
    return _call("POST", "/rag/text", json={"title": title, "text": text})


@mcp.tool()
def add_web_page(url: str) -> dict:
    """Fetch a web page and add its text to the Azarvis knowledge base (blocked for private/local addresses)."""
    return _call("POST", "/rag/url", json={"url": url})


# ---------- Tasks & reminders ----------

@mcp.tool()
def list_tasks(include_done: bool = False) -> list[dict]:
    """List the user's Azarvis tasks."""
    return _call("GET", "/tasks", params={"include_done": include_done})


@mcp.tool()
def add_task(title: str, due: str | None = None, remind_at: str | None = None) -> dict:
    """Add a task to the user's Azarvis to-do list.

    due: free text like 'friday 5pm'. remind_at: ISO-8601 time for a reminder notification,
    e.g. '2026-11-02T17:00:00+05:30'.
    """
    return _call("POST", "/tasks", json={"title": title, "due": due, "remind_at": remind_at})


@mcp.tool()
def complete_task(task_id: int) -> dict:
    """Mark an Azarvis task as done."""
    return _call("PATCH", f"/tasks/{task_id}", json={"done": True})


@mcp.tool()
def delete_task(task_id: int) -> dict:
    """Delete an Azarvis task permanently."""
    return _call("DELETE", f"/tasks/{task_id}")


# ---------- Long-term memory ----------

@mcp.tool()
def remember(fact: str) -> dict:
    """Save a durable fact about the user to Azarvis's long-term memory."""
    return _call("POST", "/memories", json={"fact": fact})


@mcp.tool()
def recall() -> list[dict]:
    """List everything Azarvis remembers about the user."""
    return _call("GET", "/memories")


@mcp.tool()
def forget(memory_id: int) -> dict:
    """Delete one remembered fact by its id (see recall() for ids)."""
    return _call("DELETE", f"/memories/{memory_id}")


# ---------- Contacts ----------

@mcp.tool()
def list_contacts(query: str = "") -> list[dict]:
    """List the user's contacts, optionally filtered by a name/email/company search."""
    return _call("GET", "/contacts", params={"q": query})


@mcp.tool()
def add_contact(name: str, phone: str | None = None, email: str | None = None, company: str | None = None, notes: str | None = None) -> dict:
    """Add a contact to the user's Azarvis address book."""
    body = {"name": name, "phone": phone, "email": email, "company": company, "notes": notes}
    return _call("POST", "/contacts", json={k: v for k, v in body.items() if v is not None})


# ---------- The agent, NLP and notifications ----------

@mcp.tool()
def ask_azarvis(message: str) -> str:
    """Ask the Azarvis agent itself (it can use all of its own tools: web search, the user's data, the computer) and return its reply."""
    return _call("POST", "/chat", json={"message": message}).get("reply", "")


@mcp.tool()
def analyze_text(text: str) -> dict:
    """Run Azarvis's NLP pipeline on some text: intent classification, sentiment and named entities."""
    return _call("POST", "/nlp/analyze", json={"text": text})


@mcp.tool()
def mark_notifications_read(ids: list[int]) -> dict:
    """Mark the given reminder notifications as read."""
    return _call("POST", "/notifications/read", json={"ids": ids})


@mcp.tool()
def health() -> dict:
    """Check that the Azarvis AI service is reachable and whether its Claude API key works.

    Returns status, the configured model, the operating system and whether the service may
    control the computer. Use this first if other tools are failing.
    """
    return _call("GET", "/health", retries=0)


# ---------- Resources ----------

@mcp.resource("azarvis://stats")
def stats() -> dict:
    """The user's usage analytics from the Azarvis chat logs."""
    return _call("GET", "/stats")


@mcp.resource("azarvis://notifications")
def notifications() -> list[dict]:
    """The user's recent reminder notifications."""
    return _call("GET", "/notifications")


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
    else:
        # HTTP transports let several clients share one running server.
        mcp.settings.port = int(os.environ.get("MCP_HTTP_PORT", "8090"))
        mcp.run(transport=transport)
