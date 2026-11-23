import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../api.js';
import { Icon } from '../icons.jsx';
import { toast } from '../ui.jsx';
import { GITHUB_USER, LIVE_APPS } from '../siteLinks.js';
import AiOffline, { isAiDown } from './AiOffline.jsx';
import './ProjectHQ.css';

// Project HQ: every project the user owns (live sites, APIs, repositories) checked for real from one
// place (backend app/projects). Each number comes from a measurement or a named source; a check that
// can't run (no key, rate-limited, offline) says so. Nothing is deployed or changed from here.

const STATE = { healthy: ['Healthy', 'ok'], warning: ['Warning', 'warn'], critical: ['Critical', 'bad'], unknown: ['Not checked', 'muted'] };
const SEV = ['critical', 'high', 'medium', 'low', 'info'];
const AREAS = { uptime: 'Uptime', security: 'Security', seo: 'SEO', mobile: 'Mobile', accessibility: 'Accessibility', performance: 'Performance', google: 'Google', api: 'API', ci: 'CI' };
const PLATFORM = { vercel: 'Vercel', streamlit: 'Streamlit', render: 'Render', netlify: 'Netlify', local: 'This PC', railway: 'Railway' };
const PARALLEL = 4;

const ago = (t) => {
  if (!t) return 'never';
  const s = Math.max(0, Date.now() / 1000 - (typeof t === 'number' ? t : Date.parse(t) / 1000));
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} h ago`;
  return `${Math.floor(s / 86400)} d ago`;
};
const findingsOf = (st) => ['site', 'seo', 'assets', 'api', 'github', 'pagespeed'].flatMap((k) => (st?.[k]?.findings || []).map((f) => ({ ...f, part: k })));
const tone = (v, good = 90, ok = 50) => (v == null ? 'muted' : v >= good ? 'ok' : v >= ok ? 'warn' : 'bad');

function Ring({ value, label }) {
  const r = 22;
  const c = 2 * Math.PI * r;
  return (
    <div className={`hq-ring t-${tone(value, 85, 60)}`} title={label}>
      <svg viewBox="0 0 54 54" aria-hidden="true">
        <circle cx="27" cy="27" r={r} className="tr" />
        <circle cx="27" cy="27" r={r} className="va" strokeDasharray={`${((value ?? 0) / 100) * c} ${c}`} transform="rotate(-90 27 27)" />
      </svg>
      <b>{value ?? '—'}</b>
    </div>
  );
}

function Metric({ label, value, t = 'muted', title }) {
  return <div className={`hq-metric t-${t}`} title={title}><small>{label}</small><b>{value}</b></div>;
}

function Card({ p, busy, onCheck, onLighthouse, onTests, onOpen, local }) {
  const st = p.status || {};
  const site = st.site;
  const seo = st.seo;
  const ps = st.pagespeed;
  const gh = st.github;
  const api = st.api;
  const [label, t] = STATE[p.health.state] || STATE.unknown;
  const checked = Math.max(...['site', 'api', 'github', 'seo'].map((k) => st[k]?.checked_at || 0));
  const ci = gh?.ci?.conclusion;
  return (
    <article className={`hq-card s-${p.health.state}`}>
      <header>
        <Ring value={p.health.score} label="Health score from the latest checks" />
        <div className="ttl">
          <b>{p.name}</b>
          <small>{p.description}</small>
          <span className="tags">
            {p.platform && <i>{PLATFORM[p.platform] || p.platform}</i>}
            {p.stack && <i>{p.stack}</i>}
            <i className={`st t-${t}`}>{busy ? 'Checking…' : label}</i>
          </span>
        </div>
      </header>
      <div className="hq-metrics">
        {p.kind === 'web' && <Metric label="Status" value={site ? (site.up ? site.status : 'Down') : '—'} t={site ? (site.up ? 'ok' : 'bad') : 'muted'} />}
        {p.kind === 'web' && <Metric label="First byte" value={site?.ttfb_ms != null ? `${site.ttfb_ms} ms` : '—'} t={site?.ttfb_ms == null ? 'muted' : site.ttfb_ms < 800 ? 'ok' : site.ttfb_ms < 1800 ? 'warn' : 'bad'} />}
        {p.kind === 'web' && <Metric label="SEO" value={seo?.score ?? '—'} t={tone(seo?.score)} />}
        {p.kind === 'web' && <Metric label="Lighthouse" value={ps?.scores?.performance ?? '—'} t={tone(ps?.scores?.performance)} title={ps ? `${ps.strategy} · ${ago(ps.checked_at)}` : 'Run Lighthouse'} />}
        {p.kind === 'api' && <Metric label="API" value={api ? (api.up === null ? 'on PC' : api.up ? `${api.status}` : 'Down') : '—'} t={!api || api.up === null ? 'muted' : api.up ? 'ok' : 'bad'} />}
        {p.kind === 'api' && <Metric label="Latency" value={api?.ms != null ? `${api.ms} ms` : '—'} t={api?.ms == null ? 'muted' : api.ms < 800 ? 'ok' : 'warn'} />}
        {p.kind === 'web' && <Metric label="TLS" value={site?.tls ? `${site.tls.days_left} d` : '—'} t={!site?.tls ? 'muted' : site.tls.days_left > 20 ? 'ok' : 'bad'} title="Days until the HTTPS certificate expires" />}
        {p.repo && <Metric label="CI" value={gh ? (gh.error ? '?' : ci || gh.ci?.status || 'none') : '—'} t={ci === 'success' ? 'ok' : ci === 'failure' ? 'bad' : 'muted'} title={gh?.error || gh?.ci?.commit || ''} />}
      </div>
      <footer>
        <small className="muted">Checked {ago(checked)}</small>
        <div className="hq-actions">
          {p.url && p.kind === 'web' && <a className="hq-btn icon" href={p.url} target="_blank" rel="noreferrer" title="Open live project" aria-label={`Open ${p.name}`}><Icon name="external" size="1em" /></a>}
          {p.repo && <a className="hq-btn icon" href={`https://github.com/${p.repo}`} target="_blank" rel="noreferrer" title="Open GitHub repository" aria-label={`Open ${p.name} on GitHub`}><Icon name="github" size="1em" /></a>}
          {p.kind === 'web' && <button type="button" className="hq-btn" onClick={() => onLighthouse(p)} disabled={!!busy}>Lighthouse</button>}
          {local && p.local_path && <button type="button" className="hq-btn" onClick={() => onTests(p)} disabled={!!busy}>Run tests</button>}
          <button type="button" className="hq-btn" onClick={() => onOpen(p)}>Details</button>
          <button type="button" className="hq-btn primary" onClick={() => onCheck(p)} disabled={!!busy}>{busy === 'check' ? <span className="hq-spin" /> : 'Check'}</button>
        </div>
      </footer>
    </article>
  );
}

