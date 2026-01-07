/**
 * Health Service Tests
 *
 * Tests for comprehensive health monitoring functionality.
 *
 * **Feature: high-traffic-resilience**
 * **Requirements: 4.1, 4.2, 4.3, 4.4, 4.6**
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  getHealthStatus,
  getLivenessStatus,
  getReadinessStatus,
  setShutdownState,
  isShutdownInProgress,
  resetHealthService,
} from './health.service';

// Mock dependencies
vi.mock('../config/redis', () => ({
  testRedisConnection: vi.fn(),
  isRedisConnected: vi.fn(),
}));

vi.mock('../config/cluster', () => ({
  getClusterConfig: vi.fn(() => ({
    instanceId: 'test-instance-123',
    hostname: 'test-host',
    healthCheckPath: '/health/ready',
    shutdownTimeout: 30000,
    drainTimeout: 25000,
    clusterMode: false,
    pid: 12345,
    startedAt: new Date(),
  })),
  getInstanceMetadata: vi.fn(() => ({
    instanceId: 'test-instance-123',
    hostname: 'test-host',
    pid: 12345,
    uptime: 100,
  })),
}));

vi.mock('../utils/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

// Import mocked modules
import { testRedisConnection, isRedisConnected } from '../config/redis';

// Create mock Prisma client
const mockPrisma = {
  $queryRaw: vi.fn(),
} as unknown as import('@prisma/client').PrismaClient;

describe('Health Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetHealthService();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('getLivenessStatus', () => {
    it('should return alive status', () => {
      const status = getLivenessStatus();

      expect(status.status).toBe('alive');
      expect(status.pid).toBe(process.pid);
      expect(status.timestamp).toBeDefined();
      expect(status.uptime).toBeGreaterThanOrEqual(0);
      expect(status.memory).toBeDefined();
      expect(status.memory.heapUsed).toBeGreaterThan(0);
      expect(status.memory.heapTotal).toBeGreaterThan(0);
      expect(status.memory.rss).toBeGreaterThan(0);
    });

    it('should return memory in MB', () => {
      const status = getLivenessStatus();

      // Memory values should be reasonable MB values (not bytes)
      expect(status.memory.heapUsed).toBeLessThan(10000); // Less than 10GB
      expect(status.memory.heapTotal).toBeLessThan(10000);
      expect(status.memory.rss).toBeLessThan(10000);
    });
  });

  describe('getReadinessStatus', () => {
    it('should return ready when database is connected', async () => {
      vi.mocked(mockPrisma.$queryRaw).mockResolvedValue([{ '?column?': 1 }]);
      vi.mocked(isRedisConnected).mockReturnValue(true);

      const { status, httpStatus } = await getReadinessStatus(mockPrisma);

      expect(status.status).toBe('ready');
      expect(httpStatus).toBe(200);
      expect(status.checks?.database).toBe(true);
      expect(status.checks?.shuttingDown).toBe(false);
    });

    it('should return not_ready when database is down', async () => {
      vi.mocked(mockPrisma.$queryRaw).mockRejectedValue(new Error('Connection refused'));
      vi.mocked(isRedisConnected).mockReturnValue(true);

      const { status, httpStatus } = await getReadinessStatus(mockPrisma);

      expect(status.status).toBe('not_ready');
      expect(httpStatus).toBe(503);
      expect(status.reason).toContain('Connection refused');
      expect(status.checks?.database).toBe(false);
    });

    it('should return not_ready when shutdown is in progress', async () => {
      vi.mocked(mockPrisma.$queryRaw).mockResolvedValue([{ '?column?': 1 }]);
      vi.mocked(isRedisConnected).mockReturnValue(true);

      setShutdownState(true);

      const { status, httpStatus } = await getReadinessStatus(mockPrisma);

      expect(status.status).toBe('not_ready');
      expect(httpStatus).toBe(503);
      expect(status.reason).toBe('Shutdown in progress');
      expect(status.checks?.shuttingDown).toBe(true);
    });

    it('should return ready even when Redis is down (degraded mode)', async () => {
      vi.mocked(mockPrisma.$queryRaw).mockResolvedValue([{ '?column?': 1 }]);
      vi.mocked(isRedisConnected).mockReturnValue(false);

      const { status, httpStatus } = await getReadinessStatus(mockPrisma);

      expect(status.status).toBe('ready');
      expect(httpStatus).toBe(200);
      expect(status.checks?.database).toBe(true);
      expect(status.checks?.redis).toBe(false);
    });
  });

  describe('getHealthStatus', () => {
    it('should return healthy when all services are up', async () => {
      vi.mocked(mockPrisma.$queryRaw).mockResolvedValue([{ '?column?': 1 }]);
      vi.mocked(isRedisConnected).mockReturnValue(true);
      vi.mocked(testRedisConnection).mockResolvedValue(true);

      const status = await getHealthStatus(mockPrisma);

      expect(status.status).toBe('healthy');
      expect(status.checks.database.status).toBe('up');
      expect(status.checks.redis.status).toBe('up');
      expect(status.instance.id).toBe('test-instance-123');
      expect(status.version).toBeDefined();
    });

    it('should return degraded when Redis is down', async () => {
      vi.mocked(mockPrisma.$queryRaw).mockResolvedValue([{ '?column?': 1 }]);
      vi.mocked(isRedisConnected).mockReturnValue(false);

      const status = await getHealthStatus(mockPrisma);

      expect(status.status).toBe('degraded');
      expect(status.checks.database.status).toBe('up');
      expect(status.checks.redis.status).toBe('degraded');
    });

    it('should return unhealthy when database is down', async () => {
      vi.mocked(mockPrisma.$queryRaw).mockRejectedValue(new Error('Connection refused'));
      vi.mocked(isRedisConnected).mockReturnValue(true);
      vi.mocked(testRedisConnection).mockResolvedValue(true);

      const status = await getHealthStatus(mockPrisma);

      expect(status.status).toBe('unhealthy');
      expect(status.checks.database.status).toBe('down');
      expect(status.checks.database.message).toContain('Connection refused');
    });

    it('should include latency for successful checks', async () => {
      vi.mocked(mockPrisma.$queryRaw).mockResolvedValue([{ '?column?': 1 }]);
      vi.mocked(isRedisConnected).mockReturnValue(true);
      vi.mocked(testRedisConnection).mockResolvedValue(true);

      const status = await getHealthStatus(mockPrisma);

      expect(status.checks.database.latencyMs).toBeDefined();
      expect(status.checks.database.latencyMs).toBeGreaterThanOrEqual(0);
      expect(status.checks.redis.latencyMs).toBeDefined();
    });

    it('should include instance metadata', async () => {
      vi.mocked(mockPrisma.$queryRaw).mockResolvedValue([{ '?column?': 1 }]);
      vi.mocked(isRedisConnected).mockReturnValue(true);
      vi.mocked(testRedisConnection).mockResolvedValue(true);

      const status = await getHealthStatus(mockPrisma);

      expect(status.instance).toBeDefined();
      expect(status.instance.id).toBe('test-instance-123');
      expect(status.instance.hostname).toBe('test-host');
      expect(status.instance.pid).toBe(12345);
    });
  });

  describe('Shutdown State Management', () => {
    it('should track shutdown state', () => {
      expect(isShutdownInProgress()).toBe(false);

      setShutdownState(true);
      expect(isShutdownInProgress()).toBe(true);

      setShutdownState(false);
      expect(isShutdownInProgress()).toBe(false);
    });

    it('should reset shutdown state on resetHealthService', () => {
      setShutdownState(true);
      expect(isShutdownInProgress()).toBe(true);

      resetHealthService();
      expect(isShutdownInProgress()).toBe(false);
    });
  });

  describe('Database Check Timeout', () => {
    it('should timeout slow database queries', async () => {
      vi.useFakeTimers();

      // Mock a slow query that never resolves
      vi.mocked(mockPrisma.$queryRaw).mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(() => resolve([{ '?column?': 1 }]), 100);
          })
      );
      vi.mocked(isRedisConnected).mockReturnValue(true);
      vi.mocked(testRedisConnection).mockResolvedValue(true);

      const statusPromise = getHealthStatus(mockPrisma);

      // Advance timers to trigger timeout
      await vi.advanceTimersByTimeAsync(60);

      const status = await statusPromise;

      expect(status.checks.database.status).toBe('down');
      expect(status.checks.database.message).toContain('timeout');
    });
  });

  describe('Redis Check Timeout', () => {
    it('should handle Redis connection test failure', async () => {
      vi.mocked(mockPrisma.$queryRaw).mockResolvedValue([{ '?column?': 1 }]);
      vi.mocked(isRedisConnected).mockReturnValue(true);
      vi.mocked(testRedisConnection).mockResolvedValue(false);

      const status = await getHealthStatus(mockPrisma);

      expect(status.checks.redis.status).toBe('degraded');
      expect(status.checks.redis.message).toContain('failed');
    });

    it('should handle Redis connection test error', async () => {
      vi.mocked(mockPrisma.$queryRaw).mockResolvedValue([{ '?column?': 1 }]);
      vi.mocked(isRedisConnected).mockReturnValue(true);
      vi.mocked(testRedisConnection).mockRejectedValue(new Error('Redis error'));

      const status = await getHealthStatus(mockPrisma);

      expect(status.checks.redis.status).toBe('degraded');
      expect(status.checks.redis.message).toContain('Redis error');
    });
  });
});
