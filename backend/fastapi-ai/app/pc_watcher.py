"""PC watcher: Azarvis keeps an eye on this computer and tells you when something needs attention.

Every 30 seconds it reads a few cheap signals and turns *changes* into notifications (the bell,
read aloud by the app) for the users who switched it on. Each alert fires once per change, not on
every check:

    battery    low at 20% and 10% while not charging; full while charging
    disk       the system drive under 10% or 5 GB free
    busy       processor or memory above 90% for about a minute, naming the app using the most
    downloads  a new file finished downloading
    drives     a USB drive or memory card connected or removed
    network    internet connection lost, and back

Signals come from a Probe, so tests can feed in any situation without touching the real PC.
Only runs where Azarvis may look at the computer (SYSTEM_CONTROL=true), never on a server.
"""
import asyncio
import json
import logging
import socket
import threading
import time
from dataclasses import dataclass, field
from pathlib import Path

from app.config import settings
from app.db import sql

log = logging.getLogger("jarvis.pcwatch")

CHECKS = {
    "battery": "Battery low (20% and 10%), and full while charging",
    "disk": "Disk almost full",
    "busy": "Processor or memory busy for a minute, and which app causes it",
    "downloads": "A download finished",
    "drives": "A USB drive or memory card connected or removed",
    "network": "Internet connection lost or back",
}
PARTIAL = (".crdownload", ".part", ".partial", ".download", ".tmp", ".opdownload", ".!ut")
BATTERY_LEVELS = (20, 10)
BUSY_PERCENT = 90
BUSY_CHECKS = 2              # in a row (~1 minute at 30 s)
BUSY_COOLDOWN = 30 * 60      # seconds between two "busy" alerts
DISK_LOW_PCT, DISK_LOW_GB, DISK_OK_PCT = 10, 5, 15
OFFLINE_CHECKS = 2           # failed checks in a row before "connection lost" (ignores blips)


@dataclass
class Alert:
    kind: str
    title: str
    body: str = ""


class Probe:
    """Reads the real computer (psutil, the Downloads folder, a DNS socket)."""

    def __init__(self, downloads: Path | None = None):
        import psutil

        self.ps = psutil
        self.downloads_dir = downloads or Path.home() / "Downloads"
        self.ps.cpu_percent(None)  # the first reading is always 0; prime it

    def battery(self):  # (percent, plugged in) or None on desktops
        b = self.ps.sensors_battery()
        return (round(b.percent), bool(b.power_plugged)) if b else None

    def disk(self):  # (free %, free GB) of the system drive
        u = self.ps.disk_usage(Path.home().anchor or "/")
        return 100 - u.percent, u.free / 1e9

    def cpu(self) -> float:
        return self.ps.cpu_percent(None)

    def memory(self) -> float:
        return self.ps.virtual_memory().percent

    def top_app(self, by: str) -> str:
        """Name of the process using the most CPU or memory right now."""
        procs = list(self.ps.process_iter(["name"]))
        if by == "cpu":
            for p in procs:
                try:
                    p.cpu_percent(None)
                except (self.ps.Error, OSError):
                    pass
            time.sleep(0.5)
            key = lambda p: p.cpu_percent(None)  # noqa: E731
        else:
            key = lambda p: p.memory_info().rss  # noqa: E731
        best, best_value = "", -1.0
        for p in procs:
            try:
                value = key(p)
            except (self.ps.Error, OSError):
                continue
            name = p.info.get("name") or ""
            if value > best_value and name.lower() not in ("system idle process", "idle", "system", "kernel_task"):
                best, best_value = name, value
        return best.removesuffix(".exe")

    def downloads(self) -> dict[str, tuple[float, int]]:
        """name -> (modified time, size) of finished files in Downloads."""
        out = {}
        try:
            for f in self.downloads_dir.iterdir():
                if f.is_file() and not f.name.startswith((".", "~$")) and not f.name.lower().endswith(PARTIAL):
                    st = f.stat()
                    out[f.name] = (st.st_mtime, st.st_size)
        except OSError:
            pass
        return out

    def drives(self) -> set[str]:
        found = set()
        for part in self.ps.disk_partitions(all=False):
            mount = part.mountpoint
            if "removable" in part.opts or mount.startswith(("/media/", "/run/media/", "/Volumes/")):
                found.add(mount)
        return found

    def online(self) -> bool:
        try:
            socket.create_connection(("1.1.1.1", 53), timeout=2).close()
            return True
        except OSError:
            return False


