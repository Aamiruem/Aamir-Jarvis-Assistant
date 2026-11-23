"""Project HQ: HTML/SEO parsing is accurate (no false 'missing title'), results are scored and saved,
platform-managed findings are labelled, local tests run the project's own commands only."""
import sys

import pytest

from app.projects import checks, registry
from app.routers import projects as R

GOOD = """<!doctype html><html lang="en"><head><title>Azarvis - AI voice assistant by Aamir</title>
<meta name="description" content="A voice assistant that plans your day, answers questions and runs real checks on your PC.">
<meta name="viewport" content="width=device-width, initial-scale=1"><link rel="canonical" href="https://azarvis-app.vercel.app/">
<meta property="og:title" content="Azarvis"><meta property="og:image" content="https://x/og.png">
<meta name="google-site-verification" content="abc"><script async src="https://www.googletagmanager.com/gtag/js?id=G-ABC123XYZ"></script>
<script type="application/ld+json">{"@context":"https://schema.org","@type":"WebApplication","name":"Azarvis"}</script>
<link rel="stylesheet" href="/assets/app.css"></head><body><h1>Azarvis</h1>
<svg><title>Chart of accuracy</title></svg><p>""" + "Real content. " * 30 + """</p><img src="a.png" alt="x"><img src="b.png">
<a href="/about">About</a><script src="/assets/app.js"></script></body></html>"""


def test_parser_reads_the_page_title_not_an_svg_title():
    p = checks.parse_html(GOOD)
    assert p.title == "Azarvis - AI voice assistant by Aamir" and p.lang == "en" and p.h1 == 1
    assert p.imgs == 2 and p.imgs_no_alt == 1 and p.scripts == ["https://www.googletagmanager.com/gtag/js?id=G-ABC123XYZ", "/assets/app.js"]
    assert p.styles == ["/assets/app.css"] and p.text_len > 300


def test_good_page_has_only_minor_findings():
    s = checks.seo_from_html(GOOD, "https://azarvis-app.vercel.app/")
    assert s["ga4_ids"] == ["G-ABC123XYZ"] and s["google_verification"] and s["jsonld_types"] == ["WebApplication"]
    assert {f["severity"] for f in s["findings"]} <= {"low", "info"}
    assert any("alt text" in f["title"] for f in s["findings"])


def test_bare_spa_shell_is_flagged():
    shell = '<html><head></head><body><div id="root"></div><script type="module" src="/main.js"></script></body></html>'
    titles = {f["title"]: f["severity"] for f in checks.seo_from_html(shell, "https://x.app/")["findings"]}
    assert titles["No <title>"] == "high" and titles["No viewport meta tag"] == "high"
    assert titles["Almost no text in the HTML: content is rendered by JavaScript"] == "medium"
    assert "No lang attribute on <html>" in titles


def test_noindex_and_foreign_canonical_are_flagged():
    html = GOOD.replace('<meta name="viewport"', '<meta name="robots" content="noindex,nofollow"><meta name="viewport"').replace(
        'href="https://azarvis-app.vercel.app/"', 'href="https://other.example.com/"')
    titles = [f["title"] for f in checks.seo_from_html(html, "https://azarvis-app.vercel.app/")["findings"]]
    assert "Page is set to noindex" in titles and "Canonical points to another domain" in titles


def test_pagespeed_response_is_parsed():
    d = {"lighthouseResult": {"categories": {"performance": {"score": 0.43}, "seo": {"score": 1}}, "fetchTime": "t",
                              "audits": {"largest-contentful-paint": {"displayValue": "4.1 s"}, "cumulative-layout-shift": {"displayValue": "0.02"}}},
         "loadingExperience": {"metrics": {"INTERACTION_TO_NEXT_PAINT": {"percentile": 310, "category": "AVERAGE"}}}}
    r = checks.parse_psi(d)
    assert r["scores"] == {"performance": 43, "seo": 100} and r["lab"]["lcp"] == "4.1 s"
    assert r["field"] == {"inp": {"p75": 310, "category": "AVERAGE"}}


def test_score_penalties():
    assert checks.score([]) == 100 and checks.score([{"severity": "critical"}, {"severity": "low"}]) == 68


@pytest.fixture
def reg(tmp_path, monkeypatch):
    monkeypatch.setattr(registry, "FILE", tmp_path / "projects.json")
    monkeypatch.setattr(registry, "STATUS_FILE", tmp_path / "status.json")
    return registry


