import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { saveDemoTask, speak } from '../brain.js';
import { Icon } from '../icons.jsx';
import { DEMO_IDEAS, LOOKS, parseIdea, parseProblem, QUESTIONS, runSolver, runSpecialist, strength, TEAMS, TONES } from '../studio.js';
import { renderImage } from '../studioArt.js';
import { toast } from '../ui.jsx';
import { useListen } from '../useListen.js';
import './AgentStudio.css';

// Agent Studio (see studio.js): talk to Azarvis (live voice) or type (chat), and a manager
// hands the work to a team of specialists who work at the same time. Create mode writes a
// week of content and designs 9 images; Solve mode diagnoses a problem and plans the fix.
// Auto mode: hands-free listening after each question, and the team starts when the call ends.
//
// onAsk(text): signed-in app only, opens the real AI chat for a deeper answer.
// onAddTask(task): saves a reminder (default: the demo's task list in this browser).

const SETTINGS_KEY = 'azarvis-studio-settings';
const readSettings = () => {
  try {
    return { tone: 'founder', look: 'editorial', handle: '@azarvis', auto: true, ...JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}') };
  } catch {
    return { tone: 'founder', look: 'editorial', handle: '@azarvis', auto: true };
  }
};
const BUILD_WORDS = /\b(build( it)?( now)?|start building|that'?s (all|it)|i'?m done|go ahead|solve it)\b/i;
const fmtClock = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

function useSettings() {
  const [settings, setSettings] = useState(readSettings);
  useEffect(() => {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch {}
  }, [settings]);
  return [settings, (patch) => setSettings((s) => ({ ...s, ...patch }))];
}

function Lightbox({ image, onClose }) {
  useEffect(() => {
    const esc = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', esc);
    return () => document.removeEventListener('keydown', esc);
  }, [onClose]);
  return (
    <div className="as-lightbox" role="dialog" aria-modal="true" aria-label={image.title} onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <figure>
        <img src={image.url} alt={image.title} />
        <figcaption>
          <span>{image.agent} · {image.kind}</span>
          <a className="btn sm" href={image.url} download={`azarvis-${image.kind}-${image.n}.png`}><Icon name="download" size="0.95em" /> Download</a>
          <button type="button" className="btn ghost sm" onClick={onClose}><Icon name="x" size="0.95em" /> Close</button>
        </figcaption>
      </figure>
    </div>
  );
}

