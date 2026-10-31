// Small building blocks shared by every tab, so they all look like one app.
import { useEffect, useState } from 'react';
import { Icon } from './icons.jsx';

/** Title row of a tab: colored icon badge, title, one-line description and optional actions. */
export function PageHeader({ icon, hue = 190, title, subtitle, children }) {
  return (
    <header className="page-head" style={{ '--hue': hue }}>
      <span className="badge-icon lg"><Icon name={icon} /></span>
      <div className="grow">
        <h2>{title}</h2>
        {subtitle && <p className="muted">{subtitle}</p>}
      </div>
      {children && <div className="page-actions">{children}</div>}
    </header>
  );
}

export function EmptyState({ icon = 'sparkles', title, children }) {
  return (
    <div className="empty">
      <span className="badge-icon lg"><Icon name={icon} /></span>
      <strong>{title}</strong>
      {children && <p className="muted">{children}</p>}
    </div>
  );
}

// ---- Toasts: toast('Saved') from anywhere; <Toaster /> is mounted once in App. ----
const listeners = new Set();
let nextId = 1;

export function toast(message, tone = 'ok') {
  const t = { id: nextId++, message, tone };
  listeners.forEach((fn) => fn(t));
}

export function Toaster() {
  const [items, setItems] = useState([]);
  useEffect(() => {
    const add = (t) => {
      setItems((xs) => [...xs.slice(-3), t]);
      setTimeout(() => setItems((xs) => xs.filter((x) => x.id !== t.id)), 3500);
    };
    listeners.add(add);
    return () => listeners.delete(add);
  }, []);
  return (
    <div className="toasts" role="status" aria-live="polite">
      {items.map((t) => (
        <div key={t.id} className={`toast ${t.tone}`}>
          <Icon name={t.tone === 'error' ? 'alert' : 'check'} />
          <span>{t.message}</span>
        </div>
      ))}
    </div>
  );
}
