/**
 * Shutdown Manager Tests
 *
 * **Feature: high-traffic-resilience**
 * **Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6**
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { EventEmitter } from 'events';
import {
  ShutdownManager,
  getShutdownManager,
  resetShutdownManager,
  type ShutdownConfig,
} from './shutdown';

// Mock server for testing
class MockServer extends EventEmitter {
  private _closed = false;
  private _closeCallback: ((err?: Error) => void) | null = null;

  close(callback?: (err?: Error) => void): this {
    this._closeCallback = callback || null;
    return this;
  }

  // Simulate successful close
  simulateClose(): void {
    this._closed = true;
    if (this._closeCallback) {
      this._closeCallback();
    }
  }

  // Simulate close error
  simulateCloseError(error: Error): void {
    if (this._closeCallback) {
      this._closeCallback(error);
    }
  }

  // Simulate a connection and request
  simulateRequest(): { closeResponse: () => void } {
    // Emit connection event
    this.emit('connection', {});
    
    // Create mock response
    const mockResponse = new EventEmitter();
    
    // Emit request event
    this.emit('request', {}, mockResponse);
    
    return {
      closeResponse: () => mockResponse.emit('close'),
    };
  }
}

describe('ShutdownManager', () => {
  let manager: ShutdownManager;
  let mockServer: MockServer;
  let exitSpy: ReturnType<typeof vi.spyOn>;
  let consoleInfoSpy: ReturnType<typeof vi.spyOn>;
  let consoleWarnSpy: ReturnType<typeof vi.spyOn>;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    // Reset singleton
    resetShutdownManager();

    // Create manager with short timeouts for testing
    const config: Partial<ShutdownConfig> = {
      timeout: 1000,
      drainDelay: 100,
      forceExitDelay: 2000,
    };
    manager = new ShutdownManager(config);
    mockServer = new MockServer();

    // Mock process.exit
    exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);

    // Mock console methods
    consoleInfoSpy = vi.spyOn(console, 'info').mockImplementation(() => undefined);
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  describe('constructor', () => {
    it('should create manager with default config', () => {
      const defaultManager = new ShutdownManager();
      expect(defaultManager.isInShutdown()).toBe(false);
      expect(defaultManager.getActiveConnections()).toBe(0);
    });

    it('should create manager with custom config', () => {
      const customManager = new ShutdownManager({
        timeout: 5000,
        drainDelay: 1000,
      });
      expect(customManager.isInShutdown()).toBe(false);
    });
  });

  describe('setServer', () => {
    it('should track active connections via request/response', () => {
      manager.setServer(mockServer as unknown as import('http').Server);

      expect(manager.getActiveConnections()).toBe(0);

      // Simulate request (connection + request events)
      const req1 = mockServer.simulateRequest();
      expect(manager.getActiveConnections()).toBe(1);

      const req2 = mockServer.simulateRequest();
      expect(manager.getActiveConnections()).toBe(2);

      // Close responses
      req1.closeResponse();
      expect(manager.getActiveConnections()).toBe(1);

      req2.closeResponse();
      expect(manager.getActiveConnections()).toBe(0);
    });
  });

  describe('onShutdown', () => {
    it('should register cleanup handlers', () => {
      const handler1 = vi.fn().mockResolvedValue(undefined);
      const handler2 = vi.fn().mockResolvedValue(undefined);

      manager.onShutdown('handler1', handler1);
      manager.onShutdown('handler2', handler2);

      // Handlers are stored internally
      expect(manager.removeHandler('handler1')).toBe(true);
      expect(manager.removeHandler('handler2')).toBe(true);
      expect(manager.removeHandler('nonexistent')).toBe(false);
    });
  });

  describe('setShutdownStateCallback', () => {
    it('should call callback when shutdown starts', async () => {
      vi.useFakeTimers();
      const callback = vi.fn();
      manager.setShutdownStateCallback(callback);
      manager.setServer(mockServer as unknown as import('http').Server);

      // Start shutdown (don't await, we'll advance timers)
      const shutdownPromise = manager.initiateShutdown('SIGTERM');

      // Callback should be called immediately
      expect(callback).toHaveBeenCalledWith(true);

      // Simulate server close
      mockServer.simulateClose();

      // Advance timers to complete shutdown
      await vi.advanceTimersByTimeAsync(2000);

      // Wait for shutdown to complete
      await shutdownPromise;
    });
  });

  describe('initiateShutdown', () => {
    it('should prevent multiple shutdown attempts', async () => {
      vi.useFakeTimers();
      manager.setServer(mockServer as unknown as import('http').Server);

      // Start first shutdown
      const promise1 = manager.initiateShutdown('SIGTERM');
      mockServer.simulateClose();

      // Try second shutdown
      const promise2 = manager.initiateShutdown('SIGINT');

      // Advance timers
      await vi.advanceTimersByTimeAsync(2000);

      await Promise.all([promise1, promise2]);

      // Should log warning about duplicate shutdown
      expect(consoleInfoSpy).toHaveBeenCalledWith(
        expect.stringContaining('Shutdown already in progress')
      );
    });

    it('should execute cleanup handlers in order', async () => {
      vi.useFakeTimers();
      const executionOrder: string[] = [];

      manager.onShutdown('database', async () => {
        executionOrder.push('database');
      });
      manager.onShutdown('redis', async () => {
        executionOrder.push('redis');
      });
      manager.onShutdown('sentry', async () => {
        executionOrder.push('sentry');
      });

      manager.setServer(mockServer as unknown as import('http').Server);

      const shutdownPromise = manager.initiateShutdown('SIGTERM');
      mockServer.simulateClose();

      await vi.advanceTimersByTimeAsync(2000);
      await shutdownPromise;

      expect(executionOrder).toEqual(['database', 'redis', 'sentry']);
    });

    it('should continue executing handlers even if one fails', async () => {
      vi.useFakeTimers();
      const executionOrder: string[] = [];

      manager.onShutdown('handler1', async () => {
        executionOrder.push('handler1');
      });
      manager.onShutdown('handler2', async () => {
        executionOrder.push('handler2-start');
        throw new Error('Handler 2 failed');
      });
      manager.onShutdown('handler3', async () => {
        executionOrder.push('handler3');
      });

      manager.setServer(mockServer as unknown as import('http').Server);

      const shutdownPromise = manager.initiateShutdown('SIGTERM');
      mockServer.simulateClose();

      await vi.advanceTimersByTimeAsync(2000);
      await shutdownPromise;

      // All handlers should be attempted
      expect(executionOrder).toContain('handler1');
      expect(executionOrder).toContain('handler2-start');
      expect(executionOrder).toContain('handler3');

      // Error should be logged
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('handler2 failed'),
        expect.any(Error)
      );
    });

    it('should log shutdown metrics', async () => {
      vi.useFakeTimers();
      manager.setServer(mockServer as unknown as import('http').Server);

      const shutdownPromise = manager.initiateShutdown('SIGTERM');
      mockServer.simulateClose();

      await vi.advanceTimersByTimeAsync(2000);
      await shutdownPromise;

      // Should log metrics
      expect(consoleInfoSpy).toHaveBeenCalledWith(expect.stringContaining('Shutdown Metrics'));
      expect(consoleInfoSpy).toHaveBeenCalledWith(expect.stringContaining('Signal: SIGTERM'));
      expect(consoleInfoSpy).toHaveBeenCalledWith(expect.stringContaining('Duration:'));
    });

    it('should exit with code 0 on successful shutdown', async () => {
      vi.useFakeTimers();
      manager.setServer(mockServer as unknown as import('http').Server);

      const shutdownPromise = manager.initiateShutdown('SIGTERM');
      mockServer.simulateClose();

      await vi.advanceTimersByTimeAsync(2000);
      await shutdownPromise;

      expect(exitSpy).toHaveBeenCalledWith(0);
    });

    it('should handle shutdown without server', async () => {
      vi.useFakeTimers();
      // Don't set server

      const shutdownPromise = manager.initiateShutdown('SIGTERM');

      await vi.advanceTimersByTimeAsync(2000);
      await shutdownPromise;

      expect(consoleInfoSpy).toHaveBeenCalledWith(expect.stringContaining('No server to close'));
      expect(exitSpy).toHaveBeenCalledWith(0);
    });
  });

  describe('isInShutdown', () => {
    it('should return false initially', () => {
      expect(manager.isInShutdown()).toBe(false);
    });

    it('should return true after shutdown initiated', async () => {
      vi.useFakeTimers();
      manager.setServer(mockServer as unknown as import('http').Server);

      // Start shutdown
      const shutdownPromise = manager.initiateShutdown('SIGTERM');

      expect(manager.isInShutdown()).toBe(true);

      mockServer.simulateClose();
      await vi.advanceTimersByTimeAsync(2000);
      await shutdownPromise;
    });
  });

  describe('getMetrics', () => {
    it('should return null before shutdown', () => {
      expect(manager.getMetrics()).toBeNull();
    });

    it('should return metrics after shutdown', async () => {
      vi.useFakeTimers();
      manager.setServer(mockServer as unknown as import('http').Server);

      // Add a handler
      manager.onShutdown('test', async () => {
        // No-op handler for testing
        return Promise.resolve();
      });

      const shutdownPromise = manager.initiateShutdown('SIGTERM');
      mockServer.simulateClose();

      await vi.advanceTimersByTimeAsync(2000);
      await shutdownPromise;

      const metrics = manager.getMetrics();
      expect(metrics).not.toBeNull();
      expect(metrics?.signal).toBe('SIGTERM');
      expect(metrics?.handlersExecuted).toBe(1);
      expect(metrics?.handlersFailed).toBe(0);
      expect(metrics?.duration).toBeGreaterThanOrEqual(0);
    });
  });

  describe('getShutdownManager singleton', () => {
    it('should return same instance', () => {
      const instance1 = getShutdownManager();
      const instance2 = getShutdownManager();
      expect(instance1).toBe(instance2);
    });

    it('should reset singleton', () => {
      const instance1 = getShutdownManager();
      resetShutdownManager();
      const instance2 = getShutdownManager();
      expect(instance1).not.toBe(instance2);
    });
  });

  describe('connection draining', () => {
    it('should wait for active connections to complete', async () => {
      vi.useFakeTimers();
      manager.setServer(mockServer as unknown as import('http').Server);

      // Simulate active request
      const req = mockServer.simulateRequest();
      expect(manager.getActiveConnections()).toBe(1);

      // Start shutdown
      const shutdownPromise = manager.initiateShutdown('SIGTERM');
      mockServer.simulateClose();

      // Advance past drain delay
      await vi.advanceTimersByTimeAsync(200);

      // Connection still active
      expect(manager.getActiveConnections()).toBe(1);

      // Close response
      req.closeResponse();
      expect(manager.getActiveConnections()).toBe(0);

      // Complete shutdown
      await vi.advanceTimersByTimeAsync(2000);
      await shutdownPromise;

      expect(exitSpy).toHaveBeenCalledWith(0);
    });

    it('should force close after timeout with remaining connections', async () => {
      vi.useFakeTimers();
      manager.setServer(mockServer as unknown as import('http').Server);

      // Simulate active request that never closes
      mockServer.simulateRequest();
      expect(manager.getActiveConnections()).toBe(1);

      // Start shutdown
      const shutdownPromise = manager.initiateShutdown('SIGTERM');
      mockServer.simulateClose();

      // Advance past timeout (connection never closes)
      await vi.advanceTimersByTimeAsync(3000);
      await shutdownPromise;

      // Should warn about remaining connections
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Timeout reached with 1 connections remaining')
      );

      // Metrics should show forced closures
      const metrics = manager.getMetrics();
      expect(metrics?.forcedClosures).toBe(1);
    });
  });
});
