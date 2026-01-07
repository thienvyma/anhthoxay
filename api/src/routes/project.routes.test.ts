/**
 * Project Routes Tests
 *
 * Tests for project management API routes including:
 * - Authentication requirements (Property 17)
 * - Role-based access control (Property 18)
 * - Validation errors (Property 19)
 * - Response format verification
 *
 * **Feature: api-test-coverage**
 * **Requirements: 6.1, 6.2, 6.3, 6.4**
 */

import { describe, it, expect } from 'vitest';
import { Hono } from 'hono';
import * as fc from 'fast-check';
import {
  CreateProjectSchema,
  UpdateProjectSchema,
  SubmitProjectSchema,
  RejectProjectSchema,
} from '../schemas/project.schema';

// ============================================
// MOCK AUTH MIDDLEWARE
// ============================================

type Role = 'ADMIN' | 'MANAGER' | 'CONTRACTOR' | 'HOMEOWNER' | 'WORKER' | 'USER';

interface MockUser {
  sub: string;
  email: string;
  role: Role;
}

// Role hierarchy for permission checks
const ROLE_HIERARCHY: Record<Role, number> = {
  ADMIN: 6,
  MANAGER: 5,
  CONTRACTOR: 4,
  HOMEOWNER: 3,
  WORKER: 2,
  USER: 1,
};


/**
 * Creates a mock authenticate middleware for testing
 */
function createMockAuthMiddleware(mockUser: MockUser | null) {
  return async (c: { set: (key: string, value: unknown) => void; json: (data: unknown, status?: number) => Response }, next: () => Promise<void>) => {
    if (!mockUser) {
      return c.json(
        { success: false, error: { code: 'AUTH_TOKEN_INVALID', message: 'Unauthorized' } },
        401
      );
    }
    c.set('user', mockUser);
    await next();
  };
}

/**
 * Creates a mock requireRole middleware for testing
 */
function createMockRequireRole(...allowedRoles: Role[]) {
  return async (c: { get: (key: string) => unknown; json: (data: unknown, status?: number) => Response }, next: () => Promise<void>) => {
    const user = c.get('user') as MockUser | undefined;
    if (!user) {
      return c.json(
        { success: false, error: { code: 'AUTH_TOKEN_INVALID', message: 'Unauthorized' } },
        401
      );
    }
    const hasPermission = allowedRoles.some(
      (role) => ROLE_HIERARCHY[user.role] >= ROLE_HIERARCHY[role]
    );
    if (!hasPermission) {
      return c.json(
        { success: false, error: { code: 'AUTH_FORBIDDEN', message: 'Forbidden' } },
        403
      );
    }
    await next();
  };
}

// ============================================
// TEST APP FACTORY
// ============================================

/**
 * Creates a test Hono app with mock routes
 */
