import { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { api, streamChat } from '../api.js';
import { Icon } from '../icons.jsx';
import { AiNotice, aiProblemOf, isSetupError, spokenFailure } from './AiNotice.jsx';
import ChatHistory from './ChatHistory.jsx';
import { share } from '../pwa.js';
import { openUrl, quickCommand } from '../quickCommands.js';
import { cleanAnswer, markOnboarded } from '../session.js';
import { toast } from '../ui.jsx';
import { useSpeech } from '../useSpeech.js';
import { afterWakeWord } from '../wakeWord.js';

const SUGGESTIONS = [
  { icon: 'weather', hue: 205, text: "What's the weather in Mumbai?" },
  { icon: 'alarm', hue: 38, text: 'Remind me to call the bank tomorrow at 11am' },
  { icon: 'zap', hue: 265, text: 'What is 18% GST on 24,999?' },
  { icon: 'search', hue: 190, text: 'Search my documents for the refund policy' },
  { icon: 'chat', hue: 330, text: 'Write a leave email to my manager for tomorrow' },
  { icon: 'sparkles', hue: 150, text: 'Remind me to drink water at 4pm, add buy milk to my list, and tell me the weather in Pune' },
];

// What each agent tool did, in plain words (shown under Azarvis's reply).
const TOOL_LABELS = {
  create_task: 'Task added',
  complete_task: 'Task completed',
  list_tasks: 'Checked your tasks',
  get_weather: 'Checked the weather',
  get_time: 'Checked the time',
  calculate: 'Calculated',
  search_knowledge: 'Searched your documents',
  remember: 'Saved to memory',
  forget: 'Removed from memory',
  wikipedia: 'Looked it up',
  web_search: 'Searched the web',
  web_fetch: 'Read a web page',
  predict_house_price: 'Predicted a house price',
  list_ml_models: 'Checked your ML models',
  predict_with_model: 'Made an ML prediction',
  open_website: 'Opened website',
  system_control: 'Done on your PC',
  system_status: 'Checked your PC',
  compose_email: 'Email draft opened in Gmail',
  find_contact: 'Checked your contacts',
  add_contact: 'Contact saved',
  find_files: 'Searched your files',
  open_file: 'Opened file',
  read_clipboard: 'Read your clipboard',
  copy_to_clipboard: 'Copied to clipboard',
  look_at_screen: 'Looked at your screen',
};
const STOP_WORDS = /^(stop|stop listening|that's all|that is all|goodbye|bye|bye jarvis|exit|go to sleep)[.!]?$/i;
const LATER_WORDS = /^(stop|later|not now|cancel|maybe later|let's do this later|that's enough)[.!]?$/i;
const MAX_SILENT_ROUNDS = 4; // hands-free pauses after this many ~8 s stretches with no speech
const FOLLOW_UP_MS = 8000; // after Azarvis answers, a follow-up within this time needs no "Azarvis"
// Said when the answer takes a moment (tools, web), the way a person says "let me check".
const FILLERS = ['One moment.', 'Let me check.', 'On it.', 'Sure, one second.'];
const FILLER_AFTER_MS = 1600;


export default function Chat({ userId, history, conversationId, onConversation, prompt, onPromptUsed }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [busy, setBusyState] = useState(false);
  const busyRef = useRef(false);
  const setBusy = (v) => {
    busyRef.current = v; // read synchronously by the voice callbacks
    setBusyState(v);
  };
  const [voiceReplies, setVoiceReplies] = useState(false);
  const bottomRef = useRef(null);
  const abortRef = useRef(null);
  const currentIdRef = useRef(conversationId);
  const [handsFree, setHandsFree] = useState(false);
  const handsFreeRef = useRef(false);
  const silentRounds = useRef(0);
  const [voiceNote, setVoiceNote] = useState('');
  // Wake-word mode: always listening, but only acts on speech addressed to "Azarvis".
  const [wake, setWake] = useState(false);
  const wakeRef = useRef(false);
  const followUntil = useRef(0);
  const queuedRef = useRef(''); // said while Azarvis was still working: sent right after
  const contextRef = useRef(''); // the question Azarvis just asked, so the answer makes sense to the AI
  // Getting-to-know-you interview: { questions, index, answers, silent }
  const interviewRef = useRef(null);
  const [interviewStep, setInterviewStep] = useState(null); // { index, total } for the voice bar
  // Why AI answers can't work right now (rejected key, AI service down…), shown once at the top.
  const [aiProblem, setAiProblem] = useState(null);
  const [aiNoteHidden, setAiNoteHidden] = useState(false);
  const checkAi = () => api.health().then((h) => setAiProblem(aiProblemOf(h))).catch(() => {});
  useEffect(() => {
    checkAi();
  }, []);

  const speech = useSpeech({
    onFinal: (heard) => {
      silentRounds.current = 0;
      if (interviewRef.current) return answerInterview(heard);
      let text = heard;
      if (handsFreeRef.current && wakeRef.current && Date.now() > followUntil.current) {
        const request = afterWakeWord(heard);
        if (request === null) return; // not talking to Azarvis
        if (!request) {
          speech.speak('Yes?', () => {
            followUntil.current = Date.now() + FOLLOW_UP_MS;
          });
          return;
        }
        text = request;
      }
      if (handsFreeRef.current && STOP_WORDS.test(text)) {
        endHandsFree();
        speech.speak('Okay. Voice mode off.');
        return;
      }
      if (busyRef.current) {
        queuedRef.current = `${queuedRef.current} ${text}`.trim();
        return;
      }
      sendSpoken(text);
    },
    onSilence: () => {
      if (!handsFreeRef.current || busyRef.current) return;
      if (interviewRef.current) {
        // Thinking about the answer is fine; after a long silence, ask again once, then stop asking.
        const iv = interviewRef.current;
        iv.silent += 1;
        if (iv.silent === 2) jarvisSays(`Take your time. ${iv.questions[iv.index].ask(iv.answers)} Or say "skip".`);
        else if (iv.silent >= 4) stopInterview("Let's do this another time. I'm here whenever you need me.");
        return;
      }
      if (wakeRef.current) return; // always listening: silence is normal
      silentRounds.current += 1;
      if (silentRounds.current >= MAX_SILENT_ROUNDS) {
        endHandsFree();
        setVoiceNote("Voice mode paused: I didn't hear anything for a while. If you were talking, check the microphone (lock icon in the address bar → Microphone).");
      }
    },
    // In "Hey Azarvis" mode, background chatter must not cut Azarvis off: only its name does.
    shouldBargeIn: (heard) => !wakeRef.current || afterWakeWord(heard) !== null,
    onBargeIn: () => {
      followUntil.current = Date.now() + FOLLOW_UP_MS;
      if (busyRef.current && !interviewRef.current) abortRef.current?.abort(); // they've heard enough
    },
  });

  function sendSpoken(text) {
    const asked = contextRef.current;
    contextRef.current = '';
    send(text, { voice: true, context: asked ? `(You had just asked me: "${asked}")` : '' });
  }

  /** Shows a line from Azarvis in the chat and says it. */
  function jarvisSays(text, then) {
    setMessages((ms) => [...ms, { role: 'assistant', content: text }]);
    speech.speak(text, () => {
      followUntil.current = Date.now() + FOLLOW_UP_MS; // they can answer without "Azarvis"
      then?.();
    });
  }

  function beginInterview(greeting, questions) {
    interviewRef.current = { questions, index: 0, answers: {}, silent: 0 };
    setInterviewStep({ index: 0, total: questions.length });
    jarvisSays(`${greeting} ${questions[0].ask({})}`);
  }
  function answerInterview(heard) {
    const iv = interviewRef.current;
    if (LATER_WORDS.test(heard.trim())) return stopInterview("No problem, we can do this later. What can I do for you?");
    const question = iv.questions[iv.index];
    setMessages((ms) => [...ms, { role: 'user', content: heard }]);
    const answer = cleanAnswer(question, heard);
    if (answer) {
      iv.answers[question.key] = answer;
      api.addMemory(question.fact(answer)).catch(() => toast("Couldn't save that to memory", 'error'));
    }
    iv.index += 1;
    iv.silent = 0;
    const next = iv.questions[iv.index];
    if (!next) {
      const name = iv.answers.name;
      return stopInterview(
        `Thank you${name ? `, ${name}` : ''}. I've saved all of that, and you can change it any time in Memory. What can I do for you now?`,
      );
    }
    setInterviewStep({ index: iv.index, total: iv.questions.length });
    jarvisSays(next.ask(iv.answers));
  }
  function stopInterview(closing) {
    interviewRef.current = null;
    setInterviewStep(null);
    markOnboarded(userId);
    jarvisSays(closing);
  }

  // Hands-free loop: the mic stays open; each pause sends, the reply is spoken as it streams in.
  function listenSoon() {
    setTimeout(() => {
      if (handsFreeRef.current && mountedRef.current) speech.start({ keepOpen: true });
    }, 350);
  }
  /**
   * wake: wait for "Azarvis" before acting. greeting: say this first.
   * interview: questions to ask one by one. question: the greeting ends with this question.
   */
  function startHandsFree({ wake: useWake = false, greeting = '', interview = null, question = '' } = {}) {
    handsFreeRef.current = true;
    wakeRef.current = useWake;
    silentRounds.current = 0;
    queuedRef.current = '';
    setVoiceNote('');
    setHandsFree(true);
    setWake(useWake);
    speech.start({ keepOpen: true });
    if (interview?.length) beginInterview(greeting, interview);
    else if (greeting) {
      contextRef.current = question;
      jarvisSays(greeting);
    }
  }
  function endHandsFree() {
    handsFreeRef.current = false;
    wakeRef.current = false;
    queuedRef.current = '';
    contextRef.current = '';
    if (interviewRef.current) {
      interviewRef.current = null;
      setInterviewStep(null);
      markOnboarded(userId);
    }
    setHandsFree(false);
    setWake(false);
    speech.cancel();
    speech.stopSpeaking();
  }
  const interrupt = () => {
    speech.stopSpeaking();
    listenSoon();
  };
  // Leaving the chat stops the loop. A separate flag, not handsFreeRef: React's dev double-mount
  // runs this cleanup once on purpose, and that must not switch voice mode off.
  const mountedRef = useRef(false);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      window.speechSynthesis?.cancel();
    };
  }, []);

  // Hands-free watchdog: if the browser failed to restart the mic (it happens after errors or
  // when Chrome's speech service hiccups), start listening again instead of hanging on "Getting ready…".
  useEffect(() => {
    if (!handsFree) return;
    const t = setInterval(() => {
      if (handsFreeRef.current && mountedRef.current && speech.isIdle()) speech.start({ keepOpen: true });
    }, 2500);
    return () => clearInterval(t);
  }, [handsFree]);

  // A request handed over from the Home screen: send it, or type it in for the user to finish.
  const usedPrompt = useRef(null);
  useEffect(() => {
    if (!prompt || usedPrompt.current === prompt.id) return; // StrictMode runs effects twice in dev
    usedPrompt.current = prompt.id;
    if (prompt.handsFree) {
      startHandsFree({ wake: prompt.wake, greeting: prompt.greeting, interview: prompt.interview, question: prompt.question });
    }
    else if (prompt.send) send(prompt.text);
    else setInput(prompt.text);
    onPromptUsed?.();
  }, [prompt]);

  // Load history when switching conversations (but not when the id was just assigned by our own stream).
  useEffect(() => {
    if (conversationId === currentIdRef.current && messages.length) return;
    currentIdRef.current = conversationId;
    if (!conversationId) return setMessages([]);
    api.conversation(conversationId).then((c) => setMessages(c.messages)).catch(() => setMessages([]));
  }, [conversationId]);

  // Block body on purpose: newer Chrome returns a Promise from scrollIntoView, and an effect
  // that returns a non-function crashes React ("destroy is not a function"), blanking the app.
  useEffect(() => {
    if (messages.length) bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); // an empty chat stays at the top
  }, [messages]);

  const patchLast = (fn) => setMessages((ms) => [...ms.slice(0, -1), fn(ms[ms.length - 1])]);

  /** context: extra words for the AI only (e.g. the question this answers); the chat shows `text`. */
  async function send(text, { voice = false, context = '' } = {}) {
    const message = (text ?? input).trim();
    if (!message || busyRef.current) return;
    setInput('');
    // Spoken to, so answer out loud (the Speak button too, not only Voice mode or "Read aloud").
    const speakReply = handsFreeRef.current || voiceReplies || voice;

    // "open YouTube", "play X on YouTube": done right here, no AI round trip.
    const cmd = quickCommand(message);
    if (cmd) {
      setBusy(true);
      setMessages((ms) => [...ms, { role: 'user', content: message }, { role: 'assistant', content: '…', pending: true }]);
      let result;
      try {
        // Done by the AI service on this PC: apps, volume, lock… and links open in the default
        // browser, which Chrome's pop-up blocker can't stop.
        await api.systemAction(cmd.system?.action ?? 'open_url', cmd.system?.target ?? cmd.url);
        result = { content: cmd.say, tools: [{ name: 'system_control', ok: true }] };
      } catch (err) {
        if (cmd.url) {
          // System control unavailable (e.g. AI service on a server): open the tab from the page instead.
          const opened = openUrl(cmd.url);
          result = {
            content: opened ? cmd.say : `${cmd.say} Your browser blocked the new tab, so tap the button below.`,
            popupBlocked: !opened,
            tools: [{ name: 'open_website', ok: true }],
          };
        } else {
          result = { content: '', error: err.message, tools: [{ name: 'system_control', ok: false }] };
        }
      }
      if (cmd.url) result.links = [{ label: cmd.label, url: cmd.url }];
      patchLast((m) => ({ ...m, ...result, pending: false }));
      setBusy(false);
      const said = result.error ? spokenFailure(result.error) : cmd.say;
      if (speakReply) speech.speak(said, afterReply);
      else afterReply();
      return;
    }

    setBusy(true);
    setMessages((ms) => [...ms, { role: 'user', content: message }, { role: 'assistant', content: '', tools: [], pending: true }]);

    abortRef.current = new AbortController();
    let reply = '';
    let failure = '';
    // Spoken while it streams: Azarvis starts talking after the first sentence, not the last.
    const out = speakReply ? speech.speakStream() : null;
    const filler =
      out && voice && setTimeout(() => !reply && out.push(`${FILLERS[Math.floor(Math.random() * FILLERS.length)]} `), FILLER_AFTER_MS);
    try {
      await streamChat(
        context ? `${context}\n${message}` : message,
        currentIdRef.current,
        (ev) => {
          if (ev.type === 'conversation' && ev.id !== currentIdRef.current) {
            currentIdRef.current = ev.id;
            onConversation(ev.id);
          } else if (ev.type === 'nlp') {
            patchLast((m) => ({ ...m, intent: ev.intent }));
          } else if (ev.type === 'mind') {
            // How the user seems and how Azarvis answers: the voice follows the tone.
            out?.setStyle(ev.voice);
            patchLast((m) => ({ ...m, mind: ev }));
          } else if (ev.type === 'status') {
            patchLast((m) => ({ ...m, status: ev.message }));
          } else if (ev.type === 'text') {
            reply += ev.text;
            out?.push(ev.text);
            patchLast((m) => ({ ...m, status: '', content: m.content + ev.text }));
          } else if (ev.type === 'tool') {
            patchLast((m) => ({ ...m, tools: [...(m.tools || []), { name: ev.name, ok: ev.ok !== false }] }));
            if (ev.name === 'open_website' && ev.ok !== false && /^https?:\/\//.test(ev.input?.url || '')) {
              openUrl(ev.input.url);
              patchLast((m) => ({ ...m, links: [...(m.links || []), { label: new URL(ev.input.url).hostname.replace(/^www\./, ''), url: ev.input.url }] }));
            }
          } else if (ev.type === 'error') {
            failure = ev.message;
            patchLast((m) => ({ ...m, error: ev.message }));
          }
        },
        abortRef.current.signal,
        { voice },
      );
    } catch (err) {
      if (err.name !== 'AbortError') {
        failure = err.message;
        patchLast((m) => ({ ...m, error: err.message }));
      }
    } finally {
      clearTimeout(filler);
      patchLast((m) => ({ ...m, pending: false }));
      setBusy(false);
      if (failure) checkAi();
      if (out) {
        if (!reply && failure) out.push(spokenFailure(failure));
        out.end(afterReply);
      } else afterReply();
    }
  }

  // After an answer: open the follow-up window, then send anything said while Azarvis was busy.
  function afterReply() {
    followUntil.current = Date.now() + FOLLOW_UP_MS;
    if (handsFreeRef.current) listenSoon();
    const queued = queuedRef.current;
    queuedRef.current = '';
    if (queued && handsFreeRef.current) sendSpoken(queued);
  }

  const copyReply = (text) =>
    navigator.clipboard.writeText(text).then(() => toast('Copied to clipboard'), () => toast("Couldn't copy", 'error'));
  const shareReply = (text) =>
    share({ title: 'From Azarvis', text }).then((r) => r === 'copied' && toast('Copied, ready to paste'), () => toast("Couldn't share", 'error'));

  // The user message a failed reply answered, so "Try again" can send it once more.
  const retry = (i) => {
    const asked = messages.slice(0, i).findLast((m) => m.role === 'user')?.content;
    if (asked) send(asked);
  };
  const explained = Boolean(aiProblem) && !aiNoteHidden;

  return (
    <div className="chat">
      {history && <ChatHistory {...history} />}
      <div className="messages">
        {aiProblem && !aiNoteHidden && <AiNotice problem={aiProblem} onDismiss={() => setAiNoteHidden(true)} className="chat-notice" />}
        {messages.length === 0 && (
          <div className="chat-welcome">
            <div className={`orb big ${speech.listening ? 'pulse' : ''}`} />
            <h2>Good to see you. <span className="grad-text">How can I help?</span></h2>
            <p className="muted">Ask anything, give several tasks at once, or turn on Voice mode and just talk.</p>
            <div className="suggestions">
              {SUGGESTIONS.map((x) => (
                <button key={x.text} className="suggestion" style={{ '--hue': x.hue }} onClick={() => send(x.text)}>
                  <span className="badge-icon"><Icon name={x.icon} /></span>
                  <span>{x.text}</span>
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`msg ${m.role}`}>
            <span className={`msg-avatar ${m.role}`} aria-hidden="true"><Icon name={m.role === 'assistant' ? 'sparkles' : 'user'} size="1em" /></span>
            <div className="msg-col">
            {m.tools?.length > 0 && (
              <div className="tool-row">
                {m.tools.map((t, j) => {
                  const { name, ok } = typeof t === 'string' ? { name: t, ok: true } : t;
                  return (
                    <span key={j} className={`tool-chip ${ok ? 'ok' : 'failed'}`}>
                      <Icon name={ok ? 'check' : 'x'} size="0.95em" /> {TOOL_LABELS[name] || name}
                    </span>
                  );
                })}
              </div>
            )}
            {m.error && !m.content ? (
              <MessageError message={m.error} explained={explained} onRetry={busy ? null : () => retry(i)} />
            ) : (
              <div className="bubble">
                {m.role === 'assistant' ? (
                  m.pending && !m.content ? (
                    <span className="typing" aria-label="Azarvis is thinking">
                      <i /><i /><i />
                      {m.status && <small>{m.status}</small>}
                    </span>
                  ) : (
                    <ReactMarkdown>{m.content}</ReactMarkdown>
                  )
                ) : (
                  m.content
                )}
                {m.error && <MessageError message={m.error} explained={explained} onRetry={busy ? null : () => retry(i)} />}
                {m.links?.length > 0 && (
                  <div className="link-row">
                    {m.links.map((l, j) => (
                      <a key={j} className="btn open-link" href={l.url} target="_blank" rel="noopener noreferrer">Open {l.label} ↗</a>
                    ))}
                  </div>
                )}
                {m.popupBlocked && (
                  <p className="hint popup-tip">
                    To let Azarvis open sites by voice automatically: click the blocked pop-up icon at the right end of the
                    address bar → <b>Always allow pop-ups and redirects from {window.location.host}</b> → Done. You only need to do this once.
                  </p>
                )}
              </div>
            )}
            {m.role === 'assistant' && m.content && !m.pending && (
              <div className="msg-actions">
                <button className="icon-btn" title="Copy" aria-label="Copy reply" onClick={() => copyReply(m.content)}><Icon name="copy" size="1em" /></button>
                <button className="icon-btn" title="Read aloud" aria-label="Read reply aloud" onClick={() => speech.speak(m.content)}><Icon name="volume" size="1em" /></button>
                <button className="icon-btn" title="Share" aria-label="Share reply" onClick={() => shareReply(m.content)}><Icon name="share" size="1em" /></button>
                {m.intent && <span className="meta">intent: {m.intent}</span>}
                {m.mind && m.mind.emotion !== 'neutral' && (
                  <span className={`meta mind-chip mind-chip--${m.mind.emotion}`} title={[`Replying in a ${m.mind.tone} tone.`, ...(m.mind.realizations || [])].join(' ')}>
                    sensed: {m.mind.label} · {m.mind.voice?.style} voice
                  </span>
                )}
              </div>
            )}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {handsFree && (
        <div className={`voice-bar ${speech.speaking ? 'speaking' : busy ? 'thinking' : speech.listening ? 'listening' : ''}`}>
          <span className="voice-wave" aria-hidden="true"><i /><i /><i /><i /><i /></span>
          {interviewStep && (
            <span className="voice-step" title="Getting to know you">
              {interviewStep.index + 1}/{interviewStep.total}
            </span>
          )}
          <span className="voice-status" aria-live="polite">
            {speech.interim
              ? speech.interim
              : speech.speaking
                ? 'Speaking… just talk to interrupt'
                : busy
                  ? 'Working on it… keep talking, I’m still listening'
                  : speech.listening
                    ? interviewStep
                      ? 'Listening for your answer… or say “skip”'
                      : wake && Date.now() > followUntil.current
                        ? 'Always listening… start with “Azarvis”, e.g. “Azarvis, open Notepad”'
                        : 'Listening… say several things at once, or “stop” to finish'
                    : 'Getting ready…'}
          </span>
          {speech.speaking && <button type="button" className="btn sm" onClick={interrupt}>Interrupt</button>}
          <button type="button" className="btn sm danger" onClick={endHandsFree}>End voice mode</button>
        </div>
      )}
      {(speech.error || voiceNote) && (
        <div className="voice-note" role="status">
          <Icon name={speech.error ? 'alert' : 'mic'} size="1.1em" />
          <span className="grow">{speech.error || voiceNote}</span>
          {!speech.error && <button type="button" className="btn sm" onClick={() => startHandsFree()}>Resume voice mode</button>}
          {!speech.error && (
            <button type="button" className="icon-btn" aria-label="Hide" title="Hide" onClick={() => setVoiceNote('')}>
              <Icon name="x" size="1em" />
            </button>
          )}
        </div>
      )}

      <form className="composer" onSubmit={(e) => { e.preventDefault(); send(); }}>
        <div className="composer-main">
          <input
            value={speech.listening && !handsFree ? speech.interim || 'Listening…' : input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask Azarvis anything, or give it several tasks at once…"
            aria-label="Message Azarvis"
            disabled={speech.listening && !handsFree}
          />
          {busy ? (
            <button type="button" className="send-btn stop" onClick={() => abortRef.current?.abort()} aria-label="Stop" title="Stop">
              <Icon name="stop" size="1.05em" />
            </button>
          ) : (
            <button className="send-btn" disabled={!input.trim()} aria-label="Send" title="Send (Enter)"><Icon name="send" size="1.1em" /></button>
          )}
        </div>
        <div className="composer-tools">
          {speech.supported && (
            <button
              type="button"
              className={`tool-btn ${speech.listening && !handsFree ? 'live' : ''}`}
              onClick={speech.listening ? speech.stop : () => speech.start()}
              disabled={handsFree}
              title="Say one thing, then Azarvis answers"
            >
              <Icon name="mic" size="1.05em" /> <span>{speech.listening && !handsFree ? 'Listening…' : 'Speak'}</span>
            </button>
          )}
          {speech.supported && (
            <button
              type="button"
              className={`tool-btn ${handsFree ? 'on' : ''}`}
              onClick={handsFree ? endHandsFree : () => startHandsFree()}
              aria-pressed={handsFree}
              title="Hands-free conversation: Azarvis keeps listening and answers out loud"
            >
              <Icon name="zap" size="1.05em" /> <span>{handsFree ? (wake ? 'Listening for “Azarvis”' : 'Voice mode on') : 'Voice mode'}</span>
            </button>
          )}
          {speech.supported && !handsFree && (
            <button
              type="button"
              className="tool-btn"
              onClick={() => startHandsFree({ wake: true })}
              title="Always listening: Azarvis only answers when you say “Azarvis” first"
            >
              <Icon name="sparkles" size="1.05em" /> <span>Hey Azarvis</span>
            </button>
          )}
          <span className="grow" />
          <button
            type="button"
            className={`tool-btn ${voiceReplies ? 'on' : ''}`}
            onClick={() => setVoiceReplies((v) => !v)}
            aria-pressed={voiceReplies}
            title="Read every reply aloud"
          >
            <Icon name="volume" size="1.05em" /> <span>Read aloud</span>
          </button>
        </div>
      </form>
    </div>
  );
}

/** A failed reply, as a calm card instead of a wall of red text. */
function MessageError({ message, explained, onRetry }) {
  const setup = isSetupError(message);
  return (
    <div className={`notice ${setup ? 'setup' : 'danger'} inline`} role="alert">
      <span className="notice-icon"><Icon name={setup ? 'key' : 'alert'} /></span>
      <div className="notice-body">
        <strong>{setup ? "I couldn't answer: AI answers are switched off" : "Sorry, that didn't work"}</strong>
        <p>{setup && explained ? 'The note at the top of this chat shows how to fix it in a minute.' : message}</p>
        {onRetry && (
          <button type="button" className="btn sm" onClick={onRetry}>
            <Icon name="refresh" size="1em" /> Try again
          </button>
        )}
      </div>
    </div>
  );
}
