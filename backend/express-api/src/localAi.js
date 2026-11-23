// One-click "Start the AI service" for the owner's own PC (development only).
//
// When the FastAPI AI service isn't running, the app shows a Start button instead of only telling the
// user to open a terminal. Guard rails: never on Vercel or in production, only for requests from this
// machine itself (loopback), only for a signed-in user, never two copies, at most one attempt per 30 s.
// The service runs detached with its output in backend/fastapi-ai/data/logs/ai-service.log, so it
// keeps running if this API restarts.
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, openSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { checkAi } from './ai.js';
import { config } from './config.js';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const aiDir = path.join(repoRoot, 'backend/fastapi-ai');
const LOOPBACK = new Set(['127.0.0.1', '::1', '::ffff:127.0.0.1']);
let lastAttempt = 0;

export function localStartAllowed(req) {
  const local = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?\/?$/.test(config.aiServiceUrl);
  return !process.env.VERCEL && config.env !== 'production' && local && LOOPBACK.has(req.socket?.remoteAddress || '');
}

export function pythonFor(dir = aiDir) {
  const venv = path.join(dir, '.venv', process.platform === 'win32' ? 'Scripts/python.exe' : 'bin/python');
  return existsSync(venv) ? venv : 'python';
}

/** Starts the AI service unless it is already up. Returns what happened, for the UI. */
export async function startLocalAi({ spawnFn = spawn, check = checkAi, now = Date.now } = {}) {
  if (await check()) return { status: 'already_running' };
  if (now() - lastAttempt < 30_000) return { status: 'starting' };
  lastAttempt = now();
  const logDir = path.join(aiDir, 'data', 'logs');
  mkdirSync(logDir, { recursive: true });
  const log = openSync(path.join(logDir, 'ai-service.log'), 'a');
  const child = spawnFn(pythonFor(), ['main.py'], {
    cwd: path.join(aiDir, 'app'),
    detached: true,
    windowsHide: true,
    stdio: ['ignore', log, log],
    env: { ...process.env, PYTHONUTF8: '1' },
  });
  child.unref?.();
  return { status: 'started', pid: child.pid, log: 'backend/fastapi-ai/data/logs/ai-service.log' };
}

export function localAiRoutes(app, requireAuth) {
  app.post('/api/dev/start-ai', requireAuth, async (req, res) => {
    if (!localStartAllowed(req)) {
      return res.status(403).json({ error: 'The AI service can only be started from the computer it runs on, in development.' });
    }
    try {
      res.json(await startLocalAi());
    } catch (e) {
      res.status(500).json({ error: `Could not start the AI service: ${e.message}` });
    }
  });
}

export const _test = { reset: () => { lastAttempt = 0; } };
