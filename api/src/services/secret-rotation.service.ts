/**
 * Secret Rotation Service
 *
 * Provides support for rotating JWT secrets and encryption keys without downtime.
 * Supports multiple secrets during transition periods for seamless rotation.
 *
 * **Feature: high-traffic-resilience**
 * **Validates: Requirements 6.1, 6.2, 6.5, 6.6**
 */

import * as jwt from 'jsonwebtoken';
import { randomBytes, createCipheriv, createDecipheriv } from 'crypto';
import { logger } from '../utils/logger';

// ============================================
// Constants
// ============================================

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // 96 bits for GCM
const AUTH_TAG_LENGTH = 16; // 128 bits
const KEY_LENGTH = 32; // 256 bits
const ENCRYPTED_FORMAT_SEPARATOR = ':';
const JWT_SECRET_MIN_LENGTH = 32;
const DEFAULT_GRACE_PERIOD_MS = 24 * 60 * 60 * 1000; // 24 hours

// ============================================
// Types & Interfaces
// ============================================

export interface SecretRotationConfig {
  jwtSecrets: string[]; // [current, previous, ...]
  encryptionKeys: string[]; // [current, previous, ...]
  gracePeriod: number; // milliseconds
}

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  iss: string;
  iat: number;
  exp: number;
}

export interface RotationEvent {
  type: 'JWT_SECRET' | 'ENCRYPTION_KEY';
  timestamp: Date;
  success: boolean;
  error?: string;
  metadata?: Record<string, unknown>;
}

export interface SecretRotationStatus {
  jwtSecretsCount: number;
  encryptionKeysCount: number;
  gracePeriodMs: number;
  lastRotationEvent?: RotationEvent;
}

// ============================================
// Secret Rotation Service Class
// ============================================

export class SecretRotationService {
  private jwtSecrets: string[];
  private encryptionKeys: Buffer[];
  private gracePeriod: number;
  private rotationEvents: RotationEvent[] = [];

  constructor(config?: Partial<SecretRotationConfig>) {
    this.jwtSecrets = this.loadJwtSecrets(config?.jwtSecrets);
    this.encryptionKeys = this.loadEncryptionKeys(config?.encryptionKeys);
    this.gracePeriod = config?.gracePeriod ?? DEFAULT_GRACE_PERIOD_MS;

    this.logRotationEvent({
      type: 'JWT_SECRET',
      timestamp: new Date(),
      success: true,
      metadata: { action: 'initialized', secretsCount: this.jwtSecrets.length },
    });
  }

  // ============================================
  // JWT Secret Management
  // ============================================

  /**
   * Load JWT secrets from config or environment
   * Supports multiple secrets via JWT_SECRET and JWT_SECRET_PREVIOUS
   */
  private loadJwtSecrets(configSecrets?: string[]): string[] {
    if (configSecrets && configSecrets.length > 0) {
      return this.validateJwtSecrets(configSecrets);
    }

    const secrets: string[] = [];
    const currentSecret = process.env.JWT_SECRET;
    const previousSecret = process.env.JWT_SECRET_PREVIOUS;

    if (currentSecret) {
      secrets.push(currentSecret);
    }

    if (previousSecret) {
      secrets.push(previousSecret);
    }

    // Fallback for development
    if (secrets.length === 0 && process.env.NODE_ENV !== 'production') {
      logger.warn('No JWT secrets configured - using development fallback');
      return ['dev-secret-32-chars-minimum-xxxxx'];
    }

    if (secrets.length === 0) {
      throw new Error('JWT_SECRET environment variable is required in production');
    }

    return this.validateJwtSecrets(secrets);
  }

  /**
   * Validate JWT secrets meet minimum length requirements
   */
  private validateJwtSecrets(secrets: string[]): string[] {
    for (const secret of secrets) {
      if (secret.length < JWT_SECRET_MIN_LENGTH) {
        throw new Error(
          `JWT secret must be at least ${JWT_SECRET_MIN_LENGTH} characters (got ${secret.length})`
        );
      }
    }
    return secrets;
  }

