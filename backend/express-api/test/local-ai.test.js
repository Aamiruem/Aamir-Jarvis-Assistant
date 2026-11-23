// "Start the AI service" button: only on the owner's PC in development, never twice, never in production.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { _test, localStartAllowed, pythonFor, startLocalAi } from '../src/localAi.js';

const req = (ip) => ({ socket: { remoteAddress: ip } });

test('only requests from this machine may start it', () => {
  assert.equal(localStartAllowed(req('127.0.0.1')), true);
  assert.equal(localStartAllowed(req('::1')), true);
  assert.equal(localStartAllowed(req('192.168.1.20')), false);
  assert.equal(localStartAllowed(req('')), false);
});

test('never on Vercel', () => {
  process.env.VERCEL = '1';
  try {
    assert.equal(localStartAllowed(req('127.0.0.1')), false);
  } finally {
    delete process.env.VERCEL;
  }
});

test('starts once, detached, with the virtualenv python; not again while starting; not when already up', async () => {
  _test.reset();
  const calls = [];
  const spawnFn = (cmd, args, opts) => { calls.push({ cmd, args, opts }); return { pid: 4242, unref() {} }; };
  let t = 1_000_000;
  const r = await startLocalAi({ spawnFn, check: async () => null, now: () => t });
  assert.deepEqual(r.status, 'started');
  assert.equal(r.pid, 4242);
  assert.equal(calls[0].cmd, pythonFor());
  assert.deepEqual(calls[0].args, ['main.py']);
  assert.equal(calls[0].opts.detached, true);
  assert.match(calls[0].opts.cwd.split(String.fromCharCode(92)).join('/'), /backend\/fastapi-ai\/app$/);
  t += 5_000;
  assert.equal((await startLocalAi({ spawnFn, check: async () => null, now: () => t })).status, 'starting');
  assert.equal((await startLocalAi({ spawnFn, check: async () => ({ status: 'ok' }), now: () => t })).status, 'already_running');
  assert.equal(calls.length, 1);
});
