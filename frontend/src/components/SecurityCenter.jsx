import { useEffect, useMemo, useState } from 'react';
import { api, auth } from '../api.js';
import { Icon } from '../icons.jsx';
import { analyzePassword, breachCount, generatePassword, humanTime } from '../passwordTools.js';
import { toast } from '../ui.jsx';
import './SecurityCenter.css';

// Security Center: your account's protection (from the gateway: sessions, passkeys, sign-in
// activity), password tools that run only in this browser, and a read-only check of this PC
// (GET /api/ai/security/pc-check). Nothing here changes a setting without you.

const RISKY = new Set(['login_failed', 'login_otp_failed', 'account_locked', 'login_blocked_locked', 'refresh_token_reuse_detected', 'passkey_login_failed']);
const DAY = 86_400_000;

function useAccountChecks(user) {
  const [data, setData] = useState(null);
  useEffect(() => {
    let alive = true;
    Promise.allSettled([auth.sessions(), auth.activity(), api.passkeys()]).then(([s, a, p]) => {
      if (!alive) return;
      setData({
        sessions: s.status === 'fulfilled' ? s.value : null,
        activity: a.status === 'fulfilled' ? a.value : null,
        passkeys: p.status === 'fulfilled' ? p.value : null,
      });
    });
    return () => {
      alive = false;
    };
  }, []);
  return useMemo(() => {
    if (!data) return null;
    const recentRisky = (data.activity || []).filter((e) => RISKY.has(e.event || e.type) && Date.now() - new Date(e.createdAt || e.at) < 30 * DAY);
    return [
      { id: 'email', ok: Boolean(user.emailVerified), label: 'Email verified', detail: user.emailVerified ? user.email : 'Verify your email so you can recover the account.' },
      { id: 'passkey', ok: (data.passkeys || []).length > 0, label: 'Passkey sign-in', detail: data.passkeys == null ? 'Could not read your passkeys.' : data.passkeys.length ? `${data.passkeys.length} passkey${data.passkeys.length > 1 ? 's' : ''}: phishing-resistant sign-in` : 'Add a passkey (fingerprint, face or PIN): it can not be phished.' },
      { id: 'phone', ok: Boolean(user.phoneVerified), label: 'Phone for sign-in codes', detail: user.phoneVerified ? 'Verified' : 'Add a phone as a second way to get sign-in codes.' },
      { id: 'sessions', ok: data.sessions != null && data.sessions.length <= 3, label: 'Signed-in devices', detail: data.sessions == null ? 'Could not read your sessions.' : `${data.sessions.length} device${data.sessions.length === 1 ? '' : 's'} signed in${data.sessions.length > 3 ? ': sign out the ones you don’t use' : ''}` },
      { id: 'activity', ok: recentRisky.length === 0, label: 'Sign-in activity (30 days)', detail: recentRisky.length ? `${recentRisky.length} failed or suspicious sign-in event${recentRisky.length > 1 ? 's' : ''}: review them in Account` : 'No failed or suspicious sign-ins.' },
    ];
  }, [data, user]);
}

function Meter({ score }) {
  return (
    <div className={`sec-meter s${score}`} role="meter" aria-valuemin={0} aria-valuemax={4} aria-valuenow={score} aria-label="Password strength">
      {[0, 1, 2, 3].map((i) => <i key={i} className={i < Math.max(1, score) ? 'on' : ''} />)}
    </div>
  );
}

