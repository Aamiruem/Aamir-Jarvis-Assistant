"""Computer control (Windows, Linux, macOS), health and Claude key handling. Nothing here touches the real PC or the
Claude API: os.startfile, PowerShell and the API client are replaced with fakes."""
import json
import os
import time
from urllib.parse import parse_qs, urlparse

import anthropic
import httpx
import pytest
from fastapi.testclient import TestClient

from app import system_control as sc
from app.agent.tools import ToolContext, run_tool
from app.config import settings
from app.llm import claude
from app.main import app
from app.routers.chat import _friendly_error


def headers(user="alice"):
    return {"X-Internal-Key": "test-key", "X-User-Id": user}


@pytest.fixture(scope="module")
def client():
    with TestClient(app) as c:
        yield c


@pytest.fixture
def pc(monkeypatch):
    """A fake Windows PC that records what Azarvis tried to do."""
    done = []
    monkeypatch.setattr(sc.sys, "platform", "win32")
    monkeypatch.setattr(settings, "system_control", True)
    monkeypatch.setattr(sc.os, "startfile", lambda target: done.append(("start", str(target))), raising=False)
    monkeypatch.setattr(sc.shutil, "which", lambda name: None)
    monkeypatch.setattr(sc, "_powershell", lambda script, env=None, timeout=20: done.append(("ps", script)) or "")
    monkeypatch.setattr(sc.subprocess, "run", lambda args, **kw: done.append(("run", args[-1])))
    return done


def test_opens_apps_folders_and_links(pc):
    assert sc.run_action("open_app", "Notepad")["ok"]
    sc.run_action("open_app", "settings app")
    sc.run_action("open_folder", "downloads folder")
    sc.run_action("open_url", "https://www.youtube.com")
    assert pc[:3] == [("start", "notepad.exe"), ("start", "ms-settings:"), ("start", str(sc.FOLDERS["downloads"]))]
    assert pc[3] == ("start", "https://www.youtube.com")


def test_media_keys_and_lock(pc):
    sc.run_action("volume_up")
    sc.run_action("mute")
    sc.run_action("lock")
    assert "[char]175" in pc[0][1] and "1..5" in pc[0][1]  # 5 presses of the volume-up key
    assert "[char]173" in pc[1][1]
    assert pc[2] == ("run", "user32.dll,LockWorkStation")


@pytest.mark.parametrize("action,target", [
    ("run_command", "del /s C:\\"),           # not in the allow-list
    ("close_app", "explorer"),                # closing the Windows shell is never allowed
    ("open_url", "file:///C:/Windows/System32/cmd.exe"),  # only web links
    ("open_url", "javascript:alert(1)"),
    ("open_app", "format c:"),                # never run as a command
    ("open_folder", "C:\\Windows"),
])
def test_refuses_anything_off_the_list(pc, action, target):
    with pytest.raises(sc.SystemControlError):
        sc.run_action(action, target)
    assert pc == []


def test_closes_only_listed_apps(pc):
    sc.run_action("close_app", "Notepad")
    assert pc == [("run", "Notepad.exe")]  # taskkill /IM Notepad.exe, without /F


class FakeTimer:
    """Stands in for threading.Timer so tests never wait or really power anything off."""
    made = []

    def __init__(self, delay, fn):
        self.delay, self.fn, self.cancelled = delay, fn, False
        FakeTimer.made.append(self)

    def start(self):
        pass

    def cancel(self):
        self.cancelled = True


def test_shutdown_waits_and_can_be_cancelled(pc, monkeypatch):
    FakeTimer.made.clear()
    monkeypatch.setattr(sc.threading, "Timer", FakeTimer)
    monkeypatch.setattr(sc, "_pending_power", None)

    result = sc.run_action("shutdown")
    assert "60 seconds" in result["message"] and "cancel" in result["message"]
    assert pc == []  # nothing happens yet
    timer = FakeTimer.made[0]
    assert timer.delay == sc.POWER_DELAY_SECONDS

    assert "Cancelled" in sc.run_action("cancel_shutdown")["message"]
    assert timer.cancelled and sc._pending_power is None
    assert "Nothing was scheduled" in sc.run_action("cancel_shutdown")["message"]


