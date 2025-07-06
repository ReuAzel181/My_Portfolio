import './globals.css'
import Providers from '@/components/Providers'
import CustomCursor from '@/components/CustomCursor'
import AuthProvider from '@/components/AuthProvider'
import PageTransition from '@/components/PageTransition'
import CookieConsent from '@/components/CookieConsent'
import type { Metadata } from 'next'
import { useEffect } from 'react'
import ServiceWorkerRegister from '@/components/ServiceWorkerRegister'
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
  sourceCodePro
} from '@/lib/fonts'

export const metadata: Metadata = {
  title: 'Reu Banta | Portfolio',
  description: 'Portfolio Website',
  keywords: ['UI/UX Designer', 'Developer', 'Web Development', 'Portfolio', 'React', 'Next.js'],
  authors: [{ name: 'Reu Uzziel' }],
  creator: 'Reu Uzziel',
  manifest: '/manifest.json',
  themeColor: '#000000',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Reu Banta | Portfolio',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://your-domain.com',
    title: 'Reu',
    description: 'Portfolio of Reu Uzziel, a UI/UX Designer & Developer with a Computer Science degree.',
    siteName: 'Reu Uzziel Portfolio',
    images: [
      {
        url: 'https://your-domain.com/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Reu Uzziel Portfolio',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Reu',
    description: 'Portfolio of Reu Uzziel, a UI/UX Designer & Developer with a Computer Science degree.',
    creator: '@yourtwitterhandle',
    images: ['https://your-domain.com/twitter-image.jpg'],
  },
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
  },
  icons: {
    icon: '/fav-hollow.png',
    shortcut: '/fav-hollow.png',
    apple: '/fav-hollow.png',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
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
            <CustomCursor />
            <PageTransition>
              {children}
              <CookieConsent />
            </PageTransition>
          </Providers>
        </AuthProvider>
      </body>
    </html>
  )
} 