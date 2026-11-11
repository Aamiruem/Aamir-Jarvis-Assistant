import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { PageHeader } from '../ui.jsx';

export default function AdminPanel({ currentUserId }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState(null);

  const load = () => api.adminOverview().then(setData).catch((e) => setError(e.message));
  useEffect(() => {
    load();
    api.adminFeedback().then(setFeedback).catch(() => setFeedback({ total: 0, items: [], error: true }));
  }, []);

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

      <h3>Website feedback {feedback && <span className="muted">· {feedback.total}</span>}</h3>
      {!feedback && <p className="muted">Loading…</p>}
      {feedback?.error && <p className="error">Feedback could not be loaded.</p>}
      {feedback && !feedback.error && feedback.items.length === 0 && <p className="muted">No feedback yet. It arrives from the form on the public website and the demo.</p>}
      {feedback?.items?.length > 0 && (
        <ul className="list admin-feedback">
          {feedback.items.map((f) => (
            <li key={f.id}>
              <div className="grow">
                <div className="admin-feedback-head">
                  <span className="admin-feedback-tag">{f.category}</span>
                  {f.rating && <span className="admin-feedback-stars" aria-label={`${f.rating} of 5 stars`}>{'★'.repeat(f.rating)}{'☆'.repeat(5 - f.rating)}</span>}
                  <span className="muted small">{new Date(f.createdAt).toLocaleString()}{f.page ? ` · from ${f.page}` : ''}</span>
                </div>
                <p className="admin-feedback-msg">{f.message}</p>
                {(f.name || f.email) && <p className="muted small">{[f.name, f.email].filter(Boolean).join(' · ')}</p>}
              </div>
            </li>
          ))}
        </ul>
      )}

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