function createTestApp(mockUser: MockUser | null = null) {
  const app = new Hono();

  // Public routes (no auth required)
  app.get('/api/projects', async (c) => {
    return c.json({
      success: true,
      data: { items: [], total: 0, page: 1, limit: 20 },
    });
  });

  app.get('/api/projects/:id', async (c) => {
    const id = c.req.param('id');
    if (id === 'not-found') {
      return c.json(
        { success: false, error: { code: 'PROJECT_NOT_FOUND', message: 'Project not found' } },
        404
      );
    }
    return c.json({
      success: true,
      data: { id, title: 'Test Project', status: 'OPEN' },
    });
  });


  // Homeowner routes (require HOMEOWNER role)
  app.post('/api/homeowner/projects', createMockAuthMiddleware(mockUser), createMockRequireRole('HOMEOWNER'), async (c) => {
    try {
      const body = await c.req.json();
      const result = CreateProjectSchema.safeParse(body);
      if (!result.success) {
        return c.json(
          {
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: result.error.issues[0]?.message || 'Validation failed',
              details: result.error.issues,
            },
          },
          400
        );
      }
      return c.json(
        {
          success: true,
          data: { id: 'new-project-id', ...result.data, status: 'DRAFT' },
        },
        201
      );
    } catch {
      return c.json(
        { success: false, error: { code: 'PARSE_ERROR', message: 'Invalid JSON' } },
        400
      );
    }
  });

  app.get('/api/homeowner/projects', createMockAuthMiddleware(mockUser), createMockRequireRole('HOMEOWNER'), async (c) => {
    return c.json({
      success: true,
      data: { items: [], total: 0, page: 1, limit: 20 },
    });
  });

  app.put('/api/homeowner/projects/:id', createMockAuthMiddleware(mockUser), createMockRequireRole('HOMEOWNER'), async (c) => {
    try {
      const body = await c.req.json();
      const result = UpdateProjectSchema.safeParse(body);
      if (!result.success) {
        return c.json(
          {
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: result.error.issues[0]?.message || 'Validation failed',
              details: result.error.issues,
            },
          },
          400
        );
      }
      const id = c.req.param('id');
      return c.json({
        success: true,
        data: { id, ...result.data },
      });
    } catch {
      return c.json(
        { success: false, error: { code: 'PARSE_ERROR', message: 'Invalid JSON' } },
        400
      );
    }
  });


  app.post('/api/homeowner/projects/:id/submit', createMockAuthMiddleware(mockUser), createMockRequireRole('HOMEOWNER'), async (c) => {
    try {
      const body = await c.req.json();
      const result = SubmitProjectSchema.safeParse(body);
      if (!result.success) {
        return c.json(
          {
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: result.error.issues[0]?.message || 'Validation failed',
              details: result.error.issues,
            },
          },
          400
        );
      }
      const id = c.req.param('id');
      return c.json({
        success: true,
        data: { id, status: 'PENDING_APPROVAL' },
      });
    } catch {
      return c.json(
        { success: false, error: { code: 'PARSE_ERROR', message: 'Invalid JSON' } },
        400
      );
    }
  });

  app.delete('/api/homeowner/projects/:id', createMockAuthMiddleware(mockUser), createMockRequireRole('HOMEOWNER'), async (c) => {
    return c.json({
      success: true,
      data: { message: 'Project deleted successfully' },
    });
  });

  // Admin routes (require ADMIN role)
  app.get('/api/admin/projects', createMockAuthMiddleware(mockUser), createMockRequireRole('ADMIN'), async (c) => {
    return c.json({
      success: true,
      data: { items: [], total: 0, page: 1, limit: 20 },
    });
  });

  app.put('/api/admin/projects/:id/approve', createMockAuthMiddleware(mockUser), createMockRequireRole('ADMIN'), async (c) => {
    const id = c.req.param('id');
    return c.json({
      success: true,
      data: { id, status: 'OPEN' },
    });
  });

  app.put('/api/admin/projects/:id/reject', createMockAuthMiddleware(mockUser), createMockRequireRole('ADMIN'), async (c) => {
    try {
      const body = await c.req.json();
      const result = RejectProjectSchema.safeParse(body);
      if (!result.success) {
        return c.json(
          {
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: result.error.issues[0]?.message || 'Validation failed',
              details: result.error.issues,
            },
          },
          400
        );
      }
      const id = c.req.param('id');
      return c.json({
        success: true,
        data: { id, status: 'REJECTED', reviewNote: result.data.note },
      });
    } catch {
      return c.json(
        { success: false, error: { code: 'PARSE_ERROR', message: 'Invalid JSON' } },
        400
      );
    }
  });

  return app;
}


// ============================================
// PROTECTED ROUTES DEFINITION
// ============================================

interface ProtectedRoute {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  path: string;
  requiredRole: Role;
  body?: Record<string, unknown>;
}

