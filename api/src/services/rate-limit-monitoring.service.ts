/**
 * Rate Limit Monitoring Service
 *
 * Provides violation logging, tracking, and alerting for rate limit events.
 * Uses in-memory storage for tracking.
 */

import { logger } from '../utils/logger';
import { prometheusMetrics } from './prometheus.service';

// ============================================
// TYPES
// ============================================

export interface RateLimitViolation {
  ip: string;
  path: string;
  timestamp: number;
  userAgent?: string;
  userId?: string;
}

export interface ViolationStats {
  ip: string;
  path: string;
  count: number;
  firstViolation: number;
  lastViolation: number;
}

export interface EndpointViolationStats {
  path: string;
  count: number;
  uniqueIPs: number;
}

export interface RateLimitMetrics {
  totalViolations: number;
  violationsByEndpoint: EndpointViolationStats[];
  topViolatingIPs: { ip: string; count: number }[];
  lastHourViolations: number;
}

// ============================================
// CONSTANTS
// ============================================

const ALERT_THRESHOLD = 10; // violations
const ALERT_WINDOW_MS = 5 * 60 * 1000; // 5 minutes

// In-memory storage
const inMemoryViolations: Map<string, ViolationStats> = new Map();
const inMemoryAlertedIPs: Set<string> = new Set();

// ============================================
// VIOLATION LOGGING
// ============================================

/**
 * Log a rate limit violation
 * 
 * @param violation - The violation details
 */
export async function logViolation(violation: RateLimitViolation): Promise<void> {
  const { ip, path, timestamp, userAgent, userId } = violation;
  
  // Always log to structured logger
  logger.warn('Rate limit violation', {
    ip,
    path,
    timestamp: new Date(timestamp).toISOString(),
    userAgent,
    userId,
  });

  // Record Prometheus metric
  prometheusMetrics.recordRateLimitExceeded(ip, path);

  // Track in memory
  trackViolationInMemory(violation);
}

/**
 * Track violation in memory
 */
function trackViolationInMemory(violation: RateLimitViolation): void {
  const { ip, path, timestamp } = violation;
  const key = `${ip}:${path}`;
  
  const existing = inMemoryViolations.get(key);
  if (existing) {
    existing.count++;
    existing.lastViolation = timestamp;
  } else {
    inMemoryViolations.set(key, {
      ip,
      path,
      count: 1,
      firstViolation: timestamp,
      lastViolation: timestamp,
    });
  }
  
  // Check alert threshold
  checkAlertThresholdInMemory(ip);
}

// ============================================
// ALERT THRESHOLD DETECTION
// ============================================

/**
 * Check alert threshold in memory
 */
function checkAlertThresholdInMemory(ip: string): void {
  const now = Date.now();
  const windowStart = now - ALERT_WINDOW_MS;
  
  // Count violations for this IP in the window
  let count = 0;
  for (const [key, stats] of inMemoryViolations.entries()) {
    if (key.startsWith(`${ip}:`) && stats.lastViolation >= windowStart) {
      count += stats.count;
    }
  }
  
  if (count >= ALERT_THRESHOLD && !inMemoryAlertedIPs.has(ip)) {
    triggerAlert(ip, count);
    inMemoryAlertedIPs.add(ip);
    
    // Clear alert status after window
    setTimeout(() => {
      inMemoryAlertedIPs.delete(ip);
    }, ALERT_WINDOW_MS);
  }
}

/**
 * Trigger an alert for excessive rate limit violations
 */
function triggerAlert(ip: string, violationCount: number): void {
  logger.error('ALERT: Rate limit threshold exceeded', {
    alertType: 'RATE_LIMIT_THRESHOLD',
    ip,
    violationCount,
    threshold: ALERT_THRESHOLD,
    windowMinutes: ALERT_WINDOW_MS / 60000,
    timestamp: new Date().toISOString(),
  });
}

// ============================================
// METRICS AND STATS
// ============================================

/**
 * Get rate limit metrics for the last hour
 */
export async function getRateLimitMetrics(): Promise<RateLimitMetrics> {
  return getMetricsFromMemory();
}

/**
 * Get metrics from in-memory store
 */
function getMetricsFromMemory(): RateLimitMetrics {
  const now = Date.now();
  const hourAgo = now - 3600000;
  
  const ipCounts: Map<string, number> = new Map();
  const pathCounts: Map<string, { count: number; ips: Set<string> }> = new Map();
  
  for (const [, stats] of inMemoryViolations.entries()) {
    if (stats.lastViolation >= hourAgo) {
      // Count by IP
      const currentIpCount = ipCounts.get(stats.ip) || 0;
      ipCounts.set(stats.ip, currentIpCount + stats.count);
      
      // Count by path
      const pathData = pathCounts.get(stats.path) || { count: 0, ips: new Set() };
      pathData.count += stats.count;
      pathData.ips.add(stats.ip);
      pathCounts.set(stats.path, pathData);
    }
  }
  
  const violationsByEndpoint: EndpointViolationStats[] = Array.from(pathCounts.entries())
    .map(([path, data]) => ({
      path,
      count: data.count,
      uniqueIPs: data.ips.size,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 20);
  
  const topViolatingIPs = Array.from(ipCounts.entries())
    .map(([ip, count]) => ({ ip, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
  
  const totalViolations = Array.from(ipCounts.values()).reduce((a, b) => a + b, 0);
  
  return {
    totalViolations,
    violationsByEndpoint,
    topViolatingIPs,
    lastHourViolations: totalViolations,
  };
}

/**
 * Get violation count for a specific IP in the last hour
 */
export async function getViolationCountForIP(ip: string): Promise<number> {
  let count = 0;
  const hourAgo = Date.now() - 3600000;
  for (const [key, stats] of inMemoryViolations.entries()) {
    if (key.startsWith(`${ip}:`) && stats.lastViolation >= hourAgo) {
      count += stats.count;
    }
  }
  return count;
}

/**
 * Clear all violation data (for testing)
 */
export async function clearAllViolations(): Promise<void> {
  inMemoryViolations.clear();
  inMemoryAlertedIPs.clear();
}

// Export constants for testing
export const CONSTANTS = {
  ALERT_THRESHOLD,
  ALERT_WINDOW_MS,
};
