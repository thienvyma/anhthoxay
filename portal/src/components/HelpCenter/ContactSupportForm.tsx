/**
 * ContactSupportForm Component
 *
 * Form for contacting support when FAQ doesn't answer the question.
 *
 * **Feature: bidding-phase6-portal**
 * **Requirements: 24.4**
 */

import { useState } from 'react';
import { useAuth } from '../../auth/AuthContext';

export interface ContactSupportFormProps {
  /** Callback when form is submitted successfully */
  onSuccess: () => void;
  /** Callback when user cancels */
  onCancel: () => void;
}

interface FormData {
  subject: string;
  category: string;
  message: string;
  email: string;
}

interface FormErrors {
  subject?: string;
  category?: string;
  message?: string;
  email?: string;
}

const SUPPORT_CATEGORIES = [
  { value: '', label: 'Chọn danh mục' },
  { value: 'account', label: 'Tài khoản & Đăng nhập' },
  { value: 'project', label: 'Dự án & Công trình' },
  { value: 'bid', label: 'Đề xuất & Đấu giá' },
  { value: 'payment', label: 'Thanh toán & Đặt cọc' },
  { value: 'verification', label: 'Xác minh nhà thầu' },
  { value: 'technical', label: 'Lỗi kỹ thuật' },
  { value: 'other', label: 'Khác' },
];

export function ContactSupportForm({ onSuccess, onCancel }: ContactSupportFormProps) {
  const { user } = useAuth();
  const [formData, setFormData] = useState<FormData>({
    subject: '',
    category: '',
    message: '',
    email: user?.email || '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.subject.trim()) {
      newErrors.subject = 'Vui lòng nhập tiêu đề';
    } else if (formData.subject.length < 5) {
      newErrors.subject = 'Tiêu đề phải có ít nhất 5 ký tự';
    }

    if (!formData.category) {
      newErrors.category = 'Vui lòng chọn danh mục';
    }

    if (!formData.message.trim()) {
      newErrors.message = 'Vui lòng nhập nội dung';
    } else if (formData.message.length < 20) {
      newErrors.message = 'Nội dung phải có ít nhất 20 ký tự';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Vui lòng nhập email';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email không hợp lệ';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle input change
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear error when user types
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  // Handle form submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      // TODO: Implement actual API call to submit support request
      // For now, simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));

      setSubmitSuccess(true);

      // Auto close after success
      setTimeout(() => {
        onSuccess();
      }, 2000);
    } catch (error) {
      console.error('Failed to submit support request:', error);
      setErrors({ message: 'Có lỗi xảy ra. Vui lòng thử lại sau.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitSuccess) {
    return (
      <div className="help-center-contact-success">
        <div className="help-center-success-icon">
          <i className="ri-check-line" />
        </div>
        <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>
          Gửi yêu cầu thành công!
        </h3>
        <p style={{ fontSize: 14, color: '#a1a1aa', textAlign: 'center' }}>
          Chúng tôi sẽ phản hồi qua email trong vòng 24 giờ làm việc.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="help-center-contact-form">
      <p style={{ fontSize: 14, color: '#a1a1aa', marginBottom: 20 }}>
        Điền thông tin bên dưới, chúng tôi sẽ phản hồi trong vòng 24 giờ.
      </p>

      {/* Email */}
      <div className="form-group">
        <label htmlFor="support-email" className="form-label">
          Email liên hệ <span className="required">*</span>
        </label>
        <input
          id="support-email"
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          placeholder="email@example.com"
          className={`input ${errors.email ? 'input-error' : ''}`}
          disabled={isSubmitting}
        />
        {errors.email && <span className="form-error">{errors.email}</span>}
      </div>

      {/* Category */}
      <div className="form-group">
        <label htmlFor="support-category" className="form-label">
          Danh mục <span className="required">*</span>
        </label>
        <select
          id="support-category"
          name="category"
          value={formData.category}
          onChange={handleChange}
          className={`input ${errors.category ? 'input-error' : ''}`}
          disabled={isSubmitting}
        >
          {SUPPORT_CATEGORIES.map((cat) => (
            <option key={cat.value} value={cat.value}>
              {cat.label}
            </option>
          ))}
        </select>
        {errors.category && <span className="form-error">{errors.category}</span>}
      </div>

      {/* Subject */}
      <div className="form-group">
        <label htmlFor="support-subject" className="form-label">
          Tiêu đề <span className="required">*</span>
        </label>
        <input
          id="support-subject"
          type="text"
          name="subject"
          value={formData.subject}
          onChange={handleChange}
          placeholder="Mô tả ngắn gọn vấn đề của bạn"
          className={`input ${errors.subject ? 'input-error' : ''}`}
          disabled={isSubmitting}
          maxLength={100}
        />
        {errors.subject && <span className="form-error">{errors.subject}</span>}
      </div>

      {/* Message */}
      <div className="form-group">
        <label htmlFor="support-message" className="form-label">
          Nội dung chi tiết <span className="required">*</span>
        </label>
        <textarea
          id="support-message"
          name="message"
          value={formData.message}
          onChange={handleChange}
          placeholder="Mô tả chi tiết vấn đề bạn gặp phải..."
          className={`input ${errors.message ? 'input-error' : ''}`}
          disabled={isSubmitting}
          rows={5}
          maxLength={2000}
          style={{ resize: 'vertical', minHeight: 120 }}
        />
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginTop: 4,
          }}
        >
          {errors.message ? (
            <span className="form-error">{errors.message}</span>
          ) : (
            <span />
          )}
          <span style={{ fontSize: 12, color: '#71717a' }}>
            {formData.message.length}/2000
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="help-center-contact-actions">
        <button
          type="button"
          onClick={onCancel}
          className="btn btn-secondary"
          disabled={isSubmitting}
        >
          Hủy
        </button>
        <button
          type="submit"
          className="btn btn-primary"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <i className="ri-loader-4-line spinner" style={{ marginRight: 8 }} />
              Đang gửi...
            </>
          ) : (
            <>
              <i className="ri-send-plane-line" style={{ marginRight: 8 }} />
              Gửi yêu cầu
            </>
          )}
        </button>
      </div>
    </form>
  );
}

export default ContactSupportForm;
