import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  dailyWorkout,
  dayKey,
  GAMES,
  getGame,
  gridSize,
  LEVELS,
  levelMult,
  logicProblem,
  mathProblem,
  memorySequence,
  nBackLevel,
  nBackSequence,
  rate,
  schulteGrid,
  scoreGame,
  spanDigits,
  spanFlashMs,
  stroopTrial,
  updateStreak,
} from '../brainGym.js';
import { Icon } from '../icons.jsx';
import { speak } from '../brain.js';
import { toast } from '../ui.jsx';
import './BrainGym.css';

// Brain Gym: original brain-exercise games, all in the browser (no server, no account). Logic and
// scoring live in brainGym.js; this file is the play surface. Best scores and the streak are saved
// in this browser. onAsk (signed-in app) opens the AI chat for tips.

const BEST_KEY = 'azarvis-braingym-best';
const STREAK_KEY = 'azarvis-braingym-streak';
const load = (k, fb) => {
  try {
    return JSON.parse(localStorage.getItem(k)) ?? fb;
  } catch {
    return fb;
  }
};
const save = (k, v) => {
  try {
    localStorage.setItem(k, JSON.stringify(v));
  } catch {}
};
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

function useTimers() {
  const ids = useRef([]);
  const add = useCallback((fn, ms) => {
    const id = setTimeout(fn, ms);
    ids.current.push(id);
    return id;
  }, []);
  const clearAll = useCallback(() => {
    ids.current.forEach(clearTimeout);
    ids.current = [];
  }, []);
  useEffect(() => clearAll, [clearAll]);
  return { add, clearAll };
}

// ---------- Memory Grid ----------
function MemoryGame({ seed, level, onFinish }) {
  const size = gridSize(level);
  const [round, setRound] = useState(1);
  const [phase, setPhase] = useState('show'); // show | input | over
  const [lit, setLit] = useState(-1);
  const [step, setStep] = useState(0);
  const seq = useMemo(() => memorySequence(round, size, seed), [round, size, seed]);
  const { add, clearAll } = useTimers();

  useEffect(() => {
    setPhase('show');
    setStep(0);
    clearAll();
    let t = 300;
    seq.forEach((cell, i) => {
      add(() => setLit(cell), t);
      add(() => setLit(-1), t + 420);
      t += 620 - Math.min(250, round * 25);
    });
    add(() => setPhase('input'), t);
  }, [seq, round, add, clearAll]);

  const tap = (cell) => {
    if (phase !== 'input') return;
    if (cell !== seq[step]) {
      setPhase('over');
      onFinish({ round });
      return;
    }
    setLit(cell);
    setTimeout(() => setLit(-1), 180);
    if (step + 1 === seq.length) setTimeout(() => setRound((r) => r + 1), 420);
    else setStep(step + 1);
  };

  return (
    <div className="bg-stage">
      <p className="bg-instruction">{phase === 'show' ? 'Watch carefully…' : `Repeat the sequence (${step}/${seq.length})`}</p>
      <div className="bg-grid" style={{ '--n': size }} aria-label="Memory grid">
        {Array.from({ length: size * size }, (_, i) => (
          <button key={i} type="button" className={`bg-tile ${lit === i ? 'lit' : ''}`} disabled={phase !== 'input'} onClick={() => tap(i)} aria-label={`Tile ${i + 1}`} />
        ))}
      </div>
      <p className="bg-round">Round {round}</p>
    </div>
  );
}

