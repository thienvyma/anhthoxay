/**
 * Graceful Shutdown Manager
 *
 * Handles graceful shutdown with connection draining for horizontal scaling.
 * Ensures in-flight requests complete before terminating.
 *
 * **Feature: high-traffic-resilience**
 * **Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6**
 */

import type { Server as HttpServer } from 'http';
import type { Server as HttpsServer } from 'https';
import type { Http2Server, Http2SecureServer } from 'http2';

/**
 * Server type that can be managed by ShutdownManager
 * Supports HTTP, HTTPS, and HTTP/2 servers
 */
export type ManagedServer = HttpServer | HttpsServer | Http2Server | Http2SecureServer | {
  close: (callback?: (err?: Error) => void) => void;
  on: (event: string, listener: (...args: unknown[]) => void) => void;
};

/**
 * Shutdown configuration
 */
export interface ShutdownConfig {
  /** Total timeout before force exit (default: 30000ms) */
  timeout: number;
  /** Delay before starting drain to allow LB to stop routing (default: 5000ms) */
  drainDelay: number;
  /** Force exit delay after timeout (default: 35000ms) */
  forceExitDelay: number;
}

/**
 * Cleanup handler function type
 */
export type CleanupHandler = () => Promise<void>;

/**
 * Shutdown metrics for logging
 */
export interface ShutdownMetrics {
  signal: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  handlersExecuted: number;
  handlersFailed: number;
  forcedClosures: number;
  inFlightRequests: number;
}

/**
 * Default shutdown configuration
 */
const DEFAULT_CONFIG: ShutdownConfig = {
  timeout: 30000, // 30 seconds
  drainDelay: 5000, // 5 seconds for LB to stop routing
  forceExitDelay: 35000, // 35 seconds total before force exit
};

/**
 * Graceful Shutdown Manager
 *
 * Manages the shutdown sequence:
 * 1. Stop accepting new connections
 * 2. Wait for LB to stop routing (drainDelay)
 * 3. Wait for in-flight requests to complete
 * 4. Execute cleanup handlers (database, Redis, etc.)
 * 5. Force exit if timeout reached
 */
export class ShutdownManager {
  private handlers: Map<string, CleanupHandler> = new Map();
  private isShuttingDown = false;
  private config: ShutdownConfig;
  private server: ManagedServer | null = null;
  private metrics: ShutdownMetrics | null = null;
  private activeConnections = 0;
  private onShutdownStateChange?: (isShuttingDown: boolean) => void;

