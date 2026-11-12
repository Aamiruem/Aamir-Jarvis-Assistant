"""Neural voice endpoint (edge-tts is faked: no network in tests)."""
import sys
import types

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.routers import tts

H = {"X-Internal-Key": "test-key"}


@pytest.fixture()
def fake_edge(monkeypatch):
    calls = []

    class Communicate:
        def __init__(self, text, voice, rate, pitch):
            calls.append((text, voice, rate, pitch))

        async def stream(self):
            yield {"type": "WordBoundary"}
            yield {"type": "audio", "data": b"ID3-mp3-"}
            yield {"type": "audio", "data": b"bytes"}

    monkeypatch.setitem(sys.modules, "edge_tts", types.SimpleNamespace(Communicate=Communicate))
    tts._CACHE.clear()
    return calls


def test_voices_list_starts_with_jarvis():
    with TestClient(app) as c:
        body = c.get("/tts/voices", headers=H).json()
    assert body["default"] == "en-GB-RyanNeural"
    assert body["voices"][0]["label"].startswith("Jarvis")


def test_speak_returns_mp3_and_caches(fake_edge):
    with TestClient(app) as c:
        r = c.post("/tts", headers=H, json={"text": "All systems online.", "voice": "en-IN-PrabhatNeural", "rate": -5, "pitch": -8})
        assert r.status_code == 200 and r.headers["content-type"] == "audio/mpeg" and r.content == b"ID3-mp3-bytes"
        assert fake_edge == [("All systems online.", "en-IN-PrabhatNeural", "-5%", "-8Hz")]
        again = c.post("/tts", headers=H, json={"text": "All systems online.", "voice": "en-IN-PrabhatNeural", "rate": -5, "pitch": -8})
        assert again.headers.get("x-cache") == "hit" and len(fake_edge) == 1


def test_unknown_voice_falls_back_and_limits_hold(fake_edge):
    with TestClient(app) as c:
        assert c.post("/tts", headers=H, json={"text": "Hi", "voice": "evil"}).status_code == 200
        assert fake_edge[-1][1] == "en-GB-RyanNeural"
        assert c.post("/tts", headers=H, json={"text": "Hi", "rate": 500}).status_code == 422
        assert c.post("/tts", headers=H, json={"text": ""}).status_code == 422
        assert c.post("/tts", json={"text": "Hi"}).status_code == 401  # internal key required
