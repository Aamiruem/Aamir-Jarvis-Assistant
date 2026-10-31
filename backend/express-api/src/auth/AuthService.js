import crypto from 'node:crypto';
import {
  AccountLockedError,
  AuthenticationError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from './errors.js';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_RE = /^\+[1-9]\d{7,14}$/; // E.164
const ROTATION_GRACE_MS = 10_000; // two tabs refreshing at once isn't an attack

/** The user fields that are safe to send to the browser. */
export function publicUser(u) {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    emailVerified: u.emailVerified,
    phone: u.phone,
    phoneVerified: u.phoneVerified,
    preferences: u.preferences,
    createdAt: u.createdAt,
    lastLoginAt: u.lastLoginAt,
  };
}

/**
 * All authentication rules live here, independent of Express and of MongoDB.
 * Collaborators are injected through the constructor (dependency injection), so tests can
 * pass in-memory repositories and a fake notifier.
 *
 * `ctx` = { ip, userAgent } of the request, used for sessions and the audit log.
 * Methods that complete a login return an "auth result": { user, accessToken, refreshToken, refreshExpires }.
 */
export class AuthService {
  constructor({ users, sessions, otp, tokens, hasher, policy, audit, settings, adminEmails = [], purgeUserData = async () => {}, clock = () => new Date() }) {
    Object.assign(this, { users, sessions, otp, tokens, hasher, policy, audit, settings, adminEmails, purgeUserData, clock });
  }

  // ---------- registration & email verification ----------

  async register({ name, email, password }, ctx) {
    name = (name || '').trim();
    email = (email || '').trim().toLowerCase();
    if (!name || name.length > 80) throw new ValidationError('Name is required (max 80 characters).');
    if (!EMAIL_RE.test(email)) throw new ValidationError('A valid email is required.');
    this.policy.assert(password, { email, name });
    if (await this.users.findByEmail(email)) throw new ConflictError('An account with this email already exists.');

    const user = await this.users.create({
      name,
      email,
      passwordHash: await this.hasher.hash(password),
      role: this.adminEmails.includes(email) ? 'admin' : 'user',
      passwordChangedAt: this.clock(),
    });
    await this.audit.log('register', { userId: user.id, ctx });
    const challenge = await this.otp.issue({ userId: user.id, purpose: 'verify_email', destination: email, channel: 'email' });
    return { emailVerificationRequired: true, ...challenge };
  }

  async verifyEmail({ challengeId, code }, ctx) {
    const challenge = await this.otp.verify(challengeId, code, 'verify_email');
    const user = await this.users.update(challenge.userId, { emailVerified: true });
    await this.audit.log('email_verified', { userId: user.id, ctx });
    return this.#completeLogin(user, ctx);
  }

  resendOtp({ challengeId }) {
    return this.otp.resend(challengeId);
  }

  // ---------- two-step login ----------

  /** Step 1: email + password. Returns an OTP challenge (or tokens if 2-step login is off). */
  async login({ email, password }, ctx) {
    email = (email || '').trim().toLowerCase();
    const user = email ? await this.users.findByEmail(email) : null;
    const now = this.clock();

    if (!user) {
      await this.hasher.verify(password, null); // same timing as a real check
      await this.audit.log('login_failed', { ctx, meta: { email, reason: 'unknown_email' } });
      throw new AuthenticationError('Invalid email or password.');
    }
    if (user.lockUntil && user.lockUntil > now) {
      await this.audit.log('login_blocked_locked', { userId: user.id, ctx });
      throw new AccountLockedError(user.lockUntil);
    }
    if (!(await this.hasher.verify(password, user.passwordHash))) {
      await this.#recordFailedLogin(user, ctx);
    }
    if (user.failedLoginAttempts || user.lockUntil) {
      await this.users.update(user.id, { failedLoginAttempts: 0, lockUntil: null });
    }

    if (!user.emailVerified) {
      const challenge = await this.otp.issue({ userId: user.id, purpose: 'verify_email', destination: user.email, channel: 'email' });
      return { emailVerificationRequired: true, ...challenge };
    }
    if (this.settings.loginOtpRequired) {
      const { channel, destination } = this.#otpRoute(user);
      const challenge = await this.otp.issue({ userId: user.id, purpose: 'login', destination, channel });
      await this.audit.log('login_otp_sent', { userId: user.id, ctx, meta: { channel } });
      return { mfaRequired: true, ...challenge };
    }
    return this.#completeLogin(user, ctx);
  }

  /** Step 2: the OTP. */
  async verifyLogin({ challengeId, code }, ctx) {
    let challenge;
    try {
      challenge = await this.otp.verify(challengeId, code, 'login');
    } catch (err) {
      await this.audit.log('login_otp_failed', { ctx, meta: { challengeId: String(challengeId).slice(0, 40) } });
      throw err;
    }
    const user = await this.users.findById(challenge.userId);
    if (!user) throw new AuthenticationError();
    return this.#completeLogin(user, ctx);
  }

