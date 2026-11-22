"""Background jobs for Cyber Ops quick actions: live steps, cancel, history.

A job runs one action (app/ops/actions.py) in a worker thread. The action reports progress through
its JobContext: ``with ctx.step("Reading the ARP table"):`` marks a step running, then done or failed,
so the page can show what is happening right now. Cancel is cooperative: ``ctx.check()`` raises between
steps, and any PowerShell or other child process started through ``ctx.run`` is killed at once.

Finished jobs are kept (newest 60 per user) in data_dir/ops_history.json, so the history and reports
survive a restart. Every failure is logged with its job id.
"""
from __future__ import annotations

import contextlib
import json
import logging
import os
import subprocess
import tempfile
import threading
import time
import traceback
import uuid
from contextlib import contextmanager
from dataclasses import dataclass, field

from app.config import settings

log = logging.getLogger("jarvis.ops")

HISTORY_FILE = settings.data_dir / "ops_history.json"
KEEP = 60
MAX_RUNNING = 4  # per user: quick actions are light, but a PC has only so many cores
ACTIVE = ("queued", "running")


class Cancelled(Exception):
    pass


def _now() -> float:
    return round(time.time(), 3)


@dataclass
class Job:
    id: str
    user_id: str
    action: str
    title: str
    params: dict
    status: str = "queued"  # queued | running | done | failed | cancelled
    steps: list = field(default_factory=list)
    created_at: float = field(default_factory=_now)
    started_at: float | None = None
    finished_at: float | None = None
    result: dict | None = None
    error: str | None = None
    cancel_flag: threading.Event = field(default_factory=threading.Event, repr=False)
    finished: threading.Event = field(default_factory=threading.Event, repr=False)  # set once saved
    procs: list = field(default_factory=list, repr=False)

    def to_dict(self, full: bool = True) -> dict:
        d = {
            "id": self.id, "action": self.action, "title": self.title, "params": self.params, "status": self.status,
            "steps": self.steps, "created_at": self.created_at, "started_at": self.started_at,
            "finished_at": self.finished_at, "error": self.error,
        }
        if full:
            d["result"] = self.result
        else:
            d["summary"] = (self.result or {}).get("summary")
            d["score"] = (self.result or {}).get("score")
        return d


class JobContext:
    """What an action sees: steps, cancel checks, and child processes that can be killed."""

    def __init__(self, job: Job):
        self.job = job

    def check(self):
        if self.job.cancel_flag.is_set():
            raise Cancelled()

    @property
    def cancelled(self) -> bool:
        return self.job.cancel_flag.is_set()

    @contextmanager
    def step(self, label: str):
        self.check()
        step = {"label": label, "status": "running", "detail": "", "started_at": _now(), "ms": None}
        self.job.steps.append(step)
        try:
            yield step
        except Cancelled:
            step["status"] = "cancelled"
            raise
        except Exception as e:
            step["status"] = "failed"
            step["detail"] = step["detail"] or f"{type(e).__name__}: {str(e)[:200]}"
            raise
        else:
            if step["status"] == "running":
                step["status"] = "done"
        finally:
            step["ms"] = int((time.time() - step["started_at"]) * 1000)

    def soft_step(self, label: str, fn, *args, **kwargs):
        """Run fn as a step; a failure is recorded on the step and returns None instead of ending the job."""
        try:
            with self.step(label) as s:
                return fn(*args, **kwargs)
        except Cancelled:
            raise
        except Exception as e:
            log.warning("ops job %s step %r failed: %s", self.job.id, label, e)
            return None

    def run(self, args: list[str], timeout: float = 60, input_text: str | None = None) -> subprocess.CompletedProcess:
        """Run a child process that Cancel can kill. Text output, no console window."""
        self.check()
        proc = subprocess.Popen(
            args, stdin=subprocess.PIPE if input_text is not None else subprocess.DEVNULL,
            stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, encoding="utf-8", errors="replace",
            creationflags=getattr(subprocess, "CREATE_NO_WINDOW", 0),
        )
        self.job.procs.append(proc)
        try:
            out, err = proc.communicate(input=input_text, timeout=timeout)
        except subprocess.TimeoutExpired:
            proc.kill()
            proc.communicate()
            raise TimeoutError(f"{args[0]} did not finish within {int(timeout)} s")
        finally:
            if proc in self.job.procs:
                self.job.procs.remove(proc)
        self.check()  # killed by Cancel: stop here rather than parse half an answer
        return subprocess.CompletedProcess(args, proc.returncode, out, err)

    def powershell(self, script: str, timeout: float = 60) -> str:
        # A temporary .ps1 file: `-Command -` (stdin) runs line by line and breaks multi-line
        # statements, and a long script doesn't fit on a command line. UTF-8 with BOM so Windows
        # PowerShell 5.1 reads non-ASCII file paths correctly.
        fd, path = tempfile.mkstemp(suffix=".ps1", prefix="azarvis-ops-")
        try:
            with os.fdopen(fd, "w", encoding="utf-8-sig") as fh:
                fh.write(script)
            args = ["powershell", "-NoProfile", "-NonInteractive", "-ExecutionPolicy", "Bypass", "-File", path]
            return self.run(args, timeout=timeout).stdout
        finally:
            with contextlib.suppress(OSError):
                os.remove(path)

    def powershell_json(self, script: str, timeout: float = 60):
        return parse_json_tail(self.powershell(script, timeout))


