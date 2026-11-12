import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Icon } from '../icons.jsx';
import { useSpeech } from '../useSpeech.js';
import { advance, CAPABILITIES, COUNTRIES, qualify, startConversation } from '../voiceAgentDemo.js';
import HomeArt from './HomeArt.jsx';
import './VoiceAgent.css';

// A capability button, when tapped, puts a realistic student line into the live call so the
// agent demonstrates that skill out loud. (Everything is a real run of the dialog engine.)
const CAP_DEMO = {
  callback: "Hi, I just filled your form a minute ago.",
  qualify: 'I want to study in Canada, budget around 25 lakh, Fall intake.',
  faq: 'What visa do I need and am I eligible?',
  book: 'Yes, please book me a counselling session.',
  followup: 'Can you check the status of my application?',
  reengage: 'I enquired last year but never continued.',
  language: 'Kya aap Hindi mein baat kar sakte hain?',
  crm: 'Please save my details for the counsellor.',
};

const TIER_LABEL = { hot: 'Hot lead', warm: 'Warm lead', cold: 'Cold lead' };
const TIER_HUE = { hot: 8, warm: 38, cold: 205 };

export default function VoiceAgent({ onClose, onAsk, embedded = false }) {
  const [convo, setConvo] = useState(null); // null until the call starts
  const [draft, setDraft] = useState('');
  const [voiceOut, setVoiceOut] = useState(true);
  const logRef = useRef(null);
  const convoRef = useRef(null);
  convoRef.current = convo;

  const onFinal = useCallback((text) => {
    if (text && text.trim()) handleUser(text.trim());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const { supported: micSupported, listening, interim, start, stop, speak, stopSpeaking } = useSpeech({ onFinal, lang: 'en-IN' });

  const say = useCallback((text) => { if (voiceOut) speak(text); }, [voiceOut, speak]);

  // Keep the transcript scrolled to the newest line.
  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [convo]);
  useEffect(() => () => stopSpeaking(), [stopSpeaking]);

  const startCall = () => {
    const s = startConversation();
    setConvo(s);
    say(s.say);
  };
  const endCall = () => {
    stop();
    stopSpeaking();
    setConvo(null);
    setDraft('');
  };

  function handleUser(text) {
    const cur = convoRef.current;
    if (!cur) {
      // Tapped a capability before starting: start the call, then feed the line.
      const s = startConversation();
      const next = advance(s, text);
      setConvo(next);
      say(next.say);
      return;
    }
    const next = advance(cur, text);
    setConvo(next);
    say(next.say);
    if (next.expect === 'end') stop();
  }

  const send = (e) => {
    e?.preventDefault();
    const t = draft.trim();
    if (!t) return;
    setDraft('');
    handleUser(t);
  };

  const mic = () => (listening ? stop() : start());

  const runCapability = (id) => {
    stopSpeaking();
    let cur = convoRef.current;
    if (!cur || cur.expect === 'end') cur = startConversation();
    if (cur.step === 'greet') cur = advance(cur, 'Yes'); // connect the call first
    const next = advance(cur, CAP_DEMO[id] || 'Tell me more.');
    setConvo(next);
    say(next.say);
    if (next.expect === 'end') stop();
  };

  const q = convo?.qualified || qualify({});
  const lead = convo?.lead || {};

  // Context-aware quick replies so the demo is one-tap even without a mic.
  const chips = useMemo(() => {
    if (!convo) return [];
    if (convo.expect === 'end') return [];
    if (convo.expect === 'yesno') return ['Yes, please', 'Not right now'];
    if (convo.step === 'country') return COUNTRIES.map((c) => `${c.flag} ${c.name}`);
    if (convo.step === 'budget') return ['15 lakh', '25 lakh', '30k dollars'];
    if (convo.step === 'intake') return ['Fall', 'Spring', 'Summer'];
    return ['What visa do I need?', 'How much are the fees?'];
  }, [convo]);

  const body = (
      <div className="va">
        {onClose && <button className="va-close" onClick={onClose} aria-label="Close Voice Agent"><Icon name="x" /></button>}

        {/* ---- hero, styled like the ad ---- */}
        <header className="va-hero">
          <div className="va-hero-text">
            <span className="va-kicker"><Icon name="phone" size="1em" /> AI Voice Agent</span>
            <h1>An AI agent that <span className="va-grad">talks like a human</span> and calls every lead in seconds</h1>
            <p>Built for study-abroad, immigration and visa consultancies. It qualifies leads, answers questions 24/7, books counselling and follows up — in every language.</p>
            <div className="va-flags">
              {COUNTRIES.map((c) => <span key={c.id} className="va-flag" title={c.name}>{c.flag} {c.name}</span>)}
            </div>
            <div className="va-hero-actions">
              <button className="va-start" onClick={convo ? endCall : startCall}>
                <Icon name={convo ? 'stop' : 'phone'} /> {convo ? 'End call' : 'Start a live call'}
              </button>
              {onAsk && <button className="va-ghost" onClick={() => onAsk('How would an AI voice agent help my consultancy get more enrollments?', true)}>Ask Azarvis <Icon name="chevron" size="0.9em" /></button>}
            </div>
          </div>
          <div className="va-hero-art">
            <div className="va-art va-art-globe"><HomeArt motif="globe" hue={205} /></div>
            <div className="va-art va-art-phone"><HomeArt motif="phone" hue={262} /></div>
          </div>
        </header>

        {/* ---- live call ---- */}
        <section className="va-call" style={{ '--hue': TIER_HUE[q.tier] }}>
          <div className="va-call-main">
            <div className="va-call-head">
              <span className={`va-live ${convo && convo.expect !== 'end' ? 'on' : ''}`}><i /> {convo ? (convo.expect === 'end' ? 'Call ended' : listening ? 'Listening…' : 'On call') : 'Ready to call'}</span>
              <label className="va-toggle"><input type="checkbox" checked={voiceOut} onChange={() => setVoiceOut((v) => !v)} /> Speak aloud</label>
            </div>
            <div className="va-log" ref={logRef}>
              {!convo && (
                <div className="va-empty">
                  <Icon name="phone" size="2em" />
                  <p>Press <strong>Start a live call</strong> — the agent will greet you and talk you through it, just like a real counsellor. Reply by voice or by typing.</p>
                </div>
              )}
              {convo?.history.map((m, i) => (
                <div key={i} className={`va-msg ${m.who}`}>
                  <span className="va-msg-who">{m.who === 'agent' ? 'Agent' : 'You'}</span>
                  <p>{m.text}</p>
                </div>
              ))}
              {convo && convo.history[convo.history.length - 1]?.who !== 'agent' ? null : null}
              {interim && <div className="va-msg user interim"><span className="va-msg-who">You</span><p>{interim}…</p></div>}
            </div>
            {convo && convo.expect !== 'end' && (
              <>
                {chips.length > 0 && (
                  <div className="va-chips">
                    {chips.map((c) => <button key={c} onClick={() => handleUser(c)}>{c}</button>)}
                  </div>
                )}
                <form className="va-input" onSubmit={send}>
                  {micSupported && (
                    <button type="button" className={`va-mic ${listening ? 'on' : ''}`} onClick={mic} title={listening ? 'Stop' : 'Speak'}>
                      <Icon name="mic" />
                    </button>
                  )}
                  <input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Type your reply, or tap the mic…" aria-label="Your reply" />
                  <button type="submit" className="va-send" aria-label="Send"><Icon name="send" /></button>
                </form>
              </>
            )}
            {convo?.expect === 'end' && (
              <button className="va-start va-restart" onClick={startCall}><Icon name="refresh" /> New call</button>
            )}
          </div>

          {/* live lead qualification */}
          <aside className="va-qual">
            <h4><Icon name="filter" size="1.1em" /> Live lead score</h4>
            <div className={`va-gauge tier-${q.tier}`}>
              <strong>{q.score}</strong><small>/ 100</small>
              <span className="va-tier">{TIER_LABEL[q.tier]}</span>
            </div>
            <ul className="va-fields">
              <li className={lead.country ? 'ok' : ''}><Icon name="globe" size="1em" /> Country <b>{lead.country ? `${lead.country.flag} ${lead.country.name}` : '—'}</b></li>
              <li className={lead.budget ? 'ok' : ''}><Icon name="chart" size="1em" /> Budget <b>{lead.budget ? lead.budget.label : '—'}</b></li>
              <li className={lead.intake ? 'ok' : ''}><Icon name="calendar" size="1em" /> Intake <b>{lead.intake ? lead.intake[0].toUpperCase() + lead.intake.slice(1) : '—'}</b></li>
              <li className={lead.booked ? 'ok' : ''}><Icon name="check" size="1em" /> Counselling <b>{lead.booked ? 'Booked' : '—'}</b></li>
            </ul>
            <p className="va-crm"><Icon name="briefcase" size="0.95em" /> Auto-synced to your CRM</p>
          </aside>
        </section>

        {/* ---- capabilities (every button runs live in the call) ---- */}
        <section className="va-caps">
          <h3>Everything it does on the call <small>Tap any one to hear it live</small></h3>
          <div className="va-caps-grid">
            {CAPABILITIES.map((c, i) => (
              <button key={c.id} className="va-cap" style={{ '--hue': (190 + i * 24) % 360 }} onClick={() => runCapability(c.id)}>
                <span className="va-cap-ic"><Icon name={c.icon} /></span>
                <strong>{c.title}</strong>
                <p>{c.desc}</p>
                <span className="va-cap-go">Try it <Icon name="chevron" size="0.85em" /></span>
              </button>
            ))}
          </div>
        </section>

        {/* ---- outcomes strip, like the ad footer ---- */}
        <section className="va-outcomes">
          {[
            ['zap', 'Instant response', 'Every lead called back in seconds'],
            ['refresh', 'Always active', '24/7, never a missed enquiry'],
            ['filter', 'More qualified leads', 'Scored and sorted automatically'],
            ['chart', 'More enrollments', 'More conversations, bigger growth'],
          ].map(([icon, t, s]) => (
            <div key={t} className="va-outcome">
              <span className="va-cap-ic"><Icon name={icon} /></span>
              <div><strong>{t}</strong><small>{s}</small></div>
            </div>
          ))}
        </section>
      </div>
  );

  if (embedded) return body;
  return (
    <div className="va-overlay" role="dialog" aria-modal="true" aria-label="Voice Agent">
      {body}
    </div>
  );
}
