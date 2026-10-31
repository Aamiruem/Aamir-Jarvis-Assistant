import { ForbiddenError } from '../auth/errors.js';

/** Builds the auth middleware around a TokenService (injected, so tests can use their own). */
export function createAuthMiddleware(tokens) {
  function requireAuth(req, _res, next) {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : '';
    const payload = tokens.verifyAccess(token); // throws AuthenticationError -> 401
    req.user = { id: payload.sub, name: payload.name, role: payload.role || 'user', sid: payload.sid };
    next();
  }

  function requireAdmin(req, _res, next) {
    if (req.user?.role !== 'admin') throw new ForbiddenError('Admin only');
    next();
  }

  return { requireAuth, requireAdmin };
}
