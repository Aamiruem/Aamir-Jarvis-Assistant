import { useEffect, useMemo, useRef, useState } from 'react';
import { api } from '../api.js';
import { Icon } from '../icons.jsx';
import {
  cardMarks,
  chaptersOf,
  loadBook,
  loadChapter,
  loadLibrary,
  markCard,
  practiceCards,
  readChapters,
  searchText,
  setChapterRead,
  slug,
} from '../notes.js';
import { EmptyState, PageHeader, toast } from '../ui.jsx';
import MarkdownView from './MarkdownView.jsx';

// Notes: your study notes, word for word and in syllabus order, to read and practice.
// target: { chapter, heading } from the search palette.

const readSize = () => {
  try {
    return Number(localStorage.getItem('jarvis-notes-size')) || 16;
  } catch {
    return 16;
  }
};

function Practice({ book, chapter, text }) {
  const cards = useMemo(() => practiceCards(text), [text]);
  const [marks, setMarks] = useState(() => cardMarks(book, chapter.id));
  const [index, setIndex] = useState(0);
  const [shown, setShown] = useState(false);
  // Not-yet-known cards first, then the ones marked "review again", known ones last.
  const order = useMemo(() => {
    const rank = (c) => (marks[c.id] === 'known' ? 2 : marks[c.id] === 'review' ? 1 : 0);
    return [...cards].sort((a, b) => rank(a) - rank(b) || a.id - b.id);
  }, [cards]);
  useEffect(() => {
    setMarks(cardMarks(book, chapter.id));
    setIndex(0);
    setShown(false);
  }, [chapter.id]);

  if (!cards.length) return <EmptyState icon="tasks" title="No practice cards in this chapter">Pick another chapter, or read this one.</EmptyState>;
  const known = cards.filter((c) => marks[c.id] === 'known').length;
  const card = order[index % order.length];
  const mark = (m) => {
    setMarks(markCard(book, chapter.id, card.id, m));
    setShown(false);
    setIndex((i) => i + 1);
  };
  return (
    <div className="practice">
      <div className="progress-card">
        <div className="row">
          <span className="grow">Practice: {chapter.title}</span>
          <span className="progress-pct">{known}/{cards.length}</span>
        </div>
        <div className="progress"><i style={{ width: `${(known / cards.length) * 100}%` }} /></div>
      </div>
      <article className="flashcard">
        <small className="muted">Card {(index % order.length) + 1} of {order.length}{marks[card.id] === 'review' ? ' · marked for review' : marks[card.id] === 'known' ? ' · you knew this' : ''}</small>
        <h3>{card.title}</h3>
        {!shown ? (
          <>
            <p className="muted">Explain this in your own words (out loud or on paper), then check against your notes.</p>
            <button className="btn primary" onClick={() => setShown(true)}><Icon name="eye" size="1em" /> Show the answer</button>
          </>
        ) : (
          <>
            <MarkdownView source={card.body} className="flashcard-answer" />
            <div className="flashcard-actions">
              <button className="btn" onClick={() => mark('review')}><Icon name="refresh" size="1em" /> Review again</button>
              <button className="btn primary" onClick={() => mark('known')}><Icon name="check" size="1em" /> I knew it</button>
            </div>
          </>
        )}
      </article>
    </div>
  );
}

