/**
 * Health Check Service (Firebase/Firestore)
 *
 * Provides comprehensive health monitoring for load balancers and orchestrators.
 * Implements liveness and readiness probes with dependency health checks.
 *
 * **Feature: firebase-phase3-firestore**
 * **Requirements: 10.1, 10.5**
 */

import { getFirestore } from 'firebase-admin/firestore';
import { getClusterConfig, getInstanceMetadata } from '../config/cluster';
import { logger } from '../utils/logger';

// ============================================
// TYPES
// ============================================

export interface HealthCheck {
  status: 'up' | 'down' | 'degraded';
  latencyMs?: number;
  message?: string;
}

export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  checks: {
    firestore: HealthCheck;
  };
  uptime: number;
  version: string;
  instance: {
    id: string;
    hostname: string;
    pid: number;
  };
  timestamp: string;
}

export interface LivenessStatus {
  status: 'alive' | 'dead';
  timestamp: string;
  uptime: number;
  pid: number;
  memory: {
    heapUsed: number;
    heapTotal: number;
    rss: number;
  };
}

export interface ReadinessStatus {
  status: 'ready' | 'not_ready';
  timestamp: string;
  reason?: string;
  checks?: {
    firestore: boolean;
    shuttingDown: boolean;
  };
}

// ============================================
// CONSTANTS
// ============================================

const FIRESTORE_CHECK_TIMEOUT = 5000;

// ============================================
// STATE
// ============================================

let isShuttingDown = false;
const startTime = Date.now();

// ============================================
// SHUTDOWN STATE MANAGEMENT
// ============================================

export function setShutdownState(shuttingDown: boolean): void {
  isShuttingDown = shuttingDown;
  if (shuttingDown) {
    logger.info('Health service: Shutdown state activated');
  }
}

export function isShutdownInProgress(): boolean {
  return isShuttingDown;
}

// ============================================
// HEALTH CHECK FUNCTIONS
// ============================================

async function checkFirestoreHealth(): Promise<HealthCheck> {
  const start = Date.now();

  try {
    const db = getFirestore();
    
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Firestore check timeout')), FIRESTORE_CHECK_TIMEOUT);
    });

    // Simple read operation to check Firestore connectivity
    await Promise.race([
      db.collection('_health').doc('check').get(),
      timeoutPromise
    ]);

    const latency = Date.now() - start;
    return {
      status: 'up',
      latencyMs: latency,
    };
  } catch (error) {
    const latency = Date.now() - start;
    return {
      status: 'down',
      latencyMs: latency,
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// ============================================
// PUBLIC API
// ============================================

export async function getHealthStatus(): Promise<HealthStatus> {
  const config = getClusterConfig();
  const metadata = getInstanceMetadata();

  const firestoreCheck = await checkFirestoreHealth();

  let status: 'healthy' | 'degraded' | 'unhealthy';

  if (firestoreCheck.status === 'down') {
    status = 'unhealthy';
  } else {
    status = 'healthy';
  }

  return {
    status,
    checks: {
      firestore: firestoreCheck,
    },
    uptime: Math.floor((Date.now() - startTime) / 1000),
    version: process.env.npm_package_version || '3.0.0',
    instance: {
      id: config.instanceId,
      hostname: config.hostname,
      pid: metadata.pid as number,
    },
    timestamp: new Date().toISOString(),
  };
}

export function getLivenessStatus(): LivenessStatus {
  const memUsage = process.memoryUsage();

  return {
    status: 'alive',
    timestamp: new Date().toISOString(),
    uptime: Math.floor((Date.now() - startTime) / 1000),
    pid: process.pid,
    memory: {
      heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
      heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
      rss: Math.round(memUsage.rss / 1024 / 1024),
    },
  };
}

export async function getReadinessStatus(): Promise<{ status: ReadinessStatus; httpStatus: number }> {
  if (isShuttingDown) {
    return {
      status: {
        status: 'not_ready',
        timestamp: new Date().toISOString(),
        reason: 'Shutdown in progress',
        checks: {
          firestore: false,
          shuttingDown: true,
        },
      },
      httpStatus: 503,
    };
  }

  const firestoreCheck = await checkFirestoreHealth();

  if (firestoreCheck.status === 'down') {
    return {
      status: {
        status: 'not_ready',
        timestamp: new Date().toISOString(),
        reason: firestoreCheck.message || 'Firestore unavailable',
        checks: {
          firestore: false,
          shuttingDown: false,
        },
      },
      httpStatus: 503,
    };
  }

  return {
    status: {
      status: 'ready',
      timestamp: new Date().toISOString(),
      checks: {
        firestore: true,
        shuttingDown: false,
      },
    },
    httpStatus: 200,
  };
}

export function resetHealthService(): void {
  isShuttingDown = false;
}
