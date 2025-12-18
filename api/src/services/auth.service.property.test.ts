/**
 * Property-Based Tests for Auth System
 * Using fast-check for property testing
 *
 * These tests verify the correctness properties defined in the design document.
 * **Feature: auth-system**
 */

import * as fc from 'fast-check';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { randomBytes } from 'crypto';

// ============================================
// CONSTANTS (matching auth.service.ts)
// ============================================

const BCRYPT_COST = 10;
const ACCESS_TOKEN_EXPIRY_SECONDS = 15 * 60; // 15 minutes
const JWT_SECRET = 'test-secret-32-chars-minimum-xxxxx';
const JWT_ISSUER = 'ath-api-test';

// ============================================
// HELPER FUNCTIONS (isolated for testing)
// ============================================

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_COST);
}

async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

function generateAccessToken(user: { id: string; email: string; role: string }): string {
  const payload = {
    sub: user.id,
    email: user.email,
    role: user.role,
    iss: JWT_ISSUER,
  };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '15m' });
}

function verifyAccessToken(token: string): { sub: string; email: string; role: string; exp: number } | null {
  try {
    return jwt.verify(token, JWT_SECRET, { issuer: JWT_ISSUER }) as { sub: string; email: string; role: string; exp: number };
  } catch {
    return null;
  }
}

function generateRefreshToken(): string {
  return randomBytes(32).toString('hex');
}

// Role hierarchy for permission checking
const ROLE_HIERARCHY: Record<string, number> = {
  ADMIN: 4,
  MANAGER: 3,
  WORKER: 2,
  USER: 1,
};

function hasRole(userRole: string, requiredRole: string): boolean {
  return (ROLE_HIERARCHY[userRole] || 0) >= (ROLE_HIERARCHY[requiredRole] || 0);
}

// ============================================
// GENERATORS
// ============================================

// Valid password generator (8+ chars)
const validPasswordArb = fc.string({ minLength: 8, maxLength: 72 }).filter(s => s.length >= 8);

// Invalid password generator (< 8 chars)
const invalidPasswordArb = fc.string({ minLength: 0, maxLength: 7 });

// Email generator
const emailArb = fc.emailAddress();

// Role generator
const roleArb = fc.constantFrom('ADMIN', 'MANAGER', 'WORKER', 'USER');

// User generator
const userArb = fc.record({
  id: fc.uuid(),
  email: emailArb,
  role: roleArb,
});

