export * from './lib/shared';
export * from './utils/imageOptimization';

// API Configuration - centralized URL management
// Import from config module instead of hardcoding
export { API_URL, getApiUrl, isProduction, isDevelopment } from './config';
import { getApiUrl } from './config';

/**
 * Resolve media URL - converts relative paths to full API URLs
 * @param url - The URL to resolve (can be relative like /media/... or absolute)
 * @returns Full URL with API base
 */
export function resolveMediaUrl(url: string | undefined | null): string {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  if (url.startsWith('/')) return `${getApiUrl()}${url}`;
  return url;
}

// Design tokens for the whole platform (colors, typography, spacing, motion)
export const tokens = {
	color: {
		background: '#0B0B0C',
		surface: '#131316',
		surfaceHover: '#1A1A1E',
		primary: '#F5D393',
		secondary: '#C7A775',
		accent: '#EFB679',
		text: '#F4F4F5',
		textMuted: '#A1A1AA',
		muted: '#A1A1AA',
		border: '#27272A',
		borderHover: '#3F3F46',
		success: '#34D399',
		warning: '#F59E0B',
		error: '#EF4444',
		info: '#3B82F6',
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
		sm: '0 2px 8px rgba(0,0,0,0.25)',
		md: '0 6px 24px rgba(0,0,0,0.35)',
		lg: '0 12px 44px rgba(0,0,0,0.45)',
		glow: '0 0 24px rgba(245, 211, 147, 0.3)',
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

export type Tokens = typeof tokens;
