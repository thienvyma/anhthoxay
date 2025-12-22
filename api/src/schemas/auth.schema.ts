/**
 * Auth Zod Schemas
 *
 * Validation schemas for authentication operations.
 *
 * **Feature: api-refactoring**
 * **Requirements: 5.4**
 */

import { z } from 'zod';

// ============================================
// AUTH SCHEMAS
// ============================================

/**
 * Schema for user login
 */
export const loginSchema = z.object({
  email: z.string().email('Email không hợp lệ'),
  password: z.string().min(6, 'Mật khẩu tối thiểu 6 ký tự'),
});

/**
 * Account types for registration
 */
export const accountTypeEnum = z.enum(['user', 'homeowner', 'contractor']);
export type AccountType = z.infer<typeof accountTypeEnum>;

/**
 * Schema for user registration
 */
export const registerSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(1, 'Name is required'),
  role: z.enum(['ADMIN', 'MANAGER', 'CONTRACTOR', 'HOMEOWNER', 'WORKER', 'USER']).optional(),
  accountType: accountTypeEnum.optional().default('user'),
  // Optional fields for contractor/homeowner
  phone: z.string().optional(),
  companyName: z.string().optional(),
});

/**
 * Schema for token refresh
 */
export const refreshSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

/**
 * Schema for password change
 */
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters'),
});

// ============================================
// ROLE ENUM
// ============================================

/**
 * Role enum for user roles
 */
export const roleEnum = z.enum(['ADMIN', 'MANAGER', 'CONTRACTOR', 'HOMEOWNER', 'WORKER', 'USER']);
export type Role = z.infer<typeof roleEnum>;

// ============================================
// TYPE EXPORTS
// ============================================

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type RefreshInput = z.infer<typeof refreshSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