const protectedRoutes: ProtectedRoute[] = [
  // Homeowner routes
  { method: 'POST', path: '/api/homeowner/projects', requiredRole: 'HOMEOWNER', body: { title: 'Test', description: 'Test', categoryId: 'cat-1', regionId: 'reg-1', address: '123 Test St' } },
  { method: 'GET', path: '/api/homeowner/projects', requiredRole: 'HOMEOWNER' },
  { method: 'PUT', path: '/api/homeowner/projects/test-id', requiredRole: 'HOMEOWNER', body: { title: 'Updated' } },
  { method: 'POST', path: '/api/homeowner/projects/test-id/submit', requiredRole: 'HOMEOWNER', body: { bidDeadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() } },
  { method: 'DELETE', path: '/api/homeowner/projects/test-id', requiredRole: 'HOMEOWNER' },
  // Admin routes
  { method: 'GET', path: '/api/admin/projects', requiredRole: 'ADMIN' },
  { method: 'PUT', path: '/api/admin/projects/test-id/approve', requiredRole: 'ADMIN' },
  { method: 'PUT', path: '/api/admin/projects/test-id/reject', requiredRole: 'ADMIN', body: { note: 'Rejection reason' } },
];

// ============================================
// SCHEMA VALIDATION TESTS
// ============================================

