"""Jarvis MCP server: exposes Jarvis's abilities to any MCP client
(Claude Desktop, Claude Code, Cursor, ...) over the Model Context Protocol.

MCP standardises how an AI app discovers and calls tools, so the same Jarvis
skills you built for the web app become available inside other AI clients.

Run standalone (stdio):   python backend/mcp-server/server.py
Add to Claude Code:       claude mcp add jarvis -e JARVIS_USER_ID=<your user id> -- python "<full path>/backend/mcp-server/server.py"
The AI service must be running (npm run dev, or uvicorn on :8001).

JARVIS_USER_ID picks whose data the tools see: your user id (shown on the web app's
Account tab), or "local" (the default for the CLI and Streamlit).
"""
import os

import httpx
from mcp.server.fastmcp import FastMCP

AI_URL = os.environ.get("AI_SERVICE_URL", "http://localhost:8001")
HEADERS = {
    "X-Internal-Key": os.environ.get("INTERNAL_API_KEY", "change-me-internal-key"),
    "X-User-Id": os.environ.get("JARVIS_USER_ID", "local"),
}

mcp = FastMCP("jarvis")


def _call(method: str, path: str, **kwargs):
    r = httpx.request(method, f"{AI_URL}{path}", headers=HEADERS, timeout=120, **kwargs)
    r.raise_for_status()
    return r.json()


@mcp.tool()
def search_knowledge(query: str, k: int = 4) -> list[dict]:
    """Search the user's Jarvis knowledge base (uploaded PDFs and notes) and return matching passages."""
    return [{"source": h["source"], "score": h["score"], "text": h["text"]} for h in _call("POST", "/rag/search", json={"query": query, "k": k})]


@mcp.tool()
def add_note(title: str, text: str) -> dict:
    """Save a text note into the Jarvis knowledge base so it can be searched later."""
    return _call("POST", "/rag/text", json={"title": title, "text": text})


@mcp.tool()
def list_tasks(include_done: bool = False) -> list[dict]:
    """List the user's Jarvis tasks."""
    return _call("GET", "/tasks", params={"include_done": include_done})


@mcp.tool()
def add_task(title: str, due: str | None = None, remind_at: str | None = None) -> dict:
    """Add a task to the user's Jarvis to-do list.

    due: free text like 'friday 5pm'. remind_at: ISO-8601 time for a reminder notification,
    e.g. '2026-11-02T17:00:00+05:30'.
    """
    return _call("POST", "/tasks", json={"title": title, "due": due, "remind_at": remind_at})


@mcp.tool()
def complete_task(task_id: int) -> dict:
    """Mark a Jarvis task as done."""
    return _call("PATCH", f"/tasks/{task_id}", json={"done": True})


@mcp.tool()
def remember(fact: str) -> dict:
    """Save a durable fact about the user to Jarvis's long-term memory."""
    return _call("POST", "/memories", json={"fact": fact})


@mcp.tool()
def recall() -> list[dict]:
    """List everything Jarvis remembers about the user."""
    return _call("GET", "/memories")


@mcp.tool()
def ask_jarvis(message: str) -> str:
    """Ask the Jarvis agent itself (it can use all of its own tools) and return its reply."""
    return _call("POST", "/chat", json={"message": message})["reply"]


@mcp.tool()
def analyze_text(text: str) -> dict:
    """Run Jarvis's NLP pipeline: intent classification, sentiment and named entities."""
    return _call("POST", "/nlp/analyze", json={"text": text})


@mcp.resource("jarvis://stats")
def stats() -> dict:
    """The user's usage analytics from the Jarvis chat logs."""
    return _call("GET", "/stats")


@mcp.resource("jarvis://notifications")
def notifications() -> list[dict]:
    """The user's recent reminder notifications."""
    return _call("GET", "/notifications")


if __name__ == "__main__":
    mcp.run()
