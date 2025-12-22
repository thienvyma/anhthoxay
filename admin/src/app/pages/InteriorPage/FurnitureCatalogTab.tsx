/**
 * Furniture Catalog Tab - Manage furniture categories and items
 * Task 25.1: Full implementation with split view
 * Requirements: 7.1-7.6
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { tokens, resolveMediaUrl } from '@app/shared';
import { interiorFurnitureCategoriesApi, interiorFurnitureItemsApi, interiorRoomTypesApi } from '../../api';
import type {
  InteriorFurnitureCategory,
  InteriorFurnitureItem,
  InteriorRoomType,
  CreateFurnitureCategoryInput,
  UpdateFurnitureCategoryInput,
  CreateFurnitureItemInput,
  UpdateFurnitureItemInput,
  FurnitureDimensions,
} from '../../types';

// ========== CATEGORY MODAL ==========

interface CategoryModalProps {
  category?: InteriorFurnitureCategory | null;
  categories: InteriorFurnitureCategory[];
  roomTypes: InteriorRoomType[];
  onClose: () => void;
  onSave: (data: CreateFurnitureCategoryInput | UpdateFurnitureCategoryInput) => Promise<void>;
}

function CategoryModal({ category, categories, roomTypes, onClose, onSave }: CategoryModalProps) {
  const [form, setForm] = useState<CreateFurnitureCategoryInput>({
    name: category?.name || '',
    icon: category?.icon || '',
    description: category?.description || '',
    parentId: category?.parentId || undefined,
    roomTypes: category?.roomTypes || [],
    isActive: category?.isActive ?? true,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filter out current category and its children from parent options
  const parentOptions = useMemo(() => {
    if (!category) return categories;
    const excludeIds = new Set<string>([category.id]);
    const addChildren = (cat: InteriorFurnitureCategory) => {
      (cat.children || []).forEach((c) => {
        excludeIds.add(c.id);
        addChildren(c);
      });
    };
    const current = categories.find((c) => c.id === category.id);
    if (current) addChildren(current);
    return categories.filter((c) => !excludeIds.has(c.id));
  }, [categories, category]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setError('Vui lòng nhập tên danh mục');
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

  const toggleRoomType = useCallback((code: string) => {
    setForm((prev) => ({
      ...prev,
      roomTypes: (prev.roomTypes || []).includes(code)
        ? (prev.roomTypes || []).filter((r) => r !== code)
        : [...(prev.roomTypes || []), code],
    }));
  }, []);

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
            width: 'min(500px, 95vw)',
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
          }}
        >
          <h3 style={{ margin: 0, color: tokens.color.text, fontSize: 16, fontWeight: 600 }}>
            {category ? 'Chỉnh sửa Danh mục' : 'Thêm Danh mục mới'}
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
            {/* Name & Icon */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12 }}>
              <div>
                <label style={{ display: 'block', color: tokens.color.muted, fontSize: 13, marginBottom: 6 }}>
                  Tên danh mục <span style={{ color: tokens.color.error }}>*</span>
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="VD: Sofa"
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
                  Icon (Remix)
                </label>
                <input
                  type="text"
                  value={form.icon || ''}
                  onChange={(e) => setForm((prev) => ({ ...prev, icon: e.target.value }))}
                  placeholder="ri-sofa-line"
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

            {/* Parent Category */}
            <div>
              <label style={{ display: 'block', color: tokens.color.muted, fontSize: 13, marginBottom: 6 }}>
                Danh mục cha
              </label>
              <select
                value={form.parentId || ''}
                onChange={(e) => setForm((prev) => ({ ...prev, parentId: e.target.value || undefined }))}
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
                <option value="">-- Không có (Root) --</option>
                {parentOptions.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.parent ? `${c.parent.name} > ` : ''}{c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Description */}
            <div>
              <label style={{ display: 'block', color: tokens.color.muted, fontSize: 13, marginBottom: 6 }}>
                Mô tả
              </label>
              <textarea
                value={form.description || ''}
                onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Mô tả danh mục..."
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

            {/* Room Types */}
            <div>
              <label style={{ display: 'block', color: tokens.color.muted, fontSize: 13, marginBottom: 6 }}>
                Loại phòng áp dụng
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {roomTypes.map((rt) => (
                  <motion.button
                    key={rt.code}
                    type="button"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => toggleRoomType(rt.code)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: tokens.radius.sm,
                      border: `1px solid ${(form.roomTypes || []).includes(rt.code) ? tokens.color.primary : tokens.color.border}`,
                      background: (form.roomTypes || []).includes(rt.code) ? `${tokens.color.primary}20` : 'transparent',
                      color: (form.roomTypes || []).includes(rt.code) ? tokens.color.primary : tokens.color.muted,
                      fontSize: 12,
                      cursor: 'pointer',
                    }}
                  >
                    {rt.icon && <i className={rt.icon} style={{ marginRight: 4 }} />}
                    {rt.name}
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Active Toggle */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <input
                type="checkbox"
                id="catIsActive"
                checked={form.isActive}
                onChange={(e) => setForm((prev) => ({ ...prev, isActive: e.target.checked }))}
                style={{ width: 16, height: 16, cursor: 'pointer' }}
              />
              <label htmlFor="catIsActive" style={{ color: tokens.color.text, fontSize: 14, cursor: 'pointer' }}>
                Hiển thị
              </label>
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
              {saving ? 'Đang lưu...' : category ? 'Cập nhật' : 'Tạo mới'}
            </motion.button>
          </div>
        </form>
        </motion.div>
      </div>
    </>,
    document.body
  );
}


