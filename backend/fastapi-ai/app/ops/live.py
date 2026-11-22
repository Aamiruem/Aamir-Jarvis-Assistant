"""Live telemetry for the Cyber Ops hardware monitor: everything a HUD shows, all measured.

snapshot() is cheap (psutil only, ~20 ms) and safe to poll every 1-2 s. GPU load, GPU memory, the
CPU's real clock and temperatures come from Windows performance counters, which take about a
second per read; so one long-lived PowerShell process samples them in a loop while someone is
watching, and stops by itself IDLE_STOP seconds after the last poll. Anything this PC doesn't
expose (most laptops publish no temperature without vendor drivers) is None with the reason, never
a made-up number.
"""
from __future__ import annotations

import json
import logging
import os
import platform
import subprocess
import sys
import tempfile
import threading
import time
from collections import deque

import psutil

log = logging.getLogger("jarvis.ops")

IDLE_STOP = 60  # seconds without a poll before the counter sampler shuts down
HISTORY = 90  # samples kept for the graphs (~3 min at one per 2 s)

_lock = threading.Lock()
_prev: dict = {}  # last network/disk counters, for rates
_history: deque = deque(maxlen=HISTORY)

# ---------- static facts (read once) ----------

_static: dict | None = None


def _cpu_name() -> str:
    if sys.platform == "win32":
        try:
            import winreg

            with winreg.OpenKey(winreg.HKEY_LOCAL_MACHINE, r"HARDWARE\DESCRIPTION\System\CentralProcessor\0") as k:
                return " ".join(str(winreg.QueryValueEx(k, "ProcessorNameString")[0]).split())
        except OSError:
            pass
    return platform.processor() or platform.machine()


def static() -> dict:
    global _static
    if _static is None:
        freq = psutil.cpu_freq()
        _static = {
            "cpu_name": _cpu_name(), "cores": psutil.cpu_count(logical=False), "threads": psutil.cpu_count(logical=True),
            "base_mhz": round(freq.max) if freq and freq.max else None, "ram_total": psutil.virtual_memory().total,
            "os": f"{platform.system()} {platform.release()} ({platform.version()})", "host": platform.node(),
            "boot_time": psutil.boot_time(),
        }
    return _static


# ---------- Windows counter sampler ----------

SAMPLER_PS = r"""
$ErrorActionPreference = 'SilentlyContinue'
$gpus = @(Get-CimInstance Win32_VideoController | ForEach-Object { @{ name = $_.Name; ram = $_.AdapterRAM; driver = $_.DriverVersion } })
[Console]::Out.WriteLine((@{ kind = 'info'; gpus = $gpus } | ConvertTo-Json -Compress -Depth 4))
$paths = '\GPU Engine(*)\Utilization Percentage', '\GPU Adapter Memory(*)\Dedicated Usage', '\GPU Adapter Memory(*)\Shared Usage',
         '\Processor Information(_Total)\% Processor Performance', '\Thermal Zone Information(*)\Temperature'
while ($true) {
  $s = (Get-Counter -Counter $paths -MaxSamples 1).CounterSamples
  $eng = @{}
  foreach ($x in $s | Where-Object { $_.Path -like '*gpu engine*' }) {
    $t = if ($x.InstanceName -match 'engtype_(\w+)') { $Matches[1] } else { 'other' }
    $eng[$t] = [double]$eng[$t] + $x.CookedValue
  }
  $o = @{
    kind = 'sample'
    engines = $eng
    dedicated = ($s | Where-Object { $_.Path -like '*dedicated usage*' } | Measure-Object CookedValue -Sum).Sum
    shared = ($s | Where-Object { $_.Path -like '*shared usage*' } | Measure-Object CookedValue -Sum).Sum
    perf = ($s | Where-Object { $_.Path -like '*processor performance*' } | Select-Object -First 1).CookedValue
    thermal = @($s | Where-Object { $_.Path -like '*thermal zone*' } | ForEach-Object { @{ zone = $_.InstanceName; kelvin = $_.CookedValue } })
  }
  [Console]::Out.WriteLine(($o | ConvertTo-Json -Compress -Depth 4))
  Start-Sleep -Milliseconds 1000
}
"""


