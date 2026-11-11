import { useEffect, useRef, useState } from 'react';
import { track } from '../analytics.js';
import { fmtTime, respond, saveDemoTask, speak } from '../brain.js';
import { Icon } from '../icons.jsx';
import { LIVE_APPS, PORTFOLIO_URL, REPO_URL } from '../siteLinks.js';
import { useListen } from '../useListen.js';
import FeedbackForm from './FeedbackForm.jsx';
import Projects from './Projects.jsx';
import Workflows from './Workflows.jsx';

// The public website shown before sign-in. Full-width bands, each with its own background:
// the hero (a working voice assistant over the brand artwork), numbers, features, the demo,
// live projects, how it works, security, FAQ, feedback and a final call to action.
// Every claim here matches a feature that exists in the app.

const FEATURES = [
  { icon: 'mic', hue: 190, title: 'Voice assistant', text: 'Say “Hey Azarvis”, ask anything and hear the answer out loud. Hands-free from start to finish.', demo: 'chat' },
  { icon: 'chat', hue: 215, title: 'Chat with Claude', text: 'Long answers, code, maths and summaries in a clean chat, with your history saved and searchable.', demo: 'chat' },
  { icon: 'tasks', hue: 38, title: 'Tasks & reminders', text: '“Remind me at 6 pm” just works. Azarvis reads today’s reminders when you start your day.', demo: 'tasks' },
  { icon: 'notes', hue: 48, title: 'Notes & courses', text: '86 AI/ML study chapters and 244 lectures, with search, practice cards and reading progress.', demo: 'notes' },
  { icon: 'rocket', hue: 300, title: 'Automate', text: 'Drafts for Gmail, LinkedIn, Instagram and YouTube. You review and send them yourself.', demo: 'automate' },
  { icon: 'book', hue: 265, title: 'Knowledge base', text: 'Upload PDFs and documents, search them, and let Azarvis answer from what they say.' },
  { icon: 'flask', hue: 160, title: 'ML Lab', text: 'Train models on your own CSV files and see honest scores, measured on rows held back from training.' },
  { icon: 'eye', hue: 335, title: 'Vision & Room Watch', text: 'Describe photos and screenshots, and get greeted when you walk into the room.' },
];

// What happens to one request, stage by stage: each is a separate part of the system.
const PIPELINE = [
  { icon: 'mic', hue: 190, title: 'Listen', text: 'Hears “Hey Azarvis” and turns your speech into text, on your laptop or phone.', example: '“Remind me to call mom at 6 and check the weather in Pune”', tech: ['Web Speech API', 'Wake word'] },
  { icon: 'brain', hue: 280, title: 'Understand', text: 'Finds what you want (two requests here), the details (6 pm, Pune) and how you feel.', example: 'Intent: task + weather · Feeling: neutral', tech: ['scikit-learn intent model', 'Emotion model'] },
  { icon: 'sparkles', hue: 230, title: 'Plan', text: 'Claude decides which tools to use and in what order, using what it remembers about you and your documents.', example: 'create_task(6 pm) + get_weather(Pune), in parallel', tech: ['Claude agent', 'Memory + RAG'] },
  { icon: 'zap', hue: 38, title: 'Act', text: 'Runs the tools: tasks, notes, files, email drafts, web search, ML models and your computer.', example: 'Reminder saved · 29 °C and sunny in Pune', tech: ['24 tools + web search', 'MCP server'] },
  { icon: 'volume', hue: 160, title: 'Speak', text: 'Answers out loud, in a tone that fits your mood: calmer when you are stressed, brighter when you are excited.', example: '“Done. I’ll remind you at 6. Pune is 29 degrees and sunny.”', tech: ['Speech synthesis', 'Mood-aware voice'] },
];

const STEPS = [
  { icon: 'user', hue: 205, title: 'Create your account', text: 'Email and password, confirmed with a one-time code. Then add a passkey and skip the password next time.' },
  { icon: 'mic', hue: 280, title: 'Talk or type', text: 'Say “Hey Azarvis” or type in the search bar. Azarvis asks a few questions to get to know you.' },
  { icon: 'zap', hue: 38, title: 'Azarvis gets it done', text: 'Reminders set, notes found, drafts written, answers spoken back to you.' },
];

