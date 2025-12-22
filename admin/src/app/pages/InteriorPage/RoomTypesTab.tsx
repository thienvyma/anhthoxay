/**
 * Room Types Tab - Manage room types with default categories
 * Task 28.1: Full implementation with table and CRUD
 * Requirements: 10.1-10.4
 */

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { tokens } from '@app/shared';
import { interiorRoomTypesApi, interiorFurnitureCategoriesApi } from '../../api';
import type {
  InteriorRoomType,
  CreateRoomTypeInput,
  UpdateRoomTypeInput,
  InteriorFurnitureCategory,
} from '../../types';

// Common room icons
const ROOM_ICONS = [
  { value: 'ri-home-smile-line', label: 'Phòng khách' },
  { value: 'ri-hotel-bed-line', label: 'Phòng ngủ' },
  { value: 'ri-restaurant-line', label: 'Bếp' },
  { value: 'ri-drop-line', label: 'Phòng tắm' },
  { value: 'ri-door-line', label: 'Cửa' },
  { value: 'ri-sun-line', label: 'Ban công' },
  { value: 'ri-archive-line', label: 'Kho' },
  { value: 'ri-sofa-line', label: 'Sofa' },
  { value: 'ri-tv-line', label: 'TV' },
  { value: 'ri-computer-line', label: 'Làm việc' },
];

// ========== ROOM TYPE MODAL ==========

interface RoomTypeModalProps {
  roomType?: InteriorRoomType | null;
  categories: InteriorFurnitureCategory[];
  onClose: () => void;
  onSave: (data: CreateRoomTypeInput | UpdateRoomTypeInput) => Promise<void>;
}

