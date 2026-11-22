"""Cyber Ops dashboards: live telemetry parsing, the security overview and mission control are built
only from real data (no data -> 'not run', never a guess)."""
import asyncio
import time

from app.ops import insights, live
from app.routers import ops as ops_router
from app.security import Caller

NOW = time.time()


def job(action, *, score=None, findings=(), t=NOW - 60, status="done", params=None, sections=None, jid=None):
    return {"id": jid or f"{action}-{t}", "action": action, "title": action.title(), "status": status, "params": params or {},
            "created_at": t, "finished_at": t + 5, "steps": [],
            "result": {"summary": "", "score": score, "findings": list(findings), "sections": sections or []}}


def f(sev, title="x"):
    return {"severity": sev, "title": title, "detail": "", "fix": ""}


# ---------- live telemetry ----------

def test_gpu_uses_the_busiest_engine_like_task_manager():
    g = live.gpu_from({"engines": {"3d": 12.5, "copy": 40.0, "videodecode": 0}, "dedicated": 0, "shared": 300}, {"gpus": {"name": "Intel UHD", "ram": 1024}})
    assert g["util"] == 40.0 and g["name"] == "Intel UHD" and g["vram_total"] == 1024


def test_gpu_without_a_sample_reports_none_not_zero():
    assert live.gpu_from(None, {})["util"] is None


def test_temperatures_convert_kelvin_and_say_why_when_missing():
    t = live.temps_from({"thermal": [{"zone": "tz0", "kelvin": 323.15}, {"zone": "bad", "kelvin": 0}]})
    assert t["cpu"] == 50.0 and t["zones"] == [50.0]
    missing = live.temps_from({"thermal": []})
    assert missing["cpu"] is None and "no temperature sensor" in missing["reason"]


def test_rate_is_bytes_per_second_between_calls():
    live._prev.pop("t-rate", None)
    assert live.rate("t-rate", 1000, 10.0) is None
    assert live.rate("t-rate", 3000, 12.0) == 1000.0


def test_process_cpu_comes_from_cpu_time_deltas():
    top, table = live.rank_processes({}, [(1, "a.exe", 100, 5.0), (2, "b.exe", 900, 1.0)], 0.0, 4)
    assert [r["cpu"] for r in top["cpu"]] == [0.0, 0.0] and top["mem"][0]["name"] == "b.exe"
    # a.exe used 2 CPU-seconds in 2 s on a 4-thread CPU = 25 %; a pid seen for the first time counts 0
    top, _ = live.rank_processes(table, [(1, "a.exe", 100, 7.0), (2, "b.exe", 900, 1.0), (3, "new.exe", 5, 50.0)], 2.0, 4)
    assert top["cpu"][0] == {"pid": 1, "name": "a.exe", "cpu": 25.0, "mem": 100}
    assert next(r for r in top["cpu"] if r["pid"] == 3)["cpu"] == 0.0 and top["count"] == 3


def test_snapshot_has_real_fields():
    s = live.snapshot()
    live.sampler.stop()
    assert 0 <= s["cpu"]["percent"] <= 100 and s["ram"]["total"] > 0 and s["static"]["threads"] >= 1
    assert s["history"] and "processes" in s


# ---------- security overview ----------

def test_overview_with_no_scans_says_not_run():
    o = insights.overview([], NOW)
    assert o["posture"] is None and o["alerts_total"] == 0 and o["assets"] is None
    assert all(c["state"] == "never" for c in o["coverage"])


def test_alerts_come_from_the_latest_run_of_each_check_only():
    old = job("security", score=40, findings=[f("critical", "Defender off")], t=NOW - 3600)
    new = job("security", score=95, findings=[f("low", "UAC prompt level"), f("ok", "Firewall on")], t=NOW - 60)
    o = insights.overview([new, old], NOW)
    assert o["counts"] == {"critical": 0, "high": 0, "medium": 0, "low": 1}
    assert o["posture"]["score"] == 95
    assert [p["score"] for p in o["trend"]] == [40, 95]  # oldest first


