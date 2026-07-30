/* Service worker for KKO.com — makes the app installable and usable offline.
   Bump CACHE_NAME whenever a deployed file changes, so returning visitors get
   the new version instead of a stale cached copy. */
const CACHE_NAME = 'kko-app-v1';

const CORE_ASSETS = [
  './',
  './index.html',
  './style.css',
  './script.js',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './favicon.svg',
  // Cross-origin, but cdnjs serves proper CORS headers, so this caches cleanly
  // and lets the IMG→PDF tool work offline after the first successful visit.
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Cache each asset independently so one failure (e.g. offline first
      // install, or a blocked cross-origin request) doesn't stop the rest
      // from being cached.
      return Promise.allSettled(
        CORE_ASSETS.map((url) => cache.add(url))
      );
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(
        names.filter((name) => name !== CACHE_NAME).map((name) => caches.delete(name))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;

      return fetch(event.request).then((response) => {
        // Only cache successful, basic (same-origin) or cors responses —
        // never cache error pages or opaque responses we can't verify.
        if (response && response.ok && (response.type === 'basic' || response.type === 'cors')) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        }
        return response;
      }).catch(() => {
        // Fully offline and not cached — for page navigations, fall back to
        // the cached app shell so the user still sees the app, not a browser
        // error page.
        if (event.request.mode === 'navigate') {
          return caches.match('./index.html');
        }
        return new Response('', { status: 504, statusText: 'Offline' });
      });
    })
  );
});
