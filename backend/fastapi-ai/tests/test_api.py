"""API tests through FastAPI's TestClient (no API key needed; the LLM isn't called)."""
import json
from datetime import datetime, timedelta, timezone

import pytest
from fastapi.testclient import TestClient

from app.agent.agent import _user_context
from app.agent.tools import ToolContext, run_tool
from app.db import sql
from app.main import app


def headers(user="alice", role="user"):
    return {"X-Internal-Key": "test-key", "X-User-Id": user, "X-User-Role": role}


@pytest.fixture(scope="module")
def client():
    with TestClient(app) as c:
        yield c


def test_requires_internal_key(client):
    assert client.get("/tasks").status_code == 401
    assert client.get("/tasks", headers={"X-Internal-Key": "wrong"}).status_code == 401


def test_rejects_bad_user_ids(client):
    for bad in ("..", "../etc", "a/b", ""):
        assert client.get("/tasks", headers=headers(user=bad)).status_code in (400, 422), bad


def test_tasks_are_isolated_per_user(client):
    t = client.post("/tasks", json={"title": "Alice's secret task"}, headers=headers("alice")).json()
    assert any(x["id"] == t["id"] for x in client.get("/tasks", headers=headers("alice")).json())
    assert client.get("/tasks", headers=headers("bob")).json() == []
    assert client.patch(f"/tasks/{t['id']}", json={"done": True}, headers=headers("bob")).status_code == 404
    assert client.delete(f"/tasks/{t['id']}", headers=headers("bob")).status_code == 404
    assert client.patch(f"/tasks/{t['id']}", json={"done": True}, headers=headers("alice")).json()["done"]


def test_documents_are_isolated_per_user(client):
    doc = "Leave policy\n\nEmployees get 24 days of paid leave per year."
    d = client.post("/rag/upload", files={"file": ("policy.txt", doc.encode(), "text/plain")}, headers=headers("alice")).json()
    assert d["chunks"] == 1
    hits = client.post("/rag/search", json={"query": "how many days of paid leave"}, headers=headers("alice")).json()
    assert hits and hits[0]["source"] == "policy.txt"
    assert client.post("/rag/search", json={"query": "paid leave"}, headers=headers("bob")).json() == []
    assert client.get("/rag/documents", headers=headers("bob")).json() == []
    assert client.delete(f"/rag/documents/{d['doc_id']}", headers=headers("bob")).status_code == 404


def test_rejects_unsupported_upload(client):
    r = client.post("/rag/upload", files={"file": ("evil.exe", b"MZ", "application/octet-stream")}, headers=headers())
    assert r.status_code == 415


def test_memory_crud_and_agent_context(client):
    m = client.post("/memories", json={"fact": "Prefers answers in Hindi when tired."}, headers=headers("carol")).json()
    assert "Prefers answers in Hindi" in _user_context("carol")
    assert "Prefers answers in Hindi" not in _user_context("dave")
    out, err = run_tool("remember", {"fact": "Has a dog named Bruno."}, ToolContext("carol"))
    assert not err
    assert len(client.get("/memories", headers=headers("carol")).json()) == 2
    _, err = run_tool("forget", {"memory_id": m["id"]}, ToolContext("dave"))
    assert err  # dave can't delete carol's memory
    assert client.delete(f"/memories/{m['id']}", headers=headers("carol")).status_code == 200


