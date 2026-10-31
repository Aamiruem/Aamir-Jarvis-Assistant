import { ValidationError } from './errors.js';

const COMMON = new Set([
  'password', 'password1', 'password123', '123456789012', 'qwertyuiop', 'iloveyou', 'welcome123',
  'admin123', 'letmein123', 'jarvis123', 'passw0rd', 'p@ssw0rd', 'qwerty123456',
]);

/** Banking-style password rules. One class, one responsibility (OOP: single responsibility). */
export class PasswordPolicy {
  constructor({ minLength = 12, maxLength = 128 } = {}) {
    this.minLength = minLength;
    this.maxLength = maxLength;
  }

  /** Returns a list of problems (empty = OK). */
  check(password, { email = '', name = '' } = {}) {
    const p = typeof password === 'string' ? password : '';
    const problems = [];
    if (p.length < this.minLength) problems.push(`be at least ${this.minLength} characters`);
    if (p.length > this.maxLength) problems.push(`be at most ${this.maxLength} characters`);
    if (!/[a-z]/.test(p)) problems.push('contain a lowercase letter');
    if (!/[A-Z]/.test(p)) problems.push('contain an uppercase letter');
    if (!/\d/.test(p)) problems.push('contain a digit');
    if (!/[^A-Za-z0-9]/.test(p)) problems.push('contain a symbol');
    if (COMMON.has(p.toLowerCase())) problems.push('not be a common password');
    const lower = p.toLowerCase();
    const localPart = email.split('@')[0]?.toLowerCase();
    if (localPart && localPart.length >= 4 && lower.includes(localPart)) problems.push('not contain your email');
    const firstName = name.split(' ')[0]?.toLowerCase();
    if (firstName && firstName.length >= 4 && lower.includes(firstName)) problems.push('not contain your name');
    return problems;
  }

  assert(password, context) {
    const problems = this.check(password, context);
    if (problems.length) throw new ValidationError(`Password must ${problems.join(', ')}.`);
  }
}
