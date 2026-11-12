// WhatsApp Jarvis on the API: Meta's verification, signed webhooks, the queue the owner's PC pulls,
// who replies may go to, and the "PC is offline" notice.
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import express from 'express';
import { test } from 'node:test';
import { InMemoryWhatsAppRepository } from '../src/repositories/memory.js';
import { createWhatsAppRouter } from '../src/routes/whatsapp.js';
import { parseWebhook, validSignature } from '../src/whatsapp/cloud.js';

const OWNER = '919900000001';
const SECRET = 'app-secret';
const settings = { token: 't', phoneNumberId: '123', verifyToken: 'verify-me', appSecret: SECRET, ownerNumber: OWNER, relayKey: 'relay-key-123' };

async function setup({ clock = { t: 1_000_000 } } = {}) {
  const repo = new InMemoryWhatsAppRepository();
  const sent = [];
  const cloud = {
    enabled: true,
    sendText: async (to, body) => (sent.push({ to, body }), { messages: [{ id: 'wamid.out' }] }),
    markRead: async () => {},
    downloadMedia: async () => ({ buffer: Buffer.from('OggS-voice'), mime: 'audio/ogg' }),
  };
  const app = express();
  app.use('/api/whatsapp', createWhatsAppRouter({ repo, settings, cloud, production: true, now: () => clock.t }));
  app.use((err, _req, res, _next) => res.status(500).json({ error: err.message }));
  const server = await new Promise((r) => {
    const s = app.listen(0, () => r(s));
  });
  const base = `http://127.0.0.1:${server.address().port}/api/whatsapp`;
  return { repo, sent, clock, base, close: () => server.close() };
}

const incoming = (from, text, id = crypto.randomUUID()) => ({
  object: 'whatsapp_business_account',
  entry: [{ changes: [{ value: { contacts: [{ wa_id: from, profile: { name: 'Aamir' } }], messages: [{ id, from, type: 'text', text: { body: text } }] } }] }],
});
const sign = (raw) => `sha256=${crypto.createHmac('sha256', SECRET).update(raw).digest('hex')}`;
const post = (base, body, signature) => {
  const raw = JSON.stringify(body);
  return fetch(`${base}/webhook`, { method: 'POST', headers: { 'content-type': 'application/json', 'x-hub-signature-256': signature ?? sign(raw) }, body: raw });
};
const relay = (base, path, init = {}) => fetch(`${base}/relay${path}`, { ...init, headers: { 'x-relay-key': 'relay-key-123', 'content-type': 'application/json', ...(init.headers || {}) } });

test('Meta verification answers the challenge only with the right token', async () => {
  const s = await setup();
  try {
    const ok = await fetch(`${s.base}/webhook?hub.mode=subscribe&hub.verify_token=verify-me&hub.challenge=42`);
    assert.equal(ok.status, 200);
    assert.equal(await ok.text(), '42');
    assert.equal((await fetch(`${s.base}/webhook?hub.mode=subscribe&hub.verify_token=nope&hub.challenge=42`)).status, 403);
  } finally {
    s.close();
  }
});

test('unsigned or wrongly signed webhooks are rejected', async () => {
  const s = await setup();
  try {
    assert.equal((await post(s.base, incoming(OWNER, 'hi'), 'sha256=00')).status, 401);
    assert.equal((await post(s.base, incoming(OWNER, 'hi'), '')).status, 401);
    assert.equal((await relay(s.base, '/pull')).status, 200);
    assert.deepEqual((await (await relay(s.base, '/pull')).json()).messages, []);
  } finally {
    s.close();
  }
});

test('messages are queued once, pulled once, and marked as from the owner or not', async () => {
  const s = await setup();
  try {
    await relay(s.base, '/pull'); // the PC is online
    const msg = incoming(OWNER, 'remind me to call mom at 6 pm', 'wamid.1');
    assert.equal((await post(s.base, msg)).status, 200);
    await post(s.base, msg); // Meta retried: same id
    await post(s.base, incoming('919811111111', 'Are we meeting?', 'wamid.2'));
    const { messages } = await (await relay(s.base, '/pull')).json();
    assert.equal(messages.length, 2);
    assert.deepEqual(messages.map((m) => [m.text, m.owner, m.name]), [['remind me to call mom at 6 pm', true, 'Aamir'], ['Are we meeting?', false, 'Aamir']]);
    assert.deepEqual((await (await relay(s.base, '/pull')).json()).messages, []);
    assert.equal(s.sent.length, 0); // the PC was online: no offline notice
  } finally {
    s.close();
  }
});

