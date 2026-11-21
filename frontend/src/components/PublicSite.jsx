import { lazy, Suspense, useCallback, useEffect, useState } from 'react';
import { pageView, track } from '../analytics.js';
import { Icon } from '../icons.jsx';
import { Brand, Toaster } from '../ui.jsx';
import Landing from './Landing.jsx';
import Login from './Login.jsx';
import SiteFooter from './SiteFooter.jsx';
import ThemeMenu from './ThemeMenu.jsx';

// Everything a visitor sees before signing in: the website (Home), Sign in / Sign up, and the
// Demo, which shows the app with sample data and needs no account.
// The page lives in the address (?page=demo&section=chat), so Back/Forward and shared links work.
// "/" is the website (home); the demo (?page=demo) lets anyone try every feature without signing in.

const Demo = lazy(() => import('./Demo.jsx'));
const AgentStudio = lazy(() => import('./AgentStudio.jsx'));
const RobotLab = lazy(() => import('../robotLab/RobotLab.jsx'));
const PAGES = ['home', 'login', 'signup', 'demo', 'studio', 'lab'];
const FRONT = 'home'; // the page at "/" (no ?page=)
const META = {
  home: ['Azarvis – AI Voice Assistant by Aamir Hussain Azad', 'Azarvis is a personal AI voice assistant by Aamir Hussain Azad, powered by Claude: talk naturally and it handles reminders, tasks, study notes, documents and your computer, hands-free. See every feature and how it works.'],
  demo: ['Live demo · Azarvis AI Voice Assistant by Aamir Hussain Azad', 'Azarvis by Aamir Hussain Azad is a personal AI voice assistant powered by Claude. Try every feature free, no login: chat by voice, reminders, study notes, ML Lab, documents, vision and memory.'],
  lab: ['3D Robot Lab · Azarvis AI by Aamir Hussain Azad', 'A humanoid AI robot in a 3D lab that codes, reads, teaches, speaks, researches and thinks. Move it, switch its mode, or talk to it. Runs in your browser.'],
  studio: ['Agent Studio · Azarvis AI by Aamir Hussain Azad', 'Talk to Azarvis for three minutes or type your idea: a manager and eight AI specialists write a week of content and design 9 images, or diagnose a problem and plan the fix. Free, no login.'],
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
// The website's sections (on Home) and pages, in reading order. Plain text links, Google-style:
// the one filled button is "Get started".
const NAV = [
  ['features', 'Features'],
  ['how', 'How it works'],
  ['workflows', 'Automations'],
  ['studio', 'Agent Studio', 'page'],
  ['projects', 'Projects'],
  ['faq', 'FAQ'],
];

/** The Home section on screen right now (for the underline in the navbar). */
function useActiveSection(enabled) {
  const [active, setActive] = useState('');
  useEffect(() => {
    if (!enabled || typeof IntersectionObserver === 'undefined') return undefined;
    const ids = NAV.filter(([, , kind]) => kind !== 'page').map(([id]) => id);
    const seen = new Map();
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => seen.set(e.target.id, e.isIntersecting ? e.intersectionRatio : 0));
        const best = ids.map((id) => [id, seen.get(id) || 0]).sort((a, b) => b[1] - a[1])[0];
        setActive(best && best[1] > 0 ? best[0] : '');
      },
      { rootMargin: '-64px 0px -45% 0px', threshold: [0, 0.15, 0.4] },
    );
    const observe = () => ids.forEach((id) => { const el = document.getElementById(id); if (el) io.observe(el); });
    observe();
    const late = setTimeout(observe, 800); // sections below the fold mount a moment later
    return () => { clearTimeout(late); io.disconnect(); };
  }, [enabled]);
  return active;
}

