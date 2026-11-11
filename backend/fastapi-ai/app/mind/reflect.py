"""Reflection: turn "what they feel" into "what they need and how to answer", like a person would.

    message -> emotion reading (emotion.py) + intent (nlp) + mood over the conversation (state.py)
            -> need       what kind of help this is (fix, learn, act, vent, celebrate, ...)
            -> realizations  things a thoughtful person would notice ("third failed attempt:
                             change approach", "they're relieved now", "this is urgent")
            -> plan       tone + approach for the reply, as guidance for the agent's prompt
            -> voice      how the spoken reply should sound (pace, pitch) for the browser's voice

The guidance is a hint for Claude, written to keep it honest: use it to choose a tone, never
announce or diagnose the user's feelings, and stay accurate and useful first.
"""
from __future__ import annotations

import re
from dataclasses import dataclass, field

from app.mind.emotion import EmotionReading, read_emotion
from app.mind.state import Mood, MoodTracker, tracker as default_tracker

QUESTION = re.compile(r"\?|^(how|what|why|when|where|which|who|can|could|should|is|are|do|does|explain|kaise|kya|kyun)\b", re.IGNORECASE)
PROBLEM = re.compile(r"\b(error|bug|fail\w*|broken|crash\w*|not working|doesn'?t work|won'?t|stuck|issue|exception|traceback|undefined|null|500|404|kaam nahi)\b", re.IGNORECASE)
DECISION = re.compile(r"\b(should i|which (one|is better)|or should|vs\.?|versus|choose|decide|better option)\b", re.IGNORECASE)
COMMAND = re.compile(r"^(please )?(open|remind|set|add|create|send|play|write|draft|schedule|search|find|list|show|delete|turn|start|stop|take|convert|translate|summari[sz]e|call)\b", re.IGNORECASE)

TONE = {
    "frustration": "calm, steady and solution-first",
    "anxiety": "reassuring, structured and grounded",
    "sadness": "warm, gentle and patient",
    "distress": "caring, calm and human",
    "confusion": "patient and simple, one idea at a time",
    "curiosity": "enthusiastic, like a good teacher",
    "joy": "warm and upbeat",
    "excitement": "energetic and encouraging",
    "gratitude": "warm and brief",
    "neutral": "clear and efficient",
}

APPROACH = {
    "fix": "Lead with the most likely fix as concrete steps. Explain the cause in one line after, not before.",
    "learn": "Answer the question directly first, then one short example or analogy. Offer to go deeper.",
    "decide": "Give a clear recommendation and the one or two reasons that matter; mention the main trade-off.",
    "act": "Do the task (use tools as needed) and confirm the result in one short line.",
    "clarify": "Re-explain more simply than before, with a tiny example; check which part was unclear.",
    "vent": "Acknowledge what they are going through in one sincere sentence before anything else. Do not rush to fix; offer help or a small next step.",
    "celebrate": "Share the moment genuinely in a sentence, then help with whatever comes next.",
    "thanks": "Reply briefly and warmly; ask if there is anything else only if it fits.",
    "chat": "Answer naturally and helpfully.",
}

# How the spoken reply should sound: multipliers on the user's own voice settings.
VOICE = {
    "frustration": (0.95, 0.97, "calm"),
    "anxiety": (0.93, 0.97, "reassuring"),
    "sadness": (0.9, 0.95, "gentle"),
    "distress": (0.88, 0.95, "gentle"),
    "confusion": (0.92, 1.0, "patient"),
    "curiosity": (1.0, 1.03, "engaged"),
    "joy": (1.05, 1.05, "bright"),
    "excitement": (1.08, 1.06, "energetic"),
    "gratitude": (1.0, 1.03, "warm"),
    "neutral": (1.0, 1.0, "neutral"),
}

CRISIS_GUIDANCE = (
    "The user may be in emotional crisis or at risk of harming themselves. Respond with care, calmly and "
    "without judgement: acknowledge their pain, say they deserve support, and encourage them to reach out "
    "right now to someone they trust or a helpline. In India: Tele-MANAS 14416 or 1-800-891-4416 (24x7, free); "
    "elsewhere, the local emergency number. If they are in immediate danger, urge them to call emergency services. "
    "Keep them talking: ask how they are feeling. Do not do any other task in this reply."
)


