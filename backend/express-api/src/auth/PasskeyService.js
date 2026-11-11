// Passkeys (WebAuthn): sign in without a password, with the device's own lock (Face ID,
// Touch ID, Windows Hello, an Android fingerprint or the device PIN). The private key never
// leaves the device; the server keeps only the public key and checks a signature over a
// fresh random challenge, so there is nothing to phish, guess or leak.
//
// A passkey is two factors at once (the device you hold + your face, finger or PIN), so a
// passkey sign-in does not also ask for the email code.
import crypto from 'node:crypto';
import {
  generateAuthenticationOptions,
  generateRegistrationOptions,
  verifyAuthenticationResponse,
  verifyRegistrationResponse,
} from '@simplewebauthn/server';
import { AuthenticationError, NotFoundError, ValidationError } from './errors.js';

const CHALLENGE_TTL_MS = 5 * 60_000;
const MAX_PASSKEYS = 10;
const b64 = (bytes) => Buffer.from(bytes).toString('base64url');
const bytes = (text) => new Uint8Array(Buffer.from(text, 'base64url'));

/** A readable name for the device a passkey was made on, from its user agent. */
export function deviceName(userAgent = '') {
  const ua = userAgent.toLowerCase();
  const os = /iphone/.test(ua) ? 'iPhone' : /ipad/.test(ua) ? 'iPad' : /android/.test(ua) ? 'Android' : /mac os x|macintosh/.test(ua) ? 'Mac' : /windows/.test(ua) ? 'Windows PC' : /cros/.test(ua) ? 'Chromebook' : /linux/.test(ua) ? 'Linux PC' : 'This device';
  const browser = /edg\//.test(ua) ? 'Edge' : /opr\/|opera/.test(ua) ? 'Opera' : /firefox\//.test(ua) ? 'Firefox' : /chrome\/|crios\//.test(ua) ? 'Chrome' : /safari\//.test(ua) ? 'Safari' : '';
  return browser ? `${os} · ${browser}` : os;
}

export class PasskeyService {
  /**
   * @param {{ passkeys, users, audit, authService, rpName?: string, rpId?: string, origins: string[], clock?: () => Date }} deps
   *   origins: the web addresses allowed to use passkeys (the app's own sites).
   *   rpId: the domain passkeys belong to; by default the host name of the page asking.
   */
  constructor({ passkeys, users, audit, authService, rpName = 'Azarvis', rpId = '', origins, clock = () => new Date() }) {
    Object.assign(this, { passkeys, users, audit, authService, rpName, rpId, origins, clock });
    this.challenges = new Map(); // id -> { challenge, userId, purpose, rpID, origin, expires }
  }

