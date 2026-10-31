"""Actions Jarvis can do on the computer this service runs on: Windows, Linux or macOS.

A browser page can't open apps or change the volume, but this service runs locally, so it can.
Only the fixed actions below exist: Claude or the browser picks an action and a target from
these lists; nothing they send is ever run as a command. Turn it off with SYSTEM_CONTROL=false
(always do that when the service runs on a server rather than your own computer).

Shutdown and restart wait POWER_DELAY_SECONDS and can be cancelled ("cancel shutdown"), so a
misheard voice command never switches the computer off without warning.
"""
import json
import os
import shlex
import shutil
import subprocess
import sys
import threading
import time
import webbrowser
from datetime import datetime
from pathlib import Path

from app.config import settings

# ---------- what each name means on each OS ----------

# Windows: exe on the PATH/App Paths, or a protocol URI
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

# Windows process names for close_app. Only apps listed here can be closed (never explorer.exe:
# that would take the taskbar and desktop down with it).
WINDOWS_PROCESSES = {
    "notepad": "Notepad.exe",
    "calculator": "CalculatorApp.exe",
    "paint": "mspaint.exe",
    "task manager": "Taskmgr.exe",
    "command prompt": "cmd.exe",
    "terminal": "WindowsTerminal.exe",
    "powershell": "powershell.exe",
    "edge": "msedge.exe",
    "chrome": "chrome.exe",
    "vs code": "Code.exe",
    "visual studio code": "Code.exe",
    "word": "WINWORD.EXE",
    "excel": "EXCEL.EXE",
    "powerpoint": "POWERPNT.EXE",
    "spotify": "Spotify.exe",
    "whatsapp": "WhatsApp.exe",
}

# Linux: candidate commands, first one installed wins (desktops ship different apps)
LINUX_APPS = {
    "notepad": ["gnome-text-editor", "gedit", "kate", "mousepad", "xed", "pluma"],
    "text editor": ["gnome-text-editor", "gedit", "kate", "mousepad", "xed", "pluma"],
    "calculator": ["gnome-calculator", "kcalc", "galculator", "mate-calc"],
    "file explorer": ["nautilus", "dolphin", "thunar", "nemo", "pcmanfm"],
    "files": ["nautilus", "dolphin", "thunar", "nemo", "pcmanfm"],
    "terminal": ["gnome-terminal", "konsole", "xfce4-terminal", "tilix", "x-terminal-emulator"],
    "task manager": ["gnome-system-monitor", "plasma-systemmonitor", "ksysguard", "xfce4-taskmanager"],
    "system monitor": ["gnome-system-monitor", "plasma-systemmonitor", "ksysguard", "xfce4-taskmanager"],
    "settings": ["gnome-control-center", "systemsettings", "xfce4-settings-manager"],
    "camera": ["snapshot", "cheese", "kamoso"],
    "photos": ["eog", "loupe", "gwenview", "shotwell"],
    "paint": ["pinta", "kolourpaint", "gimp"],
    "calendar": ["gnome-calendar", "korganizer"],
    "mail": ["thunderbird", "evolution", "geary"],
    "chrome": ["google-chrome", "google-chrome-stable", "chromium", "chromium-browser"],
    "firefox": ["firefox"],
    "edge": ["microsoft-edge", "microsoft-edge-stable"],
    "vs code": ["code"],
    "visual studio code": ["code"],
    "word": ["libreoffice --writer"],
    "excel": ["libreoffice --calc"],
    "powerpoint": ["libreoffice --impress"],
    "spotify": ["spotify"],
}

# macOS: application names for `open -a` / `quit app`
MAC_APPS = {
    "notepad": "TextEdit",
    "text editor": "TextEdit",
    "calculator": "Calculator",
    "file explorer": "Finder",
    "finder": "Finder",
    "terminal": "Terminal",
    "task manager": "Activity Monitor",
    "activity monitor": "Activity Monitor",
    "settings": "System Settings",
    "camera": "Photo Booth",
    "photos": "Photos",
    "calendar": "Calendar",
    "mail": "Mail",
    "notes": "Notes",
    "music": "Music",
    "clock": "Clock",
    "safari": "Safari",
    "chrome": "Google Chrome",
    "edge": "Microsoft Edge",
    "firefox": "Firefox",
    "vs code": "Visual Studio Code",
    "visual studio code": "Visual Studio Code",
    "word": "Microsoft Word",
    "excel": "Microsoft Excel",
    "powerpoint": "Microsoft PowerPoint",
    "spotify": "Spotify",
    "whatsapp": "WhatsApp",
}

