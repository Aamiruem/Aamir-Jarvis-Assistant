// Turn-taking with a human voice detector (voiceActivity.js is faked here, so the test controls
// "a person is speaking"): Azarvis pauses when someone talks over it, stops on real words, carries
// on after a false alarm, and never starts a reply while someone is still talking.
import { act, createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const vad = { speaking: false, quietMs: Infinity, onStart: null, releaseQuiet: null };
vi.mock('./voiceActivity.js', () => ({
  createVoiceActivity: ({ onStart }) => {
    vad.onStart = onStart;
    return {
      running: true,
      start: async () => true,
      stop() {},
      isSpeaking: () => vad.speaking,
      quietMs: () => vad.quietMs,
      whenQuiet: () => new Promise((resolve) => (vad.releaseQuiet = resolve)),
    };
  },
}));

const recs = [];
class FakeRecognition {
  constructor() {
    this.running = false;
    recs.push(this);
  }
  start() {
    if (this.running) throw new Error('already started');
    this.running = true;
    this.onstart?.();
  }
  stop() {
    if (!this.running) return;
    this.running = false;
    this.onend?.();
  }
  abort() {
    this.stop();
  }
  hear(phrases) {
    const results = phrases.map(([transcript, isFinal]) => Object.assign([{ transcript, confidence: 0.9 }], { isFinal }));
    act(() => this.onresult({ results, resultIndex: 0 }));
  }
}
window.SpeechRecognition = FakeRecognition;
window.SpeechSynthesisUtterance = class {
  constructor(text) {
    this.text = text;
  }
};
const synth = {
  queue: [],
  spoken: [],
  utterances: [],
  paused: false,
  get speaking() {
    return this.queue.length > 0;
  },
  pending: false,
  speak(u) {
    this.queue.push(u);
    this.spoken.push(u.text);
    this.utterances.push(u);
  },
  cancel() {
    this.queue = [];
  },
  pause() {
    this.paused = true;
  },
  resume() {
    this.paused = false;
  },
  getVoices: () => [],
  addEventListener() {},
  removeEventListener() {},
};
window.speechSynthesis = synth;

const { useSpeech } = await import('./useSpeech.js');

let speech;
let root;
const calls = { bargeIn: 0 };
function Harness() {
  speech = useSpeech({ onFinal: () => {}, onBargeIn: () => (calls.bargeIn += 1) });
  return null;
}
const mic = () => recs.at(-1);
const wait = (ms) => act(() => vi.advanceTimersByTime(ms));
const flush = () => act(async () => {});

beforeEach(async () => {
  vi.useFakeTimers();
  Object.assign(vad, { speaking: false, quietMs: Infinity, onStart: null, releaseQuiet: null });
  Object.assign(synth, { queue: [], spoken: [], utterances: [], paused: false });
  calls.bargeIn = 0;
  root = createRoot(document.createElement('div'));
  act(() => root.render(createElement(Harness)));
  act(() => speech.start({ keepOpen: true })); // starts the (fake) human-voice detector too
  await flush();
});
afterEach(() => {
  act(() => root.unmount());
  vi.useRealTimers();
});

describe('someone talks while Azarvis speaks', () => {
  it('pauses at once, then carries on after a false alarm (no words)', () => {
    act(() => speech.speak('The weather in Pune is sunny and warm today.'));
    act(() => vad.onStart());
    expect(synth.paused).toBe(true);
    wait(1500);
    expect(synth.paused).toBe(false);
    expect(synth.queue).toHaveLength(1); // still speaking, not cancelled
  });

  it('stops for good on one real word once a human voice was heard', () => {
    act(() => speech.speak('The weather in Pune is sunny and warm today.'));
    vad.speaking = true;
    act(() => vad.onStart());
    mic().hear([['wait', false]]);
    expect(synth.queue).toHaveLength(0);
    expect(calls.bargeIn).toBe(1);
  });

  it('a single word is not enough without a human voice on the mic', () => {
    act(() => speech.speak('The weather in Pune is sunny and warm today.'));
    mic().hear([['wait', false]]);
    expect(synth.queue).toHaveLength(1);
    expect(calls.bargeIn).toBe(0);
  });

  it('stops pausing after two false alarms in one reply (a noisy room)', () => {
    act(() => speech.speak('A long answer that goes on for a while, sentence after sentence.'));
    for (let i = 0; i < 2; i++) {
      act(() => vad.onStart());
      wait(1500);
    }
    act(() => vad.onStart());
    expect(synth.paused).toBe(false);
  });
});

describe('turn-taking', () => {
  it('holds a reply until the person stops talking', async () => {
    vad.quietMs = 100; // someone is talking right now
    act(() => speech.speak('Here is your answer.'));
    expect(synth.spoken).toEqual([]);
    await act(async () => vad.releaseQuiet());
    expect(synth.spoken).toEqual(['Here is your answer.']);
  });

  it('speaks at once when the room is quiet', () => {
    act(() => speech.speak('Here is your answer.'));
    expect(synth.spoken).toEqual(['Here is your answer.']);
  });
});

describe('intonation', () => {
  it('a question is spoken a little higher than a statement', () => {
    act(() => speech.speak('It is ready. Do you want it now?'));
    const [statement, question] = synth.utterances;
    expect(question.pitch).toBeGreaterThan(statement.pitch);
  });
});
