import { Icon } from '../icons.jsx';
import { CONTACT_EMAIL, DASHBOARD_URL, PORTFOLIO_URL, PRODUCT_LINKS, PROJECTS, REPO_URL, RESOURCES, SOCIAL, WORKS_WITH } from '../siteLinks.js';

// Site footer. Full on the sign-in screen and the Home tab: the brand, Product / Works with /
// Resources / Projects columns and a bottom bar. Compact (one line) under the other tabs.
// onOpenTab is given inside the app, so Product links switch tabs; without it they go to the
// website's feature list.

const outside = (href) => (href.startsWith('mailto:') ? {} : { target: '_blank', rel: 'noopener noreferrer' });
const projectIcon = (p) => (p.live ? 'globe' : p.href.includes('github.com') ? 'github' : 'briefcase');

/** Scrolls whatever is scrolling: the tab content inside the app, the page on the sign-in screen. */
const scrollUp = (from) => (from?.closest('.content') ?? document.scrollingElement)?.scrollTo({ top: 0, behavior: 'smooth' });

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

function Item({ link, onOpenTab }) {
  const body = (
    <>
      <Icon name={link.icon} size="0.95em" className="site-foot-link-icon" />
      <span>{link.label}</span>
      {link.live && <span className="site-foot-live">Live</span>}
    </>
  );
  if (link.tab && onOpenTab) {
    return (
      <li>
        <button type="button" className="site-foot-linkbtn" onClick={(e) => { onOpenTab(link.tab); scrollUp(e.currentTarget); }}>{body}</button>
      </li>
    );
  }
  const href = link.href ?? `${DASHBOARD_URL}#features`;
  return (
    <li>
      <a href={href} {...outside(href)}>{body}</a>
    </li>
  );
}

export default function SiteFooter({ compact = false, onOpenTab }) {
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
      <div className="site-foot-main">
        <div className="site-foot-brand">
          <a href="/" className="site-foot-logo" aria-label="Azarvis home">
            <img src="/icon.svg" alt="" width="40" height="40" />
            <span>Azarvis<small>AI Assistant</small></span>
          </a>
          <p>A personal AI voice assistant that listens, answers out loud, and handles your tasks, reminders, study notes, documents and your computer.</p>
          <a className="site-foot-accent" href={`${DASHBOARD_URL}dashboard`} {...outside(DASHBOARD_URL)}>
            Open the dashboard <Icon name="external" size="0.95em" />
          </a>
          <a className="site-foot-sub" href={REPO_URL} {...outside(REPO_URL)}>
            Star Azarvis on GitHub
          </a>
          <ul className="site-foot-social" aria-label="Find Aamir online">
            {SOCIAL.map((s) => (
              <li key={s.label}>
                <a href={s.href} aria-label={s.label} title={s.label} style={{ '--brand': s.brand }} {...outside(s.href)}>
                  <Icon name={s.icon} size="1.15em" />
                </a>
              </li>
            ))}
          </ul>
        </div>

        <Column title="Product" icon="sparkles" tone="var(--accent)">
          {PRODUCT_LINKS.map((l) => <Item key={l.label} link={l} onOpenTab={onOpenTab} />)}
        </Column>
        <Column title="Works with" icon="zap" tone="var(--warn)">
          {WORKS_WITH.map((l) => <Item key={l.label} link={l} onOpenTab={onOpenTab} />)}
        </Column>
        <Column title="Resources" icon="book" tone="var(--ok)">
          {RESOURCES.map((l) => <Item key={l.label} link={l} />)}
        </Column>
        <Column title="Projects" icon="rocket" tone="var(--violet)" wide>
          {PROJECTS.map((p) => <Item key={p.label} link={{ ...p, icon: projectIcon(p) }} />)}
        </Column>
      </div>

      <div className="site-foot-bar">
        <span>© 2026 Aamir Hussain Azad. Azarvis AI Assistant.</span>
        <nav aria-label="Footer links">
          <a href={`mailto:${CONTACT_EMAIL}`}>Contact</a>
          <a href={PORTFOLIO_URL} {...outside(PORTFOLIO_URL)}>Portfolio</a>
          <a href={REPO_URL} {...outside(REPO_URL)}>GitHub</a>
          <a href={`${DASHBOARD_URL}#faq`} {...outside(DASHBOARD_URL)}>FAQ</a>
          <button type="button" className="site-foot-top" onClick={(e) => scrollUp(e.currentTarget)}>
            <Icon name="arrowUp" size="1em" /> Back to top
          </button>
        </nav>
      </div>
    </footer>
  );
}
