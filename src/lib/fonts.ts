import { 
  Inter,
  Space_Grotesk,
  Playfair_Display,
  Oswald
} from 'next/font/google'

// Only load essential fonts to avoid build timeouts
export const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
  fallback: ['system-ui', 'arial'],
  preload: false,
})

export const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk',
  display: 'swap',
  fallback: ['system-ui', 'arial'],
  preload: false,
})

export const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
  fallback: ['serif'],
  preload: false,
})

export const oswald = Oswald({
  subsets: ['latin'],
  variable: '--font-oswald',
  display: 'swap',
  fallback: ['system-ui', 'arial'],
  preload: false,
})

// Fallback objects for unused fonts
export const dmSerifDisplay = { variable: '' };
export const abrilFatface = { variable: '' };
export const comfortaa = { variable: '' };
export const quicksand = { variable: '' };
export const bebasNeue = { variable: '' };
export const permanentMarker = { variable: '' };
export const sourceCodePro = { variable: '' }; 