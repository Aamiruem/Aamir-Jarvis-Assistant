import { useEffect, useState } from 'react';
import { auth, setAccessToken } from '../api.js';
import { Icon } from '../icons.jsx';
import { Brand } from '../ui.jsx';
import { track } from '../analytics.js';
import { passkeysSupported, signInWithPasskey, unlockName } from '../passkeys.js';

// Mirrors backend/express-api/src/auth/PasswordPolicy.js so problems show while typing.
// The server still has the final say.
function passwordRules(password, { name = '', email = '' } = {}) {
  const lower = password.toLowerCase();
  const localPart = email.split('@')[0].toLowerCase();
  const firstName = name.trim().split(' ')[0].toLowerCase();
  const rules = [
    ['12+ characters', password.length >= 12],
    ['Upper & lower case', /[a-z]/.test(password) && /[A-Z]/.test(password)],
    ['A digit', /\d/.test(password)],
    ['A symbol', /[^A-Za-z0-9]/.test(password)],
  ];
  if (firstName.length >= 4) rules.push([`Doesn't contain your name ("${firstName}")`, !lower.includes(firstName)]);
  if (localPart.length >= 4) rules.push(["Doesn't contain your email", !lower.includes(localPart)]);
  return rules;
}

// An input with a leading icon, so every field says what it is at a glance.
function Field({ icon, children }) {
  return (
    <div className="field">
      <Icon name={icon} size="1.05em" className="field-icon" />
      {children}
    </div>
  );
}

// A password input with a lock icon and an eye button that shows or hides the text.
function PasswordField({ icon = 'key', value, onChange, placeholder, autoComplete, invalid = false }) {
  const [shown, setShown] = useState(false);
  return (
    <div className={`field ${invalid ? 'field-invalid' : ''}`}>
      <Icon name={icon} size="1.05em" className="field-icon" />
      <input
        type={shown ? 'text' : 'password'}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        autoComplete={autoComplete}
        required
        aria-invalid={invalid || undefined}
      />
      <button
        type="button"
        className="field-toggle"
        onClick={() => setShown((s) => !s)}
        aria-label={shown ? 'Hide password' : 'Show password'}
        aria-pressed={shown}
        title={shown ? 'Hide password' : 'Show password'}
      >
        <Icon name={shown ? 'eyeOff' : 'eye'} size="1.05em" />
      </button>
    </div>
  );
}

function PasswordChecklist({ password, name, email }) {
  return (
    <ul className="hint pw-rules">
      {passwordRules(password, { name, email }).map(([label, ok]) => (
        <li key={label} className={password ? (ok ? 'ok' : 'bad') : ''}>
          {password ? (ok ? '✓' : '✗') : '•'} {label}
        </li>
      ))}
    </ul>
  );
}

// Multi-step, banking-style sign-in:
//   login    -> (password ok) -> otp(login)        -> signed in
//   register -> otp(verify_email)                  -> signed in
//   forgot   -> otp(reset_password) + new password -> back to login
// initialStep: 'login' or 'register' (the website's Sign in / Get started buttons).
// onDemo: opens the demo, for visitors who want to look around without an account.
// What a failed request means for the person signing in, in plain words.
function friendlyError(err) {
  if (err?.data?.code === 'NOT_CONFIGURED' || err?.status === 503) {
    return "Sign-in is down for a moment: the Azarvis server can't reach its database. Your account and data are safe. Please try again a little later, or explore the demo meanwhile.";
  }
  return err?.message || 'Something went wrong. Please try again.';
}

/** A field with a visible label (and an optional link on the right of the label, like "Forgot password?"). */
function Labeled({ label, extra, children }) {
  return (
    <div className="auth-field">
      <div className="auth-label-row"><span className="auth-label">{label}</span>{extra}</div>
      {children}
    </div>
  );
}

