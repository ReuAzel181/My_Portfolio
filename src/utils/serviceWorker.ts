import { Workbox } from 'workbox-window';

export function registerServiceWorker() {
  if (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    process.env.NODE_ENV === 'production'
  ) {
    const wb = new Workbox('/sw.js');

    // Add offline fallback
    wb.addEventListener('installed', (event) => {
      if (!event.isUpdate) {
        // First-time install
        console.log('Service Worker installed for the first time!');
      }
    });

    wb.addEventListener('waiting', () => {
      // New service worker waiting
      console.log('New service worker waiting');
    });

    wb.addEventListener('activated', () => {
      // New service worker activated
      console.log('New service worker activated');
    });

    wb.addEventListener('controlling', () => {
      // Service worker is controlling the page
      console.log('Service worker is controlling the page');
      window.location.reload(); // Reload to ensure offline page works
    });

    // Register the service worker after the page is loaded
    window.addEventListener('load', () => {
      wb.register().catch(error => {
        console.error('Service worker registration failed:', error);
      });
    });
  }
} 