import { useEffect, useRef, useState } from 'react';
import { Icon } from '../icons.jsx';
import './RobotShow.css';

// "Meet Azarvis": an animated robot that keeps working through what Azarvis really does: coding,
// speaking, reading, teaching, studying, watching and transforming (agents). It changes activity
// every few seconds, on its own, for as long as the section is on screen; tap a tab to pick one.
// While you scroll, the robot turns and floats a little. Plain SVG + CSS: no images, no libraries.

const MODES = [
  { id: 'coding', label: 'Coding', icon: 'code', hue: 190, sit: true, title: 'Writes and fixes code with you', text: 'Explains an error, writes the function, then checks it. Python, JavaScript, SQL and more.' },
  { id: 'speaking', label: 'Speaking', icon: 'mic', hue: 265, title: 'Talks like a person, in your language', text: 'Hands-free voice in about 39 languages. It listens, waits for you to finish, then answers out loud.' },
  { id: 'reading', label: 'Reading', icon: 'book', hue: 38, sit: true, title: 'Reads your documents for you', text: 'Upload PDFs, notes or a web page; ask a question and get the answer with where it came from.' },
  { id: 'teaching', label: 'Teaching', icon: 'sparkles', hue: 150, title: 'Teaches step by step', text: 'From neural networks to GST: explained simply, with examples, at your pace.' },
  { id: 'studying', label: 'Studying', icon: 'notes', hue: 330, sit: true, title: 'Studies with you and quizzes you', text: 'Smart notes for every lecture, then practice questions that check your answers.' },
  { id: 'watching', label: 'Watching', icon: 'eye', hue: 205, title: 'Sees what you show it', text: 'Describes a photo or your screen, reads text in images, and notices what changed.' },
  { id: 'transforming', label: 'Transforming', icon: 'workflow', hue: 290, title: 'Turns into a team of agents', text: 'One instruction becomes a plan; specialist agents work in parallel and it checks their results.' },
];
const STEP_MS = 4600;

