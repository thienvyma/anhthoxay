/**
 * Furniture Routes - Shared Types
 * Common types and utilities for furniture route modules
 */
import type { PrismaClient } from '@prisma/client';
import type { Context, MiddlewareHandler } from 'hono';
import { FurnitureServiceError } from '../../services/furniture.service';
import { errorResponse } from '../../utils/response';
import type { Role } from '../../services/auth.service';

export type RouteContext = Context;

export interface RouteFactoryOptions {
  prisma: PrismaClient;
}

// Type for authenticate middleware factory
export type AuthenticateMiddleware = () => MiddlewareHandler;

// Type for requireRole middleware factory
export type RequireRoleMiddleware = (...roles: Role[]) => MiddlewareHandler;

export interface AdminRouteFactoryOptions extends RouteFactoryOptions {
  authenticate: AuthenticateMiddleware;
  requireRole: RequireRoleMiddleware;
}

/**
 * Shared error handler for furniture routes
 */
export function handleServiceError(c: RouteContext, error: unknown) {
  if (error instanceof FurnitureServiceError) {
    return errorResponse(c, error.code, error.message, error.statusCode);
  }
  console.error('Furniture route error:', error);
  return errorResponse(c, 'INTERNAL_ERROR', 'An unexpected error occurred', 500);
}