class CounterSampler:
    """One PowerShell process printing a JSON line per sample; started on demand, stopped when idle."""

    def __init__(self):
        self.info: dict = {}
        self.sample: dict | None = None
        self.sampled_at = 0.0
        self.last_poll = 0.0
        self.error: str | None = None
        self._proc: subprocess.Popen | None = None
        self._thread: threading.Thread | None = None
        self._script: str | None = None

    def poll(self) -> None:
        """Called on every snapshot: keeps the sampler alive (or starts it)."""
        self.last_poll = time.time()
        if sys.platform != "win32":
            return
        with _lock:
            if self._thread and self._thread.is_alive():
                return
            self._thread = threading.Thread(target=self._run, name="ops-counters", daemon=True)
            self._thread.start()

    def _run(self) -> None:
        try:
            if not self._script or not os.path.exists(self._script):
                fd, self._script = tempfile.mkstemp(prefix="jarvis-counters-", suffix=".ps1")
                with os.fdopen(fd, "w", encoding="utf-8") as f:
                    f.write(SAMPLER_PS)
            self._proc = subprocess.Popen(
                ["powershell", "-NoProfile", "-NonInteractive", "-ExecutionPolicy", "Bypass", "-File", self._script],
                stdout=subprocess.PIPE, stderr=subprocess.DEVNULL, text=True, encoding="utf-8", errors="replace",
                creationflags=getattr(subprocess, "CREATE_NO_WINDOW", 0))
            self.error = None
            watchdog = threading.Thread(target=self._watch, daemon=True)
            watchdog.start()
            for line in self._proc.stdout:
                line = line.strip()
                if not line.startswith("{"):
                    continue
                try:
                    d = json.loads(line)
                except ValueError:
                    continue
                if d.get("kind") == "info":
                    self.info = d
                else:
                    self.sample, self.sampled_at = d, time.time()
        except Exception as e:  # PowerShell missing or blocked: the rest of the HUD still works
            self.error = str(e)[:200]
            log.warning("ops counter sampler failed: %s", e)
        finally:
            self.stop()

    def _watch(self) -> None:
        while self._proc and self._proc.poll() is None:
            if time.time() - self.last_poll > IDLE_STOP:
                self.stop()
                return
            time.sleep(2)

    def stop(self) -> None:
        p, self._proc = self._proc, None
        if p and p.poll() is None:
            try:
                p.kill()
            except OSError:
                pass

    def fresh(self) -> dict | None:
        return self.sample if self.sample and time.time() - self.sampled_at < 10 else None


sampler = CounterSampler()


# ---------- interpretation (pure, tested) ----------

def gpu_from(sample: dict | None, info: dict) -> dict:
    gpus = (info or {}).get("gpus") or []
    if isinstance(gpus, dict):  # ConvertTo-Json flattens a one-item array
        gpus = [gpus]
    names = [g.get("name") for g in gpus if g.get("name")]
    out = {"name": " + ".join(names) or None, "vram_total": next((g.get("ram") for g in gpus if g.get("ram")), None),
           "util": None, "engines": {}, "dedicated": None, "shared": None}
    if sample:
        eng = {k: round(min(100.0, float(v or 0)), 1) for k, v in (sample.get("engines") or {}).items()}
        out["engines"] = eng
        out["util"] = max(eng.values()) if eng else 0.0  # Task Manager's rule: the busiest engine
        out["dedicated"] = sample.get("dedicated")
        out["shared"] = sample.get("shared")
    return out


def temps_from(sample: dict | None) -> dict:
    zones = (sample or {}).get("thermal") or []
    if isinstance(zones, dict):
        zones = [zones]
    vals = [round(float(z["kelvin"]) - 273.15, 1) for z in zones if z.get("kelvin")]
    vals = [v for v in vals if 0 < v < 125]  # ignore zones that report nonsense
    if vals:
        return {"cpu": max(vals), "zones": vals, "source": "ACPI thermal zones", "reason": None}
    if sample is None:
        return {"cpu": None, "zones": [], "source": None, "reason": "Reading sensors…" if sys.platform == "win32" else "Not available on this system"}
    return {"cpu": None, "zones": [], "source": None,
            "reason": "This PC exposes no temperature sensor to Windows (no ACPI thermal zone). Vendor tools such as the manufacturer's control centre can read it."}


def rate(name: str, value: float, now: float) -> float | None:
    """Bytes per second since the previous call with the same name."""
    prev = _prev.get(name)
    _prev[name] = (value, now)
    if not prev or now <= prev[1]:
        return None
    return max(0.0, (value - prev[0]) / (now - prev[1]))


def rank_processes(prev: dict, rows: list[tuple], wall: float, ncpu: int, n: int = 6) -> tuple[dict, dict]:
    """CPU % per process from the change in its CPU time since the previous read (pure, tested).

    rows: (pid, name, rss, cpu_seconds). Returns (top lists, cpu-time table for the next read).
    """
    table, out = {}, []
    for pid, name, rss, cpu_s in rows:
        table[pid] = cpu_s
        before = prev.get(pid)
        cpu = 100 * (cpu_s - before) / wall / ncpu if before is not None and wall > 0 and cpu_s >= before else 0.0
        out.append({"pid": pid, "name": name or "?", "cpu": round(min(100.0, cpu), 1), "mem": rss})
    return {"cpu": sorted(out, key=lambda r: (-r["cpu"], -r["mem"]))[:n], "mem": sorted(out, key=lambda r: -r["mem"])[:n], "count": len(out)}, table


