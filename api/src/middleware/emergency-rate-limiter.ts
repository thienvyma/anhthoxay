/**
 * Emergency Mode Rate Limiter Middleware
 *
 * Provides rate limiting with emergency mode support.
 * When emergency mode is active, applies stricter rate limits.
 * Uses in-memory rate limiting (Redis removed).
 *
 * **Feature: high-traffic-resilience**
 * **Requirements: 14.5, 14.6**
 */

import type { Context, Next } from 'hono';
import { getIPBlockingService } from '../services/ip-blocking.service';
import { logger } from '../utils/logger';
import { checkLimit as inMemoryCheckLimit } from './rate-limiter';
import { logViolation } from '../services/rate-limit-monitoring.service';
import { recordRateLimitViolation } from './ip-blocking';

// Import emergency mode service for violation tracking
let getEmergencyModeService: (() => { recordViolation: () => Promise<void> }) | null = null;

// Lazy load to avoid circular dependency
async function recordEmergencyViolation(): Promise<void> {
  if (!getEmergencyModeService) {
    try {
      const module = await import('../services/emergency-mode.service');
      getEmergencyModeService = module.getEmergencyModeService;
    } catch {
      return; // Ignore if module not available
    }
  }
  
  try {
    const service = getEmergencyModeService();
    await service.recordViolation();
  } catch {
    // Ignore errors
  }
}

// ============================================
// TYPES
// ============================================

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
}

export interface EmergencyRateLimiterOptions {
  /** Normal mode max attempts */
  maxAttempts?: number;
  /** Emergency mode max attempts (stricter) */
  emergencyMaxAttempts?: number;
  /** Time window in milliseconds */
  windowMs?: number;
  /** Emergency mode time window (can be shorter) */
  emergencyWindowMs?: number;
  /** Redis key prefix */
  keyPrefix?: string;
  /** Custom key generator */
  keyGenerator?: (c: Context) => string;
  /** Whether to skip emergency mode check */
  skipEmergencyCheck?: boolean;
}

export interface EmergencyModeConfig {
  /** Rate limit multiplier (e.g., 0.5 = 50% of normal limits) */
  rateLimitMultiplier: number;
  /** Window multiplier (e.g., 2 = 2x longer window) */
  windowMultiplier: number;
  /** Whether CAPTCHA is required for all forms */
  requireCaptcha: boolean;
  /** Additional blocked patterns (user agents, etc.) */
  blockedPatterns: string[];
}

// ============================================
// DEFAULT CONFIGURATION
// ============================================

const DEFAULT_EMERGENCY_CONFIG: EmergencyModeConfig = {
  rateLimitMultiplier: 0.5,  // 50% of normal limits
  windowMultiplier: 2,        // 2x longer window
  requireCaptcha: true,
  blockedPatterns: [],
};

// In-memory cache for emergency config
let emergencyConfig: EmergencyModeConfig = { ...DEFAULT_EMERGENCY_CONFIG };

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get client IP from request
 */
function getClientIp(c: Context): string {
  return (
    c.req.header('x-forwarded-for')?.split(',')[0]?.trim() ||
    c.req.header('x-real-ip') ||
    'unknown'
  );
}

/**
 * Check rate limit using in-memory sliding window algorithm
 */
async function checkLimitInMemory(
  key: string,
  maxAttempts: number,
  windowMs: number
): Promise<RateLimitResult> {
  return inMemoryCheckLimit(key, maxAttempts, windowMs);
}

// ============================================
// EMERGENCY MODE FUNCTIONS
// ============================================

/**
 * Get current emergency mode configuration
 */
export function getEmergencyConfig(): EmergencyModeConfig {
  return { ...emergencyConfig };
}

/**
 * Update emergency mode configuration
 */
export function updateEmergencyConfig(config: Partial<EmergencyModeConfig>): void {
  emergencyConfig = { ...emergencyConfig, ...config };
  logger.info('[EMERGENCY_RATE_LIMITER] Emergency config updated', { config: emergencyConfig });
}

/**
 * Reset emergency mode configuration to defaults
 */
export function resetEmergencyConfig(): void {
  emergencyConfig = { ...DEFAULT_EMERGENCY_CONFIG };
  logger.info('[EMERGENCY_RATE_LIMITER] Emergency config reset to defaults');
}

// ============================================
// MIDDLEWARE
// ============================================

/**
 * Emergency-aware rate limiter middleware
 * 
 * Applies stricter rate limits when emergency mode is active.
 * In emergency mode:
 * - Rate limits are reduced (default: 50% of normal)
 * - Time windows are extended (default: 2x longer)
 * 
 * **Feature: high-traffic-resilience**
 * **Requirements: 14.5, 14.6**
 * 
 * @param options - Rate limiter configuration
 * @returns Hono middleware
 * 
 * @example
 * ```ts
 * // Basic usage - automatically applies stricter limits in emergency mode
 * app.use('/api/leads', emergencyRateLimiter({ maxAttempts: 10, windowMs: 60000 }));
 * 
 * // With custom emergency limits
 * app.use('/api/auth/login', emergencyRateLimiter({
 *   maxAttempts: 5,
 *   emergencyMaxAttempts: 2,  // Only 2 attempts in emergency mode
 *   windowMs: 60000,
 *   emergencyWindowMs: 120000, // 2 minute window in emergency mode
 * }));
 * ```
 */
