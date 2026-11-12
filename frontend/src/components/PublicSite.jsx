import { lazy, Suspense, useCallback, useEffect, useState } from 'react';
import { pageView, track } from '../analytics.js';
import { Icon } from '../icons.jsx';
import { GITHUB_USER, PORTFOLIO_URL } from '../siteLinks.js';
import { Toaster } from '../ui.jsx';
import Landing from './Landing.jsx';
import Login from './Login.jsx';
import SiteFooter from './SiteFooter.jsx';
import ThemeMenu from './ThemeMenu.jsx';

// Everything a visitor sees before signing in: the website (Home), Sign in / Sign up, and the
// Demo, which shows the app with sample data and needs no account.
// The page lives in the address (?page=demo&section=chat), so Back/Forward and shared links work.
// "/" is the website (home); the demo (?page=demo) lets anyone try every feature without signing in.

const Demo = lazy(() => import('./Demo.jsx'));
const PAGES = ['home', 'login', 'signup', 'demo'];
const FRONT = 'home'; // the page at "/" (no ?page=)
const META = {
  home: ['Azarvis – AI Voice Assistant by Aamir Hussain Azad', 'Azarvis is a personal AI voice assistant by Aamir Hussain Azad, powered by Claude: talk naturally and it handles reminders, tasks, study notes, documents and your computer, hands-free. See every feature and how it works.'],
  demo: ['Live demo · Azarvis AI Voice Assistant by Aamir Hussain Azad', 'Azarvis by Aamir Hussain Azad is a personal AI voice assistant powered by Claude. Try every feature free, no login: chat by voice, reminders, study notes, ML Lab, documents, vision and memory.'],
  signup: ['Create your free account · Azarvis', 'Create a free Azarvis account in a minute and talk to your personal AI voice assistant on your laptop or phone.'],
  login: ['Sign in · Azarvis', 'Sign in to Azarvis with your password or a passkey (Face ID, Touch ID, Windows Hello or fingerprint).'],
};

const readUrl = () => {
  const q = new URLSearchParams(window.location.search);
  const page = q.get('page');
  return { page: PAGES.includes(page) ? page : FRONT, section: q.get('section') || '' };
};
const urlFor = (page, section) => {
  const q = new URLSearchParams(window.location.search);
  q.delete('page');
  q.delete('section');
  if (page !== FRONT) q.set('page', page);
  if (section && page === 'demo') q.set('section', section);
  const s = q.toString();
  return `${window.location.pathname}${s ? `?${s}` : ''}`;
};

// Landing-page sections linked from the top bar.
const NAV = [
  ['features', 'Features', 'sparkles', 190],
  ['workflows', 'Automations', 'workflow', 300],
  ['how', 'How it works', 'timeline', 38],
  ['projects', 'Projects', 'rocket', 265],
  ['faq', 'FAQ', 'help', 160],
  ['feedback', 'Feedback', 'chat', 330],
];

function PublicNav({ page, theme, onNavigate, onSection }) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  useEffect(() => {
    if (!open) return;
    const esc = (e) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('keydown', esc);
    return () => document.removeEventListener('keydown', esc);
  }, [open]);

  const act = (fn) => () => {
    setOpen(false);
    fn();
  };

  return (
    <header className={`pub-nav ${scrolled ? 'pub-nav--scrolled' : ''} ${open ? 'pub-nav--open' : ''}`}>
      <div className="pub-nav-inner">
        <a
          href="/"
          className="pub-logo"
          onClick={(e) => {
            e.preventDefault();
            setOpen(false);
            onNavigate(FRONT);
          }}
          aria-label="Azarvis home"
        >
          <img src="/icon.svg" alt="" width="34" height="34" />
          <span>
            Azarvis<small>AI Assistant</small>
          </span>
        </a>

        <nav className="pub-links" aria-label="Website">
          {NAV.map(([id, label, icon, hue]) => (
            <button key={id} type="button" style={{ '--hue': hue }} onClick={act(() => onSection(id))}>
              <Icon name={icon} size="1em" className="pub-link-icon" />
              {label}
            </button>
          ))}
        </nav>

        <div className="pub-actions">
          <a className="pub-author" href={PORTFOLIO_URL} target="_blank" rel="noopener noreferrer" title="Aamir Hussain Azad: portfolio">
            <img src={`https://github.com/${GITHUB_USER}.png?size=64`} alt="" width="28" height="28" />
            <span>by Aamir</span>
          </a>
          <ThemeMenu theme={theme} />
          <button type="button" className={`pub-demo-link ${page === 'demo' ? 'active' : ''}`} onClick={act(() => onNavigate('demo'))}>
            <Icon name="sparkles" size="1em" /> Try demo
          </button>
          <button type="button" className="btn ghost pub-signin" onClick={act(() => onNavigate('login'))}>
            Sign in
          </button>
          <button type="button" className="btn primary pub-cta" onClick={act(() => onNavigate('signup'))}>
            Get started
          </button>
          {/* Phones: the demo (no login) is always one tap away. */}
          <button type="button" className="pub-try" onClick={act(() => onNavigate('demo'))}>
            <Icon name="play" size="0.9em" /> Try free
          </button>
          <button
            type="button"
            className="icon-btn pub-burger"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            aria-controls="pub-drawer"
            aria-label={open ? 'Close menu' : 'Open menu'}
          >
            <Icon name={open ? 'x' : 'menu'} size="1.3em" />
          </button>
        </div>
      </div>

      {open && (
        <div className="pub-drawer" id="pub-drawer">
          {NAV.map(([id, label, icon, hue]) => (
            <button key={id} type="button" style={{ '--hue': hue }} onClick={act(() => onSection(id))}>
              <span className="pub-drawer-label"><Icon name={icon} size="1.05em" className="pub-link-icon" /> {label}</span>
              <Icon name="chevron" size="1em" />
            </button>
          ))}
          <div className="pub-drawer-cta">
            <button type="button" className="btn" onClick={act(() => onNavigate('demo'))}>
              <Icon name="sparkles" size="1em" /> Try the demo (no login)
            </button>
            <button type="button" className="btn" onClick={act(() => onNavigate('login'))}>
              Sign in
            </button>
            <button type="button" className="btn primary" onClick={act(() => onNavigate('signup'))}>
              Create free account
            </button>
          </div>
        </div>
      )}
    </header>
  );
}