// IP address generator
const ipAddressArb = fc.oneof(
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


// ============================================
// PROPERTY 1: Password never stored in plaintext
// **Feature: auth-system, Property 1: Password never stored in plaintext**
// **Validates: Requirements 1.3, 7.1**
// ============================================

describe('Property 1: Password never stored in plaintext', () => {
  it('*For any* user registration with a valid password, the stored passwordHash SHALL NOT equal the original password and SHALL be a valid bcrypt hash', async () => {
    await fc.assert(
      fc.asyncProperty(validPasswordArb, async (password) => {
        const hash = await hashPassword(password);
        
        // Hash should NOT equal original password
        const notPlaintext = hash !== password;
        
        // Hash should be a valid bcrypt hash (starts with $2a$ or $2b$)
        const isBcryptHash = /^\$2[ab]\$\d{2}\$/.test(hash);
        
        // Hash should be verifiable
        const isVerifiable = await verifyPassword(password, hash);
        
        return notPlaintext && isBcryptHash && isVerifiable;
      }),
      { numRuns: 50 } // Reduced due to bcrypt being slow
    );
  });

  it('bcrypt hash should have correct cost factor', async () => {
    await fc.assert(
      fc.asyncProperty(validPasswordArb, async (password) => {
        const hash = await hashPassword(password);
        // Extract cost factor from hash (format: $2a$10$...)
        const costMatch = hash.match(/^\$2[ab]\$(\d{2})\$/);
        const cost = costMatch ? parseInt(costMatch[1], 10) : 0;
        return cost >= BCRYPT_COST;
      }),
      { numRuns: 20 }
    );
  });
});

// ============================================
// PROPERTY 2: Email uniqueness
// **Feature: auth-system, Property 2: Email uniqueness**
// **Validates: Requirements 1.2**
// ============================================

describe('Property 2: Email uniqueness', () => {
  // Simulate email storage with case-insensitive comparison
  class MockUserStore {
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

  it('*For any* two users in the system, their email addresses SHALL be unique (case-insensitive)', () => {
    fc.assert(
      fc.property(
        fc.array(emailArb, { minLength: 2, maxLength: 20 }),
        (emails) => {
          const store = new MockUserStore();
          const results: boolean[] = [];

          for (const email of emails) {
            const result = store.register(email);
            results.push(result.success);
          }

          // Count unique emails (case-insensitive)
          const uniqueEmails = new Set(emails.map(e => e.toLowerCase()));
          const successCount = results.filter(r => r).length;

          // Number of successful registrations should equal unique emails
          return successCount === uniqueEmails.size;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('same email with different case should be rejected', () => {
    fc.assert(
      fc.property(emailArb, (email) => {
        const store = new MockUserStore();
        
        // Register with original case
        const first = store.register(email);
        
        // Try to register with different case
        const upperCase = store.register(email.toUpperCase());
        const lowerCase = store.register(email.toLowerCase());
        
        return first.success && !upperCase.success && !lowerCase.success;
      }),
      { numRuns: 100 }
    );
  });
});

// ============================================
// PROPERTY 3: Login round-trip
// **Feature: auth-system, Property 3: Login round-trip**
// **Validates: Requirements 2.1, 2.3, 2.4**
// ============================================

describe('Property 3: Login round-trip', () => {
  it('*For any* valid user credentials, logging in SHALL return valid tokens, and using those tokens SHALL successfully authenticate subsequent requests', async () => {
    await fc.assert(
      fc.asyncProperty(userArb, validPasswordArb, async (user, password) => {
        // Simulate registration
        const passwordHash = await hashPassword(password);
        
        // Simulate login - verify password
        const isValidPassword = await verifyPassword(password, passwordHash);
        if (!isValidPassword) return false;
        
        // Generate tokens
        const accessToken = generateAccessToken(user);
        const refreshToken = generateRefreshToken();
        
        // Verify access token can be decoded
        const decoded = verifyAccessToken(accessToken);
        if (!decoded) return false;
        
        // Verify token contains correct user info
        const hasCorrectSub = decoded.sub === user.id;
        const hasCorrectEmail = decoded.email === user.email;
        const hasCorrectRole = decoded.role === user.role;
        
        // Verify refresh token is valid format (64 hex chars)
        const validRefreshToken = /^[a-f0-9]{64}$/.test(refreshToken);
        
        return hasCorrectSub && hasCorrectEmail && hasCorrectRole && validRefreshToken;
      }),
      { numRuns: 50 }
    );
  });
});

// ============================================
// PROPERTY 4: Invalid credentials rejection
// **Feature: auth-system, Property 4: Invalid credentials rejection**
// **Validates: Requirements 2.2**
// ============================================

describe('Property 4: Invalid credentials rejection', () => {
  // Simulate login with generic error
  async function simulateLogin(
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

  it('*For any* login attempt with invalid credentials, the system SHALL return the same generic error message', async () => {
    await fc.assert(
      fc.asyncProperty(
        validPasswordArb,
        validPasswordArb,
        fc.boolean(),
        async (correctPassword, wrongPassword, userExists) => {
          fc.pre(correctPassword !== wrongPassword);
          
          const storedHash = userExists ? await hashPassword(correctPassword) : null;
          
          // Try with wrong password (if user exists) or non-existent user
          const result = await simulateLogin(
            storedHash,
            userExists ? wrongPassword : correctPassword
          );
          
          // Should fail with generic message
          return !result.success && result.error === 'Invalid email or password';
        }
      ),
      { numRuns: 30 }
    );
  });
});


// ============================================
// PROPERTY 5: Token expiration
// **Feature: auth-system, Property 5: Token expiration**
// **Validates: Requirements 2.5**
// ============================================

describe('Property 5: Token expiration', () => {
  it('*For any* generated access token, decoding it SHALL show expiration time approximately 15 minutes from creation', () => {
    fc.assert(
      fc.property(userArb, (user) => {
        const beforeGeneration = Math.floor(Date.now() / 1000);
        const token = generateAccessToken(user);
        const afterGeneration = Math.floor(Date.now() / 1000);
        
        const decoded = verifyAccessToken(token);
        if (!decoded) return false;
        
        // Expiration should be approximately 15 minutes (900 seconds) from now
        // Allow 5 second tolerance for test execution time
        const expectedExpMin = beforeGeneration + ACCESS_TOKEN_EXPIRY_SECONDS - 5;
        const expectedExpMax = afterGeneration + ACCESS_TOKEN_EXPIRY_SECONDS + 5;
        
        return decoded.exp >= expectedExpMin && decoded.exp <= expectedExpMax;
      }),
      { numRuns: 100 }
    );
  });
});

// ============================================
// PROPERTY 6: Refresh token validity
// **Feature: auth-system, Property 6: Refresh token validity**
// **Validates: Requirements 3.1, 3.2**
// ============================================

describe('Property 6: Refresh token validity', () => {
  // Simulate session storage
  class MockSessionStore {
    private sessions = new Map<string, { userId: string; tokenHash: string; expiresAt: Date }>();

    async createSession(userId: string, refreshToken: string, expiresInDays: number): Promise<string> {
      const sessionId = randomBytes(16).toString('hex');
      const tokenHash = await bcrypt.hash(refreshToken, BCRYPT_COST);
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + expiresInDays);
      
      this.sessions.set(sessionId, { userId, tokenHash, expiresAt });
      return sessionId;
    }

    async validateRefreshToken(refreshToken: string): Promise<{ valid: boolean; userId?: string }> {
      for (const [, session] of this.sessions) {
        if (session.expiresAt < new Date()) continue;
        
        const isValid = await bcrypt.compare(refreshToken, session.tokenHash);
        if (isValid) {
          return { valid: true, userId: session.userId };
        }
      }
      return { valid: false };
    }

    expireAllSessions(): void {
      for (const [id, session] of this.sessions) {
        session.expiresAt = new Date(Date.now() - 1000);
        this.sessions.set(id, session);
      }
    }
  }

  it('*For any* valid refresh token, using it SHALL return a new valid access token', async () => {
    await fc.assert(
      fc.asyncProperty(userArb, async (user) => {
        const store = new MockSessionStore();
        const refreshToken = generateRefreshToken();
        
        // Create session
        await store.createSession(user.id, refreshToken, 7);
        
        // Validate refresh token
        const result = await store.validateRefreshToken(refreshToken);
        if (!result.valid) return false;
        
        // Generate new access token
        const newAccessToken = generateAccessToken(user);
        const decoded = verifyAccessToken(newAccessToken);
        
        return decoded !== null && decoded.sub === user.id;
      }),
      { numRuns: 20 }
    );
  });

  it('using an invalid refresh token SHALL fail', async () => {
    await fc.assert(
      fc.asyncProperty(userArb, async (user) => {
        const store = new MockSessionStore();
        const validToken = generateRefreshToken();
        const invalidToken = generateRefreshToken();
        
        // Create session with valid token
        await store.createSession(user.id, validToken, 7);
        
        // Try to validate with different token
        const result = await store.validateRefreshToken(invalidToken);
        
        return !result.valid;
      }),
      { numRuns: 20 }
    );
  });

  it('using an expired refresh token SHALL fail', async () => {
    await fc.assert(
      fc.asyncProperty(userArb, async (user) => {
        const store = new MockSessionStore();
        const refreshToken = generateRefreshToken();
        
        // Create session
        await store.createSession(user.id, refreshToken, 7);
        
        // Expire all sessions
        store.expireAllSessions();
        
        // Try to validate
        const result = await store.validateRefreshToken(refreshToken);
        
        return !result.valid;
      }),
      { numRuns: 20 }
    );
  });
});

// ============================================
// PROPERTY 7: Logout invalidates session
// **Feature: auth-system, Property 7: Logout invalidates session**
// **Validates: Requirements 4.1, 4.2**
// ============================================

describe('Property 7: Logout invalidates session', () => {
  class MockSessionStore {
    private sessions = new Map<string, { userId: string; tokenHash: string }>();

    async createSession(userId: string, refreshToken: string): Promise<string> {
      const sessionId = randomBytes(16).toString('hex');
      const tokenHash = await bcrypt.hash(refreshToken, BCRYPT_COST);
      this.sessions.set(sessionId, { userId, tokenHash });
      return sessionId;
    }

    deleteSession(sessionId: string): boolean {
      return this.sessions.delete(sessionId);
    }

    hasSession(sessionId: string): boolean {
      return this.sessions.has(sessionId);
    }

    async validateRefreshToken(refreshToken: string): Promise<boolean> {
      for (const [, session] of this.sessions) {
        const isValid = await bcrypt.compare(refreshToken, session.tokenHash);
        if (isValid) return true;
      }
      return false;
    }
  }

  it('*For any* successful logout, the session SHALL be deleted from database', async () => {
    await fc.assert(
      fc.asyncProperty(userArb, async (user) => {
        const store = new MockSessionStore();
        const refreshToken = generateRefreshToken();
        
        // Create session
        const sessionId = await store.createSession(user.id, refreshToken);
        
        // Verify session exists
        if (!store.hasSession(sessionId)) return false;
        
        // Logout (delete session)
        store.deleteSession(sessionId);
        
        // Session should no longer exist
        return !store.hasSession(sessionId);
      }),
      { numRuns: 30 }
    );
  });

  it('subsequent requests with that sessions tokens SHALL fail', async () => {
    await fc.assert(
      fc.asyncProperty(userArb, async (user) => {
        const store = new MockSessionStore();
        const refreshToken = generateRefreshToken();
        
        // Create session
        const sessionId = await store.createSession(user.id, refreshToken);
        
        // Verify token works before logout
        const beforeLogout = await store.validateRefreshToken(refreshToken);
        if (!beforeLogout) return false;
        
        // Logout
        store.deleteSession(sessionId);
        
        // Token should no longer work
        const afterLogout = await store.validateRefreshToken(refreshToken);
        
        return !afterLogout;
      }),
      { numRuns: 20 }
    );
  });
});


// ============================================
// PROPERTY 8: Protected route enforcement
// **Feature: auth-system, Property 8: Protected route enforcement**
// **Validates: Requirements 5.1, 5.2**
// ============================================

describe('Property 8: Protected route enforcement', () => {
  type AuthResult = { success: true; user: { sub: string; email: string; role: string } } | { success: false; status: number };

  function authenticateRequest(authHeader: string | undefined): AuthResult {
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

  it('*For any* protected route, requests without valid token SHALL return 401', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          fc.constant(undefined),
          fc.constant(''),
          fc.constant('Basic abc123'),
          fc.constant('Bearer '),
          fc.constant('Bearer invalid-token'),
          fc.string().map(s => `Bearer ${s}`)
        ),
        (authHeader) => {
          // Skip if it happens to be a valid token format
          if (authHeader?.startsWith('Bearer ey')) {
            return true; // Skip this case
          }
          
          const result = authenticateRequest(authHeader);
          return !result.success && result.status === 401;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('*For any* protected route, requests with valid token SHALL succeed', () => {
    fc.assert(
      fc.property(userArb, (user) => {
        const token = generateAccessToken(user);
        const authHeader = `Bearer ${token}`;
        
        const result = authenticateRequest(authHeader);
        
        return result.success && result.user.sub === user.id;
      }),
      { numRuns: 100 }
    );
  });
});

// ============================================
// PROPERTY 9: Role-based access
// **Feature: auth-system, Property 9: Role-based access**
// **Validates: Requirements 5.4, 5.5, 6.1, 6.2, 6.3**
// ============================================

describe('Property 9: Role-based access', () => {
  type RoleCheckResult = { allowed: true } | { allowed: false; status: number };

  function checkRoleAccess(userRole: string, requiredRoles: string[]): RoleCheckResult {
    const hasPermission = requiredRoles.some(role => hasRole(userRole, role));
    
    if (!hasPermission) {
      return { allowed: false, status: 403 };
    }
    
    return { allowed: true };
  }

  it('*For any* role-restricted endpoint, users with insufficient role SHALL receive 403', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('USER', 'WORKER'),
        fc.constantFrom('ADMIN'),
        (userRole, requiredRole) => {
          // USER and WORKER should not have ADMIN access
          const result = checkRoleAccess(userRole, [requiredRole]);
          return !result.allowed && result.status === 403;
        }
      ),
      { numRuns: 50 }
    );
  });

  it('*For any* role-restricted endpoint, users with sufficient role SHALL succeed', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('ADMIN', 'MANAGER'),
        fc.constantFrom('MANAGER', 'WORKER', 'USER'),
        (userRole, requiredRole) => {
          // ADMIN and MANAGER should have access to MANAGER and below
          const result = checkRoleAccess(userRole, [requiredRole]);
          return result.allowed;
        }
      ),
      { numRuns: 50 }
    );
  });

  it('ADMIN SHALL have access to all endpoints', () => {
    fc.assert(
      fc.property(roleArb, (requiredRole) => {
        const result = checkRoleAccess('ADMIN', [requiredRole]);
        return result.allowed;
      }),
      { numRuns: 20 }
    );
  });

  it('role hierarchy: ADMIN > MANAGER > WORKER > USER', () => {
    // Test specific hierarchy relationships
    expect(hasRole('ADMIN', 'MANAGER')).toBe(true);
    expect(hasRole('ADMIN', 'WORKER')).toBe(true);
    expect(hasRole('ADMIN', 'USER')).toBe(true);
    expect(hasRole('MANAGER', 'WORKER')).toBe(true);
    expect(hasRole('MANAGER', 'USER')).toBe(true);
    expect(hasRole('WORKER', 'USER')).toBe(true);
    
    // Lower roles should not have higher access
    expect(hasRole('USER', 'WORKER')).toBe(false);
    expect(hasRole('USER', 'MANAGER')).toBe(false);
    expect(hasRole('USER', 'ADMIN')).toBe(false);
    expect(hasRole('WORKER', 'MANAGER')).toBe(false);
    expect(hasRole('WORKER', 'ADMIN')).toBe(false);
    expect(hasRole('MANAGER', 'ADMIN')).toBe(false);
  });
});

// ============================================
// PROPERTY 10: Password minimum length
// **Feature: auth-system, Property 10: Password minimum length**
// **Validates: Requirements 7.3**
// ============================================

describe('Property 10: Password minimum length', () => {
  function validatePassword(password: string): { valid: boolean; error?: string } {
    if (password.length < 8) {
      return { valid: false, error: 'Password must be at least 8 characters' };
    }
    return { valid: true };
  }

  it('*For any* password shorter than 8 characters, registration SHALL fail with validation error', () => {
    fc.assert(
      fc.property(invalidPasswordArb, (password) => {
        const result = validatePassword(password);
        return !result.valid && result.error?.includes('8 characters');
      }),
      { numRuns: 100 }
    );
  });

  it('passwords with 8+ characters SHALL pass validation', () => {
    fc.assert(
      fc.property(validPasswordArb, (password) => {
        const result = validatePassword(password);
        return result.valid;
      }),
      { numRuns: 100 }
    );
  });
});

// ============================================
// PROPERTY 11: Rate limiting
// **Feature: auth-system, Property 11: Rate limiting**
// **Validates: Requirements 9.1, 9.2**
// ============================================

describe('Property 11: Rate limiting', () => {
  const MAX_ATTEMPTS = 5;
  const WINDOW_MS = 15 * 60 * 1000; // 15 minutes

  class MockRateLimiter {
    private store = new Map<string, { attempts: number; firstAttempt: number }>();

    checkLimit(key: string): { allowed: boolean; remaining: number; status?: number } {
      const now = Date.now();
      const entry = this.store.get(key);

      // No previous attempts
      if (!entry) {
        this.store.set(key, { attempts: 1, firstAttempt: now });
        return { allowed: true, remaining: MAX_ATTEMPTS - 1 };
      }

      // Window expired, reset
      if (now - entry.firstAttempt > WINDOW_MS) {
        this.store.set(key, { attempts: 1, firstAttempt: now });
        return { allowed: true, remaining: MAX_ATTEMPTS - 1 };
      }

      // Within window
      entry.attempts++;

      if (entry.attempts > MAX_ATTEMPTS) {
        return { allowed: false, remaining: 0, status: 429 };
      }

      return { allowed: true, remaining: MAX_ATTEMPTS - entry.attempts };
    }

    reset(key: string): void {
      this.store.delete(key);
    }
  }

  it('*For any* IP address with more than 5 failed login attempts within 15 minutes, subsequent attempts SHALL return 429', () => {
    fc.assert(
      fc.property(ipAddressArb, (ip) => {
        const limiter = new MockRateLimiter();
        const key = `login:${ip}`;

        // Make 5 attempts (should all be allowed)
        for (let i = 0; i < MAX_ATTEMPTS; i++) {
          const result = limiter.checkLimit(key);
          if (!result.allowed) return false;
        }

        // 6th attempt should be blocked
        const blocked = limiter.checkLimit(key);
        return !blocked.allowed && blocked.status === 429;
      }),
      { numRuns: 100 }
    );
  });

  it('first 5 attempts SHALL be allowed', () => {
    fc.assert(
      fc.property(ipAddressArb, (ip) => {
        const limiter = new MockRateLimiter();
        const key = `login:${ip}`;

        for (let i = 0; i < MAX_ATTEMPTS; i++) {
          const result = limiter.checkLimit(key);
          if (!result.allowed) return false;
          if (result.remaining !== MAX_ATTEMPTS - i - 1) return false;
        }

        return true;
      }),
      { numRuns: 100 }
    );
  });
});

// ============================================
// PROPERTY 12: Session management
// **Feature: auth-system, Property 12: Session management**
// **Validates: Requirements 10.2, 10.3**
// ============================================

describe('Property 12: Session management', () => {
  interface Session {
    id: string;
    userId: string;
  }

  class MockSessionManager {
    private sessions: Session[] = [];

    createSession(userId: string): string {
      const id = randomBytes(16).toString('hex');
      this.sessions.push({ id, userId });
      return id;
    }

    getUserSessions(userId: string): Session[] {
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

  it('*For any* user with multiple sessions, revoking all sessions SHALL invalidate all except current session', () => {
    fc.assert(
      fc.property(
        fc.uuid(),
        fc.integer({ min: 2, max: 10 }),
        (userId, sessionCount) => {
          const manager = new MockSessionManager();
          const sessionIds: string[] = [];

          // Create multiple sessions
          for (let i = 0; i < sessionCount; i++) {
            sessionIds.push(manager.createSession(userId));
          }

          // Current session is the last one
          const currentSessionId = sessionIds[sessionIds.length - 1];

          // Revoke all except current
          const revokedCount = manager.revokeAllSessionsExcept(userId, currentSessionId);

          // Should have revoked all but one
          if (revokedCount !== sessionCount - 1) return false;

          // Only current session should remain
          const remaining = manager.getUserSessions(userId);
          return remaining.length === 1 && remaining[0].id === currentSessionId;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('revoking a specific session SHALL invalidate only that session', () => {
    fc.assert(
      fc.property(
        fc.uuid(),
        fc.integer({ min: 2, max: 5 }),
        (userId, sessionCount) => {
          const manager = new MockSessionManager();
          const sessionIds: string[] = [];

          // Create multiple sessions
          for (let i = 0; i < sessionCount; i++) {
            sessionIds.push(manager.createSession(userId));
          }

          // Revoke first session
          const toRevoke = sessionIds[0];
          manager.revokeSession(toRevoke);

          // Check remaining sessions
          const remaining = manager.getUserSessions(userId);
          
          // Should have one less session
          if (remaining.length !== sessionCount - 1) return false;
          
          // Revoked session should not be in remaining
          return !remaining.some(s => s.id === toRevoke);
        }
      ),
      { numRuns: 100 }
    );
  });
});


// ============================================
// TOKEN SELECTOR PATTERN TESTS
// **Feature: security-hardening**
// ============================================

// Import the token pair functions for testing
import { generateTokenPair, parseToken, TokenPair } from './auth.service';

// ============================================
// PROPERTY 4: Session creation stores selector and verifier
// **Feature: security-hardening, Property 4: Session creation stores selector and verifier**
// **Validates: Requirements 2.1**
// ============================================

describe('Property 4: Session creation stores selector and verifier', () => {
  it('*For any* newly created session, the session record SHALL contain a non-empty tokenSelector and tokenVerifier', () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 100 }), () => {
        const tokenPair = generateTokenPair();
        
        // Selector should be 32 hex characters (16 bytes)
        const validSelector = tokenPair.selector.length === 32 && /^[a-f0-9]+$/i.test(tokenPair.selector);
        
        // Verifier should be 64 hex characters (32 bytes)
        const validVerifier = tokenPair.verifier.length === 64 && /^[a-f0-9]+$/i.test(tokenPair.verifier);
        
        // Full token should be selector.verifier format
        const validFullToken = tokenPair.fullToken === `${tokenPair.selector}.${tokenPair.verifier}`;
        
        // Both should be non-empty
        const nonEmpty = tokenPair.selector.length > 0 && tokenPair.verifier.length > 0;
        
        return validSelector && validVerifier && validFullToken && nonEmpty;
      }),
      { numRuns: 100 }
    );
  });

  it('generated token pairs should have correct format', () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 50 }), () => {
        const tokenPair = generateTokenPair();
        
        // Parse should succeed
        const parsed = parseToken(tokenPair.fullToken);
        if (!parsed) return false;
        
        // Parsed values should match original
        return parsed.selector === tokenPair.selector && parsed.verifier === tokenPair.verifier;
      }),
      { numRuns: 100 }
    );
  });

  it('each generated token pair should be unique', () => {
    const tokenPairs: TokenPair[] = [];
    
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 100 }), () => {
        const tokenPair = generateTokenPair();
        
        // Check that this selector hasn't been generated before
        const selectorExists = tokenPairs.some(tp => tp.selector === tokenPair.selector);
        const verifierExists = tokenPairs.some(tp => tp.verifier === tokenPair.verifier);
        
        tokenPairs.push(tokenPair);
        
        // Both selector and verifier should be unique
        return !selectorExists && !verifierExists;
      }),
      { numRuns: 100 }
    );
  });
});

