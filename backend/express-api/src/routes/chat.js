import { Router } from 'express';
import { aiDownMessage, aiHeaders, markAiDown, waitForAi } from '../ai.js';
import { config } from '../config.js';

const HISTORY_TURNS = 20;

export function createChatRouter({ requireAuth, conversations }) {
  const router = Router();

  /**
   * POST /api/chat  { message, conversationId? }
   * Streams Server-Sent Events from the Python agent straight to the browser,
   * while collecting the reply so the whole turn can be saved to the conversation store.
   */
  router.post('/', requireAuth, (req, res) => streamChat(req, res, conversations));
  return router;
}

/** Plain-language reason a chat turn couldn't reach the Python AI service. */
function gatewayError(err) {
  const code = err.cause?.code || err.code;
  if (code === 'ECONNREFUSED' || err.message === 'fetch failed') return aiDownMessage();
  if (err.name === 'TimeoutError' || code === 'IDLE_TIMEOUT') {
    return 'Jarvis stopped answering (nothing arrived for a while). Please try again.';
  }
  return `Couldn't reach the AI service: ${err.message}`;
}

const isRefused = (err) => (err.cause?.code || err.code) === 'ECONNREFUSED';
const HEARTBEAT_MS = 15_000;

async function streamChat(req, res, conversations) {
  const { message, conversationId, voice } = req.body || {};
  if (typeof message !== 'string' || !message.trim()) return res.status(400).json({ error: 'message is required' });
  if (message.length > 20000) return res.status(413).json({ error: 'message is too long' });

  let convo = conversationId ? await conversations.findForUser(req.user.id, String(conversationId)) : null;
  convo ??= await conversations.create({ userId: req.user.id, title: message.slice(0, 60) });

  const history = convo.messages.slice(-HISTORY_TURNS).map(({ role, content }) => ({ role, content }));

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no', // disable nginx buffering
  });
  const send = (obj) => res.write(`data: ${JSON.stringify(obj)}\n\n`);
  send({ type: 'conversation', id: convo._id, title: convo.title });

  const abort = new AbortController();
  res.on('close', () => {
    if (!res.writableEnded) abort.abort();
  });
  // SSE comment lines keep idle connections (proxies, Wi-Fi sleep) open; browsers ignore them.
  const heartbeat = setInterval(() => res.write(': ping\n\n'), HEARTBEAT_MS);
  // A reply that sends nothing for chatIdleMs is treated as dead, so the UI never waits forever.
  let idle;
  const touch = () => {
    clearTimeout(idle);
    idle = setTimeout(() => abort.abort(Object.assign(new Error('idle'), { code: 'IDLE_TIMEOUT' })), config.chatIdleMs);
  };
  touch();

  let reply = '';
  let intent;
  const tools = [];

  try {
    const open = () =>
      fetch(`${config.aiServiceUrl}/chat/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...aiHeaders(req.user) },
        body: JSON.stringify({ message, history, voice: voice === true }),
        signal: abort.signal,
      });
    let upstream;
    try {
      upstream = await open();
    } catch (err) {
      // Refused = nothing was sent yet, so waiting for a restart and sending again is safe.
      if (!isRefused(err) || abort.signal.aborted) throw err;
      markAiDown();
      send({ type: 'status', message: 'Reconnecting to the AI service…' });
      clearTimeout(idle); // waiting for a restart has its own limit (aiWaitMs)
      if (!(await waitForAi(config.aiWaitMs, { signal: abort.signal, recheck: true }))) throw err;
      touch();
      upstream = await open();
    }
    if (!upstream.ok) throw new Error(`AI service responded ${upstream.status}`);

    const decoder = new TextDecoder();
    let buffer = '';
    for await (const chunk of upstream.body) {
      touch();
      const text = decoder.decode(chunk, { stream: true });
      res.write(text); // pass through untouched
      buffer += text;
      const events = buffer.split('\n\n');
      buffer = events.pop();
      for (const raw of events) {
        if (!raw.startsWith('data: ')) continue;
        let ev;
        try {
          ev = JSON.parse(raw.slice(6));
        } catch {
          continue; // a malformed event shouldn't end the whole reply
        }
        if (ev.type === 'text') reply += ev.text;
        else if (ev.type === 'tool') tools.push(ev.name);
        else if (ev.type === 'nlp') intent = ev.intent;
      }
    }
  } catch (err) {
    const idleTimeout = abort.signal.reason?.code === 'IDLE_TIMEOUT';
    if (abort.signal.aborted && !idleTimeout) return; // the browser went away
    send({ type: 'error', message: gatewayError(idleTimeout ? abort.signal.reason : err) });
    send({ type: 'done', usage: {}, tools: [] });
  } finally {
    clearInterval(heartbeat);
    clearTimeout(idle);
  }

  if (reply) {
    await conversations.appendMessages(convo._id, [
      { role: 'user', content: message, intent },
      { role: 'assistant', content: reply, tools },
    ]);
  }
  res.end();
}
