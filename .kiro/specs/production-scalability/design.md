# Design Document: Production Scalability

## Overview

Tài liệu này mô tả thiết kế kỹ thuật để nâng cấp hệ thống ANH THỢ XÂY từ điểm 4.5/10 lên 8-9/10 về các kỹ thuật chuyên nghiệp. Thiết kế tập trung vào 3 phase triển khai:

- **Phase 1 (1-2 tuần):** Queue System + Redis Cache
- **Phase 2 (1 tuần):** Distributed Lock + Idempotency + CAPTCHA
- **Phase 3 (1 tuần):** Circuit Breaker + Monitoring + Frontend improvements

### Mục tiêu

| Metric | Hiện tại | Sau Phase 1 | Sau Phase 3 |
|--------|----------|-------------|-------------|
| Concurrent Users | ~100 | ~500 | ~1000+ |
| DB Connections | 10 | 50 | 50-100 |
| Response Time (p95) | ~500ms | ~200ms | ~100ms |
| Bot Protection | None | CAPTCHA | CAPTCHA |
| Observability | 8/10 | 8/10 | 9/10 |

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              CLIENTS                                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐                │
│  │ Landing  │  │  Admin   │  │  Portal  │  │ External │                │
│  │   Page   │  │  Panel   │  │   App    │  │   APIs   │                │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘                │
└───────┼─────────────┼─────────────┼─────────────┼───────────────────────┘
        │             │             │             │
        └─────────────┴──────┬──────┴─────────────┘
                             │
┌────────────────────────────┼────────────────────────────────────────────┐
│                            ▼                                             │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                         API SERVER                                │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐        │   │
│  │  │   Rate   │  │ Turnstile│  │  Circuit │  │Idempotency│        │   │
│  │  │ Limiter  │  │  Verify  │  │ Breaker  │  │   Check   │        │   │
│  │  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘        │   │
│  │       └─────────────┴──────┬──────┴─────────────┘               │   │
│  │                            ▼                                     │   │
│  │  ┌─────────────────────────────────────────────────────────┐   │   │
│  │  │                    ROUTE HANDLERS                        │   │   │
│  │  └─────────────────────────┬───────────────────────────────┘   │   │
│  │                            │                                     │   │
│  │       ┌────────────────────┼────────────────────┐               │   │
│  │       ▼                    ▼                    ▼               │   │
│  │  ┌─────────┐         ┌─────────┐         ┌─────────┐           │   │
│  │  │  Cache  │         │ Services│         │  Queue  │           │   │
│  │  │ Service │         │         │         │ Producer│           │   │
│  │  └────┬────┘         └────┬────┘         └────┬────┘           │   │
│  └───────┼───────────────────┼───────────────────┼─────────────────┘   │
│          │                   │                   │                      │
└──────────┼───────────────────┼───────────────────┼──────────────────────┘
           │                   │                   │
┌──────────┼───────────────────┼───────────────────┼──────────────────────┐
│          ▼                   ▼                   ▼                      │
│  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐               │
│  │    REDIS    │     │  POSTGRES   │     │   BULLMQ    │               │
│  │             │     │             │     │   WORKERS   │               │
│  │ • Cache     │     │ • Data      │     │             │               │
│  │ • Rate Limit│     │ • Pool: 50  │     │ • Email     │               │
│  │ • Locks     │     │             │     │ • Sync      │               │
│  │ • Idempotency│    │             │     │ • Notify    │               │
│  │ • Queue     │     │             │     │             │               │
│  └─────────────┘     └─────────────┘     └─────────────┘               │
│                                                                         │
│                         INFRASTRUCTURE                                  │
└─────────────────────────────────────────────────────────────────────────┘
```

### Request Flow với các Middleware mới

```
Request → Rate Limiter → Turnstile Verify → Idempotency Check
                                                    │
                                    ┌───────────────┴───────────────┐
                                    │                               │
                              (Cache Hit)                    (Cache Miss)
                                    │                               │
                                    ▼                               ▼
                              Return Cached              Route Handler
                                                               │
                                                    ┌──────────┴──────────┐
                                                    │                     │
                                              (Sync Op)            (Async Op)
                                                    │                     │
                                                    ▼                     ▼
                                              Cache + DB            Queue Job
                                                    │                     │
                                                    └──────────┬──────────┘
                                                               │
                                                               ▼
                                                          Response
```

## Components and Interfaces

### 1. Queue System (BullMQ)

```typescript
// api/src/queues/index.ts
import { Queue, Worker, QueueEvents } from 'bullmq';
import { redis } from '../config/redis';

// Queue definitions
export const emailQueue = new Queue('email', { connection: redis });
export const syncQueue = new Queue('sync', { connection: redis });
export const notificationQueue = new Queue('notification', { connection: redis });

// Queue configuration
const defaultJobOptions = {
  attempts: 3,
  backoff: {
    type: 'exponential',
    delay: 1000,
  },
  removeOnComplete: 100,
  removeOnFail: 1000,
};

// Job types
interface EmailJob {
  type: 'quotation' | 'notification' | 'welcome';
  to: string;
  subject: string;
  templateId: string;
  data: Record<string, unknown>;
  correlationId: string;
}

interface SyncJob {
  type: 'google-sheets';
  spreadsheetId: string;
  data: unknown[];
  correlationId: string;
}

interface NotificationJob {
  userId: string;
  type: string;
  title: string;
  content: string;
  data?: Record<string, unknown>;
  channels: ('in-app' | 'email' | 'sms')[];
  correlationId: string;
}
```

```typescript
// api/src/queues/workers/email.worker.ts
import { Worker, Job } from 'bullmq';
import { redis } from '../../config/redis';
import { logger } from '../../utils/logger';

