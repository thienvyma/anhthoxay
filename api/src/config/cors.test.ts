/**
 * CORS Configuration Tests
 * Tests CORS origin validation and configuration
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  getCorsConfig,
  isValidOrigin,
  isNgrokOrigin,
  isCloudflareOrigin,
  isTunnelOrigin,
  parseOrigins,
  validateOrigins,
  CorsValidationError,
} from './cors';

describe('CORS Configuration', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    // Reset environment
    delete process.env.CORS_ORIGINS;
    process.env.NODE_ENV = 'test';
  });

  afterEach(() => {
    // Restore original environment
    Object.keys(process.env).forEach((key) => {
      if (!(key in originalEnv)) {
        delete process.env[key];
      }
    });
    Object.assign(process.env, originalEnv);
  });

  describe('isValidOrigin', () => {
    it('should accept valid HTTP origins', () => {
      expect(isValidOrigin('http://localhost:4200')).toBe(true);
      expect(isValidOrigin('http://localhost')).toBe(true);
      expect(isValidOrigin('http://example.com')).toBe(true);
    });

    it('should accept valid HTTPS origins', () => {
      expect(isValidOrigin('https://example.com')).toBe(true);
      expect(isValidOrigin('https://app.example.com')).toBe(true);
      expect(isValidOrigin('https://sub.domain.example.com')).toBe(true);
    });

    it('should reject origins with paths', () => {
      expect(isValidOrigin('http://localhost:4200/path')).toBe(false);
      expect(isValidOrigin('https://example.com/api')).toBe(false);
    });

    it('should reject origins with query strings', () => {
      expect(isValidOrigin('http://localhost:4200?query=1')).toBe(false);
    });

    it('should reject non-HTTP protocols', () => {
      expect(isValidOrigin('ftp://example.com')).toBe(false);
      expect(isValidOrigin('file:///path/to/file')).toBe(false);
      expect(isValidOrigin('ws://example.com')).toBe(false);
    });

    it('should reject invalid URLs', () => {
      expect(isValidOrigin('not-a-url')).toBe(false);
      expect(isValidOrigin('')).toBe(false);
      expect(isValidOrigin('localhost:4200')).toBe(false);
    });

    it('should reject null/undefined', () => {
      expect(isValidOrigin(null as unknown as string)).toBe(false);
      expect(isValidOrigin(undefined as unknown as string)).toBe(false);
    });
  });

  describe('isNgrokOrigin', () => {
    it('should accept valid ngrok origins', () => {
      expect(isNgrokOrigin('https://abc123.ngrok-free.app')).toBe(true);
      expect(isNgrokOrigin('https://my-tunnel.ngrok.app')).toBe(true);
    });

    it('should reject non-ngrok origins', () => {
      expect(isNgrokOrigin('https://example.com')).toBe(false);
      expect(isNgrokOrigin('http://localhost:4200')).toBe(false);
    });

    it('should reject HTTP ngrok origins', () => {
      expect(isNgrokOrigin('http://abc123.ngrok-free.app')).toBe(false);
    });
  });

  describe('isCloudflareOrigin', () => {
    it('should accept valid Cloudflare Tunnel origins', () => {
      expect(isCloudflareOrigin('https://my-tunnel.trycloudflare.com')).toBe(true);
      expect(isCloudflareOrigin('https://abc-def-123.trycloudflare.com')).toBe(true);
    });

    it('should reject non-Cloudflare origins', () => {
      expect(isCloudflareOrigin('https://example.com')).toBe(false);
      expect(isCloudflareOrigin('http://localhost:4200')).toBe(false);
    });

    it('should reject HTTP Cloudflare origins', () => {
      expect(isCloudflareOrigin('http://my-tunnel.trycloudflare.com')).toBe(false);
    });
  });

  describe('isTunnelOrigin', () => {
    it('should accept ngrok origins', () => {
      expect(isTunnelOrigin('https://abc123.ngrok-free.app')).toBe(true);
    });

    it('should accept Cloudflare origins', () => {
      expect(isTunnelOrigin('https://my-tunnel.trycloudflare.com')).toBe(true);
    });

    it('should reject non-tunnel origins', () => {
      expect(isTunnelOrigin('https://example.com')).toBe(false);
      expect(isTunnelOrigin('http://localhost:4200')).toBe(false);
    });
  });

  describe('parseOrigins', () => {
    it('should parse comma-separated origins', () => {
      const result = parseOrigins('http://localhost:4200,http://localhost:4201');
      expect(result).toEqual(['http://localhost:4200', 'http://localhost:4201']);
    });

    it('should trim whitespace', () => {
      const result = parseOrigins('  http://localhost:4200  ,  http://localhost:4201  ');
      expect(result).toEqual(['http://localhost:4200', 'http://localhost:4201']);
    });

    it('should filter empty strings', () => {
      const result = parseOrigins('http://localhost:4200,,http://localhost:4201,');
      expect(result).toEqual(['http://localhost:4200', 'http://localhost:4201']);
    });

    it('should return empty array for empty string', () => {
      expect(parseOrigins('')).toEqual([]);
    });

    it('should return empty array for null/undefined', () => {
      expect(parseOrigins(null as unknown as string)).toEqual([]);
      expect(parseOrigins(undefined as unknown as string)).toEqual([]);
    });
  });

  describe('validateOrigins', () => {
    it('should not throw for valid origins', () => {
      expect(() =>
        validateOrigins(['http://localhost:4200', 'https://example.com'])
      ).not.toThrow();
    });

    it('should throw CorsValidationError for invalid origin', () => {
      expect(() => validateOrigins(['http://localhost:4200', 'invalid'])).toThrow(
        CorsValidationError
      );
    });

    it('should include invalid origin in error', () => {
      try {
        validateOrigins(['invalid-origin']);
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(CorsValidationError);
        expect((error as CorsValidationError).invalidOrigin).toBe('invalid-origin');
      }
    });
  });

  describe('getCorsConfig', () => {
    it('should use CORS_ORIGINS from environment', () => {
      process.env.CORS_ORIGINS = 'http://localhost:4200,http://localhost:4201';

      const config = getCorsConfig();

      expect(config.origins).toEqual(['http://localhost:4200', 'http://localhost:4201']);
    });

    it('should use default origins in development without CORS_ORIGINS', () => {
      process.env.NODE_ENV = 'development';
      delete process.env.CORS_ORIGINS;

      const config = getCorsConfig();

      expect(config.origins).toContain('http://localhost:4200');
      expect(config.origins).toContain('http://localhost:4201');
      expect(config.origins).toContain('http://localhost:4203');
    });

    it('should return empty origins in production without CORS_ORIGINS', () => {
      process.env.NODE_ENV = 'production';
      delete process.env.CORS_ORIGINS;

      const config = getCorsConfig();

      expect(config.origins).toEqual([]);
      expect(config.isProduction).toBe(true);
    });

    it('should throw for invalid origins in CORS_ORIGINS', () => {
      process.env.CORS_ORIGINS = 'http://localhost:4200,invalid-origin';

      expect(() => getCorsConfig()).toThrow(CorsValidationError);
    });

    it('should set isProduction flag correctly', () => {
      process.env.CORS_ORIGINS = 'http://localhost:4200';

      process.env.NODE_ENV = 'production';
      expect(getCorsConfig().isProduction).toBe(true);

      process.env.NODE_ENV = 'development';
      expect(getCorsConfig().isProduction).toBe(false);
    });
  });

  describe('CorsValidationError', () => {
    it('should have correct properties', () => {
      const error = new CorsValidationError('Invalid origin', 'bad-origin');

      expect(error.name).toBe('CorsValidationError');
      expect(error.message).toBe('Invalid origin');
      expect(error.invalidOrigin).toBe('bad-origin');
    });

    it('should be instanceof Error', () => {
      const error = new CorsValidationError('Test', 'origin');
      expect(error).toBeInstanceOf(Error);
    });
  });
});
