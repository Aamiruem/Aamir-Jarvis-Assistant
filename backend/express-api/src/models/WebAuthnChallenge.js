import mongoose from 'mongoose';

// A passkey challenge between "options" and "verify". Kept in the database (not in one process's
// memory) so the two steps work even when a load balancer sends them to different API replicas.
// MongoDB's TTL index deletes challenges that were never used.
const challengeSchema = new mongoose.Schema({
  challenge: { type: String, required: true },
  purpose: { type: String, enum: ['register', 'login'], required: true },
  userId: { type: String, default: null },
  origin: { type: String, required: true },
  rpID: { type: String, required: true },
  expiresAt: { type: Date, required: true, index: { expireAfterSeconds: 0 } },
});

export const WebAuthnChallenge = mongoose.model('WebAuthnChallenge', challengeSchema);
