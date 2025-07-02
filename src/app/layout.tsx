import './globals.css'
import { Inter } from 'next/font/google'
import Providers from '@/components/Providers'
import CustomCursor from '@/components/CustomCursor'
import RootErrorBoundary from '@/components/RootErrorBoundary'
import AuthProvider from '@/components/AuthProvider'
import PageTransition from '@/components/PageTransition'
import CookieConsent from '@/components/CookieConsent'
import type { Metadata } from 'next'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Reu Uzziel - Portfolio',
  description: 'UI/UX Designer & Developer with a Computer Science Degree',
  keywords: ['UI/UX Designer', 'Developer', 'Web Development', 'Portfolio', 'React', 'Next.js'],
  authors: [{ name: 'Reu Uzziel' }],
  creator: 'Reu Uzziel',
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
      <body className={inter.className}>
        <AuthProvider>
          <Providers>
            <RootErrorBoundary>
              <CustomCursor />
              <PageTransition>
                {children}
                <CookieConsent />
              </PageTransition>
            </RootErrorBoundary>
          </Providers>
        </AuthProvider>
      </body>
    </html>
  )
} 