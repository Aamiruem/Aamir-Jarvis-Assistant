// Deleting an account when the AI service is missing (website-only hosting) or failing.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { after, before, test } from 'node:test';

let ai, aiMode = 'down', createContainer, MemorySender, aiUnavailable;
const dirs = [];

before(async () => {
  ai = http.createServer((req, res) => {
    res.writeHead(aiMode === 'error' ? 500 : 200, { 'Content-Type': 'application/json' });
    res.end('{}');
  });
  await new Promise((r) => ai.listen(0, r));
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'test-secret';
  process.env.AI_SERVICE_URL = `http://127.0.0.1:${ai.address().port}`;
  ({ createContainer, aiUnavailable } = await import('../src/container.js'));
  ({ MemorySender } = await import('../src/auth/notifiers.js'));
});
after(() => {
  ai?.close();
  for (const d of dirs) fs.rmSync(d, { recursive: true, force: true });
});

/** A file-storage container (the real purge runs, unlike the "memory" test storage) with one verified user. */
async function setup() {
  const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'azarvis-del-'));
  dirs.push(dataDir);
  const inbox = new MemorySender();
  const c = createContainer({ storage: 'file', dataDir, notifier: inbox });
  const reg = await c.authService.register({ name: 'Del Ete', email: 'delete-me@example.com', password: 'Gr8!Passphrase' }, {});
  const { user } = await c.authService.verifyEmail({ challengeId: reg.challengeId, code: inbox.lastCode() }, {});
  await c.conversations.create({ userId: user.id, title: 'hello' });
  return { c, user };
}

test('the account is deleted even when no AI service is reachable, and that is recorded', async () => {
  aiMode = 'down';
  const { c, user } = await setup();
  const realUrl = process.env.AI_SERVICE_URL;
  const { config } = await import('../src/config.js');
  config.aiServiceUrl = 'http://127.0.0.1:9'; // nothing listens on port 9
  try {
    await c.authService.deleteAccount(user.id, 'Gr8!Passphrase', { id: user.id, role: 'user' }, {});
  } finally {
    config.aiServiceUrl = realUrl;
  }
  assert.equal(await c.users.findById(user.id), null);
  assert.deepEqual(await c.conversations.listForUser(user.id), []);
  const events = (await c.audit.auditRepo.listForUser(user.id)).map((e) => e.event);
  assert.ok(events.includes('ai_purge_skipped') && events.includes('account_deleted'), events);
});

test('a running AI service that fails still stops the deletion, so nothing is left behind silently', async () => {
  aiMode = 'error';
  const { c, user } = await setup();
  await assert.rejects(c.authService.deleteAccount(user.id, 'Gr8!Passphrase', { id: user.id, role: 'user' }, {}), /responded 500/);
  assert.ok(await c.users.findById(user.id), 'account kept');
});

test('what counts as "AI service unavailable"', () => {
  assert.equal(aiUnavailable(Object.assign(new TypeError('fetch failed'), { cause: { code: 'ECONNREFUSED' } })), true);
  assert.equal(aiUnavailable(new Error('AI service DELETE /me/data responded 503')), true);
  assert.equal(aiUnavailable(Object.assign(new Error('timed out'), { name: 'TimeoutError' })), true);
  assert.equal(aiUnavailable(new Error('AI service DELETE /me/data responded 500')), false);
  assert.equal(aiUnavailable(new Error('AI service DELETE /me/data responded 403')), false);
});