def _size(n: int) -> str:
    for unit in ("bytes", "KB", "MB", "GB"):
        if n < 1024 or unit == "GB":
            return f"{n:.0f} {unit}" if unit == "bytes" else f"{n:.1f} {unit}"
        n /= 1024


@dataclass
class Watcher:
    """Remembers what it saw last time, so each change is reported once."""
    probe: object
    checks: set[str] = field(default_factory=lambda: set(CHECKS))
    clock: object = time.time
    _primed: set = field(default_factory=set)  # checks that have run once (their baseline is known)
    _battery_alerted: int = 101
    _full_alerted: bool = False
    _disk_alerted: bool = False
    _busy: dict = field(default_factory=lambda: {"cpu": 0, "memory": 0})
    _busy_last: dict = field(default_factory=lambda: {"cpu": float("-inf"), "memory": float("-inf")})  # never alerted yet
    _downloads: dict = field(default_factory=dict)
    _drives: set = field(default_factory=set)
    _offline_count: int = 0
    _offline_since: float | None = None

    def check(self) -> list[Alert]:
        alerts: list[Alert] = []
        for kind in ("battery", "disk", "busy", "downloads", "drives", "network"):
            if kind not in self.checks:
                self._primed.discard(kind)  # switched off: re-learn the baseline when it comes back
            else:
                try:
                    alerts += getattr(self, f"_check_{kind}")()
                except Exception:  # one broken sensor must not stop the others
                    log.exception("pc watcher: %s check failed", kind)
                self._primed.add(kind)
        return alerts

    def _check_battery(self):
        b = self.probe.battery()
        if not b:
            return []
        pct, plugged = b
        if plugged:
            self._battery_alerted = 101
            if pct >= 100 and not self._full_alerted:
                self._full_alerted = True
                return [Alert("battery", "Battery full", "You can unplug the charger.")]
            return []
        self._full_alerted = False
        for level in BATTERY_LEVELS:
            if pct <= level < self._battery_alerted:
                self._battery_alerted = level
                return [Alert("battery", f"Battery at {pct}%", "Plug in the charger soon." if level > 10 else "Plug in the charger now, or save your work.")]
        return []

    def _check_disk(self):
        free_pct, free_gb = self.probe.disk()
        if not self._disk_alerted and (free_pct < DISK_LOW_PCT or free_gb < DISK_LOW_GB):
            self._disk_alerted = True
            return [Alert("disk", "Disk almost full", f"Only {free_gb:.1f} GB ({free_pct:.0f}%) free. Emptying Downloads or the Recycle Bin helps.")]
        if self._disk_alerted and free_pct > DISK_OK_PCT and free_gb >= DISK_LOW_GB:
            self._disk_alerted = False
        return []

    def _check_busy(self):
        out = []
        for what, value in (("cpu", self.probe.cpu()), ("memory", self.probe.memory())):
            self._busy[what] = self._busy[what] + 1 if value >= BUSY_PERCENT else 0
            now = self.clock()
            if self._busy[what] >= BUSY_CHECKS and now - self._busy_last[what] > BUSY_COOLDOWN:
                self._busy_last[what] = now
                app = self.probe.top_app(what)
                label = "Processor" if what == "cpu" else "Memory"
                out.append(Alert("busy", f"{label} at {value:.0f}% for a minute",
                                 f"{app} is using the most." if app else "Closing apps you aren't using will help."))
        return out

    def _check_downloads(self):
        now = self.probe.downloads()
        before, self._downloads = self._downloads, now
        if "downloads" not in self._primed:  # first look: these files were already there
            return []
        new = [name for name, (mtime, size) in now.items() if name not in before and size > 0]
        if not new:
            return []
        if len(new) == 1:
            return [Alert("downloads", "Download finished", f"{new[0]} ({_size(now[new[0]][1])})")]
        listed = ", ".join(sorted(new)[:3]) + ("…" if len(new) > 3 else "")
        return [Alert("downloads", f"{len(new)} downloads finished", listed)]

    def _check_drives(self):
        now = self.probe.drives()
        before, self._drives = self._drives, now
        if "drives" not in self._primed:
            return []
        return ([Alert("drives", "Drive connected", f"{d} is ready to use.") for d in sorted(now - before)]
                + [Alert("drives", "Drive removed", f"{d} was disconnected.") for d in sorted(before - now)])

    def _check_network(self):
        if self.probe.online():
            self._offline_count = 0
            if self._offline_since is not None:
                minutes = max(1, round((self.clock() - self._offline_since) / 60))
                self._offline_since = None
                return [Alert("network", "Internet is back", f"It was down for about {minutes} minute{'s' if minutes > 1 else ''}.")]
            return []
        self._offline_count += 1
        if self._offline_count == OFFLINE_CHECKS and self._offline_since is None:
            self._offline_since = self.clock()
            return [Alert("network", "Internet connection lost", "Azarvis's quick commands still work; AI answers need the internet.")]
        return []


