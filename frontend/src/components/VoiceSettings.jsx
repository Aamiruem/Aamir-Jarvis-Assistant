import { useEffect, useMemo, useState } from 'react';
import { Icon } from '../icons.jsx';
import JarvisVoiceSettings from './JarvisVoiceSettings.jsx';
import { pickVoice } from '../speechText.js';
import { applyVoice, currentVoice, DEFAULT_TUNING, LIMITS, readTuning, readVoiceName, resetVoiceSettings, saveVoiceSettings, voiceOptions } from '../voiceSettings.js';

// Account → Voice: which voice Azarvis speaks with, and its speed, pitch (deeper ↔ higher) and
// volume. Applies to every spoken reply on this device; "Test voice" plays a sample.

const LANG = 'en-IN';
const SAMPLE = 'Hello! I am Azarvis. This is how I will sound when I read your answers and reminders.';
const PRESETS = [
  { label: 'Deep & calm', rate: 0.95, pitch: 0.8 },
  { label: 'Natural', rate: DEFAULT_TUNING.rate, pitch: DEFAULT_TUNING.pitch },
  { label: 'Bright & quick', rate: 1.2, pitch: 1.25 },
];

function Slider({ id, label, low, high, value, format, onChange }) {
  const { min, max, step } = LIMITS[id];
  return (
    <label className="voice-slider">
      <span className="voice-slider-head">
        <strong>{label}</strong>
        <span className="voice-slider-value">{format(value)}</span>
      </span>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} aria-label={label} />
      <span className="voice-slider-ends muted small"><span>{low}</span><span>{high}</span></span>
    </label>
  );
}

export default function VoiceSettings() {
  const synth = typeof window !== 'undefined' ? window.speechSynthesis : undefined;
  const [voices, setVoices] = useState(() => synth?.getVoices() ?? []);
  const [voice, setVoice] = useState(readVoiceName);
  const [tuning, setTuning] = useState(readTuning);

  useEffect(() => {
    if (!synth) return undefined;
    const load = () => setVoices(synth.getVoices());
    load();
    synth.addEventListener?.('voiceschanged', load);
    return () => synth.removeEventListener?.('voiceschanged', load);
  }, [synth]);

  const options = useMemo(() => voiceOptions(voices, LANG), [voices]);
  const automatic = pickVoice(voices, LANG)?.name; // what "Automatic" would use

  if (!synth) {
    return <p className="muted">This browser can't speak replies aloud. Chrome or Edge on a computer has the clearest voices.</p>;
  }

  const tune = (patch) => {
    setTuning((t) => ({ ...t, ...patch }));
    saveVoiceSettings(patch);
  };
  const choose = (name) => {
    setVoice(name);
    saveVoiceSettings({ voice: name });
  };
  const test = () => {
    synth.cancel();
    synth.speak(applyVoice(new SpeechSynthesisUtterance(SAMPLE), currentVoice(synth.getVoices(), LANG), LANG));
  };
  const reset = () => {
    resetVoiceSettings();
    setVoice('');
    setTuning(readTuning());
  };
  const preset = PRESETS.find((p) => p.rate === tuning.rate && p.pitch === tuning.pitch);

  return (
    <>
    <JarvisVoiceSettings />
    <h4 className="jv-sub">Browser voice (backup, used when the neural voice can't be reached)</h4>
    <div className="voice-settings">
      <label className="voice-pick">
        <strong>Voice</strong>
        <select value={voice} onChange={(e) => choose(e.target.value)}>
          <option value="">Automatic: the clearest voice{automatic ? ` (${automatic})` : ''}</option>
          {options.map((o) => (
            <option key={o.name} value={o.name}>
              {o.recommended ? '★ ' : ''}{o.name} · {o.lang}{o.natural ? ' · natural' : ''}
            </option>
          ))}
        </select>
        <span className="muted small">★ = clearest for English (India). Voices marked “natural” sound the most human; Edge and Chrome have the best ones.</span>
      </label>

      <div className="voice-presets" role="group" aria-label="Voice style">
        {PRESETS.map((p) => (
          <button key={p.label} type="button" className={`chip${preset === p ? ' active' : ''}`} onClick={() => tune({ rate: p.rate, pitch: p.pitch })}>
            {p.label}
          </button>
        ))}
      </div>

      <div className="voice-sliders">
        <Slider id="pitch" label="Pitch" low="Deeper" high="Higher" value={tuning.pitch} format={(v) => (v === 1 ? 'Normal' : v < 1 ? `${Math.round((1 - v) * 100)}% deeper` : `${Math.round((v - 1) * 100)}% higher`)} onChange={(v) => tune({ pitch: v })} />
        <Slider id="rate" label="Speed" low="Slower" high="Faster" value={tuning.rate} format={(v) => `${v.toFixed(2)}×`} onChange={(v) => tune({ rate: v })} />
        <Slider id="volume" label="Volume" low="Quiet" high="Loud" value={tuning.volume} format={(v) => `${Math.round(v * 100)}%`} onChange={(v) => tune({ volume: v })} />
      </div>

      <div className="row wrap">
        <button type="button" className="btn primary sm" onClick={test}><Icon name="volume" size="1em" /> Test voice</button>
        <button type="button" className="btn sm" onClick={reset}><Icon name="refresh" size="1em" /> Reset</button>
        <span className="muted small">Saved on this device. Every spoken reply and reminder uses it.</span>
      </div>
    </div>
    </>
  );
}
