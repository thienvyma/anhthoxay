/**
 * Shared Validation Schemas
 *
 * Client-side validation schemas using Zod for consistent validation
 * across frontend and backend.
 *
 * **Feature: production-scalability, Property 22, Property 23**
 * **Validates: Requirements 11.2, 11.3, 11.4, 11.7**
 */

import { z } from 'zod';

// ============================================
// FIELD SCHEMAS
// ============================================

/**
 * Phone number validation schema
 * Accepts Vietnamese phone numbers (10-11 digits)
 *
 * **Validates: Requirements 11.2**
 */
export const phoneSchema = z
  .string()
  .min(1, 'Số điện thoại là bắt buộc')
  .regex(/^[0-9]{10,11}$/, 'Số điện thoại phải có 10-11 chữ số');

/**
 * Email validation schema
 * Optional field, but must be valid email format if provided
 *
 * **Validates: Requirements 11.3**
 */
export const emailSchema = z
  .string()
  .email('Email không hợp lệ')
  .optional()
  .or(z.literal(''));

/**
 * Name validation schema
 * Minimum 2 characters, maximum 100 characters
 *
 * **Validates: Requirements 11.4**
 */
export const nameSchema = z
  .string()
  .min(2, 'Tên phải có ít nhất 2 ký tự')
  .max(100, 'Tên không được quá 100 ký tự');

/**
 * Content/message validation schema
 * Minimum 10 characters for meaningful content
 */
export const contentSchema = z
  .string()
  .min(10, 'Nội dung phải có ít nhất 10 ký tự')
  .max(2000, 'Nội dung không được quá 2000 ký tự');

// ============================================
// FORM SCHEMAS
// ============================================

/**
 * Lead form validation schema
 * Used for quote forms and contact forms
 *
 * **Validates: Requirements 11.2, 11.3, 11.4, 11.7**
 */
export const leadFormSchema = z.object({
  name: nameSchema,
  phone: phoneSchema,
  email: emailSchema,
  content: contentSchema,
});

/**
 * Quote form validation schema
 * Extended lead form with optional quote data
 */
export const quoteFormSchema = leadFormSchema.extend({
  quoteData: z.string().optional(),
});

/**
 * Contact form validation schema
 * Same as lead form but with explicit source
 */
export const contactFormSchema = leadFormSchema;

// ============================================
// TYPE EXPORTS
// ============================================

export type LeadFormData = z.infer<typeof leadFormSchema>;
export type QuoteFormData = z.infer<typeof quoteFormSchema>;
export type ContactFormData = z.infer<typeof contactFormSchema>;

// ============================================
// VALIDATION UTILITIES
// ============================================

/**
 * Validate a single field against its schema
 * Returns error message or null if valid
 */
export function validateField<T>(
  schema: z.ZodType<T>,
  value: unknown
): string | null {
  const result = schema.safeParse(value);
  if (result.success) {
    return null;
  }
  return result.error.issues[0]?.message || 'Giá trị không hợp lệ';
}

/**
 * Validate entire form data
 * Returns object with field errors or null if all valid
 */
export function validateForm<T extends Record<string, unknown>>(
  schema: z.ZodObject<z.ZodRawShape>,
  data: T
): Record<string, string> | null {
  const result = schema.safeParse(data);
  if (result.success) {
    return null;
  }

  const errors: Record<string, string> = {};
  result.error.issues.forEach((issue) => {
    const path = issue.path.join('.');
    if (path && !errors[path]) {
      errors[path] = issue.message;
    }
  });

  return Object.keys(errors).length > 0 ? errors : null;
}

/**
 * Check if form data is valid
 */
export function isFormValid<T extends Record<string, unknown>>(
  schema: z.ZodObject<z.ZodRawShape>,
  data: T
): boolean {
  return schema.safeParse(data).success;
}