  async #recordFailedLogin(user, ctx) {
    const attempts = (user.failedLoginAttempts || 0) + 1;
    if (attempts >= this.settings.maxFailedLogins) {
      const lockUntil = new Date(this.clock().getTime() + this.settings.lockMinutes * 60_000);
      await this.users.update(user.id, { failedLoginAttempts: 0, lockUntil });
      await this.audit.log('account_locked', { userId: user.id, ctx, meta: { minutes: this.settings.lockMinutes } });
      throw new AccountLockedError(lockUntil);
    }
    await this.users.update(user.id, { failedLoginAttempts: attempts });
    await this.audit.log('login_failed', { userId: user.id, ctx, meta: { reason: 'bad_password', attempts } });
    throw new AuthenticationError('Invalid email or password.');
  }

  #otpRoute(user) {
    if (user.preferences?.otpChannel === 'sms' && user.phone && user.phoneVerified) return { channel: 'sms', destination: user.phone };
    return { channel: 'email', destination: user.email };
  }

  async #completeLogin(user, ctx) {
    const patch = { lastLoginAt: this.clock() };
    if (this.adminEmails.includes(user.email)) patch.role = 'admin'; // picks up ADMIN_EMAILS changes
    const updated = await this.users.update(user.id, patch);
    await this.audit.log('login_success', { userId: user.id, ctx });
    return this.#startSession(updated, crypto.randomUUID(), ctx);
  }

  async #startSession(user, family, ctx) {
    const refreshToken = this.tokens.newRefreshToken();
    const now = this.clock();
    const session = await this.sessions.create({
      userId: user.id,
      family,
      tokenHash: this.tokens.hash(refreshToken),
      userAgent: (ctx.userAgent || '').slice(0, 300),
      ip: ctx.ip || null,
      createdAt: now,
      lastUsedAt: now,
      expiresAt: this.tokens.refreshExpiry(now),
      revokedAt: null,
      revokedReason: null,
    });
    return {
      user: publicUser(user),
      accessToken: this.tokens.signAccess(user, family),
      refreshToken,
      refreshExpires: session.expiresAt,
    };
  }

  // ---------- sessions (refresh-token rotation with reuse detection) ----------

  async refresh(refreshToken, ctx) {
    if (!refreshToken) throw new AuthenticationError('Not signed in.');
    const now = this.clock();
    const session = await this.sessions.findByTokenHash(this.tokens.hash(refreshToken));
    if (!session) throw new AuthenticationError('Session expired. Please sign in again.');

    if (session.revokedAt) {
      // A token that was already exchanged is being used again: someone may have stolen it.
      // Like a bank, end every session for this user and make them sign in again.
      const benignRace = session.revokedReason === 'rotated' && now - session.revokedAt < ROTATION_GRACE_MS;
      if (session.revokedReason === 'rotated' && !benignRace) {
        await this.sessions.revokeAllForUser(session.userId, 'reuse_detected');
        await this.audit.log('refresh_token_reuse_detected', { userId: session.userId, ctx });
      }
      throw new AuthenticationError('Session expired. Please sign in again.');
    }
    if (session.expiresAt <= now) throw new AuthenticationError('Session expired. Please sign in again.');

    const user = await this.users.findById(session.userId);
    if (!user) throw new AuthenticationError('Session expired. Please sign in again.');

    await this.sessions.update(session.id, { revokedAt: now, revokedReason: 'rotated' });
    return this.#startSession(user, session.family, ctx);
  }

  async logout(refreshToken, ctx) {
    if (!refreshToken) return;
    const session = await this.sessions.findByTokenHash(this.tokens.hash(refreshToken));
    if (session && !session.revokedAt) {
      await this.sessions.revokeFamily(session.userId, session.family, 'logout');
      await this.audit.log('logout', { userId: session.userId, ctx });
    }
  }

  async logoutAll(userId, ctx) {
    const count = await this.sessions.revokeAllForUser(userId, 'logout_all');
    await this.audit.log('logout_all', { userId, ctx, meta: { sessions: count } });
    return count;
  }

  async listSessions(userId, currentFamily) {
    const active = await this.sessions.listActive(userId, this.clock());
    return active.map((s) => ({
      id: s.family,
      userAgent: s.userAgent,
      ip: s.ip,
      lastUsedAt: s.lastUsedAt,
      createdAt: s.createdAt,
      current: s.family === currentFamily,
    }));
  }

  async revokeSession(userId, family, ctx) {
    const count = await this.sessions.revokeFamily(userId, family, 'revoked_by_user');
    if (!count) throw new NotFoundError('Session not found.');
    await this.audit.log('session_revoked', { userId, ctx });
  }

  // ---------- passwords ----------

  /** Always answers the same way, so it can't be used to find out which emails are registered. */
  async forgotPassword({ email }, ctx) {
    email = (email || '').trim().toLowerCase();
    const user = EMAIL_RE.test(email) ? await this.users.findByEmail(email) : null;
    const generic = { message: 'If an account exists for this email, a reset code has been sent.' };
    if (!user) {
      await this.audit.log('password_reset_unknown_email', { ctx, meta: { email } });
      return { ...generic, challengeId: crypto.randomBytes(12).toString('hex') }; // looks real, never verifies
    }
    const challenge = await this.otp.issue({ userId: user.id, purpose: 'reset_password', destination: user.email, channel: 'email' });
    await this.audit.log('password_reset_requested', { userId: user.id, ctx });
    return { ...generic, challengeId: challenge.challengeId, devCode: challenge.devCode };
  }

  async resetPassword({ challengeId, code, newPassword }, ctx) {
    const pending = await this.otp.otpRepo.findById(challengeId);
    const user = pending ? await this.users.findById(pending.userId) : null;
    if (user) this.policy.assert(newPassword, user); // validate before using up the code
    const challenge = await this.otp.verify(challengeId, code, 'reset_password');
    await this.users.update(challenge.userId, {
      passwordHash: await this.hasher.hash(newPassword),
      passwordChangedAt: this.clock(),
      failedLoginAttempts: 0,
      lockUntil: null,
    });
    await this.sessions.revokeAllForUser(challenge.userId, 'password_reset');
    await this.audit.log('password_reset', { userId: challenge.userId, ctx });
    return { message: 'Password updated. Please sign in with your new password.' };
  }

  async changePassword(userId, { currentPassword, newPassword }, currentFamily, ctx) {
    const user = await this.#requireUser(userId);
    if (!(await this.hasher.verify(currentPassword, user.passwordHash))) throw new AuthenticationError('Current password is incorrect.');
    if (currentPassword === newPassword) throw new ValidationError('New password must be different.');
    this.policy.assert(newPassword, user);
    await this.users.update(userId, { passwordHash: await this.hasher.hash(newPassword), passwordChangedAt: this.clock() });
    const signedOut = await this.sessions.revokeAllForUser(userId, 'password_changed', currentFamily);
    await this.audit.log('password_changed', { userId, ctx, meta: { otherSessionsSignedOut: signedOut } });
    return { otherSessionsSignedOut: signedOut };
  }

  // ---------- profile & phone (for SMS OTP) ----------

  async getProfile(userId) {
    return publicUser(await this.#requireUser(userId));
  }

  async updateProfile(userId, { name, preferences } = {}) {
    const user = await this.#requireUser(userId);
    const patch = {};
    if (typeof name === 'string' && name.trim()) patch.name = name.trim().slice(0, 80);
    const prefs = { ...user.preferences };
    if (typeof preferences?.voice === 'boolean') prefs.voice = preferences.voice;
    if (typeof preferences?.language === 'string') prefs.language = preferences.language.slice(0, 10);
    if (preferences?.otpChannel !== undefined) {
      if (!['email', 'sms'].includes(preferences.otpChannel)) throw new ValidationError('otpChannel must be email or sms.');
      if (preferences.otpChannel === 'sms' && !user.phoneVerified) throw new ForbiddenError('Verify a phone number before choosing SMS codes.');
      prefs.otpChannel = preferences.otpChannel;
    }
    patch.preferences = prefs;
    return publicUser(await this.users.update(userId, patch));
  }

  async startPhoneVerification(userId, phone, ctx) {
    await this.#requireUser(userId);
    phone = (phone || '').replace(/[\s-]/g, '');
    if (!PHONE_RE.test(phone)) throw new ValidationError('Enter the phone number in international format, e.g. +919876543210.');
    await this.audit.log('phone_verification_started', { userId, ctx });
    return this.otp.issue({ userId, purpose: 'verify_phone', destination: phone, channel: 'sms' });
  }

  async verifyPhone(userId, { challengeId, code }, ctx) {
    const challenge = await this.otp.verify(challengeId, code, 'verify_phone');
    if (challenge.userId !== userId) throw new AuthenticationError('Invalid or expired code.');
    const user = await this.users.update(userId, { phone: challenge.destination, phoneVerified: true });
    await this.audit.log('phone_verified', { userId, ctx });
    return publicUser(user);
  }

  // ---------- account ----------

  async deleteAccount(userId, password, actingUser, ctx) {
    const user = await this.#requireUser(userId);
    if (!(await this.hasher.verify(password, user.passwordHash))) throw new AuthenticationError('Password is incorrect.');
    await this.purgeUserData(actingUser); // AI service data + conversations; throws if it fails
    await this.sessions.deleteForUser(userId);
    await this.otp.otpRepo.deleteForUser(userId);
    await this.users.delete(userId);
    await this.audit.log('account_deleted', { userId, ctx });
  }

  securityActivity(userId, limit = 30) {
    return this.audit.recent(userId, limit);
  }

  async #requireUser(userId) {
    const user = await this.users.findById(userId);
    if (!user) throw new NotFoundError('User not found.');
    return user;
  }
}
