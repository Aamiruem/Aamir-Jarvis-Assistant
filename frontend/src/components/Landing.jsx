import { useEffect, useRef } from 'react';
import { Icon } from '../icons.jsx';
import { PORTFOLIO_URL, REPO_URL } from '../siteLinks.js';
import FeedbackForm from './FeedbackForm.jsx';

// The public website shown before sign-in: what Azarvis is, what it does, a way into the demo
// (no account), how it works, security, FAQ and the feedback form. Every claim here matches
// a feature that exists in the app.

const FEATURES = [
  { icon: 'mic', hue: 190, title: 'Voice assistant', text: 'Say “Hey Azarvis”, ask anything and hear the answer out loud. Hands-free from start to finish.', demo: 'chat' },
  { icon: 'chat', hue: 205, title: 'Chat with Claude', text: 'Long answers, code, maths and summaries in a clean chat, with your history saved and searchable.', demo: 'chat' },
  { icon: 'tasks', hue: 38, title: 'Tasks & reminders', text: '“Remind me at 6 pm” just works. Azarvis reads today’s reminders when you start your day.', demo: 'tasks' },
  { icon: 'notes', hue: 45, title: 'Notes & courses', text: 'Hundreds of AI/ML study chapters and lectures, with search, practice cards and reading progress.', demo: 'notes' },
  { icon: 'rocket', hue: 300, title: 'Automate', text: 'Drafts for Gmail, LinkedIn, Instagram and YouTube. You review and send them yourself.', demo: 'automate' },
  { icon: 'book', hue: 265, title: 'Knowledge base', text: 'Upload PDFs and documents, search them, and let Azarvis answer from what they say.' },
  { icon: 'flask', hue: 160, title: 'ML Lab', text: 'Train models on your own CSV files and see honest scores, measured on rows held back from training.' },
  { icon: 'eye', hue: 330, title: 'Vision & Room Watch', text: 'Describe photos and screenshots, and get greeted when you walk into the room.' },
];

const STEPS = [
  { icon: 'user', title: 'Create your account', text: 'Email and password, confirmed with a one-time code. Takes about a minute.' },
  { icon: 'mic', title: 'Talk or type', text: 'Say “Hey Azarvis” or type in the search bar. Azarvis asks a few questions to get to know you.' },
  { icon: 'zap', title: 'Azarvis gets it done', text: 'Reminders set, notes found, drafts written, answers spoken back to you.' },
];

const SECURITY = [
  ['key', 'Passkeys, no password', 'Sign in with Face ID, Touch ID, Windows Hello or a fingerprint on iPhone, Android, Mac and Windows.'],
  ['shield', 'Two-step sign-in', 'Passwords are hashed with bcrypt and need a one-time code; repeated wrong guesses lock the account.'],
  ['clock', 'Short-lived sessions', 'Access tokens live only in memory; refresh cookies are httpOnly.'],
  ['trash', 'Your data, deletable', 'Deleting your account removes your chats, notes and documents.'],
];

const FAQ = [
  ['Do I need an account to try Azarvis?', 'No. Open the demo to look around the app with sample data: chat with scripted answers, add tasks, browse the real study notes and write drafts. Nothing in the demo is sent to a server; tasks you add stay in your browser.'],
  ['Which AI powers Azarvis?', 'Answers come from Claude by Anthropic. Azarvis adds the voice, your reminders, your documents and your notes around it.'],
  ['Does Azarvis send emails or posts on its own?', 'No. Automate writes drafts. You read them and send them yourself, so nothing goes out without your yes.'],
  ['Can I sign in without a password?', 'Yes, with a passkey. Sign in once, open Account, and add a passkey on each device you use. After that, Face ID, Touch ID, Windows Hello or your fingerprint opens Azarvis on that device. The secret key never leaves the device.'],
  ['Can I use it on my phone?', 'Yes. Azarvis works in a phone browser and can be installed like an app (Install app in the sidebar).'],
  ['What happens to my data?', 'Your chats, notes and documents belong to your account. You can sign out of every device or delete the account, which removes them.'],
  ['Who built Azarvis?', 'Aamir Hussain Azad, an AI/ML engineer and full-stack developer. The source code is on GitHub.'],
];