export const emailWorker = new Worker(
  'email',
  async (job: Job<EmailJob>) => {
    const { type, to, subject, templateId, data, correlationId } = job.data;
    
    logger.info('Processing email job', { jobId: job.id, type, to, correlationId });
    
    try {
      switch (type) {
        case 'quotation':
          await sendQuotationEmail(to, data);
          break;
        case 'notification':
          await sendNotificationEmail(to, subject, templateId, data);
          break;
        case 'welcome':
          await sendWelcomeEmail(to, data);
          break;
      }
      
      logger.info('Email job completed', { jobId: job.id, correlationId });
    } catch (error) {
      logger.error('Email job failed', { jobId: job.id, error: error.message, correlationId });
      throw error; // Trigger retry
    }
  },
  {
    connection: redis,
    concurrency: 5,
  }
);
```

### 2. Cache Service

```typescript
// api/src/services/cache.service.ts
import { Redis } from 'ioredis';
import { logger } from '../utils/logger';

export class CacheService {
  private redis: Redis;
  private isConnected: boolean = false;

  constructor(redis: Redis) {
    this.redis = redis;
    this.isConnected = redis.status === 'ready';
    
    redis.on('connect', () => { this.isConnected = true; });
    redis.on('error', () => { this.isConnected = false; });
  }

  async getOrSet<T>(
    key: string,
    ttlSeconds: number,
    fetchFn: () => Promise<T>
  ): Promise<{ data: T; fromCache: boolean }> {
    if (!this.isConnected) {
      logger.warn('Redis unavailable, falling back to database', { key });
      return { data: await fetchFn(), fromCache: false };
    }

    try {
      const cached = await this.redis.get(key);
      if (cached) {
        return { data: JSON.parse(cached), fromCache: true };
      }

      const data = await fetchFn();
      await this.redis.setex(key, ttlSeconds, JSON.stringify(data));
      return { data, fromCache: false };
    } catch (error) {
      logger.error('Cache error, falling back to database', { key, error: error.message });
      return { data: await fetchFn(), fromCache: false };
    }
  }

  async invalidate(pattern: string): Promise<void> {
    if (!this.isConnected) return;
    
    const keys = await this.redis.keys(pattern);
    if (keys.length > 0) {
      await this.redis.del(...keys);
      logger.info('Cache invalidated', { pattern, count: keys.length });
    }
  }

  async set(key: string, value: unknown, ttlSeconds: number): Promise<void> {
    if (!this.isConnected) return;
    await this.redis.setex(key, ttlSeconds, JSON.stringify(value));
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.isConnected) return null;
    const cached = await this.redis.get(key);
    return cached ? JSON.parse(cached) : null;
  }
}

// Cache keys
export const CacheKeys = {
  serviceCategories: 'cache:service-categories',
  materials: (categoryId?: string) => categoryId 
    ? `cache:materials:${categoryId}` 
    : 'cache:materials:all',
  settings: 'cache:settings',
  regions: 'cache:regions',
  biddingSettings: 'cache:bidding-settings',
};

// TTL values (seconds)
export const CacheTTL = {
  serviceCategories: 300, // 5 minutes
  materials: 300,         // 5 minutes
  settings: 60,           // 1 minute
  regions: 600,           // 10 minutes
  biddingSettings: 60,    // 1 minute
};
```

### 3. Turnstile CAPTCHA

```typescript
// api/src/middleware/turnstile.ts
import { Context, Next } from 'hono';
import { logger } from '../utils/logger';

const TURNSTILE_VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

interface TurnstileResponse {
  success: boolean;
  'error-codes'?: string[];
  challenge_ts?: string;
  hostname?: string;
}

export async function verifyTurnstile(token: string, ip?: string): Promise<boolean> {
  const secretKey = process.env.TURNSTILE_SECRET_KEY;
  
  if (!secretKey) {
    logger.warn('Turnstile secret key not configured, skipping verification');
    return true; // Skip in development
  }

  try {
    const response = await fetch(TURNSTILE_VERIFY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        secret: secretKey,
        response: token,
        ...(ip && { remoteip: ip }),
      }),
    });

    const data: TurnstileResponse = await response.json();
    
    if (!data.success) {
      logger.warn('Turnstile verification failed', { errors: data['error-codes'] });
    }
    
    return data.success;
  } catch (error) {
    logger.error('Turnstile verification error', { error: error.message });
    return false;
  }
}

export function turnstileMiddleware() {
  return async (c: Context, next: Next) => {
    const body = await c.req.json();
    const turnstileToken = body.turnstileToken || body.captchaToken;
    
    if (!turnstileToken) {
      return c.json({
        success: false,
        error: { code: 'CAPTCHA_REQUIRED', message: 'CAPTCHA verification required' }
      }, 400);
    }

    const ip = c.req.header('CF-Connecting-IP') || c.req.header('X-Forwarded-For');
    const isValid = await verifyTurnstile(turnstileToken, ip);
    
    if (!isValid) {
      return c.json({
        success: false,
        error: { code: 'CAPTCHA_FAILED', message: 'CAPTCHA verification failed' }
      }, 400);
    }

    // Remove turnstile token from body before passing to handler
    delete body.turnstileToken;
    delete body.captchaToken;
    c.set('validatedBody', body);
    
    await next();
  };
}
```

```typescript
// landing/src/app/components/TurnstileWidget.tsx
import { Turnstile } from '@marsidev/react-turnstile';

interface TurnstileWidgetProps {
  onVerify: (token: string) => void;
  onError?: () => void;
  onExpire?: () => void;
}

export function TurnstileWidget({ onVerify, onError, onExpire }: TurnstileWidgetProps) {
  const siteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY;
  
  if (!siteKey) {
    console.warn('Turnstile site key not configured');
    return null;
  }

  return (
    <Turnstile
      siteKey={siteKey}
      onSuccess={onVerify}
      onError={onError}
      onExpire={onExpire}
      options={{
        theme: 'light',
        size: 'normal',
      }}
    />
  );
}
```

### 4. Distributed Lock

```typescript
// api/src/utils/distributed-lock.ts
import Redlock, { Lock } from 'redlock';
import { redis } from '../config/redis';
import { logger } from './logger';

