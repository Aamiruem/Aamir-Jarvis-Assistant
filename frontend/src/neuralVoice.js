// The Jarvis voice: Microsoft neural voices made by the Azarvis AI service (POST /api/ai/tts),
// played through Web Audio so it can be LOUDER than the browser's 100% and clearer:
//
//   mp3 → gain (loudness boost, up to 2.5×) → presence EQ (+ clarity) → low shelf (depth)
//       → compressor/limiter (no distortion when boosted) → speakers
//
// Used when the AI service is reachable (signed in, Azarvis running on this PC). Otherwise every
// caller falls back to the browser's own voice (speechSynthesis), so speech always works.
import { requestRaw } from './api.js';
import { readVoiceExtras } from './voiceSettings.js';
import { neuralVoiceFor, readLanguage } from './languages.js';

let ctx = null;
let chain = null;
let available = null; // null = not checked yet
let checking = null;

function audio() {
  if (ctx) return ctx;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  ctx = new AC();
  const gain = ctx.createGain();
  const presence = ctx.createBiquadFilter(); // the 2–4 kHz band that makes words easy to understand
  presence.type = 'peaking';
  presence.frequency.value = 3200;
  presence.Q.value = 0.9;
  const depth = ctx.createBiquadFilter(); // a little chest: the "Jarvis" weight
  depth.type = 'lowshelf';
  depth.frequency.value = 180;
  const limiter = ctx.createDynamicsCompressor();
  limiter.threshold.value = -14;
  limiter.knee.value = 10;
  limiter.ratio.value = 8;
  limiter.attack.value = 0.003;
  limiter.release.value = 0.2;
  gain.connect(presence).connect(depth).connect(limiter).connect(ctx.destination);
  chain = { gain, presence, depth };
  return ctx;
}

/** Applies the saved loudness / clarity / depth to the audio chain. */
function tune() {
  if (!chain) return;
  const { boost, clarity, depth } = readVoiceExtras();
  chain.gain.gain.value = boost;
  chain.presence.gain.value = clarity ? 4 : 0;
  chain.depth.gain.value = depth ? 3 : 0;
}

/** Is the neural voice reachable? Checked once per page (and again after a failure). */
export async function neuralAvailable() {
  if (readVoiceExtras().engine === 'browser') return false;
  if (available !== null) return available;
  checking ??= requestRaw('/ai/tts/voices')
    .then((r) => (available = Boolean(r?.ok)))
    .catch(() => (available = false))
    .finally(() => (checking = null));
  return checking;
}
export const neuralKnownAvailable = () => available === true && readVoiceExtras().engine !== 'browser';

/** Pauses / resumes the neural voice mid-word (someone started talking over Azarvis). */
export const pauseNeural = () => ctx?.state === 'running' && ctx.suspend().catch(() => {});
export const resumeNeural = () => ctx?.state === 'suspended' && ctx.resume().catch(() => {});

/** The browser only allows sound after a click or key press: call this from one. */
export function unlockAudio() {
  const c = audio();
  if (c?.state === 'suspended') c.resume().catch(() => {});
}

// No neural voice exists for this text's language: the caller's browser voice reads it instead,
// and the neural voice stays on for everything else.
const noVoice = () => Object.assign(new Error('no neural voice for this language'), { noVoice: true });

async function fetchClip(text, { rate = 1, pitch = 1 } = {}, voice) {
  const { neuralVoice, neuralRate, neuralPitch } = readVoiceExtras();
  // A voice that speaks the text's language: given by the caller, else found from the text.
  const id = voice || neuralVoiceFor(text, readLanguage(), neuralVoice);
  if (!id) throw noVoice();
  // The user's speed/pitch multipliers (and the reply's mood) on top of the voice's own setting.
  const body = {
    text,
    voice: id,
    rate: Math.round(Math.max(-50, Math.min(60, neuralRate + (rate - 1) * 100))),
    pitch: Math.round(Math.max(-30, Math.min(30, neuralPitch + (pitch - 1) * 40))),
  };
  const res = await requestRaw('/ai/tts', { method: 'POST', body });
  if (!res?.ok) throw new Error(`neural voice ${res?.status ?? 'unavailable'}`);
  const c = audio();
  return c.decodeAudioData(await res.arrayBuffer());
}

/**
 * A queue of sentences spoken one after another. Each clip is fetched as soon as it is queued
 * (so the next sentence is ready when the current one ends): no gaps.
 *   const q = createNeuralQueue(); q.say(text, style, onDone, voice); q.stop();
 */
export function createNeuralQueue({ onError } = {}) {
  const items = [];
  let playing = null;
  let stopped = false;

  const playNext = async () => {
    if (playing || stopped || !items.length) return;
    const item = items[0];
    let buffer;
    try {
      buffer = await item.clip;
    } catch (err) {
      if (!err.noVoice) available = false; // fall back to the browser voice from now on (rechecked next page load)
      items.shift();
      onError?.(err, item);
      return playNext();
    }
    if (stopped) return;
    const c = audio();
    tune();
    if (c.state === 'suspended') await c.resume().catch(() => {});
    const src = c.createBufferSource();
    src.buffer = buffer;
    src.connect(chain.gain);
    playing = src;
    src.onended = () => {
      playing = null;
      items.shift();
      item.onDone?.();
      playNext();
    };
    src.start();
  };

  return {
    /** voice: a neural voice id for this text; omitted = one that speaks the text's language. */
    say(text, style, onDone, voice) {
      stopped = false;
      const clip = fetchClip(text, style, voice);
      clip.catch(() => {}); // handled when its turn comes (playNext)
      items.push({ text, onDone, clip });
      playNext();
    },
    stop() {
      stopped = true;
      const pending = items.splice(0);
      try {
        playing?.stop();
      } catch {}
      playing = null;
      pending.forEach((i) => i.onStopped?.());
    },
    get busy() {
      return Boolean(playing) || items.length > 0;
    },
  };
}

/** Speaks one phrase (alerts, tests, greetings): neural when possible, else the browser voice. */
let single = null;
export async function speakOnce(text, browserSpeak) {
  if (await neuralAvailable()) {
    single?.stop();
    single = createNeuralQueue({ onError: () => browserSpeak?.(text) });
    single.say(text);
    return true;
  }
  browserSpeak?.(text);
  return false;
}
export const stopSpeakOnce = () => single?.stop();

// Browsers start audio muted until the first click / key press on the page: unlock it then.
if (typeof window !== 'undefined') {
  const once = () => {
    unlockAudio();
    window.removeEventListener('pointerdown', once);
    window.removeEventListener('keydown', once);
  };
  window.addEventListener('pointerdown', once);
  window.addEventListener('keydown', once);
}
