import { describe, expect, it } from 'vitest';
import { analyzePassword, breachCount, generatePassword, humanTime } from './passwordTools.js';

describe('analyzePassword', () => {
  it.each(['123456', 'password', 'Password@123', 'P@ssw0rd', 'qwerty123', 'aaaaaaaa'])('%s is very weak or weak', (pw) => {
    expect(analyzePassword(pw).score).toBeLessThanOrEqual(1);
  });
  it('rates a long random password very strong', () => {
    const r = analyzePassword('t7#Qm!vR2^xLp9@Wz4&k');
    expect(r.score).toBe(4);
    expect(r.issues).toEqual([]);
  });
  it('a long passphrase of plain words is strong', () => {
    expect(analyzePassword('correct horse battery staple river').score).toBeGreaterThanOrEqual(3);
  });
  it('explains the problems it found', () => {
    const r = analyzePassword('aamir2024abcd', ['Aamir']);
    expect(r.issues.join(' ')).toMatch(/name or email/);
    expect(r.issues.join(' ')).toMatch(/year/);
    expect(r.issues.join(' ')).toMatch(/sequence/);
  });
});

describe('humanTime', () => {
  it('reads like a person would say it', () => {
    expect(humanTime(0.2)).toBe('instantly');
    expect(humanTime(7200)).toBe('2 hours');
    expect(humanTime(31_557_600 * 40)).toBe('40 years');
    expect(humanTime(1e20)).toBe('millions of years');
  });
});

describe('generatePassword', () => {
  it('has the requested length and every chosen kind of character', () => {
    for (let i = 0; i < 50; i++) {
      const pw = generatePassword({ length: 16 });
      expect(pw).toHaveLength(16);
      expect(pw).toMatch(/[a-z]/);
      expect(pw).toMatch(/[A-Z]/);
      expect(pw).toMatch(/\d/);
      expect(pw).toMatch(/[^A-Za-z0-9]/);
      expect(pw).not.toMatch(/[Il1O0]/);
    }
  });
  it('honours the choices and refuses an empty set', () => {
    expect(generatePassword({ length: 12, upper: false, digit: false, symbol: false })).toMatch(/^[a-z]{12}$/);
    expect(() => generatePassword({ lower: false, upper: false, digit: false, symbol: false })).toThrow();
  });
  it('is not predictable', () => {
    expect(new Set(Array.from({ length: 20 }, () => generatePassword())).size).toBe(20);
  });
});

describe('breachCount', () => {
  it('sends only the first 5 characters of the hash and matches the rest locally', async () => {
    // SHA-1("password") = 5BAA61E4C9B93F3F0682250B6CF8331B7EE68FD8
    let asked = '';
    const fake = async (url) => {
      asked = url;
      return { ok: true, text: async () => '0018A45C4D1DEF81644B54AB7F969B88D65:1\r\n1E4C9B93F3F0682250B6CF8331B7EE68FD8:9545824\r\n' };
    };
    expect(await breachCount('password', fake)).toBe(9545824);
    expect(asked).toBe('https://api.pwnedpasswords.com/range/5BAA6');
    expect(await breachCount('a-password-nobody-uses-9f3k', async () => ({ ok: true, text: async () => 'ABC:1' }))).toBe(0);
  });
});
