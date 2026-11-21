// Connects the live website (azarvis-app.vercel.app) to the AI service on THIS PC.
//
//   npm run live        (leave it running; Ctrl+C disconnects the website again)
//
// What it does:
//   1. Starts a separate copy of the AI service for the website, on 127.0.0.1:8011, with
//      - its own data folder (backend/fastapi-ai/data/live): website accounts never mix with yours,
//      - PC control OFF (nobody on the internet can open apps, change volume or lock this PC),
//      - WhatsApp OFF (your `npm run dev` already answers WhatsApp),
//      - the strong shared key LIVE_INTERNAL_API_KEY from .env (the same as INTERNAL_API_KEY on Vercel).
//   2. Opens a Cloudflare quick tunnel to it (cloudflared; downloaded once if missing). No account needed.
//   3. Tells the live API the tunnel's address, and repeats that every minute. The website uses it
//      within 15 s; if this PC goes off, the website says the AI is offline after 3 minutes.
// Uses the same AI keys as your app (ANTHROPIC_API_KEY / OPENAI_API_KEY in .env).
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const AI_DIR = path.join(ROOT, 'backend', 'fastapi-ai');
const PORT = 8011;

function readEnv(file) {
  const out = {};
  if (!fs.existsSync(file)) return out;
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m) out[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
  return out;
}
const env = { ...readEnv(path.join(ROOT, '.env')), ...process.env };
const KEY = env.LIVE_INTERNAL_API_KEY;
const API = (env.LIVE_API_URL || 'https://azarvis-api.vercel.app').replace(/\/$/, '');
if (!KEY || KEY.length < 24) {
  console.log('Set LIVE_INTERNAL_API_KEY in .env (the same value as INTERNAL_API_KEY on Vercel, project azarvis-api).');
  process.exit(1);
}

const say = (msg) => console.log(`[live] ${msg}`);
const children = [];
let tunnelUrl = null;
let stopping = false;

// ---------- 1. cloudflared ----------
function cloudflaredPath() {
  const bin = path.join(os.homedir(), '.azarvis', 'bin', process.platform === 'win32' ? 'cloudflared.exe' : 'cloudflared');
  return bin;
}

async function ensureCloudflared() {
  const bin = cloudflaredPath();
  if (fs.existsSync(bin)) return bin;
  const asset = {
    win32: 'cloudflared-windows-amd64.exe',
    linux: 'cloudflared-linux-amd64',
  }[process.platform];
  if (!asset) throw new Error(`Install cloudflared yourself on ${process.platform} (https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/) and put it at ${bin}`);
  say('Downloading cloudflared from Cloudflare (once)…');
  const res = await fetch(`https://github.com/cloudflare/cloudflared/releases/latest/download/${asset}`);
  if (!res.ok) throw new Error(`Download failed: HTTP ${res.status}`);
  fs.mkdirSync(path.dirname(bin), { recursive: true });
  fs.writeFileSync(bin, Buffer.from(await res.arrayBuffer()), { mode: 0o755 });
  return bin;
}

// ---------- 2. the website's AI service ----------
function startAi() {
  const python = process.platform === 'win32' ? path.join(AI_DIR, '.venv', 'Scripts', 'python.exe') : path.join(AI_DIR, '.venv', 'bin', 'python');
  const dataDir = path.join(AI_DIR, 'data', 'live');
  fs.mkdirSync(dataDir, { recursive: true });
  const child = spawn(fs.existsSync(python) ? python : 'python', ['-m', 'uvicorn', 'app.main:app', '--host', '127.0.0.1', '--port', String(PORT)], {
    cwd: AI_DIR,
    env: {
      ...process.env,
      INTERNAL_API_KEY: KEY,
      SYSTEM_CONTROL: 'false',
      DATA_DIR: dataDir,
      WHATSAPP_RELAY_URL: '',
      PYTHONUNBUFFERED: '1',
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  const log = (chunk) => {
    for (const line of String(chunk).split(/\r?\n/)) if (/error|exception|traceback/i.test(line)) say(`ai: ${line.trim()}`);
  };
  child.stdout.on('data', log);
  child.stderr.on('data', log);
  child.on('exit', (code) => !stopping && (say(`The AI service stopped (code ${code}).`), shutdown(1)));
  children.push(child);
}

async function waitForHealth(ms = 90_000) {
  const until = Date.now() + ms;
  while (Date.now() < until) {
    try {
      const res = await fetch(`http://127.0.0.1:${PORT}/health`, { signal: AbortSignal.timeout(2000) });
      if (res.ok) return true;
    } catch {
      /* still starting */
    }
    await new Promise((r) => setTimeout(r, 1000));
  }
  return false;
}

// ---------- 3. the tunnel ----------
function startTunnel(bin) {
  return new Promise((resolve, reject) => {
    const child = spawn(bin, ['tunnel', '--no-autoupdate', '--url', `http://127.0.0.1:${PORT}`], { stdio: ['ignore', 'pipe', 'pipe'] });
    children.push(child);
    const timer = setTimeout(() => reject(new Error('cloudflared did not report a tunnel address within 60 s')), 60_000);
    const scan = (chunk) => {
      const m = String(chunk).match(/https:\/\/[a-z0-9-]+\.trycloudflare\.com/);
      if (m && !tunnelUrl) {
        tunnelUrl = m[0];
        clearTimeout(timer);
        resolve(tunnelUrl);
      }
    };
    child.stdout.on('data', scan);
    child.stderr.on('data', scan);
    child.on('exit', (code) => !stopping && (say(`The tunnel closed (code ${code}).`), shutdown(1)));
  });
}

async function register(method = 'POST') {
  const res = await fetch(`${API}/api/internal/ai-endpoint`, {
    method,
    headers: { 'Content-Type': 'application/json', 'X-Internal-Key': KEY },
    body: method === 'POST' ? JSON.stringify({ url: tunnelUrl }) : undefined,
    signal: AbortSignal.timeout(20_000),
  });
  if (!res.ok) throw new Error(`${API} answered ${res.status}: ${(await res.text()).slice(0, 200)}`);
}

async function shutdown(code = 0) {
  if (stopping) return;
  stopping = true;
  say('Disconnecting the website…');
  await register('DELETE').catch(() => {});
  for (const c of children) c.kill();
  process.exit(code);
}
process.on('SIGINT', () => shutdown(0));
process.on('SIGTERM', () => shutdown(0));

try {
  const bin = await ensureCloudflared();
  say('Starting the website\'s AI service on this PC (PC control off)…');
  startAi();
  if (!(await waitForHealth())) throw new Error('The AI service did not start within 90 s.');
  say('Opening a secure tunnel…');
  await startTunnel(bin);
  // The tunnel's DNS name can take a few seconds to work everywhere.
  for (let i = 0; i < 20; i++) {
    try {
      const res = await fetch(`${tunnelUrl}/health`, { signal: AbortSignal.timeout(5000) });
      if (res.ok) break;
    } catch {
      /* not reachable yet */
    }
    await new Promise((r) => setTimeout(r, 2000));
  }
  await register();
  say(`✓ The live website now uses the AI on this PC (${tunnelUrl}).`);
  say('Keep this window open. Ctrl+C disconnects the website.');
  setInterval(() => register().catch((e) => say(`Couldn't refresh the registration: ${e.message}`)), 60_000);
} catch (e) {
  say(`✗ ${e.message}`);
  await shutdown(1);
}
