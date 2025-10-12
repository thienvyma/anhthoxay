import { memo } from 'react';
import { motion } from 'framer-motion';
import { tokens } from '@app/shared';
import { useState } from 'react';
import { reservationAPI } from '../api';
import { glassEffect } from '../styles/glassEffect';

interface FieldConfig {
  enabled: boolean;
  label: string;
  placeholder: string;
  required: boolean;
}

interface ReservationFormData {
  title?: string;
  description?: string;
  submitButtonText?: string;
  timeSlots?: string[];
  maxPartySize?: number;
  fields?: {
    name?: FieldConfig;
    email?: FieldConfig;
    phone?: FieldConfig;
    date?: FieldConfig;
    time?: FieldConfig;
    partySize?: FieldConfig;
    specialRequest?: FieldConfig;
  };
}

export const ReservationForm = memo(function ReservationForm({ data }: { data: ReservationFormData }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    date: '',
    time: '',
    partySize: 2,
    specialRequest: '',
  });

  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  // Default field configurations
  const defaultFields = {
    name: { enabled: true, label: 'Họ tên', placeholder: '', required: true },
    email: { enabled: true, label: 'Email', placeholder: '', required: true },
    phone: { enabled: true, label: 'Số điện thoại', placeholder: '', required: true },
    date: { enabled: true, label: 'Ngày', placeholder: '', required: true },
    time: { enabled: true, label: 'Giờ', placeholder: 'Chọn giờ', required: true },
    partySize: { enabled: true, label: 'Số người', placeholder: '', required: true },
    specialRequest: { enabled: true, label: 'Yêu cầu đặc biệt (tùy chọn)', placeholder: 'Vị trí ưa thích, dị ứng thực phẩm, dịp đặc biệt...', required: false },
  };

  // Deep merge to preserve default field properties
  const fields = {
    ...defaultFields,
    ...Object.fromEntries(
      Object.entries(data.fields || {}).map(([key, val]) => [
        key,
        { ...defaultFields[key as keyof typeof defaultFields], ...(typeof val === 'object' && val !== null ? val : {}) }
      ])
    )
  };

  const timeSlots = data.timeSlots || [
    '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
    '17:00', '17:30', '18:00', '18:30', '19:00', '19:30', '20:00', '20:30'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('submitting');

    try {
      const data = await reservationAPI.create({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        date: formData.date,
        time: formData.time,
        guests: formData.partySize,
        notes: formData.specialRequest,
      });

      if (data) {
        setStatus('success');
        setMessage('Đặt bàn thành công! Chúng tôi sẽ liên hệ xác nhận sớm.');
        setFormData({
          name: '',
          email: '',
          phone: '',
          date: '',
          time: '',
          partySize: 2,
          specialRequest: '',
        });
      } else {
        throw new Error('Failed to submit reservation');
      }
    } catch {
      setStatus('error');
      setMessage('Có lỗi xảy ra. Vui lòng thử lại hoặc gọi điện trực tiếp.');
    }
  };

  return (
    <div style={{ maxWidth: 1200, margin: '80px auto', padding: '0 16px' }}>
      <motion.section
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        style={{
          ...glassEffect({ variant: 'strong' }),
          padding: 40,
          borderRadius: tokens.radius.lg,
        }}
      >
      <h2
        style={{
          fontSize: tokens.font.size.h2,
          fontFamily: tokens.font.display,
          color: tokens.color.primary,
          textAlign: 'center',
          marginBottom: 12,
        }}
      >
        {data.title || 'Đặt bàn'}
      </h2>

      {data.description && (
        <p style={{ textAlign: 'center', color: tokens.color.muted, marginBottom: 32, maxWidth: 600, margin: '0 auto 32px' }}>
          {data.description}
        </p>
      )}

      <form onSubmit={handleSubmit} style={{ maxWidth: 600, margin: '0 auto' }}>
        <div style={{ display: 'grid', gap: 20 }}>
          {/* Name & Email Row */}
          {(fields.name?.enabled || fields.email?.enabled) && (
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: fields.name?.enabled && fields.email?.enabled ? '1fr 1fr' : '1fr',
              gap: 16 
            }}>
              {fields.name?.enabled && (
                <div>
                  <label style={{ display: 'block', marginBottom: 8, color: tokens.color.text, fontSize: 14 }}>
                    {fields.name.label}{fields.name.required && ' *'}
                  </label>
                  <input
                    type="text"
                    required={fields.name.required}
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder={fields.name.placeholder}
                    style={{
                      width: '100%',
                      padding: 12,
                      borderRadius: tokens.radius.md,
                      border: `1px solid ${tokens.color.border}`,
                      background: tokens.color.background,
                      color: tokens.color.text,
                      fontSize: 16,
                    }}
                  />
                </div>
              )}

              {fields.email?.enabled && (
                <div>
                  <label style={{ display: 'block', marginBottom: 8, color: tokens.color.text, fontSize: 14 }}>
                    {fields.email.label}{fields.email.required && ' *'}
                  </label>
                  <input
                    type="email"
                    required={fields.email.required}
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder={fields.email.placeholder}
                    style={{
                      width: '100%',
                      padding: 12,
                      borderRadius: tokens.radius.md,
                      border: `1px solid ${tokens.color.border}`,
                      background: tokens.color.background,
                      color: tokens.color.text,
                      fontSize: 16,
                    }}
                  />
                </div>
              )}
            </div>
          )}

          {/* Phone */}
          {fields.phone?.enabled && (
            <div>
              <label style={{ display: 'block', marginBottom: 8, color: tokens.color.text, fontSize: 14 }}>
                {fields.phone.label}{fields.phone.required && ' *'}
              </label>
              <input
                type="tel"
                required={fields.phone.required}
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder={fields.phone.placeholder}
                style={{
                  width: '100%',
                  padding: 12,
                  borderRadius: tokens.radius.md,
                  border: `1px solid ${tokens.color.border}`,
                  background: tokens.color.background,
                  color: tokens.color.text,
                  fontSize: 16,
                }}
              />
            </div>
          )}

          {/* Date, Time, Party Size Row */}
          {(fields.date?.enabled || fields.time?.enabled || fields.partySize?.enabled) && (
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: `repeat(${[fields.date?.enabled, fields.time?.enabled, fields.partySize?.enabled].filter(Boolean).length}, 1fr)`,
              gap: 16 
            }}>
              {fields.date?.enabled && (
                <div>
                  <label style={{ display: 'block', marginBottom: 8, color: tokens.color.text, fontSize: 14 }}>
                    {fields.date.label}{fields.date.required && ' *'}
                  </label>
                  <input
                    type="date"
                    required={fields.date.required}
                    min={new Date().toISOString().split('T')[0]}
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    placeholder={fields.date.placeholder}
                    style={{
                      width: '100%',
                      padding: 12,
                      borderRadius: tokens.radius.md,
                      border: `1px solid ${tokens.color.border}`,
                      background: tokens.color.background,
                      color: tokens.color.text,
                      fontSize: 16,
                    }}
                  />
                </div>
              )}

              {fields.time?.enabled && (
                <div>
                  <label style={{ display: 'block', marginBottom: 8, color: tokens.color.text, fontSize: 14 }}>
                    {fields.time.label}{fields.time.required && ' *'}
                  </label>
                  <select
                    required={fields.time.required}
                    value={formData.time}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                    style={{
                      width: '100%',
                      padding: 12,
                      borderRadius: tokens.radius.md,
                      border: `1px solid ${tokens.color.border}`,
                      background: tokens.color.background,
                      color: tokens.color.text,
                      fontSize: 16,
                    }}
                  >
                    <option value="">{fields.time.placeholder || 'Chọn giờ'}</option>
                    {timeSlots.map((slot) => (
                      <option key={slot} value={slot}>
                        {slot}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {fields.partySize?.enabled && (
                <div>
                  <label style={{ display: 'block', marginBottom: 8, color: tokens.color.text, fontSize: 14 }}>
                    {fields.partySize.label}{fields.partySize.required && ' *'}
                  </label>
                  <select
                    required={fields.partySize.required}
                    value={formData.partySize}
                    onChange={(e) => setFormData({ ...formData, partySize: Number(e.target.value) })}
                    style={{
                      width: '100%',
                      padding: 12,
                      borderRadius: tokens.radius.md,
                      border: `1px solid ${tokens.color.border}`,
                      background: tokens.color.background,
                      color: tokens.color.text,
                      fontSize: 16,
                    }}
                  >
                    {Array.from({ length: data.maxPartySize || 20 }, (_, i) => i + 1).map((n) => (
                      <option key={n} value={n}>
                        {n} {n === 1 ? 'người' : 'người'}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )}

          {/* Special Request */}
          {fields.specialRequest?.enabled && (
            <div>
              <label style={{ display: 'block', marginBottom: 8, color: tokens.color.text, fontSize: 14 }}>
                {fields.specialRequest.label}{fields.specialRequest.required && ' *'}
              </label>
              <textarea
                required={fields.specialRequest.required}
                value={formData.specialRequest}
                onChange={(e) => setFormData({ ...formData, specialRequest: e.target.value })}
                rows={3}
                placeholder={fields.specialRequest.placeholder}
                style={{
                  width: '100%',
                  padding: 12,
                  borderRadius: tokens.radius.md,
                  border: `1px solid ${tokens.color.border}`,
                  background: tokens.color.background,
                  color: tokens.color.text,
                  fontSize: 16,
                  resize: 'vertical',
                }}
              />
            </div>
          )}

          {/* Submit Button */}
          <motion.button
            type="submit"
            disabled={status === 'submitting'}
            whileHover={{ scale: status === 'submitting' ? 1 : 1.02 }}
            whileTap={{ scale: 0.98 }}
            style={{
              padding: '16px 32px',
              borderRadius: tokens.radius.pill,
              border: 'none',
              background: `linear-gradient(135deg, ${tokens.color.primary} 0%, ${tokens.color.accent} 100%)`,
              color: '#111',
              fontSize: 18,
              fontWeight: 700,
              cursor: status === 'submitting' ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 12,
              boxShadow: tokens.shadow.md,
              opacity: status === 'submitting' ? 0.6 : 1,
            }}
          >
            {status === 'submitting' ? (
              <>
                <i className="ri-loader-4-line" style={{ animation: 'spin 1s linear infinite' }} />
                Đang gửi...
              </>
            ) : (
              <>
                <i className="ri-calendar-check-line" />
                {data.submitButtonText || 'Xác nhận đặt bàn'}
              </>
            )}
          </motion.button>

          {/* Status Messages */}
          {status === 'success' && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                padding: 16,
                borderRadius: tokens.radius.md,
                background: 'rgba(52, 211, 153, 0.1)',
                border: `1px solid ${tokens.color.success}`,
                color: tokens.color.success,
                textAlign: 'center',
              }}
            >
              <i className="ri-checkbox-circle-line" style={{ marginRight: 8, fontSize: 20 }} />
              {message}
            </motion.div>
          )}

          {status === 'error' && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                padding: 16,
                borderRadius: tokens.radius.md,
                background: 'rgba(239, 68, 68, 0.1)',
                border: `1px solid ${tokens.color.error}`,
                color: tokens.color.error,
                textAlign: 'center',
              }}
            >
              <i className="ri-error-warning-line" style={{ marginRight: 8, fontSize: 20 }} />
              {message}
            </motion.div>
          )}
        </div>
      </form>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
      </motion.section>
    </div>
  );
});

