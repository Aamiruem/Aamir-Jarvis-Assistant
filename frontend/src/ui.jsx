// Small building blocks shared by every tab, so they all look like one app.
import { useEffect, useState } from 'react';
import { Icon } from './icons.jsx';

// Pixel sizes of the pictures in /public/art, so the page doesn't jump while one loads.
const ART_SIZE = {
  '/art/agents.webp': [1146, 615], '/art/analytics.webp': [640, 640], '/art/chat-assistant.webp': [475, 539],
  '/art/coding.webp': [1920, 1920], '/art/email.webp': [1280, 741], '/art/memory.webp': [1024, 1024],
  '/art/planner.webp': [1024, 1024], '/art/tasks.webp': [1920, 1024], '/art/voice.webp': [1024, 1024],
  '/art/workflows.webp': [1920, 1080],
};

/** A picture shown whole on a dark backdrop. Escape, the ✕ or a click outside closes it. */
export function ImageViewer({ src, alt = '', onClose }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div className="img-viewer" role="dialog" aria-modal="true" aria-label={alt || 'Picture'} onClick={onClose}>
      <button type="button" className="img-viewer-close" onClick={onClose} aria-label="Close picture" autoFocus><Icon name="x" /></button>
      <img src={src} alt={alt} onClick={(e) => e.stopPropagation()} />
      {alt && <p className="img-viewer-caption">{alt}</p>}
    </div>
  );
}

/**
 * A page's title row: colored icon badge, title, description and optional actions.
 * `art` (an image in /public/art) adds the whole picture, uncropped: beside the title on wide
 * screens, full width above it on phones. Tapping it opens it full screen.
 * `artAlt` describes the picture.
 */
export function PageHeader({ icon, hue = 190, title, subtitle, children, art, artAlt = '' }) {
  const [viewing, setViewing] = useState(false);
  const text = (
    <>
      <span className="badge-icon lg"><Icon name={icon} /></span>
      <div className="grow">
        <h2>{title}</h2>
        {subtitle && <p className="muted">{subtitle}</p>}
      </div>
      {children && <div className="page-actions">{children}</div>}
    </>
  );
  if (!art) return <header className="page-head" style={{ '--hue': hue }}>{text}</header>;
  const [w, h] = ART_SIZE[art] || [];
  return (
    <header className="page-head has-art" style={{ '--hue': hue }}>
      <div className="page-head-main">{text}</div>
      <button type="button" className="page-art-btn" onClick={() => setViewing(true)} title="View full size" aria-label={`View picture full size${artAlt ? `: ${artAlt}` : ''}`}>
        <img className="page-art" src={art} alt={artAlt} width={w} height={h} decoding="async" />
        <span className="page-art-zoom" aria-hidden="true"><Icon name="search" size="1em" /></span>
      </button>
      {viewing && <ImageViewer src={art} alt={artAlt} onClose={() => setViewing(false)} />}
    </header>
  );
}

/**
 * The Azarvis logo and name, the same everywhere (sidebar, phone top bar, website, sign-in).
 * `size` is the logo's height in px; the name scales with it. `tag` adds the small "AI" badge.
 */
export function Brand({ size = 30, tag = false, className = '' }) {
  return (
    <span className={`az-brand ${className}`} style={{ '--bs': `${size}px` }}>
      <img className="az-brand-logo" src="/icon.svg" alt="" width={size} height={size} />
      <span className="az-brand-name">Azarvis</span>
      {tag && <span className="az-brand-tag">AI</span>}
    </span>
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
