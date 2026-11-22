"""Source-code security audit of a project on this PC (defensive, read-only).

1. Secrets: API keys, tokens, private keys and passwords written into files (Gitleaks-style rules).
   Each hit is shown masked, and marked by whether git tracks the file: a secret in a committed file
   has to be rotated, one in an ignored local .env is normal.
2. Python: Bandit (when installed), the standard Python security linter.
3. JavaScript/TypeScript: risky patterns (eval, innerHTML, disabled TLS checks, shell commands).
Nothing is changed, uploaded or executed.
"""
from __future__ import annotations

import json
import os
import re
import subprocess
import sys
from pathlib import Path

from app.ops.vuln import REPO_ROOT

SKIP_DIRS = {"node_modules", ".git", "dist", "build", "__pycache__", ".next", "coverage", ".venv", "venv", "site-packages", ".pytest_cache", ".mypy_cache"}
SKIP_FILES = re.compile(r"(package-lock\.json|yarn\.lock|pnpm-lock\.yaml|poetry\.lock|\.min\.js|\.map|\.svg|\.png|\.jpe?g|\.gif|\.ico|\.webp|\.pdf|\.woff2?|\.ttf|\.zip|\.exe|\.dll|\.pyc|\.db|\.sqlite3?|oui\.csv)$", re.I)
MAX_BYTES = 1_000_000

SECRET_RULES: list[tuple[str, str, str]] = [
    ("aws-access-key", r"\b(AKIA|ASIA)[0-9A-Z]{16}\b", "critical"),
    ("github-token", r"\b(gh[pousr]_[A-Za-z0-9]{36,}|github_pat_[A-Za-z0-9_]{40,})\b", "critical"),
    ("anthropic-key", r"\bsk-ant-[A-Za-z0-9_\-]{20,}", "critical"),
    ("openai-key", r"\bsk-(proj-|svcacct-)?[A-Za-z0-9_\-]{32,}", "critical"),
    ("google-api-key", r"\bAIza[0-9A-Za-z_\-]{35}\b", "high"),
    ("slack-token", r"\bxox[baprs]-[0-9A-Za-z\-]{10,}", "high"),
    ("stripe-live-key", r"\b(sk|rk)_live_[0-9A-Za-z]{20,}", "critical"),
    ("twilio-key", r"\bSK[0-9a-f]{32}\b", "high"),
    ("private-key", r"-----BEGIN (RSA |EC |DSA |OPENSSH |PGP |ENCRYPTED )?PRIVATE KEY-----", "critical"),
    ("db-url-with-password", r"\b(mongodb(\+srv)?|postgres(ql)?|mysql|redis|amqp)://[^:\s'\"/]+:[^@\s'\"]{3,}@", "high"),
    ("jwt", r"\beyJ[A-Za-z0-9_\-]{10,}\.eyJ[A-Za-z0-9_\-]{10,}\.[A-Za-z0-9_\-]{10,}", "medium"),
    ("password-assignment", r"(?i)\b(password|passwd|pwd|secret|api[_-]?key|access[_-]?token|auth[_-]?token)\b\s*[:=]\s*['\"]([^'\"\s]{8,})['\"]", "medium"),
]
_SECRET_RX = [(n, re.compile(rx), sev) for n, rx, sev in SECRET_RULES]
PLACEHOLDER = re.compile(r"(?i)(x{4,}|\*{4,}|your[_-]?|example|changeme|placeholder|dummy|test[_-]?key|<[^>]+>|\$\{|process\.env|os\.environ|getenv|settings\.|config\.|://(\w+):\2@)")
PLACEHOLDER_CAPS = re.compile(r"\b[A-Z]+(?:-[A-Z]+){2,}\b")  # 'A-LONG-RANDOM-PASSWORD' style placeholders

JS_RULES: list[tuple[str, str, str, str]] = [
    ("eval", r"\beval\s*\(", "medium", "eval() runs text as code: an injection there becomes code execution."),
    ("new-function", r"\bnew\s+Function\s*\(", "medium", "new Function() compiles text into code, like eval."),
    ("dangerous-html", r"dangerouslySetInnerHTML", "low", "Renders raw HTML: make sure it is sanitized (e.g. DOMPurify) or comes from trusted code."),
    ("inner-html", r"\.innerHTML\s*=(?!=)", "low", "Assigning innerHTML with user data allows XSS; prefer textContent."),
    ("tls-off", r"rejectUnauthorized\s*:\s*false|NODE_TLS_REJECT_UNAUTHORIZED\s*=\s*['\"]?0", "high", "TLS certificate checks are switched off: traffic can be intercepted."),
    ("shell-exec", r"child_process['\"]?\)?\.exec(Sync)?\s*\(\s*`[^`]*\$\{", "high", "A shell command built from a template string: command injection if any part comes from input."),
    ("cors-any", r"origin\s*:\s*['\"]\*['\"]|Access-Control-Allow-Origin['\"]?\s*,\s*['\"]\*", "low", "CORS allows every website: fine for public APIs, not with cookies or tokens."),
    ("http-url", r"fetch\(\s*['\"]http://(?!localhost|127\.0\.0\.1)", "low", "A plain-HTTP request: the data travels unencrypted."),
]
_JS_RX = [(n, re.compile(rx), sev, why) for n, rx, sev, why in JS_RULES]
JS_EXT = {".js", ".jsx", ".ts", ".tsx", ".mjs", ".cjs", ".vue", ".svelte"}


