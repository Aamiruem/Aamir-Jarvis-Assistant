// Sets up WhatsApp Jarvis in one go:   npm run whatsapp:setup
//
// 1. Asks for the values from your Meta app (developers.facebook.com → your app → WhatsApp → API Setup):
//    the access token, the phone number ID and the app secret (App settings → Basic).
//    Each one is checked with Meta before anything is saved.
// 2. Creates the webhook verify token and the relay key (random), and saves everything in .env.
// 3. Puts the same values on the azarvis-api Vercel project and redeploys it.
// 4. Prints the webhook URL + verify token to paste into Meta (WhatsApp → Configuration).
// Secrets are typed hidden and never printed. Restart "npm run dev" afterwards.
import { spawnSync } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const envFile = path.join(root, '.env');
const apiDir = path.join(root, 'backend', 'express-api');
const API_URL = 'https://azarvis-api.vercel.app';
const GRAPH = 'https://graph.facebook.com/v21.0';

const readEnv = () => (fs.existsSync(envFile) ? fs.readFileSync(envFile, 'utf8') : '');
const current = (name) => (readEnv().match(new RegExp(`^${name}=(.*)$`, 'm')) || [])[1]?.trim() || '';
function save(values) {
  let text = readEnv();
  for (const [name, value] of Object.entries(values)) {
    const line = `${name}=${value}`;
    text = new RegExp(`^${name}=.*$`, 'm').test(text) ? text.replace(new RegExp(`^${name}=.*$`, 'm'), line) : `${text.replace(/\n?$/, '\n')}${line}\n`;
  }
  fs.writeFileSync(envFile, text);
}

function ask(question, { hidden = false, fallback = '' } = {}) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
  if (hidden) {
    let prompted = false;
    rl._writeToOutput = (s) => {
      if (!prompted) {
        process.stdout.write(s);
        prompted = true;
      } else if (s.includes('\n')) process.stdout.write('\n');
      else process.stdout.write('*');
    };
  }
  const hint = fallback ? (hidden ? ' [Enter = keep the saved one]' : ` [${fallback}]`) : '';
  return new Promise((resolve) => rl.question(`${question}${hint}: `, (a) => { rl.close(); resolve(a.trim() || fallback); }));
}

const fail = (msg) => {
  console.log(`\n✗ ${msg}\nNothing was changed on Vercel.`);
  process.exit(1);
};

console.log('\n🤖 WhatsApp Jarvis setup\n');
console.log('Create a free Meta app first (5 minutes): https://developers.facebook.com/apps → Create app → "Other" →');
console.log('"Business" → add the WhatsApp product. On WhatsApp → API Setup you get a free test number,');
console.log('a temporary access token and the phone number ID. Add YOUR number under "To" and verify it.\n');

const owner = (await ask('Your WhatsApp number with country code (digits only)', { fallback: current('WHATSAPP_OWNER_NUMBER') })).replace(/\D/g, '');
if (owner.length < 10) fail('That number looks too short. Use the country code, e.g. 91XXXXXXXXXX.');
const token = await ask('WhatsApp access token', { hidden: true, fallback: current('WHATSAPP_TOKEN') });
const phoneId = (await ask('Phone number ID', { fallback: current('WHATSAPP_PHONE_NUMBER_ID') })).replace(/\D/g, '');
const appSecret = await ask('App secret (App settings → Basic → App secret)', { hidden: true, fallback: current('WHATSAPP_APP_SECRET') });
const groq = await ask('Optional: free Groq API key for voice notes (console.groq.com), Enter to skip', { hidden: true, fallback: current('GROQ_API_KEY') });
if (!token || !phoneId || !appSecret) fail('The token, phone number ID and app secret are all needed.');

// Check the token + phone number ID with Meta before saving anything.
try {
  const res = await fetch(`${GRAPH}/${phoneId}?fields=display_phone_number,verified_name`, { headers: { Authorization: `Bearer ${token}` } });
  const body = await res.json();
  if (!res.ok) fail(`Meta rejected the token or phone number ID: ${body?.error?.message || res.status}`);
  console.log(`\n✓ Meta says: the bot number is ${body.display_phone_number} (${body.verified_name || 'test number'})`);
} catch (err) {
  fail(`Couldn't reach Meta (${err.cause?.code || err.message}). Check your internet.`);
}

const values = {
  WHATSAPP_OWNER_NUMBER: owner,
  WHATSAPP_TOKEN: token,
  WHATSAPP_PHONE_NUMBER_ID: phoneId,
  WHATSAPP_APP_SECRET: appSecret,
  WHATSAPP_VERIFY_TOKEN: current('WHATSAPP_VERIFY_TOKEN') || crypto.randomBytes(18).toString('base64url'),
  WHATSAPP_RELAY_KEY: current('WHATSAPP_RELAY_KEY') || crypto.randomBytes(32).toString('base64url'),
  WHATSAPP_RELAY_URL: current('WHATSAPP_RELAY_URL') || API_URL,
  ...(groq ? { GROQ_API_KEY: groq } : {}),
};
save(values);
console.log(`✓ Saved in ${envFile}`);

// The API on Vercel needs the same values (except the PC-only ones).
const vercel = (args, input) => spawnSync('npx', ['vercel@65.11.0', ...args], { cwd: apiDir, input, encoding: 'utf8', shell: true });
console.log('… putting the values on the azarvis-api Vercel project');
for (const name of ['WHATSAPP_OWNER_NUMBER', 'WHATSAPP_TOKEN', 'WHATSAPP_PHONE_NUMBER_ID', 'WHATSAPP_APP_SECRET', 'WHATSAPP_VERIFY_TOKEN', 'WHATSAPP_RELAY_KEY']) {
  vercel(['env', 'rm', name, 'production', '--yes']);
  const r = vercel(['env', 'add', name, 'production'], values[name]);
  if (r.status !== 0) fail(`Vercel didn't take ${name}: ${(r.stderr || r.stdout).slice(-300)}\n(Is the Vercel CLI logged in? Run: npx vercel login)`);
}
console.log('✓ Values saved on Vercel. Redeploying the API (about a minute)…');
const deploy = vercel(['deploy', '--prod', '--yes']);
if (deploy.status !== 0) fail(`The redeploy failed: ${(deploy.stderr || deploy.stdout).slice(-400)}`);
console.log('✓ API redeployed');

console.log(`
Last step, in Meta (WhatsApp → Configuration → Webhook → Edit):
  Callback URL:  ${API_URL}/api/whatsapp/webhook
  Verify token:  ${values.WHATSAPP_VERIFY_TOKEN}
Then press "Manage" and subscribe to the "messages" field.

Restart Azarvis on this PC (npm run dev), open WhatsApp on your phone and send "hi" to the bot number.
Azarvis answers in a few seconds. In the app: Automate → WhatsApp Jarvis → Send a test message.`);
