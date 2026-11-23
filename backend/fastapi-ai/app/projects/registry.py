"""The user's projects (data_dir/projects.json) and their last check results (project_status.json).

Seeded on first use with the projects this repo already links to (frontend/src/siteLinks.js):
the three Azarvis apps, the local AI service, the portfolio and the other live apps. The user can
add, edit and remove projects from the Project HQ tab; nothing here touches the projects themselves.
"""
from __future__ import annotations

import json
import re
import subprocess
import threading
import time
from pathlib import Path

from app.config import settings

FILE = settings.data_dir / "projects.json"
STATUS_FILE = settings.data_dir / "project_status.json"
REPO_ROOT = Path(__file__).resolve().parents[4]  # .../Aamir-Jarvis-Assistant
_lock = threading.Lock()

GH = "Aamiruem"
SEED = [
    {"id": "azarvis-app", "name": "Azarvis Voice App", "description": "React voice assistant + public website", "kind": "web", "platform": "vercel",
     "url": "https://azarvis-app.vercel.app/", "repo": f"{GH}/Aamir-Jarvis-Assistant", "local_path": "frontend", "stack": "React · Vite"},
    {"id": "azarvis-ai", "name": "Azarvis Dashboard", "description": "Next.js dashboard and landing page", "kind": "web", "platform": "vercel",
     "url": "https://azarvis-ai.vercel.app/", "repo": f"{GH}/Aamir-Jarvis-Assistant", "local_path": "dashboard", "stack": "Next.js · TypeScript"},
    {"id": "azarvis-api", "name": "Azarvis API", "description": "Express API (serverless on Vercel)", "kind": "api", "platform": "vercel",
     "url": "https://azarvis-api.vercel.app/api/health", "health_url": "https://azarvis-api.vercel.app/api/health", "repo": f"{GH}/Aamir-Jarvis-Assistant",
     "local_path": "backend/express-api", "stack": "Node · Express · MongoDB"},
    {"id": "azarvis-ai-service", "name": "Azarvis AI service", "description": "FastAPI brain (runs on this PC)", "kind": "api", "platform": "local",
     "url": "http://127.0.0.1:8001/health", "health_url": "http://127.0.0.1:8001/health", "repo": f"{GH}/Aamir-Jarvis-Assistant",
     "local_path": "backend/fastapi-ai", "stack": "Python · FastAPI"},
    {"id": "portfolio", "name": "Portfolio", "description": "Aamir Hussain Azad", "kind": "web", "platform": "vercel",
     "url": "https://aamir-hussain-azad.vercel.app/", "repo": f"{GH}/Aamir_Portfolio"},
    {"id": "arvixa", "name": "Arvixa Store", "description": "Online marketplace", "kind": "web", "platform": "vercel",
     "url": "https://arvixa-store.vercel.app/", "repo": f"{GH}/Shopping-Cart"},
    {"id": "presence-ai", "name": "Presence AI", "description": "AI focus tracker & interview coach", "kind": "web", "platform": "vercel",
     "url": "https://real-time-conversession-and-distrac.vercel.app/xky-fqlf-bao", "repo": f"{GH}/Real-Time-Conversession-and-Distraction-Face"},
    {"id": "gratia", "name": "Gratia Estates", "description": "Real estate & price prediction", "kind": "web", "platform": "vercel",
     "url": "https://gratia-estates.vercel.app/", "repo": f"{GH}/Gratia-Estates-Website"},
    {"id": "crop-yield", "name": "Crop Yield Prediction", "description": "ML for Indian farmers", "kind": "web", "platform": "streamlit",
     "url": "https://indian-crop-optimization-appuction-kqfhgqkn6wfg6qeb44efik.streamlit.app/", "repo": f"{GH}/Indian-Crop-Optimization-Production"},
    {"id": "retail-analytics", "name": "Retail Sales Analytics", "description": "Sales & customer analytics", "kind": "web", "platform": "streamlit",
     "url": "https://retail-sales-customer-fdug7zphhdjmvfoonctdkw.streamlit.app/", "repo": f"{GH}/Retail-sales-customer"},
    {"id": "mansik", "name": "Mansik Santulan", "description": "Mental-balance ML scores", "kind": "web", "platform": "render",
     "url": "https://mansik-santulan-scores-1.onrender.com", "repo": f"{GH}/Mansik-Santulan-Scores"},
]
FIELDS = ("name", "description", "kind", "platform", "url", "health_url", "repo", "local_path", "stack")


