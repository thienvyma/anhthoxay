/**
 * Encryption Utility Tests
 * Tests AES-256-GCM encryption/decryption
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { encrypt, decrypt, isEncrypted, validateEncryptionKey } from './encryption';

describe('Encryption Utilities', () => {
  const originalEnv = process.env.ENCRYPTION_KEY;
  const originalNodeEnv = process.env.NODE_ENV;

  beforeEach(() => {
    // Reset to test environment
    process.env.NODE_ENV = 'test';
    delete process.env.ENCRYPTION_KEY;
  });

  afterEach(() => {
    // Restore original environment
    if (originalEnv) {
      process.env.ENCRYPTION_KEY = originalEnv;
    } else {
      delete process.env.ENCRYPTION_KEY;
    }
    process.env.NODE_ENV = originalNodeEnv;
  });

  describe('encrypt', () => {
    it('should encrypt plaintext', () => {
      const plaintext = 'my-secret-token';
      const encrypted = encrypt(plaintext);

      expect(encrypted).toBeDefined();
      expect(typeof encrypted).toBe('string');
      expect(encrypted).not.toBe(plaintext);
    });

    it('should produce different ciphertext for same plaintext', () => {
      const plaintext = 'my-secret-token';
      const encrypted1 = encrypt(plaintext);
      const encrypted2 = encrypt(plaintext);

      // Due to random IV, same plaintext produces different ciphertext
      expect(encrypted1).not.toBe(encrypted2);
    });

    it('should produce output in correct format (iv:authTag:ciphertext)', () => {
      const encrypted = encrypt('test');
      const parts = encrypted.split(':');

      expect(parts).toHaveLength(3);
      // All parts should be base64
      parts.forEach((part) => {
        expect(() => Buffer.from(part, 'base64')).not.toThrow();
      });
    });

    it('should handle empty string', () => {
      const encrypted = encrypt('');
      expect(encrypted).toBeDefined();

      const decrypted = decrypt(encrypted);
      expect(decrypted).toBe('');
    });

    it('should handle unicode characters', () => {
      const plaintext = 'Xin chào 你好 🎉';
      const encrypted = encrypt(plaintext);
      const decrypted = decrypt(encrypted);

      expect(decrypted).toBe(plaintext);
    });

    it('should handle long strings', () => {
      const plaintext = 'a'.repeat(10000);
      const encrypted = encrypt(plaintext);
      const decrypted = decrypt(encrypted);

      expect(decrypted).toBe(plaintext);
    });
  });

  describe('decrypt', () => {
    it('should decrypt encrypted text', () => {
      const plaintext = 'my-secret-token';
      const encrypted = encrypt(plaintext);
      const decrypted = decrypt(encrypted);

      expect(decrypted).toBe(plaintext);
    });

    it('should throw for invalid format (missing parts)', () => {
      expect(() => decrypt('invalid')).toThrow('Invalid encrypted format');
      expect(() => decrypt('part1:part2')).toThrow('Invalid encrypted format');
    });

    it('should throw for invalid base64', () => {
      expect(() => decrypt('!!!:!!!:!!!')).toThrow();
    });

    it('should throw for wrong IV length', () => {
      // Create invalid encrypted string with wrong IV length
      const wrongIv = Buffer.from('short').toString('base64');
      const authTag = Buffer.alloc(16).toString('base64');
      const ciphertext = Buffer.from('test').toString('base64');

      expect(() => decrypt(`${wrongIv}:${authTag}:${ciphertext}`)).toThrow(
        'Invalid IV length'
      );
    });

    it('should throw for wrong auth tag length', () => {
      const iv = Buffer.alloc(12).toString('base64');
      const wrongAuthTag = Buffer.from('short').toString('base64');
      const ciphertext = Buffer.from('test').toString('base64');

      expect(() => decrypt(`${iv}:${wrongAuthTag}:${ciphertext}`)).toThrow(
        'Invalid auth tag length'
      );
    });

    it('should throw for corrupted ciphertext', () => {
      const plaintext = 'test';
      const encrypted = encrypt(plaintext);
      const parts = encrypted.split(':');

      // Corrupt the ciphertext
      parts[2] = Buffer.from('corrupted').toString('base64');
      const corrupted = parts.join(':');

      expect(() => decrypt(corrupted)).toThrow('DECRYPTION_CORRUPTED');
    });

    it('should throw for tampered auth tag', () => {
      const plaintext = 'test';
      const encrypted = encrypt(plaintext);
      const parts = encrypted.split(':');

      // Tamper with auth tag
      parts[1] = Buffer.alloc(16, 0xff).toString('base64');
      const tampered = parts.join(':');

      expect(() => decrypt(tampered)).toThrow('DECRYPTION_CORRUPTED');
    });
  });

  describe('isEncrypted', () => {
    it('should return true for encrypted strings', () => {
      const encrypted = encrypt('test');
      expect(isEncrypted(encrypted)).toBe(true);
    });

    it('should return false for plain text', () => {
      expect(isEncrypted('plain-text-token')).toBe(false);
      expect(isEncrypted('not-encrypted')).toBe(false);
    });

    it('should return false for empty string', () => {
      expect(isEncrypted('')).toBe(false);
    });

    it('should return false for null/undefined', () => {
      expect(isEncrypted(null as unknown as string)).toBe(false);
      expect(isEncrypted(undefined as unknown as string)).toBe(false);
    });

    it('should return false for wrong number of parts', () => {
      expect(isEncrypted('part1:part2')).toBe(false);
      expect(isEncrypted('part1:part2:part3:part4')).toBe(false);
    });

    it('should return false for invalid base64 parts', () => {
      expect(isEncrypted('!!!:!!!:!!!')).toBe(false);
    });

    it('should return false for wrong component lengths', () => {
      // Valid base64 but wrong lengths
      const shortIv = Buffer.from('short').toString('base64');
      const authTag = Buffer.alloc(16).toString('base64');
      const ciphertext = Buffer.from('test').toString('base64');

      expect(isEncrypted(`${shortIv}:${authTag}:${ciphertext}`)).toBe(false);
    });
  });

  describe('validateEncryptionKey', () => {
    it('should not throw in test environment without key', () => {
      process.env.NODE_ENV = 'test';
      delete process.env.ENCRYPTION_KEY;

      expect(() => validateEncryptionKey()).not.toThrow();
    });

    it('should not throw in development without key', () => {
      process.env.NODE_ENV = 'development';
      delete process.env.ENCRYPTION_KEY;

      expect(() => validateEncryptionKey()).not.toThrow();
    });

    it('should throw in production without key', () => {
      process.env.NODE_ENV = 'production';
      delete process.env.ENCRYPTION_KEY;

      expect(() => validateEncryptionKey()).toThrow('ENCRYPTION_KEY_MISSING');
    });

    it('should accept valid 32-byte key', () => {
      // Generate valid 32-byte key
      const validKey = Buffer.alloc(32, 'a').toString('base64');
      process.env.ENCRYPTION_KEY = validKey;

      expect(() => validateEncryptionKey()).not.toThrow();
    });

    it('should throw for invalid key length', () => {
      // 16-byte key (too short)
      const shortKey = Buffer.alloc(16, 'a').toString('base64');
      process.env.ENCRYPTION_KEY = shortKey;

      expect(() => validateEncryptionKey()).toThrow('ENCRYPTION_KEY_INVALID');
    });
  });

  describe('Round-trip encryption', () => {
    const testCases = [
      { name: 'simple string', value: 'hello world' },
      { name: 'JSON object', value: JSON.stringify({ key: 'value', nested: { a: 1 } }) },
      { name: 'OAuth token', value: 'ya29.a0AfH6SMBx...' },
      { name: 'API key', value: 'sk-1234567890abcdef' },
      { name: 'special characters', value: '!@#$%^&*()_+-=[]{}|;:,.<>?' },
      { name: 'newlines', value: 'line1\nline2\nline3' },
      { name: 'tabs', value: 'col1\tcol2\tcol3' },
    ];

    testCases.forEach(({ name, value }) => {
      it(`should round-trip ${name}`, () => {
        const encrypted = encrypt(value);
        const decrypted = decrypt(encrypted);
        expect(decrypted).toBe(value);
      });
    });
  });
});
