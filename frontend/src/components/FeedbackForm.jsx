import { useState } from 'react';
import { api } from '../api.js';
import { Icon } from '../icons.jsx';
import { CONTACT_EMAIL } from '../siteLinks.js';

// Feedback from the public website and the demo: works without an account (POST /api/feedback).
// When the server can't be reached (e.g. only the website is deployed) it offers to send the
// same text by email instead, so nothing the visitor wrote is lost.

const CATEGORIES = [
  ['idea', 'Idea', 'sparkles'],
  ['bug', 'Bug', 'alert'],
  ['praise', 'Praise', 'star'],
  ['general', 'Other', 'chat'],
];
const STAR_LABELS = ['Poor', 'Fair', 'Good', 'Great', 'Excellent'];

export default function FeedbackForm({ page = 'landing', compact = false }) {
  const [form, setForm] = useState({ rating: 0, category: 'idea', message: '', name: '', email: '' });
  const [hover, setHover] = useState(0);
  const [state, setState] = useState({ status: 'idle', error: '' }); // idle | sending | sent | offline
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const mailto = () => {
    const lines = [form.message, '', form.rating ? `Rating: ${form.rating}/5` : '', `Type: ${form.category}`, form.name && `From: ${form.name}`, form.email && `Reply to: ${form.email}`];
    const body = lines.filter((l) => l !== false && l !== undefined).join('\n');
    return `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent('Azarvis feedback')}&body=${encodeURIComponent(body)}`;
  };

  const submit = async (e) => {
    e.preventDefault();
    if (form.message.trim().length < 3) return setState({ status: 'idle', error: 'Please write a few words of feedback.' });
    setState({ status: 'sending', error: '' });
    try {
      await api.sendFeedback({ ...form, rating: form.rating || null, page });
      setState({ status: 'sent', error: '' });
    } catch (err) {
      // 4xx: the server answered (validation, too many) → show its message. Otherwise it's unreachable.
      if (err.status >= 400 && err.status < 500) setState({ status: 'idle', error: err.message });
      else setState({ status: 'offline', error: '' });
    }
  };

  if (state.status === 'sent') {
    return (
      <div className={`fb-done ${compact ? 'fb--compact' : ''}`} role="status">
        <span className="fb-done-icon"><Icon name="check" size="1.6em" /></span>
        <h3>Thank you!</h3>
        <p className="muted">Your feedback reached Aamir. It helps decide what Azarvis learns next.</p>
        <button type="button" className="btn" onClick={() => { setForm({ rating: 0, category: 'idea', message: '', name: '', email: '' }); setState({ status: 'idle', error: '' }); }}>
          Send more feedback
        </button>
      </div>
    );
  }

  const shown = hover || form.rating;
  return (
    <form className={`fb ${compact ? 'fb--compact' : ''}`} onSubmit={submit} noValidate>
      <fieldset className="fb-stars">
        <legend>How would you rate Azarvis?</legend>
        <div className="fb-stars-row" onMouseLeave={() => setHover(0)}>
          {STAR_LABELS.map((label, i) => (
            <button
              key={label}
              type="button"
              className={`fb-star ${i < shown ? 'on' : ''}`}
              onClick={() => setForm({ ...form, rating: form.rating === i + 1 ? 0 : i + 1 })}
              onMouseEnter={() => setHover(i + 1)}
              aria-label={`${i + 1} star${i ? 's' : ''}: ${label}`}
              aria-pressed={form.rating === i + 1}
            >
              <Icon name="star" size="1.5em" filled={i < shown} />
            </button>
          ))}
          <span className="fb-star-label muted">{shown ? STAR_LABELS[shown - 1] : 'Optional'}</span>
        </div>
      </fieldset>

      <fieldset className="fb-cats">
        <legend>What is it about?</legend>
        <div className="fb-cats-row">
          {CATEGORIES.map(([id, label, icon]) => (
            <button key={id} type="button" className={`fb-cat ${form.category === id ? 'on' : ''}`} aria-pressed={form.category === id} onClick={() => setForm({ ...form, category: id })}>
              <Icon name={icon} size="1em" /> {label}
            </button>
          ))}
        </div>
      </fieldset>

      <label className="fb-field">
        <span>Your feedback</span>
        <textarea rows={compact ? 4 : 5} maxLength={2000} value={form.message} onChange={set('message')} placeholder="What did you like? What should Azarvis do better?" required />
        <small className="muted fb-count">{form.message.length}/2000</small>
      </label>
      <div className="fb-two">
        <label className="fb-field">
          <span>Name <em>(optional)</em></span>
          <input value={form.name} onChange={set('name')} maxLength={80} autoComplete="name" placeholder="Your name" />
        </label>
        <label className="fb-field">
          <span>Email <em>(optional, for a reply)</em></span>
          <input type="email" value={form.email} onChange={set('email')} maxLength={160} autoComplete="email" placeholder="you@example.com" />
        </label>
      </div>

      {state.error && <div className="error" role="alert">{state.error}</div>}
      {state.status === 'offline' && (
        <div className="fb-offline" role="alert">
          <p>The Azarvis server isn't reachable right now, so the form couldn't be sent. You can email the same feedback instead:</p>
          <a className="btn" href={mailto()}><Icon name="mail" size="1em" /> Email it to Aamir</a>
          <span className="muted small">{CONTACT_EMAIL}</span>
        </div>
      )}
      <button className="btn primary fb-send" disabled={state.status === 'sending'}>
        <Icon name="send" size="1em" /> {state.status === 'sending' ? 'Sending…' : 'Send feedback'}
      </button>
      <p className="muted small fb-note">No account needed. Your email is only used to reply to you.</p>
    </form>
  );
}
