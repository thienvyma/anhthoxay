/**
 * Shared Test Utilities for Auth Service Property Tests
 * 
 * This file contains common generators, constants, and helper functions
 * used across auth service property tests.
 * 
 * **Feature: auth-system**
 */

import * as fc from 'fast-check';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { randomBytes } from 'crypto';

// ============================================
// CONSTANTS
// ============================================

export const BCRYPT_COST = 10;
export const ACCESS_TOKEN_EXPIRY_SECONDS = 15 * 60; // 15 minutes
export const JWT_SECRET = 'test-secret-32-chars-minimum-xxxxx';
export const JWT_ISSUER = 'ath-api-test';
export const MAX_LOGIN_ATTEMPTS = 5;
export const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
export const REFRESH_TOKEN_EXPIRY_DAYS = 7;

// Role hierarchy for permission checking
export const ROLE_HIERARCHY: Record<string, number> = {
  ADMIN: 4,
  MANAGER: 3,
  WORKER: 2,
  USER: 1,
};

export const ROLES = ['ADMIN', 'MANAGER', 'WORKER', 'USER'] as const;
export type Role = typeof ROLES[number];

// ============================================
// GENERATORS - Basic Types
// ============================================

/** Valid password generator (8+ chars) */
export const validPasswordArb = fc.string({ minLength: 8, maxLength: 72 }).filter(s => s.length >= 8);

/** Invalid password generator (< 8 chars) */
export const invalidPasswordArb = fc.string({ minLength: 0, maxLength: 7 });

/** Email generator */
export const emailArb = fc.emailAddress();

/** Role generator */
export const roleArb = fc.constantFrom(...ROLES);

/** User generator */
export const userArb = fc.record({
  id: fc.uuid(),
  email: emailArb,
  role: roleArb,
});

/** IP address generator */
export const ipAddressArb = fc.oneof(
  // IPv4
  fc.tuple(
    fc.integer({ min: 1, max: 255 }),
    fc.integer({ min: 0, max: 255 }),
    fc.integer({ min: 0, max: 255 }),
    fc.integer({ min: 0, max: 255 })
  ).map(([a, b, c, d]) => `${a}.${b}.${c}.${d}`),
  // IPv6 simplified
  fc.constant('::1')
);

/** UUID generator */
export const uuidArb = fc.uuid();

// ============================================
// GENERATORS - Hex Strings (for Token Selector Pattern)
// ============================================

/** Generate hex string of specific length */
export const hexStringArb = (length: number) => 
  fc.array(fc.integer({ min: 0, max: 15 }), { minLength: length, maxLength: length })
    .map(arr => arr.map(n => n.toString(16)).join(''));

/** Generate hex string with variable length */
export const hexStringRangeArb = (minLength: number, maxLength: number) =>
  fc.integer({ min: minLength, max: maxLength })
    .chain(len => hexStringArb(len));

/** Valid selector (32 hex chars) */
export const validSelectorArb = hexStringArb(32);

/** Valid verifier (64 hex chars) */
export const validVerifierArb = hexStringArb(64);

/** Session ID generator */
export const sessionIdArb = hexStringArb(32);

// ============================================
// HELPER FUNCTIONS - Password
// ============================================

/**
 * Hash a password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_COST);
}

/**
 * Verify a password against a hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Validate password meets minimum requirements
 */
export function validatePassword(password: string): { valid: boolean; error?: string } {
  if (password.length < 8) {
    return { valid: false, error: 'Password must be at least 8 characters' };
  }
  return { valid: true };
}

// ============================================
// HELPER FUNCTIONS - JWT Tokens
// ============================================

/**
 * Generate an access token for a user
 */
export function generateAccessToken(user: { id: string; email: string; role: string }): string {
  const payload = {
    sub: user.id,
    email: user.email,
    role: user.role,
    iss: JWT_ISSUER,
  };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '15m' });
}

/**
 * Verify and decode an access token
 */
export function verifyAccessToken(token: string): { sub: string; email: string; role: string; exp: number } | null {
  try {
    return jwt.verify(token, JWT_SECRET, { issuer: JWT_ISSUER }) as { sub: string; email: string; role: string; exp: number };
  } catch {
    return null;
  }
}

/**
 * Generate a refresh token (64 hex chars)
 */
export function generateRefreshToken(): string {
  return randomBytes(32).toString('hex');
}

// ============================================
// HELPER FUNCTIONS - Role Checking
// ============================================