// ---------- N-Back ----------
function NBackGame({ seed, level, onFinish }) {
  const n = nBackLevel(level);
  const total = 20 + n * 4;
  const { pos, targets } = useMemo(() => nBackSequence(total, n, seed), [total, n, seed]);
  const [i, setI] = useState(-1);
  const [active, setActive] = useState(-1);
  const answered = useRef(false);
  const stats = useRef({ hit: 0, miss: 0, fa: 0, cr: 0 });
  const { add, clearAll } = useTimers();

  useEffect(() => {
    clearAll();
    let step = -1;
    const next = () => {
      // grade the step that just ended
      if (step >= 0) {
        const wasTarget = targets[step];
        if (wasTarget && answered.current) stats.current.hit++;
        else if (wasTarget) stats.current.miss++;
        else if (answered.current) stats.current.fa++;
        else stats.current.cr++;
      }
      step++;
      if (step >= total) {
        const { hit, miss, fa } = stats.current;
        const graded = total - n;
        const accuracy = graded ? Math.max(0, (graded - miss - fa) / graded) : 0;
        onFinish({ accuracy, hit, miss, fa });
        return;
      }
      answered.current = false;
      setI(step);
      setActive(pos[step]);
      add(() => setActive(-1), 700);
      add(next, 2400 - Math.min(600, step * 15));
    };
    add(next, 500);
  }, [pos, targets, total, n, add, clearAll, onFinish]);

  const match = () => {
    if (i < n || answered.current) return;
    answered.current = true;
    toast(targets[i] ? 'Match!' : 'Not a match', targets[i] ? 'success' : 'error');
  };

  return (
    <div className="bg-stage">
      <p className="bg-instruction">Press <b>Match</b> when the square is where it was <b>{n}</b> step{n > 1 ? 's' : ''} ago</p>
      <div className="bg-grid bg-nback" style={{ '--n': 3 }}>
        {Array.from({ length: 9 }, (_, c) => (
          <div key={c} className={`bg-tile ${active === c ? 'lit' : ''}`} />
        ))}
      </div>
      <button type="button" className="btn primary bg-match" onClick={match}>Match ({n}-back)</button>
      <p className="bg-round">{Math.max(0, i + 1)} / {total}</p>
    </div>
  );
}