describe('Project Routes Schema Validation', () => {
  describe('CreateProjectSchema', () => {
    it('should accept valid project data', () => {
      const result = CreateProjectSchema.safeParse({
        title: 'Test Project',
        description: 'A test project description',
        categoryId: 'category-1',
        regionId: 'region-1',
        address: '123 Test Street',
      });
      expect(result.success).toBe(true);
    });

    it('should reject missing required fields', () => {
      const result = CreateProjectSchema.safeParse({
        title: 'Test Project',
      });
      expect(result.success).toBe(false);
    });

    it('should reject empty title', () => {
      const result = CreateProjectSchema.safeParse({
        title: '',
        description: 'Description',
        categoryId: 'cat-1',
        regionId: 'reg-1',
        address: 'Address',
      });
      expect(result.success).toBe(false);
    });

    it('should reject budgetMin > budgetMax', () => {
      const result = CreateProjectSchema.safeParse({
        title: 'Test',
        description: 'Description',
        categoryId: 'cat-1',
        regionId: 'reg-1',
        address: 'Address',
        budgetMin: 100000000,
        budgetMax: 50000000,
      });
      expect(result.success).toBe(false);
    });

    it('should accept optional fields', () => {
      const result = CreateProjectSchema.safeParse({
        title: 'Test Project',
        description: 'Description',
        categoryId: 'cat-1',
        regionId: 'reg-1',
        address: 'Address',
        area: 100,
        budgetMin: 50000000,
        budgetMax: 100000000,
        timeline: '3 months',
        requirements: 'Special requirements',
      });
      expect(result.success).toBe(true);
    });
  });


  describe('SubmitProjectSchema', () => {
    it('should accept valid datetime', () => {
      const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
      const result = SubmitProjectSchema.safeParse({
        bidDeadline: futureDate,
      });
      expect(result.success).toBe(true);
    });

    it('should reject invalid datetime format', () => {
      const result = SubmitProjectSchema.safeParse({
        bidDeadline: 'invalid-date',
      });
      expect(result.success).toBe(false);
    });

    it('should reject missing bidDeadline', () => {
      const result = SubmitProjectSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });

  describe('RejectProjectSchema', () => {
    it('should accept valid rejection note', () => {
      const result = RejectProjectSchema.safeParse({
        note: 'Incomplete documentation',
      });
      expect(result.success).toBe(true);
    });

    it('should reject empty note', () => {
      const result = RejectProjectSchema.safeParse({
        note: '',
      });
      expect(result.success).toBe(false);
    });

    it('should reject missing note', () => {
      const result = RejectProjectSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });
});

// ============================================
// PROPERTY-BASED TESTS
// ============================================

describe('Project Routes Property-Based Tests', () => {
  /**
   * **Feature: api-test-coverage, Property 17: Protected routes require authentication**
   * **Validates: Requirements 6.1**
   *
   * For any protected route called without auth token, the response SHALL be 401 Unauthorized.
   */
  describe('Property 17: Protected routes require authentication', () => {
    it('should return 401 for all protected routes without auth token', async () => {
      const app = createTestApp(null); // No authenticated user

      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom(...protectedRoutes),
          async (route) => {
            const requestInit: RequestInit = {
              method: route.method,
              headers: { 'Content-Type': 'application/json' },
            };

            if (route.body && (route.method === 'POST' || route.method === 'PUT')) {
              requestInit.body = JSON.stringify(route.body);
            }

            const res = await app.fetch(
              new Request(`http://localhost${route.path}`, requestInit)
            );

            expect(res.status).toBe(401);
            const data = await res.json();
            expect(data.success).toBe(false);
            expect(data.error.code).toBe('AUTH_TOKEN_INVALID');
          }
        ),
        { numRuns: protectedRoutes.length }
      );
    });
  });


  /**
   * **Feature: api-test-coverage, Property 18: Role-restricted routes enforce authorization**
   * **Validates: Requirements 6.2**
   *
   * For any role-restricted route called with unauthorized role, the response SHALL be 403 Forbidden.
   */
  describe('Property 18: Role-restricted routes enforce authorization', () => {
    // Roles that should NOT have access to ADMIN routes
    const nonAdminRoles: Role[] = ['MANAGER', 'CONTRACTOR', 'HOMEOWNER', 'WORKER', 'USER'];
    
    // Roles that should NOT have access to HOMEOWNER routes (lower than HOMEOWNER)
    const nonHomeownerRoles: Role[] = ['WORKER', 'USER'];

    it('should return 403 for admin routes when called with non-admin roles', async () => {
      const adminRoutes = protectedRoutes.filter(r => r.requiredRole === 'ADMIN');

      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom(...adminRoutes),
          fc.constantFrom(...nonAdminRoles),
          async (route, role) => {
            const mockUser: MockUser = {
              sub: 'user-test-1',
              email: 'test@example.com',
              role,
            };
            const app = createTestApp(mockUser);

            const requestInit: RequestInit = {
              method: route.method,
              headers: { 'Content-Type': 'application/json' },
            };

            if (route.body && (route.method === 'POST' || route.method === 'PUT')) {
              requestInit.body = JSON.stringify(route.body);
            }

            const res = await app.fetch(
              new Request(`http://localhost${route.path}`, requestInit)
            );

            expect(res.status).toBe(403);
            const data = await res.json();
            expect(data.success).toBe(false);
            expect(data.error.code).toBe('AUTH_FORBIDDEN');
          }
        ),
        { numRuns: adminRoutes.length * nonAdminRoles.length }
      );
    });

    it('should return 403 for homeowner routes when called with lower roles', async () => {
      const homeownerRoutes = protectedRoutes.filter(r => r.requiredRole === 'HOMEOWNER');

      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom(...homeownerRoutes),
          fc.constantFrom(...nonHomeownerRoles),
          async (route, role) => {
            const mockUser: MockUser = {
              sub: 'user-test-1',
              email: 'test@example.com',
              role,
            };
            const app = createTestApp(mockUser);

            const requestInit: RequestInit = {
              method: route.method,
              headers: { 'Content-Type': 'application/json' },
            };

            if (route.body && (route.method === 'POST' || route.method === 'PUT')) {
              requestInit.body = JSON.stringify(route.body);
            }

            const res = await app.fetch(
              new Request(`http://localhost${route.path}`, requestInit)
            );

            expect(res.status).toBe(403);
            const data = await res.json();
            expect(data.success).toBe(false);
            expect(data.error.code).toBe('AUTH_FORBIDDEN');
          }
        ),
        { numRuns: homeownerRoutes.length * nonHomeownerRoles.length }
      );
    });

    it('should allow access for roles with sufficient permissions', async () => {
      // ADMIN should access admin routes
      const adminUser: MockUser = { sub: 'admin-1', email: 'admin@test.com', role: 'ADMIN' };
      const adminApp = createTestApp(adminUser);

      const adminRes = await adminApp.fetch(
        new Request('http://localhost/api/admin/projects')
      );
      expect(adminRes.status).toBe(200);

      // HOMEOWNER should access homeowner routes
      const homeownerUser: MockUser = { sub: 'homeowner-1', email: 'homeowner@test.com', role: 'HOMEOWNER' };
      const homeownerApp = createTestApp(homeownerUser);

      const homeownerRes = await homeownerApp.fetch(
        new Request('http://localhost/api/homeowner/projects')
      );
      expect(homeownerRes.status).toBe(200);

      // ADMIN should also access homeowner routes (higher role)
      const adminHomeownerRes = await adminApp.fetch(
        new Request('http://localhost/api/homeowner/projects')
      );
      expect(adminHomeownerRes.status).toBe(200);
    });
  });


  /**
   * **Feature: api-test-coverage, Property 19: Validation errors return 400**
   * **Validates: Requirements 6.3**
   *
   * For any route with validation, invalid input SHALL return 400 Bad Request with error details.
   */
  describe('Property 19: Validation errors return 400', () => {
    // Generator for invalid project data
    const invalidProjectDataGen = fc.oneof(
      // Missing required fields
      fc.constant({}),
      fc.constant({ title: 'Only title' }),
      fc.constant({ description: 'Only description' }),
      // Empty required fields
      fc.constant({ title: '', description: 'Desc', categoryId: 'cat', regionId: 'reg', address: 'addr' }),
      fc.constant({ title: 'Title', description: '', categoryId: 'cat', regionId: 'reg', address: 'addr' }),
      // Invalid budget range
      fc.constant({ title: 'Title', description: 'Desc', categoryId: 'cat', regionId: 'reg', address: 'addr', budgetMin: 100, budgetMax: 50 }),
      // Invalid area
      fc.constant({ title: 'Title', description: 'Desc', categoryId: 'cat', regionId: 'reg', address: 'addr', area: -10 }),
    );

    it('should return 400 for invalid project creation data', async () => {
      const homeownerUser: MockUser = { sub: 'homeowner-1', email: 'homeowner@test.com', role: 'HOMEOWNER' };
      const app = createTestApp(homeownerUser);

      await fc.assert(
        fc.asyncProperty(invalidProjectDataGen, async (invalidData) => {
          const res = await app.fetch(
            new Request('http://localhost/api/homeowner/projects', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(invalidData),
            })
          );

          expect(res.status).toBe(400);
          const data = await res.json();
          expect(data.success).toBe(false);
          expect(data.error.code).toBe('VALIDATION_ERROR');
          expect(data.error.message).toBeDefined();
        }),
        { numRuns: 20 }
      );
    });

    // Generator for invalid submit data
    const invalidSubmitDataGen = fc.oneof(
      fc.constant({}),
      fc.constant({ bidDeadline: '' }),
      fc.constant({ bidDeadline: 'not-a-date' }),
      fc.constant({ bidDeadline: '2024-13-45' }), // Invalid date
    );

    it('should return 400 for invalid submit data', async () => {
      const homeownerUser: MockUser = { sub: 'homeowner-1', email: 'homeowner@test.com', role: 'HOMEOWNER' };
      const app = createTestApp(homeownerUser);

      await fc.assert(
        fc.asyncProperty(invalidSubmitDataGen, async (invalidData) => {
          const res = await app.fetch(
            new Request('http://localhost/api/homeowner/projects/test-id/submit', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(invalidData),
            })
          );

          expect(res.status).toBe(400);
          const data = await res.json();
          expect(data.success).toBe(false);
          expect(data.error.code).toBe('VALIDATION_ERROR');
        }),
        { numRuns: 10 }
      );
    });

    // Generator for invalid reject data
    const invalidRejectDataGen = fc.oneof(
      fc.constant({}),
      fc.constant({ note: '' }),
    );

    it('should return 400 for invalid reject data', async () => {
      const adminUser: MockUser = { sub: 'admin-1', email: 'admin@test.com', role: 'ADMIN' };
      const app = createTestApp(adminUser);

      await fc.assert(
        fc.asyncProperty(invalidRejectDataGen, async (invalidData) => {
          const res = await app.fetch(
            new Request('http://localhost/api/admin/projects/test-id/reject', {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(invalidData),
            })
          );

          expect(res.status).toBe(400);
          const data = await res.json();
          expect(data.success).toBe(false);
          expect(data.error.code).toBe('VALIDATION_ERROR');
        }),
        { numRuns: 5 }
      );
    });
  });
});


