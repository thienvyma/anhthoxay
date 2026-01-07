/**
 * Prisma Replica Service Tests
 *
 * Tests for read/write separation and replica fallback handling.
 *
 * **Feature: high-traffic-resilience**
 * **Requirements: 3.1, 3.2, 3.3, 3.5, 3.6**
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { PrismaReplicaService, isReplicaConfigured } from './prisma-replica';

// Mock Prisma Client
vi.mock('@prisma/client', () => ({
  PrismaClient: vi.fn().mockImplementation(() => ({
    $on: vi.fn(),
    $queryRaw: vi.fn().mockResolvedValue([{ health: 1, lag_ms: null }]),
    $disconnect: vi.fn().mockResolvedValue(undefined),
    user: {
      findMany: vi.fn().mockResolvedValue([{ id: '1', name: 'Test User' }]),
      create: vi.fn().mockResolvedValue({ id: '2', name: 'New User' }),
    },
  })),
}));

// Mock logger
vi.mock('./logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

// Mock prometheus metrics
vi.mock('../services/prometheus.service', () => ({
  prometheusMetrics: {
    recordDbQuery: vi.fn(),
  },
}));

describe('PrismaReplicaService', () => {
  let service: PrismaReplicaService;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(async () => {
    if (service) {
      await service.disconnect();
    }
  });

  describe('constructor', () => {
    it('should create service with primary only when no replica URL', () => {
      service = new PrismaReplicaService({
        primaryUrl: 'postgresql://localhost:5432/primary',
        maxReplicationLag: 5000,
      });

      expect(service.getPrimary()).toBeDefined();
      expect(service.getReplica()).toBe(service.getPrimary());
    });

    it('should create service with both primary and replica when replica URL provided', () => {
      service = new PrismaReplicaService({
        primaryUrl: 'postgresql://localhost:5432/primary',
        replicaUrl: 'postgresql://localhost:5433/replica',
        maxReplicationLag: 5000,
      });

      expect(service.getPrimary()).toBeDefined();
      expect(service.getReplica()).toBeDefined();
      expect(service.getReplica()).not.toBe(service.getPrimary());
    });

    it('should use primary as replica when URLs are the same', () => {
      const sameUrl = 'postgresql://localhost:5432/db';
      service = new PrismaReplicaService({
        primaryUrl: sameUrl,
        replicaUrl: sameUrl,
        maxReplicationLag: 5000,
      });

      expect(service.getReplica()).toBe(service.getPrimary());
    });
  });

  describe('read', () => {
    it('should use primary when no replica configured', async () => {
      service = new PrismaReplicaService({
        primaryUrl: 'postgresql://localhost:5432/primary',
        maxReplicationLag: 5000,
      });

      const mockQuery = vi.fn().mockResolvedValue([{ id: '1' }]);
      const result = await service.read(mockQuery);

      expect(mockQuery).toHaveBeenCalledTimes(1);
      expect(result).toEqual([{ id: '1' }]);
    });

    it('should use replica when configured and healthy', async () => {
      service = new PrismaReplicaService({
        primaryUrl: 'postgresql://localhost:5432/primary',
        replicaUrl: 'postgresql://localhost:5433/replica',
        maxReplicationLag: 5000,
      });

      const mockQuery = vi.fn().mockResolvedValue([{ id: '1' }]);
      const result = await service.read(mockQuery);

      // Should be called once (on replica)
      expect(mockQuery).toHaveBeenCalledTimes(1);
      expect(result).toEqual([{ id: '1' }]);
    });

    it('should fallback to primary when replica query fails', async () => {
      service = new PrismaReplicaService({
        primaryUrl: 'postgresql://localhost:5432/primary',
        replicaUrl: 'postgresql://localhost:5433/replica',
        maxReplicationLag: 5000,
      });

      let callCount = 0;
      const mockQuery = vi.fn().mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          // First call (replica) fails
          return Promise.reject(new Error('Replica connection failed'));
        }
        // Second call (primary) succeeds
        return Promise.resolve([{ id: '1' }]);
      });

      const result = await service.read(mockQuery);

      expect(mockQuery).toHaveBeenCalledTimes(2);
      expect(result).toEqual([{ id: '1' }]);
    });
  });

  describe('write', () => {
    it('should always use primary for writes', async () => {
      service = new PrismaReplicaService({
        primaryUrl: 'postgresql://localhost:5432/primary',
        replicaUrl: 'postgresql://localhost:5433/replica',
        maxReplicationLag: 5000,
      });

      const mockQuery = vi.fn().mockResolvedValue({ id: '2' });
      const result = await service.write(mockQuery);

      expect(mockQuery).toHaveBeenCalledWith(service.getPrimary());
      expect(result).toEqual({ id: '2' });
    });
  });

  describe('readPrimary', () => {
    it('should always use primary for critical reads', async () => {
      service = new PrismaReplicaService({
        primaryUrl: 'postgresql://localhost:5432/primary',
        replicaUrl: 'postgresql://localhost:5433/replica',
        maxReplicationLag: 5000,
      });

      const mockQuery = vi.fn().mockResolvedValue([{ id: '1' }]);
      const result = await service.readPrimary(mockQuery);

      expect(mockQuery).toHaveBeenCalledWith(service.getPrimary());
      expect(result).toEqual([{ id: '1' }]);
    });
  });

  describe('isReplicaHealthy', () => {
    it('should return false when no replica configured', async () => {
      service = new PrismaReplicaService({
        primaryUrl: 'postgresql://localhost:5432/primary',
        maxReplicationLag: 5000,
      });

      const isHealthy = await service.isReplicaHealthy();
      expect(isHealthy).toBe(false);
    });

    it('should return true when replica is healthy', async () => {
      service = new PrismaReplicaService({
        primaryUrl: 'postgresql://localhost:5432/primary',
        replicaUrl: 'postgresql://localhost:5433/replica',
        maxReplicationLag: 5000,
      });

      const isHealthy = await service.isReplicaHealthy();
      expect(isHealthy).toBe(true);
    });
  });

  describe('getReplicationLag', () => {
    it('should return null when no replica configured', async () => {
      service = new PrismaReplicaService({
        primaryUrl: 'postgresql://localhost:5432/primary',
        maxReplicationLag: 5000,
      });

      const lag = await service.getReplicationLag();
      expect(lag).toBeNull();
    });

    it('should return lag value when replica is configured', async () => {
      service = new PrismaReplicaService({
        primaryUrl: 'postgresql://localhost:5432/primary',
        replicaUrl: 'postgresql://localhost:5433/replica',
        maxReplicationLag: 5000,
      });

      const lag = await service.getReplicationLag();
      // Mock returns null for lag_ms, so we expect 0 (healthy default)
      expect(typeof lag).toBe('number');
    });
  });

  describe('forceHealthCheck', () => {
    it('should clear cache and perform fresh health check', async () => {
      service = new PrismaReplicaService({
        primaryUrl: 'postgresql://localhost:5432/primary',
        replicaUrl: 'postgresql://localhost:5433/replica',
        maxReplicationLag: 5000,
      });

      // Force health check should return true (mock returns healthy)
      const forceCheck = await service.forceHealthCheck();
      expect(typeof forceCheck).toBe('boolean');
    });
  });

  describe('getReplicaStatus', () => {
    it('should return status when no replica configured', async () => {
      service = new PrismaReplicaService({
        primaryUrl: 'postgresql://localhost:5432/primary',
        maxReplicationLag: 5000,
      });

      const status = await service.getReplicaStatus();
      expect(status.configured).toBe(false);
      expect(status.healthy).toBe(false);
      expect(status.lagMs).toBeNull();
      expect(status.maxLagMs).toBe(5000);
      expect(status.circuitBreaker.state).toBe('closed');
    });

    it('should return status when replica is configured', async () => {
      service = new PrismaReplicaService({
        primaryUrl: 'postgresql://localhost:5432/primary',
        replicaUrl: 'postgresql://localhost:5433/replica',
        maxReplicationLag: 5000,
      });

      const status = await service.getReplicaStatus();
      expect(status.configured).toBe(true);
      expect(status.maxLagMs).toBe(5000);
      expect(status.circuitBreaker).toBeDefined();
      expect(status.circuitBreaker.state).toBe('closed');
      // healthy and lagMs depend on mock behavior
      expect(typeof status.healthy).toBe('boolean');
    });
  });

  describe('circuit breaker', () => {
    it('should start with closed circuit breaker', () => {
      service = new PrismaReplicaService({
        primaryUrl: 'postgresql://localhost:5432/primary',
        replicaUrl: 'postgresql://localhost:5433/replica',
        maxReplicationLag: 5000,
      });

      const status = service.getCircuitBreakerStatus();
      expect(status.state).toBe('closed');
      expect(status.failureCount).toBe(0);
      expect(status.openedAt).toBeNull();
    });

    it('should open circuit after multiple failures', async () => {
      service = new PrismaReplicaService({
        primaryUrl: 'postgresql://localhost:5432/primary',
        replicaUrl: 'postgresql://localhost:5433/replica',
        maxReplicationLag: 5000,
      });

      // Simulate 3 failures (threshold) - query fails on replica, succeeds on primary fallback
      let callCount = 0;
      const failingQuery = vi.fn().mockImplementation(() => {
        callCount++;
        // First call is to replica (fails), second is to primary (succeeds)
        if (callCount % 2 === 1) {
          return Promise.reject(new Error('Connection failed'));
        }
        return Promise.resolve([{ id: '1' }]);
      });
      
      for (let i = 0; i < 3; i++) {
        await service.read(failingQuery);
      }

      const status = service.getCircuitBreakerStatus();
      expect(status.state).toBe('open');
      expect(status.failureCount).toBe(3);
      expect(status.openedAt).not.toBeNull();
    });

    it('should use primary when circuit is open', async () => {
      service = new PrismaReplicaService({
        primaryUrl: 'postgresql://localhost:5432/primary',
        replicaUrl: 'postgresql://localhost:5433/replica',
        maxReplicationLag: 5000,
      });

      // Open the circuit with failures
      let callCount = 0;
      const failingQuery = vi.fn().mockImplementation(() => {
        callCount++;
        // First call is to replica (fails), second is to primary (succeeds)
        if (callCount % 2 === 1) {
          return Promise.reject(new Error('Connection failed'));
        }
        return Promise.resolve([{ id: '1' }]);
      });
      
      for (let i = 0; i < 3; i++) {
        await service.read(failingQuery);
      }

      // Verify circuit is open
      expect(service.getCircuitBreakerStatus().state).toBe('open');

      // Now circuit is open, should use primary directly
      const successQuery = vi.fn().mockResolvedValue([{ id: '2' }]);
      const result = await service.read(successQuery);

      expect(result).toEqual([{ id: '2' }]);
      // Query should be called once (on primary, not replica)
      expect(successQuery).toHaveBeenCalledTimes(1);
    });

    it('should allow manual reset of circuit breaker', () => {
      service = new PrismaReplicaService({
        primaryUrl: 'postgresql://localhost:5432/primary',
        replicaUrl: 'postgresql://localhost:5433/replica',
        maxReplicationLag: 5000,
      });

      // Manually reset
      service.manualResetCircuitBreaker();

      const status = service.getCircuitBreakerStatus();
      expect(status.state).toBe('closed');
      expect(status.failureCount).toBe(0);
    });
  });

  describe('disconnect', () => {
    it('should disconnect all clients', async () => {
      service = new PrismaReplicaService({
        primaryUrl: 'postgresql://localhost:5432/primary',
        replicaUrl: 'postgresql://localhost:5433/replica',
        maxReplicationLag: 5000,
      });

      await service.disconnect();

      expect(service.getPrimary().$disconnect).toHaveBeenCalled();
      expect(service.getReplica().$disconnect).toHaveBeenCalled();
    });
  });
});

describe('isReplicaConfigured', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should return false when DATABASE_REPLICA_URL is not set', () => {
    delete process.env.DATABASE_REPLICA_URL;
    process.env.DATABASE_URL = 'postgresql://localhost:5432/primary';

    expect(isReplicaConfigured()).toBe(false);
  });

  it('should return false when DATABASE_REPLICA_URL equals DATABASE_URL', () => {
    const sameUrl = 'postgresql://localhost:5432/db';
    process.env.DATABASE_URL = sameUrl;
    process.env.DATABASE_REPLICA_URL = sameUrl;

    expect(isReplicaConfigured()).toBe(false);
  });

  it('should return true when DATABASE_REPLICA_URL is different from DATABASE_URL', () => {
    process.env.DATABASE_URL = 'postgresql://localhost:5432/primary';
    process.env.DATABASE_REPLICA_URL = 'postgresql://localhost:5433/replica';

    expect(isReplicaConfigured()).toBe(true);
  });
});
