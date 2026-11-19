import { useEffect, useRef, useState } from 'react';
import { api } from '../api.js';
import { Icon } from '../icons.jsx';
import { PageHeader, toast } from '../ui.jsx';
import './CameraLab.css';

// Camera Lab: live visualizations of your camera, computed in this browser (nothing is uploaded
// unless you press "Ask Azarvis"). Views: normal, edges (Sobel), motion (frame difference) and a
// heat map (brightness in false colour). Live charts: RGB histogram, motion and brightness over time.

const MODES = [
  { id: 'normal', label: 'Normal', icon: 'camera', note: 'The camera as it is' },
  { id: 'edges', label: 'Edges', icon: 'workflow', note: 'Outlines found with a Sobel filter' },
  { id: 'motion', label: 'Motion', icon: 'pulse', note: 'What changed since the last frame' },
  { id: 'heat', label: 'Heat map', icon: 'sun', note: 'Brightness shown in false colour' },
];
const WIDTH = 480; // processing size: fast enough for every frame
const HISTORY = 120; // points in the timeline (about one minute)

// Dark blue → cyan → yellow → red, for the heat map and motion overlay.
const PALETTE = (() => {
  const stops = [[0, 8, 16, 60], [0.35, 0, 160, 220], [0.65, 250, 220, 40], [1, 240, 40, 40]];
  const out = new Uint8ClampedArray(256 * 3);
  for (let i = 0; i < 256; i++) {
    const t = i / 255;
    const k = stops.findIndex((s) => s[0] >= t);
    const [a, b] = [stops[Math.max(0, k - 1)], stops[Math.max(0, k)]];
    const f = b[0] === a[0] ? 0 : (t - a[0]) / (b[0] - a[0]);
    for (let c = 0; c < 3; c++) out[i * 3 + c] = a[c + 1] + (b[c + 1] - a[c + 1]) * f;
  }
  return out;
})();

/** Processes one frame in place and returns its stats (pure, so the maths is easy to follow). */
export function processFrame(img, prevGray, mode) {
  const { data, width: w, height: h } = img;
  const n = w * h;
  const gray = new Uint8ClampedArray(n);
  const hist = [new Uint32Array(32), new Uint32Array(32), new Uint32Array(32)];
  let sum = 0;
  let rs = 0;
  let gs = 0;
  let bs = 0;
  for (let i = 0, p = 0; i < n; i++, p += 4) {
    const r = data[p], g = data[p + 1], b = data[p + 2];
    const y = (r * 77 + g * 150 + b * 29) >> 8;
    gray[i] = y;
    sum += y;
    rs += r; gs += g; bs += b;
    hist[0][r >> 3]++; hist[1][g >> 3]++; hist[2][b >> 3]++;
  }
  let moved = 0;
  if (prevGray) for (let i = 0; i < n; i++) if (Math.abs(gray[i] - prevGray[i]) > 28) moved++;

  if (mode === 'edges') {
    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        const i = y * w + x;
        const gx = -gray[i - w - 1] - 2 * gray[i - 1] - gray[i + w - 1] + gray[i - w + 1] + 2 * gray[i + 1] + gray[i + w + 1];
        const gy = -gray[i - w - 1] - 2 * gray[i - w] - gray[i - w + 1] + gray[i + w - 1] + 2 * gray[i + w] + gray[i + w + 1];
        const m = Math.min(255, Math.hypot(gx, gy));
        const p = i * 4;
        data[p] = m * 0.35; data[p + 1] = m * 0.9; data[p + 2] = m;
      }
    }
  } else if (mode === 'heat') {
    for (let i = 0, p = 0; i < n; i++, p += 4) {
      const c = gray[i] * 3;
      data[p] = PALETTE[c]; data[p + 1] = PALETTE[c + 1]; data[p + 2] = PALETTE[c + 2];
    }
  } else if (mode === 'motion') {
    for (let i = 0, p = 0; i < n; i++, p += 4) {
      const d = prevGray ? Math.abs(gray[i] - prevGray[i]) : 0;
      const base = gray[i] * 0.35;
      if (d > 28) {
        const c = Math.min(255, d * 2) * 3;
        data[p] = PALETTE[c]; data[p + 1] = PALETTE[c + 1]; data[p + 2] = PALETTE[c + 2];
      } else {
        data[p] = base; data[p + 1] = base; data[p + 2] = base * 1.2;
      }
    }
  }
  return {
    gray,
    hist,
    brightness: Math.round(sum / n),
    motion: prevGray ? Math.round((moved / n) * 1000) / 10 : 0,
    avg: [Math.round(rs / n), Math.round(gs / n), Math.round(bs / n)],
  };
}

