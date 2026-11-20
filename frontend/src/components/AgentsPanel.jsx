import { useCallback, useEffect, useState } from 'react';
import { api } from '../api.js';
import { Icon } from '../icons.jsx';
import { PageHeader, toast } from '../ui.jsx';
import MarkdownView from './MarkdownView.jsx';
import './AgentsPanel.css';

// Agents: one instruction → a plan → specialist agents running in parallel → verification →
// your approval for anything that acts for you. Backend: app/orchestrator (runner.py).

const ACTIVE = new Set(['planning', 'running', 'paused', 'verifying']);
const STATUS = {
  planning: ['Planning', 'clock'], running: ['Running', 'pulse'], paused: ['Paused', 'stop'], verifying: ['Checking results', 'shield'],
  done: ['Done', 'check'], done_with_errors: ['Done with problems', 'alert'], needs_approval: ['Needs your approval', 'bell'],
  failed: ['Failed', 'alert'], cancelled: ['Cancelled', 'x'],
  queued: ['Queued', 'clock'], skipped: ['Skipped', 'alert'], approved: ['Approved', 'check'], rejected: ['Rejected', 'x'], pending: ['Waiting', 'bell'],
};
const EXAMPLES = [
  'Prepare my job application for AI/ML Engineer roles: find relevant vacancies, match them to my skills, draft an email to recruiters, and remind me tomorrow at 10 am to follow up.',
  'Research the three best open-source vector databases, compare them in a table, and save my preferred one to memory.',
  'Check my PC health, find files named resume, and add a task to clean up my Downloads folder this weekend.',
];
const TOOL_LABEL = {
  compose_email: 'Open an email draft', open_website: 'Open a website', open_file: 'Open a file', system_control: 'Control this PC',
  copy_to_clipboard: 'Copy to the clipboard', add_contact: 'Save a contact',
};

const ago = (t) => {
  const s = Math.round(Date.now() / 1000 - t);
  return s < 60 ? 'just now' : s < 3600 ? `${Math.round(s / 60)} min ago` : `${Math.round(s / 3600)} h ago`;
};

function Badge({ status }) {
  const [label, icon] = STATUS[status] || [status, 'help'];
  return <span className={`ag-badge st-${status}`}><Icon name={icon} size="0.9em" /> {label}</span>;
}

/** What an approval will do, in plain words (the email itself for drafts). */
function ApprovalBody({ a }) {
  if (a.tool === 'compose_email') {
    return (
      <div className="ag-email">
        <p><b>To:</b> {a.input.to || '(you choose)'}</p>
        <p><b>Subject:</b> {a.input.subject}</p>
        <pre>{a.input.body}</pre>
      </div>
    );
  }
  return <pre className="ag-json">{JSON.stringify(a.input, null, 2)}</pre>;
}