// ============================================
// UNIT TESTS FOR RESPONSE FORMAT
// ============================================

describe('Project Routes Response Format', () => {
  /**
   * Tests for success response format
   * Requirements: 6.4 - Verify correct response format
   */
  describe('Success Response Format', () => {
    it('should return success: true with data for successful GET requests', async () => {
      const app = createTestApp(null);

      const res = await app.fetch(
        new Request('http://localhost/api/projects')
      );

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data).toHaveProperty('success', true);
      expect(data).toHaveProperty('data');
      expect(data.data).toHaveProperty('items');
      expect(data.data).toHaveProperty('total');
      expect(data.data).toHaveProperty('page');
      expect(data.data).toHaveProperty('limit');
    });

    it('should return success: true with data for successful POST requests', async () => {
      const homeownerUser: MockUser = { sub: 'homeowner-1', email: 'homeowner@test.com', role: 'HOMEOWNER' };
      const app = createTestApp(homeownerUser);

      const res = await app.fetch(
        new Request('http://localhost/api/homeowner/projects', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: 'Test Project',
            description: 'Test description',
            categoryId: 'cat-1',
            regionId: 'reg-1',
            address: '123 Test St',
          }),
        })
      );

      expect(res.status).toBe(201);
      const data = await res.json();
      expect(data).toHaveProperty('success', true);
      expect(data).toHaveProperty('data');
      expect(data.data).toHaveProperty('id');
      expect(data.data).toHaveProperty('title', 'Test Project');
      expect(data.data).toHaveProperty('status', 'DRAFT');
    });

    it('should return success: true with data for successful PUT requests', async () => {
      const homeownerUser: MockUser = { sub: 'homeowner-1', email: 'homeowner@test.com', role: 'HOMEOWNER' };
      const app = createTestApp(homeownerUser);

      const res = await app.fetch(
        new Request('http://localhost/api/homeowner/projects/test-id', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: 'Updated Title' }),
        })
      );

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data).toHaveProperty('success', true);
      expect(data).toHaveProperty('data');
      expect(data.data).toHaveProperty('id', 'test-id');
      expect(data.data).toHaveProperty('title', 'Updated Title');
    });

    it('should return success: true with message for successful DELETE requests', async () => {
      const homeownerUser: MockUser = { sub: 'homeowner-1', email: 'homeowner@test.com', role: 'HOMEOWNER' };
      const app = createTestApp(homeownerUser);

      const res = await app.fetch(
        new Request('http://localhost/api/homeowner/projects/test-id', {
          method: 'DELETE',
        })
      );

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data).toHaveProperty('success', true);
      expect(data).toHaveProperty('data');
      expect(data.data).toHaveProperty('message');
    });
  });


  /**
   * Tests for error response format
   * Requirements: 6.4 - Verify correct error response format
   */
  describe('Error Response Format', () => {
    it('should return success: false with error object for 401 responses', async () => {
      const app = createTestApp(null);

      const res = await app.fetch(
        new Request('http://localhost/api/homeowner/projects')
      );

      expect(res.status).toBe(401);
      const data = await res.json();
      expect(data).toHaveProperty('success', false);
      expect(data).toHaveProperty('error');
      expect(data.error).toHaveProperty('code', 'AUTH_TOKEN_INVALID');
      expect(data.error).toHaveProperty('message');
    });

    it('should return success: false with error object for 403 responses', async () => {
      const workerUser: MockUser = { sub: 'worker-1', email: 'worker@test.com', role: 'WORKER' };
      const app = createTestApp(workerUser);

      const res = await app.fetch(
        new Request('http://localhost/api/homeowner/projects')
      );

      expect(res.status).toBe(403);
      const data = await res.json();
      expect(data).toHaveProperty('success', false);
      expect(data).toHaveProperty('error');
      expect(data.error).toHaveProperty('code', 'AUTH_FORBIDDEN');
      expect(data.error).toHaveProperty('message');
    });

    it('should return success: false with error object for 400 responses', async () => {
      const homeownerUser: MockUser = { sub: 'homeowner-1', email: 'homeowner@test.com', role: 'HOMEOWNER' };
      const app = createTestApp(homeownerUser);

      const res = await app.fetch(
        new Request('http://localhost/api/homeowner/projects', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({}), // Invalid - missing required fields
        })
      );

      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data).toHaveProperty('success', false);
      expect(data).toHaveProperty('error');
      expect(data.error).toHaveProperty('code', 'VALIDATION_ERROR');
      expect(data.error).toHaveProperty('message');
    });

    it('should return success: false with error object for 404 responses', async () => {
      const app = createTestApp(null);

      const res = await app.fetch(
        new Request('http://localhost/api/projects/not-found')
      );

      expect(res.status).toBe(404);
      const data = await res.json();
      expect(data).toHaveProperty('success', false);
      expect(data).toHaveProperty('error');
      expect(data.error).toHaveProperty('code', 'PROJECT_NOT_FOUND');
      expect(data.error).toHaveProperty('message');
    });

    it('should include error details for validation errors', async () => {
      const homeownerUser: MockUser = { sub: 'homeowner-1', email: 'homeowner@test.com', role: 'HOMEOWNER' };
      const app = createTestApp(homeownerUser);

      const res = await app.fetch(
        new Request('http://localhost/api/homeowner/projects', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: '', // Invalid - empty
            description: 'Test',
            categoryId: 'cat-1',
            regionId: 'reg-1',
            address: 'addr',
          }),
        })
      );

      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toHaveProperty('details');
      expect(Array.isArray(data.error.details)).toBe(true);
    });
  });
});

