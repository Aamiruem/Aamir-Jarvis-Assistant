import { config } from './config.js';

/** Headers that tell the AI service who the request is for. Always built from the verified JWT. */
export function aiHeaders(user) {
  return {
    'X-Internal-Key': config.internalApiKey,
    'X-User-Id': user.id,
    'X-User-Role': user.role || 'user',
  };
}

/** JSON call to the Python AI service on behalf of a user. */
export async function aiFetch(path, user, { method = 'GET', body, signal } = {}) {
  const res = await fetch(`${config.aiServiceUrl}${path}`, {
    method,
    signal,
    headers: { ...aiHeaders(user), ...(body ? { 'Content-Type': 'application/json' } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`AI service ${method} ${path} responded ${res.status}`);
  return res;
}

// --- Connection to the AI service ----------------------------------------------------------
// The AI service restarts now and then (code reload, crash recovery by dev.mjs; ~5-15 s).
// Instead of failing every request during that gap, requests wait for it to come back.

const FRESH_MS = 3000; // a health check younger than this is trusted without asking again
let last = { up: false, at: 0, info: null };
let inFlight = null;

/** GET /health on the AI service (timeout 2 s). Returns its JSON, or null when it's down. */
export function checkAi() {
  inFlight ??= fetch(`${config.aiServiceUrl}/health`, { signal: AbortSignal.timeout(2000) })
    .then(async (res) => (res.ok ? res.json().catch(() => ({})) : null))
    .catch(() => null)
    .then((info) => {
      last = { up: Boolean(info), at: Date.now(), info };
      inFlight = null;
      return info;
    });
  return inFlight;
}

/** Remember that a request just failed to connect, so the next one waits instead of failing. */
export function markAiDown() {
  last = { up: false, at: Date.now(), info: null };
}

export const aiStatus = () => ({ ...last });

/** Resolves true once the AI service answers, or false after maxMs (or when signal aborts). */
export async function waitForAi(maxMs = config.aiWaitMs, { signal, recheck = false } = {}) {
  if (!recheck && last.up && Date.now() - last.at < FRESH_MS) return true;
  const until = Date.now() + maxMs;
  for (;;) {
    if (await checkAi()) return true;
    if (Date.now() >= until || signal?.aborted) return false;
    await new Promise((r) => setTimeout(r, 500));
  }
}

/**
 * Express middleware for the /api/ai proxy: holds the request (body not read yet) until the
 * AI service is reachable, so a restart is a short delay instead of a 502.
 */
export function aiGate(maxMs = config.aiWaitMs) {
  return async (_req, res, next) => {
    const up = await waitForAi(maxMs);
    if (!up) return res.status(503).json({ error: aiDownMessage(), code: 'AI_UNAVAILABLE' });
    next();
  };
}

export function aiDownMessage() {
  return `The AI service isn't running (nothing answered at ${config.aiServiceUrl}). Start everything with "npm run dev" in the project folder, or "python main.py" in backend/fastapi-ai/app.`;
}