FOLDERS = {name: Path.home() / name.capitalize() for name in ("downloads", "documents", "desktop", "pictures", "music", "videos")}

# Media/volume keys on Windows, pressed through Windows Script Host (no extra installs). Each volume press = 2%.
KEYS = {"volume_up": (175, 5), "volume_down": (174, 5), "mute": (173, 1), "play_pause": (179, 1), "next_track": (176, 1), "previous_track": (177, 1)}

POWER = ("sleep", "shutdown", "restart", "cancel_shutdown")
ACTIONS = ("open_url", "open_app", "close_app", "open_folder", *KEYS, "lock", "screenshot", *POWER)

POWER_DELAY_SECONDS = 60

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


def current_os() -> str:
    """'windows', 'mac' or 'linux' (read on every call so tests can switch it)."""
    return "windows" if sys.platform == "win32" else "mac" if sys.platform == "darwin" else "linux"


def app_names(os_name: str | None = None) -> list[str]:
    """App names this OS understands, for error messages and the agent's tool description."""
    return sorted({"windows": APPS, "mac": MAC_APPS, "linux": LINUX_APPS}[os_name or current_os()])


# ---------- running things ----------

def _powershell(script: str, env: dict | None = None, timeout: int = 20) -> str:
    done = subprocess.run(
        ["powershell", "-NoProfile", "-NonInteractive", "-Command", script],
        capture_output=True, text=True, timeout=timeout, env={**os.environ, **(env or {})},
        creationflags=getattr(subprocess, "CREATE_NO_WINDOW", 0),
    )
    if done.returncode != 0:
        raise SystemControlError(done.stderr.strip()[:300] or "PowerShell command failed")
    return done.stdout.strip()


def _run(args: list[str], what: str, timeout: int = 20) -> None:
    """Runs a fixed command (never user text as a shell line) and turns failures into friendly errors."""
    try:
        done = subprocess.run(args, capture_output=True, text=True, timeout=timeout)
    except FileNotFoundError:
        raise SystemControlError(f"{what} needs '{args[0]}', which isn't installed on this computer.")
    if done is not None and done.returncode != 0:
        raise SystemControlError(f"{what} failed: {(done.stderr or done.stdout).strip()[:200] or 'no details'}")


def _first_installed(candidates: list[str]) -> list[str] | None:
    for command in candidates:
        args = shlex.split(command)
        if shutil.which(args[0]):
            return args
    return None


def _launch(args: list[str]) -> None:
    """Starts a GUI program and returns at once, detached from this service."""
    subprocess.Popen(args, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, start_new_session=True)


def _osascript(script: str, what: str) -> None:
    _run(["osascript", "-e", script], what)


def _check_enabled() -> None:
    if not settings.system_control:
        raise SystemControlError("System control is turned off (SYSTEM_CONTROL=false in .env).")


def _start_windows(target: str) -> None:
    resolved = shutil.which(target) if not target.endswith(":") and "." not in target else None
    os.startfile(resolved or target)  # Windows shell: same as typing it in the Run box


def _open_path(target: str) -> None:
    """Opens a folder or link with the desktop's default handler."""
    system = current_os()
    if system == "windows":
        os.startfile(target)
    elif system == "mac":
        _run(["open", target], "Opening")
    else:
        _run(["xdg-open", target], "Opening")


# ---------- the actions ----------

def _open_app(name: str, target: str) -> None:
    system = current_os()
    if system == "windows":
        app = APPS.get(name)
        if not app:
            raise SystemControlError(f"I don't know an app called '{target}'. I can open: {', '.join(app_names())}.")
        try:
            _start_windows(app)
        except OSError:
            raise SystemControlError(f"{target} doesn't seem to be installed on this PC.")
    elif system == "mac":
        app = MAC_APPS.get(name)
        if not app:
            raise SystemControlError(f"I don't know an app called '{target}'. I can open: {', '.join(app_names())}.")
        _run(["open", "-a", app], f"Opening {target}")
    else:
        if name not in LINUX_APPS:
            raise SystemControlError(f"I don't know an app called '{target}'. I can open: {', '.join(app_names())}.")
        args = _first_installed(LINUX_APPS[name])
        if not args:
            raise SystemControlError(f"{target} doesn't seem to be installed on this computer.")
        _launch(args)


