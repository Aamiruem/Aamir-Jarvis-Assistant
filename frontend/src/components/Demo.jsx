import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { Icon } from '../icons.jsx';
import { toast } from '../ui.jsx';
import FeedbackForm from './FeedbackForm.jsx';
import SiteFooter from './SiteFooter.jsx';

// The demo: the app's layout with sample data, open to anyone, no account and no server.
// Chat answers come from a small script, tasks live in this browser (localStorage), Notes is
// the real notes library (static files), Automate fills a template. Sections that need the
// server (ML Lab, Knowledge, Vision, Memory) explain what they do and link to sign-up.

const NotesPanel = lazy(() => import('./NotesPanel.jsx'));

const SECTIONS = [
  { id: 'home', label: 'Home', icon: 'home', hue: 205 },
  { id: 'chat', label: 'Chat', icon: 'chat', hue: 190 },
  { id: 'tasks', label: 'Tasks', icon: 'tasks', hue: 38 },
  { id: 'notes', label: 'Notes', icon: 'notes', hue: 45 },
  { id: 'automate', label: 'Automate', icon: 'rocket', hue: 300 },
];
const LOCKED = [
  { id: 'mllab', label: 'ML Lab', icon: 'flask', hue: 160, title: 'Train models on your own data', points: ['Upload a CSV and pick the column to predict', 'Scores measured on rows held back from training', 'Keep your models and an experiment log'] },
  { id: 'knowledge', label: 'Knowledge', icon: 'book', hue: 265, title: 'Answers from your documents', points: ['Upload PDFs, Word files and text', 'Search across everything you added', 'Ask in chat and Azarvis answers from them'] },
  { id: 'vision', label: 'Vision', icon: 'eye', hue: 330, title: 'Azarvis can see', points: ['Describe photos and screenshots', 'Read text out of images', 'Room Watch: greets you when you walk in'] },
  { id: 'memory', label: 'Memory', icon: 'brain', hue: 280, title: 'Remembers what matters to you', points: ['Your name, goals and preferences', 'Facts you ask it to remember', 'See and delete everything it knows'] },
];
const ALL = [...SECTIONS, ...LOCKED];

// ---------- Chat: scripted answers ----------
const SUGGESTIONS = ['What can you do?', 'What time is it?', 'Explain overfitting simply', 'Tell me a joke', 'Draft a LinkedIn post'];

function scriptedReply(text) {
  const t = text.toLowerCase();
  const now = new Date();
  if (/\b(time|date|day is it|today)\b/.test(t))
    return `It's ${now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })} on ${now.toLocaleDateString([], { weekday: 'long', day: 'numeric', month: 'long' })}.`;
  if (/what can you do|help|feature|capabilit/.test(t))
    return 'Here is what I do in the full app:\n• Answer anything out loud, hands-free ("Hey Azarvis")\n• Set reminders and read them to you each morning\n• Find things in your study notes and documents\n• Write drafts for Gmail, LinkedIn, Instagram and YouTube\n• Train ML models on your CSV files\n\nIn this demo, try Tasks, Notes and Automate from the menu.';
  if (/overfit/.test(t))
    return 'Overfitting is when a model memorises its training data instead of learning the pattern.\n\nThink of a student who memorises last year\'s answers: perfect on old papers, lost on new questions. You spot it when the training score is high but the score on unseen data is low. Fixes: more data, a simpler model, regularisation, or cross-validation.';
  if (/machine learning|\bml\b|\bai\b/.test(t))
    return 'Machine learning is teaching a computer from examples instead of rules: show it many houses with prices and it learns to estimate the price of a new one. The Notes section has full chapters on this, from basics to advanced.';
  if (/joke|funny/.test(t)) return 'Why did the neural network break up with the decision tree?\nIt felt the tree was too quick to split.';
  if (/remind|reminder|alarm/.test(t))
    return 'In your account I would set that reminder and say it out loud on time. Here in the demo, open Tasks and add it: it stays saved in this browser.';
  if (/email|draft|linkedin|post|instagram|youtube|gmail/.test(t))
    return 'Open Automate in the menu: pick Gmail, LinkedIn, Instagram or YouTube, type the topic and you get a ready draft to copy. Azarvis never sends anything on its own.';
  if (/weather|news|stock/.test(t)) return 'Live data like weather and news needs the Azarvis server, so it is not in the demo. Create a free account and ask me again.';
  if (/who (are|made|built|created)|about you|your name/.test(t))
    return "I'm Azarvis, a personal AI voice assistant built by Aamir Hussain Azad. My answers in the full app come from Claude by Anthropic.";
  if (/^(hi|hello|hey|namaste|good (morning|afternoon|evening))\b/.test(t)) return 'Hello! I am Azarvis. Ask me what I can do, or pick one of the suggestions below.';
  if (/thank/.test(t)) return 'You are welcome! If you liked the demo, the feedback button at the bottom of the menu helps a lot.';
  return 'In the demo I only know a few sample answers. Try one of the suggestions, or create a free account and I will answer anything with Claude, out loud.';
}

