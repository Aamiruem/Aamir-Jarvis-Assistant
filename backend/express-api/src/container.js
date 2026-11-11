// Composition root: the ONE place that decides which concrete classes are used and wires
// them together. Everything else receives its collaborators (dependency injection).
import { aiFetch } from './ai.js';
import { AuditLogger } from './auth/AuditLogger.js';
import { AuthService } from './auth/AuthService.js';
import { createNotifier } from './auth/notifiers.js';
import { OtpService } from './auth/OtpService.js';
import { PasswordHasher } from './auth/PasswordHasher.js';
import { PasswordPolicy } from './auth/PasswordPolicy.js';
import { TokenService } from './auth/TokenService.js';
import path from 'node:path';
import { config } from './config.js';
import * as memory from './repositories/memory.js';
import * as mongo from './repositories/mongo.js';

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
    await aiFetch('/me/data', actingUser, { method: 'DELETE' }); // SQL, vector store, S3 files
    await repos.conversations.deleteAllForUser(actingUser.id); // chat history
    await repos.notes.deleteAllForUser(actingUser.id); // user notes
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

  return { ...repos, storage, tokens, otp, audit, authService, settings: authSettings };
}