function RoomTypeModal({ roomType, categories, onClose, onSave }: RoomTypeModalProps) {
  const [form, setForm] = useState<CreateRoomTypeInput>({
    code: roomType?.code || '',
    name: roomType?.name || '',
    nameEn: roomType?.nameEn || '',
    icon: roomType?.icon || 'ri-door-line',
    description: roomType?.description || '',
    defaultCategories: roomType?.defaultCategories || [],
    isActive: roomType?.isActive ?? true,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.code.trim() || !form.name.trim()) {
      setError('Vui lòng nhập mã và tên loại phòng');
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

  const toggleCategory = useCallback((categoryId: string) => {
    setForm((prev) => ({
      ...prev,
      defaultCategories: (prev.defaultCategories || []).includes(categoryId)
        ? (prev.defaultCategories || []).filter((id) => id !== categoryId)
        : [...(prev.defaultCategories || []), categoryId],
    }));
  }, []);

  return (
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
            width: 'min(550px, 95vw)',
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
            {roomType ? 'Chỉnh sửa Loại phòng' : 'Thêm Loại phòng mới'}
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
            <div style={{ padding: '10px 12px', background: `${tokens.color.error}20`, border: `1px solid ${tokens.color.error}40`, borderRadius: tokens.radius.md, color: tokens.color.error, fontSize: 13, marginBottom: 16 }}>
              {error}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Code & Name */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 12 }}>
              <div>
                <label style={{ display: 'block', color: tokens.color.muted, fontSize: 13, marginBottom: 6 }}>
                  Mã <span style={{ color: tokens.color.error }}>*</span>
                </label>
                <input
                  type="text"
                  value={form.code}
                  onChange={(e) => setForm((prev) => ({ ...prev, code: e.target.value.toUpperCase() }))}
                  placeholder="VD: LIVING"
                  disabled={!!roomType}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: tokens.radius.md, border: `1px solid ${tokens.color.border}`, background: roomType ? tokens.color.background : tokens.color.background, color: tokens.color.text, fontSize: 14, outline: 'none', opacity: roomType ? 0.6 : 1 }}
                />
              </div>
              <div>
                <label style={{ display: 'block', color: tokens.color.muted, fontSize: 13, marginBottom: 6 }}>
                  Tên tiếng Việt <span style={{ color: tokens.color.error }}>*</span>
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="VD: Phòng khách"
                  style={{ width: '100%', padding: '10px 12px', borderRadius: tokens.radius.md, border: `1px solid ${tokens.color.border}`, background: tokens.color.background, color: tokens.color.text, fontSize: 14, outline: 'none' }}
                />
              </div>
            </div>

            {/* English Name */}
            <div>
              <label style={{ display: 'block', color: tokens.color.muted, fontSize: 13, marginBottom: 6 }}>
                Tên tiếng Anh
              </label>
              <input
                type="text"
                value={form.nameEn || ''}
                onChange={(e) => setForm((prev) => ({ ...prev, nameEn: e.target.value }))}
                placeholder="VD: Living Room"
                style={{ width: '100%', padding: '10px 12px', borderRadius: tokens.radius.md, border: `1px solid ${tokens.color.border}`, background: tokens.color.background, color: tokens.color.text, fontSize: 14, outline: 'none' }}
              />
            </div>

            {/* Icon Selector */}
            <div>
              <label style={{ display: 'block', color: tokens.color.muted, fontSize: 13, marginBottom: 6 }}>
                Icon
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {ROOM_ICONS.map((icon) => (
                  <motion.button
                    key={icon.value}
                    type="button"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setForm((prev) => ({ ...prev, icon: icon.value }))}
                    title={icon.label}
                    style={{
                      width: 40,
                      height: 40,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: tokens.radius.md,
                      border: `2px solid ${form.icon === icon.value ? tokens.color.primary : tokens.color.border}`,
                      background: form.icon === icon.value ? `${tokens.color.primary}20` : 'transparent',
                      color: form.icon === icon.value ? tokens.color.primary : tokens.color.muted,
                      cursor: 'pointer',
                    }}
                  >
                    <i className={icon.value} style={{ fontSize: 20 }} />
                  </motion.button>
                ))}
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
                placeholder="Mô tả loại phòng..."
                rows={2}
                style={{ width: '100%', padding: '10px 12px', borderRadius: tokens.radius.md, border: `1px solid ${tokens.color.border}`, background: tokens.color.background, color: tokens.color.text, fontSize: 14, outline: 'none', resize: 'vertical' }}
              />
            </div>

            {/* Default Categories */}
            {categories.length > 0 && (
              <div>
                <label style={{ display: 'block', color: tokens.color.muted, fontSize: 13, marginBottom: 6 }}>
                  Danh mục mặc định
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {categories.filter((c) => !c.parentId).map((cat) => (
                    <motion.button
                      key={cat.id}
                      type="button"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => toggleCategory(cat.id)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: tokens.radius.sm,
                        border: `1px solid ${(form.defaultCategories || []).includes(cat.id) ? tokens.color.primary : tokens.color.border}`,
                        background: (form.defaultCategories || []).includes(cat.id) ? `${tokens.color.primary}20` : 'transparent',
                        color: (form.defaultCategories || []).includes(cat.id) ? tokens.color.primary : tokens.color.muted,
                        fontSize: 12,
                        cursor: 'pointer',
                      }}
                    >
                      {cat.icon && <i className={cat.icon} style={{ marginRight: 4 }} />}
                      {cat.name}
                    </motion.button>
                  ))}
                </div>
              </div>
            )}

            {/* Active Toggle */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <input
                type="checkbox"
                id="roomTypeIsActive"
                checked={form.isActive}
                onChange={(e) => setForm((prev) => ({ ...prev, isActive: e.target.checked }))}
                style={{ width: 16, height: 16, cursor: 'pointer' }}
              />
              <label htmlFor="roomTypeIsActive" style={{ color: tokens.color.text, fontSize: 14, cursor: 'pointer' }}>
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
              style={{ padding: '10px 20px', background: 'transparent', border: `1px solid ${tokens.color.border}`, borderRadius: tokens.radius.md, color: tokens.color.text, fontSize: 14, cursor: 'pointer' }}
            >
              Hủy
            </motion.button>
            <motion.button
              type="submit"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              disabled={saving}
              style={{ padding: '10px 20px', background: `linear-gradient(135deg, ${tokens.color.primary}, ${tokens.color.accent})`, border: 'none', borderRadius: tokens.radius.md, color: '#111', fontSize: 14, fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}
            >
              {saving ? 'Đang lưu...' : roomType ? 'Cập nhật' : 'Tạo mới'}
            </motion.button>
          </div>
        </form>
        </motion.div>
      </div>
    </>
  );
}


// ========== MAIN COMPONENT ==========

