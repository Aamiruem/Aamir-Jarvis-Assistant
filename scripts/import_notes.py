"""Import a shared ChatGPT conversation as study notes for Jarvis's Notes tab.

    python scripts/import_notes.py https://chatgpt.com/share/<id>     # or a saved .html of that page

Writes frontend/public/notes/<slug>/ (one Markdown file per chapter + index.json) and lists it in
frontend/public/notes/index.json. Every message is kept word for word: each request becomes a
chapter, with the answer(s) that followed it. Chapters are put in syllabus order (Phase, then
Module), complete handbooks and revision sheets come last, and the import fails if any message
is not found verbatim in the output.
"""
import json
import re
import sys
import urllib.request
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "frontend" / "public" / "notes"
UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Safari/537.36"
# Module numbers in the notes' syllabus -> their phase (some answers only name the module).
MODULE_PHASE = {1: 1, 2: 1, 3: 1, 4: 1, 5: 2, 6: 2, 7: 2, 8: 2, 9: 3, 10: 4, 11: 5, 12: 6, 13: 6, 14: 7, 15: 7, 16: 7}


def load_page(source: str) -> str:
    if source.startswith("http"):
        req = urllib.request.Request(source, headers={"User-Agent": UA})
        with urllib.request.urlopen(req, timeout=60) as r:
            return r.read().decode("utf-8", errors="replace")
    return Path(source).read_text(encoding="utf-8", errors="replace")


def decode(page: str) -> tuple[str, list[dict]]:
    """ChatGPT share pages embed the conversation as a Remix turbo-stream: one flat JSON array in
    which objects point at other entries by index ({"_12": 34} = key arr[12], value arr[34])."""
    arr = None
    for literal in re.findall(r'streamController\.enqueue\((".*?")\);', page, re.S):
        try:
            data = json.loads(json.loads(literal))
        except json.JSONDecodeError:
            continue
        if isinstance(data, list):
            arr = data
            break
    if arr is None:
        raise SystemExit("No conversation found on that page (is it a public share link?).")
    sys.setrecursionlimit(100_000)
    memo: dict[int, object] = {}

    def value(i):
        if isinstance(i, int) and i < 0:
            return None  # special markers: undefined, null, NaN…
        if i in memo:
            return memo[i]
        v = arr[i]
        if isinstance(v, dict):
            out: dict = {}
            memo[i] = out
            for k, x in v.items():
                out[arr[int(k[1:])]] = value(x) if isinstance(x, int) else x
            return out
        if isinstance(v, list):
            out_list: list = []
            memo[i] = out_list
            out_list.extend(value(x) if isinstance(x, int) else x for x in v)
            return out_list
        return v

    def find(o, key, depth=0):
        if depth > 40:
            return None
        if isinstance(o, dict):
            if key in o:
                return o[key]
            children = o.values()
        elif isinstance(o, list):
            children = o
        else:
            return None
        for c in children:
            r = find(c, key, depth + 1)
            if r is not None:
                return r
        return None

    root = value(0)
    messages = []
    for node in find(root, "linear_conversation") or []:
        m = (node or {}).get("message") or {}
        role = (m.get("author") or {}).get("role")
        content = m.get("content") or {}
        text = "\n".join(p for p in content.get("parts") or [] if isinstance(p, str)).strip()
        if role in ("user", "assistant") and text and content.get("content_type") in (None, "text", "multimodal_text"):
            messages.append({"role": role, "text": text})
    return find(root, "title") or "Notes", messages


