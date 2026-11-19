import { useEffect, useMemo, useRef, useState } from 'react';
import { api } from '../api.js';
import { Icon } from '../icons.jsx';
import { languageInfo } from '../languages.js';
import { useLanguage } from '../useLanguage.js';
import './CommandCenter.css';

// The Jarvis Command Center: one live screen for the AI core, agents, schedule, PC health and
// providers. Everything comes from GET /api/ai/command-center (backend routers/command_center.py),
// refreshed every few seconds while the tab is visible. Nothing here is mock data: an empty
// schedule says so, a provider without a key says "Not linked".

const POLL_MS = 5000;
const STATUS_LABEL = { optimal: 'Optimal', attention: 'Attention', degraded: 'Degraded' };
const PROVIDER_TONE = { connected: 'ok', key_set: 'ok', installed: 'ok', no_models: 'warn', checking: 'muted', problem: 'bad', not_linked: 'muted', not_found: 'muted' };
const BRIEFING = 'Give me an executive briefing: my overdue and upcoming tasks today, unread notifications, anything on this PC that needs attention, and the three things I should focus on next. Keep it short.';

/** Live data with polling that pauses while the tab or window is hidden. */
function useCommandCenter() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [updated, setUpdated] = useState(0);
  useEffect(() => {
    let alive = true;
    let timer;
    const load = async () => {
      clearTimeout(timer);
      if (document.hidden) return;
      try {
        const d = await api.commandCenter();
        if (!alive) return;
        setData(d);
        setError('');
        setUpdated(Date.now());
      } catch (e) {
        if (alive) setError(e?.message || 'The AI service is not reachable.');
      }
      if (alive) timer = setTimeout(load, POLL_MS);
    };
    const onVisible = () => !document.hidden && load();
    load();
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      alive = false;
      clearTimeout(timer);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, []);
  return { data, error, updated, retry: () => api.commandCenter().then(setData).then(() => setError('')).catch((e) => setError(e?.message || 'Still not reachable.')) };
}

function useClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return now;
}

const reducedMotion = () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/**
 * The AI core: a rotating wireframe globe drawn on a canvas (points on a sphere, joined to their
 * neighbours) with two orbit rings. Color follows the system status. No 3D library needed.
 */
function CoreOrb({ level }) {
  const ref = useRef(null);
  const levelRef = useRef(level);
  levelRef.current = level;
  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx) return undefined;
    const N = 220;
    const pts = Array.from({ length: N }, (_, i) => {
      const y = 1 - (i / (N - 1)) * 2; // Fibonacci sphere: evenly spread points
      const r = Math.sqrt(1 - y * y);
      const a = i * Math.PI * (3 - Math.sqrt(5));
      return [Math.cos(a) * r, y, Math.sin(a) * r];
    });
    const edges = [];
    for (let i = 0; i < N; i++) for (let j = i + 1; j < N; j++) {
      const d = Math.hypot(pts[i][0] - pts[j][0], pts[i][1] - pts[j][1], pts[i][2] - pts[j][2]);
      if (d < 0.27) edges.push([i, j]);
    }
    let w = 0;
    let h = 0;
    const size = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    size();
    const ro = new ResizeObserver(size);
    ro.observe(canvas);
    const color = () => ({ optimal: '34,211,238', attention: '251,191,36', degraded: '248,113,113' })[levelRef.current] || '34,211,238';
    let raf;
    const draw = (t) => {
      const rgb = color();
      const R = Math.min(w, h) * 0.36;
      const cx = w / 2;
      const cy = h / 2;
      const spin = t * 0.00018;
      const tilt = 0.35;
      ctx.clearRect(0, 0, w, h);
      const glow = ctx.createRadialGradient(cx, cy, R * 0.2, cx, cy, R * 1.5);
      glow.addColorStop(0, `rgba(${rgb},0.20)`);
      glow.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, w, h);
      const proj = pts.map(([x, y, z]) => {
        const x1 = x * Math.cos(spin) - z * Math.sin(spin);
        const z1 = x * Math.sin(spin) + z * Math.cos(spin);
        const y2 = y * Math.cos(tilt) - z1 * Math.sin(tilt);
        const z2 = y * Math.sin(tilt) + z1 * Math.cos(tilt);
        return [cx + x1 * R, cy + y2 * R, z2];
      });
      ctx.lineWidth = 0.6;
      for (const [i, j] of edges) {
        const depth = (proj[i][2] + proj[j][2]) / 2;
        ctx.strokeStyle = `rgba(${rgb},${0.08 + (depth + 1) * 0.16})`;
        ctx.beginPath();
        ctx.moveTo(proj[i][0], proj[i][1]);
        ctx.lineTo(proj[j][0], proj[j][1]);
        ctx.stroke();
      }
      for (const [x, y, z] of proj) {
        ctx.fillStyle = `rgba(${rgb},${0.25 + (z + 1) * 0.35})`;
        ctx.beginPath();
        ctx.arc(x, y, 0.8 + (z + 1) * 0.8, 0, Math.PI * 2);
        ctx.fill();
      }
      // Orbit rings with a moving light on each.
      [[1.32, 0.28, 0.0004, -0.25], [1.18, 0.5, -0.00055, 0.5]].forEach(([k, flat, speed, rot]) => {
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(rot);
        ctx.strokeStyle = `rgba(${rgb},0.35)`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.ellipse(0, 0, R * k, R * k * flat, 0, 0, Math.PI * 2);
        ctx.stroke();
        const a = t * speed;
        ctx.fillStyle = `rgba(${rgb},0.95)`;
        ctx.shadowColor = `rgba(${rgb},1)`;
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.arc(Math.cos(a) * R * k, Math.sin(a) * R * k * flat, 2.6, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });
      if (!reducedMotion()) raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, []);
  return <canvas ref={ref} className="cc-orb-canvas" aria-hidden="true" />;
}

