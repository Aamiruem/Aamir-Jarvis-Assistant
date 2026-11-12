"""Read-only details about THIS computer for the "Your device" card on the Azarvis website.

The website (https://azarvis-app.vercel.app) runs in the browser, which can't see CPU, memory,
disk or whether a network cable is plugged in. When this service runs on the user's PC, the
page asks http://127.0.0.1:8001/local/device instead (see app/routers/local_bridge.py).

Only numbers and on/off states: no file names, no user names, no host name, no IP addresses.
"""

from __future__ import annotations

import os
import platform
import re
import time

from app.system_control import current_os

# Interfaces that aren't a real connection to the outside: loopback, VPN/virtual adapters.
_VIRTUAL = re.compile(r"loopback|^lo\d*$|vethernet|virtual|vmware|vbox|hyper-v|docker|wsl|tailscale|zerotier|tap|tun|bluetooth|bridge|utun|awdl|llw|isatap|teredo|npcap", re.I)
_WIFI = re.compile(r"wi-?fi|wlan|wireless|^wl|airport", re.I)
_WIRED = re.compile(r"ethernet|^eth\d|^en[ops]\d|^enx|^eno|^enp|local area connection", re.I)

_CACHE_SECONDS = 2
_cache: tuple[float, dict] | None = None


def classify_interface(name: str) -> str | None:
    """'wifi', 'ethernet', or None for loopback/virtual/unknown adapters (by the OS's adapter name)."""
    if _VIRTUAL.search(name):
        return None
    if _WIFI.search(name):
        return "wifi"
    if _WIRED.search(name):
        return "ethernet"
    if current_os() == "mac" and re.fullmatch(r"en\d", name):
        return "ethernet" if name != "en0" else "wifi"  # en0 is Wi-Fi on MacBooks
    return None


def _connections(psutil) -> list[dict]:
    out = []
    for name, st in psutil.net_if_stats().items():
        kind = classify_interface(name)
        if kind and st.isup:
            out.append({"type": kind, "speed_mbps": st.speed or None})
    # Wired first: when both are up, the cable is what the PC uses.
    return sorted(out, key=lambda c: c["type"] != "ethernet")


def device_details() -> dict:
    """CPU, memory, disk, battery/charger, network (wired or Wi-Fi) and traffic counters."""
    global _cache
    if _cache and time.monotonic() - _cache[0] < _CACHE_SECONDS:
        return _cache[1]
    import psutil

    root = os.environ.get("SystemDrive", "C:") + "\\" if current_os() == "windows" else "/"
    vm = psutil.virtual_memory()
    disk = psutil.disk_usage(root)
    bat = psutil.sensors_battery()
    freq = psutil.cpu_freq()
    net = psutil.net_io_counters()
    conns = _connections(psutil)
    info = {
        "source": "pc",
        "os": current_os(),
        "os_version": platform.release(),
        "cpu": {
            "percent": round(psutil.cpu_percent(interval=0.25)),
            "cores": psutil.cpu_count(logical=False) or None,
            "threads": psutil.cpu_count(logical=True) or None,
            "ghz": round(freq.current / 1000, 2) if freq and freq.current else None,
        },
        "memory": {"percent": round(vm.percent), "total_gb": round(vm.total / 1024**3, 1), "used_gb": round(vm.used / 1024**3, 1)},
        "disk": {"percent": round(disk.percent), "total_gb": round(disk.total / 1024**3), "free_gb": round(disk.free / 1024**3, 1)},
        "battery": (
            {
                "percent": round(bat.percent),
                "plugged": bool(bat.power_plugged),
                "minutes_left": round(bat.secsleft / 60) if bat.secsleft not in (psutil.POWER_TIME_UNLIMITED, psutil.POWER_TIME_UNKNOWN) and bat.secsleft > 0 else None,
            }
            if bat
            else None
        ),
        "network": {
            "online": bool(conns),
            "type": conns[0]["type"] if conns else None,
            "wired": any(c["type"] == "ethernet" for c in conns),
            "wifi": any(c["type"] == "wifi" for c in conns),
            "speed_mbps": conns[0]["speed_mbps"] if conns else None,
            "bytes_sent": net.bytes_sent,
            "bytes_recv": net.bytes_recv,
        },
        "uptime_hours": round((time.time() - psutil.boot_time()) / 3600, 1),
        "processes": len(psutil.pids()),
        "time": time.time(),
    }
    _cache = (time.monotonic(), info)
    return info