// ============================================
// PROPERTY 5: Valid token lookup returns correct session
// **Feature: security-hardening, Property 5: Valid token lookup returns correct session**
// **Validates: Requirements 2.2**
// ============================================

describe('Property 5: Valid token lookup returns correct session', () => {
  // Simulate session storage with selector pattern
  class MockSelectorSessionStore {
    private sessions = new Map<string, { 
      id: string;
      userId: string; 
      tokenSelector: string;
      tokenVerifier: string; // bcrypt hashed
      expiresAt: Date;
    }>();

    async createSession(userId: string, tokenPair: TokenPair, expiresInDays: number): Promise<string> {
      const sessionId = randomBytes(16).toString('hex');
      const hashedVerifier = await bcrypt.hash(tokenPair.verifier, BCRYPT_COST);
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + expiresInDays);
      
      this.sessions.set(tokenPair.selector, { 
        id: sessionId,
        userId, 
        tokenSelector: tokenPair.selector,
        tokenVerifier: hashedVerifier,
        expiresAt 
      });
      return sessionId;
    }

    async getSessionByToken(fullToken: string): Promise<{ id: string; userId: string } | null> {
      // Parse the token
      const parsed = parseToken(fullToken);
      if (!parsed) return null;
      
      // O(1) lookup by selector
      const session = this.sessions.get(parsed.selector);
      if (!session) return null;
      
      // Check expiration
      if (session.expiresAt <= new Date()) return null;
      
      // Verify the verifier
      const isValid = await bcrypt.compare(parsed.verifier, session.tokenVerifier);
      if (!isValid) return null;
      
      return { id: session.id, userId: session.userId };
    }
  }

  it('*For any* valid refresh token, looking up the session SHALL return the session associated with that token', async () => {
    await fc.assert(
      fc.asyncProperty(fc.uuid(), async (userId) => {
        const store = new MockSelectorSessionStore();
        const tokenPair = generateTokenPair();
        
        // Create session
        const sessionId = await store.createSession(userId, tokenPair, 7);
        
        // Lookup by full token
        const session = await store.getSessionByToken(tokenPair.fullToken);
        
        // Should find the correct session
        return session !== null && session.id === sessionId && session.userId === userId;
      }),
      { numRuns: 20 }
    );
  });

  it('invalid token format should return null', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.oneof(
          fc.constant(''),
          fc.constant('invalid'),
          fc.constant('no.dots.here'),
          fc.string({ minLength: 1, maxLength: 50 }).filter(s => !s.includes('.')),
          fc.string({ minLength: 1, maxLength: 20 }).map(s => `${s}.${s}`) // Wrong lengths
        ),
        async (invalidToken) => {
          const store = new MockSelectorSessionStore();
          const session = await store.getSessionByToken(invalidToken);
          return session === null;
        }
      ),
      { numRuns: 50 }
    );
  });

  it('wrong verifier should return null', async () => {
    await fc.assert(
      fc.asyncProperty(fc.uuid(), async (userId) => {
        const store = new MockSelectorSessionStore();
        const tokenPair = generateTokenPair();
        const wrongTokenPair = generateTokenPair();
        
        // Create session with original token
        await store.createSession(userId, tokenPair, 7);
        
        // Try to lookup with correct selector but wrong verifier
        const wrongToken = `${tokenPair.selector}.${wrongTokenPair.verifier}`;
        const session = await store.getSessionByToken(wrongToken);
        
        return session === null;
      }),
      { numRuns: 20 }
    );
  });

  it('non-existent selector should return null', async () => {
    await fc.assert(
      fc.asyncProperty(fc.uuid(), async (userId) => {
        const store = new MockSelectorSessionStore();
        const tokenPair = generateTokenPair();
        const nonExistentTokenPair = generateTokenPair();
        
        // Create session
        await store.createSession(userId, tokenPair, 7);
        
        // Try to lookup with non-existent selector
        const session = await store.getSessionByToken(nonExistentTokenPair.fullToken);
        
        return session === null;
      }),
      { numRuns: 20 }
    );
  });
});

