"""Background job: turns due task reminders into notifications.

A plain asyncio loop started with the app. For heavier scheduling (cron
expressions, retries, many workers) look at APScheduler, Celery beat, or
AWS EventBridge Scheduler.
"""
import asyncio
import logging

from app.config import settings
from app.db import sql

log = logging.getLogger("jarvis.scheduler")


async def reminder_loop() -> None:
    while True:
        try:
            fired = await asyncio.to_thread(sql.fire_due_reminders)
            if fired:
                log.info("fired %d reminder(s)", fired)
        except Exception:
            log.exception("reminder check failed")
        await asyncio.sleep(settings.reminder_interval_seconds)
