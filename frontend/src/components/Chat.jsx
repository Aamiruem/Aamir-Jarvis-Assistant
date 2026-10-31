import { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { api, streamChat } from '../api.js';
import { Icon } from '../icons.jsx';
import { openUrl, quickCommand } from '../quickCommands.js';
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

// What each agent tool did, in plain words (shown under Jarvis's reply).
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
  open_website: 'Opened website',
  system_control: 'Done on your PC',
  system_status: 'Checked your PC',
  compose_email: 'Email draft opened in Gmail',
};
const STOP_WORDS = /^(stop|stop listening|that's all|that is all|goodbye|bye|bye jarvis|exit|go to sleep)[.!]?$/i;
const MAX_SILENT_ROUNDS = 4; // hands-free pauses after this many listens with no speech
const FOLLOW_UP_MS = 8000; // after Jarvis answers, a follow-up within this time needs no "Jarvis"

export default function Chat({ conversationId, onConversation, prompt, onPromptUsed }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [voiceReplies, setVoiceReplies] = useState(false);
  const bottomRef = useRef(null);
  const abortRef = useRef(null);
  const currentIdRef = useRef(conversationId);
  const [handsFree, setHandsFree] = useState(false);
  const handsFreeRef = useRef(false);
  const silentRounds = useRef(0);
  const [voiceNote, setVoiceNote] = useState('');
  // Wake-word mode: always listening, but only acts on speech addressed to "Jarvis".
  const [wake, setWake] = useState(false);
  const wakeRef = useRef(false);
  const followUntil = useRef(0);

  const speech = useSpeech({
    onFinal: (heard) => {
      silentRounds.current = 0;
      let text = heard;
      if (handsFreeRef.current && wakeRef.current && Date.now() > followUntil.current) {
        const request = afterWakeWord(heard);
        if (request === null) return listenSoon(); // not talking to Jarvis
        if (!request) {
          speech.speak('Yes?', () => {
            followUntil.current = Date.now() + FOLLOW_UP_MS;
            listenSoon();
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
      send(text, { voice: true });
    },
    onSilence: () => {
      if (!handsFreeRef.current) return;
      if (wakeRef.current) return listenSoon(); // always listening: silence is normal
      silentRounds.current += 1;
      if (silentRounds.current >= MAX_SILENT_ROUNDS) {
        endHandsFree();
        setVoiceNote("Voice mode paused: I didn't hear anything. Tap Voice mode to start again.");
      } else listenSoon();
    },
  });

  // Hands-free loop: listen -> send -> read the reply aloud -> listen again.
  function listenSoon() {
    setTimeout(() => {
      if (handsFreeRef.current && mountedRef.current) speech.start();
    }, 350);
  }
  /** wake: wait for "Jarvis" before acting. greeting: say this first, then listen. */
  function startHandsFree({ wake: useWake = false, greeting = '' } = {}) {
    handsFreeRef.current = true;
    wakeRef.current = useWake;
    silentRounds.current = 0;
    setVoiceNote('');
    setHandsFree(true);
    setWake(useWake);
    if (greeting) {
      speech.cancel();
      speech.speak(greeting, () => {
        followUntil.current = Date.now() + FOLLOW_UP_MS; // they can answer the greeting directly
        listenSoon();
      });
    } else speech.start();
  }
  function endHandsFree() {
    handsFreeRef.current = false;
    wakeRef.current = false;
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
  const busyRef = useRef(false);
  busyRef.current = busy;
  useEffect(() => {
    if (!handsFree) return;
    const t = setInterval(() => {
      if (handsFreeRef.current && mountedRef.current && !busyRef.current && speech.isIdle()) speech.start();
    }, 2500);
    return () => clearInterval(t);
  }, [handsFree]);

  // A request handed over from the Home screen: send it, or type it in for the user to finish.
  const usedPrompt = useRef(null);
  useEffect(() => {
    if (!prompt || usedPrompt.current === prompt.id) return; // StrictMode runs effects twice in dev
    usedPrompt.current = prompt.id;
    if (prompt.handsFree) startHandsFree({ wake: prompt.wake, greeting: prompt.greeting });
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
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const patchLast = (fn) => setMessages((ms) => [...ms.slice(0, -1), fn(ms[ms.length - 1])]);

  async function send(text, { voice = false } = {}) {
    const message = (text ?? input).trim();
    if (!message || busy) return;
    setInput('');

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
      finishTurn(result.error ? `Sorry, that didn't work. ${result.error}` : cmd.say);
      return;
    }

    setBusy(true);
    setMessages((ms) => [...ms, { role: 'user', content: message }, { role: 'assistant', content: '', tools: [], pending: true }]);

    abortRef.current = new AbortController();
    let reply = '';
    let failure = '';
    try {
      await streamChat(
        message,
        currentIdRef.current,
        (ev) => {
          if (ev.type === 'conversation' && ev.id !== currentIdRef.current) {
            currentIdRef.current = ev.id;
            onConversation(ev.id);
          } else if (ev.type === 'nlp') {
            patchLast((m) => ({ ...m, intent: ev.intent }));
          } else if (ev.type === 'status') {
            patchLast((m) => ({ ...m, status: ev.message }));
          } else if (ev.type === 'text') {
            reply += ev.text;
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
      patchLast((m) => ({ ...m, pending: false }));
      setBusy(false);
      finishTurn(reply || (failure && `Sorry, that didn't work. ${failure}`));
    }
  }

  // Read the answer aloud when voice is on, then (hands-free) listen for the next request.
  function finishTurn(spoken) {
    if (handsFreeRef.current || voiceReplies) {
      speech.speak(spoken, () => {
        followUntil.current = Date.now() + FOLLOW_UP_MS;
        if (handsFreeRef.current) listenSoon();
      });
    }
  }

  const copyReply = (text) =>
    navigator.clipboard.writeText(text).then(() => toast('Copied to clipboard'), () => toast("Couldn't copy", 'error'));

  return (
    <div className="chat">
      <div className="messages">
        {messages.length === 0 && (
          <div className="welcome">
            <div className={`orb big ${speech.listening ? 'pulse' : ''}`} />
            <h2>Good to see you. <span className="grad-text">How can I help?</span></h2>
            <p className="muted">Ask anything, give several tasks at once, or switch on Voice mode and just talk.</p>
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
                      {ok ? '✓' : '✗'} {TOOL_LABELS[name] || name}
                    </span>
                  );
                })}
              </div>
            )}
            <div className="bubble">
              {m.role === 'assistant' ? <ReactMarkdown>{m.content || (m.pending ? m.status || '…' : '')}</ReactMarkdown> : m.content}
              {m.error && <div className="error">{m.error}</div>}
              {m.links?.length > 0 && (
                <div className="link-row">
                  {m.links.map((l, j) => (
                    <a key={j} className="btn open-link" href={l.url} target="_blank" rel="noopener noreferrer">Open {l.label} ↗</a>
                  ))}
                </div>
              )}
              {m.popupBlocked && (
                <p className="hint popup-tip">
                  To let Jarvis open sites by voice automatically: click the blocked pop-up icon at the right end of the
                  address bar → <b>Always allow pop-ups and redirects from {window.location.host}</b> → Done. You only need to do this once.
                </p>
              )}
            </div>
            {m.role === 'assistant' && m.content && !m.pending && (
              <div className="msg-actions">
                <button className="icon-btn" title="Copy" aria-label="Copy reply" onClick={() => copyReply(m.content)}><Icon name="copy" size="1em" /></button>
                <button className="icon-btn" title="Read aloud" aria-label="Read reply aloud" onClick={() => speech.speak(m.content)}><Icon name="volume" size="1em" /></button>
                {m.intent && <span className="meta">intent: {m.intent}</span>}
              </div>
            )}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {handsFree && (
        <div className={`voice-bar ${speech.listening ? 'listening' : busy ? 'thinking' : speech.speaking ? 'speaking' : ''}`}>
          <span className="voice-wave" aria-hidden="true"><i /><i /><i /><i /><i /></span>
          <span className="voice-status" aria-live="polite">
            {speech.listening
              ? speech.interim ||
                (wake && Date.now() > followUntil.current
                  ? 'Always listening… start with “Jarvis”, e.g. “Jarvis, open Notepad”'
                  : 'Listening… say several things at once, or “stop” to finish')
              : busy
                ? 'Working on it…'
                : speech.speaking
                  ? 'Speaking…'
                  : 'Getting ready…'}
          </span>
          {speech.speaking && <button type="button" className="btn" onClick={interrupt}>Interrupt</button>}
          <button type="button" className="btn danger" onClick={endHandsFree}>End voice mode</button>
        </div>
      )}
      {(speech.error || voiceNote) && <div className="voice-note">{speech.error || voiceNote}</div>}

      <form className="composer" onSubmit={(e) => { e.preventDefault(); send(); }}>
        {speech.supported && (
          <button
            type="button"
            className={`icon-btn mic ${speech.listening && !handsFree ? 'live' : ''}`}
            onClick={speech.listening ? speech.stop : speech.start}
            disabled={handsFree}
            title="Say one thing"
          >
            <Icon name="mic" />
          </button>
        )}
        {speech.supported && (
          <button
            type="button"
            className={`btn voice-mode ${handsFree ? 'on' : ''}`}
            onClick={handsFree ? endHandsFree : () => startHandsFree()}
            title="Hands-free: Jarvis keeps listening and answers out loud"
          >
            <Icon name="mic" size="1em" /> {handsFree ? (wake ? 'Listening for “Jarvis”' : 'Voice on') : 'Voice mode'}
          </button>
        )}
        {speech.supported && !handsFree && (
          <button
            type="button"
            className="btn voice-mode"
            onClick={() => startHandsFree({ wake: true })}
            title="Always listening: Jarvis only answers when you say “Jarvis” first"
          >
            Hey Jarvis
          </button>
        )}
        <input
          value={speech.listening && !handsFree ? speech.interim || 'Listening…' : input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask Jarvis anything…"
          disabled={speech.listening && !handsFree}
        />
        <label className="toggle" title="Read replies aloud">
          <input type="checkbox" checked={voiceReplies} onChange={(e) => setVoiceReplies(e.target.checked)} />
          <Icon name="volume" size="1.1em" />
        </label>
        {busy ? (
          <button type="button" className="btn" onClick={() => abortRef.current?.abort()}><Icon name="stop" size="1em" /> Stop</button>
        ) : (
          <button className="btn primary send-btn" disabled={!input.trim()} aria-label="Send"><Icon name="send" size="1em" /> <span>Send</span></button>
        )}
      </form>
    </div>
  );
}
