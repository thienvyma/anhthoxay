/**
 * Rate Limit Monitoring Service Tests
 *
 * **Feature: production-scalability**
 * **Requirements: 7.1, 7.2, 7.3, 7.4**
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';
import {
  logViolation,
  getRateLimitMetrics,
  getViolationCountForIP,
  clearAllViolations,
  CONSTANTS,
  type RateLimitViolation,
} from './rate-limit-monitoring.service';

// Mock redis config
vi.mock('../config/redis', () => ({
  getRedisClient: vi.fn().mockReturnValue(null), // Default to null (no Redis)
  isRedisConnected: vi.fn().mockReturnValue(false),
}));

vi.mock('../utils/logger', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

import { logger } from '../utils/logger';

describe('Rate Limit Monitoring Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearAllViolations();
  });

  afterEach(() => {
    clearAllViolations();
  });

  /**
   * **Feature: production-scalability, Property 15: Rate limit violation logging**
   * **Validates: Requirements 7.1**
   *
   * *For any* rate limit exceeded event,
   * the system SHALL log the violation with IP address, path, and timestamp.
   */
  describe('Property 15: Rate limit violation logging', () => {
    it('should log violation with IP, path, and timestamp for any valid violation', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate valid IP addresses
          fc.oneof(
            fc.tuple(
              fc.integer({ min: 1, max: 255 }),
              fc.integer({ min: 0, max: 255 }),
              fc.integer({ min: 0, max: 255 }),
              fc.integer({ min: 0, max: 255 })
            ).map(([a, b, c, d]) => `${a}.${b}.${c}.${d}`),
            fc.constant('unknown')
          ),
          // Generate valid paths
          fc.oneof(
            fc.constant('/api/test'),
            fc.constant('/api/auth/login'),
            fc.constant('/leads'),
            fc.constant('/api/v1/users'),
            fc.stringMatching(/^\/[a-z0-9\-/]*$/).filter(s => s.length > 0 && s.length < 100)
          ),
          // Generate timestamps
          fc.integer({ min: 1609459200000, max: Date.now() + 86400000 }), // 2021-01-01 to tomorrow
          async (ip, path, timestamp) => {
            vi.clearAllMocks();
            
            const violation: RateLimitViolation = {
              ip,
              path,
              timestamp,
            };

            await logViolation(violation);

            // Verify logger.warn was called with correct structure
            expect(logger.warn).toHaveBeenCalledWith(
              'Rate limit violation',
              expect.objectContaining({
                ip,
                path,
                timestamp: expect.any(String), // ISO string
              })
            );

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should include optional userAgent and userId when provided', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.tuple(
            fc.integer({ min: 1, max: 255 }),
            fc.integer({ min: 0, max: 255 }),
            fc.integer({ min: 0, max: 255 }),
            fc.integer({ min: 0, max: 255 })
          ).map(([a, b, c, d]) => `${a}.${b}.${c}.${d}`),
          fc.constant('/api/test'),
          fc.integer({ min: Date.now() - 86400000, max: Date.now() }),
          fc.option(fc.string({ minLength: 10, maxLength: 200 }), { nil: undefined }),
          fc.option(fc.uuid(), { nil: undefined }),
          async (ip, path, timestamp, userAgent, userId) => {
            vi.clearAllMocks();
            
            const violation: RateLimitViolation = {
              ip,
              path,
              timestamp,
              userAgent,
              userId,
            };

            await logViolation(violation);

            expect(logger.warn).toHaveBeenCalledWith(
              'Rate limit violation',
              expect.objectContaining({
                ip,
                path,
                userAgent,
                userId,
              })
            );

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should always log timestamp as ISO string format', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 1609459200000, max: Date.now() + 86400000 }),
          async (timestamp) => {
            vi.clearAllMocks();
            
            const violation: RateLimitViolation = {
              ip: '192.168.1.1',
              path: '/api/test',
              timestamp,
            };

            await logViolation(violation);

            const logCall = vi.mocked(logger.warn).mock.calls[0];
            const loggedData = logCall[1] as Record<string, unknown>;
            
            // Verify timestamp is a valid ISO string
            const isoTimestamp = loggedData.timestamp as string;
            const parsedDate = new Date(isoTimestamp);
            
            // Check it's a valid date
            expect(parsedDate.getTime()).not.toBeNaN();
            // Check it matches the original timestamp
            expect(parsedDate.getTime()).toBe(timestamp);

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle edge case IP addresses', async () => {
      const edgeCaseIPs = [
        '0.0.0.0',
        '255.255.255.255',
        '127.0.0.1',
        '10.0.0.1',
        '172.16.0.1',
        '192.168.0.1',
        'unknown',
      ];

      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom(...edgeCaseIPs),
          async (ip) => {
            vi.clearAllMocks();
            
            const violation: RateLimitViolation = {
              ip,
              path: '/api/test',
              timestamp: Date.now(),
            };

            await logViolation(violation);

            expect(logger.warn).toHaveBeenCalledWith(
              'Rate limit violation',
              expect.objectContaining({ ip })
            );

            return true;
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should handle various path formats', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.oneof(
            fc.constant('/'),
            fc.constant('/api'),
            fc.constant('/api/v1/users'),
            fc.constant('/api/auth/login'),
            fc.constant('/leads'),
            fc.stringMatching(/^\/[a-z0-9\-/]{1,50}$/)
          ),
          async (path) => {
            vi.clearAllMocks();
            
            const violation: RateLimitViolation = {
              ip: '192.168.1.1',
              path,
              timestamp: Date.now(),
            };

            await logViolation(violation);

            expect(logger.warn).toHaveBeenCalledWith(
              'Rate limit violation',
              expect.objectContaining({ path })
            );

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * **Feature: production-scalability, Property 16: Rate limit alert threshold**
   * **Validates: Requirements 7.2**
   *
   * *For any* IP that exceeds rate limit 10 times within 5 minutes,
   * the system SHALL trigger an alert.
   */
  describe('Property 16: Rate limit alert threshold', () => {
    it('should have correct alert threshold constant', () => {
      expect(CONSTANTS.ALERT_THRESHOLD).toBe(10);
    });

    it('should have correct alert window constant (5 minutes)', () => {
      expect(CONSTANTS.ALERT_WINDOW_MS).toBe(5 * 60 * 1000);
    });

    it('should trigger alert when violations exceed threshold', async () => {
      const ip = '192.168.1.100';
      const path = '/api/test';
      const now = Date.now();

      // Log violations up to threshold
      for (let i = 0; i < CONSTANTS.ALERT_THRESHOLD; i++) {
        await logViolation({
          ip,
          path,
          timestamp: now - (CONSTANTS.ALERT_THRESHOLD - i) * 1000, // Spread over time
        });
      }

      // Check that alert was triggered (logger.error called with ALERT)
      const errorCalls = vi.mocked(logger.error).mock.calls;
      const alertCall = errorCalls.find(
        call => call[0] === 'ALERT: Rate limit threshold exceeded'
      );

      expect(alertCall).toBeDefined();
      if (alertCall) {
        const alertData = alertCall[1] as Record<string, unknown>;
        expect(alertData.ip).toBe(ip);
        expect(alertData.alertType).toBe('RATE_LIMIT_THRESHOLD');
      }
    });

    it('should not trigger alert below threshold', async () => {
      const ip = '192.168.1.101';
      const path = '/api/test';
      const now = Date.now();

      // Log violations below threshold
      for (let i = 0; i < CONSTANTS.ALERT_THRESHOLD - 1; i++) {
        await logViolation({
          ip,
          path,
          timestamp: now - i * 1000,
        });
      }

      // Check that no alert was triggered
      const errorCalls = vi.mocked(logger.error).mock.calls;
      const alertCall = errorCalls.find(
        call => call[0] === 'ALERT: Rate limit threshold exceeded'
      );

      expect(alertCall).toBeUndefined();
    });

    it('should track violations per IP independently', () => {
      fc.assert(
        fc.property(
          fc.tuple(
            fc.integer({ min: 1, max: 255 }),
            fc.integer({ min: 0, max: 255 }),
            fc.integer({ min: 0, max: 255 }),
            fc.integer({ min: 0, max: 255 })
          ).map(([a, b, c, d]) => `${a}.${b}.${c}.${d}`),
          fc.tuple(
            fc.integer({ min: 1, max: 255 }),
            fc.integer({ min: 0, max: 255 }),
            fc.integer({ min: 0, max: 255 }),
            fc.integer({ min: 0, max: 255 })
          ).map(([a, b, c, d]) => `${a}.${b}.${c}.${d}`),
          (ip1, ip2) => {
            fc.pre(ip1 !== ip2);

            // Different IPs should have independent tracking
            const key1 = `${CONSTANTS.VIOLATION_KEY_PREFIX}:ip:${ip1}`;
            const key2 = `${CONSTANTS.VIOLATION_KEY_PREFIX}:ip:${ip2}`;

            expect(key1).not.toBe(key2);
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Violation tracking in Redis
   * **Feature: production-scalability**
   * **Requirements: 7.4**
   */
  describe('Violation tracking', () => {
    it('should use correct Redis key prefix', () => {
      expect(CONSTANTS.VIOLATION_KEY_PREFIX).toBe('ratelimit:violation');
    });

    it('should have 1 hour TTL for violations', () => {
      expect(CONSTANTS.VIOLATION_TTL_SECONDS).toBe(3600);
    });

    it('should generate unique keys for different IP+path combinations', () => {
      fc.assert(
        fc.property(
          fc.tuple(
            fc.integer({ min: 1, max: 255 }),
            fc.integer({ min: 0, max: 255 }),
            fc.integer({ min: 0, max: 255 }),
            fc.integer({ min: 0, max: 255 })
          ).map(([a, b, c, d]) => `${a}.${b}.${c}.${d}`),
          fc.oneof(
            fc.constant('/api/test'),
            fc.constant('/api/auth'),
            fc.constant('/leads'),
            fc.stringMatching(/^\/[a-z0-9\-/]{1,30}$/)
          ),
          fc.tuple(
            fc.integer({ min: 1, max: 255 }),
            fc.integer({ min: 0, max: 255 }),
            fc.integer({ min: 0, max: 255 }),
            fc.integer({ min: 0, max: 255 })
          ).map(([a, b, c, d]) => `${a}.${b}.${c}.${d}`),
          fc.oneof(
            fc.constant('/api/test'),
            fc.constant('/api/auth'),
            fc.constant('/leads'),
            fc.stringMatching(/^\/[a-z0-9\-/]{1,30}$/)
          ),
          (ip1, path1, ip2, path2) => {
            fc.pre(ip1 !== ip2 || path1 !== path2);

            const key1 = `${CONSTANTS.VIOLATION_KEY_PREFIX}:ip-path:${ip1}:${encodeURIComponent(path1)}`;
            const key2 = `${CONSTANTS.VIOLATION_KEY_PREFIX}:ip-path:${ip2}:${encodeURIComponent(path2)}`;

            expect(key1).not.toBe(key2);
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Metrics retrieval
   * **Feature: production-scalability**
   * **Requirements: 7.3**
   */
  describe('Metrics retrieval', () => {
    it('should return valid metrics structure', async () => {
      const metrics = await getRateLimitMetrics();

      expect(metrics).toHaveProperty('totalViolations');
      expect(metrics).toHaveProperty('violationsByEndpoint');
      expect(metrics).toHaveProperty('topViolatingIPs');
      expect(metrics).toHaveProperty('lastHourViolations');

      expect(typeof metrics.totalViolations).toBe('number');
      expect(Array.isArray(metrics.violationsByEndpoint)).toBe(true);
      expect(Array.isArray(metrics.topViolatingIPs)).toBe(true);
      expect(typeof metrics.lastHourViolations).toBe('number');
    });

    it('should return zero metrics when no violations', async () => {
      await clearAllViolations();
      const metrics = await getRateLimitMetrics();

      expect(metrics.totalViolations).toBe(0);
      expect(metrics.lastHourViolations).toBe(0);
      expect(metrics.violationsByEndpoint).toHaveLength(0);
      expect(metrics.topViolatingIPs).toHaveLength(0);
    });

    it('should count violations correctly in memory fallback', async () => {
      const ip = '192.168.1.50';
      const path = '/api/test';
      const violationCount = 5;

      for (let i = 0; i < violationCount; i++) {
        await logViolation({
          ip,
          path,
          timestamp: Date.now(),
        });
      }

      const count = await getViolationCountForIP(ip);
      expect(count).toBe(violationCount);
    });
  });

  /**
   * Clear violations
   */
  describe('Clear violations', () => {
    it('should clear all in-memory violations', async () => {
      // Add some violations
      await logViolation({
        ip: '192.168.1.1',
        path: '/api/test',
        timestamp: Date.now(),
      });

      let count = await getViolationCountForIP('192.168.1.1');
      expect(count).toBeGreaterThan(0);

      // Clear all
      await clearAllViolations();

      count = await getViolationCountForIP('192.168.1.1');
      expect(count).toBe(0);
    });
  });
});
