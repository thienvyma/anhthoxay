/**
 * Service Fee Zod Schemas
 *
 * Validation schemas for service fee management.
 *
 * **Feature: bidding-phase1-foundation**
 * **Requirements: REQ-5.2**
 */

import { z } from 'zod';

// ============================================
// ENUMS
// ============================================

/**
 * Service fee type enum
 * - FIXED: Fixed amount (e.g., 500,000 VNĐ)
 * - PERCENTAGE: Percentage of value (e.g., 5%)
 */
export const serviceFeeTypeEnum = z.enum(['FIXED', 'PERCENTAGE']);
export type ServiceFeeType = z.infer<typeof serviceFeeTypeEnum>;

// ============================================
// CREATE SERVICE FEE SCHEMA
// ============================================

/**
 * Schema for creating a new service fee
 */
export const CreateServiceFeeSchema = z.object({
  name: z.string().min(1, 'Tên phí không được để trống').max(100, 'Tên phí tối đa 100 ký tự'),
  code: z
    .string()
    .min(1, 'Mã phí không được để trống')
    .max(50, 'Mã phí tối đa 50 ký tự')
    .regex(/^[A-Z][A-Z0-9_]*$/, 'Mã phí phải viết hoa, bắt đầu bằng chữ cái, chỉ chứa chữ cái, số và dấu gạch dưới'),
  type: serviceFeeTypeEnum,
  value: z.number().min(0, 'Giá trị phí không được âm'),
  description: z.string().max(500, 'Mô tả tối đa 500 ký tự').optional(),
  isActive: z.boolean().optional().default(true),
}).refine(
  (data) => {
    // If type is PERCENTAGE, value must be between 0 and 100
    if (data.type === 'PERCENTAGE' && data.value > 100) {
      return false;
    }
    return true;
  },
  {
    message: 'Phần trăm phí phải từ 0 đến 100',
    path: ['value'],
  }
);

// ============================================
// UPDATE SERVICE FEE SCHEMA
// ============================================

/**
 * Schema for updating an existing service fee
 * All fields are optional - only provided fields will be updated
 */
export const UpdateServiceFeeSchema = z.object({
  name: z.string().min(1, 'Tên phí không được để trống').max(100, 'Tên phí tối đa 100 ký tự').optional(),
  code: z
    .string()
    .min(1, 'Mã phí không được để trống')
    .max(50, 'Mã phí tối đa 50 ký tự')
    .regex(/^[A-Z][A-Z0-9_]*$/, 'Mã phí phải viết hoa, bắt đầu bằng chữ cái, chỉ chứa chữ cái, số và dấu gạch dưới')
    .optional(),
  type: serviceFeeTypeEnum.optional(),
  value: z.number().min(0, 'Giá trị phí không được âm').optional(),
  description: z.string().max(500, 'Mô tả tối đa 500 ký tự').nullable().optional(),
  isActive: z.boolean().optional(),
});

// ============================================
// QUERY SCHEMA
// ============================================

/**
 * Schema for querying service fees
 */
export const ServiceFeeQuerySchema = z.object({
  activeOnly: z.enum(['true', 'false']).optional().transform((val) => val === 'true'),
});

// ============================================
// TYPE EXPORTS
// ============================================

export type CreateServiceFeeInput = z.infer<typeof CreateServiceFeeSchema>;
export type UpdateServiceFeeInput = z.infer<typeof UpdateServiceFeeSchema>;
export type ServiceFeeQuery = z.infer<typeof ServiceFeeQuerySchema>;

/**
 * Service fee interface (matches Prisma model)
 */
export interface ServiceFee {
  id: string;
  name: string;
  code: string;
  type: string;
  value: number;
  description: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