function RunView({ run, onChange }) {
  const [busy, setBusy] = useState('');
  const act = async (key, fn) => {
    setBusy(key);
    try {
      onChange(await fn());
    } catch (e) {
      toast(e.message || 'That did not work.', 'error');
    } finally {
      setBusy('');
    }
  };
  const pending = run.approvals.filter((a) => a.status === 'pending');
  const active = ACTIVE.has(run.status);
  return (
    <article className="ag-run">
      <header className="ag-run-head">
        <div className="grow">
          <Badge status={run.status} />
          <h2>{run.instruction}</h2>
          {run.summary && <p className="muted">{run.summary}</p>}
          {run.error && <p className="ag-error" role="alert"><Icon name="alert" size="1em" /> {run.error}</p>}
        </div>
        <div className="ag-controls">
          {run.status === 'running' && <button type="button" className="btn sm" disabled={!!busy} onClick={() => act('pause', () => api.runAction(run.id, 'pause'))}><Icon name="stop" size="1em" /> Pause</button>}
          {run.status === 'paused' && <button type="button" className="btn sm" disabled={!!busy} onClick={() => act('resume', () => api.runAction(run.id, 'resume'))}><Icon name="play" size="1em" /> Resume</button>}
          {active && <button type="button" className="btn sm ghost" disabled={!!busy} onClick={() => act('cancel', () => api.runAction(run.id, 'cancel'))}><Icon name="x" size="1em" /> Cancel</button>}
        </div>
      </header>

      <ol className="ag-flow" aria-label="How this request is being handled">
        <li className={`ag-stage ${run.status === 'planning' ? 'now' : 'done'}`}>
          <span className="ag-stage-dot"><Icon name="brain" size="1em" /></span>
          <div><strong>Orchestrator</strong><small>{run.status === 'planning' ? 'Understanding and planning…' : `Planned ${run.subtasks.length} subtask${run.subtasks.length === 1 ? '' : 's'}`}</small></div>
        </li>
        <li className="ag-agents-wrap">
          <div className="ag-agents">
            {run.subtasks.map((s) => (
              <section key={s.id} className={`ag-agent st-${s.status}`}>
                <header>
                  <span className="ag-agent-name">{s.agent_name}</span>
                  <Badge status={s.status} />
                </header>
                <strong>{s.title}</strong>
                <small className="muted">
                  {s.depends_on.length ? `After ${s.depends_on.map((d) => run.subtasks.find((x) => x.id === d)?.title || d).join(', ')}` : 'Parallel task'}
                  {s.seconds != null && ` · ${s.seconds}s`}
                  {s.attempts > 1 && ` · ${s.attempts} attempts`}
                </small>
                {s.status === 'running' && <div className="ag-progress"><i /></div>}
                {(s.output || s.error) && (
                  <details>
                    <summary>{s.error ? 'What went wrong' : 'Result'}</summary>
                    {s.error ? <p className="ag-error">{s.error}</p> : <MarkdownView source={s.output} />}
                    {s.tools.length > 0 && <p className="muted small">Tools: {s.tools.join(', ')}</p>}
                  </details>
                )}
                {(s.status === 'failed' || s.status === 'skipped') && !active && (
                  <button type="button" className="btn sm" disabled={!!busy} onClick={() => act(`retry-${s.id}`, () => api.retrySubtask(run.id, s.id))}><Icon name="refresh" size="1em" /> Retry</button>
                )}
              </section>
            ))}
          </div>
        </li>
        <li className={`ag-stage ${run.status === 'verifying' ? 'now' : run.report ? 'done' : ''}`}>
          <span className="ag-stage-dot"><Icon name="shield" size="1em" /></span>
          <div><strong>Verification and results</strong><small>{run.status === 'verifying' ? 'Combining outputs and checking for errors…' : run.report ? 'Checked' : 'After the agents finish'}</small></div>
        </li>
      </ol>

      {run.report && <section className="ag-report"><MarkdownView source={run.report} /></section>}

      {run.approvals.length > 0 && (
        <section className="ag-approvals">
          <h3><Icon name="bell" size="1em" /> Prepared for your approval{pending.length ? ` (${pending.length} waiting)` : ''}</h3>
          <p className="muted small">These have not happened. Approve to do one now, or reject it.</p>
          {run.approvals.map((a) => (
            <div key={a.id} className={`ag-approval st-${a.status}`}>
              <header><strong>{TOOL_LABEL[a.tool] || a.tool}</strong><Badge status={a.status} /></header>
              <ApprovalBody a={a} />
              {a.status === 'pending' ? (
                <div className="row wrap">
                  <button type="button" className="btn primary sm" disabled={!!busy} onClick={() => act(`ok-${a.id}`, () => api.decideApproval(run.id, a.id, true))}><Icon name="check" size="1em" /> Approve</button>
                  <button type="button" className="btn sm" disabled={!!busy} onClick={() => act(`no-${a.id}`, () => api.decideApproval(run.id, a.id, false))}><Icon name="x" size="1em" /> Reject</button>
                </div>
              ) : a.result && <p className="muted small">Result: {a.result.slice(0, 300)}</p>}
            </div>
          ))}
        </section>
      )}
    </article>
  );
}

