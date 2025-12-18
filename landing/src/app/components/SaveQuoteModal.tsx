import { useState, useCallback, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { tokens, API_URL } from '@app/shared';
import { useToast } from './Toast';

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

  const updateField = useCallback((field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();

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
      onSuccess();
      onClose();
    } catch {
      toast.error('Có lỗi xảy ra. Vui lòng thử lại!');
    } finally {
      setSubmitting(false);
    }
  }, [form, quoteResult, onSuccess, onClose, toast]);

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
                  placeholder="Nhập họ tên của bạn"
                  style={inputStyle}
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={labelStyle}>
                  Số điện thoại <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={e => updateField('phone', e.target.value)}
                  placeholder="0912 345 678"
                  style={inputStyle}
                />
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={labelStyle}>Email (tùy chọn)</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={e => updateField('email', e.target.value)}
                  placeholder="email@example.com"
                  style={inputStyle}
                />
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
                <motion.button
                  type="submit"
                  disabled={submitting}
                  whileHover={{ scale: submitting ? 1 : 1.02 }}
                  whileTap={{ scale: submitting ? 1 : 0.98 }}
                  style={{
                    flex: 2,
                    padding: '0.875rem',
                    borderRadius: tokens.radius.md,
                    border: 'none',
                    background: tokens.color.primary,
                    color: '#111',
                    fontSize: '1rem',
                    fontWeight: 600,
                    cursor: submitting ? 'not-allowed' : 'pointer',
                    opacity: submitting ? 0.7 : 1,
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