  /**
   * Validate JWT token against all configured secrets
   * Tries current secret first, then falls back to previous secrets
   *
   * @param token - JWT token to validate
   * @returns Decoded payload or null if invalid
   */
  validateJwt(token: string): JwtPayload | null {
    for (let i = 0; i < this.jwtSecrets.length; i++) {
      const secret = this.jwtSecrets[i];
      try {
        const payload = jwt.verify(token, secret) as JwtPayload;
        
        // Log if validated with non-primary secret (indicates rotation in progress)
        if (i > 0) {
          logger.info('JWT validated with previous secret', {
            secretIndex: i,
            tokenSub: payload.sub,
          });
        }
        
        return payload;
      } catch {
        // Try next secret
        continue;
      }
    }
    return null;
  }

  /**
   * Validate JWT with detailed error information
   */
  validateJwtWithError(token: string): { payload: JwtPayload | null; error?: string } {
    let lastError: string | undefined;

    for (let i = 0; i < this.jwtSecrets.length; i++) {
      const secret = this.jwtSecrets[i];
      try {
        const payload = jwt.verify(token, secret) as JwtPayload;
        return { payload };
      } catch (err) {
        if (err instanceof jwt.TokenExpiredError) {
          lastError = 'TOKEN_EXPIRED';
        } else if (err instanceof jwt.JsonWebTokenError) {
          lastError = 'TOKEN_INVALID';
        } else {
          lastError = 'TOKEN_INVALID';
        }
      }
    }

    return { payload: null, error: lastError };
  }

  /**
   * Sign a new JWT with the current (primary) secret
   */
  signJwt(payload: Omit<JwtPayload, 'iat' | 'exp'>, expiresIn = '15m'): string {
    if (this.jwtSecrets.length === 0) {
      throw new Error('No JWT secrets configured');
    }
    return jwt.sign(payload, this.jwtSecrets[0], { expiresIn } as jwt.SignOptions);
  }

  /**
   * Get the current (primary) JWT secret
   */
  getCurrentJwtSecret(): string {
    if (this.jwtSecrets.length === 0) {
      throw new Error('No JWT secrets configured');
    }
    return this.jwtSecrets[0];
  }

  // ============================================
  // Encryption Key Management
  // ============================================

  /**
   * Load encryption keys from config or environment
   * Supports multiple keys via ENCRYPTION_KEY and ENCRYPTION_KEY_PREVIOUS
   */
  private loadEncryptionKeys(configKeys?: string[]): Buffer[] {
    if (configKeys && configKeys.length > 0) {
      return this.validateEncryptionKeys(configKeys);
    }

    const keys: string[] = [];
    const currentKey = process.env.ENCRYPTION_KEY;
    const previousKey = process.env.ENCRYPTION_KEY_PREVIOUS;

    if (currentKey) {
      keys.push(currentKey);
    }

    if (previousKey) {
      keys.push(previousKey);
    }

    // Fallback for development
    if (keys.length === 0 && process.env.NODE_ENV !== 'production') {
      logger.warn('No encryption keys configured - using development fallback');
      return [Buffer.from('0123456789abcdef0123456789abcdef')]; // 32 bytes
    }

    if (keys.length === 0) {
      throw new Error('ENCRYPTION_KEY environment variable is required in production');
    }

    return this.validateEncryptionKeys(keys);
  }

  /**
   * Validate encryption keys are proper length
   */
  private validateEncryptionKeys(keys: string[]): Buffer[] {
    return keys.map((keyBase64, index) => {
      const key = Buffer.from(keyBase64, 'base64');
      if (key.length !== KEY_LENGTH) {
        throw new Error(
          `Encryption key ${index} must be ${KEY_LENGTH} bytes (256 bits), got ${key.length} bytes`
        );
      }
      return key;
    });
  }

