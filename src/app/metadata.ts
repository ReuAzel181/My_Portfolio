import { Metadata } from 'next';

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
}; 