def test_cve_lookups_are_research_not_alerts():
    o = insights.overview([job("cve", findings=[f("critical", "CVE-2021-44228")])], NOW)
    assert o["alerts_total"] == 0


def test_a_newer_full_report_sets_the_posture():
    rep = job("report", score=72, t=NOW - 30)
    older = job("ports", score=100, t=NOW - 600)
    assert insights.overview([rep, older], NOW)["posture"] == {"score": 72, "basis": "Latest full security report", "checks": 1}


def test_no_posture_without_the_system_security_check_or_a_report():
    assert insights.overview([job("connections", score=100)], NOW)["posture"] is None
    p = insights.overview([job("connections", score=100), job("security", score=60, t=NOW - 300)], NOW)["posture"]
    assert p["score"] == 80 and p["checks"] == 2


def test_stale_checks_are_flagged():
    o = insights.overview([job("ports", score=90, t=NOW - 10 * 86400)], NOW)
    assert next(c for c in o["coverage"] if c["action"] == "ports")["state"] == "stale"


def test_asset_health_marks_devices_with_risky_ports():
    devs = [{"name": "This PC", "ip": "192.168.1.5", "category": "This PC", "is_self": True},
            {"name": "TV", "ip": "192.168.1.20", "category": "Smart TV / media"},
            {"name": "Cam", "ip": "192.168.1.30", "category": "Camera"},
            {"name": "Cam2", "ip": "192.168.1.31", "category": "Camera"}]
    net = job("network", score=80, findings=[f("high", "TV (192.168.1.20): port 5555 ADB open")],
              sections=[{"type": "devices", "devices": devs}])
    a = insights.overview([net], NOW)["assets"]
    assert a["total"] == 4 and a["at_risk"] == 1 and a["health"] == 75
    tv = next(g for g in a["groups"] if g["category"] == "Smart TV / media")
    assert tv["health"] == 0 and next(n for n in a["nodes"] if n["ip"] == "192.168.1.20")["risk"] == "high"


# ---------- mission control ----------

def test_mission_assigns_scans_and_subtasks_to_specialists():
    jobs = [job("devices", params={"authorized": True}), job("netfix"), job("fix_dns_flush"), job("laptop", status="running")]
    runs = [{"id": "r1", "instruction": "build it", "status": "needs_approval", "created_at": NOW - 100, "finished_at": None,
             "subtasks": [{"id": "s1", "title": "Write the Python script", "agent": "coding", "instruction": "use pandas", "status": "done"},
                          {"id": "s2", "title": "Build the React page", "agent": "coding", "instruction": "", "status": "done"},
                          {"id": "s3", "title": "Open the site", "agent": "automation", "instruction": "", "status": "done"}],
             "approvals": [{"id": "a1", "subtask_id": "s3", "tool": "open_website", "status": "pending"},
                           {"id": "a2", "subtask_id": "s3", "tool": "open_website", "status": "approved"}]}]
    m = insights.mission(jobs, runs, NOW)
    by = {a["id"]: a for a in m["agents"]}
    assert len(m["agents"]) == 10
    assert by["discovery"]["done"] == 1 and by["troubleshoot"]["done"] == 1
    assert by["sysadmin"]["state"] == "working" and by["sysadmin"]["done"] == 1  # the approved fix
    assert by["python"]["done"] == 1 and by["fullstack"]["done"] == 1
    assert by["browser"]["state"] == "waiting" and by["browser"]["waiting"] == 1
    ap = m["approvals"]
    assert (ap["authorized_scans"], ap["approved_fixes"], ap["approved"], ap["pending"]) == (1, 1, 1, 1)
    assert ap["decided"] == 3 and m["totals"]["actions"] == 7
    assert sum(d["done"] for d in m["per_day"]) == 6


def test_mission_endpoint_and_overview_endpoint_answer_for_a_new_user():
    me = Caller(user_id="insights-nobody")
    m = asyncio.run(ops_router.mission_control(me))
    o = asyncio.run(ops_router.security_overview(me))
    assert m["totals"]["completed"] == 0 and m["approvals"]["human_rate"] is None
    assert o["posture"] is None