function Histogram({ hist }) {
  if (!hist) return <div className="cl-chart-empty">Waiting for the camera…</div>;
  const max = Math.max(1, ...hist.flatMap((h) => [...h]));
  const line = (h) => [...h].map((v, i) => `${(i / 31) * 100},${40 - (v / max) * 38}`).join(' ');
  return (
    <svg viewBox="0 0 100 40" preserveAspectRatio="none" className="cl-hist" role="img" aria-label="Colour histogram">
      <polyline points={line(hist[0])} className="r" />
      <polyline points={line(hist[1])} className="g" />
      <polyline points={line(hist[2])} className="b" />
    </svg>
  );
}

function Timeline({ points }) {
  if (points.length < 2) return <div className="cl-chart-empty">Collecting…</div>;
  const x = (i) => (i / (HISTORY - 1)) * 100;
  const motion = points.map((p, i) => `${x(i + HISTORY - points.length)},${40 - Math.min(40, p.motion * 1.6)}`).join(' ');
  const light = points.map((p, i) => `${x(i + HISTORY - points.length)},${40 - (p.brightness / 255) * 38}`).join(' ');
  return (
    <svg viewBox="0 0 100 40" preserveAspectRatio="none" className="cl-time" role="img" aria-label="Motion and brightness over time">
      <polyline points={light} className="light" />
      <polyline points={motion} className="motion" />
    </svg>
  );
}

