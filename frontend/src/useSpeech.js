import { useCallback, useEffect, useRef, useState } from 'react';
import { cleanForSpeech, isBargeIn, isEcho, pauseFor, pickVoice, prosodyFor, takeSentences } from './speechText.js';
import { createNeuralQueue, neuralAvailable, neuralKnownAvailable, pauseNeural, resumeNeural } from './neuralVoice.js';
import { createVoiceActivity } from './voiceActivity.js';
import { applyVoice, currentVoice, readVoiceExtras, VOICE_EVENT } from './voiceSettings.js';
import { browserVoiceFor, detectLanguage, neuralVoiceFor, speechLocale } from './languages.js';
import { useLanguage } from './useLanguage.js';

// Voice in with the browser's Web Speech API; voice out with the neural Jarvis voice when Azarvis
// runs on this PC (neuralVoice.js: clearer, louder), else the browser's own voice.
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
export function useSpeech({ onFinal, onSilence, shouldBargeIn, onBargeIn, lang: fixedLang }) {
  // The language to listen for: the caller's fixed one, else the user's (Account → Voice).
  const savedLang = useLanguage();
  const lang = fixedLang || savedLang;
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
  const neural = useRef(null); // the neural voice's sentence queue (one per hook)
  // A human voice on the microphone (voiceActivity.js, echo cancellation on): Azarvis pauses the
  // moment someone talks over it and waits for people to finish before it starts a reply.
  const vad = useRef(null);
  const hold = useRef({ on: false, timer: null, falseHolds: 0, disabled: false });

  const releaseHold = () => {
    const h = hold.current;
    clearTimeout(h.timer);
    if (!h.on) return;
    h.on = false;
    window.speechSynthesis?.resume();
    resumeNeural();
  };
  // Someone started talking while Azarvis speaks: pause at once. The recogniser then decides:
  // real words mean barge-in (Azarvis stops); no words within 1.4 s (a cough, a door) and it carries
  // on. Two false alarms in one reply (a noisy room) and it stops pausing for the rest of that reply.
  const onHumanStart = () => {
    const h = hold.current;
    if (!speakingRef.current || h.on || h.disabled) return;
    h.on = true;
    window.speechSynthesis?.pause();
    pauseNeural();
    clearTimeout(h.timer);
    h.timer = setTimeout(() => {
      if (!h.on) return;
      h.falseHolds += 1;
      if (h.falseHolds >= 2) h.disabled = true;
      releaseHold();
    }, 1400);
  };
  const ensureVad = () => {
    if (vad.current) return;
    const detector = createVoiceActivity({ onStart: onHumanStart, isAssistantTalking: () => speakingRef.current && !hold.current.on });
    vad.current = detector;
    detector.start().then((ok) => {
      if (!ok && vad.current === detector) vad.current = null; // no mic access: words alone decide, as before
    });
  };
  const stopVad = () => {
    vad.current?.stop();
    vad.current = null;
  };

  // Stops Azarvis talking. An unfinished spoken reply still runs its "finished" callback.
  const quiet = () => {
    const s = activeStream.current;
    activeStream.current = null;
    if (hold.current.on) releaseHold(); // resume first: a paused synthesizer can swallow the next reply
    window.speechSynthesis?.cancel();
    neural.current?.stop();
    if (speakingRef.current) session.current.echoUntil = Date.now() + ECHO_TAIL_MS;
    speakingRef.current = false;
    setSpeaking(false);
    s?.interrupt();
  };

  useEffect(() => {
    neuralAvailable();
    return () => {
      clearTimeout(hold.current.timer);
      stopVad();
    };
  }, []);
  useEffect(() => {
    if (!listening) stopVad();
  }, [listening]);

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
        // A human voice already heard on the mic: one new word is enough to stop Azarvis.
        const humanHeard = hold.current.on || vad.current?.isSpeaking();
        if (!isBargeIn(heard, spokenRef.current, humanHeard ? 1 : 2) || callbacks.current.shouldBargeIn?.(heard) === false) return;
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
    ensureVad();
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
    hold.current.falseHolds = 0;
    hold.current.disabled = false;
    utterances.current = [];
    spokenRef.current = '';
    // Turn-taking: if someone is talking (or just was), hold the reply until they pause.
    const detector = vad.current;
    let gateOpen = !(detector?.running && detector.quietMs() < 450);
    const waitingLine = []; // sentences ready while the gate is closed, in order
    let pending = 0; // sentences queued but not yet handed to a voice
    let buffer = '';
    let queued = 0;
    let done = 0;
    let ended = false;
    let interrupted = false;
    let finished = false;
    let onEnd = null;
    let watch = null;
    // The reply's tone from the AI service (app/mind): multipliers on the user's own voice settings,
    // e.g. a little slower and lower when the user is stressed, brighter when they are excited.
    let style = { rate: 1, pitch: 1 };

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
    const sentenceDone = () => {
      if (interrupted) return;
      done += 1;
      if (ended && done >= queued) finish();
    };
    const startSpeaking = (text) => {
      spokenRef.current += ` ${text}`;
      if (!speakingRef.current) {
        speakingRef.current = true;
        setSpeaking(true);
      }
    };
    // The browser's voice, in the sentence's own language (Hindi text gets a Hindi voice, etc.).
    const browserUtter = (text, st = style) => {
      if (!synth) return sentenceDone();
      const code = detectLanguage(text, lang);
      const voice = browserVoiceFor(code, voiceRef.current, synth.getVoices(), pickVoice);
      const u = applyVoice(new SpeechSynthesisUtterance(text), voice, speechLocale(code));
      u.rate = Math.min(2, Math.max(0.5, u.rate * st.rate));
      u.pitch = Math.min(2, Math.max(0, u.pitch * st.pitch));
      u.onend = u.onerror = sentenceDone;
      utterances.current.push(u);
      synth.speak(u);
    };
    const voiceIt = ({ text, neuralId, tone }) => {
      pending -= 1;
      if (interrupted) return;
      startSpeaking(text);
      if (!neuralId) return browserUtter(text, tone);
      neural.current ??= createNeuralQueue({ onError: (_err, item) => browserUtter(item.text, tone) });
      neural.current.say(text, tone, sentenceDone, neuralId);
    };
    const utter = (text) => {
      // A native neural voice for this sentence's language (null: none exists, the browser reads it).
      const neuralId = neuralKnownAvailable() ? neuralVoiceFor(text, lang, readVoiceExtras().neuralVoice) : null;
      if (!neuralId && !synth) return;
      queued += 1;
      pending += 1;
      // The reply's mood times this sentence's own intonation (questions rise, and so on).
      const p = prosodyFor(text);
      const item = { text, neuralId, tone: { rate: style.rate * p.rate, pitch: style.pitch * p.pitch } };
      if (gateOpen) voiceIt(item);
      else waitingLine.push(item);
    };
    if (!gateOpen) {
      detector.whenQuiet({ quietMs: 450, maxMs: 4000 }).then(() => {
        gateOpen = true;
        waitingLine.splice(0).forEach(voiceIt);
        if (ended && done >= queued) finish();
      });
    }
    const handle = {
      /** Sets how the rest of this reply sounds ({ rate, pitch } multipliers, clamped to a gentle range). */
      setStyle(next) {
        const within = (v) => (Number.isFinite(v) ? Math.min(1.2, Math.max(0.8, v)) : 1);
        style = { rate: within(next?.rate), pitch: within(next?.pitch) };
      },
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
        if (done >= queued || (!synth && !neural.current?.busy && !pending)) return finish();
        // Safety net: Chrome sometimes never fires onend at all.
        const startedAt = Date.now();
        watch = setInterval(() => {
          const browserIdle = !synth || (!synth.speaking && !synth.pending);
          if (browserIdle && !neural.current?.busy && !pending && !hold.current.on && Date.now() - startedAt > 1000) finish();
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
      if ((!window.speechSynthesis && !neuralKnownAvailable()) || !clean) {
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
