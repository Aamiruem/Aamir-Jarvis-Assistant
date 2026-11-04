import { useEffect, useRef, useState } from 'react';
import { api } from '../api.js';
import { Icon } from '../icons.jsx';
import { EmptyState, PageHeader, toast } from '../ui.jsx';

// ML Lab: the house price project, training on your own CSV files, your models and the experiment
// log. Every score shown was measured on rows the model never saw while training.

const METRIC_LABEL = { r2: 'R² (1 = perfect)', mae: 'Typical error (MAE)', rmse: 'RMSE', accuracy: 'Accuracy', f1: 'F1 (macro)', roc_auc: 'ROC-AUC' };
const VERDICT_TONE = { 'good fit': 'ok', 'some overfitting': 'warn', overfitting: 'bad', underfitting: 'bad' };
const PRESETS = {
  'San Francisco': { latitude: 37.77, longitude: -122.42, income: 8, house_age: 45, rooms: 5, bedrooms: 1.05, population: 1200, occupancy: 2.4 },
  'Los Angeles': { latitude: 34.05, longitude: -118.24, income: 4.5, house_age: 35, rooms: 4.8, bedrooms: 1.05, population: 1600, occupancy: 3.1 },
  Fresno: { latitude: 36.74, longitude: -119.78, income: 3.2, house_age: 25, rooms: 5.4, bedrooms: 1.1, population: 1400, occupancy: 3 },
};
const HOUSE_LABELS = {
  income: 'Median income ($10k/year)', house_age: 'House age (years)', rooms: 'Rooms per home', bedrooms: 'Bedrooms per home',
  population: 'People in the area', occupancy: 'People per home', latitude: 'Latitude', longitude: 'Longitude',
};

const fmt = (v, d = 3) => (v == null ? '—' : (Math.abs(v) < 0.5 * 10 ** -d ? 0 : Number(v)).toLocaleString(undefined, { maximumFractionDigits: d }));
const usd = (v) => (v == null ? '—' : `$${Math.round(v).toLocaleString()}`);
const pct = (v) => (v == null ? '—' : `${Math.round(v * 100)}%`);

/** Polls a training job until it finishes. */
function useJob(jobId, onDone) {
  const [job, setJob] = useState(null);
  const done = useRef(onDone);
  done.current = onDone;
  useEffect(() => {
    if (!jobId) return setJob(null);
    let stop = false;
    const tick = async () => {
      try {
        const j = await api.mlJob(jobId);
        if (stop) return;
        setJob(j);
        if (j.status === 'done' || j.status === 'failed') return done.current?.(j);
      } catch (e) {
        if (!stop) setJob({ status: 'failed', error: e.message });
        return;
      }
      setTimeout(tick, 1500);
    };
    tick();
    return () => { stop = true; };
  }, [jobId]);
  return job;
}

function Progress({ job, label }) {
  return (
    <div className="progress-card ml-progress">
      <div className="row">
        <span className="grow">{job?.message || label}</span>
        <span className="progress-pct">{job?.progress ?? 0}%</span>
      </div>
      <div className="progress"><i style={{ width: `${job?.progress ?? 2}%` }} /></div>
    </div>
  );
}

function Bars({ rows, max = 1, format = fmt, tone }) {
  return (
    <ul className="ml-bars">
      {rows.map((r) => (
        <li key={r.label} className={r.highlight ? 'best' : ''}>
          <span className="ml-bar-label" title={r.label}>{r.label}</span>
          <span className={`ml-bar ${tone || ''}`}><i style={{ width: `${Math.max(2, Math.min(100, (Math.max(r.value, 0) / max) * 100))}%` }} /></span>
          <span className="ml-bar-value">{format(r.value)}{r.extra && <small> {r.extra}</small>}</span>
        </li>
      ))}
    </ul>
  );
}

