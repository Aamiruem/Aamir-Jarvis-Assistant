import { Fragment, useEffect, useState } from 'react';
import { api } from '../api.js';
import { Icon } from '../icons.jsx';
import { EmptyState, PageHeader, toast } from '../ui.jsx';

const ACCEPT = ['.pdf', '.txt', '.md'];
const okType = (f) => ACCEPT.some((ext) => f.name.toLowerCase().endsWith(ext));

/** Wraps every word of the query found in text in <mark>. */
function Highlight({ text, query }) {
  const words = query.toLowerCase().split(/\W+/).filter((w) => w.length > 2);
  if (!words.length) return text;
  const re = new RegExp(`(${words.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'gi');
  return text.split(re).map((part, i) => (i % 2 ? <mark key={i}>{part}</mark> : <Fragment key={i}>{part}</Fragment>));
}

export default function KnowledgePanel() {
  const [docs, setDocs] = useState([]);
  const [query, setQuery] = useState('');
  const [hits, setHits] = useState(null);
  const [searched, setSearched] = useState('');
  const [progress, setProgress] = useState(null); // { done, total, name }
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState('');
  const [loaded, setLoaded] = useState(false);

  const load = () =>
    api.documents()
      .then(setDocs)
      .catch((e) => setError(e.message))
      .finally(() => setLoaded(true));
  useEffect(() => { load(); }, []);

  const upload = async (fileList) => {
    const files = [...fileList];
    const bad = files.filter((f) => !okType(f));
    const good = files.filter(okType);
    setError(bad.length ? `Skipped ${bad.map((f) => f.name).join(', ')}: only PDF, .txt and .md files are supported.` : '');
    if (!good.length) return;
    try {
      for (const [i, f] of good.entries()) {
        setProgress({ done: i, total: good.length, name: f.name });
        await api.uploadDocument(f);
      }
      toast(good.length === 1 ? `Indexed ${good[0].name}` : `Indexed ${good.length} documents`);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setProgress(null);
    }
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    if (!progress) upload(e.dataTransfer.files);
  };

  const search = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    setSearched(query.trim());
    setHits(await api.searchDocuments(query.trim()).catch((err) => { setError(err.message); return []; }));
  };
  const remove = (d) => api.deleteDocument(d.doc_id).then(() => { toast(`Removed ${d.source}`); load(); });

  return (
    <div className="panel">
      <PageHeader icon="book" hue={205} title="Knowledge base" subtitle="Upload your documents and Jarvis answers questions from them in chat.">
        <span className="stat-pill"><strong>{docs.length}</strong> {docs.length === 1 ? 'document' : 'documents'}</span>
      </PageHeader>

      <label
        className={`dropzone ${dragging ? 'over' : ''} ${progress ? 'busy' : ''}`}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
      >
        <input type="file" multiple accept={ACCEPT.join(',')} hidden disabled={Boolean(progress)} onChange={(e) => { upload(e.target.files); e.target.value = ''; }} />
        <span className="badge-icon lg" style={{ '--hue': 205 }}><Icon name="upload" /></span>
        {progress ? (
          <>
            <strong>Indexing {progress.name}…</strong>
            <span className="muted">{progress.done + 1} of {progress.total}</span>
            <div className="progress"><i style={{ width: `${((progress.done + 0.5) / progress.total) * 100}%` }} /></div>
          </>
        ) : (
          <>
            <strong>Drop files here or click to upload</strong>
            <span className="muted">PDF, .txt or .md · split into chunks and indexed for search</span>
          </>
        )}
      </label>
      {error && <div className="error">{error}</div>}

      {loaded && docs.length === 0 ? (
        <EmptyState icon="file" title="No documents yet">Upload a policy, notes or a manual, then ask Jarvis about it.</EmptyState>
      ) : (
        <ul className="card-grid">
          {docs.map((d) => (
            <li key={d.doc_id} className="doc-card">
              <span className="badge-icon" style={{ '--hue': d.source.toLowerCase().endsWith('.pdf') ? 0 : 205 }}><Icon name="file" /></span>
              <div className="grow item-body">
                <span className="item-title" title={d.source}>{d.source}</span>
                <small className="muted">{d.chunks} {d.chunks === 1 ? 'chunk' : 'chunks'} indexed</small>
              </div>
              <button className="icon-btn" title="Remove" aria-label={`Remove ${d.source}`} onClick={() => remove(d)}><Icon name="trash" size="1em" /></button>
            </li>
          ))}
        </ul>
      )}

      <h3 className="section-title"><Icon name="search" /> Ask your documents</h3>
      <form className="composer-card" onSubmit={search}>
        <Icon name="search" className="accent-icon" />
        <input className="grow" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="e.g. How many days of paid leave do I get?" aria-label="Search documents" />
        <button className="btn primary" disabled={!query.trim()}>Search</button>
      </form>
      {hits && hits.length === 0 && <p className="muted">No matches for “{searched}”.</p>}
      {hits?.map((h, i) => (
        <article key={i} className="card hit">
          <div className="hit-head">
            <Icon name="file" size="1em" />
            <strong>{h.source}</strong>
            <span className="score" title="Relevance">{Math.round(Math.max(0, Math.min(1, h.score)) * 100)}% match</span>
          </div>
          <p><Highlight text={h.text.length > 500 ? h.text.slice(0, 500) + '…' : h.text} query={searched} /></p>
        </article>
      ))}
    </div>
  );
}
