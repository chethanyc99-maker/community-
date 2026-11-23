/**
 * Prerana PWA Service Worker
 * Provides offline-first resilience across mobile networks (4G/5G), Wi-Fi, LAN, and Ethernet.
 */

const CACHE_NAME = 'prerana-cache-v30';

const STATIC_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './styles/main.css?v=20',
  './styles/playground.css?v=2',
  './scripts/assistive-access.js?v=1',
  './scripts/i18n.js?v=1',
  './scripts/audio.js?v=9',
  './scripts/tts.js?v=9',
  './scripts/storage.js?v=9',
  './scripts/app.js?v=16',
  './scripts/modules/shapes.js?v=11',
  './scripts/modules/daily-skills.js?v=11',
  './scripts/modules/emotions.js?v=11',
  './scripts/modules/counting.js?v=11',
  './scripts/modules/sounds.js?v=11',
  './scripts/modules/calming.js?v=11',
  './scripts/modules/catalog-activities.js?v=11',
  './scripts/modules/special-activities.js?v=11',
  './scripts/modules/playground.js?v=2'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  // Never cache Flask API / authentication routes
  if (event.request.url.includes('/api/')) {
    return;
  }

  // Network-first for all assets so UI & auth changes apply immediately, with offline fallback
  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const copy = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        }
        return networkResponse;
      })
      .catch(() => {
        return caches.match(event.request).then((cached) => {
          if (cached) return cached;
          if (event.request.headers.get('accept')?.includes('text/html')) {
            return caches.match('./index.html');
          }
        });
      })
  );
});