def _close_app(name: str, target: str) -> None:
    system = current_os()
    if system == "windows":
        process = WINDOWS_PROCESSES.get(name)
        if not process:
            raise SystemControlError(f"I can close: {', '.join(sorted(WINDOWS_PROCESSES))}.")
        _run(["taskkill", "/IM", process], f"Closing {target}")  # no /F: the app may ask to save first
    elif system == "mac":
        app = MAC_APPS.get(name)
        if not app or app == "Finder":
            raise SystemControlError(f"I can close: {', '.join(n for n in app_names() if MAC_APPS[n] != 'Finder')}.")
        _osascript(f'quit app "{app}"', f"Closing {target}")
    else:
        candidates = LINUX_APPS.get(name)
        if not candidates:
            raise SystemControlError(f"I can close: {', '.join(app_names())}.")
        binaries = [shlex.split(c)[0] for c in candidates]
        running = [b for b in binaries if subprocess.run(["pgrep", "-x", b], capture_output=True).returncode == 0]
        if not running:
            raise SystemControlError(f"{target} isn't running.")
        _run(["pkill", "-x", running[0]], f"Closing {target}")


def _media(action: str) -> None:
    system = current_os()
    if system == "windows":
        code, presses = KEYS[action]
        _powershell(f"$s = New-Object -ComObject WScript.Shell; 1..{presses} | ForEach-Object {{ $s.SendKeys([char]{code}) }}")
    elif system == "mac":
        scripts = {
            "volume_up": "set volume output volume ((output volume of (get volume settings)) + 10)",
            "volume_down": "set volume output volume ((output volume of (get volume settings)) - 10)",
            "mute": "set volume output muted (not (output muted of (get volume settings)))",
        }
        player = {"play_pause": "playpause", "next_track": "next track", "previous_track": "previous track"}
        if action in scripts:
            _osascript(scripts[action], "Changing the volume")
        else:
            command = player[action]
            _osascript(
                f'if application "Spotify" is running then\ntell application "Spotify" to {command}\n'
                f'else\ntell application "Music" to {command}\nend if',
                "Media control",
            )
    else:
        commands = {
            "volume_up": ["pactl", "set-sink-volume", "@DEFAULT_SINK@", "+10%"],
            "volume_down": ["pactl", "set-sink-volume", "@DEFAULT_SINK@", "-10%"],
            "mute": ["pactl", "set-sink-mute", "@DEFAULT_SINK@", "toggle"],
            "play_pause": ["playerctl", "play-pause"],
            "next_track": ["playerctl", "next"],
            "previous_track": ["playerctl", "previous"],
        }
        _run(commands[action], "Media control")


def _lock() -> None:
    system = current_os()
    if system == "windows":
        subprocess.run(["rundll32.exe", "user32.dll,LockWorkStation"], check=False)
    elif system == "mac":
        _run(["pmset", "displaysleepnow"], "Locking")  # locks when "require password after sleep" is on
    else:
        try:
            _run(["loginctl", "lock-session"], "Locking")
        except SystemControlError:
            _run(["xdg-screensaver", "lock"], "Locking")


def _screenshot() -> dict:
    out_dir = Path.home() / "Pictures" / "Jarvis Screenshots"
    out_dir.mkdir(parents=True, exist_ok=True)
    shot = out_dir / f"screenshot-{datetime.now():%Y%m%d-%H%M%S}.png"
    system = current_os()
    if system == "windows":
        _powershell(_SCREENSHOT_PS, env={"JARVIS_SHOT": str(shot)})
    elif system == "mac":
        _run(["screencapture", "-x", str(shot)], "Screenshot")
    else:
        tools = [  # Wayland first, then GNOME/KDE, then plain X11
            ["grim", str(shot)],
            ["gnome-screenshot", "-f", str(shot)],
            ["spectacle", "-b", "-n", "-o", str(shot)],
            ["scrot", str(shot)],
        ]
        args = next((t for t in tools if shutil.which(t[0])), None)
        if not args:
            raise SystemControlError("Screenshots need one of: grim, gnome-screenshot, spectacle or scrot.")
        _run(args, "Screenshot")
    return {"ok": True, "message": f"Screenshot saved to {shot}.", "path": str(shot)}


