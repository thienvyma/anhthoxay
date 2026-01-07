/**
 * Redis Health Service Tests
 *
 * **Feature: high-traffic-resilience**
 * **Requirements: 1.6**
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  getRedisHealthStatus,
  isInDegradedMode,
  isRedisAvailable,
  onDegradedModeChange,
  resetHealthStatus,
  withRedisFallback,
  withRedisOrDefault,
} from './redis-health.service';

// Mock the redis config module
vi.mock('../config/redis', () => ({
  getRedisClient: vi.fn(() => null),
  isRedisConnected: vi.fn(() => false),
  testRedisConnection: vi.fn(() => Promise.resolve(false)),
}));

// Mock prometheus metrics
vi.mock('./prometheus.service', () => ({
  prometheusMetrics: {
    recordRedisLatency: vi.fn(),
  },
}));

describe('Redis Health Service', () => {
  beforeEach(() => {
    resetHealthStatus();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('getRedisHealthStatus', () => {
    it('should return initial status', () => {
      const status = getRedisHealthStatus();
      
      expect(status.connected).toBe(false);
      expect(status.degradedMode).toBe(false);
      expect(status.lastConnectedAt).toBeNull();
      expect(status.lastError).toBeNull();
      expect(status.consecutiveFailures).toBe(0);
    });
  });

  describe('isInDegradedMode', () => {
    it('should return false initially', () => {
      expect(isInDegradedMode()).toBe(false);
    });
  });

  describe('isRedisAvailable', () => {
    it('should return false when Redis is not configured', () => {
      expect(isRedisAvailable()).toBe(false);
    });
  });

  describe('onDegradedModeChange', () => {
    it('should return unsubscribe function', () => {
      const callback = vi.fn();
      const unsubscribe = onDegradedModeChange(callback);
      
      expect(typeof unsubscribe).toBe('function');
      
      // Unsubscribe should not throw
      expect(() => unsubscribe()).not.toThrow();
    });
  });

  describe('withRedisFallback', () => {
    it('should use fallback when Redis is unavailable', async () => {
      const redisOp = vi.fn().mockResolvedValue('redis-result');
      const fallbackOp = vi.fn().mockResolvedValue('fallback-result');
      
      const result = await withRedisFallback(redisOp, fallbackOp, 'test-op');
      
      expect(result).toBe('fallback-result');
      expect(redisOp).not.toHaveBeenCalled();
      expect(fallbackOp).toHaveBeenCalled();
    });
  });

  describe('withRedisOrDefault', () => {
    it('should return default when Redis is unavailable', async () => {
      const operation = vi.fn().mockResolvedValue('redis-result');
      const defaultValue = 'default-value';
      
      const result = await withRedisOrDefault(operation, defaultValue, 'test-op');
      
      expect(result).toBe('default-value');
      expect(operation).not.toHaveBeenCalled();
    });
  });

  describe('resetHealthStatus', () => {
    it('should reset all status fields', () => {
      // First, get status to ensure it's initialized
      getRedisHealthStatus();
      
      // Reset
      resetHealthStatus();
      
      const status = getRedisHealthStatus();
      expect(status.connected).toBe(false);
      expect(status.degradedMode).toBe(false);
      expect(status.consecutiveFailures).toBe(0);
    });
  });
});
