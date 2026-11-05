import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('./api.js', () => ({ api: { memories: vi.fn(), tasks: vi.fn() } }));
const { api } = await import('./api.js');
const { ONBOARDING_QUESTIONS, cleanAnswer, dailyQuestion, markOnboarded, nameFromMemories, remindersLine, sessionPlan } =
  await import('./session.js');

const q = (key) => ONBOARDING_QUESTIONS.find((x) => x.key === key);

describe('cleanAnswer', () => {
  it('keeps the useful part of a spoken answer', () => {
    expect(cleanAnswer(q('name'), 'Call me Aamir.')).toBe('Aamir');
    expect(cleanAnswer(q('name'), "Um, my name's Priya")).toBe('Priya');
    expect(cleanAnswer(q('city'), 'I live in Pune')).toBe('Pune');
    expect(cleanAnswer(q('work'), "I'm a software engineer")).toBe('software engineer');
    expect(cleanAnswer(q('day'), 'I usually wake up at 7 am')).toBe('7 am');
  });
  it('returns nothing when the question is skipped', () => {
    expect(cleanAnswer(q('city'), 'skip')).toBe('');
    expect(cleanAnswer(q('city'), "I don't know.")).toBe('');
  });
  it('builds facts Azarvis can use later', () => {
    expect(q('name').fact('Aamir')).toBe('The user wants to be called Aamir.');
    expect(nameFromMemories([{ fact: 'The user wants to be called Aamir.' }])).toBe('Aamir');
  });
  it('uses the name in the next question', () => {
    expect(q('city').ask({ name: 'Aamir' })).toMatch(/^Nice to meet you, Aamir\./);
  });
});

describe('daily briefing', () => {
  it('keeps the same question all day', () => {
    const morning = new Date('2026-11-04T08:00:00');
    const evening = new Date('2026-11-04T20:00:00');
    expect(dailyQuestion(morning)).toBe(dailyQuestion(evening));
  });
  it("lists only today's open reminders", () => {
    const now = new Date('2026-11-04T09:00:00');
    const tasks = [
      { title: 'Call the bank', remind_at: '2026-11-04T11:00:00', done: false },
      { title: 'Done already', remind_at: '2026-11-04T10:00:00', done: true },
      { title: 'Next week', remind_at: '2026-11-11T10:00:00', done: false },
    ];
    expect(remindersLine(tasks, now)).toMatch(/^You have 1 reminder today: Call the bank at /);
    expect(remindersLine([], now)).toBe('');
  });
});

describe('sessionPlan', () => {
  beforeEach(() => {
    localStorage.clear();
    api.tasks.mockResolvedValue([]);
  });
  it('interviews a new user', async () => {
    api.memories.mockResolvedValue([]);
    const plan = await sessionPlan({ id: 'u1', name: 'Aamir Hussain' });
    expect(plan.interview).toBe(ONBOARDING_QUESTIONS);
    expect(plan.greeting).toMatch(/Aamir! I'm Azarvis/);
  });
  it('greets a returning user with a question instead', async () => {
    api.memories.mockResolvedValue([{ fact: 'The user wants to be called Boss.' }]);
    markOnboarded('u1');
    const plan = await sessionPlan({ id: 'u1', name: 'Aamir Hussain' });
    expect(plan.interview).toBeUndefined();
    expect(plan.greeting).toContain('Boss');
    expect(plan.greeting.endsWith(plan.question)).toBe(true);
  });
  it('can be asked to interview again', async () => {
    api.memories.mockResolvedValue([{ fact: 'a' }, { fact: 'b' }]);
    markOnboarded('u1');
    expect((await sessionPlan({ id: 'u1', name: 'A' }, { interview: true })).interview).toBeTruthy();
  });
  it('still works when the AI service is down', async () => {
    api.memories.mockRejectedValue(new Error('down'));
    api.tasks.mockRejectedValue(new Error('down'));
    expect((await sessionPlan({ id: 'u2', name: 'A' })).greeting).toBeTruthy();
  });
});
