/**
 * Property-Based Tests for Auth System - Token Operations
 * Using fast-check for property testing
 *
 * These tests verify token-related properties defined in the design document.
 * **Feature: auth-system, security-hardening**
 */

import * as fc from 'fast-check';
import * as bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';
import {
  // Constants
  BCRYPT_COST,
  ACCESS_TOKEN_EXPIRY_SECONDS,
  // Generators
  userArb,
  hexStringArb,
  hexStringRangeArb,
  // Helper functions
  generateAccessToken,
  verifyAccessToken,
  generateRefreshToken,
} from './test-utils';

// Import the token pair functions for testing
import { generateTokenPair, parseToken, TokenPair } from '../auth.service';

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
// TOKEN SELECTOR PATTERN TESTS
// **Feature: security-hardening**
// ============================================

// ============================================
// PROPERTY 4 (Token Selector): Session creation stores selector and verifier
// **Feature: security-hardening, Property 4: Session creation stores selector and verifier**
// **Validates: Requirements 2.1**
// ============================================

describe('Property 4 (Token Selector): Session creation stores selector and verifier', () => {
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
// PROPERTY 5 (Token Selector): Valid token lookup returns correct session
// **Feature: security-hardening, Property 5: Valid token lookup returns correct session**
// **Validates: Requirements 2.2**
// ============================================

describe('Property 5 (Token Selector): Valid token lookup returns correct session', () => {
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
// PROPERTY 6 (Token Selector): Token rotation generates new credentials
// **Feature: security-hardening, Property 6: Token rotation generates new credentials**
// **Validates: Requirements 2.5**
// ============================================

describe('Property 6 (Token Selector): Token rotation generates new credentials', () => {
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