const DEMO_TILES = [
  ['chat', 'chat', 190, 'Chat', 'Ask sample questions and hear the answers read aloud.'],
  ['tasks', 'tasks', 38, 'Tasks', 'Add, tick off and delete reminders; they stay in your browser.'],
  ['notes', 'notes', 45, 'Notes', 'Browse the real AI/ML study notes and courses.'],
  ['automate', 'rocket', 300, 'Automate', 'Write a draft email or post in one click.'],
];

// The four pillars under the hero buttons (icon + two short lines, like the brand artwork).
const PILLARS = [
  ['mic', 'Voice', 'that listens'],
  ['zap', 'Tools', 'that connect'],
  ['notes', 'Notes', 'that teach'],
  ['shield', 'Trust', 'that endures'],
];

/**
 * The hero art: the glass "A" on its platform over the city. It tilts in 3D toward the
 * pointer, sways slowly on its own, and a holo ring turns under it. Pointer tilt is skipped
 * for touch screens and for visitors who asked for reduced motion.
 */
function HeroVisual() {
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
        el.style.setProperty('--ry', `${(x * 16).toFixed(2)}deg`);
        el.style.setProperty('--rx', `${(-y * 12).toFixed(2)}deg`);
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

  return (
    <div className="hero-art" ref={stage} aria-hidden="true">
      <div className="hero-art-glow" />
      <div className="hero-art-tilt">
        <div className="hero-art-sway">
          <img src="/hero-azarvis.webp" alt="" width="530" height="540" className="hero-art-img" fetchpriority="high" decoding="async" />
          <div className="hero-art-shine" />
          <div className="hero-art-ring" />
          <div className="hero-art-ring hero-art-ring--2" />
        </div>
      </div>
      <div className="hv-float hv-float--listen">
        <span className="hv-wave">
          {Array.from({ length: 9 }, (_, i) => <span key={i} style={{ '--i': i }} />)}
        </span>
        Listening…
      </div>
      <div className="hv-float hv-float--a"><Icon name="check" size="1em" /> Reminder set · 6:00 pm</div>
      <div className="hv-float hv-float--b"><Icon name="mail" size="1em" /> Draft ready for Gmail</div>
    </div>
  );
}

