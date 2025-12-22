/**
 * Surcharges Tab - Manage surcharges with conditions
 * Task 26.1: Full implementation with table and CRUD
 * Requirements: 8.1-8.6
 */

import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { tokens } from '@app/shared';
import { interiorSurchargesApi, interiorBuildingsApi, interiorDevelopmentsApi } from '../../api';
import type {
  InteriorSurcharge,
  CreateSurchargeInput,
  UpdateSurchargeInput,
  SurchargeType,
  SurchargeConditions,
  UnitType,
  UnitPosition,
  InteriorBuilding,
  InteriorDevelopment,
} from '../../types';

const SURCHARGE_TYPES: { value: SurchargeType; label: string; description: string }[] = [
  { value: 'FIXED', label: 'Cố định', description: 'Số tiền cố định' },
  { value: 'PERCENTAGE', label: 'Phần trăm', description: '% trên tổng giá gói' },
  { value: 'PER_FLOOR', label: 'Theo tầng', description: 'Số tiền × số tầng' },
  { value: 'PER_SQM', label: 'Theo m²', description: 'Số tiền × diện tích' },
  { value: 'CONDITIONAL', label: 'Có điều kiện', description: 'Áp dụng khi thỏa điều kiện' },
];

const UNIT_TYPES: { value: UnitType; label: string }[] = [
  { value: 'STUDIO', label: 'Studio' },
  { value: '1PN', label: '1 Phòng ngủ' },
  { value: '2PN', label: '2 Phòng ngủ' },
  { value: '3PN', label: '3 Phòng ngủ' },
  { value: '4PN', label: '4 Phòng ngủ' },
  { value: 'PENTHOUSE', label: 'Penthouse' },
  { value: 'DUPLEX', label: 'Duplex' },
  { value: 'SHOPHOUSE', label: 'Shophouse' },
];

const POSITIONS: { value: UnitPosition; label: string }[] = [
  { value: 'CORNER', label: 'Góc' },
  { value: 'EDGE', label: 'Biên' },
  { value: 'MIDDLE', label: 'Giữa' },
];

// ========== SURCHARGE MODAL ==========

interface SurchargeModalProps {
  surcharge?: InteriorSurcharge | null;
  buildings: InteriorBuilding[];
  developments: InteriorDevelopment[];
  onClose: () => void;
  onSave: (data: CreateSurchargeInput | UpdateSurchargeInput) => Promise<void>;
}