  /** The page's origin must be one of ours; the passkey's domain (RP ID) follows from it. */
  #site(origin) {
    if (!origin || !this.origins.includes(origin)) {
      throw new ValidationError("Passkeys aren't available on this address. Open Azarvis from its usual link and try again.");
    }
    const host = new URL(origin).hostname;
    return { origin, rpID: this.rpId && (host === this.rpId || host.endsWith(`.${this.rpId}`)) ? this.rpId : host };
  }

  #remember(data) {
    const now = this.clock().getTime();
    for (const [id, c] of this.challenges) if (c.expires < now) this.challenges.delete(id);
    const id = crypto.randomUUID();
    this.challenges.set(id, { ...data, expires: now + CHALLENGE_TTL_MS });
    return id;
  }

  /** One use only: a challenge is deleted as soon as it is read. */
  #take(id, purpose) {
    const c = this.challenges.get(String(id || ''));
    this.challenges.delete(String(id || ''));
    if (!c || c.purpose !== purpose || c.expires < this.clock().getTime()) {
      throw new AuthenticationError('That passkey request expired. Please try again.');
    }
    return c;
  }

  // ---------- adding a passkey (signed in) ----------

  async registrationOptions(userId, origin) {
    const user = await this.users.findById(userId);
    if (!user) throw new NotFoundError('User not found');
    const site = this.#site(origin);
    const existing = await this.passkeys.listForUser(userId);
    if (existing.length >= MAX_PASSKEYS) throw new ValidationError(`You can have up to ${MAX_PASSKEYS} passkeys. Remove one first.`);
    const options = await generateRegistrationOptions({
      rpName: this.rpName,
      rpID: site.rpID,
      userName: user.email,
      userDisplayName: user.name,
      userID: new TextEncoder().encode(String(user.id)),
      attestationType: 'none',
      excludeCredentials: existing.map((p) => ({ id: p.credentialId, transports: p.transports })),
      // residentKey "required": the passkey can sign in without typing the email first.
      authenticatorSelection: { residentKey: 'required', userVerification: 'required' },
    });
    const challengeId = this.#remember({ challenge: options.challenge, userId: String(user.id), purpose: 'register', ...site });
    return { challengeId, options };
  }

  async register(userId, { challengeId, response, name } = {}, ctx = {}) {
    const c = this.#take(challengeId, 'register');
    if (c.userId !== String(userId)) throw new AuthenticationError('That passkey request belongs to another account.');
    let verification;
    try {
      verification = await verifyRegistrationResponse({ response, expectedChallenge: c.challenge, expectedOrigin: c.origin, expectedRPID: c.rpID, requireUserVerification: true });
    } catch (err) {
      throw new ValidationError(`The passkey could not be verified: ${err.message}`);
    }
    if (!verification.verified) throw new ValidationError('The passkey could not be verified.');
    const { credential, credentialDeviceType, credentialBackedUp } = verification.registrationInfo;
    if (await this.passkeys.findByCredentialId(credential.id)) throw new ValidationError('This passkey is already added.');
    const now = this.clock();
    const saved = await this.passkeys.create({
      userId: String(userId),
      credentialId: credential.id,
      publicKey: b64(credential.publicKey),
      counter: credential.counter,
      transports: credential.transports ?? response?.response?.transports ?? [],
      deviceType: credentialDeviceType,
      backedUp: credentialBackedUp,
      name: (typeof name === 'string' && name.trim() ? name.trim() : deviceName(ctx.userAgent)).slice(0, 60),
      rpId: c.rpID,
      createdAt: now,
      lastUsedAt: null,
    });
    await this.audit.log('passkey_added', { userId: String(userId), ctx, meta: { name: saved.name } });
    return publicPasskey(saved);
  }

  async list(userId) {
    return (await this.passkeys.listForUser(String(userId))).map(publicPasskey);
  }

  async remove(userId, id, ctx = {}) {
    const removed = await this.passkeys.deleteForUser(String(userId), id);
    if (!removed) throw new NotFoundError('Passkey not found');
    await this.audit.log('passkey_removed', { userId: String(userId), ctx, meta: { name: removed.name } });
  }

  // ---------- signing in with a passkey (signed out) ----------

  /** Options for the browser. With an email only that account's passkeys are offered. */
  async loginOptions({ email } = {}, origin) {
    const site = this.#site(origin);
    let allowCredentials;
    if (typeof email === 'string' && email.trim()) {
      const user = await this.users.findByEmail(email.trim().toLowerCase());
      const keys = user ? await this.passkeys.listForUser(String(user.id)) : [];
      // Unknown email or no passkeys: still answer the same way, so this can't reveal who has an account.
      allowCredentials = keys.filter((k) => k.rpId === site.rpID).map((k) => ({ id: k.credentialId, transports: k.transports }));
    }
    const options = await generateAuthenticationOptions({ rpID: site.rpID, userVerification: 'required', allowCredentials });
    const challengeId = this.#remember({ challenge: options.challenge, purpose: 'login', ...site });
    return { challengeId, options };
  }

  /** Checks the signed challenge and signs the owner in (same session as a password login). */
  async login({ challengeId, response } = {}, ctx = {}) {
    const c = this.#take(challengeId, 'login');
    const key = response?.id ? await this.passkeys.findByCredentialId(String(response.id)) : null;
    if (!key) {
      await this.audit.log('passkey_login_failed', { ctx, meta: { reason: 'unknown_passkey' } });
      throw new AuthenticationError('This passkey is not linked to an Azarvis account. Sign in with your password, then add it under Account.');
    }
    let verification;
    try {
      verification = await verifyAuthenticationResponse({
        response,
        expectedChallenge: c.challenge,
        expectedOrigin: c.origin,
        expectedRPID: c.rpID,
        requireUserVerification: true,
        credential: { id: key.credentialId, publicKey: bytes(key.publicKey), counter: key.counter, transports: key.transports },
      });
    } catch (err) {
      await this.audit.log('passkey_login_failed', { userId: key.userId, ctx, meta: { reason: err.message.slice(0, 120) } });
      throw new AuthenticationError("The passkey didn't match. Please try again.");
    }
    if (!verification.verified) throw new AuthenticationError("The passkey didn't match. Please try again.");
    await this.passkeys.update(key.id, { counter: verification.authenticationInfo.newCounter, lastUsedAt: this.clock() });
    return this.authService.completePasskeyLogin(key.userId, ctx, key.name);
  }
}

/** What the Account tab shows about a passkey (never the key itself). */
export function publicPasskey(p) {
  return { id: p.id, name: p.name, deviceType: p.deviceType, backedUp: p.backedUp, createdAt: p.createdAt, lastUsedAt: p.lastUsedAt };
}
