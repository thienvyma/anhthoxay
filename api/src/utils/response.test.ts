/**
 * Response Helper Tests
 * Tests standardized response format utilities
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { Hono } from 'hono';
import { successResponse, paginatedResponse, errorResponse } from './response';
import { correlationId } from '../middleware/correlation-id';

describe('Response Helpers', () => {
  let app: Hono;

  beforeEach(() => {
    app = new Hono();
    // Apply correlation-id middleware for error responses
    app.use('*', correlationId());
  });

  describe('successResponse', () => {
    it('should return success response with data', async () => {
      app.get('/test', (c) => {
        return successResponse(c, { id: '123', name: 'Test' });
      });

      const res = await app.fetch(new Request('http://localhost/test'));
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.data).toEqual({ id: '123', name: 'Test' });
    });

    it('should return success response with custom status', async () => {
      app.post('/test', (c) => {
        return successResponse(c, { created: true }, 201);
      });

      const res = await app.fetch(
        new Request('http://localhost/test', { method: 'POST' })
      );
      expect(res.status).toBe(201);

      const data = await res.json();
      expect(data.success).toBe(true);
    });

    it('should handle null data', async () => {
      app.get('/test', (c) => {
        return successResponse(c, null);
      });

      const res = await app.fetch(new Request('http://localhost/test'));
      const data = await res.json();

      expect(data.success).toBe(true);
      expect(data.data).toBeNull();
    });

    it('should handle array data', async () => {
      app.get('/test', (c) => {
        return successResponse(c, [1, 2, 3]);
      });

      const res = await app.fetch(new Request('http://localhost/test'));
      const data = await res.json();

      expect(data.success).toBe(true);
      expect(data.data).toEqual([1, 2, 3]);
    });

    it('should handle empty object', async () => {
      app.get('/test', (c) => {
        return successResponse(c, {});
      });

      const res = await app.fetch(new Request('http://localhost/test'));
      const data = await res.json();

      expect(data.success).toBe(true);
      expect(data.data).toEqual({});
    });
  });

  describe('paginatedResponse', () => {
    it('should return paginated response with correct meta', async () => {
      app.get('/test', (c) => {
        const items = [{ id: 1 }, { id: 2 }, { id: 3 }];
        return paginatedResponse(c, items, { total: 100, page: 1, limit: 10 });
      });

      const res = await app.fetch(new Request('http://localhost/test'));
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.data).toHaveLength(3);
      expect(data.meta).toEqual({
        total: 100,
        page: 1,
        limit: 10,
        totalPages: 10,
      });
    });

    it('should calculate totalPages correctly', async () => {
      app.get('/test', (c) => {
        return paginatedResponse(c, [], { total: 25, page: 1, limit: 10 });
      });

      const res = await app.fetch(new Request('http://localhost/test'));
      const data = await res.json();

      expect(data.meta.totalPages).toBe(3); // ceil(25/10) = 3
    });

    it('should handle zero total', async () => {
      app.get('/test', (c) => {
        return paginatedResponse(c, [], { total: 0, page: 1, limit: 10 });
      });

      const res = await app.fetch(new Request('http://localhost/test'));
      const data = await res.json();

      expect(data.meta.total).toBe(0);
      expect(data.meta.totalPages).toBe(0);
    });

    it('should handle zero limit gracefully', async () => {
      app.get('/test', (c) => {
        return paginatedResponse(c, [], { total: 100, page: 1, limit: 0 });
      });

      const res = await app.fetch(new Request('http://localhost/test'));
      const data = await res.json();

      expect(data.meta.totalPages).toBe(0);
    });

    it('should handle large datasets', async () => {
      app.get('/test', (c) => {
        return paginatedResponse(c, [], { total: 10000, page: 50, limit: 20 });
      });

      const res = await app.fetch(new Request('http://localhost/test'));
      const data = await res.json();

      expect(data.meta.totalPages).toBe(500);
      expect(data.meta.page).toBe(50);
    });
  });

  describe('errorResponse', () => {
    it('should return error response with code and message', async () => {
      app.get('/test', (c) => {
        return errorResponse(c, 'VALIDATION_ERROR', 'Invalid input');
      });

      const res = await app.fetch(new Request('http://localhost/test'));
      expect(res.status).toBe(400);

      const data = await res.json();
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('VALIDATION_ERROR');
      expect(data.error.message).toBe('Invalid input');
      expect(data.correlationId).toBeDefined();
    });

    it('should return error with custom status', async () => {
      app.get('/test', (c) => {
        return errorResponse(c, 'NOT_FOUND', 'Resource not found', 404);
      });

      const res = await app.fetch(new Request('http://localhost/test'));
      expect(res.status).toBe(404);
    });

    it('should return 401 for unauthorized', async () => {
      app.get('/test', (c) => {
        return errorResponse(c, 'UNAUTHORIZED', 'Authentication required', 401);
      });

      const res = await app.fetch(new Request('http://localhost/test'));
      expect(res.status).toBe(401);
    });

    it('should return 403 for forbidden', async () => {
      app.get('/test', (c) => {
        return errorResponse(c, 'FORBIDDEN', 'Access denied', 403);
      });

      const res = await app.fetch(new Request('http://localhost/test'));
      expect(res.status).toBe(403);
    });

    it('should return 500 for server error', async () => {
      app.get('/test', (c) => {
        return errorResponse(c, 'INTERNAL_ERROR', 'Something went wrong', 500);
      });

      const res = await app.fetch(new Request('http://localhost/test'));
      expect(res.status).toBe(500);
    });

    it('should include correlation ID from request header', async () => {
      app.get('/test', (c) => {
        return errorResponse(c, 'ERROR', 'Test error');
      });

      const res = await app.fetch(
        new Request('http://localhost/test', {
          headers: { 'X-Correlation-ID': 'custom-correlation-id' },
        })
      );

      const data = await res.json();
      expect(data.correlationId).toBe('custom-correlation-id');
    });
  });
});
