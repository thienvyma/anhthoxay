import { useState, useCallback, memo } from 'react';
import { motion } from 'framer-motion';
import { tokens, API_URL } from '@app/shared';
import { useToast } from '../components/Toast';
import { TurnstileWidget } from '../components/TurnstileWidget';
import { useFormValidation } from '../hooks/useFormValidation';
import { z } from 'zod';

// Validation schemas (same as @app/shared for consistency)
// **Feature: production-scalability**
// **Validates: Requirements 11.2, 11.3, 11.4, 11.7**
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
  .max(2000, 'Nội dung không được quá 2000 ký tự')
  .optional()
  .or(z.literal(''));

const quoteFormSchema = z.object({
  name: nameSchema,
  phone: phoneSchema,
  email: emailSchema,
  content: contentSchema,
  address: z.string().optional(),
});

interface CustomField {
  _id: string;
  name: string;
  label: string;
  type: 'text' | 'textarea' | 'number' | 'email' | 'tel' | 'select';
  placeholder?: string;
  required?: boolean;
  options?: string;
}

interface QuoteFormData {
  title?: string;
  subtitle?: string;
  buttonText?: string;
  showNameField?: boolean;
  showPhoneField?: boolean;
  showEmailField?: boolean;
  showContentField?: boolean;
  showAddressField?: boolean;
  customFields?: CustomField[];
  layout?: 'card' | 'simple' | 'glass';
  buttonColor?: string;
  successMessage?: string;
}

interface Props {
  data: QuoteFormData;
  noPadding?: boolean;
}