class ProcessWatcher:
    """Reading ~400 processes takes over a second on Windows, so it runs beside the requests,
    every few seconds while the monitor is open, and snapshots return the latest table at once."""

    EVERY = 3.0

    def __init__(self):
        self.top: dict = {"cpu": [], "mem": [], "count": None}
        self.last_poll = 0.0
        self._thread: threading.Thread | None = None

    def poll(self) -> dict:
        self.last_poll = time.time()
        with _lock:
            if not (self._thread and self._thread.is_alive()):
                self._thread = threading.Thread(target=self._run, name="ops-processes", daemon=True)
                self._thread.start()
        return self.top

    def read(self) -> list[tuple]:
        rows = []
        for p in psutil.process_iter(["pid", "name", "memory_info", "cpu_times"]):
            i = p.info
            if not i["pid"]:
                continue
            ct = i.get("cpu_times")
            rows.append((i["pid"], i["name"], i["memory_info"].rss if i.get("memory_info") else 0, (ct.user + ct.system) if ct else 0.0))
        return rows

    def _run(self) -> None:
        prev, at = {}, None
        ncpu = psutil.cpu_count() or 1
        while time.time() - self.last_poll < IDLE_STOP:
            try:
                rows = self.read()
                now = time.monotonic()
                self.top, prev = rank_processes(prev, rows, (now - at) if at else 0.0, ncpu)
                at = now
            except Exception as e:  # never let a process that vanished mid-read stop the monitor
                log.debug("process read failed: %s", e)
            time.sleep(self.EVERY)


processes = ProcessWatcher()


def snapshot() -> dict:
    sampler.poll()
    now = time.time()
    st = static()
    per_core = psutil.cpu_percent(interval=None, percpu=True)
    cpu = round(sum(per_core) / len(per_core), 1) if per_core else 0.0
    vm, sw = psutil.virtual_memory(), psutil.swap_memory()
    net = psutil.net_io_counters()
    try:
        dio = psutil.disk_io_counters()
    except Exception:  # can be missing on some VMs
        dio = None
    sample = sampler.fresh()
    perf = (sample or {}).get("perf")
    mhz = round(st["base_mhz"] * float(perf) / 100) if perf and st["base_mhz"] else None
    disks = []
    for part in psutil.disk_partitions(all=False):
        if "cdrom" in part.opts or not part.fstype:
            continue
        try:
            u = psutil.disk_usage(part.mountpoint)
        except OSError:
            continue
        disks.append({"mount": part.mountpoint, "fs": part.fstype, "total": u.total, "used": u.used, "free": u.free, "percent": u.percent})
    bat = psutil.sensors_battery() if hasattr(psutil, "sensors_battery") else None
    gpu = gpu_from(sample, sampler.info)
    snap = {
        "at": now, "static": st, "uptime": round(now - st["boot_time"]),
        "cpu": {"percent": cpu, "per_core": per_core, "mhz": mhz, "base_mhz": st["base_mhz"]},
        "ram": {"total": vm.total, "used": vm.total - vm.available, "available": vm.available, "percent": vm.percent,
                "swap_total": sw.total, "swap_used": sw.used, "swap_percent": sw.percent},
        "disks": disks,
        "disk_io": {"read": rate("dr", dio.read_bytes, now), "write": rate("dw", dio.write_bytes, now)} if dio else None,
        "net": {"up": rate("up", net.bytes_sent, now), "down": rate("down", net.bytes_recv, now), "sent": net.bytes_sent, "recv": net.bytes_recv},
        "battery": {"percent": round(bat.percent), "plugged": bool(bat.power_plugged),
                    "secs_left": bat.secsleft if bat.secsleft not in (psutil.POWER_TIME_UNLIMITED, psutil.POWER_TIME_UNKNOWN) and bat.secsleft > 0 else None} if bat else None,
        "gpu": gpu, "temps": temps_from(sample), "processes": processes.poll(),
        "sensors": "Windows performance counters" if sample else (sampler.error or ("starting" if sys.platform == "win32" else "unavailable")),
    }
    _history.append({"t": round(now), "cpu": cpu, "ram": vm.percent, "gpu": gpu["util"],
                     "up": snap["net"]["up"], "down": snap["net"]["down"]})
    snap["history"] = list(_history)
    return snap