const redlock = new Redlock([redis], {
  driftFactor: 0.01,
  retryCount: 3,
  retryDelay: 200,
  retryJitter: 200,
  automaticExtensionThreshold: 500,
});

redlock.on('error', (error) => {
  logger.error('Redlock error', { error: error.message });
});

export async function withLock<T>(
  resource: string,
  ttlMs: number,
  fn: () => Promise<T>
): Promise<T> {
  const lockKey = `lock:${resource}`;
  let lock: Lock | null = null;

  try {
    lock = await redlock.acquire([lockKey], ttlMs);
    logger.debug('Lock acquired', { resource, ttlMs });
    return await fn();
  } catch (error) {
    if (error.name === 'LockError') {
      logger.warn('Failed to acquire lock', { resource, error: error.message });
      throw new LockTimeoutError(resource);
    }
    throw error;
  } finally {
    if (lock) {
      try {
        await lock.release();
        logger.debug('Lock released', { resource });
      } catch (error) {
        logger.warn('Failed to release lock', { resource, error: error.message });
      }
    }
  }
}

export class LockTimeoutError extends Error {
  code = 'LOCK_TIMEOUT';
  status = 503;
  
  constructor(resource: string) {
    super(`Failed to acquire lock for resource: ${resource}`);
    this.name = 'LockTimeoutError';
  }
}

// Lock keys
export const LockKeys = {
  tokenRefresh: (userId: string) => `token-refresh:${userId}`,
  rankingRecalculation: 'ranking-recalculation',
  googleSheetsSync: (spreadsheetId: string) => `google-sheets:${spreadsheetId}`,
};
```

### 5. Idempotency Middleware

```typescript
// api/src/middleware/idempotency.ts
import { Context, Next } from 'hono';
import { redis } from '../config/redis';
import { logger } from '../utils/logger';

const IDEMPOTENCY_TTL = 86400; // 24 hours

interface IdempotencyEntry {
  status: number;
  body: unknown;
  headers: Record<string, string>;
  createdAt: number;
}

export function idempotencyMiddleware() {
  return async (c: Context, next: Next) => {
    const idempotencyKey = c.req.header('Idempotency-Key');
    
    if (!idempotencyKey) {
      return next();
    }

    const cacheKey = `idempotency:${idempotencyKey}`;
    
    try {
      // Check for existing result
      const cached = await redis.get(cacheKey);
      if (cached) {
        const entry: IdempotencyEntry = JSON.parse(cached);
        logger.info('Returning cached idempotent response', { idempotencyKey });
        
        // Set cached headers
        Object.entries(entry.headers).forEach(([key, value]) => {
          c.header(key, value);
        });
        c.header('X-Idempotency-Replayed', 'true');
        
        return c.json(entry.body, entry.status as any);
      }

      // Process request and capture response
      await next();
      
      // Cache the response
      const responseBody = c.res.clone();
      const body = await responseBody.json();
      
      const entry: IdempotencyEntry = {
        status: c.res.status,
        body,
        headers: {
          'Content-Type': c.res.headers.get('Content-Type') || 'application/json',
        },
        createdAt: Date.now(),
      };
      
      await redis.setex(cacheKey, IDEMPOTENCY_TTL, JSON.stringify(entry));
      logger.info('Cached idempotent response', { idempotencyKey });
      
    } catch (error) {
      logger.error('Idempotency middleware error', { error: error.message, idempotencyKey });
      return next();
    }
  };
}
```

### 6. Circuit Breaker

```typescript
// api/src/utils/circuit-breaker.ts
import CircuitBreaker from 'opossum';
import { logger } from './logger';

interface CircuitBreakerOptions {
  timeout?: number;
  errorThresholdPercentage?: number;
  resetTimeout?: number;
  volumeThreshold?: number;
}

const defaultOptions: CircuitBreakerOptions = {
  timeout: 10000,                  // 10 seconds
  errorThresholdPercentage: 50,   // Open after 50% failures
  resetTimeout: 30000,            // Try again after 30 seconds
  volumeThreshold: 5,             // Minimum requests before tripping
};

export function createCircuitBreaker<T>(
  name: string,
  fn: (...args: unknown[]) => Promise<T>,
  options?: CircuitBreakerOptions
): CircuitBreaker<unknown[], T> {
  const breaker = new CircuitBreaker(fn, {
    ...defaultOptions,
    ...options,
    name,
  });

  breaker.on('open', () => {
    logger.warn('Circuit breaker opened', { name });
  });

  breaker.on('halfOpen', () => {
    logger.info('Circuit breaker half-open', { name });
  });

  breaker.on('close', () => {
    logger.info('Circuit breaker closed', { name });
  });

  breaker.on('fallback', () => {
    logger.info('Circuit breaker fallback triggered', { name });
  });

  return breaker;
}

// Pre-configured breakers
export const googleSheetsBreaker = createCircuitBreaker(
  'google-sheets',
  async (fn: () => Promise<unknown>) => fn(),
  {
    timeout: 15000,
    errorThresholdPercentage: 50,
    resetTimeout: 30000,
  }
);

googleSheetsBreaker.fallback(() => ({
  success: false,
  queued: true,
  message: 'Google Sheets service temporarily unavailable, request queued',
}));
```

### 7. Database Connection Pooling

```typescript
// api/src/utils/prisma.ts
import { PrismaClient } from '@prisma/client';
import { logger } from './logger';

const SLOW_QUERY_THRESHOLD = 100; // ms

export const prisma = new PrismaClient({
  log: [
    { level: 'query', emit: 'event' },
    { level: 'warn', emit: 'stdout' },
    { level: 'error', emit: 'stdout' },
  ],
});

