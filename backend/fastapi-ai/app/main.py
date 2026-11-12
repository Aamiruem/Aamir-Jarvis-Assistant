"""Azarvis AI service (FastAPI).

Run:  uvicorn app.main:app --reload --port 8001   (from backend/fastapi-ai)
  or: python main.py                               (from backend/fastapi-ai/app)
Docs: http://localhost:8001/docs  (interactive Swagger UI - send the X-Internal-Key header,
      plus X-User-Id to act as a specific user)
"""
import os
import sys

if __package__ in (None, ""):  # started as `python main.py`: make the `app` package importable
    sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import asyncio
import contextlib
import logging
import time
import uuid
from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.db.sql import init_db
from app.llm.claude import key_status
from app.system_control import current_os
from app.nlp.intent import get_classifier
from app.rag.store import get_store
from app.routers import chat, local_bridge, mind, misc, mllab, pcwatch, rag, study_notes, system, tts, whatsapp
from app.pc_watcher import watch_loop
from app.scheduler import reminder_loop
from app.whatsapp.loop import whatsapp_loop
from app.security import require_internal_key

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")
log = logging.getLogger("jarvis.api")


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    get_classifier()  # trains the intent model on first run
    get_store()
    background = [asyncio.create_task(reminder_loop()), asyncio.create_task(watch_loop()), asyncio.create_task(whatsapp_loop())]
    yield
    for task in background:
        task.cancel()
        with contextlib.suppress(asyncio.CancelledError):
            await task


app = FastAPI(title="Azarvis AI Service", version="2.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in settings.cors_origins.split(",")],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def access_log(request: Request, call_next):
    """Logs one line per request with a request id (also returned as X-Request-Id)."""
    request_id = request.headers.get("x-request-id") or uuid.uuid4().hex[:12]
    started = time.perf_counter()
    response = await call_next(request)
    response.headers["X-Request-Id"] = request_id
    log.info(
        "%s %s %s %dms user=%s rid=%s",
        request.method, request.url.path, response.status_code,
        (time.perf_counter() - started) * 1000, request.headers.get("x-user-id", "-"), request_id,
    )
    return response


@app.middleware("http")
async def local_bridge_preflight(request: Request, call_next):
    """The website's CORS / Private Network Access preflight for /local/device (see local_bridge.py).
    Added after CORSMiddleware, so it runs first: that middleware only knows the gateway's origins."""
    if request.method == "OPTIONS" and local_bridge.is_bridge_path(request.url.path):
        return local_bridge.preflight(request)
    return await call_next(request)


protected = [Depends(require_internal_key)]
# No internal key: read-only, this PC only, allowed websites only (checked in the router).
app.include_router(local_bridge.router)
app.include_router(chat.router, dependencies=protected)
app.include_router(rag.router, dependencies=protected)
app.include_router(misc.router, dependencies=protected)
app.include_router(system.router, dependencies=protected)
app.include_router(mllab.router, dependencies=protected)
app.include_router(pcwatch.router, dependencies=protected)
app.include_router(study_notes.router, dependencies=protected)
app.include_router(mind.router, dependencies=protected)
app.include_router(whatsapp.router, dependencies=protected)
app.include_router(tts.router, dependencies=protected)


@app.get("/health")
async def health():
    return {
        "status": "ok",
        "model": settings.claude_model,
        "api_key_in_env": bool(settings.anthropic_api_key),
        "claude": key_status(),
        "system_control": settings.system_control,
        "os": current_os(),
        "database": settings.sqlalchemy_url.split(":")[0],
        "storage": "s3" if settings.s3_bucket else "local",
        "rag_embedder": settings.rag_embedder,
    }


if __name__ == "__main__":
    import socket

    import uvicorn

    preferred_port = int(os.environ.get("AI_PORT", "8001"))

    def _resolve_port(port: int) -> int:
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
            try:
                sock.bind(("127.0.0.1", port))
                return port
            except OSError:
                for candidate in range(port + 1, port + 20):
                    try:
                        sock.bind(("127.0.0.1", candidate))
                        log.warning("Port %s is already in use; falling back to %s", port, candidate)
                        return candidate
                    except OSError:
                        continue
                raise

    uvicorn.run("app.main:app", host="127.0.0.1", port=_resolve_port(preferred_port))
