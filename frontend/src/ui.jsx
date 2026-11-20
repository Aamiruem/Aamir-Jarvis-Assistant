// Small building blocks shared by every tab, so they all look like one app.
import { useEffect, useState } from 'react';
import { Icon } from './icons.jsx';

/** Title row of a tab: colored icon badge, title, one-line description and optional actions. */
/**
 * A page's title row. `art` (an image in /public/art) turns it into a banner card: the picture sits
 * on the right on wide screens and becomes a short strip above the title on phones.
 * `artAlt` describes the picture; leave it empty when it is decoration only. `artPos` sets which
 * part of the picture stays in view when it is cropped (a CSS object-position).
 */
export function PageHeader({ icon, hue = 190, title, subtitle, children, art, artAlt = '', artPos }) {
  return (
    <header className={`page-head${art ? ' has-art' : ''}`} style={{ '--hue': hue }}>
      <span className="badge-icon lg"><Icon name={icon} /></span>
      <div className="grow">
        <h2>{title}</h2>
        {subtitle && <p className="muted">{subtitle}</p>}
      </div>
      {children && <div className="page-actions">{children}</div>}
      {art && (
        <img className="page-art" src={art} alt={artAlt} loading="lazy" decoding="async"
          style={artPos ? { objectPosition: artPos } : undefined} />
      )}
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