// Log slow queries
prisma.$on('query', (e) => {
  if (e.duration > SLOW_QUERY_THRESHOLD) {
    logger.warn('Slow query detected', {
      duration: e.duration,
      query: e.query.substring(0, 500), // Truncate long queries
      params: e.params,
    });
  }
});

// Graceful shutdown
process.on('beforeExit', async () => {
  logger.info('Disconnecting Prisma client');
  await prisma.$disconnect();
});
```

```
# .env - Database URL with connection pool settings
DATABASE_URL="postgresql://user:pass@host:5432/db?connection_limit=50&pool_timeout=30"
```

### 8. Prometheus Metrics

```typescript
// api/src/middleware/prometheus.ts
import { Context, Next } from 'hono';

interface Metrics {
  httpRequestsTotal: Map<string, number>;
  httpRequestDuration: number[];
  dbQueryDuration: number[];
  cacheHits: number;
  cacheMisses: number;
  queueJobsTotal: Map<string, number>;
  rateLimitExceeded: Map<string, number>;
}

class PrometheusMetrics {
  private metrics: Metrics = {
    httpRequestsTotal: new Map(),
    httpRequestDuration: [],
    dbQueryDuration: [],
    cacheHits: 0,
    cacheMisses: 0,
    queueJobsTotal: new Map(),
    rateLimitExceeded: new Map(),
  };

  recordHttpRequest(method: string, path: string, status: number, duration: number) {
    const key = `${method}:${path}:${status}`;
    this.metrics.httpRequestsTotal.set(key, (this.metrics.httpRequestsTotal.get(key) || 0) + 1);
    this.metrics.httpRequestDuration.push(duration);
  }

  recordCacheHit() { this.metrics.cacheHits++; }
  recordCacheMiss() { this.metrics.cacheMisses++; }

  recordQueueJob(queue: string, status: 'completed' | 'failed') {
    const key = `${queue}:${status}`;
    this.metrics.queueJobsTotal.set(key, (this.metrics.queueJobsTotal.get(key) || 0) + 1);
  }

  recordRateLimitExceeded(ip: string, path: string) {
    const key = `${ip}:${path}`;
    this.metrics.rateLimitExceeded.set(key, (this.metrics.rateLimitExceeded.get(key) || 0) + 1);
  }

  toPrometheusFormat(): string {
    const lines: string[] = [];

    // HTTP requests total
    lines.push('# HELP http_requests_total Total HTTP requests');
    lines.push('# TYPE http_requests_total counter');
    this.metrics.httpRequestsTotal.forEach((count, key) => {
      const [method, path, status] = key.split(':');
      lines.push(`http_requests_total{method="${method}",path="${path}",status="${status}"} ${count}`);
    });

    // HTTP request duration
    lines.push('# HELP http_request_duration_seconds HTTP request duration');
    lines.push('# TYPE http_request_duration_seconds histogram');
    const durations = this.metrics.httpRequestDuration;
    if (durations.length > 0) {
      const sum = durations.reduce((a, b) => a + b, 0);
      lines.push(`http_request_duration_seconds_sum ${sum / 1000}`);
      lines.push(`http_request_duration_seconds_count ${durations.length}`);
    }

    // Cache metrics
    lines.push('# HELP cache_hits_total Total cache hits');
    lines.push('# TYPE cache_hits_total counter');
    lines.push(`cache_hits_total ${this.metrics.cacheHits}`);
    lines.push('# HELP cache_misses_total Total cache misses');
    lines.push('# TYPE cache_misses_total counter');
    lines.push(`cache_misses_total ${this.metrics.cacheMisses}`);

    // Queue metrics
    lines.push('# HELP queue_jobs_total Total queue jobs');
    lines.push('# TYPE queue_jobs_total counter');
    this.metrics.queueJobsTotal.forEach((count, key) => {
      const [queue, status] = key.split(':');
      lines.push(`queue_jobs_total{queue="${queue}",status="${status}"} ${count}`);
    });

    // Rate limit metrics
    lines.push('# HELP rate_limit_exceeded_total Total rate limit exceeded');
    lines.push('# TYPE rate_limit_exceeded_total counter');
    this.metrics.rateLimitExceeded.forEach((count, key) => {
      const [ip, path] = key.split(':');
      lines.push(`rate_limit_exceeded_total{ip="${ip}",path="${path}"} ${count}`);
    });

    return lines.join('\n');
  }
}

export const prometheusMetrics = new PrometheusMetrics();

export function metricsMiddleware() {
  return async (c: Context, next: Next) => {
    const start = Date.now();
    await next();
    const duration = Date.now() - start;
    
    prometheusMetrics.recordHttpRequest(
      c.req.method,
      c.req.path,
      c.res.status,
      duration
    );
  };
}
```

### 9. Frontend Debounce Hooks

```typescript
// landing/src/app/hooks/useDebounce.ts
import { useState, useEffect, useRef, useCallback } from 'react';

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export function useDebouncedCallback<T extends (...args: unknown[]) => unknown>(
  callback: T,
  delay: number
): [T, boolean] {
  const [isPending, setIsPending] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout>();

  const debouncedCallback = useCallback(
    (...args: Parameters<T>) => {
      setIsPending(true);
      
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        callback(...args);
        setIsPending(false);
      }, delay);
    },
    [callback, delay]
  ) as T;

  return [debouncedCallback, isPending];
}

export function useThrottle<T>(value: T, interval: number): T {
  const [throttledValue, setThrottledValue] = useState<T>(value);
  const lastUpdated = useRef<number>(Date.now());

  useEffect(() => {
    const now = Date.now();
    
    if (now - lastUpdated.current >= interval) {
      lastUpdated.current = now;
      setThrottledValue(value);
    } else {
      const timeoutId = setTimeout(() => {
        lastUpdated.current = Date.now();
        setThrottledValue(value);
      }, interval - (now - lastUpdated.current));

      return () => clearTimeout(timeoutId);
    }
  }, [value, interval]);

  return throttledValue;
}
```

### 10. LocalStorage Persistence

```typescript
// landing/src/app/hooks/useLocalStoragePersistence.ts
import { useState, useEffect, useCallback } from 'react';

