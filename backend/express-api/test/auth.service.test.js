// AuthService tests: the whole banking-style flow, no database (in-memory repositories),
// no email (MemorySender captures the OTPs), and a fake clock to "wait" for expiry/locks.
import assert from 'node:assert/strict';
import { beforeEach, test } from 'node:test';

process.env.NODE_ENV = 'test';
const { createContainer } = await import('../src/container.js');
const { MemorySender } = await import('../src/auth/notifiers.js');
const errors = await import('../src/auth/errors.js');

const GOOD_PW = 'Str0ng!Passphrase';
const ctx = { ip: '203.0.113.7', userAgent: 'node-test' };

let c, auth, inbox, now, purged;
const advance = (ms) => (now += ms);

beforeEach(() => {
  inbox = new MemorySender();
  purged = [];
  c = createContainer({ storage: 'memory', notifier: inbox, purgeUserData: async (u) => purged.push(u.id) });
  auth = c.authService;
  now = Date.now();
  const clock = () => new Date(now);
  auth.clock = clock;
  c.otp.clock = clock;
});

async function registerVerified(email = 'asha@example.com') {
  const reg = await auth.register({ name: 'Asha', email, password: GOOD_PW }, ctx);
  return auth.verifyEmail({ challengeId: reg.challengeId, code: inbox.lastCode() }, ctx);
}

async function fullLogin(email = 'asha@example.com', password = GOOD_PW) {
  const step1 = await auth.login({ email, password }, ctx);
  assert.equal(step1.mfaRequired, true);
  return auth.verifyLogin({ challengeId: step1.challengeId, code: inbox.lastCode() }, ctx);
}

test('rejects weak passwords with a helpful message', async () => {
  await assert.rejects(auth.register({ name: 'Asha', email: 'a@example.com', password: 'password123' }, ctx), (e) => {
    assert.ok(e instanceof errors.ValidationError);
    assert.match(e.message, /uppercase/);
    return true;
  });
});

test('registration requires email OTP verification before login', async () => {
  const reg = await auth.register({ name: 'Asha', email: 'asha@example.com', password: GOOD_PW }, ctx);
  assert.equal(reg.emailVerificationRequired, true);
  assert.equal(reg.maskedDestination, 'a***@example.com');
  assert.match(inbox.sent[0].text, /verification code is \d{6}/);

  const early = await auth.login({ email: 'asha@example.com', password: GOOD_PW }, ctx);
  assert.equal(early.emailVerificationRequired, true); // unverified accounts can't sign in

  await assert.rejects(auth.verifyEmail({ challengeId: early.challengeId, code: '000000' }, ctx), /attempt\(s\) left/);
  const result = await auth.verifyEmail({ challengeId: early.challengeId, code: inbox.lastCode() }, ctx);
  assert.ok(result.accessToken && result.refreshToken);
  assert.equal(result.user.emailVerified, true);
  assert.equal(result.user.passwordHash, undefined); // never leaked
});

test('duplicate email is rejected', async () => {
  await registerVerified();
  await assert.rejects(auth.register({ name: 'X', email: 'ASHA@example.com', password: GOOD_PW }, ctx), errors.ConflictError);
});

test('login is two-step and every OTP is single-use', async () => {
  await registerVerified();
  const step1 = await auth.login({ email: 'asha@example.com', password: GOOD_PW }, ctx);
  const code = inbox.lastCode();
  assert.match(inbox.sent.at(-1).text, /sign-in code/);
  const session = await auth.verifyLogin({ challengeId: step1.challengeId, code }, ctx);
  assert.ok(session.accessToken);
  await assert.rejects(auth.verifyLogin({ challengeId: step1.challengeId, code }, ctx), errors.AuthenticationError);
});

test('an OTP only works for its own purpose', async () => {
  await registerVerified();
  const step1 = await auth.login({ email: 'asha@example.com', password: GOOD_PW }, ctx);
  await assert.rejects(auth.verifyEmail({ challengeId: step1.challengeId, code: inbox.lastCode() }, ctx), /Invalid or expired/);
});

test('OTPs expire', async () => {
  await registerVerified();
  const step1 = await auth.login({ email: 'asha@example.com', password: GOOD_PW }, ctx);
  advance(6 * 60_000);
  await assert.rejects(auth.verifyLogin({ challengeId: step1.challengeId, code: inbox.lastCode() }, ctx), /expired/);
});

