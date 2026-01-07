# 🏗️ Production Readiness - Design Document

## Overview
Document này mô tả thiết kế kỹ thuật để đưa hệ thống lên production.

---

## 1. DATABASE MIGRATION DESIGN

### 1.1 Current State
```prisma
datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}
```

### 1.2 Target State
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

### 1.3 Migration Strategy

#### Step 1: Schema Update
```prisma
// infra/prisma/schema.prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// Add connection pooling
generator client {
  provider = "prisma-client-js"
  previewFeatures = ["driverAdapters"]
}
```

#### Step 2: Index Verification
Verify các indexes đã có trong schema:
- User: role, verificationStatus
- Session: tokenSelector
- Project: status, ownerId, regionId, categoryId
- Bid: projectId, contractorId, status
- Notification: userId, isRead, type, createdAt

#### Step 3: Data Migration
```bash
# Export SQLite data
sqlite3 dev.db .dump > backup.sql

# Create PostgreSQL database
createdb anhthoxay_prod

# Run Prisma migration
npx prisma migrate deploy

# Import data (if needed)
npx prisma db seed
```

---

## 2. SECURITY HARDENING DESIGN

### 2.1 XSS Fix Strategy

#### Files cần fix (9 files):
1. `admin/src/app/components/MarkdownEditor.tsx`
2. `admin/src/app/components/RichTextEditor.tsx`
3. `admin/src/app/components/SectionEditor/previews/richtext/blocks/ParagraphBlock.tsx`
4. `admin/src/app/components/SectionEditor/previews/RichTextPreview.tsx`
5. `admin/src/app/components/VisualBlockEditor/components/BlocksPreview.tsx`
6. `admin/src/app/pages/NotificationTemplatesPage/TemplateEditModal.tsx`
7. `landing/src/app/sections/RichTextSection/blocks/ParagraphBlock.tsx`
8. `landing/src/app/sections/RichTextSection/RichTextSection.tsx`
9. `landing/src/app/utils/simpleMarkdown.tsx`

#### Solution Pattern:
```typescript
// BEFORE
<div dangerouslySetInnerHTML={{ __html: content }} />

// AFTER
import DOMPurify from 'dompurify';

const sanitizedContent = DOMPurify.sanitize(content, {
  ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'a', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'code', 'pre'],
  ALLOWED_ATTR: ['href', 'target', 'rel', 'class'],
});

<div dangerouslySetInnerHTML={{ __html: sanitizedContent }} />
```

### 2.2 Console Logs Cleanup

#### Strategy:
1. Create ESLint rule to prevent console statements
2. Use structured logger instead

```typescript
// api/src/utils/logger.ts - Enhanced
export const logger = {
  info: (message: string, meta?: object) => {
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[INFO] ${message}`, meta);
    }
    // In production, send to logging service
  },
  warn: (message: string, meta?: object) => {
    console.warn(`[WARN] ${message}`, meta);
  },
  error: (message: string, error?: Error, meta?: object) => {
    console.error(`[ERROR] ${message}`, error, meta);
    // In production, send to error tracking
  },
};
```

### 2.3 Environment Validation

```typescript
// api/src/config/env-validation.ts
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']),
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(32),
  REDIS_URL: z.string().optional(),
  CORS_ORIGINS: z.string().optional(),
});

export function validateEnvironment() {
  const result = envSchema.safeParse(process.env);
  
  if (!result.success) {
    console.error('❌ Invalid environment variables:');
    console.error(result.error.format());
    process.exit(1);
  }
  
  return result.data;
}
```

### 2.4 Security Headers

```typescript
// api/src/middleware/security-headers.ts - Enhanced
export function securityHeaders() {
  return async (c: Context, next: Next) => {
    // Existing headers
    c.header('X-Content-Type-Options', 'nosniff');
    c.header('X-Frame-Options', 'DENY');
    c.header('X-XSS-Protection', '1; mode=block');
    c.header('Referrer-Policy', 'strict-origin-when-cross-origin');
    
    // NEW: Critical security headers
    c.header('Content-Security-Policy', [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "font-src 'self' data:",
      "connect-src 'self' https:",
    ].join('; '));
    
    c.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    c.header('X-Permitted-Cross-Domain-Policies', 'none');
    c.header('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    
    await next();
  };
}
```

---

## 3. REDIS INTEGRATION DESIGN

### 3.1 Redis Client Setup

```typescript
// packages/shared/src/redis.ts
import Redis from 'ioredis';

let redisClient: Redis | null = null;

export function getRedisClient(): Redis {
  if (!redisClient) {
    const redisUrl = process.env.REDIS_URL;
    
    if (!redisUrl) {
      throw new Error('REDIS_URL environment variable is required');
    }
    
    redisClient = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      retryDelayOnFailover: 100,
      enableReadyCheck: true,
    });
    
    redisClient.on('error', (err) => {
      console.error('Redis connection error:', err);
    });
    
    redisClient.on('connect', () => {
      console.log('✅ Redis connected');
    });
  }
  
  return redisClient;
}
```

### 3.2 Rate Limiter Migration

```typescript
// api/src/middleware/redis-rate-limiter.ts
import { Context, Next } from 'hono';
import { getRedisClient } from '@app/shared';

