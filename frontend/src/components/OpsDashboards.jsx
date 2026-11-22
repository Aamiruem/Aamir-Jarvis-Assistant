import { useEffect, useMemo, useRef, useState } from 'react';
import { api } from '../api.js';
import { Icon } from '../icons.jsx';
import { WORLD } from '../data/worldDots.js';
import './OpsDashboards.css';

// The Cyber Ops dashboards (backend app/ops/live.py and app/ops/insights.py). Everything on them is
// measured or comes from scans that really ran: a sensor this PC doesn't expose says so, a check that
// never ran says "not run". Each view polls only while it is on screen and the page is visible.

const SEV = ['critical', 'high', 'medium', 'low'];

export const fmtBytes = (n, digits = 1) => {
  if (n == null) return '—';
  const u = ['B', 'KB', 'MB', 'GB', 'TB'];
  let i = 0;
  let v = n;
  while (v >= 1024 && i < u.length - 1) {
    v /= 1024;
    i += 1;
  }
  return `${v.toFixed(i === 0 ? 0 : digits)} ${u[i]}`;
};
export const fmtRate = (n) => (n == null ? '—' : `${fmtBytes(n)}/s`);
export const fmtUptime = (s) => {
  if (s == null) return '—';
  const d = Math.floor(s / 86400);
  const hms = new Date((s % 86400) * 1000).toISOString().slice(11, 19);
  return d ? `${d}d ${hms}` : hms;
};
const ago = (t) => {
  if (!t) return 'never';
  const s = Math.max(0, Date.now() / 1000 - t);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} h ago`;
  return `${Math.floor(s / 86400)} d ago`;
};
const tone = (v, warn = 70, bad = 90) => (v == null ? 'na' : v >= bad ? 'bad' : v >= warn ? 'warn' : 'ok');
const scoreTone = (v) => (v == null ? 'na' : v >= 85 ? 'ok' : v >= 60 ? 'warn' : 'bad');

/** Polls fn every ms while mounted and the tab is visible. */
function usePoll(fn, ms, deps = []) {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const saved = useRef(fn);
  saved.current = fn;
  useEffect(() => {
    let alive = true;
    const tick = () => {
      if (document.hidden) return;
      saved.current().then((d) => alive && (setData(d), setError(''))).catch((e) => alive && setError(e.message || 'Not reachable'));
    };
    tick();
    const id = setInterval(tick, ms);
    return () => {
      alive = false;
      clearInterval(id);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ms, ...deps]);
  return [data, error];
}

// ---------- shared visuals ----------

export function Gauge({ value, label, sub, size = 118, warn = 70, bad = 90, invert = false }) {
  const r = 46;
  const c = 2 * Math.PI * r;
  const arc = 0.75 * c;
  const v = value == null ? 0 : Math.max(0, Math.min(100, value));
  const t = invert ? scoreTone(value) : tone(value, warn, bad);
  return (
    <figure className={`od-gauge t-${t}`} style={{ width: size }}>
      <svg viewBox="0 0 120 120" role="img" aria-label={`${label}: ${value == null ? 'not available' : `${Math.round(v)}%`}`}>
        <circle cx="60" cy="60" r={r} className="track" strokeDasharray={`${arc} ${c}`} transform="rotate(135 60 60)" />
        <circle cx="60" cy="60" r={r} className="val" strokeDasharray={`${(arc * v) / 100} ${c}`} transform="rotate(135 60 60)" />
        <text x="60" y="64" className="num">{value == null ? '—' : Math.round(v)}</text>
        <text x="60" y="82" className="unit">{value == null ? 'n/a' : '%'}</text>
      </svg>
      <figcaption><b>{label}</b>{sub && <small>{sub}</small>}</figcaption>
    </figure>
  );
}

export function Spark({ data, max, className = '', label }) {
  const pts = (data || []).filter((v) => v != null);
  if (pts.length < 2) return <div className={`od-spark empty ${className}`}>collecting…</div>;
  const top = max ?? Math.max(1, ...pts);
  const W = 200;
  const H = 48;
  const xy = pts.map((v, i) => [(i / (pts.length - 1)) * W, H - 2 - (Math.min(v, top) / top) * (H - 4)]);
  const line = xy.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
  return (
    <svg className={`od-spark ${className}`} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" role="img" aria-label={label}>
      <polygon points={`0,${H} ${line} ${W},${H}`} className="area" />
      <polyline points={line} className="line" />
    </svg>
  );
}

function Panel({ title, icon, right, className = '', children }) {
  return (
    <section className={`od-panel ${className}`}>
      <header><h3>{icon && <Icon name={icon} size="1em" />} {title}</h3>{right}</header>
      {children}
    </section>
  );
}

// ---------- 1. the robot core (image 1) ----------

const MOODS = {
  idle: 'Standing by',
  scanning: 'Working',
  alert: 'Needs your attention',
  happy: 'All clear',
  safe: 'Safe mode: hands off',
  offline: 'Offline',
};

/** JARVIS: a robot on a holographic core. Its face follows what the system is really doing. */
export function RobotCore({ mood = 'idle', caption }) {
  return (
    <div className={`od-robot m-${mood}`} title={caption || MOODS[mood]}>
      <svg viewBox="0 0 120 120" role="img" aria-label={`JARVIS: ${caption || MOODS[mood]}`}>
        <defs>
          <radialGradient id="od-eye" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#fff" />
            <stop offset="35%" stopColor="var(--eye)" />
            <stop offset="100%" stopColor="var(--eye)" stopOpacity="0.15" />
          </radialGradient>
          <linearGradient id="od-metal" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#dbe7f5" />
            <stop offset="55%" stopColor="#8ea3bd" />
            <stop offset="100%" stopColor="#4a5d78" />
          </linearGradient>
        </defs>
        <g className="disc">
          <ellipse cx="60" cy="104" rx="46" ry="11" className="ring r1" />
          <ellipse cx="60" cy="104" rx="34" ry="8" className="ring r2" />
          <ellipse cx="60" cy="104" rx="20" ry="4.6" className="ring r3" />
        </g>
        <path d="M48 104 L56 62 L64 62 L72 104 Z" className="beam" />
        <g className="bot">
          <rect x="44" y="60" width="32" height="30" rx="11" fill="url(#od-metal)" />
          <circle cx="60" cy="74" r="6" className="heart" />
          <path d="M44 66 q-10 6 -8 20" className="arm left" />
          <path d="M76 66 q10 6 8 20" className="arm right" />
          <rect x="56" y="52" width="8" height="9" rx="2" fill="#5b6f8a" />
          <g className="head">
            <circle cx="60" cy="34" r="23" fill="url(#od-metal)" />
            <circle cx="60" cy="34" r="25.5" className="halo" />
            <path className="brow left" d="M43 22 L54 24" />
            <path className="brow right" d="M77 22 L66 24" />
            <g className="eyes">
              <circle cx="50" cy="33" r="7.5" className="socket" />
              <circle cx="70" cy="33" r="7.5" className="socket" />
              <circle cx="50" cy="33" r="5.2" className="eye" fill="url(#od-eye)" />
              <circle cx="70" cy="33" r="5.2" className="eye" fill="url(#od-eye)" />
              <path d="M45 34 q5 -6 10 0" className="happy" />
              <path d="M65 34 q5 -6 10 0" className="happy" />
            </g>
            <path d="M53 46 q7 3 14 0" className="mouth" />
          </g>
        </g>
      </svg>
      <span className="od-robot-cap">{caption || MOODS[mood]}</span>
    </div>
  );
}

// ---------- 2. live hardware monitor (image 3) ----------

function CoreRing({ perCore, value, mhz }) {
  const n = perCore?.length || 0;
  const R = 92;
  const gap = n > 1 ? 4 : 0;
  const seg = n ? 360 / n : 360;
  const arc = (a0, a1, r) => {
    const p = (a) => [100 + r * Math.cos(((a - 90) * Math.PI) / 180), 100 + r * Math.sin(((a - 90) * Math.PI) / 180)];
    const [x0, y0] = p(a0);
    const [x1, y1] = p(a1);
    return `M${x0.toFixed(2)} ${y0.toFixed(2)} A${r} ${r} 0 ${a1 - a0 > 180 ? 1 : 0} 1 ${x1.toFixed(2)} ${y1.toFixed(2)}`;
  };
  const r = 62;
  const c = 2 * Math.PI * r;
  return (
    <svg className="od-core" viewBox="0 0 200 200" role="img" aria-label={`CPU ${value}% across ${n} threads`}>
      <circle cx="100" cy="100" r="98" className="deco d1" />
      <circle cx="100" cy="100" r="78" className="deco d2" />
      {(perCore || []).map((v, i) => {
        const a0 = i * seg + gap / 2;
        const a1 = (i + 1) * seg - gap / 2;
        return (
          <g key={i}>
            <path d={arc(a0, a1, R)} className="seg-track" />
            <path d={arc(a0, a0 + ((a1 - a0) * Math.max(2, v)) / 100, R)} className={`seg t-${tone(v)}`} />
          </g>
        );
      })}
      <circle cx="100" cy="100" r={r} className="ring-track" />
      <circle cx="100" cy="100" r={r} className={`ring-val t-${tone(value)}`} strokeDasharray={`${(c * value) / 100} ${c}`} transform="rotate(-90 100 100)" />
      <text x="100" y="102" className="big">{Math.round(value)}</text>
      <text x="100" y="122" className="lbl">% CPU</text>
      {mhz && <text x="100" y="140" className="mhz">{mhz} MHz</text>}
    </svg>
  );
}

function Clock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return (
    <div className="od-clock">
      <b>{now.toLocaleTimeString([], { hour12: false })}</b>
      <small>{now.toLocaleDateString([], { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })}</small>
    </div>
  );
}

export function LiveMonitor() {
  const [d, error] = usePoll(() => api.opsLive(), 2000);
  if (!d) {
    return error ? <p className="od-error"><Icon name="alert" size="1em" /> {error}</p> : <div className="od-loading"><span className="od-spin" /> Reading sensors…</div>;
  }
  const h = d.history || [];
  const st = d.static;
  const gpu = d.gpu;
  const netMax = Math.max(1, ...h.flatMap((x) => [x.up || 0, x.down || 0]));
  return (
    <div className="od-live">
      <div className="od-live-top">
        <div className="od-host">
          <Icon name="monitor" size="1.4em" />
          <div><b>{st.host}</b><small>{st.os}</small></div>
        </div>
        <div className="od-stat"><small>Uptime</small><b>{fmtUptime(d.uptime)}</b></div>
        <div className="od-stat"><small>Processes</small><b>{d.processes?.count ?? '—'}</b></div>
        {d.battery && <div className="od-stat"><small>Battery {d.battery.plugged ? '· charging' : ''}</small><b className={`t-${d.battery.percent <= 20 && !d.battery.plugged ? 'bad' : 'ok'}`}>{d.battery.percent}%</b></div>}
        <Clock />
      </div>
      {error && <p className="od-error small"><Icon name="alert" size="1em" /> {error} (showing the last reading)</p>}

      <div className="od-live-grid">
        <Panel title="Processor" icon="cpu" className="od-cpu">
          <p className="od-name">{st.cpu_name}</p>
          <p className="muted">{st.cores} cores · {st.threads} threads · base {st.base_mhz ?? '?'} MHz</p>
          <ul className="od-cores">
            {d.cpu.per_core.map((v, i) => (
              <li key={i}><span>T{i}</span><i><em className={`t-${tone(v)}`} style={{ width: `${v}%` }} /></i><b>{Math.round(v)}%</b></li>
            ))}
          </ul>
          <Spark data={h.map((x) => x.cpu)} max={100} label="CPU over the last minutes" />
        </Panel>

        <div className="od-center">
          <CoreRing perCore={d.cpu.per_core} value={d.cpu.percent} mhz={d.cpu.mhz} />
          <div className="od-temps">
            <Icon name="zap" size="1em" />
            {d.temps.cpu != null ? <span>CPU <b className={`t-${tone(d.temps.cpu, 75, 90)}`}>{d.temps.cpu} °C</b> <small>({d.temps.source})</small></span>
              : <span className="muted" title={d.temps.reason || ''}>Temperature: not exposed by this PC</span>}
          </div>
        </div>

        <Panel title="Graphics" icon="monitor" className="od-gpu">
          <p className="od-name">{gpu.name || 'GPU not identified'}</p>
          <div className="od-row">
            <Gauge value={gpu.util} label="GPU load" sub="busiest engine" size={104} />
            <dl className="od-kv">
              {gpu.vram_total ? <div><dt>Adapter memory</dt><dd>{fmtBytes(gpu.vram_total, 0)}</dd></div> : null}
              {gpu.dedicated != null && <div><dt>Dedicated in use</dt><dd>{fmtBytes(gpu.dedicated)}</dd></div>}
              {gpu.shared != null && <div><dt>Shared in use</dt><dd>{fmtBytes(gpu.shared)}</dd></div>}
            </dl>
          </div>
          {gpu.util == null && <p className="muted small">GPU counters: {d.sensors}</p>}
          {Object.keys(gpu.engines || {}).length > 0 && (
            <ul className="od-engines">
              {Object.entries(gpu.engines).sort((x, y) => y[1] - x[1]).slice(0, 4).map(([k, v]) => (
                <li key={k}><span>{k}</span><i><em style={{ width: `${v}%` }} /></i><b>{v}%</b></li>
              ))}
            </ul>
          )}
          <Spark data={h.map((x) => x.gpu)} max={100} className="violet" label="GPU over the last minutes" />
        </Panel>

        <Panel title="Memory" icon="database" className="od-ram">
          <div className="od-row">
            <Gauge value={d.ram.percent} label="RAM" sub={`${fmtBytes(d.ram.used)} of ${fmtBytes(d.ram.total)}`} size={104} warn={80} />
            <dl className="od-kv">
              <div><dt>Used</dt><dd>{fmtBytes(d.ram.used)}</dd></div>
              <div><dt>Available</dt><dd>{fmtBytes(d.ram.available)}</dd></div>
              <div><dt>Page file</dt><dd>{fmtBytes(d.ram.swap_used)} / {fmtBytes(d.ram.swap_total)}</dd></div>
            </dl>
          </div>
          <Spark data={h.map((x) => x.ram)} max={100} className="pink" label="Memory over the last minutes" />
        </Panel>

        <Panel title="Storage" icon="database" className="od-disks">
          <div className="od-row wrap">
            {d.disks.map((k) => <Gauge key={k.mount} value={k.percent} label={k.mount} sub={`${fmtBytes(k.free)} free`} size={92} warn={80} />)}
          </div>
          {d.disk_io && <p className="od-io"><span>Read <b>{fmtRate(d.disk_io.read)}</b></span><span>Write <b>{fmtRate(d.disk_io.write)}</b></span></p>}
        </Panel>

        <Panel title="Network" icon="wifi" className="od-net">
          <div className="od-net-rates">
            <div><small>UL</small><b className="up">{fmtRate(d.net.up)}</b></div>
            <div><small>DL</small><b className="down">{fmtRate(d.net.down)}</b></div>
          </div>
          <div className="od-dual">
            <Spark data={h.map((x) => x.down)} max={netMax} label="Download rate" />
            <Spark data={h.map((x) => x.up)} max={netMax} className="pink" label="Upload rate" />
          </div>
          <p className="muted small">Since boot: {fmtBytes(d.net.sent)} sent · {fmtBytes(d.net.recv)} received</p>
        </Panel>

        <Panel title="Top processes" icon="pulse" className="od-procs">
          <div className="od-table-wrap">
            <table className="od-table">
              <thead><tr><th>Program</th><th>CPU</th><th>Memory</th></tr></thead>
              <tbody>
                {(d.processes?.cpu || []).map((p) => <tr key={p.pid}><td>{p.name}</td><td>{p.cpu}%</td><td>{fmtBytes(p.mem)}</td></tr>)}
              </tbody>
            </table>
          </div>
          <p className="muted small">Most memory: {(d.processes?.mem || []).slice(0, 3).map((p) => `${p.name} ${fmtBytes(p.mem, 0)}`).join(' · ')}</p>
        </Panel>
      </div>
      <p className="od-source">Sources: psutil · {d.sensors}. Polled every 2 s while this view is open.</p>
    </div>
  );
}

// ---------- 3. security overview (image 2) ----------

function Topology({ assets, onOpen }) {
  const nodes = assets.nodes || [];
  const hub = nodes.find((n) => n.is_gateway) || nodes.find((n) => n.is_self) || nodes[0];
  const rest = nodes.filter((n) => n !== hub);
  const W = 560;
  const H = 340;
  const cx = W / 2;
  const cy = H / 2;
  const pos = rest.map((n, i) => {
    const a = (i / Math.max(1, rest.length)) * 2 * Math.PI - Math.PI / 2;
    const rx = rest.length > 12 && i % 2 ? 180 : 230;
    const ry = rest.length > 12 && i % 2 ? 100 : 135;
    return [cx + rx * Math.cos(a), cy + ry * Math.sin(a)];
  });
  const cls = (n) => (n.risk ? `risk-${n.risk}` : n.is_self ? 'self' : 'ok');
  return (
    <div className="od-topo-wrap">
      <svg className="od-topo" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Network map of ${nodes.length} devices, ${assets.at_risk} at risk`}>
        {pos.map(([x, y], i) => <line key={i} x1={cx} y1={cy} x2={x} y2={y} className={`link ${cls(rest[i])}`} />)}
        {hub && (
          <g className={`node hub ${cls(hub)}`}>
            <circle cx={cx} cy={cy} r="20" />
            <text x={cx} y={cy + 36}>{(hub.name || hub.ip || '').slice(0, 18)}</text>
          </g>
        )}
        {rest.map((n, i) => (
          <g key={n.ip || i} className={`node ${cls(n)}`}>
            <title>{`${n.name} · ${n.ip} · ${n.category}${n.risk ? ` · ${n.risk} risk` : ''}`}</title>
            <circle cx={pos[i][0]} cy={pos[i][1]} r="11" />
            <text x={pos[i][0]} y={pos[i][1] + 24}>{(n.name || n.ip || '').slice(0, 14)}</text>
          </g>
        ))}
      </svg>
      <p className="muted small">From “{assets.source}” {ago(assets.at)} · <button type="button" className="od-link" onClick={() => onOpen(assets.job_id)}>open scan</button></p>
    </div>
  );
}

