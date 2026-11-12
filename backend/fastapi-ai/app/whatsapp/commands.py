"""Instant WhatsApp commands: answered in milliseconds, with or without Claude.

handle(text, user_id) -> reply text, or None when it isn't a command (then the Claude agent answers).
"""
from __future__ import annotations

import re
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone

from app.db import sql
from app.timeutil import now_local

MENU = (
    "🤖 *Azarvis on WhatsApp*\n"
    "Just talk to me — type or send a voice note. Things I do instantly:\n\n"
    "⏰ *remind me to call mom at 6 pm*\n"
    "📋 *tasks* · *done 2*\n"
    "💻 *pc status* · *battery*\n"
    "🚀 *open youtube* · *open downloads* · *open notepad*\n"
    "🔊 *volume up* · *mute* · *next song* · *lock pc*\n"
    "⚡ *shutdown* / *restart* (asks you to confirm)\n\n"
    "Anything else (questions, emails, research), I hand to my AI brain and tell you when it's ready ✅"
)

# ---------- time parsing ("at 6 pm", "in 10 minutes", "tomorrow at 9") ----------

_AT = re.compile(r"\b(?:at|by|@)?\s*(\d{1,2})(?:[:.](\d{2}))?\s*(am|pm|a\.m\.|p\.m\.)(?![\w])|\b(?:at|by)\s+(\d{1,2})[:.](\d{2})\b|\b(\d{1,2}):(\d{2})\b", re.I)
_IN = re.compile(r"\bin\s+(\d{1,3}|an?|one|two|five|ten|fifteen|thirty)\s*(min(?:ute)?s?|hours?|hrs?|h)\b", re.I)
_WORDS = {"a": 1, "an": 1, "one": 1, "two": 2, "five": 5, "ten": 10, "fifteen": 15, "thirty": 30}


def parse_when(text: str, now: datetime | None = None) -> tuple[datetime | None, str]:
    """The reminder time in the text (local time zone) and the text without it."""
    now = now or now_local()
    rest = text
    m = _IN.search(text)
    if m:
        n = int(m.group(1)) if m.group(1).isdigit() else _WORDS[m.group(1).lower()]
        delta = timedelta(hours=n) if m.group(2).lower().startswith("h") else timedelta(minutes=n)
        return now + delta, (text[: m.start()] + text[m.end():])
    m = _AT.search(text)
    if not m:
        return None, rest
    if m.group(1):
        h, mi, ap = int(m.group(1)), int(m.group(2) or 0), m.group(3).lower().replace(".", "")
        if ap == "pm" and h < 12:
            h += 12
        if ap == "am" and h == 12:
            h = 0
    else:
        h, mi = int(m.group(4) or m.group(6)), int(m.group(5) or m.group(7))
    if h > 23 or mi > 59:
        return None, rest
    when = now.replace(hour=h, minute=mi, second=0, microsecond=0)
    tomorrow = re.search(r"\btomorrow\b", text, re.I)
    if tomorrow or when <= now:
        when += timedelta(days=1)
    rest = text[: m.start()] + text[m.end():]
    rest = re.sub(r"\b(today|tonight|tomorrow)\b", "", rest, flags=re.I)
    return when, rest


def parse_reminder(text: str, now: datetime | None = None) -> tuple[str, datetime | None] | None:
    """("Call mom", 18:00 today) from "remind me to call mom at 6 pm"; None if it isn't a reminder."""
    if not re.search(r"\b(remind me|reminder|add (a )?task|todo|to-do)\b", text, re.I):
        return None
    when, rest = parse_when(text, now)
    what = re.sub(r"^(hey |ok |hi )?azarvis,?\s*", "", rest, flags=re.I)
    what = re.sub(r"\b(please|set a reminder|remind me|reminder|add (a )?task|todo|to-do)\b", "", what, flags=re.I)
    what = re.sub(r"\s+", " ", what).strip(" ,.:-")
    what = re.sub(r"^(to|that|about|for)\s+", "", what, flags=re.I)
    if not what:
        return None
    return what[0].upper() + what[1:], when


def fmt_when(dt: datetime) -> str:
    now = now_local()
    day = "today" if dt.date() == now.date() else "tomorrow" if dt.date() == (now + timedelta(days=1)).date() else dt.strftime("%a %d %b")
    return f"{day} at {dt.strftime('%I:%M %p').lstrip('0')}"


# ---------- PC actions ----------

KEY_ACTIONS = [
    (r"\b(volume up|louder|increase (the )?volume)\b", "volume_up", "🔊 Volume up."),
    (r"\b(volume down|quieter|lower (the )?volume|decrease (the )?volume)\b", "volume_down", "🔉 Volume down."),
    (r"\b(mute|unmute)\b", "mute", "🔇 Done."),
    (r"\b(next (song|track)|skip( song)?)\b", "next_track", "⏭️ Next track."),
    (r"\b(previous (song|track)|go back a song)\b", "previous_track", "⏮️ Previous track."),
    (r"\b(pause|play|resume)( (the )?(music|song|video))?$", "play_pause", "⏯️ Done."),
    (r"\block (my |the )?(pc|computer|laptop|screen)\b", "lock", "🔒 Your PC is locked."),
]
POWER = {"shutdown": "shutdown", "shut down": "shutdown", "restart": "restart", "reboot": "restart", "sleep": "sleep"}
SITES = {
    "youtube": "https://www.youtube.com", "gmail": "https://mail.google.com", "google": "https://www.google.com",
    "github": "https://github.com", "linkedin": "https://www.linkedin.com", "chatgpt": "https://chatgpt.com",
    "maps": "https://maps.google.com", "netflix": "https://www.netflix.com", "spotify": "https://open.spotify.com",
    "instagram": "https://www.instagram.com", "drive": "https://drive.google.com", "azarvis": "https://azarvis-app.vercel.app",
}


