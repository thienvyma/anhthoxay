/**
 * Form validation helpers for inline error messages and field-level validation
 * Requirements: 18.5 - Display inline validation messages
 * Requirements: 26.5 - Associate labels with inputs properly
 */

import { useState, useCallback, useId, type ReactNode, type InputHTMLAttributes } from 'react';

// Validation rule types
export type ValidationRule<T = string> = {
  validate: (value: T) => boolean;
  message: string;
};

// Common validation rules
export const validationRules = {
  required: (message = 'Trường này là bắt buộc'): ValidationRule => ({
    validate: (value) => value !== undefined && value !== null && value.toString().trim() !== '',
    message,
  }),

  minLength: (min: number, message?: string): ValidationRule => ({
    validate: (value) => value.toString().length >= min,
    message: message || `Tối thiểu ${min} ký tự`,
  }),

  maxLength: (max: number, message?: string): ValidationRule => ({
    validate: (value) => value.toString().length <= max,
    message: message || `Tối đa ${max} ký tự`,
  }),

  email: (message = 'Email không hợp lệ'): ValidationRule => ({
    validate: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.toString()),
    message,
  }),

  phone: (message = 'Số điện thoại không hợp lệ'): ValidationRule => ({
    validate: (value) => /^[0-9]{10,11}$/.test(value.toString().replace(/\D/g, '')),
    message,
  }),

  number: (message = 'Vui lòng nhập số'): ValidationRule => ({
    validate: (value) => !isNaN(Number(value)),
    message,
  }),

  min: (min: number, message?: string): ValidationRule => ({
    validate: (value) => Number(value) >= min,
    message: message || `Giá trị tối thiểu là ${min}`,
  }),

  max: (max: number, message?: string): ValidationRule => ({
    validate: (value) => Number(value) <= max,
    message: message || `Giá trị tối đa là ${max}`,
  }),

  pattern: (regex: RegExp, message: string): ValidationRule => ({
    validate: (value) => regex.test(value.toString()),
    message,
  }),

  match: (fieldName: string, getValue: () => string, message?: string): ValidationRule => ({
    validate: (value) => value === getValue(),
    message: message || `Không khớp với ${fieldName}`,
  }),
};

// Validate a single value against rules
export function validateField(value: string, rules: ValidationRule[]): string | null {
  for (const rule of rules) {
    if (!rule.validate(value)) {
      return rule.message;
    }
  }
  return null;
}

// Form field error display component
export function FieldError({ error, id }: { error?: string | null; id?: string }) {
  if (!error) return null;

  return (
    <div
      id={id}
      role="alert"
      aria-live="polite"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        marginTop: 6,
        color: 'var(--error)',
        fontSize: 13,
      }}
    >
      <i className="ri-error-warning-line" style={{ fontSize: 14 }} aria-hidden="true" />
      <span>{error}</span>
    </div>
  );
}

// Form field wrapper with label and error
interface FormFieldProps {
  /** Label text */
  label: string;
  /** Error message */
  error?: string | null;
  /** Is field required */
  required?: boolean;
  /** Hint text */
  hint?: string;
  /** Field ID (auto-generated if not provided) */
  id?: string;
  /** Children (input element) */
  children: ReactNode;
}

/**
 * FormField component with proper label-input association
 * Requirements: 26.5 - Associate labels with inputs properly
 */
export function FormField({ label, error, required, hint, id: providedId, children }: FormFieldProps) {
  const generatedId = useId();
  const fieldId = providedId || generatedId;
  const errorId = `${fieldId}-error`;
  const hintId = `${fieldId}-hint`;

  return (
    <div className="form-field" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label
        htmlFor={fieldId}
        style={{
          fontSize: 14,
          fontWeight: 500,
          color: 'var(--text-primary)',
          display: 'flex',
          alignItems: 'center',
          gap: 4,
        }}
      >
        {label}
        {required && (
          <>
            <span style={{ color: 'var(--error)' }} aria-hidden="true">*</span>
            <span className="sr-only">(bắt buộc)</span>
          </>
        )}
      </label>
      {children}
      {hint && !error && (
        <span id={hintId} style={{ fontSize: 12, color: 'var(--text-muted)' }}>{hint}</span>
      )}
      <FieldError error={error} id={errorId} />
    </div>
  );
}

// Validated input component
interface ValidatedInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  /** Input value */
  value: string;
  /** Change handler */
  onChange: (value: string) => void;
  /** Validation rules */
  rules?: ValidationRule[];
  /** Validation callback */
  onValidate?: (error: string | null) => void;
  /** External error */
  error?: string | null;
  /** Show error on blur */
  showErrorOnBlur?: boolean;
  /** Label text (for accessibility) */
  label?: string;
  /** Is field required */
  required?: boolean;
  /** Hint text */
  hint?: string;
}

