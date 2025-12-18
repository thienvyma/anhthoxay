# Design Document: Codebase Hardening

## Overview

Spec này implement các cải thiện nhỏ nhưng quan trọng cho codebase ANH THỢ XÂY:

1. **Environment-based API Configuration**: Chuyển API_URL từ hardcode sang environment variable
2. **React Error Boundaries**: Bọc apps để tránh crash toàn bộ khi có lỗi
3. **Markdown Sanitization**: Sanitize blog content để tránh XSS
4. **Correlation-ID Middleware**: Thêm request tracing cho debugging
5. **Centralized Error Handler**: Structured logging và consistent error responses

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend Apps                             │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐              ┌─────────────────┐           │
│  │   Landing App   │              │    Admin App    │           │
│  │  ┌───────────┐  │              │  ┌───────────┐  │           │
│  │  │  Error    │  │              │  │  Error    │  │           │
│  │  │ Boundary  │  │              │  │ Boundary  │  │           │
│  │  └───────────┘  │              │  └───────────┘  │           │
│  │  ┌───────────┐  │              │                 │           │
│  │  │ Sanitized │  │              │                 │           │
│  │  │ Markdown  │  │              │                 │           │
│  │  └───────────┘  │              │                 │           │
│  └─────────────────┘              └─────────────────┘           │
│           │                                │                     │
│           └────────────┬───────────────────┘                     │
│                        │                                         │
│              ┌─────────▼─────────┐                               │
│              │   @app/shared     │                               │
│              │  ┌─────────────┐  │                               │
│              │  │ getApiUrl() │  │  ← Environment-based          │
│              │  └─────────────┘  │                               │
│              └───────────────────┘                               │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                         API Server                               │
├─────────────────────────────────────────────────────────────────┤
│  Request → [Correlation-ID] → [Auth] → [Route] → Response       │
│                 │                          │                     │
│                 │                          ▼                     │
│                 │              ┌─────────────────┐               │
│                 │              │  Error Handler  │               │
│                 │              │  (Structured)   │               │
│                 │              └─────────────────┘               │
│                 │                          │                     │
│                 └──────────────────────────┘                     │
│                              │                                   │
│                    ┌─────────▼─────────┐                         │
│                    │  Structured Log   │                         │
│                    │  { correlationId, │                         │
│                    │    timestamp,     │                         │
│                    │    level, ... }   │                         │
│                    └───────────────────┘                         │
└─────────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### 1. Environment Configuration (`@app/shared/config`)

**Nguyên tắc**: Tất cả access đến environment variables phải đi qua module này, không gọi `import.meta.env` trực tiếp ở các file khác.

```typescript
// packages/shared/src/config.ts

/**
 * Centralized configuration module
 * All env access should go through this module
 */

// Cache the API URL to avoid repeated env access
let cachedApiUrl: string | null = null;

/**
 * Get API URL from environment variable with fallback
 * @returns API base URL
 */
export function getApiUrl(): string {
  if (cachedApiUrl) return cachedApiUrl;
  
  // Vite exposes env vars via import.meta.env
  const envUrl = typeof import.meta !== 'undefined' 
    ? (import.meta as { env?: { VITE_API_URL?: string } }).env?.VITE_API_URL 
    : undefined;
  
  if (envUrl) {
    cachedApiUrl = envUrl;
    return envUrl;
  }
  
  // Fallback for development
  const fallback = 'http://localhost:4202';
  
  // Warn in production if not set
  if (typeof import.meta !== 'undefined' && 
      (import.meta as { env?: { PROD?: boolean } }).env?.PROD) {
    console.warn('⚠️ VITE_API_URL not set in production, using fallback:', fallback);
  }
  
  cachedApiUrl = fallback;
  return fallback;
}

/**
 * Check if running in production mode
 */
export function isProduction(): boolean {
  return typeof import.meta !== 'undefined' && 
    !!(import.meta as { env?: { PROD?: boolean } }).env?.PROD;
}

// Lazy-evaluated API_URL for backward compatibility
export const API_URL = getApiUrl();
```

