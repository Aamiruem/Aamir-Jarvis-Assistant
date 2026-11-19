"""Who is calling?

The AI service sits behind the Node gateway. Trusted callers prove themselves with the
shared X-Internal-Key; the gateway then states which user the request is for in
X-User-Id / X-User-Role (taken from the verified JWT, never from the browser).
Other trusted tools (Streamlit, MCP, CLI) send their own user id, default "local".
"""
import re
import secrets
from dataclasses import dataclass

from fastapi import Depends, Header, HTTPException, Request

from app.config import settings

# Must start with a letter/digit, so ids like ".." can never escape the per-user upload folder.
USER_ID_RE = re.compile(r"^[A-Za-z0-9][A-Za-z0-9_.@-]{0,63}$")


# The key in .env.example and the code default: public, so it only counts from this same computer.
DEFAULT_INTERNAL_KEY = "change-me-internal-key"
LOOPBACK = {"127.0.0.1", "::1", "localhost", "testclient"}  # "testclient": FastAPI's TestClient


def using_default_key() -> bool:
    return settings.internal_api_key == DEFAULT_INTERNAL_KEY


async def require_internal_key(request: Request, x_internal_key: str = Header(default="")) -> None:
    if not secrets.compare_digest(x_internal_key.encode(), settings.internal_api_key.encode()):
        raise HTTPException(status_code=401, detail="Invalid internal API key")
    # Everyone can read the default key in this repository: with it, anyone who can reach this port
    # could act as any user. Accept it only from this computer (local development).
    client = request.client.host if request.client else ""
    if using_default_key() and client not in LOOPBACK:
        raise HTTPException(
            status_code=401,
            detail="INTERNAL_API_KEY is still the public default; set your own in .env before calling from another machine or container",
        )


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