function Ring({ label, value, detail }) {
  const v = Number.isFinite(value) ? Math.max(0, Math.min(100, value)) : null;
  const r = 34;
  const c = 2 * Math.PI * r;
  const tone = v == null ? 'muted' : v >= 90 ? 'bad' : v >= 75 ? 'warn' : 'ok';
  return (
    <div className={`cc-ring tone-${tone}`}>
      <svg viewBox="0 0 84 84" role="img" aria-label={`${label} ${v == null ? 'unavailable' : `${v}%`}`}>
        <circle cx="42" cy="42" r={r} className="cc-ring-track" />
        <circle cx="42" cy="42" r={r} className="cc-ring-value" strokeDasharray={c} strokeDashoffset={v == null ? c : c * (1 - v / 100)} />
        <text x="42" y="38" textAnchor="middle" className="cc-ring-label">{label}</text>
        <text x="42" y="54" textAnchor="middle" className="cc-ring-num">{v == null ? '—' : `${v}%`}</text>
      </svg>
      {detail && <small>{detail}</small>}
    </div>
  );
}

function Panel({ title, action, children, className = '' }) {
  return (
    <section className={`cc-panel ${className}`}>
      <header className="cc-panel-head">
        <h2>{title}</h2>
        {action}
      </header>
      {children}
    </section>
  );
}

const timeOf = (iso) => new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
function untilLabel(iso, done, now) {
  if (done) return 'Done';
  const mins = Math.round((new Date(iso) - now) / 60000);
  if (mins < 0) return mins > -60 ? `${-mins}m overdue` : `${Math.round(-mins / 60)}h overdue`;
  if (mins < 60) return `In ${mins}m`;
  return `In ${Math.floor(mins / 60)}h ${mins % 60}m`;
}
const agoLabel = (iso, now) => {
  const m = Math.round((now - new Date(iso)) / 60000);
  return m < 1 ? 'just now' : m < 60 ? `${m}m ago` : m < 1440 ? `${Math.round(m / 60)}h ago` : `${Math.round(m / 1440)}d ago`;
};

/** A small constellation with one star per memory (up to 16): a picture of what Jarvis knows. */
function MemoryMap({ count }) {
  const stars = useMemo(() => {
    const n = Math.min(16, count);
    let seed = 7;
    const rand = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);
    return Array.from({ length: n }, (_, i) => [12 + ((i * 37) % 76) + rand() * 8, 14 + rand() * 62]);
  }, [count]);
  if (!stars.length) return <p className="cc-empty">No memories yet. Tell Jarvis “remember that…”.</p>;
  return (
    <svg className="cc-memmap" viewBox="0 0 100 90" aria-hidden="true">
      {stars.slice(1).map(([x, y], i) => <line key={`l${i}`} x1={stars[i][0]} y1={stars[i][1]} x2={x} y2={y} />)}
      {stars.map(([x, y], i) => <circle key={i} cx={x} cy={y} r={i % 4 === 0 ? 1.8 : 1.1} />)}
    </svg>
  );
}

