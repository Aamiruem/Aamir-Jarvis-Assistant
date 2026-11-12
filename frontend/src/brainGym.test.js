import { describe, expect, it } from 'vitest';
import { dailyWorkout, dayKey, GAMES, getGame, mathProblem, memorySequence, nBackSequence, rate, scoreGame, spanDigits, stroopTrial, updateStreak } from './brainGym.js';

describe('memory grid', () => {
  it('grows by one each round and is the same for a seed', () => {
    expect(memorySequence(1, 3, 42)).toHaveLength(3);
    expect(memorySequence(5, 3, 42)).toHaveLength(7);
    expect(memorySequence(3, 3, 42)).toEqual(memorySequence(3, 3, 42));
    expect(memorySequence(3, 3, 42).every((c) => c >= 0 && c < 9)).toBe(true);
  });
});

describe('n-back', () => {
  it('flags a target exactly when the position repeats n steps back', () => {
    const { pos, targets } = nBackSequence(60, 2, 7);
    expect(pos).toHaveLength(60);
    expect(targets.every((t, i) => t === (i >= 2 && pos[i] === pos[i - 2]))).toBe(true);
    expect(targets.filter(Boolean).length).toBeGreaterThan(5); // some targets exist
    expect(targets.slice(0, 2).every((t) => t === false)).toBe(true); // none possible before n
  });
});

describe('speed math', () => {
  it('the answer is correct and among the choices', () => {
    for (let s = 1; s < 40; s++) {
      for (const lvl of ['easy', 'normal', 'hard', 'insane']) {
        const p = mathProblem(lvl, s);
        const [a, op, b] = p.text.split(' ');
        const calc = { '+': +a + +b, '-': a - b, '×': a * b, '÷': a / b }[op];
        expect(p.answer).toBe(calc);
        expect(Number.isInteger(p.answer)).toBe(true);
        expect(p.answer).toBeGreaterThanOrEqual(0);
        expect(p.choices).toContain(p.answer);
        expect(new Set(p.choices).size).toBe(p.choices.length); // no duplicate choices
      }
    }
  });
});

describe('colour clash', () => {
  it('the answer is the ink colour, not the word, and is a choice', () => {
    let conflicts = 0;
    for (let s = 1; s < 50; s++) {
      const t = stroopTrial('normal', s);
      expect(t.answer).toBe(t.ink.name);
      expect(t.choices.map((c) => c.name)).toContain(t.answer);
      if (t.ink.name !== t.word) conflicts++;
    }
    expect(conflicts).toBeGreaterThan(25); // usually the word and ink disagree
  });
});

describe('number span and scoring', () => {
  it('span grows each round', () => {
    expect(spanDigits(1, 'normal', 5)).toHaveLength(3);
    expect(spanDigits(4, 'normal', 5)).toHaveLength(6);
    expect(/^\d+$/.test(spanDigits(2, 'hard', 5))).toBe(true);
  });
  it('scores are 0-100 and harder levels score higher for the same play', () => {
    expect(scoreGame('math', { correct: 15 }, 'easy')).toBeLessThan(scoreGame('math', { correct: 15 }, 'insane'));
    expect(scoreGame('reaction', { ms: 180 })).toBeGreaterThanOrEqual(99);
    expect(scoreGame('reaction', { ms: 700 })).toBe(0);
    expect(scoreGame('memory', { round: 1 })).toBe(0);
    expect(scoreGame('nback', { accuracy: 1 }, 'normal')).toBe(90);
    for (const g of GAMES) expect(scoreGame(g.id, { round: 3, accuracy: 0.5, correct: 5, best: 5, ms: 300 })).toBeGreaterThanOrEqual(0);
  });
  it('rating turns a score into stars and a word', () => {
    expect(rate(95)).toEqual({ stars: 5, label: 'Genius' });
    expect(rate(10).stars).toBe(1);
  });
});

describe('daily workout', () => {
  it('picks three games, the same all day, different across days', () => {
    const a = dailyWorkout('2026-11-12');
    expect(a.games).toHaveLength(3);
    expect(a.games.every((g) => getGame(g.id))).toBe(true);
    expect(dailyWorkout('2026-11-12').games.map((g) => g.id)).toEqual(a.games.map((g) => g.id));
    expect(dailyWorkout('2026-11-13').games.map((g) => g.id)).not.toEqual(a.games.map((g) => g.id));
  });
});

describe('streak', () => {
  it('counts consecutive days and resets after a gap', () => {
    let s = updateStreak(null, '2026-11-10');
    expect(s).toMatchObject({ current: 1, best: 1, days: 1 });
    s = updateStreak(s, '2026-11-11');
    expect(s).toMatchObject({ current: 2, best: 2, days: 2 });
    s = updateStreak(s, '2026-11-11'); // same day again: no change
    expect(s.current).toBe(2);
    s = updateStreak(s, '2026-11-14'); // skipped days
    expect(s).toMatchObject({ current: 1, best: 2, days: 3 });
  });
  it('dayKey is stable and zero-padded', () => {
    expect(dayKey(new Date(2026, 0, 5, 12))).toBe('2026-01-05');
  });
});
