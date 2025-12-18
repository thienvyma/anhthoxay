/**
 * CORS Configuration Module
 * 
 * Provides configurable CORS settings via environment variables.
 * 
 * **Feature: api-refactoring**
 * **Validates: Requirements 4.1, 4.2, 4.3, 4.4, 4.5**
 */

import { cors } from 'hono/cors';

// ============================================
// Type Definitions
// ============================================

/**
 * CORS configuration result
 */
export interface CorsConfig {
  /** List of allowed origins */
  origins: string[];
  /** Whether running in production mode */
  isProduction: boolean;
}

/**
 * Error thrown when CORS origin validation fails
 */
export class CorsValidationError extends Error {
  constructor(
    message: string,
    public readonly invalidOrigin: string
  ) {
    super(message);
    this.name = 'CorsValidationError';
  }
}

// ============================================
// Constants
// ============================================

/** Default origins for development environment */
const DEFAULT_DEV_ORIGINS = ['http://localhost:4200', 'http://localhost:4201'];

/** Environment variable name for CORS origins */
const CORS_ORIGINS_ENV = 'CORS_ORIGINS';

// ============================================
// Utility Functions
// ============================================

/**
 * Validate that a string is a valid URL origin for CORS
 * 
 * Only HTTP and HTTPS protocols are allowed for CORS origins.
 * 
 * @param origin - The origin string to validate
 * @returns true if valid HTTP/HTTPS origin, false otherwise
 */
export function isValidOrigin(origin: string): boolean {
  if (!origin || typeof origin !== 'string') {
    return false;
  }
  
  try {
    const url = new URL(origin);
    
    // Only allow HTTP and HTTPS protocols for CORS
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      return false;
    }
    
    // Origin should only have protocol and host (no path, query, or fragment)
    // Valid: http://localhost:4200, https://example.com
    // Invalid: http://localhost:4200/path, http://localhost:4200?query
    const reconstructed = `${url.protocol}//${url.host}`;
    return reconstructed === origin;
  } catch {
    return false;
  }
}

/**
 * Parse comma-separated origins string into array
 * 
 * @param originsString - Comma-separated origins string
 * @returns Array of trimmed, non-empty origin strings
 */
export function parseOrigins(originsString: string): string[] {
  if (!originsString || typeof originsString !== 'string') {
    return [];
  }
  
  return originsString
    .split(',')
    .map(origin => origin.trim())
    .filter(origin => origin.length > 0);
}

/**
 * Validate all origins in an array
 * 
 * @param origins - Array of origin strings to validate
 * @throws CorsValidationError if any origin is invalid
 */
export function validateOrigins(origins: string[]): void {
  for (const origin of origins) {
    if (!isValidOrigin(origin)) {
      throw new CorsValidationError(
        `Invalid CORS origin: ${origin}`,
        origin
      );
    }
  }
}

// ============================================
// Main Functions
// ============================================

/**
 * Get CORS configuration from environment
 * 
 * Reads CORS_ORIGINS environment variable and parses/validates origins.
 * Falls back to localhost origins in development if not set.
 * Logs warning in production if not set.
 * 
 * @returns CorsConfig object with origins and production flag
 * @throws CorsValidationError if any origin is invalid
 * 
 * @example
 * ```ts
 * // With CORS_ORIGINS="https://example.com,https://app.example.com"
 * const config = getCorsConfig();
 * // config.origins = ['https://example.com', 'https://app.example.com']
 * 
 * // In development without CORS_ORIGINS
 * const config = getCorsConfig();
 * // config.origins = ['http://localhost:4200', 'http://localhost:4201']
 * ```
 */
export function getCorsConfig(): CorsConfig {
  const isProduction = process.env.NODE_ENV === 'production';
  const envOrigins = process.env[CORS_ORIGINS_ENV];
  
  // If CORS_ORIGINS is set, parse and validate
  if (envOrigins) {
    const origins = parseOrigins(envOrigins);
    validateOrigins(origins);
    return { origins, isProduction };
  }
  
  // Production without CORS_ORIGINS - log warning and use empty array
  if (isProduction) {
    console.warn('⚠️ CORS_ORIGINS not set in production - using restrictive defaults');
    return { origins: [], isProduction };
  }
  
  // Development fallback
  return {
    origins: DEFAULT_DEV_ORIGINS,
    isProduction: false,
  };
}

/**
 * Create Hono CORS middleware with configuration from environment
 * 
 * @returns Hono CORS middleware
 * @throws CorsValidationError if any origin is invalid
 * 
 * @example
 * ```ts
 * import { createCorsMiddleware } from './config/cors';
 * 
 * const app = new Hono();
 * app.use('*', createCorsMiddleware());
 * ```
 */
export function createCorsMiddleware() {
  const config = getCorsConfig();
  
  return cors({
    origin: config.origins,
    credentials: true,
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization', 'X-Correlation-ID'],
  });
}

export default {
  getCorsConfig,
  createCorsMiddleware,
  isValidOrigin,
  parseOrigins,
  validateOrigins,
  CorsValidationError,
};
