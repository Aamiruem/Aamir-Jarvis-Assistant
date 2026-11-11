import { useEffect, useMemo, useRef, useState } from 'react';
import { track } from '../analytics.js';
import { Icon } from '../icons.jsx';
import { GITHUB_USER, LIVE_APPS, PROJECTS } from '../siteLinks.js';

// Aamir's projects, loaded live: the GitHub profile and public repositories (GitHub's public API,
// no key needed), plus the live apps on Vercel, Streamlit and Render. A repository whose GitHub
// "homepage" is a live site joins the live apps automatically. Loaded only when the section is
// about to scroll into view, cached for an hour, with the static list as a fallback.

const CACHE_KEY = `azarvis-gh-${GITHUB_USER}`;
const CACHE_MS = 60 * 60_000;

export const PLATFORMS = {
  vercel: { label: 'Vercel', color: '#e5e7eb', dark: '#000000' },
  streamlit: { label: 'Streamlit', color: '#ff4b4b' },
  render: { label: 'Render', color: '#46e3b7' },
  netlify: { label: 'Netlify', color: '#32e6e2' },
  pages: { label: 'GitHub Pages', color: '#a78bfa' },
  web: { label: 'Website', color: '#60a5fa' },
};

const LANG_COLORS = {
  JavaScript: '#f1e05a', TypeScript: '#3178c6', Python: '#3572a5', Java: '#b07219', HTML: '#e34c26', CSS: '#663399',
  'Jupyter Notebook': '#da5b0b', Astro: '#ff5a03', Shell: '#89e051', 'C++': '#f34b7d', C: '#555555',
};

export function platformOf(url = '') {
  const host = (() => {
    try {
      return new URL(url).hostname;
    } catch {
      return '';
    }
  })();
  if (host.endsWith('vercel.app')) return 'vercel';
  if (host.endsWith('streamlit.app')) return 'streamlit';
  if (host.endsWith('onrender.com')) return 'render';
  if (host.endsWith('netlify.app')) return 'netlify';
  if (host.endsWith('github.io')) return 'pages';
  return 'web';
}

const pretty = (name) => name.replace(/[-_]+/g, ' ').replace(/\s+/g, ' ').trim();
const ago = (iso) => {
  const days = Math.floor((Date.now() - new Date(iso)) / 86_400_000);
  if (days < 1) return 'today';
  if (days < 30) return `${days} day${days === 1 ? '' : 's'} ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} month${months === 1 ? '' : 's'} ago`;
  const years = Math.floor(months / 12);
  return `${years} year${years === 1 ? '' : 's'} ago`;
};

async function loadGitHub() {
  try {
    const cached = JSON.parse(sessionStorage.getItem(CACHE_KEY));
    if (cached && Date.now() - cached.at < CACHE_MS) return cached.data;
  } catch {}
  const get = async (path) => {
    const r = await fetch(`https://api.github.com${path}`, { headers: { Accept: 'application/vnd.github+json' } });
    if (!r.ok) throw new Error(r.status === 403 ? 'GitHub rate limit reached, try again in a while' : `GitHub answered ${r.status}`);
    return r.json();
  };
  const profile = await get(`/users/${GITHUB_USER}`);
  const pages = Math.min(Math.ceil((profile.public_repos || 1) / 100), 3);
  const repoPages = await Promise.all(Array.from({ length: pages }, (_, i) => get(`/users/${GITHUB_USER}/repos?per_page=100&sort=updated&page=${i + 1}`)));
  const repos = repoPages
    .flat()
    .filter((r) => !r.fork && !r.archived)
    .map((r) => ({
      name: r.name,
      title: pretty(r.name),
      description: r.description || '',
      url: r.html_url,
      homepage: r.homepage && /^https?:\/\//.test(r.homepage) ? r.homepage : '',
      language: r.language || '',
      stars: r.stargazers_count,
      forks: r.forks_count,
      updated: r.pushed_at || r.updated_at,
    }));
  const data = {
    profile: { name: profile.name || GITHUB_USER, avatar: profile.avatar_url, bio: (profile.bio || '').split(/\r?\n/)[0], repos: profile.public_repos, followers: profile.followers, url: profile.html_url },
    repos,
  };
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify({ at: Date.now(), data }));
  } catch {}
  return data;
}

/** Is the live site answering? A cross-site "no-cors" request only says reachable or not. */
function useOnline(url, enabled) {
  const [state, setState] = useState('checking');
  useEffect(() => {
    if (!enabled) return;
    const ctrl = new AbortController();
    const slow = setTimeout(() => setState('waking'), 6000); // Render / Streamlit apps sleep when unused
    const stop = setTimeout(() => ctrl.abort(), 15000);
    fetch(url, { mode: 'no-cors', signal: ctrl.signal, cache: 'no-store' })
      .then(() => setState('online'))
      .catch(() => setState((s) => (s === 'waking' ? 'waking' : 'offline')))
      .finally(() => {
        clearTimeout(slow);
        clearTimeout(stop);
      });
    return () => ctrl.abort();
  }, [url, enabled]);
  return state;
}

