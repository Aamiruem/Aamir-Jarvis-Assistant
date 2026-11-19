import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { aiProblemOf } from './AiNotice.jsx';

// Top bar: is Azarvis able to answer right now? From GET /api/health (gateway + AI service +
// Claude key), re-checked every minute and whenever the window comes back into focus.
const LABELS = {
  ok: ['Online', 'All systems online: the AI service and Claude are reachable.'],
  ai_down: ['AI offline', 'The AI service is not running. Start Azarvis on this PC (npm run dev).'],
  no_key: ['No AI key', 'No Anthropic API key is set, so Azarvis can not answer yet.'],
  invalid_key: ['Key rejected', 'The Anthropic API key was rejected. Set a new one with npm run set-key.'],
  no_credits: ['No credits', 'The Anthropic account is out of credits.'],
  unreachable: ['Claude unreachable', 'The AI service can not reach the Claude API (internet?).'],
  offline: ['Offline', 'This device is offline.'],
  checking: ['Checking…', 'Checking the AI service.'],
};

export default function SystemStatusPill({ onOpen }) {
  const [state, setState] = useState('checking');
  useEffect(() => {
    let alive = true;
    const check = () =>
      api
        .health()
        .then((h) => alive && setState(aiProblemOf(h) || 'ok'))
        .catch(() => alive && setState(navigator.onLine === false ? 'offline' : 'ai_down'));
    check();
    const id = setInterval(check, 60_000);
    window.addEventListener('focus', check);
    return () => {
      alive = false;
      clearInterval(id);
      window.removeEventListener('focus', check);
    };
  }, []);
  const [label, detail] = LABELS[state] || LABELS.ai_down;
  const tone = state === 'ok' ? 'ok' : state === 'checking' ? 'muted' : 'bad';
  return (
    <button type="button" className={`status-pill status-pill--${tone}`} onClick={onOpen} title={`${detail} Click for the Command Center.`} aria-label={`System status: ${label}. Open the Command Center`}>
      <i aria-hidden="true" />
      <span>{label}</span>
    </button>
  );
}
