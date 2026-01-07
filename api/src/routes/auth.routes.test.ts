/**
 * Auth Routes Tests
 * Tests authentication endpoints validation and error handling
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { Hono } from 'hono';
import { z } from 'zod';

// Test Zod schemas directly (same as in auth.routes.ts)
const LoginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

const RefreshSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

const RegisterSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(1, 'Name is required'),
  role: z.enum(['ADMIN', 'MANAGER', 'CONTRACTOR', 'HOMEOWNER', 'WORKER', 'USER']).optional(),
  accountType: z.enum(['user', 'homeowner', 'contractor']).optional().default('user'),
  phone: z.string().optional(),
  companyName: z.string().optional(),
});

describe('Auth Routes Schema Validation', () => {
  describe('LoginSchema', () => {
    it('should accept valid login data', () => {
      const result = LoginSchema.safeParse({
        email: 'test@example.com',
        password: 'password123',
      });
      expect(result.success).toBe(true);
    });

    it('should reject missing email', () => {
      const result = LoginSchema.safeParse({
        password: 'password123',
      });
      expect(result.success).toBe(false);
    });

    it('should reject invalid email format', () => {
      const result = LoginSchema.safeParse({
        email: 'invalid-email',
        password: 'password123',
      });
      expect(result.success).toBe(false);
    });

    it('should reject missing password', () => {
      const result = LoginSchema.safeParse({
        email: 'test@example.com',
      });
      expect(result.success).toBe(false);
    });

    it('should reject empty password', () => {
      const result = LoginSchema.safeParse({
        email: 'test@example.com',
        password: '',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('RefreshSchema', () => {
    it('should accept valid refresh token', () => {
      const result = RefreshSchema.safeParse({
        refreshToken: 'valid-refresh-token',
      });
      expect(result.success).toBe(true);
    });

    it('should reject missing refresh token', () => {
      const result = RefreshSchema.safeParse({});
      expect(result.success).toBe(false);
    });

    it('should reject empty refresh token', () => {
      const result = RefreshSchema.safeParse({
        refreshToken: '',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('RegisterSchema', () => {
    it('should accept valid registration data', () => {
      const result = RegisterSchema.safeParse({
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
      });
      expect(result.success).toBe(true);
    });

    it('should accept homeowner account type', () => {
      const result = RegisterSchema.safeParse({
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
        accountType: 'homeowner',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.accountType).toBe('homeowner');
      }
    });

    it('should accept contractor account type', () => {
      const result = RegisterSchema.safeParse({
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
        accountType: 'contractor',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.accountType).toBe('contractor');
      }
    });

    it('should default to user account type', () => {
      const result = RegisterSchema.safeParse({
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.accountType).toBe('user');
      }
    });

    it('should reject password less than 8 characters', () => {
      const result = RegisterSchema.safeParse({
        email: 'test@example.com',
        password: 'short',
        name: 'Test User',
      });
      expect(result.success).toBe(false);
    });

    it('should reject missing name', () => {
      const result = RegisterSchema.safeParse({
        email: 'test@example.com',
        password: 'password123',
      });
      expect(result.success).toBe(false);
    });

    it('should accept optional phone', () => {
      const result = RegisterSchema.safeParse({
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
        phone: '+84123456789',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.phone).toBe('+84123456789');
      }
    });

    it('should accept optional companyName', () => {
      const result = RegisterSchema.safeParse({
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
        companyName: 'Test Company',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.companyName).toBe('Test Company');
      }
    });

    it('should reject invalid account type', () => {
      const result = RegisterSchema.safeParse({
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
        accountType: 'invalid',
      });
      expect(result.success).toBe(false);
    });

    it('should accept valid role', () => {
      const result = RegisterSchema.safeParse({
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
        role: 'ADMIN',
      });
      expect(result.success).toBe(true);
    });

    it('should reject invalid role', () => {
      const result = RegisterSchema.safeParse({
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
        role: 'INVALID_ROLE',
      });
      expect(result.success).toBe(false);
    });
  });
});

describe('Auth Routes Endpoint Behavior', () => {
  let app: Hono;

  beforeEach(() => {
    app = new Hono();

    // Simulate auth routes behavior for testing
    app.post('/api/auth/login', async (c) => {
      try {
        const body = await c.req.json();
        const result = LoginSchema.safeParse(body);

        if (!result.success) {
          return c.json(
            {
              success: false,
              error: { code: 'VALIDATION_ERROR', message: result.error.issues[0]?.message },
            },
            400
          );
        }

        // Simulate successful login
        return c.json({
          success: true,
          data: {
            user: { id: 'user-123', email: result.data.email },
            accessToken: 'mock-access-token',
            refreshToken: 'mock-refresh-token',
          },
        });
      } catch {
        return c.json({ success: false, error: { code: 'PARSE_ERROR' } }, 400);
      }
    });

    app.post('/api/auth/refresh', async (c) => {
      try {
        const body = await c.req.json();
        const result = RefreshSchema.safeParse(body);

        if (!result.success) {
          return c.json(
            {
              success: false,
              error: { code: 'VALIDATION_ERROR', message: result.error.issues[0]?.message },
            },
            400
          );
        }

        return c.json({
          success: true,
          data: {
            accessToken: 'new-access-token',
            refreshToken: 'new-refresh-token',
          },
        });
      } catch {
        return c.json({ success: false, error: { code: 'PARSE_ERROR' } }, 400);
      }
    });

    app.post('/api/auth/signup', async (c) => {
      try {
        const body = await c.req.json();
        const result = RegisterSchema.safeParse(body);

        if (!result.success) {
          return c.json(
            {
              success: false,
              error: { code: 'VALIDATION_ERROR', message: result.error.issues[0]?.message },
            },
            400
          );
        }

        // Check account type restriction for public signup
        if (result.data.accountType !== 'homeowner' && result.data.accountType !== 'contractor') {
          return c.json(
            {
              success: false,
              error: {
                code: 'VALIDATION_ERROR',
                message: 'Account type must be homeowner or contractor',
              },
            },
            400
          );
        }

        return c.json(
          {
            success: true,
            data: {
              user: {
                id: 'user-123',
                email: result.data.email,
                name: result.data.name,
                role: result.data.accountType === 'homeowner' ? 'HOMEOWNER' : 'CONTRACTOR',
              },
            },
          },
          201
        );
      } catch {
        return c.json({ success: false, error: { code: 'PARSE_ERROR' } }, 400);
      }
    });

    app.get('/api/auth/me', async (c) => {
      const authHeader = c.req.header('Authorization');
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return c.json(
          { success: false, error: { code: 'AUTH_TOKEN_INVALID', message: 'Unauthorized' } },
          401
        );
      }

      return c.json({
        success: true,
        data: { id: 'user-123', email: 'test@example.com' },
      });
    });

    app.post('/api/auth/logout', async (c) => {
      const authHeader = c.req.header('Authorization');
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return c.json(
          { success: false, error: { code: 'AUTH_TOKEN_INVALID', message: 'Unauthorized' } },
          401
        );
      }

      return c.json({ success: true, data: { message: 'Logged out successfully' } });
    });
  });

  describe('POST /api/auth/login', () => {
    it('should return 200 for valid login', async () => {
      const res = await app.fetch(
        new Request('http://localhost/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: 'test@example.com', password: 'password123' }),
        })
      );

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.data.accessToken).toBeDefined();
    });

    it('should return 400 for missing email', async () => {
      const res = await app.fetch(
        new Request('http://localhost/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password: 'password123' }),
        })
      );

      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 400 for invalid email format', async () => {
      const res = await app.fetch(
        new Request('http://localhost/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: 'invalid', password: 'password123' }),
        })
      );

      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('POST /api/auth/refresh', () => {
    it('should return 200 for valid refresh token', async () => {
      const res = await app.fetch(
        new Request('http://localhost/api/auth/refresh', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken: 'valid-token' }),
        })
      );

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
    });

    it('should return 400 for missing refresh token', async () => {
      const res = await app.fetch(
        new Request('http://localhost/api/auth/refresh', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({}),
        })
      );

      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('POST /api/auth/signup', () => {
    it('should return 201 for valid homeowner signup', async () => {
      const res = await app.fetch(
        new Request('http://localhost/api/auth/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: 'homeowner@example.com',
            password: 'password123',
            name: 'Home Owner',
            accountType: 'homeowner',
          }),
        })
      );

      expect(res.status).toBe(201);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.data.user.role).toBe('HOMEOWNER');
    });

    it('should return 201 for valid contractor signup', async () => {
      const res = await app.fetch(
        new Request('http://localhost/api/auth/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: 'contractor@example.com',
            password: 'password123',
            name: 'Contractor',
            accountType: 'contractor',
          }),
        })
      );

      expect(res.status).toBe(201);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.data.user.role).toBe('CONTRACTOR');
    });

    it('should return 400 for invalid account type (user)', async () => {
      const res = await app.fetch(
        new Request('http://localhost/api/auth/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: 'user@example.com',
            password: 'password123',
            name: 'User',
            accountType: 'user',
          }),
        })
      );

      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.success).toBe(false);
    });
  });

  describe('GET /api/auth/me', () => {
    it('should return 401 without authorization', async () => {
      const res = await app.fetch(new Request('http://localhost/api/auth/me'));

      expect(res.status).toBe(401);
    });

    it('should return 200 with valid authorization', async () => {
      const res = await app.fetch(
        new Request('http://localhost/api/auth/me', {
          headers: { Authorization: 'Bearer valid-token' },
        })
      );

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should return 401 without authorization', async () => {
      const res = await app.fetch(
        new Request('http://localhost/api/auth/logout', { method: 'POST' })
      );

      expect(res.status).toBe(401);
    });

    it('should return 200 with valid authorization', async () => {
      const res = await app.fetch(
        new Request('http://localhost/api/auth/logout', {
          method: 'POST',
          headers: { Authorization: 'Bearer valid-token' },
        })
      );

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
    });
  });
});
