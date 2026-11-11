const list = (value) =>
  (value || '')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
const num = (value, fallback) => (value === undefined || value === '' ? fallback : Number(value));
const bool = (value, fallback) => (value === undefined || value.trim() === '' ? fallback : value.trim() === 'true');

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: num(process.env.PORT, 4000),
  // MONGODB_URI is what Vercel's MongoDB Atlas integration sets.
  mongoUri: (process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/jarvis').trim(),
  aiServiceUrl: process.env.AI_SERVICE_URL || 'http://localhost:8001',
  aiWaitMs: num(process.env.AI_WAIT_MS, 20_000), // how long a request waits for a restarting AI service
  chatIdleMs: num(process.env.CHAT_IDLE_MS, 180_000), // give up on a chat reply that sends nothing for this long
  internalApiKey: process.env.INTERNAL_API_KEY || 'change-me-internal-key',
  corsOrigins: list(process.env.CLIENT_ORIGINS || 'http://localhost:5173,http://localhost:3000'),
  adminEmails: list(process.env.ADMIN_EMAILS), // these accounts get role "admin"
  // Quick public demo with no email service: the verification code is shown on the page
  // instead of emailed. Anyone can register (the email isn't really checked), so only for a demo.
  demoMode: bool(process.env.DEMO_MODE, false),

  // Scaling. WEB_CONCURRENCY: API worker processes per container ("auto" = one per CPU core;
  // needs MongoDB). DRAIN_MS: on shutdown, how long to report "not ready" before closing, so the
  // load balancer moves traffic away first. SHUTDOWN_TIMEOUT_MS: then wait this long for requests
  // in progress (a streaming chat reply) before stopping anyway.
  workers: process.env.WEB_CONCURRENCY === 'auto' ? 0 : num(process.env.WEB_CONCURRENCY, 1),
  drainMs: num(process.env.DRAIN_MS, process.env.NODE_ENV === 'production' ? 5000 : 0),
  shutdownTimeoutMs: num(process.env.SHUTDOWN_TIMEOUT_MS, 25_000),

  // Passkeys (Face ID / Touch ID / Windows Hello / fingerprint sign-in). The browser only
  // allows them on https:// sites and on localhost. origins: the exact addresses the app is
  // opened from; rpId: the domain they belong to (default: the host of the page).
  passkeys: {
    origins: list(process.env.PASSKEY_ORIGINS || process.env.CLIENT_ORIGINS || 'http://localhost:5173,http://localhost:3000'),
    rpId: (process.env.PASSKEY_RP_ID || '').trim(),
  },

  auth: {
    jwtSecret: process.env.JWT_SECRET || 'dev-only-change-me',
    accessTokenTtl: process.env.ACCESS_TOKEN_TTL || '15m', // short-lived; renewed with the refresh token
    refreshTokenDays: num(process.env.REFRESH_TOKEN_DAYS, 7),
    cookieSecure: bool(process.env.COOKIE_SECURE, process.env.NODE_ENV === 'production'),
    maxFailedLogins: num(process.env.MAX_FAILED_LOGINS, 5),
    lockMinutes: num(process.env.LOCK_MINUTES, 15),
    loginOtpRequired: bool(process.env.LOGIN_OTP_REQUIRED, true), // 2-step login, like net banking
    // Plain email + password for a site with no email service: no codes, addresses are not
    // checked, so ADMIN_EMAILS grants nothing, and password reset is off.
    passwordOnly: bool(process.env.PASSWORD_ONLY, false),
    rateLimitPer15Min: num(process.env.AUTH_RATE_LIMIT, 30),
  },

  otp: {
    secret: process.env.OTP_SECRET || process.env.JWT_SECRET || 'dev-only-otp-secret',
    ttlMinutes: num(process.env.OTP_TTL_MINUTES, 5),
    maxAttempts: num(process.env.OTP_MAX_ATTEMPTS, 5),
    resendCooldownSeconds: num(process.env.OTP_RESEND_COOLDOWN, 60),
    maxResends: num(process.env.OTP_MAX_RESENDS, 3),
  },

  notifications: {
    // console: OTPs are printed in the server terminal (development)
    // smtp:    email via SMTP (e.g. Gmail App Password), SMS via Twilio if set (else terminal)
    // aws:     email via Amazon SES, SMS via Amazon SNS
    provider: process.env.OTP_PROVIDER || 'console',
    appName: process.env.APP_NAME || 'Azarvis', // sender name people see
    awsRegion: process.env.AWS_REGION || 'ap-south-1',
    sesFromEmail: process.env.SES_FROM_EMAIL || '',
    smtp: {
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: num(process.env.SMTP_PORT, 465),
      user: process.env.SMTP_USER || '',
      pass: (process.env.SMTP_PASS || '').replace(/\s+/g, ''), // Gmail shows app passwords with spaces
    },
    twilio: {
      accountSid: process.env.TWILIO_ACCOUNT_SID || '',
      authToken: process.env.TWILIO_AUTH_TOKEN || '',
      from: process.env.TWILIO_FROM_NUMBER || '',
    },
  },
};

if (config.env === 'production') {
  for (const [name, value] of [['JWT_SECRET', config.auth.jwtSecret], ['OTP_SECRET', config.otp.secret]]) {
    if (!value || value.startsWith('dev-only')) throw new Error(`Set ${name} in production`);
  }
  if (config.notifications.provider === 'console' && !config.demoMode && !config.auth.passwordOnly)
    throw new Error('Set OTP_PROVIDER=smtp or aws in production, or PASSWORD_ONLY=true for plain email + password');
}
