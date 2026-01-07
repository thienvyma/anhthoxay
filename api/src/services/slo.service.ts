/**
 * SLO Monitoring Service
 *
 * Tracks Service Level Objectives (SLOs) including availability,
 * latency percentiles, and error budget calculations.
 *
 * **Feature: high-traffic-resilience**
 * **Requirements: 13.1, 13.2, 13.4, 13.5**
 */

import { getRedisClusterClient, getRedisClusterClientSync } from '../config/redis-cluster';
import { logger } from '../utils/logger';

// ============================================
// TYPES AND INTERFACES
// ============================================

export interface SLOConfig {
  availability: {
    /** Target availability (e.g., 0.999 for 99.9%) */
    target: number;
    /** Window in milliseconds (default: 30 days) */
    window: number;
  };
  latency: {
    /** P99 latency target in milliseconds */
    p99Target: number;
    /** P95 latency target in milliseconds */
    p95Target: number;
  };
}

export interface SLOStatus {
  /** Current availability (0-1) */
  availability: number;
  /** P99 latency in milliseconds */
  p99Latency: number;
  /** P95 latency in milliseconds */
  p95Latency: number;
  /** Error budget remaining (0-1) */
  errorBudgetRemaining: number;
  /** Whether all SLOs are being met */
  isHealthy: boolean;
  /** Total requests in window */
  totalRequests: number;
  /** Successful requests in window */
  successfulRequests: number;
  /** Failed requests in window */
  failedRequests: number;
  /** Window start timestamp */
  windowStart: string;
  /** Window end timestamp */
  windowEnd: string;
}

export interface ErrorBudget {
  /** Total error budget (allowed failures) */
  total: number;
  /** Used error budget */
  used: number;
  /** Remaining error budget */
  remaining: number;
  /** Percentage remaining (0-100) */
  percentageRemaining: number;
  /** Whether budget is exhausted */
  isExhausted: boolean;
}

export interface DailyMetrics {
  /** Date in YYYY-MM-DD format */
  date: string;
  /** Total requests */
  total: number;
  /** Successful requests */
  successful: number;
  /** Failed requests */
  failed: number;
  /** Sum of all latencies (for average calculation) */
  latencySum: number;
  /** Latency samples for percentile calculation */
  latencySamples: number[];
}

export interface AlertCallback {
  (alert: SLOAlert): void;
}

export interface SLOAlert {
  type: 'availability_breach' | 'latency_breach' | 'error_budget_exhausted' | 'error_budget_warning';
  message: string;
  currentValue: number;
  threshold: number;
  timestamp: string;
  severity: 'warning' | 'critical';
  /** Unique alert ID for tracking */
  alertId: string;
}

export interface AlertConfig {
  /** Enable/disable alerting */
  enabled: boolean;
  /** Cooldown between same alert types in milliseconds */
  cooldownMs: number;
  /** Error budget warning threshold (percentage remaining) */
  errorBudgetWarningThreshold: number;
  /** Callback for sending alerts to external systems */
  externalAlertHandler?: (alert: SLOAlert) => Promise<void>;
}

// ============================================
// CONSTANTS
// ============================================

const REDIS_KEY_PREFIX = 'slo:';
const DAILY_METRICS_KEY = (date: string) => `${REDIS_KEY_PREFIX}daily:${date}`;
const LATENCY_SAMPLES_KEY = (date: string) => `${REDIS_KEY_PREFIX}latency:${date}`;
const METRICS_TTL_DAYS = 35; // Keep 35 days of data for 30-day window
const METRICS_TTL_SECONDS = METRICS_TTL_DAYS * 24 * 60 * 60;
const MAX_LATENCY_SAMPLES = 10000; // Max samples per day for percentile calculation

// Default configuration
const DEFAULT_CONFIG: SLOConfig = {
  availability: {
    target: 0.999, // 99.9%
    window: 30 * 24 * 60 * 60 * 1000, // 30 days in ms
  },
  latency: {
    p99Target: 500, // 500ms
    p95Target: 200, // 200ms
  },
};

