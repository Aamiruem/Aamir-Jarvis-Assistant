import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { api } from '../api.js';
import { Icon } from '../icons.jsx';
import { toast } from '../ui.jsx';
import { useListen } from '../useListen.js';
import { GlobalMap, LiveMonitor, MissionControl, RobotCore, SecurityOverview } from './OpsDashboards.jsx';
import './OpsCenter.css';

const VIEWS = [
  ['ops', 'Operations', 'zap'],
  ['live', 'Live monitor', 'pulse'],
  ['overview', 'Security overview', 'shield'],
  ['geo', 'Global map', 'globe'],
  ['mission', 'Mission control', 'rocket'],
];
const VIEW_KEY = 'ops.view';
const savedView = () => {
  try {
    const v = localStorage.getItem(VIEW_KEY);
    return VIEWS.some(([id]) => id === v) ? v : 'ops';
  } catch {
    return 'ops';
  }
};

/** The robot's face: what Jarvis is really doing right now. */
export function robotMood({ offline, safe, running, latest }) {
  if (offline) return ['offline', 'Offline'];
  if (safe) return ['safe', 'Safe mode: hands off'];
  if (running.length) return ['scanning', `${running[0].steps?.at(-1)?.label || running[0].title}…`];
  if (!latest) return ['idle', 'Standing by'];
  if (latest.status === 'failed') return ['alert', `${latest.title} failed`];
  if (latest.score != null && latest.score < 60) return ['alert', `${latest.title}: ${latest.score}/100`];
  if (latest.score != null && latest.score >= 85) return ['happy', `${latest.title}: ${latest.score}/100`];
  return ['idle', `Last: ${latest.title}`];
}

// Cyber Ops: the ethical-hacker / device-intelligence command center. Every button starts a real,
// read-only job on the AI service that runs on this PC (backend app/ops): live steps, cancel,
// results and history. Network scans ask first that you own the network. Critical tasks go to the
// multi-agent orchestrator (plan, approvals, verification, report).

const ACTIVE = new Set(['queued', 'running']);
const RUN_ACTIVE = new Set(['planning', 'running', 'paused', 'verifying', 'needs_approval']);
const SEV_LABEL = { critical: 'Critical', high: 'High', medium: 'Medium', low: 'Low', info: 'Info', ok: 'Passed' };
const CAT_ICON = {
  'This PC': 'cpu', 'Router / gateway': 'wifi', Computer: 'monitor', 'Phone or tablet': 'phone', Printer: 'file',
  'Smart TV / media': 'play', Camera: 'camera', 'IoT / smart device': 'zap', 'Network equipment': 'network',
  'NAS storage': 'database', Audio: 'volume', Wearable: 'clock', 'Input device': 'keyboard', Phone: 'phone',
  'TV / media': 'play', 'Tracker / key fob': 'target', 'Smart home / appliance': 'house', 'Bluetooth device': 'bluetooth',
  'Apple device': 'phone', 'Samsung device': 'phone', 'Xiaomi device': 'phone', 'Amazon Echo / Fire TV': 'play',
  'Unknown device': 'help',
};
const CRITICAL_EXAMPLES = [
  'Find the reason my computer is running slowly and give me a fix plan',
  'Check my laptop security and write a report with the top 5 fixes',
  'Check my Wi-Fi and open ports, then explain the risks in simple words',
];
const STAGES = ['Understand', 'Assess risk', 'Plan', 'Approve', 'Execute', 'Monitor', 'Verify', 'Report'];
// The quick actions, grouped by what they look at (anything unlisted lands in "More").
const GROUPS = [
  ['Device intelligence', ['laptop', 'hardware', 'cpu_ram', 'disk', 'bluetooth', 'devices']],
  ['Network intelligence', ['network', 'netfix', 'connections', 'traceroute', 'ports', 'wifi', 'ip', 'speed']],
  ['Security & threats', ['security', 'files', 'emergency', 'report']],
  ['Vulnerabilities & code', ['deps', 'cve', 'code_audit', 'website', 'toolbox']],
  ['Global intelligence', ['investigate']],
];
const PROFILES = { home: 'My own home network', org: 'An organisation network I am authorized to test', lab: 'My own training lab' };
const COMMAND_EXAMPLES = ['JARVIS, analyze my entire laptop', 'my internet keeps dropping', 'traceroute to github.com', 'audit my code for leaked secrets', 'tell me about CVE-2021-44228'];

/** The request params for an action's single input value. */
function inputParams(kind, v) {
  if (kind === 'url') return { url: v };
  if (kind === 'target') return { target: v };
  if (kind === 'query') return { query: v };
  return v ? { path: v } : {};
}

