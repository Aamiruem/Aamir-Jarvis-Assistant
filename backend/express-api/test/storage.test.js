// File storage (the development fallback when MongoDB isn't running) and the conversation repository.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { after, test } from 'node:test';

process.env.NODE_ENV = 'test';
const { InMemoryConversationRepository, InMemoryUserRepository } = await import('../src/repositories/memory.js');
const { createContainer } = await import('../src/container.js');
const { createApp } = await import('../src/app.js');
const { MemorySender } = await import('../src/auth/notifiers.js');

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'jarvis-storage-'));
after(() => fs.rmSync(tmp, { recursive: true, force: true }));

test('file-backed repositories survive a restart, dates included', async () => {
  const file = path.join(tmp, 'users.json');
  const first = new InMemoryUserRepository({ file });
  const u = await first.create({ name: 'Aamir', email: 'Aamir@Example.com', passwordHash: 'x' });
  await first.update(u.id, { lockUntil: new Date('2030-01-01T00:00:00Z') });

  const second = new InMemoryUserRepository({ file }); // a new process reading the same file
  const loaded = await second.findByEmail('aamir@example.com');
  assert.equal(loaded.name, 'Aamir');
  assert.ok(loaded.lockUntil instanceof Date);
  assert.ok(loaded.createdAt instanceof Date);
  const next = await second.create({ name: 'B', email: 'b@example.com', passwordHash: 'x' });
  assert.notEqual(next.id, u.id); // id counter continues, no collisions
});

test('conversations are private to their owner', async () => {
  const repo = new InMemoryConversationRepository({ file: path.join(tmp, 'conversations.json') });
  const c = await repo.create({ userId: 'u1', title: 'Weather' });
  await repo.appendMessages(c._id, [{ role: 'user', content: 'Will it rain in Pune?' }, { role: 'assistant', content: 'Yes.' }]);

  assert.equal((await repo.findForUser('u1', c._id)).messages.length, 2);
  assert.equal(await repo.findForUser('u2', c._id), null);
  assert.equal(await repo.rename('u2', c._id, 'hijack'), null);
  await repo.deleteForUser('u2', c._id);
  assert.equal(await repo.count(), 1);

  assert.deepEqual((await repo.listForUser('u1', { q: 'pune' })).map((x) => x.title), ['Weather']);
  assert.deepEqual(await repo.listForUser('u1', { q: 'mumbai' }), []);
  assert.equal((await repo.rename('u1', c._id, 'Rain')).title, 'Rain');

  const reloaded = new InMemoryConversationRepository({ file: path.join(tmp, 'conversations.json') });
  assert.equal((await reloaded.findForUser('u1', c._id)).title, 'Rain');
});

test('sign-up and the conversation API work with file storage', async () => {
  const inbox = new MemorySender();
  const container = createContainer({ storage: 'file', dataDir: path.join(tmp, 'app'), notifier: inbox, purgeUserData: async () => {} });
  const server = createApp(container).listen(0);
  const base = `http://localhost:${server.address().port}/api`;
  const post = (p, body, token) =>
    fetch(base + p, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(token && { Authorization: `Bearer ${token}` }) },
      body: JSON.stringify(body),
    });
  try {
    const reg = await post('/auth/register', { name: 'Aamir Hussain Azad', email: 'aamir@example.com', password: 'Str0ng!Passw0rd#' });
    assert.equal(reg.status, 201, await reg.clone().text());
    const { challengeId } = await reg.json();
    const code = inbox.lastCode('aamir@example.com');
    const verified = await post('/auth/verify-email', { challengeId, code });
    assert.equal(verified.status, 200, await verified.clone().text());
    const { accessToken } = await verified.json();

    const list = await fetch(`${base}/conversations`, { headers: { Authorization: `Bearer ${accessToken}` } });
    assert.equal(list.status, 200);
    assert.deepEqual(await list.json(), []);
    assert.ok(fs.existsSync(path.join(tmp, 'app', 'users.json')));

    const health = await (await fetch(`${base}/health`)).json();
    assert.equal(health.storage, 'file');
  } finally {
    server.close();
  }
});
