import { useEffect, useMemo, useRef, useState } from 'react';
import { speak } from '../brain.js';
import {
  analyzePixels,
  bestSentences,
  describeColumns,
  describeImage,
  highlight,
  parseCsv,
  predictOne,
  SAMPLE_DATASETS,
  SAMPLE_DOCS,
  sampleDataset,
  searchDocs,
  tokenize,
  train,
} from '../demoLab.js';
import { Icon } from '../icons.jsx';
import { toast } from '../ui.jsx';

// The demo versions of ML Lab, Knowledge, Vision and Memory. Everything runs in this browser:
// files you pick are read here and never uploaded; what you add is saved in localStorage.

const load = (key, fallback) => {
  try {
    const v = JSON.parse(localStorage.getItem(key));
    return v ?? fallback;
  } catch {
    return fallback;
  }
};
const save = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
};
const pct = (x) => `${Math.round(x * 100)}%`;
const readText = (file) =>
  new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(new Error('Could not read that file.'));
    r.readAsText(file);
  });

function Note({ children }) {
  return (
    <p className="lab-note">
      <Icon name="shield" size="0.95em" /> {children}
    </p>
  );
}

// ---------- ML Lab ----------
const LOG_KEY = 'azarvis-demo-mllab-log';

export function DemoMlLab() {
  const [source, setSource] = useState({ id: 'houses', name: 'houses.csv' });
  const [data, setData] = useState(() => sampleDataset('houses'));
  const [target, setTarget] = useState('price_lakh');
  const [model, setModel] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [inputs, setInputs] = useState({});
  const [log, setLog] = useState(() => load(LOG_KEY, []));
  const fileRef = useRef(null);
  const cols = useMemo(() => describeColumns(data), [data]);

  const pickSample = (s) => {
    setSource({ id: s.id, name: s.file });
    setData(sampleDataset(s.id));
    setTarget(s.target);
    setModel(null);
    setError('');
  };
  const upload = async (file) => {
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) return toast('In the demo, CSV files can be up to 2 MB', 'error');
    try {
      const parsed = parseCsv(await readText(file));
      setSource({ id: 'upload', name: file.name });
      setData(parsed);
      const info = describeColumns(parsed);
      setTarget(parsed.columns[info.length - 1]);
      setModel(null);
      setError('');
      toast(`Loaded ${parsed.rows.length} rows from ${file.name}`);
    } catch (e) {
      toast(e.message, 'error');
    }
  };
  const run = () => {
    setBusy(true);
    setError('');
    // Let the "Training…" state paint before the (synchronous) training starts.
    setTimeout(() => {
      try {
        const m = train(data, target);
        setModel(m);
        setInputs(Object.fromEntries(m.features.map((f, j) => [f, String(Math.round(m.mean[j] * 10) / 10)])));
        const entry = {
          id: Date.now(),
          dataset: source.name,
          target,
          model: m.model,
          score: m.kind === 'regression' ? `R² ${m.score.r2}` : `Accuracy ${pct(m.score.accuracy)}`,
          rows: m.rows,
        };
        setLog((l) => {
          const next = [entry, ...l].slice(0, 20);
          save(LOG_KEY, next);
          return next;
        });
      } catch (e) {
        setError(e.message);
        setModel(null);
      }
      setBusy(false);
    }, 30);
  };
  const prediction = model ? predictOne(model, model.features.map((f) => inputs[f] ?? 0)) : null;

  return (
    <div className="lab">
      <div className="lab-card">
        <h3 className="lab-title">1 · Pick your data</h3>
        <div className="lab-sources">
          {SAMPLE_DATASETS.map((s) => (
            <button key={s.id} type="button" className={`lab-source ${source.id === s.id ? 'on' : ''}`} aria-pressed={source.id === s.id} onClick={() => pickSample(s)}>
              <strong>{s.label}</strong>
              <span className="muted small">{s.text}</span>
            </button>
          ))}
          <button type="button" className={`lab-source ${source.id === 'upload' ? 'on' : ''}`} onClick={() => fileRef.current?.click()}>
            <strong><Icon name="upload" size="1em" /> Your own CSV</strong>
            <span className="muted small">{source.id === 'upload' ? source.name : 'A spreadsheet saved as .csv, up to 2 MB.'}</span>
          </button>
          <input ref={fileRef} type="file" accept=".csv,text/csv" hidden onChange={(e) => { upload(e.target.files?.[0]); e.target.value = ''; }} />
        </div>
        <p className="muted small lab-meta">
          {source.name} · {data.rows.length} rows · {data.columns.length} columns
        </p>
        <div className="lab-table-wrap">
          <table className="lab-table">
            <thead>
              <tr>
                {cols.map((c) => (
                  <th key={c.name} className={c.name === target ? 'is-target' : ''}>
                    {c.name}
                    <small>{c.numeric ? 'number' : 'text'}</small>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.rows.slice(0, 5).map((r, i) => (
                <tr key={i}>{r.map((v, j) => <td key={j} className={data.columns[j] === target ? 'is-target' : ''}>{v}</td>)}</tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="lab-card">
        <h3 className="lab-title">2 · Train a model</h3>
        <div className="lab-train">
          <label className="fb-field">
            <span>Column to predict</span>
            <select value={target} onChange={(e) => { setTarget(e.target.value); setModel(null); }}>
              {data.columns.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </label>
          <button type="button" className="btn primary" onClick={run} disabled={busy}>
            <Icon name="zap" size="1em" /> {busy ? 'Training…' : 'Train model'}
          </button>
        </div>
        <p className="muted small">80% of the rows train the model; it is scored on the other 20%, which it never saw.</p>
        {error && <p className="lab-error" role="alert"><Icon name="alert" size="1em" /> {error}</p>}
      </div>

      {model && (
        <div className="lab-card lab-result" aria-live="polite">
          <h3 className="lab-title">3 · Results</h3>
          <div className="lab-scores">
            {model.kind === 'regression' ? (
              <>
                <div className="lab-score"><span>R² on test rows</span><strong>{model.score.r2}</strong><small>1 is perfect, 0 = guessing the average</small></div>
                <div className="lab-score"><span>Average error (MAE)</span><strong>{model.score.mae}</strong><small>guessing the average: {model.score.baseMae}</small></div>
              </>
            ) : (
              <>
                <div className="lab-score"><span>Accuracy on test rows</span><strong>{pct(model.score.accuracy)}</strong><small>always guessing the common answer: {pct(model.score.baseline)}</small></div>
                <div className="lab-score"><span>Classes</span><strong>{model.classes.length}</strong><small>{model.classes.slice(0, 4).join(', ')}</small></div>
              </>
            )}
            <div className="lab-score"><span>Model</span><strong className="lab-model">{model.model}</strong><small>{model.trainRows} train · {model.testRows} test rows</small></div>
          </div>
          {model.skipped.length > 0 && <p className="muted small">Text columns skipped in the demo: {model.skipped.join(', ')}.</p>}
          {model.sampled && <p className="muted small">The file is large, so the demo trained on a random 3,000 rows.</p>}

          <h4 className="demo-sub">What matters most</h4>
          <ul className="lab-bars">
            {model.importance.map((f) => (
              <li key={f.name}>
                <span className="lab-bar-label">{f.name}{f.sign < 0 ? ' ↓' : f.sign > 0 ? ' ↑' : ''}</span>
                <span className="lab-bar"><i style={{ width: pct(f.share) }} /></span>
                <span className="lab-bar-val">{pct(f.share)}</span>
              </li>
            ))}
          </ul>

          <h4 className="demo-sub">Try a prediction</h4>
          <div className="lab-predict">
            {model.features.map((f) => (
              <label key={f} className="fb-field">
                <span>{f}</span>
                <input type="number" step="any" value={inputs[f] ?? ''} onChange={(e) => setInputs((v) => ({ ...v, [f]: e.target.value }))} />
              </label>
            ))}
            <div className="lab-answer">
              <span className="muted small">Predicted {model.target}</span>
              <strong>{String(prediction)}</strong>
            </div>
          </div>
        </div>
      )}

      {log.length > 0 && (
        <div className="lab-card">
          <div className="lab-row-head">
            <h3 className="lab-title">Experiment log</h3>
            <button type="button" className="btn ghost sm" onClick={() => { setLog([]); save(LOG_KEY, []); }}>
              <Icon name="trash" size="0.95em" /> Clear
            </button>
          </div>
          <ul className="lab-log">
            {log.map((e) => (
              <li key={e.id}>
                <span className="grow"><strong>{e.dataset}</strong> → {e.target}<small className="muted"> · {e.model} · {e.rows} rows</small></span>
                <span className="lab-pill">{e.score}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      <Note>Your CSV is read and trained on in this browser. It is never uploaded.</Note>
    </div>
  );
}

// ---------- Knowledge ----------
const DOCS_KEY = 'azarvis-demo-docs';
const DOC_QUESTIONS = ['How do I set a reminder?', 'What is overfitting?', 'What is the STAR method?', 'Is my password safe?'];

export function DemoKnowledge() {
  const [docs, setDocs] = useState(() => [...SAMPLE_DOCS, ...load(DOCS_KEY, [])]);
  const [query, setQuery] = useState('');
  const [asked, setAsked] = useState('');
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState('');
  const [text, setText] = useState('');
  const [open, setOpen] = useState(null);
  const fileRef = useRef(null);
  const results = useMemo(() => (asked ? searchDocs(docs, asked) : []), [docs, asked]);
  const terms = useMemo(() => [...new Set(tokenize(asked))], [asked]);

  const persist = (all) => {
    const mine = all.filter((d) => !d.sample);
    if (!save(DOCS_KEY, mine)) toast('This browser is out of space for more documents', 'error');
    setDocs(all);
  };
  const addDoc = (t, body) => {
    if (!body.trim()) return toast('The document is empty', 'error');
    persist([...docs, { id: `d${Date.now()}`, title: t.trim() || 'Untitled document', text: body.slice(0, 200_000) }]);
    toast(`Added “${t.trim() || 'Untitled document'}”`);
  };
  const upload = async (files) => {
    for (const f of files) {
      if (!/\.(txt|md|csv|json|html?)$/i.test(f.name) && !f.type.startsWith('text/')) {
        toast(`${f.name}: the demo reads text files (.txt, .md, .csv). PDF and Word work in your account.`, 'error');
        continue;
      }
      try {
        addDoc(f.name.replace(/\.[^.]+$/, ''), await readText(f));
      } catch (e) {
        toast(e.message, 'error');
      }
    }
  };
  const ask = (q) => {
    setQuery(q);
    setAsked(q.trim());
  };
  const best = results[0];

  return (
    <div className="lab">
      <form className="lab-search" onSubmit={(e) => { e.preventDefault(); ask(query); }}>
        <Icon name="search" size="1.1em" />
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Ask a question about your documents…" aria-label="Ask your documents" maxLength={200} />
        <button className="btn primary" disabled={!query.trim()}>Ask</button>
      </form>
      <div className="demo-suggest lab-suggest">
        {DOC_QUESTIONS.map((q) => <button key={q} type="button" className="chip" onClick={() => ask(q)}>{q}</button>)}
      </div>

      {asked && (
        <div className="lab-card" aria-live="polite">
          {best ? (
            <>
              <div className="lab-row-head">
                <h3 className="lab-title"><Icon name="sparkles" size="1em" /> Answer</h3>
                <button type="button" className="icon-btn" onClick={() => speak(bestSentences(best.text, asked))} aria-label="Read the answer aloud" title="Read aloud"><Icon name="volume" /></button>
              </div>
              <p className="lab-answer-text">{bestSentences(best.text, asked)}</p>
              <p className="muted small">Source: <strong>{best.title}</strong></p>
              <h4 className="demo-sub">Matching passages · {results.length}</h4>
              <ul className="lab-hits">
                {results.map((r, i) => (
                  <li key={i}>
                    <strong>{r.title}</strong>
                    <p>{highlight(r.text, terms).map((p, j) => (p.hit ? <mark key={j}>{p.text}</mark> : p.text))}</p>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p className="muted">Nothing in your documents mentions that. Try other words, or add a document about it.</p>
          )}
          <p className="muted small">In your account Claude writes the answer from these passages; the demo quotes the best sentences.</p>
        </div>
      )}

      <div className="lab-card">
        <div className="lab-row-head">
          <h3 className="lab-title">Your documents · {docs.length}</h3>
          <span className="lab-actions">
            <button type="button" className="btn sm" onClick={() => fileRef.current?.click()}><Icon name="upload" size="0.95em" /> Upload</button>
            <button type="button" className="btn sm" onClick={() => setAdding((a) => !a)}><Icon name="plus" size="0.95em" /> Paste text</button>
          </span>
          <input ref={fileRef} type="file" multiple accept=".txt,.md,.csv,.json,.html,text/*" hidden onChange={(e) => { upload([...(e.target.files || [])]); e.target.value = ''; }} />
        </div>
        {adding && (
          <form className="lab-add" onSubmit={(e) => { e.preventDefault(); addDoc(title, text); setTitle(''); setText(''); setAdding(false); }}>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title, e.g. Lecture 4 notes" aria-label="Document title" maxLength={80} />
            <textarea value={text} onChange={(e) => setText(e.target.value)} rows={6} placeholder="Paste the text here…" aria-label="Document text" />
            <div className="lab-actions">
              <button className="btn primary sm" disabled={!text.trim()}>Add document</button>
              <button type="button" className="btn ghost sm" onClick={() => setAdding(false)}>Cancel</button>
            </div>
          </form>
        )}
        <ul className="lab-docs">
          {docs.map((d) => (
            <li key={d.id}>
              <div className="lab-doc-row">
                <Icon name="file" size="1.1em" />
                <button type="button" className="link-btn grow lab-doc-name" onClick={() => setOpen(open === d.id ? null : d.id)} aria-expanded={open === d.id}>
                  {d.title}
                </button>
                <small className="muted">{d.sample ? 'sample' : `${Math.max(1, Math.round(d.text.length / 1000))} KB`}</small>
                {!d.sample && (
                  <button type="button" className="icon-btn" onClick={() => persist(docs.filter((x) => x.id !== d.id))} aria-label={`Delete ${d.title}`}><Icon name="trash" size="0.95em" /></button>
                )}
              </div>
              {open === d.id && <p className="lab-doc-text">{d.text.slice(0, 1500)}{d.text.length > 1500 ? '…' : ''}</p>}
            </li>
          ))}
        </ul>
      </div>
      <Note>Documents you add stay in this browser. Nothing is uploaded.</Note>
    </div>
  );
}

// ---------- Vision ----------
const SAMPLE_IMAGE = '/hero-azarvis.webp';
const MOTION_W = 64;
const MOTION_H = 48;

function analyzeImage(img) {
  const scale = Math.min(1, 160 / Math.max(img.naturalWidth, img.naturalHeight));
  const w = Math.max(1, Math.round(img.naturalWidth * scale));
  const h = Math.max(1, Math.round(img.naturalHeight * scale));
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(img, 0, 0, w, h);
  const a = analyzePixels(ctx.getImageData(0, 0, w, h).data, w, h);
  return { ...a, width: img.naturalWidth, height: img.naturalHeight, text: describeImage(a, img.naturalWidth, img.naturalHeight) };
}

// Optional browser features (Chrome with experimental flags, some Android builds).
async function detectExtras(img) {
  const out = {};
  try {
    if ('FaceDetector' in window) out.faces = (await new window.FaceDetector({ fastMode: true }).detect(img)).length;
  } catch {}
  try {
    if ('TextDetector' in window) out.words = (await new window.TextDetector().detect(img)).map((t) => t.rawValue).join(' ');
  } catch {}
  return out;
}

function RoomWatch() {
  const videoRef = useRef(null);
  const [on, setOn] = useState(false);
  const [motion, setMotion] = useState(0);
  const [status, setStatus] = useState('Camera off');
  const [events, setEvents] = useState([]);
  const stateRef = useRef({ prev: null, lastMotion: 0, greeted: 0 });

  useEffect(() => {
    if (!on) return;
    let stream;
    let timer;
    let cancelled = false;
    const canvas = document.createElement('canvas');
    canvas.width = MOTION_W;
    canvas.height = MOTION_H;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    navigator.mediaDevices
      ?.getUserMedia({ video: { width: 320, height: 240 }, audio: false })
      .then((s) => {
        if (cancelled) return s.getTracks().forEach((t) => t.stop());
        stream = s;
        videoRef.current.srcObject = s;
        stateRef.current = { prev: null, lastMotion: Date.now(), greeted: 0 };
        setStatus('Watching. Step out of view for 5 seconds, then walk back in.');
        timer = setInterval(() => {
          const v = videoRef.current;
          if (!v || v.readyState < 2) return;
          ctx.drawImage(v, 0, 0, MOTION_W, MOTION_H);
          const { data } = ctx.getImageData(0, 0, MOTION_W, MOTION_H);
          const grey = new Uint8Array(MOTION_W * MOTION_H);
          for (let i = 0; i < grey.length; i++) grey[i] = (data[i * 4] * 77 + data[i * 4 + 1] * 150 + data[i * 4 + 2] * 29) >> 8;
          const st = stateRef.current;
          if (st.prev) {
            let moved = 0;
            for (let i = 0; i < grey.length; i++) if (Math.abs(grey[i] - st.prev[i]) > 28) moved++;
            const share = moved / grey.length;
            setMotion(share);
            const now = Date.now();
            if (share > 0.05) {
              // Motion after 5 quiet seconds = someone walked in (the real app also checks for a face).
              if (now - st.lastMotion > 5000 && now - st.greeted > 15000) {
                st.greeted = now;
                const hello = `Welcome back! It's ${new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}.`;
                setEvents((e) => [{ id: now, text: hello }, ...e].slice(0, 5));
                toast(hello);
                speak(hello);
              }
              st.lastMotion = now;
            }
          }
          st.prev = grey;
        }, 500);
      })
      .catch(() => {
        setStatus('The camera is blocked or not available. Allow camera access and try again.');
        setOn(false);
      });
    if (!navigator.mediaDevices) {
      setStatus('This browser has no camera access.');
      setOn(false);
    }
    return () => {
      cancelled = true;
      clearInterval(timer);
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [on]);

  return (
    <div className="lab-card">
      <div className="lab-row-head">
        <h3 className="lab-title"><Icon name="camera" size="1em" /> Room Watch</h3>
        <button type="button" className={`btn sm ${on ? '' : 'primary'}`} onClick={() => { setOn((o) => !o); if (on) setStatus('Camera off'); }}>
          {on ? <><Icon name="stop" size="0.95em" /> Stop</> : <><Icon name="play" size="0.95em" /> Start camera</>}
        </button>
      </div>
      <p className="muted small">Azarvis greets you when you walk into the room. Motion is measured here, on a tiny 64 × 48 copy of each frame.</p>
      {on && (
        <div className="lab-cam">
          <video ref={videoRef} autoPlay playsInline muted aria-label="Camera preview" />
          <div className="lab-meter" aria-label={`Motion ${pct(motion)}`}><i style={{ width: pct(Math.min(1, motion * 4)) }} /></div>
        </div>
      )}
      <p className="small" role="status">{status}</p>
      {events.length > 0 && (
        <ul className="lab-log">
          {events.map((e) => <li key={e.id}><Icon name="bell" size="0.95em" /> <span className="grow">{e.text}</span></li>)}
        </ul>
      )}
    </div>
  );
}

export function DemoVision() {
  const [src, setSrc] = useState(SAMPLE_IMAGE);
  const [name, setName] = useState('Sample image');
  const [result, setResult] = useState(null);
  const [extras, setExtras] = useState({});
  const fileRef = useRef(null);

  useEffect(() => () => src.startsWith('blob:') && URL.revokeObjectURL(src), [src]);

  const pick = (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) return toast('Pick an image file (JPG, PNG, WebP)', 'error');
    setResult(null);
    setExtras({});
    setName(file.name);
    setSrc(URL.createObjectURL(file));
  };
  const onLoad = async (e) => {
    const img = e.currentTarget;
    try {
      setResult(analyzeImage(img));
      setExtras(await detectExtras(img));
    } catch {
      toast('Could not read that image', 'error');
    }
  };

  return (
    <div className="lab">
      <div className="lab-card">
        <div className="lab-row-head">
          <h3 className="lab-title">Describe an image</h3>
          <span className="lab-actions">
            <button type="button" className="btn primary sm" onClick={() => fileRef.current?.click()}><Icon name="upload" size="0.95em" /> Choose image</button>
            {src !== SAMPLE_IMAGE && <button type="button" className="btn ghost sm" onClick={() => { setResult(null); setName('Sample image'); setSrc(SAMPLE_IMAGE); }}>Use sample</button>}
          </span>
          <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => { pick(e.target.files?.[0]); e.target.value = ''; }} />
        </div>
        <div
          className="lab-vision"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => { e.preventDefault(); pick(e.dataTransfer.files?.[0]); }}
        >
          <figure className="lab-image">
            <img src={src} alt={name} onLoad={onLoad} />
            <figcaption className="muted small">{name} · drop another image here</figcaption>
          </figure>
          <div className="lab-vision-out" aria-live="polite">
            {result ? (
              <>
                <div className="lab-row-head">
                  <strong>What Azarvis sees</strong>
                  <button type="button" className="icon-btn" onClick={() => speak(result.text)} aria-label="Read the description aloud" title="Read aloud"><Icon name="volume" /></button>
                </div>
                <p className="lab-answer-text">{result.text}</p>
                <h4 className="demo-sub">Main colours</h4>
                <ul className="lab-swatches">
                  {result.colors.filter((c) => c.share >= 0.01).map((c) => (
                    <li key={c.name}><i style={{ background: c.hex }} /> {c.name} <small className="muted">{pct(c.share)}</small></li>
                  ))}
                </ul>
                <dl className="lab-facts">
                  <div><dt>Brightness</dt><dd>{pct(result.brightness)}</dd></div>
                  <div><dt>Colourfulness</dt><dd>{pct(result.saturation)}</dd></div>
                  <div><dt>Size</dt><dd>{result.width} × {result.height}</dd></div>
                  {extras.faces != null && <div><dt>Faces</dt><dd>{extras.faces}</dd></div>}
                </dl>
                {extras.words && <p className="small"><strong>Text in the image:</strong> {extras.words}</p>}
              </>
            ) : (
              <p className="muted">Looking at the image…</p>
            )}
          </div>
        </div>
        <p className="muted small">The demo reads the pixels: light, colours and detail. In your account Claude describes what is in the picture and reads its text.</p>
      </div>
      <RoomWatch />
      <Note>Images and the camera are processed in this browser. Nothing is uploaded.</Note>
    </div>
  );
}

// ---------- Memory ----------
const KINDS = [
  ['name', 'Name', 'user'],
  ['goal', 'Goal', 'target'],
  ['preference', 'Preference', 'heart'],
  ['fact', 'Fact', 'brain'],
];

export function DemoMemory({ facts, setFacts, onAsk }) {
  const [text, setText] = useState('');
  const [kind, setKind] = useState('fact');
  const [confirming, setConfirming] = useState(false);
  const add = (e) => {
    e.preventDefault();
    const t = text.trim();
    if (!t) return;
    setFacts((fs) => (kind === 'name' ? [{ id: Date.now(), kind, text: t }, ...fs.filter((f) => f.kind !== 'name')] : [{ id: Date.now(), kind, text: t }, ...fs]));
    setText('');
    toast('Azarvis will remember that');
  };
  const groups = KINDS.map(([id, label, icon]) => ({ id, label, icon, items: facts.filter((f) => f.kind === id) })).filter((g) => g.items.length);

  return (
    <div className="lab">
      <form className="demo-task-add" onSubmit={add}>
        <select value={kind} onChange={(e) => setKind(e.target.value)} aria-label="Kind of memory" className="lab-kind">
          {KINDS.map(([id, label]) => <option key={id} value={id}>{label}</option>)}
        </select>
        <input value={text} onChange={(e) => setText(e.target.value)} placeholder={kind === 'name' ? 'Your name' : 'e.g. I prefer Hindi explanations'} aria-label="What to remember" maxLength={160} />
        <button className="btn primary"><Icon name="plus" size="1em" /> Remember</button>
      </form>
      <p className="muted small">Or tell the chat: “My name is Riya” or “Remember that my exam is on Friday”.</p>
      {groups.length ? (
        groups.map((g) => (
          <div key={g.id}>
            <h3 className="demo-sub"><Icon name={g.icon} size="0.95em" /> {g.label} <span className="muted">· {g.items.length}</span></h3>
            <ul className="demo-task-list">
              {g.items.map((f) => (
                <li key={f.id} className="demo-task">
                  <span className="grow">{f.text}</span>
                  <button type="button" className="icon-btn" onClick={() => setFacts((fs) => fs.filter((x) => x.id !== f.id))} aria-label={`Forget "${f.text}"`}>
                    <Icon name="trash" size="0.95em" />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))
      ) : (
        <p className="muted">Azarvis doesn't remember anything about you. Add something above.</p>
      )}
      <div className="lab-actions">
        <button type="button" className="btn sm" onClick={() => onAsk('What do you know about me?')}><Icon name="chat" size="0.95em" /> Ask what it knows</button>
        {facts.length > 0 &&
          (confirming ? (
            <>
              <button type="button" className="btn sm danger" onClick={() => { setFacts([]); setConfirming(false); toast('Memory cleared'); }}>Yes, forget everything</button>
              <button type="button" className="btn ghost sm" onClick={() => setConfirming(false)}>Cancel</button>
            </>
          ) : (
            <button type="button" className="btn ghost sm" onClick={() => setConfirming(true)}><Icon name="trash" size="0.95em" /> Forget everything</button>
          ))}
      </div>
      <Note>Memories stay in this browser. In your account they are saved to it, and you can still see and delete each one.</Note>
    </div>
  );
}
