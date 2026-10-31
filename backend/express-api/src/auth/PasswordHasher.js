import bcrypt from 'bcryptjs';

/** Wraps bcrypt so the algorithm can be swapped (e.g. argon2) without touching AuthService. */
export class PasswordHasher {
  constructor({ rounds = 12 } = {}) {
    this.rounds = rounds;
    // Compared against when the email doesn't exist, so "unknown user" and "wrong password"
    // take the same time (prevents discovering registered emails by timing).
    this.dummyHash = bcrypt.hashSync('dummy-password-for-timing', rounds);
  }

  hash(password) {
    return bcrypt.hash(password, this.rounds);
  }

  verify(password, hash) {
    return bcrypt.compare(password || '', hash || this.dummyHash);
  }
}
