"""Emotional intelligence API (app/mind): read a message, see or reset the conversation mood.

POST /mind/understand  {"text": "...", "track": false}  -> emotion, need, tone, realizations, voice
GET  /mind/mood                                       -> the user's mood in this conversation
DELETE /mind/mood                                     -> forget it
"""
from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field

from app.mind import understand
from app.mind.state import tracker
from app.nlp.intent import get_classifier
from app.security import Caller, get_caller

router = APIRouter(prefix="/mind", tags=["mind"])


class UnderstandRequest(BaseModel):
    text: str = Field(min_length=1, max_length=5000)
    track: bool = False  # true: count this message in the user's conversation mood (chat does this itself)


@router.post("/understand")
def understand_text(req: UnderstandRequest, caller: Caller = Depends(get_caller)):
    intent, _ = get_classifier().predict(req.text)
    insight = understand(caller.user_id, req.text, intent, track=req.track)
    return {**insight.as_dict(), "guidance": insight.guidance()}


@router.get("/mood")
def mood(caller: Caller = Depends(get_caller)):
    return tracker.snapshot(caller.user_id).as_dict()


@router.delete("/mood", status_code=204)
def forget_mood(caller: Caller = Depends(get_caller)):
    tracker.clear(caller.user_id)
