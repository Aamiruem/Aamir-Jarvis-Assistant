import { useEffect, useRef } from 'react';
import { Icon } from '../icons.jsx';
import { speechSupported } from '../useSpeech.js';

/**
 * Shown when Azarvis opens. Browsers only allow a page to talk and listen after a click,
 * so "Start talking" is that click: Azarvis then greets you and asks its questions.
 */
export default function WelcomePrompt({ name, autoStart, onAutoStartChange, onStart, onClose }) {
  const startRef = useRef(null);
  useEffect(() => {
    startRef.current?.focus();
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const first = (name || '').split(' ')[0];
  return (
    <div className="palette-backdrop welcome-backdrop" onClick={onClose}>
      <div className="welcome-card" role="dialog" aria-modal="true" aria-labelledby="welcome-title" onClick={(e) => e.stopPropagation()}>
        <div className="orb big pulse" aria-hidden="true" />
        <h2 id="welcome-title">
          Hello{first ? `, ${first}` : ''}. <span className="grad-text">Azarvis is online.</span>
        </h2>
        <p className="muted">
          {speechSupported
            ? 'Start talking and Azarvis will greet you, read your reminders and ask a question or two. Just speak naturally; you can interrupt it any time.'
            : 'Voice needs Chrome or Edge. You can still type to Azarvis in Chat.'}
        </p>
        <div className="welcome-actions">
          {speechSupported && (
            <button ref={startRef} className="btn primary" onClick={onStart}>
              <Icon name="mic" size="1em" /> Start talking
            </button>
          )}
          <button className="btn" onClick={onClose}>Not now</button>
        </div>
        <label className="welcome-auto">
          <input type="checkbox" checked={autoStart} onChange={(e) => onAutoStartChange(e.target.checked)} />
          Show this when I open Azarvis
        </label>
      </div>
    </div>
  );
}