function speak(text) {
  if (!('speechSynthesis' in window)) return toast('This browser cannot read text aloud', 'error');
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text.replace(/[•\n]+/g, ' '));
  u.rate = 1.02;
  window.speechSynthesis.speak(u);
}

const GREETING = { role: 'bot', text: 'Hi, I am Azarvis. This is the demo, so my answers are scripted. Ask me something, or tap a suggestion.' };

function DemoChat({ seed, onSeedUsed }) {
  // seed: a question handed over from Home, asked as soon as the chat opens.
  const [messages, setMessages] = useState(() => (seed ? [GREETING, { role: 'user', text: seed }] : [GREETING]));
  const [pending, setPending] = useState(seed || null); // the question waiting for its answer
  const [input, setInput] = useState('');
  const [aloud, setAloud] = useState(false);
  const aloudRef = useRef(aloud);
  aloudRef.current = aloud;
  const logRef = useRef(null);
  const typing = Boolean(pending);

  useEffect(() => {
    if (seed) onSeedUsed();
  }, []);
  // Keep the newest message in view by scrolling the log only (not the whole page).
  useEffect(() => {
    const log = logRef.current;
    if (log) log.scrollTo({ top: log.scrollHeight, behavior: 'smooth' });
  }, [messages, typing]);
  useEffect(() => () => window.speechSynthesis?.cancel(), []);

  // A short "typing" pause, then the scripted answer (cancelled if the chat closes first).
  useEffect(() => {
    if (!pending) return;
    const t = setTimeout(() => {
      const reply = scriptedReply(pending);
      setMessages((m) => [...m, { role: 'bot', text: reply }]);
      setPending(null);
      if (aloudRef.current) speak(reply);
    }, 650 + Math.min(pending.length * 12, 600));
    return () => clearTimeout(t);
  }, [pending]);

  const send = (text) => {
    const q = text.trim();
    if (!q || typing) return;
    setInput('');
    setMessages((m) => [...m, { role: 'user', text: q }]);
    setPending(q);
  };

  return (
    <div className="demo-chat">
      <div className="demo-chat-head">
        <div className="orb small" aria-hidden="true" />
        <div className="grow">
          <strong>Azarvis</strong>
          <span className="muted small"> · demo answers</span>
        </div>
        <label className="demo-aloud">
          <input type="checkbox" checked={aloud} onChange={(e) => setAloud(e.target.checked)} /> Read answers aloud
        </label>
      </div>
      <div className="demo-chat-log" aria-live="polite" ref={logRef}>
        {messages.map((m, i) => (
          <div key={i} className={`demo-msg demo-msg--${m.role}`}>
            <p>{m.text}</p>
            {m.role === 'bot' && i > 0 && (
              <button type="button" className="demo-speak" onClick={() => speak(m.text)} aria-label="Read this answer aloud" title="Read aloud">
                <Icon name="volume" size="0.95em" />
              </button>
            )}
          </div>
        ))}
        {typing && (
          <div className="demo-msg demo-msg--bot demo-typing" aria-label="Azarvis is typing">
            <span /><span /><span />
          </div>
        )}
      </div>
      <div className="demo-suggest">
        {SUGGESTIONS.map((s) => (
          <button key={s} type="button" className="chip" onClick={() => send(s)} disabled={typing}>{s}</button>
        ))}
      </div>
      <form className="demo-chat-input" onSubmit={(e) => { e.preventDefault(); send(input); }}>
        <button type="button" className="icon-btn" onClick={() => toast('Voice needs a free account: the demo has typing only', 'error')} aria-label="Voice input (needs an account)" title="Voice input needs an account">
          <Icon name="mic" />
        </button>
        <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask Azarvis…" aria-label="Message Azarvis" maxLength={300} />
        <button className="btn primary" disabled={!input.trim() || typing} aria-label="Send">
          <Icon name="send" size="1em" />
        </button>
      </form>
    </div>
  );
}

