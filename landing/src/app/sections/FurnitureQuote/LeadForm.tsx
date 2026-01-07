/**
 * LeadForm Component - Lead capture form for Furniture Quotation
 * Feature: furniture-quotation
 * Requirements: 5.4, 5.5, 6.11
 */

import { useState, useCallback, memo, useMemo } from 'react';
import { motion } from 'framer-motion';
import { tokens, API_URL } from '@app/shared';
import { useToast } from '../../components/Toast';
import { TurnstileWidget } from '../../components/TurnstileWidget';

// ============================================
// TYPES
// ============================================

export interface FormFieldConfig {
  _id?: string;
  name: string;
  label: string;
  type: 'text' | 'phone' | 'email' | 'select' | 'textarea';
  placeholder?: string;
  required?: boolean;
  options?: string; // Comma-separated for select type
}

export interface LeadFormConfig {
  title?: string;
  subtitle?: string;
  buttonText?: string;
  fields?: FormFieldConfig[];
  successMessage?: string;
}

export interface LeadData {
  id?: string;
  name: string;
  phone: string;
  email: string; // Required for quotation email delivery
}

interface Props {
  formConfig?: LeadFormConfig;
  onSubmit: (leadData: LeadData) => void;
  initialData?: Partial<LeadData>;
}

// ============================================
// VALIDATION HELPERS
// Requirements: 5.5 - Validate required fields, phone format, email format
// ============================================

// Phone regex from leads.schema.ts pattern
const PHONE_REGEX = /^[0-9+\-\s()]+$/;
const PHONE_MIN_LENGTH = 10;

// Email regex for validation
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const validatePhone = (phone: string): boolean => {
  const cleanPhone = phone.replace(/[\s\-()]/g, '');
  return PHONE_REGEX.test(phone) && cleanPhone.length >= PHONE_MIN_LENGTH;
};

const validateEmail = (email: string): boolean => {
  if (!email || email.trim() === '') return false; // Required field for quotation email delivery
  return EMAIL_REGEX.test(email);
};

// ============================================
// DEFAULT FORM CONFIGURATION
// Requirements: 5.4 - Default fields: name (required), phone (required)
// ============================================

const DEFAULT_FIELDS: FormFieldConfig[] = [
  {
    name: 'name',
    label: 'Họ tên',
    type: 'text',
    placeholder: 'Nhập họ tên của bạn',
    required: true,
  },
  {
    name: 'phone',
    label: 'Số điện thoại',
    type: 'phone',
    placeholder: '0912 345 678',
    required: true,
  },
  {
    name: 'email',
    label: 'Email',
    type: 'email',
    placeholder: 'email@example.com',
    required: true,
  },
];

// ============================================
// STYLES
// ============================================

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.75rem 1rem',
  borderRadius: tokens.radius.md,
  border: `1px solid ${tokens.color.border}`,
  background: tokens.color.background,
  color: tokens.color.text,
  fontSize: '1rem',
  transition: 'border-color 0.2s, box-shadow 0.2s',
  outline: 'none',
  boxSizing: 'border-box',
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  marginBottom: '0.5rem',
  fontSize: '0.875rem',
  fontWeight: 500,
  color: tokens.color.text,
};

const errorStyle: React.CSSProperties = {
  fontSize: '0.75rem',
  color: '#ef4444',
  marginTop: '0.25rem',
};

const helperTextStyle: React.CSSProperties = {
  fontSize: '0.75rem',
  color: tokens.color.muted,
  marginTop: '0.25rem',
};

// ============================================
// LEAD FORM COMPONENT
// ============================================