TEST_FILE = re.compile(r"(^|[\\/])(tests?|__tests__|spec|fixtures?)[\\/]|(^|[\\/])test_[^\\/]+\.py$|_test\.py$|\.(test|spec)\.[jt]sx?$", re.I)
DOC_EXT = {".md", ".rst", ".txt", ".html", ".htm", ".ipynb", ".adoc"}


def file_kind(rel: str) -> str:
    """'test', 'doc' or 'code': a key in a test fixture or a tutorial is usually an example."""
    if TEST_FILE.search(rel):
        return "test"
    if Path(rel).suffix.lower() in DOC_EXT:
        return "doc"
    return "code"


def mask(s: str) -> str:
    return s[:4] + "…" + s[-2:] if len(s) > 10 else "…"


def scan_text_for_secrets(text: str) -> list[dict]:
    """[{rule, line, masked, severity}] for one file's text (pure)."""
    out = []
    for i, line in enumerate(text.splitlines(), 1):
        if len(line) > 2000:
            continue
        for name, rx, sev in _SECRET_RX:
            m = rx.search(line)
            if not m:
                continue
            value = m.group(m.lastindex) if name == "password-assignment" and m.lastindex else m.group(0)
            if name in ("password-assignment", "jwt", "db-url-with-password") and (PLACEHOLDER.search(line) or PLACEHOLDER_CAPS.search(value)):
                continue
            out.append({"rule": name, "line": i, "masked": mask(value), "severity": sev})
            break
    return out


def scan_text_js(text: str) -> list[dict]:
    out = []
    for i, line in enumerate(text.splitlines(), 1):
        if len(line) > 2000 or line.lstrip().startswith(("//", "*")):
            continue
        for name, rx, sev, why in _JS_RX:
            if rx.search(line):
                out.append({"rule": name, "line": i, "severity": sev, "why": why})
    return out


def git_tracked(root: Path) -> set[str] | None:
    try:
        r = subprocess.run(["git", "-C", str(root), "ls-files", "-z"], capture_output=True, timeout=30, creationflags=getattr(subprocess, "CREATE_NO_WINDOW", 0))
    except (OSError, subprocess.TimeoutExpired):
        return None
    if r.returncode != 0:
        return None
    return {p.replace("/", os.sep).lower() for p in r.stdout.decode("utf-8", "replace").split("\0") if p}


def walk(root: Path, limit: int = 30000):
    n = 0
    for dirpath, dirs, files in os.walk(root):
        dirs[:] = [d for d in dirs if d not in SKIP_DIRS]
        for f in files:
            if SKIP_FILES.search(f):
                continue
            n += 1
            if n > limit:
                return
            yield Path(dirpath) / f


def run_bandit(ctx, files: list[Path]) -> tuple[list[dict] | None, str]:
    """Bandit on the project's own Python files (no tests, no installed libraries), 60 per run."""
    results: list[dict] = []
    for i in range(0, len(files), 60):
        try:
            r = ctx.run([sys.executable, "-m", "bandit", "-f", "json", "-q"] + [str(f) for f in files[i:i + 60]], 180)
        except (OSError, TimeoutError) as e:
            return (results or None), f"Bandit stopped: {e}"
        if "No module named bandit" in r.stderr:
            return None, "Bandit is not installed: pip install bandit"
        try:
            results += json.loads(r.stdout[r.stdout.find("{"):]).get("results", [])
        except ValueError:
            return (results or None), "Bandit's output could not be read."
    return results, f"Bandit on {len(files)} Python files"


