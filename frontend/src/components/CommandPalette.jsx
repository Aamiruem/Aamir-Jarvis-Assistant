import { useEffect, useMemo, useRef, useState } from 'react';
import { api } from '../api.js';
import { Icon } from '../icons.jsx';
import { chaptersOf, loadBook, loadLibrary } from '../notes.js';
import { openUrl } from '../quickCommands.js';

// Ctrl+K (⌘K on Mac) or the search bar: one box for everything. Jump to a tab, run an action or an
// automation, find a chat, contact, task, memory, note (any chapter or heading), ML model or
// document, search Google or YouTube, or press Enter to ask Azarvis.
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
  const inputRef = useRef(null);

  useEffect(() => {
    if (!open) return;
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

  const items = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const match = (s) => !needle || s.toLowerCase().includes(needle);
    const list = [
      ...tabs.filter((t) => match(t.label)).map((t) => ({ group: 'Go to', icon: t.icon, label: t.label, hint: `Alt+${t.key}`, run: () => actions.openTab(t.id) })),
      ...ACTIONS.filter((a) => match(`${a.label} ${a.keywords || ''}`)).map((a) => ({ group: 'Actions', ...a, run: () => a.run(actions) })),
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
        { group: 'Ask Azarvis', icon: 'sparkles', label: `“${text}”`, hint: 'Enter', run: () => actions.ask(text, true) },
        { group: 'Search the web', icon: 'globe', label: `Google: ${text}`, run: () => openUrl(`https://www.google.com/search?q=${encodeURIComponent(text)}`) },
        { group: 'Search the web', icon: 'youtube', label: `YouTube: ${text}`, run: () => openUrl(`https://www.youtube.com/results?search_query=${encodeURIComponent(text)}`) },
      );
    }
    return list;
  }, [q, tabs, conversations, actions, data]);

  if (!open) return null;

  const choose = (item) => {
    onClose();
    item?.run();
  };
  const onKey = (e) => {
    if (e.key === 'Escape') onClose();
    else if (e.key === 'ArrowDown') { e.preventDefault(); setSel((s) => Math.min(s + 1, items.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setSel((s) => Math.max(s - 1, 0)); }
    else if (e.key === 'Enter') {
      e.preventDefault();
      // With text typed and nothing better highlighted, Enter asks Azarvis.
      choose(items[sel] ?? items.find((it) => it.group === 'Ask Azarvis'));
    }
  };

  let lastGroup = '';
  return (
    <div className="palette-backdrop" onMouseDown={onClose}>
      <div className="palette" role="dialog" aria-label="Command palette" onMouseDown={(e) => e.stopPropagation()}>
        <div className="palette-input">
          <Icon name="search" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => { setQ(e.target.value); setSel(0); }}
            onKeyDown={onKey}
            placeholder="Search everything: notes, chats, contacts, tasks, models… or ask Azarvis"
            aria-label="Search commands"
          />
          <kbd>Esc</kbd>
        </div>
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
        <div className="palette-foot muted">
          <span><kbd>↑</kbd><kbd>↓</kbd> move</span>
          <span><kbd>Enter</kbd> run</span>
          <span><kbd>Ctrl</kbd>+<kbd>K</kbd> open anywhere</span>
        </div>
      </div>
    </div>
  );
}
