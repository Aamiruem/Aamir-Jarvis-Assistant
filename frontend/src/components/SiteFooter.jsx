import { Icon } from '../icons.jsx';
import { CONTACT_EMAIL, DASHBOARD_URL, GITHUB_USER, LIVE_APPS, PORTFOLIO_URL, PRODUCT_LINKS, REPO_URL, RESOURCES, SOCIAL } from '../siteLinks.js';

// Site footer. Full on the public website and the Home tab: who made Azarvis and how to reach
// him, the product, Aamir's live projects, resources, and a bottom bar. Compact (one line)
// under the other tabs.
// onOpenTab is given inside the app, so Product links switch tabs (on the public website they
// open that part of the demo); without it they go to the website's feature list.
// cta: the public website adds a "Start talking to Azarvis" card on top; onDemo / onSignup /
// onFeedback wire its buttons and the bottom bar's extra links.

const outside = (href) => (href.startsWith('mailto:') ? {} : { target: '_blank', rel: 'noopener noreferrer' });
const AVATAR = `https://github.com/${GITHUB_USER}.png?size=96`;
const PLATFORM = { vercel: 'Vercel', streamlit: 'Streamlit', render: 'Render' };

/** Scrolls whatever is scrolling: the tab content inside the app, the page on the public website. */
const scrollUp = (from) => (from?.closest('.content') ?? document.scrollingElement)?.scrollTo({ top: 0, behavior: 'smooth' });

function Column({ title, icon, tone, className = '', children }) {
  return (
    <nav aria-label={title} className={`site-foot-col ${className}`} style={{ '--tone': tone }}>
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

export default function SiteFooter({ compact = false, onOpenTab, cta = false, onDemo, onStudio, onSignup, onFeedback }) {
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

  const live = LIVE_APPS.filter((a) => !a.href.includes('azarvis-app.vercel.app'));

  return (
    <footer className={`site-foot${cta ? ' site-foot--public' : ''}`}>
      {cta && (
        <div className="site-foot-cta">
          <div className="site-foot-cta-copy">
            <img src="/icon.svg" alt="" width="44" height="44" />
            <div>
              <strong>Start talking to Azarvis today</strong>
              <span>Free account in a minute, or try the demo first: no sign-up, works on your phone.</span>
            </div>
          </div>
          <div className="site-foot-cta-btns">
            {onStudio && <button type="button" className="btn site-foot-studio" onClick={onStudio}><Icon name="workflow" size="1em" /> Agent Studio</button>}
            {onDemo && <button type="button" className="btn" onClick={onDemo}><Icon name="sparkles" size="1em" /> Try without login</button>}
            {onSignup && <button type="button" className="btn primary" onClick={onSignup}>Create free account</button>}
          </div>
        </div>
      )}

      <div className="site-foot-main">
        <div className="site-foot-brand">
          <a href="/" className="site-foot-logo" aria-label="Azarvis home">
            <img src="/icon.svg" alt="" width="40" height="40" />
            <span>Azarvis<small>AI Assistant</small></span>
          </a>
          <p>
            A personal AI voice assistant that listens, understands how you feel and gets things done: reminders, study notes,
            documents, drafts and your computer, hands-free.
          </p>
          <a className="site-foot-author" href={PORTFOLIO_URL} {...outside(PORTFOLIO_URL)}>
            <img src={AVATAR} alt="" width="40" height="40" loading="lazy" />
            <span>
              <small>Designed and built by</small>
              <strong>Aamir Hussain Azad</strong>
              <em>AI/ML Engineer · Full-Stack Developer</em>
            </span>
          </a>
          <ul className="site-foot-contact">
            <li><Icon name="mail" size="0.95em" /> <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a></li>
            <li><Icon name="globe" size="0.95em" /> Gurugram, India</li>
          </ul>
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

        <Column title="Product" icon="sparkles" tone="#22d3ee">
          {PRODUCT_LINKS.map((l) => <Item key={l.label} link={l} onOpenTab={onOpenTab} />)}
        </Column>

        <Column title="Live projects" icon="rocket" tone="#a78bfa" className="site-foot-col--live">
          {live.map((a) => (
            <li key={a.href}>
              <a className="site-foot-app" href={a.href} style={{ '--hue': a.hue ?? 220 }} {...outside(a.href)}>
                <span className="site-foot-app-icon"><Icon name={a.icon ?? 'globe'} size="0.95em" /></span>
                <span className="site-foot-app-name">{a.label}</span>
                <span className={`site-foot-plat site-foot-plat--${a.platform}`}>{PLATFORM[a.platform] ?? 'Live'}</span>
              </a>
            </li>
          ))}
          <li>
            <a className="site-foot-more" href={`https://github.com/${GITHUB_USER}?tab=repositories`} {...outside('https://github.com')}>
              <Icon name="github" size="0.95em" /> All projects on GitHub <Icon name="external" size="0.85em" />
            </a>
          </li>
        </Column>

        <Column title="Resources" icon="book" tone="#34d399">
          {RESOURCES.map((l) => <Item key={l.label} link={l} />)}
          <Item link={{ href: `${REPO_URL}/issues`, label: 'Report a bug', icon: 'alert' }} />
          {onFeedback && (
            <li>
              <button type="button" className="site-foot-linkbtn" onClick={onFeedback}>
                <Icon name="chat" size="0.95em" className="site-foot-link-icon" /> <span>Send feedback</span>
              </button>
            </li>
          )}
        </Column>
      </div>

      <div className="site-foot-bar">
        <span>© 2026 Aamir Hussain Azad · Azarvis AI Assistant · Made in India</span>
        <nav aria-label="Footer links">
          {onDemo && <button type="button" className="site-foot-barbtn" onClick={onDemo}>Demo</button>}
          <a href={`mailto:${CONTACT_EMAIL}`}>Contact</a>
          <a href={PORTFOLIO_URL} {...outside(PORTFOLIO_URL)}>Portfolio</a>
          <a href={REPO_URL} {...outside(REPO_URL)}>GitHub</a>
          <button type="button" className="site-foot-top" onClick={(e) => scrollUp(e.currentTarget)}>
            <Icon name="arrowUp" size="1em" /> Back to top
          </button>
        </nav>
      </div>
    </footer>
  );
}