const STATUS = { checking: 'Checking…', online: 'Online', waking: 'Waking up', offline: 'Unreachable' };

function LiveCard({ app, visible }) {
  const status = useOnline(app.href, visible);
  const p = PLATFORMS[app.platform] ?? PLATFORMS.web;
  return (
    <li className="proj-live" style={{ '--pc': p.color }}>
      <div className="proj-live-top">
        <span className={`proj-platform proj-platform--${app.platform}`}>
          <PlatformMark platform={app.platform} /> {p.label}
        </span>
        <span className={`proj-status proj-status--${status}`} title="Checked from your browser just now">
          <i /> {STATUS[status]}
        </span>
      </div>
      <h3>{app.label}</h3>
      <p>{app.text}</p>
      <div className="proj-actions">
        <a className="btn primary sm" href={app.href} target="_blank" rel="noopener noreferrer" onClick={() => track('project_open', { project: app.label, kind: 'live' })}>
          Open live <Icon name="external" size="0.9em" />
        </a>
        {app.repo && (
          <a className="btn sm" href={`https://github.com/${GITHUB_USER}/${app.repo}`} target="_blank" rel="noopener noreferrer" onClick={() => track('project_open', { project: app.label, kind: 'code' })}>
            <Icon name="github" size="0.95em" /> Code
          </a>
        )}
      </div>
    </li>
  );
}

/** Small brand marks drawn in CSS/SVG (no logos downloaded). */
function PlatformMark({ platform }) {
  if (platform === 'vercel') return <svg width="11" height="11" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3 23 21H1z" fill="currentColor" /></svg>;
  if (platform === 'streamlit') return <svg width="12" height="12" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4 2 18h20z M12 4l4 14M12 4 8 18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round" /></svg>;
  if (platform === 'render') return <svg width="12" height="12" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="2.6" /><circle cx="12" cy="12" r="3.4" fill="currentColor" /></svg>;
  return <Icon name="globe" size="0.95em" />;
}

function RepoCard({ repo }) {
  return (
    <li className="proj-repo">
      <a className="proj-repo-main" href={repo.url} target="_blank" rel="noopener noreferrer" onClick={() => track('project_open', { project: repo.name, kind: 'repo' })}>
        <span className="proj-repo-name"><Icon name="github" size="1em" /> {repo.title}</span>
        <span className="proj-repo-desc">{repo.description || 'No description yet.'}</span>
      </a>
      <div className="proj-repo-meta">
        {repo.language && (
          <span><i className="proj-lang" style={{ background: LANG_COLORS[repo.language] ?? '#8b949e' }} /> {repo.language}</span>
        )}
        {repo.stars > 0 && <span><Icon name="star" size="0.9em" /> {repo.stars}</span>}
        <span><Icon name="clock" size="0.9em" /> {ago(repo.updated)}</span>
        {repo.homepage && (
          <a className={`proj-repo-live proj-platform--${platformOf(repo.homepage)}`} href={repo.homepage} target="_blank" rel="noopener noreferrer">
            <PlatformMark platform={platformOf(repo.homepage)} /> Live
          </a>
        )}
      </div>
    </li>
  );
}

const FILTERS = [
  ['all', 'All'],
  ['live', 'Live apps'],
  ['vercel', 'Vercel'],
  ['streamlit', 'Streamlit'],
  ['render', 'Render'],
  ['code', 'GitHub code'],
];

