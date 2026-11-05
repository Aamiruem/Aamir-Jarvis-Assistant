import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { api, streamChat } from '../api.js';
import { Icon } from '../icons.jsx';
import { chaptersOf, loadBook, loadLibrary } from '../notes.js';
import { openUrl } from '../quickCommands.js';

// Rendered only when an inline answer is shown, so KaTeX and the Markdown renderer stay out
// of the main bundle until the search bar is actually used to ask a question.
const MarkdownView = lazy(() => import('./MarkdownView.jsx'));

// Ctrl+K (⌘K on Mac) or the search bar: one box for everything. Jump to a tab, run an action or an
// automation, find a chat, contact, task, memory, note (any chapter or heading), ML model or
// document, search Google or YouTube, or press Enter to ask Azarvis and read the answer right here
// (it answers general questions and writes code in Python, JavaScript, JSX and more).
const ACTIONS = [
  { icon: 'sparkles', label: 'Start Azarvis (greeting, reminders, voice)', run: (a) => a.startSession() },
  { icon: 'mic', label: 'Talk to Azarvis (hands-free voice)', run: (a) => a.ask('', false, true) },
  { icon: 'user', label: 'Tell Azarvis about yourself (quick interview)', run: (a) => a.startSession({ interview: true }) },
  { icon: 'plus', label: 'New chat', run: (a) => a.newChat() },
  { icon: 'alarm', label: 'Set a reminder…', run: (a) => a.ask('Remind me to ', false) },
  { icon: 'weather', label: "Today's weather", run: (a) => a.ask("What's the weather today?", true) },
  { icon: 'folder', label: 'Open Downloads folder', run: (a) => a.ask('open my downloads folder', true) },
  { icon: 'screenshot', label: 'Take a screenshot', run: (a) => a.ask('take a screenshot', true) },
  { icon: 'volume', label: 'Volume up', run: (a) => a.ask('volume up', true) },
  { icon: 'search', label: 'Open YouTube', run: (a) => a.ask('open youtube', true) },
  { icon: 'contacts', label: 'Add a contact', run: (a) => a.openContacts() },
  { icon: 'sun', label: 'Switch dark / light theme', run: (a) => a.toggleTheme() },
  { icon: 'briefcase', label: "Open Aamir's portfolio", keywords: 'portfolio website about aamir hussain azad', run: (a) => a.openPortfolio?.() },
  // inline: prefills the box so you can finish the request and get the answer right here.
  { icon: 'flask', label: 'Write code (Python, JS, JSX)…', keywords: 'program function react javascript python debug', inline: true, seed: 'Write code that ' },
  { icon: 'sun', label: 'Plan my day', keywords: 'automate schedule today', run: (a) => a.ask('Look at my tasks and reminders and plan my day: what to do first, what to follow up on, and what can wait.', true) },
  { icon: 'calendar', label: 'Weekly review', keywords: 'automate week', run: (a) => a.ask("Review my week: what I finished, what's still open, and the three things I should focus on next week.", true) },
  { icon: 'megaphone', label: 'Social media plan (Instagram, LinkedIn, YouTube)', keywords: 'automate post content', run: (a) => a.ask('Make a 7-day social media plan for me: for each day one Instagram post idea with a caption, one LinkedIn post idea and one YouTube video idea.', true) },
  { icon: 'mail', label: 'Write an email…', keywords: 'gmail draft', run: (a) => a.ask('Write an email to ', false) },
  { icon: 'eye', label: 'PC watcher: battery, disk, downloads alerts', keywords: 'monitor notifications automate', run: (a) => a.openTab('automate') },
  { icon: 'house', label: 'Predict a house price', keywords: 'ml lab machine learning', run: (a) => a.openTab('mllab') },
  { icon: 'upload', label: 'Train a model on a CSV', keywords: 'ml lab machine learning automl', run: (a) => a.openTab('mllab') },
  { icon: 'notes', label: 'Practice my notes (flashcards)', keywords: 'study revise interview', run: (a) => a.openTab('notes') },
  { icon: 'globe', label: 'Add a web page to Azarvis’s knowledge', keywords: 'portfolio url website learn', run: (a) => a.openTab('knowledge') },
  { icon: 'download', label: 'Install Azarvis as an app', keywords: 'pwa desktop phone', run: (a) => a.install?.() },
  { icon: 'share', label: 'Share Azarvis', keywords: 'link send', run: (a) => a.share?.() },
];

