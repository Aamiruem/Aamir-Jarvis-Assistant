"""Training runs in one background worker; the app polls GET /mllab/jobs/{id} for progress.

One worker on purpose: training already uses every CPU core (random forest, XGBoost), so two
runs at once would only make both slower. Jobs live in memory; a restart forgets them, while the
trained models themselves are saved to disk.
"""
import logging
import threading
import time
from collections.abc import Callable
from concurrent.futures import ThreadPoolExecutor

from app.mllab.registry import BUILTIN, new_id

log = logging.getLogger("jarvis.mllab")
_pool = ThreadPoolExecutor(max_workers=1, thread_name_prefix="mllab")
_jobs: dict[str, dict] = {}
_lock = threading.Lock()
KEEP = 100


def _public(job: dict) -> dict:
    return {k: v for k, v in job.items() if k != "user_id"}


def start(user_id: str, kind: str, fn: Callable[[Callable[[str, int], None]], dict]) -> dict:
    """Queues fn(progress) and returns the job. fn's return value becomes job["result"]."""
    job = {"id": new_id(), "user_id": user_id, "kind": kind, "status": "queued", "progress": 0,
           "message": "Waiting to start", "result": None, "error": None, "started_at": time.time()}
    with _lock:
        _jobs[job["id"]] = job
        for old in list(_jobs)[:-KEEP]:
            _jobs.pop(old, None)
    _pool.submit(_run, job, fn)
    return _public(job)


def _run(job: dict, fn) -> None:
    def progress(message: str, pct: int) -> None:
        job.update(message=message, progress=max(job["progress"], min(int(pct), 99)))

    job["status"] = "running"
    try:
        job["result"] = fn(progress)
        job.update(status="done", progress=100, message="Done")
    except Exception as e:  # shown to the user, who can fix the data and try again
        log.exception("ML Lab job %s failed", job["id"])
        job.update(status="failed", error=str(e)[:500], message="Failed")


def get(user_id: str, job_id: str) -> dict | None:
    job = _jobs.get(job_id)
    if not job or job["user_id"] not in (user_id, BUILTIN):
        return None
    return _public(job)


def running(kind: str) -> dict | None:
    for job in _jobs.values():
        if job["kind"] == kind and job["status"] in ("queued", "running"):
            return _public(job)
    return None


def wait(job_id: str, timeout: float = 600) -> dict:
    """Blocks until a job finishes (tests and scripts)."""
    deadline = time.time() + timeout
    while time.time() < deadline:
        job = _jobs[job_id]
        if job["status"] in ("done", "failed"):
            return _public(job)
        time.sleep(0.1)
    raise TimeoutError(job_id)
