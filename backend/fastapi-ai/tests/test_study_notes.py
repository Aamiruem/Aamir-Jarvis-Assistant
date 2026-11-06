"""Notes with the master prompt: the request Claude gets, and the job flow (Claude is faked)."""
from fastapi.testclient import TestClient

from app import study_notes
from app.main import app
from app.mllab import jobs


def test_request_says_it_is_based_on_the_topic_not_the_video():
    text = study_notes.request_text(
        "Pandas GroupBy",
        {"n": 56, "course": "CampusX DSMP", "title": "Session 19 - GroupBy Object in Pandas", "description": "Code: https://github.com/x/y"},
        "split-apply-combine",
    )
    assert text.startswith("## MY TOPIC:\nPandas GroupBy")
    assert "can't watch the video" in text and "https://github.com/x/y" in text and "<my_notes>\nsplit-apply-combine" in text
    assert "13. Final Knowledge Test" in study_notes.MASTER_PROMPT
    assert "# Answers" in study_notes.MASTER_PROMPT  # the app hides this section until asked


def test_generate_job_returns_the_notes(monkeypatch):
    seen = {}

    def fake(topic, lecture, context, progress):
        seen.update(topic=topic, lecture=lecture)
        progress("Writing…", 50)
        return {"markdown": "# 1. Topic Introduction\nGroupBy splits data.", "output_tokens": 12, "stop_reason": "end_turn"}

    monkeypatch.setattr(study_notes, "generate", fake)
    h = {"X-Internal-Key": "test-key", "X-User-Id": "notes-ann"}
    with TestClient(app) as client:
        job = client.post("/study-notes/generate", json={"topic": "Pandas GroupBy", "lecture": {"n": 56, "title": "Session 19"}}, headers=h).json()
        done = jobs.wait(job["id"])
        assert done["status"] == "done" and done["result"]["markdown"].startswith("# 1. Topic Introduction")
        assert client.get(f"/study-notes/jobs/{job['id']}", headers=h).json()["status"] == "done"
        assert client.get(f"/study-notes/jobs/{job['id']}", headers={**h, "X-User-Id": "notes-eve"}).status_code == 404
        assert client.post("/study-notes/generate", json={"topic": "x"}, headers=h).status_code == 422
    assert seen == {"topic": "Pandas GroupBy", "lecture": {"n": 56, "title": "Session 19", "course": "", "description": ""}}


def test_missing_key_is_a_clear_error(monkeypatch):
    monkeypatch.setattr(study_notes, "_current_key", lambda: None)
    try:
        study_notes.generate("Topic", None, "", lambda m, p: None)
    except ValueError as e:
        assert "npm run set-key" in str(e)
    else:
        raise AssertionError("expected an error")
