import { useCallback, useEffect, useRef, useState } from 'react';
import { cleanForSpeech, isBargeIn, isEcho, pauseFor, takeSentences } from './speechText.js';
import { applyVoice, currentVoice, VOICE_EVENT } from './voiceSettings.js';

// Voice in/out with the browser's built-in Web Speech API (works best in Chrome / Edge).
const Recognition = typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition);
export const speechSupported = Boolean(Recognition);

const MIC_ERRORS = {
  'not-allowed': 'Microphone access is blocked. Allow it from the lock icon in the address bar.',
  'service-not-allowed': 'Microphone access is blocked. Allow it from the lock icon in the address bar.',
  'audio-capture': 'No microphone was found.',
  network: 'Speech recognition needs an internet connection.',
};

const NO_SPEECH_MS = 8000; // this long with nothing said = a "silent round"
const ECHO_TAIL_MS = 1200; // the mic can still pick up Azarvis's voice just after it stops talking

// Most confident of the alternatives the recognizer offers for one phrase.
const best = (result) => Array.from(result).reduce((a, b) => ((b.confidence || 0) > (a.confidence || 0) ? b : a)).transcript;

/**
 * Two ways to listen:
 *   start()                  - one request: stops at the first real pause.
 *   start({ keepOpen: true }) - conversation: the mic stays open, every pause hands over what
 *                              was said, and nothing is lost while Azarvis thinks or talks.
 * While Azarvis talks, the mic's own echo of Azarvis is ignored; real words from the user
 * interrupt it (barge-in), as in a conversation between people.
 *
 * onFinal(text)      - what was said up to a pause
 * onSilence()        - nothing was said for a while
 * shouldBargeIn(heard) - optional filter: return false to let Azarvis keep talking
 * onBargeIn()        - the user started talking over Azarvis (Azarvis has already gone quiet)
 */
