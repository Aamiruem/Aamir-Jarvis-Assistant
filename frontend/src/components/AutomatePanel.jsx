import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { Icon } from '../icons.jsx';
import { openUrl } from '../quickCommands.js';
import { readAlertsAloud, setReadAlertsAloud } from '../alerts.js';
import { PageHeader, toast } from '../ui.jsx';

// Automate: one-click automations, your apps, and using Azarvis from your phone.
// Every button here does something real today. What needs an app connection first is labeled
// "Needs connection" and never pretends to work.

// send: true runs it at once; false types it in for you to finish ("…to whom?").
const RECIPES = [
  { icon: 'sun', hue: 38, title: 'Plan my day', body: 'Your tasks and reminders, in the order to do them.', prompt: 'Look at my tasks and reminders and plan my day: what to do first, what to follow up on, and what can wait.', send: true },
  { icon: 'calendar', hue: 265, title: 'Weekly review', body: 'What you finished, what is open, what to focus on next.', prompt: "Review my week: what I finished, what's still open, and the three things I should focus on next week.", send: true },
  { icon: 'megaphone', hue: 330, title: 'Social media plan', body: 'A week of Instagram, LinkedIn and YouTube ideas.', prompt: 'Make a 7-day social media plan for me: for each day one Instagram post idea with a caption, one LinkedIn post idea and one YouTube video idea.', send: true },
  { icon: 'briefcase', hue: 205, title: 'Meeting prep', body: 'Talking points, questions and a follow-up reminder.', prompt: 'Prepare me for a meeting about ', send: false },
  { icon: 'mail', hue: 4, title: 'Answer a customer', body: 'A polite, clear reply, opened in Gmail ready to send.', prompt: 'Write a polite email reply to a customer who asked about ', send: false },
  { icon: 'copy', hue: 160, title: 'Summarize what I copied', body: 'Copy any text, article or email, then click.', prompt: 'Summarize what I copied in five short bullet points.', send: true },
];

// Your apps. "now" works today through Azarvis's tools; "next" needs the app connected first.
const APPS = [
  {
    name: 'Gmail', icon: 'mail', hue: 4,
    now: ['Writes emails and opens them in Gmail, ready to send', 'Finds the address in your contacts'],
    next: 'Reading and sorting your inbox',
    actions: [{ label: 'Write an email', prompt: 'Write an email to ' }],
  },
  {
    name: 'Google Drive', icon: 'drive', hue: 140,
    now: ['Answers questions about files you add to Knowledge', 'Finds and opens files on this PC'],
    next: 'Searching your Drive',
    actions: [{ label: 'Add a document', tab: 'knowledge' }, { label: 'Open Drive', url: 'https://drive.google.com' }],
  },
  {
    name: 'YouTube', icon: 'youtube', hue: 0,
    now: ['Finds and plays videos by voice', 'Writes titles, descriptions and scripts'],
    next: "Your channel's stats and comments",
    actions: [{ label: 'Write a description', prompt: 'Write a YouTube title, description and tags for a video about ' }, { label: 'Open Studio', url: 'https://studio.youtube.com' }],
  },
  {
    name: 'Instagram', icon: 'instagram', hue: 320,
    now: ['Writes captions and hashtags', 'Plans a week of posts'],
    next: 'Posting and replying for you',
    actions: [{ label: 'Write a caption', prompt: 'Write an Instagram caption with hashtags for a photo of ' }, { label: 'Open', url: 'https://www.instagram.com' }],
  },
  {
    name: 'LinkedIn', icon: 'linkedin', hue: 210,
    now: ['Writes posts, comments and messages', 'Turns your news into a post'],
    next: 'Posting for you',
    actions: [{ label: 'Write a post', prompt: 'Write a LinkedIn post about ' }, { label: 'Open', url: 'https://www.linkedin.com/feed/' }],
  },
  {
    name: 'Your business', icon: 'briefcase', hue: 45,
    now: ['Client follow-ups and reminders', 'Quotes, GST and replies to customers'],
    next: 'A daily report from all your apps',
    actions: [{ label: 'Follow up a client', prompt: 'Remind me to follow up with ' }, { label: 'Business brief', prompt: 'Give me a short business brief: my open tasks and reminders for clients, what is overdue, and what to do today.', send: true }],
  },
];

const copy = (text) => navigator.clipboard.writeText(text).then(() => toast(`Copied: ${text}`), () => toast("Couldn't copy", 'error'));

