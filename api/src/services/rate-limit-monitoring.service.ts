/**
 * Rate Limit Monitoring Service
 *
 * Provides violation logging, tracking, and alerting for rate limit events.
 * Uses Redis for distributed tracking across multiple instances.
 *
 * **Feature: production-scalability**
 * **Requirements: 7.1, 7.2, 7.3, 7.4, 12.7**
 */

import { getRedisClient, isRedisConnected } from '../config/redis';
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

const VIOLATION_KEY_PREFIX = 'ratelimit:violation';
const VIOLATION_LOG_KEY = 'ratelimit:violations:log';
const ALERT_THRESHOLD = 10; // violations
const ALERT_WINDOW_MS = 5 * 60 * 1000; // 5 minutes
const VIOLATION_TTL_SECONDS = 3600; // 1 hour
const MAX_LOG_ENTRIES = 10000; // Max entries in violation log

// In-memory fallback for when Redis is unavailable
const inMemoryViolations: Map<string, ViolationStats> = new Map();
const inMemoryAlertedIPs: Set<string> = new Set();

// ============================================
// VIOLATION LOGGING
// ============================================

/**
 * Log a rate limit violation
 * 
 * @param violation - The violation details
 * 
 * **Property 15: Rate limit violation logging**
 * **Validates: Requirements 7.1, 12.7**
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
  // **Feature: production-scalability**
  // **Requirements: 12.7**
  prometheusMetrics.recordRateLimitExceeded(ip, path);

  const redis = getRedisClient();
  
  if (!redis || !isRedisConnected()) {
    // Fallback to in-memory tracking
    trackViolationInMemory(violation);
    return;
  }

  try {
    await trackViolationInRedis(redis, violation);
  } catch (error) {
    logger.error('Failed to track violation in Redis', {
      error: error instanceof Error ? error.message : 'Unknown error',
      ip,
      path,
    });
    // Fallback to in-memory
    trackViolationInMemory(violation);
  }
}

/**
 * Track violation in Redis
 */
async function trackViolationInRedis(
  redis: ReturnType<typeof getRedisClient>,
  violation: RateLimitViolation
): Promise<void> {
  if (!redis) return;
  
  const { ip, path, timestamp, userAgent, userId } = violation;
  const ipKey = `${VIOLATION_KEY_PREFIX}:ip:${ip}`;
  const pathKey = `${VIOLATION_KEY_PREFIX}:path:${path}`;
  const ipPathKey = `${VIOLATION_KEY_PREFIX}:ip-path:${ip}:${encodeURIComponent(path)}`;
  
  const pipeline = redis.pipeline();
  
  // Track violations per IP (sorted set with timestamp as score)
  pipeline.zadd(ipKey, timestamp, `${timestamp}-${Math.random()}`);
  pipeline.expire(ipKey, VIOLATION_TTL_SECONDS);
  
  // Track violations per path
  pipeline.zadd(pathKey, timestamp, `${ip}:${timestamp}`);
  pipeline.expire(pathKey, VIOLATION_TTL_SECONDS);
  
  // Track violations per IP+path combination
  pipeline.zadd(ipPathKey, timestamp, `${timestamp}`);
  pipeline.expire(ipPathKey, VIOLATION_TTL_SECONDS);
  
  // Add to violation log (capped list)
  const logEntry = JSON.stringify({
    ip,
    path,
    timestamp,
    userAgent,
    userId,
  });
  pipeline.lpush(VIOLATION_LOG_KEY, logEntry);
  pipeline.ltrim(VIOLATION_LOG_KEY, 0, MAX_LOG_ENTRIES - 1);
  pipeline.expire(VIOLATION_LOG_KEY, VIOLATION_TTL_SECONDS);
  
  await pipeline.exec();
  
  // Check alert threshold
  await checkAlertThreshold(redis, ip);
}

/**
 * Track violation in memory (fallback)
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
  
  // Check alert threshold in memory
  checkAlertThresholdInMemory(ip);
}

// ============================================
// ALERT THRESHOLD DETECTION
// ============================================

/**
 * Check if IP has exceeded alert threshold
 * 
 * **Property 16: Rate limit alert threshold**
 * **Validates: Requirements 7.2**
 */
async function checkAlertThreshold(
  redis: ReturnType<typeof getRedisClient>,
  ip: string
): Promise<void> {
  if (!redis) return;
  
  const ipKey = `${VIOLATION_KEY_PREFIX}:ip:${ip}`;
  const alertKey = `${VIOLATION_KEY_PREFIX}:alerted:${ip}`;
  const now = Date.now();
  const windowStart = now - ALERT_WINDOW_MS;
  
  try {
    // Count violations in the alert window
    const count = await redis.zcount(ipKey, windowStart, now);
    
    if (count >= ALERT_THRESHOLD) {
      // Check if we already alerted for this IP recently
      const alreadyAlerted = await redis.get(alertKey);
      
      if (!alreadyAlerted) {
        // Trigger alert
        triggerAlert(ip, count);
        
        // Mark as alerted (prevent duplicate alerts for 5 minutes)
        await redis.setex(alertKey, Math.ceil(ALERT_WINDOW_MS / 1000), '1');
      }
    }
  } catch (error) {
    logger.error('Failed to check alert threshold', {
      error: error instanceof Error ? error.message : 'Unknown error',
      ip,
    });
  }
}

