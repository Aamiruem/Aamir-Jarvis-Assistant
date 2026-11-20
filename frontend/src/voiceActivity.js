// Is a human speaking right now? Voice activity detection (VAD) on the microphone.
//
// The mic stream is opened with the browser's echo cancellation on, which removes the audio this
// page plays (Azarvis's own voice) from the signal. What is left in the human-voice band
// (about 250–3800 Hz), clearly above the room's noise floor, for a moment, is a person talking.
// useSpeech uses it to (1) pause Azarvis the moment someone talks over it, and (2) wait for a
// pause before starting to speak, so it never talks over anyone.
//
// The decision logic (createVadState) is pure and unit-tested; createVoiceActivity wires it to
// the microphone with Web Audio.

/**
 * Frame-by-frame decision. Feed it { t (ms), energyDb, voiceRatio, assistantTalking }.
 * - The noise floor follows the quiet parts of the room (drops fast, rises slowly).
 * - Speech = voice-band energy at least startDb above the floor (more while Azarvis talks, to
 *   ignore any echo left over) with most of the energy in the voice band, for minSpeechMs.
 * - It ends after hangoverMs without voice, so short gaps between words don't split a sentence.
 */
export function createVadState({ startDb = 12, talkingStartDb = 18, minSpeechMs = 160, hangoverMs = 450, minVoiceRatio = 0.45 } = {}) {
  let floor = null;
  let speaking = false;
  let candidateStart = null;
  let lastVoiced = -Infinity;
  return {
    update({ t, energyDb, voiceRatio, assistantTalking = false }) {
      if (!Number.isFinite(energyDb)) energyDb = -100;
      if (floor === null) floor = energyDb;
      if (!speaking) floor = energyDb < floor ? floor * 0.7 + energyDb * 0.3 : floor + 0.03; // about +1 dB a second
      floor = Math.max(-95, Math.min(-25, floor));
      const threshold = floor + (assistantTalking ? talkingStartDb : startDb);
      const voiced = energyDb > threshold && voiceRatio >= minVoiceRatio;
      let started = false;
      let ended = false;
      if (voiced) {
        candidateStart ??= t;
        lastVoiced = t;
        if (!speaking && t - candidateStart >= minSpeechMs) {
          speaking = true;
          started = true;
        }
      } else {
        candidateStart = null;
        if (speaking && t - lastVoiced > hangoverMs) {
          speaking = false;
          ended = true;
        }
      }
      return { speaking, started, ended, floor, threshold };
    },
    get speaking() {
      return speaking;
    },
    /** How long it has been quiet (0 while someone speaks). */
    quietFor(t) {
      return speaking ? 0 : t - lastVoiced;
    },
  };
}

/** Voice-band energy (dB) and the share of energy in the voice band, from analyser dB bins. */
export function bandEnergy(bins, sampleRate, fftSize, lo = 250, hi = 3800) {
  const hz = sampleRate / fftSize;
  let band = 0;
  let total = 0;
  let n = 0;
  for (let i = 1; i < bins.length; i++) {
    const f = i * hz;
    if (f < 60 || f > 8000) continue;
    const p = 10 ** (bins[i] / 10);
    total += p;
    if (f >= lo && f <= hi) {
      band += p;
      n += 1;
    }
  }
  return { energyDb: n ? 10 * Math.log10(band / n + 1e-12) : -100, voiceRatio: total ? band / total : 0 };
}

/**
 * The live detector. start() asks for the microphone (echo cancellation and noise suppression on);
 * it resolves false where that isn't possible (no mic, no permission, tests), and every method then
 * behaves as "nobody is speaking", so the voice features simply work as before.
 */
export function createVoiceActivity({ onStart, onEnd, isAssistantTalking = () => false } = {}) {
  const state = createVadState();
  let stream = null;
  let ctx = null;
  let timer = null;
  let running = false;
  let stopped = false;

  const now = () => performance.now();
  const api = {
    async start() {
      if (running) return true;
      const AC = typeof window !== 'undefined' && (window.AudioContext || window.webkitAudioContext);
      if (!AC || !navigator.mediaDevices?.getUserMedia) return false;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: false } });
      } catch {
        return false;
      }
      if (stopped) {
        // Listening ended while the browser was still asking for the microphone: let it go.
        stream.getTracks().forEach((t) => t.stop());
        stream = null;
        return false;
      }
      ctx = new AC();
      ctx.resume?.().catch(() => {});
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 1024;
      analyser.smoothingTimeConstant = 0.2;
      ctx.createMediaStreamSource(stream).connect(analyser); // not connected to the speakers
      const bins = new Float32Array(analyser.frequencyBinCount);
      running = true;
      timer = setInterval(() => {
        analyser.getFloatFrequencyData(bins);
        const { energyDb, voiceRatio } = bandEnergy(bins, ctx.sampleRate, analyser.fftSize);
        const r = state.update({ t: now(), energyDb, voiceRatio, assistantTalking: isAssistantTalking() });
        if (r.started) onStart?.();
        if (r.ended) onEnd?.();
      }, 30);
      return true;
    },
    stop() {
      stopped = true;
      running = false;
      clearInterval(timer);
      stream?.getTracks().forEach((t) => t.stop());
      ctx?.close?.().catch(() => {});
      stream = null;
      ctx = null;
    },
    get running() {
      return running;
    },
    isSpeaking: () => running && state.speaking,
    /** Milliseconds since anyone last spoke (Infinity if nobody has yet, 0 while someone speaks). */
    quietMs: () => (running ? state.quietFor(now()) : Infinity),
    /** Resolves once nobody has spoken for quietMs (at most maxMs later, so a noisy room can't block replies). */
    whenQuiet({ quietMs = 450, maxMs = 4000 } = {}) {
      if (!running) return Promise.resolve();
      const t0 = now();
      return new Promise((resolve) => {
        const check = () => {
          const t = now();
          if (!running || state.quietFor(t) >= quietMs || t - t0 >= maxMs) return resolve();
          setTimeout(check, 50);
        };
        check();
      });
    },
  };
  return api;
}