const SECURITY = [
  ['key', 265, 'Passkeys, no password', 'Sign in with Face ID, Touch ID, Windows Hello or a fingerprint on iPhone, Android, Mac and Windows.'],
  ['shield', 160, 'Two-step sign-in', 'Passwords are hashed with bcrypt and need a one-time code; repeated wrong guesses lock the account.'],
  ['clock', 205, 'Short-lived sessions', 'Access tokens live only in memory; refresh cookies are httpOnly.'],
  ['trash', 345, 'Your data, deletable', 'Deleting your account removes your chats, notes and documents.'],
];

export const FAQ = [
  ['Do I need an account to try Azarvis?', 'No. Talk to Azarvis right on this page, or open the demo to look around the app with sample data: chat, add tasks, browse the real study notes and write drafts. Nothing in the demo is sent to a server; tasks you add stay in your browser.'],
  ['Which AI powers Azarvis?', 'Answers come from Claude by Anthropic. Azarvis adds the voice, your reminders, your documents and your notes around it.'],
  ['Does Azarvis send emails or posts on its own?', 'No. Automate writes drafts. You read them and send them yourself, so nothing goes out without your yes.'],
  ['Can I sign in without a password?', 'Yes, with a passkey. Sign in once, open Account, and add a passkey on each device you use. After that, Face ID, Touch ID, Windows Hello or your fingerprint opens Azarvis on that device. The secret key never leaves the device.'],
  ['Can I use it on my phone?', 'Yes. Azarvis works in a phone browser and can be installed like an app (Install app in the sidebar).'],
  ['What happens to my data?', 'Your chats, notes and documents belong to your account. You can sign out of every device or delete the account, which removes them.'],
  ['Who built Azarvis?', 'Aamir Hussain Azad, an AI/ML engineer and full-stack developer from India. The source code and his other projects are on GitHub.'],
];

const DEMO_TILES = [
  ['chat', 'chat', 190, 'Chat', 'Ask by voice or text; answers are read aloud.'],
  ['tasks', 'tasks', 38, 'Tasks', 'Add, tick off and delete reminders; they stay in your browser.'],
  ['notes', 'notes', 48, 'Notes', 'Browse the real AI/ML study notes and courses.'],
  ['automate', 'rocket', 300, 'Automate', 'Write a draft email or post in one click.'],
];

// Brand colors for the "works with" strip.
const WORKS = [
  ['mail', 'Gmail', '#ea4335'],
  ['drive', 'Google Drive', '#34a853'],
  ['youtube', 'YouTube', '#ff0033'],
  ['linkedin', 'LinkedIn', '#0a66c2'],
  ['instagram', 'Instagram', '#e1306c'],
  ['sparkles', 'Claude AI', '#d97757'],
];

const PILLARS = [
  ['mic', 190, 'Voice', 'that listens'],
  ['zap', 38, 'Tools', 'that connect'],
  ['notes', 160, 'Notes', 'that teach'],
  ['shield', 280, 'Trust', 'that endures'],
];

// Numbers that count up when they scroll into view (all from the app's real content).
const STATS = [
  [86, '', 'AI/ML study chapters', 'notes', 48],
  [244, '', 'course lectures', 'book', 205],
  [6, '+', 'live apps by Aamir', 'globe', 160],
  [4, '', 'devices: Windows, Mac, Android, iPhone', 'phone', 280],
];

const COMMANDS = ['Remind me to call mom at 6 pm', 'Open the notes', 'Open Arvixa Store', 'What time is it?', 'Show me the projects', 'Tell me a joke'];

/** Counts from 0 to `to` once the element is on screen. */
function CountUp({ to, suffix = '' }) {
  const ref = useRef(null);
  const [n, setN] = useState(0);
  useEffect(() => {
    const el = ref.current;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!el || reduce || !('IntersectionObserver' in window)) return setN(to);
    let frame = 0;
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      const start = performance.now();
      const tick = (now) => {
        const p = Math.min((now - start) / 1100, 1);
        setN(Math.round(to * (1 - (1 - p) ** 3)));
        if (p < 1) frame = requestAnimationFrame(tick);
      };
      frame = requestAnimationFrame(tick);
    }, { threshold: 0.4 });
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [to]);
  return <strong ref={ref}>{n}{suffix}</strong>;
}

