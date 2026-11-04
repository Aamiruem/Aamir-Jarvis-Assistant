import { describe, expect, it } from 'vitest';
import { cleanForSpeech, isBargeIn, isEcho, pauseFor, pickVoice, takeSentences } from './speechText.js';

describe('cleanForSpeech', () => {
  it('reads link text, not Markdown or URLs', () => {
    expect(cleanForSpeech('**Done.** See [the docs](https://x.dev/a) or https://y.dev/b')).toBe(
      'Done. See the docs or the link on screen',
    );
  });
  it('drops list markers and code blocks', () => {
    expect(cleanForSpeech('- one\n2. two\n```js\nx()\n```')).toBe('one two (code shown on screen)');
  });
});

describe('takeSentences', () => {
  it('releases finished sentences and keeps the rest', () => {
    expect(takeSentences('It is sunny. Highs of 3')).toEqual({ chunks: ['It is sunny.'], rest: ' Highs of 3' });
  });
  it('does not split a decimal number', () => {
    expect(takeSentences('That is 3.5 kilometres')).toEqual({ chunks: [], rest: 'That is 3.5 kilometres' });
  });
  it('flushes everything at the end', () => {
    expect(takeSentences('Last bit', true)).toEqual({ chunks: ['Last bit'], rest: '' });
  });
  it('speaks a long sentence up to a comma instead of waiting', () => {
    const long = `${'word '.repeat(20)}, and then ${'more '.repeat(25)}`;
    const { chunks } = takeSentences(long);
    expect(chunks).toHaveLength(1);
  });
});

describe('pauseFor', () => {
  it('is quick once the words are settled, patient mid-thought', () => {
    expect(pauseFor('open notepad', true)).toBeLessThan(pauseFor('open notepad', false));
    expect(pauseFor('remind me to call mom and', true)).toBeGreaterThan(pauseFor('open notepad', false));
  });
});

describe('echo and barge-in', () => {
  const spoken = 'The weather in Pune is sunny with a high of 31 degrees.';
  it("recognizes Jarvis's own voice", () => {
    expect(isEcho('the weather in pune is sunny', spoken)).toBe(true);
    expect(isBargeIn('the weather in pune is sunny', spoken)).toBe(false);
  });
  it('treats new words as the user talking', () => {
    expect(isBargeIn('stop that please', spoken)).toBe(true);
    expect(isBargeIn('stop', spoken)).toBe(false); // one word is too easy to mishear
  });
});

describe('pickVoice', () => {
  const voices = [
    { name: 'Microsoft Heera - English (India)', lang: 'en-IN', localService: true },
    { name: 'Microsoft Neerja Online (Natural) - English (India)', lang: 'en-IN', localService: false },
    { name: 'Google US English', lang: 'en-US', localService: false },
    { name: 'Google हिन्दी', lang: 'hi-IN', localService: false },
  ];
  it('prefers a natural voice in the right language', () => {
    expect(pickVoice(voices, 'en-IN').name).toMatch(/Neerja/);
  });
  it('falls back to the same language family', () => {
    expect(pickVoice(voices, 'en-GB').name).toMatch(/Neerja|Google US/);
  });
  it('honours a saved choice', () => {
    expect(pickVoice(voices, 'en-IN', 'Google US English').name).toBe('Google US English');
  });
  it('returns null with no voices', () => {
    expect(pickVoice([], 'en-IN')).toBeNull();
  });
});
