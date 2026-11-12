// Brain Gym: original brain-exercise games that run entirely in the browser (no server, no account),
// so they work in the demo too. This file is pure logic (no React, no DOM): scoring, difficulty,
// the daily workout and the streak, plus the maths each game needs. Tested in brainGym.test.js.

// ---------- the games ----------
export const GAMES = [
  { id: 'memory', name: 'Memory Grid', icon: 'brain', hue: 265, skill: 'Short-term memory', blurb: 'Watch the tiles light up, then repeat the sequence. It gets one longer each round.' },
  { id: 'nback', name: 'N-Back', icon: 'timeline', hue: 190, skill: 'Working memory', blurb: 'Say when the square is in the same place it was N steps ago. The hardest, most proven brain trainer.' },
  { id: 'math', name: 'Speed Math', icon: 'zap', hue: 45, skill: 'Mental maths', blurb: 'Solve as many as you can in 60 seconds. Three wrong answers ends it.' },
  { id: 'stroop', name: 'Colour Clash', icon: 'eye', hue: 330, skill: 'Focus & control', blurb: 'Tap the COLOUR of the word, not what it says. Your brain fights you.' },
  { id: 'span', name: 'Number Span', icon: 'keyboard', hue: 160, skill: 'Attention', blurb: 'A number flashes, then you type it back. One digit longer each time.' },
  { id: 'reaction', name: 'Reaction', icon: 'pulse', hue: 0, skill: 'Reflexes', blurb: 'Tap the instant it turns green. Measures your reaction time in milliseconds.' },
];

export const getGame = (id) => GAMES.find((g) => g.id === id);

export const LEVELS = [
  { id: 'easy', label: 'Easy', mult: 0.8 },
  { id: 'normal', label: 'Normal', mult: 1 },
  { id: 'hard', label: 'Hard', mult: 1.3 },
  { id: 'insane', label: 'Insane', mult: 1.7 },
];
export const levelMult = (id) => (LEVELS.find((l) => l.id === id) || LEVELS[1]).mult;

