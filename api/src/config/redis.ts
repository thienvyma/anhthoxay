/**
 * Redis Client Configuration
 *
 * Provides a singleton Redis client with connection error handling
 * and reconnection logic for production use.
 *
 * **Feature: production-readiness**
 * **Requirements: FR-3.1**
 */

import Redis, { RedisOptions } from 'ioredis';
import { logger } from '../utils/logger';

let redisClient: Redis | null = null;
let isConnected = false;

/**
 * Redis connection options
 */
const getRedisOptions = (): RedisOptions => {
  const redisUrl = process.env.REDIS_URL;
  
  if (!redisUrl) {
    return {
      host: 'localhost',
      port: 6379,
      maxRetriesPerRequest: 3,
      retryStrategy: (times: number) => {
        if (times > 3) {
          logger.warn('Redis connection failed after 3 retries, giving up');
          return null;
        }
        return Math.min(times * 200, 2000);
      },
    };
  }

  // Parse Redis URL
  const url = new URL(redisUrl);
  return {
    host: url.hostname,
    port: parseInt(url.port) || 6379,
    password: url.password || undefined,
    maxRetriesPerRequest: 3,
    retryStrategy: (times: number) => {
      if (times > 3) {
        logger.warn('Redis connection failed after 3 retries, giving up');
        return null;
      }
      return Math.min(times * 200, 2000);
    },
  };
};


/**
 * Get or create Redis client singleton
 * 
 * @returns Redis client instance or null if Redis is not configured
 * 
 * @example
 * ```ts
 * const redis = getRedisClient();
 * if (redis) {
 *   await redis.set('key', 'value');
 *   const value = await redis.get('key');
 * }
 * ```
 */
export function getRedisClient(): Redis | null {
  if (redisClient) {
    return redisClient;
  }

  const redisUrl = process.env.REDIS_URL;
  
  if (!redisUrl) {
    logger.info('REDIS_URL not configured, Redis features disabled');
    return null;
  }

  try {
    const options = getRedisOptions();
    redisClient = new Redis(options);

    redisClient.on('connect', () => {
      isConnected = true;
      logger.info('Redis connected successfully');
    });

    redisClient.on('error', (err) => {
      isConnected = false;
      logger.error('Redis connection error', { error: err.message });
    });

    redisClient.on('close', () => {
      isConnected = false;
      logger.warn('Redis connection closed');
    });

    redisClient.on('reconnecting', () => {
      logger.info('Redis reconnecting...');
    });

    return redisClient;
  } catch (error) {
    logger.error('Failed to create Redis client', { 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
    return null;
  }
}

/**
 * Check if Redis is connected
 */
export function isRedisConnected(): boolean {
  return isConnected && redisClient !== null;
}

/**
 * Close Redis connection gracefully
 */
export async function closeRedisConnection(): Promise<void> {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
    isConnected = false;
    logger.info('Redis connection closed gracefully');
  }
}

/**
 * Test Redis connection
 * 
 * @returns true if connection is successful
 */
export async function testRedisConnection(): Promise<boolean> {
  const client = getRedisClient();
  if (!client) {
    return false;
  }

  try {
    const pong = await client.ping();
    return pong === 'PONG';
  } catch (error) {
    logger.error('Redis ping failed', { 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
    return false;
  }
}

export { redisClient };