// ---------- Tasks: saved in this browser ----------
const TASK_KEY = 'azarvis-demo-tasks';
const SAMPLE_TASKS = () => [
  { id: 1, text: 'Submit the ML assignment', time: '18:00', done: false },
  { id: 2, text: 'Revise chapter 3: decision trees', time: '20:30', done: false },
  { id: 3, text: 'Try the Azarvis demo', time: '', done: true },
];
const readTasks = () => {
  try {
    const saved = JSON.parse(localStorage.getItem(TASK_KEY));
    return Array.isArray(saved) ? saved : SAMPLE_TASKS();
  } catch {
    return SAMPLE_TASKS();
  }
};
const fmtTime = (hhmm) => {
  if (!hhmm) return '';
  const [h, m] = hhmm.split(':').map(Number);
  return new Date(2000, 0, 1, h, m).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
};

function useDemoTasks() {
  const [tasks, setTasks] = useState(readTasks);
  useEffect(() => {
    try {
      localStorage.setItem(TASK_KEY, JSON.stringify(tasks));
    } catch {}
  }, [tasks]);
  return [tasks, setTasks];
}

function DemoTasks({ tasks, setTasks }) {
  const [text, setText] = useState('');
  const [time, setTime] = useState('');
  const add = (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    setTasks((ts) => [{ id: Date.now(), text: text.trim(), time, done: false }, ...ts]);
    setText('');
    setTime('');
    toast(time ? `Reminder set for ${fmtTime(time)}` : 'Task added');
  };
  const open = tasks.filter((t) => !t.done);
  const done = tasks.filter((t) => t.done);
  const row = (t) => (
    <li key={t.id} className={`demo-task ${t.done ? 'done' : ''}`}>
      <input type="checkbox" checked={t.done} onChange={() => setTasks((ts) => ts.map((x) => (x.id === t.id ? { ...x, done: !x.done } : x)))} aria-label={`Mark "${t.text}" ${t.done ? 'not done' : 'done'}`} />
      <span className="grow">{t.text}</span>
      {t.time && <span className="demo-task-time"><Icon name="alarm" size="0.9em" /> {fmtTime(t.time)}</span>}
      <button type="button" className="icon-btn" onClick={() => setTasks((ts) => ts.filter((x) => x.id !== t.id))} aria-label={`Delete "${t.text}"`}>
        <Icon name="trash" size="0.95em" />
      </button>
    </li>
  );
  return (
    <div className="demo-tasks">
      <form className="demo-task-add" onSubmit={add}>
        <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Add a task, e.g. Call the bank" aria-label="New task" maxLength={120} />
        <input type="time" value={time} onChange={(e) => setTime(e.target.value)} aria-label="Reminder time (optional)" />
        <button className="btn primary"><Icon name="plus" size="1em" /> Add</button>
      </form>
      <h3 className="demo-sub">To do <span className="muted">· {open.length}</span></h3>
      {open.length ? <ul className="demo-task-list">{open.map(row)}</ul> : <p className="muted">All done. Nice work!</p>}
      {done.length > 0 && (
        <>
          <h3 className="demo-sub">Done <span className="muted">· {done.length}</span></h3>
          <ul className="demo-task-list">{done.map(row)}</ul>
        </>
      )}
      <button type="button" className="btn ghost sm" onClick={() => setTasks(SAMPLE_TASKS())}>
        <Icon name="refresh" size="0.95em" /> Reset sample tasks
      </button>
    </div>
  );
}