**Usage**: Import từ `@app/shared` hoặc `@app/shared/config`:
```typescript
// ✅ Đúng
import { API_URL, getApiUrl } from '@app/shared';

// ❌ Sai - không gọi trực tiếp
const url = import.meta.env.VITE_API_URL;
```

### 2. Error Boundary Component

**Lưu ý quan trọng**: Error Boundary chỉ bắt được render lifecycle errors. Async errors (fetch, event handlers) cần được handle bằng try-catch hoặc centralized error handling.

```typescript
// packages/ui/src/components/ErrorBoundary.tsx

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error Boundary component to catch render errors
 * 
 * NOTE: This only catches errors during:
 * - Rendering
 * - Lifecycle methods
 * - Constructors of child components
 * 
 * It does NOT catch errors in:
 * - Event handlers (use try-catch)
 * - Async code (use try-catch or .catch())
 * - Server-side rendering
 * - Errors thrown in the error boundary itself
 */
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error('ErrorBoundary caught error:', error);
    console.error('Component stack:', errorInfo.componentStack);
    this.props.onError?.(error, errorInfo);
  }

  handleRetry = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): React.ReactNode {
    if (this.state.hasError) {
      return this.props.fallback || <DefaultErrorFallback onRetry={this.handleRetry} error={this.state.error} />;
    }
    return this.props.children;
  }
}

// Default fallback UI in Vietnamese
function DefaultErrorFallback({ onRetry, error }: { onRetry: () => void; error: Error | null }) {
  return (
    <div style={{ padding: 40, textAlign: 'center' }}>
      <h2>Đã xảy ra lỗi</h2>
      <p style={{ color: '#666' }}>Xin lỗi, đã có lỗi xảy ra. Vui lòng thử lại.</p>
      {error && <pre style={{ fontSize: 12, color: '#999' }}>{error.message}</pre>}
      <button onClick={onRetry} style={{ marginTop: 16, padding: '8px 24px' }}>
        Thử lại
      </button>
    </div>
  );
}
```

### 3. Markdown Sanitization

```typescript
// landing/src/app/utils/markdown.ts

import rehypeSanitize, { defaultSchema } from 'rehype-sanitize';

/**
 * Custom sanitization schema for blog content
 * 
 * Security considerations:
 * - Only whitelist safe tags
 * - Only allow safe attributes (no style, no event handlers)
 * - Only allow safe protocols (http, https, mailto)
 * - Strip dangerous tags completely
 */
export const sanitizeSchema = {
  ...defaultSchema,
  tagNames: [
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'p', 'a', 'img', 'ul', 'ol', 'li',
    'blockquote', 'code', 'pre', 'strong', 'em',
    'br', 'hr', 'table', 'thead', 'tbody', 'tr', 'th', 'td'
  ],
  attributes: {
    ...defaultSchema.attributes,
    // Links: allow href, title, target, rel (for noopener)
    a: ['href', 'title', 'target', 'rel'],
    // Images: allow src, alt, title, dimensions - NO style attribute
    img: ['src', 'alt', 'title', 'width', 'height'],
    // Code: allow className for syntax highlighting
    code: ['className'],
    // Global: no style attribute allowed
    '*': ['className'],
  },
  protocols: {
    // Only allow safe protocols
    href: ['http', 'https', 'mailto'],
    src: ['http', 'https'], // Relative URLs handled separately
  },
  // Completely remove these dangerous tags
  strip: ['script', 'style', 'iframe', 'embed', 'object', 'form', 'input', 'button'],
};

// Usage in ReactMarkdown
<ReactMarkdown 
  rehypePlugins={[[rehypeSanitize, sanitizeSchema]]}
  components={{
    // Custom img component to handle relative URLs
    img: ({ src, alt, ...props }) => (
      <img 
        src={src?.startsWith('/') ? resolveMediaUrl(src) : src} 
        alt={alt} 
        {...props} 
      />
    ),
  }}
>
  {content}
</ReactMarkdown>
```

