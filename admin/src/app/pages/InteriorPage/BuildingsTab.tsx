/**
 * Buildings Tab - Manage interior buildings (Tòa nhà)
 * Task 21.1: Full implementation with table and CRUD
 * Requirements: 3.1-3.6
 */

import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { tokens, resolveMediaUrl } from '@app/shared';
import { interiorBuildingsApi, interiorDevelopmentsApi } from '../../api';
import type {
  InteriorBuilding,
  InteriorDevelopment,
  CreateBuildingInput,
  UpdateBuildingInput,
  SpecialFloor,
  SpecialFloorType,
} from '../../types';

const UNIT_CODE_FORMATS = [
  { value: '{building}{floor:02d}{axis}', label: 'Tòa + Tầng + Trục (VD: S101A)' },
  { value: '{floor:02d}.{axis}', label: 'Tầng.Trục (VD: 01.A)' },
  { value: '{building}-{floor:02d}-{axis}', label: 'Tòa-Tầng-Trục (VD: S1-01-A)' },
  { value: '{axis}{floor:02d}', label: 'Trục + Tầng (VD: A01)' },
];

const SPECIAL_FLOOR_TYPES: { value: SpecialFloorType; label: string }[] = [
  { value: 'PENTHOUSE', label: 'Penthouse' },
  { value: 'DUPLEX', label: 'Duplex' },
  { value: 'SHOPHOUSE', label: 'Shophouse' },
  { value: 'COMMERCIAL', label: 'Thương mại' },
];

// ========== BUILDING MODAL ==========

interface BuildingModalProps {
  building?: InteriorBuilding | null;
  developments: InteriorDevelopment[];
  onClose: () => void;
  onSave: (data: CreateBuildingInput | UpdateBuildingInput) => Promise<void>;
}

