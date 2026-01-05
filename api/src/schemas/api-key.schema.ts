/**
 * API Key Zod Schemas
 *
 * Validation schemas for API key management.
 *
 * **Feature: admin-guide-api-keys**
 * **Requirements: 10.1, 15.1**
 */

import { z } from 'zod';

// ============================================
// ENUMS
// ============================================

/**
 * API Key scope enum
 * - READ_ONLY: Only GET requests allowed
 * - READ_WRITE: GET, POST, PUT allowed
 * - FULL_ACCESS: All methods including DELETE
 */
export const apiKeyScopeEnum = z.enum(['READ_ONLY', 'READ_WRITE', 'FULL_ACCESS']);
export type ApiKeyScope = z.infer<typeof apiKeyScopeEnum>;

/**
 * API Key status enum
 * - ACTIVE: Key is active and can be used
 * - INACTIVE: Key is disabled by admin
 * - EXPIRED: Key has passed its expiration date
 */
export const apiKeyStatusEnum = z.enum(['ACTIVE', 'INACTIVE', 'EXPIRED']);
export type ApiKeyStatus = z.infer<typeof apiKeyStatusEnum>;

/**
 * Endpoint group enum
 * Defines which API groups the key can access
 *
 * Groups:
 * - leads: Quản lý khách hàng tiềm năng
 * - blog: Quản lý bài viết
 * - projects: Quản lý công trình
 * - contractors: Quản lý nhà thầu
 * - reports: Xem thống kê và báo cáo
 * - pricing: Cấu hình giá (hạng mục, đơn giá, công thức)
 * - furniture: Quản lý nội thất (danh mục, vật dụng)
 * - media: Quản lý hình ảnh và tệp tin
 * - settings: Cài đặt hệ thống
 */
export const endpointGroupEnum = z.enum([
  'leads',
  'blog',
  'projects',
  'contractors',
  'reports',
  'pricing',
  'furniture',
  'media',
  'settings',
]);
export type EndpointGroup = z.infer<typeof endpointGroupEnum>;

// ============================================
// CREATE API KEY SCHEMA
// ============================================

/**
 * Schema for creating a new API key
 * Requirements: 10.1
 */
export const CreateApiKeySchema = z.object({
  name: z
    .string()
    .min(3, 'Tên API key phải có ít nhất 3 ký tự')
    .max(100, 'Tên API key tối đa 100 ký tự')
    .trim(),
  description: z
    .string()
    .max(500, 'Mô tả tối đa 500 ký tự')
    .optional(),
  scope: apiKeyScopeEnum,
  allowedEndpoints: z
    .array(endpointGroupEnum)
    .min(1, 'Phải chọn ít nhất một nhóm API'),
  expiresAt: z
    .string()
    .datetime({ message: 'Ngày hết hạn không hợp lệ' })
    .optional()
    .transform((val) => (val ? new Date(val) : undefined)),
});

// ============================================
// UPDATE API KEY SCHEMA
// ============================================

/**
 * Schema for updating an existing API key
 * All fields are optional - only provided fields will be updated
 * Requirements: 15.1
 */
export const UpdateApiKeySchema = z.object({
  name: z
    .string()
    .min(3, 'Tên API key phải có ít nhất 3 ký tự')
    .max(100, 'Tên API key tối đa 100 ký tự')
    .trim()
    .optional(),
  description: z
    .string()
    .max(500, 'Mô tả tối đa 500 ký tự')
    .nullable()
    .optional(),
  scope: apiKeyScopeEnum.optional(),
  allowedEndpoints: z
    .array(endpointGroupEnum)
    .min(1, 'Phải chọn ít nhất một nhóm API')
    .optional(),
  expiresAt: z
    .string()
    .datetime({ message: 'Ngày hết hạn không hợp lệ' })
    .nullable()
    .optional()
    .transform((val) => (val ? new Date(val) : val === null ? null : undefined)),
});

// ============================================
// LIST API KEYS QUERY SCHEMA
// ============================================

/**
 * Schema for querying/filtering API keys list
 */
export const ListApiKeysQuerySchema = z.object({
  status: apiKeyStatusEnum.optional(),
  search: z.string().max(100, 'Từ khóa tìm kiếm tối đa 100 ký tự').optional(),
});

// ============================================
// TYPE EXPORTS
// ============================================

export type CreateApiKeyInput = z.infer<typeof CreateApiKeySchema>;
export type UpdateApiKeyInput = z.infer<typeof UpdateApiKeySchema>;
export type ListApiKeysQuery = z.infer<typeof ListApiKeysQuerySchema>;
