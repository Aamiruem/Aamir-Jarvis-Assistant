import { useEffect, useMemo, useState } from 'react';
import { Icon } from '../icons.jsx';
import './BrainGym.css';

const MODES = [
  { id: 'sequence', title: 'Neural sequence', detail: 'Track a growing sequence of lights.', icon: 'brain', hue: 190 },
  { id: 'focus', title: 'Focus grid', detail: 'Remember the highlighted cells.', icon: 'eye', hue: 285 },
  { id: 'math', title: 'Mind sprint', detail: 'Solve as many as you can in 45 seconds.', icon: 'zap', hue: 38 },
];
const BEST_KEY = 'azarvis-brain-gym-best';
const DAILY_KEY = 'azarvis-brain-gym-daily';
const readJson = (key, fallback) => { try { return JSON.parse(localStorage.getItem(key)) || fallback; } catch { return fallback; } };
const todayKey = () => new Date().toLocaleDateString('en-CA');
const randomCells = (count, size = 16) => {
  const cells = new Set();
  while (cells.size < count) cells.add(Math.floor(Math.random() * size));
  return [...cells];
};
const makeQuestion = (level = 1) => {
  const cap = Math.min(12 + level * 3, 45);
  const a = 2 + Math.floor(Math.random() * cap);
  const b = 2 + Math.floor(Math.random() * Math.min(cap, 16));
  const op = level < 3 ? ['+', '−', '×'][Math.floor(Math.random() * 3)] : ['+', '−', '×', '÷'][Math.floor(Math.random() * 4)];
  const left = op === '÷' ? a * b : op === '−' ? Math.max(a, b) : a;
  const right = op === '÷' ? a : op === '−' ? Math.min(a, b) : b;
  const answer = op === '+' ? a + b : op === '−' ? left - right : op === '×' ? a * b : b;
  return { text: `${left} ${op} ${right}`, answer };
};

