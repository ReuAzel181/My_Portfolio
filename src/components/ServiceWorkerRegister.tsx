'use client';

import { useEffect } from 'react';
import { registerServiceWorker } from '@/utils/serviceWorker';

export default function ServiceWorkerRegister() {
  useEffect(() => {
    registerServiceWorker();
  }, []);
  return null;
} 