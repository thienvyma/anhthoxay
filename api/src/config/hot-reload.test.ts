/**
 * Hot Reload Service Tests
 *
 * **Feature: high-traffic-resilience**
 * **Requirements: 15.1, 15.2, 15.3, 15.4, 15.5, 15.6**
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  getHotReloadService,
  resetHotReloadService,
  RuntimeConfigSchema,
  getRateLimitConfig,
  getFeatureFlags,
  getCacheTTLConfig,
  isFeatureEnabled,
  type RuntimeConfig,
} from './hot-reload';

// Mock Redis
vi.mock('./redis', () => ({
  getRedisClient: vi.fn(() => null),
  isRedisConnected: vi.fn(() => false),
}));

// Mock logger
vi.mock('../utils/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

describe('HotReloadService', () => {
  beforeEach(() => {
    resetHotReloadService();
    vi.clearAllMocks();
  });

  afterEach(() => {
    resetHotReloadService();
  });

  describe('initialization', () => {
    it('should create service with default configuration', () => {
      const service = getHotReloadService();
      expect(service).toBeDefined();
      
      const config = service.getAll();
      expect(config.rateLimits).toBeDefined();
      expect(config.featureFlags).toBeDefined();
      expect(config.cacheTTL).toBeDefined();
    });

    it('should return same instance on multiple calls', () => {
      const service1 = getHotReloadService();
      const service2 = getHotReloadService();
      expect(service1).toBe(service2);
    });

    it('should initialize with default rate limits', () => {
      const service = getHotReloadService();
      const rateLimits = service.getRateLimits();
      
      expect(rateLimits.global.maxAttempts).toBe(100);
      expect(rateLimits.global.windowMs).toBe(60000);
      expect(rateLimits.login.maxAttempts).toBe(5);
      expect(rateLimits.leads.maxAttempts).toBe(5);
    });

    it('should initialize with default feature flags', () => {
      const service = getHotReloadService();
      const flags = service.getFeatureFlags();
      
      expect(flags.enableReadReplica).toBe(true);
      expect(flags.enableIPBlocking).toBe(true);
      expect(flags.emergencyMode).toBe(false);
    });

    it('should initialize with default cache TTL', () => {
      const service = getHotReloadService();
      const cacheTTL = service.getCacheTTL();
      
      expect(cacheTTL.categories).toBe(300);
      expect(cacheTTL.materials).toBe(300);
      expect(cacheTTL.settings).toBe(60);
      expect(cacheTTL.regions).toBe(3600);
    });
  });

  describe('configuration validation', () => {
    /**
     * **Feature: high-traffic-resilience, Property 8: Configuration Validation**
     * **Validates: Requirements 15.4, 15.5**
     */
    it('should validate valid configuration', () => {
      const service = getHotReloadService();
      const validConfig: RuntimeConfig = {
        rateLimits: {
          global: { maxAttempts: 100, windowMs: 60000 },
          login: { maxAttempts: 5, windowMs: 60000 },
          leads: { maxAttempts: 5, windowMs: 60000 },
        },
        featureFlags: {
          enableReadReplica: true,
          enableIPBlocking: true,
          emergencyMode: false,
          enableCDNHeaders: true,
          enableCorrelationId: true,
        },
        cacheTTL: {
          categories: 300,
          materials: 300,
          settings: 60,
          regions: 3600,
          blog: 300,
        },
        version: 1,
      };

      const result = service.validateConfig(validConfig);
      expect(result.success).toBe(true);
    });

    it('should reject invalid rate limit configuration', () => {
      const service = getHotReloadService();
      const invalidConfig = {
        rateLimits: {
          global: { maxAttempts: -1, windowMs: 60000 }, // Invalid: negative
          login: { maxAttempts: 5, windowMs: 60000 },
          leads: { maxAttempts: 5, windowMs: 60000 },
        },
        featureFlags: {
          enableReadReplica: true,
          enableIPBlocking: true,
          emergencyMode: false,
          enableCDNHeaders: true,
          enableCorrelationId: true,
        },
        cacheTTL: {
          categories: 300,
          materials: 300,
          settings: 60,
          regions: 3600,
          blog: 300,
        },
      };

      const result = service.validateConfig(invalidConfig);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors.length).toBeGreaterThan(0);
      }
    });

    it('should reject configuration with missing fields', () => {
      const service = getHotReloadService();
      const incompleteConfig = {
        rateLimits: {
          global: { maxAttempts: 100 }, // Missing windowMs
        },
      };

      const result = service.validateConfig(incompleteConfig);
      expect(result.success).toBe(false);
    });

    it('should reject configuration with invalid types', () => {
      const service = getHotReloadService();
      const invalidTypeConfig = {
        rateLimits: {
          global: { maxAttempts: 'invalid', windowMs: 60000 },
          login: { maxAttempts: 5, windowMs: 60000 },
          leads: { maxAttempts: 5, windowMs: 60000 },
        },
        featureFlags: {
          enableReadReplica: 'yes', // Should be boolean
          enableIPBlocking: true,
          emergencyMode: false,
          enableCDNHeaders: true,
          enableCorrelationId: true,
        },
        cacheTTL: {
          categories: 300,
          materials: 300,
          settings: 60,
          regions: 3600,
          blog: 300,
        },
      };

      const result = service.validateConfig(invalidTypeConfig);
      expect(result.success).toBe(false);
    });

    it('should reject rate limits exceeding maximum', () => {
      const service = getHotReloadService();
      const invalidConfig = {
        rateLimits: {
          global: { maxAttempts: 100000, windowMs: 60000 }, // Exceeds max 10000
          login: { maxAttempts: 5, windowMs: 60000 },
          leads: { maxAttempts: 5, windowMs: 60000 },
        },
        featureFlags: {
          enableReadReplica: true,
          enableIPBlocking: true,
          emergencyMode: false,
          enableCDNHeaders: true,
          enableCorrelationId: true,
        },
        cacheTTL: {
          categories: 300,
          materials: 300,
          settings: 60,
          regions: 3600,
          blog: 300,
        },
      };

      const result = service.validateConfig(invalidConfig);
      expect(result.success).toBe(false);
    });
  });

  describe('configuration updates', () => {
    /**
     * **Validates: Requirements 15.1, 15.3**
     */
    it('should update rate limits successfully', async () => {
      const service = getHotReloadService();
      
      const result = await service.update({
        rateLimits: {
          global: { maxAttempts: 200, windowMs: 120000 },
          login: { maxAttempts: 10, windowMs: 60000 },
          leads: { maxAttempts: 10, windowMs: 60000 },
        },
      });

      expect(result.success).toBe(true);
      
      const rateLimits = service.getRateLimits();
      expect(rateLimits.global.maxAttempts).toBe(200);
      expect(rateLimits.global.windowMs).toBe(120000);
    });

    it('should update feature flags successfully', async () => {
      const service = getHotReloadService();
      
      const result = await service.update({
        featureFlags: {
          enableReadReplica: false,
          enableIPBlocking: false,
          emergencyMode: true,
          enableCDNHeaders: true,
          enableCorrelationId: true,
        },
      });

      expect(result.success).toBe(true);
      
      const flags = service.getFeatureFlags();
      expect(flags.enableReadReplica).toBe(false);
      expect(flags.emergencyMode).toBe(true);
    });

    it('should update cache TTL successfully', async () => {
      const service = getHotReloadService();
      
      const result = await service.update({
        cacheTTL: {
          categories: 600,
          materials: 600,
          settings: 120,
          regions: 7200,
          blog: 600,
        },
      });

      expect(result.success).toBe(true);
      
      const cacheTTL = service.getCacheTTL();
      expect(cacheTTL.categories).toBe(600);
      expect(cacheTTL.regions).toBe(7200);
    });

    it('should reject invalid updates', async () => {
      const service = getHotReloadService();
      
      const result = await service.update({
        rateLimits: {
          global: { maxAttempts: -1, windowMs: 60000 }, // Invalid
          login: { maxAttempts: 5, windowMs: 60000 },
          leads: { maxAttempts: 5, windowMs: 60000 },
        },
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors.length).toBeGreaterThan(0);
      }
    });

    it('should increment version on update', async () => {
      const service = getHotReloadService();
      const initialVersion = service.getAll().version || 0;
      
      await service.update({
        featureFlags: {
          enableReadReplica: true,
          enableIPBlocking: true,
          emergencyMode: true,
          enableCDNHeaders: true,
          enableCorrelationId: true,
        },
      });

      const newVersion = service.getAll().version || 0;
      expect(newVersion).toBe(initialVersion + 1);
    });
  });

  describe('change handlers', () => {
    /**
     * **Validates: Requirements 15.6**
     */
    it('should notify handlers on rate limit changes', async () => {
      const service = getHotReloadService();
      const handler = vi.fn();
      
      service.onChange('rateLimits', handler);
      
      await service.update({
        rateLimits: {
          global: { maxAttempts: 200, windowMs: 60000 },
          login: { maxAttempts: 5, windowMs: 60000 },
          leads: { maxAttempts: 5, windowMs: 60000 },
        },
      });

      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({
          key: 'rateLimits',
          source: 'manual',
        })
      );
    });

    it('should notify handlers on feature flag changes', async () => {
      const service = getHotReloadService();
      const handler = vi.fn();
      
      service.onChange('featureFlags', handler);
      
      await service.update({
        featureFlags: {
          enableReadReplica: false,
          enableIPBlocking: true,
          emergencyMode: false,
          enableCDNHeaders: true,
          enableCorrelationId: true,
        },
      });

      expect(handler).toHaveBeenCalledTimes(1);
    });

    it('should allow unsubscribing from changes', async () => {
      const service = getHotReloadService();
      const handler = vi.fn();
      
      const unsubscribe = service.onChange('rateLimits', handler);
      unsubscribe();
      
      await service.update({
        rateLimits: {
          global: { maxAttempts: 200, windowMs: 60000 },
          login: { maxAttempts: 5, windowMs: 60000 },
          leads: { maxAttempts: 5, windowMs: 60000 },
        },
      });

      expect(handler).not.toHaveBeenCalled();
    });

    it('should not notify handlers when config unchanged', async () => {
      const service = getHotReloadService();
      const handler = vi.fn();
      
      service.onChange('featureFlags', handler);
      
      // Update only rate limits, not feature flags
      await service.update({
        rateLimits: {
          global: { maxAttempts: 200, windowMs: 60000 },
          login: { maxAttempts: 5, windowMs: 60000 },
          leads: { maxAttempts: 5, windowMs: 60000 },
        },
      });

      expect(handler).not.toHaveBeenCalled();
    });
  });

  describe('polling', () => {
    it('should start and stop polling', () => {
      const service = getHotReloadService();
      
      service.startPolling();
      expect(service.getStatus().isPolling).toBe(true);
      
      service.stopPolling();
      expect(service.getStatus().isPolling).toBe(false);
    });

    it('should track poll status', () => {
      const service = getHotReloadService();
      
      const status = service.getStatus();
      expect(status.isPolling).toBe(false);
      expect(status.lastPollTime).toBeNull();
      expect(status.pollErrors).toBe(0);
    });
  });

  describe('reset', () => {
    it('should reset to default configuration', async () => {
      const service = getHotReloadService();
      
      // Update config
      await service.update({
        rateLimits: {
          global: { maxAttempts: 500, windowMs: 120000 },
          login: { maxAttempts: 20, windowMs: 60000 },
          leads: { maxAttempts: 20, windowMs: 60000 },
        },
      });

      // Reset
      await service.reset();

      const rateLimits = service.getRateLimits();
      expect(rateLimits.global.maxAttempts).toBe(100);
      expect(rateLimits.global.windowMs).toBe(60000);
    });
  });

  describe('convenience functions', () => {
    it('should get rate limit config via convenience function', () => {
      const config = getRateLimitConfig();
      expect(config.global).toBeDefined();
      expect(config.login).toBeDefined();
      expect(config.leads).toBeDefined();
    });

    it('should get feature flags via convenience function', () => {
      const flags = getFeatureFlags();
      expect(flags.enableReadReplica).toBeDefined();
      expect(flags.enableIPBlocking).toBeDefined();
    });

    it('should get cache TTL via convenience function', () => {
      const cacheTTL = getCacheTTLConfig();
      expect(cacheTTL.categories).toBeDefined();
      expect(cacheTTL.materials).toBeDefined();
    });

    it('should check feature enabled via convenience function', () => {
      const enabled = isFeatureEnabled('enableReadReplica');
      expect(typeof enabled).toBe('boolean');
    });
  });

  describe('schema validation', () => {
    it('should validate complete runtime config schema', () => {
      const validConfig = {
        rateLimits: {
          global: { maxAttempts: 100, windowMs: 60000 },
          login: { maxAttempts: 5, windowMs: 60000 },
          leads: { maxAttempts: 5, windowMs: 60000 },
        },
        featureFlags: {
          enableReadReplica: true,
          enableIPBlocking: true,
          emergencyMode: false,
          enableCDNHeaders: true,
          enableCorrelationId: true,
        },
        cacheTTL: {
          categories: 300,
          materials: 300,
          settings: 60,
          regions: 3600,
          blog: 300,
        },
        version: 1,
        updatedAt: '2024-01-01T00:00:00.000Z',
      };

      const result = RuntimeConfigSchema.safeParse(validConfig);
      expect(result.success).toBe(true);
    });

    it('should allow optional version and updatedAt', () => {
      const configWithoutOptional = {
        rateLimits: {
          global: { maxAttempts: 100, windowMs: 60000 },
          login: { maxAttempts: 5, windowMs: 60000 },
          leads: { maxAttempts: 5, windowMs: 60000 },
        },
        featureFlags: {
          enableReadReplica: true,
          enableIPBlocking: true,
          emergencyMode: false,
          enableCDNHeaders: true,
          enableCorrelationId: true,
        },
        cacheTTL: {
          categories: 300,
          materials: 300,
          settings: 60,
          regions: 3600,
          blog: 300,
        },
      };

      const result = RuntimeConfigSchema.safeParse(configWithoutOptional);
      expect(result.success).toBe(true);
    });
  });
});