test('too many wrong OTP guesses kill the challenge', async () => {
  await registerVerified();
  const step1 = await auth.login({ email: 'asha@example.com', password: GOOD_PW }, ctx);
  const real = inbox.lastCode();
  const wrong = real === '111111' ? '222222' : '111111';
  for (let i = 0; i < 5; i++) await assert.rejects(auth.verifyLogin({ challengeId: step1.challengeId, code: wrong }, ctx));
  await assert.rejects(auth.verifyLogin({ challengeId: step1.challengeId, code: real }, ctx), errors.TooManyRequestsError);
});

test('resend has a cooldown and replaces the old code', async () => {
  await registerVerified();
  const step1 = await auth.login({ email: 'asha@example.com', password: GOOD_PW }, ctx);
  const oldCode = inbox.lastCode();
  await assert.rejects(auth.resendOtp({ challengeId: step1.challengeId }), errors.TooManyRequestsError);
  advance(61_000);
  await auth.resendOtp({ challengeId: step1.challengeId });
  const newCode = inbox.lastCode();
  if (newCode !== oldCode) {
    await assert.rejects(auth.verifyLogin({ challengeId: step1.challengeId, code: oldCode }, ctx));
  }
  assert.ok((await auth.verifyLogin({ challengeId: step1.challengeId, code: newCode }, ctx)).accessToken);
});

test('account locks after 5 wrong passwords, then unlocks after the lock period', async () => {
  await registerVerified();
  for (let i = 0; i < 4; i++) {
    await assert.rejects(auth.login({ email: 'asha@example.com', password: 'Wrong!Password1' }, ctx), errors.AuthenticationError);
  }
  await assert.rejects(auth.login({ email: 'asha@example.com', password: 'Wrong!Password1' }, ctx), errors.AccountLockedError);
  // Even the right password is refused while locked.
  await assert.rejects(auth.login({ email: 'asha@example.com', password: GOOD_PW }, ctx), errors.AccountLockedError);
  advance(16 * 60_000);
  assert.ok((await fullLogin()).accessToken);
});

test('unknown emails get the same error as wrong passwords', async () => {
  await assert.rejects(auth.login({ email: 'nobody@example.com', password: GOOD_PW }, ctx), (e) => {
    assert.equal(e.message, 'Invalid email or password.');
    return true;
  });
});

test('refresh tokens rotate, and reusing an old one signs out every session', async () => {
  const first = await registerVerified();
  const second = await auth.refresh(first.refreshToken, ctx);
  assert.notEqual(second.refreshToken, first.refreshToken);

  advance(11_000); // past the grace window for simultaneous refreshes
  await assert.rejects(auth.refresh(first.refreshToken, ctx), errors.AuthenticationError); // stolen token replayed
  await assert.rejects(auth.refresh(second.refreshToken, ctx), errors.AuthenticationError); // so everything is revoked
  const events = (await auth.securityActivity(first.user.id)).map((e) => e.event);
  assert.ok(events.includes('refresh_token_reuse_detected'));
});

test('sessions can be listed and revoked individually or all at once', async () => {
  const a = await registerVerified();
  const b = await fullLogin();
  const familyOfA = c.tokens.verifyAccess(a.accessToken).sid;
  const list = await auth.listSessions(a.user.id, familyOfA);
  assert.equal(list.length, 2);
  assert.equal(list.filter((s) => s.current).length, 1);

  await auth.revokeSession(a.user.id, familyOfA, ctx);
  await assert.rejects(auth.refresh(a.refreshToken, ctx));
  assert.ok(await auth.refresh(b.refreshToken, ctx));

  await auth.logoutAll(a.user.id, ctx);
  assert.equal((await auth.listSessions(a.user.id)).length, 0);
});

test('forgot password never reveals whether an email exists', async () => {
  await registerVerified();
  const unknown = await auth.forgotPassword({ email: 'nobody@example.com' }, ctx);
  const known = await auth.forgotPassword({ email: 'asha@example.com' }, ctx);
  assert.equal(unknown.message, known.message);
  assert.ok(unknown.challengeId && known.challengeId);
  await assert.rejects(auth.resetPassword({ challengeId: unknown.challengeId, code: '123456', newPassword: 'N3w!Passphrase#' }, ctx));
});

test('password reset with OTP signs out all sessions', async () => {
  const session = await registerVerified();
  const { challengeId } = await auth.forgotPassword({ email: 'asha@example.com' }, ctx);
  const code = inbox.lastCode();
  await assert.rejects(auth.resetPassword({ challengeId, code, newPassword: 'weak' }, ctx), errors.ValidationError);
  await auth.resetPassword({ challengeId, code, newPassword: 'N3w!Passphrase#' }, ctx);
  await assert.rejects(auth.refresh(session.refreshToken, ctx));
  await assert.rejects(auth.login({ email: 'asha@example.com', password: GOOD_PW }, ctx), errors.AuthenticationError);
  assert.ok((await fullLogin('asha@example.com', 'N3w!Passphrase#')).accessToken);
});

