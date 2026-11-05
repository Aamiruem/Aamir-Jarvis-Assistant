import { useEffect } from 'react';
import { Icon } from '../icons.jsx';
import { installSteps, platform } from '../pwa.js';

/** How to install Azarvis when the browser can't show its own install prompt. */
export default function InstallDialog({ onClose }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  const kind = platform();
  const insecure = !window.isSecureContext;
  return (
    <div className="palette-backdrop welcome-backdrop" onClick={onClose}>
      <div className="welcome-card install-card" role="dialog" aria-modal="true" aria-labelledby="install-title" onClick={(e) => e.stopPropagation()}>
        <span className="promo-ico" aria-hidden="true"><Icon name="download" size="1.4em" /></span>
        <h2 id="install-title">Install Azarvis</h2>
        <p className="muted">Get Azarvis as an app with its own icon and window, on {kind === 'desktop' ? 'this computer' : 'your phone'}.</p>
        <ol className="install-steps">
          {installSteps(kind).map((s) => <li key={s}>{s}</li>)}
        </ol>
        {insecure && (
          <p className="muted small">
            Opened through a home-network address (http://192.168…), browsers only offer “Add to Home screen”. For the full app,
            open Azarvis through Tailscale's https address (see Automate → Use Azarvis from anywhere).
          </p>
        )}
        {kind === 'desktop' && (
          <p className="muted small">
            To start Azarvis's servers with one double-click too, run <code>npm run install-shortcut</code> once in the project folder.
          </p>
        )}
        <div className="welcome-actions">
          <button className="btn primary" onClick={onClose}>Got it</button>
        </div>
      </div>
    </div>
  );
}