def test_shutdown_fires_the_os_command_after_the_delay(pc, monkeypatch):
    FakeTimer.made.clear()
    monkeypatch.setattr(sc.threading, "Timer", FakeTimer)
    monkeypatch.setattr(sc, "_pending_power", None)
    sc.run_action("restart")
    FakeTimer.made[0].fn()  # the delay is over
    assert pc == [("run", "0")]  # shutdown /r /t 0


@pytest.fixture
def linux(monkeypatch):
    """A fake Linux desktop with GNOME apps installed; records every command."""
    ran = []
    monkeypatch.setattr(sc.sys, "platform", "linux")
    monkeypatch.setattr(settings, "system_control", True)
    installed = {"gnome-text-editor", "pactl", "playerctl", "gnome-screenshot", "loginctl", "xdg-open"}
    monkeypatch.setattr(sc.shutil, "which", lambda name: f"/usr/bin/{name}" if name in installed else None)

    class Done:
        returncode, stdout, stderr = 0, "", ""

    monkeypatch.setattr(sc.subprocess, "run", lambda args, **kw: ran.append(args) or Done())
    monkeypatch.setattr(sc.subprocess, "Popen", lambda args, **kw: ran.append(["launch", *args]))
    return ran


def test_linux_actions(tmp_path, linux, monkeypatch):  # tmp_path first: it needs the real OS
    monkeypatch.setattr(sc.Path, "home", lambda: tmp_path)
    sc.run_action("open_app", "notepad")
    sc.run_action("volume_up")
    sc.run_action("play_pause")
    sc.run_action("lock")
    sc.run_action("screenshot")
    assert linux[0] == ["launch", "gnome-text-editor"]
    assert linux[1] == ["pactl", "set-sink-volume", "@DEFAULT_SINK@", "+10%"]
    assert linux[2] == ["playerctl", "play-pause"]
    assert linux[3] == ["loginctl", "lock-session"]
    assert linux[4][:2] == ["gnome-screenshot", "-f"]


def test_linux_explains_a_missing_app(linux):
    with pytest.raises(sc.SystemControlError, match="installed"):
        sc.run_action("open_app", "spotify")


def test_mac_actions(monkeypatch):
    ran = []
    monkeypatch.setattr(sc.sys, "platform", "darwin")
    monkeypatch.setattr(settings, "system_control", True)

    class Done:
        returncode, stdout, stderr = 0, "", ""

    monkeypatch.setattr(sc.subprocess, "run", lambda args, **kw: ran.append(args) or Done())
    sc.run_action("open_app", "calculator")
    sc.run_action("close_app", "calculator")
    sc.run_action("mute")
    assert ran[0] == ["open", "-a", "Calculator"]
    assert ran[1] == ["osascript", "-e", 'quit app "Calculator"']
    assert "output muted" in ran[2][2]


def test_missing_app_is_a_friendly_error(pc, monkeypatch):
    def missing(target):
        raise FileNotFoundError(target)
    monkeypatch.setattr(sc.os, "startfile", missing, raising=False)
    with pytest.raises(sc.SystemControlError, match="installed"):
        sc.run_action("open_app", "word")


def test_can_be_turned_off(pc, monkeypatch):
    monkeypatch.setattr(settings, "system_control", False)
    with pytest.raises(sc.SystemControlError, match="SYSTEM_CONTROL"):
        sc.run_action("open_app", "notepad")
    assert pc == []


def test_system_routes(client, pc, monkeypatch):
    assert client.post("/system/action", json={"action": "open_app", "target": "calculator"}).status_code == 401
    r = client.post("/system/action", json={"action": "open_app", "target": "calculator"}, headers=headers())
    assert r.status_code == 200 and pc == [("start", "calc.exe")]
    r = client.post("/system/action", json={"action": "format_disk"}, headers=headers())
    assert r.status_code == 400 and "Unknown action" in r.json()["detail"]

    monkeypatch.setattr(sc, "_status_cache", None)
    monkeypatch.setattr(sc, "_status_psutil", lambda: {"cpu": 12, "ram": 70, "disk": 99, "disk_free_gb": 0.8, "battery": None, "charging": None})
    assert client.get("/system/status", headers=headers()).json()["disk_free_gb"] == 0.8
    monkeypatch.setattr(settings, "system_control", False)
    assert client.get("/system/status", headers=headers()).status_code == 503


