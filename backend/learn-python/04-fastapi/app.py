"""04 · FastAPI — a complete small API.

Run the server:  uvicorn app:app --reload --app-dir 04-fastapi      → http://localhost:8000/docs
Run the tests:   pytest 04-fastapi
"""
import asyncio
from datetime import datetime
from typing import Annotated

from fastapi import APIRouter, BackgroundTasks, Depends, FastAPI, Header, HTTPException, Query, status
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field


# ── Pydantic models: validation, serialization and docs from type hints ─────
class TaskCreate(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    priority: int = Field(default=3, ge=1, le=5)
    remind_at: datetime | None = None


class TaskOut(TaskCreate):
    id: int
    done: bool


# ── Dependencies ─────────────────────────────────────────────────────────────
class Store:
    def __init__(self) -> None:
        self.rows: dict[int, dict] = {}
        self.audit: list[str] = []
        self.next_id = 1


store = Store()


def get_store() -> Store:
    return store


def current_user(x_user_id: Annotated[str | None, Header()] = None) -> str:
    if not x_user_id:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Missing X-User-Id header")
    return x_user_id


DB = Annotated[Store, Depends(get_store)]
User = Annotated[str, Depends(current_user)]

# ── Router ───────────────────────────────────────────────────────────────────
router = APIRouter(prefix="/tasks", tags=["tasks"])


@router.get("", response_model=list[TaskOut])
def list_tasks(db: DB, user: User, done: bool | None = None,
               limit: Annotated[int, Query(ge=1, le=100)] = 20):
    rows = [t for t in db.rows.values() if t["user_id"] == user and (done is None or t["done"] == done)]
    return sorted(rows, key=lambda t: t["priority"])[:limit]


@router.post("", response_model=TaskOut, status_code=status.HTTP_201_CREATED)
def create_task(body: TaskCreate, db: DB, user: User, background: BackgroundTasks):
    task = {"id": db.next_id, "user_id": user, "done": False, **body.model_dump()}
    db.rows[db.next_id] = task
    db.next_id += 1
    background.add_task(db.audit.append, f"{user} created task {task['id']}")  # runs after the response
    return task


def _owned(db: Store, user: str, task_id: int) -> dict:
    task = db.rows.get(task_id)
    if not task or task["user_id"] != user:
        raise HTTPException(404, "Task not found")  # same answer whether it exists or not
    return task


@router.patch("/{task_id}/done", response_model=TaskOut)
def complete_task(task_id: int, db: DB, user: User):
    task = _owned(db, user, task_id)
    task["done"] = True
    return task


@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_task(task_id: int, db: DB, user: User):
    _owned(db, user, task_id)
    del db.rows[task_id]


@router.get("/{task_id}/suggest")
async def suggest(task_id: int, db: DB, user: User):
    task = _owned(db, user, task_id)
    await asyncio.sleep(0.05)  # stands in for an awaited LLM call
    return {"task": task["title"], "suggestion": "Break it into 3 smaller steps."}


app = FastAPI(title="Learn FastAPI")
app.include_router(router)


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/stream")
async def stream():
    """Server-Sent Events: how chat apps stream LLM tokens to the browser."""
    async def gen():
        for word in "Hello from Jarvis".split():
            yield f"data: {word}\n\n"
            await asyncio.sleep(0.01)
    return StreamingResponse(gen(), media_type="text/event-stream")
