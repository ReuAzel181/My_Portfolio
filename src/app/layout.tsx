import './globals.css'
import { Inter } from 'next/font/google'
import Providers from '@/components/Providers'
import CustomCursor from '@/components/CustomCursor'
import RootErrorBoundary from '@/components/RootErrorBoundary'
import AuthProvider from '@/components/AuthProvider'
import PageTransition from '@/components/PageTransition'
import CookieConsent from '@/components/CookieConsent'
import type { Metadata } from 'next'
import { 
  Playfair_Display, 
  Oswald, 
  Space_Grotesk, 
  DM_Serif_Display, 
  Abril_Fatface, 
  Comfortaa,
  Quicksand,
  Bebas_Neue,
  Permanent_Marker,
  Source_Code_Pro
} from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
})

const oswald = Oswald({
  subsets: ['latin'],
  variable: '--font-oswald',
})

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk',
})

const dmSerifDisplay = DM_Serif_Display({
  weight: ['400'],
  subsets: ['latin'],
  variable: '--font-dm-serif',
})

const abrilFatface = Abril_Fatface({
  weight: ['400'],
  subsets: ['latin'],
  variable: '--font-abril',
})

const comfortaa = Comfortaa({
  subsets: ['latin'],
  variable: '--font-comfortaa',
})

const quicksand = Quicksand({
  subsets: ['latin'],
  variable: '--font-quicksand',
})

const bebasNeue = Bebas_Neue({
  weight: ['400'],
  subsets: ['latin'],
  variable: '--font-bebas',
})

const permanentMarker = Permanent_Marker({
  weight: ['400'],
  subsets: ['latin'],
  variable: '--font-marker',
})

const sourceCodePro = Source_Code_Pro({
  subsets: ['latin'],
  variable: '--font-source-code',
})

export const metadata: Metadata = {
  title: 'Reu Banta | Portfolio',
  description: 'Portfolio Website',
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