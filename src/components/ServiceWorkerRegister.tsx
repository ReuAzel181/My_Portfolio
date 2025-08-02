'use client';

import { useEffect } from 'react';
// TEMPORARILY DISABLED SERVICE WORKER - CACHE ISSUE
// import { registerServiceWorker } from '@/utils/serviceWorker';

export default function ServiceWorkerRegister() {
  useEffect(() => {
    // DISABLE SERVICE WORKER TO CLEAR CACHE
    console.log('🚨 SERVICE WORKER DISABLED FOR CACHE CLEARING');
    
    // Unregister any existing service workers
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(function(registrations) {
        for(let registration of registrations) {
          registration.unregister().then(() => {
            console.log('✅ Service Worker unregistered');
          });
        }
      });
    }
  }, []);
  return null;
} 