// Default alert configuration
const DEFAULT_ALERT_CONFIG: AlertConfig = {
  enabled: true,
  cooldownMs: 5 * 60 * 1000, // 5 minutes between same alerts
  errorBudgetWarningThreshold: 20, // Warn when 20% budget remaining
};

// ============================================
// IN-MEMORY FALLBACK
// ============================================

interface InMemoryMetrics {
  daily: Map<string, DailyMetrics>;
  latencySamples: Map<string, number[]>;
}

const inMemoryMetrics: InMemoryMetrics = {
  daily: new Map(),
  latencySamples: new Map(),
};

// ============================================
// SLO SERVICE CLASS
// ============================================

export class SLOService {
  private config: SLOConfig;
  private alertConfig: AlertConfig;
  private alertCallbacks: AlertCallback[] = [];
  private lastAlertTime: Map<string, number> = new Map();
  private alertHistory: SLOAlert[] = [];
  private maxAlertHistory = 100;

  constructor(config: Partial<SLOConfig> = {}, alertConfig: Partial<AlertConfig> = {}) {
    this.config = {
      availability: { ...DEFAULT_CONFIG.availability, ...config.availability },
      latency: { ...DEFAULT_CONFIG.latency, ...config.latency },
    };
    this.alertConfig = { ...DEFAULT_ALERT_CONFIG, ...alertConfig };
  }

  // ============================================
  // RECORDING METHODS
  // ============================================

  /**
   * Record a request outcome
   *
   * @param success - Whether the request was successful
   * @param latencyMs - Request latency in milliseconds
   */
  async recordRequest(success: boolean, latencyMs: number): Promise<void> {
    const date = this.getCurrentDate();

    try {
      const redis = getRedisClusterClientSync();

      if (redis && redis.isConnected()) {
        await this.recordToRedis(redis, date, success, latencyMs);
      } else {
        this.recordToMemory(date, success, latencyMs);
      }

      // Check for SLO breaches and trigger alerts
      await this.checkAndAlert();
    } catch (error) {
      // Don't block request flow on SLO recording failure
      logger.warn('Failed to record SLO metrics', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      // Fallback to memory
      this.recordToMemory(date, success, latencyMs);
    }
  }

  private async recordToRedis(
    redis: Awaited<ReturnType<typeof getRedisClusterClient>>,
    date: string,
    success: boolean,
    latencyMs: number
  ): Promise<void> {
    const metricsKey = DAILY_METRICS_KEY(date);
    const latencyKey = LATENCY_SAMPLES_KEY(date);

    // Get current metrics
    const currentData = await redis.get(metricsKey);
    let metrics: DailyMetrics;

    if (currentData) {
      metrics = JSON.parse(currentData);
    } else {
      metrics = {
        date,
        total: 0,
        successful: 0,
        failed: 0,
        latencySum: 0,
        latencySamples: [],
      };
    }

    // Update metrics
    metrics.total++;
    if (success) {
      metrics.successful++;
    } else {
      metrics.failed++;
    }
    metrics.latencySum += latencyMs;

    // Store updated metrics
    await redis.set(metricsKey, JSON.stringify(metrics), METRICS_TTL_SECONDS);

    // Store latency sample (reservoir sampling for large volumes)
    const latencySamplesData = await redis.get(latencyKey);
    const samples: number[] = latencySamplesData ? JSON.parse(latencySamplesData) : [];

    if (samples.length < MAX_LATENCY_SAMPLES) {
      samples.push(latencyMs);
    } else {
      // Reservoir sampling: replace random element
      const idx = Math.floor(Math.random() * metrics.total);
      if (idx < MAX_LATENCY_SAMPLES) {
        samples[idx] = latencyMs;
      }
    }

    await redis.set(latencyKey, JSON.stringify(samples), METRICS_TTL_SECONDS);
  }

  private recordToMemory(date: string, success: boolean, latencyMs: number): void {
    let metrics = inMemoryMetrics.daily.get(date);

    if (!metrics) {
      metrics = {
        date,
        total: 0,
        successful: 0,
        failed: 0,
        latencySum: 0,
        latencySamples: [],
      };
      inMemoryMetrics.daily.set(date, metrics);
    }

    metrics.total++;
    if (success) {
      metrics.successful++;
    } else {
      metrics.failed++;
    }
    metrics.latencySum += latencyMs;

    // Store latency samples
    let samples = inMemoryMetrics.latencySamples.get(date);
    if (!samples) {
      samples = [];
      inMemoryMetrics.latencySamples.set(date, samples);
    }

    if (samples.length < MAX_LATENCY_SAMPLES) {
      samples.push(latencyMs);
    } else {
      // Reservoir sampling: replace random element
      const idx = Math.floor(Math.random() * metrics.total);
      if (idx < MAX_LATENCY_SAMPLES) {
        samples[idx] = latencyMs;
      }
    }

    // Clean up old data (keep only last 35 days)
    this.cleanupOldMemoryData();
  }

  private cleanupOldMemoryData(): void {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - METRICS_TTL_DAYS);
    const cutoffStr = cutoffDate.toISOString().split('T')[0];

    for (const [date] of inMemoryMetrics.daily) {
      if (date < cutoffStr) {
        inMemoryMetrics.daily.delete(date);
        inMemoryMetrics.latencySamples.delete(date);
      }
    }
  }

