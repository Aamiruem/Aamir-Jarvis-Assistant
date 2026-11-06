import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { PageHeader } from '../ui.jsx';
import SecurityPanel from './SecurityPanel.jsx';
import VoiceSettings from './VoiceSettings.jsx';

export default function AccountPanel({ user, onUserChange, onDeleted }) {
  const [name, setName] = useState(user.name);
  const [pw, setPw] = useState({ current: '', next: '' });
  const [deletePw, setDeletePw] = useState('');
  const [stats, setStats] = useState(null);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  useEffect(() => { api.myStats().then(setStats).catch(() => {}); }, []);

  const run = (fn, success) => async (e) => {
    e.preventDefault();
    setMsg('');
    setError('');
    try {
      await fn();
      if (success) setMsg(success);
    } catch (err) {
      setError(err.message);
    }
  };

  const saveName = run(async () => onUserChange(await api.updateMe({ name })), 'Name updated.');
  const changePw = run(async () => {
    const r = await api.changePassword(pw.current, pw.next);
    setPw({ current: '', next: '' });
    setMsg(`Password changed. ${r.otherSessionsSignedOut} other device(s) signed out.`);
  });
  const deleteAccount = run(async () => {
    if (!window.confirm('Delete your account and ALL your data (chats, tasks, memories, documents)? This cannot be undone.')) return;
    await api.deleteAccount(deletePw);
    onDeleted();
  });

  return (
    <div className="panel">
      <PageHeader icon="user" hue={150} title={user.name} subtitle={`${user.email} · ${user.role === 'admin' ? 'Administrator' : 'Operator'}`}>
        <span className="avatar xl">{user.name.slice(0, 1).toUpperCase()}</span>
      </PageHeader>
      <p className="muted small">
        User id: <code>{user.id}</code> (set this as JARVIS_USER_ID to use your data from the MCP server or CLI)
      </p>
      {msg && <div className="success">{msg}</div>}
      {error && <div className="error">{error}</div>}

      {stats && (
        <div className="tiles">
          {[
            ['Messages', stats.total_messages],
            ['Avg reply', stats.avg_latency_ms ? `${(stats.avg_latency_ms / 1000).toFixed(1)} s` : '—'],
            ['Tokens used', (stats.input_tokens + stats.output_tokens).toLocaleString()],
          ].map(([label, value]) => (
            <div key={label} className="tile">
              <div className="tile-value">{value}</div>
              <div className="muted">{label}</div>
            </div>
          ))}
        </div>
      )}

      <h3>Voice</h3>
      <VoiceSettings />

      <h3>Profile</h3>
      <form className="row" onSubmit={saveName}>
        <input className="grow" value={name} onChange={(e) => setName(e.target.value)} />
        <button className="btn">Save</button>
      </form>

      <h3>Change password</h3>
      <form className="row wrap" onSubmit={changePw}>
        <input type="password" placeholder="Current password" value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} />
        <input type="password" placeholder="New password (12+, Aa1!)" value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} />
        <button className="btn">Change</button>
      </form>

      <SecurityPanel user={user} onUserChange={onUserChange} onSignedOut={onDeleted} />

      <h3 className="danger-text">Delete account</h3>
      <form className="row wrap" onSubmit={deleteAccount}>
        <input type="password" placeholder="Confirm with your password" value={deletePw} onChange={(e) => setDeletePw(e.target.value)} />
        <button className="btn danger">Delete everything</button>
      </form>
    </div>
  );
}
