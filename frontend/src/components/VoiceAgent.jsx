import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Icon } from '../icons.jsx';
import { useSpeech } from '../useSpeech.js';
import { advance, CAPABILITIES, COUNTRIES, homeCountries, qualify, REGIONS, startConversation } from '../voiceAgentDemo.js';
import { flagUrl } from '../flags.js';
import { neuralAvailable } from '../neuralVoice.js';
import { readVoiceExtras, saveVoiceExtras } from '../voiceSettings.js';
import { ArtPicture } from '../ui.jsx';
import { reach } from '../artActions.js';
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
// Loudness presets (the neural voice's boost; see neuralVoice.js). DJ max = brick-wall limited, as loud as it gets.
const VOLUMES = [['Normal', 1.4], ['Loud', 2.5], ['DJ max', 4]];
const volumeName = (boost) => (boost > 2.5 ? 'DJ max' : boost >= 2 ? 'Loud' : 'Normal');

/** A country's flag as a real image (emoji flags show as letters on Windows). */
function Flag({ c, w = 22 }) {
  const url = flagUrl(c.iso);
  return url ? <img className="va-flagimg" src={url} alt="" width={w} height={Math.round(w * 0.75)} loading="lazy" /> : null;
}

// Destinations in display order: South Asia (India first) → North America → Europe → …
const ORDERED = REGIONS.flatMap((r) => COUNTRIES.filter((c) => c.region === r));
const INDIA = { iso: 'in', name: 'India' };

/** Every country for "Student from": India, then India's neighbours, then the rest A–Z. */
function HomeSelect({ value, onChange, id }) {
  const { india, neighbours, others } = homeCountries();
  const all = [...india, ...neighbours, ...others];
  return (
    <select id={id} className="va-select" value={value?.iso || 'in'} onChange={(e) => onChange(all.find((c) => c.iso === e.target.value))}>
      <optgroup label="India">{india.map((c) => <option key={c.iso} value={c.iso}>{c.name}</option>)}</optgroup>
      <optgroup label="India's neighbours">{neighbours.map((c) => <option key={c.iso} value={c.iso}>{c.name}</option>)}</optgroup>
      <optgroup label="All countries">{others.map((c) => <option key={c.iso} value={c.iso}>{c.name}</option>)}</optgroup>
    </select>
  );
}

