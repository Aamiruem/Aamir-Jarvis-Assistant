// Pure text helpers for voice mode: what to read aloud, when the speaker has finished,
// and whether the microphone is just hearing Azarvis's own voice. No browser APIs here,
// so they are unit-tested in speechText.test.js.

/** Markdown and links turned into something that sounds right when read aloud. */
export function cleanForSpeech(text) {
  return (text || '')
    .replace(/```[\s\S]*?```/g, ' (code shown on screen) ')
    .replace(/`([^`]*)`/g, '$1')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/https?:\/\/\S+/g, 'the link on screen')
    .replace(/^\s*(?:[-*+]|\d+[.)])\s+/gm, '')
    .replace(/[*_#>|~]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Splits streamed text into chunks that can be spoken now, so Azarvis starts talking after the
 * first sentence instead of waiting for the whole answer. A decimal point ("3.5") is not a
 * sentence end: the punctuation must be followed by whitespace. `final` flushes the rest.
 */
export function takeSentences(buffer, final = false) {
  const chunks = [];
  let rest = buffer;
  const end = /[.!?…:;](?=\s)|\n/;
  for (let m = rest.match(end); m; m = rest.match(end)) {
    const piece = rest.slice(0, m.index + m[0].length);
    rest = rest.slice(m.index + m[0].length);
    if (cleanForSpeech(piece)) chunks.push(piece);
  }
  // A very long sentence with no full stop yet: speak up to the last comma rather than wait.
  if (!final && rest.length > 160) {
    const comma = rest.lastIndexOf(', ');
    if (comma > 40) {
      chunks.push(rest.slice(0, comma + 1));
      rest = rest.slice(comma + 2);
    }
  }
  if (final && cleanForSpeech(rest)) {
    chunks.push(rest);
    rest = '';
  }
  return { chunks: chunks.map(cleanForSpeech).filter(Boolean), rest };
}

// Words that mean the speaker is mid-thought ("remind me to call mom and…").
const CONTINUES = /\b(and|or|but|so|to|the|a|an|of|for|with|then|also|because|if|that|my|at|in|on|is|um|uh|like)$/i;

/**
 * How long a silence means "they've finished speaking", in ms. Short when the recognizer has
 * already settled on the words, longer while it is still guessing, longest after a word that
 * clearly continues. This is what makes the turn-taking feel quick without cutting people off.
 */
export function pauseFor(text, settled) {
  const t = (text || '').trim();
  if (CONTINUES.test(t)) return 1700;
  return settled ? 750 : 1250;
}

const words = (s) => (s || '').toLowerCase().match(/[a-z0-9ऀ-ॿ']+/g) || []; // Latin + Devanagari (Hindi)

/**
 * True when what the microphone heard is (mostly) Azarvis's own voice coming out of the
 * speakers, so it must not be treated as the user talking.
 */
export function isEcho(heard, spoken) {
  const h = words(heard);
  if (!h.length) return true;
  const said = new Set(words(spoken));
  if (!said.size) return false;
  const overlap = h.filter((w) => said.has(w)).length / h.length;
  return overlap >= 0.6;
}

/** At least two words Azarvis isn't saying: the user is talking over Azarvis (barge-in). */
export function isBargeIn(heard, spoken) {
  const said = new Set(words(spoken));
  const fresh = words(heard).filter((w) => !said.has(w));
  return fresh.length >= 2 && !isEcho(heard, spoken);
}

/**
 * The most natural-sounding installed voice for a language. Edge's "Online (Natural)" neural
 * voices and Chrome's Google voices sound far more human than the old system ones.
 */
export function pickVoice(voices, lang = 'en-IN', preferred = '') {
  if (!voices?.length) return null;
  if (preferred) {
    const chosen = voices.find((v) => v.name === preferred);
    if (chosen) return chosen;
  }
  const base = lang.split('-')[0].toLowerCase();
  const score = (v) => {
    const vl = (v.lang || '').toLowerCase().replace('_', '-');
    let s = 0;
    if (vl === lang.toLowerCase()) s += 40;
    else if (vl.startsWith(base)) s += 20;
    else return -1;
    if (/natural|neural/i.test(v.name)) s += 30;
    if (/online/i.test(v.name)) s += 10;
    if (/google/i.test(v.name)) s += 15;
    if (v.localService === false) s += 5;
    if (v.default) s += 2;
    return s;
  };
  const ranked = voices.map((v) => [score(v), v]).filter(([s]) => s >= 0).sort((a, b) => b[0] - a[0]);
  return ranked[0]?.[1] || null;
}