function PublicNav({ page, theme, onNavigate, onSection }) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const activeSection = useActiveSection(page === 'home');
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  useEffect(() => {
    if (!open) return undefined;
    const esc = (e) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('keydown', esc);
    return () => document.removeEventListener('keydown', esc);
  }, [open]);

  const act = (fn) => () => {
    setOpen(false);
    fn();
  };
  const go = ([id, , kind]) => act(() => (kind === 'page' ? onNavigate(id) : onSection(id)));
  const isActive = ([id, , kind]) => (kind === 'page' ? page === id : page === 'home' && activeSection === id);

  return (
    <header className={`snav ${scrolled ? 'snav--scrolled' : ''} ${open ? 'snav--open' : ''}`}>
      <div className="snav-inner">
        <a
          href="/"
          className="snav-brand"
          onClick={(e) => {
            e.preventDefault();
            setOpen(false);
            onNavigate(FRONT);
          }}
          aria-label="Azarvis home"
        >
          <Brand size={38} tag />
        </a>

        <nav className="snav-links" aria-label="Website">
          {NAV.map((item) => (
            <button key={item[0]} type="button" className={isActive(item) ? 'is-active' : ''} aria-current={isActive(item) ? 'true' : undefined} onClick={go(item)}>
              {item[1]}
              {item[0] === 'studio' && <span className="snav-new">New</span>}
            </button>
          ))}
        </nav>

        <div className="snav-actions">
          <ThemeMenu theme={theme} />
          <button type="button" className="snav-btn snav-btn--text snav-hide-sm" onClick={act(() => onNavigate('login'))}>
            Sign in
          </button>
          <button type="button" className={`snav-btn snav-btn--outlined ${page === 'demo' ? 'is-active' : ''}`} onClick={act(() => onNavigate('demo'))}>
            <Icon name="play" size="0.95em" /> Try demo
          </button>
          <button type="button" className="snav-btn snav-btn--filled snav-hide-sm" onClick={act(() => onNavigate('signup'))}>
            Get started <Icon name="chevron" size="0.95em" />
          </button>
          <button
            type="button"
            className="snav-burger"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            aria-controls="snav-drawer"
            aria-label={open ? 'Close menu' : 'Open menu'}
          >
            <Icon name={open ? 'x' : 'menu'} size="1.3em" />
          </button>
        </div>
      </div>

      {open && (
        <div className="snav-drawer" id="snav-drawer">
          {NAV.map((item) => (
            <button key={item[0]} type="button" className={isActive(item) ? 'is-active' : ''} onClick={go(item)}>
              <span>{item[1]}{item[0] === 'studio' && <span className="snav-new">New</span>}</span>
              <Icon name="chevron" size="1em" />
            </button>
          ))}
          <button type="button" onClick={act(() => onSection('feedback'))}>
            <span>Feedback</span>
            <Icon name="chevron" size="1em" />
          </button>
          <div className="snav-drawer-cta">
            <button type="button" className="snav-btn snav-btn--outlined" onClick={act(() => onNavigate('login'))}>Sign in</button>
            <button type="button" className="snav-btn snav-btn--filled" onClick={act(() => onNavigate('signup'))}>Create free account</button>
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
    // Sign-in and sign-up pages have nothing to rank for: keep them out of search results.
    document.querySelector('meta[name="robots"]')?.setAttribute('content', page === 'login' || page === 'signup' ? 'noindex, follow' : 'index, follow, max-image-preview:large');
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
        {page === 'studio' && (
          <Suspense fallback={<div className="tab-loading"><div className="orb pulse" /></div>}>
            <div className="pub-wrap studio-page">
              <header className="studio-head">
                <span className="studio-logo"><Icon name="workflow" size="1.3em" /></span>
                <div>
                  <h1>Agent Studio <span className="grad-text">· Azarvis + team</span></h1>
                  <p>Talk for three minutes, or type your idea. Get a week of content and 9 designed images, or a full fix plan for any problem. No login.</p>
                </div>
              </header>
              <AgentStudio />
            </div>
          </Suspense>
        )}
        {page === 'lab' && (
          <Suspense fallback={<div className="tab-loading"><div className="orb pulse" /></div>}>
            <RobotLab />
          </Suspense>
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
          onStudio={() => navigate('studio')}
          onSignup={() => navigate('signup')}
          onFeedback={() => scrollToSection('feedback')}
        />
      )}
      <Toaster />
    </div>
  );
}
