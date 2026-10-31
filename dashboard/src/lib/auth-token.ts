// Banking-style token handling (same rules as frontend/src/api.js):
//  - the short-lived access token lives ONLY in memory, never in localStorage, so XSS can't read it
//  - the refresh token is an httpOnly cookie the browser sends to /api/auth/* by itself

let accessToken: string | null = null;
let onExpired: () => void = () => {};

export const getAccessToken = () => accessToken;
export const setAccessToken = (token: string | null) => {
  accessToken = token;
};

/** Called once the refresh cookie is no longer accepted (signed out elsewhere, expired, revoked). */
export const onSessionExpired = (fn: () => void) => {
  onExpired = fn;
};
export const expireSession = () => {
  accessToken = null;
  onExpired();
};