// ---------- Automate: template drafts ----------
const PLATFORMS = [
  ['gmail', 'Gmail', 'mail'],
  ['linkedin', 'LinkedIn', 'linkedin'],
  ['instagram', 'Instagram', 'instagram'],
  ['youtube', 'YouTube', 'youtube'],
];
function draftFor(platform, topic, tone) {
  const t = topic.trim() || 'my new AI voice assistant project';
  const warm = tone === 'friendly';
  const short = tone === 'short';
  switch (platform) {
    case 'gmail':
      return short
        ? `Subject: ${t}\n\nHi,\n\nQuick note about ${t}. Can we talk this week?\n\nThanks,\n[Your name]`
        : `Subject: ${t}\n\n${warm ? 'Hi there,' : 'Dear [Name],'}\n\nI wanted to share an update on ${t}. ${warm ? "I'd love to hear what you think!" : 'I would appreciate your feedback at your convenience.'}\n\nCould we find 15 minutes this week to go through it?\n\n${warm ? 'Cheers' : 'Best regards'},\n[Your name]`;
    case 'linkedin':
      return short
        ? `Excited to share: ${t}. 🚀\n\nMore soon. #AI #Learning`
        : `${warm ? 'Super happy to share' : 'I am pleased to share'} ${t}. 🚀\n\nWhat I learned along the way:\n• Start small and ship early\n• Feedback beats guessing\n• Consistency compounds\n\n${warm ? 'What would you build next?' : 'I welcome your thoughts.'}\n\n#AI #MachineLearning #BuildInPublic`;
    case 'instagram':
      return `${short ? '' : '✨ '}${t} ${short ? '✨' : '\n\nSwipe to see how it came together 👉\nSave this for later and share it with a friend who would love it.'}\n\n#ai #tech #learning #creator`;
    default:
      return `Title: ${t}${short ? '' : ' | Full walkthrough'}\n\nDescription:\nIn this video: ${t}. ${short ? '' : '\n\n00:00 Intro\n01:30 The idea\n04:00 Building it\n09:00 Results\n\nSubscribe for more!'}\n\nTags: ai, tutorial, ${t.split(' ').slice(0, 3).join(', ')}`;
  }
}

function DemoAutomate() {
  const [platform, setPlatform] = useState('linkedin');
  const [topic, setTopic] = useState('');
  const [tone, setTone] = useState('friendly');
  const [draft, setDraft] = useState('');
  const make = (e) => {
    e?.preventDefault();
    setDraft(draftFor(platform, topic, tone));
  };
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(draft);
      toast('Draft copied');
    } catch {
      toast('Select the text and copy it', 'error');
    }
  };
  return (
    <div className="demo-automate">
      <form className="demo-auto-form" onSubmit={make}>
        <div className="demo-platforms" role="group" aria-label="Where it goes">
          {PLATFORMS.map(([id, label, icon]) => (
            <button key={id} type="button" className={`demo-platform ${platform === id ? 'on' : ''}`} aria-pressed={platform === id} onClick={() => setPlatform(id)}>
              <Icon name={icon} size="1.2em" /> {label}
            </button>
          ))}
        </div>
        <label className="fb-field">
          <span>What is it about?</span>
          <input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="e.g. finishing my first ML project" maxLength={120} />
        </label>
        <div className="demo-auto-row">
          <label className="fb-field">
            <span>Tone</span>
            <select value={tone} onChange={(e) => setTone(e.target.value)}>
              <option value="friendly">Friendly</option>
              <option value="professional">Professional</option>
              <option value="short">Short</option>
            </select>
          </label>
          <button className="btn primary"><Icon name="sparkles" size="1em" /> Write draft</button>
        </div>
      </form>
      {draft && (
        <div className="demo-draft">
          <div className="demo-draft-head">
            <strong>Your draft</strong>
            <button type="button" className="btn sm" onClick={copy}><Icon name="copy" size="0.95em" /> Copy</button>
          </div>
          <textarea value={draft} onChange={(e) => setDraft(e.target.value)} rows={10} aria-label="Draft text" />
          <p className="muted small">Demo drafts come from a template. In your account Claude writes them for you. Either way, you send them yourself.</p>
        </div>
      )}
    </div>
  );
}

