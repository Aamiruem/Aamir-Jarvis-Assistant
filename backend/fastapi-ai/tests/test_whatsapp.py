"""WhatsApp Jarvis: instant commands, the owner-only rule, approval for other people, voice notes, alerts."""
import asyncio
from datetime import datetime
from zoneinfo import ZoneInfo

import pytest

from app.db import sql
from app.whatsapp import bot as bot_mod
from app.whatsapp import commands, loop
from app.whatsapp.bot import Bot, to_whatsapp
from app.whatsapp.relay import split

OWNER = "919900000001"


@pytest.fixture(autouse=True, scope="module")
def _db():
    sql.init_db()  # the tables (other test files get them from the app's startup)

IST = ZoneInfo("Asia/Kolkata")
NOW = datetime(2026, 11, 12, 14, 0, tzinfo=IST)


class FakeRelay:
    def __init__(self, media=(b"OggS", "audio/ogg")):
        self.sent = []
        self._media = media

    async def send(self, text, to=None):
        self.sent.append((to, text))
        return {"ok": True}

    async def media(self, media_id):
        return self._media


def make_bot(agent_reply=("Here you go.", ["web_search"], None), delay=0.0, draft="Sure, see you at 6!"):
    relay = FakeRelay()
    b = Bot(relay=relay, user_id="wa-user", owner=OWNER)

    async def agent(text, history, user_id):
        await asyncio.sleep(delay)
        return agent_reply

    async def drafter(name, text):
        return draft

    b.agent = agent
    b.drafter = drafter
    return b, relay


def run(coro):
    return asyncio.run(coro)


# ---------- time and reminders ----------

@pytest.mark.parametrize(
    ("text", "what", "hour", "minute", "day"),
    [
        ("remind me to call mom at 6 pm", "Call mom", 18, 0, 12),
        ("Remind me at 9:30 am to submit the ML assignment", "Submit the ML assignment", 9, 30, 13),  # 9:30 passed → tomorrow
        ("remind me to drink water in 15 minutes", "Drink water", 14, 15, 12),
        ("hey azarvis remind me tomorrow at 7 pm to pay rent", "Pay rent", 19, 0, 13),
        ("remind me to stretch in 2 hours", "Stretch", 16, 0, 12),
    ],
)
def test_parse_reminder(text, what, hour, minute, day):
    got, when = commands.parse_reminder(text, now=NOW)
    assert got == what
    assert (when.hour, when.minute, when.day) == (hour, minute, day)


def test_parse_reminder_ignores_other_messages():
    assert commands.parse_reminder("what is the weather", now=NOW) is None
    assert commands.parse_reminder("remind me", now=NOW) is None
    assert commands.parse_reminder("add task buy milk", now=NOW) == ("Buy milk", None)


# ---------- instant commands ----------

def test_menu_tasks_and_done():
    user = "wa-cmd"
    assert "Azarvis on WhatsApp" in commands.handle("menu", user)
    assert "remind you" in commands.handle("remind me to call mom at 6 pm", user)
    commands.handle("add task buy milk", user)
    listing = commands.handle("tasks", user)
    assert "1. Buy milk" in listing and "Call mom" in listing
    first = commands.handle("done 1", user)
    assert "Completed: Buy milk" in first and "1 task left" in first
    assert "Completed: Call mom" in commands.handle("done 1", user)
    assert "No open tasks" in commands.handle("tasks", user)
    assert "don't see task 9" in commands.handle("done 9", user)


def test_power_actions_need_confirmation(monkeypatch):
    ran = []
    monkeypatch.setattr(commands, "_run", lambda action, target=None: ran.append(action) or "Shutting down in 60 seconds.")
    assert "Reply *confirm*" in commands.handle("shutdown my pc", "u", sender="s1")
    assert ran == []
    assert "Shutting down" in commands.handle("confirm", "u", sender="s1")
    assert ran == ["shutdown"]
    assert "Nothing is waiting" in commands.handle("confirm", "u", sender="s1")


def test_pc_actions(monkeypatch):
    ran = []
    monkeypatch.setattr(commands, "_run", lambda action, target=None: ran.append((action, target)) or f"Opened {target}.")
    commands.handle("open youtube", "u")
    commands.handle("open downloads", "u")
    commands.handle("open notepad", "u")
    commands.handle("volume up", "u")
    commands.handle("lock my pc", "u")
    assert ran == [("open_url", "https://www.youtube.com"), ("open_folder", "downloads"), ("open_app", "notepad"), ("volume_up", None), ("lock", None)]


def test_pc_status(monkeypatch):
    import app.device_info as di

    monkeypatch.setattr(di, "device_details", lambda: {
        "cpu": {"percent": 40}, "memory": {"percent": 92, "used_gb": 11, "total_gb": 12}, "disk": {"percent": 93, "free_gb": 15},
        "battery": {"percent": 52, "plugged": True}, "network": {"wired": False, "wifi": True, "speed_mbps": 150},
        "uptime_hours": 3, "processes": 300,
    })
    text = commands.handle("pc status", "u")
    assert "CPU 40%" in text and "charging" in text and "Wi-Fi" in text
    assert "Memory is almost full" in text and "Disk is almost full" in text