export default function CameraLab() {
  const video = useRef(null);
  const canvas = useRef(null);
  const stream = useRef(null);
  const modeRef = useRef('normal');
  const mirrorRef = useRef(true);
  const [mode, setMode] = useState('normal');
  const [mirror, setMirror] = useState(true);
  const [on, setOn] = useState(false);
  const [error, setError] = useState('');
  const [stats, setStats] = useState(null);
  const [points, setPoints] = useState([]);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState(null);
  const [asking, setAsking] = useState(false);
  modeRef.current = mode;
  mirrorRef.current = mirror;

  const stop = () => {
    stream.current?.getTracks().forEach((t) => t.stop());
    stream.current = null;
    setOn(false);
  };
  useEffect(() => stop, []);

  const start = async () => {
    setError('');
    try {
      stream.current = await navigator.mediaDevices.getUserMedia({ video: { width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false });
      video.current.srcObject = stream.current;
      await video.current.play();
      setOn(true);
    } catch (e) {
      setError(e?.name === 'NotAllowedError' ? 'Camera permission was blocked. Allow it from the lock icon in the address bar.' : `Camera unavailable: ${e?.message || e}`);
    }
  };

  // The processing loop: every frame drawn small, processed, shown; stats ~4 times a second.
  useEffect(() => {
    if (!on) return undefined;
    const v = video.current;
    const c = canvas.current;
    const ctx = c.getContext('2d', { willReadFrequently: true });
    let raf;
    let prev = null;
    let lastStats = 0;
    let lastPoint = 0;
    const loop = (t) => {
      if (v.videoWidth) {
        const h = Math.round((WIDTH * v.videoHeight) / v.videoWidth);
        if (c.width !== WIDTH || c.height !== h) { c.width = WIDTH; c.height = h; }
        ctx.save();
        if (mirrorRef.current) { ctx.translate(WIDTH, 0); ctx.scale(-1, 1); }
        ctx.drawImage(v, 0, 0, WIDTH, h);
        ctx.restore();
        const img = ctx.getImageData(0, 0, WIDTH, h);
        const s = processFrame(img, prev, modeRef.current);
        prev = s.gray;
        if (modeRef.current !== 'normal') ctx.putImageData(img, 0, 0);
        if (t - lastStats > 250) { lastStats = t; setStats(s); }
        if (t - lastPoint > 500) { lastPoint = t; setPoints((p) => [...p.slice(-(HISTORY - 1)), { motion: s.motion, brightness: s.brightness }]); }
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [on]);

  const frameBlob = () => new Promise((resolve) => canvas.current.toBlob(resolve, 'image/jpeg', 0.9));
  const snapshot = async () => {
    const blob = await frameBlob();
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `azarvis-camera-${mode}-${Date.now()}.jpg`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    toast('Snapshot saved');
  };
  const ask = async () => {
    setAsking(true);
    setAnswer(null);
    try {
      // The plain camera picture (not the effect), so Azarvis sees what you see.
      const prevMode = modeRef.current;
      modeRef.current = 'normal';
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
      const blob = await frameBlob();
      modeRef.current = prevMode;
      setAnswer(await api.analyzeImage(blob, question));
    } catch (e) {
      setAnswer({ error: e.message || 'Azarvis could not look at the picture.' });
    } finally {
      setAsking(false);
    }
  };

  const current = MODES.find((m) => m.id === mode);
  const swatch = stats ? `rgb(${stats.avg.join(',')})` : 'transparent';

  return (
    <div className="panel cl">
      <PageHeader icon="camera" hue={190} title="Camera Lab" subtitle="Live visualizations of your camera: edges, motion, heat map and colour charts. Processed in this browser; nothing is uploaded unless you ask Azarvis." />

      <div className="cl-layout">
        <section className="cl-stage">
          <div className="cl-view">
            <video ref={video} playsInline muted className="cl-video" />
            <canvas ref={canvas} className={`cl-canvas ${on ? '' : 'off'}`} aria-label={`Camera, ${current.label} view`} />
            {!on && (
              <div className="cl-start">
                <span className="cl-start-icon"><Icon name="camera" size="1.6em" /></span>
                <strong>Turn on the camera</strong>
                <p>Your browser will ask for permission. The video stays on this device.</p>
                <button type="button" className="btn primary" onClick={start}><Icon name="camera" size="1em" /> Start camera</button>
                {error && <p className="cl-error" role="alert">{error}</p>}
              </div>
            )}
            {on && <span className="cl-live"><i /> Live · {current.label}</span>}
          </div>

          <div className="cl-modes" role="radiogroup" aria-label="Visualization">
            {MODES.map((m) => (
              <button key={m.id} type="button" role="radio" aria-checked={mode === m.id} className={mode === m.id ? 'on' : ''} onClick={() => setMode(m.id)} title={m.note}>
                <Icon name={m.icon} size="1em" /> {m.label}
              </button>
            ))}
          </div>
          <div className="row wrap cl-actions">
            <label className="check-row"><input type="checkbox" checked={mirror} onChange={(e) => setMirror(e.target.checked)} /> Mirror</label>
            <span className="grow" />
            <button type="button" className="btn sm" onClick={snapshot} disabled={!on}><Icon name="download" size="1em" /> Snapshot</button>
            {on && <button type="button" className="btn sm" onClick={stop}><Icon name="stop" size="1em" /> Stop camera</button>}
          </div>
        </section>

        <aside className="cl-side">
          <section className="cl-card">
            <h3>Right now</h3>
            <dl className="cl-stats">
              <div><dt>Motion</dt><dd>{stats ? `${stats.motion}%` : '—'}</dd></div>
              <div><dt>Brightness</dt><dd>{stats ? `${Math.round((stats.brightness / 255) * 100)}%` : '—'}</dd></div>
              <div><dt>Average colour</dt><dd><span className="cl-swatch" style={{ background: swatch }} /> {stats ? `rgb ${stats.avg.join(' ')}` : '—'}</dd></div>
            </dl>
          </section>
          <section className="cl-card">
            <h3>Colour histogram</h3>
            <Histogram hist={stats?.hist} />
            <p className="cl-legend"><i className="r" /> Red <i className="g" /> Green <i className="b" /> Blue <span>dark → bright</span></p>
          </section>
          <section className="cl-card">
            <h3>Last minute</h3>
            <Timeline points={points} />
            <p className="cl-legend"><i className="motion" /> Motion <i className="light" /> Brightness</p>
          </section>
          <section className="cl-card">
            <h3>Ask Azarvis about this frame</h3>
            <input className="full-input" value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="Optional: what objects are on my desk?" aria-label="Question about the camera picture" />
            <button type="button" className="btn primary sm" onClick={ask} disabled={!on || asking}><Icon name="sparkles" size="1em" /> {asking ? 'Looking…' : 'Ask Azarvis'}</button>
            <p className="muted small">Sends this one picture to Azarvis (faces are counted on your PC, the description uses Claude).</p>
            {answer?.error && <p className="cl-error" role="alert">{answer.error}</p>}
            {answer && !answer.error && (
              <div className="cl-answer">
                <p><strong>Faces:</strong> {answer.faces?.length ?? 0}</p>
                {answer.description && <p>{answer.description}</p>}
              </div>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}
