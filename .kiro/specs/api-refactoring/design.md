# Design Document: API Refactoring

## Overview

Refactor API codebase từ monolithic `main.ts` (~1000+ lines) sang kiến trúc modular với:
- Route modules tách biệt theo domain
- Service layer cho business logic
- Response format chuẩn hóa
- CORS configuration từ environment
- Input validation nhất quán với Zod

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    API REFACTORING ARCHITECTURE                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                      main.ts (Entry)                      │   │
│  │  • Middleware setup (cors, security, correlation-id)      │   │
│  │  • Route mounting                                         │   │
│  │  • Error handler                                          │   │
│  │  • Server startup                                         │   │
│  └──────────────────────────────────────────────────────────┘   │
│                              │                                   │
│              ┌───────────────┼───────────────┐                  │
│              ▼               ▼               ▼                  │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐            │
│  │   Routes     │ │   Routes     │ │   Routes     │            │
│  │  /api/auth   │ │  /api/pages  │ │  /api/media  │  ...       │
│  └──────────────┘ └──────────────┘ └──────────────┘            │
│         │                │                │                     │
│         ▼                ▼                ▼                     │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐            │
│  │   Services   │ │   Services   │ │   Services   │            │
│  │ auth.service │ │pages.service │ │media.service │  ...       │
│  └──────────────┘ └──────────────┘ └──────────────┘            │
│         │                │                │                     │
│         └────────────────┼────────────────┘                     │
│                          ▼                                      │
│              ┌──────────────────────┐                           │
│              │   Prisma Database    │                           │
│              └──────────────────────┘                           │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### 1. Route Module Structure

```typescript
// api/src/routes/pages.routes.ts
import { Hono } from 'hono';
import { authenticate, requireRole } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation';
import { PageSchema } from '../schemas/pages.schema';
import { pagesService } from '../services/pages.service';
import { successResponse, paginatedResponse } from '../utils/response';

const app = new Hono();

/**
 * @route GET /api/pages
 * @description Get all pages with sections
 * @access Public
 */
app.get('/', async (c) => {
  const pages = await pagesService.getAllPages();
  return successResponse(c, pages);
});

/**
 * @route POST /api/pages
 * @description Create a new page
 * @access Admin only
 */
app.post('/', authenticate(), requireRole('ADMIN'), validate(PageSchema), async (c) => {
  const data = c.req.valid('json');
  const page = await pagesService.createPage(data);
  return successResponse(c, page, 201);
});

export default app;
```

### 2. Service Module Structure

```typescript
// api/src/services/pages.service.ts
import { PrismaClient } from '@prisma/client';
import type { Page, Section } from '@prisma/client';

export class PagesService {
  constructor(private prisma: PrismaClient) {}

  async getAllPages(): Promise<Page[]> {
    return this.prisma.page.findMany({
      include: { sections: { orderBy: { order: 'asc' } } },
      orderBy: { order: 'asc' },
    });
  }

  async createPage(data: CreatePageInput): Promise<Page> {
    return this.prisma.page.create({ data });
  }

  async getPageBySlug(slug: string): Promise<Page | null> {
    return this.prisma.page.findUnique({
      where: { slug },
      include: { sections: { orderBy: { order: 'asc' } } },
    });
  }
}

export const pagesService = new PagesService(prisma);
```

### 3. Response Helpers

```typescript
// api/src/utils/response.ts
import type { Context } from 'hono';

interface SuccessResponse<T> {
  success: true;
  data: T;
}

interface PaginatedResponse<T> {
  success: true;
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
  };
  correlationId?: string;
}

export function successResponse<T>(c: Context, data: T, status = 200) {
  return c.json({ success: true, data } as SuccessResponse<T>, status);
}

export function paginatedResponse<T>(
  c: Context,
  data: T[],
  meta: { total: number; page: number; limit: number }
) {
  const totalPages = Math.ceil(meta.total / meta.limit);
  return c.json({
    success: true,
    data,
    meta: { ...meta, totalPages },
  } as PaginatedResponse<T>);
}

export function errorResponse(
  c: Context,
  code: string,
  message: string,
  status = 400
) {
  const correlationId = c.get('correlationId');
  return c.json(
    { success: false, error: { code, message }, correlationId } as ErrorResponse,
    status
  );
}
```

### 4. CORS Configuration

```typescript
// api/src/config/cors.ts
import { cors } from 'hono/cors';

interface CorsConfig {
  origins: string[];
  isProduction: boolean;
}

export function getCorsConfig(): CorsConfig {
  const isProduction = process.env.NODE_ENV === 'production';
  const envOrigins = process.env.CORS_ORIGINS;

  if (envOrigins) {
    const origins = envOrigins.split(',').map(o => o.trim()).filter(Boolean);
    // Validate URLs
    origins.forEach(origin => {
      try {
        new URL(origin);
      } catch {
        throw new Error(`Invalid CORS origin: ${origin}`);
      }
    });
    return { origins, isProduction };
  }

  if (isProduction) {
    console.warn('⚠️ CORS_ORIGINS not set in production - using restrictive defaults');
    return { origins: [], isProduction };
  }

  // Development defaults
  return {
    origins: ['http://localhost:4200', 'http://localhost:4201'],
    isProduction: false,
  };
}

export function createCorsMiddleware() {
  const config = getCorsConfig();
  return cors({
    origin: config.origins,
    credentials: true,
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization', 'X-Correlation-ID'],
  });
}
```

