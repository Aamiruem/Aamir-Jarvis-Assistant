"""This-PC probes for Cyber Ops: CPU and memory, processes, disks, files, event logs.

Everything here only reads. The suspicious-file scan looks at names, types, where a file came from
(the Windows "Mark of the Web") and digital signatures; a file is only ever opened to read its first
bytes or to hash it. Defender scans run with -DisableRemediation, so nothing is quarantined or deleted.
"""
from __future__ import annotations

import hashlib
import os
import re
import time
from pathlib import Path

import psutil

HOME = Path.home()

# ---------- CPU, memory, processes ----------


def cpu_ram_sample(seconds: float = 1.0) -> dict:
    procs = []
    for p in psutil.process_iter(["pid", "name", "memory_info"]):
        try:
            p.cpu_percent(None)
            procs.append(p)
        except psutil.Error:
            pass
    per_cpu = psutil.cpu_percent(interval=seconds, percpu=True)
    ncpu = psutil.cpu_count() or 1
    rows = []
    for p in procs:
        try:
            cpu = p.cpu_percent(None) / ncpu
            mem = p.info["memory_info"].rss if p.info.get("memory_info") else 0
            name = p.info.get("name") or "?"
            if name.lower() in ("system idle process", "idle"):
                continue
            rows.append({"pid": p.pid, "name": name, "cpu": round(cpu, 1), "mem": mem})
        except psutil.Error:
            pass
    vm, sw = psutil.virtual_memory(), psutil.swap_memory()
    freq = psutil.cpu_freq()
    # group by program so 30 Chrome processes read as one Chrome
    grouped: dict[str, dict] = {}
    for r in rows:
        g = grouped.setdefault(r["name"], {"name": r["name"], "cpu": 0.0, "mem": 0, "count": 0})
        g["cpu"] += r["cpu"]
        g["mem"] += r["mem"]
        g["count"] += 1
    groups = list(grouped.values())
    return {
        "cpu_percent": round(sum(per_cpu) / len(per_cpu), 1), "per_cpu": per_cpu,
        "cores_logical": ncpu, "cores_physical": psutil.cpu_count(logical=False),
        "freq_mhz": round(freq.current) if freq else None,
        "ram_total": vm.total, "ram_used": vm.total - vm.available, "ram_percent": vm.percent,
        "swap_total": sw.total, "swap_percent": sw.percent,
        "process_count": len(rows),
        "top_cpu": sorted(groups, key=lambda g: g["cpu"], reverse=True)[:8],
        "top_mem": sorted(groups, key=lambda g: g["mem"], reverse=True)[:8],
        "uptime_hours": round((time.time() - psutil.boot_time()) / 3600, 1),
    }


def gb(n: float | None) -> str:
    return "?" if n is None else f"{n / 1024 ** 3:.1f} GB"


def volumes() -> list[dict]:
    out = []
    for part in psutil.disk_partitions(all=False):
        if "cdrom" in part.opts or not part.fstype:
            continue
        try:
            u = psutil.disk_usage(part.mountpoint)
        except OSError:
            continue
        out.append({"mount": part.mountpoint, "fs": part.fstype, "total": u.total, "free": u.free, "percent": u.percent})
    return out


def folder_size(path: Path, limit_files: int = 40000) -> tuple[int, int, bool]:
    """(bytes, files, complete) for a folder, stopping after limit_files."""
    total = n = 0
    for root, dirs, files in os.walk(path):
        for f in files:
            try:
                total += os.stat(os.path.join(root, f)).st_size
            except OSError:
                continue
            n += 1
            if n >= limit_files:
                return total, n, False
    return total, n, True


# ---------- Windows security extras ----------

