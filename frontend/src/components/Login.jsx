import { useEffect, useState } from 'react';
import { auth, setAccessToken } from '../api.js';

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
  const [form, setForm] = useState({ name: '', email: '', password: '', code: '', newPassword: '' });
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

  return (
    <div className="center-screen">
      <div className="card login">
        <div className="orb" />
        <h1>AZARVIS</h1>
        <p className="muted">AI voice assistant by Aamir Hussain Azad</p>
        {info && <div className="success">{info}</div>}

        {step === 'login' && (
          <form onSubmit={submitLogin} className="stack">
            <input type="email" placeholder="Email" value={form.email} onChange={update('email')} autoComplete="username" required />
            <input type="password" placeholder="Password" value={form.password} onChange={update('password')} autoComplete="current-password" required />
            {error && <div className="error">{error}</div>}
            <button className="btn primary full" disabled={busy}>{busy ? 'Checking…' : 'Continue'}</button>
            <button type="button" className="btn ghost full" onClick={() => go('forgot')}>Forgot password?</button>
            <button type="button" className="btn ghost full" onClick={() => go('register')}>New here? Create an account</button>
          </form>
        )}

        {step === 'register' && (
          <form onSubmit={submitRegister} className="stack">
            <input placeholder="Full name" value={form.name} onChange={update('name')} autoComplete="name" required />
            <input type="email" placeholder="Email" value={form.email} onChange={update('email')} autoComplete="username" required />
            <input type="password" placeholder="Password" value={form.password} onChange={update('password')} autoComplete="new-password" required />
            <PasswordChecklist password={form.password} name={form.name} email={form.email} />
            {error && <div className="error">{error}</div>}
            <button className="btn primary full" disabled={busy}>{busy ? 'Creating…' : 'Create account'}</button>
            <button type="button" className="btn ghost full" onClick={() => go('login')}>Have an account? Sign in</button>
          </form>
        )}

        {step === 'forgot' && (
          <form onSubmit={submitForgot} className="stack">
            <p className="muted">Enter your email and we'll send a reset code.</p>
            <input type="email" placeholder="Email" value={form.email} onChange={update('email')} required />
            {error && <div className="error">{error}</div>}
            <button className="btn primary full" disabled={busy}>Send code</button>
            <button type="button" className="btn ghost full" onClick={() => go('login')}>Back to sign in</button>
          </form>
        )}

        {step === 'otp' && challenge && (
          <form onSubmit={submitOtp} className="stack">
            <h3>{otpTitle[challenge.purpose]}</h3>
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
                <input type="password" placeholder="New password" value={form.newPassword} onChange={update('newPassword')} autoComplete="new-password" required />
                <PasswordChecklist password={form.newPassword} email={form.email} />
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
            <p className="hint">Never share this code. Azarvis staff will never ask for it.</p>
          </form>
        )}
      </div>
    </div>
  );
}
