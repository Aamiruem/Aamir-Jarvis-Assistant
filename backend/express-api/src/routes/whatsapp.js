// WhatsApp Jarvis on the public API (see config.whatsapp and backend/fastapi-ai/app/whatsapp/).
//
//   GET  /api/whatsapp/webhook          Meta's one-time check (hub.verify_token)
//   POST /api/whatsapp/webhook          incoming messages (signature checked), queued for the PC
//   GET  /api/whatsapp/relay/pull       the owner's PC fetches new messages (X-Relay-Key)
//   POST /api/whatsapp/relay/send       ...and sends replies: to the owner, or to someone who wrote in the last 24 h
//   GET  /api/whatsapp/relay/media/:id  ...and downloads voice notes
//   GET  /api/whatsapp/status           public: is it set up? is the PC connected? (no secrets, no numbers)
//
// The access token never leaves this server. When the PC hasn't pulled for a while, the owner
// gets one "my PC is offline, I saved your message" reply, so a message is never silently lost.
import crypto from 'node:crypto';
import express, { Router } from 'express';
import { createCloudApi, parseWebhook, validSignature } from '../whatsapp/cloud.js';

const PC_OFFLINE_MS = 45_000;
const OFFLINE_NOTICE_EVERY_MS = 10 * 60_000;
const DAY_MS = 24 * 3600_000;

const sameSecret = (a = '', b = '') => {
  const x = Buffer.from(String(a));
  const y = Buffer.from(String(b));
  return x.length === y.length && x.length > 0 && crypto.timingSafeEqual(x, y);
};

export function createWhatsAppRouter({ repo, settings, cloud = createCloudApi(settings), production = process.env.NODE_ENV === 'production', now = () => Date.now() }) {
  const router = Router();
  const ready = () => cloud.enabled && Boolean(settings.ownerNumber);

  router.get('/status', async (_req, res) => {
    const lastPull = await repo.getState('lastPull');
    res.json({ configured: ready(), pcConnected: Boolean(lastPull && now() - lastPull < PC_OFFLINE_MS), lastPull: lastPull || null });
  });

  // Meta's verification when the webhook URL is saved in the developer dashboard.
  router.get('/webhook', (req, res) => {
    const ok = req.query['hub.mode'] === 'subscribe' && settings.verifyToken && sameSecret(req.query['hub.verify_token'], settings.verifyToken);
    if (!ok) return res.sendStatus(403);
    res.type('text/plain').send(String(req.query['hub.challenge'] ?? ''));
  });

  // Incoming messages. Raw body: the signature is over the exact bytes Meta sent.
  router.post('/webhook', express.raw({ type: '*/*', limit: '1mb' }), async (req, res, next) => {
    try {
      const raw = Buffer.isBuffer(req.body) ? req.body : Buffer.from('');
      if (settings.appSecret) {
        if (!validSignature(raw, req.get('x-hub-signature-256'), settings.appSecret)) return res.sendStatus(401);
      } else if (production) {
        return res.status(503).json({ error: 'Set WHATSAPP_APP_SECRET', code: 'WHATSAPP_NOT_CONFIGURED' });
      }
      let body;
      try {
        body = JSON.parse(raw.toString('utf8') || '{}');
      } catch {
        return res.sendStatus(400);
      }
      const messages = parseWebhook(body);
      // Answer Meta at once (it retries slow webhooks), then do the rest.
      res.sendStatus(200);
      for (const m of messages) {
        const saved = await repo.saveIncoming({ ...m, owner: Boolean(settings.ownerNumber) && m.from === settings.ownerNumber, receivedAt: new Date(now()) });
        if (!saved || !ready()) continue;
        cloud.markRead(m.waId).catch(() => {});
        if (saved.owner) await offlineNotice(m.from);
      }
    } catch (err) {
      if (!res.headersSent) next(err);
      else console.error('whatsapp webhook:', err.message);
    }
  });

  async function offlineNotice(to) {
    const lastPull = await repo.getState('lastPull');
    if (lastPull && now() - lastPull < PC_OFFLINE_MS) return; // the PC will answer in a few seconds
    const lastNotice = await repo.getState('lastOfflineNotice');
    if (lastNotice && now() - lastNotice < OFFLINE_NOTICE_EVERY_MS) return;
    await repo.setState('lastOfflineNotice', now());
    await cloud
      .sendText(to, '🖥️ My brain runs on your PC, and it is offline right now. I saved your message: I will do it and reply as soon as your PC is on (start Azarvis with npm run dev).')
      .catch((err) => console.error('whatsapp offline notice:', err.message));
  }

  // ---------- the relay, for the owner's PC ----------
  const relayAuth = (req, res, next) => {
    if (!settings.relayKey) return res.status(503).json({ error: 'Set WHATSAPP_RELAY_KEY', code: 'WHATSAPP_NOT_CONFIGURED' });
    if (!sameSecret(req.get('x-relay-key'), settings.relayKey)) return res.status(401).json({ error: 'Bad relay key', code: 'UNAUTHORIZED' });
    next();
  };

  router.get('/relay/pull', relayAuth, async (_req, res) => {
    await repo.setState('lastPull', now());
    const rows = await repo.claimPending(20);
    res.json({ messages: rows.map(({ id, waId, from, name, type, text, mediaId, owner, createdAt }) => ({ id, waId, from, name, type, text, mediaId, owner, createdAt })) });
  });

  router.post('/relay/send', relayAuth, express.json({ limit: '64kb' }), async (req, res, next) => {
    try {
      if (!ready()) return res.status(503).json({ error: 'WhatsApp is not set up on the server', code: 'WHATSAPP_NOT_CONFIGURED' });
      const text = String(req.body?.text || '').trim();
      const to = String(req.body?.to || settings.ownerNumber).replace(/\D/g, '');
      if (!text) return res.status(400).json({ error: 'text is required', code: 'VALIDATION' });
      // Only the owner, or someone who wrote in the last 24 hours (the owner approved that reply on the PC).
      if (to !== settings.ownerNumber && !(await repo.wroteSince(to, new Date(now() - DAY_MS)))) {
        return res.status(403).json({ error: 'Can only message the owner or someone who wrote in the last 24 hours', code: 'FORBIDDEN' });
      }
      const sent = await cloud.sendText(to, text);
      res.json({ ok: true, id: sent?.messages?.[0]?.id ?? null });
    } catch (err) {
      next(err);
    }
  });

  router.get('/relay/media/:id', relayAuth, async (req, res, next) => {
    try {
      if (!/^[\w.-]{1,128}$/.test(req.params.id)) return res.status(400).json({ error: 'Bad media id', code: 'VALIDATION' });
      const { buffer, mime } = await cloud.downloadMedia(req.params.id);
      res.type(mime).send(buffer);
    } catch (err) {
      next(err);
    }
  });

  return router;
}
