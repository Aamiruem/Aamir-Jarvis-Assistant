// Saves your AI key into .env after checking it with the provider.
//   npm run set-key            (then paste the key when asked; it isn't shown on screen)
// Claude (preferred): https://console.anthropic.com/settings/keys, starts with "sk-ant-" → ANTHROPIC_API_KEY.
// OpenAI: https://platform.openai.com/api-keys, starts with "sk-" → OPENAI_API_KEY. Azarvis uses it
// whenever there is no working Claude key (AI_PROVIDER=auto), with every feature.
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
  if (!key.startsWith('sk-ant-')) {
    const res = await fetch('https://api.openai.com/v1/models', { headers: { Authorization: `Bearer ${key}` } });
    if (res.status === 401) return { ok: false, why: 'OpenAI rejected this key (invalid, revoked, or copied incompletely).' };
    if (!res.ok) return { ok: false, why: `OpenAI answered HTTP ${res.status}: ${(await res.text()).slice(0, 200)}` };
    return { ok: true, models: (await res.json()).data?.map((m) => m.id) ?? [] };
  }
  const res = await fetch('https://api.anthropic.com/v1/models?limit=100', {
    headers: { 'x-api-key': key, 'anthropic-version': '2023-06-01' },
  });
  if (res.status === 401) return { ok: false, why: 'Anthropic rejected this key (invalid, revoked, or copied incompletely).' };
  if (!res.ok) return { ok: false, why: `Anthropic answered HTTP ${res.status}: ${(await res.text()).slice(0, 200)}` };
  const models = (await res.json()).data?.map((m) => m.id) ?? [];
  return { ok: true, models };
}

function saveKey(key) {
  const name = key.startsWith('sk-ant-') ? 'ANTHROPIC_API_KEY' : 'OPENAI_API_KEY';
  const text = fs.existsSync(envFile) ? fs.readFileSync(envFile, 'utf8') : '';
  const line = `${name}=${key}`;
  const re = new RegExp(`^${name}=.*$`, 'm');
  const updated = re.test(text) ? text.replace(re, line) : `${line}\n${text}`;
  fs.writeFileSync(envFile, updated);
  return name;
}

const key = process.argv[2] || (await askHidden('Paste your Claude (sk-ant-…) or OpenAI (sk-…) API key: '));
if (!key) {
  console.log('No key entered. Nothing changed.');
  process.exit(1);
}
if (!key.startsWith('sk-') || key.includes('...') || key.length < 30) {
  console.log("That doesn't look like a real API key (Claude keys start with \"sk-ant-\", OpenAI keys with \"sk-\"; \"...\" in examples stands for the rest of the key). Nothing changed.");
  process.exit(1);
}
const provider = key.startsWith('sk-ant-') ? 'Anthropic' : 'OpenAI';

let result;
try {
  result = await check(key);
} catch (err) {
  console.log(`Couldn't reach ${provider} to check the key (${err.cause?.code || err.message}). Check your internet. Nothing changed.`);
  process.exit(1);
}
if (!result.ok) {
  console.log(`${result.why}\nNothing changed. Create a new key at ${provider === 'OpenAI' ? 'https://platform.openai.com/api-keys' : 'https://console.anthropic.com/settings/keys'}`);
  process.exit(1);
}

const saved = saveKey(key);
console.log(`✓ ${provider} key works and is saved in ${envFile} as ${saved}`);
if (saved === 'OPENAI_API_KEY') {
  console.log('✓ Azarvis answers with OpenAI whenever there is no working Claude key; no restart needed. Try talking to Jarvis now.');
  process.exit(0);
}
const model = (fs.readFileSync(envFile, 'utf8').match(/^CLAUDE_MODEL=(\S+)/m) || [])[1];
if (model && result.models.length && !result.models.includes(model)) {
  console.log(`! Your account doesn't list the model in CLAUDE_MODEL (${model}). Available: ${result.models.slice(0, 6).join(', ')}`);
} else {
  console.log('✓ Jarvis will use it right away; no restart needed. Try talking to Jarvis now.');
}
