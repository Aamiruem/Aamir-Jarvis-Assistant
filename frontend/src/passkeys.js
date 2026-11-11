// Passkeys: sign in with Face ID, Touch ID, Windows Hello, an Android fingerprint or the
// device PIN instead of a password. The device keeps the private key; the server only checks
// a signature (see backend/express-api/src/auth/PasskeyService.js).
import { browserSupportsWebAuthn, platformAuthenticatorIsAvailable, startAuthentication, startRegistration } from '@simplewebauthn/browser';
import { api, auth, setAccessToken } from './api.js';

/** Browsers only allow passkeys on https:// pages and on localhost. */
export const passkeysSupported = () => window.isSecureContext && browserSupportsWebAuthn();

/** True when this device has its own unlock (Face ID, Touch ID, Windows Hello, fingerprint). */
export const deviceUnlockAvailable = () => (passkeysSupported() ? platformAuthenticatorIsAvailable().catch(() => false) : Promise.resolve(false));

/** What to say about this device's unlock, for button labels. */
export function unlockName() {
  const ua = navigator.userAgent;
  if (/iPhone|iPad/.test(ua)) return 'Face ID or Touch ID';
  if (/Macintosh|Mac OS X/.test(ua)) return 'Touch ID';
  if (/Windows/.test(ua)) return 'Windows Hello';
  if (/Android/.test(ua)) return 'fingerprint or face unlock';
  return 'your device lock';
}

// The browser's own errors, in words a person understands.
function friendly(err) {
  if (err?.name === 'NotAllowedError' || err?.name === 'AbortError') return new Error('Passkey cancelled or timed out. Try again when you are ready.');
  if (err?.name === 'InvalidStateError') return new Error('This device already has a passkey for your account.');
  if (err?.name === 'SecurityError') return new Error('Passkeys need the secure (https) address of Azarvis, or localhost on this computer.');
  return err;
}

/** Signs in with a passkey. email is optional: without it the device offers its saved passkeys. */
export async function signInWithPasskey(email = '') {
  const { challengeId, options } = await auth.passkeyOptions(email);
  let response;
  try {
    response = await startAuthentication({ optionsJSON: options });
  } catch (err) {
    throw friendly(err);
  }
  const result = await auth.passkeyLogin(challengeId, response);
  setAccessToken(result.accessToken);
  return result.user;
}

/** Adds a passkey for the signed-in account on this device. */
export async function addPasskey(name) {
  const { challengeId, options } = await api.passkeyRegisterOptions();
  let response;
  try {
    response = await startRegistration({ optionsJSON: options });
  } catch (err) {
    throw friendly(err);
  }
  return api.addPasskey(challengeId, response, name);
}
