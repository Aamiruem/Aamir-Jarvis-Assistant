// Thin HTTP controller: read the request, call AuthService, shape the response.
// All rules live in src/auth/AuthService.js.
import { Router } from 'express';
import rateLimit from 'express-rate-limit';

export const REFRESH_COOKIE = 'jarvis_rt';

export function createAuthRouter({ authService, passkeyService, requireAuth, settings }) {
  const router = Router();

  // Slows down password and OTP guessing per IP (on top of per-account lockout and OTP attempt limits).
  const limiter = rateLimit({ windowMs: 15 * 60_000, limit: settings.rateLimitPer15Min, standardHeaders: true, legacyHeaders: false });

  const ctx = (req) => ({ ip: req.ip, userAgent: req.get('user-agent') || '' });
  const body = (req) => req.body || {};

  // The refresh token lives in an httpOnly cookie: JavaScript (and so XSS) can't read it,
  // SameSite=Strict stops other sites from sending it, and it's only sent to /api/auth.
  const cookieOptions = { httpOnly: true, secure: settings.cookieSecure, sameSite: 'strict', path: '/api/auth' };

  /** Sends an auth result: refresh token -> cookie, everything else -> JSON. */
  function send(res, result, status = 200) {
    if (result?.refreshToken) {
      const { refreshToken, refreshExpires, ...rest } = result;
      res.cookie(REFRESH_COOKIE, refreshToken, { ...cookieOptions, expires: refreshExpires });
      return res.status(status).json(rest);
    }
    return res.status(status).json(result ?? {});
  }

  // ----- sign up, verify, sign in -----
  router.post('/register', limiter, async (req, res) => send(res, await authService.register(body(req), ctx(req)), 201));
  router.post('/verify-email', limiter, async (req, res) => send(res, await authService.verifyEmail(body(req), ctx(req))));
  router.post('/otp/resend', limiter, async (req, res) => send(res, await authService.resendOtp(body(req))));
  router.post('/login', limiter, async (req, res) => send(res, await authService.login(body(req), ctx(req))));
  router.post('/login/verify', limiter, async (req, res) => send(res, await authService.verifyLogin(body(req), ctx(req))));

  // ----- sessions -----
  router.post('/refresh', async (req, res) => {
    try {
      send(res, await authService.refresh(req.cookies?.[REFRESH_COOKIE], ctx(req)));
    } catch (err) {
      res.clearCookie(REFRESH_COOKIE, cookieOptions);
      throw err;
    }
  });
  router.post('/logout', async (req, res) => {
    await authService.logout(req.cookies?.[REFRESH_COOKIE], ctx(req));
    res.clearCookie(REFRESH_COOKIE, cookieOptions).status(204).end();
  });
  router.post('/logout-all', requireAuth, async (req, res) => {
    const count = await authService.logoutAll(req.user.id, ctx(req));
    res.clearCookie(REFRESH_COOKIE, cookieOptions).json({ signedOut: count });
  });
  router.get('/sessions', requireAuth, async (req, res) => res.json(await authService.listSessions(req.user.id, req.user.sid)));
  router.delete('/sessions/:id', requireAuth, async (req, res) => {
    await authService.revokeSession(req.user.id, req.params.id, ctx(req));
    res.status(204).end();
  });

  // ----- passwords -----
  router.post('/password/forgot', limiter, async (req, res) => send(res, await authService.forgotPassword(body(req), ctx(req))));
  router.post('/password/reset', limiter, async (req, res) => send(res, await authService.resetPassword(body(req), ctx(req))));
  router.post('/password', requireAuth, limiter, async (req, res) =>
    send(res, await authService.changePassword(req.user.id, body(req), req.user.sid, ctx(req))),
  );

  // ----- profile, phone, account -----
  router.get('/me', requireAuth, async (req, res) => res.json(await authService.getProfile(req.user.id)));
  router.patch('/me', requireAuth, async (req, res) => res.json(await authService.updateProfile(req.user.id, body(req))));
  router.post('/me/phone', requireAuth, limiter, async (req, res) =>
    send(res, await authService.startPhoneVerification(req.user.id, body(req).phone, ctx(req))),
  );
  router.post('/me/phone/verify', requireAuth, limiter, async (req, res) =>
    send(res, await authService.verifyPhone(req.user.id, body(req), ctx(req))),
  );
  router.get('/activity', requireAuth, async (req, res) => res.json(await authService.securityActivity(req.user.id)));
  router.delete('/me', requireAuth, limiter, async (req, res) => {
    await authService.deleteAccount(req.user.id, body(req).password, req.user, ctx(req));
    res.clearCookie(REFRESH_COOKIE, cookieOptions).status(204).end();
  });

  // ----- passkeys: Face ID / Touch ID / Windows Hello / fingerprint, no password -----
  // The browser's Origin header says which site asked; PasskeyService only accepts our own.
  const origin = (req) => req.get('origin') || '';
  if (passkeyService) {
    router.post('/passkeys/login/options', limiter, async (req, res) => res.json(await passkeyService.loginOptions(body(req), origin(req))));
    router.post('/passkeys/login', limiter, async (req, res) => send(res, await passkeyService.login(body(req), ctx(req))));
    router.get('/passkeys', requireAuth, async (req, res) => res.json(await passkeyService.list(req.user.id)));
    router.post('/passkeys/register/options', requireAuth, limiter, async (req, res) => res.json(await passkeyService.registrationOptions(req.user.id, origin(req))));
    router.post('/passkeys', requireAuth, limiter, async (req, res) => res.status(201).json(await passkeyService.register(req.user.id, body(req), ctx(req))));
    router.delete('/passkeys/:id', requireAuth, async (req, res) => {
      await passkeyService.remove(req.user.id, req.params.id, ctx(req));
      res.status(204).end();
    });
  }

  return router;
}
