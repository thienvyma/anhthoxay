import { useState, useCallback, memo } from 'react';
import { motion } from 'framer-motion';
import { tokens, API_URL } from '@app/shared';
import { useToast } from '../components/Toast';

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

  const updateField = useCallback((field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields
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
    } catch {
      toast.error('Có lỗi xảy ra. Vui lòng thử lại!');
    } finally {
      setSubmitting(false);
    }
  }, [form, showNameField, showPhoneField, showAddressField, customFields, successMessage, toast]);

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
    if (type === 'textarea') {
      return (
        <div key={name} style={{ marginBottom: '1rem' }}>
          <label style={labelStyle}>
            {label} {required && <span style={{ color: '#ef4444' }}>*</span>}
          </label>
          <textarea
            value={form[name] || ''}
            onChange={(e) => updateField(name, e.target.value)}
            placeholder={placeholder}
            rows={3}
            style={{ ...inputStyle, resize: 'vertical' }}
          />
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
            style={{ ...inputStyle, cursor: 'pointer' }}
          >
            <option value="">{placeholder || 'Chọn...'}</option>
            {optionList.map((opt, i) => (
              <option key={i} value={opt}>{opt}</option>
            ))}
          </select>
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
          placeholder={placeholder}
          style={inputStyle}
        />
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

          {/* Submit Button - synced with ConsultationForm style */}
          <motion.button
            type="submit"
            disabled={submitting}
            whileHover={{ scale: submitting ? 1 : 1.02 }}
            whileTap={{ scale: submitting ? 1 : 0.98 }}
            style={{
              width: '100%',
              padding: '0.875rem',
              borderRadius: tokens.radius.md,
              border: 'none',
              background: buttonColor,
              color: '#fff',
              fontSize: '1rem',
              fontWeight: 600,
              cursor: submitting ? 'not-allowed' : 'pointer',
              opacity: submitting ? 0.7 : 1,
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