function Copyable({ text }) {
  return (
    <button type="button" className="cmd" onClick={() => copy(text)} title="Copy">
      <code>{text}</code> <Icon name="copy" size="0.95em" />
    </button>
  );
}

const CHECK_ICONS = { battery: 'zap', disk: 'folder', busy: 'cpu', downloads: 'upload', drives: 'monitor', network: 'wifi' };

/** Azarvis watches this computer and tells you (bell + out loud) when something needs you. */
function PcWatcherCard() {
  const [s, setS] = useState(null);
  const [aloud, setAloud] = useState(readAlertsAloud);
  const [error, setError] = useState('');
  useEffect(() => {
    api.pcWatcher().then(setS).catch((e) => setError(e.message));
  }, []);
  const save = async (enabled, checks) => {
    try {
      setS(await api.setPcWatcher(enabled, checks));
      setError('');
    } catch (e) {
      setError(e.message);
    }
  };
  const on = s ? s.checks.filter((c) => c.on).map((c) => c.key) : [];
  const toggleCheck = (key) => save(s.enabled, on.includes(key) ? on.filter((k) => k !== key) : [...on, key]);

  return (
    <section className="card watcher" aria-labelledby="watcher-title">
      <div className="watcher-head">
        <span className="badge-icon lg" style={{ '--hue': 160 }}><Icon name="eye" /></span>
        <div className="grow">
          <h3 id="watcher-title">Azarvis watches this PC</h3>
          <p className="muted">
            Low battery, a full disk, a busy processor, finished downloads, USB drives, internet drops: Azarvis tells you in the
            bell and out loud, once per change. Open Azarvis on your phone to get them while you're away.
          </p>
        </div>
        {s && (
          <button
            type="button"
            className={`switch ${s.enabled ? 'on' : ''}`}
            role="switch"
            aria-checked={s.enabled}
            aria-label="PC watcher"
            disabled={!s.available}
            onClick={() => save(!s.enabled, on)}
          >
            <i />
          </button>
        )}
      </div>
      {error && <p className="error">{error}</p>}
      {s && !s.available && <p className="muted small">Off on this server: Azarvis can only watch the computer its AI service runs on (SYSTEM_CONTROL=true).</p>}
      {s?.available && (
        <>
          <ul className="watch-checks">
            {s.checks.map((c) => (
              <li key={c.key}>
                <label className={!s.enabled ? 'dim' : ''}>
                  <input type="checkbox" checked={c.on} disabled={!s.enabled} onChange={() => toggleCheck(c.key)} />
                  <Icon name={CHECK_ICONS[c.key] || 'bell'} size="1.05em" />
                  {c.label}
                </label>
              </li>
            ))}
          </ul>
          <div className="watcher-foot">
            <label className="check-row">
              <input type="checkbox" checked={aloud} onChange={(e) => { setAloud(e.target.checked); setReadAlertsAloud(e.target.checked); }} />
              Read alerts aloud on this device
            </label>
            <button type="button" className="btn sm" disabled={!s.enabled} onClick={() => api.testPcAlert().then(() => toast('Test alert sent: it arrives in a few seconds'))}>
              <Icon name="bell" size="1em" /> Send a test alert
            </button>
          </div>
        </>
      )}
    </section>
  );
}

