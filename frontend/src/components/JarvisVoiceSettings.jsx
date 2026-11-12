import { useEffect, useState } from 'react';
import { requestRaw } from '../api.js';
import { Icon } from '../icons.jsx';
import { neuralAvailable, speakOnce, unlockAudio } from '../neuralVoice.js';
import { applyVoice, applyVoiceStyle, currentVoice, DEFAULT_EXTRAS, readVoiceExtras, saveVoiceExtras, VOICE_STYLES } from '../voiceSettings.js';

// Account → Voice, top part: the neural "Jarvis" voice (clearer, and louder than 100%).
const SAMPLE = 'Good evening. All systems are online, and your reminders are ready. How can I help?';

function browserSay(text) {
  const synth = window.speechSynthesis;
  if (!synth) return;
  synth.cancel();
  synth.speak(applyVoice(new SpeechSynthesisUtterance(text), currentVoice(synth.getVoices(), 'en-IN'), 'en-IN'));
}

export default function JarvisVoiceSettings() {
  const [x, setX] = useState(readVoiceExtras);
  const [ready, setReady] = useState(null);
  const [voices, setVoices] = useState([]);

  useEffect(() => {
    neuralAvailable().then(setReady);
    requestRaw('/ai/tts/voices')
      .then((r) => (r?.ok ? r.json() : null))
      .then((d) => d && setVoices(d.voices))
      .catch(() => {});
  }, []);

  const set = (patch) => {
    saveVoiceExtras(patch);
    setX(readVoiceExtras());
  };
  const style = (s) => {
    applyVoiceStyle(s);
    setX(readVoiceExtras());
    unlockAudio();
    speakOnce(SAMPLE, browserSay);
  };
  const test = () => {
    unlockAudio();
    speakOnce(SAMPLE, browserSay);
  };
  const active = VOICE_STYLES.find((s) => s.extras.neuralVoice === x.neuralVoice && s.extras.neuralRate === x.neuralRate && s.extras.neuralPitch === x.neuralPitch);
  const neuralOn = ready && x.engine !== 'browser';

  return (
    <div className="voice-settings jarvis-voice">
      <div className="jv-head">
        <span className={`jv-dot ${neuralOn ? 'on' : ''}`} />
        <div className="grow">
          <strong>{neuralOn ? 'Neural Jarvis voice is on' : ready === false ? 'Using the browser voice' : 'Checking the neural voice…'}</strong>
          <p className="muted small">
            {neuralOn
              ? 'Studio-quality voice from Azarvis on this PC, boosted louder than 100% with a limiter so it never crackles.'
              : 'The neural voice needs Azarvis running on this PC (npm run dev) and internet. Until then the browser voice speaks, at full volume.'}
          </p>
        </div>
        <label className="check-row">
          <input type="checkbox" checked={x.engine !== 'browser'} onChange={(e) => set({ engine: e.target.checked ? 'auto' : 'browser' })} />
          Use neural voice
        </label>
      </div>

      <div className="jv-styles" role="group" aria-label="Voice style">
        {VOICE_STYLES.map((s) => (
          <button key={s.id} type="button" className={`jv-style ${active?.id === s.id ? 'on' : ''}`} onClick={() => style(s)} aria-pressed={active?.id === s.id}>
            <strong>{s.label}</strong>
            <small>{s.note}</small>
          </button>
        ))}
      </div>

      {voices.length > 0 && (
        <label className="voice-pick">
          <strong>Neural voice</strong>
          <select value={x.neuralVoice} onChange={(e) => set({ neuralVoice: e.target.value })}>
            {voices.map((v) => <option key={v.id} value={v.id}>{v.label} · {v.style}</option>)}
          </select>
        </label>
      )}

      <div className="voice-sliders">
        <label className="voice-slider">
          <span className="voice-slider-head"><strong>Loudness</strong><span className="voice-slider-value">{Math.round(x.boost * 100)}%</span></span>
          <input type="range" min="1" max="2.5" step="0.1" value={x.boost} onChange={(e) => set({ boost: Number(e.target.value) })} aria-label="Loudness" />
          <span className="voice-slider-ends muted small"><span>Normal</span><span>Extra loud</span></span>
        </label>
        <label className="voice-slider">
          <span className="voice-slider-head"><strong>Speed</strong><span className="voice-slider-value">{x.neuralRate > 0 ? '+' : ''}{x.neuralRate}%</span></span>
          <input type="range" min="-40" max="50" step="2" value={x.neuralRate} onChange={(e) => set({ neuralRate: Number(e.target.value) })} aria-label="Neural voice speed" />
          <span className="voice-slider-ends muted small"><span>Slower</span><span>Faster</span></span>
        </label>
        <label className="voice-slider">
          <span className="voice-slider-head"><strong>Pitch</strong><span className="voice-slider-value">{x.neuralPitch > 0 ? '+' : ''}{x.neuralPitch} Hz</span></span>
          <input type="range" min="-25" max="25" step="1" value={x.neuralPitch} onChange={(e) => set({ neuralPitch: Number(e.target.value) })} aria-label="Neural voice pitch" />
          <span className="voice-slider-ends muted small"><span>Deeper</span><span>Higher</span></span>
        </label>
      </div>

      <div className="row wrap">
        <label className="check-row"><input type="checkbox" checked={x.clarity} onChange={(e) => set({ clarity: e.target.checked })} /> Clear speech (boosts the words)</label>
        <label className="check-row"><input type="checkbox" checked={x.depth} onChange={(e) => set({ depth: e.target.checked })} /> Deep tone (Jarvis weight)</label>
      </div>
      <div className="row wrap">
        <button type="button" className="btn primary sm" onClick={test}><Icon name="volume" size="1em" /> Test Jarvis voice</button>
        <button type="button" className="btn sm" onClick={() => { saveVoiceExtras(DEFAULT_EXTRAS); setX(readVoiceExtras()); }}><Icon name="refresh" size="1em" /> Reset</button>
        <span className="muted small">Also turn up the volume on the device itself.</span>
      </div>
    </div>
  );
}
