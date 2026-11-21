// Where the AI service is right now.
//
// Normally that is AI_SERVICE_URL (localhost on your PC, or a hosted service). The hosted website
// can also reach the AI service on the owner's PC through a tunnel: `npm run live` starts a tunnel
// and registers its https address here (POST /api/internal/ai-endpoint, X-Internal-Key), and repeats
// that every minute. The address is kept in MongoDB, so every serverless instance sees it; a
// registration older than STALE_MS counts as gone (the PC was switched off).
import crypto from 'node:crypto';
import mongoose from 'mongoose';
import { config } from './config.js';

const STALE_MS = 3 * 60_000; // no heartbeat for this long: the PC is gone
const CACHE_MS = 15_000; // how long one instance trusts what it read
const DOC = 'ai_endpoint';
// Tunnel hosts a registration may point at (an https URL on one of these, nothing else).
const ALLOWED_HOSTS = (process.env.AI_ENDPOINT_HOSTS || '.trycloudflare.com').split(',').map((h) => h.trim()).filter(Boolean);

let cache = { url: null, at: 0 };

const collection = () => (mongoose.connection.readyState === 1 ? mongoose.connection.db.collection('app_settings') : null);

/** The registered tunnel address, if one is fresh. Never throws. */
async function registered() {
  const col = collection();
  if (!col) return null;
  try {
    const doc = await col.findOne({ _id: DOC });
    return doc && Date.now() - new Date(doc.at).getTime() < STALE_MS ? doc.url : null;
  } catch {
    return null;
  }
}

/** The AI service's base URL to use now (async: may read the database, cached for 15 s). */
export async function resolveAiUrl() {
  if (Date.now() - cache.at < CACHE_MS) return cache.url || config.aiServiceUrl;
  cache = { url: await registered(), at: Date.now() };
  return cache.url || config.aiServiceUrl;
}

/** The last resolved URL, for code that can't wait (the proxy's router). */
export const aiUrlNow = () => cache.url || config.aiServiceUrl;

/** True when the website reaches the AI service through the owner's PC (a registered tunnel). */
export const usingTunnel = () => Boolean(cache.url);

export function validTunnelUrl(raw) {
  let u;
  try {
    u = new URL(raw);
  } catch {
    return null;
  }
  if (u.protocol !== 'https:' || u.username || u.password || u.pathname !== '/' || u.search) return null;
  if (!ALLOWED_HOSTS.some((h) => (h.startsWith('.') ? u.hostname.endsWith(h) : u.hostname === h))) return null;
  return u.origin;
}

function keyOk(given) {
  const want = config.internalApiKey;
  if (!given || !want || want === 'change-me-internal-key') return false;
  const a = Buffer.from(String(given));
  const b = Buffer.from(want);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

/** Express handlers: register (POST {url}) or clear (DELETE) the tunnel address. Owner's PC only. */
export function aiEndpointRoutes(app) {
  app.post('/api/internal/ai-endpoint', async (req, res) => {
    if (!keyOk(req.get('X-Internal-Key'))) return res.status(401).json({ error: 'Invalid internal key' });
    const url = validTunnelUrl(req.body?.url);
    if (!url) return res.status(400).json({ error: `url must be https://<name>${ALLOWED_HOSTS[0]} with no path` });
    const col = collection();
    if (!col) return res.status(503).json({ error: 'No database here to remember the address' });
    await col.updateOne({ _id: DOC }, { $set: { url, at: new Date() } }, { upsert: true });
    cache = { url, at: Date.now() };
    res.json({ ok: true, url, staleAfterSeconds: STALE_MS / 1000 });
  });
  app.delete('/api/internal/ai-endpoint', async (req, res) => {
    if (!keyOk(req.get('X-Internal-Key'))) return res.status(401).json({ error: 'Invalid internal key' });
    await collection()?.deleteOne({ _id: DOC });
    cache = { url: null, at: Date.now() };
    res.json({ ok: true });
  });
}