interface PersistenceOptions {
  key: string;
  ttlHours?: number;
  onRestore?: () => void;
}

interface StoredData<T> {
  data: T;
  timestamp: number;
}

export function useLocalStoragePersistence<T>(
  initialValue: T,
  options: PersistenceOptions
): [T, (value: T) => void, () => void] {
  const { key, ttlHours = 24, onRestore } = options;
  
  const [value, setValue] = useState<T>(() => {
    try {
      const stored = localStorage.getItem(key);
      if (!stored) return initialValue;
      
      const parsed: StoredData<T> = JSON.parse(stored);
      const ageHours = (Date.now() - parsed.timestamp) / (1000 * 60 * 60);
      
      if (ageHours > ttlHours) {
        localStorage.removeItem(key);
        return initialValue;
      }
      
      // Notify that we restored data
      if (onRestore) {
        setTimeout(onRestore, 0);
      }
      
      return parsed.data;
    } catch {
      return initialValue;
    }
  });

  const persistValue = useCallback((newValue: T) => {
    setValue(newValue);
    const stored: StoredData<T> = {
      data: newValue,
      timestamp: Date.now(),
    };
    localStorage.setItem(key, JSON.stringify(stored));
  }, [key]);

  const clearValue = useCallback(() => {
    setValue(initialValue);
    localStorage.removeItem(key);
  }, [key, initialValue]);

  return [value, persistValue, clearValue];
}

// Storage keys
export const StorageKeys = {
  quoteCalculator: 'ath:quote-calculator',
  furnitureQuote: 'ath:furniture-quote',
};
```

### 11. Client-side Validation

```typescript
// packages/shared/src/schemas/lead.schema.ts
import { z } from 'zod';

export const phoneSchema = z.string()
  .regex(/^[0-9]{10,11}$/, 'Số điện thoại phải có 10-11 chữ số');

export const emailSchema = z.string()
  .email('Email không hợp lệ')
  .optional()
  .or(z.literal(''));

export const nameSchema = z.string()
  .min(2, 'Tên phải có ít nhất 2 ký tự')
  .max(100, 'Tên không được quá 100 ký tự');

export const leadFormSchema = z.object({
  name: nameSchema,
  phone: phoneSchema,
  email: emailSchema,
  content: z.string().min(10, 'Nội dung phải có ít nhất 10 ký tự'),
});

export type LeadFormData = z.infer<typeof leadFormSchema>;
```

```typescript
// landing/src/app/hooks/useFormValidation.ts
import { useState, useCallback } from 'react';
import { z, ZodSchema } from 'zod';

interface ValidationState {
  errors: Record<string, string>;
  isValid: boolean;
  touched: Record<string, boolean>;
}

export function useFormValidation<T extends Record<string, unknown>>(
  schema: ZodSchema<T>
) {
  const [state, setState] = useState<ValidationState>({
    errors: {},
    isValid: false,
    touched: {},
  });

  const validateField = useCallback((field: keyof T, value: unknown) => {
    try {
      // Get the field schema
      const fieldSchema = (schema as z.ZodObject<z.ZodRawShape>).shape[field as string];
      if (fieldSchema) {
        fieldSchema.parse(value);
        setState(prev => ({
          ...prev,
          errors: { ...prev.errors, [field]: '' },
          touched: { ...prev.touched, [field]: true },
        }));
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        setState(prev => ({
          ...prev,
          errors: { ...prev.errors, [field]: error.errors[0]?.message || 'Invalid' },
          touched: { ...prev.touched, [field]: true },
        }));
      }
    }
  }, [schema]);

  const validateAll = useCallback((data: Partial<T>): boolean => {
    const result = schema.safeParse(data);
    
    if (result.success) {
      setState(prev => ({ ...prev, errors: {}, isValid: true }));
      return true;
    }
    
    const errors: Record<string, string> = {};
    result.error.errors.forEach(err => {
      const field = err.path[0] as string;
      if (!errors[field]) {
        errors[field] = err.message;
      }
    });
    
    setState(prev => ({ ...prev, errors, isValid: false }));
    return false;
  }, [schema]);

  const handleBlur = useCallback((field: keyof T, value: unknown) => {
    validateField(field, value);
  }, [validateField]);

  return {
    errors: state.errors,
    isValid: state.isValid,
    touched: state.touched,
    validateField,
    validateAll,
    handleBlur,
  };
}
```

### 12. Queue Health Monitoring

```typescript
// api/src/services/queue-health.service.ts
import { Queue } from 'bullmq';
import { logger } from '../utils/logger';

interface QueueHealth {
  name: string;
  depth: number;
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
  processingRate: number; // jobs per minute
  avgProcessingTime: number; // ms
  isHealthy: boolean;
}

const DEPTH_WARNING_THRESHOLD = 1000;
const DEPTH_CRITICAL_THRESHOLD = 5000;

export class QueueHealthService {
  private queues: Map<string, Queue> = new Map();
  private processingTimes: Map<string, number[]> = new Map();

  registerQueue(name: string, queue: Queue) {
    this.queues.set(name, queue);
    this.processingTimes.set(name, []);
  }

  recordProcessingTime(queueName: string, duration: number) {
    const times = this.processingTimes.get(queueName) || [];
    times.push(duration);
    // Keep last 100 entries
    if (times.length > 100) times.shift();
    this.processingTimes.set(queueName, times);
  }

