import mongoose from 'mongoose';

// Refresh-token sessions. One "family" = one device login; every refresh rotates the token
// but keeps the family. TTL index: MongoDB deletes expired sessions automatically.
const sessionSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  family: { type: String, required: true, index: true },
  tokenHash: { type: String, required: true, unique: true },
  userAgent: String,
  ip: String,
  createdAt: { type: Date, default: Date.now },
  lastUsedAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, required: true, index: { expireAfterSeconds: 0 } },
  revokedAt: { type: Date, default: null },
  revokedReason: { type: String, default: null },
});

// OTP challenges; deleted by MongoDB one hour after they expire.
const otpSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  purpose: { type: String, required: true },
  channel: { type: String, enum: ['email', 'sms'], required: true },
  destination: { type: String, required: true },
  salt: { type: String, required: true },
  codeHash: { type: String, required: true },
  attempts: { type: Number, default: 0 },
  resends: { type: Number, default: 0 },
  lastSentAt: { type: Date, required: true },
  expiresAt: { type: Date, required: true, index: { expireAfterSeconds: 3600 } },
  consumedAt: { type: Date, default: null },
  invalidatedAt: { type: Date, default: null },
});

// Security audit log, kept for one year.
const auditSchema = new mongoose.Schema({
  userId: { type: String, default: null, index: true },
  event: { type: String, required: true },
  ip: String,
  userAgent: String,
  meta: { type: mongoose.Schema.Types.Mixed, default: {} },
  createdAt: { type: Date, default: Date.now, index: { expireAfterSeconds: 365 * 24 * 3600 } },
});

export const Session = mongoose.model('Session', sessionSchema);
export const OtpChallenge = mongoose.model('OtpChallenge', otpSchema);
export const AuditLog = mongoose.model('AuditLog', auditSchema);
