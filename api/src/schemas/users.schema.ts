/**
 * Users Validation Schemas
 * 
 * Zod schemas for user management endpoints
 */

import { z } from 'zod';

// User roles
export const UserRoleSchema = z.enum(['ADMIN', 'MANAGER', 'CONTRACTOR', 'HOMEOWNER', 'WORKER', 'USER']);

// User status for account management
export const UserStatusSchema = z.enum(['ACTIVE', 'BANNED', 'PENDING']);

// Create user schema (Admin only)
export const CreateUserSchema = z.object({
  email: z.string().email('Email không hợp lệ'),
  password: z.string().min(8, 'Mật khẩu phải có ít nhất 8 ký tự'),
  name: z.string().min(1, 'Tên không được trống'),
  role: UserRoleSchema.default('USER'),
});

// Update user schema (Admin only)
export const UpdateUserSchema = z.object({
  name: z.string().min(1, 'Tên không được trống').optional(),
  role: UserRoleSchema.optional(),
  status: UserStatusSchema.optional(),
  password: z.string().min(8, 'Mật khẩu phải có ít nhất 8 ký tự').optional().or(z.literal('')),
});

// List users query schema
export const ListUsersQuerySchema = z.object({
  search: z.string().optional(),
  role: UserRoleSchema.optional(),
  status: UserStatusSchema.optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

// Types
export type CreateUserInput = z.infer<typeof CreateUserSchema>;
export type UpdateUserInput = z.infer<typeof UpdateUserSchema>;
export type ListUsersQuery = z.infer<typeof ListUsersQuerySchema>;