### 4. Correlation-ID Middleware

```typescript
// api/src/middleware/correlation-id.ts

import { Context, Next } from 'hono';
import { randomUUID } from 'crypto';

const CORRELATION_ID_HEADER = 'X-Correlation-ID';

/**
 * Generate a unique correlation ID
 * Abstracted to utility function for future customization (UUID v4, nanoid, etc.)
 */
export function generateCorrelationId(): string {
  return randomUUID();
}

/**
 * Correlation ID middleware
 * - Extracts correlation ID from request header if present
 * - Generates new ID if not present
 * - Stores in Hono context for access by other middleware/routes
 * - Adds to response header
 */
export function correlationId() {
  return async (c: Context, next: Next) => {
    // Get from header or generate new
    const id = c.req.header(CORRELATION_ID_HEADER) || generateCorrelationId();
    
    // Store in context for access by other middleware/routes
    c.set('correlationId', id);
    
    // Add to response header
    c.header(CORRELATION_ID_HEADER, id);
    
    await next();
  };
}

/**
 * Helper to get correlation ID from context
 * Returns 'unknown' if not set (should not happen if middleware is applied)
 */
export function getCorrelationId(c: Context): string {
  return c.get('correlationId') || 'unknown';
}
```

### 5. Structured Logger

```typescript
// api/src/utils/logger.ts

import { Context } from 'hono';
import { getCorrelationId } from '../middleware/correlation-id';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  correlationId: string;
  path?: string;
  method?: string;
  userId?: string;
  errorCode?: string;
  stack?: string;
  [key: string]: unknown;
}

export function createLogger(c?: Context) {
  const correlationId = c ? getCorrelationId(c) : 'system';
  const userId = c?.get('user')?.id;
  const path = c?.req.path;
  const method = c?.req.method;

  const log = (level: LogLevel, message: string, extra?: Record<string, unknown>) => {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      correlationId,
      path,
      method,
      userId,
      ...extra,
    };
    
    // Output as JSON for structured logging
    console[level === 'error' ? 'error' : level === 'warn' ? 'warn' : 'log'](
      JSON.stringify(entry)
    );
  };

  return {
    debug: (msg: string, extra?: Record<string, unknown>) => log('debug', msg, extra),
    info: (msg: string, extra?: Record<string, unknown>) => log('info', msg, extra),
    warn: (msg: string, extra?: Record<string, unknown>) => log('warn', msg, extra),
    error: (msg: string, extra?: Record<string, unknown>) => log('error', msg, extra),
  };
}
```

### 6. Centralized Error Handler

```typescript
// api/src/middleware/error-handler.ts

import { Context } from 'hono';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import { AuthError } from '../services/auth.service';
import { createLogger } from '../utils/logger';
import { getCorrelationId } from './correlation-id';

/**
 * Centralized error handler for Hono
 * 
 * Handles:
 * - ZodError → 400 with validation details
 * - AuthError → status from error.statusCode
 * - Prisma P2025 → 404 Not Found
 * - Prisma P2002 → 409 Conflict
 * - Other errors → 500 Internal Server Error
 * 
 * Always includes correlationId in response for debugging
 * Stack trace included in dev mode only
 */
export function errorHandler() {
  return async (err: Error, c: Context) => {
    const logger = createLogger(c);
    const correlationId = getCorrelationId(c);
    const isProd = process.env.NODE_ENV === 'production';

    // Log error with full details (always include stack in logs)
    logger.error(err.message, {
      errorCode: (err as AuthError).code,
      stack: err.stack,
      errorName: err.name,
    });

    // Handle Zod validation errors
    if (err instanceof ZodError) {
      return c.json({
        error: 'Validation failed',
        details: err.flatten(),
        correlationId,
      }, 400);
    }

    // Handle AuthError (custom auth errors)
    if (err instanceof AuthError) {
      return c.json({
        error: { code: err.code, message: err.message },
        correlationId,
      }, err.statusCode);
    }

    // Handle Prisma errors
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === 'P2025') {
        return c.json({
          error: 'Record not found',
          correlationId,
        }, 404);
      }
      if (err.code === 'P2002') {
        return c.json({
          error: 'Record already exists',
          correlationId,
        }, 409);
      }
    }

    // Generic error response
    // Include stack trace in development mode for debugging
    return c.json({
      error: 'Internal server error',
      correlationId,
      ...(isProd ? {} : { stack: err.stack, message: err.message }),
    }, 500);
  };
}
```

