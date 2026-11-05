import crypto from 'node:crypto';
import { AuthenticationError, TooManyRequestsError } from './errors.js';

const MESSAGES = {
  verify_email: (code, ttl) => ({
    subject: 'Verify your Azarvis account',
    text: `Azarvis: your verification code is ${code}. It expires in ${ttl} minutes.`,
  }),
  login: (code, ttl) => ({
    subject: 'Your Azarvis sign-in code',
    text: `Azarvis: your sign-in code is ${code}. It expires in ${ttl} minutes. If you didn't try to sign in, change your password now.`,
  }),
  reset_password: (code, ttl) => ({
    subject: 'Reset your Azarvis password',
    text: `Azarvis: your password reset code is ${code}. It expires in ${ttl} minutes. Never share this code with anyone.`,
  }),
  verify_phone: (code, ttl) => ({
    subject: 'Verify your phone for Azarvis',
    text: `Azarvis: your phone verification code is ${code}. It expires in ${ttl} minutes.`,
  }),
};

export function maskDestination(destination) {
  if (destination.includes('@')) {
    const [local, domain] = destination.split('@');
    return `${local[0]}${'*'.repeat(Math.max(2, local.length - 1))}@${domain}`;
  }
  return `${'*'.repeat(Math.max(0, destination.length - 4))}${destination.slice(-4)}`;
}

/**
 * One-time passwords ("challenges"), the way banks do them:
 *  - 6 random digits from a cryptographic RNG
 *  - only a salted HMAC of the code is stored, never the code itself
 *  - expires after a few minutes, a limited number of guesses, and is single use
 *  - each challenge has a purpose, so a login code can't be used to reset a password
 *  - resends are rate-limited
 */
export class OtpService {
  constructor({ otpRepo, notifier, secret, ttlMinutes = 5, maxAttempts = 5, resendCooldownSeconds = 60, maxResends = 3, revealCodes = false, clock = () => new Date() }) {
    // revealCodes: development without real email/SMS, so the code is returned to the page as devCode
    Object.assign(this, { otpRepo, notifier, secret, ttlMinutes, maxAttempts, resendCooldownSeconds, maxResends, revealCodes, clock });
  }

  #hash(salt, code) {
    return crypto.createHmac('sha256', this.secret).update(`${salt}:${code}`).digest('hex');
  }

  #newCode() {
    return String(crypto.randomInt(0, 1_000_000)).padStart(6, '0');
  }

  async #deliver(challenge, code) {
    const { subject, text } = MESSAGES[challenge.purpose](code, this.ttlMinutes);
    await this.notifier.send({ to: challenge.destination, channel: challenge.channel, subject, text });
  }

  async issue({ userId, purpose, destination, channel = 'email' }) {
    if (!MESSAGES[purpose]) throw new Error(`Unknown OTP purpose ${purpose}`);
    await this.otpRepo.invalidateActive(userId, purpose); // only the newest code works
    const now = this.clock();
    const code = this.#newCode();
    const salt = crypto.randomBytes(16).toString('hex');
    const challenge = await this.otpRepo.create({
      userId,
      purpose,
      channel,
      destination,
      salt,
      codeHash: this.#hash(salt, code),
      attempts: 0,
      resends: 0,
      lastSentAt: now,
      expiresAt: new Date(now.getTime() + this.ttlMinutes * 60_000),
    });
    await this.#deliver(challenge, code);
    return this.#publicView(challenge, code);
  }

  async resend(challengeId) {
    const c = await this.otpRepo.findById(challengeId);
    const now = this.clock();
    if (!c || c.consumedAt || c.invalidatedAt) throw new AuthenticationError('This code is no longer valid. Start again.');
    const wait = Math.ceil((c.lastSentAt.getTime() + this.resendCooldownSeconds * 1000 - now.getTime()) / 1000);
    if (wait > 0) throw new TooManyRequestsError(`Please wait ${wait}s before requesting a new code.`, wait);
    if (c.resends >= this.maxResends) throw new TooManyRequestsError('Too many codes requested. Start again later.', 900);

    const code = this.#newCode();
    const salt = crypto.randomBytes(16).toString('hex');
    const updated = await this.otpRepo.update(c.id, {
      salt,
      codeHash: this.#hash(salt, code),
      attempts: 0,
      resends: c.resends + 1,
      lastSentAt: now,
      expiresAt: new Date(now.getTime() + this.ttlMinutes * 60_000),
    });
    await this.#deliver(updated, code);
    return this.#publicView(updated, code);
  }

  /** Checks a code. Returns the challenge (with userId) on success; throws otherwise. */
  async verify(challengeId, code, purpose) {
    const c = await this.otpRepo.findById(challengeId);
    const now = this.clock();
    const invalid = new AuthenticationError('Invalid or expired code.');
    if (!c || c.purpose !== purpose || c.consumedAt || c.invalidatedAt || c.expiresAt <= now) throw invalid;
    if (c.attempts >= this.maxAttempts) throw new TooManyRequestsError('Too many wrong codes. Request a new one.', 0);

    const expected = Buffer.from(c.codeHash, 'hex');
    const actual = Buffer.from(this.#hash(c.salt, String(code ?? '').trim()), 'hex');
    if (!crypto.timingSafeEqual(expected, actual)) {
      const attempts = c.attempts + 1;
      await this.otpRepo.update(c.id, { attempts });
      const left = this.maxAttempts - attempts;
      throw new AuthenticationError(left > 0 ? `Incorrect code. ${left} attempt(s) left.` : 'Too many wrong codes. Request a new one.');
    }
    return this.otpRepo.update(c.id, { consumedAt: now });
  }

  #publicView(c, code) {
    return {
      challengeId: c.id,
      channel: c.channel,
      maskedDestination: maskDestination(c.destination),
      expiresAt: c.expiresAt,
      resendAvailableAt: new Date(c.lastSentAt.getTime() + this.resendCooldownSeconds * 1000),
      ...(this.revealCodes && code && { devCode: code }),
    };
  }
}