function PasswordChecker({ user }) {
  const [pw, setPw] = useState('');
  const [show, setShow] = useState(false);
  const [breach, setBreach] = useState(null); // null | 'checking' | number | Error message
  const personal = [user.name?.split(' ')[0], user.email?.split('@')[0]];
  const r = analyzePassword(pw, personal);
  useEffect(() => setBreach(null), [pw]);
  const check = async () => {
    setBreach('checking');
    try {
      setBreach(await breachCount(pw));
    } catch (e) {
      setBreach(e.message || 'The breach check service is not reachable.');
    }
  };
  return (
    <section className="sec-card">
      <header><Icon name="shield" /><div><h2>Password checker</h2><p>Runs only in this browser: the password is never sent or saved.</p></div></header>
      <div className="sec-pw">
        <input type={show ? 'text' : 'password'} value={pw} onChange={(e) => setPw(e.target.value)} placeholder="Type a password to test" autoComplete="off" spellCheck={false} aria-label="Password to test" />
        <button type="button" className="icon-btn" onClick={() => setShow((s) => !s)} aria-label={show ? 'Hide password' : 'Show password'} title={show ? 'Hide' : 'Show'}><Icon name={show ? 'eyeOff' : 'eye'} /></button>
      </div>
      {pw && (
        <div className="sec-result" aria-live="polite">
          <div className="sec-result-head"><Meter score={r.score} /><strong className={`s${r.score}`}>{r.label}</strong></div>
          <p className="muted small">About {r.bits} bits. A fast offline attack would need <b>{humanTime(r.crackSeconds)}</b> on average.</p>
          {r.issues.length > 0 && <ul className="sec-issues">{r.issues.map((i) => <li key={i}><Icon name="alert" size="0.95em" /> {i}</li>)}</ul>}
          <ul className="sec-tips">{r.tips.map((t) => <li key={t}>{t}</li>)}</ul>
          <div className="row wrap">
            <button type="button" className="btn sm" onClick={check} disabled={breach === 'checking'}><Icon name="search" size="1em" /> {breach === 'checking' ? 'Checking…' : 'Check known data breaches'}</button>
            <span className="muted small">Sends only the first 5 characters of the password’s SHA-1 hash to Have I Been Pwned.</span>
          </div>
          {typeof breach === 'number' && (
            <p className={`sec-breach ${breach ? 'bad' : 'ok'}`}>
              <Icon name={breach ? 'alert' : 'check'} size="1em" />
              {breach ? `Found ${breach.toLocaleString()} times in leaked passwords. Don’t use it anywhere.` : 'Not found in known breaches.'}
            </p>
          )}
          {typeof breach === 'string' && breach !== 'checking' && <p className="sec-breach bad"><Icon name="alert" size="1em" /> {breach}</p>}
        </div>
      )}
    </section>
  );
}

function PasswordGenerator() {
  const [opts, setOpts] = useState({ length: 20, lower: true, upper: true, digit: true, symbol: true, avoidAmbiguous: true });
  const [pw, setPw] = useState(() => generatePassword(opts));
  const [error, setError] = useState('');
  const regen = (next = opts) => {
    try {
      setPw(generatePassword(next));
      setError('');
    } catch (e) {
      setError(e.message);
    }
  };
  const set = (patch) => {
    const next = { ...opts, ...patch };
    setOpts(next);
    regen(next);
  };
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(pw);
      toast('Copied. Paste it into your password manager.');
    } catch {
      toast('Could not copy: select the password and copy it.');
    }
  };
  const strength = analyzePassword(pw);
  return (
    <section className="sec-card">
      <header><Icon name="key" /><div><h2>Password generator</h2><p>Random from your browser’s cryptographic generator. Not stored anywhere.</p></div></header>
      <div className="sec-gen">
        <code className="sec-gen-out" aria-live="polite">{pw}</code>
        <button type="button" className="icon-btn" onClick={() => regen()} aria-label="New password" title="New password"><Icon name="refresh" /></button>
        <button type="button" className="btn primary sm" onClick={copy}><Icon name="copy" size="1em" /> Copy</button>
      </div>
      <div className="sec-result-head"><Meter score={strength.score} /><span className="muted small">{strength.label} · {humanTime(strength.crackSeconds)} to crack offline</span></div>
      <label className="sec-len">
        <span>Length <b>{opts.length}</b></span>
        <input type="range" min="8" max="64" value={opts.length} onChange={(e) => set({ length: Number(e.target.value) })} aria-label="Password length" />
      </label>
      <div className="sec-opts">
        {[['lower', 'a–z'], ['upper', 'A–Z'], ['digit', '0–9'], ['symbol', '!@#'], ['avoidAmbiguous', 'No look-alikes (l, 1, O, 0)']].map(([k, label]) => (
          <label key={k} className="check-row"><input type="checkbox" checked={opts[k]} onChange={(e) => set({ [k]: e.target.checked })} /> {label}</label>
        ))}
      </div>
      {error && <p className="sec-breach bad">{error}</p>}
    </section>
  );
}