const DETAIL_ROWS = [
  ['chart', 'Tuition', 'tuition'], ['house', 'Living costs', 'living'], ['calendar', 'Intakes', 'intake'], ['key', 'Visa', 'visa'],
  ['briefcase', 'Work while studying', 'work'], ['rocket', 'After graduating', 'postStudy'], ['book', 'English requirement', 'english'], ['star', 'Top universities', 'top'],
];
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
  const { supported: micSupported, listening, speaking, interim, start, stop, speak, stopSpeaking } = useSpeech({ onFinal, lang: 'en-IN' });
  const [boost, setBoost] = useState(() => readVoiceExtras().boost);
  const [neural, setNeural] = useState(null); // can the voice go above 100%? (the neural voice on this PC)
  useEffect(() => { neuralAvailable().then(setNeural).catch(() => setNeural(false)); }, []);
  const setVolume = (b) => { saveVoiceExtras({ boost: b }); setBoost(b); };
  const [region, setRegion] = useState('All');
  const [picked, setPicked] = useState('india');
  const [home, setHomeState] = useState(INDIA);
  const homeRef = useRef(INDIA);
  homeRef.current = home;
  // A new "Student from": remembered for the next call, and noted in the call that is running.
  const setHome = (c) => {
    if (!c) return;
    setHomeState(c);
    setConvo((cur) => (cur && cur.lead.home?.iso !== c.iso
      ? { ...cur, lead: { ...cur.lead, home: c }, activity: [...(cur.activity || []), { icon: 'house', text: `Student calling from ${c.name}` }].slice(-30) }
      : cur));
  };
  const pickedCountry = COUNTRIES.find((c) => c.id === picked) || COUNTRIES[0];
  const pick = (id) => { setPicked(id); reach('.va-dest'); };

  const say = useCallback((text) => { if (voiceOut) speak(text); }, [voiceOut, speak]);

  // Keep the transcript scrolled to the newest line.
  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [convo]);
  useEffect(() => () => stopSpeaking(), [stopSpeaking]);

  const startCall = () => {
    const s = startConversation(homeRef.current);
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
      const s = startConversation(homeRef.current);
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
    if (!cur || cur.expect === 'end') cur = startConversation(homeRef.current);
    if (cur.step === 'greet') cur = advance(cur, 'Yes'); // connect the call first
    const next = advance(cur, CAP_DEMO[id] || 'Tell me more.');
    setConvo(next);
    say(next.say);
    if (next.expect === 'end') stop();
  };

  // Put one student line into the call (starting and connecting it first if needed).
  const runLine = (line) => {
    stopSpeaking();
    let cur = convoRef.current;
    if (!cur || cur.expect === 'end') cur = startConversation(homeRef.current);
    if (cur.step === 'greet') cur = advance(cur, 'Yes');
    const next = advance(cur, line);
    setConvo(next);
    say(next.say);
  };

  const q = convo?.qualified || qualify({});
  const lead = convo?.lead || {};

  // Context-aware quick replies so the demo is one-tap even without a mic.
  const chips = useMemo(() => {
    if (!convo) return [];
    if (convo.expect === 'end') return [];
    if (convo.expect === 'yesno') return ['Yes, please', 'Not right now'];
    if (convo.step === 'country') return ['USA', 'Canada', 'UK', 'Australia', 'Germany', 'Ireland', 'Japan', 'Singapore', 'UAE (Dubai)', 'New Zealand'];
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
            <div className="va-flags" role="list" aria-label={`${COUNTRIES.length} study destinations`}>
              {ORDERED.map((c) => (
                <button key={c.id} type="button" role="listitem" className={`va-flag ${picked === c.id ? 'on' : ''}`} title={`${c.name}: see the details`} onClick={() => pick(c.id)}>
                  <Flag c={c} /> {c.name}
                </button>
              ))}
            </div>
            <div className="va-hero-actions">
              <button className="va-start" onClick={convo ? endCall : startCall}>
                <Icon name={convo ? 'stop' : 'phone'} /> {convo ? 'End call' : 'Start a live call'}
              </button>
              {onAsk && <button className="va-ghost" onClick={() => onAsk('How would an AI voice agent help my consultancy get more enrollments?', true)}>Ask Azarvis <Icon name="chevron" size="0.9em" /></button>}
            </div>
          </div>
          <ArtPicture className="va-hero-art va-photo" src="/art/voice.webp" alt="A holographic head speaking into a studio microphone" spots={[
            { x: 14, y: 36, label: convo ? 'On a call' : 'Start a live call', hint: 'The agent greets you and talks you through it', run: () => (convo ? reach('.va-call') : startCall()) },
            { x: 52, y: 30, label: 'Ask Azarvis', hint: 'How a voice agent helps your consultancy', run: () => (onAsk ? onAsk('How would an AI voice agent help my consultancy get more enrollments?', true) : reach('.va-call')) },
            { x: 9, y: 47, label: 'Lead score', hint: 'How the agent qualifies each lead', run: () => reach('.va-qual') },
          ]} />
        </header>

        {/* ---- live call ---- */}
        <section className="va-call" style={{ '--hue': TIER_HUE[q.tier] }}>
          <div className="va-call-main">
            <div className="va-call-head">
              <span className={`va-live ${convo && convo.expect !== 'end' ? 'on' : ''}`}><i /> {convo ? (convo.expect === 'end' ? 'Call ended' : listening ? 'Listening…' : 'On call') : 'Ready to call'}</span>
              <div className="va-volume" role="group" aria-label="Agent voice volume">
                <Icon name="volume" size="1em" />
                {VOLUMES.map(([label, b]) => (
                  <button key={label} type="button" className={volumeName(boost) === label ? 'on' : ''} onClick={() => setVolume(b)} aria-pressed={volumeName(boost) === label}>{label}</button>
                ))}
              </div>
              <label className="va-toggle"><input type="checkbox" checked={voiceOut} onChange={() => setVoiceOut((v) => !v)} /> Speak aloud</label>
            </div>
            {neural === false && boost > 1.4 && (
              <p className="va-volume-note"><Icon name="alert" size="0.95em" /> Your browser's own voice is already at its 100% maximum here, so turn up your device volume too. Loud and DJ max boost the neural voice, which plays when Azarvis runs on your PC.</p>
            )}
            <div className={`va-screen ${speaking ? 'is-speaking' : listening ? 'is-listening' : ''}`} aria-live="polite">
              <span className="va-screen-wave" aria-hidden="true"><i /><i /><i /><i /><i /></span>
              <div className="va-screen-text">
                <small>{!convo ? 'Agent display' : speaking ? 'Speaking' : listening ? 'Listening' : convo.expect === 'end' ? 'Call finished' : 'Working'}</small>
                <strong>{!convo ? 'Waiting for a lead · press Start a live call' : convo.activity?.length ? convo.activity[convo.activity.length - 1].text : 'Connecting…'}</strong>
              </div>
              {lead.country && <span className="va-screen-flag"><Flag c={lead.country} w={34} /></span>}
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
            <label className="va-home" htmlFor="va-home">
              <span><Icon name="house" size="1em" /> Student from</span>
              <span className="va-home-pick">
                {home && <Flag c={home} w={20} />}
                <HomeSelect id="va-home" value={lead.home || home} onChange={setHome} />
              </span>
            </label>
            <ul className="va-fields">
              <li className={lead.country ? 'ok' : ''}><Icon name="globe" size="1em" /> Country <b>{lead.country ? <><Flag c={lead.country} w={18} /> {lead.country.name}</> : '—'}</b></li>
              <li className={lead.budget ? 'ok' : ''}><Icon name="chart" size="1em" /> Budget <b>{lead.budget ? lead.budget.label : '—'}</b></li>
              <li className={lead.intake ? 'ok' : ''}><Icon name="calendar" size="1em" /> Intake <b>{lead.intake ? lead.intake[0].toUpperCase() + lead.intake.slice(1) : '—'}</b></li>
              <li className={lead.booked ? 'ok' : ''}><Icon name="check" size="1em" /> Counselling <b>{lead.booked ? 'Booked' : '—'}</b></li>
            </ul>
            <p className="va-crm"><Icon name="briefcase" size="0.95em" /> Auto-synced to your CRM</p>
            <h4 className="va-act-title"><Icon name="pulse" size="1.1em" /> Live activity</h4>
            <ol className="va-activity" aria-label="What the agent is doing">
              {(convo?.activity || []).slice(-8).reverse().map((a, i) => (
                <li key={`${convo.activity.length}-${i}`} className={i === 0 ? 'now' : ''}><Icon name={a.icon} size="0.95em" /> <span>{a.text}</span></li>
              ))}
              {!convo && <li className="va-activity-empty">Every step the agent takes shows here during the call.</li>}
            </ol>
          </aside>
        </section>

        {/* ---- study destinations: every country with its details ---- */}
        <section className="va-dest" aria-labelledby="va-dest-title">
          <div className="va-dest-head">
            <h3 id="va-dest-title">Study destinations <small>{COUNTRIES.length} countries · tap one for the details</small></h3>
            <label className="va-dest-pick">
              <span className="sr-only">Choose a destination</span>
              <select className="va-select" value={picked} onChange={(e) => { setPicked(e.target.value); setRegion('All'); }} aria-label="Choose a destination">
                {REGIONS.map((r) => (
                  <optgroup key={r} label={r}>
                    {COUNTRIES.filter((c) => c.region === r).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </optgroup>
                ))}
              </select>
            </label>
            <div className="va-regions" role="tablist" aria-label="Regions">
              {['All', ...REGIONS].map((r) => (
                <button key={r} type="button" role="tab" aria-selected={region === r} className={region === r ? 'on' : ''} onClick={() => setRegion(r)}>
                  {r} <span>{r === 'All' ? COUNTRIES.length : COUNTRIES.filter((c) => c.region === r).length}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="va-dest-body">
            <div className="va-dest-grid">
              {ORDERED.filter((c) => region === 'All' || c.region === region).map((c) => (
                <button key={c.id} type="button" className={`va-dest-card ${picked === c.id ? 'on' : ''}`} onClick={() => setPicked(c.id)} aria-pressed={picked === c.id}>
                  <Flag c={c} w={40} />
                  <strong>{c.name}</strong>
                  <small>{c.tuition}</small>
                </button>
              ))}
            </div>
            <article className="va-dest-detail" aria-live="polite">
              <header>
                <Flag c={pickedCountry} w={64} />
                <div>
                  <h4>{pickedCountry.name}</h4>
                  <span>{pickedCountry.region}</span>
                </div>
              </header>
              <dl>
                {DETAIL_ROWS.map(([icon, label, key]) => (
                  <div key={key}>
                    <dt><Icon name={icon} size="1em" /> {label}</dt>
                    <dd>{pickedCountry[key]}</dd>
                  </div>
                ))}
              </dl>
              {pickedCountry.note && <p className="va-dest-tip"><Icon name="sparkles" size="0.95em" /> {pickedCountry.note}</p>}
              <button type="button" className="va-start va-dest-ask" onClick={() => { reach('.va-call'); runLine(`I want to study in ${pickedCountry.name}`); }}>
                <Icon name="phone" size="1em" /> Ask the agent about {pickedCountry.name}
              </button>
              <p className="va-dest-note">Approximate figures for international students; fees and visa rules change. A counsellor confirms the current details before you apply.</p>
            </article>
          </div>
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
