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

/**
 * Tappable spots on a picture: each sits on something the picture shows (a calendar, an inbox,
 * an agent's screen…) and runs the real feature that does it. spot = { x, y (percent of the
 * picture), label, hint, run }.
 */
function Spots({ spots, onPick }) {
  return spots.map((s, i) => (
    <button key={s.label} type="button" className={`art-spot${s.x < 20 ? ' at-l' : s.x > 80 ? ' at-r' : ''}`} style={{ left: `${s.x}%`, top: `${s.y}%` }}
      onClick={(e) => { e.stopPropagation(); onPick(s); }} title={s.hint || s.label} aria-label={s.hint ? `${s.label}: ${s.hint}` : s.label}>
      <span className="art-spot-dot" aria-hidden="true">{i + 1}</span>
      <span className="art-spot-label">{s.label}</span>
    </button>
  ));
}

/** The same spots as a list of numbered buttons (phones, and under the full-screen picture). */
export function SpotList({ spots, onPick, className = '' }) {
  return (
    <div className={`art-spot-list ${className}`} role="group" aria-label="What this picture can do">
      {spots.map((s, i) => (
        <button key={s.label} type="button" onClick={() => onPick(s)} title={s.hint || s.label}>
          <span className="art-spot-dot" aria-hidden="true">{i + 1}</span>{s.label}
        </button>
      ))}
    </div>
  );
}

/** A picture shown whole on a dark backdrop, with its spots. Escape, the ✕ or a click outside closes it. */
export function ImageViewer({ src, alt = '', spots, onClose }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  const pick = (s) => { onClose(); s.run(); };
  return (
    <div className="img-viewer" role="dialog" aria-modal="true" aria-label={alt || 'Picture'} onClick={onClose}>
      <button type="button" className="img-viewer-close" onClick={onClose} aria-label="Close picture" autoFocus><Icon name="x" /></button>
      <div className="img-viewer-frame" onClick={(e) => e.stopPropagation()}>
        <img src={src} alt={alt} />
        {spots?.length > 0 && <Spots spots={spots} onPick={pick} />}
      </div>
      {alt && <p className="img-viewer-caption">{alt}</p>}
      {spots?.length > 0 && <div onClick={(e) => e.stopPropagation()}><SpotList spots={spots} onPick={pick} className="in-viewer" /></div>}
    </div>
  );
}

/**
 * A picture from /public/art shown whole (never cropped), with its tappable spots and a button
 * that opens it full screen. Tapping the picture itself also opens it.
 */
export function ArtPicture({ src, alt = '', spots, className = '' }) {
  const [viewing, setViewing] = useState(false);
  const [w, h] = ART_SIZE[src] || [];
  return (
    <div className={`page-art-wrap ${className}`}>
      <img className="page-art" src={src} alt={alt} width={w} height={h} decoding="async" onClick={() => setViewing(true)} />
      {spots?.length > 0 && <Spots spots={spots} onPick={(s) => s.run()} />}
      <button type="button" className="page-art-zoom" onClick={() => setViewing(true)} title="View full size" aria-label={`View picture full size${alt ? `: ${alt}` : ''}`}>
        <Icon name="search" size="1em" />
      </button>
      {viewing && <ImageViewer src={src} alt={alt} spots={spots} onClose={() => setViewing(false)} />}
    </div>
  );
}

/**
 * A page's title row: colored icon badge, title, description and optional actions.
 * `art` (an image in /public/art) adds the whole picture, uncropped: beside the title on wide
 * screens, full width above it on phones. `spots` make the things in the picture work (see Spots).
 * `artAlt` describes the picture.
 */
export function PageHeader({ icon, hue = 190, title, subtitle, children, art, artAlt = '', spots }) {
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
  return (
    <header className="page-head has-art" style={{ '--hue': hue }}>
      <div className="page-head-main">{text}</div>
      <ArtPicture src={art} alt={artAlt} spots={spots} />
      {spots?.length > 0 && <SpotList spots={spots} onPick={(s) => s.run()} className="for-phone" />}
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