## Data Models

Không có thay đổi database schema. Spec này chỉ thêm runtime improvements.

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Environment Configuration Consistency
*For any* call to `getApiUrl()` or `resolveMediaUrl()`, the returned URL SHALL use the value from `VITE_API_URL` environment variable if set, otherwise fall back to `http://localhost:4202`.
**Validates: Requirements 1.1, 1.2, 1.3, 1.5**

### Property 2: Markdown Sanitization Removes Dangerous Content
*For any* markdown string containing dangerous elements (script tags, event handlers, javascript: URLs, iframe, embed), the sanitized output SHALL NOT contain any of these dangerous elements.
**Validates: Requirements 3.2, 3.3, 3.4, 3.5, 3.7**

### Property 3: Markdown Sanitization Preserves Safe Content
*For any* markdown string containing only safe HTML elements (h1-h6, p, a, img, ul, ol, li, blockquote, code, pre, strong, em), the sanitized output SHALL preserve these elements.
**Validates: Requirements 3.6**

### Property 4: Correlation-ID Round Trip
*For any* API request, the response SHALL contain `X-Correlation-ID` header with either the provided correlation ID (if request included one) or a valid UUID v4 (if request did not include one).
**Validates: Requirements 4.1, 4.2, 4.3**

### Property 5: Error Response Contains Correlation ID
*For any* error response from the API, the response body SHALL contain a `correlationId` field matching the `X-Correlation-ID` header.
**Validates: Requirements 4.5, 5.7**

### Property 6: Zod Validation Error Returns 400
*For any* request that fails Zod validation, the API SHALL return HTTP 400 status with validation error details.
**Validates: Requirements 5.5**

### Property 7: AuthError Returns Correct Status
*For any* AuthError thrown during request handling, the API SHALL return HTTP status code matching `AuthError.statusCode`.
**Validates: Requirements 5.6**

## Error Handling

### Frontend Error Handling
- Error Boundaries catch React component errors
- Fallback UI displays user-friendly message in Vietnamese
- Retry button allows recovery without page refresh
- Console logs include component stack for debugging

### Backend Error Handling
- Global error handler catches all unhandled errors
- Structured JSON logs for all errors
- Correlation ID included in all error responses
- Stack traces hidden in production responses

### Error Response Format
```typescript
// Success response
{ data: T }

// Error response
{
  error: string | { code: string; message: string };
  correlationId: string;
  details?: unknown; // For validation errors
}
```

## Testing Strategy

### Property-Based Testing Library
- **Vitest** với **fast-check** cho property-based testing
- Minimum 100 iterations per property test

### Unit Tests
- Test `getApiUrl()` với các env configurations
- Test Error Boundary render và recovery
- Test sanitization với various inputs
- Test correlation-id middleware
- Test error handler với different error types

### Property Tests
1. **Sanitization Property Test**: Generate random markdown với dangerous content, verify output is clean
2. **Correlation-ID Property Test**: Generate random requests, verify response headers
3. **Error Handler Property Test**: Generate random errors, verify correct status codes

### Test File Naming
- Unit tests: `*.test.ts`
- Property tests: `*.property.test.ts`

### Test Annotation Format
```typescript
/**
 * **Feature: codebase-hardening, Property 2: Markdown Sanitization Removes Dangerous Content**
 * **Validates: Requirements 3.2, 3.3, 3.4, 3.5, 3.7**
 */
```