_POWER_COMMANDS = {
    "windows": {
        "shutdown": ["shutdown", "/s", "/t", "0"],
        "restart": ["shutdown", "/r", "/t", "0"],
        "sleep": ["rundll32.exe", "powrprof.dll,SetSuspendState", "0,1,0"],
    },
    "linux": {
        "shutdown": ["systemctl", "poweroff"],
        "restart": ["systemctl", "reboot"],
        "sleep": ["systemctl", "suspend"],
    },
    "mac": {
        "shutdown": ["osascript", "-e", 'tell application "System Events" to shut down'],
        "restart": ["osascript", "-e", 'tell application "System Events" to restart'],
        "sleep": ["pmset", "sleepnow"],
    },
}

_pending_power: threading.Timer | None = None
_power_lock = threading.Lock()


def _power(action: str) -> dict:
    global _pending_power
    with _power_lock:
        if action == "cancel_shutdown":
            if not _pending_power:
                return {"ok": True, "message": "Nothing was scheduled."}
            _pending_power.cancel()
            _pending_power = None
            return {"ok": True, "message": "Cancelled. The computer stays on."}

        command = _POWER_COMMANDS[current_os()][action]
        if action == "sleep":
            subprocess.run(command, check=False)
            return {"ok": True, "message": "Going to sleep."}

        if _pending_power:
            _pending_power.cancel()

        def fire():
            global _pending_power
            _pending_power = None
            subprocess.run(command, check=False)

        _pending_power = threading.Timer(POWER_DELAY_SECONDS, fire)
        _pending_power.daemon = True
        _pending_power.start()
    verb = "Shutting down" if action == "shutdown" else "Restarting"
    return {
        "ok": True,
        "message": f"{verb} in {POWER_DELAY_SECONDS} seconds. Save your work, or say 'cancel shutdown' to stop it.",
        "delay_seconds": POWER_DELAY_SECONDS,
    }


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
        if current_os() == "windows":
            os.startfile(target)  # opens in the default browser, which no pop-up blocker stops
        else:
            webbrowser.open(target)
        return {"ok": True, "message": f"Opened {target} in your browser."}

    if action == "open_app":
        _open_app(name.removesuffix(" app"), target or "")
        return {"ok": True, "message": f"Opened {target}."}

    if action == "close_app":
        _close_app(name.removesuffix(" app"), target or "")
        return {"ok": True, "message": f"Closed {target}."}

    if action == "open_folder":
        folder = FOLDERS.get(name.removesuffix(" folder"))
        if not folder:
            raise SystemControlError(f"I can open these folders: {', '.join(FOLDERS)}.")
        _open_path(str(folder))
        return {"ok": True, "message": f"Opened your {name.removesuffix(' folder')} folder."}

    if action in KEYS:
        _media(action)
        return {"ok": True, "message": action.replace("_", " ").capitalize() + " done."}

    if action == "lock":
        _lock()
        return {"ok": True, "message": "Locked the computer."}

    if action == "screenshot":
        return _screenshot()

    return _power(action)


# ---------- status ----------

_status_cache: tuple[float, dict] | None = None
STATUS_CACHE_SECONDS = 5  # several open tabs share one reading


def _status_psutil() -> dict:
    import psutil  # in-process and fast (milliseconds), unlike starting PowerShell (seconds)

    root = os.environ.get("SystemDrive", "C:") + "\\" if current_os() == "windows" else "/"
    disk = psutil.disk_usage(root)
    bat = psutil.sensors_battery()
    return {
        "os": current_os(),
        "cpu": round(psutil.cpu_percent(interval=0.3)),
        "ram": round(psutil.virtual_memory().percent),
        "disk": round(disk.percent),
        "disk_free_gb": round(disk.free / 1024**3, 1),
        "battery": round(bat.percent) if bat else None,
        "charging": bat.power_plugged if bat else None,
    }


def system_status() -> dict:
    """CPU, memory and disk use (percent), free disk space and battery level of this computer."""
    global _status_cache
    _check_enabled()
    if _status_cache and time.monotonic() - _status_cache[0] < STATUS_CACHE_SECONDS:
        return _status_cache[1]
    try:
        status = _status_psutil()
    except ImportError:
        if current_os() != "windows":
            raise SystemControlError("System status needs psutil: pip install psutil")
        status = {"os": "windows", **json.loads(_powershell(_STATUS_PS, timeout=30))}  # same numbers, slower
    _status_cache = (time.monotonic(), status)
    return status