function BuildingModal({ building, developments, onClose, onSave }: BuildingModalProps) {
  const [form, setForm] = useState<CreateBuildingInput>({
    developmentId: building?.developmentId || '',
    name: building?.name || '',
    code: building?.code || '',
    totalFloors: building?.totalFloors || 20,
    startFloor: building?.startFloor || 1,
    endFloor: building?.endFloor || undefined,
    axisLabels: building?.axisLabels || ['A', 'B', 'C', 'D'],
    unitsPerFloor: building?.unitsPerFloor || 4,
    unitCodeFormat: building?.unitCodeFormat || UNIT_CODE_FORMATS[0].value,
    specialFloors: building?.specialFloors || [],
    thumbnail: building?.thumbnail || '',
    floorPlanImage: building?.floorPlanImage || '',
    isActive: building?.isActive ?? true,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [axisInput, setAxisInput] = useState(form.axisLabels.join(', '));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.developmentId) {
      setError('Vui lòng chọn dự án');
      return;
    }
    if (!form.name.trim()) {
      setError('Tên tòa nhà là bắt buộc');
      return;
    }
    if (!form.code.trim()) {
      setError('Mã tòa nhà là bắt buộc');
      return;
    }
    if (form.totalFloors < 1) {
      setError('Số tầng phải lớn hơn 0');
      return;
    }
    if (form.axisLabels.length === 0) {
      setError('Phải có ít nhất 1 trục');
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

  const updateField = useCallback(
    <K extends keyof CreateBuildingInput>(field: K, value: CreateBuildingInput[K]) => {
      setForm((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  const handleAxisChange = useCallback((value: string) => {
    setAxisInput(value);
    const labels = value
      .split(',')
      .map((s) => s.trim().toUpperCase())
      .filter(Boolean);
    setForm((prev) => ({
      ...prev,
      axisLabels: labels,
      unitsPerFloor: labels.length,
    }));
  }, []);

  const addSpecialFloor = useCallback(() => {
    setForm((prev) => ({
      ...prev,
      specialFloors: [...(prev.specialFloors || []), { floor: prev.totalFloors, type: 'PENTHOUSE' }],
    }));
  }, []);

  const updateSpecialFloor = useCallback((index: number, field: keyof SpecialFloor, value: unknown) => {
    setForm((prev) => ({
      ...prev,
      specialFloors: (prev.specialFloors || []).map((sf, i) =>
        i === index ? { ...sf, [field]: value } : sf
      ),
    }));
  }, []);

  const removeSpecialFloor = useCallback((index: number) => {
    setForm((prev) => ({
      ...prev,
      specialFloors: (prev.specialFloors || []).filter((_, i) => i !== index),
    }));
  }, []);

  // Generate preview unit code
  const previewUnitCode = (form.unitCodeFormat || '{building}.{floor:02d}.{axis}')
    .replace('{building}', form.code || 'S1')
    .replace('{floor:02d}', '01')
    .replace('{axis}', form.axisLabels[0] || 'A');

  return createPortal(
    <>
      {/* Overlay */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.7)',
          zIndex: 9998,
        }}
      />
      {/* Centering Container */}
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
        {/* Modal */}
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
          {/* Header */}
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
            {building ? 'Chỉnh sửa tòa nhà' : 'Thêm tòa nhà mới'}
          </h3>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: tokens.color.muted,
              cursor: 'pointer',
              padding: 4,
            }}
          >
            <i className="ri-close-line" style={{ fontSize: 20 }} />
          </motion.button>
        </div>

        {/* Form */}
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
            {/* Development Select */}
            <div>
              <label
                style={{ display: 'block', color: tokens.color.muted, fontSize: 13, marginBottom: 6 }}
              >
                Dự án <span style={{ color: tokens.color.error }}>*</span>
              </label>
              <select
                value={form.developmentId}
                onChange={(e) => updateField('developmentId', e.target.value)}
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
                <option value="">-- Chọn dự án --</option>
                {developments.map((dev) => (
                  <option key={dev.id} value={dev.id}>
                    {dev.name} ({dev.developer?.name || 'N/A'})
                  </option>
                ))}
              </select>
            </div>

            {/* Name & Code Row */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12 }}>
              <div>
                <label
                  style={{ display: 'block', color: tokens.color.muted, fontSize: 13, marginBottom: 6 }}
                >
                  Tên tòa nhà <span style={{ color: tokens.color.error }}>*</span>
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => updateField('name', e.target.value)}
                  placeholder="VD: Tòa S1"
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
                <label
                  style={{ display: 'block', color: tokens.color.muted, fontSize: 13, marginBottom: 6 }}
                >
                  Mã tòa <span style={{ color: tokens.color.error }}>*</span>
                </label>
                <input
                  type="text"
                  value={form.code}
                  onChange={(e) => updateField('code', e.target.value.toUpperCase())}
                  placeholder="VD: S1"
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

            {/* Floor Configuration */}
            <div
              style={{
                padding: 16,
                background: 'rgba(255,255,255,0.02)',
                borderRadius: tokens.radius.md,
                border: `1px solid ${tokens.color.border}`,
              }}
            >
              <h4 style={{ margin: '0 0 12px', color: tokens.color.text, fontSize: 14, fontWeight: 600 }}>
                <i className="ri-building-line" style={{ marginRight: 8 }} />
                Cấu hình tầng
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                <div>
                  <label
                    style={{ display: 'block', color: tokens.color.muted, fontSize: 12, marginBottom: 4 }}
                  >
                    Tổng số tầng
                  </label>
                  <input
                    type="number"
                    value={form.totalFloors}
                    onChange={(e) => updateField('totalFloors', parseInt(e.target.value) || 1)}
                    min={1}
                    max={100}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: tokens.radius.sm,
                      border: `1px solid ${tokens.color.border}`,
                      background: tokens.color.background,
                      color: tokens.color.text,
                      fontSize: 14,
                      outline: 'none',
                    }}
                  />
                </div>
                <div>
                  <label
                    style={{ display: 'block', color: tokens.color.muted, fontSize: 12, marginBottom: 4 }}
                  >
                    Tầng bắt đầu
                  </label>
                  <input
                    type="number"
                    value={form.startFloor}
                    onChange={(e) => updateField('startFloor', parseInt(e.target.value) || 1)}
                    min={-5}
                    max={50}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: tokens.radius.sm,
                      border: `1px solid ${tokens.color.border}`,
                      background: tokens.color.background,
                      color: tokens.color.text,
                      fontSize: 14,
                      outline: 'none',
                    }}
                  />
                </div>
                <div>
                  <label
                    style={{ display: 'block', color: tokens.color.muted, fontSize: 12, marginBottom: 4 }}
                  >
                    Tầng kết thúc
                  </label>
                  <input
                    type="number"
                    value={form.endFloor || ''}
                    onChange={(e) =>
                      updateField('endFloor', e.target.value ? parseInt(e.target.value) : undefined)
                    }
                    placeholder="Auto"
                    min={1}
                    max={100}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: tokens.radius.sm,
                      border: `1px solid ${tokens.color.border}`,
                      background: tokens.color.background,
                      color: tokens.color.text,
                      fontSize: 14,
                      outline: 'none',
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Axis Configuration */}
            <div>
              <label
                style={{ display: 'block', color: tokens.color.muted, fontSize: 13, marginBottom: 6 }}
              >
                Trục căn hộ (phân cách bằng dấu phẩy)
              </label>
              <input
                type="text"
                value={axisInput}
                onChange={(e) => handleAxisChange(e.target.value)}
                placeholder="VD: A, B, C, D"
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
              <div style={{ marginTop: 6, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {form.axisLabels.map((axis, idx) => (
                  <span
                    key={idx}
                    style={{
                      padding: '2px 8px',
                      borderRadius: tokens.radius.sm,
                      background: `${tokens.color.primary}20`,
                      color: tokens.color.primary,
                      fontSize: 12,
                    }}
                  >
                    {axis}
                  </span>
                ))}
                <span style={{ color: tokens.color.muted, fontSize: 12, marginLeft: 8 }}>
                  ({form.axisLabels.length} căn/tầng)
                </span>
              </div>
            </div>

            {/* Unit Code Format */}
            <div>
              <label
                style={{ display: 'block', color: tokens.color.muted, fontSize: 13, marginBottom: 6 }}
              >
                Định dạng mã căn hộ
              </label>
              <select
                value={form.unitCodeFormat}
                onChange={(e) => updateField('unitCodeFormat', e.target.value)}
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
                {UNIT_CODE_FORMATS.map((fmt) => (
                  <option key={fmt.value} value={fmt.value}>
                    {fmt.label}
                  </option>
                ))}
              </select>
              <div style={{ marginTop: 6, color: tokens.color.muted, fontSize: 12 }}>
                Xem trước: <strong style={{ color: tokens.color.primary }}>{previewUnitCode}</strong>
              </div>
            </div>

            {/* Special Floors */}
            <div
              style={{
                padding: 16,
                background: 'rgba(255,255,255,0.02)',
                borderRadius: tokens.radius.md,
                border: `1px solid ${tokens.color.border}`,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 12,
                }}
              >
                <h4 style={{ margin: 0, color: tokens.color.text, fontSize: 14, fontWeight: 600 }}>
                  <i className="ri-star-line" style={{ marginRight: 8 }} />
                  Tầng đặc biệt
                </h4>
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={addSpecialFloor}
                  style={{
                    padding: '4px 10px',
                    background: 'rgba(255,255,255,0.05)',
                    border: `1px solid ${tokens.color.border}`,
                    borderRadius: tokens.radius.sm,
                    color: tokens.color.text,
                    fontSize: 12,
                    cursor: 'pointer',
                  }}
                >
                  <i className="ri-add-line" /> Thêm
                </motion.button>
              </div>
              {form.specialFloors && form.specialFloors.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {form.specialFloors.map((sf, idx) => (
                    <div key={idx} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <input
                        type="number"
                        value={sf.floor}
                        onChange={(e) => updateSpecialFloor(idx, 'floor', parseInt(e.target.value) || 1)}
                        placeholder="Tầng"
                        min={1}
                        style={{
                          width: 80,
                          padding: '6px 8px',
                          borderRadius: tokens.radius.sm,
                          border: `1px solid ${tokens.color.border}`,
                          background: tokens.color.background,
                          color: tokens.color.text,
                          fontSize: 13,
                          outline: 'none',
                        }}
                      />
                      <select
                        value={sf.type}
                        onChange={(e) => updateSpecialFloor(idx, 'type', e.target.value)}
                        style={{
                          flex: 1,
                          padding: '6px 8px',
                          borderRadius: tokens.radius.sm,
                          border: `1px solid ${tokens.color.border}`,
                          background: tokens.color.background,
                          color: tokens.color.text,
                          fontSize: 13,
                          outline: 'none',
                        }}
                      >
                        {SPECIAL_FLOOR_TYPES.map((t) => (
                          <option key={t.value} value={t.value}>
                            {t.label}
                          </option>
                        ))}
                      </select>
                      <input
                        type="text"
                        value={sf.note || ''}
                        onChange={(e) => updateSpecialFloor(idx, 'note', e.target.value)}
                        placeholder="Ghi chú"
                        style={{
                          flex: 1,
                          padding: '6px 8px',
                          borderRadius: tokens.radius.sm,
                          border: `1px solid ${tokens.color.border}`,
                          background: tokens.color.background,
                          color: tokens.color.text,
                          fontSize: 13,
                          outline: 'none',
                        }}
                      />
                      <motion.button
                        type="button"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => removeSpecialFloor(idx)}
                        style={{
                          padding: 4,
                          background: 'transparent',
                          border: 'none',
                          color: tokens.color.error,
                          cursor: 'pointer',
                        }}
                      >
                        <i className="ri-close-line" style={{ fontSize: 16 }} />
                      </motion.button>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ margin: 0, color: tokens.color.muted, fontSize: 13 }}>
                  Chưa có tầng đặc biệt nào
                </p>
              )}
            </div>

            {/* Images */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label
                  style={{ display: 'block', color: tokens.color.muted, fontSize: 13, marginBottom: 6 }}
                >
                  Ảnh đại diện (URL)
                </label>
                <input
                  type="text"
                  value={form.thumbnail || ''}
                  onChange={(e) => updateField('thumbnail', e.target.value)}
                  placeholder="https://..."
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
                {form.thumbnail && (
                  <img
                    src={resolveMediaUrl(form.thumbnail)}
                    alt="Thumbnail"
                    style={{
                      marginTop: 8,
                      height: 60,
                      maxWidth: '100%',
                      objectFit: 'cover',
                      borderRadius: tokens.radius.sm,
                    }}
                  />
                )}
              </div>
              <div>
                <label
                  style={{ display: 'block', color: tokens.color.muted, fontSize: 13, marginBottom: 6 }}
                >
                  Mặt bằng tầng (URL)
                </label>
                <input
                  type="text"
                  value={form.floorPlanImage || ''}
                  onChange={(e) => updateField('floorPlanImage', e.target.value)}
                  placeholder="https://..."
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
                {form.floorPlanImage && (
                  <img
                    src={resolveMediaUrl(form.floorPlanImage)}
                    alt="Floor plan"
                    style={{
                      marginTop: 8,
                      height: 60,
                      maxWidth: '100%',
                      objectFit: 'cover',
                      borderRadius: tokens.radius.sm,
                    }}
                  />
                )}
              </div>
            </div>

            {/* Active Toggle */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <input
                type="checkbox"
                id="isActive"
                checked={form.isActive}
                onChange={(e) => updateField('isActive', e.target.checked)}
                style={{ width: 16, height: 16, cursor: 'pointer' }}
              />
              <label
                htmlFor="isActive"
                style={{ color: tokens.color.text, fontSize: 14, cursor: 'pointer' }}
              >
                Hiển thị trên trang báo giá
              </label>
            </div>
          </div>

          {/* Actions */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: 10,
              marginTop: 24,
              paddingTop: 16,
              borderTop: `1px solid ${tokens.color.border}`,
            }}
          >
            <motion.button
              type="button"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onClose}
              style={{
                padding: '10px 20px',
                background: 'rgba(255,255,255,0.05)',
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
              {saving ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <motion.i
                    className="ri-loader-4-line"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  />
                  Đang lưu...
                </span>
              ) : building ? (
                'Cập nhật'
              ) : (
                'Thêm mới'
              )}
            </motion.button>
          </div>
        </form>
        </motion.div>
      </div>
    </>,
    document.body
  );
}