  async getQueueHealth(queueName: string): Promise<QueueHealth | null> {
    const queue = this.queues.get(queueName);
    if (!queue) return null;

    const [waiting, active, completed, failed, delayed] = await Promise.all([
      queue.getWaitingCount(),
      queue.getActiveCount(),
      queue.getCompletedCount(),
      queue.getFailedCount(),
      queue.getDelayedCount(),
    ]);

    const depth = waiting + active + delayed;
    const times = this.processingTimes.get(queueName) || [];
    const avgProcessingTime = times.length > 0
      ? times.reduce((a, b) => a + b, 0) / times.length
      : 0;

    const isHealthy = depth < DEPTH_WARNING_THRESHOLD;

    if (depth >= DEPTH_CRITICAL_THRESHOLD) {
      logger.error('Queue depth critical', { queueName, depth });
    } else if (depth >= DEPTH_WARNING_THRESHOLD) {
      logger.warn('Queue depth warning', { queueName, depth });
    }

    return {
      name: queueName,
      depth,
      waiting,
      active,
      completed,
      failed,
      delayed,
      processingRate: 0, // Calculate from completed count over time
      avgProcessingTime,
      isHealthy,
    };
  }

  async getAllQueuesHealth(): Promise<QueueHealth[]> {
    const results: QueueHealth[] = [];
    for (const name of this.queues.keys()) {
      const health = await this.getQueueHealth(name);
      if (health) results.push(health);
    }
    return results;
  }

  async canAcceptJob(queueName: string): Promise<boolean> {
    const health = await this.getQueueHealth(queueName);
    if (!health) return true;
    
    if (health.depth >= DEPTH_CRITICAL_THRESHOLD) {
      logger.error('Queue full, rejecting job', { queueName, depth: health.depth });
      return false;
    }
    return true;
  }
}

export const queueHealthService = new QueueHealthService();
```

### 13. Google Sheets Batch Service

```typescript
// api/src/services/google-sheets-batch.service.ts
import { google, sheets_v4 } from 'googleapis';
import { logger } from '../utils/logger';
import { withLock, LockKeys } from '../utils/distributed-lock';
import { googleSheetsBreaker } from '../utils/circuit-breaker';

const BATCH_SIZE = 100;
const MAX_RETRIES = 3;

interface BatchSyncResult {
  success: boolean;
  totalRows: number;
  batchesProcessed: number;
  failedBatches: number;
}

export class GoogleSheetsBatchService {
  private sheets: sheets_v4.Sheets;

  constructor(auth: any) {
    this.sheets = google.sheets({ version: 'v4', auth });
  }

  async batchAppend(
    spreadsheetId: string,
    range: string,
    rows: unknown[][]
  ): Promise<BatchSyncResult> {
    const totalRows = rows.length;
    const batches = this.splitIntoBatches(rows, BATCH_SIZE);
    let batchesProcessed = 0;
    let failedBatches = 0;

    logger.info('Starting batch sync', {
      spreadsheetId,
      totalRows,
      totalBatches: batches.length,
    });

    // Use distributed lock to prevent concurrent syncs
    return withLock(
      LockKeys.googleSheetsSync(spreadsheetId),
      60000, // 60 second lock
      async () => {
        for (let i = 0; i < batches.length; i++) {
          const batch = batches[i];
          
          logger.info('Processing batch', {
            batchNumber: i + 1,
            totalBatches: batches.length,
            batchSize: batch.length,
          });

          const success = await this.appendBatchWithRetry(
            spreadsheetId,
            range,
            batch
          );

          if (success) {
            batchesProcessed++;
          } else {
            failedBatches++;
          }
        }

        return {
          success: failedBatches === 0,
          totalRows,
          batchesProcessed,
          failedBatches,
        };
      }
    );
  }

  private splitIntoBatches<T>(items: T[], batchSize: number): T[][] {
    const batches: T[][] = [];
    for (let i = 0; i < items.length; i += batchSize) {
      batches.push(items.slice(i, i + batchSize));
    }
    return batches;
  }

  private async appendBatchWithRetry(
    spreadsheetId: string,
    range: string,
    rows: unknown[][]
  ): Promise<boolean> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        // Use circuit breaker
        await googleSheetsBreaker.fire(async () => {
          await this.sheets.spreadsheets.values.append({
            spreadsheetId,
            range,
            valueInputOption: 'USER_ENTERED',
            requestBody: { values: rows },
          });
        });
        return true;
      } catch (error) {
        lastError = error as Error;
        logger.warn('Batch append failed, retrying', {
          attempt,
          maxRetries: MAX_RETRIES,
          error: lastError.message,
        });

        if (attempt < MAX_RETRIES) {
          // Exponential backoff
          await new Promise(resolve => 
            setTimeout(resolve, Math.pow(2, attempt) * 1000)
          );
        }
      }
    }

    logger.error('Batch append failed after all retries', {
      error: lastError?.message,
    });
    return false;
  }
}
```

### 14. Per-User Rate Limiter

```typescript
// api/src/middleware/user-rate-limiter.ts
import { Context, Next } from 'hono';
import { redis } from '../config/redis';
import { logger } from '../utils/logger';

interface UserRateLimitConfig {
  windowMs: number;
  maxAttempts: number;
  roleMultipliers?: Record<string, number>;
}

const DEFAULT_CONFIG: UserRateLimitConfig = {
  windowMs: 60000, // 1 minute
  maxAttempts: 100,
  roleMultipliers: {
    ADMIN: 5,
    MANAGER: 3,
    CONTRACTOR: 1.5,
    HOMEOWNER: 1,
    USER: 1,
  },
};

