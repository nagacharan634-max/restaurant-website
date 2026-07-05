const CACHE_NAME = 'afc-allagadda-v1';
const ASSETS = [
  '/index.html',
  '/menu.html',
  '/cart.html',
  '/track.html',
  '/css/style.css',
  '/js/config.js',
  '/js/common.js',
  '/manifest.json',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Network-first for API calls (always want fresh menu/orders),
// cache-first for static assets (fast repeat loads, works offline).
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (url.pathname.startsWith('/api')) return; // let it hit network normally
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  );
});
