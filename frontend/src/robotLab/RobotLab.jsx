import { useEffect, useRef, useState } from 'react';
import { streamChat } from '../api.js';
import { respond, speak } from '../brain.js';
import { Icon } from '../icons.jsx';
import { useListen } from '../useListen.js';
import { ACTIVITIES, confirmation, parseCommand } from './commands.js';
import './RobotLab.css';

// The 3D Robot Lab page (?page=lab): the robot in its lab (engine.js, three.js, loaded only here),
// controls for every movement and mode, and a talk box: say or type a command ("sit down",
// "start coding", "turn left"), or ask a question and the robot answers out loud.

const MOVES = [
  { id: 'walk', label: 'Walk', icon: 'play' },
  { id: 'run', label: 'Run', icon: 'zap' },
  { id: 'sit', label: 'Sit', icon: 'chevron' },
  { id: 'stand', label: 'Stand', icon: 'arrowUp' },
  { id: 'rotate-l', label: 'Rotate left', icon: 'refresh', action: { type: 'rotate', dir: 1 } },
  { id: 'rotate-r', label: 'Rotate right', icon: 'refresh', action: { type: 'rotate', dir: -1 } },
  { id: 'spin', label: '360°', icon: 'refresh' },
  { id: 'look', label: 'Look around', icon: 'eye' },
  { id: 'wave', label: 'Wave', icon: 'sparkles' },
  { id: 'reset', label: 'Reset position', icon: 'house' },
];
const MODES = ['coding', 'reading', 'teaching', 'speaking', 'research', 'thinking', 'dance'];

