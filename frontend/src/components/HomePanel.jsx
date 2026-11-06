import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { readAlertsAloud, setReadAlertsAloud } from '../alerts.js';
import { api } from '../api.js';
import { useNow, useVisibleInterval } from '../hooks.js';
import { Icon } from '../icons.jsx';
import { speechSupported } from '../useSpeech.js';
import { applyVoice, currentVoice } from '../voiceSettings.js';
import { AiNotice, aiProblemOf } from './AiNotice.jsx';
import './HomePanel.css';

// Command Center: the first screen after sign-in. Everything on it is live data from the
// Express API and the AI service (health, tasks, reminders, notifications, memories, stats).
// Each command has its own accent color (--hue on the tile).
const COMMANDS = [
  { icon: 'plus', hue: 190, label: 'New task', hint: 'Add to your list', prompt: 'Add a task: ' },
  { icon: 'alarm', hue: 38, label: 'Set a reminder', hint: 'Any time, any day', prompt: 'Remind me to ' },
  { icon: 'weather', hue: 205, label: 'Weather today', hint: 'Mumbai forecast', prompt: "What's the weather in Mumbai today?", send: true },
  { icon: 'search', hue: 265, label: 'Search documents', hint: 'Ask your files', tab: 'knowledge' },
  { icon: 'camera', hue: 330, label: 'Analyze a photo', hint: 'Vision AI', tab: 'vision' },
  { icon: 'brain', hue: 290, label: 'What do you remember?', hint: 'Your memory', prompt: 'What do you remember about me?', send: true },
  { icon: 'folder', hue: 150, label: 'Open Downloads', hint: 'On this PC', prompt: 'open my downloads folder', send: true },
  { icon: 'screenshot', hue: 12, label: 'Screenshot', hint: 'Saved to Pictures', prompt: 'take a screenshot', send: true },
];

// Spoken requests you can also tap: each one runs in Chat (or start "Talk to Azarvis" and say it).
const VOICE_COMMANDS = [
  { icon: 'tasks', label: 'Check my tasks', prompt: 'What are my open tasks?', send: true },
  { icon: 'timeline', label: 'Plan my day', prompt: 'Plan my day from my tasks and reminders: what to do first, what to follow up on and what can wait.', send: true },
  { icon: 'alarm', label: 'Read my reminders', prompt: 'What are my reminders for today?', send: true },
  { icon: 'bell', label: 'Catch me up', prompt: 'What needs my attention right now, and what can I ignore?', send: true },
  { icon: 'brain', label: 'Remember something', prompt: 'Remember that ', send: false },
  { icon: 'sparkles', label: 'Explain a topic', prompt: 'Explain in very easy English, with an example: ', send: false },
];
const VOICE_SAMPLE = 'Hello! I am Azarvis. Your voice settings are working.';

/** True while this device is speaking (a reply, a reminder, a voice test). */
function useSpeakingNow() {
  const [speaking, setSpeaking] = useState(false);
  useEffect(() => {
    const synth = window.speechSynthesis;
    if (!synth) return undefined;
    const t = setInterval(() => setSpeaking(synth.speaking && !synth.paused), 300);
    return () => clearInterval(t);
  }, []);
  return speaking;
}

const Wave = ({ on }) => (
  <span className={`cc-wave ${on ? 'on' : ''}`} aria-hidden="true">
    {Array.from({ length: 12 }, (_, i) => <i key={i} style={{ '--i': i }} />)}
  </span>
);