function Ring({ value, label, sub }) {
  const r = 26;
  const c = 2 * Math.PI * r;
  return (
    <div className={`od-ring t-${scoreTone(value)}`}>
      <svg viewBox="0 0 64 64" role="img" aria-label={`${label}: ${value}% healthy`}>
        <circle cx="32" cy="32" r={r} className="track" />
        <circle cx="32" cy="32" r={r} className="val" strokeDasharray={`${(c * value) / 100} ${c}`} transform="rotate(-90 32 32)" />
        <text x="32" y="36">{value}%</text>
      </svg>
      <div><b>{label}</b><small>{sub}</small></div>
    </div>
  );
}

export function SecurityOverview({ onOpenJob, onRun, jobsKey }) {
  const [o, error] = usePoll(() => api.opsOverview(), 15000, [jobsKey]);
  if (!o) return error ? <p className="od-error"><Icon name="alert" size="1em" /> {error}</p> : <div className="od-loading"><span className="od-spin" /> Reading your scans…</div>;
  const dayMax = Math.max(1, ...o.per_day.map((d) => SEV.reduce((s, k) => s + d[k], 0)));
  return (
    <div className="od-sec">
      <Panel title="Live network topology" icon="network" className="od-topo-panel"
        right={o.assets && <span className={`od-chip t-${o.assets.at_risk ? 'bad' : 'ok'}`}>{o.assets.total} devices · {o.assets.at_risk} at risk</span>}>
        {o.assets ? <Topology assets={o.assets} onOpen={onOpenJob} /> : (
          <div className="od-empty"><Icon name="radar" size="2em" /><p>No device scan yet. Scan your own network to map it.</p>
            <button type="button" className="ops-btn primary" onClick={() => onRun('network')}>[ Scan authorized network ]</button></div>
        )}
      </Panel>

      <Panel title="Critical incidents" icon="siren" className="od-incidents" right={<span className="od-chip">{o.alerts_total} open</span>}>
        {o.incidents.length === 0 ? <p className="muted">No open problems in your latest scans.</p> : (
          <ul>
            {o.incidents.map((a, i) => (
              <li key={i}>
                <button type="button" onClick={() => onOpenJob(a.job_id)} title={a.detail || a.title}>
                  <i className={`sev s-${a.severity}`}>{a.severity}</i>
                  <span><b>{a.title}</b><small>{a.check} · {ago(a.at)}</small></span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <Panel title="Security posture" icon="shield" className="od-posture">
        {o.posture ? (
          <>
            <p className="od-posture-num">Overall: <b className={`t-${scoreTone(o.posture.score)}`}>{o.posture.score}% secure</b></p>
            <p className="muted small">{o.posture.basis}</p>
            <Spark data={o.trend.map((p) => p.score)} max={100} label="Score trend" />
          </>
        ) : (
          <div className="od-empty sm"><p>No posture yet: it needs “Check system security” or a full report.</p>
            <button type="button" className="ops-btn primary" onClick={() => onRun('report')}>[ Generate security report ]</button></div>
        )}
      </Panel>

      <Panel title="Alert overview" icon="alert" className="od-alerts">
        <div className="od-counts">
          {SEV.map((s) => <div key={s} className={`s-${s}`}><b>{o.counts[s]}</b><small>{s}</small></div>)}
        </div>
        <div className="od-bars" role="img" aria-label="Problems found per day, last 7 days">
          {o.per_day.map((d) => {
            const total = SEV.reduce((s, k) => s + d[k], 0);
            return (
              <div key={d.day} className="col" title={`${d.day}: ${total} problems found`}>
                <b>{total || ''}</b>
                <div className="stack" style={{ height: `${(total / dayMax) * 100}%` }}>
                  {SEV.map((s) => d[s] > 0 && <i key={s} className={`s-${s}`} style={{ flexGrow: d[s] }} />)}
                </div>
                <small>{new Date(`${d.day}T12:00`).toLocaleDateString([], { weekday: 'short' })}</small>
              </div>
            );
          })}
        </div>
        <p className="muted small">Open = problems in the newest run of each check. Bars = problems found per day.</p>
      </Panel>

      <Panel title="Threat intelligence" icon="target" className="od-threats">
        <ul>
          {o.threats.map((t) => (
            <li key={t.id} className={t.checked ? '' : 'unchecked'}>
              <span className="lbl">{t.label}</span>
              <span className={`dots ${t.worst ? `s-${t.worst}` : 'clean'}`}>{[0, 1, 2].map((i) => <i key={i} className={i < Math.min(3, t.open) ? 'on' : ''} />)}</span>
              <span className="val">{t.checked ? (t.open ? `${t.open} open` : 'clear') : 'not checked'}</span>
            </li>
          ))}
        </ul>
      </Panel>

      <Panel title="Asset health" icon="pulse" className="od-assets">
        {o.assets ? (
          <div className="od-rings">
            <Ring value={o.assets.health} label="All devices" sub={`${o.assets.total - o.assets.at_risk}/${o.assets.total} without risky ports`} />
            {o.assets.groups.slice(0, 4).map((g) => <Ring key={g.category} value={g.health} label={g.category} sub={`${g.total} device${g.total > 1 ? 's' : ''}${g.at_risk ? `, ${g.at_risk} at risk` : ''}`} />)}
          </div>
        ) : <p className="muted">Shows after a device scan.</p>}
      </Panel>

      <Panel title="Check coverage" icon="check" className="od-coverage">
        <ul>
          {o.coverage.map((c) => (
            <li key={c.action} className={`c-${c.state}`}>
              <i className="led" />
              <span><b>{c.label}</b><small>{c.state === 'never' ? 'not run yet' : `${ago(c.last)}${c.score != null ? ` · ${c.score}/100` : ''}${c.state === 'stale' ? ' · stale' : ''}`}</small></span>
              <button type="button" className="ops-btn sm" onClick={() => onRun(c.action)}>{c.state === 'never' ? 'Run' : 'Re-run'}</button>
            </li>
          ))}
        </ul>
      </Panel>
    </div>
  );
}

// ---------- 4. global network map (image 6) ----------

const CELL = 5;
const MAP_W = WORLD.cols * CELL;
const MAP_H = WORLD.rows.length * CELL;
export const project = (lat, lon) => [((lon - WORLD.lonLeft) / 360) * MAP_W, ((WORLD.latTop - lat) / WORLD.step) * CELL];

/** All land dots as one path (thousands of circles would be thousands of DOM nodes). */
const LAND_PATH = WORLD.rows
  .map((hex, r) => {
    const bits = [...hex].map((h) => parseInt(h, 16).toString(2).padStart(4, '0')).join('');
    let d = '';
    for (let c = 0; c < WORLD.cols; c += 1) if (bits[c] === '1') d += `M${c * CELL + CELL / 2} ${r * CELL + CELL / 2}h0`;
    return d;
  })
  .join('');

const feedLine = (feeds) => {
  if (!feeds) return 'blocklists unavailable';
  const ts = Object.values(feeds).map((f) => f.updated).filter(Boolean);
  const n = Object.values(feeds).reduce((t, f) => t + (f.entries || 0), 0);
  return ts.length ? `${n.toLocaleString()} blocklist entries, updated ${ago(Math.min(...ts))}` : 'blocklists not downloaded yet';
};
const place = (cc) => (cc === 'pending' ? 'looking up…' : cc || '—');

export function GlobalMap() {
  const [g, error] = usePoll(() => api.opsGeo(), 20000);
  const [sel, setSel] = useState(null);
  if (!g) return error ? <p className="od-error"><Icon name="alert" size="1em" /> {error}</p> : <div className="od-loading"><span className="od-spin" /> Tracing this PC's connections…</div>;
  const home = g.home.lat != null ? project(g.home.lat, g.home.lon) : null;
  const located = g.hosts.filter((h) => h.lat != null);
  const maxCount = Math.max(1, ...located.map((h) => h.count));
  const picked = located.find((h) => h.ip === sel);
  return (
    <div className="od-geo">
      <div className="od-mission-stats">
        <div className="od-big"><small>Remote hosts</small><b>{g.hosts.length}</b><span>{g.located} on the map · {g.local_peers} on your local network</span></div>
        <div className="od-big"><small>Countries</small><b>{g.countries.filter((c) => c.country.length === 2).length}</b><span>{g.countries.filter((c) => c.country.length === 2).map((c) => c.country).join(' · ') || '—'}</span></div>
        <div className={`od-big ${g.malicious ? 'crit' : g.flagged ? 'attn' : ''}`}><small>Threat matches</small><b className={g.malicious ? 't-bad' : g.flagged ? 't-warn' : 't-ok'}>{g.malicious || 0}</b>
          <span>{g.malicious ? `on threat blocklists${g.flagged > g.malicious ? ` · ${g.flagged - g.malicious} other flags` : ''}` : g.flagged ? `${g.flagged} suspicious port/program` : 'none on blocklists'} · {feedLine(g.feeds)}</span></div>
        <div className="od-big"><small>You are here</small><b className="od-home-txt">{g.home.city || '—'}</b><span>{g.home.country} · {g.home.owner || 'public IP unknown'}</span></div>
      </div>

      <Panel title="Global network map" icon="globe" right={<span className="od-chip">live · refreshes every 20 s</span>} className="od-geo-panel">
        <div className="od-map-wrap">
          <svg className="od-map" viewBox={`0 0 ${MAP_W} ${MAP_H}`} role="img" aria-label={`World map: this PC talks to ${located.length} located hosts`}>
            <path d={LAND_PATH} className="land" />
            {home && located.map((h) => {
              const [x, y] = project(h.lat, h.lon);
              const mx = (home[0] + x) / 2;
              const my = Math.min(home[1], y) - Math.max(18, Math.abs(x - home[0]) * 0.22);
              return <path key={`a${h.ip}`} d={`M${home[0]} ${home[1]} Q${mx} ${my} ${x} ${y}`} className={`arc ${h.malicious ? 'mal' : h.flagged ? 'bad' : ''} ${sel === h.ip ? 'sel' : ''}`} />;
            })}
            {located.map((h) => {
              const [x, y] = project(h.lat, h.lon);
              return (
                <g key={h.ip} className={`host ${h.malicious ? 'mal' : h.flagged ? 'bad' : ''} ${sel === h.ip ? 'sel' : ''}`} onClick={() => setSel(sel === h.ip ? null : h.ip)}>
                  <title>{`${h.ip} · ${h.owner || 'unknown owner'} · ${[h.city, h.country].filter(Boolean).join(', ')} · ${h.programs.join(', ')}`}</title>
                  <circle cx={x} cy={y} r={3 + (5 * h.count) / maxCount} />
                </g>
              );
            })}
            {home && <g className="home"><circle cx={home[0]} cy={home[1]} r="13" className="ping" /><circle cx={home[0]} cy={home[1]} r="5.5" /></g>}
          </svg>
        </div>
        {picked ? (
          <p className="od-pick"><b>{picked.ip}</b> · {picked.owner || 'unknown owner'} · {[picked.city, picked.country].filter(Boolean).join(', ')} · {picked.programs.join(', ')} · ports {picked.ports.join(', ')}
            {picked.flagged && <span className="t-bad"> · {picked.reasons.join('; ')}</span>}</p>
        ) : <p className="muted small">Click a node for details. {g.source}.</p>}
      </Panel>

      <div className="od-geo-grid">
        <Panel title="By country" icon="globe">
          <ul className="od-meter">
            {g.countries.map((c) => (
              <li key={c.country}><span>{place(c.country)}</span><i><em className={c.flagged ? 'bad' : ''} style={{ width: `${(100 * c.connections) / Math.max(1, ...g.countries.map((x) => x.connections))}%` }} /></i><b>{c.hosts}</b></li>
            ))}
          </ul>
        </Panel>
        <Panel title="Network owners" icon="briefcase">
          <ul className="od-meter">
            {g.owners.map((o) => (
              <li key={o.owner}><span title={o.owner}>{o.owner}</span><i><em style={{ width: `${(100 * o.connections) / Math.max(1, g.owners[0].connections)}%` }} /></i><b>{o.connections}</b></li>
            ))}
          </ul>
        </Panel>
        <Panel title="Recent DNS lookups" icon="search" right={<small className="muted">Windows DNS cache</small>} className="od-dns">
          {(g.dns || []).length === 0 ? <p className="muted small">{g.dns_note || 'No cached lookups.'}</p> : (
            <ul>
              {g.dns.slice(0, 18).map((d) => <li key={d.name} title={d.answers.join(', ')}><span>{d.name}</span><small>{d.answers[0] || ''}</small></li>)}
            </ul>
          )}
        </Panel>
        <Panel title="Connections" icon="network" className="od-geo-hosts">
          <div className="od-table-wrap">
            <table className="od-table">
              <thead><tr><th>Program</th><th>Owner</th><th>Where</th><th>Conns</th></tr></thead>
              <tbody>
                {g.hosts.slice(0, 14).map((h) => (
                  <tr key={h.ip} className={h.flagged ? 'bad' : ''} onClick={() => setSel(h.ip)}>
                    <td title={h.ip}>{h.programs.join(', ')}</td><td>{(h.owner || '—').replace(/^AS\d+\s*/, '')}</td><td>{h.city ? `${h.city}, ${h.country}` : place(h.country)}</td><td>{h.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      </div>
    </div>
  );
}

// ---------- 5. the AI brain (image 5) ----------

/** Deterministic pseudo-random numbers, so the brain has the same shape on every render. */
function mulberry32(seed) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const BRAIN_W = 560;
const BRAIN_H = 330;
const BCX = 280;
const BCY = 150;

/** Neuron nodes inside two hemispheres; each belongs to one of n regions (angle sectors). */
export function brainNetwork(regions, count = 130) {
  const rnd = mulberry32(42);
  const inside = (x, y) => {
    const l = ((x - 205) / 150) ** 2 + ((y - BCY) / 118) ** 2 <= 1;
    const r = ((x - 355) / 150) ** 2 + ((y - BCY) / 118) ** 2 <= 1;
    return (l || r) && Math.abs(x - BCX) > 4;
  };
  const nodes = [];
  while (nodes.length < count) {
    const x = 50 + rnd() * 460;
    const y = 30 + rnd() * 240;
    if (!inside(x, y)) continue;
    const ang = (Math.atan2(y - BCY, x - BCX) + Math.PI * 2.5) % (Math.PI * 2);
    nodes.push({ x, y, r: 1.4 + rnd() * 2.2, region: Math.floor((ang / (Math.PI * 2)) * regions) % regions });
  }
  const edges = [];
  nodes.forEach((a, i) => {
    nodes
      .map((b, j) => [j, (a.x - b.x) ** 2 + (a.y - b.y) ** 2])
      .filter(([j]) => j > i)
      .sort((p, q) => p[1] - q[1])
      .slice(0, 2)
      .forEach(([j, d]) => d < 70 ** 2 && edges.push([i, j]));
  });
  return { nodes, edges };
}

export function AgentBrain({ agents }) {
  const n = agents.length || 1;
  const net = useMemo(() => brainNetwork(n), [n]);
  const stateOf = (region) => agents[region]?.state || 'ready';
  const working = agents.filter((a) => a.state === 'working');
  const waiting = agents.filter((a) => a.state === 'waiting');
  const hemi = 'M280 34 C232 14 150 18 108 58 C64 70 40 112 50 150 C34 186 52 232 96 246 C116 282 176 296 222 282 C246 292 268 288 280 276';
  return (
    <figure className="od-brain">
      <svg viewBox={`0 0 ${BRAIN_W} ${BRAIN_H}`} role="img"
        aria-label={`AI brain: ${working.length} agents working, ${waiting.length} awaiting approval, ${n - working.length - waiting.length} ready`}>
        <defs>
          <radialGradient id="od-brain-core" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
            <stop offset="30%" stopColor="#67e8f9" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="od-brain-beam" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#67e8f9" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#67e8f9" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d="M262 268 L298 268 L340 330 L220 330 Z" fill="url(#od-brain-beam)" className="beam" />
        <ellipse cx={BCX} cy="318" rx="120" ry="9" className="pad" />
        <g className="shell">
          <path d={hemi} />
          <path d={hemi} transform={`translate(${BCX * 2} 0) scale(-1 1)`} />
          <path d="M280 40 C270 90 292 140 278 190 C270 230 286 262 280 276" className="fissure" />
          {[['M120 90 C160 70 210 84 240 70'], ['M80 150 C120 130 170 150 220 130'], ['M110 214 C150 196 200 214 240 196'], ['M150 120 C180 110 200 124 230 112']].map(([d], i) => (
            <g key={i}><path d={d} className="gyrus" /><path d={d} className="gyrus" transform={`translate(${BCX * 2} 0) scale(-1 1)`} /></g>
          ))}
        </g>
        <g className="synapses">
          {net.edges.map(([i, j], k) => {
            const a = net.nodes[i];
            const b = net.nodes[j];
            const st = a.region === b.region ? stateOf(a.region) : 'ready';
            return <line key={k} x1={a.x} y1={a.y} x2={b.x} y2={b.y} className={`syn st-${st}`} style={{ animationDelay: `${(k % 9) * 0.17}s` }} />;
          })}
        </g>
        <g className="neurons">
          {net.nodes.map((p, k) => (
            <circle key={k} cx={p.x} cy={p.y} r={p.r} className={`neu st-${stateOf(p.region)}`} style={{ animationDelay: `${(k % 7) * 0.23}s` }}>
              <title>{agents[p.region]?.name}</title>
            </circle>
          ))}
        </g>
        <circle cx={BCX} cy={BCY} r="46" fill="url(#od-brain-core)" className={`core ${working.length ? 'hot' : ''}`} />
      </svg>
      <figcaption>
        {working.length ? <span className="t-ok">Thinking: {working.map((a) => a.name.replace(' Agent', '')).join(', ')}</span> : <span>All {n} specialists ready</span>}
        {waiting.length > 0 && <span className="t-warn"> · waiting for your approval: {waiting.map((a) => a.name.replace(' Agent', '')).join(', ')}</span>}
      </figcaption>
    </figure>
  );
}

// ---------- 6. mission control (image 4) ----------

const STATE_LABEL = { working: 'Working', waiting: 'Awaiting approval', ready: 'Ready' };

export function MissionControl({ onCritical, jobsKey }) {
  const [m, error] = usePoll(() => api.opsMission(), 4000, [jobsKey]);
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  if (!m) return error ? <p className="od-error"><Icon name="alert" size="1em" /> {error}</p> : <div className="od-loading"><span className="od-spin" /> Contacting the agent team…</div>;
  const t = m.totals;
  const a = m.approvals;
  const dayMax = Math.max(1, ...m.per_day.map((d) => d.done));
  return (
    <div className="od-mission">
      <div className="od-mission-head">
        <small>{now.toLocaleString([], { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' })}</small>
        <h2>Agentic AI command</h2>
      </div>

      <AgentBrain agents={m.agents} />

      <ol className="od-pipeline" aria-label="Specialist agents">
        {m.agents.map((g) => (
          <li key={g.id} className={`st-${g.state}`}>
            <span className="od-agent-icon"><Icon name={g.icon} size="1.5em" /></span>
            <b>{g.name.replace(' Agent', '')}</b>
            <small className="state">{STATE_LABEL[g.state]}{g.running ? ` · ${g.running}` : ''}{g.waiting ? ` · ${g.waiting}` : ''}</small>
            <small>{g.done} done{g.failed ? ` · ${g.failed} failed` : ''}</small>
            {g.last && <small className="last" title={g.last.title}>{g.last.title}</small>}
          </li>
        ))}
      </ol>

      <div className="od-mission-stats">
        <div className="od-big"><small>Tasks completed</small><b>{t.completed.toLocaleString()}</b><span>{t.failed} failed · {t.running} running</span></div>
        <div className="od-big"><small>Success rate</small><b className={`t-${scoreTone(t.success_rate)}`}>{t.success_rate == null ? '—' : `${t.success_rate}%`}</b><span>of finished tasks</span></div>
        <div className="od-big"><small>Human-in-the-loop approvals</small><b>{a.decided}</b>
          <span>{a.human_rate == null ? 'no actions yet' : `${a.human_rate}% of ${t.actions} actions`} · {a.authorized_scans} authorized scans · {a.approved_fixes} fixes · {a.approved} approved · {a.rejected} rejected</span></div>
        <div className={`od-big ${a.pending ? 'attn' : ''}`}><small>Waiting for you</small><b>{a.pending}</b><span>{a.pending ? 'approvals pending in the agent team' : 'nothing pending'}</span></div>
      </div>

      <div className="od-mission-grid">
        <Panel title="Productivity" icon="chart" right={<small className="muted">tasks done per day</small>}>
          <div className="od-bars single" role="img" aria-label="Tasks completed per day, last 7 days">
            {m.per_day.map((d) => (
              <div key={d.day} className="col" title={`${d.day}: ${d.done} done`}>
                <b>{d.done || ''}</b>
                <div className="stack" style={{ height: `${(d.done / dayMax) * 100}%` }}><i /></div>
                <small>{new Date(`${d.day}T12:00`).toLocaleDateString([], { weekday: 'short' })}</small>
              </div>
            ))}
          </div>
        </Panel>
        <Panel title="Mission control" icon="rocket" right={<button type="button" className="ops-btn primary sm" onClick={onCritical}>New critical task</button>}>
          {m.recent_runs.length === 0 ? <p className="muted">No agent-team runs since the AI service started. Give the team a critical task.</p> : (
            <ul className="od-runs">
              {m.recent_runs.map((r) => (
                <li key={r.id}><span className={`ops-badge b-${r.status}`}>{r.status.replace('_', ' ')}</span><b>{r.instruction}</b>
                  <small>{r.subtasks} subtasks{r.pending ? ` · ${r.pending} awaiting approval` : ''} · {ago(r.created_at)}</small></li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
      <p className="od-source">{m.note}</p>
    </div>
  );
}