/** Pointer tilt for the hero art (skipped on touch screens and for reduced motion). */
function useTilt() {
  const stage = useRef(null);
  useEffect(() => {
    const el = stage.current;
    if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches || !window.matchMedia('(pointer: fine)').matches) return;
    let frame = 0;
    const move = (e) => {
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        el.style.setProperty('--ry', `${(x * 14).toFixed(2)}deg`);
        el.style.setProperty('--rx', `${(-y * 10).toFixed(2)}deg`);
        el.style.setProperty('--gx', `${((x + 0.5) * 100).toFixed(1)}%`);
        el.style.setProperty('--gy', `${((y + 0.5) * 100).toFixed(1)}%`);
      });
    };
    const leave = () => {
      cancelAnimationFrame(frame);
      el.style.setProperty('--ry', '0deg');
      el.style.setProperty('--rx', '0deg');
    };
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerleave', leave);
    return () => {
      cancelAnimationFrame(frame);
      el.removeEventListener('pointermove', move);
      el.removeEventListener('pointerleave', leave);
    };
  }, []);
  return stage;
}

/**
 * The hero: the glass "A" plus a working assistant console. Speak (or type, or tap a
 * command) and Azarvis answers out loud and acts: sets a reminder in the demo's Tasks,
 * opens a section, scrolls to the projects, switches the theme.
 */