export default function NotesPanel({ target }) {
  const [library, setLibrary] = useState(null);
  const [book, setBook] = useState(null);
  const [chapterId, setChapterId] = useState(null);
  const [text, setText] = useState('');
  const [mode, setMode] = useState('read');
  const [size, setSize] = useState(readSize);
  const [done, setDone] = useState(new Set());
  const [query, setQuery] = useState('');
  const [hits, setHits] = useState(null);
  const [searching, setSearching] = useState(false);
  const [teaching, setTeaching] = useState(null); // { done, total }
  const [error, setError] = useState('');
  const reader = useRef(null);
  const scrollTo = useRef(null);

  const chapters = useMemo(() => (book ? chaptersOf(book) : []), [book]);
  const chapter = chapters.find((c) => c.id === chapterId);
  const at = chapters.findIndex((c) => c.id === chapterId);

  useEffect(() => {
    loadLibrary()
      .then(async (lib) => {
        setLibrary(lib);
        if (lib.length) {
          const b = await loadBook(lib[0].slug);
          setBook(b);
          setDone(readChapters(b.slug));
          setChapterId(chaptersOf(b)[0]?.id);
        }
      })
      .catch((e) => setError(e.message));
  }, []);
  useEffect(() => {
    if (target?.chapter) {
      setChapterId(target.chapter);
      setMode('read');
      scrollTo.current = target.heading || null;
    }
  }, [target]);
  useEffect(() => {
    if (!book || !chapter) return;
    setText('');
    loadChapter(book.slug, chapter.file).then(setText).catch((e) => setError(e.message));
  }, [book, chapterId]);
  useEffect(() => {
    if (!text) return;
    requestAnimationFrame(() => {
      const el = scrollTo.current && document.getElementById(slug(scrollTo.current));
      if (el) el.scrollIntoView({ block: 'start' });
      else reader.current?.scrollTo?.({ top: 0 });
      scrollTo.current = null;
    });
  }, [text]);
  useEffect(() => {
    try {
      localStorage.setItem('jarvis-notes-size', String(size));
    } catch {}
  }, [size]);

  const open = (id, heading = null) => {
    scrollTo.current = heading;
    setChapterId(id);
    setHits(null);
  };
  const toggleDone = () => setDone(new Set(setChapterRead(book.slug, chapter.id, !done.has(chapter.id))));

  const runSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return setHits(null);
    setSearching(true);
    try {
      const texts = await Promise.all(chapters.map((c) => loadChapter(book.slug, c.file)));
      setHits(searchText(chapters, texts, query));
    } catch (err) {
      setError(err.message);
    } finally {
      setSearching(false);
    }
  };

  // Puts every chapter into the knowledge base, so Jarvis can answer from these notes in chat.
  const teach = async () => {
    if (!window.confirm(`Add all ${chapters.length} chapters to Jarvis's knowledge base? Jarvis will then answer from your notes in chat.`)) return;
    setTeaching({ done: 0, total: chapters.length });
    try {
      for (const [i, c] of chapters.entries()) {
        const body = await loadChapter(book.slug, c.file);
        await api.addTextDocument(`${book.title} · ${c.id}. ${c.title}`.slice(0, 200), body);
        setTeaching({ done: i + 1, total: chapters.length });
      }
      toast('Jarvis has learned your notes: ask about them in Chat');
    } catch (e) {
      setError(`Stopped at chapter ${teaching?.done ?? 0}: ${e.message}`);
    } finally {
      setTeaching(null);
    }
  };

  if (error && !book) return <div className="panel"><p className="error">{error}</p></div>;
  if (!library) return <div className="panel"><p className="muted">Loading notes…</p></div>;
  if (!library.length) {
    return (
      <div className="panel">
        <EmptyState icon="notes" title="No notes yet">Run <code>python scripts/import_notes.py &lt;ChatGPT share link&gt;</code> in the project folder.</EmptyState>
      </div>
    );
  }

  return (
    <div className="panel notes-panel">
      <PageHeader icon="notes" hue={45} title="Notes" subtitle={book ? `${book.title} · ${book.chapters} chapters · ${done.size} read` : ''}>
        <button className="btn sm" onClick={teach} disabled={Boolean(teaching) || !book} title="Add these notes to Jarvis's knowledge base">
          <Icon name="brain" size="1em" /> {teaching ? `Teaching Jarvis… ${teaching.done}/${teaching.total}` : 'Teach Jarvis these notes'}
        </button>
      </PageHeader>
      {error && <p className="error">{error}</p>}

      <div className="notes-bar">
        <form className="search-box" onSubmit={runSearch}>
          <Icon name="search" size="1em" />
          <input value={query} onChange={(e) => { setQuery(e.target.value); if (!e.target.value) setHits(null); }} placeholder="Search all notes (e.g. gradient descent)" aria-label="Search all notes" />
          {searching && <span className="muted small">…</span>}
        </form>
        <div className="segmented" role="tablist" aria-label="Mode">
          <button className={mode === 'read' ? 'active' : ''} onClick={() => setMode('read')} role="tab" aria-selected={mode === 'read'}><Icon name="book" size="1em" /> Read</button>
          <button className={mode === 'practice' ? 'active' : ''} onClick={() => setMode('practice')} role="tab" aria-selected={mode === 'practice'}><Icon name="tasks" size="1em" /> Practice</button>
        </div>
        <div className="segmented" aria-label="Text size">
          <button onClick={() => setSize((s) => Math.max(13, s - 1))} aria-label="Smaller text">A−</button>
          <button onClick={() => setSize((s) => Math.min(22, s + 1))} aria-label="Bigger text">A+</button>
        </div>
      </div>

      <div className="notes-layout">
        <nav className="notes-toc" aria-label="Chapters">
          <select className="notes-select" value={chapterId || ''} onChange={(e) => open(e.target.value)} aria-label="Chapter">
            {chapters.map((c) => (
              <option key={c.id} value={c.id}>{c.id}. {c.title}{c.version > 1 ? ` (version ${c.version})` : ''}</option>
            ))}
          </select>
          {book.parts.map((p) => (
            <div key={p.name} className="toc-part">
              <div className="conv-group-title">{p.name}</div>
              {p.chapters.map((c) => (
                <button key={c.id} className={`toc-item ${c.id === chapterId ? 'active' : ''}`} onClick={() => open(c.id)} title={c.title}>
                  <span className="toc-num">{done.has(c.id) ? <Icon name="check" size="0.95em" /> : c.id}</span>
                  <span className="toc-title">{c.title.replace(/^Phase \d+: [^·]+· /, '')}{c.version > 1 ? ' (v2)' : ''}</span>
                </button>
              ))}
            </div>
          ))}
        </nav>

        <div className="notes-main" ref={reader}>
          {hits ? (
            <div className="notes-hits">
              <div className="row"><strong className="grow">{hits.length === 60 ? '60+ matches' : `${hits.length} match${hits.length === 1 ? '' : 'es'}`} for “{query}”</strong><button className="btn sm" onClick={() => setHits(null)}>Close</button></div>
              {hits.length === 0 && <p className="muted">Nothing found. Try fewer or different words.</p>}
              <ul>
                {hits.map((h, i) => (
                  <li key={i}>
                    <button onClick={() => open(h.chapter.id, h.heading)}>
                      <strong>{h.heading}</strong>
                      <small className="muted">{h.chapter.id}. {h.chapter.title}</small>
                      <span>…{h.snippet}…</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : !chapter ? null : mode === 'practice' ? (
            text ? <Practice book={book.slug} chapter={chapter} text={text} /> : <p className="muted">Loading…</p>
          ) : (
            <article className="notes-article" style={{ '--notes-size': `${size}px` }}>
              <p className="notes-crumb muted">{chapter.part} · Chapter {chapter.id} of {chapters.length}</p>
              {text ? <MarkdownView source={text} /> : <p className="muted">Loading chapter…</p>}
              <footer className="notes-foot">
                <button className="btn" disabled={at <= 0} onClick={() => open(chapters[at - 1].id)}><Icon name="chevron" size="1em" className="flip" /> Previous</button>
                <button className={`btn ${done.has(chapter.id) ? '' : 'primary'}`} onClick={toggleDone}>
                  <Icon name="check" size="1em" /> {done.has(chapter.id) ? 'Read' : 'Mark as read'}
                </button>
                <button className="btn" onClick={() => setMode('practice')}><Icon name="tasks" size="1em" /> Practice</button>
                <button className="btn" disabled={at >= chapters.length - 1} onClick={() => open(chapters[at + 1].id)}>Next <Icon name="chevron" size="1em" /></button>
              </footer>
            </article>
          )}
        </div>
      </div>
    </div>
  );
}
