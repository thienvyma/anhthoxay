/**
 * Settings Zod Schemas
 *
 * Validation schemas for application settings.
 *
 * **Feature: api-refactoring**
 * **Requirements: 5.4**
 */

import { z } from 'zod';

// ============================================
// SETTINGS SCHEMAS
// ============================================

/**
 * Schema for updating a setting value
 * Value can be any JSON-serializable data
 */
export const updateSettingsSchema = z.object({
  value: z.any(),
});

// ============================================
// TYPE EXPORTS
// ============================================

export type UpdateSettingsInput = z.infer<typeof updateSettingsSchema>;