export function emergencyRateLimiter(options: EmergencyRateLimiterOptions = {}) {
  const {
    maxAttempts = 5,
    emergencyMaxAttempts,
    windowMs = 15 * 60 * 1000,
    emergencyWindowMs,
    keyPrefix = 'ratelimit:emergency',
    keyGenerator = (c) => getClientIp(c),
    skipEmergencyCheck = false,
  } = options;

  return async (c: Context, next: Next) => {
    const clientKey = keyGenerator(c);
    const key = `${keyPrefix}:${clientKey}`;
    const ip = getClientIp(c);
    
    // Check emergency mode
    let isEmergency = false;
    if (!skipEmergencyCheck) {
      try {
        const ipBlockingService = getIPBlockingService();
        isEmergency = await ipBlockingService.isEmergencyMode();
      } catch {
        // Ignore errors checking emergency mode
      }
    }
    
    // Calculate effective limits
    let effectiveMaxAttempts = maxAttempts;
    let effectiveWindowMs = windowMs;
    
    if (isEmergency) {
      // Use explicit emergency values if provided, otherwise apply multipliers
      effectiveMaxAttempts = emergencyMaxAttempts ?? 
        Math.max(1, Math.floor(maxAttempts * emergencyConfig.rateLimitMultiplier));
      effectiveWindowMs = emergencyWindowMs ?? 
        Math.floor(windowMs * emergencyConfig.windowMultiplier);
      
      logger.debug('[EMERGENCY_RATE_LIMITER] Emergency mode active', {
        ip,
        path: c.req.path,
        normalLimits: { maxAttempts, windowMs },
        emergencyLimits: { maxAttempts: effectiveMaxAttempts, windowMs: effectiveWindowMs },
      });
    }
    
    const result = await checkLimitInMemory(key, effectiveMaxAttempts, effectiveWindowMs);

    // Set rate limit headers
    c.header('X-RateLimit-Limit', effectiveMaxAttempts.toString());
    c.header('X-RateLimit-Remaining', result.remaining.toString());
    c.header('X-RateLimit-Reset', Math.floor(result.resetAt.getTime() / 1000).toString());
    
    // Add emergency mode indicator header
    if (isEmergency) {
      c.header('X-Emergency-Mode', 'active');
    }

    if (!result.allowed) {
      const retryAfter = Math.ceil((result.resetAt.getTime() - Date.now()) / 1000);
      c.header('Retry-After', retryAfter.toString());

      // Log violation
      await logViolation({
        ip,
        path: c.req.path,
        timestamp: Date.now(),
        userAgent: c.req.header('user-agent'),
        userId: c.get('user')?.id,
      }).catch((err) => {
        logger.debug('[EMERGENCY_RATE_LIMITER] Failed to log violation', { error: err });
      });

      // Record violation for IP blocking
      await recordRateLimitViolation(ip).catch((err) => {
        logger.debug('[EMERGENCY_RATE_LIMITER] Failed to record violation', { error: err });
      });

      // Record violation for emergency mode auto-activation
      await recordEmergencyViolation().catch((err) => {
        logger.debug('[EMERGENCY_RATE_LIMITER] Failed to record emergency violation', { error: err });
      });

      logger.warn('[EMERGENCY_RATE_LIMITER] Rate limit exceeded', {
        ip,
        path: c.req.path,
        isEmergency,
        effectiveMaxAttempts,
        effectiveWindowMs,
      });

      return c.json(
        {
          success: false,
          error: {
            code: 'RATE_LIMITED',
            message: isEmergency 
              ? 'Too many requests. System is under high load, please try again later.'
              : 'Too many requests. Please try again later.',
            retryAfter,
            emergencyMode: isEmergency,
          },
          correlationId: c.get('correlationId') || 'unknown',
        },
        429
      );
    }

    await next();
  };
}

/**
 * Login-specific emergency rate limiter
 * 
 * Applies very strict limits in emergency mode to prevent brute force attacks.
 * 
 * Normal mode: 5 attempts per 15 minutes
 * Emergency mode: 2 attempts per 30 minutes
 */
export function loginEmergencyRateLimiter() {
  const isDev = process.env.NODE_ENV !== 'production';
  return emergencyRateLimiter({
    maxAttempts: isDev ? 100 : 5,
    emergencyMaxAttempts: isDev ? 50 : 2,
    windowMs: 15 * 60 * 1000,
    emergencyWindowMs: 30 * 60 * 1000,
    keyPrefix: 'ratelimit:login:emergency',
    keyGenerator: (c) => getClientIp(c),
  });
}

/**
 * Form submission emergency rate limiter
 * 
 * For public forms like leads, contact, etc.
 * 
 * Normal mode: 10 attempts per minute
 * Emergency mode: 3 attempts per 2 minutes
 */
export function formEmergencyRateLimiter() {
  const isDev = process.env.NODE_ENV !== 'production';
  return emergencyRateLimiter({
    maxAttempts: isDev ? 100 : 10,
    emergencyMaxAttempts: isDev ? 50 : 3,
    windowMs: 60 * 1000,
    emergencyWindowMs: 2 * 60 * 1000,
    keyPrefix: 'ratelimit:form:emergency',
    keyGenerator: (c) => getClientIp(c),
  });
}

/**
 * API global emergency rate limiter
 * 
 * For general API endpoints.
 * 
 * Normal mode: 200 requests per minute
 * Emergency mode: 50 requests per minute
 */
export function globalEmergencyRateLimiter() {
  const isDev = process.env.NODE_ENV !== 'production';
  return emergencyRateLimiter({
    maxAttempts: isDev ? 500 : 200,
    emergencyMaxAttempts: isDev ? 250 : 50,
    windowMs: 60 * 1000,
    emergencyWindowMs: 60 * 1000,
    keyPrefix: 'ratelimit:global:emergency',
    keyGenerator: (c) => getClientIp(c),
  });
}

export default emergencyRateLimiter;
