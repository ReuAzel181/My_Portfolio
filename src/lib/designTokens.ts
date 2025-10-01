/**
 * Comprehensive Design Tokens
 * Centralized configuration for all design elements including typography, colors, spacing, and fonts
 * This file serves as the single source of truth for all design-related constants
 */

// ===== TYPOGRAPHY TOKENS =====
export const TYPOGRAPHY = {
  // Font Sizes
  SIZES: {
    // Main hero title
    HERO: '56px',
    
    // Section titles (Design & Graphics, Digital Playground, Featured Projects, What I offer)
    SECTION: '48px',
    
    // Contact title (Let's Connect)
    CONTACT: '20px',
    
    // Card titles
    CARD: '24px',
    
    // Subtitles
    SUBTITLE: '18px',
    
    // Body text
    BODY: '16px',
    
    // Small text
    SMALL: '14px',
    
    // Extra small text
    EXTRA_SMALL: '12px'
  },

  // Mobile Responsive Font Sizes
  RESPONSIVE: {
    HERO: {
      DESKTOP: '56px',
      MOBILE: '48px'
    },
    SECTION: {
      DESKTOP: '48px',
      MOBILE: '40px'
    },
    CONTACT: {
      DESKTOP: '20px',
      MOBILE: '18px'
    },
    CARD: {
      DESKTOP: '24px',
      MOBILE: '20px'
    },
    BODY: {
      DESKTOP: '16px',
      MOBILE: '16px'
    },
  },
  
  // Font Weights
  WEIGHTS: {
    LIGHT: '300',
    REGULAR: '400',
    MEDIUM: '500',
    SEMIBOLD: '600',
    BOLD: '700',
    EXTRABOLD: '800'
  },
  
  // Line Heights
  LINE_HEIGHTS: {
    TIGHT: '1.2',
    NORMAL: '1.5',
    RELAXED: '1.6',
    LOOSE: '1.8'
  }
} as const;

// ===== COLOR TOKENS =====
export const COLORS = {
  // Text Colors
  TEXT: {
    PRIMARY: 'rgb(17, 24, 39)', // gray-900
    PRIMARY_DARK: 'rgb(243, 244, 246)', // gray-100
    SECONDARY: 'rgb(107, 114, 128)', // gray-500
    SECONDARY_DARK: 'rgb(156, 163, 175)', // gray-400
    MUTED: 'rgb(156, 163, 175)', // gray-400
    MUTED_DARK: 'rgb(107, 114, 128)', // gray-500
    ACCENT: 'rgb(59, 130, 246)', // blue-500
    SUCCESS: 'rgb(34, 197, 94)', // green-500
    WARNING: 'rgb(245, 158, 11)', // amber-500
    ERROR: 'rgb(239, 68, 68)', // red-500
  },
  
  // Background Colors
  BACKGROUND: {
    PRIMARY: 'rgb(255, 255, 255)', // white
    PRIMARY_DARK: 'rgb(17, 24, 39)', // gray-900
    SECONDARY: 'rgb(249, 250, 251)', // gray-50
    SECONDARY_DARK: 'rgb(31, 41, 55)', // gray-800
    CARD: 'rgb(255, 255, 255)', // white
    CARD_DARK: 'rgb(31, 41, 55)', // gray-800
    OVERLAY: 'rgba(0, 0, 0, 0.5)',
    OVERLAY_LIGHT: 'rgba(0, 0, 0, 0.1)'
  },
  
  // Border Colors
  BORDER: {
    DEFAULT: 'rgb(229, 231, 235)', // gray-200
    DEFAULT_DARK: 'rgb(75, 85, 99)', // gray-600
    MUTED: 'rgb(243, 244, 246)', // gray-100
    MUTED_DARK: 'rgb(55, 65, 81)', // gray-700
    ACCENT: 'rgb(59, 130, 246)', // blue-500
  },
  
  // Brand Colors
  BRAND: {
    PRIMARY: 'rgb(59, 130, 246)', // blue-500
    SECONDARY: 'rgb(147, 51, 234)', // purple-600
    ACCENT: 'rgb(16, 185, 129)', // emerald-500
  },
  
  // Contextual Colors - Enhanced system for different background contexts
  CONTEXTUAL: {
    TITLE: {
      LIGHT_BG: '#385780',     
      DARK_BG: '#ffffff',      
      BRAND_BG: '#ffffff',     
      BLACK_BG: '#000000',     
      GRADIENT_BG: '#ffffff'   
    },
    SUBTITLE: {
      LIGHT_BG: '#6b7280',     
      DARK_BG: '#d1d5db',     
      BRAND_BG: '#f3f4f6',     
      BLACK_BG: '#000000',     
      GRADIENT_BG: '#f9fafb'   
    },
    TEXT: {
      LIGHT_BG: '#1f2937',     
      DARK_BG: '#f9fafb',     
      BRAND_BG: '#ffffff',     
      BLACK_BG: '#000000',     
      GRADIENT_BG: '#374151'   
    },
    ACCENT: {
      LIGHT_BG: '#3b82f6',     
      DARK_BG: '#60a5fa',     
      BRAND_BG: '#fbbf24',     
      BLACK_BG: '#3b82f6',     
      GRADIENT_BG: '#8b5cf6'   
    }
  }
} as const;