function PcCheck() {
  const [state, setState] = useState({ status: 'idle' });
  const run = async () => {
    setState({ status: 'running' });
    try {
      const d = await api.securityPcCheck();
      setState({ status: 'done', ...d });
    } catch (e) {
      setState({ status: 'error', reason: e.message || 'The AI service is not reachable. Start Azarvis on this PC.' });
    }
  };
  const order = { bad: 0, warn: 1, unknown: 2, ok: 3 };
  const checks = [...(state.checks || [])].sort((a, b) => order[a.status] - order[b.status]);
  return (
    <section className="sec-card sec-card--wide">
      <header>
        <Icon name="monitor" />
        <div><h2>This PC</h2><p>A read-only check of Microsoft Defender, the firewall, User Account Control and Windows Update. It changes nothing.</p></div>
        <button type="button" className="btn sm" onClick={run} disabled={state.status === 'running'}>
          <Icon name={state.status === 'running' ? 'clock' : 'pulse'} size="1em" /> {state.status === 'running' ? 'Checking… (up to 30 s)' : state.status === 'done' ? 'Check again' : 'Run check'}
        </button>
      </header>
      {state.status === 'idle' && <p className="muted small">Runs on the computer where Azarvis is running. Nothing is sent anywhere else.</p>}
      {(state.status === 'error' || (state.status === 'done' && !checks.length)) && <p className="sec-breach bad"><Icon name="alert" size="1em" /> {state.reason || 'No results.'}</p>}
      {checks.length > 0 && (
        <ul className="sec-checks">
          {checks.map((c) => (
            <li key={c.id} className={`st-${c.status}`}>
              <Icon name={c.status === 'ok' ? 'check' : c.status === 'unknown' ? 'help' : 'alert'} />
              <div><strong>{c.label}</strong><span>{c.detail}</span>{c.fix && c.status !== 'ok' && <small>How to fix: {c.fix}</small>}</div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default function SecurityCenter({ user, onOpenTab }) {
  const checks = useAccountChecks(user);
  const score = checks ? checks.filter((c) => c.ok).length : null;
  return (
    <div className="sec">
      <header className="sec-head">
        <div>
          <h1>Security Center</h1>
          <p>How well your account and this computer are protected, and tools for stronger passwords. Azarvis never stores passwords and never accesses accounts or devices that aren’t yours.</p>
        </div>
        {score != null && (
          <div className={`sec-score ${score >= 4 ? 'ok' : score >= 3 ? 'warn' : 'bad'}`} aria-label={`Account protection ${score} of ${checks.length}`}>
            <strong>{score}<small>/{checks.length}</small></strong>
            <span>Account protection</span>
          </div>
        )}
      </header>

      <section className="sec-card sec-card--wide">
        <header><Icon name="user" /><div><h2>Your account</h2><p>From your real sign-in settings and the last 30 days of activity.</p></div>
          <button type="button" className="btn sm" onClick={() => onOpenTab('account')}>Manage in Account <Icon name="chevron" size="1em" /></button>
        </header>
        {!checks ? (
          <div className="sec-skeleton" aria-label="Loading"><i /><i /><i /></div>
        ) : (
          <ul className="sec-checks">
            {checks.map((c) => (
              <li key={c.id} className={c.ok ? 'st-ok' : 'st-warn'}>
                <Icon name={c.ok ? 'check' : 'alert'} />
                <div><strong>{c.label}</strong><span>{c.detail}</span></div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="sec-grid">
        <PasswordChecker user={user} />
        <PasswordGenerator />
      </div>
      <PcCheck />
    </div>
  );
}
