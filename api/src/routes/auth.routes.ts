import { Hono } from 'hono';
import { z } from 'zod';
import type { PrismaClient } from '@prisma/client';
import type { Context } from 'hono';
import { AuthService, AuthError, type Role } from '../services/auth.service';
import { createAuthMiddleware, getUser } from '../middleware/auth.middleware';
import { loginRateLimiter, resetLimit, clearAllLimits } from '../middleware/rate-limiter';
import { turnstileMiddleware } from '../middleware/turnstile';
import { successResponse, errorResponse } from '../utils/response';

// ============================================
// ZOD SCHEMAS
// ============================================

const RegisterSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(1, 'Name is required'),
  role: z.enum(['ADMIN', 'MANAGER', 'CONTRACTOR', 'HOMEOWNER', 'WORKER', 'USER']).optional(),
  accountType: z.enum(['user', 'homeowner', 'contractor']).optional().default('user'),
  phone: z.string().optional(),
  companyName: z.string().optional(),
});

const LoginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

const RefreshSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters'),
});

// ============================================
// HELPER FUNCTIONS
// ============================================

function getClientIp(c: { req: { header: (name: string) => string | undefined } }): string {
  return (
    c.req.header('x-forwarded-for')?.split(',')[0]?.trim() ||
    c.req.header('x-real-ip') ||
    'unknown'
  );
}

function handleError(c: Context, error: unknown): Response {
  if (error instanceof z.ZodError) {
    const firstError = error.issues[0];
    return errorResponse(c, 'VALIDATION_ERROR', firstError?.message || 'Validation failed', 400);
  }
  if (error instanceof AuthError) {
    return errorResponse(c, error.code, error.message, error.statusCode);
  }
  throw error;
}

// ============================================
// AUTH ROUTES FACTORY
// ============================================