export const LeadForm = memo(function LeadForm({
  formConfig,
  onSubmit,
  initialData,
}: Props) {
  const toast = useToast();
  
  const {
    title = 'Thông tin liên hệ',
    subtitle = 'Vui lòng nhập thông tin để nhận báo giá',
    buttonText = 'Tiếp tục',
    fields = DEFAULT_FIELDS,
    successMessage = 'Thông tin đã được lưu!',
  } = formConfig || {};

  // Form state
  const [formData, setFormData] = useState<Record<string, string>>(() => ({
    name: initialData?.name || '',
    phone: initialData?.phone || '',
    email: initialData?.email || '',
  }));
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);

  // Check if form is valid for enabling/disabling submit button
  // Requirements: 4.2, 4.3 - Disable next button when email is invalid
  const isFormValid = useMemo(() => {
    // Check CAPTCHA if configured
    if (import.meta.env.VITE_TURNSTILE_SITE_KEY && !turnstileToken) {
      return false;
    }

    for (const field of fields) {
      const value = formData[field.name]?.trim() || '';
      
      // Check required fields
      if (field.required && !value) {
        return false;
      }
      
      // Validate phone format
      if (field.type === 'phone' && value && !validatePhone(value)) {
        return false;
      }
      
      // Validate email format
      if (field.type === 'email' && field.required && !validateEmail(value)) {
        return false;
      }
    }
    return true;
  }, [fields, formData, turnstileToken]);

  // Update field value
  const updateField = useCallback((fieldName: string, value: string) => {
    setFormData(prev => ({ ...prev, [fieldName]: value }));
    // Clear error when user types
    if (errors[fieldName]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[fieldName];
        return newErrors;
      });
    }
  }, [errors]);

  // Validate single field on blur
  // Requirements: 4.2 - Show validation error for invalid format
  const validateField = useCallback((field: FormFieldConfig) => {
    const value = formData[field.name]?.trim() || '';
    
    // Check required fields
    if (field.required && !value) {
      setErrors(prev => ({ ...prev, [field.name]: `Vui lòng nhập ${field.label.toLowerCase()}` }));
      return;
    }
    
    // Validate phone format
    if (field.type === 'phone' && value && !validatePhone(value)) {
      setErrors(prev => ({ ...prev, [field.name]: 'Số điện thoại không hợp lệ (tối thiểu 10 số)' }));
      return;
    }
    
    // Validate email format
    if (field.type === 'email' && value && !validateEmail(value)) {
      setErrors(prev => ({ ...prev, [field.name]: 'Email không hợp lệ (ví dụ: ten@email.com)' }));
      return;
    }
    
    // Clear error if valid
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[field.name];
      return newErrors;
    });
  }, [formData]);

  // Validate form
  // Requirements: 5.5 - Validate required fields, phone format, email format
  const validateForm = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};

    for (const field of fields) {
      const value = formData[field.name]?.trim() || '';

      // Check required fields
      if (field.required && !value) {
        newErrors[field.name] = `Vui lòng nhập ${field.label.toLowerCase()}`;
        continue;
      }

      // Validate phone format
      if (field.type === 'phone' && value && !validatePhone(value)) {
        newErrors[field.name] = 'Số điện thoại không hợp lệ (tối thiểu 10 số)';
        continue;
      }

      // Validate email format
      if (field.type === 'email' && value && !validateEmail(value)) {
        newErrors[field.name] = 'Email không hợp lệ';
        continue;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [fields, formData]);

  // Handle form submission
  // Requirements: 5.5, 6.11 - Submit lead and proceed to furniture selection
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Vui lòng kiểm tra lại thông tin');
      return;
    }

    // Validate CAPTCHA if configured
    if (import.meta.env.VITE_TURNSTILE_SITE_KEY && !turnstileToken) {
      toast.error('Vui lòng xác minh CAPTCHA');
      return;
    }

    setSubmitting(true);

    try {
      // Build content from custom fields (excluding name, phone, email)
      let content = 'Yêu cầu báo giá nội thất';
      const customFieldValues: string[] = [];
      
      for (const field of fields) {
        if (!['name', 'phone', 'email'].includes(field.name) && formData[field.name]) {
          customFieldValues.push(`${field.label}: ${formData[field.name]}`);
        }
      }
      
      if (customFieldValues.length > 0) {
        content += '\n' + customFieldValues.join('\n');
      }

      // Submit to leads API
      // Requirements: 5.5 - Set source = 'FURNITURE_QUOTE'
      
      const res = await fetch(`${API_URL}/leads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          phone: formData.phone,
          email: formData.email || undefined,
          content,
          source: 'FURNITURE_QUOTE',
          turnstileToken: turnstileToken || undefined,
        }),
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        const errorMessage = errorData.error?.message || errorData.error || 'Có lỗi xảy ra. Vui lòng thử lại!';
        toast.error(errorMessage);
        setSubmitting(false);
        return;
      }

      const result = await res.json();
      const leadId = result.data?.id || result.id;

      toast.success(successMessage);

      // Call onSubmit with lead data
      // Requirements: 6.11 - Store leadId for quotation, proceed to furniture selection
      onSubmit({
        id: leadId,
        name: formData.name,
        phone: formData.phone,
        email: formData.email, // Required for quotation email delivery
      });
    } catch {
      toast.error('Có lỗi xảy ra. Vui lòng thử lại!');
    } finally {
      setSubmitting(false);
    }
  }, [formData, fields, validateForm, onSubmit, successMessage, toast, turnstileToken]);

  // Render a form field
  // Requirements: 5.4 - Support types: text, phone, email, select, textarea
  const renderField = (field: FormFieldConfig) => {
    const value = formData[field.name] || '';
    const error = errors[field.name];
    const hasError = !!error;

    const fieldInputStyle: React.CSSProperties = {
      ...inputStyle,
      borderColor: hasError ? '#ef4444' : tokens.color.border,
    };

    // Textarea type
    if (field.type === 'textarea') {
      return (
        <div key={field.name} style={{ marginBottom: '1rem' }}>
          <label style={labelStyle}>
            {field.label}
            {field.required && <span style={{ color: '#ef4444', marginLeft: '0.25rem' }}>*</span>}
          </label>
          <textarea
            value={value}
            onChange={(e) => updateField(field.name, e.target.value)}
            onBlur={() => validateField(field)}
            placeholder={field.placeholder}
            rows={3}
            style={{ ...fieldInputStyle, resize: 'vertical' }}
          />
          {hasError && <div style={errorStyle}>{error}</div>}
        </div>
      );
    }

    // Select type
    if (field.type === 'select' && field.options) {
      const optionList = field.options.split(',').map(o => o.trim()).filter(Boolean);
      return (
        <div key={field.name} style={{ marginBottom: '1rem' }}>
          <label style={labelStyle}>
            {field.label}
            {field.required && <span style={{ color: '#ef4444', marginLeft: '0.25rem' }}>*</span>}
          </label>
          <select
            value={value}
            onChange={(e) => updateField(field.name, e.target.value)}
            onBlur={() => validateField(field)}
            style={{ ...fieldInputStyle, cursor: 'pointer' }}
          >
            <option value="">{field.placeholder || 'Chọn...'}</option>
            {optionList.map((opt, i) => (
              <option key={i} value={opt}>{opt}</option>
            ))}
          </select>
          {hasError && <div style={errorStyle}>{error}</div>}
        </div>
      );
    }

    // Text, phone, email types
    const inputType = field.type === 'phone' ? 'tel' : field.type === 'email' ? 'email' : 'text';
    const isEmailField = field.type === 'email';
    
    return (
      <div key={field.name} style={{ marginBottom: '1rem' }}>
        <label style={labelStyle}>
          {field.label}
          {field.required && <span style={{ color: '#ef4444', marginLeft: '0.25rem' }}>*</span>}
        </label>
        <input
          type={inputType}
          value={value}
          onChange={(e) => updateField(field.name, e.target.value)}
          onBlur={() => validateField(field)}
          placeholder={field.placeholder}
          required={field.required}
          style={fieldInputStyle}
        />
        {hasError && <div style={errorStyle}>{error}</div>}
        {isEmailField && !hasError && (
          <div style={helperTextStyle}>
            <i className="ri-mail-send-line" style={{ marginRight: '0.25rem' }} />
            Báo giá chi tiết sẽ được gửi qua email này
          </div>
        )}
      </div>
    );
  };

  return (
    <div>
      {/* Header */}
      <h3 style={{ 
        margin: '0 0 0.5rem', 
        fontSize: '1.1rem', 
        fontWeight: 600, 
        color: tokens.color.text 
      }}>
        <i className="ri-user-line" style={{ marginRight: '0.5rem', color: tokens.color.primary }} />
        {title}
      </h3>
      <p style={{ 
        margin: '0 0 1.5rem', 
        fontSize: '0.875rem', 
        color: tokens.color.muted 
      }}>
        {subtitle}
      </p>

      {/* Form */}
      <form onSubmit={handleSubmit}>
        {fields.map(renderField)}

        {/* Turnstile CAPTCHA */}
        <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'center' }}>
          <TurnstileWidget
            onVerify={setTurnstileToken}
            onError={() => setTurnstileToken(null)}
            onExpire={() => setTurnstileToken(null)}
            theme="light"
          />
        </div>

        {/* Submit Button */}
        <motion.button
          type="submit"
          disabled={submitting || !isFormValid}
          whileHover={{ scale: (submitting || !isFormValid) ? 1 : 1.02 }}
          whileTap={{ scale: (submitting || !isFormValid) ? 1 : 0.98 }}
          style={{
            width: '100%',
            padding: '0.875rem',
            borderRadius: tokens.radius.md,
            border: 'none',
            background: (submitting || !isFormValid) ? tokens.color.muted : tokens.color.primary,
            color: '#111',
            fontSize: '1rem',
            fontWeight: 600,
            cursor: (submitting || !isFormValid) ? 'not-allowed' : 'pointer',
            opacity: (submitting || !isFormValid) ? 0.7 : 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            marginTop: '0.5rem',
          }}
        >
          {submitting ? 'Đang xử lý...' : buttonText}
          {!submitting && <i className="ri-arrow-right-line" />}
        </motion.button>
      </form>
    </div>
  );
});

export default LeadForm;
