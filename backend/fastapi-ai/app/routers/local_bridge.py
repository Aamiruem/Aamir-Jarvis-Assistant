"""Local bridge: lets the Azarvis website read this PC's device details straight from the browser.

GET /local/device -> app.device_info.device_details() (read-only numbers, nothing personal).

The browser on the user's own PC calls http://127.0.0.1:8001/local/device. There is no
X-Internal-Key here (a web page can't keep a secret), so access is limited instead:
  * only requests from this machine (loopback client address),
  * only when the Host header is 127.0.0.1 / localhost (stops DNS-rebinding pages),
  * only from the websites in LOCAL_BRIDGE_ORIGINS (others get 403, and no CORS headers),
  * GET only; nothing here can change the PC.
Chrome asks the user once before a public site may reach localhost ("Local network access");
the preflight below answers its Private Network Access check.
"""

import asyncio

from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import JSONResponse, Response

from app.config import settings
from app.device_info import device_details

router = APIRouter(prefix="/local", tags=["local bridge"])

LOOPBACK = {"127.0.0.1", "::1", "localhost"}


def allowed_origins() -> set[str]:
    return {o.strip().rstrip("/") for o in settings.local_bridge_origins.split(",") if o.strip()}


def bridge_headers(origin: str) -> dict:
    return {
        "Access-Control-Allow-Origin": origin,
        "Access-Control-Allow-Methods": "GET",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Private-Network": "true",
        "Access-Control-Max-Age": "600",
        "Vary": "Origin",
        "Cache-Control": "no-store",
    }


def check(request: Request) -> str:
    """The calling website's origin, after every check passed (else HTTPException)."""
    origin = (request.headers.get("origin") or "").rstrip("/")
    host = (request.headers.get("host") or "").rsplit(":", 1)[0].strip("[]").lower()
    client = request.client.host if request.client else ""
    if not allowed_origins():
        raise HTTPException(status_code=404, detail="The local bridge is turned off.")
    if client not in LOOPBACK or host not in LOOPBACK:
        raise HTTPException(status_code=403, detail="Only this computer can read its device details.")
    if origin not in allowed_origins():
        raise HTTPException(status_code=403, detail="This website may not read the device details.")
    return origin


def is_bridge_path(path: str) -> bool:
    return path == "/local/device"


def preflight(request: Request) -> Response:
    """OPTIONS /local/device (CORS + Private Network Access), handled before the app's CORS middleware."""
    try:
        origin = check(request)
    except HTTPException as e:
        return JSONResponse({"detail": e.detail}, status_code=e.status_code)
    return Response(status_code=204, headers=bridge_headers(origin))


@router.get("/device")
async def device(request: Request):
    origin = check(request)
    try:
        info = await asyncio.to_thread(device_details)
    except ImportError:
        raise HTTPException(status_code=503, detail="Device details need psutil: pip install psutil")
    return JSONResponse(info, headers=bridge_headers(origin))
