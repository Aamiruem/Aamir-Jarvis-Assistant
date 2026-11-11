import { describe, expect, it } from 'vitest';
import { parseReminder, parseTime, respond } from './brain.js';

describe('parseTime', () => {
  it('reads common spoken and typed times', () => {
    expect(parseTime('at 6 pm')).toBe('18:00');
    expect(parseTime('at 6:30pm')).toBe('18:30');
    expect(parseTime('by 7.15 a.m.')).toBe('07:15');
    expect(parseTime('at 12 am')).toBe('00:00');
    expect(parseTime('at 18:00')).toBe('18:00');
  });
  it('ignores bare numbers and impossible times', () => {
    expect(parseTime('buy 3 apples')).toBe('');
    expect(parseTime('at 25:00')).toBe('');
  });
});

describe('parseReminder', () => {
  it('works with the time at the end or the start', () => {
    expect(parseReminder('Remind me to call mom at 6 pm')).toEqual({ text: 'Call mom', time: '18:00' });
    expect(parseReminder('Hey Azarvis, remind me at 6:30 pm to submit the ML assignment')).toEqual({ text: 'Submit the ML assignment', time: '18:30' });
  });
  it('works without a time, and ignores other sentences', () => {
    expect(parseReminder('remind me to drink water')).toEqual({ text: 'Drink water', time: '' });
    expect(parseReminder('what time is it')).toBeNull();
    expect(parseReminder('remind me')).toBeNull();
  });
});

describe('respond', () => {
  it('turns requests into actions', () => {
    expect(respond('remind me to stretch at 5 pm').action).toEqual({ type: 'task', task: { text: 'Stretch', time: '17:00' } });
    expect(respond('open the notes').action).toEqual({ type: 'demo', section: 'notes' });
    expect(respond('show me your projects').action).toEqual({ type: 'scroll', id: 'projects' });
    expect(respond('dark mode please').action).toEqual({ type: 'theme', mode: 'dark' });
    expect(respond('open arvixa store').action).toEqual({ type: 'link', href: 'https://arvixa-store.vercel.app/' });
    expect(respond('show me real estate in Gurgaon').action.href).toBe('https://gratia-estates.vercel.app/');
    expect(respond('open the interview coach').action.href).toContain('real-time-conversession');
  });
  it('answers questions without an action', () => {
    expect(respond('what time is it').action).toBeUndefined();
    expect(respond('tell me a joke').text).toMatch(/neural network/);
  });
});
