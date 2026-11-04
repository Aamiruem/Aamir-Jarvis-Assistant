// Jarvis reads new alerts (reminders, PC watcher) out loud on this device. On by default;
// the choice is per browser, since only the device in front of you should talk.
import { cleanForSpeech, pickVoice } from './speechText.js';

const KEY = 'jarvis-speak-alerts';

export function readAlertsAloud() {
  try {
    return localStorage.getItem(KEY) !== 'off';
  } catch {
    return true;
  }
}

export function setReadAlertsAloud(on) {
  try {
    localStorage.setItem(KEY, on ? 'on' : 'off');
  } catch {}
}

/** The sentence Jarvis says for a batch of new alerts. */
export function alertSpeech(alerts) {
  if (!alerts.length) return '';
  if (alerts.length > 3) return `You have ${alerts.length} new alerts. The first one: ${alerts[0].title}.`;
  return alerts.map((a) => `${a.title}${a.body ? `. ${a.body}` : ''}`).join(' ... ');
}

/** Speaks alerts after whatever Jarvis is already saying (queued, never interrupting). */
export function speakAlerts(alerts) {
  const synth = window.speechSynthesis;
  const text = cleanForSpeech(alertSpeech(alerts));
  if (!synth || !text || !readAlertsAloud()) return false;
  const u = new SpeechSynthesisUtterance(text);
  const voice = pickVoice(synth.getVoices(), 'en-IN');
  if (voice) {
    u.voice = voice;
    u.lang = voice.lang;
  }
  u.rate = 1.05;
  synth.speak(u);
  return true;
}
