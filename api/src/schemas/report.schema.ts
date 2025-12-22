/**
 * Review Report Zod Schemas
 *
 * Validation schemas for review report management operations.
 *
 * **Feature: bidding-phase5-review**
 * **Requirements: 19.1-19.4**
 */

import { z } from 'zod';

// ============================================
// CONSTANTS
// ============================================

/**
 * Valid report reasons
 * Requirements: 19.2 - Require reason selection
 */
export const REPORT_REASONS = ['spam', 'offensive', 'fake', 'irrelevant'] as const;
export type ReportReason = typeof REPORT_REASONS[number];

/**
 * Report status values
 * Requirements: 19.3, 19.4 - Admin can resolve or dismiss
 */
export const REPORT_STATUSES = ['PENDING', 'RESOLVED', 'DISMISSED'] as const;
export type ReportStatus = typeof REPORT_STATUSES[number];

/**
 * Resolution actions
 * Requirements: 19.4 - Admin can hide, delete, or dismiss
 */
export const RESOLUTION_ACTIONS = ['hide', 'delete', 'dismiss'] as const;
export type ResolutionAction = typeof RESOLUTION_ACTIONS[number];

// ============================================
// CREATE REPORT SCHEMA
// ============================================

/**
 * Schema for creating a new report
 * Requirements: 19.1, 19.2 - Report button with reason selection
 */
export const CreateReportSchema = z.object({
  reason: z.enum(REPORT_REASONS).describe('Lý do báo cáo'),
  description: z.string()
    .max(500, 'Mô tả tối đa 500 ký tự')
    .optional(),
});

// ============================================
// RESOLVE REPORT SCHEMA
// ============================================

/**
 * Schema for resolving a report
 * Requirements: 19.4 - Admin can hide, delete, or dismiss
 */
export const ResolveReportSchema = z.object({
  resolution: z.enum(RESOLUTION_ACTIONS).describe('Hành động xử lý'),
  note: z.string()
    .max(500, 'Ghi chú tối đa 500 ký tự')
    .optional(),
});

// ============================================
// REPORT QUERY SCHEMA
// ============================================

/**
 * Schema for querying reports (admin)
 * Requirements: 19.3 - List reports for admin
 */
export const ReportQuerySchema = z.object({
  reviewId: z.string().optional(),
  reporterId: z.string().optional(),
  reason: z.enum(REPORT_REASONS).optional(),
  status: z.enum(REPORT_STATUSES).optional(),
  fromDate: z.coerce.date().optional(),
  toDate: z.coerce.date().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.enum(['createdAt', 'status']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// ============================================
// TYPE EXPORTS
// ============================================

export type CreateReportInput = z.infer<typeof CreateReportSchema>;
export type ResolveReportInput = z.infer<typeof ResolveReportSchema>;
export type ReportQuery = z.infer<typeof ReportQuerySchema>;