export function useSpeech({ onFinal, onSilence, shouldBargeIn, onBargeIn, lang = 'en-IN' }) {
  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [interim, setInterim] = useState('');
  const [error, setError] = useState('');
  const recRef = useRef(null);
  const session = useRef({
    final: '', interim: '', base: 0, seen: 0, echoUntil: 0, startedAt: 0, quickEnds: 0,
    failed: false, cancelled: false, active: false, keepOpen: false, timer: null, quietTimer: null,
  });
  const callbacks = useRef({});
  callbacks.current = { onFinal, onSilence, shouldBargeIn, onBargeIn };

  const speakingRef = useRef(false);
  const spokenRef = useRef(''); // everything Azarvis is saying right now, for the echo check
  const activeStream = useRef(null);
  const utterances = useRef([]); // kept on purpose: Chrome can drop onend for garbage-collected utterances
  const voiceRef = useRef(null);

  // Stops Azarvis talking. An unfinished spoken reply still runs its "finished" callback.
  const quiet = () => {
    const s = activeStream.current;
    activeStream.current = null;
    window.speechSynthesis?.cancel();
    if (speakingRef.current) session.current.echoUntil = Date.now() + ECHO_TAIL_MS;
    speakingRef.current = false;
    setSpeaking(false);
    s?.interrupt();
  };

  // The chosen voice, else the most natural one installed (voices load asynchronously in Chrome),
  // reloaded when the voice settings change.
  useEffect(() => {
    const synth = window.speechSynthesis;
    if (!synth) return;
    const load = () => {
      voiceRef.current = currentVoice(synth.getVoices(), lang);
    };
    load();
    synth.addEventListener?.('voiceschanged', load);
    window.addEventListener(VOICE_EVENT, load);
    return () => {
      synth.removeEventListener?.('voiceschanged', load);
      window.removeEventListener(VOICE_EVENT, load);
    };
  }, [lang]);

  useEffect(() => {
    if (!Recognition) return;
    const rec = new Recognition();
    rec.lang = lang;
    rec.interimResults = true;
    rec.continuous = true;
    rec.maxAlternatives = 3;
    const s = session.current;
    let disposed = false; // set when this recognizer is replaced or the page closes

    const collect = (results) => {
      let final = '';
      let pending = '';
      for (let i = s.base; i < results.length; i++) {
        if (results[i].isFinal) final += best(results[i]) + ' ';
        else pending += best(results[i]) + ' ';
      }
      return { final: final.trim(), pending: pending.trim() };
    };
    // Hands over what was said since the last pause and keeps listening.
    const deliver = () => {
      clearTimeout(s.timer);
      const text = `${s.final} ${s.interim}`.replace(/\s+/g, ' ').trim();
      s.base = s.seen;
      s.final = '';
      s.interim = '';
      setInterim('');
      if (text) callbacks.current.onFinal?.(text);
    };
    const armSilence = () => {
      clearTimeout(s.quietTimer);
      s.quietTimer = setTimeout(() => {
        if (disposed || !s.active) return;
        if (!s.keepOpen) return rec.stop();
        if (!speakingRef.current) callbacks.current.onSilence?.();
        armSilence();
      }, NO_SPEECH_MS);
    };
    const armPause = (ms) => {
      clearTimeout(s.timer);
      s.timer = setTimeout(() => (s.keepOpen ? deliver() : rec.stop()), ms);
    };

    rec.onstart = () => {
      s.base = 0; // a new recognizer session numbers its results from zero
      s.seen = 0;
      s.startedAt = Date.now();
      armSilence();
    };
    rec.onresult = (e) => {
      if (disposed) return;
      s.seen = e.results.length;
      let { final, pending } = collect(e.results);
      let heard = `${final} ${pending}`.trim();
      if (!heard) return;

      const echoing = speakingRef.current || Date.now() < s.echoUntil;
      if (echoing && isEcho(heard, spokenRef.current)) {
        // Azarvis's own voice through the speakers: skip the parts the recognizer has settled on.
        while (s.base < e.results.length && e.results[s.base].isFinal) s.base += 1;
        return;
      }
      if (speakingRef.current) {
        if (!isBargeIn(heard, spokenRef.current) || callbacks.current.shouldBargeIn?.(heard) === false) return;
        quiet();
        callbacks.current.onBargeIn?.();
        s.base = Math.max(s.base, e.resultIndex);
        ({ final, pending } = collect(e.results));
        heard = `${final} ${pending}`.trim();
      }
      s.final = final;
      s.interim = pending;
      setInterim(heard);
      armSilence();
      armPause(pauseFor(heard, !pending));
    };
    rec.onend = () => {
      if (disposed) return; // replaced by a new recognizer, which carries the listen on
      clearTimeout(s.timer);
      clearTimeout(s.quietTimer);
      if (s.keepOpen && !s.failed && !s.cancelled) {
        // Chrome closes continuous sessions by itself every so often: hand over what was
        // heard and reopen at once, so the gap where words could be missed stays tiny.
        if (s.final || s.interim) deliver();
        s.quickEnds = Date.now() - s.startedAt < 1000 ? s.quickEnds + 1 : 0;
        const reopen = () => {
          try {
            rec.start();
          } catch {
            s.active = false;
            setListening(false); // the hands-free watchdog will try again
          }
        };
        if (s.quickEnds > 5) {
          s.quickEnds = 0;
          setTimeout(reopen, 2000); // ending instantly over and over: back off a little
        } else reopen();
        return;
      }
      s.active = false;
      setListening(false);
      setInterim('');
      if (s.failed || s.cancelled) return;
      const text = `${s.final} ${s.interim}`.replace(/\s+/g, ' ').trim();
      s.final = '';
      s.interim = '';
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
      clearTimeout(s.quietTimer);
      rec.abort();
    };
  }, [lang]);

  const start = useCallback(({ keepOpen = false } = {}) => {
    const rec = recRef.current;
    const s = session.current;
    if (!rec) return;
    if (s.active) {
      s.keepOpen = s.keepOpen || keepOpen; // already listening
      return;
    }
    if (!keepOpen) quiet(); // pressing the mic means "my turn"
    Object.assign(s, { final: '', interim: '', failed: false, cancelled: false, keepOpen, quickEnds: 0 });
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

  // Finish now and keep what was heard.
  const stop = useCallback(() => {
    session.current.keepOpen = false;
    recRef.current?.stop();
  }, []);
  // Stop and discard.
  const cancel = useCallback(() => {
    session.current.cancelled = true;
    session.current.keepOpen = false;
    recRef.current?.abort();
  }, []);

  /**
   * A spoken reply that can start before the text is complete:
   *   const out = speakStream(); out.push(token) ...; out.end(onEnd)
   * Each sentence is spoken as soon as it is complete. onEnd runs once, when the last one has
   * been spoken or when the reply is interrupted.
   */
  const speakStream = useCallback(() => {
    const synth = window.speechSynthesis;
    quiet();
    utterances.current = [];
    spokenRef.current = '';
    let buffer = '';
    let queued = 0;
    let done = 0;
    let ended = false;
    let interrupted = false;
    let finished = false;
    let onEnd = null;
    let watch = null;

    const finish = () => {
      if (finished) return;
      finished = true;
      clearInterval(watch);
      if (!interrupted) {
        activeStream.current = null;
        speakingRef.current = false;
        setSpeaking(false);
        // Whatever the mic picked up while Azarvis talked was Azarvis: drop it.
        const s = session.current;
        s.echoUntil = Date.now() + ECHO_TAIL_MS;
        if (s.active) {
          s.base = s.seen;
          s.final = '';
          s.interim = '';
          clearTimeout(s.timer);
          setInterim('');
        }
      }
      onEnd?.();
    };
    const utter = (text) => {
      if (!synth) return;
      const u = applyVoice(new SpeechSynthesisUtterance(text), voiceRef.current, lang);
      u.onend = u.onerror = () => {
        if (interrupted) return;
        done += 1;
        if (ended && done >= queued) finish();
      };
      queued += 1;
      utterances.current.push(u);
      spokenRef.current += ` ${text}`;
      if (!speakingRef.current) {
        speakingRef.current = true;
        setSpeaking(true);
      }
      synth.speak(u);
    };
    const handle = {
      push(text) {
        if (interrupted || ended || !text) return;
        buffer += text;
        const { chunks, rest } = takeSentences(buffer);
        buffer = rest;
        chunks.forEach(utter);
      },
      end(cb) {
        if (ended) return;
        ended = true;
        onEnd = cb;
        if (interrupted) return finish();
        takeSentences(buffer, true).chunks.forEach(utter);
        buffer = '';
        if (!synth || done >= queued) return finish();
        // Safety net: Chrome sometimes never fires onend at all.
        const startedAt = Date.now();
        watch = setInterval(() => {
          if (!synth.speaking && !synth.pending && Date.now() - startedAt > 1000) finish();
        }, 500);
      },
      interrupt() {
        interrupted = true;
        if (ended) finish();
      },
    };
    activeStream.current = handle;
    return handle;
  }, [lang]);

  /** Reads text aloud; onEnd runs once when it finishes (or right away if there's nothing to say). */
  const speak = useCallback(
    (text, onEnd) => {
      const clean = cleanForSpeech(text).slice(0, 1500);
      if (!window.speechSynthesis || !clean) {
        onEnd?.();
        return;
      }
      const out = speakStream();
      out.push(clean);
      out.end(onEnd);
    },
    [speakStream],
  );

  const stopSpeaking = useCallback(quiet, []);

  /** True when neither listening nor speaking (used by the hands-free watchdog). */
  const isIdle = useCallback(() => !session.current.active && !speakingRef.current, []);

  return { supported: Boolean(Recognition), listening, speaking, interim, error, start, stop, cancel, speak, speakStream, stopSpeaking, isIdle };
}
