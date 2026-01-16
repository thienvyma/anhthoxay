/**
 * Centralized configuration module for NỘI THẤT NHANH
 *
 * This file supports both:
 * - Vite frontend apps (using import.meta.env)
 * - Node.js backend (using process.env)
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
 * Safely get Vite environment variables
 * Uses dynamic access to avoid TypeScript errors in Node.js
 */
function getViteEnv(): Record<string, string> | null {
  if (!isBrowser()) return null;

  try {
    // Use Function constructor to avoid static analysis of import.meta
    // This prevents TypeScript errors when compiling for Node.js
    const getImportMeta = new Function('return typeof import.meta !== "undefined" ? import.meta : null');
    const meta = getImportMeta();
    return meta?.env || null;
  } catch {
    return null;
  }
}

/**
 * Get environment variable value
 * Works in both Vite (import.meta.env) and Node.js (process.env)
 */
function getEnvVar(viteKey: string, nodeKey: string, defaultValue: string): string {
  // In browser/Vite environment
  if (isBrowser()) {
    const viteEnv = getViteEnv();
    if (viteEnv && viteEnv[viteKey]) {
      return viteEnv[viteKey];
    }
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
 * API URL - works in both Vite and Node.js
 * Falls back to localhost for development
 */
export const API_URL: string = (() => {
  // Check for Vite build-time replacement first
  if (isBrowser()) {
    const viteEnv = getViteEnv();
    if (viteEnv && viteEnv['VITE_API_URL']) {
      return viteEnv['VITE_API_URL'];
    }
  }
  // Node.js environment
  if (typeof process !== 'undefined' && process.env?.['API_URL']) {
    return process.env['API_URL'];
  }
  return 'http://localhost:4202';
})();

/**
 * Portal URL - works in both Vite and Node.js
 * Falls back to localhost for development
 */
export const PORTAL_URL: string = (() => {
  // Check for Vite build-time replacement first
  if (isBrowser()) {
    const viteEnv = getViteEnv();
    if (viteEnv && viteEnv['VITE_PORTAL_URL']) {
      return viteEnv['VITE_PORTAL_URL'];
    }
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
    const viteEnv = getViteEnv();
    if (viteEnv) {
      return viteEnv['MODE'] === 'production' || viteEnv['PROD'] === 'true';
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
 * Uses VITE_ prefixed environment variables
 */
export const firebaseConfig = {
  apiKey: getEnvVar('VITE_FIREBASE_API_KEY', 'FIREBASE_API_KEY', ''),
  authDomain: getEnvVar('VITE_FIREBASE_AUTH_DOMAIN', 'FIREBASE_AUTH_DOMAIN', ''),
  projectId: getEnvVar('VITE_FIREBASE_PROJECT_ID', 'FIREBASE_PROJECT_ID', ''),
  storageBucket: getEnvVar('VITE_FIREBASE_STORAGE_BUCKET', 'FIREBASE_STORAGE_BUCKET', ''),
  messagingSenderId: getEnvVar('VITE_FIREBASE_MESSAGING_SENDER_ID', 'FIREBASE_MESSAGING_SENDER_ID', ''),
  appId: getEnvVar('VITE_FIREBASE_APP_ID', 'FIREBASE_APP_ID', ''),
};

/**
 * Check if Firebase is configured
 */
export function isFirebaseConfigured(): boolean {
  return !!(firebaseConfig.apiKey && firebaseConfig.projectId);
}
