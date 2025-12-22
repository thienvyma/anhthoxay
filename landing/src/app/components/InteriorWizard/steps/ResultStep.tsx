/**
 * ResultStep - Step 7: Quote result and save
 */

import { tokens, API_URL } from '@app/shared';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import type { WizardState, QuoteResult } from '../types';
import { ShareQuoteModal } from '../components/ShareQuoteModal';

interface ResultStepProps {
  state: WizardState;
  onQuoteCalculated: (quote: QuoteResult) => void;
  onStartOver: () => void;
  onBack: () => void;
}

export function ResultStep({ state, onQuoteCalculated, onStartOver, onBack }: ResultStepProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quote, setQuote] = useState<QuoteResult | null>(state.quote);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showSaveForm, setShowSaveForm] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
  });

  useEffect(() => {
    if (!quote && state.unit && state.package) {
      calculateQuote();
    } else if (quote) {
      setLoading(false);
    }
  }, []);

  const calculateQuote = async () => {
    if (!state.unit || !state.package || !state.building) return;

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${API_URL}/api/interior/quotes/calculate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          buildingUnitId: state.unit.id,
          floor: state.unit.floor,
          packageId: state.package.id,
        }),
      });

      if (!response.ok) throw new Error('Failed to calculate quote');

      const json = await response.json();
      const data = json.data || json;
      setQuote(data);
      onQuoteCalculated(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!quote || !formData.name || !formData.phone) return;

    try {
      setSaving(true);
      setError(null);

      const response = await fetch(`${API_URL}/api/interior/quotes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          buildingUnitId: state.unit?.id,
          floor: state.unit?.floor,
          packageId: state.package?.id,
          customerName: formData.name,
          customerPhone: formData.phone,
          customerEmail: formData.email || undefined,
        }),
      });

      if (!response.ok) throw new Error('Failed to save quote');

      const json = await response.json();
      const data = json.data || json;
      setQuote({ ...quote, id: data.id, code: data.code });
      setSaved(true);
      setShowSaveForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể lưu báo giá');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem' }}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        >
          <i
            className="ri-loader-4-line"
            style={{ fontSize: '3rem', color: tokens.color.primary }}
          />
        </motion.div>
        <p style={{ color: tokens.color.textMuted, marginTop: '1rem' }}>
          Đang tính toán báo giá...
        </p>
      </div>
    );
  }

  if (error && !quote) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <BackButton onClick={onBack} />
        <i
          className="ri-error-warning-line"
          style={{ fontSize: '3rem', color: tokens.color.error, marginBottom: '1rem' }}
        />
        <p style={{ color: tokens.color.error, marginBottom: '1rem' }}>{error}</p>
        <button onClick={calculateQuote} style={retryButtonStyle}>
          Thử lại
        </button>
      </div>
    );
  }

  // Guard against incomplete quote data (e.g., from corrupted sessionStorage)
  if (!quote || !quote.breakdown || !quote.unitInfo || !quote.packageInfo) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <BackButton onClick={onBack} />
        <i
          className="ri-error-warning-line"
          style={{ fontSize: '3rem', color: tokens.color.warning, marginBottom: '1rem' }}
        />
        <p style={{ color: tokens.color.textMuted, marginBottom: '1rem' }}>
          Dữ liệu báo giá không đầy đủ. Vui lòng tính toán lại.
        </p>
        <button onClick={calculateQuote} style={retryButtonStyle}>
          Tính toán lại
        </button>
      </div>
    );
  }

  return (
    <div>
      <BackButton onClick={onBack} />

      {/* Success Header */}
      <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200 }}
        >
          <i
            className="ri-checkbox-circle-fill"
            style={{ fontSize: '3rem', color: tokens.color.success }}
          />
        </motion.div>
        <h2 style={headerStyle}>Báo Giá Nội Thất</h2>
        {quote.code && (
          <p style={{ color: tokens.color.primary, fontWeight: 600 }}>Mã: {quote.code}</p>
        )}
      </div>

      {/* Unit Summary */}
      <div style={sectionStyle}>
        <h3 style={sectionTitleStyle}>
          <i className="ri-home-4-line" style={{ marginRight: '0.5rem' }} />
          Thông tin căn hộ
        </h3>
        <div style={infoGridStyle}>
          <InfoRow label="Dự án" value={quote.unitInfo.development} />
          <InfoRow label="Tòa nhà" value={quote.unitInfo.building} />
          <InfoRow label="Mã căn" value={quote.unitInfo.unitCode} />
          <InfoRow label="Loại căn" value={quote.unitInfo.unitType} />
          <InfoRow label="Diện tích" value={`${quote.unitInfo.netArea} m²`} />
        </div>
      </div>

      {/* Package Summary */}
      <div style={sectionStyle}>
        <h3 style={sectionTitleStyle}>
          <i className="ri-gift-line" style={{ marginRight: '0.5rem' }} />
          Gói nội thất
        </h3>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div>
            <div style={{ color: tokens.color.text, fontWeight: 600 }}>
              {quote.packageInfo.name}
            </div>
            <div style={{ color: tokens.color.textMuted, fontSize: '0.875rem' }}>
              {quote.packageInfo.tier}
            </div>
          </div>
          <div style={{ color: tokens.color.primary, fontWeight: 600 }}>
            {quote.packageInfo.basePrice.toLocaleString('vi-VN')} đ
          </div>
        </div>
      </div>

      {/* Price Breakdown */}
      <div style={sectionStyle}>
        <h3 style={sectionTitleStyle}>
          <i className="ri-money-dollar-circle-line" style={{ marginRight: '0.5rem' }} />
          Chi tiết giá
        </h3>
        <div style={breakdownStyle}>
          <BreakdownRow label="Giá gói nội thất" value={quote.breakdown.packagePrice} />
          <BreakdownRow label="Chi phí nhân công" value={quote.breakdown.laborCost} />
          {quote.breakdown.surcharges.map((s, i) => (
            <BreakdownRow key={i} label={s.name} value={s.amount} />
          ))}
          {quote.breakdown.managementFee > 0 && (
            <BreakdownRow label="Phí quản lý" value={quote.breakdown.managementFee} />
          )}
          {quote.breakdown.contingency > 0 && (
            <BreakdownRow label="Chi phí dự phòng" value={quote.breakdown.contingency} />
          )}
          <div style={subtotalRowStyle}>
            <span>Tạm tính</span>
            <span>{quote.breakdown.subtotal.toLocaleString('vi-VN')} đ</span>
          </div>
          {quote.breakdown.vat > 0 && (
            <BreakdownRow label="VAT (10%)" value={quote.breakdown.vat} />
          )}
          {quote.breakdown.discount > 0 && (
            <BreakdownRow
              label="Giảm giá"
              value={-quote.breakdown.discount}
              isDiscount
            />
          )}
          <div style={totalRowStyle}>
            <span>Tổng cộng</span>
            <span>{quote.breakdown.grandTotal.toLocaleString('vi-VN')} đ</span>
          </div>
          <div style={pricePerSqmStyle}>
            <span>Giá/m²</span>
            <span>{quote.breakdown.pricePerSqm.toLocaleString('vi-VN')} đ/m²</span>
          </div>
        </div>
      </div>

      {/* Validity */}
      {quote.validUntil && (
        <div style={validityStyle}>
          <i className="ri-time-line" style={{ marginRight: '0.5rem' }} />
          Báo giá có hiệu lực đến: {new Date(quote.validUntil).toLocaleDateString('vi-VN')}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div style={errorStyle}>
          <i className="ri-error-warning-line" style={{ marginRight: '0.5rem' }} />
          {error}
        </div>
      )}

      {/* Save Form */}
      {showSaveForm && !saved && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={saveFormStyle}
        >
          <h4 style={{ margin: '0 0 1rem', color: tokens.color.text }}>
            Lưu báo giá
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <input
              type="text"
              placeholder="Họ tên *"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              style={inputStyle}
            />
            <input
              type="tel"
              placeholder="Số điện thoại *"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              style={inputStyle}
            />
            <input
              type="email"
              placeholder="Email (không bắt buộc)"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              style={inputStyle}
            />
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={() => setShowSaveForm(false)}
                style={cancelButtonStyle}
              >
                Hủy
              </button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSave}
                disabled={!formData.name || !formData.phone || saving}
                style={{
                  ...saveButtonStyle,
                  opacity: !formData.name || !formData.phone || saving ? 0.5 : 1,
                }}
              >
                {saving ? 'Đang lưu...' : 'Lưu báo giá'}
              </motion.button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Saved Success */}
      {saved && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          style={savedSuccessStyle}
        >
          <i className="ri-checkbox-circle-fill" style={{ marginRight: '0.5rem' }} />
          Đã lưu báo giá thành công!
        </motion.div>
      )}

      {/* Actions */}
      <div style={actionsStyle}>
        {!saved && !showSaveForm && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowSaveForm(true)}
            style={primaryButtonStyle}
          >
            <i className="ri-save-line" style={{ marginRight: '0.5rem' }} />
            Lưu báo giá
          </motion.button>
        )}
        {saved && quote?.code && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowShareModal(true)}
            style={primaryButtonStyle}
          >
            <i className="ri-share-line" style={{ marginRight: '0.5rem' }} />
            Chia sẻ
          </motion.button>
        )}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onStartOver}
          style={secondaryButtonStyle}
        >
          <i className="ri-refresh-line" style={{ marginRight: '0.5rem' }} />
          Làm lại
        </motion.button>
      </div>

      {/* Share Modal */}
      {showShareModal && quote?.code && (
        <ShareQuoteModal
          quoteCode={quote.code}
          onClose={() => setShowShareModal(false)}
        />
      )}
    </div>
  );
}

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        background: 'transparent',
        border: 'none',
        color: tokens.color.textMuted,
        cursor: 'pointer',
        marginBottom: '1rem',
        padding: '0.5rem',
        fontSize: '0.875rem',
      }}
    >
      <i className="ri-arrow-left-line" />
      Quay lại
    </motion.button>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
      <span style={{ color: tokens.color.textMuted }}>{label}</span>
      <span style={{ color: tokens.color.text, fontWeight: 500 }}>{value}</span>
    </div>
  );
}

function BreakdownRow({
  label,
  value,
  isDiscount,
}: {
  label: string;
  value: number;
  isDiscount?: boolean;
}) {
  return (
    <div style={breakdownRowStyle}>
      <span style={{ color: tokens.color.textMuted }}>{label}</span>
      <span style={{ color: isDiscount ? tokens.color.success : tokens.color.text }}>
        {isDiscount ? '-' : ''}
        {Math.abs(value).toLocaleString('vi-VN')} đ
      </span>
    </div>
  );
}

const headerStyle: React.CSSProperties = {
  fontSize: '1.5rem',
  fontWeight: 600,
  color: tokens.color.text,
  margin: '0.5rem 0',
};

const sectionStyle: React.CSSProperties = {
  background: tokens.color.surface,
  borderRadius: tokens.radius.lg,
  padding: '1rem',
  marginBottom: '1rem',
};

const sectionTitleStyle: React.CSSProperties = {
  margin: '0 0 0.75rem',
  color: tokens.color.text,
  fontSize: '0.875rem',
  fontWeight: 600,
  display: 'flex',
  alignItems: 'center',
};

const infoGridStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.5rem',
};

const breakdownStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.5rem',
};

const breakdownRowStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  fontSize: '0.875rem',
};

const subtotalRowStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  fontSize: '0.875rem',
  paddingTop: '0.5rem',
  borderTop: `1px solid ${tokens.color.border}`,
  color: tokens.color.text,
};

const totalRowStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  fontSize: '1.125rem',
  fontWeight: 700,
  paddingTop: '0.5rem',
  borderTop: `1px solid ${tokens.color.border}`,
  color: tokens.color.primary,
};

const pricePerSqmStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  fontSize: '0.75rem',
  color: tokens.color.textMuted,
};

const validityStyle: React.CSSProperties = {
  background: `${tokens.color.warning}15`,
  border: `1px solid ${tokens.color.warning}30`,
  borderRadius: tokens.radius.md,
  padding: '0.75rem',
  color: tokens.color.warning,
  fontSize: '0.875rem',
  marginBottom: '1rem',
  display: 'flex',
  alignItems: 'center',
};

const errorStyle: React.CSSProperties = {
  background: `${tokens.color.error}15`,
  border: `1px solid ${tokens.color.error}30`,
  borderRadius: tokens.radius.md,
  padding: '0.75rem',
  color: tokens.color.error,
  fontSize: '0.875rem',
  marginBottom: '1rem',
  display: 'flex',
  alignItems: 'center',
};

const saveFormStyle: React.CSSProperties = {
  background: tokens.color.surface,
  borderRadius: tokens.radius.lg,
  padding: '1rem',
  marginBottom: '1rem',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.75rem 1rem',
  background: tokens.color.background,
  border: `1px solid ${tokens.color.border}`,
  borderRadius: tokens.radius.md,
  color: tokens.color.text,
  fontSize: '1rem',
  outline: 'none',
};

const savedSuccessStyle: React.CSSProperties = {
  background: `${tokens.color.success}15`,
  border: `1px solid ${tokens.color.success}30`,
  borderRadius: tokens.radius.md,
  padding: '1rem',
  color: tokens.color.success,
  fontSize: '0.875rem',
  marginBottom: '1rem',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontWeight: 500,
};

const actionsStyle: React.CSSProperties = {
  display: 'flex',
  gap: 'clamp(0.5rem, 2vw, 0.75rem)',
  flexWrap: 'wrap',
};

const primaryButtonStyle: React.CSSProperties = {
  flex: 1,
  padding: 'clamp(0.75rem, 2vw, 1rem)',
  background: tokens.color.primary,
  border: 'none',
  borderRadius: tokens.radius.md,
  color: tokens.color.background,
  fontSize: 'clamp(0.875rem, 2vw, 1rem)',
  fontWeight: 600,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: '44px', // Touch target
};

const secondaryButtonStyle: React.CSSProperties = {
  flex: 1,
  padding: 'clamp(0.75rem, 2vw, 1rem)',
  background: 'transparent',
  border: `1px solid ${tokens.color.border}`,
  borderRadius: tokens.radius.md,
  color: tokens.color.text,
  fontSize: 'clamp(0.875rem, 2vw, 1rem)',
  fontWeight: 500,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: '44px', // Touch target
};

const cancelButtonStyle: React.CSSProperties = {
  flex: 1,
  padding: '0.75rem',
  background: 'transparent',
  border: `1px solid ${tokens.color.border}`,
  borderRadius: tokens.radius.md,
  color: tokens.color.textMuted,
  fontSize: '0.875rem',
  cursor: 'pointer',
};

const saveButtonStyle: React.CSSProperties = {
  flex: 2,
  padding: '0.75rem',
  background: tokens.color.primary,
  border: 'none',
  borderRadius: tokens.radius.md,
  color: tokens.color.background,
  fontSize: '0.875rem',
  fontWeight: 600,
  cursor: 'pointer',
  minHeight: '44px', // Touch target
};

const retryButtonStyle: React.CSSProperties = {
  padding: '0.75rem 1.5rem',
  background: tokens.color.primary,
  color: tokens.color.background,
  border: 'none',
  borderRadius: tokens.radius.md,
  cursor: 'pointer',
  fontWeight: 500,
  minHeight: '44px', // Touch target
};

export default ResultStep;