interface RateLimiterOptions {
  maxAttempts?: number;
  windowMs?: number;
  keyPrefix?: string;
}

export function redisRateLimiter(options: RateLimiterOptions = {}) {
  const {
    maxAttempts = 100,
    windowMs = 60 * 1000, // 1 minute
    keyPrefix = 'rate_limit',
  } = options;
  
  return async (c: Context, next: Next) => {
    const redis = getRedisClient();
    const ip = c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || 'unknown';
    const key = `${keyPrefix}:${ip}:${c.req.path}`;
    
    const now = Date.now();
    const windowStart = now - windowMs;
    
    // Use Redis sorted set for sliding window
    const pipeline = redis.pipeline();
    pipeline.zremrangebyscore(key, '-inf', windowStart);
    pipeline.zadd(key, now, now.toString());
    pipeline.zcard(key);
    pipeline.expire(key, Math.ceil(windowMs / 1000));
    
    const results = await pipeline.exec();
    const count = results?.[2]?.[1] as number || 0;
    
    // Set rate limit headers
    c.header('X-RateLimit-Limit', maxAttempts.toString());
    c.header('X-RateLimit-Remaining', Math.max(0, maxAttempts - count).toString());
    c.header('X-RateLimit-Reset', Math.ceil((now + windowMs) / 1000).toString());
    
    if (count > maxAttempts) {
      return c.json({
        success: false,
        error: {
          code: 'RATE_LIMITED',
          message: 'Too many requests. Please try again later.',
        },
      }, 429);
    }
    
    await next();
  };
}
```

### 3.3 Response Caching

```typescript
// api/src/middleware/cache.ts
import { Context, Next } from 'hono';
import { getRedisClient } from '@app/shared';

interface CacheOptions {
  ttl?: number; // seconds
  keyGenerator?: (c: Context) => string;
}

export function cacheResponse(options: CacheOptions = {}) {
  const { ttl = 300, keyGenerator } = options;
  
  return async (c: Context, next: Next) => {
    const redis = getRedisClient();
    const key = keyGenerator?.(c) || `cache:${c.req.method}:${c.req.path}`;
    
    // Check cache
    const cached = await redis.get(key);
    if (cached) {
      c.header('X-Cache', 'HIT');
      return c.json(JSON.parse(cached));
    }
    
    // Execute handler
    await next();
    
    // Cache response (only for successful responses)
    const response = c.res;
    if (response.status === 200) {
      const body = await response.clone().text();
      await redis.setex(key, ttl, body);
      c.header('X-Cache', 'MISS');
    }
  };
}
```

---

## 4. CODE REFACTORING DESIGN

### 4.1 furniture-product.service.ts Refactoring

**Current:** 1,212 lines, 40+ methods

**Target Structure:**
```
api/src/services/furniture/
├── product/
│   ├── crud.service.ts        # CRUD operations (~200 lines)
│   ├── calculation.service.ts # Price calculations (~150 lines)
│   ├── import.service.ts      # CSV import (~200 lines)
│   ├── mapping.service.ts     # Product mappings (~150 lines)
│   └── index.ts               # Re-exports
├── furniture-product.service.ts # Facade (~100 lines)
└── furniture.types.ts         # Types (keep as is)
```

### 4.2 admin/api/furniture.ts Refactoring

**Current:** 1,070 lines

**Target Structure:**
```
admin/src/app/api/furniture/
├── products.ts    # Product APIs (~200 lines)
├── categories.ts  # Category APIs (~100 lines)
├── developers.ts  # Developer APIs (~100 lines)
├── layouts.ts     # Layout APIs (~150 lines)
├── quotations.ts  # Quotation APIs (~200 lines)
└── index.ts       # Re-exports
```

### 4.3 QuotationResult.tsx Refactoring

**Current:** 1,052 lines

**Target Structure:**
```
landing/src/app/sections/FurnitureQuote/QuotationResult/
├── QuotationResult.tsx      # Main component (~200 lines)
├── components/
│   ├── QuotationHeader.tsx  # Header section (~100 lines)
│   ├── ProductList.tsx      # Product list (~150 lines)
│   ├── PriceSummary.tsx     # Price summary (~100 lines)
│   ├── ActionButtons.tsx    # Action buttons (~100 lines)
│   └── index.ts
├── hooks/
│   ├── useQuotationData.ts  # Data fetching (~100 lines)
│   └── useQuotationActions.ts # Actions (~100 lines)
└── index.ts
```

---

## 5. MONITORING DESIGN

### 5.1 Health Check Endpoint

```typescript
// api/src/routes/health.routes.ts
import { Hono } from 'hono';
import { prisma } from '../lib/prisma';
import { getRedisClient } from '@app/shared';

