import { useState, useCallback, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { tokens, API_URL } from '@app/shared';
import { useToast } from './Toast';
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

const saveQuoteFormSchema = z.object({
  name: nameSchema,
  phone: phoneSchema,
  email: emailSchema,
});

interface QuoteResult {
  categoryName: string;
  area: number;
  coefficient: number;
  baseCost: number;
  materials: Array<{ id: string; name: string; price: number; quantity: number }>;
  materialsCost: number;
  grandTotal: number;
}

interface SaveQuoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  quoteResult: QuoteResult;
  onSuccess: () => void;
}

export const SaveQuoteModal = memo(function SaveQuoteModal({
  isOpen,
  onClose,
  quoteResult,
  onSuccess,
}: SaveQuoteModalProps) {
  const toast = useToast();
  const [form, setForm] = useState({ name: '', phone: '', email: '' });
  const [submitting, setSubmitting] = useState(false);

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
  } = useFormValidation<Record<string, unknown>>(saveQuoteFormSchema);

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

    if (!form.name.trim()) {
      toast.error('Vui lòng nhập họ tên');
      return;
    }
    if (!form.phone.trim()) {
      toast.error('Vui lòng nhập số điện thoại');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/leads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          phone: form.phone,
          email: form.email || undefined,
          content: `Báo giá: ${quoteResult.categoryName} - ${quoteResult.area}m² - ${formatCurrency(quoteResult.grandTotal)}`,
          source: 'QUOTE_CALCULATOR',
          quoteData: JSON.stringify(quoteResult),
        }),
      });

      if (!res.ok) {
        // Extract error message from standardized response format
        const errorData = await res.json();
        const errorMessage = errorData.error?.message || 'Có lỗi xảy ra. Vui lòng thử lại!';
        toast.error(errorMessage);
        return;
      }

      toast.success('Đã lưu báo giá! Chúng tôi sẽ liên hệ bạn sớm.');
      setForm({ name: '', phone: '', email: '' });
      resetValidation();
      onSuccess();
      onClose();
    } catch {
      toast.error('Có lỗi xảy ra. Vui lòng thử lại!');
    } finally {
      setSubmitting(false);
    }
  }, [form, quoteResult, onSuccess, onClose, toast, validateAll, resetValidation]);

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0,
    }).format(value);
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '0.75rem 1rem',
    borderRadius: tokens.radius.md,
    border: `1px solid ${tokens.color.border}`,
    background: tokens.color.background,
    color: tokens.color.text,
    fontSize: '1rem',
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

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem',
          }}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={e => e.stopPropagation()}
            style={{
              background: tokens.color.surface,
              borderRadius: tokens.radius.lg,
              padding: '2rem',
              width: '100%',
              maxWidth: 450,
              maxHeight: '90vh',
              overflow: 'auto',
            }}
          >
            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <i className="ri-save-line" style={{ fontSize: '2.5rem', color: tokens.color.primary }} />
              <h3 style={{ margin: '0.5rem 0', fontSize: '1.25rem', fontWeight: 700, color: tokens.color.text }}>
                Lưu Báo Giá & Đăng Ký Tư Vấn
              </h3>
              <p style={{ margin: 0, fontSize: '0.875rem', color: tokens.color.textMuted }}>
                Để lại thông tin để nhận tư vấn chi tiết
              </p>
            </div>

            {/* Quote Summary */}
            <div style={{
              padding: '1rem',
              borderRadius: tokens.radius.md,
              background: `${tokens.color.primary}10`,
              border: `1px solid ${tokens.color.primary}30`,
              marginBottom: '1.5rem',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ color: tokens.color.textMuted, fontSize: '0.875rem' }}>Hạng mục:</span>
                <span style={{ color: tokens.color.text, fontWeight: 500 }}>{quoteResult.categoryName}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ color: tokens.color.textMuted, fontSize: '0.875rem' }}>Diện tích:</span>
                <span style={{ color: tokens.color.text, fontWeight: 500 }}>{quoteResult.area} m²</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '0.5rem', borderTop: `1px solid ${tokens.color.border}` }}>
                <span style={{ color: tokens.color.text, fontWeight: 600 }}>Tổng dự toán:</span>
                <span style={{ color: tokens.color.primary, fontWeight: 700, fontSize: '1.1rem' }}>
                  {formatCurrency(quoteResult.grandTotal)}
                </span>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={labelStyle}>
                  Họ tên <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => updateField('name', e.target.value)}
                  onBlur={e => handleFieldBlur('name', e.target.value)}
                  placeholder="Nhập họ tên của bạn"
                  style={{
                    ...inputStyle,
                    borderColor: hasFieldError('name') ? tokens.color.error : tokens.color.border,
                    boxShadow: hasFieldError('name') ? `0 0 0 2px ${tokens.color.error}20` : 'none',
                  }}
                />
                {/* Error message display - Validates: Requirements 11.2, 11.4 */}
                {getFieldError('name') && (
                  <div style={{ 
                    marginTop: '0.25rem', 
                    fontSize: '0.75rem', 
                    color: tokens.color.error,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                  }}>
                    <i className="ri-error-warning-line" />
                    {getFieldError('name')}
                  </div>
                )}
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={labelStyle}>
                  Số điện thoại <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={e => updateField('phone', e.target.value)}
                  onBlur={e => handleFieldBlur('phone', e.target.value)}
                  placeholder="0912 345 678"
                  style={{
                    ...inputStyle,
                    borderColor: hasFieldError('phone') ? tokens.color.error : tokens.color.border,
                    boxShadow: hasFieldError('phone') ? `0 0 0 2px ${tokens.color.error}20` : 'none',
                  }}
                />
                {/* Error message display - Validates: Requirements 11.2 */}
                {getFieldError('phone') && (
                  <div style={{ 
                    marginTop: '0.25rem', 
                    fontSize: '0.75rem', 
                    color: tokens.color.error,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                  }}>
                    <i className="ri-error-warning-line" />
                    {getFieldError('phone')}
                  </div>
                )}
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={labelStyle}>Email (tùy chọn)</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={e => updateField('email', e.target.value)}
                  onBlur={e => handleFieldBlur('email', e.target.value)}
                  placeholder="email@example.com"
                  style={{
                    ...inputStyle,
                    borderColor: hasFieldError('email') ? tokens.color.error : tokens.color.border,
                    boxShadow: hasFieldError('email') ? `0 0 0 2px ${tokens.color.error}20` : 'none',
                  }}
                />
                {/* Error message display - Validates: Requirements 11.3 */}
                {getFieldError('email') && (
                  <div style={{ 
                    marginTop: '0.25rem', 
                    fontSize: '0.75rem', 
                    color: tokens.color.error,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                  }}>
                    <i className="ri-error-warning-line" />
                    {getFieldError('email')}
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={onClose}
                  style={{
                    flex: 1,
                    padding: '0.875rem',
                    borderRadius: tokens.radius.md,
                    border: `1px solid ${tokens.color.border}`,
                    background: 'transparent',
                    color: tokens.color.text,
                    fontSize: '1rem',
                    cursor: 'pointer',
                  }}
                >
                  Hủy
                </button>
                {/* Submit Button - Validates: Requirements 11.5, 11.6 */}
                <motion.button
                  type="submit"
                  disabled={submitting || !canSubmit}
                  whileHover={{ scale: (submitting || !canSubmit) ? 1 : 1.02 }}
                  whileTap={{ scale: (submitting || !canSubmit) ? 1 : 0.98 }}
                  style={{
                    flex: 2,
                    padding: '0.875rem',
                    borderRadius: tokens.radius.md,
                    border: 'none',
                    background: (submitting || !canSubmit) ? `${tokens.color.primary}80` : tokens.color.primary,
                    color: '#111',
                    fontSize: '1rem',
                    fontWeight: 600,
                    cursor: (submitting || !canSubmit) ? 'not-allowed' : 'pointer',
                    opacity: (submitting || !canSubmit) ? 0.7 : 1,
                    transition: 'all 0.2s ease',
                  }}
                >
                  {submitting ? 'Đang lưu...' : 'Lưu & Đăng ký'}
                </motion.button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});

export default SaveQuoteModal;
