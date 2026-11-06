import { useMemo, useState } from 'react';
import { Icon } from '../icons.jsx';
import { slug } from '../notes.js';
import MarkdownView from './MarkdownView.jsx';

// Notes written with the master prompt: a menu of its numbered sections to jump between, and
// the final "Answers" section (exercise solutions + knowledge-test answers) kept hidden until
// asked for, so the exercises and the test can be tried first.

const ANSWERS = /^#{1,2}[ \t]+Answers\b.*$/gm;

/** Top-level headings, ignoring "#" lines inside code blocks (Python comments, ASCII diagrams). */
function sections(markdown) {
  const found = [];
  let fenced = false;
  for (const line of markdown.split('\n')) {
    if (/^\s*(```|~~~)/.test(line)) fenced = !fenced;
    else if (!fenced && /^# /.test(line)) {
      const text = line.slice(2).replace(/[*_`]/g, '').trim();
      if (text) found.push({ text, id: slug(text) });
    }
  }
  return found;
}

function split(markdown) {
  const matches = [...markdown.matchAll(ANSWERS)];
  const last = matches.at(-1);
  if (!last) return { body: markdown, answers: '' };
  return { body: markdown.slice(0, last.index).trimEnd(), answers: markdown.slice(last.index).trim() };
}

export default function StudyNotesView({ markdown, className = '' }) {
  const { body, answers } = useMemo(() => split(markdown), [markdown]);
  const menu = useMemo(() => sections(body), [body]);
  const [showAnswers, setShowAnswers] = useState(false);

  const jump = (id) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  return (
    <div className={`study-notes ${className}`}>
      {menu.length > 2 && (
        <nav className="study-notes-menu" aria-label="Sections of these notes">
          {menu.map((s) => (
            <button key={s.id} type="button" className="chip" onClick={() => jump(s.id)}>{s.text}</button>
          ))}
          {answers && <button type="button" className="chip" onClick={() => { setShowAnswers(true); requestAnimationFrame(() => jump('study-notes-answers')); }}>Answers</button>}
        </nav>
      )}
      <MarkdownView source={body} />
      {answers && (
        <section id="study-notes-answers" className="study-notes-answers">
          {showAnswers ? (
            <>
              <button type="button" className="btn sm" onClick={() => setShowAnswers(false)}><Icon name="x" size="1em" /> Hide answers</button>
              <MarkdownView source={answers} />
            </>
          ) : (
            <div className="row wrap">
              <span className="grow muted small">Try the exercises and the knowledge test first. The solutions and answers are here when you're ready.</span>
              <button type="button" className="btn primary sm" onClick={() => setShowAnswers(true)}><Icon name="check" size="1em" /> Show answers</button>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
