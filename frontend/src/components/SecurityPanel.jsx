import { useEffect, useState } from 'react';
import { auth, api } from '../api.js';

const EVENT_LABELS = {
  register: 'Account created',
  email_verified: 'Email verified',
  login_success: 'Signed in',
  login_failed: 'Failed sign-in attempt',
  login_otp_sent: 'Sign-in code sent',
  login_otp_failed: 'Wrong sign-in code',
  account_locked: 'Account locked (too many attempts)',
  login_blocked_locked: 'Sign-in blocked while locked',
  logout: 'Signed out',
  logout_all: 'Signed out everywhere',
  session_revoked: 'Device signed out',
  password_changed: 'Password changed',
  password_reset_requested: 'Password reset requested',
  password_reset: 'Password reset',
  phone_verification_started: 'Phone verification started',
  phone_verified: 'Phone verified',
  refresh_token_reuse_detected: '⚠ Suspicious session reuse: all devices signed out',
  role_changed: 'Role changed by admin',
  account_unlocked_by_admin: 'Unlocked by admin',
};

function device(ua = '') {
  const browser = /Edg\//.test(ua) ? 'Edge' : /Chrome\//.test(ua) ? 'Chrome' : /Firefox\//.test(ua) ? 'Firefox' : /Safari\//.test(ua) ? 'Safari' : 'Unknown browser';
  const os = /Windows/.test(ua) ? 'Windows' : /Android/.test(ua) ? 'Android' : /iPhone|iPad/.test(ua) ? 'iOS' : /Mac OS/.test(ua) ? 'macOS' : /Linux/.test(ua) ? 'Linux' : '';
  return `${browser}${os ? ` on ${os}` : ''}`;
}

export default function SecurityPanel({ user, onUserChange, onSignedOut }) {
  const [sessions, setSessions] = useState([]);
  const [activity, setActivity] = useState([]);
  const [phone, setPhone] = useState('');
  const [phoneChallenge, setPhoneChallenge] = useState(null);
  const [code, setCode] = useState('');
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  const load = () => {
    auth.sessions().then(setSessions).catch(() => {});
    auth.activity().then(setActivity).catch(() => {});
  };
  useEffect(load, []);

  const run = (fn, success) => async (e) => {
    e?.preventDefault();
    setMsg('');
    setError('');
    try {
      await fn();
      if (success) setMsg(success);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const startPhone = run(async () => setPhoneChallenge(await auth.startPhone(phone)));
  const verifyPhone = run(async () => {
    onUserChange(await auth.verifyPhone(phoneChallenge.challengeId, code));
    setPhoneChallenge(null);
    setCode('');
  }, 'Phone verified.');
  const setChannel = (otpChannel) => run(async () => onUserChange(await api.updateMe({ preferences: { otpChannel } })), 'Saved.')();
  const logoutAll = run(async () => {
    await auth.logoutAll();
    onSignedOut();
  });

  return (
    <>
      <h3>Security</h3>
      {msg && <div className="success">{msg}</div>}
      {error && <div className="error">{error}</div>}

      <div className="card">
        <strong>Sign-in codes</strong>
        <p className="muted">Every sign-in needs a one-time code. Choose where it's sent.</p>
        <div className="row wrap">
          <label className="row"><input type="radio" checked={user.preferences?.otpChannel !== 'sms'} onChange={() => setChannel('email')} /> Email ({user.email})</label>
          <label className="row">
            <input type="radio" checked={user.preferences?.otpChannel === 'sms'} disabled={!user.phoneVerified} onChange={() => setChannel('sms')} />
            SMS {user.phoneVerified ? `(${user.phone})` : '(verify a phone first)'}
          </label>
        </div>
        {!phoneChallenge ? (
          <form className="row wrap" onSubmit={startPhone}>
            <input placeholder="+919876543210" value={phone} onChange={(e) => setPhone(e.target.value)} />
            <button className="btn">{user.phoneVerified ? 'Change phone' : 'Add phone'}</button>
          </form>
        ) : (
          <form className="row wrap" onSubmit={verifyPhone}>
            <span className="muted">Code sent to {phoneChallenge.maskedDestination}</span>
            <input inputMode="numeric" maxLength={6} placeholder="6-digit code" value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} />
            <button className="btn primary">Verify</button>
          </form>
        )}
      </div>

      <div className="card">
        <div className="row"><strong className="grow">Signed-in devices</strong><button className="btn danger" onClick={logoutAll}>Sign out everywhere</button></div>
        <ul className="list">
          {sessions.map((s) => (
            <li key={s.id}>
              <span>
                {device(s.userAgent)} {s.current && <span className="tool-chip">this device</span>}
                <div className="meta">IP {s.ip || '?'} · last active {new Date(s.lastUsedAt).toLocaleString()}</div>
              </span>
              {!s.current && <button className="btn ghost" onClick={run(() => auth.revokeSession(s.id), 'Device signed out.')}>Sign out</button>}
            </li>
          ))}
        </ul>
      </div>

      <div className="card">
        <strong>Recent security activity</strong>
        <ul className="list">
          {activity.map((a) => (
            <li key={a.id}>
              <span>
                {EVENT_LABELS[a.event] || a.event}
                <div className="meta">{new Date(a.createdAt).toLocaleString()} · IP {a.ip || '?'} · {device(a.userAgent)}</div>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
