import { describe, expect, it } from 'vitest';
import { ACTIVITIES, AUTO_ORDER, confirmation, parseCommand } from './commands.js';

describe('robot commands', () => {
  it.each([
    ['Robot, sit down', { type: 'sit' }],
    ['stand up', { type: 'stand' }],
    ['hey azarvis start coding', { type: 'activity', activity: 'coding' }],
    ['start', { type: 'start' }],
    ['coding mode', { type: 'activity', activity: 'coding' }],
    ['turn left', { type: 'rotate', dir: 1 }],
    ['rotate right', { type: 'rotate', dir: -1 }],
    ['turn around', { type: 'spin' }],
    ['look around', { type: 'look' }],
    ['go for a run', { type: 'run' }],
    ['dance!', { type: 'activity', activity: 'dance' }],
    ['teach me', { type: 'activity', activity: 'teaching' }],
    ['auto mode', { type: 'auto' }],
    ['reset', { type: 'reset' }],
    ['stop', { type: 'stop' }],
  ])('%s', (text, action) => {
    expect(parseCommand(text)).toEqual(action);
  });

  it('leaves real questions for the assistant', () => {
    expect(parseCommand('how do I read a CSV file in pandas with dates')).toBeNull();
    expect(parseCommand('what is the capital of France')).toBeNull();
    expect(parseCommand('')).toBeNull();
  });

  it('says something for every command and knows every activity', () => {
    for (const id of AUTO_ORDER) expect(ACTIVITIES[id]).toBeDefined();
    expect(confirmation({ type: 'activity', activity: 'coding' })).toMatch(/code/i);
    expect(confirmation({ type: 'rotate', dir: -1 })).toBe('Turning right.');
  });
});