export default function Projects() {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState('updated');
  const [shown, setShown] = useState(9);

  // Load only when the visitor gets close to this section.
  useEffect(() => {
    const el = ref.current;
    if (!el || !('IntersectionObserver' in window)) return setVisible(true);
    const io = new IntersectionObserver(([e]) => e.isIntersecting && (setVisible(true), io.disconnect()), { rootMargin: '400px' });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  useEffect(() => {
    if (visible) loadGitHub().then(setData).catch((e) => setError(e.message));
  }, [visible]);

  // Live apps: the curated list plus repositories with a live homepage that isn't listed yet.
  const liveApps = useMemo(() => {
    const known = new Set(LIVE_APPS.map((a) => new URL(a.href).hostname));
    const fromRepos = (data?.repos ?? [])
      .filter((r) => r.homepage && !known.has(new URL(r.homepage).hostname))
      .map((r) => ({ label: r.title, href: r.homepage, platform: platformOf(r.homepage), text: r.description || 'Live project from GitHub.', repo: r.name }));
    return [...LIVE_APPS, ...fromRepos];
  }, [data]);

  const q = query.trim().toLowerCase();
  const match = (...fields) => !q || fields.some((f) => (f || '').toLowerCase().includes(q));
  const lives = liveApps.filter((a) => (filter === 'all' || filter === 'live' || filter === a.platform) && match(a.label, a.text, a.platform));
  const repos = (data?.repos ?? [])
    .filter((r) => (filter === 'all' || filter === 'code') && match(r.title, r.description, r.language))
    .sort((a, b) => (sort === 'stars' ? b.stars - a.stars || new Date(b.updated) - new Date(a.updated) : new Date(b.updated) - new Date(a.updated)));
  const languages = new Set((data?.repos ?? []).map((r) => r.language).filter(Boolean)).size;

  return (
    <div className="projects" ref={ref}>
      <div className="proj-head">
        <div className="proj-profile">
          {data?.profile.avatar ? <img src={data.profile.avatar} alt="" width="56" height="56" loading="lazy" /> : <span className="proj-avatar-ph"><Icon name="github" size="1.6em" /></span>}
          <div>
            <strong>{data?.profile.name ?? 'Aamir Hussain Azad'}</strong>
            <span className="muted">{data?.profile.bio || 'AI/ML Engineer · Full-Stack Developer'}</span>
            <a href={`https://github.com/${GITHUB_USER}`} target="_blank" rel="noopener noreferrer">github.com/{GITHUB_USER} <Icon name="external" size="0.85em" /></a>
          </div>
        </div>
        <ul className="proj-stats" aria-label="GitHub in numbers">
          <li><strong>{data ? data.profile.repos : '…'}</strong><span>Repositories</span></li>
          <li><strong>{liveApps.length}</strong><span>Live apps</span></li>
          <li><strong>{data ? languages : '…'}</strong><span>Languages</span></li>
        </ul>
      </div>

      <div className="proj-tools">
        <div className="proj-filters" role="tablist" aria-label="Filter projects">
          {FILTERS.map(([id, label]) => (
            <button key={id} type="button" role="tab" aria-selected={filter === id} className={`proj-filter proj-filter--${id} ${filter === id ? 'on' : ''}`} onClick={() => { setFilter(id); setShown(9); }}>
              {PLATFORMS[id] && <PlatformMark platform={id} />} {label}
            </button>
          ))}
        </div>
        <div className="proj-search">
          <Icon name="search" size="1em" />
          <input value={query} onChange={(e) => { setQuery(e.target.value); setShown(9); }} placeholder="Search projects…" aria-label="Search projects" />
        </div>
      </div>

      {lives.length > 0 && filter !== 'code' && (
        <>
          <h3 className="proj-sub"><span className="proj-dot proj-dot--live" /> Live apps <span className="muted">· {lives.length}</span></h3>
          <ul className="proj-live-grid">{lives.map((a) => <LiveCard key={a.href} app={a} visible={visible} />)}</ul>
        </>
      )}

      {(filter === 'all' || filter === 'code') && (
        <>
          <div className="proj-sub-row">
            <h3 className="proj-sub"><Icon name="github" size="1em" /> From GitHub {data && <span className="muted">· {repos.length}</span>}</h3>
            <label className="proj-sort">
              Sort
              <select value={sort} onChange={(e) => setSort(e.target.value)}>
                <option value="updated">Recently updated</option>
                <option value="stars">Most stars</option>
              </select>
            </label>
          </div>
          {!data && !error && <ul className="proj-repo-grid">{Array.from({ length: 6 }, (_, i) => <li key={i} className="proj-repo proj-skeleton" />)}</ul>}
          {error && (
            <>
              <p className="muted small">Couldn't load GitHub right now ({error}). Here are the highlights:</p>
              <ul className="proj-repo-grid">
                {PROJECTS.filter((p) => p.href.includes('github.com')).map((p) => (
                  <RepoCard key={p.label} repo={{ name: p.label, title: p.label, description: '', url: p.href, homepage: '', language: '', stars: 0, updated: new Date().toISOString() }} />
                ))}
              </ul>
            </>
          )}
          {data && (
            <>
              <ul className="proj-repo-grid">{repos.slice(0, shown).map((r) => <RepoCard key={r.name} repo={r} />)}</ul>
              {repos.length === 0 && <p className="muted">No repositories match “{query}”.</p>}
              {repos.length > shown && (
                <div className="proj-more">
                  <button type="button" className="btn" onClick={() => setShown((n) => n + 12)}>
                    Show more <span className="muted">({repos.length - shown} left)</span>
                  </button>
                  <a className="btn ghost" href={`https://github.com/${GITHUB_USER}?tab=repositories`} target="_blank" rel="noopener noreferrer">All on GitHub <Icon name="external" size="0.9em" /></a>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
