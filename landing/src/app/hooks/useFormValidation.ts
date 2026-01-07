/**
 * Form Validation Hook
 *
 * Provides field-level validation on blur with touched state tracking.
 * Uses Zod schemas for consistent validation with backend.
 *
 * **Feature: production-scalability, Property 22, Property 23**
 * **Validates: Requirements 11.1, 11.2, 11.3, 11.4, 11.5, 11.6**
 */

import { useState, useCallback, useMemo } from 'react';
import { z } from 'zod';

export interface ValidationState<T extends Record<string, unknown>> {
  /** Error messages for each field */
  errors: Partial<Record<keyof T, string>>;
  /** Whether each field has been touched (blurred) */
  touched: Partial<Record<keyof T, boolean>>;
  /** Whether all fields are valid */
  isValid: boolean;
  /** Whether any field has been touched */
  isDirty: boolean;
}

export interface UseFormValidationReturn<T extends Record<string, unknown>> {
  /** Current validation state */
  state: ValidationState<T>;
  /** Validate a single field on blur */
  validateField: (field: keyof T, value: unknown) => void;
  /** Mark a field as touched without validating */
  touchField: (field: keyof T) => void;
  /** Validate all fields at once */
  validateAll: (data: Partial<T>) => boolean;
  /** Reset validation state */
  reset: () => void;
  /** Get error message for a field (only if touched) */
  getFieldError: (field: keyof T) => string | undefined;
  /** Check if a field has error (only if touched) */
  hasFieldError: (field: keyof T) => boolean;
  /** Check if form can be submitted (all valid) */
  canSubmit: boolean;
}

/**
 * Hook for form validation with Zod schemas
 *
 * @param schema - Zod object schema for validation
 * @returns Validation state and helper functions
 *
 * @example
 * ```tsx
 * const { state, validateField, getFieldError, canSubmit } = useFormValidation(leadFormSchema);
 *
 * <input
 *   onBlur={(e) => validateField('name', e.target.value)}
 *   className={getFieldError('name') ? 'error' : ''}
 * />
 * {getFieldError('name') && <span className="error">{getFieldError('name')}</span>}
 *
 * <button disabled={!canSubmit}>Submit</button>
 * ```
 */
export function useFormValidation<T extends Record<string, unknown>>(
  schema: z.ZodObject<z.ZodRawShape>
): UseFormValidationReturn<T> {
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({});
  const [formData, setFormData] = useState<Partial<T>>({});

  // Calculate if form is valid based on current data
  const isValid = useMemo(() => {
    const result = schema.safeParse(formData);
    return result.success;
  }, [schema, formData]);

  // Check if any field has been touched
  const isDirty = useMemo(() => {
    return Object.values(touched).some(Boolean);
  }, [touched]);

  // Can submit only when all fields are valid
  const canSubmit = isValid;

  /**
   * Validate a single field
   * **Validates: Requirements 11.1**
   */
  const validateField = useCallback(
    (field: keyof T, value: unknown) => {
      // Update form data for overall validation
      setFormData((prev) => ({ ...prev, [field]: value }));

      // Mark field as touched
      setTouched((prev) => ({ ...prev, [field]: true }));

      // Get the field schema from the object schema
      const fieldSchema = (schema.shape as Record<string, z.ZodTypeAny>)[
        field as string
      ];

      if (!fieldSchema) {
        return;
      }

      // Validate the field
      const result = fieldSchema.safeParse(value);

      if (result.success) {
        // Clear error for this field
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors[field];
          return newErrors;
        });
      } else {
        // Set error message
        const errorMessage =
          result.error.issues[0]?.message || 'Giá trị không hợp lệ';
        setErrors((prev) => ({ ...prev, [field]: errorMessage }));
      }
    },
    [schema]
  );

  /**
   * Mark a field as touched without validating
   */
  const touchField = useCallback((field: keyof T) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  }, []);

  /**
   * Validate all fields at once
   * Returns true if all valid, false otherwise
   */
  const validateAll = useCallback(
    (data: Partial<T>): boolean => {
      setFormData(data);

      // Mark all fields as touched
      const allTouched: Partial<Record<keyof T, boolean>> = {};
      Object.keys(schema.shape).forEach((key) => {
        allTouched[key as keyof T] = true;
      });
      setTouched(allTouched);

      // Validate entire form
      const result = schema.safeParse(data);

      if (result.success) {
        setErrors({});
        return true;
      }

      // Set errors for each invalid field
      const newErrors: Partial<Record<keyof T, string>> = {};
      result.error.issues.forEach((issue) => {
        const path = issue.path[0] as keyof T;
        if (path && !newErrors[path]) {
          newErrors[path] = issue.message;
        }
      });
      setErrors(newErrors);

      return false;
    },
    [schema]
  );

  /**
   * Reset validation state
   */
  const reset = useCallback(() => {
    setErrors({});
    setTouched({});
    setFormData({});
  }, []);

  /**
   * Get error message for a field (only if touched)
   * **Validates: Requirements 11.2, 11.3, 11.4**
   */
  const getFieldError = useCallback(
    (field: keyof T): string | undefined => {
      if (!touched[field]) {
        return undefined;
      }
      return errors[field];
    },
    [errors, touched]
  );

  /**
   * Check if a field has error (only if touched)
   * **Validates: Requirements 11.5, 11.6**
   */
  const hasFieldError = useCallback(
    (field: keyof T): boolean => {
      return Boolean(touched[field] && errors[field]);
    },
    [errors, touched]
  );

  return {
    state: {
      errors,
      touched,
      isValid,
      isDirty,
    },
    validateField,
    touchField,
    validateAll,
    reset,
    getFieldError,
    hasFieldError,
    canSubmit,
  };
}

export default useFormValidation;