export function userRateLimiter(config: Partial<UserRateLimitConfig> = {}) {
  const { windowMs, maxAttempts, roleMultipliers } = { ...DEFAULT_CONFIG, ...config };

  return async (c: Context, next: Next) => {
    const user = c.get('user');
    
    // Skip if not authenticated
    if (!user) {
      return next();
    }

    const userId = user.id;
    const userRole = user.role || 'USER';
    const multiplier = roleMultipliers?.[userRole] || 1;
    const effectiveLimit = Math.floor(maxAttempts * multiplier);

    const key = `rate-limit:user:${userId}`;
    const now = Date.now();
    const windowStart = now - windowMs;

    try {
      // Remove old entries
      await redis.zremrangebyscore(key, 0, windowStart);
      
      // Count current entries
      const count = await redis.zcard(key);
      
      // Set headers
      c.header('X-RateLimit-User-Limit', effectiveLimit.toString());
      c.header('X-RateLimit-User-Remaining', Math.max(0, effectiveLimit - count - 1).toString());
      c.header('X-RateLimit-User-Reset', Math.ceil((now + windowMs) / 1000).toString());

      if (count >= effectiveLimit) {
        logger.warn('User rate limit exceeded', { userId, userRole, count, limit: effectiveLimit });
        
        return c.json({
          success: false,
          error: {
            code: 'RATE_LIMITED_USER',
            message: 'Too many requests. Please try again later.',
          },
        }, 429);
      }

      // Add current request
      await redis.zadd(key, now, `${now}-${Math.random()}`);
      await redis.expire(key, Math.ceil(windowMs / 1000));

      return next();
    } catch (error) {
      logger.error('User rate limiter error', { error: (error as Error).message });
      // Allow request on error
      return next();
    }
  };
}
```

## Data Models

### Queue Job Models

```typescript
// api/src/types/queue.types.ts

export interface BaseJob {
  correlationId: string;
  createdAt: number;
  priority?: number;
}

export interface EmailJob extends BaseJob {
  type: 'quotation' | 'notification' | 'welcome' | 'password-reset';
  to: string;
  subject?: string;
  templateId: string;
  data: Record<string, unknown>;
}

export interface SyncJob extends BaseJob {
  type: 'google-sheets' | 'external-api';
  target: string;
  operation: 'append' | 'update' | 'batch-append';
  data: unknown[];
}

export interface NotificationJob extends BaseJob {
  userId: string;
  type: string;
  title: string;
  content: string;
  data?: Record<string, unknown>;
  channels: ('in-app' | 'email' | 'sms')[];
}

export interface RankingJob extends BaseJob {
  type: 'recalculate-all' | 'recalculate-single';
  contractorId?: string;
}
```

### Cache Entry Models

```typescript
// api/src/types/cache.types.ts

export interface CacheEntry<T> {
  data: T;
  cachedAt: number;
  ttl: number;
  version?: string;
}

export interface IdempotencyEntry {
  status: number;
  body: unknown;
  headers: Record<string, string>;
  createdAt: number;
  requestHash?: string;
}