function TestsPanel({ job, onCancel }) {
  if (!job) return null;
  const running = job.status === 'queued' || job.status === 'running';
  return (
    <section className="hq-sec">
      <h4>Tests on this PC {running && <span className="hq-spin" />} <small>{job.result?.summary || job.status}</small>
        {running && <button type="button" className="hq-btn danger sm" onClick={onCancel}>Stop</button>}</h4>
      <ol className="hq-steps">
        {job.steps.map((s, i) => <li key={i} className={`st-${s.status}`}><b>{s.label}</b> <small>{s.detail || s.status}</small></li>)}
      </ol>
      {(job.result?.results || []).filter((r) => !r.ok).map((r) => (
        <details key={r.command} open><summary>{r.command}: last output</summary><pre className="hq-pre">{r.tail}</pre></details>
      ))}
      {job.error && <p className="t-bad">{job.error}</p>}
    </section>
  );
}

function Drawer({ p, job, onClose, onEdit, onDelete, onCancelJob }) {
  const st = p.status || {};
  const f = findingsOf(st).filter((x) => x.severity !== 'ok').sort((a, b) => SEV.indexOf(a.severity) - SEV.indexOf(b.severity));
  const seo = st.seo;
  const ps = st.pagespeed;
  const gh = st.github;
  const loc = st.local;
  const groups = Object.entries(f.reduce((m, x) => ((m[x.area || x.part] ||= []).push(x), m), {}));
  return (
    <div className="hq-drawer" role="dialog" aria-modal="true" aria-labelledby="hq-d-title" onKeyDown={(e) => e.key === 'Escape' && onClose()}>
      <div className="hq-drawer-card">
        <header>
          <div><h3 id="hq-d-title">{p.name}</h3><small>{p.url || p.repo}</small></div>
          <div className="hq-actions">
            <button type="button" className="hq-btn sm" onClick={() => onEdit(p)}>Edit</button>
            <button type="button" className="hq-btn sm danger" onClick={() => onDelete(p)}>Remove</button>
            <button type="button" className="hq-btn icon" onClick={onClose} aria-label="Close"><Icon name="x" size="1em" /></button>
          </div>
        </header>
        <TestsPanel job={job} onCancel={onCancelJob} />
        <section className="hq-sec">
          <h4>Findings <small>{f.length ? `${f.length} to look at` : st.site || st.api ? 'nothing to fix' : 'not checked yet'}</small></h4>
          {groups.map(([area, list]) => (
            <div key={area} className="hq-group">
              <h5>{AREAS[area] || area}</h5>
              <ul className="hq-findings">
                {list.map((x, i) => (
                  <li key={i} className={`sv-${x.severity}`}>
                    <i>{x.severity}</i>
                    <div><b>{x.title}</b>{x.detail && <small>{x.detail}</small>}{x.fix && <small className="fix">→ {x.fix}</small>}</div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </section>
        {seo && (
          <section className="hq-sec">
            <h4>SEO &amp; Google <small>score {seo.score}</small></h4>
            <dl className="hq-kv">
              <div><dt>Title</dt><dd>{seo.title || '—'}</dd></div>
              <div><dt>Description</dt><dd>{seo.description || '—'}</dd></div>
              <div><dt>Canonical</dt><dd>{seo.canonical || '—'}</dd></div>
              <div><dt>Structured data</dt><dd>{seo.jsonld_types?.join(', ') || 'none'}</dd></div>
              <div><dt>Sitemap</dt><dd>{seo.sitemap ? `${seo.sitemap_urls} URLs` : 'not found'} · robots.txt {seo.robots_txt ? 'yes' : 'no'}</dd></div>
              <div><dt>Links checked</dt><dd>{seo.links_checked} internal, {seo.broken_links?.length || 0} broken</dd></div>
              <div><dt>Search Console tag</dt><dd>{seo.google_verification ? 'present' : 'not in the page'}</dd></div>
              <div><dt>Google Analytics 4</dt><dd>{seo.ga4_ids?.length ? seo.ga4_ids.join(', ') : 'no tag found'}</dd></div>
            </dl>
          </section>
        )}
        {ps && (
          <section className="hq-sec">
            <h4>Lighthouse <small>{ps.strategy} · {ago(ps.checked_at)} · Google PageSpeed Insights</small></h4>
            <div className="hq-scores">{Object.entries(ps.scores).map(([k, v]) => <Metric key={k} label={k.replace('-', ' ')} value={v} t={tone(v)} />)}</div>
            <p className="small muted">Lab: LCP {ps.lab.lcp} · TBT {ps.lab.tbt} · CLS {ps.lab.cls} · FCP {ps.lab.fcp}</p>
            {ps.field ? <p className="small">Real users (CrUX, 28 days): {Object.entries(ps.field).map(([k, v]) => `${k.toUpperCase()} p75 ${v.p75} (${v.category?.toLowerCase()})`).join(' · ')}</p>
              : <p className="small muted">No real-user data: the site has too little Chrome traffic for the CrUX report.</p>}
          </section>
        )}
        {gh && (
          <section className="hq-sec">
            <h4>GitHub {gh.url && <a href={gh.url} target="_blank" rel="noreferrer" className="small">{gh.full_name}</a>}</h4>
            {gh.error ? <p className="t-warn small">{gh.error}</p> : (
              <dl className="hq-kv">
                <div><dt>Last push</dt><dd>{ago(gh.pushed_at)} on {gh.default_branch}</dd></div>
                <div><dt>Latest CI run</dt><dd>{gh.ci ? <a href={gh.ci.url} target="_blank" rel="noreferrer">{gh.ci.name}: {gh.ci.conclusion || gh.ci.status}</a> : 'no GitHub Actions runs'}{gh.ci?.commit ? ` · “${gh.ci.commit}”` : ''}</dd></div>
                <div><dt>Open issues</dt><dd>{gh.open_issues}</dd></div>
              </dl>
            )}
          </section>
        )}
        {loc && (
          <section className="hq-sec">
            <h4>On this PC <small>{p.local_path}</small></h4>
            <dl className="hq-kv">
              <div><dt>Branch</dt><dd>{loc.branch} · last commit {loc.last_commit} {ago(loc.last_commit_at)}: “{loc.last_message}”</dd></div>
              <div><dt>Uncommitted</dt><dd>{loc.uncommitted ? `${loc.uncommitted} file(s): ${loc.uncommitted_files.join(', ')}` : 'clean'}</dd></div>
              <div><dt>Test commands</dt><dd>{loc.commands?.join(' · ') || 'none found'}</dd></div>
            </dl>
          </section>
        )}
      </div>
    </div>
  );
}

const EMPTY = { name: '', description: '', kind: 'web', platform: 'vercel', url: '', health_url: '', repo: '', local_path: '', stack: '' };

function ProjectForm({ initial, onSave, onCancel }) {
  const [f, setF] = useState({ ...EMPTY, ...(initial || {}) });
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  return (
    <div className="hq-drawer" role="dialog" aria-modal="true" aria-labelledby="hq-f-title">
      <form className="hq-drawer-card hq-form" onSubmit={(e) => { e.preventDefault(); onSave(f); }}>
        <h3 id="hq-f-title">{initial ? 'Edit project' : 'Add a project'}</h3>
        <label><span>Name</span><input value={f.name} onChange={set('name')} required maxLength={80} /></label>
        <label><span>Description</span><input value={f.description} onChange={set('description')} maxLength={200} /></label>
        <div className="row">
          <label><span>Kind</span><select value={f.kind} onChange={set('kind')}><option value="web">Website</option><option value="api">API</option><option value="repo">Repository only</option></select></label>
          <label><span>Hosting</span><select value={f.platform} onChange={set('platform')}>{Object.entries(PLATFORM).map(([k, v]) => <option key={k} value={k}>{v}</option>)}<option value="">Other</option></select></label>
        </div>
        <label><span>Live URL</span><input value={f.url} onChange={set('url')} placeholder="https://…" type="url" /></label>
        {f.kind === 'api' && <label><span>Health URL</span><input value={f.health_url} onChange={set('health_url')} placeholder="https://…/api/health" type="url" /></label>}
        <label><span>GitHub repository</span><input value={f.repo} onChange={set('repo')} placeholder="owner/name" pattern="[\w.\-]+/[\w.\-]+" /></label>
        <label><span>Folder in this repository (for tests)</span><input value={f.local_path} onChange={set('local_path')} placeholder="e.g. frontend" /></label>
        <label><span>Stack</span><input value={f.stack} onChange={set('stack')} placeholder="React · Vite" /></label>
        <div className="hq-actions"><button type="button" className="hq-btn" onClick={onCancel}>Cancel</button><button className="hq-btn primary">Save</button></div>
      </form>
    </div>
  );
}

export default function ProjectHQ() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState({}); // id -> 'check' | 'lighthouse'
  const [filter, setFilter] = useState('all');
  const [open, setOpen] = useState(null);
  const [form, setForm] = useState(null); // {initial?}
  const [jobs, setJobs] = useState({}); // project id -> job
  const polls = useRef({});

  const load = useCallback(() => api.projects().then((d) => { setData(d); setError(''); }).catch((e) => setError(e.message)), []);
  useEffect(() => {
    load();
    const ps = polls.current;
    return () => Object.values(ps).forEach(clearInterval);
  }, [load]);
  const replace = (p) => setData((d) => ({ ...d, projects: d.projects.map((x) => (x.id === p.id ? p : x)) }));
  const mark = (id, v) => setBusy((b) => ({ ...b, [id]: v }));

  const check = async (p) => {
    mark(p.id, 'check');
    try {
      replace(await api.projectCheck(p.id));
    } catch (e) {
      toast(`${p.name}: ${e.message}`, 'error');
    } finally {
      mark(p.id, null);
    }
  };
  const checkAll = async () => {
    const queue = [...data.projects];
    const worker = async () => {
      while (queue.length) await check(queue.shift());
    };
    await Promise.all(Array.from({ length: PARALLEL }, worker));
    toast('All projects checked.');
  };
  const lighthouse = async (p) => {
    mark(p.id, 'lighthouse');
    toast(`Lighthouse on ${p.name}: about 30–60 seconds…`);
    try {
      replace(await api.projectPagespeed(p.id, 'mobile'));
    } catch (e) {
      toast(e.message, 'error');
    } finally {
      mark(p.id, null);
    }
  };
  const poll = (pid, jobId) => {
    clearInterval(polls.current[pid]);
    polls.current[pid] = setInterval(async () => {
      try {
        const j = await api.projectJob(jobId);
        setJobs((js) => ({ ...js, [pid]: j }));
        if (!['queued', 'running'].includes(j.status)) {
          clearInterval(polls.current[pid]);
          toast(`Tests for ${pid}: ${j.result?.summary || j.status}`, j.result?.findings?.some((f) => f.severity === 'high') ? 'error' : 'ok');
        }
      } catch {
        clearInterval(polls.current[pid]);
      }
    }, 1500);
  };
  const tests = async (p) => {
    try {
      const j = await api.projectTests(p.id);
      setJobs((js) => ({ ...js, [p.id]: j }));
      setOpen(p);
      poll(p.id, j.id);
    } catch (e) {
      toast(e.message, 'error');
    }
  };
  const save = async (f) => {
    try {
      if (form.initial) await api.projectEdit(form.initial.id, f);
      else await api.projectAdd(f);
      setForm(null);
      setOpen(null);
      load();
    } catch (e) {
      toast(e.message, 'error');
    }
  };
  const remove = async (p) => {
    try {
      await api.projectDelete(p.id);
      setOpen(null);
      load();
      toast(`${p.name} removed from Project HQ (the project itself is untouched).`);
    } catch (e) {
      toast(e.message, 'error');
    }
  };

  if (!data) {
    if (error && isAiDown(error)) {
      return (
        <div className="hq">
          <header className="hq-head"><div><h1>Project HQ</h1><p>Your live sites, APIs and repositories, checked for real.</p></div></header>
          <AiOffline message={error} what="Checking your projects" onReady={load} />
          <section className="hq-offline">
            <h3>Your live projects <small>links work now; health checks start once the AI service is on</small></h3>
            <div className="hq-grid">
              {LIVE_APPS.map((a) => (
                <article key={a.href} className="hq-card s-unknown">
                  <header><div className="ttl"><b>{a.label}</b><small>{a.short}</small><span className="tags"><i>{a.platform}</i><i className="st t-muted">Not checked</i></span></div></header>
                  <footer>
                    <small className="muted">{new URL(a.href).hostname}</small>
                    <div className="hq-actions">
                      <a className="hq-btn" href={a.href} target="_blank" rel="noreferrer"><Icon name="external" size="1em" /> Open</a>
                      {a.repo && <a className="hq-btn" href={`https://github.com/${GITHUB_USER}/${a.repo}`} target="_blank" rel="noreferrer"><Icon name="github" size="1em" /> GitHub</a>}
                    </div>
                  </footer>
                </article>
              ))}
            </div>
          </section>
        </div>
      );
    }
    return <div className="hq">{error ? <p className="t-bad"><Icon name="alert" size="1em" /> {error} <button type="button" className="hq-btn sm" onClick={load}>Try again</button></p> : <p className="muted"><span className="hq-spin" /> Loading projects…</p>}</div>;
  }
  const counts = data.projects.reduce((m, p) => ((m[p.health.state] = (m[p.health.state] || 0) + 1), m), {});
  const shown = data.projects.filter((p) => filter === 'all' || p.health.state === filter);
  const gaSites = data.projects.filter((p) => p.status?.seo?.ga4_ids?.length).length;
  const gscSites = data.projects.filter((p) => p.status?.seo?.google_verification).length;
  const webSites = data.projects.filter((p) => p.status?.seo).length;
  const opened = open && data.projects.find((p) => p.id === open.id);

  return (
    <div className="hq">
      <header className="hq-head">
        <div>
          <h1>Project HQ</h1>
          <p>Your live sites, APIs and repositories, checked for real: uptime, security headers, SEO, Lighthouse, CI and tests.</p>
        </div>
        <div className="hq-actions">
          <button type="button" className="hq-btn" onClick={() => setForm({})}><Icon name="plus" size="1em" /> Add project</button>
          <button type="button" className="hq-btn primary" onClick={checkAll} disabled={Object.values(busy).some(Boolean)}>
            {Object.values(busy).some(Boolean) ? <><span className="hq-spin" /> Checking…</> : <><Icon name="refresh" size="1em" /> Check all</>}
          </button>
        </div>
      </header>

      <div className="hq-summary" role="group" aria-label="Filter by status">
        {['all', 'healthy', 'warning', 'critical', 'unknown'].map((s) => (
          <button key={s} type="button" aria-pressed={filter === s} className={`t-${s === 'all' ? 'all' : STATE[s][1]}`} onClick={() => setFilter(s)}>
            <b>{s === 'all' ? data.projects.length : counts[s] || 0}</b><small>{s === 'all' ? 'All projects' : STATE[s][0]}</small>
          </button>
        ))}
      </div>

      <div className="hq-connect">
        <span><i className={`dot ${data.keys.pagespeed ? 'on' : ''}`} /> Lighthouse: {data.keys.pagespeed ? 'API key set' : 'shared Google quota (add PAGESPEED_API_KEY if it runs out)'}</span>
        <span><i className={`dot ${data.keys.github ? 'on' : ''}`} /> GitHub: {data.keys.github ? 'token set' : 'public API, 60 checks/hour'}</span>
        <span><i className="dot" /> Search Console &amp; GA4 reports: not connected (needs Google sign-in). Tags found: GA4 on {gaSites}/{webSites}, verification on {gscSites}/{webSites} checked sites.</span>
      </div>

      <div className="hq-grid">
        {shown.map((p) => (
          <Card key={p.id} p={p} busy={busy[p.id]} local={data.local} onCheck={check} onLighthouse={lighthouse} onTests={tests} onOpen={setOpen} />
        ))}
      </div>
      {shown.length === 0 && <p className="muted">No projects in this state.</p>}

      {opened && <Drawer p={opened} job={jobs[opened.id]} onClose={() => setOpen(null)} onEdit={(p) => setForm({ initial: p })} onDelete={remove}
        onCancelJob={() => jobs[opened.id] && api.projectJobCancel(jobs[opened.id].id).catch(() => {})} />}
      {form && <ProjectForm initial={form.initial} onSave={save} onCancel={() => setForm(null)} />}
    </div>
  );
}
