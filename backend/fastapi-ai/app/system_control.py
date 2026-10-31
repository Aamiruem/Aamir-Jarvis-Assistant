"""Windows actions Jarvis can do on the PC this service runs on.

A browser page can't open apps or change the volume, but this service runs locally, so it can.
Only the fixed actions below exist: Claude or the browser picks an action and a target from
these lists; nothing they send is ever run as a command. Turn it off with SYSTEM_CONTROL=false
(always do that when the service runs on a server rather than your own PC).
"""
import json
import os
import shutil
import subprocess
import sys
import time
from datetime import datetime
from pathlib import Path

from app.config import settings

# name the user says -> what Windows should open (exe on the PATH/App Paths, or a protocol URI)
APPS = {
    "notepad": "notepad.exe",
    "calculator": "calc.exe",
    "paint": "mspaint.exe",
    "file explorer": "explorer.exe",
    "explorer": "explorer.exe",
    "task manager": "taskmgr.exe",
    "command prompt": "cmd.exe",
    "terminal": "wt.exe",
    "powershell": "powershell.exe",
    "control panel": "control.exe",
    "settings": "ms-settings:",
    "wifi settings": "ms-settings:network-wifi",
    "bluetooth settings": "ms-settings:bluetooth",
    "display settings": "ms-settings:display",
    "sound settings": "ms-settings:sound",
    "camera": "microsoft.windows.camera:",
    "clock": "ms-clock:",
    "alarms": "ms-clock:",
    "photos": "ms-photos:",
    "microsoft store": "ms-windows-store:",
    "snipping tool": "ms-screenclip:",
    "calendar": "outlookcal:",
    "mail": "mailto:",
    "edge": "microsoft-edge:",
    "chrome": "chrome.exe",
    "vs code": "code",
    "visual studio code": "code",
    "word": "winword.exe",
    "excel": "excel.exe",
    "powerpoint": "powerpnt.exe",
    "spotify": "spotify:",
    "whatsapp": "whatsapp:",
}

FOLDERS = {name: Path.home() / name.capitalize() for name in ("downloads", "documents", "desktop", "pictures", "music", "videos")}

# Media/volume keys, pressed through Windows Script Host (no extra installs). Each volume press = 2%.
KEYS = {"volume_up": (175, 5), "volume_down": (174, 5), "mute": (173, 1), "play_pause": (179, 1), "next_track": (176, 1), "previous_track": (177, 1)}

ACTIONS = ("open_url", "open_app", "open_folder", *KEYS, "lock", "screenshot")

_STATUS_PS = r"""
$os = Get-CimInstance Win32_OperatingSystem
$cpu = (Get-CimInstance Win32_Processor | Measure-Object -Property LoadPercentage -Average).Average
$disk = Get-CimInstance Win32_LogicalDisk -Filter "DeviceID='C:'"
$bat = Get-CimInstance Win32_Battery | Select-Object -First 1
[pscustomobject]@{
  cpu = [math]::Round($cpu)
  ram = [math]::Round(100 - $os.FreePhysicalMemory / $os.TotalVisibleMemorySize * 100)
  disk = [math]::Round(100 - $disk.FreeSpace / $disk.Size * 100)
  disk_free_gb = [math]::Round($disk.FreeSpace / 1GB, 1)
  battery = if ($bat) { $bat.EstimatedChargeRemaining } else { $null }
  charging = if ($bat) { $bat.BatteryStatus -eq 2 } else { $null }
} | ConvertTo-Json -Compress
"""

_SCREENSHOT_PS = r"""
Add-Type -AssemblyName System.Windows.Forms, System.Drawing
$b = [System.Windows.Forms.SystemInformation]::VirtualScreen
$bmp = New-Object System.Drawing.Bitmap $b.Width, $b.Height
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.CopyFromScreen($b.Left, $b.Top, 0, 0, $bmp.Size)
$bmp.Save($env:JARVIS_SHOT, [System.Drawing.Imaging.ImageFormat]::Png)
"""


class SystemControlError(Exception):
    pass


def _powershell(script: str, env: dict | None = None, timeout: int = 20) -> str:
    done = subprocess.run(
        ["powershell", "-NoProfile", "-NonInteractive", "-Command", script],
        capture_output=True, text=True, timeout=timeout, env={**os.environ, **(env or {})},
        creationflags=getattr(subprocess, "CREATE_NO_WINDOW", 0),
    )
    if done.returncode != 0:
        raise SystemControlError(done.stderr.strip()[:300] or "PowerShell command failed")
    return done.stdout.strip()