/**
 * Check if a user role has access to a required role level
 */
export function hasRole(userRole: string, requiredRole: string): boolean {
  return (ROLE_HIERARCHY[userRole] || 0) >= (ROLE_HIERARCHY[requiredRole] || 0);
}

/**
 * Check role access for an endpoint
 */
export function checkRoleAccess(
  userRole: string, 
  requiredRoles: string[]
): { allowed: true } | { allowed: false; status: number } {
  const hasPermission = requiredRoles.some(role => hasRole(userRole, role));
  
  if (!hasPermission) {
    return { allowed: false, status: 403 };
  }
  
  return { allowed: true };
}

// ============================================
// HELPER FUNCTIONS - Authentication
// ============================================

export type AuthResult = 
  | { success: true; user: { sub: string; email: string; role: string } } 
  | { success: false; status: number };

/**
 * Authenticate a request based on Authorization header
 */
export function authenticateRequest(authHeader: string | undefined): AuthResult {
  // No header
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { success: false, status: 401 };
  }

  const token = authHeader.substring(7);
  const payload = verifyAccessToken(token);

  // Invalid or expired token
  if (!payload) {
    return { success: false, status: 401 };
  }

  return { success: true, user: payload };
}

/**
 * Simulate login with generic error
 */
export async function simulateLogin(
  storedHash: string | null,
  inputPassword: string
): Promise<{ success: boolean; error?: string }> {
  // User not found
  if (!storedHash) {
    return { success: false, error: 'Invalid email or password' };
  }
  
  // Wrong password
  const isValid = await verifyPassword(inputPassword, storedHash);
  if (!isValid) {
    return { success: false, error: 'Invalid email or password' };
  }
  
  return { success: true };
}

// ============================================
// MOCK STORES
// ============================================

/**
 * Mock user store for email uniqueness testing
 */
export class MockUserStore {
  private emails = new Set<string>();

  register(email: string): { success: boolean; error?: string } {
    const normalizedEmail = email.toLowerCase();
    if (this.emails.has(normalizedEmail)) {
      return { success: false, error: 'AUTH_EMAIL_EXISTS' };
    }
    this.emails.add(normalizedEmail);
    return { success: true };
  }

  hasEmail(email: string): boolean {
    return this.emails.has(email.toLowerCase());
  }
}

/**
 * Mock rate limiter for login attempts
 */
export class MockRateLimiter {
  private store = new Map<string, { attempts: number; firstAttempt: number }>();

  checkLimit(key: string): { allowed: boolean; remaining: number; status?: number } {
    const now = Date.now();
    const entry = this.store.get(key);

    // No previous attempts
    if (!entry) {
      this.store.set(key, { attempts: 1, firstAttempt: now });
      return { allowed: true, remaining: MAX_LOGIN_ATTEMPTS - 1 };
    }

    // Window expired, reset
    if (now - entry.firstAttempt > RATE_LIMIT_WINDOW_MS) {
      this.store.set(key, { attempts: 1, firstAttempt: now });
      return { allowed: true, remaining: MAX_LOGIN_ATTEMPTS - 1 };
    }

    // Within window
    entry.attempts++;

    if (entry.attempts > MAX_LOGIN_ATTEMPTS) {
      return { allowed: false, remaining: 0, status: 429 };
    }

    return { allowed: true, remaining: MAX_LOGIN_ATTEMPTS - entry.attempts };
  }

  reset(key: string): void {
    this.store.delete(key);
  }
}

/**
 * Mock session manager for session tests
 */
export class MockSessionManager {
  private sessions: Array<{ id: string; userId: string }> = [];

  createSession(userId: string): string {
    const id = randomBytes(16).toString('hex');
    this.sessions.push({ id, userId });
    return id;
  }

  getUserSessions(userId: string): Array<{ id: string; userId: string }> {
    return this.sessions.filter(s => s.userId === userId);
  }

  revokeSession(sessionId: string): boolean {
    const index = this.sessions.findIndex(s => s.id === sessionId);
    if (index === -1) return false;
    this.sessions.splice(index, 1);
    return true;
  }

  revokeAllSessionsExcept(userId: string, exceptSessionId: string): number {
    const toRevoke = this.sessions.filter(
      s => s.userId === userId && s.id !== exceptSessionId
    );
    
    for (const session of toRevoke) {
      this.revokeSession(session.id);
    }
    
    return toRevoke.length;
  }
}