def test_unknown_text_goes_to_the_ai():
    assert commands.handle("write an email to my professor about the deadline", "u") is None


# ---------- the bot ----------

def test_owner_command_is_answered_instantly():
    b, relay = make_bot()
    run(b.process({"from": OWNER, "type": "text", "text": "time"}))
    assert relay.sent and relay.sent[0][0] is None and "It's" in relay.sent[0][1]


def test_owner_question_goes_to_the_agent_with_done_and_ack():
    b, relay = make_bot(delay=0.0)
    run(b.process({"from": OWNER, "type": "text", "text": "find me 3 AI internships in Gurgaon"}))
    assert relay.sent[-1][1].startswith("✅ *Done.*")

    slow, relay2 = make_bot(delay=3.0)
    run(slow.process({"from": OWNER, "type": "text", "text": "research the best laptop under 60000"}))
    assert relay2.sent[0][1].startswith("⏳ On it")
    assert relay2.sent[1][1].startswith("✅")


def test_agent_failure_falls_back_to_the_menu():
    b, relay = make_bot(agent_reply=("", [], "the ANTHROPIC_API_KEY was rejected"))
    run(b.process({"from": OWNER, "type": "text", "text": "tell me about black holes"}))
    assert "AI brain isn't available" in relay.sent[-1][1] and "remind me" in relay.sent[-1][1]


def test_other_people_never_get_an_automatic_reply():
    b, relay = make_bot()
    run(b.process({"from": "919811111111", "name": "Riya", "type": "text", "text": "Are we meeting at 6?"}))
    assert len(relay.sent) == 1
    to, text = relay.sent[0]
    assert to is None  # to the owner only
    assert "Riya" in text and "Suggested reply" in text and "Nothing is sent without you" in text
    code = text.split("*yes ")[1][:3]
    # The owner approves: only now is the draft sent to Riya.
    run(_approve(b, f"yes {code}"))
    assert ("919811111111", "Sure, see you at 6!") in relay.sent
    assert any("Sent to Riya" in t for _, t in relay.sent)


async def _approve(b, text):
    await b.process({"from": OWNER, "type": "text", "text": text})
    await asyncio.sleep(0)  # let the scheduled send run


def test_owner_can_reply_in_own_words_or_ignore():
    b, relay = make_bot(draft="")
    run(b.process({"from": "919822222222", "name": "Amit", "type": "text", "text": "Call me"}))
    code = relay.sent[0][1].split("*reply ")[1][:3]
    run(_approve(b, f"reply {code} Calling you in 5 minutes"))
    assert ("919822222222", "Calling you in 5 minutes") in relay.sent
    run(b.process({"from": "919833333333", "name": "Spam", "type": "text", "text": "Win a prize"}))
    code2 = relay.sent[-1][1].split("*reply ")[1][:3]
    run(_approve(b, f"ignore {code2}"))
    assert not any(to == "919833333333" for to, _ in relay.sent)


def test_voice_notes(monkeypatch):
    b, relay = make_bot()

    async def heard(audio, mime):
        return "remind me to call the bank at 5 pm"

    monkeypatch.setattr(bot_mod, "transcribe", heard)
    run(b.process({"from": OWNER, "type": "audio", "mediaId": "m1"}))
    assert "I heard" in relay.sent[0][1]
    assert "remind you" in relay.sent[1][1]


def test_voice_notes_without_a_key(monkeypatch):
    b, relay = make_bot()
    monkeypatch.setattr(bot_mod.settings, "groq_api_key", "")
    run(b.process({"from": OWNER, "type": "audio", "mediaId": "m1"}))
    assert "GROQ_API_KEY" in relay.sent[0][1]


def test_formatting_and_splitting():
    assert to_whatsapp("## Plan\n- **Step one**\n- [Docs](https://x.dev)") == "*Plan*\n• *Step one*\n• Docs (https://x.dev)"
    parts = split("para one\n\n" + "x" * 5000)
    assert len(parts) == 2 and all(len(p) <= 3900 for p in parts) and "".join(parts).replace("\n", "") == "para one" + "x" * 5000
    assert split("short") == ["short"]


# ---------- reminders and alerts go to WhatsApp ----------

def test_forward_notifications_once(tmp_path, monkeypatch):
    monkeypatch.setattr(loop.settings, "data_dir", tmp_path)
    b, relay = make_bot()
    state = {}
    run(loop.forward_notifications(b, state))  # first run only remembers where it is
    assert relay.sent == []
    sql.add_notification("wa-user", "Reminder: Call mom", "today at 6 PM")
    sql.add_notification("someone-else", "Reminder: not yours")
    run(loop.forward_notifications(b, state))
    assert len(relay.sent) == 1 and "Reminder: Call mom" in relay.sent[0][1]
    run(loop.forward_notifications(b, state))
    assert len(relay.sent) == 1  # never twice