@dataclass
class Pending:
    """A power action waiting for "confirm"."""

    action: str
    expires: datetime


_pending_power: dict[str, Pending] = {}


def _run(action: str, target: str | None = None) -> str:
    from app.system_control import SystemControlError, run_action

    try:
        return run_action(action, target).get("message", "Done.")
    except SystemControlError as e:
        return f"⚠️ {e}"


def pc_status() -> str:
    from app.device_info import device_details

    d = device_details()
    b = d.get("battery")
    net = d["network"]
    lines = [
        "💻 *Your PC right now*",
        f"CPU {d['cpu']['percent']}% · RAM {d['memory']['percent']}% ({d['memory']['used_gb']}/{d['memory']['total_gb']} GB)",
        f"Disk {d['disk']['percent']}% used · {d['disk']['free_gb']} GB free",
        f"Battery {b['percent']}% {'⚡ charging' if b['plugged'] else 'on battery'}" if b else "No battery (desktop PC)",
        f"Network: {'🔌 cable' if net['wired'] else '📶 Wi-Fi' if net['wifi'] else 'offline'}" + (f" · {net['speed_mbps']} Mb/s link" if net.get("speed_mbps") else ""),
        f"On for {d['uptime_hours']} h · {d['processes']} programs running",
    ]
    tips = []
    if d["memory"]["percent"] >= 88:
        tips.append("Memory is almost full: close a few apps.")
    if d["disk"]["percent"] >= 90:
        tips.append("Disk is almost full: clear Downloads and the Recycle Bin.")
    if b and b["percent"] <= 20 and not b["plugged"]:
        tips.append("Battery is low: plug in the charger.")
    return "\n".join(lines + ([f"\n💡 {' '.join(tips)}"] if tips else []))


# ---------- the commands ----------

def _open_tasks(user_id: str) -> list[dict]:
    return sql.list_tasks(user_id, include_done=False)


def handle(text: str, user_id: str, sender: str = "owner") -> str | None:
    t = text.strip()
    low = t.lower().strip(" .!?")
    if not low:
        return None

    if low in {"hi", "hello", "hey", "help", "menu", "start", "commands", "hey azarvis", "hi azarvis", "?"}:
        return MENU

    # Confirming a power action.
    if low in {"confirm", "yes confirm", "confirm it"}:
        p = _pending_power.pop(sender, None)
        if not p or p.expires < now_local():
            return "Nothing is waiting for confirmation."
        return f"⚡ {_run(p.action)}"
    for word, action in POWER.items():
        if re.fullmatch(rf"({word})( (my |the )?(pc|computer|laptop))?( now)?", low):
            _pending_power[sender] = Pending(action, now_local() + timedelta(minutes=2))
            return f"⚠️ {action.capitalize()} your PC? Reply *confirm* within 2 minutes."

    reminder = parse_reminder(t)
    if reminder:
        what, when = reminder
        task = sql.create_task(user_id, what, fmt_when(when) if when else None, when.astimezone(timezone.utc) if when else None)
        if when:
            return f"⏰ Done. I'll remind you *{fmt_when(when)}*: {what}\n(Task #{task['id']} in Azarvis)"
        return f"📋 Added to your tasks: {what}\nAdd a time (\"at 6 pm\", \"in 30 minutes\") to get a reminder."

    if re.fullmatch(r"(my |show |list |open )?(tasks?|to-?dos?|reminders)( list)?( for today)?", low):
        tasks = _open_tasks(user_id)
        if not tasks:
            return "✅ No open tasks. Enjoy your day!"
        rows = [f"{i}. {x['title']}" + (f" · {x['due']}" if x.get("due") else "") for i, x in enumerate(tasks[:15], 1)]
        return "📋 *Your tasks*\n" + "\n".join(rows) + "\n\nReply *done 1* when one is finished."

    m = re.fullmatch(r"(done|complete|finished|tick)\s+#?(\d{1,3})", low)
    if m:
        tasks = _open_tasks(user_id)
        n = int(m.group(2))
        if not 1 <= n <= len(tasks):
            return f"I don't see task {n}. Reply *tasks* to see the list."
        sql.set_task_done(user_id, tasks[n - 1]["id"])
        left = len(tasks) - 1
        return f"✅ Completed: {tasks[n - 1]['title']}\n{left} task{'s' if left != 1 else ''} left."

    if re.search(r"\b(pc|computer|laptop|system) (status|health|info|details)\b|^(status|battery|cpu|ram|memory|disk)( status)?$|\bhow is my (pc|computer|laptop)\b", low):
        try:
            return pc_status()
        except Exception as e:  # psutil missing etc.
            return f"⚠️ Couldn't read the PC status: {e}"

    for pattern, action, ok in KEY_ACTIONS:
        if re.search(pattern, low):
            msg = _run(action)
            return msg if msg.startswith("⚠️") else ok

    m = re.fullmatch(r"(open|launch|start|run)\s+(?:the\s+|my\s+)?(.+?)(?:\s+(app|website|site|folder))?", low)
    if m:
        target = m.group(2).strip()
        if target in SITES:
            return f"🚀 {_run('open_url', SITES[target])}"
        if target in {"downloads", "documents", "desktop", "pictures", "music", "videos"} or m.group(3) == "folder":
            return f"📁 {_run('open_folder', target)}"
        if re.match(r"https?://", target):
            return f"🌐 {_run('open_url', target)}"
        if m.group(3) in (None, "app"):
            return f"🚀 {_run('open_app', target)}"

    if low in {"time", "what time is it", "what's the time", "whats the time"}:
        return f"🕒 It's {now_local().strftime('%I:%M %p, %A %d %B').lstrip('0')}."

    return None
