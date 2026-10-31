import pytest
from fastapi.testclient import TestClient

from app import Store, app, get_store

U1 = {"X-User-Id": "u1"}
U2 = {"X-User-Id": "u2"}


@pytest.fixture
def client():
    fresh = Store()
    app.dependency_overrides[get_store] = lambda: fresh  # each test gets an empty store
    with TestClient(app) as c:
        c.store = fresh
        yield c
    app.dependency_overrides.clear()


def test_health(client):
    assert client.get("/health").json() == {"status": "ok"}


def test_requires_user(client):
    assert client.get("/tasks").status_code == 401


def test_create_list_complete_delete(client):
    r = client.post("/tasks", json={"title": "Learn FastAPI", "priority": 1}, headers=U1)
    assert r.status_code == 201
    task = r.json()
    assert task["done"] is False and task["id"] == 1
    assert client.store.audit == ["u1 created task 1"]  # background task ran

    client.post("/tasks", json={"title": "Second"}, headers=U1)
    titles = [t["title"] for t in client.get("/tasks", headers=U1).json()]
    assert titles == ["Learn FastAPI", "Second"]  # sorted by priority

    assert client.patch("/tasks/1/done", headers=U1).json()["done"] is True
    assert len(client.get("/tasks?done=false", headers=U1).json()) == 1
    assert client.delete("/tasks/1", headers=U1).status_code == 204


def test_validation_errors(client):
    r = client.post("/tasks", json={"title": "", "priority": 9}, headers=U1)
    assert r.status_code == 422
    fields = {e["loc"][-1] for e in r.json()["detail"]}
    assert fields == {"title", "priority"}
    assert client.get("/tasks?limit=500", headers=U1).status_code == 422


def test_users_are_isolated(client):
    client.post("/tasks", json={"title": "private"}, headers=U1)
    assert client.get("/tasks", headers=U2).json() == []
    assert client.patch("/tasks/1/done", headers=U2).status_code == 404


def test_async_endpoint(client):
    client.post("/tasks", json={"title": "Plan trip"}, headers=U1)
    assert client.get("/tasks/1/suggest", headers=U1).json()["task"] == "Plan trip"


def test_streaming(client):
    with client.stream("GET", "/stream") as r:
        body = "".join(r.iter_text())
    assert body.count("data:") == 3 and "Jarvis" in body
