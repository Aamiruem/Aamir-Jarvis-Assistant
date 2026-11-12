// How Azarvis sounds when it talks: which installed voice, how fast, how high or low (pitch)
// and how loud. Saved in this browser and shared by every spoken reply (chat, voice sessions,
// reminder alerts). Changing them fires VOICE_EVENT so a voice that is already loaded updates.
import { pickVoice } from './speechText.js';

const VOICE_KEY = 'jarvis-voice'; // the chosen voice's name (kept from before these settings)
const TUNING_KEY = 'jarvis-voice-tuning';
export const VOICE_EVENT = 'jarvis-voice-change';

// Defaults lean towards a calm, deep "Jarvis" delivery at full volume.
export const DEFAULT_TUNING = { rate: 0.98, pitch: 0.9, volume: 1 };
export const LIMITS = {
  rate: { min: 0.6, max: 1.6, step: 0.05 },
  pitch: { min: 0.5, max: 1.6, step: 0.05 }, // below 1 = deeper, above 1 = higher
  volume: { min: 0.1, max: 1, step: 0.05 },
};

const clamp = (value, { min, max }, fallback) => {
  const n = Number(value);
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : fallback;
};

export function readVoiceName() {
  try {
    return localStorage.getItem(VOICE_KEY) || '';
  } catch {
    return '';
  }
}

export function readTuning() {
  let saved = {};
  try {
    saved = JSON.parse(localStorage.getItem(TUNING_KEY)) || {};
  } catch {
    saved = {};
  }
  return Object.fromEntries(Object.keys(DEFAULT_TUNING).map((k) => [k, clamp(saved[k], LIMITS[k], DEFAULT_TUNING[k])]));
}

/** Saves any of { voice, rate, pitch, volume } and tells every listener. */
export function saveVoiceSettings({ voice, ...tuning }) {
  try {
    if (voice !== undefined) {
      if (voice) localStorage.setItem(VOICE_KEY, voice);
      else localStorage.removeItem(VOICE_KEY);
    }
    if (Object.keys(tuning).length) localStorage.setItem(TUNING_KEY, JSON.stringify({ ...readTuning(), ...tuning }));
  } catch {
    // private mode or storage blocked: the change still applies until the page reloads
  }
  window.dispatchEvent(new Event(VOICE_EVENT));
}

export function resetVoiceSettings() {
  try {
    localStorage.removeItem(VOICE_KEY);
    localStorage.removeItem(TUNING_KEY);
  } catch {
    // nothing saved to remove
  }
  window.dispatchEvent(new Event(VOICE_EVENT));
}

/** Gives an utterance the chosen voice, speed, pitch and volume. */
export function applyVoice(utterance, voice, lang) {
  const { rate, pitch, volume } = readTuning();
  if (voice) utterance.voice = voice;
  utterance.lang = voice?.lang || lang;
  utterance.rate = rate;
  utterance.pitch = pitch;
  utterance.volume = volume;
  return utterance;
}

/** The voice to use right now: the saved choice if it is installed, else the clearest one. */
export const currentVoice = (voices, lang = 'en-IN') => pickVoice(voices, lang, readVoiceName());

/** Voices sorted for a picker: the language's natural (neural) voices first. */
export function voiceOptions(voices, lang = 'en-IN') {
  const base = lang.split('-')[0].toLowerCase();
  const rank = (v) => {
    const vl = (v.lang || '').toLowerCase().replace('_', '-');
    const same = vl === lang.toLowerCase() ? 0 : vl.startsWith(base) ? 1 : 2;
    const natural = /natural|neural|online|google/i.test(v.name) ? 0 : 1;
    return same * 2 + natural;
  };
  return [...voices]
    .sort((a, b) => rank(a) - rank(b) || a.name.localeCompare(b.name))
    .map((v) => ({ name: v.name, lang: v.lang, natural: /natural|neural/i.test(v.name), recommended: rank(v) === 0 }));
}

// ---------- The neural "Jarvis" voice (neuralVoice.js) ----------
// engine: "auto" = neural when Azarvis runs on this PC, else the browser voice; "browser" = always the browser.
// boost: loudness, 1 = normal … 2.5 = much louder (a limiter keeps it clean). clarity / depth: EQ.
const EXTRAS_KEY = 'azarvis-voice-neural';
export const DEFAULT_EXTRAS = { engine: 'auto', neuralVoice: 'en-GB-RyanNeural', neuralRate: -4, neuralPitch: -6, boost: 1.8, clarity: true, depth: true };
export const EXTRA_LIMITS = { neuralRate: { min: -40, max: 50 }, neuralPitch: { min: -25, max: 25 }, boost: { min: 1, max: 2.5 } };

/** Ready-made voice styles: one tap sets the voice, speed, pitch, loudness and EQ. */
export const VOICE_STYLES = [
  { id: 'jarvis', label: 'Jarvis', note: 'British, deep and calm', extras: { neuralVoice: 'en-GB-RyanNeural', neuralRate: -4, neuralPitch: -6, depth: true, clarity: true, boost: 1.8 }, browser: { rate: 0.95, pitch: 0.8 } },
  { id: 'friday', label: 'Friday', note: 'British, bright', extras: { neuralVoice: 'en-GB-SoniaNeural', neuralRate: 2, neuralPitch: 2, depth: false, clarity: true, boost: 1.6 }, browser: { rate: 1.05, pitch: 1.15 } },
  { id: 'desi', label: 'Desi Jarvis', note: 'Indian English, friendly', extras: { neuralVoice: 'en-IN-PrabhatNeural', neuralRate: 0, neuralPitch: -3, depth: true, clarity: true, boost: 1.8 }, browser: { rate: 1, pitch: 0.9 } },
  { id: 'announcer', label: 'Announcer', note: 'Loud and bold', extras: { neuralVoice: 'en-US-GuyNeural', neuralRate: 4, neuralPitch: -2, depth: true, clarity: true, boost: 2.3 }, browser: { rate: 1.05, pitch: 0.85 } },
  { id: 'hindi', label: 'Hindi', note: 'हिंदी आवाज़', extras: { neuralVoice: 'hi-IN-MadhurNeural', neuralRate: 0, neuralPitch: 0, depth: false, clarity: true, boost: 1.8 }, browser: { rate: 1, pitch: 1 } },
];

export function readVoiceExtras() {
  let saved = {};
  try {
    saved = JSON.parse(localStorage.getItem(EXTRAS_KEY)) || {};
  } catch {
    saved = {};
  }
  const out = { ...DEFAULT_EXTRAS, ...saved };
  for (const [k, lim] of Object.entries(EXTRA_LIMITS)) out[k] = clamp(out[k], lim, DEFAULT_EXTRAS[k]);
  out.engine = out.engine === 'browser' ? 'browser' : 'auto';
  out.clarity = Boolean(out.clarity);
  out.depth = Boolean(out.depth);
  return out;
}

export function saveVoiceExtras(patch) {
  try {
    localStorage.setItem(EXTRAS_KEY, JSON.stringify({ ...readVoiceExtras(), ...patch }));
  } catch {
    // storage blocked: applies until reload
  }
  window.dispatchEvent(new Event(VOICE_EVENT));
}

/** Applies a style to both engines (the browser keeps the user's chosen browser voice). */
export function applyVoiceStyle(style) {
  saveVoiceExtras(style.extras);
  saveVoiceSettings({ ...style.browser, volume: 1 });
}