def test_real_status_reading_is_fast_and_complete(monkeypatch):
    monkeypatch.setattr(settings, "system_control", True)
    monkeypatch.setattr(sc, "_status_cache", None)
    started = time.perf_counter()
    status = sc.system_status()
    assert time.perf_counter() - started < 2
    assert {"cpu", "ram", "disk", "disk_free_gb", "battery", "charging"} <= status.keys()
    assert 0 <= status["ram"] <= 100 and status["disk_free_gb"] >= 0
    assert sc.system_status() is status  # cached


def test_compose_email_opens_a_gmail_draft(pc):
    out, err = run_tool("compose_email", {
        "to": "manager@example.com", "subject": "Leave request for tomorrow",
        "body": "Hi,\nI'd like to take leave tomorrow (31 Oct).\nThanks",
    }, ToolContext("alice"))
    assert not err and json.loads(out)["opened_in_gmail"] is True
    kind, url = pc[0]
    q = parse_qs(urlparse(url).query)
    assert kind == "start" and url.startswith("https://mail.google.com/mail/?")
    assert q["to"] == ["manager@example.com"] and q["su"] == ["Leave request for tomorrow"]
    assert "31 Oct" in q["body"][0]


def test_compose_email_without_system_control_still_answers(pc, monkeypatch):
    monkeypatch.setattr(settings, "system_control", False)
    out, err = run_tool("compose_email", {"to": "", "subject": "Hi", "body": "Hello"}, ToolContext("alice"))
    assert not err and json.loads(out)["opened_in_gmail"] is False


def test_health_reports_key_and_system_control(client, monkeypatch):
    monkeypatch.setattr(claude, "_current_key", lambda: None)
    body = client.get("/health").json()
    assert body["status"] == "ok" and body["claude"] == "no_key"
    assert "system_control" in body


def _api_error(cls, status, message="error"):
    req = httpx.Request("GET", "https://api.anthropic.com/v1/models")
    return cls(message, response=httpx.Response(status, request=req), body=None)


def test_key_status_is_checked_in_the_background(monkeypatch):
    import asyncio

    calls = []

    class FakeModels:
        async def list(self, limit):
            calls.append(limit)
            raise _api_error(anthropic.AuthenticationError, 401)

    class FakeClient:
        models = FakeModels()

        def with_options(self, **kw):
            return self

    monkeypatch.setattr(claude, "_current_key", lambda: "sk-ant-test")
    monkeypatch.setattr(claude, "get_client", lambda: FakeClient())
    monkeypatch.setattr(claude, "_key_status", {"status": "unknown", "key": None, "at": 0.0})
    monkeypatch.setattr(claude, "_key_check", None)

    async def scenario():
        assert claude.key_status() == "unknown"  # answers at once, checks in the background
        await claude._key_check
        assert claude.key_status() == "invalid_key"
        claude.key_status()
        assert calls == [1]  # cached: no second API call

    asyncio.run(scenario())


def test_failed_chat_updates_key_status(monkeypatch):
    monkeypatch.setattr(claude, "_current_key", lambda: "sk-ant-test")
    monkeypatch.setattr(claude, "_key_status", {"status": "ok", "key": "sk-ant-test", "at": time.monotonic()})
    claude.note_api_error(_api_error(anthropic.BadRequestError, 400, "Your credit balance is too low"))
    assert claude._key_status["status"] == "no_credits"


def test_friendly_errors():
    assert "npm run set-key" in _friendly_error(_api_error(anthropic.AuthenticationError, 401))
    assert "rate-limiting" in _friendly_error(_api_error(anthropic.RateLimitError, 429))
    assert "out of credits" in _friendly_error(_api_error(anthropic.BadRequestError, 400, "Your credit balance is too low"))


def test_new_key_in_env_file_is_picked_up_without_restart(tmp_path, monkeypatch):
    env = tmp_path / ".env"
    env.write_text("ANTHROPIC_API_KEY=sk-ant-old\n")
    monkeypatch.delenv("ANTHROPIC_API_KEY", raising=False)
    monkeypatch.setitem(settings.model_config, "env_file", (env,))
    monkeypatch.setattr(settings, "anthropic_api_key", None)
    monkeypatch.setattr(claude, "_env_seen", ())
    assert claude._current_key() == "sk-ant-old"
    env.write_text("ANTHROPIC_API_KEY=sk-ant-new\n")
    os.utime(env, (time.time() + 5, time.time() + 5))  # make sure the change is seen on coarse clocks
    assert claude._current_key() == "sk-ant-new"


