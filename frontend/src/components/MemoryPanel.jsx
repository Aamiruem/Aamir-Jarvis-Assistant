import { useEffect, useMemo, useState } from 'react';
import { api } from '../api.js';
import { Icon } from '../icons.jsx';
import { EmptyState, PageHeader, toast } from '../ui.jsx';

const EXAMPLES = ["I'm vegetarian", 'I work from 10am to 7pm', 'My manager is Priya', 'Reply to me in short bullet points'];

export default function MemoryPanel() {
  const [memories, setMemories] = useState([]);
  const [fact, setFact] = useState('');
  const [query, setQuery] = useState('');
  const [error, setError] = useState('');
  const [loaded, setLoaded] = useState(false);

  const load = () =>
    api.memories()
      .then(setMemories)
      .catch((e) => setError(e.message))
      .finally(() => setLoaded(true));
  useEffect(() => { load(); }, []);

  const remember = async (text) => {
    if (!text.trim()) return;
    try {
      await api.addMemory(text.trim());
      toast('Jarvis will remember that');
      setFact('');
      load();
    } catch (err) {
      setError(err.message);
    }
  };
  const forget = (m) => api.deleteMemory(m.id).then(() => { toast('Forgotten'); load(); });

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? memories.filter((m) => m.fact.toLowerCase().includes(q)) : memories;
  }, [memories, query]);

  return (
    <div className="panel">
      <PageHeader
        icon="brain"
        hue={330}
        title="Long-term memory"
        subtitle="Facts Jarvis remembers about you in every conversation. Jarvis adds them itself when you share something worth keeping."
      >
        <span className="stat-pill"><strong>{memories.length}</strong> {memories.length === 1 ? 'fact' : 'facts'}</span>
      </PageHeader>

      <form className="composer-card" onSubmit={(e) => { e.preventDefault(); remember(fact); }}>
        <Icon name="sparkles" className="accent-icon" />
        <input className="grow" value={fact} onChange={(e) => setFact(e.target.value)} placeholder="Teach Jarvis something… e.g. I'm vegetarian" maxLength={500} aria-label="New fact" />
        <button className="btn primary" disabled={!fact.trim()}>Remember</button>
      </form>
      {error && <div className="error">{error}</div>}

      {memories.length > 3 && (
        <div className="toolbar">
          <label className="search-box grow">
            <Icon name="search" size="1em" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search memories" aria-label="Search memories" />
          </label>
        </div>
      )}

      {loaded && memories.length === 0 ? (
        <EmptyState icon="brain" title="Nothing remembered yet">
          Try one of these, or just tell Jarvis in chat “Remember that…”.
          <span className="chips left">
            {EXAMPLES.map((x) => <button key={x} className="chip" onClick={() => remember(x)}>+ {x}</button>)}
          </span>
        </EmptyState>
      ) : (
        <ul className="card-grid">
          {shown.map((m) => (
            <li key={m.id} className="mem-card">
              <Icon name="sparkles" className="accent-icon" />
              <p className="grow">{m.fact}</p>
              <div className="mem-foot">
                {m.created_at && <small className="muted">{new Date(m.created_at).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}</small>}
                <button className="icon-btn" title="Forget" aria-label="Forget" onClick={() => forget(m)}><Icon name="trash" size="1em" /></button>
              </div>
            </li>
          ))}
          {shown.length === 0 && <li className="muted">No memories match “{query}”.</li>}
        </ul>
      )}
    </div>
  );
}