const fmtTime = (iso) => new Date(iso).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
const fmtWhen = (iso) => {
  const d = new Date(iso);
  const sameDay = d.toDateString() === new Date().toDateString();
  return sameDay ? fmtTime(iso) : d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' }) + ' ' + fmtTime(iso);
};
const greeting = (h) => (h < 5 ? 'Working late' : h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening');

// Only this component re-renders every second, not the whole page.
const Clock = memo(function Clock({ name }) {
  const now = useNow(1000);
  return (
    <div className="cc-hello">
      <p className="cc-date">
        <Icon name="clock" size="1em" />
        {now.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
      </p>
      <h1>
        {greeting(now.getHours())}, <span className="cc-grad">{name.split(' ')[0]}</span>
      </h1>
      <strong className="cc-time">{now.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</strong>
    </div>
  );
});

function Ring({ value, max, label, text, hue, warn = false }) {
  const pct = max ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div className="cc-ring-wrap">
      <div className={`cc-ring ${warn ? 'warn' : ''}`} style={{ '--p': pct, '--hue': hue }}>
        <span>{text}</span>
      </div>
      <small>{label}</small>
    </div>
  );
}

function Stat({ icon, hue, value, label, onClick }) {
  return (
    <button className="cc-stat" style={{ '--hue': hue }} onClick={onClick}>
      <span className="cc-badge"><Icon name={icon} /></span>
      <strong>{value}</strong>
      <small>{label}</small>
    </button>
  );
}

const Panel = ({ icon, title, extra, className = '', children }) => (
  <section className={`cc-panel ${className}`}>
    <h4>
      <Icon name={icon} size="1.1em" />
      {title}
      {extra}
    </h4>
    {children}
  </section>
);

export default function HomePanel({ user, conversations, onOpenTab, onAsk, onOpenConversation, onStartSession }) {
  const now = useNow(60_000); // the feed only needs minute precision
  const [health, setHealth] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [notes, setNotes] = useState([]);
  const [memories, setMemories] = useState([]);
  const [stats, setStats] = useState(null);
  const [pc, setPc] = useState(undefined); // undefined = loading, null = not available
  const [problem, setProblem] = useState('');
  const [ask, setAsk] = useState('');
  const [aloud, setAloud] = useState(readAlertsAloud);
  const speaking = useSpeakingNow();

  const loadTasks = useCallback(() => api.tasks(true).then(setTasks), []);

  // Polling stops while the browser tab is hidden and refreshes the moment you come back.
  useVisibleInterval(() => api.health().then(setHealth).catch(() => setHealth({ server: 'down' })), 30_000);
  useVisibleInterval(() => api.systemStatus().then(setPc).catch(() => setPc(null)), 15_000);
  useVisibleInterval(() => {
    Promise.allSettled([
      loadTasks(),
      api.notifications(false).then(setNotes),
      api.memories().then(setMemories),
      api.myStats().then(setStats),
    ]).then((results) => {
      const failed = results.find((r) => r.status === 'rejected');
      setProblem(failed ? failed.reason.message : '');
    });
  }, 60_000);

  const aiUp = health?.ai === 'up';
  const aiProblem = health?.server === 'up' ? aiProblemOf(health) : null;
  const allUp = health?.server === 'up' && !aiProblem;

  const { open, done, unread, timeline, feed, dueToday } = useMemo(() => {
    const open = tasks.filter((t) => !t.done);
    const unread = notes.filter((n) => !n.read);
    // Mission timeline: open tasks with a reminder time first (soonest first), then the rest.
    const timeline = [...open].sort((a, b) => {
      if (a.remind_at && b.remind_at) return new Date(a.remind_at) - new Date(b.remind_at);
      return a.remind_at ? -1 : b.remind_at ? 1 : a.id - b.id;
    });
    // Live feed: overdue reminders, unread notifications, then reminders in the next 24h.
    const soon = now.getTime() + 24 * 3600_000;
    const feed = [
      ...open
        .filter((t) => t.remind_at && new Date(t.remind_at) < now)
        .map((t) => ({ key: `o${t.id}`, tone: 'warn', icon: 'alert', title: `Overdue: ${t.title}`, sub: fmtWhen(t.remind_at) })),
      ...unread.map((n) => ({ key: `n${n.id}`, tone: 'info', icon: 'bell', title: n.title, sub: n.body })),
      ...open
        .filter((t) => t.remind_at && new Date(t.remind_at) >= now && new Date(t.remind_at) <= soon)
        .map((t) => ({ key: `u${t.id}`, tone: 'tip', icon: 'alarm', title: t.title, sub: `Reminder at ${fmtWhen(t.remind_at)}` })),
    ].slice(0, 6);
    const dueToday = open.filter((t) => t.remind_at && new Date(t.remind_at).toDateString() === now.toDateString()).length;
    return { open, done: tasks.length - open.length, unread, timeline, feed, dueToday };
  }, [tasks, notes, now]);

  const complete = (t) => api.toggleTask(t.id, true).then(loadTasks).catch((e) => setProblem(e.message));
  const runCommand = (c) => (c.tab ? onOpenTab(c.tab) : onAsk(c.prompt, Boolean(c.send)));
  const stopSpeaking = () => window.speechSynthesis?.cancel();
  const testVoice = () => {
    const synth = window.speechSynthesis;
    if (!synth) return;
    synth.cancel();
    synth.speak(applyVoice(new SpeechSynthesisUtterance(VOICE_SAMPLE), currentVoice(synth.getVoices(), 'en-IN'), 'en-IN'));
  };
  const toggleAloud = () => {
    setReadAlertsAloud(!aloud);
    setAloud(!aloud);
  };
  const submitAsk = (e) => {
    e.preventDefault();
    if (ask.trim()) onAsk(ask.trim(), true);
  };

  const overview = [
    ['zap', 'AI answers', !aiUp ? 'Offline' : aiProblem ? 'Quick commands only' : 'Ready', !aiProblem],
    ['brain', 'Memory', `${memories.length} facts stored`, true],
    ['mic', 'Voice', speechSupported ? 'Ready to listen' : 'Needs Chrome or Edge', speechSupported],
    ['cpu', 'PC control', health?.systemControl ? 'Apps, files, volume' : 'Off', Boolean(health?.systemControl)],
    ['folder', 'Storage', health?.storage === 'mongo' ? 'MongoDB' : 'Local files', health?.server === 'up'],
  ];

  return (
    <div className="cc">
      <div className="cc-bg" aria-hidden="true" />

      <header className="cc-hero">
        <Clock name={user.name} />
        <div className="cc-hero-side">
          {speechSupported && (
            <div className="cc-start">
              <button className="btn primary cc-start-btn" onClick={() => onStartSession()} title="Azarvis greets you, reads today's reminders and starts listening">
                <Icon name="mic" size="1.1em" /> Start Azarvis
              </button>
              <button className="cc-start-link" onClick={() => onStartSession({ interview: true })}>
                Tell Azarvis about you
              </button>
            </div>
          )}
          <span className={`cc-pill ${health ? (allUp ? 'ok' : 'bad') : ''}`}>
            <i />
            {health ? (allUp ? 'All systems ready' : aiProblem ? 'Needs attention' : 'Partly offline') : 'Checking systems…'}
          </span>
          <span className="cc-operator">
            <span className="cc-avatar">{user.name.slice(0, 1).toUpperCase()}</span>
            <span>
              {user.name}
              <small>{user.role === 'admin' ? 'Administrator' : 'Operator'}</small>
            </span>
          </span>
        </div>
      </header>

      {aiProblem ? (
        <AiNotice problem={aiProblem} className="cc-notice" />
      ) : problem ? (
        <div className="notice danger cc-notice" role="status">
          <span className="notice-icon"><Icon name="alert" /></span>
          <div className="notice-body">
            <strong>Some of your data couldn't load</strong>
            <p>{problem}</p>
          </div>
        </div>
      ) : null}

      <div className="cc-stats">
        <Stat icon="tasks" hue={265} value={open.length} label="Open tasks" onClick={() => onOpenTab('tasks')} />
        <Stat icon="alarm" hue={38} value={dueToday} label="Due today" onClick={() => onOpenTab('tasks')} />
        <Stat icon="bell" hue={190} value={unread.length} label="Unread alerts" onClick={() => onOpenTab('tasks')} />
        <Stat icon="brain" hue={330} value={memories.length} label="Memories" onClick={() => onOpenTab('memory')} />
      </div>

      <div className="cc-row cc-row-main">
        <Panel icon="pulse" title="System status">
          <ul className="cc-overview">
            {overview.map(([icon, name, value, ok]) => (
              <li key={name} className={ok ? 'ok' : 'bad'}>
                <span className="cc-badge sm"><Icon name={icon} /></span>
                <div>
                  <strong>{name}</strong>
                  <small>{value}</small>
                </div>
                <span className="cc-dot" />
              </li>
            ))}
          </ul>
        </Panel>

        <section className="cc-panel cc-core-panel">
          <div className="cc-core">
            <div className="cc-orbit o1" />
            <div className="cc-orbit o2" />
            <div className="cc-orbit o3" />
            <div className="cc-core-text">
              <strong>AZARVIS</strong>
              <small>AI CORE</small>
              <span className={`cc-core-state ${speaking ? 'on' : ''}`} role="status">
                <Wave on={speaking} /> {speaking ? 'Speaking' : 'Ready'}
              </span>
            </div>
          </div>
          <button
            className="cc-talk"
            onClick={() => onAsk('', false, true)}
            disabled={!speechSupported}
            title={speechSupported ? 'Hands-free: say several tasks at once, Azarvis answers out loud' : 'Voice needs Chrome or Edge'}
          >
            <Icon name="mic" /> Talk to Azarvis
          </button>
          <small className="muted">Talk naturally. Interrupt any time, or say “stop” to finish.</small>
          <form className="cc-askbar" onSubmit={submitAsk}>
            <Icon name="sparkles" className="cc-ask-icon" />
            <input
              value={ask}
              onChange={(e) => setAsk(e.target.value)}
              placeholder="Ask or tell Azarvis… “Remind me to pay rent on Friday at 10am”"
              aria-label="Command for Azarvis"
            />
            <button className="cc-go" aria-label="Ask Azarvis">
              <Icon name="send" />
              <span>Ask</span>
            </button>
          </form>
        </section>

        <Panel icon="bell" title="Up next" extra={feed.length > 0 && <span className="cc-live">LIVE</span>}>
          <ul className="cc-feed">
            {feed.length === 0 && (
              <li className="cc-empty">
                <Icon name="check" size="1.6em" />
                You're all caught up. No reminders in the next 24 hours.
              </li>
            )}
            {feed.map((f) => (
              <li key={f.key} className={f.tone}>
                <Icon name={f.icon} />
                <div>
                  <strong>{f.title}</strong>
                  <small>{f.sub}</small>
                </div>
              </li>
            ))}
          </ul>
          <button className="cc-link" onClick={() => onOpenTab('tasks')}>View all tasks <Icon name="chevron" size="1em" /></button>
        </Panel>
      </div>

      <Panel icon="zap" title="Quick actions" className="cc-commands-panel">
        <div className="cc-commands">
          {COMMANDS.map((c) => (
            <button key={c.label} style={{ '--hue': c.hue }} onClick={() => runCommand(c)}>
              <span className="cc-badge"><Icon name={c.icon} /></span>
              <span>
                {c.label}
                <small>{c.hint}</small>
              </span>
            </button>
          ))}
        </div>
      </Panel>

      <div className="cc-row cc-row-voice">
        <Panel icon="mic" title="Voice commands" extra={speechSupported && <span className="cc-live">VOICE</span>}>
          <ul className="cc-voice-cmds">
            {VOICE_COMMANDS.map((c) => (
              <li key={c.label}>
                <button onClick={() => onAsk(c.prompt, c.send)}>
                  <Icon name={c.icon} size="1em" />
                  <span>“{c.label}”</span>
                  <Icon name="chevron" size="0.9em" className="cc-voice-go" />
                </button>
              </li>
            ))}
          </ul>
          <small className="muted">Tap one, or press <strong>Talk to Azarvis</strong> and say it in your own words.</small>
        </Panel>

        <Panel icon="volume" title="Voice & speech">
          <div className={`cc-speech-now ${speaking ? 'on' : ''}`}>
            <Wave on={speaking} />
            <div>
              <strong>{speaking ? 'Azarvis is speaking' : 'Quiet'}</strong>
              <small>{speaking ? 'Talk, or press Stop speaking, to cut it short' : speechSupported ? 'Replies are read aloud in voice mode' : 'Voice needs Chrome or Edge'}</small>
            </div>
          </div>
          <label className="cc-switch">
            <input type="checkbox" checked={aloud} onChange={toggleAloud} />
            <span>Speak reminders and alerts aloud</span>
          </label>
          <div className="cc-speech-actions">
            <button className="btn sm" onClick={testVoice} disabled={!speechSupported}><Icon name="volume" size="1em" /> Test voice</button>
            <button className="btn sm" onClick={() => onOpenTab('account')}><Icon name="edit" size="1em" /> Voice style</button>
          </div>
          <button className="cc-stop" onClick={stopSpeaking} disabled={!speaking}>
            <Icon name="stop" size="1.05em" /> Stop speaking
          </button>
        </Panel>
      </div>

      <div className="cc-row cc-row-cards">
        <Panel icon="timeline" title="Your tasks">
          <ul className="cc-timeline">
            {timeline.length === 0 && <li className="muted">No open tasks. Add one with “New task”.</li>}
            {timeline.slice(0, 6).map((t) => (
              <li key={t.id}>
                <time>{t.remind_at ? fmtWhen(t.remind_at) : 'Anytime'}</time>
                <label>
                  <input type="checkbox" onChange={() => complete(t)} title="Mark done" />
                  {t.title}
                </label>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel icon="brain" title="What Azarvis knows">
          <div className="cc-big">{memories.length}<small>facts Azarvis knows about you</small></div>
          <ul className="cc-mem">
            {memories.slice(0, 3).map((m) => <li key={m.id}><Icon name="sparkles" size="1em" />{m.fact}</li>)}
            {memories.length === 0 && <li className="muted">Tell Azarvis “Remember that…” to add one.</li>}
          </ul>
          <button className="cc-link" onClick={() => onOpenTab('memory')}>View memory <Icon name="chevron" size="1em" /></button>
        </Panel>

        <Panel icon="cpu" title="Your PC">
          {pc === undefined ? (
            <div className="cc-rings">
              {['CPU', 'RAM', 'Disk'].map((l) => <div key={l} className="cc-ring-wrap"><div className="cc-ring skeleton" /><small>{l}</small></div>)}
            </div>
          ) : pc ? (
            <>
              <div className="cc-rings">
                <Ring label="CPU" value={pc.cpu} max={100} text={`${pc.cpu}%`} hue={190} warn={pc.cpu >= 85} />
                <Ring label="RAM" value={pc.ram} max={100} text={`${pc.ram}%`} hue={265} warn={pc.ram >= 85} />
                <Ring label="Disk" value={pc.disk} max={100} text={`${pc.disk}%`} hue={330} warn={pc.disk >= 90} />
              </div>
              <p className="cc-pc-line">
                {pc.disk_free_gb} GB free on C:
                {pc.battery != null && ` · Battery ${pc.battery}%${pc.charging ? ' (charging)' : ''}`}
              </p>
            </>
          ) : (
            <div className="cc-rings">
              <Ring label="Tasks done" value={done} max={tasks.length} hue={150} text={tasks.length ? `${Math.round((done / tasks.length) * 100)}%` : '—'} />
              <Ring label="Messages" value={stats?.total_messages ?? 0} max={100} hue={190} text={stats?.total_messages ?? '—'} />
              <Ring
                label="Avg reply"
                value={stats?.avg_latency_ms ?? 0}
                max={10_000}
                hue={265}
                text={stats?.avg_latency_ms ? `${(stats.avg_latency_ms / 1000).toFixed(1)}s` : '—'}
              />
            </div>
          )}
        </Panel>

        <Panel icon="chat" title="Recent Chats">
          <ul className="cc-chats">
            {conversations.length === 0 && <li className="muted">No chats yet. Ask Azarvis anything.</li>}
            {conversations.slice(0, 5).map((c) => (
              <li key={c._id}>
                <button onClick={() => onOpenConversation(c._id)}>
                  <Icon name="chat" size="1em" />
                  <span>{c.title}</span>
                </button>
              </li>
            ))}
          </ul>
          <button className="cc-link" onClick={() => onOpenTab('chat')}>New chat <Icon name="chevron" size="1em" /></button>
        </Panel>
      </div>
    </div>
  );
}