def parse_json_tail(out: str):
    """The JSON a script printed, skipping any warning lines before it (None when there is none)."""
    starts = [i for i in (out.find("{"), out.find("[")) if i >= 0]
    return json.loads(out[min(starts):]) if starts else None


class JobRunner:
    def __init__(self):
        self._jobs: dict[str, Job] = {}
        self._lock = threading.Lock()
        self._load()

    # ----- history -----
    def _load(self):
        try:
            for d in json.loads(HISTORY_FILE.read_text(encoding="utf-8")):
                job = Job(id=d["id"], user_id=d["user_id"], action=d["action"], title=d["title"], params=d.get("params") or {})
                for k in ("status", "steps", "created_at", "started_at", "finished_at", "result", "error"):
                    setattr(job, k, d.get(k))
                job.finished.set()
                self._jobs[job.id] = job
        except FileNotFoundError:
            pass
        except Exception as e:  # a damaged history file must not stop the service
            log.warning("ops history unreadable, starting empty: %s", e)

    def _save(self):
        with self._lock:
            done = sorted((j for j in self._jobs.values() if j.status not in ACTIVE), key=lambda j: j.created_at, reverse=True)
            per_user: dict[str, int] = {}
            keep = []
            for j in done:
                per_user[j.user_id] = per_user.get(j.user_id, 0) + 1
                if per_user[j.user_id] <= KEEP:
                    keep.append({**j.to_dict(), "user_id": j.user_id})
                else:
                    self._jobs.pop(j.id, None)
        try:
            tmp = HISTORY_FILE.with_suffix(".tmp")
            tmp.write_text(json.dumps(keep, default=str), encoding="utf-8")
            tmp.replace(HISTORY_FILE)
        except OSError as e:
            log.warning("could not save ops history: %s", e)

    # ----- jobs -----
    def list(self, user_id: str) -> list[Job]:
        return sorted((j for j in self._jobs.values() if j.user_id == user_id), key=lambda j: j.created_at, reverse=True)

    def get(self, user_id: str, job_id: str) -> Job | None:
        j = self._jobs.get(job_id)
        return j if j and j.user_id == user_id else None

    def running(self, user_id: str) -> list[Job]:
        return [j for j in self.list(user_id) if j.status in ACTIVE]

    def start(self, user_id: str, action: str, title: str, params: dict, fn) -> Job:
        job = Job(id=uuid.uuid4().hex[:12], user_id=user_id, action=action, title=title, params=params)
        with self._lock:
            self._jobs[job.id] = job
        threading.Thread(target=self._work, args=(job, fn), name=f"ops-{action}-{job.id}", daemon=True).start()
        return job

    def run_sync(self, user_id: str, action: str, title: str, params: dict, fn, timeout: float = 120) -> Job:
        """Start a job and wait for it (the chat agent's tool uses this)."""
        job = self.start(user_id, action, title, params, fn)
        if not job.finished.wait(timeout):
            self.cancel(job)
            job.finished.wait(10)
            job.error = f"Stopped after {int(timeout)} s."
        return job

    def _work(self, job: Job, fn):
        job.status = "running"
        job.started_at = _now()
        ctx = JobContext(job)
        try:
            job.result = fn(ctx, job.params)
            job.status = "cancelled" if job.cancel_flag.is_set() else "done"
        except Cancelled:
            job.status = "cancelled"
        except Exception as e:
            job.status = "failed"
            job.error = f"{type(e).__name__}: {str(e)[:300]}"
            log.error("ops job %s (%s) failed: %s\n%s", job.id, job.action, e, traceback.format_exc())
        finally:
            for s in job.steps:
                if s["status"] == "running":
                    s["status"] = "cancelled" if job.status == "cancelled" else "failed"
            job.finished_at = _now()
            log.info("ops job %s %s %s in %.1fs", job.id, job.action, job.status, job.finished_at - job.started_at)
            self._save()
            job.finished.set()

    def cancel(self, job: Job) -> bool:
        if job.status not in ACTIVE:
            return False
        job.cancel_flag.set()
        for p in list(job.procs):
            try:
                p.kill()
            except OSError:
                pass
        return True

    def stop_all(self, user_id: str) -> int:
        return sum(self.cancel(j) for j in self.running(user_id))


runner = JobRunner()
