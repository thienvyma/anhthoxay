/**
 * Content Hash Utility Tests
 *
 * **Feature: high-traffic-resilience**
 * **Requirements: 2.3**
 */

import { describe, it, expect } from 'vitest';
import {
  generateContentHashFilename,
  generateHash,
  getExtension,
  hasContentHash,
  extractHash,
  verifyContentHash,
  sanitizeFilename,
} from './content-hash';

describe('Content Hash Utility', () => {
  // Sample test data
  const testBuffer = Buffer.from('Hello, World!');
  const testBuffer2 = Buffer.from('Different content');

  describe('generateHash', () => {
    it('should generate consistent hash for same content', () => {
      const hash1 = generateHash(testBuffer);
      const hash2 = generateHash(testBuffer);
      expect(hash1).toBe(hash2);
    });

    it('should generate different hash for different content', () => {
      const hash1 = generateHash(testBuffer);
      const hash2 = generateHash(testBuffer2);
      expect(hash1).not.toBe(hash2);
    });

    it('should generate sha256 hash by default', () => {
      const hash = generateHash(testBuffer);
      expect(hash).toHaveLength(64); // SHA256 produces 64 hex chars
    });

    it('should support different algorithms', () => {
      const sha256 = generateHash(testBuffer, 'sha256');
      const sha1 = generateHash(testBuffer, 'sha1');
      const md5 = generateHash(testBuffer, 'md5');

      expect(sha256).toHaveLength(64);
      expect(sha1).toHaveLength(40);
      expect(md5).toHaveLength(32);
    });
  });

  describe('getExtension', () => {
    it('should extract extension from filename', () => {
      expect(getExtension('photo.jpg')).toBe('jpg');
      expect(getExtension('document.pdf')).toBe('pdf');
      expect(getExtension('image.PNG')).toBe('png');
    });

    it('should handle multiple dots in filename', () => {
      expect(getExtension('my.photo.jpg')).toBe('jpg');
      expect(getExtension('file.name.with.dots.txt')).toBe('txt');
    });

    it('should get extension from MIME type when no filename', () => {
      expect(getExtension(undefined, 'image/webp')).toBe('webp');
      expect(getExtension(undefined, 'image/jpeg')).toBe('jpg');
      expect(getExtension(undefined, 'application/pdf')).toBe('pdf');
    });

    it('should prefer filename extension over MIME type', () => {
      expect(getExtension('photo.png', 'image/jpeg')).toBe('png');
    });

    it('should return bin for unknown types', () => {
      expect(getExtension()).toBe('bin');
      expect(getExtension(undefined, 'unknown/type')).toBe('bin');
    });
  });

  describe('generateContentHashFilename', () => {
    it('should generate hash-based filename', () => {
      const result = generateContentHashFilename(testBuffer, {
        mimeType: 'image/webp',
      });

      expect(result.filename).toMatch(/^[a-f0-9]{8}\.webp$/);
      expect(result.hash).toHaveLength(8);
      expect(result.extension).toBe('webp');
    });

    it('should generate consistent filename for same content', () => {
      const result1 = generateContentHashFilename(testBuffer, { mimeType: 'image/webp' });
      const result2 = generateContentHashFilename(testBuffer, { mimeType: 'image/webp' });

      expect(result1.filename).toBe(result2.filename);
      expect(result1.hash).toBe(result2.hash);
    });

    it('should generate different filename for different content', () => {
      const result1 = generateContentHashFilename(testBuffer, { mimeType: 'image/webp' });
      const result2 = generateContentHashFilename(testBuffer2, { mimeType: 'image/webp' });

      expect(result1.filename).not.toBe(result2.filename);
      expect(result1.hash).not.toBe(result2.hash);
    });

    it('should include original name when requested', () => {
      const result = generateContentHashFilename(testBuffer, {
        originalFilename: 'my-photo.jpg',
        mimeType: 'image/webp',
        includeOriginalName: true,
      });

      // Extension comes from original filename (jpg), not mimeType
      expect(result.filename).toMatch(/^my-photo-[a-f0-9]{8}\.jpg$/);
      expect(result.originalName).toBe('my-photo.jpg');
    });

    it('should use mimeType extension when no original filename extension', () => {
      const result = generateContentHashFilename(testBuffer, {
        originalFilename: 'my-photo',
        mimeType: 'image/webp',
        includeOriginalName: true,
      });

      // Extension comes from mimeType when original has no extension
      expect(result.filename).toMatch(/^my-photo-[a-f0-9]{8}\.webp$/);
    });

    it('should use custom hash length', () => {
      const result = generateContentHashFilename(testBuffer, {
        mimeType: 'image/webp',
        hashLength: 12,
      });

      expect(result.hash).toHaveLength(12);
      expect(result.filename).toMatch(/^[a-f0-9]{12}\.webp$/);
    });

    it('should use extension from original filename', () => {
      const result = generateContentHashFilename(testBuffer, {
        originalFilename: 'document.pdf',
      });

      expect(result.extension).toBe('pdf');
      expect(result.filename).toMatch(/\.pdf$/);
    });
  });

  describe('hasContentHash', () => {
    it('should detect hash-based filenames', () => {
      expect(hasContentHash('a1b2c3d4.webp')).toBe(true);
      expect(hasContentHash('12345678.jpg')).toBe(true);
      expect(hasContentHash('abcdef12.png')).toBe(true);
    });

    it('should detect hash with name prefix', () => {
      expect(hasContentHash('my-photo-a1b2c3d4.webp')).toBe(true);
      expect(hasContentHash('document-12345678.pdf')).toBe(true);
    });

    it('should reject non-hash filenames', () => {
      expect(hasContentHash('photo.jpg')).toBe(false);
      expect(hasContentHash('abc.webp')).toBe(false); // Too short
      expect(hasContentHash('GHIJKLMN.webp')).toBe(false); // Not hex
    });

    it('should support custom hash length', () => {
      expect(hasContentHash('a1b2c3d4e5f6.webp', 12)).toBe(true);
      expect(hasContentHash('a1b2c3d4.webp', 12)).toBe(false);
    });
  });

  describe('extractHash', () => {
    it('should extract hash from filename', () => {
      expect(extractHash('a1b2c3d4.webp')).toBe('a1b2c3d4');
      expect(extractHash('my-photo-12345678.jpg')).toBe('12345678');
    });

    it('should return null for non-hash filenames', () => {
      expect(extractHash('photo.jpg')).toBeNull();
      expect(extractHash('abc.webp')).toBeNull();
    });

    it('should support custom hash length', () => {
      expect(extractHash('a1b2c3d4e5f6.webp', 12)).toBe('a1b2c3d4e5f6');
    });
  });

  describe('verifyContentHash', () => {
    it('should verify matching content and hash', () => {
      const result = generateContentHashFilename(testBuffer, { mimeType: 'image/webp' });
      expect(verifyContentHash(testBuffer, result.filename)).toBe(true);
    });

    it('should reject non-matching content', () => {
      const result = generateContentHashFilename(testBuffer, { mimeType: 'image/webp' });
      expect(verifyContentHash(testBuffer2, result.filename)).toBe(false);
    });

    it('should reject non-hash filenames', () => {
      expect(verifyContentHash(testBuffer, 'photo.jpg')).toBe(false);
    });
  });

  describe('sanitizeFilename', () => {
    it('should remove special characters', () => {
      expect(sanitizeFilename('file:name.txt')).toBe('filename.txt');
      expect(sanitizeFilename('path/to/file.txt')).toBe('pathtofile.txt');
      expect(sanitizeFilename('file<>name.txt')).toBe('filename.txt');
    });

    it('should replace spaces with dashes', () => {
      expect(sanitizeFilename('my file name.txt')).toBe('my-file-name.txt');
      expect(sanitizeFilename('multiple   spaces.txt')).toBe('multiple-spaces.txt');
    });

    it('should convert to lowercase', () => {
      expect(sanitizeFilename('MyFile.TXT')).toBe('myfile.txt');
    });

    it('should limit length', () => {
      const longName = 'a'.repeat(100) + '.txt';
      expect(sanitizeFilename(longName).length).toBeLessThanOrEqual(50);
    });
  });
});
