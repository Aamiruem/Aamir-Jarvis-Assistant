import { lazy, Suspense, useCallback, useEffect, useState } from 'react';
import { Icon } from '../icons.jsx';
import { Toaster } from '../ui.jsx';
import Landing from './Landing.jsx';
import Login from './Login.jsx';
import SiteFooter from './SiteFooter.jsx';
import ThemeMenu from './ThemeMenu.jsx';
import '../public.css';

// Everything a visitor sees before signing in: the website (Home), Sign in / Sign up, and the
// Demo, which shows the app with sample data and needs no account.
// The page lives in the address (?page=demo&section=chat), so Back/Forward and shared links work.

const Demo = lazy(() => import('./Demo.jsx'));
const PAGES = ['home', 'login', 'signup', 'demo'];

const readUrl = () => {
  const q = new URLSearchParams(window.location.search);
  const page = q.get('page');
  return { page: PAGES.includes(page) ? page : 'home', section: q.get('section') || '' };
};
const urlFor = (page, section) => {
  const q = new URLSearchParams(window.location.search);
  q.delete('page');
  q.delete('section');
  if (page !== 'home') q.set('page', page);
  if (section && page === 'demo') q.set('section', section);
  const s = q.toString();
  return `${window.location.pathname}${s ? `?${s}` : ''}`;
};

// Landing-page sections linked from the top bar.
const NAV = [
  ['features', 'Features'],
  ['how', 'How it works'],
  ['demo-preview', 'Demo'],
  ['faq', 'FAQ'],
  ['feedback', 'Feedback'],
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
            onNavigate('home');
          }}
          aria-label="Azarvis home"
        >
          <img src="/icon.svg" alt="" width="34" height="34" />
          <span>
            Azarvis<small>AI Assistant</small>
          </span>
        </a>

        <nav className="pub-links" aria-label="Website">
          {NAV.map(([id, label]) => (
            <button key={id} type="button" onClick={act(() => onSection(id))}>
              {label}
            </button>
          ))}
        </nav>

        <div className="pub-actions">
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
          {NAV.map(([id, label]) => (
            <button key={id} type="button" onClick={act(() => onSection(id))}>
              {label}
              <Icon name="chevron" size="1em" />
            </button>
          ))}
          <div className="pub-drawer-cta">
            <button type="button" className="btn" onClick={act(() => onNavigate('demo'))}>
              <Icon name="sparkles" size="1em" /> Try the demo
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

  useEffect(() => {
    const titles = { home: 'Azarvis – AI Voice Assistant by Aamir Hussain Azad', login: 'Sign in · Azarvis', signup: 'Create account · Azarvis', demo: 'Live demo · Azarvis' };
    document.title = titles[page];
  }, [page]);

  const navigate = useCallback((next, nextSection = '') => {
    window.history.pushState(null, '', urlFor(next, nextSection));
    setRoute({ page: next, section: nextSection });
    window.scrollTo({ top: 0 });
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
    window.history.replaceState(null, '', urlFor('home'));
    onAuth(user);
  };

  return (
    <div className={`pub pub--${page}`}>
      <div className="pub-bg" aria-hidden="true" />
      <PublicNav page={page} theme={theme} onNavigate={navigate} onSection={scrollToSection} />

      <main className="pub-main" id="top">
        {page === 'home' && <Landing onNavigate={navigate} />}
        {(page === 'login' || page === 'signup') && (
          <Login key={page} initialStep={page === 'signup' ? 'register' : 'login'} onAuth={signedIn} onDemo={() => navigate('demo')} onHome={() => navigate('home')} />
        )}
        {page === 'demo' && (
          <Suspense fallback={<div className="tab-loading"><div className="orb pulse" /></div>}>
            <Demo section={section} onSection={setDemoSection} onNavigate={navigate} />
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
