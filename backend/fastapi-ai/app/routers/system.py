import asyncio

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.system_control import SystemControlError, run_action, system_status

router = APIRouter(prefix="/system", tags=["system"])


class ActionIn(BaseModel):
    action: str = Field(max_length=40)
    target: str | None = Field(None, max_length=2000)


@router.get("/status")
async def status():
    try:
        return await asyncio.to_thread(system_status)
    except SystemControlError as e:
        raise HTTPException(status_code=503, detail=str(e))


@router.post("/action")
async def action(body: ActionIn):
    try:
        return await asyncio.to_thread(run_action, body.action, body.target)
    except SystemControlError as e:
        raise HTTPException(status_code=400, detail=str(e))
