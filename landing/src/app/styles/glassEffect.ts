/**
 * Glass Morphism Utility - Apple iOS 18 / macOS Sequoia Style
 * 
 * Modern glass effect with:
 * - Frosted glass backdrop blur
 * - Subtle gradient overlays
 * - Refined borders with opacity
 * - Optimized for dark backgrounds
 */

import { CSSProperties } from 'react';

export interface GlassEffectOptions {
  /** Blur intensity (default: 24px) */
  blur?: number;
  /** Background opacity (default: 0.7) */
  opacity?: number;
  /** Border opacity (default: 0.15) */
  borderOpacity?: number;
  /** Enable subtle gradient overlay (default: true) */
  gradient?: boolean;
  /** Enable shadow (default: true) */
  shadow?: boolean;
  /** Variant style */
  variant?: 'default' | 'strong' | 'subtle' | 'card';
}

/**
 * Generate glass morphism CSS properties
 * 
 * @example
 * ```tsx
 * <div style={glassEffect()}>Content</div>
 * <div style={glassEffect({ variant: 'card' })}>Card</div>
 * ```
 */
export function glassEffect(options: GlassEffectOptions = {}): CSSProperties {
  const {
    blur = 24,
    opacity = 0.7,
    borderOpacity = 0.15,
    gradient = true,
    shadow = true,
    variant = 'default',
  } = options;

  // Variant presets
  const variants = {
    default: {
      blur: 24,
      opacity: 0.7,
      borderOpacity: 0.15,
    },
    strong: {
      blur: 32,
      opacity: 0.85,
      borderOpacity: 0.2,
    },
    subtle: {
      blur: 16,
      opacity: 0.5,
      borderOpacity: 0.1,
    },
    card: {
      blur: 20,
      opacity: 0.6,
      borderOpacity: 0.12,
    },
  };

  const preset = variants[variant];
  const finalBlur = blur || preset.blur;
  const finalOpacity = opacity || preset.opacity;
  const finalBorderOpacity = borderOpacity || preset.borderOpacity;

  // Base glass background
  const baseBackground = `rgba(12, 12, 16, ${finalOpacity})`;
  
  // Gradient overlay for depth
  const gradientOverlay = gradient
    ? `linear-gradient(135deg, 
        rgba(255, 255, 255, 0.05) 0%, 
        rgba(255, 255, 255, 0.01) 50%,
        rgba(0, 0, 0, 0.05) 100%)`
    : undefined;

  return {
    background: gradientOverlay 
      ? `${gradientOverlay}, ${baseBackground}`
      : baseBackground,
    backdropFilter: `blur(${finalBlur}px) saturate(180%)`,
    WebkitBackdropFilter: `blur(${finalBlur}px) saturate(180%)`,
    border: `1px solid rgba(255, 255, 255, ${finalBorderOpacity})`,
    boxShadow: shadow
      ? `0 8px 32px rgba(0, 0, 0, 0.4), 
         inset 0 1px 0 rgba(255, 255, 255, 0.1)`
      : undefined,
  };
}

/**
 * Predefined glass variants for common use cases
 */
export const glassVariants = {
  /** Default glass effect - balanced for most sections */
  default: glassEffect({ variant: 'default' }),
  
  /** Strong glass - more opaque, for important content */
  strong: glassEffect({ variant: 'strong' }),
  
  /** Subtle glass - lighter, for backgrounds */
  subtle: glassEffect({ variant: 'subtle' }),
  
  /** Card glass - optimized for card components */
  card: glassEffect({ variant: 'card' }),
  
  /** Hero glass - for hero sections with strong presence */
  hero: glassEffect({
    blur: 28,
    opacity: 0.75,
    borderOpacity: 0.18,
    gradient: true,
    shadow: true,
  }),
  
  /** Modal glass - for overlays and modals */
  modal: glassEffect({
    blur: 40,
    opacity: 0.9,
    borderOpacity: 0.2,
    gradient: true,
    shadow: true,
  }),
  
  /** Navbar glass - for fixed navigation */
  navbar: glassEffect({
    blur: 20,
    opacity: 0.8,
    borderOpacity: 0.15,
    gradient: false,
    shadow: true,
  }),
};

