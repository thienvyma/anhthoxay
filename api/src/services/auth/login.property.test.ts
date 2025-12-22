/**
 * Property-Based Tests for Auth System - Login Operations
 * Using fast-check for property testing
 *
 * These tests verify login-related properties defined in the design document.
 * **Feature: auth-system**
 */

import * as fc from 'fast-check';
import {
  // Constants
  BCRYPT_COST,
  // Generators
  validPasswordArb,
  invalidPasswordArb,
  emailArb,
  userArb,
  // Helper functions
  hashPassword,
  verifyPassword,
  validatePassword,
  generateAccessToken,
  verifyAccessToken,
  generateRefreshToken,
  simulateLogin,
  // Mock stores
  MockUserStore,
} from './test-utils';

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
      { numRuns: 20 } // Reduced due to bcrypt being slow
    );
  }, 30000); // Extended timeout for bcrypt operations

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
      { numRuns: 20 } // Reduced due to bcrypt being slow
    );
  }, 30000); // Extended timeout for bcrypt operations
});

// ============================================
// PROPERTY 4: Invalid credentials rejection
// **Feature: auth-system, Property 4: Invalid credentials rejection**
// **Validates: Requirements 2.2**
// ============================================

describe('Property 4: Invalid credentials rejection', () => {
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
// PROPERTY 10: Password minimum length
// **Feature: auth-system, Property 10: Password minimum length**
// **Validates: Requirements 7.3**
// ============================================

describe('Property 10: Password minimum length', () => {
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
