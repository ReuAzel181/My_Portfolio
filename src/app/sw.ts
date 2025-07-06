import { precacheAndRoute } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { StaleWhileRevalidate, CacheFirst } from 'workbox-strategies';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';

declare let self: ServiceWorkerGlobalScope & {
  addEventListener: (type: string, listener: EventListener) => void;
  __WB_MANIFEST: any[];
};

// Type declarations for Service Worker events
interface ExtendableEvent extends Event {
  waitUntil(fn: Promise<any>): void;
}

interface FetchEvent extends ExtendableEvent {
  request: Request;
  respondWith(response: Promise<Response> | Response): void;
}

// Precache and route all static assets
precacheAndRoute(self.__WB_MANIFEST);

// Cache page navigations (html) with a Stale While Revalidate strategy
registerRoute(
  ({ request }) => request.mode === 'navigate',
  new StaleWhileRevalidate({
    cacheName: 'pages-cache',
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
    ],
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
  const extendableEvent = event as ExtendableEvent;
  const offlineFallbackPage = '/offline';
  extendableEvent.waitUntil(
    caches
      .open('offline-cache')
      .then((cache) => cache.add(offlineFallbackPage))
  );
});

self.addEventListener('fetch', (event) => {
  const fetchEvent = event as FetchEvent;
  if (fetchEvent.request.mode === 'navigate') {
    fetchEvent.respondWith(
      fetch(fetchEvent.request).catch(() => {
        return caches.match('/offline').then(response => {
          return response || new Response('Offline');
        });
      })
    );
  }
}); 