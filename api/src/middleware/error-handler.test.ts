/**
 * Error Handler Middleware Tests
 * Tests centralized error handling
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Hono } from 'hono';
import { z } from 'zod';
import { correlationId } from './correlation-id';
import { AuthError } from '../services/auth.service';

// Mock @prisma/client to provide Prisma namespace
vi.mock('@prisma/client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@prisma/client')>();
  return {
    ...actual,
    Prisma: {
      ...actual.Prisma,
      PrismaClientKnownRequestError: class PrismaClientKnownRequestError extends Error {
        code: string;
        constructor(message: string, { code }: { code: string }) {
          super(message);
          this.name = 'PrismaClientKnownRequestError';
          this.code = code;
        }
      },
    },
  };
});

// Import errorHandler after mocking
import { errorHandler } from './error-handler';

describe('Error Handler Middleware', () => {
  let app: Hono;
  const originalNodeEnv = process.env.NODE_ENV;

  beforeEach(() => {
    app = new Hono();
    app.use('*', correlationId());
    app.onError(errorHandler());
    process.env.NODE_ENV = 'test';
  });

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
  });

  describe('ZodError handling', () => {
    it('should return 400 for ZodError', async () => {
      const schema = z.object({ name: z.string() });

      app.post('/test', async () => {
        schema.parse({ name: 123 }); // Will throw ZodError
        return new Response('ok');
      });

      const res = await app.fetch(
        new Request('http://localhost/test', { method: 'POST' })
      );

      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toBe('Validation failed');
      expect(data.details).toBeDefined();
      expect(data.correlationId).toBeDefined();
    });

    it('should include field errors in ZodError response', async () => {
      const schema = z.object({
        name: z.string().min(1),
        email: z.string().email(),
      });

      app.post('/test', async () => {
        schema.parse({ name: '', email: 'invalid' });
        return new Response('ok');
      });

      const res = await app.fetch(
        new Request('http://localhost/test', { method: 'POST' })
      );

      const data = await res.json();
      // err.format() returns nested structure with _errors arrays
      expect(data.details.name).toBeDefined();
      expect(data.details.email).toBeDefined();
    });
  });

  describe('AuthError handling', () => {
    it('should return correct status for AUTH_INVALID_CREDENTIALS', async () => {
      app.get('/test', () => {
        throw new AuthError('AUTH_INVALID_CREDENTIALS', 'Invalid credentials');
      });

      const res = await app.fetch(new Request('http://localhost/test'));

      expect(res.status).toBe(401);
      const data = await res.json();
      expect(data.error.code).toBe('AUTH_INVALID_CREDENTIALS');
      expect(data.error.message).toBe('Invalid credentials');
    });

    it('should return 403 for AUTH_FORBIDDEN', async () => {
      app.get('/test', () => {
        throw new AuthError('AUTH_FORBIDDEN', 'Access denied');
      });

      const res = await app.fetch(new Request('http://localhost/test'));

      expect(res.status).toBe(403);
    });

    it('should return 404 for AUTH_USER_NOT_FOUND', async () => {
      app.get('/test', () => {
        throw new AuthError('AUTH_USER_NOT_FOUND', 'User not found');
      });

      const res = await app.fetch(new Request('http://localhost/test'));

      expect(res.status).toBe(404);
    });

    it('should return 429 for AUTH_RATE_LIMITED', async () => {
      app.get('/test', () => {
        throw new AuthError('AUTH_RATE_LIMITED', 'Too many requests');
      });

      const res = await app.fetch(new Request('http://localhost/test'));

      expect(res.status).toBe(429);
    });

    it('should include correlation ID in AuthError response', async () => {
      app.get('/test', () => {
        throw new AuthError('AUTH_INVALID_CREDENTIALS', 'Invalid');
      });

      const res = await app.fetch(
        new Request('http://localhost/test', {
          headers: { 'X-Correlation-ID': 'test-id' },
        })
      );

      const data = await res.json();
      expect(data.correlationId).toBe('test-id');
    });
  });

  describe('Generic error handling', () => {
    it('should return 500 for unknown errors', async () => {
      app.get('/test', () => {
        throw new Error('Something went wrong');
      });

      const res = await app.fetch(new Request('http://localhost/test'));

      expect(res.status).toBe(500);
      const data = await res.json();
      expect(data.error).toBe('Internal server error');
      expect(data.correlationId).toBeDefined();
    });

    it('should include stack trace in development', async () => {
      process.env.NODE_ENV = 'development';

      app.get('/test', () => {
        throw new Error('Dev error');
      });

      const res = await app.fetch(new Request('http://localhost/test'));
      const data = await res.json();

      expect(data.stack).toBeDefined();
      expect(data.message).toBe('Dev error');
    });

    it('should not include stack trace in production', async () => {
      process.env.NODE_ENV = 'production';

      app.get('/test', () => {
        throw new Error('Prod error');
      });

      const res = await app.fetch(new Request('http://localhost/test'));
      const data = await res.json();

      expect(data.stack).toBeUndefined();
      expect(data.message).toBeUndefined();
    });
  });

  describe('Async error handling', () => {
    it('should handle async errors', async () => {
      app.get('/test', async () => {
        await Promise.resolve();
        throw new Error('Async error');
      });

      const res = await app.fetch(new Request('http://localhost/test'));

      expect(res.status).toBe(500);
    });

    it('should handle rejected promises', async () => {
      app.get('/test', async () => {
        return Promise.reject(new Error('Rejected'));
      });

      const res = await app.fetch(new Request('http://localhost/test'));

      expect(res.status).toBe(500);
    });
  });

  describe('Correlation ID propagation', () => {
    it('should use provided correlation ID', async () => {
      app.get('/test', () => {
        throw new Error('Test error');
      });

      const customId = 'custom-correlation-123';
      const res = await app.fetch(
        new Request('http://localhost/test', {
          headers: { 'X-Correlation-ID': customId },
        })
      );

      const data = await res.json();
      expect(data.correlationId).toBe(customId);
    });

    it('should generate correlation ID if not provided', async () => {
      app.get('/test', () => {
        throw new Error('Test error');
      });

      const res = await app.fetch(new Request('http://localhost/test'));
      const data = await res.json();

      expect(data.correlationId).toBeDefined();
      expect(typeof data.correlationId).toBe('string');
    });
  });
});