/**
 * Glass container wrapper with hover effect
 */
export function glassContainer(options: GlassEffectOptions & {
  /** Enable hover lift effect */
  hover?: boolean;
  /** Border radius */
  borderRadius?: number | string;
  /** Padding */
  padding?: number | string;
} = {}): CSSProperties {
  const { hover = false, borderRadius = 20, padding = 32, ...glassOptions } = options;

  return {
    ...glassEffect(glassOptions),
    borderRadius,
    padding,
    transition: 'transform 0.3s ease, box-shadow 0.3s ease',
    ...(hover && {
      cursor: 'pointer',
    }),
  };
}

/**
 * CSS class names for glass effects (to be used in global styles)
 */
export const glassClassNames = {
  base: 'glass-effect',
  strong: 'glass-effect-strong',
  subtle: 'glass-effect-subtle',
  card: 'glass-effect-card',
  hover: 'glass-effect-hover',
};

/**
 * Generate global CSS for glass effects
 * Add this to your global styles or CSS-in-JS
 */
export const glassGlobalStyles = `
  .glass-effect {
    background: linear-gradient(135deg, 
      rgba(255, 255, 255, 0.05) 0%, 
      rgba(255, 255, 255, 0.01) 50%,
      rgba(0, 0, 0, 0.05) 100%),
      rgba(12, 12, 16, 0.7);
    backdrop-filter: blur(24px) saturate(180%);
    -webkit-backdrop-filter: blur(24px) saturate(180%);
    border: 1px solid rgba(255, 255, 255, 0.15);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4), 
                inset 0 1px 0 rgba(255, 255, 255, 0.1);
  }

  .glass-effect-strong {
    background: linear-gradient(135deg, 
      rgba(255, 255, 255, 0.06) 0%, 
      rgba(255, 255, 255, 0.02) 50%,
      rgba(0, 0, 0, 0.06) 100%),
      rgba(12, 12, 16, 0.85);
    backdrop-filter: blur(32px) saturate(180%);
    -webkit-backdrop-filter: blur(32px) saturate(180%);
    border: 1px solid rgba(255, 255, 255, 0.2);
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.5), 
                inset 0 1px 0 rgba(255, 255, 255, 0.12);
  }

  .glass-effect-subtle {
    background: linear-gradient(135deg, 
      rgba(255, 255, 255, 0.03) 0%, 
      rgba(255, 255, 255, 0.01) 50%,
      rgba(0, 0, 0, 0.03) 100%),
      rgba(12, 12, 16, 0.5);
    backdrop-filter: blur(16px) saturate(180%);
    -webkit-backdrop-filter: blur(16px) saturate(180%);
    border: 1px solid rgba(255, 255, 255, 0.1);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3), 
                inset 0 1px 0 rgba(255, 255, 255, 0.08);
  }

  .glass-effect-card {
    background: linear-gradient(135deg, 
      rgba(255, 255, 255, 0.04) 0%, 
      rgba(255, 255, 255, 0.01) 50%,
      rgba(0, 0, 0, 0.04) 100%),
      rgba(12, 12, 16, 0.6);
    backdrop-filter: blur(20px) saturate(180%);
    -webkit-backdrop-filter: blur(20px) saturate(180%);
    border: 1px solid rgba(255, 255, 255, 0.12);
    box-shadow: 0 6px 24px rgba(0, 0, 0, 0.35), 
                inset 0 1px 0 rgba(255, 255, 255, 0.09);
  }

  .glass-effect-hover {
    transition: transform 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease;
  }

  .glass-effect-hover:hover {
    transform: translateY(-4px);
    box-shadow: 0 16px 48px rgba(0, 0, 0, 0.5), 
                inset 0 1px 0 rgba(255, 255, 255, 0.15);
    border-color: rgba(245, 211, 147, 0.3);
  }

  /* Support for reduced motion */
  @media (prefers-reduced-motion: reduce) {
    .glass-effect-hover {
      transition: none;
    }
    .glass-effect-hover:hover {
      transform: none;
    }
  }
`;