export function createHealthRoutes() {
  const app = new Hono();
  
  app.get('/health', async (c) => {
    const checks = {
      database: false,
      redis: false,
    };
    
    try {
      await prisma.$queryRaw`SELECT 1`;
      checks.database = true;
    } catch (e) {
      // Database check failed
    }
    
    try {
      const redis = getRedisClient();
      await redis.ping();
      checks.redis = true;
    } catch (e) {
      // Redis check failed
    }
    
    const healthy = Object.values(checks).every(Boolean);
    
    return c.json({
      status: healthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      checks,
    }, healthy ? 200 : 503);
  });
  
  app.get('/health/ready', async (c) => {
    // Readiness check - can accept traffic
    return c.json({ status: 'ready' });
  });
  
  app.get('/health/live', async (c) => {
    // Liveness check - process is running
    return c.json({ status: 'alive' });
  });
  
  return app;
}
```

### 5.2 Response Time Monitoring

```typescript
// api/src/middleware/monitoring.ts
import { Context, Next } from 'hono';

export function responseTimeMonitoring() {
  return async (c: Context, next: Next) => {
    const start = Date.now();
    
    await next();
    
    const duration = Date.now() - start;
    
    // Add response time header
    c.header('X-Response-Time', `${duration}ms`);
    
    // Log slow requests
    if (duration > 500) {
      console.warn(`[SLOW] ${c.req.method} ${c.req.path} - ${duration}ms`);
    }
    
    // Could send to metrics service
    // metricsService.recordResponseTime(c.req.path, duration);
  };
}
```

---

## 6. DEPLOYMENT ARCHITECTURE

### 6.1 Infrastructure Diagram

```
                    ┌─────────────────┐
                    │   CloudFlare    │
                    │   (CDN + WAF)   │
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │  Load Balancer  │
                    │    (Nginx)      │
                    └────────┬────────┘
                             │
         ┌───────────────────┼───────────────────┐
         │                   │                   │
┌────────▼────────┐ ┌────────▼────────┐ ┌────────▼────────┐
│   API Server    │ │   API Server    │ │   API Server    │
│   (Node.js)     │ │   (Node.js)     │ │   (Node.js)     │
└────────┬────────┘ └────────┬────────┘ └────────┬────────┘
         │                   │                   │
         └───────────────────┼───────────────────┘
                             │
         ┌───────────────────┼───────────────────┐
         │                   │                   │
┌────────▼────────┐ ┌────────▼────────┐ ┌────────▼────────┐
│   PostgreSQL    │ │     Redis       │ │       S3        │
│   (Primary)     │ │   (Cache)       │ │   (Storage)     │
└─────────────────┘ └─────────────────┘ └─────────────────┘
```

### 6.2 Environment Variables

```env
# Production Environment
NODE_ENV=production

# Database
DATABASE_URL=postgresql://user:pass@host:5432/anhthoxay_prod

# Redis
REDIS_URL=redis://host:6379

# JWT
JWT_SECRET=<64+ chars high entropy>
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# CORS
CORS_ORIGINS=https://anhthoxay.com,https://admin.anhthoxay.com

# Storage
S3_BUCKET=anhthoxay-media
S3_REGION=ap-southeast-1
AWS_ACCESS_KEY_ID=xxx
AWS_SECRET_ACCESS_KEY=xxx

# Monitoring
SENTRY_DSN=https://xxx@sentry.io/xxx
```

---

## 7. TESTING STRATEGY

### 7.1 Test Categories

1. **Unit Tests** - Individual functions/services
2. **Integration Tests** - API endpoints
3. **E2E Tests** - Full user flows
4. **Security Tests** - Vulnerability scanning

### 7.2 Test Coverage Targets

| Category | Current | Target |
|----------|---------|--------|
| Unit Tests | ~0% | 60% |
| Integration Tests | ~0% | 40% |
| E2E Tests | ~0% | 20% |
| Overall | ~4% | 50% |

---

*Design Document Version: 1.0*
*Last Updated: January 6, 2026*