// ---------- a tiny seeded RNG, so a given seed always makes the same game ----------
export function rng(seed = Date.now()) {
  let a = (seed >>> 0) || 1;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const pick = (rand, arr) => arr[Math.floor(rand() * arr.length)];
const randInt = (rand, lo, hi) => lo + Math.floor(rand() * (hi - lo + 1));

// ---------- Memory Grid ----------
// A sequence of tile indexes (0..size-1). Round N has N+2 taps; difficulty grows the grid.
export function gridSize(level) {
  return { easy: 3, normal: 3, hard: 4, insane: 5 }[level] || 3; // size × size
}
export function memorySequence(round, size, seed) {
  const rand = rng(seed + round * 101);
  const n = round + 2;
  const cells = size * size;
  return Array.from({ length: n }, () => Math.floor(rand() * cells));
}

// ---------- N-Back ----------
// positions[i] is a cell 0..8; a "target" at i means positions[i] === positions[i-n].
// About 30% of steps are made into targets so the game isn't all "no".
export function nBackLevel(level) {
  return { easy: 1, normal: 2, hard: 3, insane: 4 }[level] || 2;
}
export function nBackSequence(length, n, seed) {
  const rand = rng(seed);
  const pos = [];
  for (let i = 0; i < length; i++) {
    if (i >= n && rand() < 0.3) pos.push(pos[i - n]);
    else {
      let c = Math.floor(rand() * 9);
      if (i >= n && c === pos[i - n]) c = (c + 1 + Math.floor(rand() * 8)) % 9; // avoid an accidental match
      pos.push(c);
    }
  }
  const targets = pos.map((_, i) => i >= n && pos[i] === pos[i - n]);
  return { pos, targets };
}

// ---------- Speed Math ----------
export function mathProblem(level, seed) {
  const rand = rng(seed);
  const m = levelMult(level);
  const hi = Math.round(10 * m);
  const ops = m >= 1.3 ? ['+', '-', '×', '÷'] : m >= 1 ? ['+', '-', '×'] : ['+', '-'];
  const op = pick(rand, ops);
  let a = randInt(rand, 2, hi);
  let b = randInt(rand, 2, hi);
  let answer;
  if (op === '+') answer = a + b;
  else if (op === '-') {
    if (b > a) [a, b] = [b, a];
    answer = a - b;
  } else if (op === '×') {
    a = randInt(rand, 2, Math.round(9 * m));
    b = randInt(rand, 2, Math.round(9 * m));
    answer = a * b;
  } else {
    // division that comes out whole
    b = randInt(rand, 2, Math.round(9 * m));
    answer = randInt(rand, 2, Math.round(9 * m));
    a = b * answer;
  }
  // Three choices: the answer and two near-misses.
  const wrong = new Set();
  let guard = 0;
  while (wrong.size < 2 && guard++ < 20) {
    const d = randInt(rand, -5, 5);
    if (d !== 0 && answer + d >= 0) wrong.add(answer + d);
  }
  const choices = [answer, ...wrong].sort(() => rand() - 0.5);
  return { text: `${a} ${op} ${b}`, answer, choices };
}

// ---------- Colour Clash (Stroop) ----------
export const STROOP_COLOURS = [
  { name: 'RED', hex: '#ef4444' },
  { name: 'GREEN', hex: '#22c55e' },
  { name: 'BLUE', hex: '#3b82f6' },
  { name: 'YELLOW', hex: '#eab308' },
  { name: 'PURPLE', hex: '#a855f7' },
];
export function stroopTrial(level, seed) {
  const rand = rng(seed);
  const pool = STROOP_COLOURS.slice(0, levelMult(level) >= 1.3 ? 5 : 4);
  const word = pick(rand, pool);
  // Most of the time the ink colour differs from the word (that's the challenge).
  let ink = word;
  if (rand() < 0.8) {
    do {
      ink = pick(rand, pool);
    } while (ink.name === word.name);
  }
  const choices = [...pool].sort(() => rand() - 0.5);
  return { word: word.name, ink, answer: ink.name, choices };
}

// ---------- Number Span ----------
export function spanDigits(round, level, seed) {
  const rand = rng(seed + round * 17);
  const len = round + 2 + (levelMult(level) >= 1.3 ? 1 : 0);
  return Array.from({ length: len }, () => Math.floor(rand() * 10)).join('');
}
export const spanFlashMs = (len, level) => Math.max(500, Math.round((900 - len * 40) / levelMult(level)));

// ---------- scoring: 0-100 with a star rating and a word ----------
export function rate(score) {
  const stars = score >= 90 ? 5 : score >= 75 ? 4 : score >= 55 ? 3 : score >= 35 ? 2 : 1;
  const label = ['Keep going', 'Warming up', 'Sharp', 'Impressive', 'Genius'][stars - 1];
  return { stars, label };
}

/** Each game turns its raw result into a 0-100 score (higher is better). */
export function scoreGame(id, raw, level = 'normal') {
  const m = levelMult(level);
  switch (id) {
    case 'memory':
      return clamp(Math.round((raw.round - 1) * 12 * (0.7 + m * 0.3)));
    case 'nback':
      return clamp(Math.round((raw.accuracy ?? 0) * 100 * (0.6 + nBackLevel(level) * 0.15)));
    case 'math':
      return clamp(Math.round(raw.correct * 4.2 * (0.6 + m * 0.4)));
    case 'stroop':
      return clamp(Math.round(raw.correct * 3 * (0.6 + m * 0.4)));
    case 'span':
      return clamp(Math.round((raw.best - 2) * 13 * (0.7 + m * 0.3)));
    case 'reaction':
      // 180 ms ≈ 100, 600 ms ≈ 0
      return clamp(Math.round(((600 - (raw.ms ?? 600)) / 420) * 100));
    default:
      return 0;
  }
}
const clamp = (n) => Math.max(0, Math.min(100, n || 0));

// ---------- the daily workout: three games chosen from today's date ----------
export function dayKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
export function dailyWorkout(key = dayKey()) {
  const seed = [...key].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);
  const rand = rng(seed);
  const order = [...GAMES].map((g) => [g, rand()]).sort((a, b) => a[1] - b[1]).map(([g]) => g);
  return { key, seed, games: order.slice(0, 3) };
}

// ---------- the streak (days in a row with at least one game) ----------
export function updateStreak(state, key = dayKey()) {
  const s = state && typeof state === 'object' ? state : {};
  if (s.last === key) return s; // already counted today
  const yesterday = dayKey(new Date(new Date(`${key}T12:00:00`).getTime() - 86400000));
  const current = s.last === yesterday ? (s.current || 0) + 1 : 1;
  return { last: key, current, best: Math.max(s.best || 0, current), days: (s.days || 0) + 1 };
}
