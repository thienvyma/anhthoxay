/**
 * Auth Service Tests
 * Tests JWT authentication, token management, password hashing
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

// Import the actual module for testing pure functions
import {
  AuthService,
  AuthError,
  validateJWTSecret,
  generateTokenPair,
  parseToken,
} from './auth.service';

// Create mock Prisma instance
const createMockPrisma = () => ({
  user: {
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
  session: {
    create: vi.fn(),
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    deleteMany: vi.fn(),
  },
  tokenBlacklist: {
    create: vi.fn(),
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    upsert: vi.fn(),
    deleteMany: vi.fn(),
  },
  auditLog: {
    create: vi.fn(),
  },
});

describe('AuthService', () => {
  let authService: AuthService;
  let mockPrisma: ReturnType<typeof createMockPrisma>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockPrisma = createMockPrisma();

    // Setup environment
    process.env.JWT_SECRET = 'test-jwt-secret-32-chars-minimum';
    process.env.NODE_ENV = 'test';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
    authService = new AuthService(mockPrisma as any);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('JWT Secret Validation', () => {
    it('should validate JWT secret configuration', () => {
      expect(() => validateJWTSecret()).not.toThrow();
    });

    it('should throw error for missing JWT secret in production', () => {
      const originalEnv = process.env.NODE_ENV;
      const originalSecret = process.env.JWT_SECRET;

      process.env.NODE_ENV = 'production';
      delete process.env.JWT_SECRET;

      expect(() => validateJWTSecret()).toThrow(
        'JWT_SECRET environment variable is required in production'
      );

      process.env.NODE_ENV = originalEnv;
      process.env.JWT_SECRET = originalSecret;
    });

    it('should accept dev fallback in development', () => {
      const originalEnv = process.env.NODE_ENV;
      const originalSecret = process.env.JWT_SECRET;

      process.env.NODE_ENV = 'development';
      delete process.env.JWT_SECRET;

      expect(() => validateJWTSecret()).not.toThrow();

      process.env.NODE_ENV = originalEnv;
      process.env.JWT_SECRET = originalSecret;
    });

    it('should throw error for short JWT secret', () => {
      const originalSecret = process.env.JWT_SECRET;
      process.env.JWT_SECRET = 'short';

      expect(() => validateJWTSecret()).toThrow(/must be at least 32 characters/);

      process.env.JWT_SECRET = originalSecret;
    });
  });

  describe('Token Pair Generation', () => {
    it('should generate valid token pair', () => {
      const tokenPair = generateTokenPair();

      expect(tokenPair.selector).toBeDefined();
      expect(tokenPair.verifier).toBeDefined();
      expect(tokenPair.fullToken).toBeDefined();
      expect(tokenPair.selector.length).toBe(32);
      expect(tokenPair.verifier.length).toBe(64);
      expect(tokenPair.fullToken).toBe(`${tokenPair.selector}.${tokenPair.verifier}`);
    });

    it('should generate unique token pairs', () => {
      const pair1 = generateTokenPair();
      const pair2 = generateTokenPair();

      expect(pair1.selector).not.toBe(pair2.selector);
      expect(pair1.verifier).not.toBe(pair2.verifier);
    });
  });

  describe('Token Parsing', () => {
    it('should parse valid token', () => {
      const tokenPair = generateTokenPair();
      const parsed = parseToken(tokenPair.fullToken);

      expect(parsed).not.toBeNull();
      expect(parsed?.selector).toBe(tokenPair.selector);
      expect(parsed?.verifier).toBe(tokenPair.verifier);
    });

    it('should return null for invalid token format', () => {
      expect(parseToken('invalid')).toBeNull();
      expect(parseToken('no.dots.here')).toBeNull();
      expect(parseToken('')).toBeNull();
    });

    it('should return null for wrong length components', () => {
      expect(parseToken('short.verifier')).toBeNull();
      expect(parseToken('a'.repeat(32) + '.short')).toBeNull();
    });

    it('should return null for non-hex characters', () => {
      expect(parseToken('g'.repeat(32) + '.' + 'a'.repeat(64))).toBeNull();
    });
  });

  describe('Password Hashing', () => {
    it('should hash passwords', async () => {
      const password = 'testPassword123';
      const hash = await authService.hashPassword(password);

      expect(hash).toBeDefined();
      expect(typeof hash).toBe('string');
      expect(hash.length).toBeGreaterThan(0);
      expect(hash).not.toBe(password);
    });

    it('should verify correct passwords', async () => {
      const password = 'testPassword123';
      const hash = await authService.hashPassword(password);
      const isValid = await authService.verifyPassword(password, hash);

      expect(isValid).toBe(true);
    });

    it('should reject incorrect passwords', async () => {
      const password = 'testPassword123';
      const hash = await authService.hashPassword(password);
      const isValid = await authService.verifyPassword('wrongPassword', hash);

      expect(isValid).toBe(false);
    });
  });

  describe('JWT Token Generation', () => {
    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      role: 'ADMIN',
    };

    it('should generate access tokens', () => {
      const token = authService.generateAccessToken(mockUser);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.').length).toBe(3); // JWT has 3 parts
    });

    it('should generate refresh tokens', () => {
      const tokenPair = authService.generateRefreshToken();

      expect(tokenPair).toBeDefined();
      expect(tokenPair.selector).toBeDefined();
      expect(tokenPair.verifier).toBeDefined();
      expect(tokenPair.fullToken).toBeDefined();
    });

    it('should verify valid access tokens', () => {
      const token = authService.generateAccessToken(mockUser);
      const result = authService.verifyAccessToken(token);

      expect(result).toBeDefined();
      expect(result?.sub).toBe(mockUser.id);
      expect(result?.email).toBe(mockUser.email);
    });

    it('should return null for invalid tokens', () => {
      const result = authService.verifyAccessToken('invalid-token');

      expect(result).toBeNull();
    });

    it('should return null for tampered tokens', () => {
      const token = authService.generateAccessToken(mockUser);
      const tamperedToken = token.slice(0, -5) + 'xxxxx';
      const result = authService.verifyAccessToken(tamperedToken);

      expect(result).toBeNull();
    });
  });

  describe('User Registration', () => {
    it('should register new user', async () => {
      const input = {
        email: 'new@example.com',
        password: 'password123',
        name: 'New User',
      };

      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue({
        id: 'new-user-id',
        email: input.email,
        name: input.name,
        role: 'USER',
        verificationStatus: 'PENDING',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await authService.register(input);

      expect(result).toBeDefined();
      expect(result.email).toBe(input.email);
      expect(mockPrisma.user.create).toHaveBeenCalled();
    });

    it('should throw error for existing email', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'existing' });

      await expect(
        authService.register({
          email: 'existing@example.com',
          password: 'password123',
          name: 'User',
        })
      ).rejects.toThrow(AuthError);
    });

    it('should auto-approve homeowner accounts', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue({
        id: 'homeowner-id',
        email: 'homeowner@example.com',
        name: 'Homeowner',
        role: 'HOMEOWNER',
        verificationStatus: 'VERIFIED',
        verifiedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await authService.register({
        email: 'homeowner@example.com',
        password: 'password123',
        name: 'Homeowner',
        accountType: 'homeowner',
      });

      expect(result.role).toBe('HOMEOWNER');
      expect(result.verificationStatus).toBe('VERIFIED');
    });

    it('should set contractor accounts to pending', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue({
        id: 'contractor-id',
        email: 'contractor@example.com',
        name: 'Contractor',
        role: 'CONTRACTOR',
        verificationStatus: 'PENDING',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await authService.register({
        email: 'contractor@example.com',
        password: 'password123',
        name: 'Contractor',
        accountType: 'contractor',
      });

      expect(result.role).toBe('CONTRACTOR');
      expect(result.verificationStatus).toBe('PENDING');
    });
  });

  describe('User Login', () => {
    it('should throw error for invalid email', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.auditLog.create.mockResolvedValue({});

      await expect(authService.login('invalid@example.com', 'password123')).rejects.toThrow(
        AuthError
      );
    });

    it('should throw error for invalid password', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        passwordHash: await authService.hashPassword('correctPassword'),
        name: 'Test User',
        role: 'ADMIN',
        verificationStatus: 'VERIFIED',
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.auditLog.create.mockResolvedValue({});

      await expect(authService.login('test@example.com', 'wrongpassword')).rejects.toThrow(
        AuthError
      );
    });

    it('should login with valid credentials', async () => {
      const password = 'password123';
      const passwordHash = await authService.hashPassword(password);

      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        passwordHash,
        name: 'Test User',
        role: 'ADMIN',
        verificationStatus: 'VERIFIED',
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.session.findMany.mockResolvedValue([]);
      mockPrisma.session.create.mockResolvedValue({
        id: 'session-123',
        userId: mockUser.id,
        tokenSelector: 'selector',
        tokenVerifier: 'verifier',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      });
      mockPrisma.auditLog.create.mockResolvedValue({});

      const result = await authService.login('test@example.com', password);

      expect(result).toBeDefined();
      expect(result.user.id).toBe(mockUser.id);
      expect(result.tokens.accessToken).toBeDefined();
      expect(result.tokens.refreshToken).toBeDefined();
      expect(result.sessionId).toBe('session-123');
    });
  });

  describe('Token Blacklist', () => {
    it('should add token to blacklist', async () => {
      mockPrisma.tokenBlacklist.upsert.mockResolvedValue({});

      await authService.addToBlacklist('token', 'user-123', 'logout');

      expect(mockPrisma.tokenBlacklist.upsert).toHaveBeenCalled();
    });

    it('should check if token is blacklisted', async () => {
      mockPrisma.tokenBlacklist.findUnique.mockResolvedValue(null);

      const isBlacklisted = await authService.isBlacklisted('token');

      expect(isBlacklisted).toBe(false);
    });

    it('should detect blacklisted tokens', async () => {
      mockPrisma.tokenBlacklist.findUnique.mockResolvedValue({
        tokenHash: 'hash',
        expiresAt: new Date(Date.now() + 60000),
      });

      const isBlacklisted = await authService.isBlacklisted('token');

      expect(isBlacklisted).toBe(true);
    });
  });

  describe('Session Management', () => {
    it('should get user sessions', async () => {
      mockPrisma.session.findMany.mockResolvedValue([
        {
          id: 'session-1',
          userAgent: 'Chrome',
          ipAddress: '127.0.0.1',
          createdAt: new Date(),
          expiresAt: new Date(Date.now() + 60000),
        },
      ]);

      const sessions = await authService.getUserSessions('user-123');

      expect(sessions).toHaveLength(1);
      expect(sessions[0].id).toBe('session-1');
    });

    it('should revoke all sessions', async () => {
      mockPrisma.session.deleteMany.mockResolvedValue({ count: 3 });

      const count = await authService.revokeAllSessions('user-123');

      expect(count).toBe(3);
    });

    it('should revoke all sessions except current', async () => {
      mockPrisma.session.deleteMany.mockResolvedValue({ count: 2 });

      const count = await authService.revokeAllSessions('user-123', 'current-session');

      expect(count).toBe(2);
      expect(mockPrisma.session.deleteMany).toHaveBeenCalledWith({
        where: {
          userId: 'user-123',
          id: { not: 'current-session' },
        },
      });
    });
  });

  describe('AuthError', () => {
    it('should create error with correct status code', () => {
      const error = new AuthError('AUTH_INVALID_CREDENTIALS', 'Invalid credentials');

      expect(error.code).toBe('AUTH_INVALID_CREDENTIALS');
      expect(error.message).toBe('Invalid credentials');
      expect(error.statusCode).toBe(401);
    });

    it('should use custom status code when provided', () => {
      const error = new AuthError('CUSTOM_ERROR', 'Custom error', 500);

      expect(error.statusCode).toBe(500);
    });

    it('should map known error codes to status codes', () => {
      expect(new AuthError('AUTH_FORBIDDEN', 'Forbidden').statusCode).toBe(403);
      expect(new AuthError('AUTH_USER_NOT_FOUND', 'Not found').statusCode).toBe(404);
      expect(new AuthError('AUTH_RATE_LIMITED', 'Rate limited').statusCode).toBe(429);
      expect(new AuthError('AUTH_EMAIL_EXISTS', 'Email exists').statusCode).toBe(400);
    });
  });
});
