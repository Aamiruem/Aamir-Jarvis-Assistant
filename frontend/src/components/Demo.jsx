import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { DEMO_MEMORY_KEY, DEMO_TASKS_KEY, fmtTime, memoryName, readDemoMemory, readDemoTasks, respond, SAMPLE_TASKS, speak as speakText } from '../brain.js';
import { Icon } from '../icons.jsx';
import { useListen } from '../useListen.js';
import { toast } from '../ui.jsx';
import FeedbackForm from './FeedbackForm.jsx';
import SiteFooter from './SiteFooter.jsx';

// The demo: the app's layout with sample data, open to anyone, no account and no server.
// It is the first thing a visitor sees (the website's front page). Chat answers come from a
// small script, tasks and memories live in this browser (localStorage), Notes is the real notes
// library (static files), Automate fills a template, and ML Lab, Knowledge and Vision run in the
// browser too (demoLab.js): every section works without signing up.

const NotesPanel = lazy(() => import('./NotesPanel.jsx'));
const lab = (name) => lazy(() => import('./DemoLab.jsx').then((m) => ({ default: m[name] })));
const DemoMlLab = lab('DemoMlLab');
const DemoKnowledge = lab('DemoKnowledge');
const DemoVision = lab('DemoVision');
const DemoMemory = lab('DemoMemory');

const SECTIONS = [
  { id: 'home', label: 'Home', icon: 'home', hue: 205 },
  { id: 'chat', label: 'Chat', icon: 'chat', hue: 190 },
  { id: 'tasks', label: 'Tasks', icon: 'tasks', hue: 38 },
  { id: 'notes', label: 'Notes', icon: 'notes', hue: 45 },
  { id: 'automate', label: 'Automate', icon: 'rocket', hue: 300 },
];
const TOOLS = [
  { id: 'mllab', label: 'ML Lab', icon: 'flask', hue: 160 },
  { id: 'knowledge', label: 'Knowledge', icon: 'book', hue: 265 },
  { id: 'vision', label: 'Vision', icon: 'eye', hue: 330 },
  { id: 'memory', label: 'Memory', icon: 'brain', hue: 280 },
];
const ALL = [...SECTIONS, ...TOOLS];
const BLURB = {
  home: 'AI voice assistant by Aamir Hussain Azad. Every section works here, no login needed.',
  chat: 'Ask anything. In the demo the answers are scripted.',
  tasks: 'Tasks and reminders, saved in this browser.',
  automate: 'Write drafts for email and social media.',
  mllab: 'Train a model on a CSV and see honest scores, right in your browser.',
  knowledge: 'Add documents, then ask questions and get answers from them.',
  vision: 'Describe images and get greeted when you walk into the room.',
  memory: 'What Azarvis remembers about you. See and delete all of it.',
};

// ---------- Chat: scripted answers ----------
const SUGGESTIONS = ['Remind me to call mom at 6 pm', 'What can you do?', 'My name is Aamir', 'What do you know about me?', 'Open ML Lab', 'Explain overfitting simply', 'Tell me a joke', 'Dark mode'];

// Answers come from brain.js (shared with the website's hero), which can also act: add a task,
// open a section, switch the theme.
const speak = (text) => speakText(text) || toast('This browser cannot read text aloud', 'error');

const GREETING = { role: 'bot', text: 'Hi, I am Azarvis. This is the demo, so my answers are scripted. Ask me something, or tap a suggestion.' };