@dataclass
class Insight:
    emotion: EmotionReading
    mood: Mood
    need: str
    tone: str
    approach: str
    realizations: list[str] = field(default_factory=list)
    voice: dict = field(default_factory=dict)

    def guidance(self) -> str:
        """The block added to the agent's per-request context."""
        if self.emotion.crisis:
            return "How the user seems right now (Azarvis's emotion model):\n" + CRISIS_GUIDANCE
        e = self.emotion
        lines = [
            "How the user seems right now (from Azarvis's emotion model; a guess, so use it only to choose your "
            "tone and approach; never announce, label or diagnose their feelings, and never let it make the answer less accurate):",
            f"- Feeling: {e.label} (intensity {e.intensity:.1f} of 1). What they need: {self.need}.",
            f"- Tone: {self.tone}.",
            f"- Approach: {self.approach}",
        ]
        lines += [f"- Notice: {r}" for r in self.realizations]
        return "\n".join(lines)

    def as_dict(self) -> dict:
        return {
            **self.emotion.as_dict(),
            "need": self.need,
            "tone": self.tone,
            "approach": self.approach,
            "realizations": self.realizations,
            "voice": self.voice,
            "mood": self.mood.as_dict(),
        }


def _need(text: str, e: EmotionReading, intent: str | None) -> str:
    if e.emotion == "gratitude":
        return "thanks"
    if PROBLEM.search(text):
        return "fix"
    if e.emotion == "confusion":
        return "clarify"
    if DECISION.search(text):
        return "decide"
    if COMMAND.search(text) or intent in {"task", "weather", "math", "time", "vision"}:
        return "act"
    if QUESTION.search(text) or intent == "knowledge":
        return "learn"
    if e.emotion in {"sadness", "distress", "anxiety"}:
        return "vent"
    if e.emotion in {"joy", "excitement"}:
        return "celebrate"
    return "chat"


def _realizations(e: EmotionReading, mood: Mood, need: str) -> list[str]:
    notes: list[str] = []
    if mood.negative_streak >= 3:
        notes.append(
            f"This is their {mood.negative_streak}th unhappy message in a row, so what has been tried isn't landing. "
            "Change approach: question your earlier assumption, ask one precise question about what they see, or offer a different solution."
        )
    elif mood.trend == "improving" and mood.previous in {"frustration", "anxiety", "sadness", "confusion"}:
        notes.append("Their mood is lifting compared with a moment ago (earlier: " + mood.previous + "); acknowledge the progress in a few words.")
    elif mood.trend == "worsening" and mood.previous and mood.previous not in {"frustration", "anxiety", "sadness", "distress"}:
        notes.append("Their mood just dropped: something went wrong or your last answer missed. Address that first.")
    if e.intensity >= 0.8 and e.negative:
        notes.append("It feels urgent or intense to them: be brief, lead with the action, skip pleasantries.")
    if e.emotion == "anxiety" and need in {"act", "fix", "chat", "vent"}:
        notes.append("Break the work into small, ordered steps so it feels manageable.")
    if e.emotion == "confusion" and mood.turns > 1:
        notes.append("Earlier explanations didn't land; use a different angle, not the same words again.")
    if e.emotion == "excitement" and need in {"act", "learn", "chat"}:
        notes.append("Match their energy, but keep the facts precise.")
    return notes


def understand(user_id: str, text: str, intent: str | None = None, *, track: bool = True, mood_tracker: MoodTracker | None = None) -> Insight:
    """Reads one message in the context of the conversation so far. track=False: look only, don't remember."""
    t = mood_tracker or default_tracker
    e = read_emotion(text)
    mood = t.record(user_id, e) if track else t.snapshot(user_id)
    need = _need(text, e, intent)
    rate, pitch, style = VOICE.get(e.emotion, VOICE["neutral"])
    if e.intensity >= 0.8 and e.negative:
        rate *= 0.97  # slower and steadier when someone is upset
    return Insight(
        emotion=e,
        mood=mood,
        need=need,
        tone=TONE.get(e.emotion, TONE["neutral"]),
        approach=CRISIS_GUIDANCE if e.crisis else APPROACH[need],
        realizations=[] if e.crisis else _realizations(e, mood, need),
        voice={"rate": round(rate, 3), "pitch": round(pitch, 3), "style": style},
    )