export function createAuthRoutes(prisma: PrismaClient) {
  const app = new Hono();
  const authService = new AuthService(prisma);
  const { authenticate, requireRole } = createAuthMiddleware(prisma);

  // ============================================
  // POST /auth/register - Create new user (Admin only)
  // ============================================
  app.post('/register', authenticate(), requireRole('ADMIN'), async (c) => {
    try {
      const body = await c.req.json();
      const validated = RegisterSchema.parse(body);

      const user = await authService.register({
        email: validated.email,
        password: validated.password,
        name: validated.name,
        role: validated.role as Role,
        accountType: validated.accountType,
        phone: validated.phone,
        companyName: validated.companyName,
      });

      return successResponse(c, {
        name: user.name,
        role: user.role,
        verificationStatus: user.verificationStatus,
        createdAt: user.createdAt,
      }, 201);
    } catch (error) {
      return handleError(c, error);
    }
  });

  // ============================================
  // POST /auth/signup - Public registration for homeowner/contractor
  // **Feature: production-scalability**
  // **Validates: Requirements 3.3**
  // ============================================
  app.post('/signup', loginRateLimiter(), turnstileMiddleware(), async (c) => {
    try {
      const body = await c.req.json();
      const validated = RegisterSchema.parse(body);

      // Only allow homeowner and contractor registration via public signup
      if (validated.accountType !== 'homeowner' && validated.accountType !== 'contractor') {
        return errorResponse(c, 'VALIDATION_ERROR', 'Account type must be homeowner or contractor', 400);
      }

      const user = await authService.register({
        email: validated.email,
        password: validated.password,
        name: validated.name,
        accountType: validated.accountType,
        phone: validated.phone,
        companyName: validated.companyName,
      });

      // For homeowner, auto-login after registration
      if (validated.accountType === 'homeowner') {
        const userAgent = c.req.header('user-agent');
        const ipAddress = getClientIp(c);
        
        const result = await authService.login(
          validated.email,
          validated.password,
          userAgent,
          ipAddress
        );

        return successResponse(c, {
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            verificationStatus: user.verificationStatus,
          },
          accessToken: result.tokens.accessToken,
          refreshToken: result.tokens.refreshToken,
          expiresIn: result.tokens.expiresIn,
          sessionId: result.sessionId,
          message: 'Đăng ký thành công! Bạn đã được đăng nhập tự động.',
        }, 201);
      }

      // For contractor, return user info without tokens (need verification first)
      return successResponse(c, {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          verificationStatus: user.verificationStatus,
        },
        message: 'Đăng ký thành công! Vui lòng hoàn thiện hồ sơ và chờ xét duyệt.',
      }, 201);
    } catch (error) {
      return handleError(c, error);
    }
  });

  // ============================================
  // POST /auth/login - Login and get tokens
  // ============================================
  app.post('/login', loginRateLimiter(), async (c) => {
    try {
      const body = await c.req.json();
      const validated = LoginSchema.parse(body);

      const userAgent = c.req.header('user-agent');
      const ipAddress = getClientIp(c);

      const result = await authService.login(
        validated.email,
        validated.password,
        userAgent,
        ipAddress
      );

      // Reset rate limit on successful login
      resetLimit(`login:${ipAddress}`);

      return successResponse(c, {
        user: result.user,
        accessToken: result.tokens.accessToken,
        refreshToken: result.tokens.refreshToken,
        expiresIn: result.tokens.expiresIn,
        sessionId: result.sessionId,
      });
    } catch (error) {
      return handleError(c, error);
    }
  });

  // ============================================
  // POST /auth/refresh - Refresh access token (with rotation)
  // ============================================
  app.post('/refresh', async (c) => {
    try {
      const body = await c.req.json();
      const validated = RefreshSchema.parse(body);

      const userAgent = c.req.header('user-agent');
      const ipAddress = getClientIp(c);

      const result = await authService.refreshToken(
        validated.refreshToken,
        ipAddress,
        userAgent
      );

      return successResponse(c, {
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        expiresIn: result.expiresIn,
        sessionId: result.sessionId,
      });
    } catch (error) {
      return handleError(c, error);
    }
  });

  // ============================================
  // POST /auth/logout - Logout current session (with blacklist)
  // ============================================
  app.post('/logout', authenticate(), async (c) => {
    try {
      const sessionId = c.req.header('x-session-id');
      const accessToken = c.req.header('authorization')?.replace('Bearer ', '');
      const userAgent = c.req.header('user-agent');
      const ipAddress = getClientIp(c);

      if (sessionId) {
        await authService.logout(sessionId, accessToken, ipAddress, userAgent);
      }
      return successResponse(c, { message: 'Logged out successfully' });
    } catch (error) {
      return handleError(c, error);
    }
  });

  // ============================================
  // POST /auth/change-password - Change password (revokes all sessions)
  // ============================================
  app.post('/change-password', authenticate(), async (c) => {
    try {
      const body = await c.req.json();
      const validated = ChangePasswordSchema.parse(body);

      const payload = getUser(c);
      const sessionId = c.req.header('x-session-id') || '';
      const userAgent = c.req.header('user-agent') || '';
      const ipAddress = getClientIp(c);

      const tokens = await authService.changePassword(
        payload.sub,
        validated.currentPassword,
        validated.newPassword,
        sessionId,
        ipAddress,
        userAgent
      );

      return successResponse(c, {
        message: 'Password changed successfully. All other sessions have been revoked.',
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresIn: tokens.expiresIn,
      });
    } catch (error) {
      return handleError(c, error);
    }
  });

  // ============================================
  // GET /auth/me - Get current user info
  // ============================================
  app.get('/me', authenticate(), async (c) => {
    try {
      const payload = getUser(c);
      const user = await authService.getUserById(payload.sub);

      if (!user) {
        return errorResponse(c, 'USER_NOT_FOUND', 'User not found', 404);
      }

      return successResponse(c, user);
    } catch (error) {
      return handleError(c, error);
    }
  });

  // ============================================
  // GET /auth/sessions - List user's sessions
  // ============================================
  app.get('/sessions', authenticate(), async (c) => {
    try {
      const payload = getUser(c);
      const currentSessionId = c.req.header('x-session-id');
      const sessions = await authService.getUserSessions(payload.sub, currentSessionId);

      return successResponse(c, { sessions });
    } catch (error) {
      return handleError(c, error);
    }
  });

  // ============================================
  // DELETE /auth/sessions/:id - Revoke specific session
  // ============================================
  app.delete('/sessions/:id', authenticate(), async (c) => {
    try {
      const sessionId = c.req.param('id');
      await authService.logout(sessionId);

      return successResponse(c, { message: 'Session revoked successfully' });
    } catch (error) {
      return handleError(c, error);
    }
  });

  // ============================================
  // DELETE /auth/sessions - Revoke all other sessions
  // ============================================
  app.delete('/sessions', authenticate(), async (c) => {
    try {
      const payload = getUser(c);
      const currentSessionId = c.req.header('x-session-id');
      const count = await authService.revokeAllSessions(payload.sub, currentSessionId);

      return successResponse(c, { message: `Revoked ${count} session(s)`, count });
    } catch (error) {
      return handleError(c, error);
    }
  });

  // ============================================
  // DEV ONLY: Clear rate limits (Development only)
  // ============================================
  if (process.env.NODE_ENV !== 'production') {
    app.post('/clear-rate-limits', async (c) => {
      clearAllLimits();
      return successResponse(c, { message: 'All rate limits cleared' });
    });
  }

  return app;
}
