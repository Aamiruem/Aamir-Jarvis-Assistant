// Composition root: the ONE place that decides which concrete classes are used and wires
// them together. Everything else receives its collaborators (dependency injection).
import { aiFetch } from './ai.js';
import { AuditLogger } from './auth/AuditLogger.js';
import { AuthService } from './auth/AuthService.js';
import { createNotifier } from './auth/notifiers.js';
import { OtpService } from './auth/OtpService.js';
import { PasskeyService } from './auth/PasskeyService.js';
import { PasswordHasher } from './auth/PasswordHasher.js';
import { PasswordPolicy } from './auth/PasswordPolicy.js';
import { TokenService } from './auth/TokenService.js';
import path from 'node:path';
import { config } from './config.js';
import * as memory from './repositories/memory.js';
import * as mongo from './repositories/mongo.js';
import { MongoRateLimitStore } from './scale/MongoRateLimitStore.js';

/**
 * True when the AI service can't be reached at all (connection refused, unknown host, timeout) or
 * a proxy says it isn't there (404/502/503/504); false for a real error from a running service.
 */
export function aiUnavailable(err) {
  if (err?.name === 'TimeoutError' || err?.name === 'AbortError') return true;
  const code = err?.cause?.code || err?.code;
  if (['ECONNREFUSED', 'ENOTFOUND', 'EAI_AGAIN', 'ECONNRESET', 'ETIMEDOUT', 'EHOSTUNREACH', 'UND_ERR_CONNECT_TIMEOUT'].includes(code)) return true;
  if (err instanceof TypeError && /fetch failed/i.test(err.message)) return true;
  return /responded (404|502|503|504)/.test(err?.message || '');
}

function memoryRepos(dataDir) {
  // dataDir set → each repository keeps its rows in <dataDir>/<name>.json
  const opts = (name) => (dataDir ? { file: path.join(dataDir, `${name}.json`) } : {});
  return {
    users: new memory.InMemoryUserRepository(opts('users')),
    sessions: new memory.InMemorySessionRepository(opts('sessions')),
    otps: new memory.InMemoryOtpRepository(opts('otps')),
    auditRepo: new memory.InMemoryAuditRepository(opts('audit')),
    conversations: new memory.InMemoryConversationRepository(opts('conversations')),
    notes: new memory.InMemoryUserNoteRepository(opts('notes')),
    feedback: new memory.InMemoryFeedbackRepository(opts('feedback')),
    passkeys: new memory.InMemoryPasskeyRepository(opts('passkeys')),
    challenges: new memory.InMemoryChallengeRepository(), // minutes-long, never saved to a file
    whatsapp: new memory.InMemoryWhatsAppRepository(opts('whatsapp')),
  };
}

function mongoRepos() {
  return {
    users: new mongo.MongoUserRepository(),
    sessions: new mongo.MongoSessionRepository(),
    otps: new mongo.MongoOtpRepository(),
    auditRepo: new mongo.MongoAuditRepository(),
    conversations: new mongo.MongoConversationRepository(),
    notes: new mongo.MongoUserNoteRepository(),
    feedback: new mongo.MongoFeedbackRepository(),
    passkeys: new mongo.MongoPasskeyRepository(),
    challenges: new mongo.MongoChallengeRepository(),
    whatsapp: new mongo.MongoWhatsAppRepository(),
  };
}

/**
 * @param {{storage?: 'mongo'|'file'|'memory', dataDir?: string,
 *          notifier?: import('./auth/notifiers.js').NotificationSender,
 *          purgeUserData?: Function, settings?: object}} options
 *   storage: "mongo" (normal), "file" (JSON files in dataDir: development without MongoDB),
 *            "memory" (nothing saved: tests)
 */
export function createContainer({ storage = 'mongo', dataDir, notifier, purgeUserData, settings } = {}) {
  const repos = storage === 'mongo' ? mongoRepos() : memoryRepos(storage === 'file' ? dataDir : undefined);

  async function purgeFromAllStores(actingUser) {
    // The AI service's data: SQL (tasks, memories), vector store, S3 files.
    try {
      await aiFetch('/me/data', actingUser, { method: 'DELETE', signal: AbortSignal.timeout(20_000) });
    } catch (err) {
      // No AI service to reach (not deployed, as on a website-only host, or down): it holds nothing
      // we can erase right now, and the person must not be trapped in an account they want gone.
      // Recorded so it can be purged later. A reachable service that fails still stops the deletion.
      if (!aiUnavailable(err)) throw err;
      await audit.log('ai_purge_skipped', { userId: actingUser.id, meta: { reason: String(err.message).slice(0, 160) } });
    }
    await repos.conversations.deleteAllForUser(actingUser.id); // chat history
    await repos.notes.deleteAllForUser(actingUser.id); // user notes
    await repos.passkeys.deleteAllForUser(actingUser.id); // passkeys
  }

  const authSettings = { ...config.auth, ...settings };
  const tokens = new TokenService({
    secret: authSettings.jwtSecret,
    accessTtl: authSettings.accessTokenTtl,
    refreshDays: authSettings.refreshTokenDays,
  });
  // Codes only print in the terminal (OTP_PROVIDER=console): also show them on the page in
  // development, or in production when DEMO_MODE is on (a demo with no real email service).
  const revealCodes = !notifier && config.notifications.provider === 'console' && (config.env !== 'production' || config.demoMode);
  const otp = new OtpService({ otpRepo: repos.otps, notifier: notifier ?? createNotifier(config.notifications), ...config.otp, revealCodes });
  const audit = new AuditLogger({ auditRepo: repos.auditRepo });

  const authService = new AuthService({
    users: repos.users,
    sessions: repos.sessions,
    otp,
    tokens,
    audit,
    hasher: new PasswordHasher({ rounds: storage === 'memory' ? 4 : 12 }), // fast hashing in tests only
    policy: new PasswordPolicy(),
    settings: authSettings,
    adminEmails: config.adminEmails,
    purgeUserData: purgeUserData ?? (storage === 'memory' ? async () => {} : purgeFromAllStores),
  });

  // Passkeys work on the app's own sites only (CLIENT_ORIGINS, or PASSKEY_ORIGINS when set).
  const passkeyService = new PasskeyService({
    passkeys: repos.passkeys,
    challenges: repos.challenges,
    users: repos.users,
    audit,
    authService,
    rpId: config.passkeys.rpId,
    origins: config.passkeys.origins,
  });

  // With MongoDB every replica shares one rate-limit counter; otherwise each process counts alone.
  const rateLimitStore = storage === 'mongo' ? (prefix) => new MongoRateLimitStore({ prefix }) : () => undefined;

  return { ...repos, storage, tokens, otp, audit, authService, passkeyService, rateLimitStore, settings: authSettings };
}
