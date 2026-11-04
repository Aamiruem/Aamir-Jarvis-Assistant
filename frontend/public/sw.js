// Jarvis service worker: makes Jarvis installable and lets the app open instantly (and show its
// screen even offline). It never stores /api responses: those are private and always live.
const CACHE = 'jarvis-shell-v1';
const SHELL = ['/', '/manifest.webmanifest', '/icon.svg', '/icon-192.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))));
  self.clients.claim();
});

const keep = (request, response) => {
  if (response.ok) {
    const copy = response.clone();
    caches.open(CACHE).then((cache) => cache.put(request, copy));
  }
  return response;
};

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin || url.pathname.startsWith('/api/')) return;
  if (url.pathname.startsWith('/assets/')) {
    // Built files have a content hash in their name: a cached copy is always the right one.
    event.respondWith(caches.match(request).then((hit) => hit || fetch(request).then((res) => keep(request, res))));
  } else if (request.mode === 'navigate') {
    // Always the newest app; the saved copy only when there's no connection.
    event.respondWith(fetch(request).then((res) => keep('/', res)).catch(() => caches.match('/')));
  }
});
