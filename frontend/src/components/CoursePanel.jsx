import { useEffect, useMemo, useRef, useState } from 'react';
import { api } from '../api.js';
import { Icon } from '../icons.jsx';
import { toast } from '../ui.jsx';
import MarkdownView from './MarkdownView.jsx';
import StudyNotesView from './StudyNotesView.jsx';

// CampusX notes (frontend/public/courses): every lecture of the course as a notes page, no videos.
// Each lecture has study notes (notes.json, written from its title and topic list), the topics it
// covers, its code links, your own notes and optional deeper notes by Azarvis (saved to your
// account). The CampusX notes book (public/notes/campusx-ml-244-lecture) is at the top of the list.

const getJson = async (url, what) => {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`Couldn't load ${what} (${r.status})`);
  return r.json();
};
const BOOK = 'campusx-ml-244-lecture';
const REVISE = /\n*\*\*Revise:\*\*[\s\S]*$/; // the "Revise: #12 …" line of a session note, shown as buttons
const readKey = (slug) => `jarvis-course-read:${slug}`;
const readRead = (slug) => {
  try {
    // Lectures marked "watched" before the videos were removed count as read.
    const saved = localStorage.getItem(readKey(slug)) ?? localStorage.getItem(`jarvis-course-watched:${slug}`);
    return new Set(JSON.parse(saved) || []);
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
        <h4><Icon name="sparkles" size="1em" /> Deeper notes by Azarvis</h4>
        <p className="muted small">
          Complete study notes for this lecture's topic in 13 sections: definitions, difficult words, concepts basic → advanced,
          diagrams, code at three levels with a dry run, real-world uses, exercises, interview questions, comparisons, a summary,
          a cheat sheet and a final test. Answers stay hidden until you ask. Built from the lecture's title, its topics and your notes.
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
        {ai && !job && <StudyNotesView markdown={ai.content} className="lecture-ai-notes" />}
      </section>
    </div>
  );
}

