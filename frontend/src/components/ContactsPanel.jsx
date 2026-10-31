import { useEffect, useMemo, useRef, useState } from 'react';
import { api } from '../api.js';
import { Icon } from '../icons.jsx';
import { EmptyState, PageHeader, toast } from '../ui.jsx';

// Address book. Jarvis reads it too (find_contact tool), so "email Priya about tomorrow's
// leave" picks up Priya's address. Call / WhatsApp / email open the right app on this PC.
const BLANK = { name: '', phone: '', email: '', company: '', notes: '', favorite: false };

const initials = (name) =>
  name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('') || '?';
// The same name always gets the same avatar color.
const hueOf = (name) => [...name].reduce((h, ch) => (h * 31 + ch.charCodeAt(0)) % 360, 7);
const digits = (phone) => (phone || '').replace(/[^\d]/g, '');
const validEmail = (e) => !e || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

function Avatar({ name, size = '' }) {
  return (
    <span className={`contact-avatar ${size}`} style={{ '--hue': hueOf(name) }} aria-hidden="true">
      {initials(name)}
    </span>
  );
}

function ContactForm({ initial, onSave, onClose }) {
  const [form, setForm] = useState(initial);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const first = useRef(null);
  useEffect(() => first.current?.focus(), []);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));
  const submit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return setError('Name is required.');
    if (!validEmail(form.email.trim())) return setError("That email address doesn't look right.");
    setSaving(true);
    try {
      const clean = Object.fromEntries(Object.entries(form).map(([k, v]) => [k, typeof v === 'string' ? v.trim() || null : v]));
      await onSave(clean);
      onClose();
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  };

  return (
    <div className="palette-backdrop" onMouseDown={onClose} onKeyDown={(e) => e.key === 'Escape' && onClose()}>
      <form className="modal" role="dialog" aria-label={initial.id ? 'Edit contact' : 'New contact'} onMouseDown={(e) => e.stopPropagation()} onSubmit={submit}>
        <header className="modal-head">
          <Avatar name={form.name || '?'} size="lg" />
          <h3 className="grow">{initial.id ? 'Edit contact' : 'New contact'}</h3>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close"><Icon name="x" /></button>
        </header>
        <label className="field">Name<input ref={first} value={form.name} onChange={set('name')} maxLength={120} placeholder="Priya Sharma" required /></label>
        <div className="field-row">
          <label className="field">Phone<input type="tel" value={form.phone || ''} onChange={set('phone')} maxLength={40} placeholder="+91 98765 43210" /></label>
          <label className="field">Email<input type="email" value={form.email || ''} onChange={set('email')} maxLength={254} placeholder="priya@example.com" /></label>
        </div>
        <label className="field">Company or relation<input value={form.company || ''} onChange={set('company')} maxLength={120} placeholder="Manager at Infosys" /></label>
        <label className="field">Notes<textarea value={form.notes || ''} onChange={set('notes')} maxLength={500} rows={2} placeholder="Birthday 12 March, prefers calls after 6pm" /></label>
        <label className="check-row"><input type="checkbox" checked={Boolean(form.favorite)} onChange={set('favorite')} /> Favourite</label>
        {error && <div className="error">{error}</div>}
        <footer className="modal-foot">
          <button type="button" className="btn ghost" onClick={onClose}>Cancel</button>
          <button className="btn primary" disabled={saving}>{saving ? 'Saving…' : 'Save contact'}</button>
        </footer>
      </form>
    </div>
  );
}

