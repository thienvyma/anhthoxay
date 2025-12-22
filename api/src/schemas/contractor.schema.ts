/**
 * Contractor Zod Schemas
 *
 * Validation schemas for contractor profile operations.
 *
 * **Feature: bidding-phase1-foundation**
 * **Requirements: REQ-2.3**
 */

import { z } from 'zod';

// ============================================
// CERTIFICATE SCHEMA
// ============================================

/**
 * Schema for certificate object
 */
export const certificateSchema = z.object({
  name: z.string().min(1, 'Tên chứng chỉ không được để trống'),
  imageUrl: z.string().url('URL ảnh không hợp lệ'),
  issuedDate: z.string().optional(),
});

// ============================================
// CONTRACTOR PROFILE SCHEMAS
// ============================================

/**
 * Schema for creating contractor profile
 */
export const CreateContractorProfileSchema = z.object({
  description: z.string().max(2000, 'Mô tả tối đa 2000 ký tự').optional(),
  experience: z.number().int().min(0, 'Số năm kinh nghiệm không hợp lệ').max(100).optional(),
  specialties: z.array(z.string()).max(20, 'Tối đa 20 chuyên môn').optional(),
  serviceAreas: z.array(z.string()).max(50, 'Tối đa 50 khu vực').optional(),
  portfolioImages: z.array(z.string().url('URL ảnh không hợp lệ')).max(10, 'Tối đa 10 ảnh portfolio').optional(),
  certificates: z.array(certificateSchema).max(5, 'Tối đa 5 chứng chỉ').optional(),
  idCardFront: z.string().url('URL ảnh CMND mặt trước không hợp lệ').optional(),
  idCardBack: z.string().url('URL ảnh CMND mặt sau không hợp lệ').optional(),
  businessLicenseImage: z.string().url('URL ảnh giấy phép kinh doanh không hợp lệ').optional(),
});

/**
 * Schema for updating contractor profile
 */
export const UpdateContractorProfileSchema = CreateContractorProfileSchema.partial();

// ============================================
// ADMIN QUERY SCHEMAS
// ============================================

/**
 * Verification status enum
 */
export const verificationStatusEnum = z.enum(['PENDING', 'VERIFIED', 'REJECTED']);
export type VerificationStatus = z.infer<typeof verificationStatusEnum>;

/**
 * Schema for listing contractors query
 */
export const ListContractorsQuerySchema = z.object({
  status: verificationStatusEnum.optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
});

/**
 * Schema for verifying contractor
 */
export const VerifyContractorSchema = z.object({
  status: z.enum(['VERIFIED', 'REJECTED']),
  note: z.string().max(500, 'Ghi chú tối đa 500 ký tự').optional(),
});

// ============================================
// TYPE EXPORTS
// ============================================

export type Certificate = z.infer<typeof certificateSchema>;
export type CreateContractorProfileInput = z.infer<typeof CreateContractorProfileSchema>;
export type UpdateContractorProfileInput = z.infer<typeof UpdateContractorProfileSchema>;
export type ListContractorsQuery = z.infer<typeof ListContractorsQuerySchema>;
export type VerifyContractorInput = z.infer<typeof VerifyContractorSchema>;
