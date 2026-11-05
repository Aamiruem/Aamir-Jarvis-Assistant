"""Import a YouTube playlist as a course for Jarvis's Notes tab (lectures, descriptions, code links, chapters).

    pip install yt-dlp
    python scripts/import_youtube_course.py "https://www.youtube.com/playlist?list=<id>" [slug]
    python scripts/import_youtube_course.py --from playlist.json details.json [slug]   # already fetched

Only public information is read: titles, durations, descriptions and chapter timestamps. Videos
are never downloaded, and members-only lectures are listed (they play on YouTube for members) but
their details aren't fetched. Writes frontend/public/courses/<slug>/course.json and lists it in
frontend/public/courses/index.json.
"""
import json
import re
import sys
import time
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "frontend" / "public" / "courses"

# Section by title, in teaching order. The first matching rule wins; Python is the fallback for the
# opening weeks, machine learning for the rest.
SECTIONS = [
    ("Tasks, doubts and interview prep", r"task \d+|solutions|doubt|interview questions|interview prep|career qna"),
    ("Career and program updates", r"career pe charcha|resume|linkedin|portfolio website|soft skills|schedule|feedback form|website launch|program improvements|guest session|github profile|mentorship program 2023$|chatgpt"),
    ("Capstone project", r"capstone"),
    ("SQL, databases and Tableau", r"\bsql\b|database|tableau|stored procedure|transactions|views and user"),
    ("Statistics and probability", r"statistic|probability|distribution|central limit|confidence interval|hypothesis|chi square|anova|maximum likelihood"),
    ("Maths for machine learning", r"linear algebra|matri|calculus|optimization|eigen|singular value|vectors"),
    ("Data visualization and dashboards", r"matplotlib|seaborn|plotly|\bdash\b|dashboard"),
    ("Data analysis process", r"data gathering|assessing|cleaning|exploratory|\beda\b|web scraping|etl"),
    ("NumPy and Pandas", r"numpy|pandas|series|dataframe|groupby|merging|multiindex|vectorized string"),
    ("Tools: web apps, Git and deployment", r"flask|streamlit|\bgit\b|github|open source|gui development|heroku"),
]
CODE_HOSTS = ("colab.research.google.com", "github.com", "drive.google.com", "docs.google.com", "kaggle.com", "gist.github.com")


def clean_title(title: str) -> str:
    t = re.sub(r"\s*\|\s*(CampusX\s*)?(Data Science Mentorship Program|DSMP)[^|]*", "", title, flags=re.I)
    t = re.sub(r"\s*\|\s*(Paid (Members?|Session|Recordings?|Zoom Session|recording)|Free Session|Recorded Session|Friday Paid Session|Paid Member Recording)\b", "", t, flags=re.I)
    t = re.sub(r"\s*\|\s*(\d{1,2}(st|nd|rd|th) \w+ \d{4}|CampusX)\s*$", "", t)
    return re.sub(r"\s{2,}", " ", t).strip(" |-") or title


def section_for(n: int, title: str) -> str:
    low = title.lower()
    for name, pattern in SECTIONS:
        if re.search(pattern, low):
            return name
    return "Python programming" if n <= 40 else "Machine learning"


def code_links(description: str) -> list[str]:
    urls = re.findall(r"https?://[^\s)>\]]+", description or "")
    return list(dict.fromkeys(u.rstrip(".,") for u in urls if any(h in u for h in CODE_HOSTS)))


