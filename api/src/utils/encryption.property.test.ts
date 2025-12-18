/**
 * Property-Based Tests for Encryption Service
 * 
 * **Feature: security-hardening**
 * **Validates: Requirements 1.2, 1.4, 1.5, 1.6**
 */

import * as fc from 'fast-check';
import { describe, it, expect } from 'vitest';
import { encrypt, decrypt, isEncrypted } from './encryption';

// ============================================
// Generators
// ============================================

// Generate arbitrary plaintext strings (including unicode)
const plaintextArb = fc.string({ minLength: 0, maxLength: 1000 });

// Generate plaintext with special characters
const plaintextWithSpecialChars = fc.oneof(
  fc.string(),
  fc.string({ unit: 'grapheme' }), // Unicode strings
  fc.array(fc.constantFrom(':', '=', '+', '/', '\n', '\r', '\t', ' '), { minLength: 1, maxLength: 50 }).map(arr => arr.join('')),
);

// ============================================
// PROPERTY 1: Encryption round-trip consistency
// **Feature: security-hardening, Property 1: Encryption round-trip consistency**
// **Validates: Requirements 1.2, 1.5**
// ============================================

describe('Property 1: Encryption round-trip consistency', () => {
  it('encrypting then decrypting any string should return the original value', () => {
    fc.assert(
      fc.property(
        plaintextArb,
        (plaintext) => {
          const encrypted = encrypt(plaintext);
          const decrypted = decrypt(encrypted);
          return decrypted === plaintext;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('round-trip works with unicode strings', () => {
    fc.assert(
      fc.property(
        fc.string({ unit: 'grapheme', minLength: 0, maxLength: 500 }),
        (plaintext) => {
          const encrypted = encrypt(plaintext);
          const decrypted = decrypt(encrypted);
          return decrypted === plaintext;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('round-trip works with special characters including colons', () => {
    fc.assert(
      fc.property(
        plaintextWithSpecialChars,
        (plaintext) => {
          const encrypted = encrypt(plaintext);
          const decrypted = decrypt(encrypted);
          return decrypted === plaintext;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('round-trip works with empty string', () => {
    const encrypted = encrypt('');
    const decrypted = decrypt(encrypted);
    expect(decrypted).toBe('');
  });

  it('round-trip works with very long strings', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1000, maxLength: 5000 }),
        (plaintext) => {
          const encrypted = encrypt(plaintext);
          const decrypted = decrypt(encrypted);
          return decrypted === plaintext;
        }
      ),
      { numRuns: 20 }
    );
  });
});

// ============================================
// PROPERTY 2: Unique IV per encryption
// **Feature: security-hardening, Property 2: Unique IV per encryption**
// **Validates: Requirements 1.4**
// ============================================

describe('Property 2: Unique IV per encryption', () => {
  it('encrypting the same plaintext multiple times produces different ciphertexts', () => {
    fc.assert(
      fc.property(
        plaintextArb,
        fc.integer({ min: 2, max: 10 }),
        (plaintext, count) => {
          const encryptions = Array.from({ length: count }, () => encrypt(plaintext));
          
          // Extract IVs (first part before colon)
          const ivs = encryptions.map(e => e.split(':')[0]);
          
          // All IVs should be unique
          const uniqueIvs = new Set(ivs);
          return uniqueIvs.size === count;
        }
      ),
      { numRuns: 50 }
    );
  });

  it('two encryptions of the same string have different IVs', () => {
    const plaintext = 'test-token-12345';
    const encrypted1 = encrypt(plaintext);
    const encrypted2 = encrypt(plaintext);
    
    const iv1 = encrypted1.split(':')[0];
    const iv2 = encrypted2.split(':')[0];
    
    expect(iv1).not.toBe(iv2);
  });

  it('encrypted output format is iv:authTag:ciphertext', () => {
    fc.assert(
      fc.property(
        plaintextArb,
        (plaintext) => {
          const encrypted = encrypt(plaintext);
          const parts = encrypted.split(':');
          
          // Should have exactly 3 parts
          if (parts.length !== 3) return false;
          
          // All parts should be valid base64
          const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
          return parts.every(part => base64Regex.test(part));
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ============================================
// PROPERTY 3: Decryption failure handling
// **Feature: security-hardening, Property 3: Decryption failure handling**
// **Validates: Requirements 1.6**
// ============================================

describe('Property 3: Decryption failure handling', () => {
  it('decrypting invalid format throws descriptive error', () => {
    fc.assert(
      fc.property(
        // Generate strings that don't match the encrypted format
        fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.split(':').length !== 3),
        (invalidInput) => {
          try {
            decrypt(invalidInput);
            return false; // Should have thrown
          } catch (error) {
            // Should throw with descriptive message
            return error instanceof Error && error.message.includes('DECRYPTION_FAILED');
          }
        }
      ),
      { numRuns: 50 }
    );
  });

  it('decrypting corrupted ciphertext throws error', () => {
    fc.assert(
      fc.property(
        plaintextArb.filter(s => s.length > 0),
        (plaintext) => {
          const encrypted = encrypt(plaintext);
          const parts = encrypted.split(':');
          
          // Corrupt the ciphertext (third part)
          const corruptedCiphertext = Buffer.from('corrupted-data').toString('base64');
          const corrupted = `${parts[0]}:${parts[1]}:${corruptedCiphertext}`;
          
          try {
            decrypt(corrupted);
            return false; // Should have thrown
          } catch (error) {
            return error instanceof Error && error.message.includes('DECRYPTION_CORRUPTED');
          }
        }
      ),
      { numRuns: 50 }
    );
  });

  it('decrypting with tampered auth tag throws error', () => {
    fc.assert(
      fc.property(
        plaintextArb.filter(s => s.length > 0),
        (plaintext) => {
          const encrypted = encrypt(plaintext);
          const parts = encrypted.split(':');
          
          // Tamper with auth tag (second part)
          const tamperedTag = Buffer.from('0'.repeat(16)).toString('base64');
          const tampered = `${parts[0]}:${tamperedTag}:${parts[2]}`;
          
          try {
            decrypt(tampered);
            return false; // Should have thrown
          } catch (error) {
            return error instanceof Error && error.message.includes('DECRYPTION_CORRUPTED');
          }
        }
      ),
      { numRuns: 50 }
    );
  });

  it('decrypting with invalid IV length throws error', () => {
    const plaintext = 'test';
    const encrypted = encrypt(plaintext);
    const parts = encrypted.split(':');
    
    // Use invalid IV (wrong length)
    const invalidIv = Buffer.from('short').toString('base64');
    const invalid = `${invalidIv}:${parts[1]}:${parts[2]}`;
    
    expect(() => decrypt(invalid)).toThrow('DECRYPTION_FAILED');
  });

  it('decrypting with invalid base64 throws error', () => {
    const invalidBase64 = '!!!invalid!!!:!!!base64!!!:!!!data!!!';
    
    expect(() => decrypt(invalidBase64)).toThrow('DECRYPTION_FAILED');
  });
});

// ============================================
// isEncrypted helper tests
// ============================================

describe('isEncrypted helper', () => {
  it('returns true for encrypted values', () => {
    fc.assert(
      fc.property(
        plaintextArb,
        (plaintext) => {
          const encrypted = encrypt(plaintext);
          return isEncrypted(encrypted) === true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('returns false for plaintext values', () => {
    fc.assert(
      fc.property(
        // Generate strings that look like plaintext (no colons or wrong format)
        fc.string({ minLength: 1, maxLength: 100 }).filter(s => !s.includes(':')),
        (plaintext) => {
          return isEncrypted(plaintext) === false;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('returns false for empty string', () => {
    expect(isEncrypted('')).toBe(false);
  });

  it('returns false for null/undefined-like values', () => {
    // @ts-expect-error - testing runtime behavior
    expect(isEncrypted(null)).toBe(false);
    // @ts-expect-error - testing runtime behavior
    expect(isEncrypted(undefined)).toBe(false);
  });

  it('returns false for strings with wrong number of parts', () => {
    expect(isEncrypted('one:two')).toBe(false);
    expect(isEncrypted('one:two:three:four')).toBe(false);
  });
});
