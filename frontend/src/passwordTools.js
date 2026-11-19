// Security Center password tools. Everything here runs in the browser: the password you test is
// never sent, logged or stored. (The optional breach check sends only the first 5 characters of
// its SHA-1 hash: Have I Been Pwned's k-anonymity range API.)

const COMMON = new Set(
  ('123456 password 12345678 qwerty 123456789 12345 1234 111111 1234567 dragon 123123 baseball abc123 football monkey letmein ' +
    'shadow master 666666 qwertyuiop 123321 mustang 1234567890 michael 654321 superman 1qaz2wsx 7777777 121212 000000 qazwsx ' +
    '123qwe killer trustno1 jordan jennifer zxcvbnm asdfgh hunter buster soccer harley batman andrew tigger sunshine iloveyou ' +
    'charlie robert thomas hockey ranger daniel starwars 112233 george computer michelle jessica pepper 1111 zxcvbn 555555 ' +
    '11111111 131313 freedom 777777 pass maggie 159753 aaaaaa ginger princess joshua cheese amanda summer love ashley nicole ' +
    'chelsea matthew access yankees 987654321 dallas austin thunder taylor matrix admin welcome india pakistan cricket ' +
    'mumbai delhi bharat secret qwerty123 password1 passw0rd abcd1234 abcdef asdf1234 test login hello')
    .split(' '),
);
const SEQUENCES = ['abcdefghijklmnopqrstuvwxyz', '01234567890', 'qwertyuiop', 'asdfghjkl', 'zxcvbnm', '1qaz2wsx3edc'];
const LEET = { '@': 'a', 4: 'a', 8: 'b', 3: 'e', 1: 'i', '!': 'i', 0: 'o', $: 's', 5: 's', 7: 't', '+': 't' };

const classes = (pw) => ({
  lower: /[a-z]/.test(pw),
  upper: /[A-Z]/.test(pw),
  digit: /\d/.test(pw),
  symbol: /[^\w\s]|_/.test(pw),
  space: /\s/.test(pw),
  other: /[^\x00-\x7f]/.test(pw),
});

/** Runs of 4+ characters that follow a keyboard or alphabet sequence (forwards or backwards). */
function sequenceRuns(pw) {
  const s = pw.toLowerCase();
  let best = 0;
  for (const seq of SEQUENCES) {
    for (const line of [seq, [...seq].reverse().join('')]) {
      for (let i = 0; i + 4 <= line.length; i++) {
        let len = 4;
        if (!s.includes(line.slice(i, i + len))) continue;
        while (i + len < line.length && s.includes(line.slice(i, i + len + 1))) len++;
        best = Math.max(best, len);
      }
    }
  }
  return best;
}

const deLeet = (s) => s.toLowerCase().replace(/[@483!10$57+]/g, (c) => LEET[c] ?? c);
// "Password@123" → "password": drop the digits/symbols around the word first, then undo leet speak.
const core = (s) => deLeet(s.replace(/^[^a-zA-Z]+|[^a-zA-Z]+$/g, ''));

/**
 * How strong a password is: score 0–4, an entropy estimate in bits, how long a fast offline attack
 * (10 billion guesses a second) would take on average, and plain-language issues and tips.
 * personal: words the password should not contain (your name, email name...).
 */
