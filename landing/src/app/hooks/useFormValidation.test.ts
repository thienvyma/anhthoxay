/**
 * Property-Based Tests for useFormValidation hook
 *
 * **Feature: production-scalability, Property 22, Property 23**
 * **Validates: Requirements 11.1, 11.2, 11.3, 11.4, 11.5, 11.6**
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { renderHook, act } from '@testing-library/react';
import { z } from 'zod';
import { useFormValidation } from './useFormValidation';

// Define schemas locally for testing (same as @app/shared)
const phoneSchema = z
  .string()
  .min(1, 'Số điện thoại là bắt buộc')
  .regex(/^[0-9]{10,11}$/, 'Số điện thoại phải có 10-11 chữ số');

const emailSchema = z
  .string()
  .email('Email không hợp lệ')
  .optional()
  .or(z.literal(''));

const nameSchema = z
  .string()
  .min(2, 'Tên phải có ít nhất 2 ký tự')
  .max(100, 'Tên không được quá 100 ký tự');

const contentSchema = z
  .string()
  .min(10, 'Nội dung phải có ít nhất 10 ký tự')
  .max(2000, 'Nội dung không được quá 2000 ký tự');

const leadFormSchema = z.object({
  name: nameSchema,
  phone: phoneSchema,
  email: emailSchema,
  content: contentSchema,
});

describe('useFormValidation', () => {
  /**
   * **Feature: production-scalability, Property 22: Field validation error messages**
   * **Validates: Requirements 11.2, 11.3, 11.4**
   *
   * Property: For any invalid phone number (not 10-11 digits),
   * the validation should return an error message.
   */
  describe('Property 22: Field validation error messages', () => {
    it('should show error for invalid phone numbers (property test)', () => {
      fc.assert(
        fc.property(
          // Generate strings that are NOT valid phone numbers (not 10-11 digits)
          fc.oneof(
            // Too short (0-9 digits)
            fc.stringMatching(/^[0-9]{0,9}$/),
            // Too long (12+ digits)
            fc.stringMatching(/^[0-9]{12,15}$/),
            // Contains non-digits
            fc.stringMatching(/^[a-z]{10,11}$/),
            // Empty string
            fc.constant('')
          ),
          (invalidPhone) => {
            const { result } = renderHook(() => useFormValidation(leadFormSchema));

            // Validate the invalid phone
            act(() => {
              result.current.validateField('phone', invalidPhone);
            });

            // Should have an error for phone field
            const error = result.current.getFieldError('phone');
            expect(error).toBeDefined();
            expect(typeof error).toBe('string');
            expect((error ?? '').length).toBeGreaterThan(0);
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should NOT show error for valid phone numbers (property test)', () => {
      fc.assert(
        fc.property(
          // Generate valid phone numbers (10-11 digits)
          fc.oneof(
            fc.stringMatching(/^[0-9]{10}$/),
            fc.stringMatching(/^[0-9]{11}$/)
          ),
          (validPhone) => {
            const { result } = renderHook(() => useFormValidation(leadFormSchema));

            // Validate the valid phone
            act(() => {
              result.current.validateField('phone', validPhone);
            });

            // Should NOT have an error for phone field
            const error = result.current.getFieldError('phone');
            expect(error).toBeUndefined();
          }
        ),
        { numRuns: 50 }
      );
    });

    /**
     * **Validates: Requirements 11.3**
     * Property: For any invalid email format, validation should return an error.
     */
    it('should show error for invalid email format (property test)', () => {
      fc.assert(
        fc.property(
          // Generate invalid emails
          fc.oneof(
            // Missing @
            fc.stringMatching(/^[a-z]{5,10}$/),
            // Missing domain
            fc.stringMatching(/^[a-z]{3,5}@$/),
            // Invalid format
            fc.constant('test email@example.com'),
            fc.constant('test@exam ple.com'),
            fc.constant('@example.com')
          ),
          (invalidEmail) => {
            const { result } = renderHook(() => useFormValidation(leadFormSchema));

            // Validate the invalid email
            act(() => {
              result.current.validateField('email', invalidEmail);
            });

            // Should have an error for email field
            const error = result.current.getFieldError('email');
            expect(error).toBeDefined();
            expect(typeof error).toBe('string');
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should NOT show error for valid or empty email (property test)', () => {
      fc.assert(
        fc.property(
          // Generate valid emails or empty string
          // Use a more constrained email format that Zod accepts
          fc.oneof(
            fc.tuple(
              fc.stringMatching(/^[a-z]{3,10}$/),
              fc.stringMatching(/^[a-z]{3,10}$/),
              fc.constant('.com')
            ).map(([local, domain, tld]) => `${local}@${domain}${tld}`),
            fc.constant('')
          ),
          (validEmail) => {
            const { result } = renderHook(() => useFormValidation(leadFormSchema));

            // Validate the valid email
            act(() => {
              result.current.validateField('email', validEmail);
            });

            // Should NOT have an error for email field
            const error = result.current.getFieldError('email');
            expect(error).toBeUndefined();
          }
        ),
        { numRuns: 50 }
      );
    });

    /**
     * **Validates: Requirements 11.4**
     * Property: For any name shorter than 2 characters, validation should return an error.
     */
    it('should show error for names shorter than 2 characters (property test)', () => {
      fc.assert(
        fc.property(
          // Generate names that are too short (0-1 characters)
          fc.stringMatching(/^.{0,1}$/),
          (shortName) => {
            const { result } = renderHook(() => useFormValidation(leadFormSchema));

            // Validate the short name
            act(() => {
              result.current.validateField('name', shortName);
            });

            // Should have an error for name field
            const error = result.current.getFieldError('name');
            expect(error).toBeDefined();
            expect(typeof error).toBe('string');
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should NOT show error for valid names (2-100 characters) (property test)', () => {
      fc.assert(
        fc.property(
          // Generate valid names (2-100 characters)
          fc.stringMatching(/^[a-zA-Z ]{2,50}$/),
          (validName) => {
            const { result } = renderHook(() => useFormValidation(leadFormSchema));

            // Validate the valid name
            act(() => {
              result.current.validateField('name', validName);
            });

            // Should NOT have an error for name field
            const error = result.current.getFieldError('name');
            expect(error).toBeUndefined();
          }
        ),
        { numRuns: 50 }
      );
    });

    /**
     * Property: Errors should only be shown for touched fields
     */
    it('should only show errors for touched fields (property test)', () => {
      fc.assert(
        fc.property(
          fc.stringMatching(/^.{0,1}$/), // Invalid name
          (invalidName) => {
            const { result } = renderHook(() => useFormValidation(leadFormSchema));

            // Before touching, no error should be shown
            expect(result.current.getFieldError('name')).toBeUndefined();
            expect(result.current.hasFieldError('name')).toBe(false);

            // After validating (which touches the field), error should be shown
            act(() => {
              result.current.validateField('name', invalidName);
            });

            expect(result.current.getFieldError('name')).toBeDefined();
            expect(result.current.hasFieldError('name')).toBe(true);
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  /**
   * **Feature: production-scalability, Property 23: Submit button state**
   * **Validates: Requirements 11.5, 11.6**
   *
   * Property: Submit button should only be enabled when all fields are valid.
   */
  describe('Property 23: Submit button state', () => {
    it('should disable submit when any field is invalid (property test)', () => {
      fc.assert(
        fc.property(
          // Generate form data with at least one invalid field
          fc.record({
            name: fc.oneof(
              fc.stringMatching(/^.{0,1}$/), // Invalid
              fc.stringMatching(/^[a-zA-Z]{2,20}$/) // Valid
            ),
            phone: fc.oneof(
              fc.stringMatching(/^[0-9]{0,9}$/), // Invalid
              fc.stringMatching(/^[0-9]{10}$/) // Valid
            ),
            email: fc.oneof(
              fc.constant(''), // Valid (empty)
              fc.emailAddress() // Valid
            ),
            content: fc.oneof(
              fc.stringMatching(/^.{0,9}$/), // Invalid
              fc.stringMatching(/^[a-zA-Z ]{10,50}$/) // Valid
            ),
          }),
          (formData) => {
            const { result } = renderHook(() => useFormValidation(leadFormSchema));

            // Validate all fields
            act(() => {
              result.current.validateAll(formData);
            });

            // Check if form is valid according to schema
            const schemaResult = leadFormSchema.safeParse(formData);
            const expectedCanSubmit = schemaResult.success;

            // canSubmit should match schema validation result
            expect(result.current.canSubmit).toBe(expectedCanSubmit);
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should enable submit when all fields are valid (property test)', () => {
      fc.assert(
        fc.property(
          // Generate completely valid form data
          fc.record({
            name: fc.stringMatching(/^[a-zA-Z]{2,20}$/),
            phone: fc.stringMatching(/^[0-9]{10}$/),
            email: fc.oneof(
              fc.constant(''),
              fc.tuple(
                fc.stringMatching(/^[a-z]{3,10}$/),
                fc.stringMatching(/^[a-z]{3,10}$/),
                fc.constant('.com')
              ).map(([local, domain, tld]) => `${local}@${domain}${tld}`)
            ),
            content: fc.stringMatching(/^[a-zA-Z ]{10,50}$/),
          }),
          (validFormData) => {
            const { result } = renderHook(() => useFormValidation(leadFormSchema));

            // Validate all fields
            act(() => {
              result.current.validateAll(validFormData);
            });

            // Should be able to submit
            expect(result.current.canSubmit).toBe(true);
            expect(result.current.state.isValid).toBe(true);
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should highlight invalid fields after validation (property test)', () => {
      fc.assert(
        fc.property(
          // Generate form data with specific invalid fields
          fc.record({
            name: fc.stringMatching(/^.{0,1}$/), // Always invalid
            phone: fc.stringMatching(/^[0-9]{10}$/), // Always valid
            email: fc.constant(''), // Always valid (empty)
            content: fc.stringMatching(/^.{0,9}$/), // Always invalid
          }),
          (formData) => {
            const { result } = renderHook(() => useFormValidation(leadFormSchema));

            // Validate all fields
            act(() => {
              result.current.validateAll(formData);
            });

            // Invalid fields should have errors
            expect(result.current.hasFieldError('name')).toBe(true);
            expect(result.current.hasFieldError('content')).toBe(true);

            // Valid fields should not have errors
            expect(result.current.hasFieldError('phone')).toBe(false);
            expect(result.current.hasFieldError('email')).toBe(false);
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should reset validation state correctly (property test)', () => {
      fc.assert(
        fc.property(
          fc.record({
            name: fc.stringMatching(/^.{0,1}$/), // Invalid
            phone: fc.stringMatching(/^[0-9]{0,5}$/), // Invalid
            email: fc.constant('invalid-email'), // Invalid
            content: fc.stringMatching(/^.{0,5}$/), // Invalid
          }),
          (invalidFormData) => {
            const { result } = renderHook(() => useFormValidation(leadFormSchema));

            // Validate all fields (should have errors)
            act(() => {
              result.current.validateAll(invalidFormData);
            });

            expect(result.current.state.isDirty).toBe(true);
            expect(Object.keys(result.current.state.errors).length).toBeGreaterThan(0);

            // Reset
            act(() => {
              result.current.reset();
            });

            // Should be clean state
            expect(result.current.state.isDirty).toBe(false);
            expect(Object.keys(result.current.state.errors).length).toBe(0);
            expect(Object.keys(result.current.state.touched).length).toBe(0);
          }
        ),
        { numRuns: 50 }
      );
    });
  });
});
