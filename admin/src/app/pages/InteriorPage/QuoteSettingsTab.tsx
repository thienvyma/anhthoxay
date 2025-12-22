/**
 * Quote Settings Tab - Configure quote calculation settings
 * Task 27.1: Full implementation with form
 * Requirements: 9.1-9.7
 */

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { tokens } from '@app/shared';
import { interiorSettingsApi } from '../../api';
import type { InteriorQuoteSettings, UpdateQuoteSettingsInput, InteriorFeeType } from '../../types';

const FEE_TYPES: { value: InteriorFeeType; label: string }[] = [
  { value: 'FIXED', label: 'Cố định (VNĐ)' },
  { value: 'PERCENTAGE', label: 'Phần trăm (%)' },
];

export function QuoteSettingsTab() {
  const [, setSettings] = useState<InteriorQuoteSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [form, setForm] = useState<UpdateQuoteSettingsInput>({
    laborCostPerSqm: 500000,
    laborCostMin: undefined,
    laborCostMax: undefined,
    managementFeeType: 'PERCENTAGE',
    managementFeeValue: 5,
    contingencyType: 'PERCENTAGE',
    contingencyValue: 3,
    vatEnabled: true,
    vatPercent: 10,
    maxDiscountPercent: 15,
    quoteValidityDays: 30,
    showItemBreakdown: true,
    showRoomBreakdown: true,
    showPricePerSqm: true,
    companyName: '',
    companyPhone: '',
    companyEmail: '',
    companyAddress: '',
  });

  // Load settings
  const loadSettings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await interiorSettingsApi.get();
      setSettings(data);
      setForm({
        laborCostPerSqm: data.laborCostPerSqm,
        laborCostMin: data.laborCostMin,
        laborCostMax: data.laborCostMax,
        managementFeeType: data.managementFeeType,
        managementFeeValue: data.managementFeeValue,
        contingencyType: data.contingencyType,
        contingencyValue: data.contingencyValue,
        vatEnabled: data.vatEnabled,
        vatPercent: data.vatPercent,
        maxDiscountPercent: data.maxDiscountPercent,
        quoteValidityDays: data.quoteValidityDays,
        showItemBreakdown: data.showItemBreakdown,
        showRoomBreakdown: data.showRoomBreakdown,
        showPricePerSqm: data.showPricePerSqm,
        companyName: data.companyName || '',
        companyPhone: data.companyPhone || '',
        companyEmail: data.companyEmail || '',
        companyAddress: data.companyAddress || '',
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể tải cấu hình');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  // Save settings
  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(false);
    try {
      const updated = await interiorSettingsApi.update(form);
      setSettings(updated);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể lưu cấu hình');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        <motion.i
          className="ri-loader-4-line"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          style={{ fontSize: 32, color: tokens.color.muted }}
        />
        <p style={{ color: tokens.color.muted, marginTop: 12 }}>Đang tải cấu hình...</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <h3 style={{ margin: 0, color: tokens.color.text, fontSize: 16, fontWeight: 600 }}>
          <i className="ri-settings-3-line" style={{ marginRight: 8 }} />
          Cấu hình Báo giá
        </h3>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleSave}
          disabled={saving}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '10px 20px',
            background: `linear-gradient(135deg, ${tokens.color.primary}, ${tokens.color.accent})`,
            border: 'none',
            borderRadius: tokens.radius.md,
            color: '#111',
            fontSize: 14,
            fontWeight: 600,
            cursor: saving ? 'not-allowed' : 'pointer',
            opacity: saving ? 0.7 : 1,
          }}
        >
          {saving ? (
            <>
              <motion.i className="ri-loader-4-line" animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} />
              Đang lưu...
            </>
          ) : (
            <>
              <i className="ri-save-line" />
              Lưu cấu hình
            </>
          )}
        </motion.button>
      </div>

      {/* Messages */}
      {error && (
        <div style={{ padding: '12px 16px', background: `${tokens.color.error}20`, border: `1px solid ${tokens.color.error}40`, borderRadius: tokens.radius.md, color: tokens.color.error, fontSize: 13, marginBottom: 16 }}>
          <i className="ri-error-warning-line" style={{ marginRight: 8 }} />
          {error}
        </div>
      )}
      {success && (
        <div style={{ padding: '12px 16px', background: `${tokens.color.success}20`, border: `1px solid ${tokens.color.success}40`, borderRadius: tokens.radius.md, color: tokens.color.success, fontSize: 13, marginBottom: 16 }}>
          <i className="ri-checkbox-circle-line" style={{ marginRight: 8 }} />
          Đã lưu cấu hình thành công!
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Labor Cost Section */}
        <div style={{ background: tokens.color.surface, borderRadius: tokens.radius.lg, border: `1px solid ${tokens.color.border}`, padding: 20 }}>
          <h4 style={{ margin: '0 0 16px', color: tokens.color.text, fontSize: 14, fontWeight: 600 }}>
            <i className="ri-hammer-line" style={{ marginRight: 8 }} />
            Chi phí nhân công
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            <div>
              <label style={{ display: 'block', color: tokens.color.muted, fontSize: 13, marginBottom: 6 }}>
                Đơn giá/m² (VNĐ)
              </label>
              <input
                type="number"
                value={form.laborCostPerSqm || ''}
                onChange={(e) => setForm((prev) => ({ ...prev, laborCostPerSqm: parseFloat(e.target.value) || 0 }))}
                min={0}
                step={10000}
                style={{ width: '100%', padding: '10px 12px', borderRadius: tokens.radius.md, border: `1px solid ${tokens.color.border}`, background: tokens.color.background, color: tokens.color.text, fontSize: 14, outline: 'none' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', color: tokens.color.muted, fontSize: 13, marginBottom: 6 }}>
                Tối thiểu (VNĐ)
              </label>
              <input
                type="number"
                value={form.laborCostMin || ''}
                onChange={(e) => setForm((prev) => ({ ...prev, laborCostMin: e.target.value ? parseFloat(e.target.value) : undefined }))}
                min={0}
                step={100000}
                placeholder="Không giới hạn"
                style={{ width: '100%', padding: '10px 12px', borderRadius: tokens.radius.md, border: `1px solid ${tokens.color.border}`, background: tokens.color.background, color: tokens.color.text, fontSize: 14, outline: 'none' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', color: tokens.color.muted, fontSize: 13, marginBottom: 6 }}>
                Tối đa (VNĐ)
              </label>
              <input
                type="number"
                value={form.laborCostMax || ''}
                onChange={(e) => setForm((prev) => ({ ...prev, laborCostMax: e.target.value ? parseFloat(e.target.value) : undefined }))}
                min={0}
                step={100000}
                placeholder="Không giới hạn"
                style={{ width: '100%', padding: '10px 12px', borderRadius: tokens.radius.md, border: `1px solid ${tokens.color.border}`, background: tokens.color.background, color: tokens.color.text, fontSize: 14, outline: 'none' }}
              />
            </div>
          </div>
        </div>

        {/* Management Fee Section */}
        <div style={{ background: tokens.color.surface, borderRadius: tokens.radius.lg, border: `1px solid ${tokens.color.border}`, padding: 20 }}>
          <h4 style={{ margin: '0 0 16px', color: tokens.color.text, fontSize: 14, fontWeight: 600 }}>
            <i className="ri-briefcase-line" style={{ marginRight: 8 }} />
            Phí quản lý
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <label style={{ display: 'block', color: tokens.color.muted, fontSize: 13, marginBottom: 6 }}>Loại</label>
              <select
                value={form.managementFeeType}
                onChange={(e) => setForm((prev) => ({ ...prev, managementFeeType: e.target.value as InteriorFeeType }))}
                style={{ width: '100%', padding: '10px 12px', borderRadius: tokens.radius.md, border: `1px solid ${tokens.color.border}`, background: tokens.color.background, color: tokens.color.text, fontSize: 14, outline: 'none' }}
              >
                {FEE_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', color: tokens.color.muted, fontSize: 13, marginBottom: 6 }}>
                Giá trị {form.managementFeeType === 'PERCENTAGE' ? '(%)' : '(VNĐ)'}
              </label>
              <input
                type="number"
                value={form.managementFeeValue || ''}
                onChange={(e) => setForm((prev) => ({ ...prev, managementFeeValue: parseFloat(e.target.value) || 0 }))}
                min={0}
                step={form.managementFeeType === 'PERCENTAGE' ? 0.5 : 100000}
                style={{ width: '100%', padding: '10px 12px', borderRadius: tokens.radius.md, border: `1px solid ${tokens.color.border}`, background: tokens.color.background, color: tokens.color.text, fontSize: 14, outline: 'none' }}
              />
            </div>
          </div>
        </div>

        {/* Contingency Section */}
        <div style={{ background: tokens.color.surface, borderRadius: tokens.radius.lg, border: `1px solid ${tokens.color.border}`, padding: 20 }}>
          <h4 style={{ margin: '0 0 16px', color: tokens.color.text, fontSize: 14, fontWeight: 600 }}>
            <i className="ri-shield-check-line" style={{ marginRight: 8 }} />
            Chi phí dự phòng
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <label style={{ display: 'block', color: tokens.color.muted, fontSize: 13, marginBottom: 6 }}>Loại</label>
              <select
                value={form.contingencyType}
                onChange={(e) => setForm((prev) => ({ ...prev, contingencyType: e.target.value as InteriorFeeType }))}
                style={{ width: '100%', padding: '10px 12px', borderRadius: tokens.radius.md, border: `1px solid ${tokens.color.border}`, background: tokens.color.background, color: tokens.color.text, fontSize: 14, outline: 'none' }}
              >
                {FEE_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', color: tokens.color.muted, fontSize: 13, marginBottom: 6 }}>
                Giá trị {form.contingencyType === 'PERCENTAGE' ? '(%)' : '(VNĐ)'}
              </label>
              <input
                type="number"
                value={form.contingencyValue || ''}
                onChange={(e) => setForm((prev) => ({ ...prev, contingencyValue: parseFloat(e.target.value) || 0 }))}
                min={0}
                step={form.contingencyType === 'PERCENTAGE' ? 0.5 : 100000}
                style={{ width: '100%', padding: '10px 12px', borderRadius: tokens.radius.md, border: `1px solid ${tokens.color.border}`, background: tokens.color.background, color: tokens.color.text, fontSize: 14, outline: 'none' }}
              />
            </div>
          </div>
        </div>

        {/* VAT Section */}
        <div style={{ background: tokens.color.surface, borderRadius: tokens.radius.lg, border: `1px solid ${tokens.color.border}`, padding: 20 }}>
          <h4 style={{ margin: '0 0 16px', color: tokens.color.text, fontSize: 14, fontWeight: 600 }}>
            <i className="ri-percent-line" style={{ marginRight: 8 }} />
            Thuế VAT
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <input
                type="checkbox"
                id="vatEnabled"
                checked={form.vatEnabled}
                onChange={(e) => setForm((prev) => ({ ...prev, vatEnabled: e.target.checked }))}
                style={{ width: 18, height: 18, cursor: 'pointer' }}
              />
              <label htmlFor="vatEnabled" style={{ color: tokens.color.text, fontSize: 14, cursor: 'pointer' }}>
                Áp dụng VAT
              </label>
            </div>
            <div>
              <label style={{ display: 'block', color: tokens.color.muted, fontSize: 13, marginBottom: 6 }}>
                Phần trăm VAT (%)
              </label>
              <input
                type="number"
                value={form.vatPercent || ''}
                onChange={(e) => setForm((prev) => ({ ...prev, vatPercent: parseFloat(e.target.value) || 0 }))}
                min={0}
                max={100}
                step={0.5}
                disabled={!form.vatEnabled}
                style={{ width: '100%', padding: '10px 12px', borderRadius: tokens.radius.md, border: `1px solid ${tokens.color.border}`, background: tokens.color.background, color: tokens.color.text, fontSize: 14, outline: 'none', opacity: form.vatEnabled ? 1 : 0.5 }}
              />
            </div>
          </div>
        </div>

        {/* Discount & Validity Section */}
        <div style={{ background: tokens.color.surface, borderRadius: tokens.radius.lg, border: `1px solid ${tokens.color.border}`, padding: 20 }}>
          <h4 style={{ margin: '0 0 16px', color: tokens.color.text, fontSize: 14, fontWeight: 600 }}>
            <i className="ri-coupon-line" style={{ marginRight: 8 }} />
            Giảm giá & Hiệu lực
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <label style={{ display: 'block', color: tokens.color.muted, fontSize: 13, marginBottom: 6 }}>
                Giảm giá tối đa (%)
              </label>
              <input
                type="number"
                value={form.maxDiscountPercent || ''}
                onChange={(e) => setForm((prev) => ({ ...prev, maxDiscountPercent: e.target.value ? parseFloat(e.target.value) : undefined }))}
                min={0}
                max={100}
                step={1}
                placeholder="Không giới hạn"
                style={{ width: '100%', padding: '10px 12px', borderRadius: tokens.radius.md, border: `1px solid ${tokens.color.border}`, background: tokens.color.background, color: tokens.color.text, fontSize: 14, outline: 'none' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', color: tokens.color.muted, fontSize: 13, marginBottom: 6 }}>
                Hiệu lực báo giá (ngày)
              </label>
              <input
                type="number"
                value={form.quoteValidityDays || ''}
                onChange={(e) => setForm((prev) => ({ ...prev, quoteValidityDays: parseInt(e.target.value) || 30 }))}
                min={1}
                max={365}
                style={{ width: '100%', padding: '10px 12px', borderRadius: tokens.radius.md, border: `1px solid ${tokens.color.border}`, background: tokens.color.background, color: tokens.color.text, fontSize: 14, outline: 'none' }}
              />
            </div>
          </div>
        </div>

        {/* Display Options Section */}
        <div style={{ background: tokens.color.surface, borderRadius: tokens.radius.lg, border: `1px solid ${tokens.color.border}`, padding: 20 }}>
          <h4 style={{ margin: '0 0 16px', color: tokens.color.text, fontSize: 14, fontWeight: 600 }}>
            <i className="ri-eye-line" style={{ marginRight: 8 }} />
            Tùy chọn hiển thị
          </h4>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <input
                type="checkbox"
                id="showItemBreakdown"
                checked={form.showItemBreakdown}
                onChange={(e) => setForm((prev) => ({ ...prev, showItemBreakdown: e.target.checked }))}
                style={{ width: 18, height: 18, cursor: 'pointer' }}
              />
              <label htmlFor="showItemBreakdown" style={{ color: tokens.color.text, fontSize: 14, cursor: 'pointer' }}>
                Hiển thị chi tiết sản phẩm
              </label>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <input
                type="checkbox"
                id="showRoomBreakdown"
                checked={form.showRoomBreakdown}
                onChange={(e) => setForm((prev) => ({ ...prev, showRoomBreakdown: e.target.checked }))}
                style={{ width: 18, height: 18, cursor: 'pointer' }}
              />
              <label htmlFor="showRoomBreakdown" style={{ color: tokens.color.text, fontSize: 14, cursor: 'pointer' }}>
                Hiển thị theo phòng
              </label>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <input
                type="checkbox"
                id="showPricePerSqm"
                checked={form.showPricePerSqm}
                onChange={(e) => setForm((prev) => ({ ...prev, showPricePerSqm: e.target.checked }))}
                style={{ width: 18, height: 18, cursor: 'pointer' }}
              />
              <label htmlFor="showPricePerSqm" style={{ color: tokens.color.text, fontSize: 14, cursor: 'pointer' }}>
                Hiển thị giá/m²
              </label>
            </div>
          </div>
        </div>

        {/* Company Info Section */}
        <div style={{ background: tokens.color.surface, borderRadius: tokens.radius.lg, border: `1px solid ${tokens.color.border}`, padding: 20 }}>
          <h4 style={{ margin: '0 0 16px', color: tokens.color.text, fontSize: 14, fontWeight: 600 }}>
            <i className="ri-building-line" style={{ marginRight: 8 }} />
            Thông tin công ty
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <label style={{ display: 'block', color: tokens.color.muted, fontSize: 13, marginBottom: 6 }}>Tên công ty</label>
              <input
                type="text"
                value={form.companyName || ''}
                onChange={(e) => setForm((prev) => ({ ...prev, companyName: e.target.value }))}
                placeholder="VD: Anh Thợ Xây"
                style={{ width: '100%', padding: '10px 12px', borderRadius: tokens.radius.md, border: `1px solid ${tokens.color.border}`, background: tokens.color.background, color: tokens.color.text, fontSize: 14, outline: 'none' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', color: tokens.color.muted, fontSize: 13, marginBottom: 6 }}>Số điện thoại</label>
              <input
                type="text"
                value={form.companyPhone || ''}
                onChange={(e) => setForm((prev) => ({ ...prev, companyPhone: e.target.value }))}
                placeholder="VD: 0901234567"
                style={{ width: '100%', padding: '10px 12px', borderRadius: tokens.radius.md, border: `1px solid ${tokens.color.border}`, background: tokens.color.background, color: tokens.color.text, fontSize: 14, outline: 'none' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', color: tokens.color.muted, fontSize: 13, marginBottom: 6 }}>Email</label>
              <input
                type="email"
                value={form.companyEmail || ''}
                onChange={(e) => setForm((prev) => ({ ...prev, companyEmail: e.target.value }))}
                placeholder="VD: contact@anhthoxay.vn"
                style={{ width: '100%', padding: '10px 12px', borderRadius: tokens.radius.md, border: `1px solid ${tokens.color.border}`, background: tokens.color.background, color: tokens.color.text, fontSize: 14, outline: 'none' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', color: tokens.color.muted, fontSize: 13, marginBottom: 6 }}>Địa chỉ</label>
              <input
                type="text"
                value={form.companyAddress || ''}
                onChange={(e) => setForm((prev) => ({ ...prev, companyAddress: e.target.value }))}
                placeholder="VD: 123 Nguyễn Văn A, Q.1, TP.HCM"
                style={{ width: '100%', padding: '10px 12px', borderRadius: tokens.radius.md, border: `1px solid ${tokens.color.border}`, background: tokens.color.background, color: tokens.color.text, fontSize: 14, outline: 'none' }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}