function SurchargeModal({ surcharge, buildings, developments, onClose, onSave }: SurchargeModalProps) {
  const [form, setForm] = useState<CreateSurchargeInput>({
    name: surcharge?.name || '',
    code: surcharge?.code || '',
    type: surcharge?.type || 'FIXED',
    value: surcharge?.value || 0,
    conditions: surcharge?.conditions || {},
    description: surcharge?.description || '',
    isAutoApply: surcharge?.isAutoApply ?? true,
    isOptional: surcharge?.isOptional ?? false,
    isActive: surcharge?.isActive ?? true,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.code.trim()) {
      setError('Vui lòng nhập tên và mã phụ phí');
      return;
    }
    if (form.value <= 0) {
      setError('Giá trị phải lớn hơn 0');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onSave(form);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Có lỗi xảy ra');
    } finally {
      setSaving(false);
    }
  };

  const updateCondition = useCallback(
    <K extends keyof SurchargeConditions>(field: K, value: SurchargeConditions[K]) => {
      setForm((prev) => ({
        ...prev,
        conditions: { ...prev.conditions, [field]: value },
      }));
    },
    []
  );

  const toggleArrayCondition = useCallback(
    <K extends 'unitTypes' | 'positions' | 'buildings' | 'developments'>(
      field: K,
      value: string
    ) => {
      setForm((prev) => {
        const arr = (prev.conditions?.[field] as string[] | undefined) || [];
        const newArr = arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value];
        return {
          ...prev,
          conditions: { ...prev.conditions, [field]: newArr.length > 0 ? newArr : undefined },
        };
      });
    },
    []
  );

  return createPortal(
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 9998 }}
      />
      <div
        style={{
          position: 'fixed',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          pointerEvents: 'none',
          padding: 16,
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          onClick={(e) => e.stopPropagation()}
          style={{
            width: 'min(700px, 95vw)',
            maxHeight: '90vh',
            overflow: 'auto',
            background: tokens.color.surface,
            borderRadius: tokens.radius.lg,
            border: `1px solid ${tokens.color.border}`,
            pointerEvents: 'auto',
          }}
        >
          <div
          style={{
            padding: '16px 20px',
            borderBottom: `1px solid ${tokens.color.border}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            position: 'sticky',
            top: 0,
            background: tokens.color.surface,
            zIndex: 1,
          }}
        >
          <h3 style={{ margin: 0, color: tokens.color.text, fontSize: 16, fontWeight: 600 }}>
            {surcharge ? 'Chỉnh sửa Phụ phí' : 'Thêm Phụ phí mới'}
          </h3>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: tokens.color.muted, cursor: 'pointer', padding: 4 }}
          >
            <i className="ri-close-line" style={{ fontSize: 20 }} />
          </motion.button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: 20 }}>
          {error && (
            <div
              style={{
                padding: '10px 12px',
                background: `${tokens.color.error}20`,
                border: `1px solid ${tokens.color.error}40`,
                borderRadius: tokens.radius.md,
                color: tokens.color.error,
                fontSize: 13,
                marginBottom: 16,
              }}
            >
              {error}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Name & Code */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12 }}>
              <div>
                <label style={{ display: 'block', color: tokens.color.muted, fontSize: 13, marginBottom: 6 }}>
                  Tên phụ phí <span style={{ color: tokens.color.error }}>*</span>
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="VD: Phụ phí tầng cao"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: tokens.radius.md,
                    border: `1px solid ${tokens.color.border}`,
                    background: tokens.color.background,
                    color: tokens.color.text,
                    fontSize: 14,
                    outline: 'none',
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', color: tokens.color.muted, fontSize: 13, marginBottom: 6 }}>
                  Mã <span style={{ color: tokens.color.error }}>*</span>
                </label>
                <input
                  type="text"
                  value={form.code}
                  onChange={(e) => setForm((prev) => ({ ...prev, code: e.target.value.toUpperCase() }))}
                  placeholder="VD: HIGH_FLOOR"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: tokens.radius.md,
                    border: `1px solid ${tokens.color.border}`,
                    background: tokens.color.background,
                    color: tokens.color.text,
                    fontSize: 14,
                    outline: 'none',
                  }}
                />
              </div>
            </div>

            {/* Type & Value */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ display: 'block', color: tokens.color.muted, fontSize: 13, marginBottom: 6 }}>
                  Loại phụ phí
                </label>
                <select
                  value={form.type}
                  onChange={(e) => setForm((prev) => ({ ...prev, type: e.target.value as SurchargeType }))}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: tokens.radius.md,
                    border: `1px solid ${tokens.color.border}`,
                    background: tokens.color.background,
                    color: tokens.color.text,
                    fontSize: 14,
                    outline: 'none',
                  }}
                >
                  {SURCHARGE_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label} - {t.description}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', color: tokens.color.muted, fontSize: 13, marginBottom: 6 }}>
                  Giá trị <span style={{ color: tokens.color.error }}>*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="number"
                    value={form.value || ''}
                    onChange={(e) => setForm((prev) => ({ ...prev, value: parseFloat(e.target.value) || 0 }))}
                    min={0}
                    step={form.type === 'PERCENTAGE' ? 0.1 : 1000}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      paddingRight: 50,
                      borderRadius: tokens.radius.md,
                      border: `1px solid ${tokens.color.border}`,
                      background: tokens.color.background,
                      color: tokens.color.text,
                      fontSize: 14,
                      outline: 'none',
                    }}
                  />
                  <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: tokens.color.muted, fontSize: 13 }}>
                    {form.type === 'PERCENTAGE' ? '%' : 'đ'}
                  </span>
                </div>
              </div>
            </div>

            {/* Description */}
            <div>
              <label style={{ display: 'block', color: tokens.color.muted, fontSize: 13, marginBottom: 6 }}>
                Mô tả
              </label>
              <textarea
                value={form.description || ''}
                onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Mô tả phụ phí..."
                rows={2}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: tokens.radius.md,
                  border: `1px solid ${tokens.color.border}`,
                  background: tokens.color.background,
                  color: tokens.color.text,
                  fontSize: 14,
                  outline: 'none',
                  resize: 'vertical',
                }}
              />
            </div>

            {/* Conditions Section */}
            <div
              style={{
                padding: 16,
                background: 'rgba(255,255,255,0.02)',
                borderRadius: tokens.radius.md,
                border: `1px solid ${tokens.color.border}`,
              }}
            >
              <h4 style={{ margin: '0 0 12px', color: tokens.color.text, fontSize: 14, fontWeight: 600 }}>
                <i className="ri-filter-line" style={{ marginRight: 8 }} />
                Điều kiện áp dụng
              </h4>

              {/* Floor Range */}
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', color: tokens.color.muted, fontSize: 12, marginBottom: 6 }}>
                  Phạm vi tầng
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <input
                    type="number"
                    value={form.conditions?.minFloor || ''}
                    onChange={(e) => updateCondition('minFloor', e.target.value ? parseInt(e.target.value) : undefined)}
                    placeholder="Từ tầng"
                    min={1}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: tokens.radius.sm, border: `1px solid ${tokens.color.border}`, background: tokens.color.background, color: tokens.color.text, fontSize: 13, outline: 'none' }}
                  />
                  <input
                    type="number"
                    value={form.conditions?.maxFloor || ''}
                    onChange={(e) => updateCondition('maxFloor', e.target.value ? parseInt(e.target.value) : undefined)}
                    placeholder="Đến tầng"
                    min={1}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: tokens.radius.sm, border: `1px solid ${tokens.color.border}`, background: tokens.color.background, color: tokens.color.text, fontSize: 13, outline: 'none' }}
                  />
                </div>
              </div>

              {/* Area Range */}
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', color: tokens.color.muted, fontSize: 12, marginBottom: 6 }}>
                  Phạm vi diện tích (m²)
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <input
                    type="number"
                    value={form.conditions?.minArea || ''}
                    onChange={(e) => updateCondition('minArea', e.target.value ? parseFloat(e.target.value) : undefined)}
                    placeholder="Từ m²"
                    min={0}
                    step={0.1}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: tokens.radius.sm, border: `1px solid ${tokens.color.border}`, background: tokens.color.background, color: tokens.color.text, fontSize: 13, outline: 'none' }}
                  />
                  <input
                    type="number"
                    value={form.conditions?.maxArea || ''}
                    onChange={(e) => updateCondition('maxArea', e.target.value ? parseFloat(e.target.value) : undefined)}
                    placeholder="Đến m²"
                    min={0}
                    step={0.1}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: tokens.radius.sm, border: `1px solid ${tokens.color.border}`, background: tokens.color.background, color: tokens.color.text, fontSize: 13, outline: 'none' }}
                  />
                </div>
              </div>

              {/* Unit Types */}
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', color: tokens.color.muted, fontSize: 12, marginBottom: 6 }}>
                  Loại căn hộ
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {UNIT_TYPES.map((ut) => (
                    <motion.button
                      key={ut.value}
                      type="button"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => toggleArrayCondition('unitTypes', ut.value)}
                      style={{
                        padding: '4px 10px',
                        borderRadius: tokens.radius.sm,
                        border: `1px solid ${(form.conditions?.unitTypes || []).includes(ut.value) ? tokens.color.primary : tokens.color.border}`,
                        background: (form.conditions?.unitTypes || []).includes(ut.value) ? `${tokens.color.primary}20` : 'transparent',
                        color: (form.conditions?.unitTypes || []).includes(ut.value) ? tokens.color.primary : tokens.color.muted,
                        fontSize: 11,
                        cursor: 'pointer',
                      }}
                    >
                      {ut.label}
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Positions */}
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', color: tokens.color.muted, fontSize: 12, marginBottom: 6 }}>
                  Vị trí căn hộ
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {POSITIONS.map((p) => (
                    <motion.button
                      key={p.value}
                      type="button"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => toggleArrayCondition('positions', p.value)}
                      style={{
                        padding: '4px 10px',
                        borderRadius: tokens.radius.sm,
                        border: `1px solid ${(form.conditions?.positions || []).includes(p.value) ? tokens.color.primary : tokens.color.border}`,
                        background: (form.conditions?.positions || []).includes(p.value) ? `${tokens.color.primary}20` : 'transparent',
                        color: (form.conditions?.positions || []).includes(p.value) ? tokens.color.primary : tokens.color.muted,
                        fontSize: 11,
                        cursor: 'pointer',
                      }}
                    >
                      {p.label}
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Buildings */}
              {buildings.length > 0 && (
                <div style={{ marginBottom: 12 }}>
                  <label style={{ display: 'block', color: tokens.color.muted, fontSize: 12, marginBottom: 6 }}>
                    Tòa nhà
                  </label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {buildings.map((b) => (
                      <motion.button
                        key={b.id}
                        type="button"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => toggleArrayCondition('buildings', b.id)}
                        style={{
                          padding: '4px 10px',
                          borderRadius: tokens.radius.sm,
                          border: `1px solid ${(form.conditions?.buildings || []).includes(b.id) ? tokens.color.primary : tokens.color.border}`,
                          background: (form.conditions?.buildings || []).includes(b.id) ? `${tokens.color.primary}20` : 'transparent',
                          color: (form.conditions?.buildings || []).includes(b.id) ? tokens.color.primary : tokens.color.muted,
                          fontSize: 11,
                          cursor: 'pointer',
                        }}
                      >
                        {b.name}
                      </motion.button>
                    ))}
                  </div>
                </div>
              )}

              {/* Developments */}
              {developments.length > 0 && (
                <div>
                  <label style={{ display: 'block', color: tokens.color.muted, fontSize: 12, marginBottom: 6 }}>
                    Dự án
                  </label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {developments.map((d) => (
                      <motion.button
                        key={d.id}
                        type="button"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => toggleArrayCondition('developments', d.id)}
                        style={{
                          padding: '4px 10px',
                          borderRadius: tokens.radius.sm,
                          border: `1px solid ${(form.conditions?.developments || []).includes(d.id) ? tokens.color.primary : tokens.color.border}`,
                          background: (form.conditions?.developments || []).includes(d.id) ? `${tokens.color.primary}20` : 'transparent',
                          color: (form.conditions?.developments || []).includes(d.id) ? tokens.color.primary : tokens.color.muted,
                          fontSize: 11,
                          cursor: 'pointer',
                        }}
                      >
                        {d.name}
                      </motion.button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Toggles */}
            <div style={{ display: 'flex', gap: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <input
                  type="checkbox"
                  id="isAutoApply"
                  checked={form.isAutoApply}
                  onChange={(e) => setForm((prev) => ({ ...prev, isAutoApply: e.target.checked }))}
                  style={{ width: 16, height: 16, cursor: 'pointer' }}
                />
                <label htmlFor="isAutoApply" style={{ color: tokens.color.text, fontSize: 14, cursor: 'pointer' }}>
                  Tự động áp dụng
                </label>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <input
                  type="checkbox"
                  id="isOptional"
                  checked={form.isOptional}
                  onChange={(e) => setForm((prev) => ({ ...prev, isOptional: e.target.checked }))}
                  style={{ width: 16, height: 16, cursor: 'pointer' }}
                />
                <label htmlFor="isOptional" style={{ color: tokens.color.text, fontSize: 14, cursor: 'pointer' }}>
                  Tùy chọn (khách có thể bỏ)
                </label>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <input
                  type="checkbox"
                  id="surchargeIsActive"
                  checked={form.isActive}
                  onChange={(e) => setForm((prev) => ({ ...prev, isActive: e.target.checked }))}
                  style={{ width: 16, height: 16, cursor: 'pointer' }}
                />
                <label htmlFor="surchargeIsActive" style={{ color: tokens.color.text, fontSize: 14, cursor: 'pointer' }}>
                  Hiển thị
                </label>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 24 }}>
            <motion.button
              type="button"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onClose}
              style={{
                padding: '10px 20px',
                background: 'transparent',
                border: `1px solid ${tokens.color.border}`,
                borderRadius: tokens.radius.md,
                color: tokens.color.text,
                fontSize: 14,
                cursor: 'pointer',
              }}
            >
              Hủy
            </motion.button>
            <motion.button
              type="submit"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              disabled={saving}
              style={{
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
              {saving ? 'Đang lưu...' : surcharge ? 'Cập nhật' : 'Tạo mới'}
            </motion.button>
          </div>
        </form>
        </motion.div>
      </div>
    </>,
    document.body
  );
}


// ========== MAIN COMPONENT ==========

export function SurchargesTab() {
  const [surcharges, setSurcharges] = useState<InteriorSurcharge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modal, setModal] = useState<{ open: boolean; surcharge?: InteriorSurcharge | null }>({ open: false });
  const [deleteTarget, setDeleteTarget] = useState<InteriorSurcharge | null>(null);
  const [buildings, setBuildings] = useState<InteriorBuilding[]>([]);
  const [developments, setDevelopments] = useState<InteriorDevelopment[]>([]);

  // Load surcharges
  const loadSurcharges = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await interiorSurchargesApi.list({ limit: 100 });
      setSurcharges(res.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể tải danh sách phụ phí');
    } finally {
      setLoading(false);
    }
  }, []);

  // Load buildings and developments for conditions
  const loadConditionData = useCallback(async () => {
    try {
      const [buildingsRes, developmentsRes] = await Promise.all([
        interiorBuildingsApi.list({ limit: 100 }),
        interiorDevelopmentsApi.list({ limit: 100 }),
      ]);
      setBuildings(buildingsRes.data || []);
      setDevelopments(developmentsRes.data || []);
    } catch (err) {
      console.error('Failed to load condition data:', err);
    }
  }, []);

  useEffect(() => {
    loadSurcharges();
    loadConditionData();
  }, [loadSurcharges, loadConditionData]);

  // Save handler
  const handleSave = useCallback(
    async (data: CreateSurchargeInput | UpdateSurchargeInput) => {
      if (modal.surcharge) {
        await interiorSurchargesApi.update(modal.surcharge.id, data);
      } else {
        await interiorSurchargesApi.create(data as CreateSurchargeInput);
      }
      loadSurcharges();
    },
    [modal.surcharge, loadSurcharges]
  );

  // Delete handler
  const handleDelete = useCallback(async () => {
    if (!deleteTarget) return;
    try {
      await interiorSurchargesApi.delete(deleteTarget.id);
      loadSurcharges();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Không thể xóa phụ phí');
    } finally {
      setDeleteTarget(null);
    }
  }, [deleteTarget, loadSurcharges]);

  // Format value display
  const formatValue = (surcharge: InteriorSurcharge) => {
    switch (surcharge.type) {
      case 'PERCENTAGE':
        return `${surcharge.value}%`;
      case 'PER_FLOOR':
        return `${surcharge.value.toLocaleString('vi-VN')} đ/tầng`;
      case 'PER_SQM':
        return `${surcharge.value.toLocaleString('vi-VN')} đ/m²`;
      default:
        return `${surcharge.value.toLocaleString('vi-VN')} đ`;
    }
  };

  // Get type label
  const getTypeLabel = (type: SurchargeType) => {
    return SURCHARGE_TYPES.find((t) => t.value === type)?.label || type;
  };

  return (
    <div>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 20,
        }}
      >
        <h3 style={{ margin: 0, color: tokens.color.text, fontSize: 16, fontWeight: 600 }}>
          <i className="ri-price-tag-3-line" style={{ marginRight: 8 }} />
          Quản lý Phụ phí ({surcharges.length})
        </h3>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setModal({ open: true })}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '8px 16px',
            background: `linear-gradient(135deg, ${tokens.color.primary}, ${tokens.color.accent})`,
            border: 'none',
            borderRadius: tokens.radius.md,
            color: '#111',
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          <i className="ri-add-line" style={{ fontSize: 18 }} />
          Thêm phụ phí
        </motion.button>
      </div>

      {/* Content */}
      <div
        style={{
          background: tokens.color.surface,
          borderRadius: tokens.radius.lg,
          border: `1px solid ${tokens.color.border}`,
          overflow: 'hidden',
        }}
      >
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center' }}>
            <motion.i
              className="ri-loader-4-line"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              style={{ fontSize: 32, color: tokens.color.muted }}
            />
            <p style={{ color: tokens.color.muted, marginTop: 12 }}>Đang tải...</p>
          </div>
        ) : error ? (
          <div style={{ padding: 40, textAlign: 'center' }}>
            <i className="ri-error-warning-line" style={{ fontSize: 48, color: tokens.color.error }} />
            <p style={{ color: tokens.color.error, marginTop: 12 }}>{error}</p>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={loadSurcharges}
              style={{
                marginTop: 12,
                padding: '8px 16px',
                background: 'rgba(255,255,255,0.05)',
                border: `1px solid ${tokens.color.border}`,
                borderRadius: tokens.radius.md,
                color: tokens.color.text,
                cursor: 'pointer',
              }}
            >
              Thử lại
            </motion.button>
          </div>
        ) : surcharges.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center' }}>
            <i className="ri-price-tag-3-line" style={{ fontSize: 48, color: tokens.color.muted }} />
            <p style={{ color: tokens.color.muted, marginTop: 12 }}>Chưa có phụ phí nào</p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${tokens.color.border}` }}>
                <th style={{ padding: '12px 16px', textAlign: 'left', color: tokens.color.muted, fontSize: 12, fontWeight: 500 }}>Tên</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', color: tokens.color.muted, fontSize: 12, fontWeight: 500 }}>Mã</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', color: tokens.color.muted, fontSize: 12, fontWeight: 500 }}>Loại</th>
                <th style={{ padding: '12px 16px', textAlign: 'right', color: tokens.color.muted, fontSize: 12, fontWeight: 500 }}>Giá trị</th>
                <th style={{ padding: '12px 16px', textAlign: 'center', color: tokens.color.muted, fontSize: 12, fontWeight: 500 }}>Tự động</th>
                <th style={{ padding: '12px 16px', textAlign: 'center', color: tokens.color.muted, fontSize: 12, fontWeight: 500 }}>Tùy chọn</th>
                <th style={{ padding: '12px 16px', textAlign: 'center', color: tokens.color.muted, fontSize: 12, fontWeight: 500 }}>Trạng thái</th>
                <th style={{ padding: '12px 16px', textAlign: 'right', color: tokens.color.muted, fontSize: 12, fontWeight: 500 }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {surcharges.map((s) => (
                <tr key={s.id} style={{ borderBottom: `1px solid ${tokens.color.border}` }}>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ color: tokens.color.text, fontSize: 13, fontWeight: 500 }}>{s.name}</div>
                    {s.description && <div style={{ color: tokens.color.muted, fontSize: 11, marginTop: 2 }}>{s.description}</div>}
                  </td>
                  <td style={{ padding: '12px 16px', color: tokens.color.muted, fontSize: 12, fontFamily: 'monospace' }}>{s.code}</td>
                  <td style={{ padding: '12px 16px', color: tokens.color.text, fontSize: 13 }}>{getTypeLabel(s.type)}</td>
                  <td style={{ padding: '12px 16px', textAlign: 'right', color: tokens.color.primary, fontSize: 13, fontWeight: 500 }}>{formatValue(s)}</td>
                  <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                    <i className={s.isAutoApply ? 'ri-checkbox-circle-fill' : 'ri-checkbox-blank-circle-line'} style={{ color: s.isAutoApply ? tokens.color.success : tokens.color.muted }} />
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                    <i className={s.isOptional ? 'ri-checkbox-circle-fill' : 'ri-checkbox-blank-circle-line'} style={{ color: s.isOptional ? tokens.color.info : tokens.color.muted }} />
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                    <span
                      style={{
                        padding: '4px 8px',
                        borderRadius: tokens.radius.sm,
                        background: s.isActive ? `${tokens.color.success}20` : `${tokens.color.muted}20`,
                        color: s.isActive ? tokens.color.success : tokens.color.muted,
                        fontSize: 11,
                        fontWeight: 500,
                      }}
                    >
                      {s.isActive ? 'Hiện' : 'Ẩn'}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setModal({ open: true, surcharge: s })}
                        style={{ width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', background: `${tokens.color.primary}20`, border: 'none', borderRadius: tokens.radius.sm, color: tokens.color.primary, cursor: 'pointer' }}
                      >
                        <i className="ri-edit-line" style={{ fontSize: 14 }} />
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setDeleteTarget(s)}
                        style={{ width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', background: `${tokens.color.error}20`, border: 'none', borderRadius: tokens.radius.sm, color: tokens.color.error, cursor: 'pointer' }}
                      >
                        <i className="ri-delete-bin-line" style={{ fontSize: 14 }} />
                      </motion.button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal */}
      <AnimatePresence>
        {modal.open && (
          <SurchargeModal
            surcharge={modal.surcharge}
            buildings={buildings}
            developments={developments}
            onClose={() => setModal({ open: false })}
            onSave={handleSave}
          />
        )}
      </AnimatePresence>

      {/* Delete Confirmation */}
      <AnimatePresence>
        {deleteTarget && createPortal(
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDeleteTarget(null)}
              style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 9998 }}
            />
            <div
              style={{
                position: 'fixed',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 9999,
                pointerEvents: 'none',
                padding: 16,
              }}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                style={{
                  width: 'min(400px, 95vw)',
                  background: tokens.color.surface,
                  borderRadius: tokens.radius.lg,
                  border: `1px solid ${tokens.color.border}`,
                  padding: 24,
                  pointerEvents: 'auto',
                }}
              >
                <h3 style={{ margin: '0 0 12px', color: tokens.color.text, fontSize: 16, fontWeight: 600 }}>
                  Xác nhận xóa
                </h3>
                <p style={{ margin: '0 0 20px', color: tokens.color.muted, fontSize: 14 }}>
                  Bạn có chắc muốn xóa phụ phí <strong style={{ color: tokens.color.text }}>{deleteTarget.name}</strong>?
                </p>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setDeleteTarget(null)}
                    style={{ padding: '10px 20px', background: 'transparent', border: `1px solid ${tokens.color.border}`, borderRadius: tokens.radius.md, color: tokens.color.text, fontSize: 14, cursor: 'pointer' }}
                  >
                    Hủy
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleDelete}
                    style={{ padding: '10px 20px', background: tokens.color.error, border: 'none', borderRadius: tokens.radius.md, color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
                  >
                    Xóa
                  </motion.button>
                </div>
              </motion.div>
            </div>
          </>,
          document.body
        )}
      </AnimatePresence>
    </div>
  );
}