SECURITY_EXTRA_PS = r"""
$ErrorActionPreference = 'SilentlyContinue'
$rdp = (Get-ItemProperty 'HKLM:\SYSTEM\CurrentControlSet\Control\Terminal Server').fDenyTSConnections
$smb1 = (Get-ItemProperty 'HKLM:\SYSTEM\CurrentControlSet\Services\LanmanServer\Parameters').SMB1
$smb1svc = (Get-Service mrxsmb10 -ErrorAction SilentlyContinue).Status
$secureBoot = (Get-ItemProperty 'HKLM:\SYSTEM\CurrentControlSet\Control\SecureBoot\State').UEFISecureBootEnabled
$bitlocker = (New-Object -ComObject Shell.Application).NameSpace('C:').Self.ExtendedProperty('System.Volume.BitLockerProtection')
$smartscreen = (Get-ItemProperty 'HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Explorer').SmartScreenEnabled
$guest = (Get-LocalUser -Name Guest -ErrorAction SilentlyContinue).Enabled
$admins = @(Get-LocalGroupMember -SID 'S-1-5-32-544' -ErrorAction SilentlyContinue | ForEach-Object { $_.Name })
$remoteReg = (Get-Service RemoteRegistry -ErrorAction SilentlyContinue).Status
$winrm = (Get-Service WinRM -ErrorAction SilentlyContinue).Status
$profiles = @(Get-NetConnectionProfile | ForEach-Object { @{ name = $_.Name; category = "$($_.NetworkCategory)"; alias = $_.InterfaceAlias } })
$threats = @(Get-MpThreatDetection | Sort-Object InitialDetectionTime -Descending | Select-Object -First 10 | ForEach-Object {
  $t = Get-MpThreat -ThreatID $_.ThreatID
  @{ name = $t.ThreatName; severity = $t.SeverityID; when = $_.InitialDetectionTime.ToString('yyyy-MM-dd HH:mm'); resources = @($_.Resources | Select-Object -First 2); action = $_.ThreatStatusID } })
[pscustomobject]@{ rdpEnabled = ($rdp -eq 0); smb1 = $smb1; smb1Client = "$smb1svc"; secureBoot = $secureBoot; bitlocker = $bitlocker; smartscreen = $smartscreen;
  guestEnabled = $guest; admins = $admins; remoteRegistry = "$remoteReg"; winrm = "$winrm"; profiles = $profiles; threats = $threats } | ConvertTo-Json -Depth 4 -Compress
"""


def interpret_security_extra(raw: dict) -> list[dict]:
    """Findings from SECURITY_EXTRA_PS (pure)."""
    f = []

    def add(sev, title, detail, fix=""):
        f.append({"severity": sev, "title": title, "detail": detail, "fix": fix})

    if raw.get("rdpEnabled"):
        add("medium", "Remote Desktop is on", "Other computers can try to sign in to this PC over the network.", "Settings → System → Remote Desktop → Off, unless you use it.")
    else:
        add("ok", "Remote Desktop is off", "Nobody can sign in to this PC remotely.")
    if raw.get("smb1") == 1 or (raw.get("smb1Client") or "").lower() == "running":
        add("high", "SMBv1 is enabled", "The 1980s file-sharing protocol used by WannaCry ransomware.", "Turn Windows features on or off → untick 'SMB 1.0/CIFS File Sharing Support'.")
    else:
        add("ok", "SMBv1 is off", "The outdated file-sharing protocol behind WannaCry is not running.")
    sb = raw.get("secureBoot")
    if sb == 1:
        add("ok", "Secure Boot is on", "Only signed software can start before Windows.")
    elif sb == 0:
        add("medium", "Secure Boot is off", "Boot-level malware (bootkits) is not blocked.", "Turn Secure Boot on in the PC's UEFI/BIOS settings.")
    bl = raw.get("bitlocker")
    if bl in (1, 3, 5):
        add("ok", "Drive encryption is on", "If the laptop is stolen, the files can't be read.")
    elif bl in (2, 4, 6):
        add("medium", "Drive C: is not encrypted", "A thief could read every file by removing the disk.", "Settings → Privacy & security → Device encryption (or BitLocker) → On.")
    if raw.get("smartscreen") and str(raw["smartscreen"]).lower() == "off":
        add("medium", "SmartScreen is off", "Downloaded apps are not checked against Microsoft's list of known malware.", "Windows Security → App & browser control → turn on reputation-based protection.")
    if raw.get("guestEnabled"):
        add("medium", "Guest account is enabled", "Anyone can use this PC without a password.", "Disable the Guest account.")
    admins = raw.get("admins") or []
    if len(admins) > 2:
        add("low", f"{len(admins)} administrator accounts", ", ".join(admins), "Keep admin rights to the accounts that need them; use a standard account day to day.")
    if (raw.get("remoteRegistry") or "").lower() == "running":
        add("medium", "Remote Registry service is running", "The registry can be read over the network.", "Services → Remote Registry → Stop and set to Disabled.")
    if (raw.get("winrm") or "").lower() == "running":
        add("low", "Windows Remote Management is running", "Remote PowerShell is available on this PC.", "Stop the WinRM service if you don't manage this PC remotely.")
    for p in raw.get("profiles") or []:
        if p.get("category") == "Private":
            add("info", f"'{p.get('name')}' is set as a Private network", "Your PC is discoverable and shares on this network: fine at home, risky on public Wi-Fi.", "On public or office Wi-Fi: Settings → Network → Wi-Fi → network properties → Public.")
    threats = raw.get("threats") or []
    if isinstance(threats, dict):
        threats = [threats]
    if threats:
        names = "; ".join(f"{t.get('name')} ({t.get('when')})" for t in threats[:5])
        add("high", f"Defender found {len(threats)} threat{'s' if len(threats) > 1 else ''} recently", names, "Windows Security → Virus & threat protection → Protection history: confirm each was removed.")
    else:
        add("ok", "No threats in Defender's history", "Microsoft Defender has no recorded detections.")
    return f


