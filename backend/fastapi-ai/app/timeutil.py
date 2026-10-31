from datetime import datetime, timezone
from zoneinfo import ZoneInfo

from app.config import settings


def parse_when(value: str | None) -> datetime | None:
    """Parse an ISO-8601 date/time into an aware UTC datetime.

    A value without an offset ("2026-11-02T17:00") is read in DEFAULT_TIMEZONE.
    """
    if not value:
        return None
    try:
        dt = datetime.fromisoformat(value.strip())
    except ValueError:
        raise ValueError(f"'{value}' is not an ISO-8601 date/time such as 2026-11-02T17:00:00+05:30")
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=ZoneInfo(settings.default_timezone))
    return dt.astimezone(timezone.utc)


def now_local() -> datetime:
    return datetime.now(ZoneInfo(settings.default_timezone))
