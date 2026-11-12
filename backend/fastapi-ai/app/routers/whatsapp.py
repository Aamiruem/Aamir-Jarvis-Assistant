"""WhatsApp Jarvis status for the web app (Automate tab): is it set up, is the relay reachable,
and a test message to the owner. Behind the internal key, like every other router."""
from fastapi import APIRouter, HTTPException

from app.config import settings
from app.whatsapp.bot import digits
from app.whatsapp.loop import STATUS, configured
from app.whatsapp.relay import Relay, RelayError

router = APIRouter(prefix="/whatsapp", tags=["whatsapp"])


def _masked(number: str) -> str:
    d = digits(number)
    return f"+{d[:2]} ••••• {d[-4:]}" if len(d) >= 8 else ""


@router.get("/status")
async def status():
    return {
        **STATUS,
        "configured": configured(),
        "owner": _masked(settings.whatsapp_owner_number),
        "voice_notes": bool(settings.groq_api_key),
        "missing": [name for name, v in (("WHATSAPP_RELAY_URL", settings.whatsapp_relay_url), ("WHATSAPP_RELAY_KEY", settings.whatsapp_relay_key), ("WHATSAPP_OWNER_NUMBER", digits(settings.whatsapp_owner_number))) if not v],
    }


@router.post("/test")
async def test():
    if not configured():
        raise HTTPException(status_code=400, detail="WhatsApp isn't set up yet: run npm run whatsapp:setup")
    try:
        await Relay(settings.whatsapp_relay_url, settings.whatsapp_relay_key).send(
            "👋 Hello from Azarvis! WhatsApp Jarvis is connected. Send *menu* to see what I can do."
        )
    except RelayError as e:
        raise HTTPException(status_code=502, detail=str(e))
    return {"ok": True}