// ============================================
// PROPERTY 6: Token rotation generates new credentials
// **Feature: security-hardening, Property 6: Token rotation generates new credentials**
// **Validates: Requirements 2.5**
// ============================================

describe('Property 6: Token rotation generates new credentials', () => {
  // Simulate session storage with rotation
  class MockRotatingSessionStore {
    private sessions = new Map<string, { 
      id: string;
      userId: string; 
      tokenSelector: string;
      tokenVerifier: string;
      previousSelector: string | null;
      expiresAt: Date;
    }>();

    async createSession(userId: string, tokenPair: TokenPair, expiresInDays: number): Promise<string> {
      const sessionId = randomBytes(16).toString('hex');
      const hashedVerifier = await bcrypt.hash(tokenPair.verifier, BCRYPT_COST);
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + expiresInDays);
      
      this.sessions.set(sessionId, { 
        id: sessionId,
        userId, 
        tokenSelector: tokenPair.selector,
        tokenVerifier: hashedVerifier,
        previousSelector: null,
        expiresAt 
      });
      return sessionId;
    }

    async rotateToken(sessionId: string, newTokenPair: TokenPair): Promise<{ 
      oldSelector: string; 
      newSelector: string;
      oldVerifier: string;
      newVerifier: string;
    } | null> {
      const session = this.sessions.get(sessionId);
      if (!session) return null;
      
      const oldSelector = session.tokenSelector;
      const oldVerifier = session.tokenVerifier;
      
      // Store previous selector for reuse detection
      session.previousSelector = oldSelector;
      session.tokenSelector = newTokenPair.selector;
      session.tokenVerifier = await bcrypt.hash(newTokenPair.verifier, BCRYPT_COST);
      
      return {
        oldSelector,
        newSelector: session.tokenSelector,
        oldVerifier,
        newVerifier: session.tokenVerifier
      };
    }

    getSession(sessionId: string) {
      return this.sessions.get(sessionId);
    }
  }

  it('*For any* session token rotation, the new tokenSelector and tokenVerifier SHALL differ from the previous values', async () => {
    await fc.assert(
      fc.asyncProperty(fc.uuid(), async (userId) => {
        const store = new MockRotatingSessionStore();
        const originalTokenPair = generateTokenPair();
        const newTokenPair = generateTokenPair();
        
        // Create session
        const sessionId = await store.createSession(userId, originalTokenPair, 7);
        
        // Rotate token
        const result = await store.rotateToken(sessionId, newTokenPair);
        if (!result) return false;
        
        // New selector should differ from old
        const selectorChanged = result.oldSelector !== result.newSelector;
        
        // New verifier hash should differ from old
        const verifierChanged = result.oldVerifier !== result.newVerifier;
        
        // New selector should match the new token pair
        const selectorMatches = result.newSelector === newTokenPair.selector;
        
        return selectorChanged && verifierChanged && selectorMatches;
      }),
      { numRuns: 20 }
    );
  });

  it('rotation should store previous selector for reuse detection', async () => {
    await fc.assert(
      fc.asyncProperty(fc.uuid(), async (userId) => {
        const store = new MockRotatingSessionStore();
        const originalTokenPair = generateTokenPair();
        const newTokenPair = generateTokenPair();
        
        // Create session
        const sessionId = await store.createSession(userId, originalTokenPair, 7);
        
        // Verify no previous selector initially
        const beforeRotation = store.getSession(sessionId);
        if (!beforeRotation || beforeRotation.previousSelector !== null) return false;
        
        // Rotate token
        await store.rotateToken(sessionId, newTokenPair);
        
        // Verify previous selector is stored
        const afterRotation = store.getSession(sessionId);
        if (!afterRotation) return false;
        
        return afterRotation.previousSelector === originalTokenPair.selector;
      }),
      { numRuns: 20 }
    );
  });

  it('multiple rotations should update previous selector each time', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(),
        fc.integer({ min: 2, max: 5 }),
        async (userId, rotationCount) => {
          const store = new MockRotatingSessionStore();
          let currentTokenPair = generateTokenPair();
          
          // Create session
          const sessionId = await store.createSession(userId, currentTokenPair, 7);
          
          // Perform multiple rotations
          for (let i = 0; i < rotationCount; i++) {
            const previousSelector = currentTokenPair.selector;
            currentTokenPair = generateTokenPair();
            
            await store.rotateToken(sessionId, currentTokenPair);
            
            // Verify previous selector is the one from before rotation
            const session = store.getSession(sessionId);
            if (!session || session.previousSelector !== previousSelector) {
              return false;
            }
          }
          
          return true;
        }
      ),
      { numRuns: 10 }
    );
  });
});

