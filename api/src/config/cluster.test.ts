/**
 * Cluster Configuration Tests
 *
 * **Feature: high-traffic-resilience**
 * **Requirements: 1.1, 1.2**
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  getClusterConfig,
  getInstanceId,
  isClusterMode,
  getInstanceMetadata,
  resetClusterConfig,
} from './cluster';

describe('Cluster Configuration', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    // Reset cluster config before each test
    resetClusterConfig();
  });

  afterEach(() => {
    // Restore original environment
    process.env = { ...originalEnv };
    resetClusterConfig();
  });

  describe('getClusterConfig', () => {
    it('should generate a unique instance ID', () => {
      const config = getClusterConfig();
      
      expect(config.instanceId).toBeDefined();
      expect(config.instanceId.length).toBeGreaterThan(10);
      expect(config.instanceId).toMatch(/^[a-z0-9-]+-[a-f0-9]{6}-\d+$/);
    });

    it('should use INSTANCE_ID from environment if provided', () => {
      process.env.INSTANCE_ID = 'custom-instance-123';
      
      const config = getClusterConfig();
      
      expect(config.instanceId).toBe('custom-instance-123');
    });

    it('should return same config on subsequent calls', () => {
      const config1 = getClusterConfig();
      const config2 = getClusterConfig();
      
      expect(config1).toBe(config2);
      expect(config1.instanceId).toBe(config2.instanceId);
    });

    it('should set default shutdown timeout to 30000ms', () => {
      const config = getClusterConfig();
      
      expect(config.shutdownTimeout).toBe(30000);
    });

    it('should use SHUTDOWN_TIMEOUT from environment', () => {
      process.env.SHUTDOWN_TIMEOUT = '60000';
      
      const config = getClusterConfig();
      
      expect(config.shutdownTimeout).toBe(60000);
    });

    it('should set default drain timeout to 25000ms', () => {
      const config = getClusterConfig();
      
      expect(config.drainTimeout).toBe(25000);
    });

    it('should use DRAIN_TIMEOUT from environment', () => {
      process.env.DRAIN_TIMEOUT = '20000';
      
      const config = getClusterConfig();
      
      expect(config.drainTimeout).toBe(20000);
    });

    it('should include hostname', () => {
      const config = getClusterConfig();
      
      expect(config.hostname).toBeDefined();
      expect(typeof config.hostname).toBe('string');
    });

    it('should include process ID', () => {
      const config = getClusterConfig();
      
      expect(config.pid).toBe(process.pid);
    });

    it('should include start timestamp', () => {
      const before = new Date();
      const config = getClusterConfig();
      const after = new Date();
      
      expect(config.startedAt).toBeInstanceOf(Date);
      expect(config.startedAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(config.startedAt.getTime()).toBeLessThanOrEqual(after.getTime());
    });
  });

  describe('isClusterMode', () => {
    it('should return false in development by default', () => {
      process.env.NODE_ENV = 'development';
      
      expect(isClusterMode()).toBe(false);
    });

    it('should return true in production by default', () => {
      process.env.NODE_ENV = 'production';
      
      expect(isClusterMode()).toBe(true);
    });

    it('should respect CLUSTER_MODE environment variable', () => {
      process.env.NODE_ENV = 'development';
      process.env.CLUSTER_MODE = 'true';
      
      expect(isClusterMode()).toBe(true);
    });

    it('should allow disabling cluster mode in production', () => {
      process.env.NODE_ENV = 'production';
      process.env.CLUSTER_MODE = 'false';
      
      expect(isClusterMode()).toBe(false);
    });
  });

  describe('getInstanceId', () => {
    it('should return the instance ID', () => {
      const instanceId = getInstanceId();
      const config = getClusterConfig();
      
      expect(instanceId).toBe(config.instanceId);
    });
  });

  describe('getInstanceMetadata', () => {
    it('should return instance metadata', () => {
      const metadata = getInstanceMetadata();
      
      expect(metadata).toHaveProperty('instanceId');
      expect(metadata).toHaveProperty('hostname');
      expect(metadata).toHaveProperty('pid');
      expect(metadata).toHaveProperty('uptime');
    });

    it('should calculate uptime correctly', async () => {
      // Get initial metadata
      const metadata1 = getInstanceMetadata();
      
      // Wait a bit
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Get metadata again
      const metadata2 = getInstanceMetadata();
      
      // Uptime should have increased (or stayed same due to rounding)
      expect(metadata2.uptime).toBeGreaterThanOrEqual(metadata1.uptime as number);
    });
  });

  describe('Instance ID uniqueness', () => {
    it('should generate different IDs on reset', () => {
      const id1 = getInstanceId();
      resetClusterConfig();
      const id2 = getInstanceId();
      
      // IDs should be different (random component changes)
      expect(id1).not.toBe(id2);
    });
  });
});
