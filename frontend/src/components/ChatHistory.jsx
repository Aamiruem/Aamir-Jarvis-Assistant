import { useEffect, useMemo, useRef, useState } from 'react';
import { Icon } from '../icons.jsx';

// Grouped by last activity.
export function groupConversations(list) {
  const day = 86_400_000;
  const startOfToday = new Date().setHours(0, 0, 0, 0);
  const groups = { Today: [], 'This week': [], Older: [] };
  for (const c of list) {
    const t = new Date(c.updatedAt || 0).getTime();
    groups[t >= startOfToday ? 'Today' : t >= startOfToday - 6 * day ? 'This week' : 'Older'].push(c);
  }
  return Object.entries(groups).filter(([, cs]) => cs.length);
}

/** The chat's own top bar: past conversations (search, open, rename, delete) and New chat. */
export default function ChatHistory({ conversations, activeId, onOpen, onRename, onDelete, onNew }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const panel = useRef(null);
  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    return groupConversations(q ? conversations.filter((c) => c.title.toLowerCase().includes(q)) : conversations);
  }, [conversations, query]);
  const current = conversations.find((c) => c._id === activeId);

  useEffect(() => {
    if (!open) return;
    const close = (e) => {
      if (e.key === 'Escape' || (e.type === 'pointerdown' && !panel.current?.contains(e.target))) setOpen(false);
    };
    window.addEventListener('keydown', close);
    window.addEventListener('pointerdown', close);
    return () => {
      window.removeEventListener('keydown', close);
      window.removeEventListener('pointerdown', close);
    };
  }, [open]);

  return (
    <div className="chat-top" ref={panel}>
      <button type="button" className={`chat-top-btn ${open ? 'on' : ''}`} onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        <Icon name="timeline" size="1.1em" /> History
        {conversations.length > 0 && <span className="count">{conversations.length}</span>}
      </button>
      <span className="chat-top-title" title={current?.title}>{current ? current.title : 'New conversation'}</span>
      <button type="button" className="chat-top-btn" onClick={onNew}>
        <Icon name="plus" size="1.1em" /> New chat
      </button>

      {open && (
        <div className="history-pop" role="dialog" aria-label="Chat history">
          <label className="side-search">
            <Icon name="search" size="1em" />
            <input autoFocus value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search your chats" aria-label="Search chats" />
          </label>
          <div className="history-list">
            {groups.length === 0 && <p className="muted conv-empty">{query ? 'No chats match.' : 'Your conversations will appear here.'}</p>}
            {groups.map(([group, list]) => (
              <div key={group} className="conv-group">
                <div className="conv-group-title">{group}</div>
                {list.map((c) => (
                  <div key={c._id} className={`conv ${c._id === activeId ? 'active' : ''}`}>
                    <button className="conv-title" onClick={() => { onOpen(c._id); setOpen(false); }} title={c.title}>
                      <Icon name="chat" size="1em" />
                      <span>{c.title}</span>
                    </button>
                    <button className="icon-btn" title="Rename" aria-label={`Rename ${c.title}`} onClick={() => onRename(c)}><Icon name="edit" size="0.9em" /></button>
                    <button className="icon-btn" title="Delete" aria-label={`Delete ${c.title}`} onClick={() => onDelete(c)}><Icon name="trash" size="0.9em" /></button>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
