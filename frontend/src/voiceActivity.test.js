// The human-voice decision (pure part of voiceActivity.js) and the per-sentence intonation helper.
import { describe, expect, it } from 'vitest';
import { bandEnergy, createVadState } from './voiceActivity.js';
import { isBargeIn, prosodyFor } from './speechText.js';

const run = (state, frames, opts = {}) => frames.map(([t, energyDb, voiceRatio = 0.8]) => state.update({ t, energyDb, voiceRatio, ...opts }));

describe('createVadState', () => {
  it('learns the room noise, then detects a voice that lasts long enough', () => {
    const s = createVadState();
    run(s, Array.from({ length: 30 }, (_, i) => [i * 30, -70]));
    const out = run(s, Array.from({ length: 10 }, (_, i) => [900 + i * 30, -45]));
    expect(out.some((r) => r.started)).toBe(true);
    expect(s.speaking).toBe(true);
  });

  it('ignores a click shorter than the minimum speech time', () => {
    const s = createVadState();
    run(s, Array.from({ length: 30 }, (_, i) => [i * 30, -70]));
    run(s, [[900, -40], [930, -40], [960, -70], [990, -70]]);
    expect(s.speaking).toBe(false);
  });

  it('ignores loud sound outside the voice band (a fan, a hum)', () => {
    const s = createVadState();
    run(s, Array.from({ length: 30 }, (_, i) => [i * 30, -70]));
    run(s, Array.from({ length: 10 }, (_, i) => [900 + i * 30, -40, 0.1]));
    expect(s.speaking).toBe(false);
  });

  it('needs a louder voice while Azarvis itself is talking (leftover echo)', () => {
    const s = createVadState();
    run(s, Array.from({ length: 30 }, (_, i) => [i * 30, -70]));
    run(s, Array.from({ length: 10 }, (_, i) => [900 + i * 30, -56]), { assistantTalking: true });
    expect(s.speaking).toBe(false);
    run(s, Array.from({ length: 10 }, (_, i) => [1200 + i * 30, -44]), { assistantTalking: true });
    expect(s.speaking).toBe(true);
  });

  it('keeps the turn through short gaps between words, ends after a real pause', () => {
    const s = createVadState();
    run(s, Array.from({ length: 30 }, (_, i) => [i * 30, -70]));
    run(s, Array.from({ length: 10 }, (_, i) => [900 + i * 30, -45]));
    run(s, [[1200, -70], [1400, -70]]);
    expect(s.speaking).toBe(true);
    const out = run(s, [[1800, -70]]);
    expect(out[0].ended).toBe(true);
    expect(s.quietFor(2000)).toBeGreaterThan(500);
  });
});

describe('bandEnergy', () => {
  it('puts a 1 kHz tone in the voice band and a 100 Hz hum outside it', () => {
    const fft = 1024;
    const rate = 48000;
    const bins = (hz) => Float32Array.from({ length: fft / 2 }, (_, i) => (Math.abs(i * (rate / fft) - hz) < rate / fft ? -20 : -110));
    expect(bandEnergy(bins(1000), rate, fft).voiceRatio).toBeGreaterThan(0.9);
    expect(bandEnergy(bins(100), rate, fft).voiceRatio).toBeLessThan(0.1);
  });
});

describe('speech helpers', () => {
  it('one new word is a barge-in only when asked for', () => {
    expect(isBargeIn('wait', 'the weather is sunny')).toBe(false);
    expect(isBargeIn('wait', 'the weather is sunny', 1)).toBe(true);
  });
  it('intonation: questions rise, exclamations are livelier, long sentences slower', () => {
    expect(prosodyFor('Shall I book it?').pitch).toBeGreaterThan(1);
    expect(prosodyFor('Done!').rate).toBeGreaterThan(1);
    expect(prosodyFor('word '.repeat(40)).rate).toBeLessThan(1);
    expect(prosodyFor('This is a normal sentence about the weather today.')).toEqual({ rate: 1, pitch: 1 });
  });
});
