// Running several API replicas behind a load balancer: the state they must share really is
// shared. Uses a real MongoDB (a throwaway database, dropped afterwards); skipped without one.
import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import express from 'express';
import rateLimit from 'express-rate-limit';
import mongoose from 'mongoose';

process.env.NODE_ENV = 'test';
const MONGO = process.env.TEST_MONGO_URI || `mongodb://127.0.0.1:27017/azarvis_scale_test_${process.pid}`;

let mongoUp = false;
let MongoRateLimitStore, InMemoryChallengeRepository, MongoChallengeRepository, PasskeyService;

before(async () => {
  ({ MongoRateLimitStore } = await import('../src/scale/MongoRateLimitStore.js'));
  ({ InMemoryChallengeRepository } = await import('../src/repositories/memory.js'));
  ({ MongoChallengeRepository } = await import('../src/repositories/mongo.js'));
  ({ PasskeyService } = await import('../src/auth/PasskeyService.js'));
  try {
    await mongoose.connect(MONGO, { serverSelectionTimeoutMS: 1500 });
    mongoUp = true;
  } catch {
    await mongoose.disconnect().catch(() => {});
  }
});

after(async () => {
  if (mongoUp) {
    await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
  }
});

const needsMongo = (t) => {
  if (!mongoUp) t.skip('MongoDB is not running');
  return !mongoUp;
};

/** A tiny "replica": its own Express app and its own limiter, sharing only the database. */
async function replica(prefix, limit) {
  const app = express();
  app.use(rateLimit({ windowMs: 60_000, limit, standardHeaders: true, legacyHeaders: false, store: new MongoRateLimitStore({ prefix }) }));
  app.get('/', (_req, res) => res.send('ok'));
  const server = app.listen(0);
  await new Promise((r) => server.once('listening', r));
  return { url: `http://127.0.0.1:${server.address().port}/`, close: () => server.close() };
}

test('rate limits count across replicas, not per replica', async (t) => {
  if (needsMongo(t)) return;
  const a = await replica('shared-login', 3);
  const b = await replica('shared-login', 3);
  try {
    // The load balancer alternates between the two replicas.
    const statuses = [];
    for (const r of [a, b, a, b, a]) statuses.push((await fetch(r.url)).status);
    assert.deepEqual(statuses, [200, 200, 200, 429, 429]); // per-replica counters would have allowed 6
  } finally {
    a.close();
    b.close();
  }
});

test('the shared counter is exact under many simultaneous requests', async (t) => {
  if (needsMongo(t)) return;
  const stores = [1, 2, 3].map(() => new MongoRateLimitStore({ prefix: 'burst' }));
  for (const s of stores) s.init({ windowMs: 60_000 });
  const results = await Promise.all(Array.from({ length: 60 }, (_, i) => stores[i % 3].increment('1.2.3.4')));
  assert.deepEqual(results.map((r) => r.totalHits).sort((x, y) => x - y), Array.from({ length: 60 }, (_, i) => i + 1));
  assert.ok(results.every((r) => r.resetTime instanceof Date));
});

test('a new window starts after the old one ends; decrement and reset work', async (t) => {
  if (needsMongo(t)) return;
  const store = new MongoRateLimitStore({ prefix: 'window' });
  store.init({ windowMs: 150 });
  assert.equal((await store.increment('k')).totalHits, 1);
  assert.equal((await store.increment('k')).totalHits, 2);
  await store.decrement('k');
  assert.equal((await store.increment('k')).totalHits, 2);
  await new Promise((r) => setTimeout(r, 200));
  assert.equal((await store.increment('k')).totalHits, 1, 'expired window starts over');
  await store.resetKey('k');
  assert.equal((await store.increment('k')).totalHits, 1);
  // Different limiters never share counts.
  const other = new MongoRateLimitStore({ prefix: 'other' });
  other.init({ windowMs: 60_000 });
  assert.equal((await other.increment('k')).totalHits, 1);
});

test('a passkey challenge can be taken only once, even by two replicas at the same moment', async (t) => {
  if (needsMongo(t)) return;
  const repo = new MongoChallengeRepository();
  const saved = await repo.create({ challenge: 'abc', purpose: 'login', origin: 'http://localhost:5173', rpID: 'localhost', expiresAt: new Date(Date.now() + 60_000) });
  const [first, second] = await Promise.all([repo.take(saved.id), repo.take(saved.id)]);
  assert.equal([first, second].filter(Boolean).length, 1);
  assert.equal((first || second).challenge, 'abc');
});

test('passkey sign-in works when its two steps reach different replicas', async () => {
  const challenges = new InMemoryChallengeRepository(); // stands in for the shared database
  const users = { findByEmail: async () => null, findById: async () => null };
  const audit = { log: async () => {} };
  const passkeys = { listForUser: async () => [], findByCredentialId: async () => null };
  const make = () => new PasskeyService({ passkeys, challenges, users, audit, authService: {}, origins: ['http://localhost:5173'] });
  const replicaA = make();
  const replicaB = make();
  const { challengeId } = await replicaA.loginOptions({}, 'http://localhost:5173');
  // Replica B finds the challenge replica A made: the passkey itself is the next check (unknown here).
  await assert.rejects(replicaB.login({ challengeId, response: { id: 'unknown-key' } }), /not linked/);
  // And it was used up.
  await assert.rejects(replicaA.login({ challengeId, response: { id: 'unknown-key' } }), /expired/);
});
