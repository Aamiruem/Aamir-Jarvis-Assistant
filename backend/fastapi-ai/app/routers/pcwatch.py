"""PC watcher settings: which changes on this computer Azarvis tells you about (see app/pc_watcher.py)."""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from app import pc_watcher
from app.db import sql
from app.security import Caller, get_caller

router = APIRouter(prefix="/pc-watcher", tags=["pc-watcher"])


class WatcherSettings(BaseModel):
    enabled: bool
    checks: list[str] = Field(default_factory=lambda: list(pc_watcher.CHECKS), max_length=len(pc_watcher.CHECKS))


@router.get("")
async def get_settings(caller: Caller = Depends(get_caller)):
    return pc_watcher.get_settings(caller.user_id)


@router.put("")
async def put_settings(body: WatcherSettings, caller: Caller = Depends(get_caller)):
    unknown = set(body.checks) - set(pc_watcher.CHECKS)
    if unknown:
        raise HTTPException(422, f"Unknown checks: {', '.join(sorted(unknown))}")
    return pc_watcher.set_settings(caller.user_id, body.enabled, body.checks)


@router.post("/test")
async def test_alert(caller: Caller = Depends(get_caller)):
    """Sends one sample alert, so you can hear and see what an alert looks like."""
    return sql.add_notification(caller.user_id, "PC watcher is on", "Azarvis will tell you when something on this computer needs you.")
