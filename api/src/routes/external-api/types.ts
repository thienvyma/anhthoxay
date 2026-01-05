/**
 * External API Types
 *
 * Shared types for external API routes
 */

import type { MiddlewareHandler } from 'hono';

/**
 * Type for apiKeyAuth middleware factory function
 */
export type ApiKeyAuthFn = () => MiddlewareHandler;