### 5. Validation Middleware

```typescript
// api/src/middleware/validation.ts
import { zValidator } from '@hono/zod-validator';
import type { ZodSchema } from 'zod';

export function validate<T>(schema: ZodSchema<T>) {
  return zValidator('json', schema, (result, c) => {
    if (!result.success) {
      const correlationId = c.get('correlationId');
      return c.json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid request data',
          details: result.error.flatten(),
        },
        correlationId,
      }, 400);
    }
  });
}

export function validateQuery<T>(schema: ZodSchema<T>) {
  return zValidator('query', schema, (result, c) => {
    if (!result.success) {
      const correlationId = c.get('correlationId');
      return c.json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid query parameters',
          details: result.error.flatten(),
        },
        correlationId,
      }, 400);
    }
  });
}
```

## Data Models

Không có thay đổi database schema. Refactoring chỉ ảnh hưởng đến code organization.

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Protected Routes Require Authentication
*For any* protected route (admin, manager endpoints), requests without valid JWT token should return 401 Unauthorized.
**Validates: Requirements 1.5**

### Property 2: Success Response Format Consistency
*For any* successful API response, the response body should contain `success: true` and `data` field.
**Validates: Requirements 3.1, 3.5**

### Property 3: Paginated Response Format Consistency
*For any* paginated API response, the response body should contain `success: true`, `data` array, and `meta` object with `total`, `page`, `limit`, `totalPages` fields.
**Validates: Requirements 3.2**

### Property 4: Error Response Format Consistency
*For any* error API response, the response body should contain `success: false`, `error` object with `code` and `message`, and `correlationId`.
**Validates: Requirements 3.3**

### Property 5: Response Helper Functions Work Correctly
*For any* input data, `successResponse()`, `paginatedResponse()`, and `errorResponse()` should produce correctly formatted responses.
**Validates: Requirements 3.4**

### Property 6: CORS Origins From Environment
*For any* CORS_ORIGINS environment value, the API should parse and use those origins for CORS configuration.
**Validates: Requirements 4.1, 4.2**

### Property 7: CORS Origin Validation
*For any* invalid URL in CORS_ORIGINS, the API should reject it during startup.
**Validates: Requirements 4.5**

### Property 8: Input Validation Returns 400
*For any* request with invalid body or query parameters, the API should return 400 status with validation error details.
**Validates: Requirements 5.1, 5.2, 5.3**

## Error Handling

| Error Code | HTTP Status | Description |
|------------|-------------|-------------|
| `VALIDATION_ERROR` | 400 | Request body or query params failed Zod validation |
| `UNAUTHORIZED` | 401 | Missing or invalid JWT token |
| `FORBIDDEN` | 403 | User lacks required role |
| `NOT_FOUND` | 404 | Resource not found |
| `CONFLICT` | 409 | Unique constraint violation |
| `INTERNAL_ERROR` | 500 | Unexpected server error |

## Testing Strategy

### Unit Testing
- Response helper functions
- CORS configuration parsing
- Validation middleware

### Property-Based Testing (using fast-check)
- Property 1: Protected routes authentication
- Property 2: Success response format
- Property 3: Paginated response format
- Property 4: Error response format
- Property 5: Response helper functions
- Property 6: CORS origins parsing
- Property 7: CORS origin validation
- Property 8: Input validation

### Integration Testing
- Full request/response cycle for each route module
- CORS headers verification
- Authentication flow with route modules

## File Structure After Refactoring

```
api/src/
├── main.ts                    # Entry point (~100 lines)
├── config/
│   └── cors.ts               # CORS configuration
├── middleware/
│   ├── auth.middleware.ts    # Existing
│   ├── correlation-id.ts     # Existing
│   ├── error-handler.ts      # Existing
│   ├── rate-limiter.ts       # Existing
│   ├── security-headers.ts   # Existing
│   └── validation.ts         # New - Zod validation middleware
├── routes/
│   ├── auth.routes.ts        # Existing
│   ├── pages.routes.ts       # New
│   ├── media.routes.ts       # New
│   ├── leads.routes.ts       # New
│   ├── pricing.routes.ts     # New (service-categories, unit-prices, materials, formulas)
│   ├── blog.routes.ts        # New
│   ├── settings.routes.ts    # New
│   └── integrations.routes.ts # New (Google Sheets)
├── services/
│   ├── auth.service.ts       # Existing
│   ├── google-sheets.service.ts # Existing
│   ├── pages.service.ts      # New
│   ├── media.service.ts      # New
│   ├── leads.service.ts      # New
│   ├── pricing.service.ts    # New
│   └── quote.service.ts      # New
├── schemas/
│   ├── index.ts              # Existing schemas.ts renamed
│   ├── pages.schema.ts       # New
│   ├── media.schema.ts       # New
│   ├── leads.schema.ts       # New
│   └── pricing.schema.ts     # New
└── utils/
    ├── logger.ts             # Existing
    └── response.ts           # New - Response helpers
```