def code_audit(ctx, path: str | None) -> dict:
    from app.ops.actions import kv, score_of, sort_findings, table
    root = Path(os.path.expandvars(os.path.expanduser(path.strip().strip('"')))) if path else REPO_ROOT
    if not root.is_dir():
        raise FileNotFoundError(f"No folder at {root}")
    tracked = ctx.soft_step("Asking git which files are committed", git_tracked, root)
    secrets, js, files, py_files = [], [], 0, []
    with ctx.step(f"Scanning files in {root} for secrets and risky code") as st:
        for p in walk(root):
            files += 1
            if files % 400 == 0:
                ctx.check()
            try:
                if p.stat().st_size > MAX_BYTES:
                    continue
                text = p.read_text(encoding="utf-8", errors="strict")
            except (OSError, UnicodeDecodeError):
                continue
            rel = str(p.relative_to(root))
            for h in scan_text_for_secrets(text):
                committed = tracked is not None and rel.lower() in tracked
                secrets.append({**h, "file": rel, "committed": committed if tracked is not None else None, "kind": file_kind(rel)})
            if p.suffix.lower() in JS_EXT:
                js += [{**h, "file": rel} for h in scan_text_js(text)]
            if p.suffix == ".py" and file_kind(rel) == "code":
                py_files.append(p)
        st["detail"] = f"{files} files · {len(secrets)} possible secrets · {len(js)} risky JS/TS lines"
    bandit, bandit_note = (None, "no Python files")
    if py_files:
        with ctx.step(f"Running Bandit on {len(py_files)} Python files") as st:
            bandit, bandit_note = run_bandit(ctx, py_files)
            st["detail"] = bandit_note if bandit is None else f"{len(bandit)} issues"
    f = []
    for s in secrets:
        if s["committed"] and s["kind"] != "code":
            where = "a test file: usually a fake fixture" if s["kind"] == "test" else "documentation: usually an example"
            f.append({"severity": "low", "title": f"Key-like value in {where} ({s['file']}:{s['line']})", "detail": f"{s['rule']} {s['masked']}. Committed to git.", "fix": "Confirm it is not a real key; if it is, rotate it."})
        elif s["committed"]:
            f.append({"severity": s["severity"], "title": f"Secret committed to git: {s['rule']} in {s['file']}:{s['line']}", "detail": f"Value {s['masked']}. Anyone with the repository (or its history) can read it.", "fix": "Revoke/rotate this key at its provider now, move it to an ignored .env file, then purge it from git history."})
        elif s["committed"] is False:
            f.append({"severity": "info", "title": f"{s['rule']} in local file {s['file']}:{s['line']}", "detail": f"{s['masked']}: not tracked by git (fine for .env files; never commit it).", "fix": ""})
        else:
            f.append({"severity": "medium", "title": f"Possible secret: {s['rule']} in {s['file']}:{s['line']}", "detail": f"{s['masked']} (not a git repository, so it can't be told whether it is shared).", "fix": "Keep secrets in environment variables or an ignored .env file."})
    for b in (bandit or [])[:80]:
        sev = {"HIGH": "high", "MEDIUM": "medium", "LOW": "low"}.get(b.get("issue_severity"), "low")
        if sev == "low" or b.get("issue_confidence") == "LOW":
            continue
        rel = os.path.relpath(b.get("filename", ""), root)
        f.append({"severity": sev, "title": f"Bandit {b.get('test_id')}: {b.get('issue_text')}", "detail": f"{rel}:{b.get('line_number')} · confidence {b.get('issue_confidence', '').lower()}" + (f" · {b['issue_cwe']['id'] and 'CWE-' + str(b['issue_cwe']['id'])}" if b.get("issue_cwe") else ""), "fix": b.get("more_info", "")})
    for j in js:
        if j["severity"] in ("high", "medium"):
            f.append({"severity": j["severity"], "title": f"{j['rule']} in {j['file']}:{j['line']}", "detail": j["why"], "fix": ""})
    if not any(x["severity"] in ("critical", "high", "medium") for x in f):
        f.append({"severity": "ok", "title": "No committed secrets or high-risk code found", "detail": f"{files} files scanned.", "fix": ""})
    committed = [s for s in secrets if s["committed"] and s["kind"] == "code"]
    return {"summary": f"{files} files · {len(committed)} secret(s) in git, {len(secrets) - len(committed)} local · Bandit: {sum(1 for b in bandit if b.get('issue_severity') != 'LOW') if bandit is not None else bandit_note} medium/high · {len(js)} risky JS/TS lines",
            "score": score_of([x for x in f if x["severity"] != "info"][:40]), "findings": sort_findings(f)[:80],
            "sections": [table("Possible secrets (masked)", ["Rule", "File", "Line", "Value", "In git", "File type"], [[s["rule"], s["file"], s["line"], s["masked"], {True: "YES", False: "no", None: "?"}[s["committed"]], s["kind"]] for s in secrets]),
                         table("Bandit (Python): medium and high", ["Severity", "Confidence", "Test", "Issue", "Where"], [[b.get("issue_severity"), b.get("issue_confidence"), b.get("test_id"), b.get("issue_text"), f"{os.path.relpath(b.get('filename', ''), root)}:{b.get('line_number')}"] for b in (bandit or []) if b.get("issue_severity") != "LOW"][:150], note=f"{sum(1 for b in (bandit or []) if b.get('issue_severity') == 'LOW')} low-severity notes (e.g. subprocess use) are not listed."),
                         table("Risky JavaScript/TypeScript", ["Severity", "Rule", "Where", "Why"], [[j["severity"], j["rule"], f"{j['file']}:{j['line']}", j["why"]] for j in js]),
                         kv("Method", [("Scope", str(root)), ("Secrets", f"{len(SECRET_RULES)} Gitleaks-style rules; values masked, never stored in full"), ("Python", bandit_note), ("JS/TS", f"{len(JS_RULES)} pattern rules")])]}
