// Real-delivery senders: routing by channel and the Twilio request shape (fetch is stubbed).
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { ChannelRouter, ConsoleSender, SmtpEmailSender, TwilioSmsSender, createNotifier } from '../src/auth/notifiers.js';

test('smtp provider: email over SMTP as the app name, SMS falls back to the terminal without Twilio', () => {
  const n = createNotifier({ provider: 'smtp', appName: 'Aamir Jarvis Assistant', smtp: { host: 'smtp.gmail.com', port: 465, user: 'me@gmail.com', pass: 'x' } });
  assert.ok(n instanceof ChannelRouter);
  assert.ok(n.byChannel.email instanceof SmtpEmailSender);
  assert.deepEqual(n.byChannel.email.from, { name: 'Aamir Jarvis Assistant', address: 'me@gmail.com' });
  assert.equal(n.byChannel.email.options.secure, true);
  assert.ok(n.byChannel.sms instanceof ConsoleSender);
});

test('smtp provider without credentials fails at startup, not at first sign-up', () => {
  assert.throws(() => createNotifier({ provider: 'smtp', smtp: { user: '', pass: '' } }), /SMTP_USER and SMTP_PASS/);
});

test('Twilio sender posts the message with basic auth', async (t) => {
  const calls = [];
  t.mock.method(globalThis, 'fetch', async (url, init) => {
    calls.push({ url, init });
    return new Response('{}', { status: 201 });
  });
  await new TwilioSmsSender({ accountSid: 'AC1', authToken: 'tok', from: '+15550001111' }).send({ to: '+919876543210', text: 'code 123456' });
  assert.equal(calls[0].url, 'https://api.twilio.com/2010-04-01/Accounts/AC1/Messages.json');
  assert.equal(calls[0].init.headers.Authorization, `Basic ${Buffer.from('AC1:tok').toString('base64')}`);
  assert.equal(calls[0].init.body.get('To'), '+919876543210');
  assert.equal(calls[0].init.body.get('Body'), 'code 123456');
});

test('OtpService returns the code as devCode only when revealCodes is on', async () => {
  const { OtpService } = await import('../src/auth/OtpService.js');
  const { InMemoryOtpRepository } = await import('../src/repositories/memory.js');
  const make = (revealCodes) => new OtpService({ otpRepo: new InMemoryOtpRepository(), notifier: new ConsoleSender(), secret: 's', revealCodes });
  const shown = await make(true).issue({ userId: 'u1', purpose: 'verify_email', destination: 'a@b.com' });
  assert.match(shown.devCode, /^\d{6}$/);
  const hidden = await make(false).issue({ userId: 'u1', purpose: 'verify_email', destination: 'a@b.com' });
  assert.equal(hidden.devCode, undefined);
});