test('changing password keeps this session and signs out the others', async () => {
  const here = await registerVerified();
  const elsewhere = await fullLogin();
  const family = c.tokens.verifyAccess(here.accessToken).sid;
  const r = await auth.changePassword(here.user.id, { currentPassword: GOOD_PW, newPassword: 'An0ther!Passphrase' }, family, ctx);
  assert.equal(r.otherSessionsSignedOut, 1);
  assert.ok(await auth.refresh(here.refreshToken, ctx));
  await assert.rejects(auth.refresh(elsewhere.refreshToken, ctx));
});

test('verified phone enables SMS sign-in codes', async () => {
  const s = await registerVerified();
  await assert.rejects(auth.updateProfile(s.user.id, { preferences: { otpChannel: 'sms' } }), errors.ForbiddenError);
  await assert.rejects(auth.startPhoneVerification(s.user.id, '98765', ctx), errors.ValidationError);

  const ch = await auth.startPhoneVerification(s.user.id, '+91 98765 43210', ctx);
  assert.equal(inbox.sent.at(-1).channel, 'sms');
  assert.equal(ch.maskedDestination, '*********3210');
  await auth.verifyPhone(s.user.id, { challengeId: ch.challengeId, code: inbox.lastCode() }, ctx);
  await auth.updateProfile(s.user.id, { preferences: { otpChannel: 'sms' } });

  await auth.login({ email: 'asha@example.com', password: GOOD_PW }, ctx);
  assert.equal(inbox.sent.at(-1).channel, 'sms');
  assert.equal(inbox.sent.at(-1).to, '+919876543210');
});

test('security activity is recorded with IP and device', async () => {
  const s = await registerVerified();
  await assert.rejects(auth.login({ email: 'asha@example.com', password: 'Wrong!Password1' }, ctx));
  const activity = await auth.securityActivity(s.user.id);
  const events = activity.map((e) => e.event);
  for (const e of ['register', 'email_verified', 'login_success', 'login_failed']) assert.ok(events.includes(e), e);
  assert.equal(activity[0].ip, ctx.ip);
});

test('account deletion needs the password and purges all data', async () => {
  const s = await registerVerified();
  const actingUser = { id: s.user.id, role: 'user' };
  await assert.rejects(auth.deleteAccount(s.user.id, 'nope', actingUser, ctx), errors.AuthenticationError);
  await auth.deleteAccount(s.user.id, GOOD_PW, actingUser, ctx);
  assert.deepEqual(purged, [s.user.id]);
  await assert.rejects(auth.refresh(s.refreshToken, ctx));
  await assert.rejects(auth.login({ email: 'asha@example.com', password: GOOD_PW }, ctx), errors.AuthenticationError);
});

function passwordOnlyAuth() {
  const container = createContainer({ storage: 'memory', notifier: inbox, settings: { passwordOnly: true } });
  return container.authService;
}

test('password-only: sign up signs you in, and sign in needs just the password', async () => {
  const simple = passwordOnlyAuth();
  const signedUp = await simple.register({ name: 'Asha', email: 'asha@example.com', password: GOOD_PW }, ctx);
  assert.ok(signedUp.accessToken && signedUp.refreshToken);

  const signedIn = await simple.login({ email: 'asha@example.com', password: GOOD_PW }, ctx);
  assert.ok(signedIn.accessToken && signedIn.refreshToken);
  assert.equal(inbox.sent.length, 0); // no codes at all

  await assert.rejects(simple.login({ email: 'asha@example.com', password: 'Wr0ng!Passphrase' }, ctx), errors.AuthenticationError);
});

test('password-only: an unchecked address never gets admin', async () => {
  const simple = passwordOnlyAuth();
  simple.adminEmails = ['boss@example.com'];
  const signedUp = await simple.register({ name: 'Mallory', email: 'boss@example.com', password: GOOD_PW }, ctx);
  assert.equal(signedUp.user.role, 'user');
  const signedIn = await simple.login({ email: 'boss@example.com', password: GOOD_PW }, ctx);
  assert.equal(signedIn.user.role, 'user');
});

test('password-only: password reset is off, so nobody can take over an account with it', async () => {
  const simple = passwordOnlyAuth();
  await simple.register({ name: 'Asha', email: 'asha@example.com', password: GOOD_PW }, ctx);
  await assert.rejects(simple.forgotPassword({ email: 'asha@example.com' }, ctx), errors.ValidationError);
  assert.equal(inbox.sent.length, 0);
});