// ---------- Home ----------
function DemoHome({ tasks, onGo, onAsk }) {
  const hour = new Date().getHours();
  const greet = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const today = tasks.filter((t) => !t.done).slice(0, 3);
  const actions = [
    ['chat', 'mic', 190, 'Talk to Azarvis', 'Ask a question and hear the answer', () => onAsk('What can you do?')],
    ['tasks', 'tasks', 38, 'Add a reminder', 'Tasks are saved in this browser', () => onGo('tasks')],
    ['notes', 'notes', 45, 'Study notes', 'Browse the real AI/ML library', () => onGo('notes')],
    ['automate', 'rocket', 300, 'Write a post', 'Gmail, LinkedIn, Instagram, YouTube', () => onGo('automate')],
  ];
  return (
    <div className="demo-home">
      <div className="demo-hello">
        <div className="orb demo-hello-orb" aria-hidden="true" />
        <div>
          <h2>{greet}, guest</h2>
          <p className="muted">This is Azarvis with sample data. Pick something to try.</p>
        </div>
      </div>
      <ul className="demo-actions">
        {actions.map(([id, icon, hue, title, text, fn]) => (
          <li key={id}>
            <button type="button" className="demo-action" style={{ '--hue': hue }} onClick={fn}>
              <span className="badge-icon lg"><Icon name={icon} /></span>
              <strong>{title}</strong>
              <span className="muted small">{text}</span>
            </button>
          </li>
        ))}
      </ul>
      <div className="demo-today">
        <div className="demo-today-head">
          <h3 className="demo-sub">Today</h3>
          <button type="button" className="btn ghost sm" onClick={() => onGo('tasks')}>All tasks <Icon name="chevron" size="0.9em" /></button>
        </div>
        {today.length ? (
          <ul className="demo-task-list">
            {today.map((t) => (
              <li key={t.id} className="demo-task">
                <Icon name="alarm" size="1em" />
                <span className="grow">{t.text}</span>
                {t.time && <span className="demo-task-time">{fmtTime(t.time)}</span>}
              </li>
            ))}
          </ul>
        ) : (
          <p className="muted">Nothing left for today.</p>
        )}
      </div>
    </div>
  );
}

function Locked({ item, onNavigate }) {
  return (
    <div className="demo-locked" style={{ '--hue': item.hue }}>
      <span className="badge-icon lg"><Icon name={item.icon} /></span>
      <h2>{item.title}</h2>
      <ul>
        {item.points.map((p) => <li key={p}><Icon name="check" size="1em" /> {p}</li>)}
      </ul>
      <p className="muted">{item.label} works with your own files and data, so it needs the Azarvis server and a free account.</p>
      <div className="demo-locked-cta">
        <button type="button" className="btn primary" onClick={() => onNavigate('signup')}>Create free account</button>
        <button type="button" className="btn" onClick={() => onNavigate('login')}>Sign in</button>
      </div>
    </div>
  );
}

function FeedbackDialog({ onClose }) {
  useEffect(() => {
    const esc = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', esc);
    return () => document.removeEventListener('keydown', esc);
  }, [onClose]);
  return (
    <div className="demo-modal" role="dialog" aria-modal="true" aria-labelledby="demo-fb-title" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="demo-modal-card">
        <div className="demo-modal-head">
          <h2 id="demo-fb-title">Feedback on the demo</h2>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close"><Icon name="x" /></button>
        </div>
        <FeedbackForm page="demo" compact />
      </div>
    </div>
  );
}

