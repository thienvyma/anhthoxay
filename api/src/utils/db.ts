/**
 * Database Utilities
 *
 * Provides convenient access to database clients with read/write separation.
 * Services can use these utilities to route queries appropriately.
 *
 * **Feature: high-traffic-resilience**
 * **Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6**
 */

import { PrismaClient } from '@prisma/client';
import { getQueryRouter, isReplicaConfigured, type QueryRouter } from './prisma-replica';
import { logger } from './logger';

// ============================================
// SINGLETON PRISMA CLIENT
// ============================================

let prismaInstance: PrismaClient | null = null;

/**
 * Get the singleton Prisma client instance
 * This is the primary database client for write operations
 */
export function getPrisma(): PrismaClient {
  if (!prismaInstance) {
    prismaInstance = getQueryRouter().getPrimary();
  }
  return prismaInstance;
}

/**
 * Get the replica Prisma client for read operations
 * Falls back to primary if no replica is configured
 */
export function getReplicaPrisma(): PrismaClient {
  return getQueryRouter().getReplica();
}

// ============================================
// DATABASE CONTEXT
// ============================================

/**
 * Database context for services
 * Provides both primary and replica clients with query routing
 */
export interface DatabaseContext {
  /** Primary client for write operations */
  primary: PrismaClient;
  /** Replica client for read operations (or primary if no replica) */
  replica: PrismaClient;
  /** Query router for advanced routing */
  router: QueryRouter;
  /** Whether replica is configured */
  hasReplica: boolean;
}

/**
 * Get database context for services
 *
 * @example
 * ```ts
 * const db = getDbContext();
 *
 * // Read from replica
 * const users = await db.replica.user.findMany();
 *
 * // Write to primary
 * const newUser = await db.primary.user.create({ data: { ... } });
 *
 * // Use router for advanced routing
 * const result = await db.router.read((prisma) => prisma.user.findMany());
 * ```
 */
export function getDbContext(): DatabaseContext {
  const router = getQueryRouter();
  return {
    primary: router.getPrimary(),
    replica: router.getReplica(),
    router,
    hasReplica: isReplicaConfigured(),
  };
}

// ============================================
// READ/WRITE HELPERS
// ============================================

/**
 * Execute a read query using the replica (if available)
 *
 * @example
 * ```ts
 * const users = await dbRead((prisma) => prisma.user.findMany());
 * ```
 */
export async function dbRead<T>(query: (prisma: PrismaClient) => Promise<T>): Promise<T> {
  return getQueryRouter().read(query);
}

/**
 * Execute a write query using the primary
 *
 * @example
 * ```ts
 * const user = await dbWrite((prisma) => prisma.user.create({ data: { ... } }));
 * ```
 */
export async function dbWrite<T>(query: (prisma: PrismaClient) => Promise<T>): Promise<T> {
  return getQueryRouter().write(query);
}

/**
 * Execute a critical read query using the primary
 * Use this for reads that must have the latest data (e.g., after a write)
 *
 * @example
 * ```ts
 * // After creating a user, read from primary to ensure consistency
 * const user = await dbReadPrimary((prisma) => prisma.user.findUnique({ where: { id } }));
 * ```
 */
export async function dbReadPrimary<T>(query: (prisma: PrismaClient) => Promise<T>): Promise<T> {
  return getQueryRouter().readPrimary(query);
}

// ============================================
// SERVICE FACTORY
// ============================================

/**
 * Options for creating a service with database context
 */
export interface ServiceFactoryOptions {
  /** Use replica for read operations (default: true if replica configured) */
  useReplica?: boolean;
  /** Service name for logging */
  serviceName?: string;
}

/**
 * Create a service instance with appropriate database client
 *
 * @example
 * ```ts
 * // Create service with replica support
 * const regionService = createServiceWithDb(
 *   RegionService,
 *   { useReplica: true, serviceName: 'RegionService' }
 * );
 *
 * // Service will use replica for reads automatically
 * const regions = await regionService.getAll({ flat: true });
 * ```
 */
export function createServiceWithDb<T>(
  ServiceClass: new (prisma: PrismaClient) => T,
  options: ServiceFactoryOptions = {}
): T {
  const { useReplica = true, serviceName } = options;
  const db = getDbContext();

  // Use replica if configured and requested
  const prisma = useReplica && db.hasReplica ? db.replica : db.primary;

  if (serviceName && useReplica && db.hasReplica) {
    logger.debug(`${serviceName} using replica for read operations`);
  }

  return new ServiceClass(prisma);
}

/**
 * Create a service instance that uses primary for all operations
 * Use this for services that primarily do writes
 */
export function createServiceWithPrimary<T>(
  ServiceClass: new (prisma: PrismaClient) => T
): T {
  return new ServiceClass(getPrisma());
}

// ============================================
// HEALTH CHECK
// ============================================

/**
 * Check database health (both primary and replica)
 */
export async function checkDbHealth(): Promise<{
  primary: { healthy: boolean; latencyMs: number };
  replica: { healthy: boolean; latencyMs: number; lagMs: number | null } | null;
}> {
  const router = getQueryRouter();
  const status = await router.getReplicaStatus();

  // Check primary health
  const primaryStart = Date.now();
  let primaryHealthy = false;
  try {
    await router.getPrimary().$queryRaw`SELECT 1`;
    primaryHealthy = true;
  } catch {
    primaryHealthy = false;
  }
  const primaryLatency = Date.now() - primaryStart;

  // Check replica health if configured
  let replicaResult = null;
  if (status.configured) {
    const replicaStart = Date.now();
    let replicaHealthy = false;
    try {
      await router.getReplica().$queryRaw`SELECT 1`;
      replicaHealthy = status.healthy;
    } catch {
      replicaHealthy = false;
    }
    const replicaLatency = Date.now() - replicaStart;

    replicaResult = {
      healthy: replicaHealthy,
      latencyMs: replicaLatency,
      lagMs: status.lagMs,
    };
  }

  return {
    primary: { healthy: primaryHealthy, latencyMs: primaryLatency },
    replica: replicaResult,
  };
}

// ============================================
// EXPORTS
// ============================================

export { getQueryRouter, isReplicaConfigured } from './prisma-replica';
