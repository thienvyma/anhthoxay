/**
 * Emergency Mode Service Tests
 *
 * Tests for emergency mode activation, deactivation, and auto-detection.
 *
 * **Feature: high-traffic-resilience**
 * **Requirements: 14.5, 14.6**
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  getEmergencyModeService,
  resetEmergencyModeService,
} from './emergency-mode.service';

// Mock Redis
vi.mock('../config/redis', () => ({
  getRedisClient: vi.fn(() => null),
  isRedisConnected: vi.fn(() => false),
}));

// Mock IP blocking service
vi.mock('./ip-blocking.service', () => ({
  getIPBlockingService: vi.fn(() => ({
    enableEmergencyMode: vi.fn(),
    disableEmergencyMode: vi.fn(),
    isEmergencyMode: vi.fn(() => false),
    getBlockedIPs: vi.fn(() => []),
  })),
}));

// Mock emergency rate limiter
vi.mock('../middleware/emergency-rate-limiter', () => ({
  getEmergencyConfig: vi.fn(() => ({
    rateLimitMultiplier: 0.5,
    windowMultiplier: 2,
    requireCaptcha: true,
    blockedPatterns: [],
  })),
  updateEmergencyConfig: vi.fn(),
}));

describe('EmergencyModeService', () => {
  beforeEach(() => {
    resetEmergencyModeService();
  });

  afterEach(() => {
    resetEmergencyModeService();
  });

  describe('getStatus', () => {
    it('should return inactive status by default', async () => {
      const service = getEmergencyModeService();
      const status = await service.getStatus();

      expect(status.isActive).toBe(false);
      expect(status.autoActivated).toBe(false);
    });
  });

  describe('activate', () => {
    it('should activate emergency mode with reason', async () => {
      const service = getEmergencyModeService();

      await service.activate({
        reason: 'Test activation',
        activatedBy: 'admin-123',
      });

      const status = await service.getStatus();
      expect(status.isActive).toBe(true);
      expect(status.reason).toBe('Test activation');
      expect(status.activatedBy).toBe('admin-123');
      expect(status.autoActivated).toBe(false);
    });

    it('should set expiration time', async () => {
      const service = getEmergencyModeService();
      const duration = 30 * 60 * 1000; // 30 minutes

      await service.activate({
        reason: 'Test with duration',
        duration,
      });

      const status = await service.getStatus();
      expect(status.isActive).toBe(true);
      expect(status.expiresAt).toBeDefined();
      
      const expectedExpiry = Date.now() + duration;
      const actualExpiry = status.expiresAt?.getTime() ?? 0;
      expect(Math.abs(actualExpiry - expectedExpiry)).toBeLessThan(1000);
    });

    it('should mark auto-activated when specified', async () => {
      const service = getEmergencyModeService();

      await service.activate({
        reason: 'Auto-activated due to attack',
        autoActivated: true,
      });

      const status = await service.getStatus();
      expect(status.isActive).toBe(true);
      expect(status.autoActivated).toBe(true);
    });
  });

  describe('deactivate', () => {
    it('should deactivate emergency mode', async () => {
      const service = getEmergencyModeService();

      // First activate
      await service.activate({
        reason: 'Test activation',
      });

      let status = await service.getStatus();
      expect(status.isActive).toBe(true);

      // Then deactivate
      await service.deactivate('admin-456');

      status = await service.getStatus();
      expect(status.isActive).toBe(false);
    });
  });

  describe('recordViolation', () => {
    it('should record violations without error', async () => {
      const service = getEmergencyModeService();

      // Should not throw
      await expect(service.recordViolation()).resolves.not.toThrow();
    });
  });

  describe('getMetrics', () => {
    it('should return metrics', async () => {
      const service = getEmergencyModeService();
      const metrics = await service.getMetrics();

      expect(metrics).toHaveProperty('blockedIPsCount');
      expect(metrics).toHaveProperty('violationsLastMinute');
      expect(metrics).toHaveProperty('violationsLastHour');
      expect(metrics).toHaveProperty('suspiciousRequestsCount');
      expect(metrics).toHaveProperty('emergencyBlocksCount');
    });
  });

  describe('getConfig', () => {
    it('should return default configuration', () => {
      const service = getEmergencyModeService();
      const config = service.getConfig();

      expect(config.rateLimitMultiplier).toBe(0.5);
      expect(config.windowMultiplier).toBe(2);
      expect(config.requireCaptcha).toBe(true);
      expect(config.autoExpireDuration).toBe(60 * 60 * 1000);
    });
  });

  describe('updateConfig', () => {
    it('should update configuration', () => {
      const service = getEmergencyModeService();

      service.updateConfig({
        rateLimitMultiplier: 0.3,
        requireCaptcha: false,
      });

      const config = service.getConfig();
      expect(config.rateLimitMultiplier).toBe(0.3);
      expect(config.requireCaptcha).toBe(false);
      // Other values should remain default
      expect(config.windowMultiplier).toBe(2);
    });
  });

  describe('clearMetrics', () => {
    it('should clear metrics without error', async () => {
      const service = getEmergencyModeService();

      // Record some violations first
      await service.recordViolation();
      await service.recordViolation();

      // Clear should not throw
      await expect(service.clearMetrics()).resolves.not.toThrow();
    });
  });

  describe('singleton', () => {
    it('should return the same instance', () => {
      const service1 = getEmergencyModeService();
      const service2 = getEmergencyModeService();

      expect(service1).toBe(service2);
    });

    it('should create new instance after reset', () => {
      const service1 = getEmergencyModeService();
      resetEmergencyModeService();
      const service2 = getEmergencyModeService();

      expect(service1).not.toBe(service2);
    });
  });
});