/** The model card: honest scores, model comparison, what matters, and natural groups. */
function Report({ report, unit = 1, unitLabel }) {
  const primary = report.primary_metric;
  const money = unit !== 1;
  const show = (k, v) => (k === 'mae' || k === 'rmse' ? (money ? usd(v * unit) : fmt(v)) : k === 'r2' ? fmt(v, 3) : pct(v));
  const tone = VERDICT_TONE[report.fit_check.verdict] || 'ok';
  return (
    <div className="ml-report">
      <p className="ml-summary"><Icon name="sparkles" size="1.05em" /> {report.summary}</p>

      <div className="ml-tiles">
        {Object.entries(report.test).filter(([k]) => k !== 'confusion').map(([k, v]) => (
          <div key={k} className="ml-tile">
            <small>{METRIC_LABEL[k] || k}</small>
            <strong>{show(k, v)}</strong>
            {report.baseline[k] != null && <span className="muted">baseline {show(k, report.baseline[k])}</span>}
          </div>
        ))}
        <div className={`ml-tile verdict ${tone}`}>
          <small>Fit check</small>
          <strong>{report.fit_check.verdict}</strong>
          <span className="muted">train {fmt(report.fit_check.train, 2)} · validation {fmt(report.fit_check.cv, 2)}</span>
        </div>
      </div>
      <p className="muted small">{report.fit_check.note} Tested on {report.test_rows.toLocaleString()} of {report.rows.toLocaleString()} rows, held back from training.{unitLabel ? ` ${unitLabel}` : ''}</p>

      <div className="ml-cols">
        <section>
          <h4>{report.leaderboard.length} algorithms compared (cross-validation)</h4>
          <Bars
            rows={report.leaderboard.map((m) => ({
              label: m.model,
              value: m.cv[primary].mean,
              extra: `±${fmt(m.cv[primary].std, 3)}`,
              highlight: m.model === report.best.model,
            }))}
            format={(v) => (primary === 'r2' ? fmt(v, 3) : pct(v))}
          />
          <p className="muted small">
            Winner: <b>{report.best.model}</b>{report.best.tuned ? ', then tuned' : ''}.
            {Object.keys(report.best.params || {}).length > 0 && (
              <> Settings: {Object.entries(report.best.params).map(([k, v]) => `${k}=${v}`).join(', ')}.</>
            )}
          </p>
        </section>
        <section>
          <h4>What drives the prediction</h4>
          <Bars
            rows={report.importance.slice(0, 8).map((f) => ({ label: f.feature, value: f.importance }))}
            max={Math.max(...report.importance.map((f) => f.importance), 0.0001)}
            format={(v) => fmt(v, 3)}
            tone="violet"
          />
          <p className="muted small">How much the score drops when that column is shuffled (permutation importance).</p>
        </section>
      </div>

      {(report.clusters || report.pca) && (
        <div className="ml-explore">
          {report.pca && (
            <span><Icon name="chart" size="1em" /> PCA: {report.pca.components_for_90pct} directions hold 90% of the variation in the inputs.</span>
          )}
          {report.clusters && (
            <span>
              <Icon name="contacts" size="1em" /> K-means found {report.clusters.k} natural groups (silhouette {fmt(report.clusters.silhouette, 2)}):{' '}
              {report.clusters.groups
                .map((g) => `${g.size.toLocaleString()} rows${g.target_mean != null ? ` averaging ${money ? usd(g.target_mean * unit) : fmt(g.target_mean)}` : g.top_class ? ` mostly ${g.top_class}` : ''}`)
                .join(' · ')}
            </span>
          )}
        </div>
      )}
      {report.dropped?.length > 0 && (
        <p className="muted small">Left out: {report.dropped.map((d) => `${d.name} (${d.reason})`).join(', ')}.</p>
      )}
    </div>
  );
}

