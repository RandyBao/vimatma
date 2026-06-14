// Programmatically calculate BASE_PATH based on where this service worker is placed.
// For e.g. on Vercel: "/sw.js" -> ""
// For GitHub Pages: "/quanlimatkhau/sw.js" -> "/quanlimatkhau"
// Last Updated: 2026-06-07T10:08:00Z (Fast PWA Hot Reload Update)
const SW_PATH = self.location.pathname;
const BASE_PATH = SW_PATH.substring(0, SW_PATH.lastIndexOf('/')) || '';
const CACHE_NAME = 'secure-vault-cache-v4';

// Standard static files to cache initially
const ASSETS_TO_CACHE = [
  `${BASE_PATH}/`,
  `${BASE_PATH}/index.html`,
  `${BASE_PATH}/manifest.json`
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[PWA SW] Pre-caching core shell roots...');
      return cache.addAll(ASSETS_TO_CACHE).catch((err) => {
        console.warn('[PWA SW] Failed to pre-cache some roots, falling back to root cache: ', err);
        return cache.add(`${BASE_PATH}/`).catch(() => {});
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('[PWA SW] Removing old cache:', cache);
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Only handle GET requests and local same-origin assets
  if (event.request.method !== 'GET' || !event.request.url.startsWith(self.location.origin)) {
    return;
  }

  const requestUrl = new URL(event.request.url);

  // Exclude third-party dynamic links or cloud hosting rules
  if (requestUrl.pathname.includes('/api/')) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // 1. Initiate network fetch to get updated copy (Stale-While-Revalidate pattern)
      const fetchPromise = fetch(event.request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      });

      // 2. Return cached response immediately if it exists (smooth, instant loading offline)
      if (cachedResponse) {
        // Run fetch in background to update cache without blocking
        fetchPromise.catch((err) => {
          console.debug('[PWA SW] Background fetch failed (switched to offline cached version):', err);
        });
        return cachedResponse;
      }

      // 3. Fallback to network if no cache exists
      return fetchPromise.catch((err) => {
        console.warn('[PWA SW] Network fetch failed and no cache fallback exists:', err);
        // Fallback for document navigation when fully offline
        if (event.request.mode === 'navigate') {
          return caches.match(`${BASE_PATH}/`) || caches.match(`${BASE_PATH}/index.html`);
        }
        throw err;
      });
    })
  );
});
