"""Security Center: a read-only health check of THIS Windows PC.

GET /security/pc-check -> {"supported", "reason"?, "checks": [{id, label, status, detail, fix}]}
status: "ok" | "warn" | "bad" | "unknown".

One fixed PowerShell script, no input from the request, nothing changed on the PC:
Microsoft Defender (service, real-time protection, signature age), Windows Firewall profiles,
User Account Control, and the most recent Windows update. Only where Azarvis runs on the user's
own computer (SYSTEM_CONTROL on, Windows); a cloud server has no "this PC" to check.
"""
from __future__ import annotations

import asyncio
import json
import subprocess
from datetime import datetime, timezone

from fastapi import APIRouter

from app.config import settings
from app.system_control import current_os

router = APIRouter(prefix="/security", tags=["security"])

# Fast sources only (Get-NetFirewallProfile and Get-HotFix take 7-20 s on a busy PC): the firewall
# switches and UAC from the registry (group policy wins over the local setting, as in Windows),
# the last successful update from the Windows Update agent.
SCRIPT = r"""
$ErrorActionPreference = 'SilentlyContinue'
$mp = Get-MpComputerStatus
$base = 'HKLM:\SYSTEM\CurrentControlSet\Services\SharedAccess\Parameters\FirewallPolicy'
$gpo = 'HKLM:\SOFTWARE\Policies\Microsoft\WindowsFirewall'
$fw = @(foreach ($p in @(@('Domain','DomainProfile'), @('Private','StandardProfile'), @('Public','PublicProfile'))) {
  $v = (Get-ItemProperty "$gpo\$($p[1])").EnableFirewall
  if ($null -eq $v) { $v = (Get-ItemProperty "$base\$($p[1])").EnableFirewall }
  if ($null -ne $v) { @{ name = $p[0]; enabled = ([int]$v -eq 1) } }
})
$lua = (Get-ItemProperty 'HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Policies\System').EnableLUA
$wu = (New-Object -ComObject Microsoft.Update.AutoUpdate).Results.LastInstallationSuccessDate
[pscustomobject]@{
  defender = if ($mp) { @{ service = [bool]$mp.AMServiceEnabled; antivirus = [bool]$mp.AntivirusEnabled; realtime = [bool]$mp.RealTimeProtectionEnabled; signatureAgeDays = [int]$mp.AntivirusSignatureAge } } else { $null }
  firewall = $fw
  uac = if ($null -ne $lua) { [int]$lua } else { $null }
  lastUpdate = if ($wu -and $wu.Year -gt 2000) { $wu.ToString('yyyy-MM-dd') } else { $null }
} | ConvertTo-Json -Depth 4 -Compress
"""
TIMEOUT = 45  # Defender alone can take several seconds on a busy PC


def _run_script() -> dict:
    out = subprocess.run(
        ["powershell", "-NoProfile", "-NonInteractive", "-ExecutionPolicy", "Bypass", "-Command", SCRIPT],
        capture_output=True, text=True, timeout=TIMEOUT, creationflags=getattr(subprocess, "CREATE_NO_WINDOW", 0),
    )
    return json.loads(out.stdout.strip() or "{}")


def _check(id_: str, label: str, status: str, detail: str, fix: str = "") -> dict:
    return {"id": id_, "label": label, "status": status, "detail": detail, "fix": fix}


def interpret(raw: dict, today: datetime | None = None) -> list[dict]:
    """Turn the script's raw readings into checks with plain-language advice."""
    today = today or datetime.now(timezone.utc)
    checks = []

    d = raw.get("defender")
    if not d:
        checks.append(_check("antivirus", "Antivirus", "unknown", "Microsoft Defender's status could not be read (another antivirus may be installed).", "Open Windows Security → Virus & threat protection to confirm you are protected."))
    elif not (d.get("service") and d.get("antivirus")):
        checks.append(_check("antivirus", "Antivirus", "bad", "Microsoft Defender antivirus is off.", "Windows Security → Virus & threat protection → turn it on, unless another antivirus is active."))
    elif not d.get("realtime"):
        checks.append(_check("antivirus", "Antivirus", "bad", "Real-time protection is off: new threats are not blocked as they arrive.", "Windows Security → Virus & threat protection → Manage settings → Real-time protection: On."))
    else:
        age = d.get("signatureAgeDays")
        if isinstance(age, int) and age > 7:
            checks.append(_check("antivirus", "Antivirus", "warn", f"Defender is on, but its threat definitions are {age} days old.", "Windows Security → Virus & threat protection → Protection updates → Check for updates."))
        else:
            checks.append(_check("antivirus", "Antivirus", "ok", "Microsoft Defender with real-time protection is on and up to date."))

    profiles = raw.get("firewall") or []
    if isinstance(profiles, dict):  # one profile comes back as an object, not a list
        profiles = [profiles]
    off = [p.get("name", "?") for p in profiles if not p.get("enabled")]
    if not profiles:
        checks.append(_check("firewall", "Firewall", "unknown", "The firewall status could not be read.", "Windows Security → Firewall & network protection."))
    elif off:
        checks.append(_check("firewall", "Firewall", "bad", f"Windows Firewall is off for: {', '.join(off)}.", "Windows Security → Firewall & network protection → turn it on for every network type."))
    else:
        checks.append(_check("firewall", "Firewall", "ok", "Windows Firewall is on for every network type."))

    uac = raw.get("uac")
    if uac is None:
        checks.append(_check("uac", "User Account Control", "unknown", "Could not read the User Account Control setting."))
    elif uac == 0:
        checks.append(_check("uac", "User Account Control", "bad", "User Account Control is off: apps can change the system without asking.", "Search “Change User Account Control settings” and raise the slider, then restart."))
    else:
        checks.append(_check("uac", "User Account Control", "ok", "Apps must ask before making system changes."))

    last = raw.get("lastUpdate")
    try:
        days = (today.date() - datetime.strptime(last, "%Y-%m-%d").date()).days if last else None
    except (TypeError, ValueError):
        days = None
    if days is None:
        checks.append(_check("updates", "Windows Update", "unknown", "The date of the last update could not be read.", "Settings → Windows Update → Check for updates."))
    elif days > 45:
        checks.append(_check("updates", "Windows Update", "warn", f"The last update was installed {days} days ago ({last}).", "Settings → Windows Update → Check for updates, then restart."))
    else:
        when = "today" if days == 0 else "yesterday" if days == 1 else f"{days} days ago"
        checks.append(_check("updates", "Windows Update", "ok", f"Last update installed {when} ({last})."))
    return checks


@router.get("/pc-check")
async def pc_check():
    if not settings.system_control:
        return {"supported": False, "reason": "This Azarvis runs on a server, not on your computer, so there is no PC to check.", "checks": []}
    if current_os() != "windows":
        return {"supported": False, "reason": "The PC security check supports Windows for now.", "checks": []}
    try:
        raw = await asyncio.to_thread(_run_script)
    except (subprocess.TimeoutExpired, json.JSONDecodeError, OSError) as e:
        return {"supported": True, "reason": f"Windows did not answer the check ({type(e).__name__}).", "checks": []}
    return {"supported": True, "checked_at": datetime.now(timezone.utc).isoformat(timespec="seconds"), "checks": interpret(raw)}