/**
 * Check alert threshold in memory (fallback)
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
  
  // In a production system, this would also:
  // - Send to alerting service (PagerDuty, Slack, etc.)
  // - Update metrics/dashboards
  // - Potentially trigger automatic IP blocking
}

// ============================================
// METRICS AND STATS
// ============================================

/**
 * Get rate limit metrics for the last hour
 * 
 * **Validates: Requirements 7.3**
 */
export async function getRateLimitMetrics(): Promise<RateLimitMetrics> {
  const redis = getRedisClient();
  
  if (!redis || !isRedisConnected()) {
    return getMetricsFromMemory();
  }
  
  try {
    return await getMetricsFromRedis(redis);
  } catch (error) {
    logger.error('Failed to get metrics from Redis', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return getMetricsFromMemory();
  }
}

/**
 * Get metrics from Redis
 */
async function getMetricsFromRedis(
  redis: ReturnType<typeof getRedisClient>
): Promise<RateLimitMetrics> {
  if (!redis) {
    return getMetricsFromMemory();
  }
  
  const now = Date.now();
  const hourAgo = now - 3600000;
  
  // Get all violation keys
  const ipKeys = await redis.keys(`${VIOLATION_KEY_PREFIX}:ip:*`);
  const pathKeys = await redis.keys(`${VIOLATION_KEY_PREFIX}:path:*`);
  
  // Count violations per IP
  const ipCounts: Map<string, number> = new Map();
  for (const key of ipKeys) {
    const ip = key.replace(`${VIOLATION_KEY_PREFIX}:ip:`, '');
    const count = await redis.zcount(key, hourAgo, now);
    if (count > 0) {
      ipCounts.set(ip, count);
    }
  }
  
  // Count violations per path
  const pathStats: EndpointViolationStats[] = [];
  for (const key of pathKeys) {
    const path = key.replace(`${VIOLATION_KEY_PREFIX}:path:`, '');
    const entries = await redis.zrangebyscore(key, hourAgo, now);
    const uniqueIPs = new Set(entries.map(e => e.split(':')[0]));
    if (entries.length > 0) {
      pathStats.push({
        path,
        count: entries.length,
        uniqueIPs: uniqueIPs.size,
      });
    }
  }
  
  // Sort by count descending
  pathStats.sort((a, b) => b.count - a.count);
  
  // Get top violating IPs
  const topIPs = Array.from(ipCounts.entries())
    .map(([ip, count]) => ({ ip, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
  
  // Calculate totals
  const totalViolations = Array.from(ipCounts.values()).reduce((a, b) => a + b, 0);
  
  return {
    totalViolations,
    violationsByEndpoint: pathStats.slice(0, 20),
    topViolatingIPs: topIPs,
    lastHourViolations: totalViolations,
  };
}

/**
 * Get metrics from in-memory store (fallback)
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
  const redis = getRedisClient();
  
  if (!redis || !isRedisConnected()) {
    // Fallback to in-memory
    let count = 0;
    const hourAgo = Date.now() - 3600000;
    for (const [key, stats] of inMemoryViolations.entries()) {
      if (key.startsWith(`${ip}:`) && stats.lastViolation >= hourAgo) {
        count += stats.count;
      }
    }
    return count;
  }
  
  try {
    const ipKey = `${VIOLATION_KEY_PREFIX}:ip:${ip}`;
    const now = Date.now();
    const hourAgo = now - 3600000;
    return await redis.zcount(ipKey, hourAgo, now);
  } catch (error) {
    logger.error('Failed to get violation count for IP', {
      error: error instanceof Error ? error.message : 'Unknown error',
      ip,
    });
    return 0;
  }
}

/**
 * Clear all violation data (for testing)
 */
export async function clearAllViolations(): Promise<void> {
  // Clear in-memory
  inMemoryViolations.clear();
  inMemoryAlertedIPs.clear();
  
  const redis = getRedisClient();
  if (!redis || !isRedisConnected()) return;
  
  try {
    const keys = await redis.keys(`${VIOLATION_KEY_PREFIX}:*`);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  } catch (error) {
    logger.error('Failed to clear violations', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

// Export constants for testing
export const CONSTANTS = {
  VIOLATION_KEY_PREFIX,
  ALERT_THRESHOLD,
  ALERT_WINDOW_MS,
  VIOLATION_TTL_SECONDS,
};
