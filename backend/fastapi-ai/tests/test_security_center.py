"""Security Center PC check: readings become plain-language checks; servers and non-Windows say so."""
import asyncio
from datetime import datetime, timezone

from app.routers import security_center as sc

TODAY = datetime(2026, 11, 19, tzinfo=timezone.utc)


def by_id(checks):
    return {c["id"]: c for c in checks}


def test_healthy_pc():
    raw = {"defender": {"service": True, "antivirus": True, "realtime": True, "signatureAgeDays": 1},
           "firewall": [{"name": "Domain", "enabled": True}, {"name": "Private", "enabled": True}, {"name": "Public", "enabled": True}],
           "uac": 1, "lastUpdate": "2026-11-10"}
    checks = by_id(sc.interpret(raw, TODAY))
    assert {c["status"] for c in checks.values()} == {"ok"}
    assert "9 days ago" in checks["updates"]["detail"]
    assert "today" in by_id(sc.interpret({**raw, "lastUpdate": "2026-11-19"}, TODAY))["updates"]["detail"]


def test_problems_get_a_fix():
    raw = {"defender": {"service": True, "antivirus": True, "realtime": False, "signatureAgeDays": 0},
           "firewall": {"name": "Public", "enabled": False}, "uac": 0, "lastUpdate": "2026-08-01"}
    checks = by_id(sc.interpret(raw, TODAY))
    assert checks["antivirus"]["status"] == "bad" and "Real-time" in checks["antivirus"]["fix"]
    assert checks["firewall"]["status"] == "bad" and "Public" in checks["firewall"]["detail"]
    assert checks["uac"]["status"] == "bad"
    assert checks["updates"]["status"] == "warn"
    assert all(c["fix"] for c in checks.values())


def test_unreadable_values_are_unknown_not_ok():
    checks = by_id(sc.interpret({}, TODAY))
    assert {c["status"] for c in checks.values()} == {"unknown"}


def test_server_and_other_os_are_not_checked(monkeypatch):
    monkeypatch.setattr(sc.settings, "system_control", False)
    out = asyncio.run(sc.pc_check())
    assert out["supported"] is False and out["checks"] == []
    monkeypatch.setattr(sc.settings, "system_control", True)
    monkeypatch.setattr(sc, "current_os", lambda: "linux")
    assert asyncio.run(sc.pc_check())["supported"] is False
