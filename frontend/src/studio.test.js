import { describe, expect, it } from 'vitest';
import { classifyProblem, completeIdea, DEMO_IDEAS, keywords, parseIdea, parseProblem, runSolver, runSpecialist, strength, TEAMS, urgency } from './studio.js';

describe('parseIdea', () => {
  it('splits a typed idea into the idea map', () => {
    const m = parseIdea(DEMO_IDEAS.create);
    expect(m.idea).toBe('Consistency beats talent');
    expect(m.quote).toBe('Ship small, ship often.'.replace(/\.$/, ''));
    expect(m.proof).toMatch(/12 months/);
    expect(m.take).toMatch(/Most people wait/);
    expect(m.story).toMatch(/Last year I posted/);
    expect(m.audience).toBe('students learning AI and web development');
  });
  it('works with a single sentence', () => {
    expect(parseIdea('Sleep is a superpower')).toEqual({ idea: 'Sleep is a superpower' });
  });
});

describe('strength', () => {
  it('grows as the map fills and says what is missing', () => {
    expect(strength({}).score).toBe(0);
    const half = strength({ idea: 'Consistency beats talent every single time', story: 'I posted weekly for a year' });
    expect(half.score).toBeGreaterThan(20);
    expect(half.missing).toEqual(['quote', 'proof', 'hot take', 'audience']);
    expect(strength(parseIdea(DEMO_IDEAS.create)).label).toMatch(/Strong|Good/);
  });
});

describe('content team', () => {
  const map = parseIdea(DEMO_IDEAS.create);
  it('every specialist delivers, with 9 images in total', () => {
    const results = TEAMS.create.map((m) => runSpecialist(m.id, map, { tone: 'founder', handle: '@aamir' }));
    expect(results.every((r) => r.text.length > 40)).toBe(true);
    expect(results.reduce((n, r) => n + r.images.length, 0)).toBe(9);
  });
  it('writes in the chosen tone and uses the handle', () => {
    expect(runSpecialist('linkedin', map, { tone: 'bold' }).text).toMatch(/Period\./);
    expect(runSpecialist('linkedin', map, { tone: 'teacher' }).text).toMatch(/simple idea/);
    expect(runSpecialist('xthread', map, { handle: '@aamir' }).text).toMatch(/Follow @aamir/);
  });
  it('keeps X posts under 280 characters and plans 7 days', () => {
    const thread = runSpecialist('xthread', map).text.split('\n\n');
    expect(thread).toHaveLength(6);
    expect(thread.every((t) => t.length <= 280)).toBe(true);
    expect(runSpecialist('calendar', map).plan).toHaveLength(7);
  });
  it('fills gaps when only the idea is known', () => {
    const m = completeIdea({ idea: 'Learn Python by building games' });
    expect(Object.values(m).every(Boolean)).toBe(true);
    expect(keywords('Learn Python by building games with Python')[0]).toBe('python');
  });
});

describe('problem team', () => {
  it('recognises the kind of problem and its urgency', () => {
    expect(classifyProblem(DEMO_IDEAS.solve).topic.id).toBe('slow-pc');
    expect(classifyProblem('my wifi keeps disconnecting').topic.id).toBe('internet');
    expect(classifyProblem('npm build error on vercel').topic.id).toBe('code');
    expect(classifyProblem('I cannot focus on my exam revision').topic.id).toBe('study');
    expect(classifyProblem('my cat ignores me').topic.id).toBe('general');
    expect(urgency('interview tomorrow, need help asap')).toBe('High');
  });
  it('splits a typed problem and builds a plan without repeating what was tried', () => {
    const m = parseProblem(DEMO_IDEAS.solve);
    expect(m.since).toMatch(/last week/);
    expect(m.tried).toMatch(/restarting/);
    expect(m.goal).toMatch(/want/);
    const results = Object.fromEntries(TEAMS.solve.map((t) => [t.id, runSolver(t.id, m)]));
    expect(results.listener.text).toMatch(/Slow or freezing computer/);
    expect(results.fixer.text).not.toMatch(/Restart the PC/); // already tried
    expect(results.planner.text).toMatch(/Step 1\./);
    expect(results.checker.reminders).toHaveLength(2);
  });
  it('finds "since when" inside the first sentence', () => {
    const m = parseProblem('My wifi keeps disconnecting every evening when I join online classes, it started 3 days ago. I tried restarting the router.');
    expect(m.since).toBe('It started 3 days ago');
    expect(m.problem).toBe('My wifi keeps disconnecting every evening when I join online classes');
    expect(m.tried).toMatch(/restarting the router/);
  });
});