  /**
   * Encrypt data with the current (primary) encryption key
   *
   * @param plaintext - Data to encrypt
   * @returns Encrypted string in format: keyIndex:iv:authTag:ciphertext
   */
  encrypt(plaintext: string): string {
    if (this.encryptionKeys.length === 0) {
      throw new Error('No encryption keys configured');
    }

    const key = this.encryptionKeys[0];
    const iv = randomBytes(IV_LENGTH);

    const cipher = createCipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH });

    const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);

    const authTag = cipher.getAuthTag();

    // Format: keyIndex:iv:authTag:ciphertext (all base64 except keyIndex)
    return [
      '0', // Key index (current key)
      iv.toString('base64'),
      authTag.toString('base64'),
      encrypted.toString('base64'),
    ].join(ENCRYPTED_FORMAT_SEPARATOR);
  }

  /**
   * Decrypt data using any valid encryption key
   * Supports both new format (with key index) and legacy format (without)
   *
   * @param encrypted - Encrypted string
   * @returns Decrypted plaintext
   */
  decrypt(encrypted: string): string {
    const parts = encrypted.split(ENCRYPTED_FORMAT_SEPARATOR);

    // Check if new format (4 parts with key index) or legacy format (3 parts)
    if (parts.length === 4) {
      return this.decryptWithKeyIndex(parts);
    } else if (parts.length === 3) {
      return this.decryptLegacy(parts);
    }

    throw new Error('DECRYPTION_FAILED: Invalid encrypted format');
  }

  /**
   * Decrypt using new format with key index
   */
  private decryptWithKeyIndex(parts: string[]): string {
    const [keyIndexStr, ivBase64, authTagBase64, ciphertextBase64] = parts;
    const keyIndex = parseInt(keyIndexStr, 10);

    if (isNaN(keyIndex) || keyIndex < 0 || keyIndex >= this.encryptionKeys.length) {
      // Try all keys if index is invalid
      return this.decryptWithAllKeys(ivBase64, authTagBase64, ciphertextBase64);
    }

    try {
      return this.decryptWithKey(this.encryptionKeys[keyIndex], ivBase64, authTagBase64, ciphertextBase64);
    } catch {
      // Fallback to trying all keys
      return this.decryptWithAllKeys(ivBase64, authTagBase64, ciphertextBase64);
    }
  }

  /**
   * Decrypt legacy format (without key index) by trying all keys
   */
  private decryptLegacy(parts: string[]): string {
    const [ivBase64, authTagBase64, ciphertextBase64] = parts;
    return this.decryptWithAllKeys(ivBase64, authTagBase64, ciphertextBase64);
  }

  /**
   * Try decryption with all available keys
   */
  private decryptWithAllKeys(ivBase64: string, authTagBase64: string, ciphertextBase64: string): string {
    let lastError: Error | null = null;

    for (let i = 0; i < this.encryptionKeys.length; i++) {
      try {
        const result = this.decryptWithKey(this.encryptionKeys[i], ivBase64, authTagBase64, ciphertextBase64);
        
        // Log if decrypted with non-primary key
        if (i > 0) {
          logger.info('Data decrypted with previous encryption key', { keyIndex: i });
        }
        
        return result;
      } catch (err) {
        lastError = err instanceof Error ? err : new Error('Unknown error');
      }
    }

    throw lastError || new Error('DECRYPTION_FAILED: No valid key found');
  }

  /**
   * Decrypt with a specific key
   */
  private decryptWithKey(
    key: Buffer,
    ivBase64: string,
    authTagBase64: string,
    ciphertextBase64: string
  ): string {
    const iv = Buffer.from(ivBase64, 'base64');
    const authTag = Buffer.from(authTagBase64, 'base64');
    const ciphertext = Buffer.from(ciphertextBase64, 'base64');

    if (iv.length !== IV_LENGTH) {
      throw new Error(`Invalid IV length: expected ${IV_LENGTH}, got ${iv.length}`);
    }

    if (authTag.length !== AUTH_TAG_LENGTH) {
      throw new Error(`Invalid auth tag length: expected ${AUTH_TAG_LENGTH}, got ${authTag.length}`);
    }

    const decipher = createDecipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH });
    decipher.setAuthTag(authTag);

    const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);

    return decrypted.toString('utf8');
  }

  /**
   * Re-encrypt data with the current (primary) key
   * Useful for migrating data encrypted with old keys
   *
   * @param encrypted - Data encrypted with any valid key
   * @returns Data re-encrypted with current key
   */
  reEncrypt(encrypted: string): string {
    const plaintext = this.decrypt(encrypted);
    return this.encrypt(plaintext);
  }

  /**
   * Check if data is encrypted with the current key
   */
  isEncryptedWithCurrentKey(encrypted: string): boolean {
    const parts = encrypted.split(ENCRYPTED_FORMAT_SEPARATOR);
    if (parts.length === 4) {
      return parts[0] === '0';
    }
    // Legacy format - assume not current
    return false;
  }

  // ============================================
  // Rotation Event Logging
  // ============================================

  /**
   * Log a rotation event
   */
  private logRotationEvent(event: RotationEvent): void {
    this.rotationEvents.push(event);

    // Keep only last 100 events
    if (this.rotationEvents.length > 100) {
      this.rotationEvents = this.rotationEvents.slice(-100);
    }

    // Log to system logger
    if (event.success) {
      logger.info('Secret rotation event', {
        type: event.type,
        timestamp: event.timestamp.toISOString(),
        ...event.metadata,
      });
    } else {
      logger.error('Secret rotation event failed', {
        type: event.type,
        timestamp: event.timestamp.toISOString(),
        error: event.error,
        ...event.metadata,
      });
    }
  }

  /**
   * Record a rotation event (public API for external callers)
   */
  recordRotationEvent(
    type: 'JWT_SECRET' | 'ENCRYPTION_KEY',
    success: boolean,
    error?: string,
    metadata?: Record<string, unknown>
  ): void {
    this.logRotationEvent({
      type,
      timestamp: new Date(),
      success,
      error,
      metadata,
    });
  }

  /**
   * Get rotation status
   */
  getStatus(): SecretRotationStatus {
    return {
      jwtSecretsCount: this.jwtSecrets.length,
      encryptionKeysCount: this.encryptionKeys.length,
      gracePeriodMs: this.gracePeriod,
      lastRotationEvent: this.rotationEvents[this.rotationEvents.length - 1],
    };
  }

  /**
   * Get recent rotation events
   */
  getRotationEvents(limit = 10): RotationEvent[] {
    return this.rotationEvents.slice(-limit);
  }

  // ============================================
  // Re-encryption Utilities
  // ============================================

  /**
   * Re-encrypt a batch of encrypted values
   * Returns results with success/failure status for each item
   */
  async reEncryptBatch(
    items: Array<{ id: string; encrypted: string }>
  ): Promise<Array<{ id: string; encrypted: string; success: boolean; error?: string }>> {
    const results: Array<{ id: string; encrypted: string; success: boolean; error?: string }> = [];

    for (const item of items) {
      try {
        // Skip if already encrypted with current key
        if (this.isEncryptedWithCurrentKey(item.encrypted)) {
          results.push({ id: item.id, encrypted: item.encrypted, success: true });
          continue;
        }

        const reEncrypted = this.reEncrypt(item.encrypted);
        results.push({ id: item.id, encrypted: reEncrypted, success: true });
      } catch (err) {
        const error = err instanceof Error ? err.message : 'Unknown error';
        results.push({ id: item.id, encrypted: item.encrypted, success: false, error });
        
        this.logRotationEvent({
          type: 'ENCRYPTION_KEY',
          timestamp: new Date(),
          success: false,
          error,
          metadata: { action: 're-encrypt', itemId: item.id },
        });
      }
    }

    // Log batch completion
    const successCount = results.filter((r) => r.success).length;
    this.logRotationEvent({
      type: 'ENCRYPTION_KEY',
      timestamp: new Date(),
      success: successCount === items.length,
      metadata: {
        action: 're-encrypt-batch',
        total: items.length,
        success: successCount,
        failed: items.length - successCount,
      },
    });

    return results;
  }
}

// ============================================
// Singleton Instance
// ============================================

let secretRotationServiceInstance: SecretRotationService | null = null;

/**
 * Get the singleton instance of SecretRotationService
 */
export function getSecretRotationService(): SecretRotationService {
  if (!secretRotationServiceInstance) {
    secretRotationServiceInstance = new SecretRotationService();
  }
  return secretRotationServiceInstance;
}

/**
 * Reset the singleton instance (for testing)
 */
export function resetSecretRotationService(): void {
  secretRotationServiceInstance = null;
}

export default SecretRotationService;
