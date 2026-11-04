"""PC watcher: each change is reported once, with a fake computer (no real battery or Wi-Fi needed)."""
from fastapi.testclient import TestClient

from app import pc_watcher
from app.db import sql
from app.main import app
from app.pc_watcher import Watcher

sql.init_db()


class FakePC:
    def __init__(self):
        self.battery_state = (80, False)
        self.disk_state = (40.0, 200.0)
        self.cpu_value = self.memory_value = 20.0
        self.files: dict = {"old.pdf": (1.0, 100)}
        self.drive_set: set = set()
        self.is_online = True

    def battery(self): return self.battery_state
    def disk(self): return self.disk_state
    def cpu(self): return self.cpu_value
    def memory(self): return self.memory_value
    def top_app(self, by): return "chrome"
    def downloads(self): return dict(self.files)
    def drives(self): return set(self.drive_set)
    def online(self): return self.is_online


def titles(watcher):
    return [a.title for a in watcher.check()]


def test_quiet_when_nothing_changes():
    w = Watcher(FakePC())
    assert titles(w) == []  # existing downloads are the baseline, not "new"
    assert titles(w) == []


def test_battery_warns_once_per_level_and_when_full():
    pc = FakePC()
    w = Watcher(pc)
    w.check()
    pc.battery_state = (19, False)
    assert titles(w) == ["Battery at 19%"]
    assert titles(w) == []  # not again at the next check
    pc.battery_state = (9, False)
    assert titles(w) == ["Battery at 9%"]
    pc.battery_state = (60, True)
    assert titles(w) == []
    pc.battery_state = (100, True)
    assert titles(w) == ["Battery full"] and titles(w) == []


def test_disk_busy_downloads_drives_and_network():
    pc, now = FakePC(), [1000.0]
    w = Watcher(pc, clock=lambda: now[0])
    w.check()
    pc.disk_state = (6.0, 30.0)
    pc.cpu_value = 97
    pc.files["report.pdf"] = (2.0, 2_400_000)
    pc.drive_set = {"E:\\"}
    pc.is_online = False
    first = titles(w)
    assert "Disk almost full" in first and "Download finished" in first and "Drive connected" in first
    assert not any("Processor" in t for t in first)  # one busy reading isn't a busy minute
    assert "Internet connection lost" not in first  # one failed check could be a blip
    second = titles(w)
    assert "Processor at 97% for a minute" in second and "Internet connection lost" in second
    assert "Disk almost full" not in second
    now[0] += 180
    pc.is_online = True
    pc.drive_set = set()
    third = w.check()
    back = next(a for a in third if a.title == "Internet is back")
    assert "3 minutes" in back.body and any(a.title == "Drive removed" for a in third)


def test_partial_downloads_are_ignored(tmp_path):
    (tmp_path / "movie.mp4.crdownload").write_bytes(b"x")
    (tmp_path / "notes.txt").write_bytes(b"hello")
    assert set(pc_watcher.Probe(tmp_path).downloads()) == {"notes.txt"}


def test_alerts_reach_only_subscribers_and_the_api():
    pc_watcher.set_settings("w-ann", True, ["battery", "downloads"])
    pc_watcher.set_settings("w-ben", False, list(pc_watcher.CHECKS))
    subs = pc_watcher.subscribers()
    assert "w-ann" in subs and "w-ben" not in subs
    sent = pc_watcher.deliver([pc_watcher.Alert("battery", "Battery at 9%"), pc_watcher.Alert("disk", "Disk almost full")], subs)
    assert sent == 1
    assert [n["title"] for n in sql.list_notifications("w-ann")] == ["Battery at 9%"]

    h = {"X-Internal-Key": "test-key", "X-User-Id": "w-cat"}
    with TestClient(app) as client:
        s = client.get("/pc-watcher", headers=h).json()
        assert s["enabled"] is False and len(s["checks"]) == len(pc_watcher.CHECKS)
        s = client.put("/pc-watcher", json={"enabled": True, "checks": ["network"]}, headers=h).json()
        assert s["enabled"] and [c["key"] for c in s["checks"] if c["on"]] == ["network"]
        assert client.put("/pc-watcher", json={"enabled": True, "checks": ["webcam"]}, headers=h).status_code == 422
        assert client.post("/pc-watcher/test", headers=h).json()["title"] == "PC watcher is on"