const ago = (t) => {
  const s = Math.max(0, Date.now() / 1000 - t);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} h ago`;
  return new Date(t * 1000).toLocaleDateString();
};
const elapsed = (job) => {
  const end = job.finished_at || Date.now() / 1000;
  return job.started_at ? `${Math.max(0, end - job.started_at).toFixed(0)} s` : '';
};
const signalBars = (rssi) => (rssi == null ? null : rssi >= -60 ? 4 : rssi >= -70 ? 3 : rssi >= -80 ? 2 : 1);

function useInterval(fn, ms) {
  const saved = useRef(fn);
  saved.current = fn;
  useEffect(() => {
    if (!ms) return undefined;
    const id = setInterval(() => {
      if (!document.hidden) saved.current();
    }, ms);
    return () => clearInterval(id);
  }, [ms]);
}

// ---------- small pieces ----------

function Score({ value }) {
  if (value == null) return null;
  const tone = value >= 85 ? 'ok' : value >= 60 ? 'warn' : 'bad';
  const c = 2 * Math.PI * 22;
  return (
    <div className={`ops-score ${tone}`} aria-label={`Score ${value} of 100`}>
      <svg viewBox="0 0 52 52" aria-hidden="true">
        <circle cx="26" cy="26" r="22" className="track" />
        <circle cx="26" cy="26" r="22" className="arc" strokeDasharray={`${(c * value) / 100} ${c}`} />
      </svg>
      <strong>{value}</strong>
    </div>
  );
}

function Steps({ steps }) {
  return (
    <ol className="ops-steps">
      {steps.map((s, i) => (
        <li key={i} className={`st-${s.status}`}>
          <span className="dot" aria-hidden="true" />
          <span className="label">{s.label}</span>
          {s.detail && <span className="detail">{s.detail}</span>}
          {s.ms != null && <span className="ms">{(s.ms / 1000).toFixed(1)} s</span>}
        </li>
      ))}
    </ol>
  );
}

function Finding({ f }) {
  return (
    <li className={`ops-finding sev-${f.severity}`}>
      <span className="chip">{SEV_LABEL[f.severity] || f.severity}</span>
      <div>
        <strong>{f.title}</strong>
        {f.area && <em className="area">{f.area}</em>}
        {f.detail && f.detail !== f.title && <p>{f.detail}</p>}
        {f.fix && f.severity !== 'ok' && <p className="fix"><Icon name="check" size="0.9em" /> {f.fix}</p>}
        {f.owasp && <span className="owasp">{f.owasp}</span>}
      </div>
    </li>
  );
}

function KvSection({ s }) {
  return (
    <dl className="ops-kv">
      {s.items.map(([k, v]) => (
        <div key={k}><dt>{k}</dt><dd>{typeof v === 'string' && v.startsWith('https://') ? <a href={v} target="_blank" rel="noreferrer">{v}</a> : String(v)}</dd></div>
      ))}
    </dl>
  );
}

function TableSection({ s }) {
  const [q, setQ] = useState('');
  const [all, setAll] = useState(false);
  const rows = useMemo(() => (q ? s.rows.filter((r) => r.join(' ').toLowerCase().includes(q.toLowerCase())) : s.rows), [q, s.rows]);
  if (!s.rows.length) return <p className="muted small">None.</p>;
  const shown = all ? rows : rows.slice(0, 12);
  return (
    <div>
      {s.rows.length > 12 && <input className="ops-filter" value={q} onChange={(e) => setQ(e.target.value)} placeholder={`Filter ${s.rows.length} rows`} aria-label={`Filter ${s.title}`} />}
      <div className="ops-table-wrap">
        <table className="ops-table">
          <thead><tr>{s.columns.map((c) => <th key={c}>{c}</th>)}</tr></thead>
          <tbody>
            {shown.map((r, i) => (
              <tr key={i}>{r.map((c, j) => <td key={j} className={['high', 'medium', 'low', 'info', 'critical'].includes(c) ? `sev-cell sev-${c}` : ''}>{c == null ? '' : String(c)}</td>)}</tr>
            ))}
          </tbody>
        </table>
      </div>
      {rows.length > 12 && <button type="button" className="ops-link" onClick={() => setAll((a) => !a)}>{all ? 'Show fewer' : `Show all ${rows.length}`}</button>}
      {s.note && <p className="muted small">{s.note}</p>}
    </div>
  );
}

function BarsSection({ s }) {
  return (
    <ul className="ops-bars">
      {s.items.map((b) => {
        const pct = Math.min(100, (b.value / (b.max || 100)) * 100);
        const tone = b.lower_is_better ? (b.value > 100 ? 'bad' : b.value > 60 ? 'warn' : 'ok') : b.unit === '%' ? (b.value >= 90 ? 'bad' : b.value >= 75 ? 'warn' : 'ok') : 'ok';
        return (
          <li key={b.label}>
            <span className="name">{b.label}</span>
            <span className={`track ${tone}`}><i style={{ width: `${pct}%` }} /></span>
            <span className="val">{b.value}{b.unit}{b.note ? <small> · {b.note}</small> : null}</span>
          </li>
        );
      })}
    </ul>
  );
}

// ---------- devices ----------

// Golden-angle spacing: every device gets its own direction, evenly spread, the same on every render.
const GOLDEN = Math.PI * (3 - Math.sqrt(5));

function radius(d) {
  if (d.is_self) return 0;
  if (d.is_gateway) return 42;
  if (d.rssi != null) return Math.max(48, Math.min(148, 48 + ((-d.rssi - 40) / 55) * 100));
  if (d.connection?.startsWith('bluetooth')) return d.status === 'connected' ? 60 : 146;
  return d.status === 'online' ? 100 : 132;
}

function Radar({ devices, selected, onSelect }) {
  return (
    <div className="ops-radar" role="img" aria-label={`Radar of ${devices.length} devices`}>
      <svg viewBox="-160 -160 320 320">
        {[50, 100, 150].map((r) => <circle key={r} r={r} className="ring" />)}
        <line x1="-155" y1="0" x2="155" y2="0" className="axis" />
        <line x1="0" y1="-155" x2="0" y2="155" className="axis" />
        <g className="sweep"><path d="M0 0 L150 0 A150 150 0 0 0 129.9 -75 Z" /></g>
        {devices.map((d, i) => {
          const r = radius(d);
          const a = i * GOLDEN - Math.PI / 2;
          const x = Math.cos(a) * r;
          const y = Math.sin(a) * r;
          const lvl = d.security?.level || 'ok';
          return (
            <g key={d.id} transform={`translate(${x.toFixed(1)} ${y.toFixed(1)})`} className={`blip lvl-${lvl} ${d.connection?.startsWith('bluetooth') ? 'bt' : 'ip'} ${selected === d.id ? 'sel' : ''} ${d.status !== 'online' && d.status !== 'connected' ? 'dim' : ''}`}
              onClick={() => onSelect(d.id)} tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && onSelect(d.id)} role="button" aria-label={`${d.name}, ${d.category}`}>
              <circle r={d.is_self ? 9 : 5.5} />
              {d.is_self && <circle r="15" className="halo" />}
              <title>{`${d.name} · ${d.category}${d.ip ? ` · ${d.ip}` : ''}`}</title>
            </g>
          );
        })}
      </svg>
      <div className="legend"><span><i className="ip" /> Network</span><span><i className="bt" /> Bluetooth</span><span><i className="risk" /> Risk found</span></div>
    </div>
  );
}

function DeviceCard({ d, active, onSelect }) {
  const bars = signalBars(d.rssi);
  const rows = [
    ['IP address', d.ip], ['MAC address', d.mac && `${d.mac}${d.mac_private ? ' (private / randomized)' : ''}`], ['Manufacturer', d.manufacturer || d.vendor],
    ['Model', d.model], ['Operating system', d.os], ['Host name', d.hostname], ['NetBIOS name', d.netbios], ['Services', (d.services || []).join(', ')],
    ['Open ports', (d.open_ports || []).join(', ')], ['Signal', d.rssi != null ? `${d.rssi} dBm` : null], ['Connection', d.connection === 'network' ? `Network${d.interface ? ` (${d.interface})` : ''}` : d.connection === 'bluetooth' ? 'Bluetooth classic' : d.connection === 'bluetooth-le' ? 'Bluetooth LE' : null],
    ['Last detected', d.last_seen && new Date(d.last_seen).toLocaleTimeString()],
  ].filter(([, v]) => v);
  return (
    <article className={`ops-device lvl-${d.security?.level || 'ok'} ${active ? 'active' : ''}`} id={`dev-${d.id}`}>
      <button type="button" className="head" onClick={() => onSelect(active ? null : d.id)} aria-expanded={active}>
        <span className="ico"><Icon name={CAT_ICON[d.category] || 'help'} /></span>
        <span className="who"><strong>{d.name}</strong><small>{d.category}{d.ip ? ` · ${d.ip}` : ''}</small></span>
        <span className={`status s-${d.status?.replace(' ', '-')}`}>{d.status}</span>
        {bars && <span className="sig" aria-label={`Signal ${bars} of 4`}>{[1, 2, 3, 4].map((b) => <i key={b} className={b <= bars ? 'on' : ''} />)}</span>}
      </button>
      {active && (
        <div className="body">
          <dl className="ops-kv">{rows.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}</dl>
          {d.security?.notes?.length > 0 && <ul className="notes">{d.security.notes.map((n) => <li key={n}><Icon name="alert" size="0.9em" /> {n}</li>)}</ul>}
        </div>
      )}
    </article>
  );
}

function DevicesSection({ s }) {
  const [cat, setCat] = useState('all');
  const [sel, setSel] = useState(null);
  const cats = useMemo(() => {
    const m = {};
    s.devices.forEach((d) => { m[d.category] = (m[d.category] || 0) + 1; });
    return Object.entries(m).sort((a, b) => b[1] - a[1]);
  }, [s.devices]);
  if (!s.devices.length) return <p className="muted small">No devices found.</p>;
  const list = cat === 'all' ? s.devices : s.devices.filter((d) => d.category === cat);
  const pick = (id) => {
    setSel(id);
    if (id) requestAnimationFrame(() => document.getElementById(`dev-${id}`)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }));
  };
  return (
    <div className="ops-devices">
      <Radar devices={s.devices} selected={sel} onSelect={pick} />
      <div className="ops-device-list">
        <div className="ops-cats" role="group" aria-label="Filter by category">
          <button type="button" className={cat === 'all' ? 'on' : ''} onClick={() => setCat('all')}>All {s.devices.length}</button>
          {cats.map(([c, n]) => <button type="button" key={c} className={cat === c ? 'on' : ''} onClick={() => setCat(c)}><Icon name={CAT_ICON[c] || 'help'} size="0.95em" /> {c} {n}</button>)}
        </div>
        {list.map((d) => <DeviceCard key={d.id} d={d} active={sel === d.id} onSelect={pick} />)}
      </div>
    </div>
  );
}

// Network map: Internet → router → this PC and every device, grouped by type; red = risk found.
function TopologySection({ s }) {
  const gw = s.devices.find((d) => d.is_gateway);
  const groups = useMemo(() => {
    const m = new Map();
    s.devices.filter((d) => !d.is_gateway).forEach((d) => {
      if (!m.has(d.category)) m.set(d.category, []);
      m.get(d.category).push(d);
    });
    return [...m.entries()].sort((a, b) => (a[0] === 'This PC' ? -1 : b[0] === 'This PC' ? 1 : b[1].length - a[1].length));
  }, [s.devices]);
  const W = Math.max(720, groups.length * 132);
  const colW = W / Math.max(1, groups.length);
  const boxH = (n) => 34 + Math.min(n, 5) * 15 + (n > 5 ? 15 : 0);
  const H = 196 + Math.max(0, ...groups.map(([, ds]) => boxH(ds.length))) + 12;
  const risky = (ds) => ds.some((d) => ['medium', 'high'].includes(d.security?.level));
  return (
    <div className="ops-topo-wrap">
      <svg className="ops-topo" viewBox={`0 0 ${W} ${H}`} style={{ minWidth: Math.min(W, 900) }} role="img" aria-label={`Network map: ${groups.map(([c, ds]) => `${ds.length} ${c}`).join(', ')}`}>
        <g className="node inet"><circle cx={W / 2} cy={26} r={16} /><text x={W / 2} y={30} textAnchor="middle">🌐</text><text x={W / 2 + 24} y={30}>Internet</text></g>
        <line className="link" x1={W / 2} y1={42} x2={W / 2} y2={94} />
        <g className={`node router ${gw && risky([gw]) ? 'risk' : ''}`}>
          <rect x={W / 2 - 90} y={94} width={180} height={40} rx={10} />
          <text x={W / 2} y={112} textAnchor="middle" className="b">{gw ? gw.name : 'Router'}</text>
          <text x={W / 2} y={127} textAnchor="middle" className="s">{gw ? `${gw.ip} · ${(gw.open_ports || []).length} open ports` : 'gateway'}</text>
        </g>
        {groups.map(([cat, ds], i) => {
          const cx = colW * i + colW / 2;
          const bw = Math.min(colW - 12, 190);
          return (
            <g key={cat} className={`node grp ${risky(ds) ? 'risk' : ''}`}>
              <path className="link" d={`M${W / 2} 134 C ${W / 2} 160, ${cx} 160, ${cx} 186`} />
              <rect x={cx - bw / 2} y={186} width={bw} height={boxH(ds.length)} rx={10} />
              <text x={cx} y={204} textAnchor="middle" className="b">{cat} · {ds.length}</text>
              {ds.slice(0, 5).map((d, j) => (
                <text key={d.id} x={cx - bw / 2 + 10} y={222 + j * 15} className={`s ${['medium', 'high'].includes(d.security?.level) ? 'bad' : ''}`}>
                  {(d.name || '').slice(0, Math.floor(bw / 7.2) - 9)}{d.ip ? ` ${d.ip.split('.').slice(-1)[0] ? '.' + d.ip.split('.').slice(-1)[0] : ''}` : ''}
                </text>
              ))}
              {ds.length > 5 && <text x={cx - bw / 2 + 10} y={222 + 5 * 15} className="s">+{ds.length - 5} more</text>}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function Section({ s }) {
  return (
    <section className="ops-section">
      <h4>{s.title}</h4>
      {s.type === 'kv' && <KvSection s={s} />}
      {s.type === 'table' && <TableSection s={s} />}
      {s.type === 'bars' && <BarsSection s={s} />}
      {s.type === 'devices' && <DevicesSection s={s} />}
      {s.type === 'topology' && <TopologySection s={s} />}
      {s.type === 'text' && <p className="muted small">{s.text}</p>}
    </section>
  );
}

// ---------- result ----------

// A fix changes a network setting, so it runs only after an explicit second click (the approval).
function Fixes({ fixes, onFix }) {
  const [confirm, setConfirm] = useState(null);
  return (
    <div className="ops-fixes">
      <strong><Icon name="zap" size="1em" /> Suggested fixes</strong>
      {fixes.map((fx) => (
        <div key={fx.id} className="ops-fix">
          <div><b>{fx.label}</b><span>{fx.why}</span></div>
          {confirm === fx.id ? (
            <span className="row">
              <button type="button" className="ops-btn primary sm" onClick={() => { setConfirm(null); onFix(fx); }}>Approve &amp; run</button>
              <button type="button" className="ops-btn sm" onClick={() => setConfirm(null)}>Cancel</button>
            </span>
          ) : (
            <button type="button" className="ops-btn sm" onClick={() => setConfirm(fx.id)}>Apply…</button>
          )}
        </div>
      ))}
    </div>
  );
}

const esc = (v) => String(v ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

/** A self-contained printable page of one result (the browser's print dialog saves it as PDF). */
export function printableHtml(job) {
  const r = job.result || {};
  const sec = (s) => {
    if (s.type === 'kv') return `<table>${s.items.map(([k, v]) => `<tr><th>${esc(k)}</th><td>${esc(v)}</td></tr>`).join('')}</table>`;
    if (s.type === 'table') return `<table><tr>${s.columns.map((c) => `<th>${esc(c)}</th>`).join('')}</tr>${s.rows.slice(0, 300).map((row) => `<tr>${row.map((c) => `<td>${esc(c)}</td>`).join('')}</tr>`).join('')}</table>`;
    if (s.type === 'devices' || s.type === 'topology') return s.type === 'topology' ? '' : `<table><tr><th>Name</th><th>Type</th><th>IP</th><th>MAC</th><th>Maker</th><th>OS</th><th>Ports</th><th>Risk</th></tr>${s.devices.map((d) => `<tr><td>${esc(d.name)}</td><td>${esc(d.category)}</td><td>${esc(d.ip)}</td><td>${esc(d.mac)}</td><td>${esc(d.manufacturer || d.vendor)}</td><td>${esc(d.os)}</td><td>${esc((d.open_ports || []).join(', '))}</td><td>${esc(d.security?.level)}</td></tr>`).join('')}</table>`;
    if (s.type === 'bars') return `<ul>${s.items.map((b) => `<li>${esc(b.label)}: ${esc(b.value)}${esc(b.unit)}</li>`).join('')}</ul>`;
    return `<p>${esc(s.text)}</p>`;
  };
  return `<!doctype html><html><head><meta charset="utf-8"><title>${esc(job.title)} · Azarvis</title><style>