export default function PublicSite({ theme, onAuth }) {
  const [{ page, section }, setRoute] = useState(readUrl);

  useEffect(() => {
    const onPop = () => setRoute(readUrl());
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  // Search engines and link previews: each page has its own title, description and canonical
  // address; Google Analytics gets a page view per page (the site is one HTML file).
  useEffect(() => {
    const [title, description] = META[page];
    document.title = title;
    document.querySelector('meta[name="description"]')?.setAttribute('content', description);
    const canonical = document.querySelector('link[rel="canonical"]');
    if (canonical) canonical.href = new URL(urlFor(page), canonical.href).href;
    pageView(title);
    if (page === 'demo') track('demo_open', { section: section || 'home' });
    if (page === 'signup') track('sign_up_start');
  }, [page]);

  // scrollTo: an element id on the new page (e.g. "projects" on Home) to scroll to after it renders.
  const navigate = useCallback((next, nextSection = '', scrollTo = '') => {
    window.history.pushState(null, '', urlFor(next, nextSection));
    setRoute({ page: next, section: nextSection });
    window.scrollTo({ top: 0 });
    if (scrollTo) setTimeout(() => document.getElementById(scrollTo)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60);
  }, []);

  // Demo tabs change the address without adding a Back step for every click.
  const setDemoSection = useCallback((s) => {
    window.history.replaceState(null, '', urlFor('demo', s));
    setRoute({ page: 'demo', section: s });
  }, []);

  const scrollToSection = useCallback(
    (id) => {
      const go = () => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      if (page === 'home') return go();
      navigate('home');
      requestAnimationFrame(() => requestAnimationFrame(go));
    },
    [page, navigate],
  );

  const signedIn = (user) => {
    window.history.replaceState(null, '', urlFor(FRONT));
    onAuth(user);
  };

  return (
    <div className={`pub pub--${page}`}>
      <div className="pub-bg" aria-hidden="true" />
      <PublicNav page={page} theme={theme} onNavigate={navigate} onSection={scrollToSection} />

      <main className="pub-main" id="top">
        {page === 'home' && <Landing onNavigate={navigate} onSection={scrollToSection} theme={theme} />}
        {(page === 'login' || page === 'signup') && (
          <Login key={page} initialStep={page === 'signup' ? 'register' : 'login'} onAuth={signedIn} onDemo={() => navigate('demo')} onHome={() => navigate('home')} />
        )}
        {page === 'demo' && (
          <Suspense fallback={<div className="tab-loading"><div className="orb pulse" /></div>}>
            <Demo section={section} onSection={setDemoSection} onNavigate={navigate} theme={theme} />
          </Suspense>
        )}
      </main>

      {page !== 'demo' && (
        <SiteFooter
          cta
          onOpenTab={(tab) => navigate('demo', tab)}
          onDemo={() => navigate('demo')}
          onSignup={() => navigate('signup')}
          onFeedback={() => scrollToSection('feedback')}
        />
      )}
      <Toaster />
    </div>
  );
}
