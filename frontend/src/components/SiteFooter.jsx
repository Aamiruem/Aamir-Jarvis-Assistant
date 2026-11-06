import { Icon } from '../icons.jsx';
import { AZARVIS_LINKS, CONTACT_EMAIL, DASHBOARD_URL, PORTFOLIO_URL, PROJECTS, SOCIAL } from '../siteLinks.js';

// Site footer. Full on the sign-in screen and the Home tab: a call to action, the Azarvis sites,
// Aamir's other projects and where to find him. Compact (one line) under the other tabs.

const outside = (href) => (href.startsWith('mailto:') ? {} : { target: '_blank', rel: 'noopener noreferrer' });
const projectIcon = (p) => (p.live ? 'globe' : p.href.includes('github.com') ? 'github' : 'briefcase');

/** Scrolls whatever is scrolling: the tab content inside the app, the page on the sign-in screen. */
function backToTop(e) {
  const box = e.currentTarget.closest('.content');
  (box ?? document.scrollingElement)?.scrollTo({ top: 0, behavior: 'smooth' });
}

function Column({ title, icon, tone, wide = false, children }) {
  return (
    <nav aria-label={title} className={`site-foot-col${wide ? ' site-foot-col--wide' : ''}`} style={{ '--tone': tone }}>
      <h2>
        <span className="site-foot-col-icon"><Icon name={icon} size="0.95em" /></span>
        {title}
      </h2>
      <ul>{children}</ul>
    </nav>
  );
}

function Item({ href, icon, label, live = false }) {
  return (
    <li>
      <a href={href} {...outside(href)}>
        <Icon name={icon} size="0.95em" className="site-foot-link-icon" />
        <span>{label}</span>
        {live && <span className="site-foot-live">Live</span>}
      </a>
    </li>
  );
}

export default function SiteFooter({ compact = false }) {
  if (compact) {
    return (
      <footer className="site-foot site-foot--compact">
        <span>© 2026 Azarvis · Created by <a href={PORTFOLIO_URL} {...outside(PORTFOLIO_URL)}>Aamir Hussain Azad</a></span>
        <nav aria-label="Footer">
          {SOCIAL.slice(0, 3).map((s) => (
            <a key={s.label} href={s.href} {...outside(s.href)}>
              <Icon name={s.icon} size="1em" /> {s.label === 'Portfolio' ? 'Projects' : s.label}
            </a>
          ))}
        </nav>
      </footer>
    );
  }

  return (
    <footer className="site-foot">
      <div className="site-foot-cta">
        <div>
          <h2>Get more done with Azarvis</h2>
          <p>Your voice assistant, study notes, tasks and reminders, all in one place.</p>
        </div>
        <div className="site-foot-cta-actions">
          <a className="site-foot-btn site-foot-btn--primary" href={`${DASHBOARD_URL}dashboard`} {...outside(DASHBOARD_URL)}>
            <Icon name="chart" size="1em" /> Open dashboard
          </a>
          <a className="site-foot-btn" href={PORTFOLIO_URL} {...outside(PORTFOLIO_URL)}>
            <Icon name="briefcase" size="1em" /> View portfolio
          </a>
        </div>
      </div>

      <div className="site-foot-main">
        <div className="site-foot-brand">
          <a href="/" className="site-foot-logo" aria-label="Azarvis home">
            <img src="/icon.svg" alt="" width="36" height="36" />
            <span>AZARVIS</span>
          </a>
          <p>Your personal AI voice assistant for tasks, reminders, study notes, documents and your computer.</p>
          <p>
            Created by <a href={PORTFOLIO_URL} {...outside(PORTFOLIO_URL)}>Aamir Hussain Azad</a>, AI/ML Engineer &amp; Full-Stack Developer.
          </p>
          <a className="site-foot-email" href={`mailto:${CONTACT_EMAIL}`}>
            <Icon name="mail" size="1em" /> {CONTACT_EMAIL}
          </a>
          <ul className="site-foot-social" aria-label="Find Aamir online">
            {SOCIAL.map((s) => (
              <li key={s.label}>
                <a href={s.href} aria-label={s.label} title={s.label} style={{ '--brand': s.brand }} {...outside(s.href)}>
                  <Icon name={s.icon} size="1.05em" />
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div className="site-foot-links">
          <Column title="Azarvis" icon="sparkles" tone="var(--accent)">
            {AZARVIS_LINKS.map((l) => <Item key={l.label} {...l} />)}
          </Column>
          <Column title="Projects" icon="rocket" tone="var(--violet)" wide>
            {PROJECTS.map((p) => <Item key={p.label} href={p.href} label={p.label} live={p.live} icon={projectIcon(p)} />)}
          </Column>
          <Column title="Connect" icon="globe" tone="var(--pink)">
            {SOCIAL.map((s) => <Item key={s.label} href={s.href} label={s.label} icon={s.icon} />)}
          </Column>
        </div>
      </div>

      <div className="site-foot-bar">
        <span>© 2026 Azarvis AI Assistant. All rights reserved.</span>
        <span className="site-foot-built"><Icon name="zap" size="1em" /> Built with Claude, React, Next.js and FastAPI</span>
        <button type="button" className="site-foot-top" onClick={backToTop}>
          <Icon name="arrowUp" size="1em" /> Back to top
        </button>
      </div>
    </footer>
  );
}
