// Starts the whole app with one command:  npm run dev   (from the project folder)
//   npm run dev -- --open   also opens Jarvis in the browser once it's ready (used by the desktop shortcut)
//   npm run dev -- --phone  also lets phones on the same Wi-Fi open Jarvis (prints the link)
// Each service's output is prefixed with its name. Ctrl+C stops them all.
// A service whose port is already in use is assumed to be running and is skipped.
// A service that crashes is restarted automatically (with a growing pause; after 5 crashes in 2 minutes it waits 60s, then keeps trying).
import { exec, spawn } from 'node:child_process';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
const SERVICES = [
  { name: 'ai     ', port: 8001, cwd: 'backend/fastapi-ai/app', cmd: 'python main.py', color: 35 },
  { name: 'api    ', port: 4000, cwd: 'backend/express-api', cmd: 'npm run dev', color: 36 },
  { name: 'web    ', port: 5173, cwd: 'frontend', cmd: 'npm run dev', color: 32 },
  { name: 'dash   ', port: 3001, cwd: 'dashboard', cmd: 'npm run dev', color: 33 },
];
const APP_URL = 'http://localhost:5173';
const openBrowser = process.argv.includes('--open');
const phone = process.argv.includes('--phone');
if (phone) process.env.JARVIS_PHONE = '1'; // read by frontend/vite.config.js
const lanUrls = () =>
  Object.values(os.networkInterfaces())
    .flat()
    .filter((a) => a && a.family === 'IPv4' && !a.internal && !a.address.startsWith('169.254.'))
    .map((a) => `http://${a.address}:5173`);

const inUse = (port) =>
  new Promise((resolve) => {
    const socket = net.connect({ port, host: 'localhost' });
    socket.once('connect', () => socket.end(() => resolve(true)));
    socket.once('error', () => resolve(false));
  });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

let stopping = false;
const children = new Set();

function run(s, tag) {
  const child = spawn(s.cmd, { cwd: path.join(root, s.cwd), shell: true, env: { ...process.env, PYTHONUTF8: '1', FORCE_COLOR: '1' } });
  children.add(child);
  const print = (data) => process.stdout.write(data.toString().replace(/^(?=.)/gm, tag));
  child.stdout.on('data', print);
  child.stderr.on('data', print);
  child.on('exit', async (code) => {
    children.delete(child);
    if (stopping) return;
    const now = Date.now();
    s.crashes = (s.crashes || []).filter((t) => now - t < 120_000).concat(now);
    // Never give up for good (Jarvis is meant to run unattended): after a burst of crashes,
    // cool down for a minute so a slow dependency (e.g. MongoDB after a reboot) can come up.
    const burst = s.crashes.length > 5;
    if (burst) {
      console.log(`${tag}\x1b[31mcrashed ${s.crashes.length} times in 2 minutes; check the error above. Trying again in 60s…\x1b[0m`);
      s.crashes = [];
    }
    const wait = burst ? 60_000 : 1000 * 2 ** (s.crashes.length - 1);
    console.log(`${tag}\x1b[33mstopped (exit ${code}); restarting in ${wait / 1000}s…\x1b[0m`);
    await sleep(wait);
    if (!stopping) run(s, tag);
  });
}

for (const s of SERVICES) {
  const tag = `\x1b[${s.color}m[${s.name}]\x1b[0m `;
  if (await inUse(s.port)) {
    console.log(`${tag}already running on port ${s.port}, skipped`);
    continue;
  }
  run(s, tag);
}

// Report when everything answers, and optionally open the browser.
(async () => {
  for (let i = 0; i < 90; i++) {
    const up = await Promise.all(SERVICES.map((s) => inUse(s.port)));
    if (up.every(Boolean)) {
      console.log(`\n\x1b[32m✓ Jarvis is ready: ${APP_URL}\x1b[0m  (Ctrl+C stops everything started here)\n`);
      if (phone) console.log(`  On your phone (same Wi-Fi): ${lanUrls().join('  or  ') || 'no network found'}\n`);
      if (openBrowser) exec(process.platform === 'win32' ? `start "" ${APP_URL}` : `xdg-open ${APP_URL}`);
      return;
    }
    await sleep(1000);
  }
  console.log('\x1b[33mSome services did not start within 90 seconds; check the messages above.\x1b[0m');
})();

const stopAll = () => {
  stopping = true;
  for (const c of children) {
    if (process.platform === 'win32') spawn('taskkill', ['/pid', String(c.pid), '/T', '/F']);
    else c.kill('SIGTERM');
  }
  setTimeout(() => process.exit(0), 500);
};
process.on('SIGINT', stopAll);
process.on('SIGTERM', stopAll);