export default function Landing({ onNavigate }) {
  return (
    <>
      <section className="hero pub-wrap">
        <div className="hero-copy">
          <span className="hero-kicker">Intelligence that moves with you</span>
          <h1>
            Smarter today.
            <br />
            <span className="grad-text">Limitless tomorrow.</span>
          </h1>
          <p className="hero-built">Built with Azarvis.</p>
          <p className="hero-lead">
            Your personal AI voice assistant. Azarvis listens, answers out loud and handles your reminders, tasks, study notes, documents and your computer, all from one place.
          </p>
          <div className="hero-ctas">
            <button type="button" className="btn primary btn-lg" onClick={() => onNavigate('signup')}>
              Get started <Icon name="chevron" size="1em" />
            </button>
            <button type="button" className="btn btn-lg hero-ghost" onClick={() => onNavigate('demo')}>
              <Icon name="sparkles" size="1.05em" /> Explore the live demo
            </button>
          </div>
          <p className="hero-sub muted">
            No sign-up needed for the demo. Already have an account?{' '}
            <button type="button" className="link-btn" onClick={() => onNavigate('login')}>Sign in</button>
          </p>
          <ul className="hero-pillars">
            {PILLARS.map(([icon, top, bottom]) => (
              <li key={top}>
                <Icon name={icon} size="1.5em" />
                <span>{top}<br />{bottom}</span>
              </li>
            ))}
          </ul>
        </div>
        <HeroVisual />
      </section>

      <section className="works pub-wrap" aria-label="Works with">
        <span className="works-title muted">Works with the tools you already use</span>
        <ul>
          {[['mail', 'Gmail'], ['drive', 'Google Drive'], ['youtube', 'YouTube'], ['linkedin', 'LinkedIn'], ['instagram', 'Instagram'], ['sparkles', 'Claude AI']].map(([icon, label]) => (
            <li key={label}><Icon name={icon} size="1.15em" /> {label}</li>
          ))}
        </ul>
      </section>

      <section id="features" className="pub-section pub-wrap">
        <header className="section-head">
          <span className="section-kicker">Features</span>
          <h2>One assistant for your whole day</h2>
          <p className="muted">From a quick question to a full study session: Azarvis keeps everything in one calm, fast app.</p>
        </header>
        <ul className="feature-grid">
          {FEATURES.map((f) => (
            <li key={f.title} className="feature-card" style={{ '--hue': f.hue }}>
              <span className="badge-icon lg"><Icon name={f.icon} /></span>
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
      </section>

      <section id="demo-preview" className="pub-section pub-wrap">
        <div className="demo-band">
          <div className="demo-band-copy">
            <span className="section-kicker">Live demo</span>
            <h2>Look around before you sign up</h2>
            <p className="muted">
              The demo is the real app layout with sample data. Click through every section, try the chat, add tasks and read the notes. Nothing is sent to a server.
            </p>
            <button type="button" className="btn primary btn-lg" onClick={() => onNavigate('demo')}>
              <Icon name="sparkles" size="1.05em" /> Open the demo
            </button>
          </div>
          <ul className="demo-tiles">
            {DEMO_TILES.map(([id, icon, hue, title, text]) => (
              <li key={id}>
                <button type="button" className="demo-tile" style={{ '--hue': hue }} onClick={() => onNavigate('demo', id)}>
                  <span className="badge-icon"><Icon name={icon} /></span>
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
      </section>

      <section id="how" className="pub-section pub-wrap">
        <header className="section-head">
          <span className="section-kicker">How it works</span>
          <h2>Up and running in three steps</h2>
        </header>
        <ol className="steps">
          {STEPS.map((s, i) => (
            <li key={s.title} className="step">
              <span className="step-num">{i + 1}</span>
              <span className="step-icon"><Icon name={s.icon} size="1.3em" /></span>
              <h3>{s.title}</h3>
              <p className="muted">{s.text}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="pub-section pub-wrap">
        <div className="security">
          <div className="security-copy">
            <span className="section-kicker">Security</span>
            <h2>Built like a banking app</h2>
            <p className="muted">Your assistant knows a lot about your day, so the sign-in is built to keep it yours.</p>
          </div>
          <ul className="security-list">
            {SECURITY.map(([icon, title, text]) => (
              <li key={title}>
                <span className="security-icon"><Icon name={icon} size="1.1em" /></span>
                <div>
                  <strong>{title}</strong>
                  <p className="muted">{text}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section id="faq" className="pub-section pub-wrap">
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
      </section>

      <section id="feedback" className="pub-section pub-wrap">
        <div className="feedback-band">
          <div className="feedback-copy">
            <span className="section-kicker">Feedback</span>
            <h2>Tell us what you think</h2>
            <p className="muted">Tried the demo or the app? Ideas, bugs and kind words all help. No account needed.</p>
            <ul className="feedback-points">
              <li><Icon name="check" size="1em" /> Read by Aamir, the developer</li>
              <li><Icon name="check" size="1em" /> Takes under a minute</li>
              <li><Icon name="check" size="1em" /> Reply by email if you want one</li>
            </ul>
            <p className="muted small">
              Prefer GitHub? <a href={`${REPO_URL}/issues`} target="_blank" rel="noopener noreferrer">Open an issue</a> · <a href={PORTFOLIO_URL} target="_blank" rel="noopener noreferrer">Portfolio</a>
            </p>
          </div>
          <div className="feedback-card">
            <FeedbackForm page="landing" />
          </div>
        </div>
      </section>

      <section className="pub-section pub-wrap">
        <div className="final-cta">
          <div className="orb final-orb" aria-hidden="true" />
          <h2>Ready to talk to Azarvis?</h2>
          <p>Create your account in a minute, or look around the demo first.</p>
          <div className="hero-ctas">
            <button type="button" className="btn btn-lg final-primary" onClick={() => onNavigate('signup')}>
              Create free account
            </button>
            <button type="button" className="btn btn-lg final-secondary" onClick={() => onNavigate('demo')}>
              <Icon name="sparkles" size="1.05em" /> Try the demo
            </button>
          </div>
        </div>
      </section>
    </>
  );
}