export default function BrainGym({ onClose }) {
  const [mode, setMode] = useState(null);
  const [level, setLevel] = useState(1);
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(() => readJson(BEST_KEY, {}));
  const [daily, setDaily] = useState(() => readJson(DAILY_KEY, {}));
  const [status, setStatus] = useState('Choose a challenge to begin.');
  const [sequence, setSequence] = useState([]);
  const [lit, setLit] = useState(-1);
  const [step, setStep] = useState(0);
  const [pattern, setPattern] = useState([]);
  const [selected, setSelected] = useState([]);
  const [question, setQuestion] = useState(() => makeQuestion());
  const [seconds, setSeconds] = useState(45);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const onKeyDown = (event) => { if (event.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  const finishRound = (points = 0) => {
    const next = score + points;
    setScore(next);
    setLevel((v) => v + 1);
    const key = todayKey();
    const updatedDaily = { ...daily, [key]: [...new Set([...(daily[key] || []), mode])] };
    const updatedBest = { ...best, [mode]: Math.max(best[mode] || 0, next) };
    setDaily(updatedDaily); setBest(updatedBest);
    localStorage.setItem(DAILY_KEY, JSON.stringify(updatedDaily));
    localStorage.setItem(BEST_KEY, JSON.stringify(updatedBest));
  };

  const startRound = (which = mode, nextLevel = level) => {
    setMode(which); setLevel(nextLevel); setStep(0); setSelected([]); setPlaying(true);
    if (which === 'sequence') {
      const next = Array.from({ length: Math.min(2 + nextLevel, 12) }, () => Math.floor(Math.random() * 9));
      setSequence(next); setStatus('Watch the sequence…'); setLit(-1);
      next.forEach((cell, i) => setTimeout(() => setLit(cell), 500 + i * 720));
      setTimeout(() => { setLit(-1); setStatus('Your turn — repeat the sequence.'); }, 500 + next.length * 720);
    } else if (which === 'focus') {
      const cells = randomCells(Math.min(3 + nextLevel, 10));
      setHiddenPattern(cells); setPattern(cells); setStatus('Memorize the glowing cells…');
      setTimeout(() => { setPattern([]); setStatus('Tap every cell you remember.'); }, 1500 + nextLevel * 80);
    } else {
      setQuestion(makeQuestion(nextLevel)); setSeconds(45); setStatus('Go! Solve as many as you can.');
    }
  };

  useEffect(() => {
    if (!playing || mode !== 'math') return undefined;
    if (seconds <= 0) {
      setPlaying(false); setStatus(`Sprint complete — ${score} points. Start another run to beat your best.`);
      return undefined;
    }
    const timer = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [playing, mode, seconds, score]);

  const chooseSequence = (cell) => {
    if (!playing || lit !== -1 || status.startsWith('Watch')) return;
    if (sequence[step] !== cell) { setPlaying(false); setStatus(`Sequence ended at ${step} — ${score} points. Try again to beat your best.`); return; }
    if (step + 1 === sequence.length) { setPlaying(false); finishRound(10 + level * 2); setStatus('Perfect recall! Next round is harder.'); setTimeout(() => startRound(mode, level + 1), 1000); }
    else setStep(step + 1);
  };
  const chooseFocus = (cell) => {
    if (!playing || pattern.length) return;
    if (selected.includes(cell)) return;
    const next = [...selected, cell]; setSelected(next);
    const correct = next.filter((n) => hiddenPattern.includes(n)).length;
    if (correct === hiddenPattern.length) { setPlaying(false); finishRound(10 + level * 2); setStatus('Great focus! Next round is harder.'); setTimeout(() => startRound(mode, level + 1), 1000); }
    else if (next.length - correct >= 3) { setPlaying(false); setStatus(`Focus round ended at level ${level}. Your score: ${score}.`); }
  };
  const [hiddenPattern, setHiddenPattern] = useState([]);
  const begin = (which) => {
    setScore(0); setLevel(1); setSelected([]); setPlaying(false);
    if (which === 'sequence') {
      setSequence([]); startRound(which, 1);
    } else if (which === 'focus') {
      startRound(which, 1);
    } else {
      setMode(which); setSeconds(45); setQuestion(makeQuestion(1)); setStatus('Go! Solve as many as you can.'); setPlaying(true);
    }
  };
  const answerMath = (answer) => {
    if (!playing) return;
    if (answer === question.answer) { finishRound(1); setQuestion(makeQuestion(level + 1)); setStatus('Correct. Keep going!'); }
    else setStatus('Not quite — try the next one.');
  };
  const mathOptions = useMemo(() => {
    const values = new Set([question.answer]);
    while (values.size < 4) values.add(Math.max(0, question.answer + Math.floor(Math.random() * 15) - 7));
    return [...values].sort(() => Math.random() - 0.5);
  }, [question]);
  const dailyDone = (daily[todayKey()] || []).length;
  const openMode = MODES.find((m) => m.id === mode);
  const back = () => { setMode(null); setPlaying(false); setScore(0); setLevel(1); setStatus('Choose a challenge to begin.'); };

  return (
    <div className="bg-overlay" role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <section className="brain-gym" role="dialog" aria-modal="true" aria-labelledby="brain-gym-title">
        <header className="bg-header">
          <div><span className="bg-kicker"><Icon name="sparkles" /> DAILY NEURAL TRAINING</span><h2 id="brain-gym-title">Brain <span>Gym</span></h2><p>Three quick challenges to train recall, focus, and mental agility.</p></div>
          <button className="icon-btn" onClick={onClose} aria-label="Close Brain Gym"><Icon name="x" /></button>
        </header>
        <div className="bg-daily"><span><Icon name="timeline" /> Daily goal</span><strong>{dailyDone}/3 <small>challenges played today</small></strong><div className="bg-progress"><i style={{ width: `${dailyDone / 3 * 100}%` }} /></div></div>
        {!mode ? <div className="bg-modes">{MODES.map((item) => <button className="bg-mode" style={{ '--hue': item.hue }} key={item.id} onClick={() => begin(item.id)}><span className="bg-mode-icon"><Icon name={item.icon} /></span><span><strong>{item.title}</strong><small>{item.detail}</small><em>Best: {best[item.id] || 0}</em></span><Icon name="chevron" className="bg-chevron" /></button>)}</div> : <div className="bg-play"><div className="bg-game-head"><button className="btn sm" onClick={back}><Icon name="arrowLeft" /> Challenges</button><span>LEVEL {level} <i/> SCORE {score}</span>{mode === 'math' && <b className={seconds < 10 ? 'urgent' : ''}>{seconds}s</b>}</div><h3>{openMode?.title}</h3><p className="bg-status" aria-live="polite">{status}</p>
          {mode === 'sequence' && <div className="bg-sequence-grid">{Array.from({ length: 9 }, (_, i) => <button key={i} className={lit === i ? 'lit' : ''} onClick={() => chooseSequence(i)} aria-label={`Sequence tile ${i + 1}`} />)}</div>}
          {mode === 'focus' && <div className="bg-focus-grid">{Array.from({ length: 16 }, (_, i) => <button key={i} className={`${pattern.includes(i) ? 'lit' : ''} ${selected.includes(i) ? 'picked' : ''}`} onClick={() => chooseFocus(i)} aria-label={`Focus cell ${i + 1}`} />)}</div>}
          {mode === 'math' && <div className="bg-math"><strong>{question.text} = ?</strong><div>{mathOptions.map((n) => <button key={n} onClick={() => answerMath(n)}>{n}</button>)}</div></div>}
          {!playing && <button className="btn primary bg-retry" onClick={() => begin(mode)}><Icon name="refresh" /> Play again</button>}
        </div>}
        <footer className="bg-footer"><Icon name="shield" /> Progress and personal bests stay in this browser. Take a break whenever you need one.</footer>
      </section>
    </div>
  );
}
