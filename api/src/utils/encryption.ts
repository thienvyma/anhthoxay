/**
 * Encryption Utility Module
 * 
 * Provides AES-256-GCM encryption for sensitive data at rest.
 * 
 * **Feature: security-hardening**
 * **Validates: Requirements 1.1, 1.2, 1.3, 1.4**
 */

import { randomBytes, createCipheriv, createDecipheriv } from 'crypto';

// ============================================
// Constants
// ============================================

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // 96 bits for GCM
const AUTH_TAG_LENGTH = 16; // 128 bits
const KEY_LENGTH = 32; // 256 bits
const ENCRYPTED_FORMAT_SEPARATOR = ':';

// ============================================
// Environment Validation
// ============================================

/**
 * Get and validate the encryption key from environment
 * @throws Error if key is missing in production or invalid
 */
function getEncryptionKey(): Buffer {
  const keyBase64 = process.env.ENCRYPTION_KEY;
  
  if (!keyBase64) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('ENCRYPTION_KEY_MISSING: ENCRYPTION_KEY environment variable is required in production');
    }
    // In development/test, use a default key (NOT for production!)
    return Buffer.from('0123456789abcdef0123456789abcdef'); // 32 bytes
  }
  
  const key = Buffer.from(keyBase64, 'base64');
  
  if (key.length !== KEY_LENGTH) {
    throw new Error(`ENCRYPTION_KEY_INVALID: ENCRYPTION_KEY must be ${KEY_LENGTH} bytes (256 bits), got ${key.length} bytes`);
  }
  
  return key;
}

// ============================================
// Encryption Functions
// ============================================

/**
 * Encrypt plaintext using AES-256-GCM
 * 
 * @param plaintext - The string to encrypt
 * @returns Encrypted string in format: iv:authTag:ciphertext (all base64)
 * @throws Error if encryption fails
 * 
 * @example
 * ```ts
 * const encrypted = encrypt('my-secret-token');
 * // Returns: "aGVsbG8=:dGFn:Y2lwaGVy"
 * ```
 */
export function encrypt(plaintext: string): string {
  const key = getEncryptionKey();
  
  // Generate unique IV for each encryption
  const iv = randomBytes(IV_LENGTH);
  
  // Create cipher
  const cipher = createCipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH });
  
  // Encrypt
  const encrypted = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final(),
  ]);
  
  // Get auth tag
  const authTag = cipher.getAuthTag();
  
  // Format: iv:authTag:ciphertext (all base64)
  return [
    iv.toString('base64'),
    authTag.toString('base64'),
    encrypted.toString('base64'),
  ].join(ENCRYPTED_FORMAT_SEPARATOR);
}

/**
 * Decrypt an encrypted string using AES-256-GCM
 * 
 * @param encrypted - The encrypted string in format: iv:authTag:ciphertext
 * @returns The original plaintext
 * @throws Error if decryption fails (invalid format, wrong key, or corrupted data)
 * 
 * @example
 * ```ts
 * const plaintext = decrypt('aGVsbG8=:dGFn:Y2lwaGVy');
 * // Returns: "my-secret-token"
 * ```
 */
export function decrypt(encrypted: string): string {
  const key = getEncryptionKey();
  
  // Parse encrypted format
  const parts = encrypted.split(ENCRYPTED_FORMAT_SEPARATOR);
  
  if (parts.length !== 3) {
    throw new Error('DECRYPTION_FAILED: Invalid encrypted format. Expected iv:authTag:ciphertext');
  }
  
  const [ivBase64, authTagBase64, ciphertextBase64] = parts;
  
  let iv: Buffer;
  let authTag: Buffer;
  let ciphertext: Buffer;
  
  try {
    iv = Buffer.from(ivBase64, 'base64');
    authTag = Buffer.from(authTagBase64, 'base64');
    ciphertext = Buffer.from(ciphertextBase64, 'base64');
  } catch {
    throw new Error('DECRYPTION_FAILED: Invalid base64 encoding in encrypted data');
  }
  
  // Validate IV length
  if (iv.length !== IV_LENGTH) {
    throw new Error(`DECRYPTION_FAILED: Invalid IV length. Expected ${IV_LENGTH}, got ${iv.length}`);
  }
  
  // Validate auth tag length
  if (authTag.length !== AUTH_TAG_LENGTH) {
    throw new Error(`DECRYPTION_FAILED: Invalid auth tag length. Expected ${AUTH_TAG_LENGTH}, got ${authTag.length}`);
  }
  
  try {
    // Create decipher
    const decipher = createDecipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH });
    decipher.setAuthTag(authTag);
    
    // Decrypt
    const decrypted = Buffer.concat([
      decipher.update(ciphertext),
      decipher.final(),
    ]);
    
    return decrypted.toString('utf8');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`DECRYPTION_CORRUPTED: Failed to decrypt data. ${message}`);
  }
}

/**
 * Check if a value appears to be in encrypted format
 * 
 * @param value - The value to check
 * @returns true if the value matches the encrypted format pattern
 * 
 * @example
 * ```ts
 * isEncrypted('aGVsbG8=:dGFn:Y2lwaGVy'); // true
 * isEncrypted('plain-text-token'); // false
 * ```
 */
export function isEncrypted(value: string): boolean {
  if (!value || typeof value !== 'string') {
    return false;
  }
  
  const parts = value.split(ENCRYPTED_FORMAT_SEPARATOR);
  
  if (parts.length !== 3) {
    return false;
  }
  
  const [ivBase64, authTagBase64, ciphertextBase64] = parts;
  
  // Check if all parts are valid base64
  const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
  if (!base64Regex.test(ivBase64) || !base64Regex.test(authTagBase64) || !base64Regex.test(ciphertextBase64)) {
    return false;
  }
  
  try {
    const iv = Buffer.from(ivBase64, 'base64');
    const authTag = Buffer.from(authTagBase64, 'base64');
    
    // Validate expected lengths
    return iv.length === IV_LENGTH && authTag.length === AUTH_TAG_LENGTH;
  } catch {
    return false;
  }
}

/**
 * Validate that the encryption key is properly configured
 * Call this at application startup to fail fast if misconfigured
 * 
 * @throws Error if encryption key is missing or invalid
 */
export function validateEncryptionKey(): void {
  getEncryptionKey();
}

export default {
  encrypt,
  decrypt,
  isEncrypted,
  validateEncryptionKey,
};
