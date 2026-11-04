// Install Jarvis as an app (Progressive Web App) and share things through the device's share sheet.
// Imported first in main.jsx: the browser's install offer (beforeinstallprompt) fires early.
import { useEffect, useState } from 'react';

let offer = null; // the saved beforeinstallprompt event (Chrome, Edge, Android)
const listeners = new Set();
const notify = () => listeners.forEach((fn) => fn());

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault(); // keep it for our own Install button
    offer = e;
    notify();
  });
  window.addEventListener('appinstalled', () => {
    offer = null;
    notify();
  });
}

export const isStandalone = () =>
  typeof window !== 'undefined' && (window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone === true);

export const platform = () => {
  const ua = typeof navigator === 'undefined' ? '' : navigator.userAgent;
  if (/iPhone|iPad|iPod/i.test(ua)) return 'ios';
  if (/Android/i.test(ua)) return 'android';
  return 'desktop';
};

/** { canPrompt, installed, install() }. install() returns "installed", "dismissed" or "manual". */
export function useInstall() {
  const [, rerender] = useState(0);
  useEffect(() => {
    const fn = () => rerender((n) => n + 1);
    listeners.add(fn);
    return () => listeners.delete(fn);
  }, []);
  return {
    canPrompt: Boolean(offer),
    installed: isStandalone(),
    install: async () => {
      if (!offer) return 'manual';
      offer.prompt();
      const { outcome } = await offer.userChoice;
      offer = null;
      notify();
      return outcome === 'accepted' ? 'installed' : 'dismissed';
    },
  };
}

/** Where to tap when the browser can't show its own install prompt. */
export function installSteps(kind = platform()) {
  if (kind === 'ios') return ['Open Jarvis in Safari.', 'Tap the Share button (the square with an arrow).', 'Choose “Add to Home Screen”, then “Add”.'];
  if (kind === 'android') return ['Open Jarvis in Chrome.', 'Tap the ⋮ menu at the top right.', 'Choose “Install app” or “Add to Home screen”.'];
  return ['Open Jarvis in Chrome or Edge.', 'Click the install icon at the right end of the address bar (or menu ⋮ → “Install Jarvis”).', 'Jarvis opens in its own window, with an icon on your desktop and taskbar.'];
}

/** Shares through the device's share sheet, or copies the link. Returns "shared", "copied" or "cancelled". */
export async function share({ title = 'Jarvis', text = '', url = '' }) {
  if (navigator.share) {
    try {
      await navigator.share({ title, text, ...(url && { url }) });
      return 'shared';
    } catch (e) {
      if (e?.name === 'AbortError') return 'cancelled';
    }
  }
  await navigator.clipboard.writeText([text, url].filter(Boolean).join('\n'));
  return 'copied';
}

/** Production builds only, and only where browsers allow it (HTTPS or localhost). */
export function registerServiceWorker() {
  if (import.meta.env.PROD && 'serviceWorker' in navigator && window.isSecureContext) {
    window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(() => {}));
  }
}