function Robot({ mode }) {
  return (
    <svg className={`rb rb--${mode.id} ${mode.sit ? 'rb--sit' : ''}`} viewBox="0 0 460 440" role="img" aria-label={`The Azarvis robot ${mode.label.toLowerCase()}`}>
      <defs>
        <linearGradient id="rb-shell" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f8fbff" />
          <stop offset="1" stopColor="#c9d6f2" />
        </linearGradient>
        <linearGradient id="rb-shell-side" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#dfe8fb" />
          <stop offset="1" stopColor="#aebde0" />
        </linearGradient>
        <radialGradient id="rb-core">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.35" stopColor="#67e8f9" />
          <stop offset="1" stopColor="#4f46e5" />
        </radialGradient>
        <linearGradient id="rb-screen" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#0b1530" />
          <stop offset="1" stopColor="#1e1b4b" />
        </linearGradient>
      </defs>

      {/* floor glow */}
      <ellipse className="rb-floor" cx="210" cy="414" rx="118" ry="14" />

      {/* ---- props behind the robot ---- */}
      <g className="rb-prop rb-board" aria-hidden="true">
        <rect x="318" y="58" width="134" height="104" rx="12" />
        <path className="rb-draw" d="M338 136 L362 100 L386 122 L410 84 L432 108" />
        <circle cx="338" cy="136" r="5" /><circle cx="362" cy="100" r="5" /><circle cx="386" cy="122" r="5" /><circle cx="410" cy="84" r="5" /><circle cx="432" cy="108" r="5" />
        <text x="334" y="80">AI</text>
      </g>
      <g className="rb-prop rb-tv" aria-hidden="true">
        <rect x="8" y="92" width="124" height="80" rx="12" />
        <path d="M60 116 L84 132 L60 148 Z" />
        <rect className="rb-tv-bar" x="22" y="158" width="96" height="5" rx="2.5" />
        <rect className="rb-tv-fill" x="22" y="158" width="96" height="5" rx="2.5" />
      </g>
      <g className="rb-prop rb-talk" aria-hidden="true">
        <path className="rb-wave rb-wave--1" d="M112 104 Q98 120 112 136" />
        <path className="rb-wave rb-wave--2" d="M98 92 Q78 120 98 148" />
        <path className="rb-wave rb-wave--3" d="M84 80 Q58 120 84 160" />
        <g className="rb-bubble">
          <rect x="6" y="14" width="150" height="46" rx="16" />
          <path d="M120 58 L132 72 L136 58 Z" />
          <text x="20" y="34">Hello! नमस्ते!</text>
          <text x="20" y="51">How can I help?</text>
        </g>
      </g>
      <g className="rb-prop rb-gears" aria-hidden="true">
        <g className="rb-gear rb-gear--a"><circle cx="60" cy="70" r="18" /><circle cx="60" cy="70" r="7" /></g>
        <g className="rb-gear rb-gear--b"><circle cx="400" cy="90" r="24" /><circle cx="400" cy="90" r="9" /></g>
        <g className="rb-gear rb-gear--c"><circle cx="390" cy="300" r="15" /><circle cx="390" cy="300" r="6" /></g>
        <text x="20" y="250">⚙ plan</text><text x="352" y="200">⚙ agents</text><text x="30" y="330">✓ check</text>
      </g>
      <g className="rb-prop rb-code-float" aria-hidden="true">
        <text className="rb-float rb-float--1" x="70" y="200">{'</>'}</text>
        <text className="rb-float rb-float--2" x="350" y="160">{'{ }'}</text>
        <text className="rb-float rb-float--3" x="380" y="250">01</text>
        <text className="rb-float rb-float--4" x="40" y="120">def</text>
      </g>

      {/* ---- stool (sitting) ---- */}
      <g className="rb-stool">
        <rect x="156" y="320" width="108" height="16" rx="8" />
        <rect x="170" y="334" width="10" height="68" rx="4" />
        <rect x="240" y="334" width="10" height="68" rx="4" />
      </g>

      {/* ---- the robot ---- */}
      <g className="rb-body">
        <g className="rb-legs">
          <rect className="rb-shaft" x="176" y="296" width="26" height="82" rx="12" />
          <rect className="rb-shaft" x="218" y="296" width="26" height="82" rx="12" />
          <g className="rb-feet">
            <rect x="166" y="372" width="44" height="20" rx="10" />
            <rect x="210" y="372" width="44" height="20" rx="10" />
          </g>
        </g>

        <rect className="rb-torso" x="148" y="184" width="124" height="122" rx="36" fill="url(#rb-shell)" />
        <circle className="rb-ring" cx="210" cy="242" r="30" />
        <circle className="rb-core" cx="210" cy="242" r="18" fill="url(#rb-core)" />
        <rect className="rb-neck" x="194" y="168" width="32" height="22" rx="8" />

        {/* arms in front of the body, so hands can hold the book, type and write */}
        <g className="rb-arm rb-arm--l">
          <rect x="122" y="196" width="26" height="90" rx="13" fill="url(#rb-shell-side)" />
          <circle cx="135" cy="292" r="16" />
        </g>
        <g className="rb-arm rb-arm--r">
          <rect x="272" y="196" width="26" height="90" rx="13" fill="url(#rb-shell-side)" />
          <circle cx="285" cy="292" r="16" />
        </g>

        <g className="rb-head">
          <line className="rb-antenna" x1="210" y1="62" x2="210" y2="34" />
          <circle className="rb-bulb" cx="210" cy="30" r="8" />
          <circle className="rb-ear" cx="128" cy="118" r="15" />
          <circle className="rb-ear" cx="292" cy="118" r="15" />
          <rect x="130" y="58" width="160" height="118" rx="52" fill="url(#rb-shell)" />
          <rect className="rb-visor" x="146" y="78" width="128" height="80" rx="36" fill="url(#rb-screen)" />
          <g className="rb-eyes">
            <ellipse className="rb-eye" cx="186" cy="114" rx="12" ry="13" />
            <ellipse className="rb-eye" cx="234" cy="114" rx="12" ry="13" />
          </g>
          <path className="rb-smile" d="M196 140 Q210 150 224 140" />
          <g className="rb-mouth">
            <rect x="194" y="138" width="5" height="10" rx="2.5" />
            <rect x="203" y="134" width="5" height="18" rx="2.5" />
            <rect x="212" y="136" width="5" height="14" rx="2.5" />
            <rect x="221" y="139" width="5" height="8" rx="2.5" />
          </g>
        </g>
      </g>

      {/* ---- props in front of the robot ---- */}
      <g className="rb-prop rb-laptop" aria-hidden="true">
        <rect x="150" y="246" width="120" height="70" rx="8" />
        <g className="rb-code">
          <rect className="rb-line rb-line--1" x="162" y="258" width="62" height="6" rx="3" />
          <rect className="rb-line rb-line--2" x="172" y="272" width="80" height="6" rx="3" />
          <rect className="rb-line rb-line--3" x="172" y="286" width="48" height="6" rx="3" />
          <rect className="rb-line rb-line--4" x="162" y="300" width="70" height="6" rx="3" />
        </g>
        <path className="rb-laptop-base" d="M136 316 H284 L276 328 H144 Z" />
      </g>
      <g className="rb-prop rb-book" aria-hidden="true">
        <path className="rb-cover" d="M150 232 Q180 222 210 232 Q240 222 270 232 V286 Q240 276 210 286 Q180 276 150 286 Z" />
        <path className="rb-page" d="M210 232 Q240 222 266 232 V282 Q240 272 210 282 Z" />
        <path className="rb-lines" d="M162 244 H198 M162 254 H198 M162 264 H192 M222 244 H256 M222 254 H256 M222 264 H250" />
      </g>
      <g className="rb-prop rb-notes" aria-hidden="true">
        <rect x="160" y="296" width="100" height="40" rx="6" />
        <path className="rb-write" d="M172 312 q6 -8 12 0 t12 0 t12 0 t12 0 M172 324 q6 -8 12 0 t12 0" />
        <rect className="rb-pencil" x="246" y="270" width="8" height="40" rx="3" transform="rotate(32 250 290)" />
        <path className="rb-lamp" d="M330 330 V250 L360 236" />
        <path className="rb-lamp-head" d="M352 226 L384 236 L366 252 Z" />
        <path className="rb-lamp-light" d="M370 248 L340 330 H420 Z" />
      </g>
    </svg>
  );
}