export function analyzePassword(pw, personal = []) {
  if (!pw) return { score: 0, bits: 0, label: 'Empty', crackSeconds: 0, issues: [], tips: ['Type a password to check it.'] };
  const c = classes(pw);
  const pool = (c.lower ? 26 : 0) + (c.upper ? 26 : 0) + (c.digit ? 10 : 0) + (c.symbol ? 33 : 0) + (c.space ? 1 : 0) + (c.other ? 100 : 0);
  const chars = [...pw];
  let bits = chars.length * Math.log2(Math.max(pool, 2));
  const issues = [];

  const unique = new Set(chars).size;
  if (unique <= Math.ceil(chars.length / 3)) {
    bits = Math.min(bits, unique * 4 + 4);
    issues.push('Repeats the same few characters.');
  }
  const seq = sequenceRuns(pw);
  if (seq) {
    bits -= seq * Math.log2(Math.max(pool, 2)) * 0.75;
    issues.push('Contains a keyboard or alphabet sequence.');
  }
  if (COMMON.has(pw.toLowerCase()) || COMMON.has(deLeet(pw)) || COMMON.has(core(pw))) {
    bits = Math.min(bits, 12);
    issues.push('Is (or is built on) one of the most common passwords.');
  }
  if (/(19|20)\d\d/.test(pw)) {
    bits -= 6;
    issues.push('Contains a year, which attackers try early.');
  }
  const low = deLeet(pw);
  for (const word of personal.map((w) => (w || '').toLowerCase()).filter((w) => w.length >= 3)) {
    if (low.includes(word)) {
      bits = Math.min(bits, 20);
      issues.push('Contains your name or email.');
      break;
    }
  }
  if (chars.length < 12) issues.push(`Is short (${chars.length} characters).`);

  bits = Math.max(0, Math.round(bits));
  const crackSeconds = 2 ** bits / 2 / 1e10;
  const score = bits < 28 ? 0 : bits < 40 ? 1 : bits < 60 ? 2 : bits < 80 ? 3 : 4;
  const tips = [];
  if (chars.length < 16) tips.push('Use 16 or more characters: length matters more than symbols.');
  if (!(c.upper && c.lower && c.digit && c.symbol)) tips.push('Mix upper and lower case, digits and symbols.');
  tips.push('Use a different password for every account, kept in a password manager.');
  return { score, bits, label: ['Very weak', 'Weak', 'Fair', 'Strong', 'Very strong'][score], crackSeconds, issues, tips };
}

/** "instantly", "3 hours", "40 years", "centuries" */
export function humanTime(seconds) {
  if (seconds < 1) return 'instantly';
  const units = [['year', 31_557_600], ['day', 86_400], ['hour', 3600], ['minute', 60], ['second', 1]];
  for (const [name, size] of units) {
    if (seconds >= size) {
      const n = Math.floor(seconds / size);
      if (name === 'year' && n >= 1000) return n >= 1e6 ? 'millions of years' : 'centuries';
      return `${n} ${name}${n === 1 ? '' : 's'}`;
    }
  }
  return 'instantly';
}

const SETS = {
  lower: 'abcdefghijkmnopqrstuvwxyz' + 'l',
  upper: 'ABCDEFGHJKLMNPQRSTUVWXYZ' + 'IO',
  digit: '23456789' + '01',
  symbol: '!@#$%^&*()-_=+[]{};:,.?/~',
};
const AMBIGUOUS = /[Il1O0]/g;

/** A uniformly random integer in [0, max) from the browser's cryptographic generator. */
function randomInt(max, rng) {
  const limit = Math.floor(2 ** 32 / max) * max; // rejection sampling: no modulo bias
  const buf = new Uint32Array(1);
  for (;;) {
    rng(buf);
    if (buf[0] < limit) return buf[0] % max;
  }
}

/**
 * A random password with at least one character from every chosen set.
 * rng: fills a Uint32Array (crypto.getRandomValues by default; tests pass their own).
 */
export function generatePassword({ length = 20, lower = true, upper = true, digit = true, symbol = true, avoidAmbiguous = true } = {}, rng = (a) => crypto.getRandomValues(a)) {
  const chosen = Object.entries({ lower, upper, digit, symbol })
    .filter(([, on]) => on)
    .map(([k]) => (avoidAmbiguous ? SETS[k].replace(AMBIGUOUS, '') : SETS[k]));
  if (!chosen.length) throw new Error('Choose at least one kind of character.');
  const n = Math.max(chosen.length, Math.min(128, Math.floor(length)));
  const all = chosen.join('');
  const out = chosen.map((set) => set[randomInt(set.length, rng)]);
  while (out.length < n) out.push(all[randomInt(all.length, rng)]);
  for (let i = out.length - 1; i > 0; i--) {
    const j = randomInt(i + 1, rng);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out.join('');
}

/**
 * How many times a password appears in known data breaches (Have I Been Pwned). Only the first
 * 5 hex characters of its SHA-1 hash leave this device; the match happens here.
 */
export async function breachCount(pw, fetchImpl = fetch) {
  const digest = await crypto.subtle.digest('SHA-1', new TextEncoder().encode(pw));
  const hex = [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('').toUpperCase();
  const res = await fetchImpl(`https://api.pwnedpasswords.com/range/${hex.slice(0, 5)}`, { headers: { 'Add-Padding': 'true' } });
  if (!res.ok) throw new Error(`The breach check service answered ${res.status}.`);
  const suffix = hex.slice(5);
  for (const line of (await res.text()).split('\n')) {
    const [s, count] = line.trim().split(':');
    if (s === suffix) return Number(count) || 0;
  }
  return 0;
}
