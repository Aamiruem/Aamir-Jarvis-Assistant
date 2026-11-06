import { useEffect, useState } from 'react';
import { auth, setAccessToken } from '../api.js';
import { Icon } from '../icons.jsx';

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
export default function Login({ onAuth }) {
  const [step, setStep] = useState('login');
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
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  // Handles any auth response: tokens -> signed in; challenge -> OTP screen.
  const handle = (result, purpose) => {
    if (result.accessToken) {
      setAccessToken(result.accessToken);
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
    <div className="center-screen">
      <div className="card login">
        <header className="login-brand">
          <img src="/icon.svg" alt="" width="56" height="56" className="login-logo" />
          <span className="login-wordmark">Azarvis</span>
          <span className="login-tagline">AI voice assistant by Aamir Hussain Azad</span>
        </header>

        <div className="login-heading">
          <h1>{title}</h1>
          <p className="muted">{subtitle}</p>
        </div>

        {info && <div className="success">{info}</div>}

        {step === 'login' && (
          <form onSubmit={submitLogin} className="stack">
            <Field icon="mail">
              <input type="email" placeholder="Email address" value={form.email} onChange={update('email')} autoComplete="username" required />
            </Field>
            <PasswordField value={form.password} onChange={update('password')} placeholder="Password" autoComplete="current-password" />
            {error && <div className="error">{error}</div>}
            <button className="btn primary full" disabled={busy}>{busy ? 'Checking…' : 'Sign in'}</button>
            <button type="button" className="btn ghost full" onClick={() => go('forgot')}>Forgot password?</button>
            <p className="login-switch">
              New to Azarvis? <button type="button" className="link-btn" onClick={() => go('register')}>Create an account</button>
            </p>
          </form>
        )}

        {step === 'register' && (
          <form onSubmit={submitRegister} className="stack">
            <Field icon="user">
              <input placeholder="Full name" value={form.name} onChange={update('name')} autoComplete="name" required />
            </Field>
            <Field icon="mail">
              <input type="email" placeholder="Email address" value={form.email} onChange={update('email')} autoComplete="username" required />
            </Field>
            <PasswordField value={form.password} onChange={update('password')} placeholder="Create a password" autoComplete="new-password" />
            <PasswordChecklist password={form.password} name={form.name} email={form.email} />
            <PasswordField
              value={form.confirm}
              onChange={update('confirm')}
              placeholder="Confirm password"
              autoComplete="new-password"
              invalid={mismatch(form.password, form.confirm)}
            />
            {mismatch(form.password, form.confirm) && <p className="field-error">Passwords don't match yet.</p>}
            {error && <div className="error">{error}</div>}
            <button className="btn primary full" disabled={busy}>{busy ? 'Creating…' : 'Create account'}</button>
            <p className="login-switch">
              Already have an account? <button type="button" className="link-btn" onClick={() => go('login')}>Sign in</button>
            </p>
          </form>
        )}

        {step === 'forgot' && (
          <form onSubmit={submitForgot} className="stack">
            <Field icon="mail">
              <input type="email" placeholder="Email address" value={form.email} onChange={update('email')} required />
            </Field>
            {error && <div className="error">{error}</div>}
            <button className="btn primary full" disabled={busy}>Send code</button>
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
            {error && <div className="error">{error}</div>}
            <button className="btn primary full" disabled={busy || form.code.length !== 6}>{busy ? 'Verifying…' : 'Verify'}</button>
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

        <footer className="login-foot">Protected by hashed passwords and short-lived sessions</footer>
      </div>
    </div>
  );
}