// ========== DELETE CONFIRMATION MODAL ==========

interface DeleteModalProps {
  building: InteriorBuilding;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

function DeleteModal({ building, onClose, onConfirm }: DeleteModalProps) {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    setDeleting(true);
    setError(null);
    try {
      await onConfirm();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể xóa tòa nhà');
    } finally {
      setDeleting(false);
    }
  };

  const hasDependencies = Boolean(building.unitCount && building.unitCount > 0);

  return createPortal(
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.7)',
          zIndex: 9998,
        }}
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
            width: 'min(420px, 95vw)',
            background: tokens.color.surface,
            borderRadius: tokens.radius.lg,
            border: `1px solid ${tokens.color.border}`,
            padding: 24,
            pointerEvents: 'auto',
          }}
        >
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              background: `${tokens.color.error}20`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
            }}
          >
            <i className="ri-delete-bin-line" style={{ fontSize: 28, color: tokens.color.error }} />
          </div>
          <h3 style={{ margin: '0 0 8px', color: tokens.color.text, fontSize: 18 }}>Xóa tòa nhà?</h3>
          <p style={{ margin: 0, color: tokens.color.muted, fontSize: 14 }}>
            Bạn có chắc muốn xóa <strong style={{ color: tokens.color.text }}>{building.name}</strong>?
            {hasDependencies && (
              <span style={{ display: 'block', marginTop: 8, color: tokens.color.warning }}>
                ⚠️ Tòa nhà này có {building.unitCount} căn hộ. Không thể xóa.
              </span>
            )}
          </p>
        </div>

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

        <div style={{ display: 'flex', gap: 10 }}>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onClose}
            style={{
              flex: 1,
              padding: '10px 16px',
              background: 'rgba(255,255,255,0.05)',
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
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleDelete}
            disabled={deleting || hasDependencies}
            style={{
              flex: 1,
              padding: '10px 16px',
              background: tokens.color.error,
              border: 'none',
              borderRadius: tokens.radius.md,
              color: '#fff',
              fontSize: 14,
              fontWeight: 600,
              cursor: deleting || hasDependencies ? 'not-allowed' : 'pointer',
              opacity: deleting || hasDependencies ? 0.5 : 1,
            }}
          >
            {deleting ? 'Đang xóa...' : 'Xóa'}
          </motion.button>
        </div>
        </motion.div>
      </div>
    </>,
    document.body
  );
}