  // ============================================
  // STATUS METHODS
  // ============================================

  /**
   * Get current SLO status
   *
   * @returns Current SLO status including availability and latency metrics
   */
  async getStatus(): Promise<SLOStatus> {
    const windowDays = Math.ceil(this.config.availability.window / (24 * 60 * 60 * 1000));
    const dates = this.getDateRange(windowDays);

    const allMetrics = await this.getMetricsForDates(dates);
    const allLatencySamples = await this.getLatencySamplesForDates(dates);

    // Aggregate metrics
    let totalRequests = 0;
    let successfulRequests = 0;
    let failedRequests = 0;

    for (const metrics of allMetrics) {
      totalRequests += metrics.total;
      successfulRequests += metrics.successful;
      failedRequests += metrics.failed;
    }

    // Calculate availability
    const availability = totalRequests > 0 ? successfulRequests / totalRequests : 1;

    // Calculate latency percentiles
    const allSamples = allLatencySamples.flat().sort((a, b) => a - b);
    const p99Latency = this.calculatePercentile(allSamples, 99);
    const p95Latency = this.calculatePercentile(allSamples, 95);

    // Calculate error budget
    const errorBudget = this.calculateErrorBudget(totalRequests, failedRequests);

    // Determine health status
    const isHealthy =
      availability >= this.config.availability.target &&
      p99Latency <= this.config.latency.p99Target &&
      p95Latency <= this.config.latency.p95Target &&
      !errorBudget.isExhausted;

    const windowEnd = new Date();
    const windowStart = new Date(windowEnd.getTime() - this.config.availability.window);

    return {
      availability: this.roundToDecimals(availability, 6),
      p99Latency: Math.round(p99Latency),
      p95Latency: Math.round(p95Latency),
      errorBudgetRemaining: this.roundToDecimals(errorBudget.remaining / Math.max(errorBudget.total, 1), 4),
      isHealthy,
      totalRequests,
      successfulRequests,
      failedRequests,
      windowStart: windowStart.toISOString(),
      windowEnd: windowEnd.toISOString(),
    };
  }

  /**
   * Get error budget information
   *
   * @returns Error budget details
   */
  async getErrorBudget(): Promise<ErrorBudget> {
    const status = await this.getStatus();
    return this.calculateErrorBudget(status.totalRequests, status.failedRequests);
  }

