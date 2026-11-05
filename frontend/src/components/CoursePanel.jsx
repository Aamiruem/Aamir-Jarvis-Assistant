import { useEffect, useMemo, useRef, useState } from 'react';
import { api } from '../api.js';
import { Icon } from '../icons.jsx';
import { toast } from '../ui.jsx';
import MarkdownView from './MarkdownView.jsx';

// A YouTube course (frontend/public/courses, made by scripts/import_youtube_course.py): every
// lecture in order with the video, its chapters, code links and description, your own notes
// and notes written by Azarvis with the master prompt (saved to your account as user notes).

const loadCourse = async (slug) => {
  const r = await fetch(`/courses/${slug}/course.json`);
  if (!r.ok) throw new Error(`Couldn't load the course (${r.status})`);
  return r.json();
};
const mmss = (s) => {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return h ? `${h}:${String(m).padStart(2, '0')}:${String(Math.floor(s % 60)).padStart(2, '0')}` : `${m}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
};
const length = (s) => (s >= 3600 ? `${Math.floor(s / 3600)} h ${Math.round((s % 3600) / 60)} min` : `${Math.round(s / 60)} min`);
const watchedKey = (slug) => `jarvis-course-watched:${slug}`;
const readWatched = (slug) => {
  try {
    return new Set(JSON.parse(localStorage.getItem(watchedKey(slug))) || []);
  } catch {
    return new Set();
  }
};
const MINE = (id) => `campusx:${id}`; // user-note categories (≤ 40 characters)
const AZARVIS = (id) => `campusx-ai:${id}`;

function LectureNotes({ course, lecture, notes, onSaved }) {
  const mine = notes.find((n) => n.category === MINE(lecture.id));
  const ai = notes.find((n) => n.category === AZARVIS(lecture.id));
  const [draft, setDraft] = useState(mine?.content || '');
  const [saving, setSaving] = useState(false);
  const [job, setJob] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => {
    setDraft(mine?.content || '');
    setJob(null);
    setError('');
  }, [lecture.id, mine?.content]);

  const saveMine = async () => {
    if (!draft.trim()) return;
    setSaving(true);
    try {
      const title = `#${lecture.n} ${lecture.title}`.slice(0, 140);
      if (mine) await api.updateUserNote(mine._id || mine.id, { content: draft });
      else await api.addUserNote(title, draft, MINE(lecture.id));
      toast('Your notes are saved');
      onSaved();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const makeNotes = async () => {
    setError('');
    try {
      const started = await api.makeStudyNotes({
        topic: lecture.title,
        lecture: { n: lecture.n, title: lecture.full_title || lecture.title, course: course.title, description: (lecture.description || '').slice(0, 8000) },
        context: draft,
      });
      setJob(started);
      for (;;) {
        await new Promise((r) => setTimeout(r, 2000));
        const j = await api.studyNotesJob(started.id);
        setJob(j);
        if (j.status === 'failed') throw new Error(j.error || 'Azarvis could not write the notes.');
        if (j.status === 'done') {
          const title = `Azarvis notes · #${lecture.n} ${lecture.title}`.slice(0, 140);
          if (ai) await api.updateUserNote(ai._id || ai.id, { content: j.result.markdown });
          else await api.addUserNote(title, j.result.markdown, AZARVIS(lecture.id));
          toast('Azarvis wrote your notes');
          onSaved();
          setJob(null);
          return;
        }
      }
    } catch (e) {
      setError(e.message);
      setJob(null);
    }
  };

  return (
    <div className="lecture-notes">
      <section>
        <h4><Icon name="edit" size="1em" /> My notes</h4>
        <textarea
          rows={6}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="What you learned in this lecture, questions, code you want to remember… Azarvis uses these when it writes notes."
          aria-label="My notes for this lecture"
        />
        <div className="row wrap">
          <button className="btn sm" onClick={saveMine} disabled={saving || !draft.trim()}><Icon name="check" size="1em" /> {saving ? 'Saving…' : 'Save my notes'}</button>
          <span className="muted small">Saved to your account (also in the dashboard's Notes).</span>
        </div>
      </section>
      <section>
        <h4><Icon name="sparkles" size="1em" /> Notes by Azarvis</h4>
        <p className="muted small">
          Complete study notes for this lecture's topic with your master prompt: concepts basic → advanced, code with dry runs,
          mistakes, exercises, interview questions, a cheat sheet and a quiz. Azarvis can't watch the video, so they're built from
          the title, the description and your notes.
        </p>
        {job ? (
          <div className="progress-card">
            <div className="row"><span className="grow">{job.message || 'Starting…'}</span><span className="progress-pct">{job.progress ?? 0}%</span></div>
            <div className="progress"><i style={{ width: `${job.progress ?? 2}%` }} /></div>
          </div>
        ) : (
          <button className="btn primary sm" onClick={makeNotes}>
            <Icon name="sparkles" size="1em" /> {ai ? 'Write them again' : 'Make notes with Azarvis'}
          </button>
        )}
        {error && <p className="error">{error}</p>}
        {ai && !job && <MarkdownView source={ai.content} className="lecture-ai-notes" />}
      </section>
    </div>
  );
}

export default function CoursePanel({ slug = 'campusx-dsmp-2022-23', target }) {
  const [course, setCourse] = useState(null);
  const [error, setError] = useState('');
  const [current, setCurrent] = useState(1);
  const [start, setStart] = useState(0);
  const [query, setQuery] = useState('');
  const [section, setSection] = useState('all');
  const [watched, setWatched] = useState(() => readWatched(slug));
  const [notes, setNotes] = useState([]);
  const [showDescription, setShowDescription] = useState(false);
  const [freeOnly, setFreeOnly] = useState(false);
  const [tryPlayer, setTryPlayer] = useState(false); // members can still play locked lectures here
  const player = useRef(null);

  const loadNotes = () => api.userNotes().then(setNotes).catch(() => {});
  useEffect(() => {
    loadCourse(slug).then(setCourse).catch((e) => setError(e.message));
    loadNotes();
  }, [slug]);
  useEffect(() => {
    if (target?.lecture) setCurrent(target.lecture);
  }, [target]);

  const lecture = course?.lectures.find((l) => l.n === current);
  const shown = useMemo(() => {
    if (!course) return [];
    const q = query.trim().toLowerCase();
    return course.sections
      .filter((s) => section === 'all' || s.name === section)
      .map((s) => ({
        ...s,
        items: s.lectures
          .map((n) => course.lectures[n - 1])
          .filter((l) => !freeOnly || !l.members_only)
          .filter((l) => !q || `${l.n} ${l.title} ${l.chapters.map((c) => c.title).join(' ')}`.toLowerCase().includes(q)),
      }))
      .filter((s) => s.items.length);
  }, [course, query, section, freeOnly]);

  const open = (n, at = 0) => {
    setCurrent(n);
    setStart(at);
    setShowDescription(false);
    setTryPlayer(false);
    player.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  const toggleWatched = () => {
    const next = new Set(watched);
    next.has(lecture.n) ? next.delete(lecture.n) : next.add(lecture.n);
    setWatched(next);
    try {
      localStorage.setItem(watchedKey(slug), JSON.stringify([...next]));
    } catch {}
  };

  if (error) return <p className="error">{error}</p>;
  if (!course) return <p className="muted">Loading the course…</p>;
  const noted = new Set(notes.filter((n) => /^campusx(-ai)?:/.test(n.category || '')).map((n) => n.category.split(':')[1]));

  return (
    <div className="course">
      <header className="course-head">
        <span className="badge-icon lg" style={{ '--hue': 0 }}><Icon name="youtube" /></span>
        <div className="grow">
          <h3>{course.title}</h3>
          <p className="muted">
            {course.channel} · {course.count} lectures · {course.hours} hours · {watched.size} watched
          </p>
          <div className="progress"><i style={{ width: `${(watched.size / course.count) * 100}%` }} /></div>
        </div>
        <a className="btn sm" href={course.url} target="_blank" rel="noopener noreferrer"><Icon name="youtube" size="1em" /> Playlist</a>
      </header>

      <div className="course-layout">
        <aside className="course-list">
          <label className="side-search">
            <Icon name="search" size="1em" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search lectures and chapters" aria-label="Search lectures" />
          </label>
          <select value={section} onChange={(e) => setSection(e.target.value)} aria-label="Section">
            <option value="all">All sections</option>
            {course.sections.map((s) => <option key={s.name} value={s.name}>{s.name} ({s.lectures.length})</option>)}
          </select>
          <label className="check-row course-free">
            <input type="checkbox" checked={freeOnly} onChange={(e) => setFreeOnly(e.target.checked)} />
            Only lectures that play for free ({course.lectures.filter((l) => !l.members_only).length})
          </label>
          <div className="course-items">
            {shown.map((s) => (
              <div key={s.name}>
                <div className="conv-group-title">{s.name}</div>
                {s.items.map((l) => (
                  <button key={l.n} className={`course-item ${l.n === current ? 'active' : ''}`} onClick={() => open(l.n)} title={l.full_title}>
                    <span className="course-num">{watched.has(l.n) ? <Icon name="check" size="0.95em" /> : l.n}</span>
                    <span className="grow">
                      {l.title}
                      <small className="muted">{length(l.duration)}{l.members_only ? ' · members' : ''}{noted.has(l.id) ? ' · notes' : ''}</small>
                    </span>
                  </button>
                ))}
              </div>
            ))}
            {shown.length === 0 && <p className="muted conv-empty">No lecture matches.</p>}
          </div>
        </aside>

        {lecture && (
          <article className="lecture" ref={player}>
            {lecture.members_only && !tryPlayer ? (
              <div className="video locked">
                <div className="locked-card">
                  <span className="badge-icon lg" style={{ '--hue': 38 }}><Icon name="key" /></span>
                  <h4>CampusX members-only lecture</h4>
                  <p>
                    This session is part of CampusX's paid mentorship program. Join the CampusX channel membership on YouTube
                    (or the course on their website), then sign in to YouTube in this browser and it plays right here.
                  </p>
                  <div className="row wrap">
                    <a className="btn primary sm" href={`https://www.youtube.com/watch?v=${lecture.id}`} target="_blank" rel="noopener noreferrer"><Icon name="youtube" size="1em" /> Join or watch on YouTube</a>
                    <a className="btn sm" href="https://learnwith.campusx.in/" target="_blank" rel="noopener noreferrer"><Icon name="globe" size="1em" /> CampusX courses</a>
                    <button className="btn sm ghost" onClick={() => setTryPlayer(true)}>I'm a member: play here</button>
                  </div>
                  <p className="muted small">Meanwhile, “Make notes with Azarvis” below writes complete notes on this lecture's topic.</p>
                </div>
              </div>
            ) : (
            <div className="video">
              <iframe
                key={`${lecture.id}-${start}`}
                src={`https://www.youtube-nocookie.com/embed/${lecture.id}?rel=0${start ? `&start=${start}&autoplay=1` : ''}`}
                title={lecture.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                referrerPolicy="strict-origin-when-cross-origin"
              />
            </div>
            )}
            <div className="lecture-head">
              <div className="grow">
                <small className="muted">Lecture {lecture.n} of {course.count} · {lecture.section} · {length(lecture.duration)}</small>
                <h3>{lecture.title}</h3>
              </div>
              <button className={`btn sm ${watched.has(lecture.n) ? '' : 'primary'}`} onClick={toggleWatched}>
                <Icon name="check" size="1em" /> {watched.has(lecture.n) ? 'Watched' : 'Mark watched'}
              </button>
              <a className="btn sm" href={`https://www.youtube.com/watch?v=${lecture.id}`} target="_blank" rel="noopener noreferrer"><Icon name="youtube" size="1em" /> YouTube</a>
            </div>
            <div className="row wrap">
              <button className="btn sm" disabled={current <= 1} onClick={() => open(current - 1)}><Icon name="chevron" size="1em" className="flip" /> Previous</button>
              <button className="btn sm" disabled={current >= course.count} onClick={() => open(current + 1)}>Next <Icon name="chevron" size="1em" /></button>
            </div>

            {lecture.code.length > 0 && (
              <section className="lecture-code">
                <h4><Icon name="file" size="1em" /> Code and material from the description</h4>
                <ul>{lecture.code.map((u) => <li key={u}><a href={u} target="_blank" rel="noopener noreferrer">{u.replace(/^https?:\/\//, '').slice(0, 70)}</a></li>)}</ul>
              </section>
            )}
            {lecture.chapters.length > 0 && (
              <section>
                <h4><Icon name="timeline" size="1em" /> What this lecture covers ({lecture.chapters.length} chapters)</h4>
                <ol className="lecture-chapters">
                  {lecture.chapters.map((c, i) => (
                    <li key={i}><button onClick={() => open(lecture.n, Math.floor(c.start || 0))}><time>{mmss(c.start || 0)}</time> {c.title}</button></li>
                  ))}
                </ol>
              </section>
            )}
            {lecture.description && (
              <section>
                <button className="btn sm ghost" onClick={() => setShowDescription((v) => !v)}><Icon name="book" size="1em" /> {showDescription ? 'Hide' : 'Show'} the video description</button>
                {showDescription && <pre className="lecture-description">{lecture.description}</pre>}
              </section>
            )}
            <LectureNotes course={course} lecture={lecture} notes={notes} onSaved={loadNotes} />
          </article>
        )}
      </div>
    </div>
  );
}
