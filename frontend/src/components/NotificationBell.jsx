import { useEffect, useRef, useState } from 'react';
import { api } from '../api.js';
import { Icon } from '../icons.jsx';

const POLL_MS = 30_000;

// Polls for reminder notifications and shows them in a dropdown (plus a desktop
// notification when the user has allowed it). Polling is the simplest real-time
// technique; WebSockets or SSE are the next step up.
export default function NotificationBell() {
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const seen = useRef(new Set());

  useEffect(() => {
    let stopped = false;
    const poll = async () => {
      try {
        const list = await api.notifications(false);
        if (stopped) return;
        for (const n of list) {
          if (!n.read && !seen.current.has(n.id) && 'Notification' in window && Notification.permission === 'granted') {
            new Notification(n.title, { body: n.body });
          }
          seen.current.add(n.id);
        }
        setItems(list);
      } catch {}
    };
    poll();
    const timer = setInterval(poll, POLL_MS);
    return () => {
      stopped = true;
      clearInterval(timer);
    };
  }, []);

  const unread = items.filter((n) => !n.read);

  const toggle = async () => {
    const next = !open;
    setOpen(next);
    if ('Notification' in window && Notification.permission === 'default') Notification.requestPermission();
    if (next && unread.length) {
      await api.markRead(unread.map((n) => n.id)).catch(() => {});
      setItems((list) => list.map((n) => ({ ...n, read: true })));
    }
  };

  return (
    <div className="bell">
      <button className="icon-btn" onClick={toggle} aria-label="Notifications">
        <Icon name="bell" />{unread.length > 0 && <span className="badge">{unread.length}</span>}
      </button>
      {open && (
        <div className="dropdown">
          {items.length === 0 && <div className="muted pad">No notifications yet. Ask Jarvis to remind you of something.</div>}
          {items.map((n) => (
            <div key={n.id} className={`note ${n.read ? '' : 'unread'}`}>
              <strong>{n.title}</strong>
              {n.body && <div>{n.body}</div>}
              <div className="meta">{new Date(n.created_at).toLocaleString()}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
