import { describe, expect, it } from 'vitest';
import { afterWakeWord } from './wakeWord.js';

describe('afterWakeWord', () => {
  it('hears the new name and the ways it is misheard', () => {
    expect(afterWakeWord('Hey Azarvis, open notepad')).toBe('open notepad');
    expect(afterWakeWord('as Jarvis what time is it')).toBe('what time is it');
    expect(afterWakeWord('azar vis play music')).toBe('play music');
  });

  it('still answers to Jarvis', () => {
    expect(afterWakeWord('Jarvis')).toBe('');
    expect(afterWakeWord('ok jarvis, remind me at 5')).toBe('remind me at 5');
  });

  it('ignores speech without the name', () => {
    expect(afterWakeWord('we should open the window')).toBeNull();
  });
});