export default function AutomatePanel({ onAsk, onOpenTab }) {
  const [lan, setLan] = useState(null); // null = loading, [] = none found
  useEffect(() => {
    api.network().then((n) => setLan(n.lanAddresses)).catch(() => setLan([]));
  }, []);
  const port = window.location.port || '5173';
  const onThisPc = ['localhost', '127.0.0.1'].includes(window.location.hostname);

  const run = (a) => {
    if (a.tab) return onOpenTab(a.tab);
    if (a.url) return openUrl(a.url) || toast('Your browser blocked the new tab', 'error');
    onAsk(a.prompt, Boolean(a.send));
  };

  return (
    <div className="panel automate">
      <PageHeader icon="rocket" hue={300} title="Automate" subtitle="Hand your routine work to Azarvis: one click, or just say it." />

      <section className="auto-hero">
        <div>
          <h3>Tell Azarvis what you need, from anywhere.</h3>
          <p className="muted">
            Azarvis plans your day, writes your emails and posts, keeps your follow-ups and runs this PC. Open it on your phone
            and everything you ask is done here, on your computer.
          </p>
        </div>
        <a className="btn primary" href="#remote">
          <Icon name="phone" size="1em" /> Use Azarvis from your phone
        </a>
      </section>

      <PcWatcherCard />

      <h3 className="section-title"><Icon name="zap" /> One-click automations</h3>
      <ul className="recipe-grid">
        {RECIPES.map((r) => (
          <li key={r.title}>
            <button className="recipe" style={{ '--hue': r.hue }} onClick={() => run(r)}>
              <span className="badge-icon"><Icon name={r.icon} /></span>
              <span className="grow">
                <strong>{r.title}</strong>
                <small>{r.body}</small>
              </span>
              <Icon name={r.send ? 'send' : 'edit'} size="1em" className="recipe-go" />
            </button>
          </li>
        ))}
      </ul>

      <h3 className="section-title"><Icon name="globe" /> Your apps</h3>
      <ul className="app-grid">
        {APPS.map((a) => (
          <li key={a.name} className="app-card" style={{ '--hue': a.hue }}>
            <div className="app-head">
              <span className="badge-icon lg"><Icon name={a.icon} /></span>
              <strong>{a.name}</strong>
            </div>
            <ul className="app-can">
              {a.now.map((t) => (
                <li key={t}><Icon name="check" size="1em" /> {t}</li>
              ))}
              <li className="next"><Icon name="key" size="1em" /> {a.next} <span className="pill">Needs connection</span></li>
            </ul>
            <div className="app-actions">
              {a.actions.map((x) => (
                <button key={x.label} className="btn sm" onClick={() => run(x)}>
                  <Icon name={x.url ? 'globe' : x.tab ? 'upload' : 'sparkles'} size="1em" /> {x.label}
                </button>
              ))}
            </div>
          </li>
        ))}
      </ul>
      <div className="notice auto-connect">
        <span className="notice-icon"><Icon name="key" /></span>
        <div className="notice-body">
          <strong>Want Azarvis to read your inbox and post for you?</strong>
          <p>
            That needs each service to let Azarvis in: a Google Cloud app for Gmail, Drive and YouTube (free), a Meta developer app
            with an Instagram business account, and a LinkedIn developer app. Each one asks you to sign in and approve exactly
            what Azarvis may do. Until then Azarvis writes everything and opens the site, and you press Post or Send.
          </p>
        </div>
      </div>

      <h3 className="section-title" id="remote"><Icon name="phone" /> Use Azarvis from anywhere</h3>
      <div className="remote-grid">
        <article className="card remote-card" style={{ '--hue': 190 }}>
          <span className="badge-icon"><Icon name="wifi" /></span>
          <h4>At home, on the same Wi-Fi</h4>
          <ol>
            <li>On this PC, start Azarvis with <Copyable text="npm run dev:phone" /></li>
            <li>
              On your phone, open{' '}
              {lan === null ? (
                <span className="muted">…</span>
              ) : lan.length ? (
                lan.map((ip) => <Copyable key={ip} text={`http://${ip}:${port}`} />)
              ) : (
                <span className="muted">this PC's address (no network found)</span>
              )}
            </li>
            <li>Sign in, then choose <b>Add to Home screen</b>: Azarvis becomes an app on your phone.</li>
          </ol>
          {!onThisPc && <p className="success"><Icon name="check" size="1em" /> You're already using Azarvis from another device.</p>}
        </article>
        <article className="card remote-card" style={{ '--hue': 265 }}>
          <span className="badge-icon"><Icon name="globe" /></span>
          <h4>Away from home</h4>
          <ol>
            <li>
              Install <a href="https://tailscale.com/download" target="_blank" rel="noopener noreferrer">Tailscale</a> (free) on this PC
              and on your phone, and sign in to both with the same account.
            </li>
            <li>Start Azarvis on this PC with <Copyable text="npm run dev:phone" /></li>
            <li>On your phone, open <code>http://&lt;this PC's Tailscale name&gt;:{port}</code> from anywhere.</li>
          </ol>
          <p className="muted small">
            Only your own devices can reach it. Keep the PC switched on with Azarvis running. Never open a port on your router for Azarvis.
          </p>
        </article>
        <article className="card remote-card" style={{ '--hue': 150 }}>
          <span className="badge-icon"><Icon name="cpu" /></span>
          <h4>What works from your phone</h4>
          <ul className="app-can">
            <li><Icon name="check" size="1em" /> Chat and voice, with replies read aloud</li>
            <li><Icon name="check" size="1em" /> Opening apps, files and websites on this PC</li>
            <li><Icon name="check" size="1em" /> Reminders, tasks, memory and your documents</li>
            <li><Icon name="check" size="1em" /> “What's on my screen?” about this PC's screen</li>
          </ul>
        </article>
      </div>
    </div>
  );
}
