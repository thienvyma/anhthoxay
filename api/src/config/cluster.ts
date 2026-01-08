/**
 * Cluster Configuration Module
 *
 * Provides configuration for running multiple API instances in a cluster.
 * Generates unique instance IDs and manages cluster-wide settings.
 *
 * **Feature: high-traffic-resilience**
 * **Requirements: 1.1, 1.2**
 */

import { hostname } from 'os';
import { randomBytes } from 'crypto';
import { logger } from '../utils/logger';

// ============================================
// TYPES
// ============================================

export interface ClusterConfig {
  /** Unique identifier for this instance */
  instanceId: string;
  /** Hostname of this instance */
  hostname: string;
  /** Health check path for load balancer */
  healthCheckPath: string;
  /** Shutdown timeout in milliseconds */
  shutdownTimeout: number;
  /** Connection drain timeout in milliseconds */
  drainTimeout: number;
  /** Whether cluster mode is enabled */
  clusterMode: boolean;
  /** Process ID */
  pid: number;
  /** Start timestamp */
  startedAt: Date;
}

// ============================================
// INSTANCE ID GENERATION
// ============================================

/**
 * Generate a unique instance ID
 * 
 * Format: {hostname}-{random}-{pid}
 * Example: api-server-1-a1b2c3-12345
 * 
 * This ensures uniqueness across:
 * - Different hosts (hostname)
 * - Multiple instances on same host (random + pid)
 * - Container restarts (random changes each time)
 */
function generateInstanceId(): string {
  const host = hostname().toLowerCase().replace(/[^a-z0-9-]/g, '-').slice(0, 20);
  const random = randomBytes(3).toString('hex'); // 6 chars
  const pid = process.pid;
  
  return `${host}-${random}-${pid}`;
}

// ============================================
// CLUSTER CONFIG SINGLETON
// ============================================

let clusterConfig: ClusterConfig | null = null;

/**
 * Get or create cluster configuration
 * 
 * Configuration is created once and cached for the lifetime of the process.
 * 
 * Environment variables:
 * - CLUSTER_MODE: Enable cluster mode (default: false in dev, true in prod)
 * - INSTANCE_ID: Override auto-generated instance ID
 * - SHUTDOWN_TIMEOUT: Shutdown timeout in ms (default: 30000)
 * - DRAIN_TIMEOUT: Connection drain timeout in ms (default: 25000)
 * 
 * @returns ClusterConfig object
 * 
 * @example
 * ```ts
 * const config = getClusterConfig();
 * console.log(`Instance ${config.instanceId} starting...`);
 * ```
 */
export function getClusterConfig(): ClusterConfig {
  if (clusterConfig) {
    return clusterConfig;
  }

  const isProduction = process.env.NODE_ENV === 'production';
  
  // Parse environment variables with defaults
  const clusterMode = process.env.CLUSTER_MODE 
    ? process.env.CLUSTER_MODE === 'true' 
    : isProduction;
  
  const instanceId = process.env.INSTANCE_ID || generateInstanceId();
  
  const shutdownTimeoutRaw = parseInt(process.env.SHUTDOWN_TIMEOUT || '30000', 10);
  const drainTimeoutRaw = parseInt(process.env.DRAIN_TIMEOUT || '25000', 10);
  
  // Validate parsed values, fallback to defaults if NaN
  const shutdownTimeout = Number.isNaN(shutdownTimeoutRaw) ? 30000 : shutdownTimeoutRaw;
  const drainTimeout = Number.isNaN(drainTimeoutRaw) ? 25000 : drainTimeoutRaw;

  clusterConfig = {
    instanceId,
    hostname: hostname(),
    healthCheckPath: '/health/ready',
    shutdownTimeout,
    drainTimeout,
    clusterMode,
    pid: process.pid,
    startedAt: new Date(),
  };

  logger.info('Cluster configuration initialized', {
    instanceId: clusterConfig.instanceId,
    hostname: clusterConfig.hostname,
    clusterMode: clusterConfig.clusterMode,
    shutdownTimeout: clusterConfig.shutdownTimeout,
    drainTimeout: clusterConfig.drainTimeout,
  });

  return clusterConfig;
}

/**
 * Get the instance ID for this API instance
 * 
 * Shorthand for getClusterConfig().instanceId
 * 
 * @returns Unique instance identifier
 */
export function getInstanceId(): string {
  return getClusterConfig().instanceId;
}

/**
 * Check if cluster mode is enabled
 * 
 * When cluster mode is enabled:
 * - All state must be stored in Redis (not in-memory)
 * - File storage must use shared storage (S3/R2)
 * - Health checks are more strict
 * 
 * @returns true if cluster mode is enabled
 */
export function isClusterMode(): boolean {
  return getClusterConfig().clusterMode;
}

/**
 * Get instance metadata for logging and tracing
 * 
 * @returns Object with instance metadata
 */
export function getInstanceMetadata(): Record<string, string | number> {
  const config = getClusterConfig();
  return {
    instanceId: config.instanceId,
    hostname: config.hostname,
    pid: config.pid,
    uptime: Math.floor((Date.now() - config.startedAt.getTime()) / 1000),
  };
}

/**
 * Reset cluster config (for testing only)
 */
export function resetClusterConfig(): void {
  clusterConfig = null;
}
