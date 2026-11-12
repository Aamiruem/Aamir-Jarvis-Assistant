"""The background loop: fetch WhatsApp messages from the relay, answer them, and push
Azarvis's own news (reminders due, PC watcher alerts) to the owner's WhatsApp.

Started from app/main.py's lifespan when WHATSAPP_RELAY_URL, WHATSAPP_RELAY_KEY and
WHATSAPP_OWNER_NUMBER are set. Everything goes out through the relay (one outbound HTTPS
connection from this PC), so nothing on this PC is open to the internet.
"""
from __future__ import annotations

import asyncio
import json
import logging
import time

from app.config import settings
from app.db import sql
from app.whatsapp.bot import Bot, digits
from app.whatsapp.relay import Relay, RelayError

log = logging.getLogger("jarvis.whatsapp")

NOTIFY_EVERY_SECONDS = 15

STATUS = {"enabled": False, "connected": False, "last_ok": None, "last_error": None, "handled": 0, "forwarded": 0, "user_id": None}


def configured() -> bool:
    return bool(settings.whatsapp_relay_url and settings.whatsapp_relay_key and digits(settings.whatsapp_owner_number))


def _state_file():
    return settings.data_dir / "whatsapp_state.json"


def _load_state() -> dict:
    try:
        return json.loads(_state_file().read_text("utf-8"))
    except (OSError, ValueError):
        return {}


def _save_state(state: dict) -> None:
    try:
        settings.data_dir.mkdir(parents=True, exist_ok=True)
        _state_file().write_text(json.dumps(state), "utf-8")
    except OSError:
        log.warning("could not save WhatsApp state")


def notification_text(n: dict) -> str:
    title = n["title"]
    icon = "⏰" if title.lower().startswith("reminder") else "🔔"
    return f"{icon} *{title}*" + (f"\n{n['body']}" if n.get("body") else "") + "\n\nReply *tasks* to see your list, or *done 1* when it's finished."


async def forward_notifications(bot: Bot, state: dict) -> None:
    """Sends every notification created since the last run (reminders, PC alerts) to the owner."""
    if "last_notification" not in state:  # first run: start from now, don't replay old ones
        state["last_notification"] = await asyncio.to_thread(sql.last_notification_id)
        _save_state(state)
        return
    for n in await asyncio.to_thread(sql.notifications_after, bot.user_id, state["last_notification"]):
        await bot.say(notification_text(n))
        state["last_notification"] = n["id"]
        STATUS["forwarded"] += 1
        _save_state(state)


async def _handle(bot: Bot, msg: dict) -> None:
    try:
        await bot.process(msg)
        STATUS["handled"] += 1
    except Exception:
        log.exception("WhatsApp message failed")
        try:
            await bot.say("⚠️ Something went wrong on my side with that message. Please try again.")
        except RelayError:
            pass


async def whatsapp_loop() -> None:
    if not configured():
        return
    user_id = settings.whatsapp_user_id or await asyncio.to_thread(sql.most_active_user)
    bot = Bot(relay=Relay(settings.whatsapp_relay_url, settings.whatsapp_relay_key), user_id=user_id)
    STATUS.update(enabled=True, user_id=user_id)
    log.info("WhatsApp Jarvis is on (tasks of user %s)", user_id)
    state = _load_state()
    next_notify = 0.0
    backoff = settings.whatsapp_poll_seconds
    running: set[asyncio.Task] = set()
    while True:
        try:
            for msg in await bot.relay.pull():
                task = asyncio.create_task(_handle(bot, msg))  # several requests run side by side
                running.add(task)
                task.add_done_callback(running.discard)
            if time.monotonic() >= next_notify:
                await forward_notifications(bot, state)
                next_notify = time.monotonic() + NOTIFY_EVERY_SECONDS
            STATUS.update(connected=True, last_ok=time.time(), last_error=None)
            backoff = settings.whatsapp_poll_seconds
        except RelayError as e:
            STATUS.update(connected=False, last_error=str(e))
            backoff = min(60.0, backoff * 2)
        except Exception as e:
            log.exception("WhatsApp loop error")
            STATUS.update(last_error=f"{type(e).__name__}: {e}")
            backoff = min(60.0, backoff * 2)
        await asyncio.sleep(backoff)