# ---------- suspicious files ----------

EXEC_EXT = {".exe", ".scr", ".com", ".pif", ".msi", ".bat", ".cmd", ".vbs", ".vbe", ".js", ".jse", ".wsf", ".wsh", ".hta", ".ps1", ".jar", ".lnk", ".cpl", ".dll", ".reg", ".iso", ".img", ".vhd"}
DOC_EXT = {".pdf", ".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx", ".jpg", ".jpeg", ".png", ".gif", ".txt", ".mp3", ".mp4", ".zip", ".rar"}
SCRIPT_EXT = {".ps1", ".bat", ".cmd", ".vbs", ".vbe", ".js", ".jse", ".wsf", ".hta"}
MACRO_EXT = {".docm", ".xlsm", ".pptm", ".xlam", ".dotm"}
SKIP_DIRS = {"node_modules", ".git", "__pycache__", ".venv", "venv", "site-packages", ".cache"}
RTLO = "\u202e"

SCRIPT_RED_FLAGS = [
    (r"-e(nc|ncodedcommand)?\s+[A-Za-z0-9+/=]{40,}", "runs a hidden base64-encoded PowerShell command"),
    (r"FromBase64String", "decodes hidden base64 data"),
    (r"(DownloadString|DownloadFile|Invoke-WebRequest|iwr |wget |curl |Net\.WebClient|Start-BitsTransfer|bitsadmin)", "downloads something from the internet"),
    (r"(Invoke-Expression|\biex\b)", "runs text as code (Invoke-Expression)"),
    (r"-w(indowstyle)?\s+hidden", "hides its window"),
    (r"(WScript\.Shell|Shell\.Application)", "starts other programs"),
    (r"certutil(\.exe)?\s+-(urlcache|decode)", "abuses certutil to download or decode files"),
    (r"(Set-MpPreference|Add-MpPreference).{0,40}(Disable|Exclusion)", "tries to switch off or bypass Defender"),
    (r"(schtasks|Register-ScheduledTask|CurrentVersion\\Run)", "makes itself start automatically"),
    (r"(vssadmin|wbadmin).{0,30}delete", "deletes backups or shadow copies (ransomware sign)"),
]