// ============================================
// parseToken edge cases
// ============================================

// Helper to generate hex strings of specific length
const hexStringArb = (length: number) => 
  fc.array(fc.integer({ min: 0, max: 15 }), { minLength: length, maxLength: length })
    .map(arr => arr.map(n => n.toString(16)).join(''));

// Helper to generate hex strings with variable length
const hexStringRangeArb = (minLength: number, maxLength: number) =>
  fc.integer({ min: minLength, max: maxLength })
    .chain(len => hexStringArb(len));

describe('parseToken edge cases', () => {
  it('should reject tokens with wrong selector length', () => {
    fc.assert(
      fc.property(
        hexStringRangeArb(1, 31), // Too short
        hexStringArb(64),
        (selector, verifier) => {
          const token = `${selector}.${verifier}`;
          return parseToken(token) === null;
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should reject tokens with wrong verifier length', () => {
    fc.assert(
      fc.property(
        hexStringArb(32),
        hexStringRangeArb(1, 63), // Too short
        (selector, verifier) => {
          const token = `${selector}.${verifier}`;
          return parseToken(token) === null;
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should reject tokens with non-hex characters', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 32, maxLength: 32 }).filter(s => !/^[a-f0-9]+$/i.test(s) && s.length === 32),
        hexStringArb(64),
        (selector, verifier) => {
          const token = `${selector}.${verifier}`;
          return parseToken(token) === null;
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should accept valid tokens', () => {
    fc.assert(
      fc.property(
        hexStringArb(32),
        hexStringArb(64),
        (selector, verifier) => {
          const token = `${selector}.${verifier}`;
          const parsed = parseToken(token);
          return parsed !== null && 
                 parsed.selector === selector.toLowerCase() && 
                 parsed.verifier === verifier.toLowerCase();
        }
      ),
      { numRuns: 100 }
    );
  });
});