function HeroAssistant({ onNavigate, onSection, theme }) {
  const stage = useTilt();
  const [reply, setReply] = useState({ text: 'Hi, I’m Azarvis. Tap the mic and talk to me, or try a command below.', action: null });
  const [input, setInput] = useState('');
  const [speaking, setSpeaking] = useState(false);
  const [voiceOn, setVoiceOn] = useState(true);
  const [lastTask, setLastTask] = useState(null);

  const run = (text, via) => {
    const q = text.trim();
    if (!q) return;
    setInput('');
    const answer = respond(q);
    setReply({ text: answer.text, action: answer.action ?? null, asked: q });
    track('hero_command', { via, intent: answer.action?.type ?? 'answer' });
    if (voiceOn && speak(answer.text, { onEnd: () => setSpeaking(false) })) setSpeaking(true);
    const a = answer.action;
    if (!a) return;
    if (a.type === 'task') {
      saveDemoTask(a.task);
      setLastTask(a.task);
    } else if (a.type === 'theme') theme?.setChoice(a.mode);
    else if (a.type === 'link') window.open(a.href, '_blank', 'noopener,noreferrer'); // right away: still inside the click
    else if (a.type === 'scroll') setTimeout(() => onSection(a.id), 700);
    else if (a.type === 'demo') setTimeout(() => onNavigate('demo', a.section), 1400);
    else if (a.type === 'page') setTimeout(() => onNavigate(a.page), 1200);
  };

  const voice = useListen((said) => run(said, 'voice'));
  useEffect(() => () => window.speechSynthesis?.cancel(), []);
  const state = voice.listening ? 'listening' : speaking ? 'speaking' : 'idle';
  const statusText = voice.listening ? (voice.transcript || 'Listening… speak now') : speaking ? 'Speaking…' : voice.supported ? 'Tap the mic and talk' : 'Type a command';

  return (
    <div className="hero-side">
      <div className="hero-art" ref={stage}>
        <div className="hero-art-glow" aria-hidden="true" />
        <div className="hero-art-tilt" aria-hidden="true">
          <div className="hero-art-sway">
            <img src="/hero-azarvis.webp" alt="" width="530" height="540" className="hero-art-img" fetchpriority="high" decoding="async" />
            <div className="hero-art-shine" />
            <div className="hero-art-ring" />
            <div className="hero-art-ring hero-art-ring--2" />
          </div>
        </div>
        <div className={`hv-float hv-float--status hv-float--${state}`} aria-live="polite">
          <span className="hv-wave" aria-hidden="true">
            {Array.from({ length: 9 }, (_, i) => <span key={i} style={{ '--i': i }} />)}
          </span>
          <span className="hv-status-text">{statusText}</span>
        </div>
        <button type="button" className="hv-float hv-float--a" onClick={() => onNavigate('demo', 'tasks')}>
          <Icon name="alarm" size="1em" /> {lastTask ? `${lastTask.time ? fmtTime(lastTask.time) : 'Task'} · ${lastTask.text}` : 'Reminder set · 6:00 pm'}
        </button>
        <button type="button" className="hv-float hv-float--b" onClick={() => onNavigate('demo', 'automate')}>
          <Icon name="mail" size="1em" /> Draft ready for Gmail
        </button>
      </div>

      <div className="hud" role="region" aria-label="Talk to Azarvis">
        <div className="hud-reply">
          <span className="hud-avatar" aria-hidden="true"><img src="/icon.svg" alt="" width="22" height="22" /></span>
          <div className="grow">
            {reply.asked && <p className="hud-asked">“{reply.asked}”</p>}
            <p className="hud-text">{reply.text}</p>
            {reply.action?.type === 'task' && (
              <button type="button" className="hud-link" onClick={() => onNavigate('demo', 'tasks')}>
                See it in Tasks <Icon name="chevron" size="0.9em" />
              </button>
            )}
          </div>
          <button type="button" className={`hud-voice ${voiceOn ? 'on' : ''}`} onClick={() => { setVoiceOn((v) => !v); window.speechSynthesis?.cancel(); setSpeaking(false); }} aria-pressed={voiceOn} title={voiceOn ? 'Answers are read aloud: tap to mute' : 'Read answers aloud'} aria-label="Read answers aloud">
            <Icon name="volume" size="1em" />
          </button>
        </div>
        <form className="hud-input" onSubmit={(e) => { e.preventDefault(); run(input, 'text'); }}>
          <button
            type="button"
            className={`hud-mic ${voice.listening ? 'on' : ''}`}
            onClick={voice.listening ? voice.stop : voice.start}
            aria-pressed={voice.listening}
            aria-label={voice.listening ? 'Stop listening' : 'Talk to Azarvis'}
            title={voice.supported ? 'Talk to Azarvis' : 'Voice needs Chrome, Edge or Safari: type instead'}
          >
            <Icon name="mic" size="1.25em" />
          </button>
          <input value={voice.listening ? voice.transcript : input} onChange={(e) => setInput(e.target.value)} placeholder="Ask Azarvis or give a command…" aria-label="Command for Azarvis" maxLength={200} readOnly={voice.listening} />
          <button className="hud-send" disabled={!input.trim()} aria-label="Send">
            <Icon name="send" size="1.05em" />
          </button>
        </form>
        {voice.error && <p className="hud-error">{voice.error}</p>}
        <div className="hud-chips">
          {[...COMMANDS, theme?.mode === 'dark' ? 'Light mode' : 'Dark mode'].map((c) => (
            <button key={c} type="button" onClick={() => run(c, 'chip')}>{c}</button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Landing({ onNavigate, onSection, theme }) {
  // FAQ as structured data, so Google can show the answers right in search results.
  const faqLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQ.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />

      <section className="band band--hero" aria-labelledby="hero-title">
        <div className="pub-wrap hero">
          <div className="hero-copy">
            <span className="hero-kicker"><span className="hero-kicker-dot" /> AI voice assistant · by Aamir Hussain Azad</span>
            <h1 id="hero-title">
              Smarter today.
              <br />
              <span className="grad-text">Limitless tomorrow.</span>
            </h1>
            <p className="hero-built">Built with <strong>Azarvis</strong>.</p>
            <p className="hero-lead">
              Your personal AI voice assistant, powered by Claude. Talk naturally and Azarvis handles your <b>reminders</b>, <b>tasks</b>, <b>study notes</b>, <b>documents</b> and your <b>computer</b>, all from one place.
            </p>
            <div className="hero-ctas">
              <button type="button" className="btn primary btn-lg" onClick={() => onNavigate('signup')}>
                Get started free <Icon name="chevron" size="1em" />
              </button>
              <button type="button" className="btn btn-lg hero-ghost" onClick={() => onNavigate('demo')}>
                <Icon name="sparkles" size="1.05em" /> Explore the live demo
              </button>
            </div>
            <p className="hero-sub">
              No sign-up needed to try it. Already have an account?{' '}
              <button type="button" className="link-btn" onClick={() => onNavigate('login')}>Sign in</button>
            </p>
            <ul className="hero-pillars">
              {PILLARS.map(([icon, hue, top, bottom]) => (
                <li key={top} style={{ '--hue': hue }}>
                  <span className="hero-pillar-icon"><Icon name={icon} size="1.25em" /></span>
                  <span>{top}<br />{bottom}</span>
                </li>
              ))}
            </ul>
          </div>
          <HeroAssistant onNavigate={onNavigate} onSection={onSection} theme={theme} />
        </div>
      </section>

      <section className="band band--stats" aria-label="Azarvis in numbers">
        <div className="pub-wrap">
          <ul className="stats">
            {STATS.map(([n, suffix, label, icon, hue]) => (
              <li key={label} style={{ '--hue': hue }}>
                <span className="stat-icon"><Icon name={icon} size="1.2em" /></span>
                <CountUp to={n} suffix={suffix} />
                <span>{label}</span>
              </li>
            ))}
          </ul>
          <div className="works">
            <span className="works-title">Works with</span>
            <ul>
              {WORKS.map(([icon, label, color]) => (
                <li key={label} style={{ '--brand': color }}><Icon name={icon} size="1.1em" /> {label}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="band band--launch" aria-labelledby="launch-title">
        <div className="pub-wrap">
          <div className="launch-head">
            <h2 id="launch-title"><span className="proj-dot proj-dot--live" /> Live projects by Aamir</h2>
            <button type="button" className="link-btn" onClick={() => onSection('projects')}>See all projects and code <Icon name="chevron" size="0.9em" /></button>
          </div>
          <ul className="launch">
            {LIVE_APPS.filter((a) => !a.href.includes('azarvis-app.vercel.app')).map((a) => (
              <li key={a.href}>
                <a className="launch-btn" href={a.href} target="_blank" rel="noopener noreferrer" style={{ '--hue': a.hue ?? 220 }} onClick={() => track('project_open', { project: a.label, kind: 'launch' })}>
                  <span className="feature-icon sm"><Icon name={a.icon ?? 'globe'} size="1.05em" /></span>
                  <span className="grow">
                    <strong>{a.label}</strong>
                    <small>{a.short ?? a.text}</small>
                  </span>
                  <Icon name="external" size="0.95em" className="launch-go" />
                </a>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section id="features" className="band band--a">
        <div className="pub-wrap">
          <header className="section-head">
            <span className="section-kicker">Features</span>
            <h2>One assistant for your <span className="grad-text">whole day</span></h2>
            <p>From a quick question to a full study session: Azarvis keeps everything in one calm, fast app.</p>
          </header>
          <ul className="feature-grid">
            {FEATURES.map((f) => (
              <li key={f.title} className="feature-card" style={{ '--hue': f.hue }}>
                <span className="feature-icon"><Icon name={f.icon} size="1.3em" /></span>
                <h3>{f.title}</h3>
                <p>{f.text}</p>
                {f.demo ? (
                  <button type="button" className="feature-link" onClick={() => onNavigate('demo', f.demo)}>
                    Try it in the demo <Icon name="chevron" size="0.9em" />
                  </button>
                ) : (
                  <span className="feature-lock"><Icon name="key" size="0.9em" /> With a free account</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section id="demo-preview" className="band band--b">
        <div className="pub-wrap">
          <div className="demo-band">
            <div className="demo-band-copy">
              <span className="section-kicker">Live demo</span>
              <h2>Look around before you sign up</h2>
              <p>
                The demo is the real app layout with sample data. Click through every section, talk to the chat, add tasks and read the notes. Nothing is sent to a server.
              </p>
              <button type="button" className="btn primary btn-lg" onClick={() => onNavigate('demo')}>
                <Icon name="sparkles" size="1.05em" /> Open the demo
              </button>
            </div>
            <ul className="demo-tiles">
              {DEMO_TILES.map(([id, icon, hue, title, text]) => (
                <li key={id}>
                  <button type="button" className="demo-tile" style={{ '--hue': hue }} onClick={() => onNavigate('demo', id)}>
                    <span className="feature-icon sm"><Icon name={icon} /></span>
                    <span className="grow">
                      <strong>{title}</strong>
                      <span className="muted">{text}</span>
                    </span>
                    <Icon name="chevron" size="1em" className="demo-tile-go" />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section id="projects" className="band band--a">
        <div className="pub-wrap">
          <header className="section-head">
            <span className="section-kicker">Projects</span>
            <h2>Built by <span className="grad-text">Aamir Hussain Azad</span></h2>
            <p>Live apps on Vercel, Streamlit and Render, and every public repository, loaded straight from GitHub.</p>
          </header>
          <Projects />
        </div>
      </section>

      <section id="workflows" className="band band--a">
        <div className="pub-wrap">
          <header className="section-head">
            <span className="section-kicker">Automations</span>
            <h2>Say one sentence. <span className="grad-text">Azarvis runs the workflow.</span></h2>
            <p>Like Jarvis: one request becomes several steps, done in order. Press <b>Run it now</b> to try any of them here, without an account.</p>
          </header>
          <Workflows onNavigate={onNavigate} />
        </div>
      </section>

      <section id="how" className="band band--b">
        <div className="pub-wrap">
          <header className="section-head">
            <span className="section-kicker">How it works</span>
            <h2>From your voice to a finished task, in <span className="grad-text">five stages</span></h2>
            <p>One sentence goes through five separate parts of Azarvis. Here is what each one does with a real request.</p>
          </header>
          <ol className="pipeline">
            {PIPELINE.map((s, i) => (
              <li key={s.title} className="stage" style={{ '--hue': s.hue }}>
                <div className="stage-top">
                  <span className="feature-icon"><Icon name={s.icon} size="1.25em" /></span>
                  <span className="stage-num">Stage {i + 1}</span>
                </div>
                <h3>{s.title}</h3>
                <p>{s.text}</p>
                <p className="stage-example">{s.example}</p>
                <ul className="stage-tech">{s.tech.map((t) => <li key={t}>{t}</li>)}</ul>
              </li>
            ))}
          </ol>
          <h3 className="setup-title">Get started in three steps</h3>
          <ol className="steps">
            {STEPS.map((s, i) => (
              <li key={s.title} className="step" style={{ '--hue': s.hue }}>
                <span className="step-num">0{i + 1}</span>
                <span className="feature-icon"><Icon name={s.icon} size="1.3em" /></span>
                <h3>{s.title}</h3>
                <p>{s.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="band band--a">
        <div className="pub-wrap">
          <div className="security">
            <div className="security-copy">
              <span className="section-kicker">Security</span>
              <h2>Built like a banking app</h2>
              <p>Your assistant knows a lot about your day, so the sign-in is built to keep it yours.</p>
            </div>
            <ul className="security-list">
              {SECURITY.map(([icon, hue, title, text]) => (
                <li key={title} style={{ '--hue': hue }}>
                  <span className="feature-icon sm"><Icon name={icon} size="1.1em" /></span>
                  <div>
                    <strong>{title}</strong>
                    <p>{text}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section id="faq" className="band band--b">
        <div className="pub-wrap">
          <header className="section-head">
            <span className="section-kicker">FAQ</span>
            <h2>Questions, answered</h2>
          </header>
          <div className="faq">
            {FAQ.map(([q, a], i) => (
              <details key={q} className="faq-item" open={i === 0}>
                <summary>
                  {q}
                  <Icon name="plus" size="1.1em" className="faq-icon" />
                </summary>
                <p>{a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section id="feedback" className="band band--a">
        <div className="pub-wrap">
          <div className="feedback-band">
            <div className="feedback-copy">
              <span className="section-kicker">Feedback</span>
              <h2>Tell us what you think</h2>
              <p>Tried the demo or the app? Ideas, bugs and kind words all help. No account needed.</p>
              <ul className="feedback-points">
                <li><Icon name="check" size="1em" /> Read by Aamir, the developer</li>
                <li><Icon name="check" size="1em" /> Takes under a minute</li>
                <li><Icon name="check" size="1em" /> Reply by email if you want one</li>
              </ul>
              <p className="small">
                Prefer GitHub? <a href={`${REPO_URL}/issues`} target="_blank" rel="noopener noreferrer">Open an issue</a> · <a href={PORTFOLIO_URL} target="_blank" rel="noopener noreferrer">Portfolio</a>
              </p>
            </div>
            <div className="feedback-card">
              <FeedbackForm page="landing" />
            </div>
          </div>
        </div>
      </section>

    </>
  );
}