export default function Login({ onAuth, initialStep = 'login', onDemo, onHome }) {
  const [step, setStep] = useState(initialStep);
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '', code: '', newPassword: '', newConfirm: '' });
  // Both password boxes must match before we send anything to the server.
  const mismatch = (a, b) => b.length > 0 && a !== b;
  const passwordsDiffer = (a, b) => {
    if (a === b) return false;
    setError("The two passwords don't match. Type the same password in both boxes.");
    return true;
  };
  const [challenge, setChallenge] = useState(null); // { challengeId, maskedDestination, purpose, resendAvailableAt }
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [busy, setBusy] = useState(false);
  const [now, setNow] = useState(Date.now());
  const [canPasskey] = useState(passkeysSupported);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const update = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const go = (next) => {
    setStep(next);
    setError('');
    setInfo('');
  };

  const run = async (fn) => {
    setBusy(true);
    setError('');
    try {
      await fn();
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setBusy(false);
    }
  };

  // Handles any auth response: tokens -> signed in; challenge -> OTP screen.
  const handle = (result, purpose) => {
    if (result.accessToken) {
      setAccessToken(result.accessToken);
      // Google Analytics (only with consent): which step, never who.
      track(purpose === 'verify_email' ? 'sign_up' : 'login', { method: 'email' });
      onAuth(result.user);
      return;
    }
    const p = result.emailVerificationRequired ? 'verify_email' : result.mfaRequired ? 'login' : purpose;
    setChallenge({ ...result, purpose: p });
    setForm((f) => ({ ...f, code: '' }));
    go('otp');
    if (result.emailVerificationRequired && purpose === 'login') setInfo('Please verify your email first.');
  };

  const submitLogin = (e) => {
    e.preventDefault();
    run(async () => handle(await auth.login(form.email, form.password), 'login'));
  };
  // No password: the device's Face ID / Touch ID / Windows Hello / fingerprint (see passkeys.js).
  // The email is optional; without it the device lists the passkeys it has for Azarvis.
  const passkeyLogin = () => run(async () => onAuth(await signInWithPasskey(form.email)));

  const submitRegister = (e) => {
    e.preventDefault();
    if (passwordsDiffer(form.password, form.confirm)) return;
    run(async () => handle(await auth.register(form.name, form.email, form.password), 'verify_email'));
  };
  const submitForgot = (e) => {
    e.preventDefault();
    run(async () => {
      const r = await auth.forgotPassword(form.email);
      setChallenge({ challengeId: r.challengeId, devCode: r.devCode, purpose: 'reset_password', maskedDestination: form.email });
      go('otp');
      setInfo(r.message);
    });
  };
  const submitOtp = (e) => {
    e.preventDefault();
    run(async () => {
      const { challengeId, purpose } = challenge;
      if (purpose === 'verify_email') handle(await auth.verifyEmail(challengeId, form.code));
      else if (purpose === 'login') handle(await auth.verifyLogin(challengeId, form.code));
      else {
        if (passwordsDiffer(form.newPassword, form.newConfirm)) return;
        const r = await auth.resetPassword(challengeId, form.code, form.newPassword);
        go('login');
        setInfo(r.message);
      }
    });
  };
  const resend = () =>
    run(async () => {
      const r = await auth.resendOtp(challenge.challengeId);
      setChallenge({ ...challenge, ...r });
      setInfo('A new code has been sent.');
    });

  const resendIn = challenge?.resendAvailableAt ? Math.ceil((new Date(challenge.resendAvailableAt) - now) / 1000) : 0;
  const otpTitle = { verify_email: 'Verify your email', login: 'Two-step verification', reset_password: 'Reset your password' };
  const headings = {
    login: ['Welcome back', 'Sign in to talk with Azarvis, your AI voice assistant.'],
    register: ['Create your account', 'It takes a minute. Azarvis will ask a few quick questions to get to know you.'],
    forgot: ['Forgot your password?', "Enter your email and we'll send you a one-time code."],
    otp: ['Check your inbox', 'For your security, we check it is really you.'],
  };
  const [title, subtitle] = step === 'otp' && challenge ? [otpTitle[challenge.purpose], headings.otp[1]] : headings[step] ?? headings.login;

  return (
    <div className="auth-page pub-wrap">
      <aside className="auth-aside" aria-label="Why Azarvis">
        <span className="auth-kicker"><Icon name="sparkles" size="0.95em" /> Azarvis AI Assistant</span>
        <h2>Your day, handled <span className="auth-grad">by voice.</span></h2>
        <p className="auth-lead">{step === 'register' ? 'Create a free account in a minute. Azarvis learns how you like things done.' : 'Pick up where you left off: your chats, reminders, notes and documents are waiting.'}</p>

        <figure className="auth-visual" aria-hidden="true">
          <img src="/art/chat-assistant.webp" alt="" width="475" height="539" />
          <figcaption className="auth-bubble auth-bubble--you"><Icon name="mic" size="1em" /> “Hey Azarvis, remind me to call Mom at 6.”</figcaption>
          <span className="auth-bubble auth-bubble--ai"><Icon name="check" size="1em" /> Done. I'll remind you at 6:00 PM.</span>
        </figure>

        <ul className="auth-points">
          <li><span><Icon name="mic" size="1.05em" /></span><div><strong>Hands-free</strong><p>Say “Hey Azarvis” and hear the answer out loud, in your language.</p></div></li>
          <li><span><Icon name="tasks" size="1.05em" /></span><div><strong>Never miss a thing</strong><p>Reminders read to you at the start of the day.</p></div></li>
          <li><span><Icon name="shield" size="1.05em" /></span><div><strong>No password needed</strong><p>Use a passkey: Face ID, Touch ID, Windows Hello or a fingerprint.</p></div></li>
        </ul>
        {onDemo && (
          <button type="button" className="auth-demo" onClick={onDemo}>
            <Icon name="sparkles" size="1.05em" />
            <span className="grow"><strong>Just looking?</strong> Try the demo, no account needed</span>
            <Icon name="chevron" size="1em" />
          </button>
        )}
      </aside>
      <div className="card login">
        <header className="login-brand">
          <Brand size={40} />
          <span className="login-tagline">AI voice assistant by Aamir Hussain Azad</span>
        </header>

        {(step === 'login' || step === 'register') && (
          <div className="auth-tabs" role="tablist" aria-label="Sign in or create an account">
            <button type="button" role="tab" aria-selected={step === 'login'} className={step === 'login' ? 'on' : ''} onClick={() => go('login')}>Sign in</button>
            <button type="button" role="tab" aria-selected={step === 'register'} className={step === 'register' ? 'on' : ''} onClick={() => go('register')}>Create account</button>
          </div>
        )}

        <div className="login-heading">
          <h1>{title}</h1>
          <p className="muted">{subtitle}</p>
        </div>

        {info && <div className="success">{info}</div>}

        {step === 'login' && (
          <form onSubmit={submitLogin} className="stack">
            <Labeled label="Email">
              <Field icon="mail">
                <input type="email" placeholder="you@example.com" value={form.email} onChange={update('email')} autoComplete="username" aria-label="Email" required />
              </Field>
            </Labeled>
            <Labeled label="Password" extra={<button type="button" className="link-btn auth-forgot" onClick={() => go('forgot')}>Forgot password?</button>}>
              <PasswordField value={form.password} onChange={update('password')} placeholder="Your password" autoComplete="current-password" />
            </Labeled>
            {error && <div className="error" role="alert">{error}</div>}
            <button className="btn primary full auth-submit" disabled={busy}>{busy ? 'Checking…' : 'Sign in'}</button>
            {canPasskey && (
              <>
                <div className="login-or" role="separator"><span>or, without a password</span></div>
                <button type="button" className="btn full login-passkey" onClick={passkeyLogin} disabled={busy}>
                  <Icon name="key" size="1.05em" /> Sign in with a passkey
                  <small>{unlockName()}</small>
                </button>
              </>
            )}

          </form>
        )}

        {step === 'register' && (
          <form onSubmit={submitRegister} className="stack">
            <Labeled label="Full name">
              <Field icon="user">
                <input placeholder="Your name" value={form.name} onChange={update('name')} autoComplete="name" aria-label="Full name" required />
              </Field>
            </Labeled>
            <Labeled label="Email">
              <Field icon="mail">
                <input type="email" placeholder="you@example.com" value={form.email} onChange={update('email')} autoComplete="username" aria-label="Email" required />
              </Field>
            </Labeled>
            <Labeled label="Password">
              <PasswordField value={form.password} onChange={update('password')} placeholder="Create a password" autoComplete="new-password" />
            </Labeled>
            <PasswordChecklist password={form.password} name={form.name} email={form.email} />
            <Labeled label="Confirm password">
              <PasswordField
                value={form.confirm}
                onChange={update('confirm')}
                placeholder="Type it again"
                autoComplete="new-password"
                invalid={mismatch(form.password, form.confirm)}
              />
            </Labeled>
            {mismatch(form.password, form.confirm) && <p className="field-error">Passwords don't match yet.</p>}
            {error && <div className="error" role="alert">{error}</div>}
            <button className="btn primary full auth-submit" disabled={busy}>{busy ? 'Creating…' : 'Create free account'}</button>
            <p className="auth-terms">By creating an account you agree to keep your login private. Your data stays in your account.</p>
          </form>
        )}

        {step === 'forgot' && (
          <form onSubmit={submitForgot} className="stack">
            <Field icon="mail">
              <input type="email" placeholder="Email address" value={form.email} onChange={update('email')} required />
            </Field>
            {error && <div className="error" role="alert">{error}</div>}
            <button className="btn primary full auth-submit" disabled={busy}>Send code</button>
            <button type="button" className="btn ghost full" onClick={() => go('login')}>Back to sign in</button>
          </form>
        )}

        {step === 'otp' && challenge && (
          <form onSubmit={submitOtp} className="stack">
            <p className="muted">
              Enter the 6-digit code sent to <strong>{challenge.maskedDestination}</strong>.
            </p>
            {challenge.devCode && (
              <div className="dev-code">
                Development mode, no email set up yet. Your code: <strong>{challenge.devCode}</strong>
              </div>
            )}
            <input
              className="otp-input"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              placeholder="••••••"
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value.replace(/\D/g, '') })}
              required
            />
            {challenge.purpose === 'reset_password' && (
              <>
                <PasswordField value={form.newPassword} onChange={update('newPassword')} placeholder="New password" autoComplete="new-password" />
                <PasswordChecklist password={form.newPassword} email={form.email} />
                <PasswordField
                  value={form.newConfirm}
                  onChange={update('newConfirm')}
                  placeholder="Confirm new password"
                  autoComplete="new-password"
                  invalid={mismatch(form.newPassword, form.newConfirm)}
                />
                {mismatch(form.newPassword, form.newConfirm) && <p className="field-error">Passwords don't match yet.</p>}
              </>
            )}
            {error && <div className="error" role="alert">{error}</div>}
            <button className="btn primary full auth-submit" disabled={busy || form.code.length !== 6}>{busy ? 'Verifying…' : 'Verify'}</button>
            {challenge.purpose !== 'reset_password' && (
              <button type="button" className="btn ghost full" disabled={busy || resendIn > 0} onClick={resend}>
                {resendIn > 0 ? `Resend code in ${resendIn}s` : 'Resend code'}
              </button>
            )}
            <button type="button" className="btn ghost full" onClick={() => go('login')}>Cancel</button>
            <p className="hint login-secure">
              <Icon name="shield" size="0.95em" /> Never share this code. Azarvis staff will never ask for it.
            </p>
          </form>
        )}

        {onDemo && (step === 'login' || step === 'register') && (
          <button type="button" className="btn ghost full login-demo" onClick={onDemo}>
            <Icon name="sparkles" size="1em" /> Explore the demo without an account
          </button>
        )}
        <footer className="login-foot">
          <Icon name="shield" size="0.95em" /> Protected by hashed passwords and short-lived sessions
          {onHome && (
            <button type="button" className="link-btn login-home" onClick={onHome}>
              ← Back to the website
            </button>
          )}
        </footer>
      </div>
    </div>
  );
}
