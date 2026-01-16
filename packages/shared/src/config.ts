/**
 * Centralized configuration module for NỘI THẤT NHANH
 *
 * This file supports both:
 * - Vite frontend apps (using import.meta.env)
 * - Node.js backend (using process.env)
 *
 * IMPORTANT: Vite replaces import.meta.env.VITE_* at build-time.
 * We must access these directly (not via dynamic lookup) for replacement to work.
 *
 * @example
 * import { API_URL, getApiUrl, firebaseConfig } from '@app/shared';
 */

// ============================================
// ENVIRONMENT DETECTION
// ============================================

/**
 * Check if running in browser/Vite environment
 */
function isBrowser(): boolean {
  return typeof window !== 'undefined';
}

/**
 * Get environment variable value
 * Works in both Vite (import.meta.env) and Node.js (process.env)
 * 
 * NOTE: For Vite build-time replacement to work, we pass the already-resolved
 * viteValue directly instead of doing dynamic lookup.
 */
function getEnvVar(viteValue: string | undefined, nodeKey: string, defaultValue: string): string {
  // Check Vite build-time replaced value first
  if (viteValue && viteValue !== '' && !viteValue.startsWith('import.meta')) {
    return viteValue;
  }

  // In Node.js environment
  if (typeof process !== 'undefined' && process.env && process.env[nodeKey]) {
    return process.env[nodeKey] as string;
  }

  return defaultValue;
}

// ============================================
// BUILD-TIME CONSTANTS
// ============================================

/**
 * API URL - Vite replaces import.meta.env.VITE_API_URL at build-time
 * The define option in vite.config.ts handles the replacement
 * Falls back to localhost for development or Node.js environment
 */
export const API_URL: string = (() => {
  // In browser: Vite replaces this at build-time via define option
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore - import.meta.env is Vite-specific, replaced at build-time
  const viteApiUrl = import.meta.env.VITE_API_URL;
  if (isBrowser() && viteApiUrl && typeof viteApiUrl === 'string') {
    return viteApiUrl;
  }
  // Node.js environment
  if (typeof process !== 'undefined' && process.env?.['API_URL']) {
    return process.env['API_URL'];
  }
  return 'http://localhost:4202';
})();

/**
 * Portal URL - Vite replaces import.meta.env.VITE_PORTAL_URL at build-time
 * Falls back to localhost for development or Node.js environment
 */
export const PORTAL_URL: string = (() => {
  // In browser: Vite replaces this at build-time via define option
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore - import.meta.env is Vite-specific, replaced at build-time
  const vitePortalUrl = import.meta.env.VITE_PORTAL_URL;
  if (isBrowser() && vitePortalUrl && typeof vitePortalUrl === 'string') {
    return vitePortalUrl;
  }
  // Node.js environment
  if (typeof process !== 'undefined' && process.env?.['PORTAL_URL']) {
    return process.env['PORTAL_URL'];
  }
  return 'http://localhost:4203';
})();

/**
 * Get API URL (function form for compatibility)
 * @returns API base URL without trailing slash
 */
export function getApiUrl(): string {
  return API_URL.replace(/\/$/, '');
}

/**
 * Get Portal URL (function form for compatibility)
 * @returns Portal base URL without trailing slash
 */
export function getPortalUrl(): string {
  return PORTAL_URL.replace(/\/$/, '');
}

/**
 * Check if running in production mode
 */
export function isProduction(): boolean {
  if (isBrowser()) {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore - import.meta.env is Vite-specific
    if (import.meta.env?.MODE === 'production' || import.meta.env?.PROD === true) {
      return true;
    }
  }

  return process.env['NODE_ENV'] === 'production';
}

/**
 * Check if running in development mode
 */
export function isDevelopment(): boolean {
  return !isProduction();
}

// ============================================
// FIREBASE CONFIGURATION
// ============================================

/**
 * Firebase client configuration for frontend apps
 * Vite replaces import.meta.env.VITE_* at build-time
 */
export const firebaseConfig = {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  apiKey: getEnvVar(import.meta.env?.VITE_FIREBASE_API_KEY, 'FIREBASE_API_KEY', ''),
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  authDomain: getEnvVar(import.meta.env?.VITE_FIREBASE_AUTH_DOMAIN, 'FIREBASE_AUTH_DOMAIN', ''),
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  projectId: getEnvVar(import.meta.env?.VITE_FIREBASE_PROJECT_ID, 'FIREBASE_PROJECT_ID', ''),
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  storageBucket: getEnvVar(import.meta.env?.VITE_FIREBASE_STORAGE_BUCKET, 'FIREBASE_STORAGE_BUCKET', ''),
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  messagingSenderId: getEnvVar(import.meta.env?.VITE_FIREBASE_MESSAGING_SENDER_ID, 'FIREBASE_MESSAGING_SENDER_ID', ''),
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  appId: getEnvVar(import.meta.env?.VITE_FIREBASE_APP_ID, 'FIREBASE_APP_ID', ''),
};

/**
 * Check if Firebase is configured
 */
export function isFirebaseConfigured(): boolean {
  return !!(firebaseConfig.apiKey && firebaseConfig.projectId);
}
