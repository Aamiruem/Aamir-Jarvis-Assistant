"""Emotional intelligence (app/mind): emotion model, mood over a conversation, reflection, API, chat wiring."""
import json

import pytest
from fastapi.testclient import TestClient

from app.agent.agent import _user_context
from app.main import app
from app.mind import understand
from app.mind.emotion import DATASET, read_emotion
from app.mind.state import MoodTracker

TRAINING = {t.lower() for examples in json.loads(DATASET.read_text(encoding="utf-8")).values() for t in examples}

# Messages the model never saw while training.
UNSEEN = [
    ("my dog passed away today", "sadness"),
    ("this stupid printer never works", "frustration"),
    ("can you explain gradient boosting", "curiosity"),
    ("so excited for the trip 🚀", "excitement"),
    ("I have a viva tomorrow and I am scared", "anxiety"),
    ("which is better, react or vue? I am confused", "confusion"),
    ("summarize this pdf", "neutral"),
    ("you are a lifesaver 🙏", "gratitude"),
    ("finally my model works, so happy", "joy"),
    ("WHY IS THIS STILL BROKEN", "frustration"),
    ("yaar bahut tension hai exam ki", "anxiety"),
    ("I dont get what you mean", "confusion"),
]


def headers(user="mind-user"):
    return {"X-Internal-Key": "test-key", "X-User-Id": user, "X-User-Role": "user"}


@pytest.fixture(scope="module")
def client():
    with TestClient(app) as c:
        yield c


def test_reads_unseen_messages():
    assert not [t for t, _ in UNSEEN if t.lower() in TRAINING], "test messages must not be in the training data"
    wrong = [(t, expected, read_emotion(t).emotion) for t, expected in UNSEEN if read_emotion(t).emotion != expected]
    assert len(wrong) <= 1, wrong  # at least 11 of 12


def test_how_it_is_said_changes_the_intensity():
    calm = read_emotion("this is not working")
    loud = read_emotion("THIS IS NOT WORKING!!!")
    assert loud.emotion == calm.emotion == "frustration"
    assert loud.intensity > calm.intensity
    assert "ALL CAPS" in loud.signals and "exclamation marks" in loud.signals


def test_negation_and_plain_commands():
    assert read_emotion("I'm not happy with this answer").emotion not in {"joy", "excitement"}
    plain = read_emotion("open notepad")
    assert plain.emotion == "neutral" and plain.intensity <= 0.2


def test_crisis_language_always_gets_care_and_a_helpline():
    insight = understand("crisis-user", "I don't want to live anymore, I want to end my life", track=False)
    assert insight.emotion.crisis and insight.emotion.emotion == "distress"
    guidance = insight.guidance()
    assert "14416" in guidance and "emergency" in guidance
    assert insight.voice["style"] == "gentle" and insight.voice["rate"] < 1


def test_needs_are_recognised():
    t = MoodTracker()
    need = lambda text, intent=None: understand("needs", text, intent, mood_tracker=t).need  # noqa: E731
    assert need("I get a TypeError: undefined is not a function") == "fix"
    assert need("how does attention work in transformers?") == "learn"
    assert need("remind me to call mom at 6") == "act"
    assert need("should I learn PyTorch or TensorFlow first?") == "decide"
    assert need("thank you so much") == "thanks"
    assert need("I feel so alone these days") == "vent"


def test_mood_over_a_conversation_leads_to_realizations():
    clock = [1000.0]
    t = MoodTracker(clock=lambda: clock[0])
    say = lambda text: understand("dev", text, mood_tracker=t)  # noqa: E731

    first = say("the build fails")
    assert first.mood.trend == "new"
    say("still the same error")
    third = say("it's broken again, nothing works")
    assert third.mood.negative_streak == 3
    assert any("isn't landing" in r for r in third.realizations), third.realizations

    relief = say("yes it works now, thank you so much!")
    assert relief.mood.trend == "improving" and relief.mood.negative_streak == 0
    assert any("lifting" in r for r in relief.realizations), relief.realizations

    clock[0] += 3 * 60 * 60  # hours later: a new conversation starts fresh
    assert say("hello").mood.turns == 1


def test_voice_style_follows_the_feeling():
    t = MoodTracker()
    upset = understand("v", "I'm so frustrated, this keeps crashing!!", mood_tracker=t).voice
    happy = understand("v2", "I'm so excited, we launched today!", mood_tracker=t).voice
    assert upset["rate"] < 1 < happy["rate"]
    assert upset["style"] == "calm" and happy["style"] == "energetic"


def test_guidance_reaches_the_agent_context(client):  # client: the app has started, so the tables exist
    guidance = understand("ctx", "I'm worried I won't finish before the deadline", track=False).guidance()
    assert "Tone:" in guidance and "never announce" in guidance
    assert guidance in _user_context("ctx", guidance=guidance)
    assert "How the user seems" not in _user_context("ctx")


def test_api_reads_and_keeps_mood_private(client):
    assert client.post("/mind/understand", json={"text": "hi"}, headers={"X-Internal-Key": "wrong"}).status_code == 401
    r = client.post("/mind/understand", json={"text": "ugh, the deploy failed again"}, headers=headers("ann")).json()
    assert r["emotion"] == "frustration" and r["need"] == "fix" and r["voice"]["style"] == "calm"
    assert "guidance" in r and r["mood"]["turns"] == 0  # track=false: only looked, not remembered

    client.post("/mind/understand", json={"text": "still broken!!", "track": True}, headers=headers("ann"))
    assert client.get("/mind/mood", headers=headers("ann")).json()["turns"] == 1
    assert client.get("/mind/mood", headers=headers("ben")).json()["turns"] == 0  # other users see nothing

    assert client.delete("/mind/mood", headers=headers("ann")).status_code == 204
    assert client.get("/mind/mood", headers=headers("ann")).json()["turns"] == 0


def test_deleting_my_data_forgets_the_mood(client):
    client.post("/mind/understand", json={"text": "I'm sad", "track": True}, headers=headers("cleo"))
    assert client.get("/mind/mood", headers=headers("cleo")).json()["turns"] == 1
    assert client.delete("/me/data", headers=headers("cleo")).status_code == 200
    assert client.get("/mind/mood", headers=headers("cleo")).json()["turns"] == 0


def test_chat_stream_sends_the_reading_first_and_guides_the_agent(client, monkeypatch):
    seen = {}

    async def fake_agent(message, history, user_id, fast=False, guidance=None):
        seen["guidance"] = guidance
        yield {"type": "text", "text": "Let's fix it step by step."}
        yield {"type": "done", "usage": {}, "tools": []}

    monkeypatch.setattr("app.routers.chat.run_agent", fake_agent)
    res = client.post("/chat/stream", json={"message": "my app keeps crashing and I'm so annoyed!!"}, headers=headers("dan"))
    events = [json.loads(line[6:]) for line in res.text.split("\n\n") if line.startswith("data: ")]
    types = [e["type"] for e in events]
    assert types[:2] == ["nlp", "mind"] and types.index("mind") < types.index("text")
    mind = events[1]
    assert mind["emotion"] == "frustration" and mind["voice"]["rate"] < 1
    assert "frustrated" in seen["guidance"] and "Approach:" in seen["guidance"]
