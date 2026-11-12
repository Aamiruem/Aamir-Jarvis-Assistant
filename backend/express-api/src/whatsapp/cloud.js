// The official WhatsApp Cloud API (Meta, graph.facebook.com). Free tier: replies within 24 hours of
// the user's last message cost nothing; Meta also gives a free test number for development.
import crypto from 'node:crypto';

export function createCloudApi({ token, phoneNumberId, apiVersion = 'v21.0', graphUrl = 'https://graph.facebook.com' }, fetchImpl = fetch) {
  const auth = { Authorization: `Bearer ${token}` };
  const call = async (path, init = {}) => {
    const res = await fetchImpl(`${graphUrl}/${apiVersion}/${path}`, { ...init, headers: { ...auth, ...(init.headers || {}) }, signal: AbortSignal.timeout(15_000) });
    if (!res.ok) {
      const detail = await res.text().catch(() => '');
      throw new Error(`WhatsApp API responded ${res.status}: ${detail.slice(0, 300)}`);
    }
    return res;
  };
  return {
    enabled: Boolean(token && phoneNumberId),

    /** Sends a text message. to: digits with country code, e.g. 9198xxxxxxxx. */
    async sendText(to, body) {
      const res = await call(`${phoneNumberId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messaging_product: 'whatsapp', recipient_type: 'individual', to, type: 'text', text: { body: body.slice(0, 4096), preview_url: false } }),
      });
      return res.json();
    },

    /** Blue ticks + "typing…" while Azarvis works on the reply. */
    async markRead(messageId) {
      await call(`${phoneNumberId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messaging_product: 'whatsapp', status: 'read', message_id: messageId, typing_indicator: { type: 'text' } }),
      });
    },

    /** A voice note's bytes: first its temporary URL, then the file (both need the token). */
    async downloadMedia(mediaId) {
      const info = await (await call(encodeURIComponent(mediaId))).json();
      const file = await fetchImpl(info.url, { headers: auth, signal: AbortSignal.timeout(30_000) });
      if (!file.ok) throw new Error(`media download failed: ${file.status}`);
      return { buffer: Buffer.from(await file.arrayBuffer()), mime: info.mime_type || file.headers.get('content-type') || 'application/octet-stream' };
    },
  };
}

/** Meta signs every webhook call with the app secret: X-Hub-Signature-256: sha256=<hex HMAC of the raw body>. */
export function validSignature(rawBody, header, appSecret) {
  if (!appSecret || !header?.startsWith('sha256=')) return false;
  const expected = Buffer.from(crypto.createHmac('sha256', appSecret).update(rawBody).digest('hex'));
  const given = Buffer.from(header.slice(7));
  return given.length === expected.length && crypto.timingSafeEqual(given, expected);
}

/** The messages in one webhook call, flattened: [{ waId, from, name, type, text, mediaId }]. */
export function parseWebhook(body) {
  const out = [];
  for (const entry of body?.entry || []) {
    for (const change of entry.changes || []) {
      const value = change.value || {};
      const names = Object.fromEntries((value.contacts || []).map((c) => [c.wa_id, c.profile?.name || '']));
      for (const m of value.messages || []) {
        const type = m.type === 'audio' && m.audio?.voice ? 'voice' : m.type;
        out.push({
          waId: String(m.id || ''),
          from: String(m.from || '').replace(/\D/g, ''),
          name: (names[m.from] || '').slice(0, 80),
          type,
          text: (m.text?.body || m.button?.text || m.interactive?.button_reply?.title || m.image?.caption || '').slice(0, 4096),
          mediaId: m.audio?.id || m.voice?.id || '',
        });
      }
    }
  }
  return out.filter((m) => m.waId && m.from);
}