def test_reminders_become_notifications(client):
    past = (datetime.now(timezone.utc) - timedelta(minutes=1)).isoformat()
    future = (datetime.now(timezone.utc) + timedelta(days=1)).isoformat()
    client.post("/tasks", json={"title": "Call the bank", "remind_at": past}, headers=headers("erin"))
    client.post("/tasks", json={"title": "Later thing", "remind_at": future}, headers=headers("erin"))
    out, err = run_tool("create_task", {"title": "Pay rent", "remind_at": past}, ToolContext("erin"))
    assert not err and json.loads(out)["remind_at"]

    assert sql.fire_due_reminders() >= 2
    assert sql.fire_due_reminders() == 0  # each reminder fires once

    notes = client.get("/notifications?unread_only=true", headers=headers("erin")).json()
    titles = {n["title"] for n in notes}
    assert {"Reminder: Call the bank", "Reminder: Pay rent"} <= titles
    assert "Reminder: Later thing" not in titles
    assert client.get("/notifications", headers=headers("frank")).json() == []

    client.post("/notifications/read", json={"ids": [n["id"] for n in notes]}, headers=headers("erin"))
    assert client.get("/notifications?unread_only=true", headers=headers("erin")).json() == []


def test_bad_remind_at_is_rejected(client):
    assert client.post("/tasks", json={"title": "x", "remind_at": "next tuesday"}, headers=headers()).status_code == 422


def test_admin_only_routes(client):
    assert client.get("/admin/stats", headers=headers()).status_code == 403
    assert client.post("/nlp/retrain", headers=headers()).status_code == 403
    assert "active_users" in client.get("/admin/stats", headers=headers(role="admin")).json()


def test_delete_my_data(client):
    h = headers("gina")
    client.post("/tasks", json={"title": "temp"}, headers=h)
    client.post("/memories", json={"fact": "temp fact"}, headers=h)
    client.post("/rag/text", json={"title": "note", "text": "some text to index"}, headers=h)
    result = client.delete("/me/data", headers=h).json()
    assert result["tasks"] == 1 and result["memories"] == 1 and result["rag_chunks"] == 1
    assert client.get("/tasks", headers=h).json() == []
    assert client.get("/memories", headers=h).json() == []
    assert client.get("/rag/documents", headers=h).json() == []


def test_contacts_crud_search_and_privacy(client):
    h = headers("hana")
    priya = client.post("/contacts", json={"name": "Priya Sharma", "email": "priya@example.com", "company": "Manager at Infosys"}, headers=h).json()
    client.post("/contacts", json={"name": "rahul verma", "phone": "+91 98765 43210"}, headers=h)
    client.post("/contacts", json={"name": "Zoya Khan", "favorite": True}, headers=h)

    names = [c["name"] for c in client.get("/contacts", headers=h).json()]
    assert names == ["Zoya Khan", "Priya Sharma", "rahul verma"]  # favorites first, then A to Z ignoring case
    assert [c["name"] for c in client.get("/contacts?q=infosys", headers=h).json()] == ["Priya Sharma"]
    assert [c["name"] for c in client.get("/contacts?q=98765", headers=h).json()] == ["rahul verma"]

    assert client.get("/contacts", headers=headers("ivan")).json() == []
    assert client.patch(f"/contacts/{priya['id']}", json={"favorite": True}, headers=headers("ivan")).status_code == 404
    assert client.delete(f"/contacts/{priya['id']}", headers=headers("ivan")).status_code == 404

    updated = client.patch(f"/contacts/{priya['id']}", json={"phone": "+91 90000 00000", "name": None}, headers=h).json()
    assert updated["phone"] == "+91 90000 00000" and updated["name"] == "Priya Sharma"  # name can't be blanked
    assert client.post("/contacts", json={"name": ""}, headers=h).status_code == 422
    assert client.delete(f"/contacts/{priya['id']}", headers=h).status_code == 200
    assert len(client.get("/contacts", headers=h).json()) == 2


def test_agent_finds_and_adds_contacts(client):
    ctx = ToolContext("jay")
    out, err = run_tool("add_contact", {"name": "Priya", "email": "priya@corp.example"}, ctx)
    assert not err
    out, err = run_tool("find_contact", {"query": "pri"}, ctx)
    assert not err and json.loads(out)["contacts"][0]["email"] == "priya@corp.example"
    out, _ = run_tool("find_contact", {"query": "pri"}, ToolContext("kim"))
    assert json.loads(out)["contacts"] == []  # other users' contacts are invisible