def _read(path: Path, default):
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except (OSError, ValueError):
        return default


def _write(path: Path, data) -> None:
    """Atomic write. Windows refuses to replace a file another reader (or antivirus) holds open for a
    moment, so retry briefly instead of failing the request."""
    tmp = path.with_suffix(".tmp")
    tmp.write_text(json.dumps(data, indent=1), encoding="utf-8")
    for attempt in range(20):
        try:
            tmp.replace(path)
            return
        except PermissionError:
            if attempt == 19:
                raise
            time.sleep(0.05)


def projects() -> list[dict]:
    with _lock:
        data = _read(FILE, None)
        if data is None:
            data = [dict(p) for p in SEED]
            _write(FILE, data)
        return data


def get(pid: str) -> dict | None:
    return next((p for p in projects() if p["id"] == pid), None)


def slug(name: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")[:40] or "project"


def upsert(fields: dict, pid: str | None = None) -> dict:
    with _lock:
        data = _read(FILE, None) or [dict(p) for p in SEED]
        if pid:
            p = next((x for x in data if x["id"] == pid), None)
            if not p:
                raise KeyError(pid)
            p.update({k: v for k, v in fields.items() if k in FIELDS})
        else:
            base = slug(fields.get("name", ""))
            new_id, n = base, 2
            while any(x["id"] == new_id for x in data):
                new_id, n = f"{base}-{n}", n + 1
            p = {"id": new_id, **{k: v for k, v in fields.items() if k in FIELDS}}
            data.append(p)
        _write(FILE, data)
        return p


def remove(pid: str) -> bool:
    with _lock:
        data = _read(FILE, None) or []
        keep = [p for p in data if p["id"] != pid]
        _write(FILE, keep)
        st = _read(STATUS_FILE, {})
        st.pop(pid, None)
        _write(STATUS_FILE, st)
        return len(keep) != len(data)


def statuses() -> dict:
    with _lock:
        return _read(STATUS_FILE, {})


def save_status(pid: str, part: str, result: dict) -> dict:
    with _lock:
        st = _read(STATUS_FILE, {})
        entry = st.setdefault(pid, {})
        entry[part] = {**result, "checked_at": time.time()}
        _write(STATUS_FILE, st)
        return entry


# ---------- local repositories ----------

def local_dir(p: dict) -> Path | None:
    """The project's folder on this PC, only inside this repository (never an arbitrary path)."""
    rel = (p.get("local_path") or "").strip().strip("/\\")
    if not rel:
        return None
    d = (REPO_ROOT / rel).resolve()
    if REPO_ROOT not in d.parents and d != REPO_ROOT:
        return None
    return d if d.is_dir() else None


def git_info(d: Path) -> dict:
    def git(*args):
        r = subprocess.run(["git", "-C", str(d), *args], capture_output=True, text=True, timeout=20, encoding="utf-8", errors="replace",
                           creationflags=getattr(subprocess, "CREATE_NO_WINDOW", 0))
        return r.stdout.strip() if r.returncode == 0 else ""
    last = git("log", "-1", "--format=%h|%cI|%s", "--", ".")
    h, when, msg = (last.split("|", 2) + ["", "", ""])[:3]
    changed = [l for l in git("status", "--porcelain", "--", ".").splitlines() if l.strip()]
    return {"branch": git("rev-parse", "--abbrev-ref", "HEAD"), "last_commit": h, "last_commit_at": when, "last_message": msg[:140],
            "uncommitted": len(changed), "uncommitted_files": [l[3:] for l in changed[:12]]}


def test_commands(d: Path) -> list[tuple[str, list[str]]]:
    """The project's own test (and build) commands, read from its files; nothing invented."""
    cmds: list[tuple[str, list[str]]] = []
    pkg = _read(d / "package.json", None)
    if isinstance(pkg, dict):
        scripts = pkg.get("scripts") or {}
        for name in ("lint", "typecheck", "test", "build"):
            if name in scripts:
                cmds.append((f"npm run {name}", ["npm", "run", name]))
    venv_py = d / ".venv" / ("Scripts/python.exe" if (d / ".venv" / "Scripts").exists() else "bin/python")
    if (d / "tests").is_dir() and ((d / "pytest.ini").exists() or (d / "pyproject.toml").exists() or (d / "requirements.txt").exists()):
        cmds.append(("pytest -q", [str(venv_py) if venv_py.exists() else "python", "-m", "pytest", "-q"]))
    return cmds