test('the relay needs the key', async () => {
  const s = await setup();
  try {
    assert.equal((await fetch(`${s.base}/relay/pull`)).status, 401);
    assert.equal((await fetch(`${s.base}/relay/pull`, { headers: { 'x-relay-key': 'wrong' } })).status, 401);
  } finally {
    s.close();
  }
});

test('replies go to the owner, or to someone who wrote in the last 24 hours, nobody else', async () => {
  const s = await setup();
  try {
    let r = await relay(s.base, '/send', { method: 'POST', body: JSON.stringify({ text: '✅ Done' }) });
    assert.equal(r.status, 200);
    assert.deepEqual(s.sent.at(-1), { to: OWNER, body: '✅ Done' });
    r = await relay(s.base, '/send', { method: 'POST', body: JSON.stringify({ to: '919833333333', text: 'spam' }) });
    assert.equal(r.status, 403);
    await post(s.base, incoming('919822222222', 'Call me', 'wamid.3'));
    r = await relay(s.base, '/send', { method: 'POST', body: JSON.stringify({ to: '919822222222', text: 'Calling in 5' }) });
    assert.equal(r.status, 200);
    s.clock.t += 25 * 3600_000; // a day later the window is closed
    r = await relay(s.base, '/send', { method: 'POST', body: JSON.stringify({ to: '919822222222', text: 'late' }) });
    assert.equal(r.status, 403);
  } finally {
    s.close();
  }
});

test('when the PC is offline the owner gets one "saved, will do it later" notice', async () => {
  const s = await setup();
  try {
    await post(s.base, incoming(OWNER, 'open youtube', 'wamid.4'));
    await post(s.base, incoming(OWNER, 'pc status', 'wamid.5'));
    await new Promise((r) => setTimeout(r, 30));
    assert.equal(s.sent.length, 1);
    assert.match(s.sent[0].body, /offline/);
    const status = await (await fetch(`${s.base}/status`)).json();
    assert.deepEqual([status.configured, status.pcConnected], [true, false]);
    // The PC comes back and finds both messages waiting.
    assert.equal((await (await relay(s.base, '/pull')).json()).messages.length, 2);
    assert.equal((await (await fetch(`${s.base}/status`)).json()).pcConnected, true);
  } finally {
    s.close();
  }
});

test('voice notes can be downloaded by the PC', async () => {
  const s = await setup();
  try {
    const r = await relay(s.base, '/media/12345');
    assert.equal(r.headers.get('content-type'), 'audio/ogg');
    assert.equal(Buffer.from(await r.arrayBuffer()).toString(), 'OggS-voice');
    assert.equal((await relay(s.base, '/media/..%2F..')).status, 400);
  } finally {
    s.close();
  }
});

test('parseWebhook and validSignature', () => {
  const body = {
    entry: [{ changes: [{ value: { contacts: [{ wa_id: '91999', profile: { name: 'Riya' } }], messages: [{ id: 'a', from: '91999', type: 'audio', audio: { id: 'm9', voice: true } }, { id: 'b', from: '91999', type: 'text', text: { body: 'hey' } }] } }] }],
  };
  assert.deepEqual(parseWebhook(body), [
    { waId: 'a', from: '91999', name: 'Riya', type: 'voice', text: '', mediaId: 'm9' },
    { waId: 'b', from: '91999', name: 'Riya', type: 'text', text: 'hey', mediaId: '' },
  ]);
  assert.deepEqual(parseWebhook({ entry: [{ changes: [{ value: { statuses: [{ id: 'x' }] } }] }] }), []);
  const raw = Buffer.from('{"a":1}');
  assert.equal(validSignature(raw, sign(raw), SECRET), true);
  assert.equal(validSignature(raw, sign(Buffer.from('{"a":2}')), SECRET), false);
  assert.equal(validSignature(raw, sign(raw), ''), false);
});
