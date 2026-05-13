// Wada Wear — Service Worker
// Cache-first strategy for all static assets. Offline-first.

var CACHE_NAME = 'wada-wear-v1';
var ASSETS = [
  './',
  'index.html',
  'app.css',
  'app.js',
  'color-engine.js',
  'data.js',
  'manifest.json',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'https://cdnjs.cloudflare.com/ajax/libs/chroma-js/2.4.2/chroma.min.js'
];

// Install: pre-cache all static assets
self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      return cache.addAll(ASSETS).catch(function (err) {
        // Don't fail on individual asset errors
        console.warn('SW cache addAll:', err);
      });
    })
  );
  self.skipWaiting();
});

// Activate: clean old caches
self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(
        keys.filter(function (key) {
          return key !== CACHE_NAME;
        }).map(function (key) {
          return caches.delete(key);
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch: cache-first
self.addEventListener('fetch', function (event) {
  // Only handle GET
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then(function (cached) {
      if (cached) return cached;

      return fetch(event.request).then(function (response) {
        // Don't cache non-success responses
        if (!response || response.status !== 200) return response;

        var clone = response.clone();
        caches.open(CACHE_NAME).then(function (cache) {
          cache.put(event.request, clone);
        });

        return response;
      }).catch(function () {
        // Network failed, no cache match — return a simple offline page for navigation requests
        if (event.request.mode === 'navigate') {
          return caches.match('index.html');
        }
      });
    })
  );
});
