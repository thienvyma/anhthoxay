/**
 * Media Zod Schemas
 *
 * Validation schemas for media asset operations.
 *
 * **Feature: api-refactoring**
 * **Requirements: 5.4**
 */

import { z } from 'zod';

// ============================================
// MEDIA SCHEMAS
// ============================================

/**
 * Schema for updating a media asset
 */
export const updateMediaSchema = z.object({
  alt: z.string().max(200).optional(),
  caption: z.string().max(500).optional(),
  tags: z.string().max(200).optional(),
});

// ============================================
// TYPE EXPORTS
// ============================================

export type UpdateMediaInput = z.infer<typeof updateMediaSchema>;
