/**
 * Admin-specific design tokens for Light Mode
 * These tokens are used exclusively in the admin app
 * Landing and Portal apps continue using the dark mode tokens from index.ts
 */
export const adminTokens = {
  color: {
    // Backgrounds - Light mode
    background: '#F8F9FA',      // Main page background
    surface: '#FFFFFF',         // Cards, modals, sidebar
    surfaceHover: '#F3F4F6',    // Hover states
    surfaceAlt: '#F9FAFB',      // Nested cards, subtle backgrounds

    // Brand - Adjusted for light mode
    primary: '#F5D393',         // Gold - for buttons, accents
    primaryDark: '#B8860B',     // Darker gold - for text on light bg
    secondary: '#C7A775',       // Secondary gold
    accent: '#EFB679',          // Accent orange

    // Text - Dark for light backgrounds
    text: '#1A1A1D',            // Primary text
    textMuted: '#4B5563',       // Secondary text (darker for better contrast)
    muted: '#6B7280',           // Muted/placeholder text (darker for sidebar)

    // Borders - Visible but subtle
    border: '#E5E7EB',          // Default border
    borderHover: '#D1D5DB',     // Hover border
    borderLight: '#F3F4F6',     // Very light border

    // Inputs
    inputBg: '#FFFFFF',         // Input background
    inputBorder: '#D1D5DB',     // Input border
    inputFocus: '#F5D393',      // Input focus border

    // Status - Same as dark mode
    success: '#10B981',         // Green
    warning: '#F59E0B',         // Amber
    error: '#EF4444',           // Red
    info: '#3B82F6',            // Blue

    // Status backgrounds (light tints)
    successBg: '#ECFDF5',
    warningBg: '#FFFBEB',
    errorBg: '#FEF2F2',
    infoBg: '#EFF6FF',

    // Overlay
    overlay: 'rgba(0, 0, 0, 0.5)',
  },
  font: {
    display: 'Playfair Display, serif',
    sans: 'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    mono: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
    size: {
      display: '64px',
      h1: '48px',
      h2: '36px',
      h3: '28px',
      body: '16px',
      caption: '12px',
      xs: '12px',
      sm: '14px',
      base: '16px',
      lg: '18px',
      xl: '20px',
      '2xl': '24px',
      '3xl': '30px',
      '4xl': '36px',
    },
    weight: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
  },
  space: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '40px',
    '2xl': '64px',
    '3xl': '96px',
  },
  radius: {
    sm: '6px',
    md: '12px',
    lg: '20px',
    xl: '24px',
    pill: '999px',
  },
  shadow: {
    sm: '0 2px 8px rgba(0,0,0,0.08)',
    md: '0 6px 24px rgba(0,0,0,0.12)',
    lg: '0 12px 44px rgba(0,0,0,0.16)',
    glow: '0 0 24px rgba(245, 211, 147, 0.2)',
  },
  motion: {
    ease: {
      inOut: [0.85, 0, 0.15, 1] as [number, number, number, number],
      outExpo: [0.16, 1, 0.3, 1] as [number, number, number, number],
      spring: { type: 'spring' as const, stiffness: 300, damping: 30 },
    },
    duration: {
      fast: 0.15,
      normal: 0.3,
      slow: 0.5,
      sm: 0.35,
      md: 0.6,
      lg: 1,
    },
  },
  zIndex: {
    base: 1,
    dropdown: 1000,
    sticky: 1100,
    overlay: 1200,
    modal: 1300,
    toast: 1400,
  },
} as const;

export type AdminTokens = typeof adminTokens;
