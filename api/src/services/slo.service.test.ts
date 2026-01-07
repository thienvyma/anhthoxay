/**
 * SLO Service Tests
 *
 * **Feature: high-traffic-resilience**
 * **Requirements: 13.1, 13.2, 13.4, 13.5**
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SLOService, getSLOService, resetSLOService, SLOAlert } from './slo.service';

// Mock Redis cluster client
vi.mock('../config/redis-cluster', () => ({
  getRedisClusterClient: vi.fn(),
  getRedisClusterClientSync: vi.fn(() => null), // Return null to use in-memory fallback
}));

describe('SLOService', () => {
  let service: SLOService;

  beforeEach(() => {
    // Reset singleton and create fresh instance
    resetSLOService();
    service = new SLOService({
      availability: {
        target: 0.999, // 99.9%
        window: 24 * 60 * 60 * 1000, // 1 day for testing
      },
      latency: {
        p99Target: 500,
        p95Target: 200,
      },
    });
    // Reset the instance's internal state
    service.reset();
  });

  describe('recordRequest', () => {
    it('should record successful requests', async () => {
      await service.recordRequest(true, 100);
      await service.recordRequest(true, 150);
      await service.recordRequest(true, 200);

      const status = await service.getStatus();
      expect(status.totalRequests).toBe(3);
      expect(status.successfulRequests).toBe(3);
      expect(status.failedRequests).toBe(0);
    });

    it('should record failed requests', async () => {
      await service.recordRequest(true, 100);
      await service.recordRequest(false, 500);
      await service.recordRequest(true, 150);

      const status = await service.getStatus();
      expect(status.totalRequests).toBe(3);
      expect(status.successfulRequests).toBe(2);
      expect(status.failedRequests).toBe(1);
    });

    it('should track latency samples', async () => {
      await service.recordRequest(true, 100);
      await service.recordRequest(true, 200);
      await service.recordRequest(true, 300);
      await service.recordRequest(true, 400);
      await service.recordRequest(true, 500);

      const status = await service.getStatus();
      expect(status.p95Latency).toBeGreaterThan(0);
      expect(status.p99Latency).toBeGreaterThan(0);
    });
  });

  describe('getStatus', () => {
    it('should calculate availability correctly', async () => {
      // Record 1000 requests with 1 failure (99.9% availability)
      for (let i = 0; i < 999; i++) {
        await service.recordRequest(true, 100);
      }
      await service.recordRequest(false, 100);

      const status = await service.getStatus();
      expect(status.availability).toBe(0.999);
      expect(status.totalRequests).toBe(1000);
      expect(status.successfulRequests).toBe(999);
      expect(status.failedRequests).toBe(1);
    });

    it('should return 1.0 availability when no requests', async () => {
      const status = await service.getStatus();
      expect(status.availability).toBe(1);
      expect(status.totalRequests).toBe(0);
    });

    it('should calculate latency percentiles correctly', async () => {
      // Record requests with known latencies
      const latencies = [100, 150, 200, 250, 300, 350, 400, 450, 500, 550];
      for (const latency of latencies) {
        await service.recordRequest(true, latency);
      }

      const status = await service.getStatus();
      // P95 should be around 500ms (95th percentile of 10 values)
      expect(status.p95Latency).toBeGreaterThanOrEqual(450);
      // P99 should be around 550ms (99th percentile of 10 values)
      expect(status.p99Latency).toBeGreaterThanOrEqual(500);
    });

    it('should determine health status correctly', async () => {
      // All good - should be healthy
      // Need enough requests to have a non-zero error budget
      for (let i = 0; i < 1000; i++) {
        await service.recordRequest(true, 100);
      }

      let status = await service.getStatus();
      expect(status.isHealthy).toBe(true);

      // Add failures to breach availability
      service.reset();
      for (let i = 0; i < 90; i++) {
        await service.recordRequest(true, 100);
      }
      for (let i = 0; i < 10; i++) {
        await service.recordRequest(false, 100);
      }

      status = await service.getStatus();
      expect(status.isHealthy).toBe(false); // 90% < 99.9%
    });

    it('should include window timestamps', async () => {
      await service.recordRequest(true, 100);

      const status = await service.getStatus();
      expect(status.windowStart).toBeDefined();
      expect(status.windowEnd).toBeDefined();
      expect(new Date(status.windowStart).getTime()).toBeLessThan(
        new Date(status.windowEnd).getTime()
      );
    });
  });

  describe('getErrorBudget', () => {
    it('should calculate error budget correctly', async () => {
      // With 99.9% target and 1000 requests, budget is 1 failure
      for (let i = 0; i < 1000; i++) {
        await service.recordRequest(true, 100);
      }

      const budget = await service.getErrorBudget();
      expect(budget.total).toBe(1); // 0.1% of 1000 = 1
      expect(budget.used).toBe(0);
      expect(budget.remaining).toBe(1);
      expect(budget.isExhausted).toBe(false);
    });

    it('should detect exhausted budget', async () => {
      // With 99.9% target and 1000 requests, budget is 1 failure
      for (let i = 0; i < 998; i++) {
        await service.recordRequest(true, 100);
      }
      // Add 2 failures to exhaust budget
      await service.recordRequest(false, 100);
      await service.recordRequest(false, 100);

      const budget = await service.getErrorBudget();
      expect(budget.total).toBe(1); // 0.1% of 1000 = 1
      expect(budget.used).toBe(2);
      expect(budget.remaining).toBe(0);
      expect(budget.isExhausted).toBe(true);
    });

    it('should calculate percentage remaining', async () => {
      // With 99.9% target and 10000 requests, budget is 10 failures
      for (let i = 0; i < 10000; i++) {
        await service.recordRequest(true, 100);
      }

      let budget = await service.getErrorBudget();
      expect(budget.total).toBe(10);
      expect(budget.percentageRemaining).toBe(100);

      // Add 5 failures (50% of budget)
      for (let i = 0; i < 5; i++) {
        await service.recordRequest(false, 100);
      }

      budget = await service.getErrorBudget();
      expect(budget.used).toBe(5);
      expect(budget.percentageRemaining).toBe(50);
    });
  });

  describe('alerting', () => {
    it('should register and trigger alert callbacks', async () => {
      const alerts: SLOAlert[] = [];
      const callback = (alert: SLOAlert) => alerts.push(alert);

      service.onAlert(callback);

      // Trigger availability breach by adding many failures
      for (let i = 0; i < 50; i++) {
        await service.recordRequest(true, 100);
      }
      for (let i = 0; i < 50; i++) {
        await service.recordRequest(false, 100);
      }

      // Force alert check (normally throttled)
      await service.forceCheckAndAlert();

      expect(alerts.length).toBeGreaterThan(0);
      expect(alerts.some((a) => a.type === 'availability_breach')).toBe(true);
    });

    it('should remove alert callbacks', async () => {
      const alerts: SLOAlert[] = [];
      const callback = (alert: SLOAlert) => alerts.push(alert);

      service.onAlert(callback);
      service.offAlert(callback);

      // Trigger breach
      for (let i = 0; i < 50; i++) {
        await service.recordRequest(false, 100);
      }

      await service.forceCheckAndAlert();

      expect(alerts.length).toBe(0);
    });

    it('should include severity in alerts', async () => {
      const alerts: SLOAlert[] = [];
      service.onAlert((alert) => alerts.push(alert));

      // Trigger availability breach (critical)
      for (let i = 0; i < 50; i++) {
        await service.recordRequest(false, 100);
      }

      await service.forceCheckAndAlert();

      const availabilityAlert = alerts.find((a) => a.type === 'availability_breach');
      expect(availabilityAlert).toBeDefined();
      expect(availabilityAlert?.severity).toBe('critical');
    });

    it('should include alertId in alerts', async () => {
      const alerts: SLOAlert[] = [];
      service.onAlert((alert) => alerts.push(alert));

      // Trigger breach
      for (let i = 0; i < 50; i++) {
        await service.recordRequest(false, 100);
      }

      await service.forceCheckAndAlert();

      expect(alerts.length).toBeGreaterThan(0);
      expect(alerts[0].alertId).toBeDefined();
      expect(alerts[0].alertId).toContain('availability_breach');
    });

    it('should store alert history', async () => {
      // Trigger breach
      for (let i = 0; i < 50; i++) {
        await service.recordRequest(false, 100);
      }

      await service.forceCheckAndAlert();

      const history = service.getAlertHistory();
      expect(history.length).toBeGreaterThan(0);
    });

    it('should filter alerts by type', async () => {
      // Trigger availability breach
      for (let i = 0; i < 50; i++) {
        await service.recordRequest(false, 100);
      }

      await service.forceCheckAndAlert();

      const availabilityAlerts = service.getAlertsByType('availability_breach');
      expect(availabilityAlerts.length).toBeGreaterThan(0);
      expect(availabilityAlerts.every((a) => a.type === 'availability_breach')).toBe(true);
    });

    it('should filter alerts by severity', async () => {
      // Trigger critical alert (availability breach)
      for (let i = 0; i < 50; i++) {
        await service.recordRequest(false, 100);
      }

      await service.forceCheckAndAlert();

      const criticalAlerts = service.getAlertsBySeverity('critical');
      expect(criticalAlerts.length).toBeGreaterThan(0);
      expect(criticalAlerts.every((a) => a.severity === 'critical')).toBe(true);
    });

    it('should trigger error budget warning when budget is low', async () => {
      const alerts: SLOAlert[] = [];
      service.onAlert((alert) => alerts.push(alert));

      // Create service with lower warning threshold for testing
      service.updateAlertConfig({ errorBudgetWarningThreshold: 50 });

      // With 99.9% target and 10000 requests, budget is 10 failures
      // Add 9995 successful requests
      for (let i = 0; i < 9995; i++) {
        await service.recordRequest(true, 100);
      }
      // Add 5 failures (50% of budget used)
      for (let i = 0; i < 5; i++) {
        await service.recordRequest(false, 100);
      }

      await service.forceCheckAndAlert();

      const warningAlert = alerts.find((a) => a.type === 'error_budget_warning');
      expect(warningAlert).toBeDefined();
      expect(warningAlert?.severity).toBe('warning');
    });

    it('should call external alert handler when configured', async () => {
      const externalAlerts: SLOAlert[] = [];
      const externalHandler = vi.fn(async (alert: SLOAlert) => {
        externalAlerts.push(alert);
      });

      service.updateAlertConfig({ externalAlertHandler: externalHandler });

      // Trigger breach
      for (let i = 0; i < 50; i++) {
        await service.recordRequest(false, 100);
      }

      await service.forceCheckAndAlert();

      expect(externalHandler).toHaveBeenCalled();
      expect(externalAlerts.length).toBeGreaterThan(0);
    });

    it('should respect alert cooldown', async () => {
      const alerts: SLOAlert[] = [];
      service.onAlert((alert) => alerts.push(alert));

      // Trigger breach
      for (let i = 0; i < 50; i++) {
        await service.recordRequest(false, 100);
      }

      // First check
      await service.forceCheckAndAlert();
      const firstCount = alerts.length;

      // Second check immediately (should be blocked by cooldown)
      await service.forceCheckAndAlert();
      const secondCount = alerts.length;

      // Should not have added more alerts due to cooldown
      expect(secondCount).toBe(firstCount);
    });

    it('should not alert when alerting is disabled', async () => {
      const alerts: SLOAlert[] = [];
      service.onAlert((alert) => alerts.push(alert));
      service.updateAlertConfig({ enabled: false });

      // Trigger breach
      for (let i = 0; i < 50; i++) {
        await service.recordRequest(false, 100);
      }

      await service.forceCheckAndAlert();

      expect(alerts.length).toBe(0);
    });

    it('should clear alert history', async () => {
      // Trigger breach
      for (let i = 0; i < 50; i++) {
        await service.recordRequest(false, 100);
      }

      await service.forceCheckAndAlert();
      expect(service.getAlertHistory().length).toBeGreaterThan(0);

      service.clearAlertHistory();
      expect(service.getAlertHistory().length).toBe(0);
    });
  });

  describe('configuration', () => {
    it('should return current configuration', () => {
      const config = service.getConfig();
      expect(config.availability.target).toBe(0.999);
      expect(config.latency.p99Target).toBe(500);
    });

    it('should update configuration', () => {
      service.updateConfig({
        availability: { target: 0.9999, window: 24 * 60 * 60 * 1000 },
        latency: { p99Target: 300, p95Target: 150 },
      });

      const config = service.getConfig();
      expect(config.availability.target).toBe(0.9999);
      expect(config.latency.p99Target).toBe(300);
    });

    it('should return alert configuration', () => {
      const alertConfig = service.getAlertConfig();
      expect(alertConfig.enabled).toBe(true);
      expect(alertConfig.cooldownMs).toBeGreaterThan(0);
      expect(alertConfig.errorBudgetWarningThreshold).toBeGreaterThan(0);
    });

    it('should update alert configuration', () => {
      service.updateAlertConfig({
        enabled: false,
        cooldownMs: 10000,
        errorBudgetWarningThreshold: 30,
      });

      const alertConfig = service.getAlertConfig();
      expect(alertConfig.enabled).toBe(false);
      expect(alertConfig.cooldownMs).toBe(10000);
      expect(alertConfig.errorBudgetWarningThreshold).toBe(30);
    });
  });

  describe('singleton', () => {
    it('should return same instance', () => {
      const instance1 = getSLOService();
      const instance2 = getSLOService();
      expect(instance1).toBe(instance2);
    });

    it('should reset singleton', () => {
      const instance1 = getSLOService();
      resetSLOService();
      const instance2 = getSLOService();
      expect(instance1).not.toBe(instance2);
    });
  });

  describe('availability calculation precision', () => {
    /**
     * **Feature: high-traffic-resilience, Property 10: Availability Calculation**
     * **Validates: Requirements 13.1, 13.5**
     *
     * For any time window, the calculated availability SHALL equal
     * (successful_requests / total_requests) with precision of at least 4 decimal places.
     */
    it('should calculate availability with at least 4 decimal precision', async () => {
      // Test with various ratios
      const testCases = [
        { successful: 9999, failed: 1, expected: 0.9999 },
        { successful: 999, failed: 1, expected: 0.999 },
        { successful: 99, failed: 1, expected: 0.99 },
        { successful: 9, failed: 1, expected: 0.9 },
      ];

      for (const testCase of testCases) {
        service.reset();

        for (let i = 0; i < testCase.successful; i++) {
          await service.recordRequest(true, 100);
        }
        for (let i = 0; i < testCase.failed; i++) {
          await service.recordRequest(false, 100);
        }

        const status = await service.getStatus();
        const expectedAvailability =
          testCase.successful / (testCase.successful + testCase.failed);

        // Check precision to 4 decimal places
        expect(Math.abs(status.availability - expectedAvailability)).toBeLessThan(0.00005);
      }
    });
  });
});