// ============================================
// ENDPOINT BEHAVIOR TESTS
// ============================================

describe('Project Routes Endpoint Behavior', () => {
  describe('Public Routes', () => {
    it('GET /api/projects should be accessible without auth', async () => {
      const app = createTestApp(null);
      const res = await app.fetch(new Request('http://localhost/api/projects'));
      expect(res.status).toBe(200);
    });

    it('GET /api/projects/:id should be accessible without auth', async () => {
      const app = createTestApp(null);
      const res = await app.fetch(new Request('http://localhost/api/projects/test-id'));
      expect(res.status).toBe(200);
    });
  });

  describe('Homeowner Routes', () => {
    const homeownerUser: MockUser = { sub: 'homeowner-1', email: 'homeowner@test.com', role: 'HOMEOWNER' };

    it('POST /api/homeowner/projects should create project with valid data', async () => {
      const app = createTestApp(homeownerUser);
      const res = await app.fetch(
        new Request('http://localhost/api/homeowner/projects', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: 'New Project',
            description: 'Project description',
            categoryId: 'cat-1',
            regionId: 'reg-1',
            address: '123 Main St',
          }),
        })
      );
      expect(res.status).toBe(201);
      const data = await res.json();
      expect(data.data.status).toBe('DRAFT');
    });

    it('GET /api/homeowner/projects should list user projects', async () => {
      const app = createTestApp(homeownerUser);
      const res = await app.fetch(new Request('http://localhost/api/homeowner/projects'));
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.data).toHaveProperty('items');
    });
  });

  describe('Admin Routes', () => {
    const adminUser: MockUser = { sub: 'admin-1', email: 'admin@test.com', role: 'ADMIN' };

    it('GET /api/admin/projects should list all projects', async () => {
      const app = createTestApp(adminUser);
      const res = await app.fetch(new Request('http://localhost/api/admin/projects'));
      expect(res.status).toBe(200);
    });

    it('PUT /api/admin/projects/:id/approve should approve project', async () => {
      const app = createTestApp(adminUser);
      const res = await app.fetch(
        new Request('http://localhost/api/admin/projects/test-id/approve', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
        })
      );
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.data.status).toBe('OPEN');
    });

    it('PUT /api/admin/projects/:id/reject should reject project with note', async () => {
      const app = createTestApp(adminUser);
      const res = await app.fetch(
        new Request('http://localhost/api/admin/projects/test-id/reject', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ note: 'Incomplete documentation' }),
        })
      );
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.data.status).toBe('REJECTED');
      expect(data.data.reviewNote).toBe('Incomplete documentation');
    });
  });
});
