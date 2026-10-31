// How the gateway copes with an AI service that restarts, hangs or misbehaves.
// The fake AI service below can be started late, stopped, or told how to answer a chat.
import assert from 'node:assert/strict';
import http from 'node:http';
import net from 'node:net';
import { after, before, test } from 'node:test';

let aiPort, ai, mode, server, baseUrl, container;

const freePort = () =>
  new Promise((resolve) => {
    const s = net.createServer().listen(0, () => {
      const { port } = s.address();
      s.close(() => resolve(port));
    });
  });

const sse = (res, events) => {
  res.writeHead(200, { 'Content-Type': 'text/event-stream' });
  for (const ev of events) res.write(typeof ev === 'string' ? ev : `data: ${JSON.stringify(ev)}\n\n`);
};

function startAi() {
  ai = http.createServer((req, res) => {
    if (req.url === '/health') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ status: 'ok', claude: 'invalid_key', system_control: true }));
    }
    if (req.url === '/chat/stream') {
      if (mode === 'hang') return sse(res, [{ type: 'nlp', intent: 'chat' }]); // then nothing, forever
      sse(res, [
        { type: 'nlp', intent: 'chat' },
        'data: {not json\n\n', // a broken event must not end the reply
        { type: 'text', text: 'Hello ' },
        { type: 'text', text: 'there' },
        { type: 'done', usage: {}, tools: [] },
      ]);
      return res.end();
    }
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end('[]');
  });
  return new Promise((r) => ai.listen(aiPort, '127.0.0.1', r));
}
const stopAi = () => new Promise((r) => (ai ? ai.close(r) : r()));

before(async () => {
  aiPort = await freePort();
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'test-secret';
  process.env.INTERNAL_API_KEY = 'test-internal';
  process.env.AI_SERVICE_URL = `http://127.0.0.1:${aiPort}`;
  process.env.AI_WAIT_MS = '4000';
  process.env.CHAT_IDLE_MS = '800';

  const { createApp } = await import('../src/app.js');
  const { createContainer } = await import('../src/container.js');
  container = createContainer({ storage: 'memory', notifier: { send: async () => {} } });
  server = createApp(container).listen(0);
  await new Promise((r) => server.once('listening', r));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  server?.close();
  await stopAi();
});

const token = () => container.tokens.signAccess({ id: 'user-1', name: 'Test', role: 'user' }, 'family-1');

async function chat(message) {
  const res = await fetch(`${baseUrl}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
    body: JSON.stringify({ message }),
  });
  const text = await res.text();
  return text
    .split('\n\n')
    .filter((p) => p.startsWith('data: '))
    .map((p) => {
      try {
        return JSON.parse(p.slice(6));
      } catch {
        return { type: 'unparsed' };
      }
    });
}

test('AI service down for good: chat says so after waiting, health reports it', async () => {
  const started = Date.now();
  const events = await chat('hello');
  assert.ok(Date.now() - started >= 3000, 'waited for the service to come back');
  assert.ok(events.some((e) => e.type === 'status' && /Reconnecting/.test(e.message)));
  const error = events.find((e) => e.type === 'error');
  assert.match(error.message, /isn't running/);
  assert.equal(events.at(-1).type, 'done');

  const health = await (await fetch(`${baseUrl}/api/health`)).json();
  assert.equal(health.ai, 'down');
});

test('AI service restarting: the chat waits and then gets the full reply', async () => {
  setTimeout(startAi, 1200); // comes back while the request is waiting
  const events = await chat('hi');
  assert.ok(events.some((e) => e.type === 'status'));
  assert.equal(events.filter((e) => e.type === 'text').map((e) => e.text).join(''), 'Hello there');
  assert.ok(!events.some((e) => e.type === 'error'));

  const [convo] = await container.conversations.listForUser('user-1');
  const saved = await container.conversations.findForUser('user-1', String(convo._id));
  assert.equal(saved.messages.at(-1).content, 'Hello there'); // the broken event was skipped, not fatal
});

test('health passes on Claude key and system-control status', async () => {
  const health = await (await fetch(`${baseUrl}/api/health`)).json();
  assert.deepEqual([health.ai, health.claude, health.systemControl], ['up', 'invalid_key', true]);
});

test('a reply that goes silent ends with a clear error instead of hanging', async () => {
  mode = 'hang';
  const events = await chat('this will hang');
  mode = undefined;
  assert.match(events.find((e) => e.type === 'error').message, /stopped answering/);
  assert.equal(events.at(-1).type, 'done');
});

test('proxy: requests wait for a restarting AI service instead of failing with 502', async () => {
  await stopAi();
  await fetch(`${baseUrl}/api/health`); // the gateway now knows the service is down
  setTimeout(startAi, 1000);
  const res = await fetch(`${baseUrl}/api/ai/tasks`, { headers: { Authorization: `Bearer ${token()}` } });
  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), []);
});

test('proxy: a service that stays down gets a 503 with a plain message', async () => {
  await stopAi();
  ai = null;
  await fetch(`${baseUrl}/api/health`);
  const res = await fetch(`${baseUrl}/api/ai/tasks`, { headers: { Authorization: `Bearer ${token()}` } });
  assert.equal(res.status, 503);
  assert.match((await res.json()).error, /npm run dev/);
});
