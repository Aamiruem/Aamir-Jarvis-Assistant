import { describe, expect, it } from 'vitest';
import { buildInsights, busiestWindow, devicePressure, partOfDay } from './homeInsights.js';

const now = new Date('2026-11-12T09:00:00');
const at = (h, m = 0) => new Date('2026-11-12T00:00:00').setHours(h, m, 0, 0);

describe('partOfDay', () => {
  it('labels hours sensibly', () => {
    expect(partOfDay(2)).toBe('overnight');
    expect(partOfDay(9)).toBe('the morning');
    expect(partOfDay(14)).toBe('the afternoon');
    expect(partOfDay(19)).toBe('the evening');
    expect(partOfDay(23)).toBe('late tonight');
    expect(partOfDay(null)).toBe('anytime');
  });
});

describe('busiestWindow', () => {
  it('finds the densest 3-hour bucket of upcoming reminders', () => {
    const tasks = [
      { done: false, remind_at: new Date(at(14)).toISOString() },
      { done: false, remind_at: new Date(at(15)).toISOString() },
      { done: false, remind_at: new Date(at(16)).toISOString() },
      { done: false, remind_at: new Date(at(10)).toISOString() },
    ];
    const w = busiestWindow(tasks, now);
    expect(w).not.toBeNull();
    expect(w.hour).toBe(15); // 15,16 and the 14 falls in 12-15 vs 15-18 — densest bucket wins
    expect(w.count).toBeGreaterThanOrEqual(2);
    expect(w.label).toBe('the afternoon');
  });
  it('is null with fewer than two upcoming reminders', () => {
    expect(busiestWindow([{ done: false, remind_at: new Date(at(14)).toISOString() }], now)).toBeNull();
    expect(busiestWindow([], now)).toBeNull();
  });
  it('ignores past and done reminders', () => {
    const tasks = [
      { done: true, remind_at: new Date(at(14)).toISOString() },
      { done: false, remind_at: new Date(at(2)).toISOString() }, // past (before 9am)
    ];
    expect(busiestWindow(tasks, now)).toBeNull();
  });
});

describe('devicePressure', () => {
  it('returns the highest metric and flags >=85 as high', () => {
    expect(devicePressure({ cpu: 20, ram: 92, disk: 40 })).toEqual({ name: 'memory', value: 92, high: true });
    expect(devicePressure({ cpu: 20, ram: 30, disk: 40 }).high).toBe(false);
    expect(devicePressure(null)).toBeNull();
    expect(devicePressure({})).toBeNull();
  });
});

describe('buildInsights', () => {
  it('always returns at least one and never more than max', () => {
    expect(buildInsights({}, 4).length).toBeGreaterThanOrEqual(1);
    const many = buildInsights({
      tasks: [
        { id: 1, done: false, remind_at: new Date(at(2)).toISOString() }, // overdue
        { id: 2, done: false, remind_at: now.toISOString() }, // due today
      ],
      notes: [{ id: 1, read: false }],
      memories: [{ id: 1, fact: 'x' }],
      now,
    }, 3);
    expect(many.length).toBe(3);
  });

  it('surfaces overdue first', () => {
    const out = buildInsights({
      tasks: [{ id: 1, done: false, remind_at: new Date(at(2)).toISOString() }],
      now,
    });
    expect(out[0].id).toBe('overdue');
    expect(out[0].action.send).toBe(true);
  });

  it('nudges to teach when there are no memories, else shows the count', () => {
    expect(buildInsights({ now }).some((i) => i.id === 'teach')).toBe(true);
    const withMem = buildInsights({ memories: [{ id: 1 }, { id: 2 }], now });
    const mem = withMem.find((i) => i.id === 'memory');
    expect(mem.title).toContain('2 facts');
  });

  it('every insight has an icon, hue and an action', () => {
    for (const i of buildInsights({ tasks: [{ id: 1, done: false, remind_at: new Date(at(2)).toISOString() }], notes: [{ id: 1, read: false }], now }, 6)) {
      expect(i.icon).toBeTruthy();
      expect(typeof i.hue).toBe('number');
      expect(i.action.label).toBeTruthy();
      expect(i.action.tab || i.action.prompt).toBeTruthy();
    }
  });
});