# ---------- files, clipboard and screen ----------

@pytest.fixture
def home(tmp_path, monkeypatch, pc):
    """The user's folders, pointed at a temp dir with a few files in it."""
    folders = {name: tmp_path / name.capitalize() for name in ("documents", "downloads", "music")}
    for folder in folders.values():
        folder.mkdir()
    monkeypatch.setattr(sc, "FOLDERS", folders)
    for name, age in (("documents/Resume 2024.docx", 3600), ("downloads/setup-resume.exe", 60), ("downloads/resume_final.pdf", 0)):
        path = tmp_path / name.split("/")[0].capitalize() / name.split("/")[1]
        path.write_text("x")
        os.utime(path, (time.time() - age, time.time() - age))
    (folders["music"] / "lofi beats.mp3").write_text("x")
    (folders["documents"] / "node_modules").mkdir()
    (folders["documents"] / "node_modules" / "resume.js").write_text("x")
    return folders


def test_find_files_matches_every_word_newest_first(home):
    found = sc.find_files("resume")
    assert [f["name"] for f in found["files"]] == ["resume_final.pdf", "setup-resume.exe", "Resume 2024.docx"]
    assert found["searched_everything"]
    assert [f["name"] for f in sc.find_files("RESUME pdf")["files"]] == ["resume_final.pdf"]
    assert [f["name"] for f in sc.find_files("lofi", folder="music")["files"]] == ["lofi beats.mp3"]
    assert sc.find_files("lofi", folder="documents")["files"] == []
    with pytest.raises(sc.SystemControlError):
        sc.find_files("resume", folder="windows")


def test_open_file_only_opens_documents_inside_the_user_folders(home, pc, tmp_path):
    pdf = home["downloads"] / "resume_final.pdf"
    assert sc.open_file(str(pdf))["ok"]
    assert pc[-1] == ("start", str(pdf.resolve()))
    outside = tmp_path / "secret.txt"
    outside.write_text("x")
    for bad in (home["downloads"] / "setup-resume.exe", outside, home["documents"] / "missing.pdf",
                home["documents"] / ".." / ".." / "secret.txt"):
        with pytest.raises(sc.SystemControlError):
            sc.open_file(str(bad))
    assert len([d for d in pc if d[0] == "start"]) == 1


def test_clipboard_text_is_never_parsed_as_powershell(pc, monkeypatch):
    calls = []
    monkeypatch.setattr(sc, "_powershell", lambda script, env=None, timeout=20: calls.append((script, env)) or "copied text")
    tricky = "'; Remove-Item C:\\ -Recurse #"
    assert sc.write_clipboard(tricky)["ok"]
    script, env = calls[0]
    assert tricky not in script and env == {"JARVIS_CLIP": tricky}
    assert sc.read_clipboard()["text"] == "copied text"
    monkeypatch.setattr(sc, "_powershell", lambda script, env=None, timeout=20: "  \n")
    assert sc.read_clipboard()["text"] == ""


def test_look_at_screen_hands_claude_a_small_picture(pc, monkeypatch):
    from PIL import Image

    monkeypatch.setattr(sc, "_capture", lambda shot: Image.new("RGB", (3840, 2160), "navy").save(shot))
    out, err = run_tool("look_at_screen", {}, ToolContext("alice"))
    assert not err and out[0]["type"] == "image" and out[0]["source"]["media_type"] == "image/jpeg"
    import base64
    import io as _io

    with Image.open(_io.BytesIO(base64.b64decode(out[0]["source"]["data"]))) as img:
        assert max(img.size) <= sc.SCREEN_MAX_SIDE
    assert json.loads(out[1]["text"])["note"]


def test_new_pc_tools_respect_the_off_switch(home, monkeypatch):
    monkeypatch.setattr(settings, "system_control", False)
    for name, args in [("find_files", {"query": "resume"}), ("read_clipboard", {}), ("copy_to_clipboard", {"text": "hi"}),
                       ("look_at_screen", {}), ("open_file", {"path": str(home["downloads"] / "resume_final.pdf")})]:
        out, err = run_tool(name, args, ToolContext("alice"))
        assert err and "turned off" in json.loads(out)["error"], name
