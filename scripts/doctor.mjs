// Checks the whole Jarvis setup and says how to fix what's wrong:  npm run doctor
// Safe to run any time: it only reads files and calls local health endpoints (plus one
// free GET /v1/models to Anthropic to test the key). It never prints the key itself.
import { execFile } from 'node:child_process';
import { existsSync, readFileSync, statfsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const run = promisify(execFile);
let problems = 0;
const ok = (msg) => console.log(`  \x1b[32m✓\x1b[0m ${msg}`);
const bad = (msg, fix) => {
  problems++;
  console.log(`  \x1b[31m✗\x1b[0m ${msg}${fix ? `\n      \x1b[33m→ ${fix}\x1b[0m` : ''}`);
};
const warn = (msg, fix) => console.log(`  \x1b[33m!\x1b[0m ${msg}${fix ? `\n      → ${fix}` : ''}`);
const get = async (url, ms = 3000) => {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(ms) });
    return { status: res.status, body: await res.json().catch(() => null) };
  } catch {
    return null;
  }
};

function readEnv() {
  const file = path.join(root, '.env');
  if (!existsSync(file)) return null;
  const env = {};
  for (const line of readFileSync(file, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*(?:#.*)?$/);
    if (m) env[m[1]] = m[2].replace(/^(['"])(.*)\1$/, '$2');
  }
  return env;
}

console.log('\nJarvis doctor\n\nSetup');
const [major] = process.versions.node.split('.').map(Number);
major >= 20 ? ok(`Node.js ${process.versions.node}`) : bad(`Node.js ${process.versions.node} is too old`, 'Install Node.js 20 or newer from nodejs.org');

try {
  const { stdout } = await run('python', ['-c', 'import sys, fastapi, uvicorn, anthropic, pydantic_settings; print(sys.version.split()[0])'], { timeout: 30000 });
  ok(`Python ${stdout.trim()} with the AI service packages`);
} catch (e) {
  const missing = /No module named '([^']+)'/.exec(e.stderr || '')?.[1];
  missing
    ? bad(`Python package "${missing}" is missing`, 'cd backend/fastapi-ai && python -m pip install --no-cache-dir -r requirements.txt')
    : bad('Python was not found', 'Install Python 3.12+ from python.org and tick "Add python.exe to PATH"');
}

for (const dir of ['backend/express-api', 'frontend']) {
  existsSync(path.join(root, dir, 'node_modules')) ? ok(`${dir} packages installed`) : bad(`${dir} packages are not installed`, `cd ${dir} && npm install`);
}

const env = readEnv();
if (!env) bad('.env file is missing', 'Copy .env.example to .env in the project folder');
else {
  ok('.env file found');
  const aiUrl = env.AI_SERVICE_URL || 'http://localhost:8001';
  if (/:8000\b/.test(aiUrl)) bad(`AI_SERVICE_URL is ${aiUrl}, but port 8000 belongs to another app on this PC`, 'Set AI_SERVICE_URL=http://localhost:8001 in .env');
  if (!env.ANTHROPIC_API_KEY) bad('ANTHROPIC_API_KEY is not set', 'npm run set-key');
}

console.log('\nServices');
const aiHealth = await get('http://localhost:8001/health');
const api = await get('http://localhost:4000/api/health');
const web = await fetch('http://localhost:5173', { signal: AbortSignal.timeout(3000) }).then((r) => r.ok, () => false);
const notRunning = 'Start everything with "npm run dev" (or double-click the Jarvis shortcut on your Desktop)';
aiHealth?.body?.status === 'ok' ? ok('AI service (port 8001)') : bad('AI service is not answering on port 8001', notRunning);
api?.body?.server === 'up' ? ok(`API gateway (port 4000), storage: ${api.body.storage}`) : bad('API gateway is not answering on port 4000', notRunning);
if (api?.body && aiHealth && api.body.ai !== 'up') bad('The gateway cannot reach the AI service', 'Check AI_SERVICE_URL in .env, then restart npm run dev');
web ? ok('Web app (port 5173)') : bad('Web app is not answering on port 5173', notRunning);
if (aiHealth?.body) {
  aiHealth.body.system_control ? ok('Windows control (apps, volume, lock, screenshots) is on') : warn('Windows control is off', 'Set SYSTEM_CONTROL=true in .env to let Jarvis open apps and change the volume');
}

console.log('\nClaude');
const key = process.env.ANTHROPIC_API_KEY || env?.ANTHROPIC_API_KEY;
if (key) {
  try {
    const res = await fetch('https://api.anthropic.com/v1/models?limit=1', {
      headers: { 'x-api-key': key, 'anthropic-version': '2023-06-01' },
      signal: AbortSignal.timeout(10000),
    });
    if (res.ok) ok('API key works');
    else if (res.status === 401) bad('API key was rejected (invalid or revoked)', 'Create a new key at console.anthropic.com/settings/keys, then: npm run set-key');
    else if (res.status === 403) bad('API key is not allowed to list models (permissions)', 'Check the key in console.anthropic.com');
    else warn(`Anthropic answered HTTP ${res.status}; try again in a minute`);
  } catch {
    warn("Couldn't reach api.anthropic.com (internet connection?)");
  }
} else bad('No API key, so only quick commands work', 'npm run set-key');

console.log('\nThis PC');
try {
  const drive = statfsSync(root);
  const freeGb = (drive.bavail * drive.bsize) / 1024 ** 3;
  freeGb < 2
    ? bad(`Only ${freeGb.toFixed(1)} GB free on the project drive; Windows and Jarvis slow down or fail to save files`, 'Free up space: empty the Recycle Bin, run Disk Cleanup, move big Downloads elsewhere')
    : ok(`${freeGb.toFixed(1)} GB free on the project drive`);
} catch {}

console.log(problems ? `\n\x1b[31m${problems} problem(s) found.\x1b[0m Fix the → items above, then run npm run doctor again.\n` : '\n\x1b[32mEverything looks good.\x1b[0m\n');
process.exitCode = problems ? 1 : 0;