/**
 * ValidatedInput component with proper accessibility
 * Requirements: 26.5 - Associate labels with inputs properly
 */
export function ValidatedInput({
  value,
  onChange,
  rules = [],
  onValidate,
  error: externalError,
  showErrorOnBlur = true,
  label,
  required,
  hint,
  style,
  id: providedId,
  ...props
}: ValidatedInputProps) {
  const [touched, setTouched] = useState(false);
  const [internalError, setInternalError] = useState<string | null>(null);
  const generatedId = useId();
  const inputId = providedId || generatedId;
  const errorId = `${inputId}-error`;
  const hintId = `${inputId}-hint`;

  const error = externalError ?? (touched ? internalError : null);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      onChange(newValue);

      if (touched && rules.length > 0) {
        const validationError = validateField(newValue, rules);
        setInternalError(validationError);
        onValidate?.(validationError);
      }
    },
    [onChange, rules, touched, onValidate]
  );

  const handleBlur = useCallback(() => {
    if (showErrorOnBlur && rules.length > 0) {
      setTouched(true);
      const validationError = validateField(value, rules);
      setInternalError(validationError);
      onValidate?.(validationError);
    }
  }, [showErrorOnBlur, rules, value, onValidate]);

  // Build aria-describedby
  const ariaDescribedBy = [
    error ? errorId : null,
    hint && !error ? hintId : null,
  ].filter(Boolean).join(' ') || undefined;

  const inputElement = (
    <>
      <input
        {...props}
        id={inputId}
        value={value}
        onChange={handleChange}
        onBlur={handleBlur}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={ariaDescribedBy}
        aria-required={required}
        style={{
          width: '100%',
          padding: '12px 16px',
          background: 'var(--bg-tertiary)',
          border: `1px solid ${error ? 'var(--error)' : 'var(--border)'}`,
          borderRadius: 8,
          color: 'var(--text-primary)',
          fontSize: 14,
          transition: 'border-color 0.2s',
          outline: 'none',
          ...style,
        }}
      />
      {hint && !error && (
        <span id={hintId} style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{hint}</span>
      )}
      <FieldError error={error} id={errorId} />
    </>
  );

  // If label is provided, wrap with label
  if (label) {
    return (
      <div className="form-field" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <label
          htmlFor={inputId}
          style={{
            fontSize: 14,
            fontWeight: 500,
            color: 'var(--text-primary)',
            display: 'flex',
            alignItems: 'center',
            gap: 4,
          }}
        >
          {label}
          {required && (
            <>
              <span style={{ color: 'var(--error)' }} aria-hidden="true">*</span>
              <span className="sr-only">(bắt buộc)</span>
            </>
          )}
        </label>
        {inputElement}
      </div>
    );
  }

  return <div>{inputElement}</div>;
}

// Validated textarea component
interface ValidatedTextareaProps {
  /** Textarea value */
  value: string;
  /** Change handler */
  onChange: (value: string) => void;
  /** Validation rules */
  rules?: ValidationRule[];
  /** Validation callback */
  onValidate?: (error: string | null) => void;
  /** External error */
  error?: string | null;
  /** Show error on blur */
  showErrorOnBlur?: boolean;
  /** Placeholder text */
  placeholder?: string;
  /** Number of rows */
  rows?: number;
  /** Max length */
  maxLength?: number;
  /** Show character count */
  showCount?: boolean;
  /** Label text (for accessibility) */
  label?: string;
  /** Is field required */
  required?: boolean;
  /** Hint text */
  hint?: string;
  /** Field ID */
  id?: string;
}

/**
 * ValidatedTextarea component with proper accessibility
 * Requirements: 26.5 - Associate labels with inputs properly
 */
