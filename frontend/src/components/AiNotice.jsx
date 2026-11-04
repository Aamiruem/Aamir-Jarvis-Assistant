import { Icon } from '../icons.jsx';
import { toast } from '../ui.jsx';

// What /api/health's "claude" field (or a down AI service) means for the user, in plain words.
// Quick commands (open apps and sites, volume, screenshots) keep working in every case.
export const AI_PROBLEMS = {
  ai_down: {
    title: 'The AI service is not running',
    body: 'Chat, tasks and documents need it. Start everything with "npm run dev" in the main project folder, or double-click the Jarvis shortcut.',
  },
  no_key: {
    title: 'Add a Claude API key to turn on AI answers',
    body: 'Until then Jarvis can only run quick commands like “open YouTube” or “volume up”.',
    fixKey: true,
  },
  invalid_key: {
    title: 'Your Claude API key was rejected',
    body: 'It is invalid or was revoked, so for now Jarvis can only run quick commands like “open YouTube” or “volume up”.',
    fixKey: true,
  },
  no_credits: {
    title: 'Your Anthropic account is out of credits',
    body: 'Add credits at console.anthropic.com and AI answers come back right away. Quick commands still work.',
  },
  unreachable: {
    title: "Can't reach Claude right now",
    body: 'Check your internet connection. Quick commands still work.',
  },
};

/** The problem key for a /api/health answer, or null when the AI is ready. */
export function aiProblemOf(health) {
  if (!health) return null;
  if (health.ai !== 'up') return 'ai_down';
  return AI_PROBLEMS[health.claude] ? health.claude : null;
}

/** "setup" for a missing/rejected key or credits, else "error". */
export const isSetupError = (message) => /api[_ ]?key|anthropic|credit|billing/i.test(message || '');

/** What Jarvis says out loud when a request fails: short, and never a URL read out letter by letter. */
export function spokenFailure(message) {
  if (/credit|billing/i.test(message || '')) {
    return "I can't answer that right now, because the Anthropic account is out of credits. Quick commands like open YouTube still work.";
  }
  if (isSetupError(message)) {
    return "I can't answer that right now, because my Claude API key was rejected. Quick commands like open YouTube still work, and the note on screen shows how to fix it.";
  }
  return `Sorry, that didn't work. ${String(message || '').replace(/https?:\/\/\S+/g, 'the link on screen')}`;
}

const copy = (text) =>
  navigator.clipboard.writeText(text).then(() => toast(`Copied: ${text}`), () => toast("Couldn't copy", 'error'));

/** A calm, actionable card: what is wrong, what still works, and how to fix it. */
export function AiNotice({ problem, onDismiss, className = '' }) {
  const p = AI_PROBLEMS[problem];
  if (!p) return null;
  return (
    <div className={`notice setup ${className}`} role="status">
      <span className="notice-icon"><Icon name={p.fixKey ? 'key' : 'alert'} /></span>
      <div className="notice-body">
        <strong>{p.title}</strong>
        <p>{p.body}</p>
        {p.fixKey && (
          <ol className="notice-steps">
            <li>
              Create a key at{' '}
              <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noopener noreferrer">console.anthropic.com</a>.
            </li>
            <li>
              In the project folder, run{' '}
              <button type="button" className="cmd" onClick={() => copy('npm run set-key')} title="Copy">
                <code>npm run set-key</code> <Icon name="copy" size="0.95em" />
              </button>{' '}
              and paste it. It works right away, no restart needed.
            </li>
          </ol>
        )}
      </div>
      {onDismiss && (
        <button type="button" className="icon-btn" aria-label="Hide this note" title="Hide" onClick={onDismiss}>
          <Icon name="x" size="1em" />
        </button>
      )}
    </div>
  );
}