export default function CoursePanel({ slug = 'campusx-dsmp-2022-23', target }) {
  const [course, setCourse] = useState(null);
  const [studyNotes, setStudyNotes] = useState(null); // notes.json: { notes: {n: md}, kinds: {n: lesson|session}, basis }
  const [book, setBook] = useState(null); // the CampusX notes book index
  const [chapter, setChapter] = useState(null); // { file, title, md } while a book chapter is open
  const [error, setError] = useState('');
  const [current, setCurrent] = useState(1);
  const [query, setQuery] = useState('');
  const [section, setSection] = useState('all');
  const [lessonsOnly, setLessonsOnly] = useState(false);
  const [read, setRead] = useState(() => readRead(slug));
  const [notes, setNotes] = useState([]);
  const top = useRef(null);

  const loadNotes = () => api.userNotes().then(setNotes).catch(() => {});
  useEffect(() => {
    getJson(`/courses/${slug}/course.json`, 'the course').then(setCourse).catch((e) => setError(e.message));
    getJson(`/courses/${slug}/notes.json`, 'the study notes').then(setStudyNotes).catch(() => setStudyNotes({ notes: {}, kinds: {} }));
    getJson(`/notes/${BOOK}/index.json`, 'the notes book').then(setBook).catch(() => {});
    loadNotes();
  }, [slug]);
  useEffect(() => {
    if (target?.lecture) open(target.lecture);
  }, [target]);

  const lecture = course?.lectures.find((l) => l.n === current);
  const noteFor = (n) => studyNotes?.notes?.[String(n)] || '';
  const isLesson = (n) => studyNotes?.kinds?.[String(n)] === 'lesson';
  const shown = useMemo(() => {
    if (!course) return [];
    const q = query.trim().toLowerCase();
    return course.sections
      .filter((s) => section === 'all' || s.name === section)
      .map((s) => ({
        ...s,
        items: s.lectures
          .map((n) => course.lectures[n - 1])
          .filter((l) => !lessonsOnly || isLesson(l.n))
          .filter((l) => !q || `${l.n} ${l.title} ${l.chapters.map((c) => c.title).join(' ')} ${noteFor(l.n)}`.toLowerCase().includes(q)),
      }))
      .filter((s) => s.items.length);
  }, [course, studyNotes, query, section, lessonsOnly]);
  const chapters = useMemo(() => (book?.parts || []).flatMap((p) => p.chapters), [book]);

  const scrollUp = () => top.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  function open(n) {
    setChapter(null);
    setCurrent(n);
    scrollUp();
  }
  const openChapter = async (c) => {
    try {
      const r = await fetch(`/notes/${BOOK}/${c.file}`);
      if (!r.ok) throw new Error(`Couldn't load the chapter (${r.status})`);
      setChapter({ ...c, md: await r.text() });
      scrollUp();
    } catch (e) {
      toast(e.message, 'error');
    }
  };
  const toggleRead = () => {
    const next = new Set(read);
    next.has(lecture.n) ? next.delete(lecture.n) : next.add(lecture.n);
    setRead(next);
    try {
      localStorage.setItem(readKey(slug), JSON.stringify([...next]));
    } catch {}
  };

  if (error) return <p className="error">{error}</p>;
  if (!course) return <p className="muted">Loading the CampusX notes…</p>;
  const noted = new Set(notes.filter((n) => /^campusx(-ai)?:/.test(n.category || '')).map((n) => n.category.split(':')[1]));
  const lessonCount = Object.values(studyNotes?.kinds || {}).filter((k) => k === 'lesson').length;
  const md = lecture ? noteFor(lecture.n) : '';
  const revise = [...(md.match(REVISE)?.[0] || '').matchAll(/#lecture-(\d+)/g)].map((m) => Number(m[1]));
  const chapterIndex = chapter ? chapters.findIndex((c) => c.file === chapter.file) : -1;

  return (
    <div className="course course--notes">
      <header className="course-head">
        <span className="badge-icon lg" style={{ '--hue': 45 }}><Icon name="book" /></span>
        <div className="grow">
          <h3>CampusX Data Science notes</h3>
          <p className="muted">
            {course.count} lectures · {lessonCount} study notes{book ? ` · ${book.chapters}-chapter notes book` : ''} · {read.size} read
          </p>
          <div className="progress"><i style={{ width: `${(read.size / course.count) * 100}%` }} /></div>
        </div>
      </header>

      <div className="course-layout">
        <aside className="course-list">
          <label className="side-search">
            <Icon name="search" size="1em" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search lectures and notes" aria-label="Search lectures and notes" />
          </label>
          <select value={section} onChange={(e) => setSection(e.target.value)} aria-label="Section">
            <option value="all">All sections</option>
            {course.sections.map((s) => <option key={s.name} value={s.name}>{s.name} ({s.lectures.length})</option>)}
          </select>
          <label className="check-row course-free">
            <input type="checkbox" checked={lessonsOnly} onChange={(e) => setLessonsOnly(e.target.checked)} />
            Only lessons (hide task and update sessions)
          </label>
          <div className="course-items">
            {chapters.length > 0 && !query && section === 'all' && (
              <div>
                <div className="conv-group-title">Notes book · {book.title}</div>
                {chapters.map((c) => (
                  <button key={c.file} className={`course-item ${chapter?.file === c.file ? 'active' : ''}`} onClick={() => openChapter(c)}>
                    <span className="course-num"><Icon name="book" size="0.95em" /></span>
                    <span className="grow">{c.title.replace(/^Lecture \d+:\s*/, '')}<small className="muted">{c.headings?.length || 0} topics</small></span>
                  </button>
                ))}
              </div>
            )}
            {shown.map((s) => (
              <div key={s.name}>
                <div className="conv-group-title">{s.name}</div>
                {s.items.map((l) => (
                  <button key={l.n} className={`course-item ${!chapter && l.n === current ? 'active' : ''}`} onClick={() => open(l.n)} title={l.full_title}>
                    <span className="course-num">{read.has(l.n) ? <Icon name="check" size="0.95em" /> : l.n}</span>
                    <span className="grow">
                      {l.title}
                      <small className="muted">{isLesson(l.n) ? 'Study notes' : 'Session note'}{noted.has(l.id) ? ' · your notes' : ''}</small>
                    </span>
                  </button>
                ))}
              </div>
            ))}
            {shown.length === 0 && <p className="muted conv-empty">No lecture matches.</p>}
          </div>
        </aside>

        {chapter ? (
          <article className="lecture" ref={top}>
            <div className="lecture-head">
              <div className="grow">
                <small className="muted">{book.title} · chapter {chapterIndex + 1} of {chapters.length}</small>
                <h3>{chapter.title}</h3>
              </div>
            </div>
            <div className="row wrap">
              <button className="btn sm" disabled={chapterIndex <= 0} onClick={() => openChapter(chapters[chapterIndex - 1])}><Icon name="chevron" size="1em" className="flip" /> Previous chapter</button>
              <button className="btn sm" disabled={chapterIndex >= chapters.length - 1} onClick={() => openChapter(chapters[chapterIndex + 1])}>Next chapter <Icon name="chevron" size="1em" /></button>
            </div>
            <section className="lecture-study"><MarkdownView source={chapter.md} /></section>
          </article>
        ) : lecture && (
          <article className="lecture" ref={top}>
            <div className="lecture-head">
              <div className="grow">
                <small className="muted">Lecture {lecture.n} of {course.count} · {lecture.section}</small>
                <h3>{lecture.title}</h3>
              </div>
              <button className={`btn sm ${read.has(lecture.n) ? '' : 'primary'}`} onClick={toggleRead}>
                <Icon name="check" size="1em" /> {read.has(lecture.n) ? 'Read' : 'Mark as read'}
              </button>
            </div>
            <div className="row wrap">
              <button className="btn sm" disabled={current <= 1} onClick={() => open(current - 1)}><Icon name="chevron" size="1em" className="flip" /> Previous</button>
              <button className="btn sm" disabled={current >= course.count} onClick={() => open(current + 1)}>Next <Icon name="chevron" size="1em" /></button>
            </div>

            <section className="lecture-study">
              <h4><Icon name="notes" size="1em" /> {isLesson(lecture.n) ? 'Study notes' : 'About this session'}</h4>
              {md ? <MarkdownView source={md.replace(REVISE, '')} /> : <p className="muted">No notes for this lecture yet.</p>}
              {revise.length > 0 && (
                <div className="lecture-revise">
                  <strong>Revise</strong>
                  {revise.map((n) => <button key={n} className="chip" onClick={() => open(n)}>#{n} {course.lectures[n - 1]?.title}</button>)}
                </div>
              )}
              {studyNotes?.basis && isLesson(lecture.n) && <p className="muted small">{studyNotes.basis}</p>}
            </section>
            {lecture.chapters.length > 0 && (
              <section>
                <h4><Icon name="timeline" size="1em" /> Topics covered ({lecture.chapters.length})</h4>
                <ol className="lecture-topics">{lecture.chapters.map((c, i) => <li key={i}>{c.title}</li>)}</ol>
              </section>
            )}
            {lecture.code.length > 0 && (
              <section className="lecture-code">
                <h4><Icon name="file" size="1em" /> Code and material</h4>
                <ul>{lecture.code.map((u) => <li key={u}><a href={u} target="_blank" rel="noopener noreferrer">{u.replace(/^https?:\/\//, '').slice(0, 70)}</a></li>)}</ul>
              </section>
            )}
            <LectureNotes course={course} lecture={lecture} notes={notes} onSaved={loadNotes} />
          </article>
        )}
      </div>
    </div>
  );
}
