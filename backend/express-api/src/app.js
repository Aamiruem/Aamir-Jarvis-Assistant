import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { createProxyMiddleware } from 'http-proxy-middleware';
import mongoose from 'mongoose';
import crypto from 'node:crypto';
import os from 'node:os';
import morgan from 'morgan';
import { aiGate, aiHeaders, checkAi, markAiDown } from './ai.js';
import { AppError } from './auth/errors.js';
import { config } from './config.js';
import { logServerError } from './errorLog.js';
import { createAuthMiddleware } from './middleware/auth.js';
import { createAdminRouter } from './routes/admin.js';
import { createAuthRouter } from './routes/auth.js';
import { createChatRouter } from './routes/chat.js';
import { createConversationRouter } from './routes/conversations.js';
import { createFeedbackRouter } from './routes/feedback.js';
import { createUserNotesRouter } from './routes/user-notes.js';

/**
 * Builds the Express app from a container (see container.js). It doesn't connect to MongoDB
 * or listen on a port, so tests can create it with in-memory repositories.
 */
export function createApp(container) {
  const app = express();
  const { requireAuth, requireAdmin } = createAuthMiddleware(container.tokens);

  app.set('trust proxy', 1); // behind nginx / a load balancer: real client IP for rate limits & audit
  // draining: set on shutdown (index.js) so the load balancer stops sending new requests here.
  app.locals.draining = false;
  const instance = `${os.hostname()}:${process.pid}`;

  // Every request gets an id (nginx's, when it sent one), echoed back and passed to the AI
  // service, so one request can be followed through the load balancer, a replica and Python.
  app.use((req, res, next) => {
    const given = req.get('x-request-id');
    req.id = given && /^[\w-]{8,64}$/.test(given) ? given : crypto.randomUUID();
    res.set('X-Request-Id', req.id);
    next();
  });
  app.use(helmet());
  app.use(cors({ origin: config.corsOrigins, credentials: true, exposedHeaders: ['X-Request-Id'] }));
  app.use(cookieParser());
  if (config.env !== 'test') {
    morgan.token('id', (req) => req.id.slice(0, 8));
    app.use(morgan(':id :method :url :status :response-time ms'));
  }

  // Load-balancer probes. live: the process answers. ready: it can serve traffic right now
  // (database connected, not shutting down). Neither touches the AI service, so they stay fast.
  app.get('/api/health/live', (_req, res) => res.json({ status: 'live' }));
  app.get('/api/health/ready', (_req, res) => {
    const dbReady = container.storage !== 'mongo' || mongoose.connection.readyState === 1;
    const ready = dbReady && !app.locals.draining;
    res.status(ready ? 200 : 503).json({ status: ready ? 'ready' : app.locals.draining ? 'draining' : 'database_down', instance });
  });

  // Rate limits are shared by every replica when the store is MongoDB (see scale/MongoRateLimitStore.js).
  // passOnStoreError: if the counter itself is briefly unreachable, serve the request rather than fail it.
  const limit = (prefix, options) =>
    rateLimit({ standardHeaders: true, legacyHeaders: false, passOnStoreError: true, store: container.rateLimitStore?.(prefix), ...options });
  app.use('/api', limit('api', { windowMs: 60_000, limit: 300, skip: (req) => req.path.startsWith('/health') }));

  // Everything under /api/ai/* (RAG, vision, NLP, tasks, memory, notifications, stats) is
  // forwarded to the Python FastAPI service after the JWT check. User identity headers come
  // from the verified token and overwrite anything the browser tried to send.
  // Mounted BEFORE express.json() so file uploads stream straight through.
  app.use(
    '/api/ai',
    requireAuth,
    aiGate(), // while the AI service restarts, wait for it instead of answering 502
    createProxyMiddleware({
      target: config.aiServiceUrl,
      changeOrigin: true,
      proxyTimeout: 120_000, // a hung AI service can't hold a request forever (uploads/indexing included)
      on: {
        proxyReq: (proxyReq, req) => {
          for (const [name, value] of Object.entries(aiHeaders(req.user))) proxyReq.setHeader(name, value);
          proxyReq.setHeader('X-Request-Id', req.id);
          proxyReq.removeHeader('cookie'); // the AI service never needs the session cookie
        },
        error: (err, _req, res) => {
          if (err.code === 'ECONNREFUSED') markAiDown();
          if (!res.headersSent) res.writeHead(502, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'AI service unavailable', code: 'AI_UNAVAILABLE' }));
        },
      },
    }),
  );

  app.use(express.json({ limit: '1mb' }));
  app.use('/api/auth', createAuthRouter({ authService: container.authService, passkeyService: container.passkeyService, requireAuth, settings: container.settings, limit }));
  const { users, conversations, sessions, audit, notes, feedback } = container;
  app.use('/api/conversations', createConversationRouter({ requireAuth, conversations }));
  app.use('/api/chat', createChatRouter({ requireAuth, conversations }));
  app.use('/api/user-notes', createUserNotesRouter({ requireAuth, notes }));
  // Public: the website's feedback form works without an account (rate-limited per IP).
  app.use('/api/feedback', createFeedbackRouter({ feedback, tokens: container.tokens, settings: container.settings, limit }));
  app.use('/api/admin', createAdminRouter({ requireAuth, requireAdmin, users, conversations, sessions, audit, feedback }));

  app.get('/api/health', async (_req, res) => {
    const info = await checkAi(); // 2 s timeout, so a hung AI service can't hang the health check
    res.json({
      server: 'up',
      storage: container.storage, // "mongo", or "file" when MongoDB wasn't reachable in development
      mongo: mongoose.connection.readyState === 1 ? 'up' : 'down',
      ai: info ? 'up' : 'down',
      // "ok" | "no_key" | "invalid_key" | "no_credits" | "unreachable" | "unknown" (see fastapi /health)
      claude: info?.claude ?? 'unknown',
      systemControl: info?.system_control ?? false,
    });
  });

  // This computer's addresses on the home network, so the app can show the link to open Azarvis
  // on a phone ("Use Azarvis from your phone"). Signed-in users only.
  app.get('/api/system/network', requireAuth, (_req, res) => {
    const lanAddresses = Object.values(os.networkInterfaces())
      .flat()
      .filter((a) => a && a.family === 'IPv4' && !a.internal && !a.address.startsWith('169.254.'))
      .map((a) => a.address);
    res.json({ lanAddresses });
  });

  app.use('/api', (_req, res) => res.status(404).json({ error: 'Not found' }));

  // One error handler for the whole app: AppError subclasses carry their own HTTP status.
  app.use((err, req, res, _next) => {
    if (res.headersSent) return res.end();
    if (err instanceof AppError) {
      if (err.retryAfterSeconds) res.set('Retry-After', String(err.retryAfterSeconds));
      return res.status(err.status).json(err.toJSON());
    }
    if (err?.code === 11000) return res.status(409).json({ error: 'Already exists', code: 'CONFLICT' });
    if (err?.type === 'entity.parse.failed') return res.status(400).json({ error: 'Invalid JSON', code: 'VALIDATION' });
    if (config.env !== 'test') logServerError(err, req);
    res.status(500).json({ error: 'Internal server error', code: 'INTERNAL' });
  });

  return app;
}
