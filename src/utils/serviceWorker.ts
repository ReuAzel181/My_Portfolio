interface WorkboxEvent {
  isUpdate: boolean;
}

interface Workbox {
  addEventListener: (event: string, callback: (event?: WorkboxEvent) => void) => void;
  register: () => Promise<void>;
}

declare global {
  interface Window {
    workbox?: Workbox;
  }
}

export function registerServiceWorker() {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator && window.workbox !== undefined) {
    const wb = window.workbox;
    
    // Add offline fallback
    wb.addEventListener('installed', (event?: WorkboxEvent) => {
      if (event && !event.isUpdate) {
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

    // Register the service worker after the page is loaded
    window.addEventListener('load', () => {
      wb.register().catch(error => {
        console.error('Service worker registration failed:', error);
      });
    });
  }
} 