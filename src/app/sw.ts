/// <reference lib="webworker" />

import { precacheAndRoute } from 'workbox-precaching';
import { registerRoute, NavigationRoute } from 'workbox-routing';
import { StaleWhileRevalidate, CacheFirst, NetworkOnly } from 'workbox-strategies';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';

declare let self: ServiceWorkerGlobalScope & {
  __WB_MANIFEST: any[];
};

// Precache and route all static assets
precacheAndRoute(self.__WB_MANIFEST || []);

// Cache page navigations (html) with a Network First strategy
registerRoute(
  ({ request }) => request.mode === 'navigate',
  new NetworkOnly({
    plugins: [
      {
        handlerDidError: async () => {
          return caches.match('/offline') || new Response('Offline');
        }
      }
    ]
  })
);

// Cache CSS, JS, and Web Worker requests with a Stale While Revalidate strategy
registerRoute(
  ({ request }) =>
    request.destination === 'style' ||
    request.destination === 'script' ||
    request.destination === 'worker',
  new StaleWhileRevalidate({
    cacheName: 'assets-cache',
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
    ],
  })
);

// Cache images with a Cache First strategy
registerRoute(
  ({ request }) => request.destination === 'image',
  new CacheFirst({
    cacheName: 'images-cache',
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
    ],
  })
);

// Handle offline fallback
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open('offline-cache')
      .then((cache) => cache.add('/offline'))
  );
});

// Skip waiting on install
self.addEventListener('install', () => {
  self.skipWaiting();
});

// Clear old caches on activate
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== 'offline-cache') {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
}); 