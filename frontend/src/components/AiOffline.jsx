import { useEffect, useRef, useState } from 'react';
import { api } from '../api.js';
import { Icon } from '../icons.jsx';
import './AiOffline.css';

// Shown by AI-powered tabs when the AI service isn't answering. On the owner's own PC (development)
// it offers to start the service and waits until it is up; elsewhere it explains and offers a retry.
// Every state is real: it polls /api/health and only calls onReady once the service answers.

export const isAiDown = (msg = '') => /AI service|isn't running|AI_UNAVAILABLE|owner's PC/i.test(msg);

export default function AiOffline({ message, onReady, what = 'This screen' }) {
  const [canStart, setCanStart] = useState(false);
  const [phase, setPhase] = useState('idle'); // idle | starting | waiting | failed
  const [note, setNote] = useState('');
  const timer = useRef(0);
  useEffect(() => {
    api.health().then((h) => setCanStart(Boolean(h?.canStartAi))).catch(() => {});
    return () => clearInterval(timer.current);
  }, []);

  const waitUntilUp = (maxMs = 90_000) => {
    const t0 = Date.now();
    clearInterval(timer.current);
    timer.current = setInterval(async () => {
      try {
        const h = await api.health();
        if (h?.ai === 'up') {
          clearInterval(timer.current);
          setPhase('idle');
          onReady?.();
          return;
        }
      } catch {
        /* keep waiting */
      }
      if (Date.now() - t0 > maxMs) {
        clearInterval(timer.current);
        setPhase('failed');
        setNote('It did not answer within 90 seconds. Its log is in backend/fastapi-ai/data/logs/ai-service.log.');
      }
    }, 1500);
  };
  const start = async () => {
    setPhase('starting');
    setNote('');
    try {
      const r = await api.startAiService();
      setNote(r.status === 'already_running' ? 'It is already running: reconnecting…' : r.status === 'starting' ? 'It is already starting…' : 'Started. Loading its models (usually 5–20 seconds)…');
      setPhase('waiting');
      waitUntilUp();
    } catch (e) {
      setPhase('failed');
      setNote(e.message);
    }
  };
  const retry = () => {
    setPhase('waiting');
    setNote('Checking…');
    waitUntilUp(4000);
  };
  const busy = phase === 'starting' || phase === 'waiting';
  return (
    <section className="aio" role="status" aria-live="polite">
      <span className="aio-ic"><Icon name={busy ? 'refresh' : 'plug'} size="1.6em" className={busy ? 'spin' : ''} /></span>
      <div className="aio-body">
        <h3>{busy ? 'Starting the AI service…' : 'The AI service is offline'}</h3>
        <p>{what} needs the Azarvis AI service (the Python brain that runs scans, bookings and checks). {canStart ? 'It runs on this PC and is not started yet.' : message}</p>
        {note && <p className={phase === 'failed' ? 'aio-err' : 'aio-note'}>{note}</p>}
        <div className="aio-actions">
          {canStart && <button type="button" className="aio-btn primary" onClick={start} disabled={busy}>{busy ? 'Starting…' : 'Start AI service'}</button>}
          <button type="button" className="aio-btn" onClick={retry} disabled={busy}>Try again</button>
        </div>
        {!canStart && <p className="aio-hint">On your PC: run <code>npm run dev</code> in the project folder (it starts and watches every service).</p>}
      </div>
    </section>
  );
}
