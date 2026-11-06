import { Icon } from '../icons.jsx';
import { AZARVIS_LINKS, PORTFOLIO_URL, PROJECTS, SOCIAL } from '../siteLinks.js';

// Site footer. Full on the sign-in screen and the Home tab: the Azarvis sites, Aamir's other
// projects and where to find him. Compact (one line) under the other tabs.

const outside = (href) => (href.startsWith('mailto:') ? {} : { target: '_blank', rel: 'noopener noreferrer' });

function Column({ title, links, wide = false }) {
  return (
    <nav aria-label={title} className={`site-foot-col${wide ? ' site-foot-col--wide' : ''}`}>
      <h2>{title}</h2>
      <ul>
        {links.map((l) => (
          <li key={l.label}>
            <a href={l.href} {...outside(l.href)}>
              {l.label}
              {l.live && <span className="site-foot-live">Live</span>}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export default function SiteFooter({ compact = false }) {
  if (compact) {
    return (
      <footer className="site-foot site-foot--compact">
        <span>© 2026 Azarvis · Created by <a href={PORTFOLIO_URL} {...outside(PORTFOLIO_URL)}>Aamir Hussain Azad</a></span>
        <nav aria-label="Footer">
          {SOCIAL.slice(0, 3).map((s) => <a key={s.label} href={s.href} {...outside(s.href)}>{s.label === 'Portfolio' ? 'Projects' : s.label}</a>)}
        </nav>
      </footer>
    );
  }

  return (
    <footer className="site-foot">
      <div className="site-foot-main">
        <div className="site-foot-brand">
          <a href="/" className="site-foot-logo" aria-label="Azarvis home">
            <img src="/icon.svg" alt="" width="32" height="32" />
            <span>AZARVIS</span>
          </a>
          <p>Your personal AI voice assistant for tasks, reminders, study notes, documents and your computer.</p>
          <p>
            Created by <a href={PORTFOLIO_URL} {...outside(PORTFOLIO_URL)}>Aamir Hussain Azad</a>, AI/ML Engineer &amp; Full-Stack Developer.
          </p>
          <ul className="site-foot-social" aria-label="Find Aamir online">
            {SOCIAL.map((s) => (
              <li key={s.label}>
                <a href={s.href} aria-label={s.label} title={s.label} {...outside(s.href)}>
                  <Icon name={s.icon} size="1.05em" />
                </a>
              </li>
            ))}
          </ul>
        </div>
        <div className="site-foot-links">
          <Column title="Azarvis" links={AZARVIS_LINKS} />
          <Column title="Projects" links={PROJECTS} wide />
          <Column title="Connect" links={SOCIAL} />
        </div>
      </div>
      <div className="site-foot-bar">
        <span>© 2026 Azarvis AI Assistant. All rights reserved.</span>
        <span>Built with Claude, React, Next.js and FastAPI.</span>
        <a href={PORTFOLIO_URL} {...outside(PORTFOLIO_URL)}>
          All projects <Icon name="external" size="0.95em" />
        </a>
      </div>
    </footer>
  );
}