def _check_enabled() -> None:
    if not settings.system_control:
        raise SystemControlError("System control is turned off (SYSTEM_CONTROL=false in .env).")
    if sys.platform != "win32":
        raise SystemControlError("System control only works when the AI service runs on Windows.")


def _start(target: str) -> None:
    resolved = shutil.which(target) if not target.endswith(":") and "." not in target else None
    os.startfile(resolved or target)  # Windows shell: same as typing it in the Run box


def run_action(action: str, target: str | None = None) -> dict:
    """Do one allowed action. Returns {"ok": True, "message": ...} or raises SystemControlError."""
    _check_enabled()
    action = (action or "").strip().lower()
    name = (target or "").strip().lower()
    if action not in ACTIONS:
        raise SystemControlError(f"Unknown action '{action}'. Allowed: {', '.join(ACTIONS)}")

    if action == "open_url":
        if not (target or "").startswith(("https://", "http://")):
            raise SystemControlError("Only http(s) links can be opened.")
        os.startfile(target)  # opens in the default browser, which no pop-up blocker stops
        return {"ok": True, "message": f"Opened {target} in your browser."}

    if action == "open_app":
        app = APPS.get(name.removesuffix(" app"))
        if not app:
            raise SystemControlError(f"I don't know an app called '{target}'. I can open: {', '.join(sorted(APPS))}.")
        try:
            _start(app)
        except OSError:
            raise SystemControlError(f"{target} doesn't seem to be installed on this PC.")
        return {"ok": True, "message": f"Opened {target}."}

    if action == "open_folder":
        folder = FOLDERS.get(name.removesuffix(" folder"))
        if not folder:
            raise SystemControlError(f"I can open these folders: {', '.join(FOLDERS)}.")
        os.startfile(folder)
        return {"ok": True, "message": f"Opened your {name.removesuffix(' folder')} folder."}

    if action in KEYS:
        code, presses = KEYS[action]
        _powershell(f"$s = New-Object -ComObject WScript.Shell; 1..{presses} | ForEach-Object {{ $s.SendKeys([char]{code}) }}")
        return {"ok": True, "message": action.replace("_", " ").capitalize() + " done."}

    if action == "lock":
        subprocess.run(["rundll32.exe", "user32.dll,LockWorkStation"], check=False)
        return {"ok": True, "message": "Locked the PC."}

    # screenshot
    out_dir = Path.home() / "Pictures" / "Jarvis Screenshots"
    out_dir.mkdir(parents=True, exist_ok=True)
    shot = out_dir / f"screenshot-{datetime.now():%Y%m%d-%H%M%S}.png"
    _powershell(_SCREENSHOT_PS, env={"JARVIS_SHOT": str(shot)})
    return {"ok": True, "message": f"Screenshot saved to {shot}.", "path": str(shot)}


_status_cache: tuple[float, dict] | None = None
STATUS_CACHE_SECONDS = 5  # several open tabs share one reading


def _status_psutil() -> dict:
    import psutil  # in-process and fast (milliseconds), unlike starting PowerShell (seconds)

    disk = psutil.disk_usage(os.environ.get("SystemDrive", "C:") + "\\")
    bat = psutil.sensors_battery()
    return {
        "cpu": round(psutil.cpu_percent(interval=0.3)),
        "ram": round(psutil.virtual_memory().percent),
        "disk": round(disk.percent),
        "disk_free_gb": round(disk.free / 1024**3, 1),
        "battery": round(bat.percent) if bat else None,
        "charging": bat.power_plugged if bat else None,
    }


def system_status() -> dict:
    """CPU, memory and disk use (percent), free disk space and battery level of this PC."""
    global _status_cache
    _check_enabled()
    if _status_cache and time.monotonic() - _status_cache[0] < STATUS_CACHE_SECONDS:
        return _status_cache[1]
    try:
        status = _status_psutil()
    except ImportError:  # psutil not installed: same numbers through PowerShell (slower)
        status = json.loads(_powershell(_STATUS_PS, timeout=30))
    _status_cache = (time.monotonic(), status)
    return status