def zone_of(path: Path) -> dict | None:
    """The Mark of the Web: where Windows recorded that a downloaded file came from."""
    try:
        with open(str(path) + ":Zone.Identifier", encoding="utf-8", errors="replace") as fh:
            text = fh.read(2000)
    except OSError:
        return None
    zone = re.search(r"ZoneId=(\d)", text)
    host = re.search(r"HostUrl=(\S+)", text)
    ref = re.search(r"ReferrerUrl=(\S+)", text)
    return {"zone": int(zone.group(1)) if zone else None, "url": host.group(1)[:200] if host else None, "referrer": ref.group(1)[:200] if ref else None}


def name_flags(name: str) -> list[tuple[str, str]]:
    """(severity, reason) for a file name alone (pure)."""
    out = []
    low = name.lower()
    if RTLO in name:
        out.append(("high", "hides its real extension with a right-to-left character"))
    parts = low.split(".")
    if len(parts) >= 3 and f".{parts[-1]}" in EXEC_EXT and f".{parts[-2]}" in DOC_EXT:
        out.append(("high", f"double extension: looks like a .{parts[-2]} but is a .{parts[-1]} program"))
    if re.search(r"\s{5,}\.\w+$", name):
        out.append(("medium", "many spaces before the extension, to hide it"))
    if Path(low).suffix in MACRO_EXT:
        out.append(("low", "Office file with macros"))
    return out


def scan_targets() -> list[tuple[Path, int, str]]:
    appdata = Path(os.environ.get("APPDATA", HOME / "AppData/Roaming"))
    programdata = Path(os.environ.get("PROGRAMDATA", "C:/ProgramData"))
    temp = Path(os.environ.get("TEMP", HOME / "AppData/Local/Temp"))
    return [
        (HOME / "Downloads", 3, "Downloads"), (HOME / "Desktop", 2, "Desktop"), (HOME / "Documents", 1, "Documents"),
        (appdata / "Microsoft/Windows/Start Menu/Programs/Startup", 1, "Startup (you)"),
        (programdata / "Microsoft/Windows/Start Menu/Programs/StartUp", 1, "Startup (all users)"),
        (temp, 1, "Temp"),
    ]


def walk_candidates(root: Path, depth: int, limit: int = 20000):
    root_depth = len(root.parts)
    seen = 0
    for dirpath, dirs, files in os.walk(root):
        dirs[:] = [d for d in dirs if d not in SKIP_DIRS and not d.startswith(".")]
        if len(Path(dirpath).parts) - root_depth >= depth:
            dirs[:] = []
        for f in files:
            seen += 1
            if seen > limit:
                return
            yield Path(dirpath) / f


def magic_type(head: bytes) -> str | None:
    sigs = [
        (b"MZ", "Windows program (PE)"), (b"%PDF", "PDF document"), (b"PK\x03\x04", "ZIP container (zip/docx/xlsx/jar/apk)"),
        (b"\x7fELF", "Linux program (ELF)"), (b"\xd0\xcf\x11\xe0", "old Office document (may hold macros)"),
        (b"Rar!", "RAR archive"), (b"7z\xbc\xaf", "7-Zip archive"), (b"\x89PNG", "PNG image"), (b"\xff\xd8\xff", "JPEG image"),
        (b"GIF8", "GIF image"), (b"#!", "script"), (b"{\\rtf", "RTF document"), (b"ID3", "MP3 audio"),
    ]
    for sig, label in sigs:
        if head.startswith(sig):
            return label
    if head[4:8] == b"ftyp":
        return "MP4/MOV video"
    return None