// ===== SPACING TOKENS =====
export const SPACING = {
  // Padding values
  PADDING: {
    NONE: '0',
    XS: '4px',
    SM: '8px',
    MD: '16px',
    LG: '24px',
    XL: '32px',
    XXL: '48px',
    XXXL: '64px'
  },

  // Mobile Responsive Padding
  RESPONSIVE: {
    SECTION_PADDING: {
      DESKTOP: '64px',
      MOBILE: '16px'
    },
    SECTION_PADDING_Y: {
      DESKTOP: '80px',
      MOBILE: '40px'
    },
    SECTION_PADDING_X: {
      DESKTOP: '24px',
      MOBILE: '16px'
    },
    HERO_PADDING: {
      DESKTOP: '64px',
      MOBILE: '16px'
    }
  },
  
  // Margin values
  MARGIN: {
    NONE: '0',
    XS: '4px',
    SM: '8px',
    MD: '16px',
    LG: '24px',
    XL: '32px',
    XXL: '48px',
    XXXL: '64px'
  },
  
  // Gap values for flexbox/grid
  GAP: {
    NONE: '0',
    XS: '4px',
    SM: '8px',
    MD: '16px',
    LG: '24px',
    XL: '32px',
    XXL: '48px'
  },
  
  // Section spacing
  SECTION: {
    PADDING_Y: '80px',
    PADDING_X: '24px',
    MARGIN_BOTTOM: '120px'
  },
  
  // Responsive gap values
  RESPONSIVE_GAP: {
    CARDS: {
      DESKTOP: '32px',
      MOBILE: '16px'
    },
    GRID: {
      DESKTOP: '24px',
      MOBILE: '12px'
    },
    FLEX: {
      DESKTOP: '20px',
      MOBILE: '10px'
    }
  }
} as const;

// ===== FONT FAMILY TOKENS =====
export const FONTS = {
  PRIMARY: 'var(--font-poppins)',
  SECONDARY: 'var(--font-space-grotesk)',
  SERIF: 'var(--font-dm-serif)',
  MONO: 'var(--font-source-code-pro)',
  
  HEADING: 'var(--font-poppins)',
  BODY: 'var(--font-poppins)',
  ACCENT: 'var(--font-space-grotesk)',
  
  FALLBACK: {
    SANS: 'system-ui, -apple-system, sans-serif',
    SERIF: 'Georgia, serif',
    MONO: 'Menlo, Monaco, monospace'
  }
} as const;

// ===== BORDER RADIUS TOKENS =====
export const RADIUS = {
  NONE: '0',
  SM: '4px',
  MD: '8px',
  LG: '12px',
  XL: '16px',
  XXL: '24px',
  FULL: '9999px'
} as const;

// ===== SHADOW TOKENS =====
export const SHADOWS = {
  NONE: 'none',
  SM: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  MD: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  LG: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  XL: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  INNER: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)'
} as const;

// ===== LEGACY EXPORTS (for backward compatibility) =====
export const TITLE_SIZES = TYPOGRAPHY.SIZES;
export type TitleSizeKey = keyof typeof TITLE_SIZES;

// Utility functions for responsive design
export const getResponsiveGap = (type: 'CARDS' | 'GRID' | 'FLEX') => ({
  desktop: SPACING.RESPONSIVE_GAP[type].DESKTOP,
  mobile: SPACING.RESPONSIVE_GAP[type].MOBILE,
  css: `gap: ${SPACING.RESPONSIVE_GAP[type].DESKTOP}; @media (max-width: 768px) { gap: ${SPACING.RESPONSIVE_GAP[type].MOBILE}; }`
})

