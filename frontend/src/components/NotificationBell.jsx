import { useEffect, useRef, useState } from 'react';
import { api } from '../api.js';
import { Icon } from '../icons.jsx';
import { speakAlerts } from '../alerts.js';
import { toast } from '../ui.jsx';

const POLL_MS = 15_000;

// Polls for notifications (reminders, PC watcher alerts) and shows them in a dropdown, as a
// desktop notification when allowed, and read aloud by Jarvis (see alerts.js). Alerts that
// were already there when the page opened are shown, not announced. Polling is the simplest
// real-time technique; WebSockets or SSE are the next step up.
export default function NotificationBell() {
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const seen = useRef(new Set());
  const firstPoll = useRef(true);

  useEffect(() => {
    let stopped = false;
    const poll = async () => {
      try {
        const list = await api.notifications(false);
        if (stopped) return;
        const fresh = list.filter((n) => !n.read && !seen.current.has(n.id));
        list.forEach((n) => seen.current.add(n.id));
        if (!firstPoll.current && fresh.length) {
          for (const n of fresh) {
            if ('Notification' in window && Notification.permission === 'granted') new Notification(n.title, { body: n.body });
          }
          speakAlerts([...fresh].reverse()); // oldest first
          toast(fresh.length === 1 ? fresh[0].title : `${fresh.length} new alerts`);
        }
        firstPoll.current = false;
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
