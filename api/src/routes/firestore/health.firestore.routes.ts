/**
 * Health Check Routes (Firestore)
 *
 * Provides health check endpoints for monitoring and orchestration:
 * - /health - Overall system health (Firestore)
 * - /health/ready - Readiness probe (can accept traffic)
 * - /health/live - Liveness probe (process is running)
 *
 * @module routes/firestore/health
 */

import { Hono } from 'hono';
import { successResponse } from '../../utils/response';
import { metricsCollector } from '../../middleware/monitoring';
import { getFirestore } from '../../services/firebase-admin.service';

// Track shutdown state
let isShuttingDown = false;

// Firebase ready state (set from main.ts)
let firebaseReadyFn: (() => boolean) | null = null;
let firebaseErrorFn: (() => Error | null) | null = null;

export function setShutdownState(state: boolean): void {
  isShuttingDown = state;
}

export function setFirebaseReadyCheck(readyFn: () => boolean, errorFn: () => Error | null): void {
  firebaseReadyFn = readyFn;
  firebaseErrorFn = errorFn;
}

/**
 * Creates health check routes (Firestore-based)
 */
export function createHealthFirestoreRoutes() {
  const app = new Hono();
  const startTime = Date.now();

  /**
   * @route GET /health
   * @description Overall system health check
   * @access Public
   */
  app.get('/', async (c) => {
    const status = await getHealthStatus();

    if (status.status === 'unhealthy') {
      return c.json(
        {
          success: false,
          error: {
            code: 'SERVICE_UNAVAILABLE',
            message: 'Service is unhealthy',
          },
          ...status,
        },
        503
      );
    }

    return successResponse(c, status);
  });

  /**
   * @route GET /health/ready
   * @description Readiness probe for Kubernetes/orchestrators
   * @access Public
   */
  app.get('/ready', async (c) => {
    const { status, httpStatus } = await getReadinessStatus();

    if (httpStatus !== 200) {
      return c.json(
        {
          success: false,
          error: {
            code: 'SERVICE_UNAVAILABLE',
            message: status.reason || 'Service is not ready',
          },
          ...status,
        },
        503
      );
    }

    return successResponse(c, status);
  });

  /**
   * @route GET /health/live
   * @description Liveness probe for Kubernetes/orchestrators
   * @access Public
   */
  app.get('/live', (c) => {
    const status = getLivenessStatus();
    return successResponse(c, status);
  });

  /**
   * @route GET /health/metrics
   * @description Request metrics for monitoring dashboards
   * @access Public
   */
  app.get('/metrics', (c) => {
    const metrics = metricsCollector.getMetrics();
    return successResponse(c, {
      timestamp: new Date().toISOString(),
      uptime: Math.floor((Date.now() - startTime) / 1000),
      ...metrics,
    });
  });

  return app;
}

/**
 * Get overall health status
 */
async function getHealthStatus(): Promise<{
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  services: {
    firestore: { status: string; latencyMs?: number };
  };
}> {
  const timestamp = new Date().toISOString();
  
  // Check Firestore
  const firestoreStatus = await checkFirestore();
  
  const status = firestoreStatus.status === 'healthy' ? 'healthy' : 'unhealthy';
  
  return {
    status,
    timestamp,
    services: {
      firestore: firestoreStatus,
    },
  };
}

/**
 * Check Firestore connectivity
 */
async function checkFirestore(): Promise<{ status: string; latencyMs?: number; error?: string }> {
  // First check if Firebase is initialized
  if (firebaseReadyFn && !firebaseReadyFn()) {
    const error = firebaseErrorFn?.();
    return {
      status: 'initializing',
      error: error?.message || 'Firebase is still initializing',
    };
  }
  
  const start = Date.now();
  
  try {
    const db = await getFirestore();
    // Simple read to check connectivity
    await db.collection('_health').doc('check').get();
    
    return {
      status: 'healthy',
      latencyMs: Date.now() - start,
    };
  } catch (err) {
    return {
      status: 'unhealthy',
      latencyMs: Date.now() - start,
      error: err instanceof Error ? err.message : 'Unknown error',
    };
  }
}

/**
 * Get readiness status
 */
async function getReadinessStatus(): Promise<{
  status: { ready: boolean; reason?: string };
  httpStatus: number;
}> {
  if (isShuttingDown) {
    return {
      status: { ready: false, reason: 'Shutdown in progress' },
      httpStatus: 503,
    };
  }
  
  // Check if Firebase is still initializing
  if (firebaseReadyFn && !firebaseReadyFn()) {
    const error = firebaseErrorFn?.();
    if (error) {
      return {
        status: { ready: false, reason: `Firebase init failed: ${error.message}` },
        httpStatus: 503,
      };
    }
    // Still initializing - return 503 but with different reason
    return {
      status: { ready: false, reason: 'Firebase is still initializing' },
      httpStatus: 503,
    };
  }
  
  const health = await getHealthStatus();
  
  if (health.status === 'unhealthy') {
    return {
      status: { ready: false, reason: 'Firestore unhealthy' },
      httpStatus: 503,
    };
  }
  
  return {
    status: { ready: true },
    httpStatus: 200,
  };
}

/**
 * Get liveness status
 */
function getLivenessStatus(): { alive: boolean; uptime: number } {
  return {
    alive: true,
    uptime: process.uptime(),
  };
}

export const healthFirestoreRoutes = createHealthFirestoreRoutes();
