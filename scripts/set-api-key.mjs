// Saves your Claude API key into .env after checking it with Anthropic.
//   npm run set-key            (then paste the key when asked; it isn't shown on screen)
// Get a key at https://console.anthropic.com/settings/keys  (it starts with "sk-ant-").
// The AI service picks up the new key automatically; no restart needed.
import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';
import { fileURLToPath } from 'node:url';

const envFile = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '.env');

function askHidden(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
  let prompted = false;
  rl._writeToOutput = (s) => {
    if (!prompted) {
      process.stdout.write(s);
      prompted = true;
    } else if (s.includes('\n')) process.stdout.write('\n');
    else process.stdout.write('*');
  };
  return new Promise((resolve) => rl.question(question, (answer) => { rl.close(); resolve(answer.trim()); }));
}

async function check(key) {
  const res = await fetch('https://api.anthropic.com/v1/models?limit=100', {
    headers: { 'x-api-key': key, 'anthropic-version': '2023-06-01' },
  });
  if (res.status === 401) return { ok: false, why: 'Anthropic rejected this key (invalid, revoked, or copied incompletely).' };
  if (!res.ok) return { ok: false, why: `Anthropic answered HTTP ${res.status}: ${(await res.text()).slice(0, 200)}` };
  const models = (await res.json()).data?.map((m) => m.id) ?? [];
  return { ok: true, models };
}

function saveKey(key) {
  const text = fs.existsSync(envFile) ? fs.readFileSync(envFile, 'utf8') : '';
  const line = `ANTHROPIC_API_KEY=${key}`;
  const updated = /^ANTHROPIC_API_KEY=.*$/m.test(text)
    ? text.replace(/^ANTHROPIC_API_KEY=.*$/m, line)
    : `${line}\n${text}`;
  fs.writeFileSync(envFile, updated);
}

const key = process.argv[2] || (await askHidden('Paste your Claude API key (starts with sk-ant-): '));
if (!key) {
  console.log('No key entered. Nothing changed.');
  process.exit(1);
}
if (!key.startsWith('sk-ant-')) {
  console.log("That doesn't look like a Claude API key (they start with \"sk-ant-\"). Nothing changed.");
  process.exit(1);
}

let result;
try {
  result = await check(key);
} catch (err) {
  console.log(`Couldn't reach Anthropic to check the key (${err.cause?.code || err.message}). Check your internet. Nothing changed.`);
  process.exit(1);
}
if (!result.ok) {
  console.log(`${result.why}\nNothing changed. Create a new key at https://console.anthropic.com/settings/keys`);
  process.exit(1);
}

saveKey(key);
console.log(`✓ Key works and is saved in ${envFile}`);
const model = (fs.readFileSync(envFile, 'utf8').match(/^CLAUDE_MODEL=(\S+)/m) || [])[1];
if (model && result.models.length && !result.models.includes(model)) {
  console.log(`! Your account doesn't list the model in CLAUDE_MODEL (${model}). Available: ${result.models.slice(0, 6).join(', ')}`);
} else {
  console.log('✓ Jarvis will use it right away; no restart needed. Try talking to Jarvis now.');
}
