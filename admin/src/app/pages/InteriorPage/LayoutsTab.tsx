/**
 * Layouts Tab - Manage unit layouts (Bản vẽ layout)
 * Task 23.1: Full implementation with table and CRUD
 * Requirements: 5.1-5.7
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { tokens, resolveMediaUrl } from '@app/shared';
import { interiorLayoutsApi } from '../../api';
import type {
  InteriorUnitLayout,
  CreateLayoutInput,
  UpdateLayoutInput,
  UnitType,
  RoomType,
  LayoutRoom,
} from '../../types';

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

const ROOM_TYPES: { value: RoomType; label: string; icon: string }[] = [
  { value: 'LIVING', label: 'Phòng khách', icon: 'ri-sofa-line' },
  { value: 'BEDROOM', label: 'Phòng ngủ', icon: 'ri-hotel-bed-line' },
  { value: 'BEDROOM_MASTER', label: 'Phòng ngủ chính', icon: 'ri-hotel-bed-fill' },
  { value: 'KITCHEN', label: 'Bếp', icon: 'ri-restaurant-line' },
  { value: 'BATHROOM', label: 'Phòng tắm', icon: 'ri-drop-line' },
  { value: 'BATHROOM_ENSUITE', label: 'Phòng tắm riêng', icon: 'ri-drop-fill' },
  { value: 'BALCONY', label: 'Ban công', icon: 'ri-sun-line' },
  { value: 'TERRACE', label: 'Sân thượng', icon: 'ri-landscape-line' },
  { value: 'STORAGE', label: 'Kho', icon: 'ri-archive-line' },
  { value: 'DINING', label: 'Phòng ăn', icon: 'ri-goblet-line' },
  { value: 'OTHER', label: 'Khác', icon: 'ri-more-line' },
];

// ========== LAYOUT MODAL ==========

interface LayoutModalProps {
  layout?: InteriorUnitLayout | null;
  onClose: () => void;
  onSave: (data: CreateLayoutInput | UpdateLayoutInput) => Promise<void>;
}


function LayoutModal({ layout, onClose, onSave }: LayoutModalProps) {
  const [form, setForm] = useState<CreateLayoutInput>({
    name: layout?.name || '',
    code: layout?.code || '',
    unitType: layout?.unitType || '2PN',
    bedrooms: layout?.bedrooms || 2,
    bathrooms: layout?.bathrooms || 2,
    grossArea: layout?.grossArea || 0,
    netArea: layout?.netArea || 0,
    carpetArea: layout?.carpetArea,
    balconyArea: layout?.balconyArea,
    terraceArea: layout?.terraceArea,
    rooms: layout?.rooms || [],
    layoutImage: layout?.layoutImage || '',
    layout3DImage: layout?.layout3DImage || '',
    dimensionImage: layout?.dimensionImage || '',
    description: layout?.description || '',
    highlights: layout?.highlights || [],
    isActive: layout?.isActive ?? true,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [highlightInput, setHighlightInput] = useState('');

  // Calculate total room area
  const totalRoomArea = useMemo(() => {
    return (form.rooms || []).reduce((sum, r) => sum + (r.area || 0), 0);
  }, [form.rooms]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.code.trim()) {
      setError('Vui lòng nhập tên và mã layout');
      return;
    }
    if (form.grossArea <= 0 || form.netArea <= 0) {
      setError('Diện tích phải lớn hơn 0');
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
    <K extends keyof CreateLayoutInput>(field: K, value: CreateLayoutInput[K]) => {
      setForm((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  // Room management
  const addRoom = useCallback(() => {
    setForm((prev) => ({
      ...prev,
      rooms: [...(prev.rooms || []), { name: '', area: 0, type: 'OTHER' as RoomType }],
    }));
  }, []);

  const updateRoom = useCallback((index: number, field: keyof LayoutRoom, value: string | number) => {
    setForm((prev) => ({
      ...prev,
      rooms: (prev.rooms || []).map((r, i) =>
        i === index ? { ...r, [field]: value } : r
      ),
    }));
  }, []);

  const removeRoom = useCallback((index: number) => {
    setForm((prev) => ({
      ...prev,
      rooms: (prev.rooms || []).filter((_, i) => i !== index),
    }));
  }, []);

  // Highlight management
  const addHighlight = useCallback(() => {
    if (highlightInput.trim()) {
      setForm((prev) => ({
        ...prev,
        highlights: [...(prev.highlights || []), highlightInput.trim()],
      }));
      setHighlightInput('');
    }
  }, [highlightInput]);

  const removeHighlight = useCallback((index: number) => {
    setForm((prev) => ({
      ...prev,
      highlights: (prev.highlights || []).filter((_, i) => i !== index),
    }));
  }, []);

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
            width: 'min(800px, 95vw)',
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
            {layout ? 'Chỉnh sửa Layout' : 'Thêm Layout mới'}
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
            {/* Basic Info */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12 }}>
              <div>
                <label style={{ display: 'block', color: tokens.color.muted, fontSize: 13, marginBottom: 6 }}>
                  Tên layout <span style={{ color: tokens.color.error }}>*</span>
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => updateField('name', e.target.value)}
                  placeholder="VD: Layout A - 2PN"
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
                  Mã layout <span style={{ color: tokens.color.error }}>*</span>
                </label>
                <input
                  type="text"
                  value={form.code}
                  onChange={(e) => updateField('code', e.target.value.toUpperCase())}
                  placeholder="VD: LA-2PN"
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

            {/* Unit Type & Rooms */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ display: 'block', color: tokens.color.muted, fontSize: 13, marginBottom: 6 }}>
                  Loại căn hộ
                </label>
                <select
                  value={form.unitType}
                  onChange={(e) => updateField('unitType', e.target.value as UnitType)}
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
                  {UNIT_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', color: tokens.color.muted, fontSize: 13, marginBottom: 6 }}>
                  Phòng ngủ
                </label>
                <input
                  type="number"
                  value={form.bedrooms}
                  onChange={(e) => updateField('bedrooms', parseInt(e.target.value) || 0)}
                  min={0}
                  max={10}
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
                  Phòng tắm
                </label>
                <input
                  type="number"
                  value={form.bathrooms || ''}
                  onChange={(e) => updateField('bathrooms', e.target.value ? parseInt(e.target.value) : undefined)}
                  min={0}
                  max={10}
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


            {/* Areas */}
            <div
              style={{
                padding: 16,
                background: 'rgba(255,255,255,0.02)',
                borderRadius: tokens.radius.md,
                border: `1px solid ${tokens.color.border}`,
              }}
            >
              <h4 style={{ margin: '0 0 12px', color: tokens.color.text, fontSize: 14, fontWeight: 600 }}>
                <i className="ri-ruler-line" style={{ marginRight: 8 }} />
                Diện tích (m²)
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', color: tokens.color.muted, fontSize: 12, marginBottom: 4 }}>
                    Tim tường <span style={{ color: tokens.color.error }}>*</span>
                  </label>
                  <input
                    type="number"
                    value={form.grossArea || ''}
                    onChange={(e) => updateField('grossArea', parseFloat(e.target.value) || 0)}
                    step="0.1"
                    min={0}
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
                  <label style={{ display: 'block', color: tokens.color.muted, fontSize: 12, marginBottom: 4 }}>
                    Thông thủy <span style={{ color: tokens.color.error }}>*</span>
                  </label>
                  <input
                    type="number"
                    value={form.netArea || ''}
                    onChange={(e) => updateField('netArea', parseFloat(e.target.value) || 0)}
                    step="0.1"
                    min={0}
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
                  <label style={{ display: 'block', color: tokens.color.muted, fontSize: 12, marginBottom: 4 }}>
                    Thảm
                  </label>
                  <input
                    type="number"
                    value={form.carpetArea || ''}
                    onChange={(e) => updateField('carpetArea', e.target.value ? parseFloat(e.target.value) : undefined)}
                    step="0.1"
                    min={0}
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
                  <label style={{ display: 'block', color: tokens.color.muted, fontSize: 12, marginBottom: 4 }}>
                    Ban công
                  </label>
                  <input
                    type="number"
                    value={form.balconyArea || ''}
                    onChange={(e) => updateField('balconyArea', e.target.value ? parseFloat(e.target.value) : undefined)}
                    step="0.1"
                    min={0}
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
                  <label style={{ display: 'block', color: tokens.color.muted, fontSize: 12, marginBottom: 4 }}>
                    Sân thượng
                  </label>
                  <input
                    type="number"
                    value={form.terraceArea || ''}
                    onChange={(e) => updateField('terraceArea', e.target.value ? parseFloat(e.target.value) : undefined)}
                    step="0.1"
                    min={0}
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

            {/* Room Breakdown */}
            <div
              style={{
                padding: 16,
                background: 'rgba(255,255,255,0.02)',
                borderRadius: tokens.radius.md,
                border: `1px solid ${tokens.color.border}`,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <h4 style={{ margin: 0, color: tokens.color.text, fontSize: 14, fontWeight: 600 }}>
                  <i className="ri-layout-grid-line" style={{ marginRight: 8 }} />
                  Phân chia phòng
                </h4>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: 12, color: totalRoomArea > (form.netArea || 0) ? tokens.color.error : tokens.color.muted }}>
                    Tổng: {totalRoomArea.toFixed(1)}m² / {form.netArea || 0}m²
                  </span>
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={addRoom}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      padding: '6px 12px',
                      background: `${tokens.color.primary}20`,
                      border: `1px solid ${tokens.color.primary}40`,
                      borderRadius: tokens.radius.sm,
                      color: tokens.color.primary,
                      fontSize: 12,
                      cursor: 'pointer',
                    }}
                  >
                    <i className="ri-add-line" />
                    Thêm phòng
                  </motion.button>
                </div>
              </div>

              {(form.rooms || []).length === 0 ? (
                <div style={{ padding: 20, textAlign: 'center', color: tokens.color.muted, fontSize: 13 }}>
                  Chưa có phòng nào. Nhấn "Thêm phòng" để bắt đầu.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {(form.rooms || []).map((room, index) => (
                    <div
                      key={index}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '2fr 1fr 2fr auto',
                        gap: 8,
                        alignItems: 'center',
                      }}
                    >
                      <input
                        type="text"
                        value={room.name}
                        onChange={(e) => updateRoom(index, 'name', e.target.value)}
                        placeholder="Tên phòng"
                        style={{
                          padding: '8px 10px',
                          borderRadius: tokens.radius.sm,
                          border: `1px solid ${tokens.color.border}`,
                          background: tokens.color.background,
                          color: tokens.color.text,
                          fontSize: 13,
                          outline: 'none',
                        }}
                      />
                      <input
                        type="number"
                        value={room.area || ''}
                        onChange={(e) => updateRoom(index, 'area', parseFloat(e.target.value) || 0)}
                        placeholder="m²"
                        step="0.1"
                        min={0}
                        style={{
                          padding: '8px 10px',
                          borderRadius: tokens.radius.sm,
                          border: `1px solid ${tokens.color.border}`,
                          background: tokens.color.background,
                          color: tokens.color.text,
                          fontSize: 13,
                          outline: 'none',
                        }}
                      />
                      <select
                        value={room.type}
                        onChange={(e) => updateRoom(index, 'type', e.target.value)}
                        style={{
                          padding: '8px 10px',
                          borderRadius: tokens.radius.sm,
                          border: `1px solid ${tokens.color.border}`,
                          background: tokens.color.background,
                          color: tokens.color.text,
                          fontSize: 13,
                          outline: 'none',
                        }}
                      >
                        {ROOM_TYPES.map((t) => (
                          <option key={t.value} value={t.value}>{t.label}</option>
                        ))}
                      </select>
                      <motion.button
                        type="button"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => removeRoom(index)}
                        style={{
                          width: 28,
                          height: 28,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          background: `${tokens.color.error}20`,
                          border: 'none',
                          borderRadius: tokens.radius.sm,
                          color: tokens.color.error,
                          cursor: 'pointer',
                        }}
                      >
                        <i className="ri-delete-bin-line" style={{ fontSize: 14 }} />
                      </motion.button>
                    </div>
                  ))}
                </div>
              )}
            </div>


            {/* Images */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ display: 'block', color: tokens.color.muted, fontSize: 13, marginBottom: 6 }}>
                  Ảnh 2D
                </label>
                <input
                  type="text"
                  value={form.layoutImage || ''}
                  onChange={(e) => updateField('layoutImage', e.target.value)}
                  placeholder="URL ảnh 2D"
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
                  Ảnh 3D
                </label>
                <input
                  type="text"
                  value={form.layout3DImage || ''}
                  onChange={(e) => updateField('layout3DImage', e.target.value)}
                  placeholder="URL ảnh 3D"
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
                  Ảnh kích thước
                </label>
                <input
                  type="text"
                  value={form.dimensionImage || ''}
                  onChange={(e) => updateField('dimensionImage', e.target.value)}
                  placeholder="URL ảnh kích thước"
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

            {/* Description */}
            <div>
              <label style={{ display: 'block', color: tokens.color.muted, fontSize: 13, marginBottom: 6 }}>
                Mô tả
              </label>
              <textarea
                value={form.description || ''}
                onChange={(e) => updateField('description', e.target.value)}
                placeholder="Mô tả chi tiết về layout..."
                rows={3}
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

            {/* Highlights */}
            <div>
              <label style={{ display: 'block', color: tokens.color.muted, fontSize: 13, marginBottom: 6 }}>
                Điểm nổi bật
              </label>
              <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                <input
                  type="text"
                  value={highlightInput}
                  onChange={(e) => setHighlightInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addHighlight())}
                  placeholder="VD: 2 mặt thoáng, View hồ bơi..."
                  style={{
                    flex: 1,
                    padding: '10px 12px',
                    borderRadius: tokens.radius.md,
                    border: `1px solid ${tokens.color.border}`,
                    background: tokens.color.background,
                    color: tokens.color.text,
                    fontSize: 14,
                    outline: 'none',
                  }}
                />
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={addHighlight}
                  style={{
                    padding: '10px 16px',
                    background: `${tokens.color.primary}20`,
                    border: `1px solid ${tokens.color.primary}40`,
                    borderRadius: tokens.radius.md,
                    color: tokens.color.primary,
                    fontSize: 14,
                    cursor: 'pointer',
                  }}
                >
                  Thêm
                </motion.button>
              </div>
              {(form.highlights || []).length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {(form.highlights || []).map((h, i) => (
                    <span
                      key={i}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        padding: '4px 10px',
                        background: `${tokens.color.accent}20`,
                        borderRadius: tokens.radius.pill,
                        color: tokens.color.accent,
                        fontSize: 12,
                      }}
                    >
                      {h}
                      <motion.button
                        type="button"
                        whileHover={{ scale: 1.2 }}
                        onClick={() => removeHighlight(i)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: tokens.color.accent,
                          cursor: 'pointer',
                          padding: 0,
                          lineHeight: 1,
                        }}
                      >
                        <i className="ri-close-line" style={{ fontSize: 14 }} />
                      </motion.button>
                    </span>
                  ))}
                </div>
              )}
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
              <label htmlFor="isActive" style={{ color: tokens.color.text, fontSize: 14, cursor: 'pointer' }}>
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
              ) : layout ? (
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


// ========== CLONE MODAL ==========

interface CloneModalProps {
  layout: InteriorUnitLayout;
  onClose: () => void;
  onClone: (newCode: string) => Promise<void>;
}

function CloneModal({ layout, onClose, onClone }: CloneModalProps) {
  const [newCode, setNewCode] = useState(`${layout.code}-COPY`);
  const [cloning, setCloning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClone = async () => {
    if (!newCode.trim()) {
      setError('Vui lòng nhập mã layout mới');
      return;
    }
    setCloning(true);
    setError(null);
    try {
      await onClone(newCode.trim());
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Có lỗi xảy ra');
    } finally {
      setCloning(false);
    }
  };

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
            width: 'min(400px, 95vw)',
            background: tokens.color.surface,
            borderRadius: tokens.radius.lg,
            border: `1px solid ${tokens.color.border}`,
            padding: 20,
            pointerEvents: 'auto',
          }}
        >
          <h3 style={{ margin: '0 0 16px', color: tokens.color.text, fontSize: 16, fontWeight: 600 }}>
            <i className="ri-file-copy-line" style={{ marginRight: 8 }} />
            Nhân bản Layout
          </h3>

          <p style={{ color: tokens.color.muted, fontSize: 13, marginBottom: 16 }}>
            Nhân bản layout <strong style={{ color: tokens.color.text }}>{layout.name}</strong> với mã mới:
          </p>

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

          <input
            type="text"
            value={newCode}
            onChange={(e) => setNewCode(e.target.value.toUpperCase())}
            placeholder="Mã layout mới"
            style={{
              width: '100%',
              padding: '10px 12px',
              borderRadius: tokens.radius.md,
              border: `1px solid ${tokens.color.border}`,
              background: tokens.color.background,
              color: tokens.color.text,
              fontSize: 14,
              outline: 'none',
              marginBottom: 16,
            }}
          />

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
            <motion.button
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
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleClone}
            disabled={cloning}
            style={{
              padding: '10px 20px',
              background: `linear-gradient(135deg, ${tokens.color.primary}, ${tokens.color.accent})`,
              border: 'none',
              borderRadius: tokens.radius.md,
              color: '#111',
              fontSize: 14,
              fontWeight: 600,
              cursor: cloning ? 'not-allowed' : 'pointer',
              opacity: cloning ? 0.7 : 1,
            }}
          >
            {cloning ? 'Đang nhân bản...' : 'Nhân bản'}
          </motion.button>
          </div>
        </motion.div>
      </div>
    </>,
    document.body
  );
}

