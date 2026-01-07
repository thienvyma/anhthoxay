/**
 * Suspicious Activity Detection Middleware
 *
 * Detects and handles suspicious request patterns that may indicate an attack.
 * Works with emergency mode to provide enhanced protection.
 *
 * **Feature: high-traffic-resilience**
 * **Requirements: 14.5, 14.6**
 */

import type { Context, Next } from 'hono';
import { 
  isSuspiciousUserAgent, 
  trackRapidRequests, 
  recordSuspiciousIP,
  getIPBlockingService,
} from '../services/ip-blocking.service';
import { 
  recordSuspiciousIPForCaptcha,
  shouldRequireCaptcha,
} from '../services/emergency-mode.service';
import { logger } from '../utils/logger';

// ============================================
// TYPES
// ============================================

export interface SuspiciousActivityOptions {
  /** Whether to check for suspicious user agents */
  checkUserAgent?: boolean;
  /** Whether to track rapid requests */
  trackRapidRequests?: boolean;
  /** Whether to increase CAPTCHA challenge rate for suspicious requests */
  increaseCaptchaRate?: boolean;
  /** Paths to exclude from suspicious activity checks */
  excludePaths?: string[];
}

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

// ============================================
// MIDDLEWARE
// ============================================

/**
 * Suspicious Activity Detection Middleware
 * 
 * Monitors requests for suspicious patterns and takes appropriate action:
 * - Detects suspicious user agents (bots, scrapers, etc.)
 * - Tracks rapid requests from the same IP
 * - Records suspicious IPs for potential auto-blocking
 * - Can trigger emergency mode automatically
 * 
 * **Feature: high-traffic-resilience**
 * **Requirements: 14.5, 14.6**
 * 
 * @param options - Configuration options
 * @returns Hono middleware
 * 
 * @example
 * ```ts
 * // Apply to all routes
 * app.use('*', suspiciousActivityMiddleware());
 * 
 * // With custom options
 * app.use('/api/*', suspiciousActivityMiddleware({
 *   checkUserAgent: true,
 *   trackRapidRequests: true,
 *   excludePaths: ['/health', '/metrics'],
 * }));
 * ```
 */
export function suspiciousActivityMiddleware(options: SuspiciousActivityOptions = {}) {
  const {
    checkUserAgent = true,
    trackRapidRequests: trackRapid = true,
    increaseCaptchaRate = true,
    excludePaths = ['/health', '/health/live', '/health/ready', '/metrics'],
  } = options;

  return async (c: Context, next: Next) => {
    const path = c.req.path;
    
    // Skip excluded paths
    if (excludePaths.some(p => path.startsWith(p))) {
      await next();
      return;
    }

    const ip = getClientIp(c);
    const userAgent = c.req.header('user-agent');
    let isSuspicious = false;
    const suspiciousReasons: string[] = [];

    // Check for suspicious user agent
    if (checkUserAgent && isSuspiciousUserAgent(userAgent)) {
      isSuspicious = true;
      suspiciousReasons.push('suspicious_user_agent');
    }

    // Track rapid requests
    if (trackRapid && trackRapidRequests(ip)) {
      isSuspicious = true;
      suspiciousReasons.push('rapid_requests');
    }

    // If suspicious, record and potentially take action
    if (isSuspicious) {
      await recordSuspiciousIP(ip, suspiciousReasons.join(', '));
      
      // Record for CAPTCHA challenge rate increase
      // **Validates: Requirements 14.5**
      recordSuspiciousIPForCaptcha(ip);
      
      // Set flag for downstream middleware (e.g., CAPTCHA)
      if (increaseCaptchaRate) {
        c.set('requireCaptcha', true);
        c.set('suspiciousActivity', true);
      }

      // Check if emergency mode should require stricter handling
      try {
        const ipBlockingService = getIPBlockingService();
        const isEmergency = await ipBlockingService.isEmergencyMode();
        
        if (isEmergency) {
          // In emergency mode, we might want to be more aggressive
          logger.warn('[SUSPICIOUS_ACTIVITY] Suspicious request in emergency mode', {
            ip,
            path,
            userAgent,
            reasons: suspiciousReasons,
          });
          
          // Add header to indicate suspicious activity
          c.header('X-Suspicious-Activity', 'detected');
        }
      } catch {
        // Ignore errors checking emergency mode
      }
    }

    await next();
  };
}

/**
 * CAPTCHA Challenge Rate Middleware
 * 
 * Increases CAPTCHA challenge rate for suspicious requests or during emergency mode.
 * Should be used before the turnstile middleware.
 * 
 * **Feature: high-traffic-resilience**
 * **Requirements: 14.5, 14.6**
 * 
 * @example
 * ```ts
 * app.post('/leads', 
 *   captchaChallengeRateMiddleware(),
 *   optionalTurnstileMiddleware(),
 *   validate(schema),
 *   handler
 * );
 * ```
 */
export function captchaChallengeRateMiddleware() {
  return async (c: Context, next: Next) => {
    const ip = getClientIp(c);
    const path = c.req.path;
    let requireCaptcha = c.get('requireCaptcha') || false;
    const isSuspicious = c.get('suspiciousActivity') || false;
    
    // Use the centralized CAPTCHA challenge rate logic
    if (!requireCaptcha) {
      try {
        const result = await shouldRequireCaptcha(ip, path, isSuspicious);
        requireCaptcha = result.required;
        
        if (requireCaptcha) {
          logger.debug('[CAPTCHA_CHALLENGE] CAPTCHA required', {
            ip,
            path,
            reason: result.reason,
          });
          
          // Set header to indicate why CAPTCHA is required
          c.header('X-Captcha-Reason', result.reason);
        }
      } catch {
        // Ignore errors, fall back to checking emergency mode directly
        try {
          const ipBlockingService = getIPBlockingService();
          const isEmergency = await ipBlockingService.isEmergencyMode();
          
          if (isEmergency) {
            requireCaptcha = true;
            logger.debug('[CAPTCHA_CHALLENGE] CAPTCHA required due to emergency mode (fallback)', {
              ip,
              path,
            });
          }
        } catch {
          // Ignore errors
        }
      }
    }
    
    // Set the flag for downstream middleware
    c.set('requireCaptcha', requireCaptcha);
    
    await next();
  };
}

/**
 * Emergency Mode Header Middleware
 * 
 * Adds headers to indicate emergency mode status to clients.
 * Useful for frontend applications to show appropriate messages.
 * 
 * @example
 * ```ts
 * app.use('*', emergencyModeHeaderMiddleware());
 * ```
 */
export function emergencyModeHeaderMiddleware() {
  return async (c: Context, next: Next) => {
    try {
      const ipBlockingService = getIPBlockingService();
      const isEmergency = await ipBlockingService.isEmergencyMode();
      
      if (isEmergency) {
        c.header('X-Emergency-Mode', 'active');
        c.header('X-Rate-Limit-Mode', 'strict');
      }
    } catch {
      // Ignore errors
    }
    
    await next();
  };
}

export default suspiciousActivityMiddleware;
