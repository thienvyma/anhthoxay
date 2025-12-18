/**
 * Centralized configuration module for ANH THỢ XÂY
 * 
 * All environment variable access should go through this module.
 * DO NOT use `import.meta.env` directly in other files.
 * 
 * @example
 * // ✅ Correct
 * import { API_URL, getApiUrl } from '@app/shared';
 * 
 * // ❌ Wrong - don't access env directly
 * const url = import.meta.env.VITE_API_URL;
 */

// Cache the API URL to avoid repeated env access
let cachedApiUrl: string | null = null;

// Default fallback URL for development
const DEFAULT_API_URL = 'http://localhost:4202';

/**
 * Check if running in production mode
 * Uses process.env.NODE_ENV which is replaced at build time
 * @returns true if NODE_ENV is production
 */
export function isProduction(): boolean {
  return typeof process !== 'undefined' && process.env?.['NODE_ENV'] === 'production';
}

/**
 * Check if running in development mode
 * @returns true if not in production
 */
export function isDevelopment(): boolean {
  return !isProduction();
}

/**
 * Get API URL from environment variable with fallback
 * 
 * For Vite apps: Set VITE_API_URL in .env file
 * For Node.js: Set VITE_API_URL in environment
 * 
 * Priority:
 * 1. VITE_API_URL environment variable
 * 2. Fallback to localhost:4202 (development default)
 * 
 * @returns API base URL without trailing slash
 */
export function getApiUrl(): string {
  // Return cached value if available
  if (cachedApiUrl !== null) {
    return cachedApiUrl;
  }

  let apiUrl: string | undefined;

  // Try process.env (works in both Node.js and Vite with define)
  if (typeof process !== 'undefined' && process.env?.['VITE_API_URL']) {
    apiUrl = process.env['VITE_API_URL'];
  }

  // If we have a value, cache and return it
  if (apiUrl) {
    // Remove trailing slash if present
    cachedApiUrl = apiUrl.replace(/\/$/, '');
    return cachedApiUrl;
  }

  // Fallback for development
  // Warn in production if not set
  if (isProduction()) {
    console.warn(
      '⚠️ VITE_API_URL not set in production build. Using fallback:',
      DEFAULT_API_URL,
      '\nSet VITE_API_URL in your environment or .env file.'
    );
  }

  cachedApiUrl = DEFAULT_API_URL;
  return cachedApiUrl;
}

/**
 * Reset cached API URL (useful for testing)
 * @internal
 */
export function _resetApiUrlCache(): void {
  cachedApiUrl = null;
}

// Export API_URL constant for backward compatibility
// This is evaluated once when the module is imported
export const API_URL = getApiUrl();