export default function Demo({ section, onSection, onNavigate }) {
  const current = ALL.find((s) => s.id === section) ?? SECTIONS[0];
  const [tasks, setTasks] = useDemoTasks();
  const [seed, setSeed] = useState(null);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const contentRef = useRef(null);
  const locked = useMemo(() => LOCKED.find((l) => l.id === current.id), [current.id]);

  const go = (id) => {
    onSection(id);
    contentRef.current?.scrollIntoView({ block: 'start', behavior: 'smooth' });
  };
  const ask = (text) => {
    setSeed(text);
    onSection('chat');
  };

  const link = (s) => (
    <button key={s.id} type="button" className={`demo-link ${current.id === s.id ? 'active' : ''}`} style={{ '--hue': s.hue }} onClick={() => go(s.id)} aria-current={current.id === s.id ? 'page' : undefined}>
      <span className="side-ico"><Icon name={s.icon} size="1.15em" /></span>
      <span className="grow">{s.label}</span>
      {LOCKED.includes(s) && <Icon name="key" size="0.85em" className="demo-link-lock" />}
    </button>
  );

  return (
    <div className="demo">
      <div className="demo-banner pub-wrap">
        <span className="demo-banner-pill"><Icon name="sparkles" size="0.95em" /> Demo mode</span>
        <span className="demo-banner-text">Sample data. Nothing is sent to a server; tasks you add stay in this browser.</span>
        <span className="demo-banner-cta">
          <button type="button" className="btn sm" onClick={() => setFeedbackOpen(true)}><Icon name="chat" size="0.95em" /> Feedback</button>
          <button type="button" className="btn primary sm" onClick={() => onNavigate('signup')}>Create free account</button>
        </span>
      </div>

      <div className="demo-layout pub-wrap">
        <aside className="demo-side" aria-label="Demo sections">
          <nav className="demo-nav">
            <span className="demo-nav-title">Try it</span>
            {SECTIONS.map(link)}
            <span className="demo-nav-title">With an account</span>
            {LOCKED.map(link)}
          </nav>
          <div className="demo-side-card">
            <strong>Enjoying the demo?</strong>
            <p className="muted small">Tell Aamir what you liked and what is missing.</p>
            <button type="button" className="btn sm full" onClick={() => setFeedbackOpen(true)}><Icon name="star" size="0.95em" /> Give feedback</button>
          </div>
        </aside>

        <section className="demo-content" ref={contentRef} style={{ '--hue': current.hue }}>
          {/* Notes brings its own title bar (it's the real Notes panel). */}
          {current.id !== 'notes' && (
          <header className="demo-head">
            <span className="badge-icon lg"><Icon name={current.icon} /></span>
            <div className="grow">
              <h1>{current.label}</h1>
              <p className="muted">
                {{
                  home: 'Your day at a glance.',
                  chat: 'Ask anything. In the demo the answers are scripted.',
                  tasks: 'Tasks and reminders, saved in this browser.',
                  automate: 'Write drafts for email and social media.',
                }[current.id] ?? 'Available with a free account.'}
              </p>
            </div>
          </header>
          )}

          {current.id === 'home' && <DemoHome tasks={tasks} onGo={go} onAsk={ask} />}
          {current.id === 'chat' && <DemoChat seed={seed} onSeedUsed={() => setSeed(null)} />}
          {current.id === 'tasks' && <DemoTasks tasks={tasks} setTasks={setTasks} />}
          {current.id === 'automate' && <DemoAutomate />}
          {current.id === 'notes' && (
            <div className="demo-notes">
              <Suspense fallback={<div className="tab-loading"><div className="orb pulse" /></div>}>
                <NotesPanel />
              </Suspense>
            </div>
          )}
          {locked && <Locked item={locked} onNavigate={onNavigate} />}
        </section>
      </div>

      <SiteFooter compact />
      {feedbackOpen && <FeedbackDialog onClose={() => setFeedbackOpen(false)} />}
    </div>
  );
}