// ========== DELETE MODAL ==========

interface DeleteModalProps {
  layout: InteriorUnitLayout;
  onClose: () => void;
  onDelete: () => Promise<void>;
}

function DeleteModal({ layout, onClose, onDelete }: DeleteModalProps) {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasDependencies = Boolean(layout.packageCount && layout.packageCount > 0);

  const handleDelete = async () => {
    if (hasDependencies) return;
    setDeleting(true);
    setError(null);
    try {
      await onDelete();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Có lỗi xảy ra');
    } finally {
      setDeleting(false);
    }
  };

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
            width: 'min(400px, 95vw)',
            background: tokens.color.surface,
            borderRadius: tokens.radius.lg,
            border: `1px solid ${tokens.color.border}`,
            padding: 20,
            pointerEvents: 'auto',
          }}
        >
          <h3 style={{ margin: '0 0 16px', color: tokens.color.error, fontSize: 16, fontWeight: 600 }}>
            <i className="ri-delete-bin-line" style={{ marginRight: 8 }} />
            Xóa Layout
          </h3>

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

          <p style={{ margin: 0, color: tokens.color.muted, fontSize: 14 }}>
            Bạn có chắc muốn xóa <strong style={{ color: tokens.color.text }}>{layout.name}</strong>?
            {hasDependencies && (
              <span style={{ display: 'block', marginTop: 8, color: tokens.color.warning }}>
                ⚠️ Layout này có {layout.packageCount} gói nội thất. Không thể xóa.
              </span>
            )}
          </p>

          <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
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