export function RoomTypesTab() {
  const [roomTypes, setRoomTypes] = useState<InteriorRoomType[]>([]);
  const [categories, setCategories] = useState<InteriorFurnitureCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modal, setModal] = useState<{ open: boolean; roomType?: InteriorRoomType | null }>({ open: false });
  const [deleteTarget, setDeleteTarget] = useState<InteriorRoomType | null>(null);

  // Load room types
  const loadRoomTypes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await interiorRoomTypesApi.list({ limit: 100 });
      setRoomTypes(res.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể tải danh sách loại phòng');
    } finally {
      setLoading(false);
    }
  }, []);

  // Load categories for default selection
  const loadCategories = useCallback(async () => {
    try {
      const response = await interiorFurnitureCategoriesApi.list();
      setCategories(response.data || []);
    } catch (err) {
      console.error('Failed to load categories:', err);
    }
  }, []);

  useEffect(() => {
    loadRoomTypes();
    loadCategories();
  }, [loadRoomTypes, loadCategories]);

  // Save handler
  const handleSave = useCallback(
    async (data: CreateRoomTypeInput | UpdateRoomTypeInput) => {
      if (modal.roomType) {
        await interiorRoomTypesApi.update(modal.roomType.id, data);
      } else {
        await interiorRoomTypesApi.create(data as CreateRoomTypeInput);
      }
      loadRoomTypes();
    },
    [modal.roomType, loadRoomTypes]
  );

  // Delete handler
  const handleDelete = useCallback(async () => {
    if (!deleteTarget) return;
    try {
      await interiorRoomTypesApi.delete(deleteTarget.id);
      loadRoomTypes();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Không thể xóa loại phòng');
    } finally {
      setDeleteTarget(null);
    }
  }, [deleteTarget, loadRoomTypes]);

  // Reorder handler
  const handleReorder = useCallback(async (newOrder: InteriorRoomType[]) => {
    setRoomTypes(newOrder);
    try {
      await interiorRoomTypesApi.reorder(newOrder.map((rt) => rt.id));
    } catch (err) {
      console.error('Failed to reorder:', err);
      loadRoomTypes(); // Reload on error
    }
  }, [loadRoomTypes]);

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <h3 style={{ margin: 0, color: tokens.color.text, fontSize: 16, fontWeight: 600 }}>
          <i className="ri-door-line" style={{ marginRight: 8 }} />
          Quản lý Loại phòng ({roomTypes.length})
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
          Thêm loại phòng
        </motion.button>
      </div>

      {/* Content */}
      <div style={{ background: tokens.color.surface, borderRadius: tokens.radius.lg, border: `1px solid ${tokens.color.border}`, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center' }}>
            <motion.i className="ri-loader-4-line" animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} style={{ fontSize: 32, color: tokens.color.muted }} />
            <p style={{ color: tokens.color.muted, marginTop: 12 }}>Đang tải...</p>
          </div>
        ) : error ? (
          <div style={{ padding: 40, textAlign: 'center' }}>
            <i className="ri-error-warning-line" style={{ fontSize: 48, color: tokens.color.error }} />
            <p style={{ color: tokens.color.error, marginTop: 12 }}>{error}</p>
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={loadRoomTypes} style={{ marginTop: 12, padding: '8px 16px', background: 'rgba(255,255,255,0.05)', border: `1px solid ${tokens.color.border}`, borderRadius: tokens.radius.md, color: tokens.color.text, cursor: 'pointer' }}>
              Thử lại
            </motion.button>
          </div>
        ) : roomTypes.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center' }}>
            <i className="ri-door-line" style={{ fontSize: 48, color: tokens.color.muted }} />
            <p style={{ color: tokens.color.muted, marginTop: 12 }}>Chưa có loại phòng nào</p>
          </div>
        ) : (
          <div style={{ padding: 8 }}>
            <div style={{ padding: '8px 16px', display: 'grid', gridTemplateColumns: '40px 1fr 150px 200px 80px 100px', gap: 12, color: tokens.color.muted, fontSize: 12, fontWeight: 500, borderBottom: `1px solid ${tokens.color.border}` }}>
              <span></span>
              <span>Loại phòng</span>
              <span>Mã</span>
              <span>Danh mục mặc định</span>
              <span style={{ textAlign: 'center' }}>Trạng thái</span>
              <span style={{ textAlign: 'right' }}>Thao tác</span>
            </div>
            <Reorder.Group axis="y" values={roomTypes} onReorder={handleReorder} style={{ listStyle: 'none', margin: 0, padding: 0 }}>
              {roomTypes.map((rt) => (
                <Reorder.Item key={rt.id} value={rt} style={{ listStyle: 'none' }}>
                  <div style={{ padding: '12px 16px', display: 'grid', gridTemplateColumns: '40px 1fr 150px 200px 80px 100px', gap: 12, alignItems: 'center', borderBottom: `1px solid ${tokens.color.border}`, cursor: 'grab' }}>
                    <i className="ri-drag-move-2-line" style={{ color: tokens.color.muted }} />
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', background: `${tokens.color.primary}20`, borderRadius: tokens.radius.md }}>
                        <i className={rt.icon || 'ri-door-line'} style={{ fontSize: 18, color: tokens.color.primary }} />
                      </div>
                      <div>
                        <div style={{ color: tokens.color.text, fontSize: 13, fontWeight: 500 }}>{rt.name}</div>
                        {rt.nameEn && <div style={{ color: tokens.color.muted, fontSize: 11 }}>{rt.nameEn}</div>}
                      </div>
                    </div>
                    <span style={{ color: tokens.color.muted, fontSize: 12, fontFamily: 'monospace' }}>{rt.code}</span>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                      {(rt.defaultCategories || []).slice(0, 3).map((catId) => {
                        const cat = categories.find((c) => c.id === catId);
                        return cat ? (
                          <span key={catId} style={{ padding: '2px 6px', background: `${tokens.color.info}20`, borderRadius: tokens.radius.sm, color: tokens.color.info, fontSize: 10 }}>
                            {cat.name}
                          </span>
                        ) : null;
                      })}
                      {(rt.defaultCategories || []).length > 3 && (
                        <span style={{ padding: '2px 6px', background: `${tokens.color.muted}20`, borderRadius: tokens.radius.sm, color: tokens.color.muted, fontSize: 10 }}>
                          +{(rt.defaultCategories || []).length - 3}
                        </span>
                      )}
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <span style={{ padding: '4px 8px', borderRadius: tokens.radius.sm, background: rt.isActive ? `${tokens.color.success}20` : `${tokens.color.muted}20`, color: rt.isActive ? tokens.color.success : tokens.color.muted, fontSize: 11, fontWeight: 500 }}>
                        {rt.isActive ? 'Hiện' : 'Ẩn'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                      <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => setModal({ open: true, roomType: rt })} style={{ width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', background: `${tokens.color.primary}20`, border: 'none', borderRadius: tokens.radius.sm, color: tokens.color.primary, cursor: 'pointer' }}>
                        <i className="ri-edit-line" style={{ fontSize: 14 }} />
                      </motion.button>
                      <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => setDeleteTarget(rt)} style={{ width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', background: `${tokens.color.error}20`, border: 'none', borderRadius: tokens.radius.sm, color: tokens.color.error, cursor: 'pointer' }}>
                        <i className="ri-delete-bin-line" style={{ fontSize: 14 }} />
                      </motion.button>
                    </div>
                  </div>
                </Reorder.Item>
              ))}
            </Reorder.Group>
          </div>
        )}
      </div>

      {/* Modal */}
      <AnimatePresence>
        {modal.open && (
          <RoomTypeModal
            roomType={modal.roomType}
            categories={categories}
            onClose={() => setModal({ open: false })}
            onSave={handleSave}
          />
        )}
      </AnimatePresence>

      {/* Delete Confirmation */}
      <AnimatePresence>
        {deleteTarget && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setDeleteTarget(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 9998 }} />
            <div style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, pointerEvents: 'none', padding: 16 }}>
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} onClick={(e) => e.stopPropagation()} style={{ width: 'min(400px, 95vw)', background: tokens.color.surface, borderRadius: tokens.radius.lg, border: `1px solid ${tokens.color.border}`, padding: 24, pointerEvents: 'auto' }}>
                <h3 style={{ margin: '0 0 12px', color: tokens.color.text, fontSize: 16, fontWeight: 600 }}>Xác nhận xóa</h3>
                <p style={{ margin: '0 0 20px', color: tokens.color.muted, fontSize: 14 }}>
                  Bạn có chắc muốn xóa loại phòng <strong style={{ color: tokens.color.text }}>{deleteTarget.name}</strong>?
                </p>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => setDeleteTarget(null)} style={{ padding: '10px 20px', background: 'transparent', border: `1px solid ${tokens.color.border}`, borderRadius: tokens.radius.md, color: tokens.color.text, fontSize: 14, cursor: 'pointer' }}>
                    Hủy
                  </motion.button>
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleDelete} style={{ padding: '10px 20px', background: tokens.color.error, border: 'none', borderRadius: tokens.radius.md, color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
                    Xóa
                  </motion.button>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}