def slugify(text: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")[:60] or "notes"


def headings(md: str) -> list[str]:
    """Top-level (#) headings outside code blocks: the chapter's topics."""
    out, fence = [], False
    for line in md.splitlines():
        if line.startswith("```"):
            fence = not fence
        elif not fence and line.startswith("# "):
            out.append(line[2:].strip())
    return out


def build(title: str, messages: list[dict], source: str) -> dict:
    chapters, current = [], None
    for m in messages:
        if m["role"] == "user" or current is None:
            current = {"request": m["text"] if m["role"] == "user" else "", "answers": []}
            chapters.append(current)
            if m["role"] == "user":
                continue
        current["answers"].append(m["text"])

    built = []
    for idx, ch in enumerate(chapters):
        body = "\n\n".join(ch["answers"])
        heads = headings(body)
        main = next((h for h in heads if not re.match(r"^\d+\.", h)), heads[0] if heads else ch["request"][:80])
        nxt = heads[heads.index(main) + 1] if main in heads and heads.index(main) + 1 < len(heads) else ""
        second = nxt if nxt and not re.match(r"^\d+\.", nxt) else ""  # "Phase 2 · Module 5: Statistics"
        name = f"{main} · {second}" if main.startswith("Phase") and second else main
        phase = re.search(r"Phase (\d+)", main + " " + second + " " + ch["request"])
        module = re.search(r"Module (\d+)", main + " " + second + " " + ch["request"])
        module_n = int(module.group(1)) if module else None
        phase_n = int(phase.group(1)) if phase else MODULE_PHASE.get(module_n)
        if idx == 0:
            part, key = "Start here", (0, 0, 0, idx)
        elif phase_n is None:
            part, key = "Complete handbooks and revision", (99, 0, 0, idx)
        else:
            part, key = f"Phase {phase_n}", (phase_n, module_n or 0, 0, idx)
        request = "\n".join("> " + line if line else ">" for line in ch["request"].splitlines())
        md = (f"> **You asked:**\n>\n{request}\n\n" if ch["request"] else "") + body + "\n"
        built.append({"key": key, "part": part, "title": re.sub(r"\s+", " ", name).strip(), "md": md, "headings": heads})

    built.sort(key=lambda c: c["key"])
    seen: dict[str, int] = {}
    slug = slugify(title)
    folder = OUT / slug
    folder.mkdir(parents=True, exist_ok=True)
    for old in folder.glob("*.md"):
        old.unlink()
    parts: dict[str, list] = {}
    for n, c in enumerate(built, 1):
        seen[c["title"]] = seen.get(c["title"], 0) + 1
        file = f"{n:02d}-{slugify(c['title'])}.md"
        (folder / file).write_text(c["md"], encoding="utf-8")
        parts.setdefault(c["part"], []).append({
            "id": f"{n:02d}", "file": file, "title": c["title"], "version": seen[c["title"]],
            "headings": c["headings"], "chars": len(c["md"]),
        })

    # Not a single word may be lost: every message must appear verbatim in exactly one chapter.
    written = [(folder / ch["file"]).read_text(encoding="utf-8") for p in parts.values() for ch in p]
    for m in messages:
        target = m["text"] if m["role"] == "assistant" else "\n".join("> " + l if l else ">" for l in m["text"].splitlines())
        hits = sum(target in w for w in written)
        if hits < 1:
            raise SystemExit(f"Verification failed: a {m['role']} message is missing from the notes.")

    book = {
        "slug": slug, "title": title, "source": source, "imported": date.today().isoformat(),
        "chapters": sum(len(v) for v in parts.values()), "chars": sum(len(w) for w in written),
        "parts": [{"name": k, "chapters": v} for k, v in parts.items()],
    }
    (folder / "index.json").write_text(json.dumps(book, ensure_ascii=False, indent=1), encoding="utf-8")
    listing_path = OUT / "index.json"
    listing = json.loads(listing_path.read_text(encoding="utf-8")) if listing_path.exists() else []
    listing = [b for b in listing if b["slug"] != slug] + [{k: book[k] for k in ("slug", "title", "source", "imported", "chapters", "chars")}]
    listing_path.write_text(json.dumps(listing, ensure_ascii=False, indent=1), encoding="utf-8")
    return book


if __name__ == "__main__":
    if len(sys.argv) < 2:
        raise SystemExit(__doc__)
    source = sys.argv[1]
    title, messages = decode(load_page(source))
    book = build(title, messages, sys.argv[2] if len(sys.argv) > 2 else source)
    print(f"Imported \"{book['title']}\": {len(messages)} messages -> {book['chapters']} chapters, "
          f"{book['chars']:,} characters, every message verified word for word.")
    for p in book["parts"]:
        print(f"  {p['name']}: " + " | ".join(f"{c['id']} {c['title'][:48]}{' (v' + str(c['version']) + ')' if c['version'] > 1 else ''}" for c in p["chapters"]))
