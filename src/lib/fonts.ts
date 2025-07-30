import { 
  Inter,
  Space_Grotesk,
  Playfair_Display,
  Oswald,
  DM_Serif_Display,
  Bebas_Neue,
  Comfortaa,
  Quicksand,
  Roboto,
  Montserrat,
  Poppins,
  Lato,
  Open_Sans,
  Nunito,
  Source_Sans_3,
  Raleway,
  Ubuntu,
  Merriweather
} from 'next/font/google'

// Essential fonts
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

// Additional fonts for UI Game
export const dmSerifDisplay = DM_Serif_Display({
  subsets: ['latin'],
  variable: '--font-dm-serif',
  display: 'swap',
  fallback: ['serif'],
  preload: false,
  weight: '400'
})

export const bebasNeue = Bebas_Neue({
  subsets: ['latin'],
  variable: '--font-bebas',
  display: 'swap',
  fallback: ['system-ui', 'arial'],
  preload: false,
  weight: '400'
})

export const comfortaa = Comfortaa({
  subsets: ['latin'],
  variable: '--font-comfortaa',
  display: 'swap',
  fallback: ['system-ui', 'arial'],
  preload: false,
})

export const quicksand = Quicksand({
  subsets: ['latin'],
  variable: '--font-quicksand',
  display: 'swap',
  fallback: ['system-ui', 'arial'],
  preload: false,
})

// Additional popular Google Fonts
export const roboto = Roboto({
  subsets: ['latin'],
  variable: '--font-roboto',
  display: 'swap',
  fallback: ['system-ui', 'arial'],
  preload: false,
  weight: ['300', '400', '500', '700']
})

export const montserrat = Montserrat({
  subsets: ['latin'],
  variable: '--font-montserrat',
  display: 'swap',
  fallback: ['system-ui', 'arial'],
  preload: false,
})

export const poppins = Poppins({
  subsets: ['latin'],
  variable: '--font-poppins',
  display: 'swap',
  fallback: ['system-ui', 'arial'],
  preload: false,
  weight: ['300', '400', '500', '600', '700']
})

export const lato = Lato({
  subsets: ['latin'],
  variable: '--font-lato',
  display: 'swap',
  fallback: ['system-ui', 'arial'],
  preload: false,
  weight: ['300', '400', '700']
})

export const openSans = Open_Sans({
  subsets: ['latin'],
  variable: '--font-open-sans',
  display: 'swap',
  fallback: ['system-ui', 'arial'],
  preload: false,
})

export const nunito = Nunito({
  subsets: ['latin'],
  variable: '--font-nunito',
  display: 'swap',
  fallback: ['system-ui', 'arial'],
  preload: false,
})

export const sourceSans = Source_Sans_3({
  subsets: ['latin'],
  variable: '--font-source-sans',
  display: 'swap',
  fallback: ['system-ui', 'arial'],
  preload: false,
})

export const raleway = Raleway({
  subsets: ['latin'],
  variable: '--font-raleway',
  display: 'swap',
  fallback: ['system-ui', 'arial'],
  preload: false,
})

export const ubuntu = Ubuntu({
  subsets: ['latin'],
  variable: '--font-ubuntu',
  display: 'swap',
  fallback: ['system-ui', 'arial'],
  preload: false,
  weight: ['300', '400', '500', '700']
})

export const merriweather = Merriweather({
  subsets: ['latin'],
  variable: '--font-merriweather',
  display: 'swap',
  fallback: ['serif'],
  preload: false,
  weight: ['300', '400', '700']
})

// Fallback objects for unused fonts
export const abrilFatface = { variable: '' };
export const permanentMarker = { variable: '' };
export const sourceCodePro = { variable: '' }; 