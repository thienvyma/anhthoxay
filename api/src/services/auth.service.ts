import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { randomBytes, createHash } from 'crypto';

// ============================================
// TYPES & INTERFACES
// ============================================

export type Role = 'ADMIN' | 'MANAGER' | 'WORKER' | 'USER';

export interface JWTPayload {
  sub: string;
  email: string;
  role: Role;
  iss: string;
  iat: number;
  exp: number;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface RegisterInput {
  email: string;
  password: string;
  name: string;
  role?: Role;
}

export interface SessionInfo {
  id: string;
  userAgent: string | null;
  ipAddress: string | null;
  createdAt: Date;
  expiresAt: Date;
  isCurrent: boolean;
}

export interface JWTSecretConfig {
  secret: string;
  minLength: number;
  issuer: string;
}

export type AuditEventType =
  | 'LOGIN_SUCCESS'
  | 'LOGIN_FAILED'
  | 'LOGOUT'
  | 'TOKEN_REFRESH'
  | 'PASSWORD_CHANGE'
  | 'SESSION_REVOKED'
  | 'TOKEN_REUSE_DETECTED'
  | 'RATE_LIMIT_EXCEEDED'
  | 'SESSION_LIMIT_REACHED';

export type AuditSeverity = 'INFO' | 'WARNING' | 'CRITICAL';

// ============================================
// CONSTANTS
// ============================================

const BCRYPT_COST = 10;
const ACCESS_TOKEN_EXPIRY = '15m';
const ACCESS_TOKEN_EXPIRY_SECONDS = 15 * 60;
const REFRESH_TOKEN_EXPIRY_DAYS = 7;
const JWT_SECRET_MIN_LENGTH = 32;
const JWT_ISSUER = 'anh-tho-xay-api';
const MAX_SESSIONS_PER_USER = 5;

// ============================================
// JWT SECRET VALIDATION
// ============================================

export function validateJWTSecret(): JWTSecretConfig {
  const secret = process.env.JWT_SECRET;
  const isDev = process.env.NODE_ENV !== 'production';

  if (!secret && isDev) {
    console.warn('⚠️ JWT_SECRET not set - using development fallback. NOT FOR PRODUCTION!');
    return {
      secret: 'dev-secret-32-chars-minimum-xxxxx',
      minLength: JWT_SECRET_MIN_LENGTH,
      issuer: 'ath-api-dev',
    };
  }

  if (!secret) {
    throw new Error('JWT_SECRET environment variable is required in production');
  }

  if (secret.length < JWT_SECRET_MIN_LENGTH) {
    throw new Error(`JWT_SECRET must be at least ${JWT_SECRET_MIN_LENGTH} characters (got ${secret.length})`);
  }

  return {
    secret,
    minLength: JWT_SECRET_MIN_LENGTH,
    issuer: JWT_ISSUER,
  };
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

// ============================================
// TOKEN SELECTOR PATTERN
// ============================================

export interface TokenPair {
  selector: string;   // 16 bytes hex (32 chars) - stored plaintext, indexed
  verifier: string;   // 32 bytes hex (64 chars) - stored as bcrypt hash
  fullToken: string;  // selector.verifier (96 chars total)
}

/**
 * Generate a token pair for the selector/verifier pattern.
 * This enables O(1) session lookup instead of O(n) bcrypt comparisons.
 */
export function generateTokenPair(): TokenPair {
  const selector = randomBytes(16).toString('hex'); // 32 chars
  const verifier = randomBytes(32).toString('hex'); // 64 chars
  const fullToken = `${selector}.${verifier}`;
  return { selector, verifier, fullToken };
}

/**
 * Parse a full token into selector and verifier components.
 * Returns null if the token format is invalid.
 */
export function parseToken(fullToken: string): { selector: string; verifier: string } | null {
  const parts = fullToken.split('.');
  if (parts.length !== 2) {
    return null;
  }
  const [selector, verifier] = parts;
  // Validate lengths: selector = 32 chars, verifier = 64 chars
  if (selector.length !== 32 || verifier.length !== 64) {
    return null;
  }
  // Validate hex format
  if (!/^[a-f0-9]+$/i.test(selector) || !/^[a-f0-9]+$/i.test(verifier)) {
    return null;
  }
  return { selector, verifier };
}

// ============================================
// AUTH SERVICE CLASS
// ============================================

export class AuthService {
  private prisma: PrismaClient;
  private jwtConfig: JWTSecretConfig;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
    this.jwtConfig = validateJWTSecret();
  }

  // ============================================
  // PASSWORD FUNCTIONS
  // ============================================

  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, BCRYPT_COST);
  }

  async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  // ============================================
  // TOKEN FUNCTIONS
  // ============================================

  generateAccessToken(user: { id: string; email: string; role: string }): string {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      iss: this.jwtConfig.issuer,
    };
    return jwt.sign(payload, this.jwtConfig.secret, { expiresIn: ACCESS_TOKEN_EXPIRY });
  }

  /**
   * Generate a refresh token using the selector/verifier pattern.
   * Returns the full token (selector.verifier) to be sent to the client.
   */
  generateRefreshToken(): TokenPair {
    return generateTokenPair();
  }

  verifyAccessToken(token: string): JWTPayload | null {
    try {
      const payload = jwt.verify(token, this.jwtConfig.secret, {
        issuer: this.jwtConfig.issuer,
      }) as JWTPayload;
      return payload;
    } catch {
      return null;
    }
  }

  // Enhanced verification with specific error codes
  verifyAccessTokenWithError(token: string): { payload: JWTPayload | null; error?: string } {
    try {
      const payload = jwt.verify(token, this.jwtConfig.secret, {
        issuer: this.jwtConfig.issuer,
      }) as JWTPayload;
      return { payload };
    } catch (err) {
      if (err instanceof jwt.TokenExpiredError) {
        return { payload: null, error: 'TOKEN_EXPIRED' };
      }
      if (err instanceof jwt.JsonWebTokenError) {
        return { payload: null, error: 'TOKEN_INVALID' };
      }
      return { payload: null, error: 'TOKEN_INVALID' };
    }
  }

  // ============================================
  // SESSION FUNCTIONS
  // ============================================

  /**
   * Create a new session with the token selector pattern.
   * Stores the selector (plaintext, indexed) and verifier (bcrypt hashed).
   */
  async createSession(
    userId: string,
    tokenPair: TokenPair,
    userAgent?: string,
    ipAddress?: string
  ) {
    const hashedVerifier = await bcrypt.hash(tokenPair.verifier, BCRYPT_COST);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRY_DAYS);

    return this.prisma.session.create({
      data: {
        userId,
        tokenSelector: tokenPair.selector,
        tokenVerifier: hashedVerifier,
        userAgent: userAgent || null,
        ipAddress: ipAddress || null,
        expiresAt,
      },
    });
  }

  /**
   * Get session by refresh token using O(1) lookup.
   * 1. Parse token to extract selector and verifier
   * 2. Query by tokenSelector (indexed, O(1))
   * 3. Verify tokenVerifier with single bcrypt compare
   */
  async getSessionByToken(refreshToken: string) {
    // Parse the token into selector and verifier
    const parsed = parseToken(refreshToken);
    if (!parsed) {
      return null; // Invalid token format
    }

    // O(1) lookup by indexed selector
    const session = await this.prisma.session.findUnique({
      where: { tokenSelector: parsed.selector },
      include: { user: true },
    });

    if (!session) {
      return null; // Selector not found
    }

    // Check if session is expired
    if (session.expiresAt <= new Date()) {
      return null; // Session expired
    }

    // Single bcrypt comparison to verify the token
    const isValid = await bcrypt.compare(parsed.verifier, session.tokenVerifier);
    if (!isValid) {
      return null; // Verifier doesn't match
    }

    return session;
  }

  async deleteSession(sessionId: string): Promise<void> {
    await this.prisma.session.delete({ where: { id: sessionId } });
  }

  async getUserSessions(userId: string, currentSessionId?: string): Promise<SessionInfo[]> {
    const sessions = await this.prisma.session.findMany({
      where: {
        userId,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'asc' }, // Oldest first for session limit enforcement
    });

    return sessions.map((s) => ({
      id: s.id,
      userAgent: s.userAgent,
      ipAddress: s.ipAddress,
      createdAt: s.createdAt,
      expiresAt: s.expiresAt,
      isCurrent: s.id === currentSessionId,
    }));
  }

  async revokeAllSessions(userId: string, exceptSessionId?: string): Promise<number> {
    const result = await this.prisma.session.deleteMany({
      where: {
        userId,
        ...(exceptSessionId ? { id: { not: exceptSessionId } } : {}),
      },
    });
    return result.count;
  }

  // ============================================
  // USER FUNCTIONS
  // ============================================

  async register(input: RegisterInput) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: input.email.toLowerCase() },
    });

    if (existingUser) {
      throw new AuthError('AUTH_EMAIL_EXISTS', 'Email already registered');
    }

    const passwordHash = await this.hashPassword(input.password);

    return this.prisma.user.create({
      data: {
        email: input.email.toLowerCase(),
        passwordHash,
        name: input.name,
        role: input.role || 'USER',
      },
    });
  }

  async login(
    email: string,
    password: string,
    userAgent?: string,
    ipAddress?: string
  ): Promise<{ user: { id: string; email: string; name: string; role: string }; tokens: AuthTokens; sessionId: string }> {
    const user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      // Log failed attempt
      await this.logAudit('LOGIN_FAILED', {
        email: email.toLowerCase(),
        ipAddress: ipAddress || 'unknown',
        userAgent: userAgent || 'unknown',
        metadata: { reason: 'user_not_found' },
        severity: 'WARNING',
      });
      throw new AuthError('AUTH_INVALID_CREDENTIALS', 'Invalid email or password');
    }

    const isValidPassword = await this.verifyPassword(password, user.passwordHash);
    if (!isValidPassword) {
      // Log failed attempt
      await this.logAudit('LOGIN_FAILED', {
        userId: user.id,
        email: user.email,
        ipAddress: ipAddress || 'unknown',
        userAgent: userAgent || 'unknown',
        metadata: { reason: 'invalid_password' },
        severity: 'WARNING',
      });
      throw new AuthError('AUTH_INVALID_CREDENTIALS', 'Invalid email or password');
    }

    // Enforce session limit before creating new session
    const revokedSessions = await this.enforceSessionLimit(user.id);
    if (revokedSessions.length > 0) {
      await this.logAudit('SESSION_LIMIT_REACHED', {
        userId: user.id,
        email: user.email,
        ipAddress: ipAddress || 'unknown',
        userAgent: userAgent || 'unknown',
        metadata: { revokedCount: revokedSessions.length },
      });
    }

    const accessToken = this.generateAccessToken(user);
    const tokenPair = this.generateRefreshToken();
    const session = await this.createSession(user.id, tokenPair, userAgent, ipAddress);

    // Log successful login
    await this.logAudit('LOGIN_SUCCESS', {
      userId: user.id,
      email: user.email,
      ipAddress: ipAddress || 'unknown',
      userAgent: userAgent || 'unknown',
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      tokens: {
        accessToken,
        refreshToken: tokenPair.fullToken,
        expiresIn: ACCESS_TOKEN_EXPIRY_SECONDS,
      },
      sessionId: session.id,
    };
  }

  async refreshToken(
    refreshToken: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<AuthTokens & { sessionId: string }> {
    // Parse the token to get selector
    const parsed = parseToken(refreshToken);
    if (!parsed) {
      throw new AuthError('AUTH_SESSION_EXPIRED', 'Invalid token format');
    }

    // Check for token reuse (security breach detection) using selector
    const reusedSession = await this.checkTokenReuse(parsed.selector);
    if (reusedSession) {
      // Token was already rotated - potential theft!
      await this.revokeAllSessions(reusedSession.userId);
      await this.logAudit('TOKEN_REUSE_DETECTED', {
        userId: reusedSession.userId,
        ipAddress: ipAddress || 'unknown',
        userAgent: userAgent || 'unknown',
        severity: 'CRITICAL',
        metadata: { sessionId: reusedSession.id },
      });
      throw new AuthError('AUTH_TOKEN_REUSED', 'Security breach detected - all sessions revoked', 401);
    }

    const session = await this.getSessionByToken(refreshToken);

    if (!session) {
      throw new AuthError('AUTH_SESSION_EXPIRED', 'Session has expired or is invalid');
    }

    const accessToken = this.generateAccessToken(session.user);
    const newTokenPair = this.generateRefreshToken();

    // Token rotation: store previous selector for reuse detection
    const previousSelector = session.tokenSelector;
    const hashedVerifier = await bcrypt.hash(newTokenPair.verifier, BCRYPT_COST);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRY_DAYS);

    await this.prisma.session.update({
      where: { id: session.id },
      data: {
        tokenSelector: newTokenPair.selector,
        tokenVerifier: hashedVerifier,
        previousSelector,
        expiresAt,
        rotatedAt: new Date(),
      },
    });

    // Log refresh event
    await this.logAudit('TOKEN_REFRESH', {
      userId: session.userId,
      ipAddress: ipAddress || 'unknown',
      userAgent: userAgent || 'unknown',
    });

    return {
      accessToken,
      refreshToken: newTokenPair.fullToken,
      expiresIn: ACCESS_TOKEN_EXPIRY_SECONDS,
      sessionId: session.id,
    };
  }

  /**
   * Check if a token selector was already rotated (reuse detection).
   * Uses O(1) lookup by previousSelector index.
   */
  private async checkTokenReuse(selector: string) {
    // Check if this selector exists as a previousSelector (meaning it was rotated)
    const session = await this.prisma.session.findFirst({
      where: {
        previousSelector: selector,
        expiresAt: { gt: new Date() },
      },
    });

    return session;
  }

  async logout(
    sessionId: string,
    accessToken?: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    // Get session to find userId for audit
    const session = await this.prisma.session.findUnique({
      where: { id: sessionId },
      include: { user: true },
    });

    // Add access token to blacklist if provided
    if (accessToken && session) {
      await this.addToBlacklist(accessToken, session.userId, 'logout');
    }

    // Delete session
    await this.deleteSession(sessionId);

    // Log logout event
    if (session) {
      await this.logAudit('LOGOUT', {
        userId: session.userId,
        email: session.user.email,
        ipAddress: ipAddress || 'unknown',
        userAgent: userAgent || 'unknown',
      });
    }
  }

  async getUserById(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
    });
  }

  // ============================================
  // TOKEN BLACKLIST FUNCTIONS
  // ============================================

  async addToBlacklist(token: string, userId: string, reason: string): Promise<void> {
    const tokenHash = hashToken(token);
    // Set expiry to when the token would naturally expire (15 min from now max)
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 15);

    await this.prisma.tokenBlacklist.upsert({
      where: { tokenHash },
      update: { reason, expiresAt },
      create: { tokenHash, userId, reason, expiresAt },
    });
  }

  async isBlacklisted(token: string): Promise<boolean> {
    const tokenHash = hashToken(token);
    const entry = await this.prisma.tokenBlacklist.findUnique({
      where: { tokenHash },
    });
    return entry !== null && entry.expiresAt > new Date();
  }

  async cleanupBlacklist(): Promise<number> {
    const result = await this.prisma.tokenBlacklist.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    });
    return result.count;
  }

  // ============================================
  // AUDIT LOG FUNCTIONS
  // ============================================

  async logAudit(
    eventType: AuditEventType,
    data: {
      userId?: string;
      email?: string;
      ipAddress: string;
      userAgent: string;
      metadata?: Record<string, unknown>;
      severity?: AuditSeverity;
    }
  ): Promise<void> {
    await this.prisma.auditLog.create({
      data: {
        eventType,
        userId: data.userId,
        email: data.email,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
        metadata: data.metadata ? JSON.stringify(data.metadata) : null,
        severity: data.severity || 'INFO',
      },
    });
  }

  // ============================================
  // SESSION LIMIT ENFORCEMENT
  // ============================================

  async enforceSessionLimit(userId: string): Promise<string[]> {
    const sessions = await this.prisma.session.findMany({
      where: { userId, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'asc' }, // Oldest first
    });

    const revokedIds: string[] = [];
    
    // If at or over limit, remove oldest sessions
    while (sessions.length >= MAX_SESSIONS_PER_USER) {
      const oldest = sessions.shift();
      if (oldest) {
        await this.prisma.session.delete({ where: { id: oldest.id } });
        revokedIds.push(oldest.id);
      }
    }

    return revokedIds;
  }

  // ============================================
  // PASSWORD CHANGE
  // ============================================

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
    _currentSessionId: string, // Prefixed with _ to indicate intentionally unused
    ipAddress: string,
    userAgent: string
  ): Promise<AuthTokens> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new AuthError('AUTH_USER_NOT_FOUND', 'User not found');
    }

    const isValid = await this.verifyPassword(currentPassword, user.passwordHash);
    if (!isValid) {
      throw new AuthError('AUTH_INVALID_CREDENTIALS', 'Current password is incorrect');
    }

    if (newPassword.length < 8) {
      throw new AuthError('AUTH_WEAK_PASSWORD', 'Password must be at least 8 characters');
    }

    // Hash new password
    const passwordHash = await this.hashPassword(newPassword);

    // Update password
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });

    // Revoke all sessions
    await this.revokeAllSessions(userId);

    // Create new session
    const tokenPair = this.generateRefreshToken();
    await this.createSession(userId, tokenPair, userAgent, ipAddress);
    const accessToken = this.generateAccessToken(user);

    // Log audit event
    await this.logAudit('PASSWORD_CHANGE', {
      userId,
      email: user.email,
      ipAddress,
      userAgent,
      severity: 'WARNING',
    });

    return {
      accessToken,
      refreshToken: tokenPair.fullToken,
      expiresIn: ACCESS_TOKEN_EXPIRY_SECONDS,
    };
  }
}

// ============================================
// AUTH ERROR CLASS
// ============================================

export class AuthError extends Error {
  code: string;
  statusCode: number;

  constructor(code: string, message: string, statusCode?: number) {
    super(message);
    this.code = code;
    this.name = 'AuthError';

    // Map error codes to HTTP status codes
    const statusMap: Record<string, number> = {
      AUTH_INVALID_CREDENTIALS: 401,
      AUTH_TOKEN_EXPIRED: 401,
      AUTH_TOKEN_INVALID: 401,
      AUTH_TOKEN_REVOKED: 401,
      AUTH_TOKEN_REUSED: 401,
      AUTH_SESSION_EXPIRED: 401,
      AUTH_USER_NOT_FOUND: 404,
      AUTH_FORBIDDEN: 403,
      AUTH_RATE_LIMITED: 429,
      AUTH_EMAIL_EXISTS: 400,
      AUTH_WEAK_PASSWORD: 400,
    };

    this.statusCode = statusCode || statusMap[code] || 500;
  }
}