export interface RateLimitViolation {
  ip: string;
  path: string;
  count: number;
  firstViolation: number;
  lastViolation: number;
}
```



## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

Based on the prework analysis, the following correctness properties have been identified:

### Property 1: Queue job response time
*For any* email/notification request, the API response time SHALL be less than 200ms when the job is queued successfully.
**Validates: Requirements 1.1**

### Property 2: Queue retry with exponential backoff
*For any* failed queue job, the system SHALL retry up to 3 times with delays following exponential backoff pattern (1s, 2s, 4s).
**Validates: Requirements 1.2**

### Property 3: Queue fallback on Redis failure
*For any* queue operation when Redis is unavailable, the system SHALL fall back to synchronous processing and complete the operation.
**Validates: Requirements 1.6**

### Property 4: Cache returns data with correct TTL
*For any* cacheable resource (categories, materials, settings, regions), fetching the same resource twice within TTL SHALL return identical data without database query on second fetch.
**Validates: Requirements 2.1, 2.2, 2.3, 2.4**

### Property 5: Cache invalidation on modification
*For any* cached resource that is modified through admin panel, subsequent fetches SHALL return the updated data (cache miss).
**Validates: Requirements 2.5**

### Property 6: Cache status header
*For any* cacheable API response, the X-Cache-Status header SHALL be "HIT" when data comes from cache and "MISS" when data comes from database.
**Validates: Requirements 2.7, 2.8**

### Property 7: CAPTCHA verification required
*For any* public form submission (lead, quote, registration), the request SHALL be rejected with CAPTCHA_FAILED error if Turnstile token is missing or invalid.
**Validates: Requirements 3.1, 3.2, 3.3, 3.4**

### Property 8: Slow query logging
*For any* database query taking longer than 100ms, the system SHALL log the query with duration and query text.
**Validates: Requirements 4.2**

### Property 9: Connection pool reuse
*For any* sequence of N database operations, the number of active connections SHALL remain stable (not increase linearly with N).
**Validates: Requirements 4.5**

### Property 10: Lock acquisition for critical operations
*For any* critical operation (token refresh, ranking recalculation, Google Sheets sync), the system SHALL acquire a distributed lock before processing.
**Validates: Requirements 5.1, 5.2, 5.3**

### Property 11: Lock timeout error
*For any* lock acquisition that cannot complete within 5 seconds, the system SHALL return LOCK_TIMEOUT error with status 503.
**Validates: Requirements 5.4**

### Property 12: Lock auto-release on TTL
*For any* acquired lock, if the lock holder crashes, the lock SHALL be automatically released after TTL expires (30 seconds).
**Validates: Requirements 5.5**

### Property 13: Idempotency duplicate detection
*For any* request with Idempotency-Key header, sending the same request twice SHALL return identical responses without processing the second request.
**Validates: Requirements 6.1, 6.2**

### Property 14: Idempotency cache TTL
*For any* idempotent request result, the cached result SHALL be available for 24 hours and allow reprocessing after expiry.
**Validates: Requirements 6.3, 6.5**

### Property 15: Rate limit violation logging
*For any* rate limit exceeded event, the system SHALL log the violation with IP address, path, and timestamp.
**Validates: Requirements 7.1**

### Property 16: Rate limit alert threshold
*For any* IP that exceeds rate limit 10 times within 5 minutes, the system SHALL trigger an alert.
**Validates: Requirements 7.2**

### Property 17: Circuit breaker opens on failures
*For any* external service (Google Sheets) that fails 5 times consecutively, the circuit breaker SHALL open and return fallback response for 30 seconds.
**Validates: Requirements 8.1, 8.2**

### Property 18: Circuit breaker half-open state
*For any* open circuit after reset timeout, the system SHALL allow one test request and close circuit if successful.
**Validates: Requirements 8.3, 8.4, 8.5**

### Property 19: Debounce timing
*For any* user input in debounced fields, the handler SHALL not be called until the specified delay has passed since last input (300ms for area, 500ms for search).
**Validates: Requirements 9.1, 9.2, 9.4**

### Property 20: LocalStorage persistence round-trip
*For any* quote form state, saving to localStorage and then restoring SHALL produce equivalent state.
**Validates: Requirements 10.1, 10.2**

### Property 21: LocalStorage expiry
*For any* saved quote form state older than 24 hours, the system SHALL discard it and start fresh.
**Validates: Requirements 10.4**

### Property 22: Field validation error messages
*For any* invalid field input (phone, email, name), the validation SHALL show appropriate error message with format hint.
**Validates: Requirements 11.2, 11.3, 11.4**

### Property 23: Submit button state
*For any* form state, the submit button SHALL be enabled if and only if all required fields are valid.
**Validates: Requirements 11.5, 11.6**

### Property 24: Prometheus metrics format
*For any* /metrics endpoint response, the format SHALL be valid Prometheus text format with required metrics (http_requests_total, http_request_duration_seconds, cache_hits_total, etc.).
**Validates: Requirements 12.1, 12.2, 12.3, 12.5, 12.6, 12.7**

### Property 25: Queue depth alerting
*For any* queue with depth exceeding 1000 jobs, the system SHALL log a warning and trigger an alert.
**Validates: Requirements 13.1**

### Property 26: Queue backpressure rejection
*For any* queue with depth exceeding 5000 jobs, new jobs SHALL be rejected with QUEUE_FULL error and status 503.
**Validates: Requirements 13.5**

### Property 27: Google Sheets batch size
*For any* Google Sheets sync with N rows where N > 100, the system SHALL split into ceil(N/100) batches.
**Validates: Requirements 14.1, 14.4**

### Property 28: Per-user rate limiting
*For any* authenticated user, rate limiting SHALL be applied based on user ID independently of IP-based limiting.
**Validates: Requirements 15.1, 15.5**

### Property 29: Role-based rate limits
*For any* admin user, the rate limit SHALL be 5x higher than normal users.
**Validates: Requirements 15.3**

## Error Handling

### Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `CAPTCHA_REQUIRED` | 400 | Turnstile token missing |
| `CAPTCHA_FAILED` | 400 | Turnstile verification failed |
| `LOCK_TIMEOUT` | 503 | Failed to acquire distributed lock |
| `QUEUE_FULL` | 503 | Queue depth exceeded maximum |
| `SERVICE_UNAVAILABLE` | 503 | Circuit breaker open |
| `RATE_LIMITED` | 429 | Rate limit exceeded |
| `RATE_LIMITED_USER` | 429 | User-based rate limit exceeded |

### Fallback Strategies

| Component | Failure Mode | Fallback |
|-----------|--------------|----------|
| Redis Cache | Connection lost | Query database directly |
| Redis Queue | Connection lost | Process synchronously |
| Redis Lock | Connection lost | Skip locking, log warning |
| Google Sheets | API errors | Queue for retry, return success |
| Turnstile | API timeout | Allow request (dev only) |

### Retry Policies

| Operation | Max Retries | Backoff | Timeout |
|-----------|-------------|---------|---------|
| Email sending | 3 | Exponential (1s, 2s, 4s) | 30s |
| Google Sheets sync | 3 | Exponential (1s, 2s, 4s) | 15s |
| Notification delivery | 3 | Exponential (1s, 2s, 4s) | 10s |
| Lock acquisition | 3 | Linear (200ms) | 5s |

## Testing Strategy

### Dual Testing Approach

This feature requires both unit tests and property-based tests:

- **Unit tests**: Verify specific examples, edge cases, and error conditions
- **Property-based tests**: Verify universal properties that should hold across all inputs

### Property-Based Testing Framework

We will use **fast-check** for property-based testing in TypeScript.

```bash
pnpm add -D fast-check
```

### Test Categories

#### 1. Queue System Tests
- Unit tests for job creation and processing
- Property tests for retry behavior and timing
- Integration tests for Redis connection handling

#### 2. Cache Tests
- Unit tests for cache hit/miss scenarios
- Property tests for TTL behavior
- Property tests for cache invalidation

#### 3. CAPTCHA Tests
- Unit tests for token verification
- Property tests for error responses
- Integration tests with Turnstile API (mocked)

#### 4. Distributed Lock Tests
- Unit tests for lock acquisition/release
- Property tests for TTL expiry
- Property tests for concurrent access

#### 5. Idempotency Tests
- Property tests for duplicate detection
- Property tests for cache TTL
- Unit tests for header handling

#### 6. Circuit Breaker Tests
- Property tests for state transitions
- Unit tests for failure counting
- Property tests for timeout behavior

#### 7. Frontend Tests
- Property tests for debounce timing
- Property tests for localStorage persistence
- Unit tests for validation logic

### Test Annotations

Each property-based test MUST be tagged with:
```typescript
/**
 * **Feature: production-scalability, Property 1: Queue job response time**
 * **Validates: Requirements 1.1**
 */
```

### Minimum Iterations

Each property-based test MUST run a minimum of 100 iterations to ensure adequate coverage.

