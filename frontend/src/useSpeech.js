import { useCallback, useEffect, useRef, useState } from 'react';

// Voice in/out with the browser's built-in Web Speech API (works best in Chrome / Edge).
const Recognition = typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition);
export const speechSupported = Boolean(Recognition);

const MIC_ERRORS = {
  'not-allowed': 'Microphone access is blocked. Allow it from the lock icon in the address bar.',
  'service-not-allowed': 'Microphone access is blocked. Allow it from the lock icon in the address bar.',
  'audio-capture': 'No microphone was found.',
  network: 'Speech recognition needs an internet connection.',
};

const PAUSE_MS = 1300; // this long without new words = you've finished speaking
const NO_SPEECH_MS = 8000; // give up on a listen when nothing is said

// Most confident of the alternatives the recognizer offers for one phrase.
const best = (result) => Array.from(result).reduce((a, b) => ((b.confidence || 0) > (a.confidence || 0) ? b : a)).transcript;

/**
 * Listens in continuous mode and waits for a real pause, so a long request with several
 * tasks isn't cut off when you stop to think mid-sentence.
 * onFinal(text)  - everything said up to the pause
 * onSilence()    - listening ended without hearing anything (used to keep hands-free mode going)
 */
export function useSpeech({ onFinal, onSilence, lang = 'en-IN' }) {
  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [interim, setInterim] = useState('');
  const [error, setError] = useState('');
  const recRef = useRef(null);
  const session = useRef({ final: '', interim: '', failed: false, cancelled: false, active: false, timer: null });
  const callbacks = useRef({ onFinal, onSilence });
  callbacks.current = { onFinal, onSilence };

  useEffect(() => {
    if (!Recognition) return;
    const rec = new Recognition();
    rec.lang = lang;
    rec.interimResults = true;
    rec.continuous = true;
    rec.maxAlternatives = 3;
    const s = session.current;
    let disposed = false; // set when this recognizer is replaced or the page closes
    const waitThenStop = (ms) => {
      clearTimeout(s.timer);
      s.timer = setTimeout(() => rec.stop(), ms);
    };
    rec.onstart = () => waitThenStop(NO_SPEECH_MS);
    rec.onresult = (e) => {
      if (disposed) return;
      let final = '';
      let pending = '';
      for (const result of e.results) {
        if (result.isFinal) final += best(result) + ' ';
        else pending += best(result) + ' ';
      }
      s.final = final.trim();
      s.interim = pending.trim();
      setInterim(`${s.final} ${s.interim}`.trim());
      waitThenStop(PAUSE_MS);
    };
    rec.onend = () => {
      if (disposed) return; // replaced by a new recognizer, which carries the listen on
      s.active = false;
      clearTimeout(s.timer);
      setListening(false);
      setInterim('');
      if (s.failed || s.cancelled) return;
      const text = (s.final || s.interim).replace(/\s+/g, ' ').trim();
      if (text) callbacks.current.onFinal?.(text);
      else callbacks.current.onSilence?.();
    };
    rec.onerror = (e) => {
      if (MIC_ERRORS[e.error]) {
        setError(MIC_ERRORS[e.error]);
        s.failed = true; // a real failure: don't auto-restart into the same error
      }
    };
    recRef.current = rec;
    // A listen was in progress on the recognizer this one replaces (language change, or React's
    // dev double-mount): continue it here instead of silently dropping it.
    if (s.active) {
      try {
        rec.start();
      } catch {
        s.active = false;
        setListening(false);
      }
    }
    return () => {
      disposed = true;
      clearTimeout(s.timer);
      rec.abort();
    };
  }, [lang]);
  const speakJob = useRef(0); // bumps on every new speak/stop, so stale callbacks are ignored
  const speakingRef = useRef(false);
  const utterances = useRef([]);

  const quiet = () => {
    speakJob.current += 1;
    window.speechSynthesis?.cancel();
    speakingRef.current = false;
    setSpeaking(false);
  };

  const start = useCallback(() => {
    const rec = recRef.current;
    const s = session.current;
    if (!rec || s.active) return; // already listening
    quiet();
    Object.assign(s, { final: '', interim: '', failed: false, cancelled: false });
    setError('');
    const begin = () => {
      rec.start();
      s.active = true;
      setListening(true);
    };
    try {
      begin();
    } catch {
      // The previous listen is still shutting down: stop it, then try again in a moment.
      s.cancelled = true;
      rec.abort();
      setTimeout(() => {
        s.cancelled = false;
        try {
          begin();
        } catch {
          // still busy; the hands-free watchdog will try again
        }
      }, 300);
    }
  }, []);

  const stop = useCallback(() => recRef.current?.stop(), []); // finish now and keep what was heard
  const cancel = useCallback(() => {
    session.current.cancelled = true;
    recRef.current?.abort();
  }, []); // stop and discard

  /**
   * Reads text aloud; onEnd runs once when it finishes (or right away if there's nothing to say).
   * Long text is split into sentences: Chrome cuts single utterances off after ~15 seconds.
   */
  const speak = useCallback((text, onEnd) => {
    const synth = window.speechSynthesis;
    const clean = (text || '').replace(/[`*_#>\[\]()|]/g, '').replace(/\s+/g, ' ').trim().slice(0, 1500);
    if (!synth || !clean) {
      onEnd?.();
      return;
    }
    const job = ++speakJob.current;
    const chunks = [];
    for (const sentence of clean.match(/[^.!?]+[.!?]*\s*/g) || [clean]) {
      if (chunks.length && (chunks.at(-1) + sentence).length < 180) chunks[chunks.length - 1] += sentence;
      else chunks.push(sentence);
    }
    let finished = false;
    let watch;
    const finish = () => {
      if (finished || job !== speakJob.current) return;
      finished = true;
      clearInterval(watch);
      speakingRef.current = false;
      setSpeaking(false);
      onEnd?.();
    };
    synth.cancel();
    speakingRef.current = true;
    setSpeaking(true);
    // Kept in a ref on purpose: Chrome can drop onend for utterances that get garbage-collected.
    utterances.current = chunks.map((part, i) => {
      const u = new SpeechSynthesisUtterance(part.trim());
      u.lang = lang;
      u.rate = 1.05;
      if (i === chunks.length - 1) u.onend = finish;
      u.onerror = finish;
      return u;
    });
    utterances.current.forEach((u) => synth.speak(u));
    // Safety net: Chrome sometimes never fires onend at all.
    const startedAt = Date.now();
    watch = setInterval(() => {
      if (!synth.speaking && !synth.pending && Date.now() - startedAt > 1000) finish();
    }, 500);
  }, [lang]);

  const stopSpeaking = useCallback(quiet, []);

  /** True when neither listening nor speaking (used by the hands-free watchdog). */
  const isIdle = useCallback(() => !session.current.active && !speakingRef.current, []);

  return { supported: Boolean(Recognition), listening, speaking, interim, error, start, stop, cancel, speak, stopSpeaking, isIdle };
}