function HouseProject() {
  const [state, setState] = useState(null);
  const [inputs, setInputs] = useState(PRESETS['San Francisco']);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const load = () => api.housePrice().then(setState).catch((e) => setError(e.message));
  useEffect(() => { load(); }, []);
  const job = useJob(state?.status === 'training' ? state.job.id : null, load);

  const predict = async (e) => {
    e.preventDefault();
    setError('');
    try {
      setResult(await api.housePredict(Object.fromEntries(Object.entries(inputs).map(([k, v]) => [k, Number(v)]))));
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <section className="card ml-project" style={{ '--hue': 205 }}>
      <div className="ml-project-head">
        <span className="badge-icon lg"><Icon name="house" /></span>
        <div className="grow">
          <h3>House price prediction</h3>
          <p className="muted">
            XGBoost, random forest and four more algorithms compete on 20,640 California neighborhoods (1990 census); the
            best one is tuned and tested on data it never saw.
          </p>
        </div>
      </div>
      {error && <p className="error">{error}</p>}
      {!state && !error && <p className="muted">Loading…</p>}
      {state?.status === 'training' && (
        <>
          <Progress job={job || state.job} label="Training the house price model (first time only, a few minutes)" />
          <p className="muted small">This happens once. You can use the rest of Jarvis meanwhile.</p>
        </>
      )}
      {state?.status === 'ready' && (
        <>
          <form className="ml-form" onSubmit={predict}>
            <div className="chips left">
              {Object.keys(PRESETS).map((p) => (
                <button key={p} type="button" className="chip" onClick={() => { setInputs(PRESETS[p]); setResult(null); }}>{p}</button>
              ))}
            </div>
            <div className="ml-fields">
              {Object.keys(HOUSE_LABELS).map((k) => (
                <label key={k} className="field" title={state.fields?.[k]?.description}>
                  {HOUSE_LABELS[k]}
                  <input type="number" step="any" value={inputs[k]} onChange={(e) => setInputs({ ...inputs, [k]: e.target.value })} required />
                </label>
              ))}
            </div>
            <button className="btn primary"><Icon name="zap" size="1em" /> Predict the price</button>
          </form>
          {result && (
            <div className="ml-result" role="status">
              <small>Estimated median home value</small>
              <strong>{usd(result.price_usd)}</strong>
              {result.likely_range_usd?.length === 2 && (
                <span>Likely between {usd(result.likely_range_usd[0])} and {usd(result.likely_range_usd[1])} (8 in 10 test homes fell inside such a range)</span>
              )}
              {result.notes?.map((n) => <p key={n} className="ml-note"><Icon name="alert" size="1em" /> {n}</p>)}
            </div>
          )}
          <Report report={state.card.report} unit={100000} unitLabel="Prices are in US dollars of 1990." />
        </>
      )}
    </section>
  );
}

function TrainOnYourData({ onTrained }) {
  const [dataset, setDataset] = useState(null); // { dataset_id, filename, profile }
  const [target, setTarget] = useState('');
  const [name, setName] = useState('');
  const [jobId, setJobId] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [report, setReport] = useState(null);
  const fileRef = useRef(null);
  const job = useJob(jobId, async (j) => {
    setJobId(null);
    if (j.status === 'failed') return setError(j.error || 'Training failed.');
    const card = await api.mlModel(j.result.model_id);
    setReport(card.report);
    toast('Model trained and saved');
    onTrained();
  });

  const upload = async (file) => {
    if (!file) return;
    setBusy(true);
    setError('');
    setReport(null);
    try {
      const d = await api.mlUpload(file);
      setDataset(d);
      setTarget(d.profile.suggested_target);
      setName('');
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };
  const chooseTarget = async (t) => {
    setTarget(t);
    try {
      setDataset({ ...dataset, profile: await api.mlProfile(dataset.dataset_id, t) });
    } catch {}
  };
  const train = async () => {
    setError('');
    setReport(null);
    try {
      setJobId((await api.mlTrain(dataset.dataset_id, target, name)).id);
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <section className="card ml-project" style={{ '--hue': 300 }}>
      <div className="ml-project-head">
        <span className="badge-icon lg"><Icon name="upload" /></span>
        <div className="grow">
          <h3>Train a model on your data</h3>
          <p className="muted">
            Upload a CSV (sales, customers, leads, prices…) and pick the column to predict. Jarvis explores the data, compares
            the algorithms, tunes the winner and tells you honestly how accurate it is.
          </p>
        </div>
        <button className="btn" onClick={() => fileRef.current?.click()} disabled={busy || Boolean(jobId)}>
          <Icon name="upload" size="1em" /> {busy ? 'Reading…' : dataset ? 'Another file' : 'Upload CSV'}
        </button>
        <input ref={fileRef} type="file" accept=".csv,.tsv,.txt" hidden onChange={(e) => { upload(e.target.files?.[0]); e.target.value = ''; }} />
      </div>
      {error && <p className="error">{error}</p>}
      {dataset && (
        <>
          <p className="muted small">
            <b>{dataset.filename}</b>: {dataset.profile.rows.toLocaleString()} rows, {dataset.profile.columns.length} columns.
          </p>
          <div className="ml-table-wrap">
            <table className="ml-table">
              <thead>
                <tr><th>Column</th><th>Type</th><th>Missing</th><th>Unique</th><th>Mean / top value</th><th>Link to {target}</th></tr>
              </thead>
              <tbody>
                {dataset.profile.columns.map((c) => (
                  <tr key={c.name} className={c.name === target ? 'target' : ''}>
                    <td>{c.name}</td>
                    <td><span className={`tag kind-${c.kind}`}>{c.kind}</span></td>
                    <td>{c.missing_pct}%</td>
                    <td>{c.unique.toLocaleString()}</td>
                    <td>{c.kind === 'numeric' ? fmt(c.mean) : c.top?.[0]?.[0] ?? '—'}</td>
                    <td>{c.corr_with_target != null ? fmt(c.corr_with_target, 2) : ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="ml-train-row">
            <label className="field">
              Column to predict
              <select value={target} onChange={(e) => chooseTarget(e.target.value)}>
                {dataset.profile.columns.filter((c) => c.kind === 'numeric' || c.kind === 'categorical').map((c) => (
                  <option key={c.name} value={c.name}>{c.name}</option>
                ))}
              </select>
            </label>
            <label className="field">
              Model name
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder={`Predict ${target}`} />
            </label>
            <button className="btn primary" onClick={train} disabled={Boolean(jobId)}>
              <Icon name="zap" size="1em" /> Train and compare
            </button>
          </div>
        </>
      )}
      {jobId && <Progress job={job} label="Starting…" />}
      {report && <Report report={report} />}
    </section>
  );
}

function PredictForm({ model }) {
  const [values, setValues] = useState({});
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const submit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const row = Object.fromEntries(Object.entries(values).filter(([, v]) => v !== ''));
      setResult((await api.mlPredict(model.id, [row])).predictions[0]);
    } catch (err) {
      setError(err.message);
    }
  };
  return (
    <form className="ml-form" onSubmit={submit}>
      <div className="ml-fields">
        {model.features.slice(0, 24).map((f) => (
          <label key={f} className="field">
            {f}
            <input value={values[f] ?? ''} onChange={(e) => setValues({ ...values, [f]: e.target.value })} placeholder="typical value" />
          </label>
        ))}
      </div>
      <button className="btn primary sm"><Icon name="zap" size="1em" /> Predict {model.target}</button>
      {error && <p className="error">{error}</p>}
      {result && (
        <div className="ml-result small" role="status">
          <small>Predicted {model.target}</small>
          <strong>{typeof result.prediction === 'number' ? fmt(result.prediction) : result.prediction}</strong>
          {result.likely_range && <span>Likely between {fmt(result.likely_range[0])} and {fmt(result.likely_range[1])}</span>}
          {result.confidence != null && <span>Model confidence {result.confidence >= 0.995 ? '>99%' : pct(result.confidence)}</span>}
          {result.notes?.map((n) => <p key={n} className="ml-note"><Icon name="alert" size="1em" /> {n}</p>)}
        </div>
      )}
    </form>
  );
}

function YourModels({ models, onChange }) {
  const [open, setOpen] = useState(null);
  const remove = async (m) => {
    if (!window.confirm(`Delete the model "${m.name}"?`)) return;
    await api.mlDelete(m.id);
    toast('Model deleted');
    onChange();
  };
  const own = models.filter((m) => !m.builtin);
  if (!own.length) {
    return <EmptyState icon="flask" title="No models of your own yet">Upload a CSV above and train one in a minute.</EmptyState>;
  }
  return (
    <ul className="ml-models">
      {own.map((m) => (
        <li key={m.id} className="card">
          <div className="row wrap">
            <span className="badge-icon" style={{ '--hue': m.task === 'regression' ? 190 : 265 }}><Icon name={m.task === 'regression' ? 'chart' : 'tasks'} /></span>
            <div className="grow">
              <strong>{m.name}</strong>
              <p className="muted small">{m.summary}</p>
            </div>
            <button className="btn sm" onClick={() => setOpen(open === m.id ? null : m.id)}>
              <Icon name="zap" size="1em" /> {open === m.id ? 'Close' : 'Predict'}
            </button>
            <button className="icon-btn" title="Delete" aria-label={`Delete ${m.name}`} onClick={() => remove(m)}><Icon name="trash" size="1em" /></button>
          </div>
          {open === m.id && <PredictForm model={m} />}
        </li>
      ))}
    </ul>
  );
}

function RunsLog({ runs }) {
  if (!runs.length) return null;
  return (
    <div className="ml-table-wrap">
      <table className="ml-table">
        <thead><tr><th>When</th><th>Model</th><th>Predicts</th><th>Winner</th><th>Test score</th><th>Rows</th><th>Time</th></tr></thead>
        <tbody>
          {runs.map((r) => (
            <tr key={r.model_id + r.at}>
              <td>{new Date(r.at).toLocaleString()}</td>
              <td>{r.name}</td>
              <td>{r.target}</td>
              <td>{r.best.model}{r.best.tuned ? ' (tuned)' : ''}</td>
              <td>{r.task === 'regression' ? `R² ${fmt(r.test.r2, 3)}` : `${pct(r.test.accuracy)} accurate`}</td>
              <td>{r.rows.toLocaleString()}</td>
              <td>{r.seconds}s</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function MlLabPanel() {
  const [models, setModels] = useState([]);
  const [runs, setRuns] = useState([]);
  const refresh = () => {
    api.mlModels().then(setModels).catch(() => {});
    api.mlRuns().then(setRuns).catch(() => {});
  };
  useEffect(() => { refresh(); }, []);

  return (
    <div className="panel ml-lab">
      <PageHeader icon="flask" hue={160} title="ML Lab" subtitle="Machine learning on real data. Every score is measured on rows the model never saw while training." />
      <div className="notice ml-honest">
        <span className="notice-icon"><Icon name="check" /></span>
        <div className="notice-body">
          <strong>Honest accuracy, not 100%</strong>
          <p>
            No model predicts real-world data perfectly. Jarvis holds back 20% of the rows, trains on the rest, and reports how
            well the model does on the held-back rows, next to a naive guess it has to beat. That is what to expect on new data.
          </p>
        </div>
      </div>
      <HouseProject />
      <TrainOnYourData onTrained={refresh} />
      <h3 className="section-title"><Icon name="flask" /> Your models</h3>
      <YourModels models={models} onChange={refresh} />
      {runs.length > 0 && <h3 className="section-title"><Icon name="timeline" /> Experiment log</h3>}
      <RunsLog runs={runs} />
    </div>
  );
}