// ---------- Speed Math ----------
function MathGame({ seed, level, onFinish }) {
  const [n, setN] = useState(0);
  const [left, setLeft] = useState(60);
  const [correct, setCorrect] = useState(0);
  const wrong = useRef(0);
  const p = useMemo(() => mathProblem(level, seed + n * 997), [level, seed, n]);
  const done = useRef(false);

  useEffect(() => {
    if (left <= 0) {
      if (!done.current) {
        done.current = true;
        onFinish({ correct, wrong: wrong.current });
      }
      return;
    }
    const t = setTimeout(() => setLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [left, correct, onFinish]);

  const answer = (c) => {
    if (done.current) return;
    if (c === p.answer) setCorrect((x) => x + 1);
    else if (++wrong.current >= 3) {
      done.current = true;
      onFinish({ correct, wrong: wrong.current });
      return;
    }
    setN((x) => x + 1);
  };

  return (
    <div className="bg-stage">
      <div className="bg-hud"><span>⏱ {left}s</span><span>✓ {correct}</span><span>✗ {wrong.current}/3</span></div>
      <p className="bg-problem">{p.text} = ?</p>
      <div className="bg-choices">
        {p.choices.map((c, k) => <button key={k} type="button" className="bg-choice" onClick={() => answer(c)}>{c}</button>)}
      </div>
    </div>
  );
}

// ---------- Colour Clash (Stroop) ----------
function StroopGame({ seed, level, onFinish }) {
  const TOTAL = 20;
  const [n, setN] = useState(0);
  const [correct, setCorrect] = useState(0);
  const t = useMemo(() => stroopTrial(level, seed + n * 131), [level, seed, n]);
  const done = useRef(false);
  const answer = (name) => {
    if (done.current) return;
    const c = correct + (name === t.answer ? 1 : 0);
    setCorrect(c);
    if (n + 1 >= TOTAL) {
      done.current = true;
      onFinish({ correct: c });
    } else setN((x) => x + 1);
  };
  return (
    <div className="bg-stage">
      <div className="bg-hud"><span>{n + 1} / {TOTAL}</span><span>✓ {correct}</span></div>
      <p className="bg-instruction">Tap the <b>colour of the ink</b>, not the word</p>
      <p className="bg-stroop" style={{ color: t.ink.hex }}>{t.word}</p>
      <div className="bg-choices bg-choices--wrap">
        {t.choices.map((c) => (
          <button key={c.name} type="button" className="bg-choice bg-colour" style={{ '--c': c.hex }} onClick={() => answer(c.name)}>{c.name}</button>
        ))}
      </div>
    </div>
  );
}

// ---------- Number Span ----------
function SpanGame({ seed, level, onFinish }) {
  const [round, setRound] = useState(1);
  const [phase, setPhase] = useState('show');
  const [value, setValue] = useState('');
  const digits = useMemo(() => spanDigits(round, level, seed), [round, level, seed]);
  const { add, clearAll } = useTimers();

  useEffect(() => {
    setPhase('show');
    setValue('');
    clearAll();
    add(() => setPhase('input'), spanFlashMs(digits.length, level) + 400);
  }, [digits, level, add, clearAll]);

  const submit = (e) => {
    e.preventDefault();
    if (value === digits) setTimeout(() => setRound((r) => r + 1), 200);
    else onFinish({ best: round + 1 }); // reached this many digits before failing
  };

  return (
    <div className="bg-stage">
      {phase === 'show' ? (
        <>
          <p className="bg-instruction">Remember this…</p>
          <p className="bg-span">{digits}</p>
        </>
      ) : (
        <form onSubmit={submit} className="bg-span-form">
          <p className="bg-instruction">Type the {digits.length}-digit number</p>
          <input autoFocus inputMode="numeric" pattern="\d*" className="bg-span-input" value={value} onChange={(e) => setValue(e.target.value.replace(/\D/g, ''))} aria-label="The number you saw" />
          <button type="submit" className="btn primary">Enter</button>
        </form>
      )}
      <p className="bg-round">Round {round} · {digits.length} digits</p>
    </div>
  );
}

// ---------- Reaction ----------
function ReactionGame({ onFinish }) {
  const TRIES = 5;
  const [state, setState] = useState('wait'); // wait | ready | now | result
  const [times, setTimes] = useState([]);
  const started = useRef(0);
  const { add, clearAll } = useTimers();

  const arm = useCallback(() => {
    setState('ready');
    clearAll();
    add(() => {
      started.current = performance.now();
      setState('now');
    }, 1200 + Math.random() * 2800);
  }, [add, clearAll]);

  useEffect(() => {
    add(arm, 500);
  }, [arm, add]);

  const click = () => {
    if (state === 'ready') {
      clearAll();
      toast('Too early! Wait for green.', 'error');
      arm();
    } else if (state === 'now') {
      const ms = Math.round(performance.now() - started.current);
      const all = [...times, ms];
      setTimes(all);
      if (all.length >= TRIES) {
        const best = Math.min(...all);
        setState('result');
        onFinish({ ms: best, avg: Math.round(all.reduce((s, x) => s + x, 0) / all.length), tries: all });
      } else {
        setState('wait');
        add(arm, 700);
      }
    }
  };

  return (
    <div className="bg-stage">
      <p className="bg-instruction">Tap the moment it turns green ({times.length}/{TRIES})</p>
      <button type="button" className={`bg-reaction bg-reaction--${state}`} onClick={click}>
        {state === 'ready' ? 'Wait…' : state === 'now' ? 'TAP!' : state === 'result' ? 'Done' : 'Get ready'}
      </button>
      {times.length > 0 && <p className="bg-round">Last: {times.at(-1)} ms · best {Math.min(...times)} ms</p>}
    </div>
  );
}

// ---------- Schulte Table (visual search) ----------
function SchulteGame({ seed, level, onFinish }) {
  const { size, n, cells } = useMemo(() => schulteGrid(level, seed), [level, seed]);
  const [next, setNext] = useState(1);
  const [wrong, setWrong] = useState(null);
  const startedAt = useRef(0);
  const done = useRef(false);

  useEffect(() => {
    startedAt.current = performance.now();
  }, []);

  const tap = (value) => {
    if (done.current) return;
    if (value !== next) {
      setWrong(value);
      setTimeout(() => setWrong(null), 250);
      return;
    }
    if (value >= n) {
      done.current = true;
      onFinish({ ms: Math.round(performance.now() - startedAt.current), count: n });
      return;
    }
    setNext(value + 1);
  };

  return (
    <div className="bg-stage">
      <div className="bg-hud"><span>Find <b>{next}</b></span><span>{next - 1} / {n}</span></div>
      <p className="bg-instruction">Tap the numbers in order, 1 → {n}, as fast as you can</p>
      <div className="bg-schulte" style={{ '--cols': size }}>
        {cells.map((value) => (
          <button
            key={value}
            type="button"
            className={`bg-cell ${value < next ? 'got' : ''} ${wrong === value ? 'bad' : ''}`}
            onClick={() => tap(value)}
          >
            {value}
          </button>
        ))}
      </div>
    </div>
  );
}

// ---------- Logic Sequence (reasoning) ----------
function LogicGame({ seed, level, onFinish }) {
  const [n, setN] = useState(0);
  const [left, setLeft] = useState(60);
  const [correct, setCorrect] = useState(0);
  const wrong = useRef(0);
  const [flash, setFlash] = useState(null); // { value, ok }
  const p = useMemo(() => logicProblem(level, seed + n * 613), [level, seed, n]);
  const done = useRef(false);

  useEffect(() => {
    if (left <= 0) {
      if (!done.current) {
        done.current = true;
        onFinish({ correct, wrong: wrong.current });
      }
      return undefined;
    }
    const t = setTimeout(() => setLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [left, correct, onFinish]);

  const answer = (value) => {
    if (done.current || flash) return;
    const ok = value === p.answer;
    if (ok) setCorrect((x) => x + 1);
    else wrong.current += 1;
    setFlash({ value, ok });
    setTimeout(() => {
      setFlash(null);
      setN((x) => x + 1);
    }, ok ? 300 : 900);
  };

  return (
    <div className="bg-stage">
      <div className="bg-hud"><span>⏱ {left}s</span><span>✓ {correct}</span><span>✗ {wrong.current}</span></div>
      <p className="bg-instruction">What number comes next?</p>
      <p className="bg-sequence">{p.terms.join('  ,  ')}  ,  <b>?</b></p>
      {flash && !flash.ok && <p className="bg-reveal">It was <b>{p.answer}</b> · {p.rule}</p>}
      <div className="bg-choices bg-choices--wrap">
        {p.options.map((o) => (
          <button
            key={o}
            type="button"
            className={`bg-choice ${flash && o === flash.value ? (flash.ok ? 'right' : 'wrong') : ''} ${flash && o === p.answer ? 'right' : ''}`}
            onClick={() => answer(o)}
          >
            {o}
          </button>
        ))}
      </div>
    </div>
  );
}

const GAME_COMPONENTS = { memory: MemoryGame, nback: NBackGame, math: MathGame, stroop: StroopGame, span: SpanGame, reaction: ReactionGame, schulte: SchulteGame, logic: LogicGame };

const GUIDE = [
  ['Warm up daily', 'A few minutes every day beats an hour once a week. Keep your streak alive.'],
  ['Push the level', 'When a game feels easy, go up a level. Your brain only grows at the edge of hard.'],
  ['N-Back is king', 'Dual N-Back is the most researched brain trainer. Start at 1, add a level when you pass 80%.'],
  ['Widen your gaze', 'In Schulte Table, hold your eyes on the centre and find numbers with your side vision. It speeds up reading too.'],
  ['Find the rule', 'In Logic Sequence, check the gaps first (do they add? multiply? grow?). Say the rule out loud before you answer.'],
  ['Mix it up', 'Train a different skill each day — memory, focus, reasoning, speed — so your whole brain gets a workout.'],
  ['Rest matters', 'Sleep turns practice into skill. A tired brain scores worse, so play when fresh.'],
];

// ---------- the page ----------
export default function BrainGym({ onAsk }) {
  const [playing, setPlaying] = useState(null); // { id, level, seed }
  const [result, setResult] = useState(null);
  const [level, setLevel] = useState(() => load('azarvis-braingym-level', 'normal'));
  const [best, setBest] = useState(() => load(BEST_KEY, {}));
  const [streak, setStreak] = useState(() => load(STREAK_KEY, {}));
  const workout = useMemo(() => dailyWorkout(), []);
  const doneToday = streak.last === dayKey();

  useEffect(() => save('azarvis-braingym-level', level), [level]);

  const start = (id) => {
    setResult(null);
    setPlaying({ id, level, seed: (Date.now() % 100000) + 1 });
  };
  const finish = useCallback(
    (raw) => {
      const { id } = playing;
      const score = scoreGame(id, raw, playing.level);
      const key = `${id}.${playing.level}`;
      const prevBest = best[key] || 0;
      const isBest = score > prevBest;
      const nextBest = { ...best, [key]: Math.max(prevBest, score) };
      setBest(nextBest);
      save(BEST_KEY, nextBest);
      const nextStreak = updateStreak(streak);
      setStreak(nextStreak);
      save(STREAK_KEY, nextStreak);
      setResult({ id, score, isBest, raw, ...rate(score) });
      setPlaying(null);
      try {
        speak(`${rate(score).label}. You scored ${score}.`);
      } catch {}
    },
    [playing, best, streak],
  );

  const Playing = playing && GAME_COMPONENTS[playing.id];

  if (playing && Playing) {
    const g = getGame(playing.id);
    return (
      <div className="bg-play" style={{ '--hue': g.hue }}>
        <div className="bg-play-head">
          <button type="button" className="btn ghost sm" onClick={() => setPlaying(null)}><Icon name="chevron" size="0.9em" className="flip" /> Quit</button>
          <strong>{g.name}</strong>
          <span className="bg-level-pill">{LEVELS.find((l) => l.id === playing.level)?.label}</span>
        </div>
        <Playing seed={playing.seed} level={playing.level} onFinish={finish} />
      </div>
    );
  }

  return (
    <div className="bg-home">
      <div className="bg-top">
        <div className="bg-streak" style={{ '--hue': 38 }}>
          <Icon name="zap" size="1.4em" />
          <div>
            <strong>{streak.current || 0}-day streak</strong>
            <small>{doneToday ? 'Done today ✓ · best ' : 'Play one game today · best '}{streak.best || 0}</small>
          </div>
        </div>
        <div className="bg-levels" role="group" aria-label="Difficulty">
          {LEVELS.map((l) => (
            <button key={l.id} type="button" className={`bg-lvl ${level === l.id ? 'on' : ''}`} onClick={() => setLevel(l.id)} aria-pressed={level === l.id}>{l.label}</button>
          ))}
        </div>
      </div>

      {result && (
        <div className="bg-result" style={{ '--hue': getGame(result.id).hue }} role="status">
          <div className="bg-result-score">
            <span className="bg-stars">{'★'.repeat(result.stars)}{'☆'.repeat(5 - result.stars)}</span>
            <strong>{result.score}</strong>
            <small>{getGame(result.id).name} · {result.label}{result.isBest ? ' · new best! 🎉' : ''}</small>
          </div>
          <div className="bg-result-actions">
            <button type="button" className="btn primary sm" onClick={() => start(result.id)}><Icon name="refresh" size="0.9em" /> Again</button>
            {onAsk && <button type="button" className="btn sm" onClick={() => onAsk(`Give me one quick tip to get better at a ${getGame(result.id).skill.toLowerCase()} brain game.`)}><Icon name="sparkles" size="0.9em" /> Tip</button>}
          </div>
        </div>
      )}

      <section className="bg-section">
        <h3 className="bg-h"><Icon name="calendar" size="1em" /> Today's workout</h3>
        <p className="muted small">Three games picked for today. Finish all three to train every skill.</p>
        <div className="bg-cards">
          {workout.games.map((g) => (
            <button key={g.id} type="button" className="bg-card bg-card--daily" style={{ '--hue': g.hue }} onClick={() => start(g.id)}>
              <span className="bg-card-icon"><Icon name={g.icon} /></span>
              <strong>{g.name}</strong>
              <small>{g.skill}</small>
              {best[`${g.id}.${level}`] != null && <span className="bg-card-best">Best {best[`${g.id}.${level}`]}</span>}
            </button>
          ))}
        </div>
      </section>

      <section className="bg-section">
        <h3 className="bg-h"><Icon name="brain" size="1em" /> All games</h3>
        <div className="bg-cards">
          {GAMES.map((g) => (
            <button key={g.id} type="button" className="bg-card" style={{ '--hue': g.hue }} onClick={() => start(g.id)}>
              <span className="bg-card-icon"><Icon name={g.icon} /></span>
              <span className="grow">
                <strong>{g.name}</strong>
                <small>{g.blurb}</small>
              </span>
              <span className="bg-card-foot">
                {best[`${g.id}.${level}`] != null && <span className="bg-card-best">Best {best[`${g.id}.${level}`]}</span>}
                <Icon name="play" size="0.95em" />
              </span>
            </button>
          ))}
        </div>
      </section>

      <section className="bg-section bg-guide">
        <h3 className="bg-h"><Icon name="book" size="1em" /> How to train your brain</h3>
        <ul>
          {GUIDE.map(([t, d]) => (
            <li key={t}><Icon name="check" size="1em" /> <span><strong>{t}.</strong> {d}</span></li>
          ))}
        </ul>
      </section>
      <p className="lab-note bg-note"><Icon name="shield" size="0.95em" /> Runs fully in your browser. Scores and your streak are saved only on this device.</p>
    </div>
  );
}
