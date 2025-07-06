'use client';

import './globals.css';
import Providers from '@/components/Providers';
import AuthProvider from '@/components/AuthProvider';
import ServiceWorkerRegister from '@/components/ServiceWorkerRegister';
import CustomCursor from '@/components/CustomCursor';
import PageTransition from '@/components/PageTransition';
import CookieConsent from '@/components/CookieConsent';
import { useEffect, useState } from 'react';
import OfflineGame from '@/components/OfflineGame';
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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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

  // If not mounted yet, render a minimal layout to avoid hydration issues
  if (!isMounted) {
    return (
      <html lang="en" className="scroll-smooth" suppressHydrationWarning>
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
              {children}
            </Providers>
          </AuthProvider>
        </body>
      </html>
    );
  }

  // If offline, show the offline game
  if (isOffline) {
    return (
      <html lang="en" className="scroll-smooth" suppressHydrationWarning>
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
              <div className="w-full h-screen min-h-screen bg-gray-100">
                <OfflineGame />
              </div>
            </Providers>
          </AuthProvider>
        </body>
      </html>
    );
  }

  // Otherwise, show the normal content
  return (
    <html lang="en" className="scroll-smooth" suppressHydrationWarning>
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
            <CustomCursor />
            <PageTransition>
              {children}
              <CookieConsent />
            </PageTransition>
          </Providers>
        </AuthProvider>
      </body>
    </html>
  );
} 