export default function CommandCenter({ onOpenTab, onAsk, onStartSession, onOpenPalette }) {
  const { data, error, updated, retry } = useCommandCenter();
  const now = useClock();
  const lang = useLanguage();
  const [timelineView, setTimelineView] = useState('today');

  if (!data) {
    return (
      <div className="cc cc-loading">
        {error ? (
          <div className="cc-panel cc-error" role="alert">
            <Icon name="alert" />
            <div>
              <strong>The Command Center can't reach the AI service.</strong>
              <p>{error} Start Azarvis on this PC (npm run dev), then try again.</p>
            </div>
            <button type="button" className="cc-btn" onClick={retry}><Icon name="refresh" size="1em" /> Retry</button>
          </div>
        ) : (
          <div className="cc-boot"><span className="cc-boot-dot" /> Bringing systems online…</div>
        )}
      </div>
    );
  }

  const { status, core, agents, timeline, feed, device, memory, providers, recent } = data;
  const linkedCount = providers.filter((p) => PROVIDER_TONE[p.state] === 'ok').length;
  const net = device?.network;
  const go = (tab) => tab && tab !== 'notifications' && onOpenTab?.(tab);

  const coreRows = [
    { icon: 'sparkles', label: 'AI Core', value: core.claude === 'connected' ? 'Active' : core.claude === 'checking' ? 'Checking…' : 'Offline', tone: core.claude === 'connected' ? 'ok' : core.claude === 'checking' ? 'muted' : 'bad', tab: 'account' },
    { icon: 'brain', label: 'Memory', value: `${memory.memories.toLocaleString()} stored`, tone: 'ok', tab: 'memory' },
    { icon: 'mic', label: 'Voice', value: `${core.voice.neural ? 'Neural' : 'Browser'} · ${languageInfo(lang).name}`, tone: 'ok', tab: 'account' },
    { icon: 'workflow', label: 'Agents', value: core.agents_active ? `${core.agents_active} running` : `${core.agents_total} ready`, tone: core.agents_active ? 'live' : 'ok', tab: 'studio' },
    { icon: 'zap', label: 'Providers', value: `${linkedCount} connected`, tone: linkedCount ? 'ok' : 'warn' },
    { icon: 'shield', label: 'System', value: STATUS_LABEL[status.level], tone: status.level === 'optimal' ? 'ok' : status.level === 'attention' ? 'warn' : 'bad', tab: 'device' },
  ];

  return (
    <div className={`cc level-${status.level}`}>
      <div className="cc-top">
        <div className={`cc-status tone-${status.level}`} title={status.reasons.join(' · ') || 'All systems normal'}>
          <span>System status</span>
          <b><i className="cc-dot" /> {STATUS_LABEL[status.level]}</b>
          {status.reasons.length > 0 && <em>{status.reasons.join(' · ')}</em>}
        </div>
        <div className="cc-clock" aria-live="off">
          <small>{now.toLocaleDateString([], { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</small>
          <strong>{now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</strong>
        </div>
        <button type="button" className="cc-search" onClick={onOpenPalette}>
          <Icon name="search" size="1em" /> <span>Search or run a command…</span> <kbd>Ctrl K</kbd>
        </button>
      </div>

      <div className="cc-grid">
        <Panel title="AI core overview" className="cc-core">
          <ul className="cc-core-list">
            {coreRows.map((r) => (
              <li key={r.label}>
                <button type="button" onClick={() => go(r.tab)} disabled={!r.tab}>
                  <span className={`cc-chip tone-${r.tone}`}><Icon name={r.icon} size="1.05em" /></span>
                  <span><strong>{r.label}</strong><small className={`tone-text-${r.tone}`}>{r.value}</small></span>
                </button>
              </li>
            ))}
          </ul>
        </Panel>

        <section className="cc-orb" aria-label={`Jarvis AI core, status ${STATUS_LABEL[status.level]}`}>
          <CoreOrb level={status.level} />
          <div className="cc-orb-text">
            <h1>JARVIS</h1>
            <span>AI CORE</span>
            <small>{core.model}</small>
          </div>
        </section>

        <Panel title="Live intelligence feed" className="cc-feed" action={<span className="cc-live"><i className="cc-dot" /> Live</span>}>
          {feed.length === 0 ? (
            <p className="cc-empty">Nothing needs you right now.</p>
          ) : (
            <ul className="cc-feed-list">
              {feed.map((f, i) => (
                <li key={`${f.title}-${i}`} className={`lvl-${f.level}`}>
                  <button type="button" onClick={() => go(f.action)}>
                    <span className="cc-chip"><Icon name={f.level === 'warn' ? 'alert' : f.level === 'tip' ? 'sparkles' : f.level === 'live' ? 'pulse' : 'bell'} size="1em" /></span>
                    <span className="grow"><strong>{f.title}</strong>{f.body && <small>{f.body}</small>}</span>
                    <em>{f.level}</em>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Active agents" className="cc-agents" action={<button type="button" className="cc-link" onClick={() => go('studio')}>Agent Studio ›</button>}>
          <div className="cc-agent-grid">
            {agents.map((a) => (
              <div key={a.id} className={`cc-agent state-${a.state}`} title={a.does}>
                <span className="cc-chip"><Icon name={a.icon} size="1.05em" /></span>
                <div className="grow">
                  <strong>{a.name}</strong>
                  <small><i className="cc-dot" /> {a.state === 'active' ? 'Active' : a.state === 'off' ? 'Off on this host' : 'Ready'}</small>
                  <small className="cc-agent-meta">{a.uses_24h ? `${a.uses_24h} action${a.uses_24h > 1 ? 's' : ''} · ${agoLabel(a.last_used, now)}` : 'No actions in 24 h'}</small>
                </div>
                <span className="cc-wave" aria-hidden="true">{Array.from({ length: 7 }, (_, i) => <i key={i} style={{ '--i': i }} />)}</span>
              </div>
            ))}
          </div>
        </Panel>

        <Panel
          title={timelineView === 'today' ? 'Mission timeline' : 'Recent commands'}
          className="cc-timeline"
          action={(
            <div className="cc-seg" role="tablist" aria-label="Timeline view">
              <button type="button" role="tab" aria-selected={timelineView === 'today'} onClick={() => setTimelineView('today')}>Today</button>
              <button type="button" role="tab" aria-selected={timelineView === 'recent'} onClick={() => setTimelineView('recent')}>Recent</button>
            </div>
          )}
        >
          {timelineView === 'today' ? (
            timeline.length === 0 ? (
              <p className="cc-empty">No timed tasks today. <button type="button" className="cc-link" onClick={() => onAsk?.('Remind me to ', false)}>Add a reminder</button></p>
            ) : (
              <ol className="cc-tl">
                {timeline.map((t) => {
                  const label = untilLabel(t.remind_at, t.done, now);
                  return (
                    <li key={t.id} className={t.done ? 'done' : label.includes('overdue') ? 'late' : ''}>
                      <time>{timeOf(t.remind_at)}</time>
                      <span className="grow">{t.title}</span>
                      <em>{label}</em>
                    </li>
                  );
                })}
              </ol>
            )
          ) : recent.length === 0 ? (
            <p className="cc-empty">No requests yet. Ask Jarvis anything.</p>
          ) : (
            <ol className="cc-tl cc-recent">
              {recent.map((r, i) => (
                <li key={`${r.at}-${i}`}>
                  <time>{agoLabel(r.at, now)}</time>
                  <span className="grow">{r.message}{r.tools.length > 0 && <small>{r.tools.join(' · ')}</small>}</span>
                  <em>{(r.latency_ms / 1000).toFixed(1)}s</em>
                </li>
              ))}
            </ol>
          )}
          <button type="button" className="cc-link cc-foot" onClick={() => go('tasks')}>
            {data.open_tasks} open task{data.open_tasks === 1 ? '' : 's'}{data.overdue_count ? ` · ${data.overdue_count} overdue` : ''} ›
          </button>
        </Panel>

        <Panel title="Quick commands" className="cc-quick">
          <div className="cc-quick-list">
            <button type="button" onClick={() => onAsk?.('Add a task: ', false)}><Icon name="plus" size="1em" /> Start new task</button>
            <button type="button" onClick={() => onAsk?.("Summarize today's schedule from my tasks and reminders, in time order.", true)}><Icon name="calendar" size="1em" /> Today's schedule</button>
            <button type="button" onClick={() => onStartSession?.()}><Icon name="mic" size="1em" /> Start voice chat</button>
            <button type="button" onClick={() => go('automate')}><Icon name="play" size="1em" /> Run workflow</button>
            <button type="button" onClick={() => onAsk?.('Check this PC’s health and tell me if anything needs attention.', true)}><Icon name="pulse" size="1em" /> PC health check</button>
          </div>
        </Panel>

        <Panel title="System monitor" className="cc-monitor" action={<button type="button" className="cc-link" onClick={() => go('device')}>Device ›</button>}>
          {device ? (
            <div className="cc-rings">
              <Ring label="CPU" value={device.cpu.percent} detail={device.cpu.threads ? `${device.cpu.threads} threads` : null} />
              <Ring label="RAM" value={device.memory.percent} detail={`${device.memory.used_gb} / ${device.memory.total_gb} GB`} />
              <Ring label="Disk" value={device.disk.percent} detail={`${device.disk.free_gb} GB free`} />
            </div>
          ) : (
            <p className="cc-empty">PC readings need Azarvis running on this computer (they can't come from a cloud server).</p>
          )}
        </Panel>

        <Panel title="Memory insights" className="cc-memory" action={<button type="button" className="cc-link" onClick={() => go('memory')}>Memory ›</button>}>
          <div className="cc-mem">
            <MemoryMap count={memory.memories} />
            <dl>
              <div><dt>Memories</dt><dd>{memory.memories.toLocaleString()}</dd></div>
              <div><dt>Documents</dt><dd>{memory.documents.toLocaleString()}</dd></div>
              <div><dt>Messages</dt><dd>{memory.messages.toLocaleString()}</dd></div>
              <div><dt>Tool calls</dt><dd>{memory.tool_calls.toLocaleString()}</dd></div>
            </dl>
          </div>
        </Panel>

        <Panel title="LLM & tools status" className="cc-llm" action={<span className="cc-count">{linkedCount} connected</span>}>
          <div className="cc-prov-grid">
            {providers.map((p) => (
              <div key={p.id} className={`cc-prov tone-${PROVIDER_TONE[p.state] || 'muted'}`} title={p.detail}>
                <i className="cc-dot" />
                <span><strong>{p.name}</strong><small>{p.detail}</small></span>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <footer className="cc-bar">
        <div className="cc-bar-stats">
          <span><Icon name="wifi" size="1em" /> <small>Network</small> {net ? (net.online ? `${net.type === 'ethernet' ? 'Wired' : 'Wi-Fi'}${net.speed_mbps ? ` · ${net.speed_mbps} Mbps` : ''}` : 'Offline') : '—'}</span>
          {device?.battery && <span><Icon name="zap" size="1em" /> <small>Battery</small> {device.battery.percent}%{device.battery.plugged ? ' · charging' : ''}</span>}
          {device && <span><Icon name="clock" size="1em" /> <small>Uptime</small> {device.uptime_hours} h</span>}
        </div>
        <button type="button" className="cc-talk" onClick={() => onStartSession?.()}>
          <span className="cc-talk-wave" aria-hidden="true">{Array.from({ length: 9 }, (_, i) => <i key={i} style={{ '--i': i }} />)}</span>
          <span><strong>Talk to Jarvis</strong><small>Hands-free · {languageInfo(lang).name}</small></span>
          <span className="cc-talk-wave" aria-hidden="true">{Array.from({ length: 9 }, (_, i) => <i key={i} style={{ '--i': 8 - i }} />)}</span>
        </button>
        <div className="cc-bar-end">
          <small className="cc-updated">{updated ? `Updated ${Math.max(0, Math.round((now - updated) / 1000))}s ago` : ''}{error ? ' · reconnecting…' : ''}</small>
          <button type="button" className="cc-btn" onClick={() => onAsk?.(BRIEFING, true)}><Icon name="briefcase" size="1em" /> Executive briefing</button>
        </div>
      </footer>
    </div>
  );
}