def test_registry_seeds_and_edits(reg):
    ids = [p["id"] for p in reg.projects()]
    assert "azarvis-app" in ids and "portfolio" in ids
    p = reg.upsert({"name": "My New Site", "kind": "web", "url": "https://new.example.com", "evil": "x"})
    assert p["id"] == "my-new-site" and "evil" not in p
    assert reg.upsert({"name": "My New Site"})["id"] == "my-new-site-2"
    assert reg.remove("my-new-site") and not reg.remove("my-new-site")


def test_local_dir_stays_inside_the_repo(reg):
    assert reg.local_dir({"local_path": "frontend"}).name == "frontend"
    assert reg.local_dir({"local_path": "../../Windows"}) is None
    assert reg.local_dir({"local_path": ""}) is None


def test_test_commands_come_from_the_project_files(reg):
    d = reg.local_dir({"local_path": "frontend"})
    labels = [c for c, _ in reg.test_commands(d)]
    assert "npm run test" in labels and "npm run build" in labels
    py = [c for c, _ in reg.test_commands(reg.local_dir({"local_path": "backend/fastapi-ai"}))]
    assert py == ["pytest -q"]


def test_check_saves_results_and_labels_platform_findings(reg, monkeypatch):
    reg.upsert({"name": "Crop", "kind": "web", "platform": "streamlit", "url": "https://crop.streamlit.app/"})
    page = {"url": "https://crop.streamlit.app/", "text": GOOD, "headers": {}}
    monkeypatch.setattr(checks, "site", lambda url: {"up": True, "page": page, "findings": [
        {"severity": "medium", "title": "No HSTS header", "area": "security", "fix": "Add it."},
        {"severity": "medium", "title": "Plain HTTP is not redirected to HTTPS", "area": "security", "fix": "Redirect."},
        {"severity": "critical", "title": "Homepage answers HTTP 503", "area": "uptime", "fix": "Logs."}]})
    monkeypatch.setattr(checks, "seo", lambda pg: {"score": 95, "findings": [], "scripts": [], "styles": []})
    monkeypatch.setattr(checks, "assets", lambda pg, s, c: {"js_kb": 1, "findings": []})
    monkeypatch.setattr(R.settings, "system_control", False)
    r = R.check("crop")
    hsts = r["status"]["site"]["findings"][0]
    assert hsts["severity"] == "low" and hsts["platform"] == "Streamlit Community Cloud" and hsts["fix"].startswith("Controlled by")
    sev = {f["title"]: f["severity"] for f in r["status"]["site"]["findings"]}
    assert sev["Plain HTTP is not redirected to HTTPS"] == "low" and sev["Homepage answers HTTP 503"] == "critical"  # outages stay visible
    assert r["health"]["state"] == "critical"
    assert reg.statuses()["crop"]["seo"]["score"] == 95


def test_health_states():
    assert R.health({})["state"] == "unknown"
    assert R.health({"api": {"findings": [{"severity": "critical", "title": "down"}]}})["state"] == "critical"
    assert R.health({"seo": {"findings": [{"severity": "medium", "title": "x"}]}})["state"] == "warning"


def test_project_input_is_validated():
    with pytest.raises(ValueError):
        R.ProjectIn(name="x", url="javascript:alert(1)")
    with pytest.raises(ValueError):
        R.ProjectIn(name="x", local_path="../../etc")
    with pytest.raises(ValueError):
        R.ProjectIn(name="x", repo="not a repo")


def test_test_job_runs_commands_and_reports_failures(tmp_path):
    from app.ops.jobs import JobRunner
    jr = JobRunner(history_file=tmp_path / "jobs.json")
    cmds = [("ok", [sys.executable, "-c", "print('fine')"]), ("bad", [sys.executable, "-c", "import sys; print('boom'); sys.exit(3)"])]
    j = jr.run_sync("u", "p", "Tests", {}, R._run_tests(tmp_path, cmds), timeout=60)
    assert j.status == "done" and j.result["summary"] == "1/2 passed"
    bad = j.result["results"][1]
    assert bad == {"command": "bad", "ok": False, "exit": 3, "seconds": bad["seconds"], "tail": "boom"}
    assert j.steps[1]["status"] == "failed" and j.result["findings"][0]["title"] == "bad failed (exit 3)"


def test_parallel_checks_dont_collide_on_the_status_file(reg):
    """Check all runs 4 checks at once: concurrent saves and reads must never fail (Windows file locking)."""
    from concurrent.futures import ThreadPoolExecutor

    def work(i):
        reg.save_status(f"p{i % 6}", "site", {"n": i, "findings": []})
        return reg.statuses()

    with ThreadPoolExecutor(8) as pool:
        list(pool.map(work, range(120)))
    assert len(reg.statuses()) == 6