export default function AgentsPanel({ initialInstruction = '' }) {
  const [text, setText] = useState(initialInstruction);
  const [runs, setRuns] = useState(null);
  const [current, setCurrent] = useState(null);
  const [error, setError] = useState('');
  const [starting, setStarting] = useState(false);

  const loadRuns = useCallback(() => api.orchestratorRuns().then((r) => { setRuns(r); setError(''); return r; }).catch((e) => { setError(e.message || 'The AI service is not reachable.'); setRuns([]); return []; }), []);
  useEffect(() => {
    loadRuns().then((r) => r[0] && setCurrent((c) => c ?? r[0]));
  }, [loadRuns]);
  // Follow the open run live while it works.
  useEffect(() => {
    if (!current || !ACTIVE.has(current.status)) return undefined;
    const id = setInterval(() => api.orchestratorRun(current.id).then((r) => { setCurrent(r); if (!ACTIVE.has(r.status)) loadRuns(); }).catch(() => {}), 1500);
    return () => clearInterval(id);
  }, [current?.id, current?.status, loadRuns]);

  const start = async (e) => {
    e?.preventDefault();
    if (text.trim().length < 3) return;
    setStarting(true);
    try {
      const run = await api.startRun(text.trim());
      setCurrent(run);
      setText('');
      loadRuns();
    } catch (err) {
      toast(err.message || 'Could not start the run.', 'error');
    } finally {
      setStarting(false);
    }
  };
  const changed = (run) => {
    setCurrent(run);
    loadRuns();
  };

  return (
    <div className="panel ag">
      <PageHeader icon="target" hue={190} title="Agents" subtitle="Give one instruction. Azarvis plans it, runs specialist agents in parallel, checks the results, and asks before anything acts for you." />

      <form className="ag-compose" onSubmit={start}>
        <textarea value={text} onChange={(e) => setText(e.target.value)} rows={3} placeholder="Describe everything you need done, in one go…" aria-label="Instruction for the agents"
          onKeyDown={(e) => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) start(e); }} />
        <div className="row wrap">
          <button type="submit" className="btn primary" disabled={starting || text.trim().length < 3}><Icon name="rocket" size="1em" /> {starting ? 'Starting…' : 'Run with agents'}</button>
          <span className="muted small">Ctrl + Enter. Up to 3 agents work at once; sending, opening or changing anything waits for your approval.</span>
        </div>
        <div className="ag-examples">
          {EXAMPLES.map((x) => <button key={x} type="button" className="chip" onClick={() => setText(x)}>{x.split(':')[0].slice(0, 60)}</button>)}
        </div>
      </form>

      {error && <p className="ag-error" role="alert"><Icon name="alert" size="1em" /> {error}</p>}

      <div className="ag-layout">
        <aside className="ag-list" aria-label="Your runs">
          <h3>Runs</h3>
          {runs === null && <p className="muted small">Loading…</p>}
          {runs?.length === 0 && <p className="muted small">No runs yet. Your runs stay here while Azarvis is running.</p>}
          {runs?.map((r) => (
            <button key={r.id} type="button" className={`ag-list-item ${current?.id === r.id ? 'on' : ''}`} onClick={() => setCurrent(r)}>
              <Badge status={r.status} />
              <span>{r.instruction}</span>
              <small className="muted">{r.subtasks.length} subtasks · {ago(r.created_at)}</small>
            </button>
          ))}
        </aside>
        {current ? <RunView key={current.id} run={current} onChange={changed} /> : (
          <div className="ag-empty">
            <Icon name="target" size="2em" />
            <p>Start a run above. You'll see each agent's progress, a checked summary, and anything waiting for your approval.</p>
          </div>
        )}
      </div>
    </div>
  );
}