export default function AgentStudio({ onAsk, onAddTask = saveDemoTask }) {
  const [settings, set] = useSettings();
  const { tone, look, handle, auto } = settings;
  const [mode, setMode] = useState('create'); // create | solve
  const [input, setInput] = useState('voice'); // voice | chat | demo
  const [map, setMap] = useState({});
  const [log, setLog] = useState([]); // [{ who: 'azarvis' | 'you', text }]
  const [step, setStep] = useState(-1); // question being answered; -1 = not started
  const [call, setCall] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [muted, setMuted] = useState(false);
  const [talking, setTalking] = useState(false); // Azarvis is speaking
  const [typed, setTyped] = useState('');
  const [run, setRun] = useState({ phase: 'idle', status: {}, results: {}, images: [] });
  const [open, setOpen] = useState(null);
  const refs = useRef({ map: {}, step: -1, call: false, muted: false, runId: 0, urls: [] });
  refs.current.map = map;
  refs.current.step = step;
  refs.current.call = call;
  refs.current.muted = muted;
  const logRef = useRef(null);

  const questions = QUESTIONS[mode];
  const team = TEAMS[mode];
  const power = useMemo(() => strength(map, mode), [map, mode]);
  const working = Object.values(run.status).filter((s) => s === 'working').length;
  const doneCount = Object.values(run.status).filter((s) => s === 'done').length;
  const imageTotal = mode === 'create' ? 9 : 0;

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: 'smooth' });
  }, [log]);
  useEffect(() => () => refs.current.urls.forEach((u) => URL.revokeObjectURL(u)), []);
  useEffect(() => () => window.speechSynthesis?.cancel(), []);
  useEffect(() => {
    if (!call) return;
    const t = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [call]);

  // ---------- the team ----------
  const build = useCallback(
    async (source = refs.current.map, { voice = false } = {}) => {
      const firstKey = QUESTIONS[mode][0].key;
      if (!(source[firstKey] || '').trim()) return toast(mode === 'create' ? 'Tell Azarvis your idea first' : 'Describe the problem first', 'error');
      const id = ++refs.current.runId;
      refs.current.urls.forEach((u) => URL.revokeObjectURL(u));
      refs.current.urls = [];
      const members = TEAMS[mode];
      const live = () => refs.current.runId === id;
      setRun({ phase: 'briefing', status: Object.fromEntries(members.map((m) => [m.id, 'waiting'])), results: {}, images: [] });
      await wait(450);
      if (!live()) return;
      setRun((r) => ({ ...r, phase: 'working' }));
      let n = 0;
      // Every specialist starts within a second and works in parallel; each image appears as soon as it is drawn.
      await Promise.all(
        members.map(async (m, i) => {
          await wait(120 + i * 140);
          if (!live()) return;
          setRun((r) => ({ ...r, status: { ...r.status, [m.id]: 'working' } }));
          await wait(350 + ((i * 397) % 700));
          const result = mode === 'create' ? runSpecialist(m.id, source, { tone, handle }) : runSolver(m.id, source);
          for (const card of result.images || []) {
            const url = await renderImage(card, { look, handle, label: m.makes });
            if (!live()) return URL.revokeObjectURL(url);
            refs.current.urls.push(url);
            const img = { url, kind: card.kind, title: card.title, agent: m.name, agentId: m.id, n: ++n };
            setRun((r) => ({ ...r, images: [...r.images, img] }));
            await wait(60);
          }
          if (!live()) return;
          setRun((r) => ({ ...r, status: { ...r.status, [m.id]: 'done' }, results: { ...r.results, [m.id]: result } }));
        }),
      );
      if (!live()) return;
      setRun((r) => ({ ...r, phase: 'done' }));
      const msg = mode === 'create' ? 'Done. Nine images and a week of content are ready.' : 'Done. Your diagnosis and fix plan are ready.';
      toast(msg);
      if (voice) speak(msg);
    },
    [mode, tone, look, handle],
  );

  // ---------- the interview (voice and chat share it) ----------
  const nextOpen = (m, after = -1) => QUESTIONS[mode].findIndex((q, i) => i > after && !(m[q.key] || '').trim());
  const say = (text) => setLog((l) => [...l, { who: 'azarvis', text }]);

  const listen = useListen((said) => onAnswer(said, true));
  useEffect(() => {
    if (listen.error) toast(listen.error, 'error');
  }, [listen.error]);

  const ask = (i, viaVoice) => {
    const q = QUESTIONS[mode][i];
    setStep(i);
    say(q.ask);
    if (!viaVoice) return;
    setTalking(true);
    const ok = speak(q.ask, {
      onEnd: () => {
        setTalking(false);
        if (refs.current.call && !refs.current.muted && settings.auto) listen.start();
      },
    });
    if (!ok) {
      setTalking(false);
      if (settings.auto) listen.start();
    }
  };

  const finish = (m, viaVoice) => {
    setStep(-1);
    const text = settings.auto ? (mode === 'create' ? 'Perfect. My team is on it.' : 'Thanks. My team is working on the fix.') : 'Got it. Press Build when you are ready.';
    say(text);
    const go = () => {
      if (viaVoice) endCall(false);
      if (settings.auto) build(m, { voice: viaVoice });
    };
    if (viaVoice) {
      setTalking(true);
      if (!speak(text, { onEnd: () => { setTalking(false); go(); } })) {
        setTalking(false);
        go();
      }
    } else go();
  };

  function onAnswer(raw, viaVoice) {
    const text = raw.trim();
    if (!text) return;
    setLog((l) => [...l, { who: 'you', text }]);
    let m = { ...refs.current.map };
    const cur = refs.current.step < 0 ? nextOpen(m) : refs.current.step;
    if (BUILD_WORDS.test(text) && text.split(/\s+/).length <= 5) {
      setMap(m);
      return finish(m, viaVoice);
    }
    if (cur === 0 && text.length > 120) m = { ...m, ...(mode === 'create' ? parseIdea(text) : parseProblem(text)) };
    else if (cur >= 0) m[QUESTIONS[mode][cur].key] = text;
    setMap(m);
    refs.current.map = m;
    const next = nextOpen(m, cur);
    const any = next >= 0 ? next : nextOpen(m);
    if (any >= 0) ask(any, viaVoice);
    else finish(m, viaVoice);
  }

  const startCall = () => {
    if (!listen.supported) {
      toast('Voice needs Chrome, Edge or Safari. Switched to chat.', 'error');
      setInput('chat');
      return startChat();
    }
    setCall(true);
    refs.current.call = true;
    setSeconds(0);
    setMuted(false);
    setLog([]);
    const first = nextOpen(refs.current.map);
    ask(first >= 0 ? first : 0, true);
  };
  function endCall(cancelSpeech = true) {
    setCall(false);
    refs.current.call = false;
    setTalking(false);
    listen.stop();
    if (cancelSpeech) window.speechSynthesis?.cancel();
  }
  const toggleMute = () => {
    const next = !muted;
    setMuted(next);
    refs.current.muted = next;
    if (next) listen.stop();
    else if (!talking) listen.start();
  };
  const startChat = () => {
    setLog([]);
    const first = nextOpen(refs.current.map);
    ask(first >= 0 ? first : 0, false);
  };
  const sendChat = (e) => {
    e.preventDefault();
    if (!typed.trim()) return;
    if (refs.current.step < 0 && !log.length) {
      refs.current.step = nextOpen(refs.current.map);
    }
    onAnswer(typed, false);
    setTyped('');
  };
  const runDemo = () => {
    const parsed = mode === 'create' ? parseIdea(DEMO_IDEAS[mode]) : parseProblem(DEMO_IDEAS[mode]);
    setMap(parsed);
    refs.current.map = parsed;
    setLog([{ who: 'you', text: DEMO_IDEAS[mode] }, { who: 'azarvis', text: 'Got everything I need. Starting the team.' }]);
    build(parsed);
  };
  const switchMode = (m) => {
    if (m === mode) return;
    endCall();
    refs.current.runId++;
    setMode(m);
    setMap({});
    refs.current.map = {};
    setLog([]);
    setStep(-1);
    setRun({ phase: 'idle', status: {}, results: {}, images: [] });
  };
  const reset = () => {
    endCall();
    refs.current.runId++;
    setMap({});
    refs.current.map = {};
    setLog([]);
    setStep(-1);
    setRun({ phase: 'idle', status: {}, results: {}, images: [] });
  };

  const copy = async (text, what = 'Copied') => {
    try {
      await navigator.clipboard.writeText(text);
      toast(what);
    } catch {
      toast('Select the text and copy it', 'error');
    }
  };
  const allText = () => team.filter((m) => run.results[m.id]).map((m) => `## ${run.results[m.id].title}\n\n${run.results[m.id].text}`).join('\n\n');
  const managerState = run.phase === 'idle' ? (call ? 'Listening' : 'Waiting') : run.phase === 'briefing' ? 'Briefing' : run.phase === 'working' ? 'Delegating' : 'Done';
  const orbState = talking ? 'speaking' : listen.listening ? 'listening' : call ? 'on' : '';
  // The conversation: above the box in chat (reads top-down), below the controls for voice and demo.
  const logView = log.length > 0 && (
    <div className={`as-log ${input === 'chat' ? 'as-log--chat' : ''}`} ref={logRef} aria-live="polite">
      {log.map((m, i) => (
        <div key={i} className={`as-msg as-msg--${m.who}`}>
          <small>{m.who === 'azarvis' ? 'Azarvis' : 'You'}</small>
          <p>{m.text}</p>
        </div>
      ))}
    </div>
  );

  return (
    <div className={`as as--${mode}`}>
      {/* ---------- top bar ---------- */}
      <div className="as-bar">
        <div className="as-seg" role="tablist" aria-label="What should the team do?">
          {[
            ['create', 'sparkles', 'Create content'],
            ['solve', 'zap', 'Solve a problem'],
          ].map(([id, icon, label]) => (
            <button key={id} type="button" role="tab" aria-selected={mode === id} className={mode === id ? 'on' : ''} onClick={() => switchMode(id)}>
              <Icon name={icon} size="1em" /> {label}
            </button>
          ))}
        </div>
        {mode === 'create' && (
          <>
            <label className="as-pick">
              <span>Tone</span>
              <select value={tone} onChange={(e) => set({ tone: e.target.value })}>
                {TONES.map(([id, l]) => <option key={id} value={id}>{l}</option>)}
              </select>
            </label>
            <label className="as-pick">
              <span>Look</span>
              <select value={look} onChange={(e) => set({ look: e.target.value })}>
                {LOOKS.map(([id, l]) => <option key={id} value={id}>{l}</option>)}
              </select>
            </label>
            <label className="as-pick as-pick--handle">
              <span>Handle</span>
              <input value={handle} onChange={(e) => set({ handle: e.target.value.slice(0, 24) })} aria-label="Your handle on the images" />
            </label>
          </>
        )}
        <label className="as-auto" title="Hands-free: Azarvis listens after each question and the team starts by itself when you finish">
          <input type="checkbox" checked={auto} onChange={(e) => set({ auto: e.target.checked })} />
          <span className="as-switch" aria-hidden="true" />
          Auto mode
        </label>
        <div className="as-seg as-seg--sm" role="tablist" aria-label="How to talk to Azarvis">
          {[
            ['voice', 'mic', 'Live voice'],
            ['chat', 'chat', 'Chat'],
            ['demo', 'play', 'Demo'],
          ].map(([id, icon, label]) => (
            <button key={id} type="button" role="tab" aria-selected={input === id} className={input === id ? 'on' : ''} onClick={() => { endCall(); setInput(id); }}>
              <Icon name={icon} size="0.95em" /> {label}
            </button>
          ))}
        </div>
      </div>

      <div className="as-grid">
        {/* ---------- left: talk + idea map ---------- */}
        <div className="as-col">
          <section className="as-card as-talk">
            <header className="as-card-head">
              <span className="as-kicker">{input === 'voice' ? 'Talk to Azarvis' : input === 'chat' ? 'Chat with Azarvis' : 'Watch a demo'}</span>
              {input === 'voice' && <span className="as-clock">{fmtClock(seconds)}</span>}
            </header>

            {input === 'voice' && (
              <>
                {!call ? (
                  <button type="button" className="as-call" onClick={startCall}><Icon name="mic" size="1.1em" /> {Object.keys(map).length ? 'Continue the call' : 'Call Azarvis'}</button>
                ) : (
                  <button type="button" className="as-call as-call--end" onClick={() => endCall()}><Icon name="phone" size="1.1em" /> End the call</button>
                )}
                <div className="as-row">
                  <button type="button" className="btn sm" onClick={toggleMute} disabled={!call}><Icon name="mic" size="0.95em" /> {muted ? 'Unmute mic' : 'Mute mic'}</button>
                  {call && !auto && !listen.listening && !talking && <button type="button" className="btn sm" onClick={listen.start}><Icon name="mic" size="0.95em" /> Answer</button>}
                  <button type="button" className="btn sm primary" onClick={() => { endCall(); build(); }} disabled={!(map[questions[0].key] || '').trim()}><Icon name="zap" size="0.95em" /> Build now</button>
                </div>
                <div className={`as-wave ${talking || listen.listening ? 'on' : ''}`} aria-hidden="true">
                  {Array.from({ length: 28 }, (_, i) => <i key={i} style={{ '--i': i }} />)}
                </div>
                <p className="as-status">{talking ? 'Azarvis speaking' : listen.listening ? (listen.transcript ? `“${listen.transcript}”` : 'Listening… speak now') : call ? (muted ? 'Mic muted' : auto ? 'One moment…' : 'Press Answer to reply') : 'Press Call: Azarvis asks a few questions out loud.'}</p>
              </>
            )}

            {input === 'chat' && (
              <>
                {!log.length && <button type="button" className="as-call" onClick={startChat}><Icon name="chat" size="1.1em" /> Start the chat</button>}
                {logView}
                <form className="as-chat-input" onSubmit={sendChat}>
                  <textarea value={typed} onChange={(e) => setTyped(e.target.value)} rows={3} placeholder={mode === 'create' ? 'Answer, or paste your whole idea at once…' : 'Describe the problem, or answer the question…'} aria-label="Your answer" onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) sendChat(e); }} />
                  <div className="as-row">
                    <button className="btn sm primary" disabled={!typed.trim()}><Icon name="send" size="0.95em" /> Send</button>
                    <button type="button" className="btn sm" onClick={() => build()} disabled={!(map[questions[0].key] || '').trim()}><Icon name="zap" size="0.95em" /> Build now</button>
                  </div>
                </form>
              </>
            )}

            {input === 'demo' && (
              <>
                <blockquote className="as-demo">{DEMO_IDEAS[mode]}</blockquote>
                <button type="button" className="as-call" onClick={runDemo}><Icon name="play" size="1.1em" /> Run the demo</button>
              </>
            )}

            {input !== 'chat' && logView}
          </section>

          <section className="as-card">
            <header className="as-card-head">
              <span className="as-kicker">{mode === 'create' ? 'Idea map' : 'Problem map'}</span>
              <span className={`as-chip ${power.score >= 60 ? 'ok' : ''}`}>{run.phase !== 'idle' ? 'Locked in' : call || log.length ? 'Listening' : 'Waiting'}</span>
            </header>
            <div className="as-strength">
              <div className="as-strength-top"><strong>{power.score}</strong> <span>{mode === 'create' ? 'Story strength' : 'Detail'} · {power.label}</span></div>
              <div className="as-meter"><i style={{ width: `${power.score}%` }} /></div>
              {power.missing.length > 0 && <small className="muted">Missing: {power.missing.join(', ')}</small>}
            </div>
            <ul className="as-map">
              {questions.map((q, i) => {
                const v = map[q.key] || '';
                return (
                  <li key={q.key} className={v ? 'filled' : step === i ? 'current' : ''}>
                    <span className="as-map-dot">{v ? <Icon name="check" size="0.8em" /> : null}</span>
                    <label>
                      <span>{q.label}</span>
                      <input value={v} placeholder={step === i ? 'listening…' : 'waiting…'} onChange={(e) => setMap((m) => ({ ...m, [q.key]: e.target.value }))} aria-label={q.label} />
                    </label>
                  </li>
                );
              })}
            </ul>
            {(Object.keys(map).length > 0 || run.phase !== 'idle') && <button type="button" className="btn ghost sm" onClick={reset}><Icon name="refresh" size="0.95em" /> Start over</button>}
          </section>
        </div>

        {/* ---------- right: team + visual wall ---------- */}
        <div className="as-col">
          <section className="as-card as-team">
            <header className="as-card-head">
              <div>
                <span className="as-kicker">The team</span>
                <p className="muted small">One call. One manager. {team.length} specialists at once.</p>
              </div>
              <span className="as-working"><strong>{run.phase === 'done' ? doneCount : working}</strong> {run.phase === 'done' ? 'done' : 'working'}</span>
            </header>
            <div className="as-graph">
              <div className="as-nodes">
                <div className={`as-orb ${orbState}`}><Icon name="mic" size="1.4em" /></div>
                <small>Azarvis<br /><b>{input === 'voice' ? 'live voice' : input}</b></small>
                <span className="as-link" aria-hidden="true" />
                <div className={`as-manager ${run.phase === 'working' || run.phase === 'briefing' ? 'busy' : run.phase === 'done' ? 'done' : ''}`}><Icon name="sparkles" size="1.3em" /></div>
                <small>Manager<br /><b>{managerState}</b></small>
              </div>
              <ul className={`as-members ${run.phase !== 'idle' ? 'live' : ''}`}>
                {team.map((m) => {
                  const st = run.status[m.id] || 'idle';
                  const thumbs = run.images.filter((im) => im.agentId === m.id);
                  return (
                    <li key={m.id} className={`as-member as-member--${st}`} style={{ '--hue': m.hue }}>
                      <span className="as-member-icon"><Icon name={m.icon} size="1em" /></span>
                      <span className="grow">
                        <strong>{m.name}</strong>
                        <small>{m.makes} · {m.detail}</small>
                      </span>
                      {thumbs.length > 0 && (
                        <span className="as-thumbs">{thumbs.slice(0, 3).map((t) => <img key={t.n} src={t.url} alt="" />)}</span>
                      )}
                      <span className="as-state">{st === 'idle' ? '' : st === 'waiting' ? 'Queued' : st === 'working' ? 'Working' : 'Done'}</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          </section>

          {mode === 'create' && (
            <section className="as-card">
              <header className="as-card-head">
                <div>
                  <span className="as-kicker">Visual wall</span>
                  <p className="muted small">Every image the design team makes lands here, live.</p>
                </div>
                <span className="as-count"><strong>{run.images.length}</strong> / {imageTotal}</span>
              </header>
              <div className="as-meter as-meter--thin"><i style={{ width: `${(run.images.length / imageTotal) * 100}%` }} /></div>
              <div className="as-wall">
                {run.images.map((im) => (
                  <button key={im.n} type="button" className={`as-shot as-shot--${im.kind}`} onClick={() => setOpen(im)} aria-label={`Open ${im.agent} image ${im.n}`}>
                    <img src={im.url} alt={im.title} />
                    <span>{im.kind} {im.n}</span>
                  </button>
                ))}
                {Array.from({ length: Math.max(0, imageTotal - run.images.length) }, (_, i) => (
                  <div key={`p${i}`} className={`as-shot as-shot--empty ${run.phase === 'working' ? 'pulse' : ''}`}><span>{run.phase === 'working' ? 'Designing…' : 'Waiting'}</span></div>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>

      {/* ---------- outputs ---------- */}
      {Object.keys(run.results).length > 0 && (
        <section className="as-outputs">
          <header className="as-out-head">
            <h3>{mode === 'create' ? 'Your week of content' : 'Diagnosis & fix plan'}</h3>
            <span className="as-row">
              <button type="button" className="btn sm" onClick={() => copy(allText(), 'Everything copied')}><Icon name="copy" size="0.95em" /> Copy all</button>
              {onAsk && (
                <button type="button" className="btn sm primary" onClick={() => onAsk(mode === 'create' ? `Improve this content and make it more engaging:\n\n${allText()}` : `Help me solve this problem step by step. Here is what I know:\n\n${allText()}`)}>
                  <Icon name="sparkles" size="0.95em" /> Deeper answer with Claude
                </button>
              )}
            </span>
          </header>
          <div className="as-out-grid">
            {team.filter((m) => run.results[m.id]).map((m) => {
              const r = run.results[m.id];
              const imgs = run.images.filter((im) => im.agentId === m.id);
              return (
                <article key={m.id} className="as-out" style={{ '--hue': m.hue }}>
                  <header>
                    <span className="as-member-icon"><Icon name={m.icon} size="1em" /></span>
                    <span className="grow"><strong>{r.title}</strong><small>{m.name}</small></span>
                    <button type="button" className="icon-btn" onClick={() => copy(r.text)} aria-label={`Copy ${r.title}`} title="Copy"><Icon name="copy" size="0.95em" /></button>
                  </header>
                  {imgs.length > 0 && (
                    <div className="as-out-imgs">
                      {imgs.map((im) => (
                        <button key={im.n} type="button" onClick={() => setOpen(im)} aria-label={`Open image ${im.n}`}><img src={im.url} alt={im.title} /></button>
                      ))}
                    </div>
                  )}
                  <pre className="as-out-text">{r.text}</pre>
                  {r.reminders && (
                    <button type="button" className="btn sm" onClick={() => { r.reminders.forEach((t) => onAddTask(t)); toast('Reminders added to Tasks'); }}>
                      <Icon name="alarm" size="0.95em" /> Add {r.reminders.length} reminders to Tasks
                    </button>
                  )}
                </article>
              );
            })}
          </div>
        </section>
      )}

      <p className="lab-note as-note"><Icon name="shield" size="0.95em" /> The studio runs in your browser in seconds: voice, writing and design. Nothing you say is sent to a server.</p>
      {open && <Lightbox image={open} onClose={() => setOpen(null)} />}
    </div>
  );
}
