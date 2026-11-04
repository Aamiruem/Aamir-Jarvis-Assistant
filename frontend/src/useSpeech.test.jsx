// The voice hook against a fake microphone (SpeechRecognition) and speaker (speechSynthesis),
// with fake timers, so pauses, echo and interruptions can be tested without a real browser.
import { act, createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

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
  /** phrases: [[text, isFinal], ...] - the full result list, as Chrome sends it each time */
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
  get speaking() {
    return this.queue.length > 0;
  },
  pending: false,
  speak(u) {
    this.queue.push(u);
    this.spoken.push(u.text);
  },
  cancel() {
    this.queue = [];
  },
  /** the current utterance finishes playing */
  finishOne() {
    const u = this.queue.shift();
    act(() => u?.onend?.());
  },
  getVoices: () => [],
  addEventListener() {},
  removeEventListener() {},
};
window.speechSynthesis = synth;

const { useSpeech } = await import('./useSpeech.js');

let speech;
let root;
const calls = { final: [], silence: 0, bargeIn: 0 };
function Harness() {
  speech = useSpeech({
    onFinal: (t) => calls.final.push(t),
    onSilence: () => (calls.silence += 1),
    onBargeIn: () => (calls.bargeIn += 1),
  });
  return null;
}
const mic = () => recs.at(-1);
const wait = (ms) => act(() => vi.advanceTimersByTime(ms));

beforeEach(() => {
  vi.useFakeTimers();
  Object.assign(calls, { final: [], silence: 0, bargeIn: 0 });
  synth.queue = [];
  synth.spoken = [];
  root = createRoot(document.createElement('div'));
  act(() => root.render(createElement(Harness)));
});
afterEach(() => {
  act(() => root.unmount());
  vi.useRealTimers();
});

describe('listening', () => {
  it('one request: stops at the first pause and hands the words over', () => {
    act(() => speech.start());
    mic().hear([['what time is it', false]]);
    wait(1400);
    expect(calls.final).toEqual(['what time is it']);
    expect(mic().running).toBe(false);
  });

  it('conversation: keeps the mic open and hands over each pause separately', () => {
    act(() => speech.start({ keepOpen: true }));
    mic().hear([['open notepad', true]]);
    wait(800);
    mic().hear([['open notepad', true], ['volume up', true]]);
    wait(800);
    expect(calls.final).toEqual(['open notepad', 'volume up']);
    expect(mic().running).toBe(true);
  });

  it('waits longer when the sentence clearly continues', () => {
    act(() => speech.start({ keepOpen: true }));
    mic().hear([['remind me to call mom and', true]]);
    wait(800);
    expect(calls.final).toEqual([]);
    mic().hear([['remind me to call mom and', true], ['buy milk', true]]);
    wait(800);
    expect(calls.final).toEqual(['remind me to call mom and buy milk']);
  });

  it('reopens straight away when the browser ends the session, without losing words', () => {
    act(() => speech.start({ keepOpen: true }));
    mic().hear([['remind me at six', false]]);
    act(() => mic().stop()); // Chrome ends continuous recognition by itself now and then
    expect(calls.final).toEqual(['remind me at six']);
    expect(mic().running).toBe(true);
  });

  it('reports silence without closing the mic', () => {
    act(() => speech.start({ keepOpen: true }));
    wait(8100);
    expect(calls.silence).toBe(1);
    expect(mic().running).toBe(true);
  });
});

describe('speaking', () => {
  it('starts talking after the first sentence, before the reply is complete', () => {
    const done = vi.fn();
    let out;
    act(() => {
      out = speech.speakStream();
      out.push('Hello there');
    });
    expect(synth.spoken).toEqual([]);
    act(() => out.push('. How are'));
    expect(synth.spoken).toEqual(['Hello there.']);
    expect(speech.speaking).toBe(true);
    act(() => {
      out.push(' you?');
      out.end(done);
    });
    expect(synth.spoken).toEqual(['Hello there.', 'How are you?']);
    synth.finishOne();
    expect(done).not.toHaveBeenCalled();
    synth.finishOne();
    expect(done).toHaveBeenCalledTimes(1);
    expect(speech.speaking).toBe(false);
  });

  it("ignores its own voice, and stops when the user talks over it", () => {
    act(() => speech.start({ keepOpen: true }));
    act(() => speech.speakStream().push('The weather in Pune is sunny today. '));
    mic().hear([['the weather in pune is sunny', false]]);
    wait(2000);
    expect(calls.final).toEqual([]);
    expect(speech.speaking).toBe(true);

    const heard = [['the weather in pune is sunny', true], ['stop that please', false]];
    mic().hear(heard);
    mic().hear(heard);
    expect(calls.bargeIn).toBe(1);
    expect(speech.speaking).toBe(false);
    wait(1300);
    expect(calls.final).toEqual(['stop that please']);
  });

  it('drops what the mic heard while it talked, and hears the next request', () => {
    act(() => speech.start({ keepOpen: true }));
    let out;
    act(() => {
      out = speech.speakStream();
      out.push('Okay. ');
      out.end();
    });
    mic().hear([['okay', true]]);
    synth.finishOne();
    mic().hear([['okay', true], ['what time is it', false]]);
    wait(1300);
    expect(calls.final).toEqual(['what time is it']);
  });

  it('still reports the end of a reply that was interrupted', () => {
    const done = vi.fn();
    act(() => {
      const out = speech.speakStream();
      out.push('A long answer. ');
      out.end(done);
    });
    act(() => speech.stopSpeaking());
    expect(done).toHaveBeenCalledTimes(1);
  });

  it('speak() with nothing to say finishes at once', () => {
    const done = vi.fn();
    act(() => speech.speak('**  **', done));
    expect(done).toHaveBeenCalledTimes(1);
    expect(synth.spoken).toEqual([]);
  });
});
