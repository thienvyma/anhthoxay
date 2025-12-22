/**
 * Packages Tab - Manage interior packages (Gói nội thất)
 * Task 24.1: Full implementation with table and CRUD
 * Requirements: 6.1-6.7
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { tokens, resolveMediaUrl } from '@app/shared';
import { interiorPackagesApi, interiorLayoutsApi } from '../../api';
import type {
  InteriorPackage,
  InteriorUnitLayout,
  CreatePackageInput,
  UpdatePackageInput,
  PackageItem,
} from '../../types';

const TIERS: { value: 1 | 2 | 3 | 4; label: string; color: string }[] = [
  { value: 1, label: 'Basic', color: '#6B7280' },
  { value: 2, label: 'Standard', color: '#3B82F6' },
  { value: 3, label: 'Premium', color: '#8B5CF6' },
  { value: 4, label: 'Luxury', color: '#F59E0B' },
];

// ========== PACKAGE MODAL ==========

interface PackageModalProps {
  pkg?: InteriorPackage | null;
  layouts: InteriorUnitLayout[];
  onClose: () => void;
  onSave: (data: CreatePackageInput | UpdatePackageInput) => Promise<void>;
}

function PackageModal({ pkg, layouts, onClose, onSave }: PackageModalProps) {
  const [form, setForm] = useState<CreatePackageInput>({
    layoutId: pkg?.layoutId || '',
    name: pkg?.name || '',
    code: pkg?.code || '',
    tier: pkg?.tier || 2,
    description: pkg?.description || '',
    shortDescription: pkg?.shortDescription || '',
    basePrice: pkg?.basePrice || 0,
    pricePerSqm: pkg?.pricePerSqm,
    thumbnail: pkg?.thumbnail || '',
    images: pkg?.images || [],
    video360Url: pkg?.video360Url || '',
    items: pkg?.items || [],
    warrantyMonths: pkg?.warrantyMonths,
    installationDays: pkg?.installationDays,
    isActive: pkg?.isActive ?? true,
    isFeatured: pkg?.isFeatured ?? false,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'basic' | 'items' | 'media'>('basic');

  // Calculate totals
  const { totalItems, totalItemsPrice } = useMemo(() => {
    let count = 0;
    let price = 0;
    (form.items || []).forEach((room) => {
      room.items.forEach((item) => {
        count += item.qty;
        price += item.qty * item.price;
      });
    });
    return { totalItems: count, totalItemsPrice: price };
  }, [form.items]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.code.trim()) {
      setError('Vui lòng nhập tên và mã gói');
      return;
    }
    if (!pkg && !form.layoutId) {
      setError('Vui lòng chọn layout');
      return;
    }
    if (form.basePrice <= 0) {
      setError('Giá gói phải lớn hơn 0');
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
    <K extends keyof CreatePackageInput>(field: K, value: CreatePackageInput[K]) => {
      setForm((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  // Room items management
  const addRoom = useCallback(() => {
    setForm((prev) => ({
      ...prev,
      items: [...(prev.items || []), { room: '', items: [] }],
    }));
  }, []);

  const updateRoomName = useCallback((index: number, name: string) => {
    setForm((prev) => ({
      ...prev,
      items: (prev.items || []).map((r, i) => (i === index ? { ...r, room: name } : r)),
    }));
  }, []);

  const removeRoom = useCallback((index: number) => {
    setForm((prev) => ({
      ...prev,
      items: (prev.items || []).filter((_, i) => i !== index),
    }));
  }, []);

  const addItem = useCallback((roomIndex: number) => {
    setForm((prev) => ({
      ...prev,
      items: (prev.items || []).map((r, i) =>
        i === roomIndex
          ? { ...r, items: [...r.items, { name: '', brand: '', material: '', qty: 1, price: 0 }] }
          : r
      ),
    }));
  }, []);

  const updateItem = useCallback(
    (roomIndex: number, itemIndex: number, field: keyof PackageItem, value: string | number) => {
      setForm((prev) => ({
        ...prev,
        items: (prev.items || []).map((r, ri) =>
          ri === roomIndex
            ? {
                ...r,
                items: r.items.map((item, ii) =>
                  ii === itemIndex ? { ...item, [field]: value } : item
                ),
              }
            : r
        ),
      }));
    },
    []
  );

  const removeItem = useCallback((roomIndex: number, itemIndex: number) => {
    setForm((prev) => ({
      ...prev,
      items: (prev.items || []).map((r, ri) =>
        ri === roomIndex ? { ...r, items: r.items.filter((_, ii) => ii !== itemIndex) } : r
      ),
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
            width: 'min(900px, 95vw)',
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
            {pkg ? 'Chỉnh sửa Gói nội thất' : 'Thêm Gói nội thất mới'}
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

        {/* Tabs */}
        <div
          style={{
            display: 'flex',
            gap: 4,
            padding: '12px 20px',
            borderBottom: `1px solid ${tokens.color.border}`,
            background: 'rgba(255,255,255,0.02)',
          }}
        >
          {[
            { key: 'basic', label: 'Thông tin cơ bản', icon: 'ri-information-line' },
            { key: 'items', label: `Sản phẩm (${totalItems})`, icon: 'ri-list-check' },
            { key: 'media', label: 'Hình ảnh', icon: 'ri-image-line' },
          ].map((tab) => (
            <motion.button
              key={tab.key}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setActiveTab(tab.key as 'basic' | 'items' | 'media')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 16px',
                background: activeTab === tab.key ? `${tokens.color.primary}20` : 'transparent',
                border: `1px solid ${activeTab === tab.key ? tokens.color.primary + '40' : 'transparent'}`,
                borderRadius: tokens.radius.md,
                color: activeTab === tab.key ? tokens.color.primary : tokens.color.muted,
                fontSize: 13,
                cursor: 'pointer',
              }}
            >
              <i className={tab.icon} />
              {tab.label}
            </motion.button>
          ))}
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


          {/* Basic Tab */}
          {activeTab === 'basic' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Layout Selection (only for new) */}
              {!pkg && (
                <div>
                  <label style={{ display: 'block', color: tokens.color.muted, fontSize: 13, marginBottom: 6 }}>
                    Layout <span style={{ color: tokens.color.error }}>*</span>
                  </label>
                  <select
                    value={form.layoutId}
                    onChange={(e) => updateField('layoutId', e.target.value)}
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
                    <option value="">-- Chọn layout --</option>
                    {layouts.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.name} ({l.code}) - {l.unitType}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Name & Code */}
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', color: tokens.color.muted, fontSize: 13, marginBottom: 6 }}>
                    Tên gói <span style={{ color: tokens.color.error }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => updateField('name', e.target.value)}
                    placeholder="VD: Gói Premium 2PN"
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
                    Mã gói <span style={{ color: tokens.color.error }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={form.code}
                    onChange={(e) => updateField('code', e.target.value.toUpperCase())}
                    placeholder="VD: PKG-PRE-2PN"
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

              {/* Tier & Price */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', color: tokens.color.muted, fontSize: 13, marginBottom: 6 }}>
                    Tier
                  </label>
                  <select
                    value={form.tier}
                    onChange={(e) => updateField('tier', parseInt(e.target.value) as 1 | 2 | 3 | 4)}
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
                    {TIERS.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', color: tokens.color.muted, fontSize: 13, marginBottom: 6 }}>
                    Giá gói (VNĐ) <span style={{ color: tokens.color.error }}>*</span>
                  </label>
                  <input
                    type="number"
                    value={form.basePrice || ''}
                    onChange={(e) => updateField('basePrice', parseFloat(e.target.value) || 0)}
                    min={0}
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
                    Giá/m² (VNĐ)
                  </label>
                  <input
                    type="number"
                    value={form.pricePerSqm || ''}
                    onChange={(e) => updateField('pricePerSqm', e.target.value ? parseFloat(e.target.value) : undefined)}
                    min={0}
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

              {/* Descriptions */}
              <div>
                <label style={{ display: 'block', color: tokens.color.muted, fontSize: 13, marginBottom: 6 }}>
                  Mô tả ngắn
                </label>
                <input
                  type="text"
                  value={form.shortDescription || ''}
                  onChange={(e) => updateField('shortDescription', e.target.value)}
                  placeholder="Mô tả ngắn gọn cho card hiển thị"
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
                  Mô tả chi tiết
                </label>
                <textarea
                  value={form.description || ''}
                  onChange={(e) => updateField('description', e.target.value)}
                  placeholder="Mô tả chi tiết về gói nội thất..."
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

              {/* Warranty & Installation */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', color: tokens.color.muted, fontSize: 13, marginBottom: 6 }}>
                    Bảo hành (tháng)
                  </label>
                  <input
                    type="number"
                    value={form.warrantyMonths || ''}
                    onChange={(e) => updateField('warrantyMonths', e.target.value ? parseInt(e.target.value) : undefined)}
                    min={0}
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
                    Thời gian lắp đặt (ngày)
                  </label>
                  <input
                    type="number"
                    value={form.installationDays || ''}
                    onChange={(e) => updateField('installationDays', e.target.value ? parseInt(e.target.value) : undefined)}
                    min={0}
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

              {/* Toggles */}
              <div style={{ display: 'flex', gap: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={form.isActive}
                    onChange={(e) => updateField('isActive', e.target.checked)}
                    style={{ width: 16, height: 16, cursor: 'pointer' }}
                  />
                  <label htmlFor="isActive" style={{ color: tokens.color.text, fontSize: 14, cursor: 'pointer' }}>
                    Hiển thị
                  </label>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <input
                    type="checkbox"
                    id="isFeatured"
                    checked={form.isFeatured}
                    onChange={(e) => updateField('isFeatured', e.target.checked)}
                    style={{ width: 16, height: 16, cursor: 'pointer' }}
                  />
                  <label htmlFor="isFeatured" style={{ color: tokens.color.text, fontSize: 14, cursor: 'pointer' }}>
                    <i className="ri-star-fill" style={{ color: tokens.color.warning, marginRight: 4 }} />
                    Nổi bật
                  </label>
                </div>
              </div>
            </div>
          )}


          {/* Items Tab */}
          {activeTab === 'items' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <span style={{ color: tokens.color.text, fontSize: 14, fontWeight: 500 }}>
                    Tổng: {totalItems} sản phẩm
                  </span>
                  <span style={{ color: tokens.color.muted, fontSize: 13, marginLeft: 12 }}>
                    Giá trị: {totalItemsPrice.toLocaleString('vi-VN')} VNĐ
                  </span>
                </div>
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={addRoom}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '8px 16px',
                    background: `${tokens.color.primary}20`,
                    border: `1px solid ${tokens.color.primary}40`,
                    borderRadius: tokens.radius.md,
                    color: tokens.color.primary,
                    fontSize: 13,
                    cursor: 'pointer',
                  }}
                >
                  <i className="ri-add-line" />
                  Thêm phòng
                </motion.button>
              </div>

              {(form.items || []).length === 0 ? (
                <div
                  style={{
                    padding: 40,
                    textAlign: 'center',
                    background: 'rgba(255,255,255,0.02)',
                    borderRadius: tokens.radius.md,
                    border: `1px dashed ${tokens.color.border}`,
                  }}
                >
                  <i className="ri-list-check" style={{ fontSize: 32, color: tokens.color.muted }} />
                  <p style={{ color: tokens.color.muted, marginTop: 8 }}>
                    Chưa có sản phẩm nào. Nhấn "Thêm phòng" để bắt đầu.
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {(form.items || []).map((room, roomIndex) => (
                    <div
                      key={roomIndex}
                      style={{
                        padding: 16,
                        background: 'rgba(255,255,255,0.02)',
                        borderRadius: tokens.radius.md,
                        border: `1px solid ${tokens.color.border}`,
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                        <input
                          type="text"
                          value={room.room}
                          onChange={(e) => updateRoomName(roomIndex, e.target.value)}
                          placeholder="Tên phòng (VD: Phòng khách)"
                          style={{
                            padding: '8px 12px',
                            borderRadius: tokens.radius.sm,
                            border: `1px solid ${tokens.color.border}`,
                            background: tokens.color.background,
                            color: tokens.color.text,
                            fontSize: 14,
                            fontWeight: 500,
                            outline: 'none',
                            width: 200,
                          }}
                        />
                        <div style={{ display: 'flex', gap: 8 }}>
                          <motion.button
                            type="button"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => addItem(roomIndex)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 4,
                              padding: '6px 12px',
                              background: `${tokens.color.accent}20`,
                              border: `1px solid ${tokens.color.accent}40`,
                              borderRadius: tokens.radius.sm,
                              color: tokens.color.accent,
                              fontSize: 12,
                              cursor: 'pointer',
                            }}
                          >
                            <i className="ri-add-line" />
                            Thêm SP
                          </motion.button>
                          <motion.button
                            type="button"
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => removeRoom(roomIndex)}
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
                      </div>

                      {room.items.length === 0 ? (
                        <div style={{ padding: 16, textAlign: 'center', color: tokens.color.muted, fontSize: 13 }}>
                          Chưa có sản phẩm. Nhấn "Thêm SP" để thêm.
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                          {/* Header */}
                          <div
                            style={{
                              display: 'grid',
                              gridTemplateColumns: '2fr 1fr 1fr 80px 100px auto',
                              gap: 8,
                              padding: '4px 0',
                              borderBottom: `1px solid ${tokens.color.border}`,
                            }}
                          >
                            <span style={{ color: tokens.color.muted, fontSize: 11, textTransform: 'uppercase' }}>Tên SP</span>
                            <span style={{ color: tokens.color.muted, fontSize: 11, textTransform: 'uppercase' }}>Thương hiệu</span>
                            <span style={{ color: tokens.color.muted, fontSize: 11, textTransform: 'uppercase' }}>Chất liệu</span>
                            <span style={{ color: tokens.color.muted, fontSize: 11, textTransform: 'uppercase', textAlign: 'center' }}>SL</span>
                            <span style={{ color: tokens.color.muted, fontSize: 11, textTransform: 'uppercase', textAlign: 'right' }}>Đơn giá</span>
                            <span />
                          </div>
                          {room.items.map((item, itemIndex) => (
                            <div
                              key={itemIndex}
                              style={{
                                display: 'grid',
                                gridTemplateColumns: '2fr 1fr 1fr 80px 100px auto',
                                gap: 8,
                                alignItems: 'center',
                              }}
                            >
                              <input
                                type="text"
                                value={item.name}
                                onChange={(e) => updateItem(roomIndex, itemIndex, 'name', e.target.value)}
                                placeholder="Tên sản phẩm"
                                style={{
                                  padding: '6px 8px',
                                  borderRadius: tokens.radius.sm,
                                  border: `1px solid ${tokens.color.border}`,
                                  background: tokens.color.background,
                                  color: tokens.color.text,
                                  fontSize: 13,
                                  outline: 'none',
                                }}
                              />
                              <input
                                type="text"
                                value={item.brand || ''}
                                onChange={(e) => updateItem(roomIndex, itemIndex, 'brand', e.target.value)}
                                placeholder="Thương hiệu"
                                style={{
                                  padding: '6px 8px',
                                  borderRadius: tokens.radius.sm,
                                  border: `1px solid ${tokens.color.border}`,
                                  background: tokens.color.background,
                                  color: tokens.color.text,
                                  fontSize: 13,
                                  outline: 'none',
                                }}
                              />
                              <input
                                type="text"
                                value={item.material || ''}
                                onChange={(e) => updateItem(roomIndex, itemIndex, 'material', e.target.value)}
                                placeholder="Chất liệu"
                                style={{
                                  padding: '6px 8px',
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
                                value={item.qty}
                                onChange={(e) => updateItem(roomIndex, itemIndex, 'qty', parseInt(e.target.value) || 1)}
                                min={1}
                                style={{
                                  padding: '6px 8px',
                                  borderRadius: tokens.radius.sm,
                                  border: `1px solid ${tokens.color.border}`,
                                  background: tokens.color.background,
                                  color: tokens.color.text,
                                  fontSize: 13,
                                  outline: 'none',
                                  textAlign: 'center',
                                }}
                              />
                              <input
                                type="number"
                                value={item.price || ''}
                                onChange={(e) => updateItem(roomIndex, itemIndex, 'price', parseFloat(e.target.value) || 0)}
                                min={0}
                                style={{
                                  padding: '6px 8px',
                                  borderRadius: tokens.radius.sm,
                                  border: `1px solid ${tokens.color.border}`,
                                  background: tokens.color.background,
                                  color: tokens.color.text,
                                  fontSize: 13,
                                  outline: 'none',
                                  textAlign: 'right',
                                }}
                              />
                              <motion.button
                                type="button"
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => removeItem(roomIndex, itemIndex)}
                                style={{
                                  width: 24,
                                  height: 24,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  background: 'transparent',
                                  border: 'none',
                                  color: tokens.color.error,
                                  cursor: 'pointer',
                                }}
                              >
                                <i className="ri-close-line" style={{ fontSize: 14 }} />
                              </motion.button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}


          {/* Media Tab */}
          {activeTab === 'media' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ display: 'block', color: tokens.color.muted, fontSize: 13, marginBottom: 6 }}>
                  Ảnh thumbnail
                </label>
                <input
                  type="text"
                  value={form.thumbnail || ''}
                  onChange={(e) => updateField('thumbnail', e.target.value)}
                  placeholder="URL ảnh thumbnail"
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
                  Video 360°
                </label>
                <input
                  type="text"
                  value={form.video360Url || ''}
                  onChange={(e) => updateField('video360Url', e.target.value)}
                  placeholder="URL video 360°"
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
                  Gallery (mỗi URL một dòng)
                </label>
                <textarea
                  value={(form.images || []).join('\n')}
                  onChange={(e) => updateField('images', e.target.value.split('\n').filter((s) => s.trim()))}
                  placeholder="URL ảnh 1&#10;URL ảnh 2&#10;..."
                  rows={5}
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
                    fontFamily: 'monospace',
                  }}
                />
              </div>
            </div>
          )}

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
              ) : pkg ? (
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

// ========== DELETE MODAL ==========

interface DeleteModalProps {
  pkg: InteriorPackage;
  onClose: () => void;
  onDelete: () => Promise<void>;
}

function DeleteModal({ pkg, onClose, onDelete }: DeleteModalProps) {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
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
            Xóa Gói nội thất
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
            Bạn có chắc muốn xóa <strong style={{ color: tokens.color.text }}>{pkg.name}</strong>?
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
              disabled={deleting}
              style={{
                flex: 1,
                padding: '10px 16px',
                background: tokens.color.error,
                border: 'none',
                borderRadius: tokens.radius.md,
                color: '#fff',
                fontSize: 14,
                fontWeight: 600,
                cursor: deleting ? 'not-allowed' : 'pointer',
                opacity: deleting ? 0.5 : 1,
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

export function PackagesTab() {
  const [packages, setPackages] = useState<InteriorPackage[]>([]);
  const [layouts, setLayouts] = useState<InteriorUnitLayout[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterLayoutId, setFilterLayoutId] = useState<string>('');
  const [filterTier, setFilterTier] = useState<string>('');
  const [showModal, setShowModal] = useState(false);
  const [editingPkg, setEditingPkg] = useState<InteriorPackage | null>(null);
  const [deletePkg, setDeletePkg] = useState<InteriorPackage | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;

  // Fetch layouts
  const fetchLayouts = useCallback(async () => {
    try {
      const response = await interiorLayoutsApi.list({ limit: 100 });
      setLayouts(response.data || []);
    } catch (err) {
      console.error('Failed to fetch layouts:', err);
    }
  }, []);

  // Fetch packages
  const fetchPackages = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await interiorPackagesApi.list({
        layoutId: filterLayoutId || undefined,
        tier: filterTier ? parseInt(filterTier) : undefined,
        page,
        limit,
      });
      setPackages(response.data || []);
      setTotal(response.total || 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể tải danh sách gói');
    } finally {
      setLoading(false);
    }
  }, [filterLayoutId, filterTier, page]);

  useEffect(() => {
    fetchLayouts();
  }, [fetchLayouts]);

  useEffect(() => {
    fetchPackages();
  }, [fetchPackages]);

  // Create package
  const handleCreate = async (data: CreatePackageInput) => {
    await interiorPackagesApi.create(data);
    await fetchPackages();
  };

  // Update package
  const handleUpdate = async (data: UpdatePackageInput) => {
    if (!editingPkg) return;
    await interiorPackagesApi.update(editingPkg.id, data);
    await fetchPackages();
  };

  // Delete package
  const handleDelete = async () => {
    if (!deletePkg) return;
    await interiorPackagesApi.delete(deletePkg.id);
    await fetchPackages();
  };

  // Toggle featured
  const toggleFeatured = async (pkg: InteriorPackage) => {
    await interiorPackagesApi.update(pkg.id, { isFeatured: !pkg.isFeatured });
    await fetchPackages();
  };

  const totalPages = Math.ceil(total / limit);

  const getTierInfo = (tier: number) => TIERS.find((t) => t.value === tier) || TIERS[0];

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
          {/* Filter by layout */}
          <select
            value={filterLayoutId}
            onChange={(e) => {
              setFilterLayoutId(e.target.value);
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
              minWidth: 200,
            }}
          >
            <option value="">Tất cả layout</option>
            {layouts.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name} ({l.code})
              </option>
            ))}
          </select>

          {/* Filter by tier */}
          <select
            value={filterTier}
            onChange={(e) => {
              setFilterTier(e.target.value);
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
            <option value="">Tất cả tier</option>
            {TIERS.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => {
            setEditingPkg(null);
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
          Thêm Gói
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
              onClick={fetchPackages}
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
        ) : packages.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center' }}>
            <i className="ri-gift-line" style={{ fontSize: 48, color: tokens.color.muted }} />
            <p style={{ color: tokens.color.muted, marginTop: 12 }}>
              {filterLayoutId || filterTier ? 'Không tìm thấy gói nào' : 'Chưa có gói nội thất nào'}
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                  <th style={{ padding: '12px 16px', textAlign: 'left', color: tokens.color.muted, fontSize: 12, fontWeight: 600, textTransform: 'uppercase' }}>
                    Gói
                  </th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', color: tokens.color.muted, fontSize: 12, fontWeight: 600, textTransform: 'uppercase' }}>
                    Layout
                  </th>
                  <th style={{ padding: '12px 16px', textAlign: 'center', color: tokens.color.muted, fontSize: 12, fontWeight: 600, textTransform: 'uppercase' }}>
                    Tier
                  </th>
                  <th style={{ padding: '12px 16px', textAlign: 'right', color: tokens.color.muted, fontSize: 12, fontWeight: 600, textTransform: 'uppercase' }}>
                    Giá
                  </th>
                  <th style={{ padding: '12px 16px', textAlign: 'center', color: tokens.color.muted, fontSize: 12, fontWeight: 600, textTransform: 'uppercase' }}>
                    SP
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
                {packages.map((pkg) => {
                  const tierInfo = getTierInfo(pkg.tier);
                  return (
                    <tr key={pkg.id} style={{ borderTop: `1px solid ${tokens.color.border}` }}>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          {pkg.thumbnail ? (
                            <img
                              src={resolveMediaUrl(pkg.thumbnail)}
                              alt={pkg.name}
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
                                background: `${tierInfo.color}20`,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              <i className="ri-gift-line" style={{ fontSize: 20, color: tierInfo.color }} />
                            </div>
                          )}
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <span style={{ color: tokens.color.text, fontSize: 14, fontWeight: 500 }}>
                                {pkg.name}
                              </span>
                              {pkg.isFeatured && (
                                <i className="ri-star-fill" style={{ fontSize: 12, color: tokens.color.warning }} />
                              )}
                            </div>
                            <div style={{ color: tokens.color.muted, fontSize: 12 }}>{pkg.code}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px', color: tokens.color.text, fontSize: 13 }}>
                        {pkg.layout?.name || 'N/A'}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        <span
                          style={{
                            padding: '4px 8px',
                            background: `${tierInfo.color}20`,
                            borderRadius: tokens.radius.sm,
                            color: tierInfo.color,
                            fontSize: 12,
                            fontWeight: 500,
                          }}
                        >
                          {tierInfo.label}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'right', color: tokens.color.text, fontSize: 14 }}>
                        {pkg.basePrice.toLocaleString('vi-VN')} đ
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'center', color: tokens.color.text, fontSize: 14 }}>
                        {pkg.totalItems || 0}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        <span
                          style={{
                            padding: '4px 8px',
                            borderRadius: tokens.radius.sm,
                            fontSize: 12,
                            fontWeight: 500,
                            background: pkg.isActive ? `${tokens.color.success}20` : `${tokens.color.error}20`,
                            color: pkg.isActive ? tokens.color.success : tokens.color.error,
                          }}
                        >
                          {pkg.isActive ? 'Hoạt động' : 'Ẩn'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 4 }}>
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => toggleFeatured(pkg)}
                            title={pkg.isFeatured ? 'Bỏ nổi bật' : 'Đánh dấu nổi bật'}
                            style={{
                              width: 32,
                              height: 32,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              background: pkg.isFeatured ? `${tokens.color.warning}20` : 'rgba(255,255,255,0.05)',
                              border: `1px solid ${pkg.isFeatured ? tokens.color.warning + '40' : tokens.color.border}`,
                              borderRadius: tokens.radius.sm,
                              color: pkg.isFeatured ? tokens.color.warning : tokens.color.muted,
                              cursor: 'pointer',
                            }}
                          >
                            <i className={pkg.isFeatured ? 'ri-star-fill' : 'ri-star-line'} style={{ fontSize: 14 }} />
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => {
                              setEditingPkg(pkg);
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
                            onClick={() => setDeletePkg(pkg)}
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
                  );
                })}
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
          <PackageModal
            pkg={editingPkg}
            layouts={layouts}
            onClose={() => {
              setShowModal(false);
              setEditingPkg(null);
            }}
            onSave={async (data) => {
              if (editingPkg) {
                await handleUpdate(data as UpdatePackageInput);
              } else {
                await handleCreate(data as CreatePackageInput);
              }
            }}
          />
        )}
        {deletePkg && (
          <DeleteModal
            pkg={deletePkg}
            onClose={() => setDeletePkg(null)}
            onDelete={handleDelete}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
