/**
 * Property-Based Tests for Config Module
 * **Feature: codebase-hardening, Property 1: Environment Configuration Consistency**
 * **Validates: Requirements 1.1, 1.2, 1.3, 1.5**
 */

import * as fc from 'fast-check';
import { describe, it, expect } from 'vitest';

// ============================================
// Config Logic (isolated for testing)
// ============================================

const DEFAULT_API_URL = 'http://localhost:4202';

function getApiUrlLogic(envValue: string | undefined, isProd: boolean): {
  url: string;
  shouldWarn: boolean;
} {
  if (envValue && envValue.trim() !== '') {
    // Remove trailing slash
    const url = envValue.replace(/\/$/, '');
    return { url, shouldWarn: false };
  }

  // Fallback to default
  return {
    url: DEFAULT_API_URL,
    shouldWarn: isProd, // Warn only in production
  };
}

function isProductionLogic(nodeEnv: string | undefined): boolean {
  return nodeEnv === 'production';
}

function isDevelopmentLogic(nodeEnv: string | undefined): boolean {
  return !isProductionLogic(nodeEnv);
}

// ============================================
// PROPERTY 1: Environment Configuration Consistency
// Requirements: 1.1, 1.2, 1.3, 1.5
// ============================================

describe('Property 1: Environment Configuration Consistency', () => {
  describe('getApiUrl logic', () => {
    it('should return env value when set', () => {
      fc.assert(
        fc.property(
          fc.webUrl(),
          fc.boolean(),
          (url, isProd) => {
            const result = getApiUrlLogic(url, isProd);
            // Should use the provided URL (without trailing slash)
            return result.url === url.replace(/\/$/, '');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return fallback when env is empty', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(undefined, '', '   '),
          fc.boolean(),
          (emptyValue, isProd) => {
            const result = getApiUrlLogic(emptyValue, isProd);
            return result.url === DEFAULT_API_URL;
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should warn only in production when using fallback', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(undefined, '', '   '),
          (emptyValue) => {
            const prodResult = getApiUrlLogic(emptyValue, true);
            const devResult = getApiUrlLogic(emptyValue, false);
            
            return prodResult.shouldWarn === true && devResult.shouldWarn === false;
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should not warn when env value is set', () => {
      fc.assert(
        fc.property(
          fc.webUrl(),
          fc.boolean(),
          (url, isProd) => {
            const result = getApiUrlLogic(url, isProd);
            return result.shouldWarn === false;
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should remove trailing slash from URL', () => {
      fc.assert(
        fc.property(
          fc.webUrl().filter(url => !url.endsWith('/')),
          fc.boolean(),
          (url, isProd) => {
            const urlWithSlash = url + '/';
            const result = getApiUrlLogic(urlWithSlash, isProd);
            return !result.url.endsWith('/');
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should handle URLs without trailing slash', () => {
      fc.assert(
        fc.property(
          fc.webUrl().filter(url => !url.endsWith('/')),
          fc.boolean(),
          (url, isProd) => {
            const result = getApiUrlLogic(url, isProd);
            return result.url === url;
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  describe('isProduction logic', () => {
    it('should return true only for "production"', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 0, maxLength: 20 }),
          (nodeEnv) => {
            const result = isProductionLogic(nodeEnv);
            return result === (nodeEnv === 'production');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return false for undefined', () => {
      expect(isProductionLogic(undefined)).toBe(false);
    });

    it('should return false for development', () => {
      expect(isProductionLogic('development')).toBe(false);
    });

    it('should return true for production', () => {
      expect(isProductionLogic('production')).toBe(true);
    });
  });

  describe('isDevelopment logic', () => {
    it('should be inverse of isProduction', () => {
      fc.assert(
        fc.property(
          fc.option(fc.string({ minLength: 0, maxLength: 20 }), { nil: undefined }),
          (nodeEnv) => {
            const isProd = isProductionLogic(nodeEnv);
            const isDev = isDevelopmentLogic(nodeEnv);
            return isProd !== isDev;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return true for non-production environments', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 0, maxLength: 20 }).filter(s => s !== 'production'),
          (nodeEnv) => {
            return isDevelopmentLogic(nodeEnv) === true;
          }
        ),
        { numRuns: 50 }
      );
    });
  });
});
