# Run from the repo root: python scripts/campusx_notes/cx_build.py frontend/public/courses/campusx-dsmp-2022-23
# Builds frontend/public/courses/campusx-dsmp-2022-23/notes.json: one Markdown note per lecture.
import json
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from cx_notes_1 import NOTES as N1
from cx_notes_2 import NOTES as N2
from cx_notes_3 import NOTES as N3
from cx_notes_4 import KINDS, NOTES as N4

ROOT = Path(sys.argv[1])
course = json.loads((ROOT / "course.json").read_text(encoding="utf-8"))
written = {}
for part in (N1, N2, N3, N4):
    dup = set(written) & set(part)
    assert not dup, f"duplicate lectures {dup}"
    written.update(part)


def lang(code):
    if re.search(r"^\s*(SELECT|CREATE|INSERT|WITH|START|ALTER|UPDATE)\b", code, re.M | re.I):
        return "sql"
    if code.startswith("git "):
        return "bash"
    return "python"


def render(ideas, code, questions):
    out = ["### Key ideas", *[f"- {i}" for i in ideas]]
    if code:
        out += ["", "### Example", f"```{lang(code)}", code, "```"]
    if questions:
        out += ["", "### Interview questions", *[f"{k}. {q}" for k, q in enumerate(questions, 1)]]
    return "\n".join(out)


OTHER = {"Tasks, doubts and interview prep", "Career and program updates"}
lectures = course["lectures"]
by_n = {l["n"]: l for l in lectures}
notes, kinds = {}, {}
for l in lectures:
    n = l["n"]
    if n in written:
        notes[str(n)] = render(*written[n])
        kinds[str(n)] = "lesson"
        continue
    title = l["title"].lower()
    text = None
    for pattern, msg in KINDS:
        if re.search(pattern, title) and msg:
            text = msg
            break
    if text is None:
        raise SystemExit(f"no note for #{n} {l['title']}")
    # Point to the nearest earlier lessons in the same section.
    teaching = lambda m: m in written and by_n[m]["section"] not in OTHER
    same = [m for m in range(n - 1, 0, -1) if teaching(m)][:3]
    see = ", ".join(f"[#{m} {by_n[m]['title']}](#lecture-{m})" for m in reversed(same))
    notes[str(n)] = f"{text}\n\n**Revise:** {see}" if see else text
    kinds[str(n)] = "session"

out = {"slug": course["slug"], "written": "2026-11-19", "basis": "Written by Azarvis from each lecture's title and its list of topics; the videos were not transcribed.", "kinds": kinds, "notes": notes}
(ROOT / "notes.json").write_text(json.dumps(out, ensure_ascii=False, indent=0), encoding="utf-8")
print(len(notes), "notes;", sum(v == "lesson" for v in kinds.values()), "lessons;", sum(v == "session" for v in kinds.values()), "session notes;", (ROOT / "notes.json").stat().st_size // 1024, "KB")