export const QuoteFormSection = memo(function QuoteFormSection({ data, noPadding = false }: Props) {
  const toast = useToast();
  const {
    title = 'Đăng kí tư vấn',
    subtitle = 'Điền thông tin để nhận báo giá nhanh chóng',
    buttonText = 'Gửi Yêu Cầu',
    showNameField = true,
    showPhoneField = true,
    showEmailField = true,
    showContentField = true,
    showAddressField = false,
    customFields = [],
    layout = 'card',
    buttonColor = '#F5D393',
    successMessage = 'Cảm ơn bạn! Chúng tôi sẽ liên hệ sớm nhất.',
  } = data;

  const [form, setForm] = useState<Record<string, string>>({
    name: '',
    phone: '',
    email: '',
    content: '',
    address: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);

  /**
   * Form validation hook
   * **Feature: production-scalability**
   * **Validates: Requirements 11.1, 11.2, 11.3, 11.4, 11.5, 11.6**
   */
  const {
    validateField,
    validateAll,
    getFieldError,
    hasFieldError,
    canSubmit,
    reset: resetValidation,
  } = useFormValidation<Record<string, unknown>>(quoteFormSchema);

  const updateField = useCallback((field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  }, []);

  /**
   * Handle field blur for validation
   * **Validates: Requirements 11.1**
   */
  const handleFieldBlur = useCallback((field: string, value: string) => {
    validateField(field, value);
  }, [validateField]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate all fields before submission
    // **Validates: Requirements 11.5, 11.6**
    const isValid = validateAll(form);
    if (!isValid) {
      toast.error('Vui lòng kiểm tra lại thông tin');
      return;
    }

    // Validate required fields (legacy check for backward compatibility)
    if (showNameField && !form.name.trim()) {
      toast.error('Vui lòng nhập họ tên');
      return;
    }
    if (showPhoneField && !form.phone.trim()) {
      toast.error('Vui lòng nhập số điện thoại');
      return;
    }

    // Validate custom required fields
    for (const field of customFields) {
      if (field.required && !form[field.name]?.trim()) {
        toast.error(`Vui lòng nhập ${field.label}`);
        return;
      }
    }

    // Validate CAPTCHA if configured
    if (import.meta.env.VITE_TURNSTILE_SITE_KEY && !turnstileToken) {
      toast.error('Vui lòng xác minh CAPTCHA');
      return;
    }

    setSubmitting(true);
    try {
      // Build content from all fields
      let content = form.content || '';
      if (showAddressField && form.address) {
        content += `\nĐịa chỉ: ${form.address}`;
      }
      for (const field of customFields) {
        if (form[field.name]) {
          content += `\n${field.label}: ${form[field.name]}`;
        }
      }

      const res = await fetch(`${API_URL}/leads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          phone: form.phone,
          email: form.email || undefined,
          content: content.trim() || 'Yêu cầu tư vấn từ form báo giá',
          source: 'QUOTE_FORM',
          turnstileToken: turnstileToken || undefined,
        }),
      });

      if (!res.ok) {
        // Extract error message from standardized response format
        const errorData = await res.json();
        const errorMessage = errorData.error?.message || 'Có lỗi xảy ra. Vui lòng thử lại!';
        toast.error(errorMessage);
        return;
      }

      toast.success(successMessage);
      setForm({ name: '', phone: '', email: '', content: '', address: '' });
      setTurnstileToken(null);
      resetValidation();
    } catch {
      toast.error('Có lỗi xảy ra. Vui lòng thử lại!');
    } finally {
      setSubmitting(false);
    }
  }, [form, showNameField, showPhoneField, showAddressField, customFields, successMessage, toast, turnstileToken, validateAll, resetValidation]);

  // Layout styles - synced with ConsultationForm in QuotePage
  const getContainerStyle = (): React.CSSProperties => {
    const base: React.CSSProperties = {
      width: '100%',
      maxWidth: 900,
      margin: '0 auto',
      padding: '2.5rem',
      boxSizing: 'border-box',
    };

    switch (layout) {
      case 'glass':
        return {
          ...base,
          background: 'rgba(20, 20, 24, 0.85)',
          backdropFilter: 'blur(20px)',
          borderRadius: tokens.radius.lg,
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
        };
      case 'card':
        return {
          ...base,
          background: tokens.color.surface,
          borderRadius: tokens.radius.lg,
          border: `1px solid ${tokens.color.border}`,
        };
      case 'simple':
      default:
        return {
          ...base,
          background: 'transparent',
        };
    }
  };

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

  const renderField = (
    name: string,
    label: string,
    type = 'text',
    placeholder?: string,
    required?: boolean,
    options?: string
  ) => {
    const fieldError = getFieldError(name);
    const hasError = hasFieldError(name);

    // Error style for invalid fields
    // **Validates: Requirements 11.5, 11.6**
    const errorInputStyle: React.CSSProperties = {
      ...inputStyle,
      borderColor: hasError ? tokens.color.error : tokens.color.border,
      boxShadow: hasError ? `0 0 0 2px ${tokens.color.error}20` : 'none',
    };

    if (type === 'textarea') {
      return (
        <div key={name} style={{ marginBottom: '1rem' }}>
          <label style={labelStyle}>
            {label} {required && <span style={{ color: '#ef4444' }}>*</span>}
          </label>
          <textarea
            value={form[name] || ''}
            onChange={(e) => updateField(name, e.target.value)}
            onBlur={(e) => handleFieldBlur(name, e.target.value)}
            placeholder={placeholder}
            rows={3}
            style={{ ...errorInputStyle, resize: 'vertical' }}
          />
          {/* Error message display - Validates: Requirements 11.2, 11.3, 11.4 */}
          {fieldError && (
            <div style={{ 
              marginTop: '0.25rem', 
              fontSize: '0.75rem', 
              color: tokens.color.error,
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem',
            }}>
              <i className="ri-error-warning-line" />
              {fieldError}
            </div>
          )}
        </div>
      );
    }

    if (type === 'select' && options) {
      const optionList = options.split(',').map(o => o.trim()).filter(Boolean);
      return (
        <div key={name} style={{ marginBottom: '1rem' }}>
          <label style={labelStyle}>
            {label} {required && <span style={{ color: '#ef4444' }}>*</span>}
          </label>
          <select
            value={form[name] || ''}
            onChange={(e) => updateField(name, e.target.value)}
            onBlur={(e) => handleFieldBlur(name, e.target.value)}
            style={{ ...errorInputStyle, cursor: 'pointer' }}
          >
            <option value="">{placeholder || 'Chọn...'}</option>
            {optionList.map((opt, i) => (
              <option key={i} value={opt}>{opt}</option>
            ))}
          </select>
          {fieldError && (
            <div style={{ 
              marginTop: '0.25rem', 
              fontSize: '0.75rem', 
              color: tokens.color.error,
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem',
            }}>
              <i className="ri-error-warning-line" />
              {fieldError}
            </div>
          )}
        </div>
      );
    }

    return (
      <div key={name} style={{ marginBottom: '1rem' }}>
        <label style={labelStyle}>
          {label} {required && <span style={{ color: '#ef4444' }}>*</span>}
        </label>
        <input
          type={type}
          value={form[name] || ''}
          onChange={(e) => updateField(name, e.target.value)}
          onBlur={(e) => handleFieldBlur(name, e.target.value)}
          placeholder={placeholder}
          style={errorInputStyle}
        />
        {/* Error message display - Validates: Requirements 11.2, 11.3, 11.4 */}
        {fieldError && (
          <div style={{ 
            marginTop: '0.25rem', 
            fontSize: '0.75rem', 
            color: tokens.color.error,
            display: 'flex',
            alignItems: 'center',
            gap: '0.25rem',
          }}>
            <i className="ri-error-warning-line" />
            {fieldError}
          </div>
        )}
      </div>
    );
  };

  return (
    <section style={{ padding: noPadding ? 0 : '60px 16px' }}>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        style={getContainerStyle()}
      >
        {/* Header - synced with ConsultationForm style */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <i className="ri-customer-service-2-line" style={{ fontSize: '3rem', color: tokens.color.primary }} />
          <h2 style={{
            margin: '0.75rem 0',
            fontSize: '1.5rem',
            fontWeight: 700,
            color: tokens.color.text,
          }}>
            {title}
          </h2>
          {subtitle && (
            <p style={{
              margin: 0,
              fontSize: '1rem',
              color: tokens.color.textMuted,
            }}>
              {subtitle}
            </p>
          )}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          {showNameField && renderField('name', 'Họ tên', 'text', 'Nhập họ tên của bạn', true)}
          {showPhoneField && renderField('phone', 'Số điện thoại', 'tel', '0912 345 678', true)}
          {showEmailField && renderField('email', 'Email', 'email', 'email@example.com')}
          {showAddressField && renderField('address', 'Địa chỉ', 'text', 'Nhập địa chỉ của bạn')}
          {showContentField && renderField('content', 'Nội dung yêu cầu', 'textarea', 'Mô tả chi tiết nhu cầu của bạn...')}
          
          {/* Custom Fields */}
          {customFields.map((field) => 
            renderField(
              field.name,
              field.label,
              field.type,
              field.placeholder,
              field.required,
              field.options
            )
          )}

          {/* Turnstile CAPTCHA */}
          <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'center' }}>
            <TurnstileWidget
              onVerify={setTurnstileToken}
              onError={() => setTurnstileToken(null)}
              onExpire={() => setTurnstileToken(null)}
              theme="light"
            />
          </div>

          {/* Submit Button - synced with ConsultationForm style */}
          {/* **Feature: production-scalability** */}
          {/* **Validates: Requirements 11.5, 11.6** */}
          <motion.button
            type="submit"
            disabled={submitting || !canSubmit}
            whileHover={{ scale: (submitting || !canSubmit) ? 1 : 1.02 }}
            whileTap={{ scale: (submitting || !canSubmit) ? 1 : 0.98 }}
            style={{
              width: '100%',
              padding: '0.875rem',
              borderRadius: tokens.radius.md,
              border: 'none',
              background: (submitting || !canSubmit) ? `${buttonColor}80` : buttonColor,
              color: '#fff',
              fontSize: '1rem',
              fontWeight: 600,
              cursor: (submitting || !canSubmit) ? 'not-allowed' : 'pointer',
              opacity: (submitting || !canSubmit) ? 0.7 : 1,
              transition: 'all 0.2s ease',
            }}
          >
            {submitting ? 'Đang gửi...' : buttonText}
          </motion.button>
        </form>
      </motion.div>
    </section>
  );
});

export default QuoteFormSection;
