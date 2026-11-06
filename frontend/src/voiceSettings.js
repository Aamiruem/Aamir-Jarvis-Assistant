// How Azarvis sounds when it talks: which installed voice, how fast, how high or low (pitch)
// and how loud. Saved in this browser and shared by every spoken reply (chat, voice sessions,
// reminder alerts). Changing them fires VOICE_EVENT so a voice that is already loaded updates.
import { pickVoice } from './speechText.js';

const VOICE_KEY = 'jarvis-voice'; // the chosen voice's name (kept from before these settings)
const TUNING_KEY = 'jarvis-voice-tuning';
export const VOICE_EVENT = 'jarvis-voice-change';

export const DEFAULT_TUNING = { rate: 1.05, pitch: 1, volume: 1 };
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
