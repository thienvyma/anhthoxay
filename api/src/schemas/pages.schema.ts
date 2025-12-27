/**
 * Pages & Sections Zod Schemas
 *
 * Validation schemas for page and section operations.
 *
 * **Feature: api-refactoring**
 * **Requirements: 5.4**
 */

import { z } from 'zod';

// ============================================
// PAGE SCHEMAS
// ============================================

/**
 * Schema for creating a new page
 */
export const createPageSchema = z.object({
  slug: z
    .string()
    .regex(/^[a-z0-9-]+$/, 'Slug chỉ chứa chữ thường, số và dấu gạch ngang')
    .min(1)
    .max(100),
  title: z.string().min(1, 'Tiêu đề không được trống').max(200),
});

/**
 * Schema for updating a page
 */
export const updatePageSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  headerConfig: z.string().optional(),
  footerConfig: z.string().optional(),
});

// ============================================
// SECTION SCHEMAS
// ============================================

/**
 * Valid section kinds
 */
export const sectionKinds = [
  'HERO',
  'HERO_SIMPLE',
  'TESTIMONIALS',
  'CTA',
  'RICH_TEXT',
  'BANNER',
  'STATS',
  'CONTACT_INFO',
  'FEATURED_BLOG_POSTS',
  'SOCIAL_MEDIA',
  'FEATURES',
  'MISSION_VISION',
  'FAB_ACTIONS',
  'FOOTER_SOCIAL',
  'QUICK_CONTACT',
  'CORE_VALUES',
  'SERVICES',
  'QUOTE_FORM',
  'ABOUT',
  'FURNITURE_QUOTE',
] as const;

/**
 * Schema for creating a new section
 */
export const createSectionSchema = z.object({
  kind: z.enum(sectionKinds),
  data: z.record(z.string(), z.any()),
  order: z.number().int().min(0).optional(),
});

/**
 * Schema for updating a section
 */
export const updateSectionSchema = z.object({
  data: z.record(z.string(), z.any()).optional(),
  order: z.number().int().min(0).optional(),
});

// ============================================
// TYPE EXPORTS
// ============================================

export type CreatePageInput = z.infer<typeof createPageSchema>;
export type UpdatePageInput = z.infer<typeof updatePageSchema>;
export type CreateSectionInput = z.infer<typeof createSectionSchema>;
export type UpdateSectionInput = z.infer<typeof updateSectionSchema>;
export type SectionKind = (typeof sectionKinds)[number];
