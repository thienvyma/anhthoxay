/**
 * Secret Rotation Service Tests
 *
 * **Feature: high-traffic-resilience**
 * **Validates: Requirements 6.1, 6.2, 6.5, 6.6**
 */

import * as jwt from 'jsonwebtoken';
import {
  SecretRotationService,
  getSecretRotationService,
  resetSecretRotationService,
} from './secret-rotation.service';

describe('SecretRotationService', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    // Reset singleton
    resetSecretRotationService();
    // Reset environment
    process.env.NODE_ENV = 'test';
    delete process.env.JWT_SECRET;
    delete process.env.JWT_SECRET_PREVIOUS;
    delete process.env.ENCRYPTION_KEY;
    delete process.env.ENCRYPTION_KEY_PREVIOUS;
  });

  afterAll(() => {
    // Restore original environment
    process.env = originalEnv;
  });

  describe('JWT Secret Management', () => {
    const validSecret = 'test-jwt-secret-32-chars-minimum';
    const previousSecret = 'previous-jwt-secret-32-chars-min';

    it('should validate JWT with current secret', () => {
      const service = new SecretRotationService({
        jwtSecrets: [validSecret],
        encryptionKeys: [],
      });

      const token = jwt.sign({ sub: 'user-1', email: 'test@test.com', role: 'USER' }, validSecret);
      const payload = service.validateJwt(token);

      expect(payload).not.toBeNull();
      expect(payload?.sub).toBe('user-1');
    });

    it('should validate JWT with previous secret during rotation', () => {
      const service = new SecretRotationService({
        jwtSecrets: [validSecret, previousSecret],
        encryptionKeys: [],
      });

      // Token signed with previous secret
      const token = jwt.sign(
        { sub: 'user-1', email: 'test@test.com', role: 'USER' },
        previousSecret
      );
      const payload = service.validateJwt(token);

      expect(payload).not.toBeNull();
      expect(payload?.sub).toBe('user-1');
    });

    it('should return null for invalid JWT', () => {
      const service = new SecretRotationService({
        jwtSecrets: [validSecret],
        encryptionKeys: [],
      });

      const payload = service.validateJwt('invalid-token');
      expect(payload).toBeNull();
    });

    it('should return null for JWT signed with unknown secret', () => {
      const service = new SecretRotationService({
        jwtSecrets: [validSecret],
        encryptionKeys: [],
      });

      const token = jwt.sign({ sub: 'user-1' }, 'unknown-secret-32-chars-minimum');
      const payload = service.validateJwt(token);

      expect(payload).toBeNull();
    });

    it('should sign JWT with current secret', () => {
      const service = new SecretRotationService({
        jwtSecrets: [validSecret, previousSecret],
        encryptionKeys: [],
      });

      const token = service.signJwt({
        sub: 'user-1',
        email: 'test@test.com',
        role: 'USER',
        iss: 'test',
      });

      // Should be verifiable with current secret
      const decoded = jwt.verify(token, validSecret);
      expect(decoded).toBeDefined();

      // Should NOT be verifiable with previous secret only
      expect(() => jwt.verify(token, previousSecret)).toThrow();
    });

    it('should provide detailed error for expired token', () => {
      const service = new SecretRotationService({
        jwtSecrets: [validSecret],
        encryptionKeys: [],
      });

      const token = jwt.sign({ sub: 'user-1' }, validSecret, { expiresIn: '-1s' });
      const result = service.validateJwtWithError(token);

      expect(result.payload).toBeNull();
      expect(result.error).toBe('TOKEN_EXPIRED');
    });

    it('should throw error for short JWT secret', () => {
      expect(() => {
        new SecretRotationService({
          jwtSecrets: ['short'],
          encryptionKeys: [],
        });
      }).toThrow(/must be at least 32 characters/);
    });

    it('should use development fallback when no secrets configured', () => {
      process.env.NODE_ENV = 'development';
      const service = new SecretRotationService({
        jwtSecrets: [],
        encryptionKeys: [],
      });

      // Should not throw and should have a secret
      const token = service.signJwt({
        sub: 'user-1',
        email: 'test@test.com',
        role: 'USER',
        iss: 'test',
      });
      expect(token).toBeDefined();
    });
  });

  describe('Encryption Key Management', () => {
    // Generate valid 32-byte keys
    const currentKey = Buffer.alloc(32, 'a').toString('base64');
    const previousKey = Buffer.alloc(32, 'b').toString('base64');

    it('should encrypt and decrypt with current key', () => {
      const service = new SecretRotationService({
        jwtSecrets: [],
        encryptionKeys: [currentKey],
      });

      const plaintext = 'sensitive-data-to-encrypt';
      const encrypted = service.encrypt(plaintext);
      const decrypted = service.decrypt(encrypted);

      expect(decrypted).toBe(plaintext);
    });

    it('should decrypt data encrypted with previous key', () => {
      // First, encrypt with "previous" key as current
      const serviceOld = new SecretRotationService({
        jwtSecrets: [],
        encryptionKeys: [previousKey],
      });
      const encrypted = serviceOld.encrypt('secret-data');

      // Now create service with new key as current, old key as previous
      const serviceNew = new SecretRotationService({
        jwtSecrets: [],
        encryptionKeys: [currentKey, previousKey],
      });

      // Should still decrypt
      const decrypted = serviceNew.decrypt(encrypted);
      expect(decrypted).toBe('secret-data');
    });

    it('should re-encrypt data with current key', () => {
      // Encrypt with old key
      const serviceOld = new SecretRotationService({
        jwtSecrets: [],
        encryptionKeys: [previousKey],
      });
      const encryptedOld = serviceOld.encrypt('secret-data');

      // Re-encrypt with new service
      const serviceNew = new SecretRotationService({
        jwtSecrets: [],
        encryptionKeys: [currentKey, previousKey],
      });
      const reEncrypted = serviceNew.reEncrypt(encryptedOld);

      // Should be encrypted with current key (index 0)
      expect(reEncrypted.startsWith('0:')).toBe(true);

      // Should still decrypt to same value
      const decrypted = serviceNew.decrypt(reEncrypted);
      expect(decrypted).toBe('secret-data');
    });

    it('should identify if data is encrypted with current key', () => {
      const service = new SecretRotationService({
        jwtSecrets: [],
        encryptionKeys: [currentKey],
      });

      const encrypted = service.encrypt('test');
      expect(service.isEncryptedWithCurrentKey(encrypted)).toBe(true);
    });

    it('should throw error for invalid encryption key length', () => {
      const shortKey = Buffer.alloc(16, 'a').toString('base64');

      expect(() => {
        new SecretRotationService({
          jwtSecrets: [],
          encryptionKeys: [shortKey],
        });
      }).toThrow(/must be 32 bytes/);
    });

    it('should throw error for invalid encrypted format', () => {
      const service = new SecretRotationService({
        jwtSecrets: [],
        encryptionKeys: [currentKey],
      });

      expect(() => service.decrypt('invalid-format')).toThrow('Invalid encrypted format');
    });

    it('should handle legacy format (3 parts without key index)', () => {
      const service = new SecretRotationService({
        jwtSecrets: [],
        encryptionKeys: [currentKey],
      });

      // Create legacy format manually (iv:authTag:ciphertext)
      const encrypted = service.encrypt('test-data');
      // Remove key index to simulate legacy format
      const parts = encrypted.split(':');
      const legacyFormat = parts.slice(1).join(':');

      const decrypted = service.decrypt(legacyFormat);
      expect(decrypted).toBe('test-data');
    });
  });

  describe('Batch Re-encryption', () => {
    const currentKey = Buffer.alloc(32, 'a').toString('base64');
    const previousKey = Buffer.alloc(32, 'b').toString('base64');

    it('should re-encrypt batch of items', async () => {
      // Encrypt items with old key
      const serviceOld = new SecretRotationService({
        jwtSecrets: [],
        encryptionKeys: [previousKey],
      });

      const items = [
        { id: '1', encrypted: serviceOld.encrypt('data-1') },
        { id: '2', encrypted: serviceOld.encrypt('data-2') },
        { id: '3', encrypted: serviceOld.encrypt('data-3') },
      ];

      // Re-encrypt with new service
      const serviceNew = new SecretRotationService({
        jwtSecrets: [],
        encryptionKeys: [currentKey, previousKey],
      });

      const results = await serviceNew.reEncryptBatch(items);

      expect(results).toHaveLength(3);
      expect(results.every((r) => r.success)).toBe(true);
      expect(results.every((r) => r.encrypted.startsWith('0:'))).toBe(true);
    });

    it('should skip items already encrypted with current key', async () => {
      const service = new SecretRotationService({
        jwtSecrets: [],
        encryptionKeys: [currentKey],
      });

      const encrypted = service.encrypt('data');
      const items = [{ id: '1', encrypted }];

      const results = await service.reEncryptBatch(items);

      expect(results[0].success).toBe(true);
      expect(results[0].encrypted).toBe(encrypted); // Same value, not re-encrypted
    });

    it('should handle failures gracefully', async () => {
      const service = new SecretRotationService({
        jwtSecrets: [],
        encryptionKeys: [currentKey],
      });

      const items = [
        { id: '1', encrypted: service.encrypt('valid') },
        { id: '2', encrypted: 'invalid-format' },
      ];

      const results = await service.reEncryptBatch(items);

      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(false);
      expect(results[1].error).toBeDefined();
    });
  });

  describe('Rotation Event Logging', () => {
    it('should record rotation events', () => {
      const service = new SecretRotationService({
        jwtSecrets: ['test-jwt-secret-32-chars-minimum'],
        encryptionKeys: [],
      });

      service.recordRotationEvent('JWT_SECRET', true, undefined, { action: 'rotated' });

      const events = service.getRotationEvents();
      expect(events.length).toBeGreaterThan(0);
      expect(events[events.length - 1].type).toBe('JWT_SECRET');
      expect(events[events.length - 1].success).toBe(true);
    });

    it('should record failed rotation events', () => {
      const service = new SecretRotationService({
        jwtSecrets: ['test-jwt-secret-32-chars-minimum'],
        encryptionKeys: [],
      });

      service.recordRotationEvent('ENCRYPTION_KEY', false, 'Key validation failed');

      const events = service.getRotationEvents();
      const lastEvent = events[events.length - 1];
      expect(lastEvent.success).toBe(false);
      expect(lastEvent.error).toBe('Key validation failed');
    });

    it('should limit stored events to 100', () => {
      const service = new SecretRotationService({
        jwtSecrets: ['test-jwt-secret-32-chars-minimum'],
        encryptionKeys: [],
      });

      // Record 150 events
      for (let i = 0; i < 150; i++) {
        service.recordRotationEvent('JWT_SECRET', true, undefined, { index: i });
      }

      const events = service.getRotationEvents(200);
      expect(events.length).toBeLessThanOrEqual(100);
    });
  });

  describe('Status', () => {
    it('should return correct status', () => {
      const currentKey = Buffer.alloc(32, 'a').toString('base64');
      const service = new SecretRotationService({
        jwtSecrets: ['test-jwt-secret-32-chars-minimum', 'previous-secret-32-chars-minimum'],
        encryptionKeys: [currentKey],
        gracePeriod: 3600000,
      });

      const status = service.getStatus();

      expect(status.jwtSecretsCount).toBe(2);
      expect(status.encryptionKeysCount).toBe(1);
      expect(status.gracePeriodMs).toBe(3600000);
      expect(status.lastRotationEvent).toBeDefined();
    });
  });

  describe('Singleton', () => {
    it('should return same instance', () => {
      process.env.JWT_SECRET = 'test-jwt-secret-32-chars-minimum';

      const instance1 = getSecretRotationService();
      const instance2 = getSecretRotationService();

      expect(instance1).toBe(instance2);
    });

    it('should reset singleton', () => {
      process.env.JWT_SECRET = 'test-jwt-secret-32-chars-minimum';

      const instance1 = getSecretRotationService();
      resetSecretRotationService();
      const instance2 = getSecretRotationService();

      expect(instance1).not.toBe(instance2);
    });
  });
});
