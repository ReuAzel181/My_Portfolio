import './globals.css';
import { Metadata } from 'next';
import { inter, playfair, oswald, spaceGrotesk, dmSerifDisplay, abrilFatface, comfortaa, quicksand, bebasNeue, permanentMarker, sourceCodePro } from '@/lib/fonts';
import ClientLayout from '@/components/ClientLayout';

export const metadata: Metadata = {
  title: 'Reu Banta | Portfolio',
  description: 'Portfolio Website',
  // ... other metadata
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="scroll-smooth" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/fav-hollow.png" />
        <link rel="apple-touch-icon" href="/fav-hollow.png" />
        <link rel="shortcut icon" href="/fav-hollow.png" />
        <meta name="web3" content="no" />
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
        <ClientLayout>
          {children}
        </ClientLayout>
      </body>
    </html>
  );
} 