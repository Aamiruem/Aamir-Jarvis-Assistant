"""Emergency safe mode: one switch that stops Jarvis from acting.

While on: every running scan and agent task is stopped when it is switched on; agents and chat can't
use tools that act (PC control, opening apps/files/sites, email drafts, clipboard writes, memory
changes, contacts); approved fixes and active network scans are refused. Read-only checks of this
PC still work, so you can investigate safely. Kept in data_dir so it survives a restart.
"""
from __future__ import annotations

import json
import threading
import time

from app.config import settings

FILE = settings.data_dir / "safe_mode.json"
_lock = threading.Lock()
_state: dict | None = None


def _load() -> dict:
    global _state
    if _state is None:
        try:
            _state = json.loads(FILE.read_text(encoding="utf-8"))
        except (OSError, ValueError):
            _state = {"on": False, "since": None, "by": None}
    return _state


def state() -> dict:
    with _lock:
        return dict(_load())


def is_on() -> bool:
    return bool(state().get("on"))


def set_on(on: bool, by: str) -> dict:
    global _state
    with _lock:
        _state = {"on": bool(on), "since": time.time() if on else None, "by": by if on else None}
        try:
            FILE.write_text(json.dumps(_state), encoding="utf-8")
        except OSError:
            pass
        return dict(_state)


BLOCK_MESSAGE = "Emergency safe mode is on: Jarvis can't take actions until you switch it off in Cyber Ops. Read-only checks still work."
