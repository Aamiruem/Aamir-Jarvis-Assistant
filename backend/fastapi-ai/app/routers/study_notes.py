"""Notes written by Azarvis with the master prompt: start a job, then poll it."""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from app import study_notes
from app.mllab import jobs
from app.security import Caller, get_caller

router = APIRouter(prefix="/study-notes", tags=["notes"])


class Lecture(BaseModel):
    n: int | None = None
    title: str = Field("", max_length=300)
    course: str = Field("", max_length=200)
    description: str = Field("", max_length=8000)


class NotesRequest(BaseModel):
    topic: str = Field(..., min_length=2, max_length=300)
    lecture: Lecture | None = None
    context: str = Field("", max_length=20_000)


@router.post("/generate")
async def generate(body: NotesRequest, caller: Caller = Depends(get_caller)):
    lecture = body.lecture.model_dump() if body.lecture else None
    return jobs.start(caller.user_id, "notes", lambda progress: study_notes.generate(body.topic, lecture, body.context, progress))


@router.get("/jobs/{job_id}")
async def job(job_id: str, caller: Caller = Depends(get_caller)):
    found = jobs.get(caller.user_id, job_id)
    if not found:
        raise HTTPException(404, "Job not found.")
    return found
