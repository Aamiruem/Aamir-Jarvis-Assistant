import { useEffect, useMemo, useRef, useState } from 'react';
import { api } from '../api.js';
import { Icon } from '../icons.jsx';

// Ctrl+K (⌘K on Mac) or the search bar: jump to a tab, run a quick action, find a chat,
// contact, task or memory, or type anything and press Enter to send it straight to Jarvis.
const ACTIONS = [
  { icon: 'mic', label: 'Talk to Jarvis (hands-free voice)', run: (a) => a.ask('', false, true) },
  { icon: 'plus', label: 'New chat', run: (a) => a.newChat() },
  { icon: 'alarm', label: 'Set a reminder…', run: (a) => a.ask('Remind me to ', false) },
  { icon: 'weather', label: "Today's weather", run: (a) => a.ask("What's the weather today?", true) },
  { icon: 'folder', label: 'Open Downloads folder', run: (a) => a.ask('open my downloads folder', true) },
  { icon: 'screenshot', label: 'Take a screenshot', run: (a) => a.ask('take a screenshot', true) },
  { icon: 'volume', label: 'Volume up', run: (a) => a.ask('volume up', true) },
  { icon: 'search', label: 'Open YouTube', run: (a) => a.ask('open youtube', true) },
  { icon: 'contacts', label: 'Add a contact', run: (a) => a.openContacts() },
  { icon: 'sun', label: 'Switch dark / light theme', run: (a) => a.toggleTheme() },
];

export default function CommandPalette({ open, initialQuery = '', onClose, tabs, conversations, actions }) {
  const [q, setQ] = useState('');
  const [sel, setSel] = useState(0);
  const [data, setData] = useState({ contacts: [], tasks: [], memories: [] });
  const inputRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    setQ(initialQuery);
    setSel(0);
    setTimeout(() => inputRef.current?.focus(), 0);
    // Fresh copies each time it opens, so new contacts and tasks are searchable at once.
    Promise.allSettled([api.contacts(), api.tasks(true), api.memories()]).then(([c, t, m]) =>
      setData({
        contacts: c.status === 'fulfilled' ? c.value : [],
        tasks: t.status === 'fulfilled' ? t.value : [],
        memories: m.status === 'fulfilled' ? m.value : [],
      }));
  }, [open, initialQuery]);

  const items = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const match = (s) => !needle || s.toLowerCase().includes(needle);
    const list = [
      ...tabs.filter((t) => match(t.label)).map((t) => ({ group: 'Go to', icon: t.icon, label: t.label, hint: `Alt+${t.key}`, run: () => actions.openTab(t.id) })),
      ...ACTIONS.filter((a) => match(a.label)).map((a) => ({ group: 'Actions', ...a, run: () => a.run(actions) })),
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
    if (needle) list.push({ group: 'Ask Jarvis', icon: 'sparkles', label: `“${q.trim()}”`, hint: 'Enter', run: () => actions.ask(q.trim(), true) });
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
      // With text typed and nothing better highlighted, Enter asks Jarvis.
      choose(items[sel] ?? items.at(-1));
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
            placeholder="Search chats, contacts, tasks, commands… or ask Jarvis"
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
