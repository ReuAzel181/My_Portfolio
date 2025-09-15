'use client';

import { useEffect, useState } from 'react';
import Providers from '@/components/Providers';
import ServiceWorkerRegister from '@/components/ServiceWorkerRegister';
import CustomCursor from '@/components/CustomCursor';
import PageTransition from '@/components/PageTransition';
import CookieConsent from '@/components/CookieConsent';

import OfflineGame from '@/components/OfflineGame';
import { useAnalytics } from '@/hooks/useAnalytics';

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  useAnalytics();
  const [isOffline, setIsOffline] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);

    // Set initial online status
    setIsOffline(!navigator.onLine);

    // Add event listeners for online/offline events
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // If not mounted yet, render children directly
  if (!isMounted) {
    return children;
  }

  // If offline, show the offline game
  if (isOffline) {
    return (
      <div className="w-full h-screen min-h-screen bg-gray-100">
        <OfflineGame />
      </div>
    );
  }

  // Mobile devices now show the normal responsive content

  // Otherwise, show the normal content
  return (
    <>
      <ServiceWorkerRegister />
      <Providers>
        <PageTransition>
          <CustomCursor />
          {children}
          <CookieConsent />
        </PageTransition>
      </Providers>
    </>
  );
}