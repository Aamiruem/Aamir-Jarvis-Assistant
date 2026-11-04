// HTTP-level tests through the real Express app (in-memory repositories, no MongoDB).
// A fake AI service records what the gateway forwards to it.
import assert from 'node:assert/strict';
import http from 'node:http';
import { after, before, test } from 'node:test';

let upstream, lastUpstreamRequest, server, baseUrl, container, inbox;

before(async () => {
  upstream = http.createServer((req, res) => {
    lastUpstreamRequest = { url: req.url, headers: req.headers };
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end('[]');
  });
  await new Promise((r) => upstream.listen(0, r));

  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'test-secret';
  process.env.INTERNAL_API_KEY = 'test-internal';
  process.env.AUTH_RATE_LIMIT = '1000';
  process.env.AI_SERVICE_URL = `http://127.0.0.1:${upstream.address().port}`;

  // Import after env is set: config.js reads it at import time.
  const { createApp } = await import('../src/app.js');
  const { createContainer } = await import('../src/container.js');
  const { MemorySender } = await import('../src/auth/notifiers.js');
  inbox = new MemorySender();
  container = createContainer({ storage: 'memory', notifier: inbox });
  server = createApp(container).listen(0);
  await new Promise((r) => server.once('listening', r));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(() => {
  server?.close();
  upstream?.close();
});

const tokenFor = (id, role = 'user') => container.tokens.signAccess({ id, name: 'Test', role }, 'family-1');

async function call(path, { token, cookie, json, headers = {}, method } = {}) {
  const res = await fetch(`${baseUrl}${path}`, {
    method: method || (json ? 'POST' : 'GET'),
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(cookie ? { Cookie: cookie } : {}),
      ...(json ? { 'Content-Type': 'application/json' } : {}),
      ...headers,
    },
    body: json ? JSON.stringify(json) : undefined,
  });
  const text = await res.text();
  return { status: res.status, body: text ? JSON.parse(text) : null, setCookie: res.headers.getSetCookie() };
}

test('AI routes require a valid token', async () => {
  assert.equal((await call('/api/ai/tasks')).status, 401);
  assert.equal((await call('/api/ai/tasks', { token: 'garbage' })).status, 401);
});

test('proxy forwards identity from the JWT and ignores spoofed headers', async () => {
  const res = await call('/api/ai/tasks?include_done=true', {
    token: tokenFor('user-123'),
    headers: { 'X-User-Id': 'someone-else', 'X-User-Role': 'admin', 'X-Internal-Key': 'guess', Cookie: 'jarvis_rt=secret' },
  });
  assert.equal(res.status, 200);
  assert.equal(lastUpstreamRequest.url, '/tasks?include_done=true');
  assert.equal(lastUpstreamRequest.headers['x-user-id'], 'user-123');
  assert.equal(lastUpstreamRequest.headers['x-user-role'], 'user');
  assert.equal(lastUpstreamRequest.headers['x-internal-key'], 'test-internal');
  assert.equal(lastUpstreamRequest.headers.cookie, undefined);
});

test('full sign-up -> OTP -> login -> OTP -> refresh -> logout over HTTP', async () => {
  const reg = await call('/api/auth/register', { json: { name: 'Ravi', email: 'ravi@example.com', password: 'Gr8!Passphrase' } });
  assert.equal(reg.status, 201);
  assert.equal(reg.body.emailVerificationRequired, true);
  assert.equal(reg.body.code, undefined); // the code is never in the response

  const verified = await call('/api/auth/verify-email', { json: { challengeId: reg.body.challengeId, code: inbox.lastCode() } });
  assert.equal(verified.status, 200);
  assert.ok(verified.body.accessToken);
  assert.equal(verified.body.refreshToken, undefined); // only in the cookie
  const cookie = verified.setCookie.find((c) => c.startsWith('jarvis_rt='));
  assert.match(cookie, /HttpOnly/);
  assert.match(cookie, /SameSite=Strict/);
  assert.match(cookie, /Path=\/api\/auth/);

  const step1 = await call('/api/auth/login', { json: { email: 'ravi@example.com', password: 'Gr8!Passphrase' } });
  assert.equal(step1.body.mfaRequired, true);
  const bad = await call('/api/auth/login/verify', { json: { challengeId: step1.body.challengeId, code: '12345x' } });
  assert.equal(bad.status, 401);
  assert.equal(bad.body.code, 'UNAUTHENTICATED');
  const step2 = await call('/api/auth/login/verify', { json: { challengeId: step1.body.challengeId, code: inbox.lastCode() } });
  const rt = step2.setCookie[0].split(';')[0];

  const me = await call('/api/auth/me', { token: step2.body.accessToken });
  assert.equal(me.body.email, 'ravi@example.com');

  const refreshed = await call('/api/auth/refresh', { method: 'POST', cookie: rt });
  assert.equal(refreshed.status, 200);
  assert.ok(refreshed.body.accessToken);

  const sessions = await call('/api/auth/sessions', { token: refreshed.body.accessToken });
  assert.equal(sessions.body.length, 2);

  const newRt = refreshed.setCookie[0].split(';')[0];
  assert.equal((await call('/api/auth/logout', { method: 'POST', cookie: newRt })).status, 204);
  assert.equal((await call('/api/auth/refresh', { method: 'POST', cookie: newRt })).status, 401);
});

test('locked accounts get HTTP 423', async () => {
  const reg = await call('/api/auth/register', { json: { name: 'Lock', email: 'lock@example.com', password: 'Gr8!Passphrase' } });
  await call('/api/auth/verify-email', { json: { challengeId: reg.body.challengeId, code: inbox.lastCode() } });
  let last;
  for (let i = 0; i < 5; i++) last = await call('/api/auth/login', { json: { email: 'lock@example.com', password: 'Wrong!Pass123' } });
  assert.equal(last.status, 423);
  assert.equal(last.body.code, 'LOCKED');
});

test('admin routes reject normal users', async () => {
  assert.equal((await call('/api/admin/overview', { token: tokenFor('u1') })).status, 403);
});

test('chat requires a message', async () => {
  const res = await call('/api/chat', { token: tokenFor('u1'), json: { message: '   ' } });
  assert.equal(res.status, 400);
});

test('unknown API routes return JSON 404', async () => {
  const res = await call('/api/nope');
  assert.equal(res.status, 404);
  assert.deepEqual(res.body, { error: 'Not found' });
});

test('network addresses for the phone link are for signed-in users only', async () => {
  assert.equal((await call('/api/system/network')).status, 401);
  const { status, body } = await call('/api/system/network', { token: tokenFor('u-net') });
  assert.equal(status, 200);
  assert.ok(Array.isArray(body.lanAddresses));
  assert.ok(body.lanAddresses.every((ip) => /^\d+\.\d+\.\d+\.\d+$/.test(ip) && ip !== '127.0.0.1'));
});