export function ValidatedTextarea({
  value,
  onChange,
  rules = [],
  onValidate,
  error: externalError,
  showErrorOnBlur = true,
  placeholder,
  rows = 4,
  maxLength,
  showCount = false,
  label,
  required,
  hint,
  id: providedId,
}: ValidatedTextareaProps) {
  const [touched, setTouched] = useState(false);
  const [internalError, setInternalError] = useState<string | null>(null);
  const generatedId = useId();
  const textareaId = providedId || generatedId;
  const errorId = `${textareaId}-error`;
  const hintId = `${textareaId}-hint`;

  const error = externalError ?? (touched ? internalError : null);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newValue = e.target.value;
      if (maxLength && newValue.length > maxLength) return;
      
      onChange(newValue);

      if (touched && rules.length > 0) {
        const validationError = validateField(newValue, rules);
        setInternalError(validationError);
        onValidate?.(validationError);
      }
    },
    [onChange, rules, touched, onValidate, maxLength]
  );

  const handleBlur = useCallback(() => {
    if (showErrorOnBlur && rules.length > 0) {
      setTouched(true);
      const validationError = validateField(value, rules);
      setInternalError(validationError);
      onValidate?.(validationError);
    }
  }, [showErrorOnBlur, rules, value, onValidate]);

  // Build aria-describedby
  const ariaDescribedBy = [
    error ? errorId : null,
    hint && !error ? hintId : null,
  ].filter(Boolean).join(' ') || undefined;

  const textareaElement = (
    <>
      <textarea
        id={textareaId}
        value={value}
        onChange={handleChange}
        onBlur={handleBlur}
        placeholder={placeholder}
        rows={rows}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={ariaDescribedBy}
        aria-required={required}
        style={{
          width: '100%',
          padding: '12px 16px',
          background: 'var(--bg-tertiary)',
          border: `1px solid ${error ? 'var(--error)' : 'var(--border)'}`,
          borderRadius: 8,
          color: 'var(--text-primary)',
          fontSize: 14,
          resize: 'vertical',
          minHeight: 100,
          outline: 'none',
          transition: 'border-color 0.2s',
        }}
      />
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
        <div>
          {hint && !error && (
            <span id={hintId} style={{ fontSize: 12, color: 'var(--text-muted)' }}>{hint}</span>
          )}
          <FieldError error={error} id={errorId} />
        </div>
        {showCount && maxLength && (
          <span
            style={{
              fontSize: 12,
              color: value.length >= maxLength ? 'var(--error)' : 'var(--text-muted)',
            }}
            aria-live="polite"
          >
            {value.length}/{maxLength}
          </span>
        )}
      </div>
    </>
  );

  // If label is provided, wrap with label
  if (label) {
    return (
      <div className="form-field" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <label
          htmlFor={textareaId}
          style={{
            fontSize: 14,
            fontWeight: 500,
            color: 'var(--text-primary)',
            display: 'flex',
            alignItems: 'center',
            gap: 4,
          }}
        >
          {label}
          {required && (
            <>
              <span style={{ color: 'var(--error)' }} aria-hidden="true">*</span>
              <span className="sr-only">(bắt buộc)</span>
            </>
          )}
        </label>
        {textareaElement}
      </div>
    );
  }

  return <div>{textareaElement}</div>;
}

// Form validation hook
export interface FormErrors {
  [key: string]: string | null;
}

export interface FormTouched {
  [key: string]: boolean;
}

export function useFormValidation<T extends Record<string, string>>(
  initialValues: T,
  validationSchema: { [K in keyof T]?: ValidationRule[] }
) {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<FormTouched>({});

  const setValue = useCallback((field: keyof T, value: string) => {
    setValues((prev) => ({ ...prev, [field]: value }));

    // Validate on change if field was touched
    if (touched[field as string]) {
      const rules = validationSchema[field];
      if (rules) {
        const error = validateField(value, rules);
        setErrors((prev) => ({ ...prev, [field]: error }));
      }
    }
  }, [touched, validationSchema]);

  const setFieldTouched = useCallback((field: keyof T) => {
    setTouched((prev) => ({ ...prev, [field]: true }));

    // Validate on blur
    const rules = validationSchema[field];
    if (rules) {
      const error = validateField(values[field], rules);
      setErrors((prev) => ({ ...prev, [field]: error }));
    }
  }, [validationSchema, values]);

  const validateAll = useCallback((): boolean => {
    const newErrors: FormErrors = {};
    let isValid = true;

    for (const field of Object.keys(validationSchema) as (keyof T)[]) {
      const rules = validationSchema[field];
      if (rules) {
        const error = validateField(values[field], rules);
        newErrors[field as string] = error;
        if (error) isValid = false;
      }
    }

    setErrors(newErrors);
    setTouched(
      Object.keys(validationSchema).reduce(
        (acc, key) => ({ ...acc, [key]: true }),
        {}
      )
    );

    return isValid;
  }, [validationSchema, values]);

  const reset = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
  }, [initialValues]);

  const getFieldProps = useCallback(
    (field: keyof T) => ({
      value: values[field],
      onChange: (value: string) => setValue(field, value),
      onBlur: () => setFieldTouched(field),
      error: touched[field as string] ? errors[field as string] : null,
    }),
    [values, errors, touched, setValue, setFieldTouched]
  );

  return {
    values,
    errors,
    touched,
    setValue,
    setFieldTouched,
    validateAll,
    reset,
    getFieldProps,
    isValid: Object.values(errors).every((e) => e === null),
  };
}