  private calculateErrorBudget(totalRequests: number, failedRequests: number): ErrorBudget {
    // Error budget = (1 - target) * total requests
    const allowedFailureRate = 1 - this.config.availability.target;
    const totalBudget = Math.floor(totalRequests * allowedFailureRate);
    const usedBudget = failedRequests;
    const remainingBudget = Math.max(0, totalBudget - usedBudget);

    // Budget is only exhausted if there are actual failures exceeding the budget
    // When totalBudget is 0 and usedBudget is 0, budget is NOT exhausted
    const isExhausted = usedBudget > totalBudget && usedBudget > 0;

    return {
      total: totalBudget,
      used: usedBudget,
      remaining: remainingBudget,
      percentageRemaining: totalBudget > 0 ? this.roundToDecimals((remainingBudget / totalBudget) * 100, 2) : 100,
      isExhausted,
    };
  }

  // ============================================
  // ALERTING METHODS
  // ============================================

  /**
   * Register an alert callback
   *
   * @param callback - Function to call when an alert is triggered
   */
  onAlert(callback: AlertCallback): void {
    this.alertCallbacks.push(callback);
  }

  /**
   * Remove an alert callback
   *
   * @param callback - Function to remove
   */
  offAlert(callback: AlertCallback): void {
    const index = this.alertCallbacks.indexOf(callback);
    if (index > -1) {
      this.alertCallbacks.splice(index, 1);
    }
  }

