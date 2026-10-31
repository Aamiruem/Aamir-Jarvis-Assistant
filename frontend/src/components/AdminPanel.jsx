import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { PageHeader } from '../ui.jsx';

export default function AdminPanel({ currentUserId }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  const load = () => api.adminOverview().then(setData).catch((e) => setError(e.message));
  useEffect(() => { load(); }, []);

  const toggleRole = async (u) => {
    await api.setRole(u.id, u.role === 'admin' ? 'user' : 'admin').catch((e) => setError(e.message));
    load();
  };

  if (error) return <div className="panel"><div className="error">{error}</div></div>;
  if (!data) return <div className="panel muted">Loading…</div>;

  const ai = data.ai || {};
  const tiles = [
    ['Users', data.users],
    ['New (7 days)', data.newUsersLast7Days],
    ['Locked accounts', data.lockedAccounts],
    ['Conversations', data.conversations],
    ['Messages', ai.total_messages ?? '-'],
    ['Avg latency', ai.avg_latency_ms != null ? `${ai.avg_latency_ms} ms` : '-'],
    ['Tokens', ai.input_tokens != null ? (ai.input_tokens + ai.output_tokens).toLocaleString() : '-'],
  ];

  return (
    <div className="panel">
      <PageHeader icon="shield" hue={12} title="Admin" subtitle="Users and conversations from the API, usage analytics from the AI service." />
      {ai.error && <div className="error">AI stats unavailable: {ai.error}</div>}
      <div className="tiles">
        {tiles.map(([label, value]) => (
          <div key={label} className="tile">
            <div className="tile-value">{value}</div>
            <div className="muted">{label}</div>
          </div>
        ))}
      </div>

      <h3>Recent users</h3>
      <ul className="list">
        {data.recentUsers.map((u) => (
          <li key={u.id}>
            <span>{u.name} <span className="muted">· {u.email} · {u.role}</span></span>
            {u.id !== currentUserId && (
              <button className="btn ghost" onClick={() => toggleRole(u)}>
                {u.role === 'admin' ? 'Make user' : 'Make admin'}
              </button>
            )}
          </li>
        ))}
      </ul>

      {ai.by_intent && Object.keys(ai.by_intent).length > 0 && (
        <>
          <h3>Messages by intent</h3>
          <ul className="list">
            {Object.entries(ai.by_intent).sort((a, b) => b[1] - a[1]).map(([intent, n]) => (
              <li key={intent}><span>{intent}</span><span>{n}</span></li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
