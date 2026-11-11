"""Vision, NLP, tasks, memory, notifications, account and analytics endpoints."""
import asyncio

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from pydantic import BaseModel, Field

from app.cv import vision
from app.db import sql
from app.mind.state import tracker as mood_tracker
from app.mllab import registry as mllab_registry
from app.nlp.analyzer import analyze
from app.nlp.intent import get_classifier
from app.rag.store import get_store
from app.security import Caller, get_caller, require_admin
from app.storage.s3 import delete_user_files
from app.timeutil import parse_when

router = APIRouter()

ALLOWED_IMAGES = {"image/jpeg", "image/png", "image/webp", "image/gif"}
MAX_IMAGE = 10 * 1024 * 1024


# ---------- Vision ----------

@router.post("/vision/analyze", tags=["vision"])
async def analyze_image(file: UploadFile = File(...), question: str = Form(""), use_llm: bool = Form(True)):
    if file.content_type not in ALLOWED_IMAGES:
        raise HTTPException(415, f"Unsupported image type {file.content_type}")
    data = await file.read()
    if len(data) > MAX_IMAGE:
        raise HTTPException(413, "Image too large (10 MB max)")
    try:
        img = vision.decode(data)
    except ValueError as e:
        raise HTTPException(422, str(e))
    result = {"faces": vision.detect_faces(img), "stats": vision.image_stats(img)}
    if use_llm:
        result["description"] = await vision.describe_image(data, file.content_type, question[:1000] or None)
    return result


# ---------- NLP ----------

class TextIn(BaseModel):
    text: str = Field(min_length=1, max_length=5000)


@router.post("/nlp/analyze", tags=["nlp"])
async def nlp_analyze(body: TextIn):
    return analyze(body.text)


@router.post("/nlp/retrain", tags=["nlp"], dependencies=[Depends(require_admin)])
async def nlp_retrain():
    await asyncio.to_thread(get_classifier().retrain)
    return {"status": "retrained"}


# ---------- Contacts (SQL CRUD) ----------

class ContactIn(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    phone: str | None = Field(None, max_length=40)
    email: str | None = Field(None, max_length=254)
    company: str | None = Field(None, max_length=120)
    notes: str | None = Field(None, max_length=500)
    favorite: bool = False


class ContactPatch(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=120)
    phone: str | None = Field(None, max_length=40)
    email: str | None = Field(None, max_length=254)
    company: str | None = Field(None, max_length=120)
    notes: str | None = Field(None, max_length=500)
    favorite: bool | None = None


@router.get("/contacts", tags=["contacts"])
async def get_contacts(q: str = "", caller: Caller = Depends(get_caller)):
    return sql.list_contacts(caller.user_id, q[:100])


@router.post("/contacts", tags=["contacts"])
async def post_contact(c: ContactIn, caller: Caller = Depends(get_caller)):
    try:
        return sql.create_contact(caller.user_id, **c.model_dump())
    except ValueError as e:
        raise HTTPException(409, str(e))


@router.patch("/contacts/{contact_id}", tags=["contacts"])
async def patch_contact(contact_id: int, p: ContactPatch, caller: Caller = Depends(get_caller)):
    contact = sql.update_contact(caller.user_id, contact_id, **p.model_dump(exclude_unset=True))
    if contact is None:
        raise HTTPException(404, "Contact not found")
    return contact


@router.delete("/contacts/{contact_id}", tags=["contacts"])
async def remove_contact(contact_id: int, caller: Caller = Depends(get_caller)):
    if not sql.delete_contact(caller.user_id, contact_id):
        raise HTTPException(404, "Contact not found")
    return {"deleted": contact_id}


# ---------- Tasks & reminders (SQL CRUD) ----------

class TaskIn(BaseModel):
    title: str = Field(min_length=1, max_length=300)
    due: str | None = Field(None, max_length=80)
    remind_at: str | None = None  # ISO-8601


class TaskPatch(BaseModel):
    done: bool


@router.get("/tasks", tags=["tasks"])
async def get_tasks(include_done: bool = False, caller: Caller = Depends(get_caller)):
    return sql.list_tasks(caller.user_id, include_done)


@router.post("/tasks", tags=["tasks"])
async def post_task(t: TaskIn, caller: Caller = Depends(get_caller)):
    try:
        remind_at = parse_when(t.remind_at)
    except ValueError as e:
        raise HTTPException(422, str(e))
    return sql.create_task(caller.user_id, t.title, t.due, remind_at)


@router.patch("/tasks/{task_id}", tags=["tasks"])
async def patch_task(task_id: int, p: TaskPatch, caller: Caller = Depends(get_caller)):
    task = sql.set_task_done(caller.user_id, task_id, p.done)
    if task is None:
        raise HTTPException(404, "Task not found")
    return task


@router.delete("/tasks/{task_id}", tags=["tasks"])
async def remove_task(task_id: int, caller: Caller = Depends(get_caller)):
    if not sql.delete_task(caller.user_id, task_id):
        raise HTTPException(404, "Task not found")
    return {"deleted": task_id}


# ---------- Notifications ----------

class ReadIds(BaseModel):
    ids: list[int] = Field(max_length=200)


@router.get("/notifications", tags=["notifications"])
async def notifications(unread_only: bool = False, caller: Caller = Depends(get_caller)):
    return sql.list_notifications(caller.user_id, unread_only)


@router.post("/notifications/read", tags=["notifications"])
async def read_notifications(body: ReadIds, caller: Caller = Depends(get_caller)):
    return {"marked": sql.mark_notifications_read(caller.user_id, body.ids)}


# ---------- Long-term memory ----------

class MemoryIn(BaseModel):
    fact: str = Field(min_length=1, max_length=500)


@router.get("/memories", tags=["memory"])
async def memories(caller: Caller = Depends(get_caller)):
    return sql.list_memories(caller.user_id)


@router.post("/memories", tags=["memory"])
async def add_memory(m: MemoryIn, caller: Caller = Depends(get_caller)):
    try:
        return sql.add_memory(caller.user_id, m.fact)
    except ValueError as e:
        raise HTTPException(409, str(e))


@router.delete("/memories/{memory_id}", tags=["memory"])
async def delete_memory(memory_id: int, caller: Caller = Depends(get_caller)):
    if not sql.delete_memory(caller.user_id, memory_id):
        raise HTTPException(404, "Memory not found")
    return {"deleted": memory_id}


# ---------- Account ----------

@router.delete("/me/data", tags=["account"])
async def delete_my_data(caller: Caller = Depends(get_caller)):
    """Erase everything the AI service holds for this user (called when an account is deleted)."""
    return {
        **sql.delete_user_data(caller.user_id),
        "rag_chunks": get_store().delete_user(caller.user_id),
        "files": delete_user_files(caller.user_id),
        "ml_models": mllab_registry.delete_user(caller.user_id) or "deleted",
        "mood": mood_tracker.clear(caller.user_id) or "forgotten",
    }


# ---------- Analytics ----------

@router.get("/stats", tags=["analytics"])
async def my_stats(caller: Caller = Depends(get_caller)):
    return sql.chat_stats(caller.user_id)


@router.get("/admin/stats", tags=["analytics"], dependencies=[Depends(require_admin)])
async def global_stats():
    return sql.chat_stats(None)