  private async checkAndAlert(): Promise<void> {
    // Skip if alerting is disabled
    if (!this.alertConfig.enabled) {
      return;
    }

    // Only check periodically to avoid performance impact
    const now = Date.now();
    const lastCheck = this.lastAlertTime.get('_check') || 0;

    // Check every 60 seconds
    if (now - lastCheck < 60000) {
      return;
    }
    this.lastAlertTime.set('_check', now);

    try {
      const status = await this.getStatus();
      const errorBudget = await this.getErrorBudget();

      // Check availability breach (CRITICAL)
      if (status.availability < this.config.availability.target) {
        await this.triggerAlert({
          type: 'availability_breach',
          message: `Availability dropped below target: ${(status.availability * 100).toFixed(2)}% < ${(this.config.availability.target * 100).toFixed(2)}%`,
          currentValue: status.availability,
          threshold: this.config.availability.target,
          timestamp: new Date().toISOString(),
          severity: 'critical',
          alertId: this.generateAlertId('availability_breach'),
        });
      }

      // Check P99 latency breach (WARNING)
      if (status.p99Latency > this.config.latency.p99Target) {
        await this.triggerAlert({
          type: 'latency_breach',
          message: `P99 latency exceeded target: ${status.p99Latency}ms > ${this.config.latency.p99Target}ms`,
          currentValue: status.p99Latency,
          threshold: this.config.latency.p99Target,
          timestamp: new Date().toISOString(),
          severity: 'warning',
          alertId: this.generateAlertId('latency_breach'),
        });
      }

      // Check error budget warning (WARNING)
      if (
        errorBudget.percentageRemaining <= this.alertConfig.errorBudgetWarningThreshold &&
        errorBudget.percentageRemaining > 0 &&
        !errorBudget.isExhausted
      ) {
        await this.triggerAlert({
          type: 'error_budget_warning',
          message: `Error budget running low: ${errorBudget.percentageRemaining.toFixed(1)}% remaining (${errorBudget.remaining} of ${errorBudget.total} failures allowed)`,
          currentValue: errorBudget.percentageRemaining,
          threshold: this.alertConfig.errorBudgetWarningThreshold,
          timestamp: new Date().toISOString(),
          severity: 'warning',
          alertId: this.generateAlertId('error_budget_warning'),
        });
      }

      // Check error budget exhaustion (CRITICAL)
      if (errorBudget.isExhausted) {
        await this.triggerAlert({
          type: 'error_budget_exhausted',
          message: `Error budget exhausted: ${errorBudget.used} failures exceeded budget of ${errorBudget.total}`,
          currentValue: errorBudget.used,
          threshold: errorBudget.total,
          timestamp: new Date().toISOString(),
          severity: 'critical',
          alertId: this.generateAlertId('error_budget_exhausted'),
        });
      }
    } catch (error) {
      logger.warn('Failed to check SLO alerts', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  private generateAlertId(type: string): string {
    const date = new Date().toISOString().split('T')[0];
    return `${type}-${date}-${Date.now()}`;
  }

  private async triggerAlert(alert: SLOAlert): Promise<void> {
    // Check cooldown
    const lastAlert = this.lastAlertTime.get(alert.type) || 0;
    if (Date.now() - lastAlert < this.alertConfig.cooldownMs) {
      return;
    }

    this.lastAlertTime.set(alert.type, Date.now());

    // Store in history
    this.alertHistory.unshift(alert);
    if (this.alertHistory.length > this.maxAlertHistory) {
      this.alertHistory.pop();
    }

    // Log the alert with appropriate level
    const logMethod = alert.severity === 'critical' ? 'error' : 'warn';
    logger[logMethod]('SLO Alert triggered', {
      alertId: alert.alertId,
      alertType: alert.type,
      severity: alert.severity,
      message: alert.message,
      currentValue: alert.currentValue,
      threshold: alert.threshold,
    });

    // Call external alert handler if configured
    if (this.alertConfig.externalAlertHandler) {
      try {
        await this.alertConfig.externalAlertHandler(alert);
      } catch (error) {
        logger.error('External alert handler failed', {
          alertId: alert.alertId,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    // Notify registered callbacks
    for (const callback of this.alertCallbacks) {
      try {
        callback(alert);
      } catch (error) {
        logger.error('Alert callback failed', {
          alertId: alert.alertId,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
  }

  /**
   * Get alert history
   *
   * @param limit - Maximum number of alerts to return
   * @returns Recent alerts
   */
  getAlertHistory(limit = 50): SLOAlert[] {
    return this.alertHistory.slice(0, limit);
  }

  /**
   * Get alerts by type
   *
   * @param type - Alert type to filter by
   * @returns Alerts of the specified type
   */
  getAlertsByType(type: SLOAlert['type']): SLOAlert[] {
    return this.alertHistory.filter((a) => a.type === type);
  }

  /**
   * Get alerts by severity
   *
   * @param severity - Severity level to filter by
   * @returns Alerts of the specified severity
   */
  getAlertsBySeverity(severity: SLOAlert['severity']): SLOAlert[] {
    return this.alertHistory.filter((a) => a.severity === severity);
  }

  /**
   * Clear alert history (for testing)
   */
  clearAlertHistory(): void {
    this.alertHistory = [];
  }

  /**
   * Force check and alert (bypasses cooldown check interval)
   * Useful for testing and manual checks
   */
  async forceCheckAndAlert(): Promise<void> {
    this.lastAlertTime.delete('_check');
    await this.checkAndAlert();
  }

  /**
   * Update alert configuration
   */
  updateAlertConfig(config: Partial<AlertConfig>): void {
    this.alertConfig = { ...this.alertConfig, ...config };
  }

  /**
   * Get alert configuration
   */
  getAlertConfig(): AlertConfig {
    return { ...this.alertConfig };
  }

  // ============================================
  // HELPER METHODS
  // ============================================

  private getCurrentDate(): string {
    return new Date().toISOString().split('T')[0];
  }

  private getDateRange(days: number): string[] {
    const dates: string[] = [];
    const today = new Date();

    for (let i = 0; i < days; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      dates.push(date.toISOString().split('T')[0]);
    }

    return dates;
  }

  private async getMetricsForDates(dates: string[]): Promise<DailyMetrics[]> {
    const metrics: DailyMetrics[] = [];

    try {
      const redis = getRedisClusterClientSync();

      if (redis && redis.isConnected()) {
        const keys = dates.map(DAILY_METRICS_KEY);
        const values = await redis.mget(keys);

        for (let i = 0; i < dates.length; i++) {
          if (values[i]) {
            metrics.push(JSON.parse(values[i]));
          } else {
            // Check in-memory fallback
            const memMetrics = inMemoryMetrics.daily.get(dates[i]);
            if (memMetrics) {
              metrics.push(memMetrics);
            }
          }
        }
      } else {
        // Use in-memory data
        for (const date of dates) {
          const memMetrics = inMemoryMetrics.daily.get(date);
          if (memMetrics) {
            metrics.push(memMetrics);
          }
        }
      }
    } catch (error) {
      logger.warn('Failed to get metrics from Redis, using in-memory', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      // Fallback to in-memory
      for (const date of dates) {
        const memMetrics = inMemoryMetrics.daily.get(date);
        if (memMetrics) {
          metrics.push(memMetrics);
        }
      }
    }

    return metrics;
  }

  private async getLatencySamplesForDates(dates: string[]): Promise<number[][]> {
    const samples: number[][] = [];

    try {
      const redis = getRedisClusterClientSync();

      if (redis && redis.isConnected()) {
        const keys = dates.map(LATENCY_SAMPLES_KEY);
        const values = await redis.mget(keys);

        for (let i = 0; i < dates.length; i++) {
          if (values[i]) {
            samples.push(JSON.parse(values[i]));
          } else {
            // Check in-memory fallback
            const memSamples = inMemoryMetrics.latencySamples.get(dates[i]);
            if (memSamples) {
              samples.push(memSamples);
            }
          }
        }
      } else {
        // Use in-memory data
        for (const date of dates) {
          const memSamples = inMemoryMetrics.latencySamples.get(date);
          if (memSamples) {
            samples.push(memSamples);
          }
        }
      }
    } catch (error) {
      logger.warn('Failed to get latency samples from Redis, using in-memory', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      // Fallback to in-memory
      for (const date of dates) {
        const memSamples = inMemoryMetrics.latencySamples.get(date);
        if (memSamples) {
          samples.push(memSamples);
        }
      }
    }

    return samples;
  }

  private calculatePercentile(sortedSamples: number[], percentile: number): number {
    if (sortedSamples.length === 0) {
      return 0;
    }

    const index = Math.ceil((percentile / 100) * sortedSamples.length) - 1;
    return sortedSamples[Math.max(0, index)];
  }

  private roundToDecimals(value: number, decimals: number): number {
    const factor = Math.pow(10, decimals);
    return Math.round(value * factor) / factor;
  }

  /**
   * Get configuration
   */
  getConfig(): SLOConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<SLOConfig>): void {
    if (config.availability) {
      this.config.availability = { ...this.config.availability, ...config.availability };
    }
    if (config.latency) {
      this.config.latency = { ...this.config.latency, ...config.latency };
    }
  }

  /**
   * Reset metrics (for testing)
   */
  reset(): void {
    inMemoryMetrics.daily.clear();
    inMemoryMetrics.latencySamples.clear();
    this.lastAlertTime.clear();
    this.alertCallbacks = [];
    this.alertHistory = [];
  }
}

/**
 * Clear all in-memory metrics (for testing)
 */
export function clearInMemoryMetrics(): void {
  inMemoryMetrics.daily.clear();
  inMemoryMetrics.latencySamples.clear();
}

// ============================================
// SINGLETON INSTANCE
// ============================================

let sloServiceInstance: SLOService | null = null;

/**
 * Get or create the SLO service singleton
 *
 * @param config - Optional configuration override
 * @param alertConfig - Optional alert configuration override
 * @returns SLOService instance
 */
export function getSLOService(
  config?: Partial<SLOConfig>,
  alertConfig?: Partial<AlertConfig>
): SLOService {
  if (!sloServiceInstance) {
    sloServiceInstance = new SLOService(config, alertConfig);
  } else if (config) {
    sloServiceInstance.updateConfig(config);
  }
  return sloServiceInstance;
}

/**
 * Reset the SLO service singleton (for testing)
 */
export function resetSLOService(): void {
  if (sloServiceInstance) {
    sloServiceInstance.reset();
  }
  sloServiceInstance = null;
}

export default SLOService;