export default function ContactsPanel({ initialQuery = '', onAsk }) {
  const [contacts, setContacts] = useState([]);
  const [query, setQuery] = useState(initialQuery);
  const [editing, setEditing] = useState(null); // contact being edited, or BLANK for a new one
  const [error, setError] = useState('');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => setQuery(initialQuery), [initialQuery]);

  const load = () =>
    api.contacts()
      .then(setContacts)
      .catch((e) => setError(e.message))
      .finally(() => setLoaded(true));
  useEffect(() => { load(); }, []);

  const save = async (data) => {
    if (editing.id) await api.updateContact(editing.id, data);
    else await api.addContact(data);
    toast(editing.id ? 'Contact updated' : `${data.name} added to contacts`);
    load();
  };
  const toggleFavorite = (c) => api.updateContact(c.id, { favorite: !c.favorite }).then(load);
  const remove = async (c) => {
    if (!window.confirm(`Delete ${c.name} from your contacts?`)) return;
    await api.deleteContact(c.id);
    toast(`${c.name} deleted`);
    load();
  };
  const copy = (text, what) => navigator.clipboard.writeText(text).then(() => toast(`${what} copied`), () => toast("Couldn't copy", 'error'));

  const { favorites, groups } = useMemo(() => {
    const q = query.trim().toLowerCase();
    const shown = q
      ? contacts.filter((c) => [c.name, c.email, c.phone, c.company, c.notes].some((v) => v?.toLowerCase().includes(q)))
      : contacts;
    const groups = new Map();
    for (const c of [...shown].sort((a, b) => a.name.localeCompare(b.name))) {
      const letter = /[a-z]/i.test(c.name[0]) ? c.name[0].toUpperCase() : '#';
      if (!groups.has(letter)) groups.set(letter, []);
      groups.get(letter).push(c);
    }
    return { favorites: q ? [] : contacts.filter((c) => c.favorite), groups: [...groups] };
  }, [contacts, query]);

  return (
    <div className="panel">
      <PageHeader icon="contacts" hue={160} title="Contacts" subtitle="Your address book. Ask Jarvis “email Priya about tomorrow” and it uses these details.">
        <span className="stat-pill"><strong>{contacts.length}</strong> {contacts.length === 1 ? 'contact' : 'contacts'}</span>
        <button className="btn primary" onClick={() => setEditing(BLANK)}><Icon name="plus" /> Add contact</button>
      </PageHeader>
      {error && <div className="error">{error}</div>}

      {contacts.length > 0 && (
        <div className="toolbar">
          <label className="search-box grow">
            <Icon name="search" size="1em" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by name, phone, email or company" aria-label="Search contacts" />
            {query && <button className="icon-btn" onClick={() => setQuery('')} aria-label="Clear search"><Icon name="x" size="0.9em" /></button>}
          </label>
        </div>
      )}

      {favorites.length > 0 && (
        <div className="fav-strip">
          {favorites.map((c) => (
            <button key={c.id} className="fav" onClick={() => setQuery(c.name)} title={c.name}>
              <Avatar name={c.name} size="lg" />
              <span>{c.name.split(' ')[0]}</span>
            </button>
          ))}
        </div>
      )}

      {loaded && contacts.length === 0 ? (
        <EmptyState icon="contacts" title="No contacts yet">
          Add the people you email or call most, then just ask Jarvis to write to them.
          <span className="chips left"><button className="chip" onClick={() => setEditing(BLANK)}>+ Add your first contact</button></span>
        </EmptyState>
      ) : groups.length === 0 && loaded ? (
        <p className="muted">No contacts match “{query}”.</p>
      ) : (
        groups.map(([letter, list]) => (
          <section key={letter} className="contact-group">
            <h4 className="letter">{letter}</h4>
            <ul className="item-list">
              {list.map((c) => (
                <li key={c.id} className="item contact">
                  <Avatar name={c.name} />
                  <div className="grow item-body">
                    <span className="item-title">
                      {c.name}
                      {c.company && <span className="muted contact-company"> · {c.company}</span>}
                    </span>
                    <span className="item-meta">
                      {c.phone && <button className="tag link" onClick={() => copy(c.phone, 'Number')} title="Copy number"><Icon name="phone" size="1em" /> {c.phone}</button>}
                      {c.email && <button className="tag link" onClick={() => copy(c.email, 'Email')} title="Copy email"><Icon name="mail" size="1em" /> {c.email}</button>}
                      {c.notes && <span className="tag" title={c.notes}>{c.notes.length > 40 ? c.notes.slice(0, 40) + '…' : c.notes}</span>}
                    </span>
                  </div>
                  <div className="contact-actions">
                    {c.phone && <a className="icon-btn" href={`tel:${digits(c.phone)}`} title={`Call ${c.name}`} aria-label={`Call ${c.name}`}><Icon name="phone" size="1em" /></a>}
                    {c.phone && (
                      <a className="icon-btn" href={`https://wa.me/${digits(c.phone)}`} target="_blank" rel="noopener noreferrer" title="WhatsApp" aria-label={`WhatsApp ${c.name}`}>
                        <Icon name="whatsapp" size="1em" />
                      </a>
                    )}
                    {c.email && <a className="icon-btn" href={`mailto:${c.email}`} title={`Email ${c.name}`} aria-label={`Email ${c.name}`}><Icon name="mail" size="1em" /></a>}
                    {onAsk && (
                      <button className="icon-btn" title="Ask Jarvis to write to them" aria-label={`Ask Jarvis to write to ${c.name}`} onClick={() => onAsk(`Write an email to ${c.name}${c.email ? ` (${c.email})` : ''} about `, false)}>
                        <Icon name="sparkles" size="1em" />
                      </button>
                    )}
                    <button className={`icon-btn star ${c.favorite ? 'on' : ''}`} onClick={() => toggleFavorite(c)} title={c.favorite ? 'Remove from favourites' : 'Add to favourites'} aria-label="Favourite" aria-pressed={c.favorite}>
                      <Icon name="star" size="1em" filled={c.favorite} />
                    </button>
                    <button className="icon-btn" onClick={() => setEditing(c)} title="Edit" aria-label={`Edit ${c.name}`}><Icon name="edit" size="1em" /></button>
                    <button className="icon-btn" onClick={() => remove(c)} title="Delete" aria-label={`Delete ${c.name}`}><Icon name="trash" size="1em" /></button>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ))
      )}

      {editing && <ContactForm initial={{ ...BLANK, ...editing }} onSave={save} onClose={() => setEditing(null)} />}
    </div>
  );
}