body{font:13px/1.45 system-ui,sans-serif;color:#111;margin:28px}h1{font-size:20px;margin:0}h2{font-size:14px;margin:18px 0 6px;border-bottom:1px solid #ccc}
.meta{color:#555}.f{border-left:4px solid #999;padding:4px 10px;margin:6px 0}.critical,.high{border-color:#c62828}.medium{border-color:#ef8f00}.low{border-color:#1e88e5}.ok{border-color:#2e7d32}
table{border-collapse:collapse;width:100%;margin:4px 0}th,td{border:1px solid #ddd;padding:3px 6px;text-align:left;vertical-align:top;font-size:11.5px;word-break:break-word}th{background:#f3f3f3}</style></head><body>
<h1>${esc(job.title)}</h1><p class="meta">Azarvis Cyber Ops · ${esc(new Date((job.finished_at || job.created_at) * 1000).toLocaleString())} · status ${esc(job.status)}${r.score != null ? ` · score ${esc(r.score)}/100` : ''}</p>
<p><b>${esc(r.summary)}</b></p>${r.tools ? `<p class="meta">Tools: ${esc(r.tools)}</p>` : ''}
<h2>Findings</h2>${(r.findings || []).map((f) => `<div class="f ${esc(f.severity)}"><b>[${esc(f.severity).toUpperCase()}] ${esc(f.title)}</b>${f.detail ? `<br>${esc(f.detail)}` : ''}${f.fix ? `<br><i>Fix: ${esc(f.fix)}</i>` : ''}</div>`).join('')}
<h2>Steps</h2><ol>${(job.steps || []).map((s) => `<li>${esc(s.label)}: ${esc(s.status)}${s.detail ? ` (${esc(s.detail)})` : ''}</li>`).join('')}</ol>
${(r.sections || []).map((s) => (s.type === 'topology' ? '' : `<h2>${esc(s.title)}</h2>${sec(s)}`)).join('')}
<p class="meta">Read-only assessment unless a fix was explicitly approved.</p></body></html>`;
}

function Result({ job, onRerun, onAsk, onCancel, onFix }) {
  const [showOk, setShowOk] = useState(false);
  const r = job.result;
  const download = async () => {
    try {
      const md = await api.opsReport(job.id);
      const url = URL.createObjectURL(new Blob([md], { type: 'text/markdown' }));
      const a = Object.assign(document.createElement('a'), { href: url, download: `azarvis-${job.action}-${new Date((job.finished_at || job.created_at) * 1000).toISOString().slice(0, 16).replace(/[:T]/g, '-')}.md` });
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
    } catch (e) {
      toast(e.message, 'error');
    }
  };
  const exportJson = () => {
    const url = URL.createObjectURL(new Blob([JSON.stringify({ ...job, exported_at: new Date().toISOString(), source: 'Azarvis Cyber Ops' }, null, 2)], { type: 'application/json' }));
    const a = Object.assign(document.createElement('a'), { href: url, download: `azarvis-${job.action}-${job.id}.json` });
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  };
  const printPdf = () => {
    const w = window.open('', '_blank');
    if (!w) return toast('Allow pop-ups to print the report.', 'error');
    w.document.write(printableHtml(job));
    w.document.close();
    w.focus();
    setTimeout(() => w.print(), 300);
  };
  const explain = () => {
    const top = (r?.findings || []).filter((f) => f.severity !== 'ok').slice(0, 8).map((f) => `- [${f.severity}] ${f.title}${f.detail ? `: ${f.detail}` : ''}`).join('\n');
    onAsk(`Explain these "${job.title}" results in simple words and tell me what to do first:\n${r?.summary}\n${top}`);
  };
  const findings = r?.findings || [];
  const problems = findings.filter((f) => f.severity !== 'ok');
  const passed = findings.filter((f) => f.severity === 'ok');
  return (
    <div className="ops-result" aria-live="polite">
      <header>
        <div>
          <h3>{job.title}</h3>
          <p className="muted small">
            <span className={`ops-badge b-${job.status}`}>{job.status}</span> {ago(job.created_at)} · {elapsed(job)}
          </p>
        </div>
        <Score value={r?.score} />
      </header>
      {ACTIVE.has(job.status) && (
        <div className="row wrap">
          <span className="ops-spinner" aria-hidden="true" /> <span>Working: {job.steps.at(-1)?.label || 'starting'}…</span>
          <button type="button" className="ops-btn danger sm" onClick={() => onCancel(job)}><Icon name="stop" size="1em" /> Cancel current task</button>
        </div>
      )}
      <Steps steps={job.steps} />
      {job.error && <p className="ops-error"><Icon name="alert" size="1em" /> {job.error}</p>}
      {r && (
        <>
          <p className="ops-summary">{r.summary}</p>
          {r.tools && <p className="ops-tools"><Icon name="briefcase" size="0.95em" /> Tools: {r.tools}</p>}
          {(r.fixes || []).length > 0 && <Fixes fixes={r.fixes} onFix={onFix} />}
          <div className="row wrap ops-result-actions">
            <button type="button" className="ops-btn sm" onClick={download}><Icon name="download" size="1em" /> Report (.md)</button>
            <button type="button" className="ops-btn sm" onClick={printPdf}><Icon name="file" size="1em" /> PDF</button>
            <button type="button" className="ops-btn sm" onClick={exportJson}><Icon name="code" size="1em" /> JSON</button>
            <button type="button" className="ops-btn sm" onClick={explain}><Icon name="sparkles" size="1em" /> Ask Jarvis to explain</button>
            <button type="button" className="ops-btn sm" onClick={onRerun}><Icon name="refresh" size="1em" /> Run again</button>
          </div>
          {problems.length > 0 && <ul className="ops-findings">{problems.map((f, i) => <Finding key={i} f={f} />)}</ul>}
          {passed.length > 0 && (
            <>
              <button type="button" className="ops-link" onClick={() => setShowOk((s) => !s)} aria-expanded={showOk}>
                <Icon name="check" size="0.9em" /> {passed.length} check{passed.length > 1 ? 's' : ''} passed {showOk ? '▴' : '▾'}
              </button>
              {showOk && <ul className="ops-findings">{passed.map((f, i) => <Finding key={i} f={f} />)}</ul>}
            </>
          )}
          {(r.sections || []).map((s, i) => <Section key={`${job.id}-${i}`} s={s} />)}
        </>
      )}
    </div>
  );
}

// ---------- dialogs ----------

function ConsentDialog({ action, onOk, onCancel }) {
  const [checked, setChecked] = useState(false);
  const [profile, setProfile] = useState('home');
  const [by, setBy] = useState('');
  const ready = checked && (profile !== 'org' || by.trim().length >= 3);
  return (
    <div className="ops-modal" role="dialog" aria-modal="true" aria-labelledby="ops-consent-title" onKeyDown={(e) => e.key === 'Escape' && onCancel()}>
      <div className="ops-modal-card">
        <h3 id="ops-consent-title"><Icon name="shield" /> Authorized networks only</h3>
        <p><b>{action.title}</b> looks at the network this PC is connected to (its own subnet, at most 254 addresses):</p>
        <ul>
          <li>asks which devices are present (ARP), and listens to what they announce (mDNS, UPnP, NetBIOS names);</li>
          <li>{action.id === 'network' ? 'checks 24 common ports on each device to find risky services;' : 'checks 4 ports per device to tell its type;'}</li>
          {action.id === 'devices' && <li>lists Bluetooth devices this PC can see;</li>}
          <li>never logs in, guesses passwords, or changes any device.</li>
        </ul>
        <p className="muted small">Scanning a network you don&apos;t own (office, café, neighbour) can break its rules or the law. Ask the owner first.</p>
        <fieldset className="ops-profiles">
          <legend>Whose network is this?</legend>
          {Object.entries(PROFILES).map(([id, label]) => (
            <label key={id} className="check-row"><input type="radio" name="ops-profile" value={id} checked={profile === id} onChange={() => setProfile(id)} /> {label}</label>
          ))}
        </fieldset>
        {profile === 'org' && (
          <input className="ops-input" value={by} onChange={(e) => setBy(e.target.value)} maxLength={160} placeholder="Who authorized it? (name, ticket or contract)" aria-label="Who authorized the test" />
        )}
        <label className="check-row"><input type="checkbox" checked={checked} onChange={(e) => setChecked(e.target.checked)} autoFocus /> I own this network or have the owner&apos;s permission to scan it.</label>
        <div className="row end">
          <button type="button" className="ops-btn" onClick={onCancel}>Cancel</button>
          <button type="button" className="ops-btn primary" disabled={!ready} onClick={() => onOk({ authorized: true, profile, ...(by.trim() ? { authorized_by: by.trim() } : {}) })}><Icon name="radar" size="1em" /> Start scan</button>
        </div>
      </div>
    </div>
  );
}

function InputDialog({ action, onOk, onCancel, initial = '' }) {
  const [value, setValue] = useState(initial);
  const kind = action.input; // 'url' | 'target' | 'path' | 'folder' | 'query'
  const required = kind === 'url' || kind === 'target' || kind === 'query';
  const submit = (e) => {
    e.preventDefault();
    if (required && !value.trim()) return;
    onOk(value.trim());
  };
  const copy = {
    url: { blurb: 'A passive check: one normal visit, the HTTPS certificate and the security headers, mapped to the OWASP Top 10. Safe for any public site.', ph: 'example.com', label: 'Website address', cta: 'Check site' },
    target: { blurb: 'Public records only: DNS, WHOIS/RDAP, the owner and ASN, TLS certificate, subdomains from Certificate Transparency, and email security (SPF/DMARC). Nothing on the target is scanned or accessed beyond one normal visit — safe for any domain or public IP.', ph: 'example.com  or  1.1.1.1', label: 'Domain or public IP', cta: 'Investigate' },
    path: { blurb: "Leave empty to scan Downloads, Desktop, Documents, Startup and Temp. Or paste one file's full path for a deep analysis: real type, SHA-256, signature, script red flags and a Microsoft Defender scan (nothing is quarantined or deleted).", ph: 'C:\\Users\\you\\Downloads\\file.exe (optional)', label: 'File path', cta: value.trim() ? 'Analyze file' : 'Scan folders' },
    folder: { blurb: action.id === 'deps' ? 'Exact package versions from lock files and .venv folders, checked against OSV.dev. Leave empty to check the Jarvis project itself.' : 'Committed secrets (shown masked), Bandit Python findings and risky JavaScript patterns. Nothing is uploaded or changed. Leave empty to audit the Jarvis project itself.', ph: 'C:\\path\\to\\your\\project (optional)', label: 'Project folder', cta: value.trim() ? 'Scan folder' : 'Scan the Jarvis project' },
    query: { blurb: 'Official NIST National Vulnerability Database: CVSS score, weakness type, dates and whether CISA lists it as actively exploited.', ph: 'CVE-2021-44228  or  openssh 9.6', label: 'CVE id or product', cta: 'Look up' },
  }[kind];
  if (action.id === 'traceroute') Object.assign(copy, { blurb: 'Shows each router between this PC and the host, the delay at each hop and which network runs it. Uses Windows tracert, like any network admin.', ph: 'google.com  or  8.8.8.8', label: 'Host or IP', cta: 'Trace route' });
  return (
    <div className="ops-modal" role="dialog" aria-modal="true" aria-labelledby="ops-input-title" onKeyDown={(e) => e.key === 'Escape' && onCancel()}>
      <form className="ops-modal-card" onSubmit={submit}>
        <h3 id="ops-input-title"><Icon name={action.icon} /> {action.title}</h3>
        <p>{copy.blurb}</p>
        <input className="ops-input" value={value} onChange={(e) => setValue(e.target.value)} autoFocus spellCheck={false}
          autoCapitalize="none" placeholder={copy.ph} aria-label={copy.label} />
        <div className="row end">
          <button type="button" className="ops-btn" onClick={onCancel}>Cancel</button>
          <button type="submit" className="ops-btn primary" disabled={required && !value.trim()}><Icon name="search" size="1em" /> {copy.cta}</button>
        </div>
      </form>
    </div>
  );
}

// ---------- critical task (orchestrator) ----------

function stageOf(run) {
  if (!run) return -1;
  if (run.status === 'planning') return 2;
  if (run.status === 'needs_approval' || (run.approvals || []).some((a) => a.status === 'pending')) return 3;
  if (run.status === 'running' || run.status === 'paused') return (run.subtasks || []).some((s) => s.status === 'done') ? 5 : 4;
  if (run.status === 'verifying') return 6;
  if (run.status === 'done' || run.status === 'done_with_errors') return 7;
  return -1;
}

function CriticalTask({ inputRef, handoff }) {
  const [text, setText] = useState('');
  const [run, setRun] = useState(null);
  const [busy, setBusy] = useState(false);
  // A request the universal command passed to the agent team: start it right away.
  useEffect(() => {
    if (!handoff?.text) return;
    setText(handoff.text);
    setBusy(true);
    api.startRun(handoff.text).then(setRun).catch((err) => toast(err.message, 'error')).finally(() => setBusy(false));
  }, [handoff]);
  const refresh = useCallback(async (id) => {
    try {
      setRun(await api.orchestratorRun(id));
    } catch {
      /* keep the last view */
    }
  }, []);
  useInterval(() => run && RUN_ACTIVE.has(run.status) && refresh(run.id), run && RUN_ACTIVE.has(run.status) ? 1500 : null);
  const start = async (e) => {
    e?.preventDefault();
    if (text.trim().length < 3) return;
    setBusy(true);
    try {
      setRun(await api.startRun(text.trim()));
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setBusy(false);
    }
  };
  const decide = async (a, approve) => {
    try {
      setRun(await api.decideApproval(run.id, a.id, approve));
    } catch (err) {
      toast(err.message, 'error');
    }
  };
  const control = async (action) => {
    try {
      setRun(await api.runAction(run.id, action));
    } catch (err) {
      toast(err.message, 'error');
    }
  };
  const stage = stageOf(run);
  return (
    <section className="ops-panel ops-critical" id="ops-critical">
      <header><h2><Icon name="siren" /> Critical task</h2><p>Plan → approve → execute → verify → report, by the team of specialist agents (Ethical Hacker, Cyber Defense, Network, Hardware, Software, Science, Math, QA…). Anything that acts waits for your approval.</p></header>
      <form onSubmit={start} className="ops-critical-form">
        <textarea ref={inputRef} value={text} onChange={(e) => setText(e.target.value)} rows={2} maxLength={2000} placeholder="Describe the task, e.g. Find why my laptop is slow and make a fix plan" aria-label="Critical task" />
        <button type="submit" className="ops-btn primary" disabled={busy || text.trim().length < 3}><Icon name="rocket" size="1em" /> {busy ? 'Starting…' : 'Plan & execute'}</button>
      </form>
      {!run && <div className="ops-examples">{CRITICAL_EXAMPLES.map((ex) => <button type="button" key={ex} onClick={() => setText(ex)}>{ex}</button>)}</div>}
      {run && (
        <div className="ops-run">
          <ol className="ops-stages" aria-label="Task stages">
            {STAGES.map((s, i) => <li key={s} className={i < stage ? 'done' : i === stage ? 'now' : ''}>{s}</li>)}
          </ol>
          <p className="muted small"><span className={`ops-badge b-${run.status}`}>{run.status.replace(/_/g, ' ')}</span> {run.instruction}</p>
          {run.error && <p className="ops-error">{run.error}</p>}
          <ul className="ops-subtasks">
            {(run.subtasks || []).map((s) => (
              <li key={s.id} className={`st-${s.status}`}>
                <span className="dot" aria-hidden="true" /><strong>{s.title}</strong> <small>{s.agent_name}{s.seconds != null ? ` · ${s.seconds} s` : ''}</small>
                {s.output && s.status === 'done' && <p>{s.output.slice(0, 400)}{s.output.length > 400 ? '…' : ''}</p>}
                {s.error && <p className="ops-error">{s.error}</p>}
              </li>
            ))}
          </ul>
          {(run.approvals || []).filter((a) => a.status === 'pending').map((a) => (
            <div key={a.id} className="ops-approval">
              <p><Icon name="key" size="1em" /> Approval needed: <b>{a.tool.replace(/_/g, ' ')}</b> <code>{JSON.stringify(a.input).slice(0, 160)}</code></p>
              <div className="row"><button type="button" className="ops-btn primary sm" onClick={() => decide(a, true)}>Approve</button><button type="button" className="ops-btn sm" onClick={() => decide(a, false)}>Reject</button></div>
            </div>
          ))}
          {run.report && <div className="ops-report"><h4>Verified report</h4><p>{run.report}</p></div>}
          <div className="row wrap">
            {RUN_ACTIVE.has(run.status) && (run.paused || run.status === 'paused'
              ? <button type="button" className="ops-btn sm" onClick={() => control('resume')}><Icon name="play" size="1em" /> Resume</button>
              : <button type="button" className="ops-btn sm" onClick={() => control('pause')}><Icon name="clock" size="1em" /> Pause execution</button>)}
            {RUN_ACTIVE.has(run.status) && <button type="button" className="ops-btn danger sm" onClick={() => control('cancel')}><Icon name="stop" size="1em" /> Cancel task</button>}
            {!RUN_ACTIVE.has(run.status) && <button type="button" className="ops-btn sm" onClick={() => { setRun(null); setText(''); }}>New task</button>}
          </div>
        </div>
      )}
    </section>
  );
}

// ---------- universal command + live terminal ----------

const clock = (t) => new Date(t * 1000).toLocaleTimeString([], { hour12: false });

/** The newest log lines: what the user asked, where it was routed, and every job step as it happens. */
function terminalLines(notes, jobs) {
  const lines = notes.map((n) => ({ t: n.t, kind: n.kind, text: n.text }));
  for (const j of jobs.slice(0, 12)) {
    lines.push({ t: j.created_at, kind: 'job', text: `▶ ${j.title}` });
    for (const s of j.steps || []) lines.push({ t: s.started_at || j.created_at, kind: s.status, text: `  ${s.label}${s.detail ? ` — ${s.detail}` : ''}` });
    if (!ACTIVE.has(j.status)) lines.push({ t: j.finished_at || j.created_at, kind: j.status, text: `■ ${j.title}: ${j.status}${j.summary ? ` · ${j.summary}` : ''}` });
  }
  return lines.sort((a, b) => a.t - b.t).slice(-16);
}

function CommandBar({ disabled, onCommand, notes, jobs }) {
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const logRef = useRef(null);
  const submit = async (value) => {
    const v = (value ?? text).trim();
    if (!v || busy) return;
    setBusy(true);
    try {
      await onCommand(v);
      setText('');
    } finally {
      setBusy(false);
    }
  };
  const mic = useListen((heard) => {
    setText(heard);
    submit(heard);
  });
  const lines = terminalLines(notes, jobs);
  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [lines.length]);
  return (
    <section className="ops-panel ops-command">
      <form className="ops-command-row" onSubmit={(e) => { e.preventDefault(); submit(); }}>
        <span className="prompt" aria-hidden="true">JARVIS&gt;</span>
        <input value={mic.listening ? mic.transcript || 'Listening…' : text} onChange={(e) => setText(e.target.value)} disabled={disabled || busy}
          placeholder="Solve this problem… e.g. my internet keeps dropping, audit my code, traceroute to github.com" aria-label="Universal command" spellCheck={false} />
        {mic.supported !== false && (
          <button type="button" className={`ops-btn sm ${mic.listening ? 'danger' : ''}`} onClick={() => (mic.listening ? mic.stop() : mic.start())} disabled={disabled} aria-label={mic.listening ? 'Stop listening' : 'Speak a command'} title="Speak a command">
            <Icon name="mic" size="1em" />
          </button>
        )}
        <button type="submit" className="ops-btn primary sm" disabled={disabled || busy || !text.trim()}><Icon name="send" size="1em" /> {busy ? 'Routing…' : 'Run'}</button>
      </form>
      {!text && !lines.length && <div className="ops-examples">{COMMAND_EXAMPLES.map((ex) => <button type="button" key={ex} onClick={() => submit(ex)} disabled={disabled}>{ex}</button>)}</div>}
      {lines.length > 0 && (
        <div className="ops-terminal" ref={logRef} role="log" aria-label="Live log" aria-live="polite">
          {lines.map((l, i) => <div key={i} className={`ln k-${l.kind}`}><span className="ts">{clock(l.t)}</span>{l.text}</div>)}
        </div>
      )}
    </section>
  );
}

// ---------- the page ----------

export default function OpsCenter({ onAsk }) {
  const [catalog, setCatalog] = useState(null);
  const [unreachable, setUnreachable] = useState('');
  const [unsupported, setUnsupported] = useState(''); // the AI service runs on a server, not this PC
  const [jobs, setJobs] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [dialog, setDialog] = useState(null); // {kind: 'consent'|'input', action, preset, initial}
  const [auth, setAuth] = useState(null); // the authorization given this session: {authorized, profile, authorized_by?}
  const [vitals, setVitals] = useState(null);
  const [safe, setSafe] = useState({ on: false });
  const [notes, setNotes] = useState([]); // terminal lines from the universal command
  const [handoff, setHandoff] = useState(null); // a request for the agent team
  const [view, setViewState] = useState(savedView);
  const criticalRef = useRef(null);
  const setView = (v) => {
    setViewState(v);
    try {
      localStorage.setItem(VIEW_KEY, v);
    } catch {
      /* private window: the view just isn't remembered */
    }
  };
  const note = (kind, text) => setNotes((ns) => [...ns.slice(-30), { t: Date.now() / 1000, kind, text }]);

  const loadJobs = useCallback(async () => {
    try {
      setJobs(await api.opsJobs());
      setUnreachable('');
    } catch (e) {
      setUnreachable(e.message || 'The AI service on this PC is not reachable.');
    }
  }, []);
  useEffect(() => {
    api.opsActions().then((d) => {
      setCatalog(d.actions);
      setUnsupported(d.supported ? '' : d.reason);
      if (d.safe_mode) setSafe(d.safe_mode);
    }).catch((e) => setUnreachable(e.message || 'The AI service on this PC is not reachable.'));
    loadJobs();
  }, [loadJobs]);

  const offline = unsupported || unreachable;
  const running = jobs.filter((j) => ACTIVE.has(j.status));
  useInterval(loadJobs, running.length ? 1000 : null);
  useInterval(() => api.systemStatus().then(setVitals).catch(() => {}), offline ? null : 3000);
  useEffect(() => {
    api.systemStatus().then(setVitals).catch(() => {});
  }, []);

  // The selected job's full result (the list only carries summaries).
  const selected = jobs.find((j) => j.id === selectedId);
  useEffect(() => {
    if (!selectedId) return;
    let alive = true;
    api.opsJob(selectedId).then((d) => alive && setDetail(d)).catch(() => {});
    return () => {
      alive = false;
    };
  }, [selectedId, selected?.status, selected?.steps?.length]);

  const byAction = useMemo(() => {
    const m = {};
    for (const j of jobs) if (!m[j.action]) m[j.action] = j; // newest first
    return m;
  }, [jobs]);

  const start = async (action, params = {}) => {
    try {
      const job = await api.opsRun(action.id, params);
      setJobs((js) => [job, ...js]);
      setSelectedId(job.id);
      setDetail(job);
      requestAnimationFrame(() => document.getElementById('ops-result')?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
    } catch (e) {
      toast(e.message, 'error');
    }
  };
  // One path for buttons and the universal command: consent (once per session) → input → start.
  const trigger = (action, preset = {}, fromCommand = false, given = auth) => {
    if (!action) return;
    const last = byAction[action.id];
    if (last && ACTIVE.has(last.status) && !fromCommand) {
      setSelectedId(last.id);
      return;
    }
    if (action.consent && !given) return setDialog({ kind: 'consent', action, preset, fromCommand });
    const key = { url: 'url', target: 'target', query: 'query', path: 'path', folder: 'path' }[action.input];
    const required = ['url', 'target', 'query'].includes(action.input);
    if (key && ((required && !preset[key]) || (!required && !fromCommand))) {
      return setDialog({ kind: 'input', action, preset, initial: preset[key] || '' });
    }
    start(action, { ...preset, ...(action.consent ? given : {}) });
  };
  const runCommand = async (text) => {
    note('you', `> ${text}`);
    try {
      const r = await api.opsCommand(text);
      if (r.mode === 'action') {
        const a = act(r.action);
        note('route', `→ ${r.title}${r.missing ? ` (needs a ${r.missing})` : ''}`);
        trigger(a, r.params || {}, true);
      } else {
        note('route', '→ multi-step problem: handing it to the agent team (plan → approve → execute → verify)');
        setHandoff({ text, id: Date.now() });
        requestAnimationFrame(() => document.getElementById('ops-critical')?.scrollIntoView({ behavior: 'smooth' }));
      }
    } catch (e) {
      note('failed', `✖ ${e.message}`);
    }
  };
  const fix = async (fx) => {
    try {
      const job = await api.opsFix(fx.id);
      note('route', `→ approved fix: ${fx.label}`);
      setJobs((js) => [job, ...js]);
      setSelectedId(job.id);
      setDetail(job);
    } catch (e) {
      toast(e.message, 'error');
    }
  };
  const toggleSafe = async () => {
    try {
      const s = await api.opsSetSafeMode(!safe.on);
      setSafe(s);
      note(s.on ? 'failed' : 'route', s.on ? `■ EMERGENCY SAFE MODE ON · stopped ${s.stopped} task(s)` : '■ Safe mode off');
      toast(s.on ? `Safe mode on. Stopped ${s.stopped} task${s.stopped === 1 ? '' : 's'}.` : 'Safe mode off.');
      loadJobs();
    } catch (e) {
      toast(e.message, 'error');
    }
  };
  const cancel = async (job) => {
    try {
      await api.opsCancel(job.id);
      loadJobs();
    } catch (e) {
      toast(e.message, 'error');
    }
  };
  const stopAll = async () => {
    let n = 0;
    try {
      n += (await api.opsStopAll()).stopped;
      const runs = await api.orchestratorRuns().catch(() => []);
      for (const r of runs.filter((x) => RUN_ACTIVE.has(x.status))) {
        await api.runAction(r.id, 'cancel').catch(() => {});
        n += 1;
      }
      toast(n ? `Stopped ${n} task${n > 1 ? 's' : ''}.` : 'Nothing was running.');
      loadJobs();
    } catch (e) {
      toast(e.message, 'error');
    }
  };
  const act = (id) => catalog?.find((a) => a.id === id);
  const current = running[0];
  const grouped = useMemo(() => {
    if (!catalog) return [];
    const placed = new Set([...GROUPS.flatMap(([, ids]) => ids), ...catalog.filter((a) => a.profile).map((a) => a.id)]);
    let n = 0;
    return [...GROUPS, ['More', catalog.map((a) => a.id).filter((id) => !placed.has(id))]]
      .map(([g, ids]) => [g, ids.map((id) => catalog.find((a) => a.id === id)).filter(Boolean).map((a) => ({ a, n: ++n }))])
      .filter(([, list]) => list.length);
  }, [catalog]);
  const labProfiles = (catalog || []).filter((a) => a.profile);
  const [mood, moodText] = robotMood({ offline, safe: safe.on, running, latest: jobs.find((j) => !ACTIVE.has(j.status)) });
  const jobsKey = `${jobs.length}:${jobs[0]?.id || ''}:${jobs[0]?.status || ''}`; // refresh dashboards when a scan finishes
  const openJob = (id) => {
    setView('ops');
    setSelectedId(id);
    requestAnimationFrame(() => document.getElementById('ops-result')?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  };
  const runFromDashboard = (id) => {
    setView('ops');
    trigger(act(id));
  };
  const goCritical = () => {
    setView('ops');
    requestAnimationFrame(() => {
      document.getElementById('ops-critical')?.scrollIntoView({ behavior: 'smooth' });
      criticalRef.current?.focus();
    });
  };

  return (
    <div className="ops">
      <header className="ops-head">
        <div className="ops-title">
          <RobotCore mood={mood} caption={moodText} />
          <div>
            <h1>Cyber Ops</h1>
            <p>Ethical hacker &amp; device intelligence for this PC and the networks you own. Real scans, read-only, every step shown.</p>
          </div>
        </div>
        <div className="ops-head-right">
          {vitals && (
            <div className="ops-vitals" aria-label="Live system load">
              <span>CPU <b>{vitals.cpu}%</b></span><span>RAM <b className={vitals.ram >= 90 ? 'bad' : ''}>{vitals.ram}%</b></span>
              <span>Disk <b className={vitals.disk >= 90 ? 'bad' : ''}>{vitals.disk}%</b></span>{vitals.battery != null && <span>Battery <b>{vitals.battery}%</b></span>}
            </div>
          )}
          <span className={`ops-link-state ${offline ? 'off' : 'on'}`}>{offline ? 'Agent offline' : 'Agent online'}</span>
          {current && <button type="button" className="ops-btn danger" onClick={() => cancel(current)}><Icon name="x" size="1em" /> Cancel current task</button>}
          <button type="button" className={`ops-btn ${safe.on ? 'safe-on' : ''}`} onClick={toggleSafe} disabled={Boolean(unreachable)} aria-pressed={safe.on}
            title="Stops everything and blocks all actions; read-only checks keep working"><Icon name="shield" size="1em" /> {safe.on ? 'Safe mode ON' : 'Emergency safe mode'}</button>
          <button type="button" className="ops-btn danger solid" onClick={stopAll}><Icon name="stop" size="1em" /> Stop all tasks</button>
        </div>
      </header>

      {offline && <p className="ops-error"><Icon name="alert" size="1em" /> {offline}</p>}
      {safe.on && (
        <p className="ops-safe-banner"><Icon name="shield" size="1em" /> Emergency safe mode is on: Jarvis takes no actions (no PC control, fixes or network scans). Read-only checks still work.
          <button type="button" className="ops-btn sm" onClick={toggleSafe}>Turn off</button></p>
      )}

      <CommandBar disabled={Boolean(offline)} onCommand={runCommand} notes={notes} jobs={jobs} />

      <nav className="od-tabs" role="tablist" aria-label="Cyber Ops views">
        {VIEWS.map(([id, label, icon]) => (
          <button key={id} type="button" role="tab" aria-selected={view === id} onClick={() => setView(id)}><Icon name={icon} size="1em" /> {label}</button>
        ))}
      </nav>
      {view === 'live' && !offline && <LiveMonitor />}
      {view === 'overview' && <SecurityOverview onOpenJob={openJob} onRun={runFromDashboard} jobsKey={jobsKey} />}
      {view === 'mission' && <MissionControl onCritical={goCritical} jobsKey={jobsKey} />}
      {view === 'geo' && !offline && <GlobalMap />}
      {(view === 'live' || view === 'geo') && offline && <p className="muted">This view reads the PC the AI service runs on, which isn't reachable here.</p>}

      {view === 'ops' && <>
      <div className="ops-hero">
        {[
          { id: 'devices', label: 'Instant device discovery', text: 'Discover accessible laptops, phones, TVs, printers, cameras and Bluetooth electronics.', btn: 'Scan nearby devices', icon: 'radar' },
          { id: 'network', label: 'Ethical hacker', text: 'Audit your authorized network: every device, its open ports and risky services.', btn: 'Audit', icon: 'shield' },
          { id: 'investigate', label: 'Global intelligence', text: 'Investigate any domain or public IP from public records: DNS, WHOIS, owner, TLS, subdomains.', btn: 'Investigate', icon: 'globe' },
          { id: 'critical', label: 'Autonomous execution', text: 'Plan and perform an approved complex task with the agent team.', btn: 'Execute', icon: 'rocket' },
        ].map((h) => {
          const job = byAction[h.id];
          const busy = job && ACTIVE.has(job.status);
          return (
            <article key={h.id} className={`ops-hero-card h-${h.id}`}>
              <Icon name={h.icon} size="1.6em" />
              <h2>{h.label}</h2>
              <p>{h.text}</p>
              <button type="button" className="ops-btn primary big" disabled={Boolean(offline) && h.id !== 'critical'}
                onClick={() => (h.id === 'critical' ? (document.getElementById('ops-critical')?.scrollIntoView({ behavior: 'smooth' }), criticalRef.current?.focus()) : trigger(act(h.id)))}>
                {busy ? <><span className="ops-spinner" aria-hidden="true" /> {job.steps.at(-1)?.label || 'Starting'}…</> : <>[ {h.btn} ]</>}
              </button>
            </article>
          );
        })}
      </div>

      {labProfiles.length > 0 && (
        <section className="ops-panel" aria-labelledby="ops-profiles-title">
          <header><h2 id="ops-profiles-title"><Icon name="shield" /> Safe testing profiles</h2>
            <p>One click runs a bundle of real checks at the same time, as one job with one report. Active probing only on networks you authorize.</p></header>
          <div className="od-profiles">
            {labProfiles.map((a, i) => {
              const job = byAction[a.id];
              const busy = job && ACTIVE.has(job.status);
              return (
                <article key={a.id} className={`od-profile ${busy ? 'busy' : ''}`}>
                  <span className="num">P{i + 1}</span>
                  <Icon name={a.icon} size="1.5em" />
                  <h3>{a.title}</h3>
                  <p>{a.does}</p>
                  <div className="tags">
                    {a.consent ? <span className="od-chip t-warn">Authorization required</span> : <span className="od-chip t-ok">Read-only</span>}
                    {a.input && <span className="od-chip">{{ url: 'Needs a website', target: 'Needs a domain or IP', folder: 'Project folder' }[a.input] || a.input}</span>}
                  </div>
                  <button type="button" className="ops-btn primary" onClick={() => trigger(a)} disabled={Boolean(offline)}>
                    {busy ? <><span className="ops-spinner" aria-hidden="true" /> {job.steps.at(-1)?.label || 'Starting'}…</> : job ? 'Run again' : 'Run profile'}
                  </button>
                  {job && !busy && <button type="button" className="ops-link" onClick={() => setSelectedId(job.id)}>{job.status === 'done' ? (job.summary || 'Done') : job.status} · {ago(job.created_at)}</button>}
                </article>
              );
            })}
          </div>
        </section>
      )}

      <section className="ops-panel">
        <header><h2><Icon name="zap" /> Quick actions</h2><p>One click, real results. Nothing on your PC or network is changed unless you approve a fix.</p></header>
        {!catalog && !offline && <div className="ops-skeleton" aria-label="Loading"><i /><i /><i /><i /></div>}
        {grouped.map(([group, list]) => (
          <div key={group} className="ops-group">
            <h3>{group}</h3>
            <div className="ops-grid">
              {list.map(({ a, n }) => {
                const job = byAction[a.id];
                const busy = job && ACTIVE.has(job.status);
                const sev = job?.status === 'done' ? (job.score == null ? 'info' : job.score >= 85 ? 'ok' : job.score >= 60 ? 'warn' : 'bad') : job?.status === 'failed' ? 'bad' : '';
                return (
                  <button type="button" key={a.id} className={`ops-action ${busy ? 'busy' : ''} ${selected?.action === a.id ? 'sel' : ''}`} onClick={() => trigger(a)} disabled={Boolean(offline)} title={`${a.does}${a.tools ? `\nTools: ${a.tools}` : ''}`}>
                    <span className="num">{String(n).padStart(2, '0')}</span>
                    <Icon name={a.icon} size="1.35em" />
                    <span className="t">{a.title}</span>
                    <span className="sub">
                      {busy ? <><span className="ops-spinner" aria-hidden="true" /> {job.steps.at(-1)?.label || 'Starting'}</> : job ? <><i className={`led ${sev}`} /> {job.status === 'done' ? (job.score != null ? `Score ${job.score}` : 'Done') : job.status} · {ago(job.created_at)}</> : a.does}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </section>

      <div className="ops-main">
        <section className="ops-panel" id="ops-result">
          {detail && detail.id === selectedId ? (
            <Result job={{ ...detail, ...(selected ? { status: selected.status, steps: selected.steps } : {}) }} onCancel={cancel} onAsk={onAsk} onFix={fix}
              onRerun={() => { const a = act(detail.action); if (a) start(a, detail.params || {}); }} />
          ) : (
            <div className="ops-empty"><Icon name="radar" size="2.2em" /><p>Pick a quick action. Its live steps and results appear here.</p></div>
          )}
        </section>
        <aside className="ops-panel ops-history">
          <header><h2><Icon name="timeline" /> History</h2></header>
          {jobs.length === 0 && <p className="muted small">No scans yet.</p>}
          <ul>
            {jobs.slice(0, 40).map((j) => (
              <li key={j.id}>
                <button type="button" className={j.id === selectedId ? 'on' : ''} onClick={() => setSelectedId(j.id)}>
                  <span className={`ops-badge b-${j.status}`}>{ACTIVE.has(j.status) ? 'running' : j.status}</span>
                  <strong>{j.title}</strong>
                  <small>{ago(j.created_at)}{j.score != null ? ` · ${j.score}/100` : ''}</small>
                  {j.summary && <span className="sum">{j.summary}</span>}
                </button>
              </li>
            ))}
          </ul>
        </aside>
      </div>

      </>}
      {/* Kept mounted in every view so a running critical task keeps its live state. */}
      <div hidden={view !== 'ops'}><CriticalTask inputRef={criticalRef} handoff={handoff} /></div>

      {dialog?.kind === 'consent' && (
        <ConsentDialog action={dialog.action} onCancel={() => setDialog(null)}
          onOk={(given) => { setAuth(given); setDialog(null); trigger(dialog.action, dialog.preset || {}, dialog.fromCommand, given); }} />
      )}
      {dialog?.kind === 'input' && (
        <InputDialog action={dialog.action} initial={dialog.initial} onCancel={() => setDialog(null)}
          onOk={(v) => { setDialog(null); start(dialog.action, { ...(dialog.preset || {}), ...inputParams(dialog.action.input, v), ...(dialog.action.consent ? auth : {}) }); }} />
      )}
    </div>
  );
}
