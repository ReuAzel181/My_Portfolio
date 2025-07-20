'use client';

import { useEffect, useState } from 'react';
import Providers from '@/components/Providers';
import ServiceWorkerRegister from '@/components/ServiceWorkerRegister';
import CustomCursor from '@/components/CustomCursor';
import PageTransition from '@/components/PageTransition';
import CookieConsent from '@/components/CookieConsent';
import MobileWarning from '@/components/MobileWarning';
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
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    
    // Function to check if device is mobile
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    // Set initial mobile status
    checkMobile();

    // Set initial online status
    setIsOffline(!navigator.onLine);

    // Add event listeners for online/offline events
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('resize', checkMobile);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('resize', checkMobile);
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

  // If mobile, show the mobile warning
  if (isMobile) {
    return <MobileWarning />;
  }

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