export default function RobotShow({ onTry, onLab }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const section = useRef(null);
  const visible = useRef(true);
  const mode = MODES[index];

  // Keep working "always": a new activity every few seconds while the section is on screen.
  useEffect(() => {
    const el = section.current;
    const io = typeof IntersectionObserver !== 'undefined' ? new IntersectionObserver(([e]) => { visible.current = e.isIntersecting; }) : null;
    io?.observe(el);
    const timer = setInterval(() => {
      if (visible.current && !paused && !document.hidden) setIndex((i) => (i + 1) % MODES.length);
    }, STEP_MS);
    return () => {
      clearInterval(timer);
      io?.disconnect();
    };
  }, [paused]);

  // Scroll: the robot turns and floats a little as the section passes through the screen.
  useEffect(() => {
    const el = section.current;
    let frame = 0;
    const update = () => {
      frame = 0;
      const r = el.getBoundingClientRect();
      const p = Math.min(1, Math.max(0, (window.innerHeight - r.top) / (window.innerHeight + r.height)));
      el.style.setProperty('--p', p.toFixed(3));
    };
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(update); };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <section ref={section} className="band band--robot dark-zone" aria-labelledby="robot-title" style={{ '--hue': mode.hue }}>
      <div className="pub-wrap robot-show">
        <div className="robot-stage" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
          <div className="robot-halo" aria-hidden="true" />
          <div className="robot-turn" key={mode.id}>
            <Robot mode={mode} />
          </div>
        </div>

        <div className="robot-copy">
          <span className="robot-kicker"><Icon name="sparkles" size="0.95em" /> Meet your AI teammate</span>
          <h2 id="robot-title">Always learning. <span className="robot-grad">Always working.</span></h2>
          <div className="robot-now" aria-live="polite">
            <span className="robot-now-icon"><Icon name={mode.icon} size="1.15em" /></span>
            <div>
              <strong>{mode.title}</strong>
              <p>{mode.text}</p>
            </div>
          </div>
          <div className="robot-tabs" role="tablist" aria-label="What Azarvis does">
            {MODES.map((m, i) => (
              <button key={m.id} type="button" role="tab" aria-selected={i === index} className={i === index ? 'on' : ''} style={{ '--hue': m.hue }}
                onClick={() => { setIndex(i); setPaused(true); setTimeout(() => setPaused(false), 9000); }}>
                <Icon name={m.icon} size="1em" /> {m.label}
              </button>
            ))}
          </div>
          <div className="robot-progress" aria-hidden="true"><i key={`${mode.id}-${paused}`} className={paused ? 'paused' : ''} /></div>
          <div className="robot-ctas">
            {onLab && (
              <button type="button" className="btn primary robot-try" onClick={onLab}>
                <Icon name="cpu" size="1em" /> Enter the 3D Robot Lab
              </button>
            )}
            {onTry && (
              <button type="button" className="btn robot-try robot-try--ghost" onClick={onTry}>
                <Icon name="play" size="1em" /> Try the assistant
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
