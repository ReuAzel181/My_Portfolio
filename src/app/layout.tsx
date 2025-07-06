'use client';

import './globals.css';
import Providers from '@/components/Providers';
import AuthProvider from '@/components/AuthProvider';
import ServiceWorkerRegister from '@/components/ServiceWorkerRegister';
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
  const [mounted, setMounted] = useState(false);
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Set initial online status only after mounting
    if (typeof window !== 'undefined') {
      setIsOffline(!navigator.onLine);
    }

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

  // Don't render anything until after mounting to avoid hydration mismatch
  if (!mounted) {
    return null;
  }

  // If offline, show the offline game
  if (isOffline) {
    return (
      <html lang="en" className="scroll-smooth" suppressHydrationWarning>
        <head>
          <meta charSet="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <meta name="theme-color" content="#000000" />
          <link rel="manifest" href="/manifest.json" />
          <link rel="icon" href="/fav-solid.png" />
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
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#000000" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="/fav-solid.png" />
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
            {children}
          </Providers>
        </AuthProvider>
      </body>
    </html>
  );
} 