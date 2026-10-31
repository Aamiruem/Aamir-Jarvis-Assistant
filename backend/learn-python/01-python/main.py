"""01 · Python — the language features every later lesson relies on.

Run:  python 01-python/main.py
"""
import asyncio
import functools
import json
import tempfile
import time
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from datetime import datetime, timezone
from pathlib import Path

import httpx

# ── Collections and comprehensions ───────────────────────────────────────────
tasks = [
    {"id": 1, "title": "Buy milk", "done": False, "priority": 2},
    {"id": 2, "title": "Learn FastAPI", "done": True, "priority": 1},
    {"id": 3, "title": "Call mom", "done": False, "priority": 1},
]
open_titles = [t["title"] for t in tasks if not t["done"]]
by_id = {t["id"]: t for t in tasks}
priorities = {t["priority"] for t in tasks}
first, *rest = [10, 20, 30]

assert open_titles == ["Buy milk", "Call mom"]
assert by_id[2]["title"] == "Learn FastAPI"
assert priorities == {1, 2} and rest == [20, 30]
print("comprehensions:", open_titles)


# ── Functions: *args, keyword-only args, **kwargs ────────────────────────────
def notify(message: str, *channels: str, urgent: bool = False, **meta) -> str:
    prefix = "URGENT " if urgent else ""
    return f"{prefix}{message} via {', '.join(channels) or 'console'} {meta}"


out = notify("Server up", "email", "sms", urgent=True, user_id=42)
assert out == "URGENT Server up via email, sms {'user_id': 42}"
print("notify:", out)

ranked = sorted(tasks, key=lambda t: (t["done"], t["priority"]))
assert [t["id"] for t in ranked] == [3, 1, 2]


# ── Dataclasses and properties ───────────────────────────────────────────────
@dataclass
class Task:
    title: str
    priority: int = 3
    tags: list[str] = field(default_factory=list)  # a mutable default must use a factory
    created: datetime = field(default_factory=lambda: datetime.now(timezone.utc))

    @property
    def is_urgent(self) -> bool:
        return self.priority == 1

    def __str__(self) -> str:
        return f"[P{self.priority}] {self.title}"


a, b = Task("Ship it", 1), Task("Refactor")
a.tags.append("work")
assert b.tags == []  # each instance got its own list
assert a.is_urgent and not b.is_urgent
print("dataclass:", a, "|", b)


# ── Inheritance with abstract base classes (polymorphism) ────────────────────
class Notifier(ABC):
    @abstractmethod
    def send(self, to: str, text: str) -> str: ...


class EmailNotifier(Notifier):
    def send(self, to, text):
        return f"email→{to}: {text}"


class SmsNotifier(Notifier):
    def send(self, to, text):
        return f"sms→{to}: {text[:20]}"


for n in (EmailNotifier(), SmsNotifier()):
    print("polymorphism:", n.send("aamir", "Your code is 123456, valid for 5 minutes"))
try:
    Notifier()  # type: ignore[abstract]
    raise AssertionError("abstract class should not instantiate")
except TypeError:
    pass


# ── Exceptions with chaining ─────────────────────────────────────────────────
class TaskNotFound(Exception):
    pass


def get_task(task_id: int) -> dict:
    try:
        return by_id[task_id]
    except KeyError as exc:
        raise TaskNotFound(f"No task {task_id}") from exc


try:
    get_task(99)
except TaskNotFound as e:
    assert isinstance(e.__cause__, KeyError)
    print("exception:", e)


# ── Files, pathlib and context managers ──────────────────────────────────────
with tempfile.TemporaryDirectory() as tmp:
    path = Path(tmp) / "data" / "tasks.json"
    path.parent.mkdir(parents=True)
    with path.open("w", encoding="utf-8") as f:
        json.dump(tasks, f)
    assert json.loads(path.read_text(encoding="utf-8")) == tasks
    print("file round-trip ok:", path.name, path.stat().st_size, "bytes")


# ── Generators: lazy, constant memory ────────────────────────────────────────
def countdown(n: int):
    while n > 0:
        yield n
        n -= 1


assert list(countdown(3)) == [3, 2, 1]
assert sum(x * x for x in range(1_000_000)) == 333332833333500000


# ── Decorators ───────────────────────────────────────────────────────────────
calls: list[str] = []


def timed(fn):
    @functools.wraps(fn)
    def wrapper(*args, **kwargs):
        start = time.perf_counter()
        try:
            return fn(*args, **kwargs)
        finally:
            calls.append(f"{fn.__name__} {(time.perf_counter() - start) * 1000:.2f}ms")

    return wrapper


@timed
def slow_add(x, y):
    time.sleep(0.01)
    return x + y


assert slow_add(2, 3) == 5 and slow_add.__name__ == "slow_add"
print("decorator:", calls[0])


@functools.lru_cache(maxsize=None)
def fib(n: int) -> int:
    return n if n < 2 else fib(n - 1) + fib(n - 2)


assert fib(80) == 23416728348467685


# ── async/await: many I/O waits at once on one thread ────────────────────────
def fake_api(request: httpx.Request) -> httpx.Response:
    """A local stand-in for a web server, so this lesson runs offline."""
    user_id = request.url.path.rsplit("/", 1)[-1]
    return httpx.Response(200, json={"id": int(user_id), "name": f"user{user_id}"})


async def fetch_users(ids: list[int]) -> list[dict]:
    async with httpx.AsyncClient(transport=httpx.MockTransport(fake_api), base_url="https://api.test") as client:
        responses = await asyncio.gather(*(client.get(f"/users/{i}") for i in ids))
    return [r.json() for r in responses]


async def sleepy(n: float) -> float:
    await asyncio.sleep(n)
    return n


async def main_async():
    users = await fetch_users([1, 2, 3])
    assert [u["name"] for u in users] == ["user1", "user2", "user3"]
    start = time.perf_counter()
    await asyncio.gather(*(sleepy(0.2) for _ in range(10)))  # 10 waits overlap
    elapsed = time.perf_counter() - start
    assert elapsed < 1.0, elapsed
    print(f"async: fetched {len(users)} users; 10×0.2s waits took {elapsed:.2f}s total")


asyncio.run(main_async())
print("✓ 01-python passed")
