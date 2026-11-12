"""Neural text-to-speech: the Jarvis voice.

POST /tts {text, voice, rate, pitch} -> audio/mpeg, made with Microsoft's neural voices through
edge-tts (free, no key, the voices Edge's "Read aloud" uses). Far clearer than most browser voices,
and the browser can make it louder than 100% (Web Audio gain + limiter, see frontend/src/neuralVoice.js).
GET /tts/voices -> the voices Azarvis offers. Needs internet; the browser voice is the fallback.
"""
import hashlib
import logging
from collections import OrderedDict

from fastapi import APIRouter, HTTPException
from fastapi.responses import Response
from pydantic import BaseModel, Field

router = APIRouter(prefix="/tts", tags=["voice"])
log = logging.getLogger("jarvis.tts")

# id -> (label, style). Jarvis first: a calm British male voice, like the films.
VOICES = {
    "en-GB-RyanNeural": ("Jarvis · British male", "calm, deep"),
    "en-GB-ThomasNeural": ("British male, warm", "warm"),
    "en-GB-SoniaNeural": ("British female", "clear"),
    "en-IN-PrabhatNeural": ("Indian English male", "friendly"),
    "en-IN-NeerjaNeural": ("Indian English female", "friendly"),
    "en-US-AndrewNeural": ("American male, natural", "natural"),
    "en-US-GuyNeural": ("American male, announcer", "bold"),
    "en-US-AriaNeural": ("American female", "bright"),
    "hi-IN-MadhurNeural": ("Hindi male", "Hindi"),
    "hi-IN-SwaraNeural": ("Hindi female", "Hindi"),
}
DEFAULT_VOICE = "en-GB-RyanNeural"
_CACHE: "OrderedDict[str, bytes]" = OrderedDict()
CACHE_ITEMS = 120  # short phrases repeat a lot ("Done.", greetings, reminders)


class SpeakIn(BaseModel):
    text: str = Field(min_length=1, max_length=1500)
    voice: str = DEFAULT_VOICE
    rate: int = Field(0, ge=-50, le=60)     # percent faster (+) or slower (-)
    pitch: int = Field(0, ge=-30, le=30)    # Hz higher (+) or lower (-)


@router.get("/voices")
async def voices():
    return {"default": DEFAULT_VOICE, "voices": [{"id": k, "label": v[0], "style": v[1]} for k, v in VOICES.items()]}


@router.post("")
async def speak(body: SpeakIn):
    try:
        import edge_tts
    except ImportError:
        raise HTTPException(status_code=503, detail="Neural voice needs edge-tts: pip install edge-tts")
    voice = body.voice if body.voice in VOICES else DEFAULT_VOICE
    key = hashlib.sha1(f"{voice}|{body.rate}|{body.pitch}|{body.text}".encode()).hexdigest()
    if key in _CACHE:
        _CACHE.move_to_end(key)
        return Response(_CACHE[key], media_type="audio/mpeg", headers={"Cache-Control": "private, max-age=86400", "X-Cache": "hit"})
    try:
        com = edge_tts.Communicate(body.text, voice, rate=f"{body.rate:+d}%", pitch=f"{body.pitch:+d}Hz")
        audio = b"".join([c["data"] async for c in com.stream() if c["type"] == "audio"])
    except Exception as e:
        log.warning("neural voice failed: %s: %s", type(e).__name__, e)
        raise HTTPException(status_code=502, detail="The neural voice service didn't answer (internet?). Using the browser voice.")
    if not audio:
        raise HTTPException(status_code=502, detail="No audio came back.")
    _CACHE[key] = audio
    if len(_CACHE) > CACHE_ITEMS:
        _CACHE.popitem(last=False)
    return Response(audio, media_type="audio/mpeg", headers={"Cache-Control": "private, max-age=86400"})