function DemoChat({ seed, onSeedUsed, onAction }) {
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
      const { text: reply, action } = respond(pending);
      setMessages((m) => [...m, { role: 'bot', text: reply }]);
      setPending(null);
      if (aloudRef.current) speak(reply);
      if (action) onAction(action);
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
  // Speak instead of typing: what you say appears in the box, then is sent (answers are read aloud).
  const voice = useListen((said) => {
    setAloud(true);
    send(said);
  });
  useEffect(() => {
    if (voice.listening) setInput(voice.transcript);
  }, [voice.transcript, voice.listening]);
  useEffect(() => {
    if (voice.error) toast(voice.error, 'error');
  }, [voice.error]);

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
        <button
          type="button"
          className={`icon-btn demo-mic ${voice.listening ? 'on' : ''}`}
          onClick={voice.listening ? voice.stop : voice.start}
          aria-pressed={voice.listening}
          aria-label={voice.listening ? 'Stop listening' : 'Speak to Azarvis'}
          title={voice.supported ? (voice.listening ? 'Listening… tap to stop' : 'Speak to Azarvis') : 'Voice input needs Chrome, Edge or Safari'}
        >
          <Icon name="mic" />
        </button>
        <input value={input} onChange={(e) => setInput(e.target.value)} placeholder={voice.listening ? 'Listening… speak now' : 'Ask Azarvis, or tap the mic…'} aria-label="Message Azarvis" maxLength={300} />
        <button className="btn primary" disabled={!input.trim() || typing} aria-label="Send">
          <Icon name="send" size="1em" />
        </button>
      </form>
    </div>
  );
}