export default function CommandPalette({ open, initialQuery = '', onClose, tabs, conversations, actions }) {
  const [q, setQ] = useState('');
  const [sel, setSel] = useState(0);
  const [data, setData] = useState({ contacts: [], tasks: [], memories: [], models: [], documents: [], notes: [] });
  // answer: the inline reply from Azarvis. null when the palette is in its normal "list" mode.
  const [answer, setAnswer] = useState(null); // { q, text, tools:[], loading, error }
  const inputRef = useRef(null);
  const abortRef = useRef(null);

  const stopAnswer = () => {
    abortRef.current?.abort();
    abortRef.current = null;
  };

  // Ask Azarvis and stream the reply into the palette itself.
  const runAsk = (text) => {
    const question = (text ?? q).trim();
    if (!question) return;
    stopAnswer();
    const controller = new AbortController();
    abortRef.current = controller;
    setAnswer({ q: question, text: '', tools: [], loading: true, error: null });
    streamChat(
      question,
      null,
      (ev) => {
        if (controller.signal.aborted) return;
        setAnswer((a) => {
          if (!a) return a;
          if (ev.type === 'text') return { ...a, text: a.text + (ev.text || '') };
          if (ev.type === 'tool') return ev.name && !a.tools.includes(ev.name) ? { ...a, tools: [...a.tools, ev.name] } : a;
          if (ev.type === 'error') return { ...a, error: ev.message || 'Something went wrong.', loading: false };
          if (ev.type === 'done') return { ...a, loading: false };
          return a;
        });
      },
      controller.signal,
      { voice: false },
    ).catch((e) => {
      if (controller.signal.aborted) return;
      setAnswer((a) => (a ? { ...a, loading: false, error: e.message || String(e) } : a));
    });
  };

  const closeAnswer = () => {
    stopAnswer();
    setAnswer(null);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  useEffect(() => {
    if (!open) {
      stopAnswer();
      setAnswer(null);
      return;
    }
    setQ(initialQuery);
    setSel(0);
    setTimeout(() => inputRef.current?.focus(), 0);
    // Fresh copies each time it opens, so new contacts and tasks are searchable at once.
    const notes = loadLibrary().then((lib) => Promise.all(lib.map((b) => loadBook(b.slug)))).then((books) => books.flatMap(chaptersOf));
    Promise.allSettled([api.contacts(), api.tasks(true), api.memories(), api.mlModels(), api.documents(), notes]).then((r) => {
      const [contacts, tasks, memories, models, documents, chapters] = r.map((x) => (x.status === 'fulfilled' ? x.value : []));
      setData({ contacts, tasks, memories, models, documents, notes: chapters });
    });
  }, [open, initialQuery]);

  // Stop any in-flight answer when the palette unmounts.
  useEffect(() => () => stopAnswer(), []);

  const items = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const match = (s) => !needle || s.toLowerCase().includes(needle);
    const list = [
      ...tabs.filter((t) => match(t.label)).map((t) => ({ group: 'Go to', icon: t.icon, label: t.label, hint: `Alt+${t.key}`, run: () => actions.openTab(t.id) })),
      ...ACTIONS.filter((a) => match(`${a.label} ${a.keywords || ''}`)).map((a) =>
        a.inline
          ? { group: 'Actions', icon: a.icon, label: a.label, keepOpen: true, run: () => { setQ(a.seed); setSel(0); setTimeout(() => inputRef.current?.focus(), 0); } }
          : { group: 'Actions', ...a, run: () => a.run(actions) }),
      ...(needle ? data.contacts.filter((c) => [c.name, c.email, c.phone, c.company].some((v) => v && match(v))) : []).slice(0, 5).map((c) => ({
        group: 'Contacts', icon: 'contacts', label: c.name, hint: c.phone || c.email || '', run: () => actions.openContacts(c.name),
      })),
      ...conversations.filter((c) => needle && match(c.title)).slice(0, 5).map((c) => ({ group: 'Chats', icon: 'chat', label: c.title, run: () => actions.openConversation(c._id) })),
      ...(needle ? data.tasks.filter((t) => match(t.title)) : []).slice(0, 5).map((t) => ({
        group: 'Tasks', icon: t.done ? 'check' : 'tasks', label: t.title, hint: t.done ? 'done' : '', run: () => actions.openTab('tasks'),
      })),
      ...(needle ? data.memories.filter((m) => match(m.fact)) : []).slice(0, 3).map((m) => ({
        group: 'Memory', icon: 'brain', label: m.fact, run: () => actions.openTab('memory'),
      })),
    ];
    if (needle) {
      // Notes: chapter titles first, then any heading inside a chapter (opens right at it).
      const noteHits = [];
      for (const ch of data.notes) {
        if (match(ch.title)) noteHits.push({ ch, heading: null, label: `${ch.id}. ${ch.title}` });
        for (const h of ch.headings || []) if (match(h) && noteHits.length < 40) noteHits.push({ ch, heading: h, label: h, hint: `ch. ${ch.id}` });
      }
      list.push(...noteHits.slice(0, 8).map((n) => ({ group: 'Notes', icon: 'notes', label: n.label, hint: n.hint || '', run: () => actions.openNotes(n.ch.id, n.heading) })));
      list.push(...data.models.filter((m) => match(`${m.name} ${m.target} ${m.best}`)).slice(0, 3).map((m) => ({
        group: 'ML models', icon: 'flask', label: m.name, hint: m.best, run: () => actions.openTab('mllab'),
      })));
      list.push(...data.documents.filter((d) => match(d.source || d.name || '')).slice(0, 3).map((d) => ({
        group: 'Documents', icon: 'file', label: d.source || d.name, run: () => actions.openTab('knowledge'),
      })));
      const text = q.trim();
      list.push(
        // keepOpen: answer right here instead of leaving the palette.
        { group: 'Ask Azarvis', icon: 'sparkles', label: `“${text}”`, hint: 'Enter', keepOpen: true, run: () => runAsk(text) },
        { group: 'Ask Azarvis', icon: 'chat', label: 'Open this in a full chat', run: () => actions.ask(text, true) },
        { group: 'Search the web', icon: 'globe', label: `Google: ${text}`, run: () => openUrl(`https://www.google.com/search?q=${encodeURIComponent(text)}`) },
        { group: 'Search the web', icon: 'youtube', label: `YouTube: ${text}`, run: () => openUrl(`https://www.youtube.com/results?search_query=${encodeURIComponent(text)}`) },
      );
    }
    return list;
    // runAsk is stable enough for this memo; q drives it directly when chosen.
  }, [q, tabs, conversations, actions, data]);

  if (!open) return null;

  const choose = (item) => {
    if (!item) return;
    if (item.keepOpen) {
      item.run(); // e.g. Ask Azarvis: stream the answer in place
      return;
    }
    onClose();
    item.run();
  };
  const onKey = (e) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      if (answer) closeAnswer(); // first Esc: back to the list; next Esc: close the palette
      else onClose();
    } else if (e.key === 'ArrowDown') { e.preventDefault(); setSel((s) => Math.min(s + 1, items.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setSel((s) => Math.max(s - 1, 0)); }
    else if (e.key === 'Enter') {
      e.preventDefault();
      // With text typed and nothing better highlighted, Enter asks Azarvis right here.
      choose(items[sel] ?? items.find((it) => it.group === 'Ask Azarvis'));
    }
  };

  let lastGroup = '';
  return (
    <div className="palette-backdrop" onMouseDown={onClose}>
      <div
        className="palette"
        role="dialog"
        aria-label="Command palette"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="palette-input">
          <Icon name="search" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => { setQ(e.target.value); setSel(0); }}
            onKeyDown={onKey}
            placeholder="Search, or ask Azarvis anything"
            aria-label="Search commands or ask a question"
          />
          <kbd>Esc</kbd>
        </div>

        {answer ? (
          <div className="palette-answer">
            <div className="palette-answer-q"><Icon name="sparkles" size="0.95em" /><span>{answer.q}</span></div>
            {answer.tools.length > 0 && (
              <div className="palette-answer-tools">
                {answer.tools.map((t) => <span key={t} className="tool-chip"><Icon name="zap" size="0.8em" /> {t}</span>)}
              </div>
            )}
            <div className="palette-answer-body">
              {answer.text ? (
                <Suspense fallback={<div className="muted">Rendering…</div>}>
                  <MarkdownView source={answer.text} />
                </Suspense>
              ) : answer.loading ? (
                <div className="palette-answer-thinking"><span className="orb small pulse" /> Azarvis is thinking…</div>
              ) : null}
              {answer.error && <div className="error palette-answer-error">{answer.error}</div>}
            </div>
            <div className="palette-answer-foot">
              {answer.loading ? (
                <button className="ghost-btn" onClick={stopAnswer}><Icon name="stop" size="0.9em" /> Stop</button>
              ) : (
                <button className="ghost-btn" onClick={closeAnswer}><Icon name="search" size="0.9em" /> Back to search</button>
              )}
              <button className="ghost-btn" onClick={() => { onClose(); actions.ask(answer.q, false); }}>
                <Icon name="chat" size="0.9em" /> Continue in chat
              </button>
            </div>
          </div>
        ) : (
          <ul className="palette-list">
            {items.length === 0 && <li className="muted palette-empty">No matches</li>}
            {items.map((it, i) => {
              const header = it.group !== lastGroup ? (lastGroup = it.group) : null;
              return (
                <li key={`${it.group}-${i}`}>
                  {header && <div className="palette-group">{header}</div>}
                  <button className={i === sel ? 'active' : ''} onMouseEnter={() => setSel(i)} onClick={() => choose(it)}>
                    <Icon name={it.icon} />
                    <span className="grow">{it.label}</span>
                    {it.hint && <kbd>{it.hint}</kbd>}
                  </button>
                </li>
              );
            })}
          </ul>
        )}

        <div className="palette-foot muted">
          <span><kbd>↑</kbd><kbd>↓</kbd> move</span>
          <span><kbd>Enter</kbd> {answer ? 'ask again' : 'run / ask'}</span>
          <span><kbd>Ctrl</kbd>+<kbd>K</kbd> open anywhere</span>
        </div>
      </div>
    </div>
  );
}
