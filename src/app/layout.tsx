'use client';

import './globals.css';
import Providers from '@/components/Providers';
import AuthProvider from '@/components/AuthProvider';
import ServiceWorkerRegister from '@/components/ServiceWorkerRegister';
import CustomCursor from '@/components/CustomCursor';
import PageTransition from '@/components/PageTransition';
import CookieConsent from '@/components/CookieConsent';
import MobileWarning from '@/components/MobileWarning';
import { useEffect, useState } from 'react';
import OfflineGame from '@/components/OfflineGame';
import Head from 'next/head';
import {
  inter,
  playfair,
  oswald,
  spaceGrotesk,
  dmSerifDisplay,
  abrilFatface,
  comfortaa,
  quicksand,
  bebasNeue,
  permanentMarker,
  sourceCodePro,
} from '@/lib/fonts';
import { useAnalytics } from '@/hooks/useAnalytics';

export default function RootLayout({
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

  // Base layout structure with head tags
  const baseLayout = (content: React.ReactNode) => (
    <html lang="en" className="scroll-smooth" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/fav-hollow.png" />
        <link rel="apple-touch-icon" href="/fav-hollow.png" />
        <link rel="shortcut icon" href="/fav-hollow.png" />
      </head>
      <body className={`${inter.className} 
        ${playfair.variable} 
        ${oswald.variable} 
        ${spaceGrotesk.variable} 
        ${dmSerifDisplay.variable} 
        ${abrilFatface.variable}
        ${comfortaa.variable}
        ${quicksand.variable}
        ${bebasNeue.variable}
        ${permanentMarker.variable}
        ${sourceCodePro.variable} antialiased`}>
        <ServiceWorkerRegister />
        <AuthProvider>
          <Providers>
            {content}
          </Providers>
        </AuthProvider>
      </body>
    </html>
  );

  // If not mounted yet, render a minimal layout
  if (!isMounted) {
    return baseLayout(children);
  }

  // If offline, show the offline game
  if (isOffline) {
    return baseLayout(
      <div className="w-full h-screen min-h-screen bg-gray-100">
        <OfflineGame />
      </div>
    );
  }

  // If mobile, show the mobile warning
  if (isMobile) {
    return baseLayout(<MobileWarning />);
  }

  // Otherwise, show the normal content
  return baseLayout(
    <PageTransition>
      <CustomCursor />
      {children}
      <CookieConsent />
    </PageTransition>
  );
} 