// ========== ITEM MODAL ==========

interface ItemModalProps {
  item?: InteriorFurnitureItem | null;
  categories: InteriorFurnitureCategory[];
  onClose: () => void;
  onSave: (data: CreateFurnitureItemInput | UpdateFurnitureItemInput) => Promise<void>;
}

function ItemModal({ item, categories, onClose, onSave }: ItemModalProps) {
  const [form, setForm] = useState<CreateFurnitureItemInput>({
    categoryId: item?.categoryId || '',
    name: item?.name || '',
    sku: item?.sku || '',
    brand: item?.brand || '',
    origin: item?.origin || '',
    material: item?.material || '',
    color: item?.color || '',
    dimensions: item?.dimensions || {},
    weight: item?.weight,
    price: item?.price || 0,
    costPrice: item?.costPrice,
    thumbnail: item?.thumbnail || '',
    images: item?.images || [],
    description: item?.description || '',
    features: item?.features || [],
    warrantyMonths: item?.warrantyMonths,
    inStock: item?.inStock ?? true,
    stockQty: item?.stockQty,
    isActive: item?.isActive ?? true,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [featureInput, setFeatureInput] = useState('');
  const [imageInput, setImageInput] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setError('Vui lòng nhập tên sản phẩm');
      return;
    }
    if (!item && !form.categoryId) {
      setError('Vui lòng chọn danh mục');
      return;
    }
    if (form.price <= 0) {
      setError('Giá bán phải lớn hơn 0');
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

  const updateDimension = useCallback((field: keyof FurnitureDimensions, value: number | string | undefined) => {
    setForm((prev) => ({
      ...prev,
      dimensions: { ...prev.dimensions, [field]: value },
    }));
  }, []);

  const addFeature = useCallback(() => {
    if (featureInput.trim()) {
      setForm((prev) => ({ ...prev, features: [...(prev.features || []), featureInput.trim()] }));
      setFeatureInput('');
    }
  }, [featureInput]);

  const removeFeature = useCallback((index: number) => {
    setForm((prev) => ({ ...prev, features: (prev.features || []).filter((_, i) => i !== index) }));
  }, []);

  const addImage = useCallback(() => {
    if (imageInput.trim()) {
      setForm((prev) => ({ ...prev, images: [...(prev.images || []), imageInput.trim()] }));
      setImageInput('');
    }
  }, [imageInput]);

  const removeImage = useCallback((index: number) => {
    setForm((prev) => ({ ...prev, images: (prev.images || []).filter((_, i) => i !== index) }));
  }, []);

  // Flatten categories for select
  const flatCategories = useMemo(() => {
    const result: { id: string; name: string; level: number }[] = [];
    const flatten = (cats: InteriorFurnitureCategory[], level: number) => {
      cats.forEach((c) => {
        result.push({ id: c.id, name: c.name, level });
        if (c.children?.length) flatten(c.children, level + 1);
      });
    };
    flatten(categories.filter((c) => !c.parentId), 0);
    return result;
  }, [categories]);

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
            {item ? 'Chỉnh sửa Sản phẩm' : 'Thêm Sản phẩm mới'}
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
            {/* Category */}
            <div>
              <label style={{ display: 'block', color: tokens.color.muted, fontSize: 13, marginBottom: 6 }}>
                Danh mục <span style={{ color: tokens.color.error }}>*</span>
              </label>
              <select
                value={form.categoryId}
                onChange={(e) => setForm((prev) => ({ ...prev, categoryId: e.target.value }))}
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
                <option value="">-- Chọn danh mục --</option>
                {flatCategories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {'  '.repeat(c.level)}{c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Name & SKU */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12 }}>
              <div>
                <label style={{ display: 'block', color: tokens.color.muted, fontSize: 13, marginBottom: 6 }}>
                  Tên sản phẩm <span style={{ color: tokens.color.error }}>*</span>
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="VD: Sofa góc L"
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
                  SKU
                </label>
                <input
                  type="text"
                  value={form.sku || ''}
                  onChange={(e) => setForm((prev) => ({ ...prev, sku: e.target.value }))}
                  placeholder="VD: SF-001"
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

            {/* Brand, Origin, Material, Color */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
              <div>
                <label style={{ display: 'block', color: tokens.color.muted, fontSize: 13, marginBottom: 6 }}>Thương hiệu</label>
                <input
                  type="text"
                  value={form.brand || ''}
                  onChange={(e) => setForm((prev) => ({ ...prev, brand: e.target.value }))}
                  placeholder="VD: IKEA"
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
                <label style={{ display: 'block', color: tokens.color.muted, fontSize: 13, marginBottom: 6 }}>Xuất xứ</label>
                <input
                  type="text"
                  value={form.origin || ''}
                  onChange={(e) => setForm((prev) => ({ ...prev, origin: e.target.value }))}
                  placeholder="VD: Việt Nam"
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
                <label style={{ display: 'block', color: tokens.color.muted, fontSize: 13, marginBottom: 6 }}>Chất liệu</label>
                <input
                  type="text"
                  value={form.material || ''}
                  onChange={(e) => setForm((prev) => ({ ...prev, material: e.target.value }))}
                  placeholder="VD: Gỗ sồi"
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
                <label style={{ display: 'block', color: tokens.color.muted, fontSize: 13, marginBottom: 6 }}>Màu sắc</label>
                <input
                  type="text"
                  value={form.color || ''}
                  onChange={(e) => setForm((prev) => ({ ...prev, color: e.target.value }))}
                  placeholder="VD: Nâu"
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

            {/* Dimensions */}
            <div
              style={{
                padding: 12,
                background: 'rgba(255,255,255,0.02)',
                borderRadius: tokens.radius.md,
                border: `1px solid ${tokens.color.border}`,
              }}
            >
              <label style={{ display: 'block', color: tokens.color.muted, fontSize: 13, marginBottom: 8 }}>
                <i className="ri-ruler-line" style={{ marginRight: 6 }} />
                Kích thước
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8 }}>
                <div>
                  <label style={{ display: 'block', color: tokens.color.muted, fontSize: 11, marginBottom: 4 }}>Rộng</label>
                  <input
                    type="number"
                    value={form.dimensions?.width || ''}
                    onChange={(e) => updateDimension('width', e.target.value ? parseFloat(e.target.value) : undefined)}
                    step="0.1"
                    min={0}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: tokens.radius.sm,
                      border: `1px solid ${tokens.color.border}`,
                      background: tokens.color.background,
                      color: tokens.color.text,
                      fontSize: 13,
                      outline: 'none',
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', color: tokens.color.muted, fontSize: 11, marginBottom: 4 }}>Cao</label>
                  <input
                    type="number"
                    value={form.dimensions?.height || ''}
                    onChange={(e) => updateDimension('height', e.target.value ? parseFloat(e.target.value) : undefined)}
                    step="0.1"
                    min={0}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: tokens.radius.sm,
                      border: `1px solid ${tokens.color.border}`,
                      background: tokens.color.background,
                      color: tokens.color.text,
                      fontSize: 13,
                      outline: 'none',
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', color: tokens.color.muted, fontSize: 11, marginBottom: 4 }}>Sâu</label>
                  <input
                    type="number"
                    value={form.dimensions?.depth || ''}
                    onChange={(e) => updateDimension('depth', e.target.value ? parseFloat(e.target.value) : undefined)}
                    step="0.1"
                    min={0}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: tokens.radius.sm,
                      border: `1px solid ${tokens.color.border}`,
                      background: tokens.color.background,
                      color: tokens.color.text,
                      fontSize: 13,
                      outline: 'none',
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', color: tokens.color.muted, fontSize: 11, marginBottom: 4 }}>Đơn vị</label>
                  <select
                    value={form.dimensions?.unit || 'cm'}
                    onChange={(e) => updateDimension('unit', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: tokens.radius.sm,
                      border: `1px solid ${tokens.color.border}`,
                      background: tokens.color.background,
                      color: tokens.color.text,
                      fontSize: 13,
                      outline: 'none',
                    }}
                  >
                    <option value="cm">cm</option>
                    <option value="mm">mm</option>
                    <option value="m">m</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', color: tokens.color.muted, fontSize: 11, marginBottom: 4 }}>Cân nặng (kg)</label>
                  <input
                    type="number"
                    value={form.weight || ''}
                    onChange={(e) => setForm((prev) => ({ ...prev, weight: e.target.value ? parseFloat(e.target.value) : undefined }))}
                    step="0.1"
                    min={0}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: tokens.radius.sm,
                      border: `1px solid ${tokens.color.border}`,
                      background: tokens.color.background,
                      color: tokens.color.text,
                      fontSize: 13,
                      outline: 'none',
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Price & Stock */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
              <div>
                <label style={{ display: 'block', color: tokens.color.muted, fontSize: 13, marginBottom: 6 }}>
                  Giá bán (VNĐ) <span style={{ color: tokens.color.error }}>*</span>
                </label>
                <input
                  type="number"
                  value={form.price || ''}
                  onChange={(e) => setForm((prev) => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
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
                <label style={{ display: 'block', color: tokens.color.muted, fontSize: 13, marginBottom: 6 }}>Giá vốn (VNĐ)</label>
                <input
                  type="number"
                  value={form.costPrice || ''}
                  onChange={(e) => setForm((prev) => ({ ...prev, costPrice: e.target.value ? parseFloat(e.target.value) : undefined }))}
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
                <label style={{ display: 'block', color: tokens.color.muted, fontSize: 13, marginBottom: 6 }}>Bảo hành (tháng)</label>
                <input
                  type="number"
                  value={form.warrantyMonths || ''}
                  onChange={(e) => setForm((prev) => ({ ...prev, warrantyMonths: e.target.value ? parseInt(e.target.value) : undefined }))}
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
                <label style={{ display: 'block', color: tokens.color.muted, fontSize: 13, marginBottom: 6 }}>Số lượng tồn</label>
                <input
                  type="number"
                  value={form.stockQty || ''}
                  onChange={(e) => setForm((prev) => ({ ...prev, stockQty: e.target.value ? parseInt(e.target.value) : undefined }))}
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

            {/* Thumbnail */}
            <div>
              <label style={{ display: 'block', color: tokens.color.muted, fontSize: 13, marginBottom: 6 }}>Ảnh đại diện</label>
              <input
                type="text"
                value={form.thumbnail || ''}
                onChange={(e) => setForm((prev) => ({ ...prev, thumbnail: e.target.value }))}
                placeholder="URL ảnh đại diện"
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

            {/* Gallery Images */}
            <div>
              <label style={{ display: 'block', color: tokens.color.muted, fontSize: 13, marginBottom: 6 }}>Thư viện ảnh</label>
              <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                <input
                  type="text"
                  value={imageInput}
                  onChange={(e) => setImageInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addImage())}
                  placeholder="URL ảnh"
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
                  onClick={addImage}
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
              {(form.images || []).length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {(form.images || []).map((img, i) => (
                    <div
                      key={i}
                      style={{
                        position: 'relative',
                        width: 60,
                        height: 60,
                        borderRadius: tokens.radius.sm,
                        overflow: 'hidden',
                        border: `1px solid ${tokens.color.border}`,
                      }}
                    >
                      <img src={resolveMediaUrl(img)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <motion.button
                        type="button"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => removeImage(i)}
                        style={{
                          position: 'absolute',
                          top: 2,
                          right: 2,
                          width: 18,
                          height: 18,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          background: tokens.color.error,
                          border: 'none',
                          borderRadius: '50%',
                          color: '#fff',
                          fontSize: 10,
                          cursor: 'pointer',
                        }}
                      >
                        <i className="ri-close-line" />
                      </motion.button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Description */}
            <div>
              <label style={{ display: 'block', color: tokens.color.muted, fontSize: 13, marginBottom: 6 }}>Mô tả</label>
              <textarea
                value={form.description || ''}
                onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Mô tả sản phẩm..."
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

            {/* Features */}
            <div>
              <label style={{ display: 'block', color: tokens.color.muted, fontSize: 13, marginBottom: 6 }}>Tính năng</label>
              <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                <input
                  type="text"
                  value={featureInput}
                  onChange={(e) => setFeatureInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addFeature())}
                  placeholder="VD: Chống thấm nước"
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
                  onClick={addFeature}
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
              {(form.features || []).length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {(form.features || []).map((f, i) => (
                    <span
                      key={i}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        padding: '4px 10px',
                        background: `${tokens.color.info}20`,
                        borderRadius: tokens.radius.pill,
                        color: tokens.color.info,
                        fontSize: 12,
                      }}
                    >
                      {f}
                      <motion.button
                        type="button"
                        whileHover={{ scale: 1.1 }}
                        onClick={() => removeFeature(i)}
                        style={{ background: 'transparent', border: 'none', color: 'inherit', cursor: 'pointer', padding: 0 }}
                      >
                        <i className="ri-close-line" />
                      </motion.button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Toggles */}
            <div style={{ display: 'flex', gap: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <input
                  type="checkbox"
                  id="itemInStock"
                  checked={form.inStock}
                  onChange={(e) => setForm((prev) => ({ ...prev, inStock: e.target.checked }))}
                  style={{ width: 16, height: 16, cursor: 'pointer' }}
                />
                <label htmlFor="itemInStock" style={{ color: tokens.color.text, fontSize: 14, cursor: 'pointer' }}>
                  Còn hàng
                </label>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <input
                  type="checkbox"
                  id="itemIsActive"
                  checked={form.isActive}
                  onChange={(e) => setForm((prev) => ({ ...prev, isActive: e.target.checked }))}
                  style={{ width: 16, height: 16, cursor: 'pointer' }}
                />
                <label htmlFor="itemIsActive" style={{ color: tokens.color.text, fontSize: 14, cursor: 'pointer' }}>
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
              {saving ? 'Đang lưu...' : item ? 'Cập nhật' : 'Tạo mới'}
            </motion.button>
          </div>
        </form>
        </motion.div>
      </div>
    </>,
    document.body
  );
}


// ========== CATEGORY TREE ITEM ==========

interface CategoryTreeItemProps {
  category: InteriorFurnitureCategory;
  level: number;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onEdit: (cat: InteriorFurnitureCategory) => void;
  onDelete: (cat: InteriorFurnitureCategory) => void;
}

function CategoryTreeItem({ category, level, selectedId, onSelect, onEdit, onDelete }: CategoryTreeItemProps) {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = (category.children || []).length > 0;
  const isSelected = selectedId === category.id;

  return (
    <div>
      <motion.div
        whileHover={{ x: 2 }}
        onClick={() => onSelect(category.id)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '8px 12px',
          paddingLeft: 12 + level * 16,
          background: isSelected ? `${tokens.color.primary}15` : 'transparent',
          borderLeft: isSelected ? `3px solid ${tokens.color.primary}` : '3px solid transparent',
          cursor: 'pointer',
          transition: 'background 0.15s',
        }}
      >
        {hasChildren ? (
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={(e) => {
              e.stopPropagation();
              setExpanded(!expanded);
            }}
            style={{
              width: 20,
              height: 20,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'transparent',
              border: 'none',
              color: tokens.color.muted,
              cursor: 'pointer',
              padding: 0,
            }}
          >
            <i className={expanded ? 'ri-arrow-down-s-line' : 'ri-arrow-right-s-line'} />
          </motion.button>
        ) : (
          <span style={{ width: 20 }} />
        )}
        {category.icon && <i className={category.icon} style={{ color: isSelected ? tokens.color.primary : tokens.color.muted }} />}
        <span
          style={{
            flex: 1,
            color: isSelected ? tokens.color.primary : tokens.color.text,
            fontSize: 13,
            fontWeight: isSelected ? 500 : 400,
          }}
        >
          {category.name}
        </span>
        <span style={{ color: tokens.color.muted, fontSize: 11 }}>{category.itemCount || 0}</span>
        <div style={{ display: 'flex', gap: 4, opacity: 0.6 }} className="actions">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={(e) => {
              e.stopPropagation();
              onEdit(category);
            }}
            style={{
              width: 24,
              height: 24,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'transparent',
              border: 'none',
              color: tokens.color.muted,
              cursor: 'pointer',
              padding: 0,
            }}
          >
            <i className="ri-edit-line" style={{ fontSize: 14 }} />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={(e) => {
              e.stopPropagation();
              onDelete(category);
            }}
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
              padding: 0,
            }}
          >
            <i className="ri-delete-bin-line" style={{ fontSize: 14 }} />
          </motion.button>
        </div>
      </motion.div>
      {hasChildren && expanded && (
        <div>
          {(category.children || []).map((child) => (
            <CategoryTreeItem
              key={child.id}
              category={child}
              level={level + 1}
              selectedId={selectedId}
              onSelect={onSelect}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}


// ========== MAIN COMPONENT ==========

export function FurnitureCatalogTab() {
  // Categories state
  const [categories, setCategories] = useState<InteriorFurnitureCategory[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [categoryModal, setCategoryModal] = useState<{ open: boolean; category?: InteriorFurnitureCategory | null }>({ open: false });
  const [deleteCategory, setDeleteCategory] = useState<InteriorFurnitureCategory | null>(null);

  // Items state
  const [items, setItems] = useState<InteriorFurnitureItem[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const [itemsTotal, setItemsTotal] = useState(0);
  const [itemsPage, setItemsPage] = useState(1);
  const [itemModal, setItemModal] = useState<{ open: boolean; item?: InteriorFurnitureItem | null }>({ open: false });
  const [deleteItem, setDeleteItem] = useState<InteriorFurnitureItem | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [brandFilter, setBrandFilter] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');

  // Room types for category modal
  const [roomTypes, setRoomTypes] = useState<InteriorRoomType[]>([]);

  const ITEMS_PER_PAGE = 10;

  // Build category tree
  const categoryTree = useMemo(() => {
    const map = new Map<string, InteriorFurnitureCategory>();
    categories.forEach((c) => map.set(c.id, { ...c, children: [] }));
    const roots: InteriorFurnitureCategory[] = [];
    map.forEach((c) => {
      if (c.parentId && map.has(c.parentId)) {
        const parent = map.get(c.parentId);
        if (parent) {
          parent.children = [...(parent.children || []), c];
        }
      } else {
        roots.push(c);
      }
    });
    return roots.sort((a, b) => a.order - b.order);
  }, [categories]);

  // Load categories
  const loadCategories = useCallback(async () => {
    setLoadingCategories(true);
    try {
      const response = await interiorFurnitureCategoriesApi.list();
      // API returns PaginatedResponse with data array
      setCategories(response.data || []);
    } catch (err) {
      console.error('Failed to load categories:', err);
      setCategories([]);
    } finally {
      setLoadingCategories(false);
    }
  }, []);

  // Load items
  const loadItems = useCallback(async () => {
    setLoadingItems(true);
    try {
      const res = await interiorFurnitureItemsApi.list({
        categoryId: selectedCategoryId || undefined,
        search: search || undefined,
        brand: brandFilter || undefined,
        minPrice: minPrice ? parseFloat(minPrice) : undefined,
        maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
        page: itemsPage,
        limit: ITEMS_PER_PAGE,
      });
      setItems(res.data);
      setItemsTotal(res.total);
    } catch (err) {
      console.error('Failed to load items:', err);
    } finally {
      setLoadingItems(false);
    }
  }, [selectedCategoryId, search, brandFilter, minPrice, maxPrice, itemsPage]);

  // Load room types
  const loadRoomTypes = useCallback(async () => {
    try {
      const res = await interiorRoomTypesApi.list({ isActive: true });
      setRoomTypes(res.data);
    } catch (err) {
      console.error('Failed to load room types:', err);
    }
  }, []);

  useEffect(() => {
    loadCategories();
    loadRoomTypes();
  }, [loadCategories, loadRoomTypes]);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  // Reset page when filters change
  useEffect(() => {
    setItemsPage(1);
  }, [selectedCategoryId, search, brandFilter, minPrice, maxPrice]);

  // Category handlers
  const handleSaveCategory = useCallback(
    async (data: CreateFurnitureCategoryInput | UpdateFurnitureCategoryInput) => {
      if (categoryModal.category) {
        await interiorFurnitureCategoriesApi.update(categoryModal.category.id, data);
      } else {
        await interiorFurnitureCategoriesApi.create(data as CreateFurnitureCategoryInput);
      }
      loadCategories();
    },
    [categoryModal.category, loadCategories]
  );

  const handleDeleteCategory = useCallback(async () => {
    if (!deleteCategory) return;
    try {
      await interiorFurnitureCategoriesApi.delete(deleteCategory.id);
      loadCategories();
      if (selectedCategoryId === deleteCategory.id) {
        setSelectedCategoryId(null);
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Không thể xóa danh mục');
    } finally {
      setDeleteCategory(null);
    }
  }, [deleteCategory, loadCategories, selectedCategoryId]);

  // Item handlers
  const handleSaveItem = useCallback(
    async (data: CreateFurnitureItemInput | UpdateFurnitureItemInput) => {
      if (itemModal.item) {
        await interiorFurnitureItemsApi.update(itemModal.item.id, data);
      } else {
        await interiorFurnitureItemsApi.create(data as CreateFurnitureItemInput);
      }
      loadItems();
    },
    [itemModal.item, loadItems]
  );

  const handleDeleteItem = useCallback(async () => {
    if (!deleteItem) return;
    try {
      await interiorFurnitureItemsApi.delete(deleteItem.id);
      loadItems();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Không thể xóa sản phẩm');
    } finally {
      setDeleteItem(null);
    }
  }, [deleteItem, loadItems]);

  const totalPages = Math.ceil(itemsTotal / ITEMS_PER_PAGE);

  return (
    <div style={{ display: 'flex', gap: 20, height: 'calc(100vh - 200px)', minHeight: 500 }}>
      {/* Categories Panel */}
      <div
        style={{
          width: 280,
          flexShrink: 0,
          background: tokens.color.surface,
          borderRadius: tokens.radius.lg,
          border: `1px solid ${tokens.color.border}`,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            padding: '12px 16px',
            borderBottom: `1px solid ${tokens.color.border}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <h4 style={{ margin: 0, color: tokens.color.text, fontSize: 14, fontWeight: 600 }}>
            <i className="ri-folder-line" style={{ marginRight: 8 }} />
            Danh mục
          </h4>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setCategoryModal({ open: true })}
            style={{
              width: 28,
              height: 28,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: `${tokens.color.primary}20`,
              border: 'none',
              borderRadius: tokens.radius.sm,
              color: tokens.color.primary,
              cursor: 'pointer',
            }}
          >
            <i className="ri-add-line" />
          </motion.button>
        </div>

        <div style={{ flex: 1, overflow: 'auto' }}>
          {loadingCategories ? (
            <div style={{ padding: 20, textAlign: 'center' }}>
              <motion.i
                className="ri-loader-4-line"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                style={{ fontSize: 24, color: tokens.color.muted }}
              />
            </div>
          ) : categoryTree.length === 0 ? (
            <div style={{ padding: 20, textAlign: 'center', color: tokens.color.muted, fontSize: 13 }}>
              Chưa có danh mục nào
            </div>
          ) : (
            <>
              {/* All items option */}
              <motion.div
                whileHover={{ x: 2 }}
                onClick={() => setSelectedCategoryId(null)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '8px 12px',
                  background: selectedCategoryId === null ? `${tokens.color.primary}15` : 'transparent',
                  borderLeft: selectedCategoryId === null ? `3px solid ${tokens.color.primary}` : '3px solid transparent',
                  cursor: 'pointer',
                }}
              >
                <i className="ri-apps-line" style={{ color: selectedCategoryId === null ? tokens.color.primary : tokens.color.muted }} />
                <span
                  style={{
                    flex: 1,
                    color: selectedCategoryId === null ? tokens.color.primary : tokens.color.text,
                    fontSize: 13,
                    fontWeight: selectedCategoryId === null ? 500 : 400,
                  }}
                >
                  Tất cả sản phẩm
                </span>
              </motion.div>
              {categoryTree.map((cat) => (
                <CategoryTreeItem
                  key={cat.id}
                  category={cat}
                  level={0}
                  selectedId={selectedCategoryId}
                  onSelect={setSelectedCategoryId}
                  onEdit={(c) => setCategoryModal({ open: true, category: c })}
                  onDelete={setDeleteCategory}
                />
              ))}
            </>
          )}
        </div>
      </div>

      {/* Items Panel */}
      <div
        style={{
          flex: 1,
          background: tokens.color.surface,
          borderRadius: tokens.radius.lg,
          border: `1px solid ${tokens.color.border}`,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '12px 16px',
            borderBottom: `1px solid ${tokens.color.border}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
          }}
        >
          <h4 style={{ margin: 0, color: tokens.color.text, fontSize: 14, fontWeight: 600 }}>
            <i className="ri-sofa-line" style={{ marginRight: 8 }} />
            Sản phẩm ({itemsTotal})
          </h4>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setItemModal({ open: true })}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '8px 16px',
              background: `linear-gradient(135deg, ${tokens.color.primary}, ${tokens.color.accent})`,
              border: 'none',
              borderRadius: tokens.radius.md,
              color: '#111',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <i className="ri-add-line" />
            Thêm sản phẩm
          </motion.button>
        </div>

        {/* Filters */}
        <div
          style={{
            padding: '12px 16px',
            borderBottom: `1px solid ${tokens.color.border}`,
            display: 'flex',
            gap: 12,
            flexWrap: 'wrap',
          }}
        >
          <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
            <i
              className="ri-search-line"
              style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: tokens.color.muted }}
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm kiếm sản phẩm..."
              style={{
                width: '100%',
                padding: '8px 12px 8px 36px',
                borderRadius: tokens.radius.md,
                border: `1px solid ${tokens.color.border}`,
                background: tokens.color.background,
                color: tokens.color.text,
                fontSize: 13,
                outline: 'none',
              }}
            />
          </div>
          <input
            type="text"
            value={brandFilter}
            onChange={(e) => setBrandFilter(e.target.value)}
            placeholder="Thương hiệu"
            style={{
              width: 120,
              padding: '8px 12px',
              borderRadius: tokens.radius.md,
              border: `1px solid ${tokens.color.border}`,
              background: tokens.color.background,
              color: tokens.color.text,
              fontSize: 13,
              outline: 'none',
            }}
          />
          <input
            type="number"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
            placeholder="Giá từ"
            style={{
              width: 100,
              padding: '8px 12px',
              borderRadius: tokens.radius.md,
              border: `1px solid ${tokens.color.border}`,
              background: tokens.color.background,
              color: tokens.color.text,
              fontSize: 13,
              outline: 'none',
            }}
          />
          <input
            type="number"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            placeholder="Giá đến"
            style={{
              width: 100,
              padding: '8px 12px',
              borderRadius: tokens.radius.md,
              border: `1px solid ${tokens.color.border}`,
              background: tokens.color.background,
              color: tokens.color.text,
              fontSize: 13,
              outline: 'none',
            }}
          />
        </div>

        {/* Table */}
        <div style={{ flex: 1, overflow: 'auto' }}>
          {loadingItems ? (
            <div style={{ padding: 40, textAlign: 'center' }}>
              <motion.i
                className="ri-loader-4-line"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                style={{ fontSize: 32, color: tokens.color.muted }}
              />
            </div>
          ) : items.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center' }}>
              <i className="ri-inbox-line" style={{ fontSize: 48, color: tokens.color.muted }} />
              <p style={{ color: tokens.color.muted, marginTop: 8 }}>Không có sản phẩm nào</p>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${tokens.color.border}` }}>
                  <th style={{ padding: '12px 16px', textAlign: 'left', color: tokens.color.muted, fontSize: 12, fontWeight: 500 }}>Sản phẩm</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', color: tokens.color.muted, fontSize: 12, fontWeight: 500 }}>Danh mục</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', color: tokens.color.muted, fontSize: 12, fontWeight: 500 }}>Thương hiệu</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right', color: tokens.color.muted, fontSize: 12, fontWeight: 500 }}>Giá</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center', color: tokens.color.muted, fontSize: 12, fontWeight: 500 }}>Tồn kho</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center', color: tokens.color.muted, fontSize: 12, fontWeight: 500 }}>Trạng thái</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right', color: tokens.color.muted, fontSize: 12, fontWeight: 500 }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} style={{ borderBottom: `1px solid ${tokens.color.border}` }}>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        {item.thumbnail ? (
                          <img
                            src={resolveMediaUrl(item.thumbnail)}
                            alt={item.name}
                            style={{ width: 40, height: 40, borderRadius: tokens.radius.sm, objectFit: 'cover' }}
                          />
                        ) : (
                          <div
                            style={{
                              width: 40,
                              height: 40,
                              borderRadius: tokens.radius.sm,
                              background: tokens.color.background,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <i className="ri-image-line" style={{ color: tokens.color.muted }} />
                          </div>
                        )}
                        <div>
                          <div style={{ color: tokens.color.text, fontSize: 13, fontWeight: 500 }}>{item.name}</div>
                          {item.sku && <div style={{ color: tokens.color.muted, fontSize: 11 }}>{item.sku}</div>}
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px', color: tokens.color.muted, fontSize: 13 }}>
                      {item.category?.name || '-'}
                    </td>
                    <td style={{ padding: '12px 16px', color: tokens.color.text, fontSize: 13 }}>
                      {item.brand || '-'}
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right', color: tokens.color.text, fontSize: 13, fontWeight: 500 }}>
                      {item.price.toLocaleString('vi-VN')} đ
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                      <span
                        style={{
                          padding: '4px 8px',
                          borderRadius: tokens.radius.sm,
                          background: item.inStock ? `${tokens.color.success}20` : `${tokens.color.error}20`,
                          color: item.inStock ? tokens.color.success : tokens.color.error,
                          fontSize: 11,
                          fontWeight: 500,
                        }}
                      >
                        {item.inStock ? (item.stockQty !== undefined ? item.stockQty : 'Còn') : 'Hết'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                      <span
                        style={{
                          padding: '4px 8px',
                          borderRadius: tokens.radius.sm,
                          background: item.isActive ? `${tokens.color.success}20` : `${tokens.color.muted}20`,
                          color: item.isActive ? tokens.color.success : tokens.color.muted,
                          fontSize: 11,
                          fontWeight: 500,
                        }}
                      >
                        {item.isActive ? 'Hiện' : 'Ẩn'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => setItemModal({ open: true, item })}
                          style={{
                            width: 28,
                            height: 28,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: `${tokens.color.primary}20`,
                            border: 'none',
                            borderRadius: tokens.radius.sm,
                            color: tokens.color.primary,
                            cursor: 'pointer',
                          }}
                        >
                          <i className="ri-edit-line" style={{ fontSize: 14 }} />
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => setDeleteItem(item)}
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
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

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
              Hiển thị {(itemsPage - 1) * ITEMS_PER_PAGE + 1}-{Math.min(itemsPage * ITEMS_PER_PAGE, itemsTotal)} / {itemsTotal}
            </span>
            <div style={{ display: 'flex', gap: 4 }}>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setItemsPage((p) => Math.max(1, p - 1))}
                disabled={itemsPage === 1}
                style={{
                  padding: '6px 12px',
                  background: 'transparent',
                  border: `1px solid ${tokens.color.border}`,
                  borderRadius: tokens.radius.sm,
                  color: itemsPage === 1 ? tokens.color.muted : tokens.color.text,
                  fontSize: 13,
                  cursor: itemsPage === 1 ? 'not-allowed' : 'pointer',
                  opacity: itemsPage === 1 ? 0.5 : 1,
                }}
              >
                <i className="ri-arrow-left-s-line" />
              </motion.button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let page: number;
                if (totalPages <= 5) {
                  page = i + 1;
                } else if (itemsPage <= 3) {
                  page = i + 1;
                } else if (itemsPage >= totalPages - 2) {
                  page = totalPages - 4 + i;
                } else {
                  page = itemsPage - 2 + i;
                }
                return (
                  <motion.button
                    key={page}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setItemsPage(page)}
                    style={{
                      padding: '6px 12px',
                      background: itemsPage === page ? tokens.color.primary : 'transparent',
                      border: `1px solid ${itemsPage === page ? tokens.color.primary : tokens.color.border}`,
                      borderRadius: tokens.radius.sm,
                      color: itemsPage === page ? '#111' : tokens.color.text,
                      fontSize: 13,
                      fontWeight: itemsPage === page ? 600 : 400,
                      cursor: 'pointer',
                    }}
                  >
                    {page}
                  </motion.button>
                );
              })}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setItemsPage((p) => Math.min(totalPages, p + 1))}
                disabled={itemsPage === totalPages}
                style={{
                  padding: '6px 12px',
                  background: 'transparent',
                  border: `1px solid ${tokens.color.border}`,
                  borderRadius: tokens.radius.sm,
                  color: itemsPage === totalPages ? tokens.color.muted : tokens.color.text,
                  fontSize: 13,
                  cursor: itemsPage === totalPages ? 'not-allowed' : 'pointer',
                  opacity: itemsPage === totalPages ? 0.5 : 1,
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
        {categoryModal.open && (
          <CategoryModal
            category={categoryModal.category}
            categories={categories}
            roomTypes={roomTypes}
            onClose={() => setCategoryModal({ open: false })}
            onSave={handleSaveCategory}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {itemModal.open && (
          <ItemModal
            item={itemModal.item}
            categories={categories}
            onClose={() => setItemModal({ open: false })}
            onSave={handleSaveItem}
          />
        )}
      </AnimatePresence>

      {/* Delete Category Confirmation */}
      <AnimatePresence>
        {deleteCategory && createPortal(
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDeleteCategory(null)}
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
                  Bạn có chắc muốn xóa danh mục <strong style={{ color: tokens.color.text }}>{deleteCategory.name}</strong>?
                  {(deleteCategory.children?.length || 0) > 0 && (
                    <span style={{ display: 'block', marginTop: 8, color: tokens.color.warning }}>
                      <i className="ri-alert-line" style={{ marginRight: 4 }} />
                      Danh mục này có {deleteCategory.children?.length} danh mục con.
                    </span>
                  )}
                </p>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setDeleteCategory(null)}
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
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleDeleteCategory}
                    style={{
                      padding: '10px 20px',
                      background: tokens.color.error,
                      border: 'none',
                      borderRadius: tokens.radius.md,
                      color: '#fff',
                      fontSize: 14,
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
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

      {/* Delete Item Confirmation */}
      <AnimatePresence>
        {deleteItem && createPortal(
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDeleteItem(null)}
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
                  Bạn có chắc muốn xóa sản phẩm <strong style={{ color: tokens.color.text }}>{deleteItem.name}</strong>?
                </p>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setDeleteItem(null)}
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
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleDeleteItem}
                    style={{
                      padding: '10px 20px',
                      background: tokens.color.error,
                      border: 'none',
                      borderRadius: tokens.radius.md,
                      color: '#fff',
                      fontSize: 14,
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
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