  constructor(config: Partial<ShutdownConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Set the HTTP server to manage
   */
  setServer(server: ManagedServer): void {
    this.server = server;

    // Track active connections
    server.on('connection', () => {
      this.activeConnections++;
    });
    
    // Track connection close - use request event for more reliable tracking
    server.on('request', (_req: unknown, res: unknown) => {
      const response = res as { on: (event: string, listener: () => void) => void };
      response.on('close', () => {
        this.activeConnections = Math.max(0, this.activeConnections - 1);
      });
    });
  }

  /**
   * Set callback for shutdown state changes
   * Used to update health check responses
   */
  setShutdownStateCallback(callback: (isShuttingDown: boolean) => void): void {
    this.onShutdownStateChange = callback;
  }

  /**
   * Register a cleanup handler to be called during shutdown
   * @param name - Unique name for the handler (for logging)
   * @param handler - Async function to execute during shutdown
   */
  onShutdown(name: string, handler: CleanupHandler): void {
    this.handlers.set(name, handler);
  }

  /**
   * Remove a registered cleanup handler
   */
  removeHandler(name: string): boolean {
    return this.handlers.delete(name);
  }

  /**
   * Check if shutdown is in progress
   */
  isInShutdown(): boolean {
    return this.isShuttingDown;
  }

  /**
   * Get current active connection count
   */
  getActiveConnections(): number {
    return this.activeConnections;
  }

  /**
   * Get shutdown metrics (available after shutdown completes)
   */
  getMetrics(): ShutdownMetrics | null {
    return this.metrics;
  }

  /**
   * Initiate graceful shutdown sequence
   * @param signal - The signal that triggered shutdown (SIGTERM, SIGINT, etc.)
   */
  async initiateShutdown(signal: string): Promise<void> {
    // Prevent multiple shutdown attempts
    if (this.isShuttingDown) {
      // eslint-disable-next-line no-console -- Shutdown logging
      console.info(`⚠️ Shutdown already in progress, ignoring ${signal}`);
      return;
    }

    this.isShuttingDown = true;
    this.metrics = {
      signal,
      startTime: Date.now(),
      handlersExecuted: 0,
      handlersFailed: 0,
      forcedClosures: 0,
      inFlightRequests: this.activeConnections,
    };

    // Notify health service to return 503
    if (this.onShutdownStateChange) {
      this.onShutdownStateChange(true);
    }

    // eslint-disable-next-line no-console -- Shutdown logging
    console.info(`\n🛑 Received ${signal}. Starting graceful shutdown...`);
    // eslint-disable-next-line no-console -- Shutdown logging
    console.info(`📊 Active connections: ${this.activeConnections}`);
    // eslint-disable-next-line no-console -- Shutdown logging
    console.info(`⏱️ Timeout: ${this.config.timeout}ms, Drain delay: ${this.config.drainDelay}ms`);

    // Set up force exit timeout
    const forceExitTimer = setTimeout(() => {
      this.forceExit();
    }, this.config.forceExitDelay);

    try {
      // Step 1: Stop accepting new connections
      await this.stopServer();

      // Step 2: Wait for LB to stop routing (drain delay)
      // eslint-disable-next-line no-console -- Shutdown logging
      console.info(`⏳ Waiting ${this.config.drainDelay}ms for load balancer to stop routing...`);
      await this.delay(this.config.drainDelay);

      // Step 3: Wait for in-flight requests with timeout
      await this.waitForConnections();

      // Step 4: Execute cleanup handlers
      await this.executeHandlers();

      // Clear force exit timer
      clearTimeout(forceExitTimer);

      // Log final metrics
      this.logShutdownMetrics();

      // eslint-disable-next-line no-console -- Shutdown logging
      console.info('✅ Graceful shutdown completed successfully');
      process.exit(0);
    } catch (error) {
      // Clear force exit timer
      clearTimeout(forceExitTimer);

      console.error('❌ Error during shutdown:', error);
      this.logShutdownMetrics();
      process.exit(1);
    }
  }

  /**
   * Stop the HTTP server from accepting new connections
   */
  private async stopServer(): Promise<void> {
    if (!this.server) {
      // eslint-disable-next-line no-console -- Shutdown logging
      console.info('📡 No server to close');
      return;
    }

    return new Promise((resolve, reject) => {
      // eslint-disable-next-line no-console -- Shutdown logging
      console.info('📡 Stopping HTTP server (no new connections)...');

      const server = this.server;
      if (!server) {
        resolve();
        return;
      }

      server.close((err) => {
        if (err) {
          // Server might already be closed
          if ((err as NodeJS.ErrnoException).code === 'ERR_SERVER_NOT_RUNNING') {
            // eslint-disable-next-line no-console -- Shutdown logging
            console.info('✅ HTTP server was already closed');
            resolve();
          } else {
            reject(err);
          }
        } else {
          // eslint-disable-next-line no-console -- Shutdown logging
          console.info('✅ HTTP server stopped accepting new connections');
          resolve();
        }
      });
    });
  }

  /**
   * Wait for active connections to complete
   */
  private async waitForConnections(): Promise<void> {
    const startWait = Date.now();
    const maxWait = this.config.timeout - this.config.drainDelay;

    // eslint-disable-next-line no-console -- Shutdown logging
    console.info(`⏳ Waiting for ${this.activeConnections} active connections to complete...`);

    while (this.activeConnections > 0) {
      const elapsed = Date.now() - startWait;

      if (elapsed >= maxWait) {
         
        console.warn(`⚠️ Timeout reached with ${this.activeConnections} connections remaining`);
        if (this.metrics) {
          this.metrics.forcedClosures = this.activeConnections;
        }
        break;
      }

      // Check every 100ms
      await this.delay(100);

      // Log progress every 5 seconds
      if (elapsed > 0 && elapsed % 5000 < 100) {
        // eslint-disable-next-line no-console -- Shutdown logging
        console.info(`⏳ Still waiting... ${this.activeConnections} connections, ${Math.round((maxWait - elapsed) / 1000)}s remaining`);
      }
    }

    if (this.activeConnections === 0) {
      // eslint-disable-next-line no-console -- Shutdown logging
      console.info('✅ All connections completed');
    }
  }

  /**
   * Execute all registered cleanup handlers
   */
  private async executeHandlers(): Promise<void> {
    // eslint-disable-next-line no-console -- Shutdown logging
    console.info(`🧹 Executing ${this.handlers.size} cleanup handlers...`);

    for (const [name, handler] of this.handlers) {
      try {
        // eslint-disable-next-line no-console -- Shutdown logging
        console.info(`  → Executing: ${name}...`);
        await handler();
        // eslint-disable-next-line no-console -- Shutdown logging
        console.info(`  ✅ ${name} completed`);
        if (this.metrics) {
          this.metrics.handlersExecuted++;
        }
      } catch (error) {
        console.error(`  ❌ ${name} failed:`, error);
        if (this.metrics) {
          this.metrics.handlersFailed++;
        }
      }
    }
  }

  /**
   * Force exit when timeout is exceeded
   */
  private forceExit(): void {
    console.error('❌ Force exit triggered - shutdown timeout exceeded');
    this.logShutdownMetrics();
    process.exit(1);
  }

  /**
   * Log shutdown metrics
   */
  private logShutdownMetrics(): void {
    if (!this.metrics) return;

    this.metrics.endTime = Date.now();
    this.metrics.duration = this.metrics.endTime - this.metrics.startTime;

    // eslint-disable-next-line no-console -- Shutdown logging
    console.info('\n📊 Shutdown Metrics:');
    // eslint-disable-next-line no-console -- Shutdown logging
    console.info(`  Signal: ${this.metrics.signal}`);
    // eslint-disable-next-line no-console -- Shutdown logging
    console.info(`  Duration: ${this.metrics.duration}ms`);
    // eslint-disable-next-line no-console -- Shutdown logging
    console.info(`  Initial in-flight requests: ${this.metrics.inFlightRequests}`);
    // eslint-disable-next-line no-console -- Shutdown logging
    console.info(`  Handlers executed: ${this.metrics.handlersExecuted}/${this.handlers.size}`);
    // eslint-disable-next-line no-console -- Shutdown logging
    console.info(`  Handlers failed: ${this.metrics.handlersFailed}`);
    // eslint-disable-next-line no-console -- Shutdown logging
    console.info(`  Forced closures: ${this.metrics.forcedClosures}`);
  }

  /**
   * Utility function for delays
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

/**
 * Create a singleton shutdown manager instance
 */
let shutdownManagerInstance: ShutdownManager | null = null;

/**
 * Get or create the shutdown manager singleton
 */
export function getShutdownManager(config?: Partial<ShutdownConfig>): ShutdownManager {
  if (!shutdownManagerInstance) {
    shutdownManagerInstance = new ShutdownManager(config);
  }
  return shutdownManagerInstance;
}

/**
 * Reset the shutdown manager (for testing)
 */
export function resetShutdownManager(): void {
  shutdownManagerInstance = null;
}

/**
 * Register signal handlers for graceful shutdown
 * @param manager - The shutdown manager instance
 */
export function registerSignalHandlers(manager: ShutdownManager): void {
  // Handle SIGTERM (from orchestrator/container)
  process.on('SIGTERM', () => {
    manager.initiateShutdown('SIGTERM');
  });

  // Handle SIGINT (Ctrl+C)
  process.on('SIGINT', () => {
    manager.initiateShutdown('SIGINT');
  });

  // Handle uncaught exceptions
  process.on('uncaughtException', (error) => {
    console.error('❌ Uncaught Exception:', error);
    manager.initiateShutdown('uncaughtException');
  });

  // Handle unhandled promise rejections (log but don't exit)
  process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
    // Don't exit on unhandled rejection, just log it
  });
}
