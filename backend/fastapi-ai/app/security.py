"""Who is calling?

The AI service sits behind the Node gateway. Trusted callers prove themselves with the
shared X-Internal-Key; the gateway then states which user the request is for in
X-User-Id / X-User-Role (taken from the verified JWT, never from the browser).
Other trusted tools (Streamlit, MCP, CLI) send their own user id, default "local".
"""
import re
import secrets
from dataclasses import dataclass

from fastapi import Depends, Header, HTTPException

from app.config import settings

# Must start with a letter/digit, so ids like ".." can never escape the per-user upload folder.
USER_ID_RE = re.compile(r"^[A-Za-z0-9][A-Za-z0-9_.@-]{0,63}$")


async def require_internal_key(x_internal_key: str = Header(default="")) -> None:
    if not secrets.compare_digest(x_internal_key, settings.internal_api_key):
        raise HTTPException(status_code=401, detail="Invalid internal API key")


@dataclass(frozen=True)
class Caller:
    user_id: str
    is_admin: bool = False


async def get_caller(x_user_id: str = Header(default="local"), x_user_role: str = Header(default="user")) -> Caller:
    if not USER_ID_RE.match(x_user_id):
        raise HTTPException(status_code=400, detail="Invalid X-User-Id")
    return Caller(user_id=x_user_id, is_admin=x_user_role == "admin")


async def require_admin(caller: Caller = Depends(get_caller)) -> Caller:
    if not caller.is_admin:
        raise HTTPException(status_code=403, detail="Admin only")
    return caller
