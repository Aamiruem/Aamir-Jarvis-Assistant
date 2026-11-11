import { useEffect, useState } from 'react';
import { auth, api } from '../api.js';
import { Icon } from '../icons.jsx';
import { addPasskey, deviceUnlockAvailable, passkeysSupported, unlockName } from '../passkeys.js';

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
  passkey_added: 'Passkey added',
  passkey_removed: 'Passkey removed',
  passkey_login: 'Signed in with a passkey',
  passkey_login_failed: 'Failed passkey sign-in'
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
  const [passkeys, setPasskeys] = useState(null);
  const [hasUnlock, setHasUnlock] = useState(false);
  useEffect(() => {
    deviceUnlockAvailable().then(setHasUnlock);
  }, []);

  const load = () => {
    api.passkeys().then(setPasskeys).catch(() => setPasskeys([]));
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
  const newPasskey = run(async () => {
    await addPasskey();
  }, `Passkey added. Next time, sign in on this device with ${unlockName()}: no password needed.`);
  const removePasskey = (p) => {
    if (!window.confirm(`Remove the passkey "${p.name}"? That device will need your password again.`)) return;
    run(() => api.removePasskey(p.id), 'Passkey removed.')();
  };
  const logoutAll = run(async () => {
    await auth.logoutAll();
    onSignedOut();
  });

  return (
    <>
      <h3>Security</h3>
      {msg && <div className="success">{msg}</div>}
      {error && <div className="error">{error}</div>}

      <div className="card passkeys-card">
        <div className="row wrap">
          <span className="badge-icon" style={{ '--hue': 265 }}><Icon name="key" /></span>
          <div className="grow">
            <strong>Passkeys: sign in without a password</strong>
            <p className="muted small">
              Use Face ID, Touch ID, Windows Hello or your phone's fingerprint. Add one on each device you use: iPhone, Android, Mac or Windows. The device keeps the secret key; Azarvis never sees it.
            </p>
          </div>
          {passkeysSupported() ? (
            <button className="btn primary" onClick={newPasskey}>
              <Icon name="plus" size="1em" /> Add a passkey on this device
            </button>
          ) : (
            <span className="muted small">Passkeys need the https:// address of Azarvis (or localhost on this computer).</span>
          )}
        </div>
        {passkeysSupported() && !hasUnlock && (
          <p className="hint">This device has no built-in unlock, but you can still use a passkey saved on your phone (scan the QR code it shows) or a security key.</p>
        )}
        {passkeys?.length > 0 ? (
          <ul className="list">
            {passkeys.map((p) => (
              <li key={p.id}>
                <span>
                  {p.name} {p.backedUp && <span className="tool-chip">synced</span>}
                  <div className="meta">
                    Added {new Date(p.createdAt).toLocaleDateString()} · {p.lastUsedAt ? `last used ${new Date(p.lastUsedAt).toLocaleString()}` : 'not used yet'}
                  </div>
                </span>
                <button className="btn ghost" onClick={() => removePasskey(p)}>Remove</button>
              </li>
            ))}
          </ul>
        ) : (
          passkeys && <p className="muted small">No passkeys yet.</p>
        )}
      </div>

      <div className="card">
        <strong>Sign-in codes</strong>
        <p className="muted">Every password sign-in needs a one-time code. Choose where it's sent. (Passkeys don't need one: the device check is the second factor.)</p>
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
