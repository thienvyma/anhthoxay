/**
 * Cloudflare Turnstile CAPTCHA Verification Service
 *
 * Provides CAPTCHA verification for public forms to prevent bot spam.
 *
 * **Feature: production-scalability**
 * **Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.7**
 */

import { logger } from '../utils/logger';

// ============================================
// CONSTANTS
// ============================================

const TURNSTILE_VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

// ============================================
// TYPES
// ============================================

/**
 * Turnstile API response structure
 */
interface TurnstileResponse {
  success: boolean;
  'error-codes'?: string[];
  challenge_ts?: string;
  hostname?: string;
  action?: string;
  cdata?: string;
}

/**
 * Verification result
 */
export interface TurnstileVerificationResult {
  success: boolean;
  errorCodes?: string[];
  timestamp?: string;
  hostname?: string;
}

// ============================================
// SERVICE CLASS
// ============================================

export class TurnstileService {
  private secretKey: string | undefined;
  private isConfigured: boolean;

  constructor() {
    this.secretKey = process.env.TURNSTILE_SECRET_KEY;
    this.isConfigured = !!this.secretKey;

    if (!this.isConfigured) {
      logger.warn('Turnstile secret key not configured, CAPTCHA verification will be skipped');
    }
  }

  /**
   * Check if Turnstile is configured
   */
  isEnabled(): boolean {
    return this.isConfigured;
  }

  /**
   * Verify a Turnstile token
   *
   * @param token - The Turnstile token from the client
   * @param ip - Optional client IP address for additional validation
   * @returns Verification result
   *
   * @example
   * ```ts
   * const turnstile = new TurnstileService();
   * const result = await turnstile.verify(token, clientIp);
   * if (!result.success) {
   *   return errorResponse(c, 'CAPTCHA_FAILED', 'CAPTCHA verification failed', 400);
   * }
   * ```
   */
  async verify(token: string, ip?: string): Promise<TurnstileVerificationResult> {
    // Skip verification if not configured (development mode)
    if (!this.isConfigured || !this.secretKey) {
      logger.warn('Turnstile verification skipped - not configured');
      return { success: true };
    }

    // Validate token is provided
    if (!token || typeof token !== 'string' || token.trim() === '') {
      return {
        success: false,
        errorCodes: ['missing-input-response'],
      };
    }

    try {
      const formData = new URLSearchParams({
        secret: this.secretKey,
        response: token,
      });

      // Add IP if provided for additional validation
      if (ip) {
        formData.append('remoteip', ip);
      }

      const response = await fetch(TURNSTILE_VERIFY_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData,
      });

      if (!response.ok) {
        logger.error('Turnstile API request failed', {
          status: response.status,
          statusText: response.statusText,
        });
        return {
          success: false,
          errorCodes: ['api-error'],
        };
      }

      const data: TurnstileResponse = await response.json();

      if (!data.success) {
        logger.warn('Turnstile verification failed', {
          errorCodes: data['error-codes'],
          hostname: data.hostname,
        });
      }

      return {
        success: data.success,
        errorCodes: data['error-codes'],
        timestamp: data.challenge_ts,
        hostname: data.hostname,
      };
    } catch (error) {
      logger.error('Turnstile verification error', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      // Return failure on network/parsing errors
      return {
        success: false,
        errorCodes: ['network-error'],
      };
    }
  }
}

// ============================================
// SINGLETON INSTANCE
// ============================================

/**
 * Singleton Turnstile service instance
 */
export const turnstileService = new TurnstileService();

/**
 * Verify a Turnstile token (convenience function)
 *
 * @param token - The Turnstile token from the client
 * @param ip - Optional client IP address
 * @returns true if verification succeeded, false otherwise
 */
export async function verifyTurnstile(token: string, ip?: string): Promise<boolean> {
  const result = await turnstileService.verify(token, ip);
  return result.success;
}

export default TurnstileService;
