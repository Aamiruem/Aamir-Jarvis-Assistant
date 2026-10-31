import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import { AuthenticationError } from './errors.js';

/**
 * Two kinds of token:
 *  - access token: a short-lived JWT (15 min) sent as `Authorization: Bearer ...`.
 *  - refresh token: a long random string stored in an httpOnly cookie. Only its SHA-256 hash
 *    is saved in the database, so a database leak doesn't leak working tokens.
 */
export class TokenService {
  constructor({ secret, accessTtl = '15m', refreshDays = 7 }) {
    this.secret = secret;
    this.accessTtl = accessTtl;
    this.refreshDays = refreshDays;
  }

  signAccess(user, sessionId) {
    return jwt.sign({ sub: String(user.id), name: user.name, role: user.role, sid: sessionId }, this.secret, {
      expiresIn: this.accessTtl,
      issuer: 'jarvis',
    });
  }

  verifyAccess(token) {
    try {
      return jwt.verify(token, this.secret, { issuer: 'jarvis' });
    } catch {
      throw new AuthenticationError('Invalid or expired token');
    }
  }

  newRefreshToken() {
    return crypto.randomBytes(48).toString('base64url');
  }

  hash(token) {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  refreshExpiry(now = new Date()) {
    return new Date(now.getTime() + this.refreshDays * 24 * 3600 * 1000);
  }
}