EXT_FAMILY = {
    "Windows program (PE)": {".exe", ".dll", ".scr", ".com", ".cpl", ".sys", ".msi", ".ocx", ".efi", ".mui"},
    "PDF document": {".pdf"},
    "ZIP container (zip/docx/xlsx/jar/apk)": {".zip", ".docx", ".xlsx", ".pptx", ".jar", ".apk", ".odt", ".epub", ".docm", ".xlsm", ".pptm", ".nupkg", ".whl", ".vsix", ".appx", ".msix", ".crx"},
    "PNG image": {".png"}, "JPEG image": {".jpg", ".jpeg", ".jfif"}, "GIF image": {".gif"},
    "old Office document (may hold macros)": {".doc", ".xls", ".ppt", ".msi", ".msg", ".dot", ".xlt"},
    "RAR archive": {".rar"}, "7-Zip archive": {".7z"}, "MP4/MOV video": {".mp4", ".mov", ".m4a", ".m4v", ".3gp", ".heic"},
    "RTF document": {".rtf", ".doc"}, "MP3 audio": {".mp3"},
}


def type_mismatch(path: Path, head: bytes) -> tuple[str, str] | None:
    kind = magic_type(head)
    ext = path.suffix.lower()
    if not kind or kind not in EXT_FAMILY or not ext:
        return None
    if ext in EXT_FAMILY[kind]:
        return None
    sev = "high" if kind == "Windows program (PE)" else "medium"
    return sev, f"named {ext} but is really a {kind}"


def script_flags(path: Path, max_bytes: int = 2_000_000) -> list[str]:
    try:
        if path.stat().st_size > max_bytes:
            return []
        text = path.read_text(encoding="utf-8", errors="replace")
    except OSError:
        return []
    return [why for rx, why in SCRIPT_RED_FLAGS if re.search(rx, text, re.I)]


def sha256(path: Path, limit: int = 512 * 1024 * 1024) -> str | None:
    h = hashlib.sha256()
    try:
        with open(path, "rb") as fh:
            read = 0
            while chunk := fh.read(1 << 20):
                h.update(chunk)
                read += len(chunk)
                if read > limit:
                    return None
    except OSError:
        return None
    return h.hexdigest()


def signature_ps(paths: list[str]) -> str:
    quoted = ",".join("'" + p.replace("'", "''") + "'" for p in paths)
    return (
        "$ErrorActionPreference='SilentlyContinue'; @(" + quoted + ") | ForEach-Object { $s = Get-AuthenticodeSignature -LiteralPath $_; "
        "@{ path = $_; status = \"$($s.Status)\"; signer = if ($s.SignerCertificate) { $s.SignerCertificate.GetNameInfo('SimpleName', $false) } else { $null } } } | ConvertTo-Json -Compress"
    )


DEFENDER = Path(os.environ.get("ProgramFiles", "C:/Program Files")) / "Windows Defender/MpCmdRun.exe"


# ---------- emergency: event logs ----------

EVENTS_PS = r"""
$ErrorActionPreference = 'SilentlyContinue'
$since = (Get-Date).AddHours(-48)
$sys = @(Get-WinEvent -FilterHashtable @{ LogName = 'System'; Level = 1,2; StartTime = $since } -MaxEvents 200)
$app = @(Get-WinEvent -FilterHashtable @{ LogName = 'Application'; Id = 1000,1002; StartTime = $since } -MaxEvents 100)
$power = @(Get-WinEvent -FilterHashtable @{ LogName = 'System'; Id = 41,6008,1001; StartTime = (Get-Date).AddDays(-14) } -MaxEvents 20)
[pscustomobject]@{
  systemErrors = @($sys | Group-Object ProviderName | Sort-Object Count -Descending | Select-Object -First 8 | ForEach-Object { @{ source = $_.Name; count = $_.Count; last = $_.Group[0].TimeCreated.ToString('yyyy-MM-dd HH:mm'); message = ("$($_.Group[0].Message)" -split "`n")[0].Trim() } })
  appCrashes = @($app | ForEach-Object { if ($_.Properties.Count -gt 0) { "$($_.Properties[0].Value)" } } | Group-Object | Sort-Object Count -Descending | Select-Object -First 8 | ForEach-Object { @{ app = $_.Name; count = $_.Count } })
  powerEvents = @($power | ForEach-Object { @{ id = $_.Id; when = $_.TimeCreated.ToString('yyyy-MM-dd HH:mm') } })
} | ConvertTo-Json -Depth 4 -Compress
"""