# ---------- who wants which alerts ----------

_lock = threading.Lock()


def _settings_path() -> Path:
    return settings.data_dir / "pc_watcher.json"


def _load() -> dict:
    try:
        return json.loads(_settings_path().read_text(encoding="utf-8"))
    except (OSError, ValueError):
        return {"users": {}}


def get_settings(user_id: str) -> dict:
    mine = _load()["users"].get(user_id, {})
    return {
        "available": settings.system_control,
        "enabled": bool(mine.get("enabled")),
        "checks": [{"key": k, "label": v, "on": k in mine.get("checks", list(CHECKS))} for k, v in CHECKS.items()],
    }


def set_settings(user_id: str, enabled: bool, checks: list[str]) -> dict:
    with _lock:
        data = _load()
        data["users"][user_id] = {"enabled": enabled, "checks": [c for c in checks if c in CHECKS]}
        _settings_path().write_text(json.dumps(data), encoding="utf-8")
    return get_settings(user_id)


def subscribers() -> dict[str, set[str]]:
    """user id -> the checks they want (only users who switched the watcher on)."""
    return {uid: set(s.get("checks", [])) for uid, s in _load()["users"].items() if s.get("enabled")}


def deliver(alerts: list[Alert], subs: dict[str, set[str]]) -> int:
    sent = 0
    for alert in alerts:
        for uid, wanted in subs.items():
            if alert.kind in wanted:
                sql.add_notification(uid, alert.title, alert.body)
                sent += 1
    return sent


async def watch_loop() -> None:
    if not settings.system_control:
        return  # on a server there is no "your computer" to watch
    try:
        watcher = await asyncio.to_thread(lambda: Watcher(Probe()))
    except ImportError:
        log.warning("PC watcher needs psutil: pip install psutil")
        return
    while True:
        await asyncio.sleep(settings.pc_watch_interval_seconds)  # first look shortly after startup, then regularly
        try:
            subs = subscribers()
            if subs:
                watcher.checks = set().union(*subs.values())
                alerts = await asyncio.to_thread(watcher.check)
                if alerts:
                    log.info("pc watcher: %s", "; ".join(a.title for a in alerts))
                    await asyncio.to_thread(deliver, alerts, subs)
        except Exception:
            log.exception("pc watcher check failed")
