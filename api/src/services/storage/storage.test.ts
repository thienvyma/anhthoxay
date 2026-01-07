/**
 * Storage Module Tests
 *
 * **Feature: high-traffic-resilience**
 * **Requirements: 1.5**
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import { LocalStorage } from './local.storage';
import { StorageError } from './storage.interface';

describe('LocalStorage', () => {
  const testDir = path.join(process.cwd(), '.test-storage');
  let storage: LocalStorage;

  beforeEach(() => {
    // Create fresh storage instance for each test
    storage = new LocalStorage(testDir, '/test-media');
  });

  afterEach(() => {
    // Clean up test directory
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  describe('upload', () => {
    it('should upload a file successfully', async () => {
      const data = Buffer.from('test content');
      const result = await storage.upload('test.txt', data, {
        contentType: 'text/plain',
      });

      expect(result.key).toBe('test.txt');
      expect(result.size).toBe(data.length);
      expect(result.contentType).toBe('text/plain');
      expect(result.url).toBe('/test-media/test.txt');
    });

    it('should create nested directories', async () => {
      const data = Buffer.from('nested content');
      const result = await storage.upload('nested/path/file.txt', data, {
        contentType: 'text/plain',
      });

      expect(result.key).toBe('nested/path/file.txt');
      expect(await storage.exists('nested/path/file.txt')).toBe(true);
    });

    it('should store metadata', async () => {
      const data = Buffer.from('with metadata');
      await storage.upload('meta.txt', data, {
        contentType: 'text/plain',
        metadata: { author: 'test', version: '1.0' },
        cacheControl: 'max-age=3600',
      });

      const metadata = await storage.getMetadata('meta.txt');
      expect(metadata).not.toBeNull();
      expect(metadata?.metadata?.author).toBe('test');
      expect(metadata?.metadata?.version).toBe('1.0');
    });
  });

  describe('download', () => {
    it('should download an existing file', async () => {
      const originalData = Buffer.from('download test');
      await storage.upload('download.txt', originalData, {
        contentType: 'text/plain',
      });

      const downloaded = await storage.download('download.txt');
      expect(downloaded).not.toBeNull();
      expect(downloaded?.toString()).toBe('download test');
    });

    it('should return null for non-existent file', async () => {
      const result = await storage.download('non-existent.txt');
      expect(result).toBeNull();
    });
  });

  describe('delete', () => {
    it('should delete an existing file', async () => {
      const data = Buffer.from('to delete');
      await storage.upload('delete-me.txt', data, {
        contentType: 'text/plain',
      });

      expect(await storage.exists('delete-me.txt')).toBe(true);
      
      const deleted = await storage.delete('delete-me.txt');
      expect(deleted).toBe(true);
      expect(await storage.exists('delete-me.txt')).toBe(false);
    });

    it('should return false for non-existent file', async () => {
      const result = await storage.delete('non-existent.txt');
      expect(result).toBe(false);
    });

    it('should also delete metadata file', async () => {
      const data = Buffer.from('with meta');
      await storage.upload('with-meta.txt', data, {
        contentType: 'text/plain',
        metadata: { key: 'value' },
      });

      await storage.delete('with-meta.txt');
      
      // Check metadata file is also deleted
      const metaPath = path.join(testDir, 'with-meta.txt.meta.json');
      expect(fs.existsSync(metaPath)).toBe(false);
    });
  });

  describe('exists', () => {
    it('should return true for existing file', async () => {
      await storage.upload('exists.txt', Buffer.from('test'), {
        contentType: 'text/plain',
      });

      expect(await storage.exists('exists.txt')).toBe(true);
    });

    it('should return false for non-existent file', async () => {
      expect(await storage.exists('not-exists.txt')).toBe(false);
    });
  });

  describe('getMetadata', () => {
    it('should return metadata for existing file', async () => {
      const data = Buffer.from('metadata test');
      await storage.upload('meta-test.txt', data, {
        contentType: 'text/plain',
      });

      const metadata = await storage.getMetadata('meta-test.txt');
      expect(metadata).not.toBeNull();
      expect(metadata?.key).toBe('meta-test.txt');
      expect(metadata?.size).toBe(data.length);
      expect(metadata?.contentType).toBe('text/plain');
    });

    it('should return null for non-existent file', async () => {
      const metadata = await storage.getMetadata('non-existent.txt');
      expect(metadata).toBeNull();
    });
  });

  describe('list', () => {
    it('should list all files', async () => {
      await storage.upload('file1.txt', Buffer.from('1'), { contentType: 'text/plain' });
      await storage.upload('file2.txt', Buffer.from('2'), { contentType: 'text/plain' });
      await storage.upload('dir/file3.txt', Buffer.from('3'), { contentType: 'text/plain' });

      const result = await storage.list();
      expect(result.files.length).toBe(3);
      expect(result.isTruncated).toBe(false);
    });

    it('should respect maxKeys limit', async () => {
      await storage.upload('a.txt', Buffer.from('a'), { contentType: 'text/plain' });
      await storage.upload('b.txt', Buffer.from('b'), { contentType: 'text/plain' });
      await storage.upload('c.txt', Buffer.from('c'), { contentType: 'text/plain' });

      const result = await storage.list({ maxKeys: 2 });
      expect(result.files.length).toBe(2);
      expect(result.isTruncated).toBe(true);
    });
  });

  describe('getUrl', () => {
    it('should return correct URL', () => {
      expect(storage.getUrl('test.txt')).toBe('/test-media/test.txt');
      // Keys starting with / get normalized
      expect(storage.getUrl('/test.txt')).toBe('/test-media/test.txt');
    });
  });

  describe('getType', () => {
    it('should return local', () => {
      expect(storage.getType()).toBe('local');
    });
  });

  describe('isAvailable', () => {
    it('should return true when directory is writable', async () => {
      expect(await storage.isAvailable()).toBe(true);
    });
  });

  describe('security', () => {
    it('should prevent directory traversal', async () => {
      const data = Buffer.from('malicious');
      await storage.upload('../../../etc/passwd', data, {
        contentType: 'text/plain',
      });

      // File should be stored safely within the base directory
      const exists = await storage.exists('../../../etc/passwd');
      expect(exists).toBe(true);
      
      // Verify it's actually in the test directory
      const filePath = path.join(testDir, 'etc', 'passwd');
      expect(fs.existsSync(filePath)).toBe(true);
    });
  });
});

describe('StorageError', () => {
  it('should create error with correct properties', () => {
    const error = new StorageError('UPLOAD_FAILED', 'Upload failed', 500);
    
    expect(error.code).toBe('UPLOAD_FAILED');
    expect(error.message).toBe('Upload failed');
    expect(error.statusCode).toBe(500);
    expect(error.name).toBe('StorageError');
  });

  it('should default to 500 status code', () => {
    const error = new StorageError('TEST_ERROR', 'Test');
    expect(error.statusCode).toBe(500);
  });
});
