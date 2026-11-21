// The tunnel address `npm run live` registers: only a plain https tunnel origin is accepted, and
// only with the real (non-default) internal key.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import express from 'express';
import { aiEndpointRoutes, validTunnelUrl } from '../src/aiEndpoint.js';
import { config } from '../src/config.js';

test('only an https trycloudflare origin is a valid tunnel address', () => {
  assert.equal(validTunnelUrl('https://bright-sun-42.trycloudflare.com'), 'https://bright-sun-42.trycloudflare.com');
  assert.equal(validTunnelUrl('https://bright-sun-42.trycloudflare.com/'), 'https://bright-sun-42.trycloudflare.com');
  for (const bad of [
    'http://bright-sun-42.trycloudflare.com', // not https
    'https://evil.example.com', // not a tunnel host
    'https://trycloudflare.com.evil.com',
    'https://a.trycloudflare.com/admin', // a path
    'https://user:pw@a.trycloudflare.com',
    'not a url',
    undefined,
  ]) assert.equal(validTunnelUrl(bad), null, String(bad));
});

test('registering needs the real internal key', async () => {
  const app = express();
  app.use(express.json());
  aiEndpointRoutes(app);
  const server = app.listen(0);
  const base = `http://127.0.0.1:${server.address().port}`;
  const post = (key) =>
    fetch(`${base}/api/internal/ai-endpoint`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(key ? { 'X-Internal-Key': key } : {}) },
      body: JSON.stringify({ url: 'https://bright-sun-42.trycloudflare.com' }),
    });
  try {
    assert.equal((await post()).status, 401);
    assert.equal((await post('wrong-key')).status, 401);
    const original = config.internalApiKey;
    config.internalApiKey = 'change-me-internal-key'; // the public default never works for this
    assert.equal((await post('change-me-internal-key')).status, 401);
    config.internalApiKey = 'a-real-secret-key-for-this-test';
    const res = await post('a-real-secret-key-for-this-test');
    assert.equal(res.status, 503); // right key; no database in this test to remember it
    config.internalApiKey = original;
  } finally {
    server.close();
  }
});