// CSS Custom Properties for responsive typography
export const RESPONSIVE_TYPOGRAPHY_CSS = `
  :root {
    --font-size-hero: ${TYPOGRAPHY.RESPONSIVE.HERO.DESKTOP};
    --font-size-section: ${TYPOGRAPHY.RESPONSIVE.SECTION.DESKTOP};
    --font-size-contact: ${TYPOGRAPHY.RESPONSIVE.CONTACT.DESKTOP};
    --font-size-card: ${TYPOGRAPHY.RESPONSIVE.CARD.DESKTOP};
    --font-size-body: ${TYPOGRAPHY.RESPONSIVE.BODY.DESKTOP};
  }
  
  @media (max-width: 768px) {
    :root {
      --font-size-hero: ${TYPOGRAPHY.RESPONSIVE.HERO.MOBILE};
      --font-size-section: ${TYPOGRAPHY.RESPONSIVE.SECTION.MOBILE};
      --font-size-contact: ${TYPOGRAPHY.RESPONSIVE.CONTACT.MOBILE};
      --font-size-card: ${TYPOGRAPHY.RESPONSIVE.CARD.MOBILE};
      --font-size-body: ${TYPOGRAPHY.RESPONSIVE.BODY.MOBILE};
    }
  }
`;

// Utility functions for responsive typography
export const getResponsiveTypography = (type: 'HERO' | 'SECTION' | 'CONTACT' | 'CARD' | 'BODY') => ({
  desktop: TYPOGRAPHY.RESPONSIVE[type].DESKTOP,
  mobile: TYPOGRAPHY.RESPONSIVE[type].MOBILE,
  css: `font-size: ${TYPOGRAPHY.RESPONSIVE[type].DESKTOP}; @media (max-width: 768px) { font-size: ${TYPOGRAPHY.RESPONSIVE[type].MOBILE}; }`
})

// Utility functions for responsive padding
export const getResponsivePadding = (type: 'SECTION_PADDING' | 'SECTION_PADDING_Y' | 'SECTION_PADDING_X' | 'HERO_PADDING') => ({
  desktop: SPACING.RESPONSIVE[type].DESKTOP,
  mobile: SPACING.RESPONSIVE[type].MOBILE,
  css: `padding: ${SPACING.RESPONSIVE[type].DESKTOP}; @media (max-width: 768px) { padding: ${SPACING.RESPONSIVE[type].MOBILE}; }`
})

// Utility functions for contextual colors
export const getContextualColor = (
  element: 'TITLE' | 'SUBTITLE' | 'TEXT' | 'ACCENT', 
  background: 'LIGHT_BG' | 'DARK_BG' | 'BRAND_BG' | 'BLACK_BG' | 'GRADIENT_BG'
) => {
  return COLORS.CONTEXTUAL[element][background];
}

// Helper function to get title color based on background context
export const getTitleColor = (background: 'LIGHT_BG' | 'DARK_BG' | 'BRAND_BG' | 'BLACK_BG' | 'GRADIENT_BG' = 'LIGHT_BG') => {
  return COLORS.CONTEXTUAL.TITLE[background];
}

// Helper function to get subtitle color based on background context
export const getSubtitleColor = (background: 'LIGHT_BG' | 'DARK_BG' | 'BRAND_BG' | 'BLACK_BG' | 'GRADIENT_BG' = 'LIGHT_BG') => {
  return COLORS.CONTEXTUAL.SUBTITLE[background];
}

// CSS custom properties for responsive gaps
export const responsiveGapCSS = {
  cards: `
    gap: ${SPACING.RESPONSIVE_GAP.CARDS.DESKTOP};
    @media (max-width: 768px) {
      gap: ${SPACING.RESPONSIVE_GAP.CARDS.MOBILE};
    }
  `,
  grid: `
    gap: ${SPACING.RESPONSIVE_GAP.GRID.DESKTOP};
    @media (max-width: 768px) {
      gap: ${SPACING.RESPONSIVE_GAP.GRID.MOBILE};
    }
  `,
  flex: `
    gap: ${SPACING.RESPONSIVE_GAP.FLEX.DESKTOP};
    @media (max-width: 768px) {
      gap: ${SPACING.RESPONSIVE_GAP.FLEX.MOBILE};
    }
  `
}

// ===== TYPE EXPORTS =====
export type TypographySize = keyof typeof TYPOGRAPHY.SIZES;
export type TypographyWeight = keyof typeof TYPOGRAPHY.WEIGHTS;
export type ColorToken = keyof typeof COLORS.TEXT;
export type SpacingToken = keyof typeof SPACING.PADDING;
export type FontFamily = keyof typeof FONTS;
