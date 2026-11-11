"""Mood over a conversation: not just "how does this message feel" but "how is this person doing".

Each user has a short history of emotion readings. The mood is a time-weighted average
(a reading counts half as much after HALF_LIFE seconds), and the trend compares the latest
reading with the mood just before it. Kept in memory only, per AI-service process: it is a
conversational state, not something to store, and it fades on its own.
"""
from __future__ import annotations

import math
import threading
import time
from collections import deque
from dataclasses import dataclass

from app.mind.emotion import EmotionReading

HALF_LIFE = 20 * 60  # seconds
KEEP = 12            # readings remembered per user
STALE_AFTER = 2 * 60 * 60


@dataclass
class Moment:
    at: float
    emotion: str
    valence: float
    arousal: float
    intensity: float
    negative: bool


@dataclass
class Mood:
    turns: int              # readings in this conversation window
    valence: float          # time-weighted mood, -1..1
    arousal: float
    trend: str              # "new" | "improving" | "worsening" | "steady"
    negative_streak: int    # consecutive negative readings, latest included
    previous: str | None    # emotion before the latest one
    dominant: str | None    # most frequent recent emotion

    def as_dict(self) -> dict:
        return {
            "turns": self.turns, "valence": self.valence, "arousal": self.arousal, "trend": self.trend,
            "negative_streak": self.negative_streak, "previous": self.previous, "dominant": self.dominant,
        }


class MoodTracker:
    def __init__(self, half_life: float = HALF_LIFE, keep: int = KEEP, clock=time.time) -> None:
        self.half_life, self.keep, self.clock = half_life, keep, clock
        self._history: dict[str, deque[Moment]] = {}
        self._lock = threading.Lock()

    def _weighted(self, moments: list[Moment], now: float) -> tuple[float, float]:
        if not moments:
            return 0.0, 0.0
        weights = [math.pow(0.5, (now - m.at) / self.half_life) * (0.5 + m.intensity) for m in moments]
        total = sum(weights) or 1.0
        return (
            sum(w * m.valence for w, m in zip(weights, moments)) / total,
            sum(w * m.arousal for w, m in zip(weights, moments)) / total,
        )

    def record(self, user_id: str, reading: EmotionReading) -> Mood:
        now = self.clock()
        with self._lock:
            history = self._history.setdefault(user_id, deque(maxlen=self.keep))
            while history and now - history[-1].at > STALE_AFTER:  # a new conversation starts fresh
                history.clear()
            before = list(history)
            history.append(Moment(now, reading.emotion, reading.valence, reading.arousal, reading.intensity, reading.negative))
            return self._mood(before, list(history), now)

    def snapshot(self, user_id: str) -> Mood:
        now = self.clock()
        with self._lock:
            history = [m for m in self._history.get(user_id, []) if now - m.at <= STALE_AFTER]
        return self._mood(history[:-1], history, now)

    def clear(self, user_id: str) -> None:
        with self._lock:
            self._history.pop(user_id, None)

    def _mood(self, before: list[Moment], history: list[Moment], now: float) -> Mood:
        valence, arousal = self._weighted(history, now)
        if not before:
            trend = "new"
        else:
            prior, _ = self._weighted(before, now)
            delta = history[-1].valence - prior
            trend = "improving" if delta > 0.35 else "worsening" if delta < -0.35 else "steady"
        streak = 0
        for m in reversed(history):
            if not m.negative:
                break
            streak += 1
        counts: dict[str, int] = {}
        for m in history[-6:]:
            counts[m.emotion] = counts.get(m.emotion, 0) + 1
        return Mood(
            turns=len(history),
            valence=round(valence, 2),
            arousal=round(arousal, 2),
            trend=trend,
            negative_streak=streak,
            previous=before[-1].emotion if before else None,
            dominant=max(counts, key=counts.get) if counts else None,
        )


tracker = MoodTracker()