export function LayoutsTab() {
  const [layouts, setLayouts] = useState<InteriorUnitLayout[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filterUnitType, setFilterUnitType] = useState<string>('');
  const [showModal, setShowModal] = useState(false);
  const [editingLayout, setEditingLayout] = useState<InteriorUnitLayout | null>(null);
  const [cloneLayout, setCloneLayout] = useState<InteriorUnitLayout | null>(null);
  const [deleteLayout, setDeleteLayout] = useState<InteriorUnitLayout | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;

  // Fetch layouts
  const fetchLayouts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await interiorLayoutsApi.list({
        search: search || undefined,
        unitType: filterUnitType || undefined,
        page,
        limit,
      });
      setLayouts(response.data || []);
      setTotal(response.total || 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể tải danh sách layout');
    } finally {
      setLoading(false);
    }
  }, [search, filterUnitType, page]);

  useEffect(() => {
    fetchLayouts();
  }, [fetchLayouts]);

  // Create layout
  const handleCreate = async (data: CreateLayoutInput) => {
    await interiorLayoutsApi.create(data);
    await fetchLayouts();
  };

  // Update layout
  const handleUpdate = async (data: UpdateLayoutInput) => {
    if (!editingLayout) return;
    await interiorLayoutsApi.update(editingLayout.id, data);
    await fetchLayouts();
  };

  // Clone layout
  const handleClone = async (newCode: string) => {
    if (!cloneLayout) return;
    await interiorLayoutsApi.clone(cloneLayout.id, newCode);
    await fetchLayouts();
  };

  // Delete layout
  const handleDelete = async () => {
    if (!deleteLayout) return;
    await interiorLayoutsApi.delete(deleteLayout.id);
    await fetchLayouts();
  };

  const totalPages = Math.ceil(total / limit);

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
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
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
              }}
            />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Tìm kiếm..."
              style={{
                padding: '8px 12px 8px 36px',
                borderRadius: tokens.radius.md,
                border: `1px solid ${tokens.color.border}`,
                background: tokens.color.background,
                color: tokens.color.text,
                fontSize: 14,
                outline: 'none',
                width: 200,
              }}
            />
          </div>

          {/* Filter by unit type */}
          <select
            value={filterUnitType}
            onChange={(e) => {
              setFilterUnitType(e.target.value);
              setPage(1);
            }}
            style={{
              padding: '8px 12px',
              borderRadius: tokens.radius.md,
              border: `1px solid ${tokens.color.border}`,
              background: tokens.color.background,
              color: tokens.color.text,
              fontSize: 14,
              outline: 'none',
            }}
          >
            <option value="">Tất cả loại căn</option>
            {UNIT_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => {
            setEditingLayout(null);
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
          Thêm Layout
        </motion.button>
      </div>

      {/* Table */}
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
              onClick={fetchLayouts}
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
        ) : layouts.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center' }}>
            <i className="ri-layout-4-line" style={{ fontSize: 48, color: tokens.color.muted }} />
            <p style={{ color: tokens.color.muted, marginTop: 12 }}>
              {search || filterUnitType ? 'Không tìm thấy layout nào' : 'Chưa có layout nào'}
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                  <th style={{ padding: '12px 16px', textAlign: 'left', color: tokens.color.muted, fontSize: 12, fontWeight: 600, textTransform: 'uppercase' }}>
                    Layout
                  </th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', color: tokens.color.muted, fontSize: 12, fontWeight: 600, textTransform: 'uppercase' }}>
                    Loại căn
                  </th>
                  <th style={{ padding: '12px 16px', textAlign: 'center', color: tokens.color.muted, fontSize: 12, fontWeight: 600, textTransform: 'uppercase' }}>
                    PN/WC
                  </th>
                  <th style={{ padding: '12px 16px', textAlign: 'right', color: tokens.color.muted, fontSize: 12, fontWeight: 600, textTransform: 'uppercase' }}>
                    Diện tích
                  </th>
                  <th style={{ padding: '12px 16px', textAlign: 'center', color: tokens.color.muted, fontSize: 12, fontWeight: 600, textTransform: 'uppercase' }}>
                    Phòng
                  </th>
                  <th style={{ padding: '12px 16px', textAlign: 'center', color: tokens.color.muted, fontSize: 12, fontWeight: 600, textTransform: 'uppercase' }}>
                    Gói NT
                  </th>
                  <th style={{ padding: '12px 16px', textAlign: 'center', color: tokens.color.muted, fontSize: 12, fontWeight: 600, textTransform: 'uppercase' }}>
                    Trạng thái
                  </th>
                  <th style={{ padding: '12px 16px', textAlign: 'right', color: tokens.color.muted, fontSize: 12, fontWeight: 600, textTransform: 'uppercase' }}>
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody>
                {layouts.map((layout) => (
                  <tr
                    key={layout.id}
                    style={{ borderTop: `1px solid ${tokens.color.border}` }}
                  >
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        {layout.layoutImage ? (
                          <img
                            src={resolveMediaUrl(layout.layoutImage)}
                            alt={layout.name}
                            style={{
                              width: 48,
                              height: 48,
                              borderRadius: tokens.radius.sm,
                              objectFit: 'cover',
                            }}
                          />
                        ) : (
                          <div
                            style={{
                              width: 48,
                              height: 48,
                              borderRadius: tokens.radius.sm,
                              background: `${tokens.color.primary}20`,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <i className="ri-layout-4-line" style={{ fontSize: 20, color: tokens.color.primary }} />
                          </div>
                        )}
                        <div>
                          <div style={{ color: tokens.color.text, fontSize: 14, fontWeight: 500 }}>
                            {layout.name}
                          </div>
                          <div style={{ color: tokens.color.muted, fontSize: 12 }}>
                            {layout.code}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span
                        style={{
                          padding: '4px 8px',
                          background: `${tokens.color.accent}20`,
                          borderRadius: tokens.radius.sm,
                          color: tokens.color.accent,
                          fontSize: 12,
                          fontWeight: 500,
                        }}
                      >
                        {layout.unitType}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'center', color: tokens.color.text, fontSize: 14 }}>
                      {layout.bedrooms}/{layout.bathrooms || 0}
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                      <div style={{ color: tokens.color.text, fontSize: 14 }}>
                        {layout.grossArea}m²
                      </div>
                      <div style={{ color: tokens.color.muted, fontSize: 12 }}>
                        TT: {layout.netArea}m²
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'center', color: tokens.color.text, fontSize: 14 }}>
                      {layout.rooms?.length || 0}
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'center', color: tokens.color.text, fontSize: 14 }}>
                      {layout.packageCount || 0}
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                      <span
                        style={{
                          padding: '4px 8px',
                          borderRadius: tokens.radius.sm,
                          fontSize: 12,
                          fontWeight: 500,
                          background: layout.isActive ? `${tokens.color.success}20` : `${tokens.color.error}20`,
                          color: layout.isActive ? tokens.color.success : tokens.color.error,
                        }}
                      >
                        {layout.isActive ? 'Hoạt động' : 'Ẩn'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 4 }}>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => {
                            setEditingLayout(layout);
                            setShowModal(true);
                          }}
                          title="Chỉnh sửa"
                          style={{
                            width: 32,
                            height: 32,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: 'rgba(255,255,255,0.05)',
                            border: `1px solid ${tokens.color.border}`,
                            borderRadius: tokens.radius.sm,
                            color: tokens.color.text,
                            cursor: 'pointer',
                          }}
                        >
                          <i className="ri-edit-line" style={{ fontSize: 14 }} />
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => setCloneLayout(layout)}
                          title="Nhân bản"
                          style={{
                            width: 32,
                            height: 32,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: `${tokens.color.primary}20`,
                            border: `1px solid ${tokens.color.primary}40`,
                            borderRadius: tokens.radius.sm,
                            color: tokens.color.primary,
                            cursor: 'pointer',
                          }}
                        >
                          <i className="ri-file-copy-line" style={{ fontSize: 14 }} />
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => setDeleteLayout(layout)}
                          title="Xóa"
                          style={{
                            width: 32,
                            height: 32,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: `${tokens.color.error}20`,
                            border: `1px solid ${tokens.color.error}40`,
                            borderRadius: tokens.radius.sm,
                            color: tokens.color.error,
                            cursor: 'pointer',
                          }}
                        >
                          <i className="ri-delete-bin-line" style={{ fontSize: 14 }} />
                        </motion.button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div
            style={{
              padding: '12px 16px',
              borderTop: `1px solid ${tokens.color.border}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span style={{ color: tokens.color.muted, fontSize: 13 }}>
              Hiển thị {(page - 1) * limit + 1}-{Math.min(page * limit, total)} / {total}
            </span>
            <div style={{ display: 'flex', gap: 4 }}>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                style={{
                  padding: '6px 12px',
                  background: 'rgba(255,255,255,0.05)',
                  border: `1px solid ${tokens.color.border}`,
                  borderRadius: tokens.radius.sm,
                  color: page === 1 ? tokens.color.muted : tokens.color.text,
                  cursor: page === 1 ? 'not-allowed' : 'pointer',
                  opacity: page === 1 ? 0.5 : 1,
                }}
              >
                <i className="ri-arrow-left-s-line" />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                style={{
                  padding: '6px 12px',
                  background: 'rgba(255,255,255,0.05)',
                  border: `1px solid ${tokens.color.border}`,
                  borderRadius: tokens.radius.sm,
                  color: page === totalPages ? tokens.color.muted : tokens.color.text,
                  cursor: page === totalPages ? 'not-allowed' : 'pointer',
                  opacity: page === totalPages ? 0.5 : 1,
                }}
              >
                <i className="ri-arrow-right-s-line" />
              </motion.button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <AnimatePresence>
        {showModal && (
          <LayoutModal
            layout={editingLayout}
            onClose={() => {
              setShowModal(false);
              setEditingLayout(null);
            }}
            onSave={async (data) => {
              if (editingLayout) {
                await handleUpdate(data as UpdateLayoutInput);
              } else {
                await handleCreate(data as CreateLayoutInput);
              }
            }}
          />
        )}
        {cloneLayout && (
          <CloneModal
            layout={cloneLayout}
            onClose={() => setCloneLayout(null)}
            onClone={handleClone}
          />
        )}
        {deleteLayout && (
          <DeleteModal
            layout={deleteLayout}
            onClose={() => setDeleteLayout(null)}
            onDelete={handleDelete}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