// ========== MAIN COMPONENT ==========

export function BuildingsTab() {
  const [buildings, setBuildings] = useState<InteriorBuilding[]>([]);
  const [developments, setDevelopments] = useState<InteriorDevelopment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filterDevelopmentId, setFilterDevelopmentId] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingBuilding, setEditingBuilding] = useState<InteriorBuilding | null>(null);
  const [deletingBuilding, setDeletingBuilding] = useState<InteriorBuilding | null>(null);

  // Fetch developments for filter dropdown
  const fetchDevelopments = useCallback(async () => {
    try {
      const response = await interiorDevelopmentsApi.list({ limit: 100 });
      setDevelopments(response.data || []);
    } catch (err) {
      console.error('Failed to fetch developments:', err);
    }
  }, []);

  // Fetch buildings
  const fetchBuildings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await interiorBuildingsApi.list({
        developmentId: filterDevelopmentId || undefined,
        search: search || undefined,
      });
      setBuildings(response.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể tải danh sách');
    } finally {
      setLoading(false);
    }
  }, [search, filterDevelopmentId]);

  useEffect(() => {
    fetchDevelopments();
  }, [fetchDevelopments]);

  useEffect(() => {
    fetchBuildings();
  }, [fetchBuildings]);

  // Create building
  const handleCreate = async (data: CreateBuildingInput) => {
    await interiorBuildingsApi.create(data);
    await fetchBuildings();
  };

  // Update building
  const handleUpdate = async (data: UpdateBuildingInput) => {
    if (!editingBuilding) return;
    await interiorBuildingsApi.update(editingBuilding.id, data);
    await fetchBuildings();
  };

  // Delete building
  const handleDelete = async () => {
    if (!deletingBuilding) return;
    await interiorBuildingsApi.delete(deletingBuilding.id);
    await fetchBuildings();
  };

  // Toggle active status
  const handleToggleActive = async (building: InteriorBuilding) => {
    try {
      await interiorBuildingsApi.update(building.id, { isActive: !building.isActive });
      await fetchBuildings();
    } catch (err) {
      console.error('Failed to toggle status:', err);
    }
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
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          {/* Development Filter */}
          <select
            value={filterDevelopmentId}
            onChange={(e) => setFilterDevelopmentId(e.target.value)}
            style={{
              padding: '8px 12px',
              borderRadius: tokens.radius.md,
              border: `1px solid ${tokens.color.border}`,
              background: tokens.color.background,
              color: tokens.color.text,
              fontSize: 14,
              outline: 'none',
              minWidth: 200,
            }}
          >
            <option value="">Tất cả dự án</option>
            {developments.map((dev) => (
              <option key={dev.id} value={dev.id}>
                {dev.name}
              </option>
            ))}
          </select>

          {/* Search */}
          <div style={{ position: 'relative' }}>
            <i
              className="ri-search-line"
              style={{
                position: 'absolute',
                left: 12,
                top: '50%',
                transform: 'translateY(-50%)',
                color: tokens.color.muted,
                fontSize: 16,
              }}
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm kiếm..."
              style={{
                width: 200,
                padding: '8px 12px 8px 36px',
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

        {/* Add Button */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => {
            setEditingBuilding(null);
            setShowModal(true);
          }}
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
          Thêm tòa nhà
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
              style={{ fontSize: 32, color: tokens.color.primary }}
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
              onClick={fetchBuildings}
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
        ) : buildings.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center' }}>
            <i className="ri-building-2-line" style={{ fontSize: 48, color: tokens.color.muted }} />
            <p style={{ color: tokens.color.muted, marginTop: 12 }}>
              {search || filterDevelopmentId ? 'Không tìm thấy kết quả' : 'Chưa có tòa nhà nào'}
            </p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${tokens.color.border}` }}>
                <th
                  style={{
                    padding: '12px 16px',
                    textAlign: 'left',
                    color: tokens.color.muted,
                    fontSize: 13,
                    fontWeight: 500,
                  }}
                >
                  Tòa nhà
                </th>
                <th
                  style={{
                    padding: '12px 16px',
                    textAlign: 'left',
                    color: tokens.color.muted,
                    fontSize: 13,
                    fontWeight: 500,
                    width: 150,
                  }}
                >
                  Dự án
                </th>
                <th
                  style={{
                    padding: '12px 16px',
                    textAlign: 'center',
                    color: tokens.color.muted,
                    fontSize: 13,
                    fontWeight: 500,
                    width: 100,
                  }}
                >
                  Tầng
                </th>
                <th
                  style={{
                    padding: '12px 16px',
                    textAlign: 'center',
                    color: tokens.color.muted,
                    fontSize: 13,
                    fontWeight: 500,
                    width: 120,
                  }}
                >
                  Trục
                </th>
                <th
                  style={{
                    padding: '12px 16px',
                    textAlign: 'center',
                    color: tokens.color.muted,
                    fontSize: 13,
                    fontWeight: 500,
                    width: 80,
                  }}
                >
                  Căn hộ
                </th>
                <th
                  style={{
                    padding: '12px 16px',
                    textAlign: 'center',
                    color: tokens.color.muted,
                    fontSize: 13,
                    fontWeight: 500,
                    width: 100,
                  }}
                >
                  Trạng thái
                </th>
                <th
                  style={{
                    padding: '12px 16px',
                    textAlign: 'right',
                    color: tokens.color.muted,
                    fontSize: 13,
                    fontWeight: 500,
                    width: 120,
                  }}
                >
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody>
              {buildings.map((building) => (
                <motion.tr
                  key={building.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  style={{ borderBottom: `1px solid ${tokens.color.border}` }}
                >
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      {building.thumbnail ? (
                        <img
                          src={resolveMediaUrl(building.thumbnail)}
                          alt={building.name}
                          style={{
                            width: 40,
                            height: 40,
                            borderRadius: tokens.radius.sm,
                            objectFit: 'cover',
                            background: 'rgba(255,255,255,0.05)',
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            width: 40,
                            height: 40,
                            borderRadius: tokens.radius.sm,
                            background: `${tokens.color.primary}20`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <i
                            className="ri-building-2-line"
                            style={{ fontSize: 18, color: tokens.color.primary }}
                          />
                        </div>
                      )}
                      <div>
                        <div style={{ color: tokens.color.text, fontWeight: 500 }}>{building.name}</div>
                        <div style={{ color: tokens.color.muted, fontSize: 12, fontFamily: 'monospace' }}>
                          {building.code}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ color: tokens.color.muted, fontSize: 13 }}>
                      {building.development?.name || '-'}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                    <span style={{ color: tokens.color.text, fontSize: 13 }}>
                      {building.startFloor} - {building.endFloor || building.startFloor + building.totalFloors - 1}
                    </span>
                    <div style={{ color: tokens.color.muted, fontSize: 11 }}>
                      ({building.totalFloors} tầng)
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: 4, justifyContent: 'center', flexWrap: 'wrap' }}>
                      {building.axisLabels.slice(0, 4).map((axis, idx) => (
                        <span
                          key={idx}
                          style={{
                            padding: '2px 6px',
                            borderRadius: tokens.radius.sm,
                            background: `${tokens.color.primary}20`,
                            color: tokens.color.primary,
                            fontSize: 11,
                          }}
                        >
                          {axis}
                        </span>
                      ))}
                      {building.axisLabels.length > 4 && (
                        <span style={{ color: tokens.color.muted, fontSize: 11 }}>
                          +{building.axisLabels.length - 4}
                        </span>
                      )}
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                    <span
                      style={{
                        padding: '4px 10px',
                        borderRadius: tokens.radius.sm,
                        background: `${tokens.color.info}20`,
                        color: tokens.color.info,
                        fontSize: 13,
                        fontWeight: 500,
                      }}
                    >
                      {building.unitCount || 0}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleToggleActive(building)}
                      style={{
                        padding: '4px 10px',
                        borderRadius: tokens.radius.sm,
                        background: building.isActive
                          ? `${tokens.color.success}20`
                          : `${tokens.color.error}20`,
                        color: building.isActive ? tokens.color.success : tokens.color.error,
                        fontSize: 12,
                        fontWeight: 600,
                        border: 'none',
                        cursor: 'pointer',
                      }}
                    >
                      {building.isActive ? 'Hiển thị' : 'Ẩn'}
                    </motion.button>
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => {
                          setEditingBuilding(building);
                          setShowModal(true);
                        }}
                        title="Chỉnh sửa"
                        style={{
                          padding: 6,
                          background: 'rgba(255,255,255,0.05)',
                          border: `1px solid ${tokens.color.border}`,
                          borderRadius: tokens.radius.sm,
                          color: tokens.color.primary,
                          cursor: 'pointer',
                        }}
                      >
                        <i className="ri-edit-line" style={{ fontSize: 16 }} />
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setDeletingBuilding(building)}
                        title="Xóa"
                        style={{
                          padding: 6,
                          background: 'rgba(255,255,255,0.05)',
                          border: `1px solid ${tokens.color.border}`,
                          borderRadius: tokens.radius.sm,
                          color: tokens.color.error,
                          cursor: 'pointer',
                        }}
                      >
                        <i className="ri-delete-bin-line" style={{ fontSize: 16 }} />
                      </motion.button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modals */}
      <AnimatePresence>
        {showModal && (
          <BuildingModal
            building={editingBuilding}
            developments={developments}
            onClose={() => {
              setShowModal(false);
              setEditingBuilding(null);
            }}
            onSave={async (data) => {
              if (editingBuilding) {
                await handleUpdate(data as UpdateBuildingInput);
              } else {
                await handleCreate(data as CreateBuildingInput);
              }
            }}
          />
        )}
        {deletingBuilding && (
          <DeleteModal
            building={deletingBuilding}
            onClose={() => setDeletingBuilding(null)}
            onConfirm={handleDelete}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
