// How OTPs reach the user. OOP: an abstract base class plus interchangeable subclasses
// (polymorphism). OtpService calls notifier.send(...) without knowing which one it has.

export class NotificationSender {
  /** @param {{to: string, channel: 'email'|'sms', subject: string, text: string}} message */
  async send(message) {
    throw new Error(`${this.constructor.name} must implement send()`);
  }
}

/** Development: prints the message in the server terminal. */
export class ConsoleSender extends NotificationSender {
  async send({ to, channel, text }) {
    console.log(`\n[OTP via ${channel} -> ${to}] ${text}\n`);
  }
}

/** Tests: keeps messages in memory so a test can read the code. */
export class MemorySender extends NotificationSender {
  constructor() {
    super();
    this.sent = [];
  }

  async send(message) {
    this.sent.push(message);
  }

  lastCode() {
    return this.sent.at(-1)?.text.match(/\b(\d{6})\b/)?.[1];
  }
}

/** Email through Amazon SES (the FROM address must be verified in SES). */
export class SesEmailSender extends NotificationSender {
  constructor({ region, from }) {
    super();
    if (!from) throw new Error('SES_FROM_EMAIL is required for the SES sender');
    this.region = region;
    this.from = from;
  }

  async send({ to, subject, text }) {
    const { SESv2Client, SendEmailCommand } = await import('@aws-sdk/client-sesv2');
    this.client ??= new SESv2Client({ region: this.region });
    await this.client.send(
      new SendEmailCommand({
        FromEmailAddress: this.from,
        Destination: { ToAddresses: [to] },
        Content: { Simple: { Subject: { Data: subject }, Body: { Text: { Data: text } } } },
      }),
    );
  }
}

/** SMS through Amazon SNS (phone numbers in E.164 format, e.g. +919876543210). */
export class SnsSmsSender extends NotificationSender {
  constructor({ region }) {
    super();
    this.region = region;
  }

  async send({ to, text }) {
    const { SNSClient, PublishCommand } = await import('@aws-sdk/client-sns');
    this.client ??= new SNSClient({ region: this.region });
    await this.client.send(
      new PublishCommand({
        PhoneNumber: to,
        Message: text,
        MessageAttributes: { 'AWS.SNS.SMS.SMSType': { DataType: 'String', StringValue: 'Transactional' } },
      }),
    );
  }
}

/** Email through any SMTP server, e.g. Gmail with an App Password (smtp.gmail.com:465). */
export class SmtpEmailSender extends NotificationSender {
  constructor({ host, port, user, pass, fromName }) {
    super();
    if (!user || !pass) throw new Error('SMTP_USER and SMTP_PASS are required for OTP_PROVIDER=smtp');
    this.options = { host, port, secure: port === 465, auth: { user, pass } };
    this.from = { name: fromName, address: user }; // inbox shows "Azarvis"
  }

  async send({ to, subject, text }) {
    const nodemailer = (await import('nodemailer')).default;
    this.transport ??= nodemailer.createTransport(this.options);
    await this.transport.sendMail({ from: this.from, to, subject, text });
  }
}

/** SMS through Twilio's REST API (no SDK needed). Numbers in E.164 format, e.g. +919876543210. */
export class TwilioSmsSender extends NotificationSender {
  constructor({ accountSid, authToken, from }) {
    super();
    this.accountSid = accountSid;
    this.authToken = authToken;
    this.from = from;
  }

  async send({ to, text }) {
    const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${this.accountSid}/Messages.json`, {
      method: 'POST',
      headers: { Authorization: `Basic ${Buffer.from(`${this.accountSid}:${this.authToken}`).toString('base64')}` },
      body: new URLSearchParams({ To: to, From: this.from, Body: text }),
    });
    if (!res.ok) throw new Error(`Twilio SMS failed (${res.status}): ${(await res.json().catch(() => ({}))).message ?? ''}`);
  }
}

/** Sends each message through the sender for its channel (composition). */
export class ChannelRouter extends NotificationSender {
  constructor({ email, sms }) {
    super();
    this.byChannel = { email, sms };
  }

  async send(message) {
    const sender = this.byChannel[message.channel];
    if (!sender) throw new Error(`No sender configured for channel "${message.channel}"`);
    return sender.send(message);
  }
}

/** Factory: builds the right sender from config. */
export function createNotifier({ provider, awsRegion, sesFromEmail, appName, smtp, twilio }) {
  if (provider === 'smtp') {
    // SMS goes through Twilio when it's configured; otherwise SMS codes are printed in the terminal.
    return new ChannelRouter({
      email: new SmtpEmailSender({ ...smtp, fromName: appName }),
      sms: twilio?.accountSid ? new TwilioSmsSender(twilio) : new ConsoleSender(),
    });
  }
  if (provider === 'aws') {
    return new ChannelRouter({
      email: new SesEmailSender({ region: awsRegion, from: sesFromEmail }),
      sms: new SnsSmsSender({ region: awsRegion }),
    });
  }
  return new ConsoleSender();
}