// ---------- Tasks: saved in this browser ----------
function useDemoTasks() {
  const [tasks, setTasks] = useState(readDemoTasks);
  useEffect(() => {
    try {
      localStorage.setItem(DEMO_TASKS_KEY, JSON.stringify(tasks));
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

// ---------- Memory: saved in this browser (the chat reads it through brain.js) ----------
function useDemoMemory() {
  const [facts, setFacts] = useState(readDemoMemory);
  useEffect(() => {
    try {
      localStorage.setItem(DEMO_MEMORY_KEY, JSON.stringify(facts));
    } catch {}
  }, [facts]);
  return [facts, setFacts];
}

// ---------- Home ----------
function DemoHome({ tasks, name, onGo, onAsk }) {
  const hour = new Date().getHours();
  const greet = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const today = tasks.filter((t) => !t.done).slice(0, 3);
  const actions = [
    ['chat', 'mic', 190, 'Talk to Azarvis', 'Ask a question and hear the answer', () => onAsk('What can you do?')],
    ['tasks', 'tasks', 38, 'Add a reminder', 'Tasks are saved in this browser', () => onGo('tasks')],
    ['notes', 'notes', 45, 'Study notes', 'Browse the real AI/ML library', () => onGo('notes')],
    ['automate', 'rocket', 300, 'Write a post', 'Gmail, LinkedIn, Instagram, YouTube', () => onGo('automate')],
    ['mllab', 'flask', 160, 'Train a model', 'Predict prices or results from a CSV', () => onGo('mllab')],
    ['knowledge', 'book', 265, 'Ask your documents', 'Answers with the source passage', () => onGo('knowledge')],
    ['vision', 'eye', 330, 'Describe an image', 'And Room Watch with your camera', () => onGo('vision')],
    ['memory', 'brain', 280, 'What it remembers', 'Your name, goals and preferences', () => onGo('memory')],
  ];
  return (
    <div className="demo-home">
      <div className="demo-hello">
        <div className="orb demo-hello-orb" aria-hidden="true" />
        <div>
          <h2>{greet}, {name || 'guest'}</h2>
          <p className="muted">This is Azarvis with sample data. Every feature works, no account needed. Pick something to try.</p>
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

export default function Demo({ section, onSection, onNavigate, theme }) {
  const current = ALL.find((s) => s.id === section) ?? SECTIONS[0];
  const [tasks, setTasks] = useDemoTasks();
  const [facts, setFacts] = useDemoMemory();
  const [seed, setSeed] = useState(null);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const contentRef = useRef(null);

  const go = (id) => {
    onSection(id);
    contentRef.current?.scrollIntoView({ block: 'start', behavior: 'smooth' });
  };
  // What the chat asked for: a real task, another section, another page, the theme.
  const runAction = (action) => {
    if (action.type === 'task') {
      setTasks((ts) => [{ id: Date.now(), done: false, time: '', ...action.task }, ...ts]);
      toast(action.task.time ? `Reminder set for ${fmtTime(action.task.time)}` : 'Task added');
    } else if (action.type === 'memory') {
      const f = { id: Date.now(), ...action.fact };
      setFacts((fs) => (f.kind === 'name' ? [f, ...fs.filter((x) => x.kind !== 'name')] : [f, ...fs]));
    } else if (action.type === 'demo' && action.section !== 'chat') setTimeout(() => go(action.section), 900);
    else if (action.type === 'page') setTimeout(() => onNavigate(action.page), 900);
    else if (action.type === 'scroll') setTimeout(() => onNavigate('home', '', action.id), 900);
    else if (action.type === 'theme') theme?.setChoice(action.mode);
    else if (action.type === 'link') window.open(action.href, '_blank', 'noopener,noreferrer');
  };
  const ask = (text) => {
    setSeed(text);
    onSection('chat');
  };

  const link = (s) => (
    <button key={s.id} type="button" className={`demo-link ${current.id === s.id ? 'active' : ''}`} style={{ '--hue': s.hue }} onClick={() => go(s.id)} aria-current={current.id === s.id ? 'page' : undefined}>
      <span className="side-ico"><Icon name={s.icon} size="1.15em" /></span>
      <span className="grow">{s.label}</span>
    </button>
  );

  return (
    <div className="demo">
      <div className="demo-banner pub-wrap">
        <span className="demo-banner-pill"><Icon name="sparkles" size="0.95em" /> Demo mode</span>
        <span className="demo-banner-text">No login needed. Try every feature with sample data; nothing is sent to a server and what you add stays in this browser.</span>
        <span className="demo-banner-cta">
          <button type="button" className="btn sm" onClick={() => setFeedbackOpen(true)}><Icon name="chat" size="0.95em" /> Feedback</button>
          <button type="button" className="btn primary sm" onClick={() => onNavigate('signup')}>Create free account</button>
        </span>
      </div>

      <div className="demo-layout pub-wrap">
        <aside className="demo-side" aria-label="Demo sections">
          <nav className="demo-nav">
            <span className="demo-nav-title">Assistant</span>
            {SECTIONS.map(link)}
            <span className="demo-nav-title">AI tools</span>
            {TOOLS.map(link)}
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
              {/* The site's front page: its heading names the product for search engines. */}
              <h1>{current.id === 'home' ? 'Azarvis' : current.label}</h1>
              <p className="muted">{BLURB[current.id]}</p>
            </div>
          </header>
          )}

          {current.id === 'home' && <DemoHome tasks={tasks} name={memoryName(facts)} onGo={go} onAsk={ask} />}
          {current.id === 'chat' && <DemoChat seed={seed} onSeedUsed={() => setSeed(null)} onAction={runAction} />}
          {current.id === 'tasks' && <DemoTasks tasks={tasks} setTasks={setTasks} />}
          {current.id === 'automate' && <DemoAutomate />}
          {current.id === 'notes' && (
            <div className="demo-notes">
              <Suspense fallback={<div className="tab-loading"><div className="orb pulse" /></div>}>
                <NotesPanel />
              </Suspense>
            </div>
          )}
          {TOOLS.some((t) => t.id === current.id) && (
            <Suspense fallback={<div className="tab-loading"><div className="orb pulse" /></div>}>
              {current.id === 'mllab' && <DemoMlLab />}
              {current.id === 'knowledge' && <DemoKnowledge />}
              {current.id === 'vision' && <DemoVision />}
              {current.id === 'memory' && <DemoMemory facts={facts} setFacts={setFacts} onAsk={ask} />}
            </Suspense>
          )}
        </section>
      </div>

      <SiteFooter compact />
      {feedbackOpen && <FeedbackDialog onClose={() => setFeedbackOpen(false)} />}
    </div>
  );
}