/** signedIn: questions go to the real AI (Claude, or OpenAI standing in); else the website's built-in assistant. */
export default function RobotLab({ signedIn = false }) {
  const stage = useRef(null);
  const engine = useRef(null);
  const [state, setState] = useState({ activity: 'idle', running: true, auto: false });
  const [failed, setFailed] = useState('');
  const [input, setInput] = useState('');
  const [log, setLog] = useState([{ who: 'robot', text: "Hi, I'm Azarvis. Pick a mode, or tell me what to do: “start coding”, “sit down”, “turn left”." }]);

  useEffect(() => {
    let disposed = false;
    let lab = null;
    import('./engine.js')
      .then(({ createRobotLab }) => {
        if (disposed) return;
        lab = createRobotLab(stage.current, { onState: setState });
        engine.current = lab;
        lab.setActivity('coding');
      })
      .catch((e) => setFailed(e?.message || 'WebGL is not available in this browser.'));
    return () => {
      disposed = true;
      lab?.dispose();
      engine.current = null;
      window.speechSynthesis?.cancel();
    };
  }, []);

  const say = (text) => {
    if (!text) return;
    setLog((l) => [...l.slice(-5), { who: 'robot', text }]);
    engine.current?.setTalking(true);
    const ok = speak(text, { onEnd: () => engine.current?.setTalking(false) });
    if (!ok) setTimeout(() => engine.current?.setTalking(false), Math.min(6000, 400 + text.length * 55));
  };

  const run = (action) => {
    engine.current?.command(action);
    say(confirmation(action));
  };

  const handle = (text) => {
    const t = text.trim();
    if (!t) return;
    setLog((l) => [...l.slice(-5), { who: 'you', text: t }]);
    const action = parseCommand(t);
    if (action) return run(action);
    // A question: the robot turns to speak and answers out loud.
    engine.current?.command({ type: 'activity', activity: 'speaking' });
    if (!signedIn) return say(respond(t).text);
    ask(t);
  };

  // Signed in: the real assistant answers (the same AI as Chat), with the built-in one as a fallback.
  const ask = async (t) => {
    setLog((l) => [...l.slice(-5), { who: 'robot', text: 'Thinking…', pending: true }]);
    let text = '';
    let failed = '';
    try {
      await streamChat(t, null, (ev) => {
        if (ev.type === 'text') text += ev.text;
        else if (ev.type === 'error') failed = ev.message || 'error';
      }, undefined, { voice: true });
    } catch (e) {
      failed = e.message || 'error';
    }
    setLog((l) => l.filter((m) => !m.pending));
    say(text.trim() || (failed ? `${respond(t).text}` : 'I could not find an answer to that.'));
  };

  const listen = useListen((heard) => handle(heard));
  const submit = (e) => {
    e.preventDefault();
    handle(input);
    setInput('');
  };

  const status = state.busy ? 'Moving to the right place…' : state.patrol ? (state.patrol === 'run' ? 'Running' : 'Walking') : state.running ? `${state.label || 'Idle'}${state.sitting ? ' · sitting' : ''}` : 'Paused (still breathing)';

  return (
    <div className="lab">
      <header className="lab-head">
        <div>
          <span className="lab-kicker"><Icon name="cpu" size="0.95em" /> 3D Robot Lab · live in your browser</span>
          <h1>Azarvis, the robot <span className="lab-grad">at work</span></h1>
          <p>Coding, reading, teaching, speaking, research and more: pick a mode, move it around, or talk to it. Drag to look around the lab; scroll to zoom.</p>
        </div>
        <div className={`lab-status ${state.running ? 'on' : ''}`} role="status">
          <i /> {status}{state.auto && <b>AUTO</b>}
        </div>
      </header>

      <div className="lab-grid">
        <div className="lab-stage" ref={stage} aria-label="The Azarvis robot in its 3D lab">
          {failed && (
            <div className="lab-failed">
              <Icon name="alert" size="1.4em" />
              <p>The 3D lab needs WebGL, which this browser or device has turned off. {failed}</p>
            </div>
          )}
        </div>

        <aside className="lab-panel">
          <section>
            <h2><Icon name="target" size="1em" /> Control</h2>
            <div className="lab-row">
              <button type="button" className={`lab-btn lab-btn--main ${state.running ? '' : 'on'}`} onClick={() => run({ type: state.running ? 'stop' : 'start' })}>
                <Icon name={state.running ? 'stop' : 'play'} size="1em" /> {state.running ? 'Stop' : 'Start'}
              </button>
              <button type="button" className={`lab-btn lab-btn--main ${state.auto ? 'on' : ''}`} onClick={() => run({ type: 'auto' })} aria-pressed={state.auto}>
                <Icon name="refresh" size="1em" /> Auto mode
              </button>
            </div>
          </section>

          <section>
            <h2><Icon name="sparkles" size="1em" /> Modes</h2>
            <div className="lab-chips">
              {MODES.map((id) => (
                <button key={id} type="button" className={`lab-btn ${state.activity === id ? 'on' : ''}`} onClick={() => run({ type: 'activity', activity: id })} aria-pressed={state.activity === id}>
                  <Icon name={ACTIVITIES[id].icon} size="1em" /> {ACTIVITIES[id].label}
                </button>
              ))}
            </div>
          </section>

          <section>
            <h2><Icon name="pulse" size="1em" /> Movement</h2>
            <div className="lab-chips">
              {MOVES.map((m) => {
                const action = m.action || { type: m.id };
                const on = (m.id === 'walk' || m.id === 'run') && state.patrol === m.id;
                return (
                  <button key={m.id} type="button" className={`lab-btn ${on ? 'on' : ''} ${m.id === 'rotate-r' ? 'flip' : ''}`} onClick={() => run(action)}>
                    <Icon name={m.icon} size="1em" /> {m.label}
                  </button>
                );
              })}
            </div>
          </section>

          <section className="lab-talk">
            <h2><Icon name="chat" size="1em" /> Talk to it</h2>
            <div className="lab-log" aria-live="polite">
              {log.map((m, i) => <p key={i} className={`lab-msg lab-msg--${m.who}`}>{m.text}</p>)}
              {listen.listening && <p className="lab-msg lab-msg--you lab-msg--live">{listen.transcript || 'Listening…'}</p>}
            </div>
            <form className="lab-form" onSubmit={submit}>
              <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="“Sit down”, “start teaching”, or ask anything" aria-label="Command or question for the robot" />
              {listen.supported && (
                <button type="button" className={`lab-mic ${listen.listening ? 'on' : ''}`} onClick={() => (listen.listening ? listen.stop() : listen.start())} aria-label={listen.listening ? 'Stop listening' : 'Speak a command'}>
                  <Icon name="mic" size="1.1em" />
                </button>
              )}
              <button type="submit" className="lab-send" aria-label="Send"><Icon name="send" size="1.05em" /></button>
            </form>
            {listen.error && <p className="lab-note">{listen.error}</p>}
            <p className="lab-note">{signedIn ? 'Questions are answered by your Azarvis AI (the same as Chat); commands move the robot.' : "Voice uses your browser's speech recognition and voice. Answers here come from the website's built-in assistant; sign in for full AI answers."}</p>
          </section>
        </aside>
      </div>
    </div>
  );
}