def fetch(url: str):
    import yt_dlp

    with yt_dlp.YoutubeDL({"extract_flat": "in_playlist", "quiet": True}) as ydl:
        info = ydl.extract_info(url, download=False)
    playlist = {"title": info.get("title"), "channel": info.get("channel") or info.get("uploader"), "id": info.get("id"),
                "entries": [{"n": i + 1, "id": e["id"], "title": e.get("title"), "duration": e.get("duration")} for i, e in enumerate(info["entries"])]}
    details = {}
    for e in playlist["entries"]:
        time.sleep(3)  # YouTube asks "are you a bot?" when requests come too fast
        try:
            with yt_dlp.YoutubeDL({"quiet": True, "no_warnings": True}) as ydl:
                v = ydl.extract_info(f"https://www.youtube.com/watch?v={e['id']}", download=False)
            details[e["id"]] = {"description": v.get("description") or "", "upload_date": v.get("upload_date"),
                                "chapters": [{"start": c.get("start_time"), "title": c.get("title")} for c in v.get("chapters") or []]}
        except Exception as err:
            details[e["id"]] = {"description": "", "chapters": [], "error": str(err)[:200]}
    return playlist, details


def build(playlist: dict, details: dict, slug: str) -> dict:
    lectures = []
    for e in playlist["entries"]:
        d = details.get(e["id"], {})
        err = d.get("error", "")
        lectures.append({
            "n": e["n"], "id": e["id"], "title": clean_title(e["title"] or ""), "full_title": e["title"],
            "duration": e.get("duration") or 0, "section": section_for(e["n"], e["title"] or ""),
            "members_only": "members" in err.lower() or "join this channel" in err.lower(),
            "description": d.get("description", ""), "code": code_links(d.get("description", "")),
            "chapters": [c for c in d.get("chapters", []) if c.get("title")],
            "uploaded": d.get("upload_date"),
        })
    order = [name for name, _ in SECTIONS]
    order = ["Python programming", "NumPy and Pandas", "Data visualization and dashboards", "Data analysis process",
             "SQL, databases and Tableau", "Statistics and probability", "Maths for machine learning", "Machine learning",
             "Capstone project", "Tools: web apps, Git and deployment", "Tasks, doubts and interview prep", "Career and program updates"]
    sections = [{"name": s, "lectures": [l["n"] for l in lectures if l["section"] == s]} for s in order]
    course = {
        "slug": slug, "title": playlist["title"], "channel": playlist.get("channel"),
        "url": f"https://www.youtube.com/playlist?list={playlist['id']}", "imported": date.today().isoformat(),
        "count": len(lectures), "hours": round(sum(l["duration"] for l in lectures) / 3600, 1),
        "sections": [s for s in sections if s["lectures"]], "lectures": lectures,
    }
    folder = OUT / slug
    folder.mkdir(parents=True, exist_ok=True)
    (folder / "course.json").write_text(json.dumps(course, ensure_ascii=False), encoding="utf-8")
    listing_path = OUT / "index.json"
    listing = json.loads(listing_path.read_text(encoding="utf-8")) if listing_path.exists() else []
    summary = {k: course[k] for k in ("slug", "title", "channel", "url", "imported", "count", "hours")}
    listing_path.write_text(json.dumps([c for c in listing if c["slug"] != slug] + [summary], ensure_ascii=False, indent=1), encoding="utf-8")
    return course


if __name__ == "__main__":
    args = sys.argv[1:]
    if not args:
        raise SystemExit(__doc__)
    if args[0] == "--from":
        playlist = json.loads(Path(args[1]).read_text(encoding="utf-8"))
        details = json.loads(Path(args[2]).read_text(encoding="utf-8"))
        slug = args[3] if len(args) > 3 else "course"
    else:
        playlist, details = fetch(args[0])
        slug = args[1] if len(args) > 1 else "course"
    c = build(playlist, details, slug)
    with_details = sum(1 for l in c["lectures"] if l["description"])
    print(f"{c['title']}: {c['count']} lectures, {c['hours']} hours, {with_details} with descriptions, "
          f"{sum(1 for l in c['lectures'] if l['members_only'])} members-only, "
          f"{sum(len(l['chapters']) for l in c['lectures'])} chapter marks, {sum(len(l['code']) for l in c['lectures'])} code links")
    for s in c["sections"]:
        print(f"  {s['name']}: {len(s['lectures'])}")
