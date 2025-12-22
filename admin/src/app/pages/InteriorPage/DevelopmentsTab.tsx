/**
 * Developments Tab - Manage interior developments (Dự án)
 * Task 20.1: Full implementation with table and CRUD
 * Requirements: 2.1-2.6
 */

import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { tokens, resolveMediaUrl } from '@app/shared';
import { interiorDevelopmentsApi, interiorDevelopersApi } from '../../api';
import type {
  InteriorDevelopment,
  InteriorDeveloper,
  CreateDevelopmentInput,
  UpdateDevelopmentInput,
} from '../../types';

// ========== DEVELOPMENT MODAL ==========

interface DevelopmentModalProps {
  development?: InteriorDevelopment | null;
  developers: InteriorDeveloper[];
  onClose: () => void;
  onSave: (data: CreateDevelopmentInput | UpdateDevelopmentInput) => Promise<void>;
}

function DevelopmentModal({ development, developers, onClose, onSave }: DevelopmentModalProps) {
  const [form, setForm] = useState<CreateDevelopmentInput>({
    developerId: development?.developerId || '',
    name: development?.name || '',
    code: development?.code || '',
    address: development?.address || '',
    district: development?.district || '',
    city: development?.city || '',
    description: development?.description || '',
    thumbnail: development?.thumbnail || '',
    images: development?.images || [],
    totalBuildings: development?.totalBuildings || undefined,
    totalUnits: development?.totalUnits || undefined,
    startYear: development?.startYear || undefined,
    completionYear: development?.completionYear || undefined,
    isActive: development?.isActive ?? true,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newImageUrl, setNewImageUrl] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.developerId) {
      setError('Vui lòng chọn chủ đầu tư');
      return;
    }
    if (!form.name.trim()) {
      setError('Tên dự án là bắt buộc');
      return;
    }
    if (!form.code.trim()) {
      setError('Mã dự án là bắt buộc');
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
    <K extends keyof CreateDevelopmentInput>(field: K, value: CreateDevelopmentInput[K]) => {
      setForm((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  const addImage = useCallback(() => {
    if (newImageUrl.trim()) {
      setForm((prev) => ({
        ...prev,
        images: [...(prev.images || []), newImageUrl.trim()],
      }));
      setNewImageUrl('');
    }
  }, [newImageUrl]);

  const removeImage = useCallback((index: number) => {
    setForm((prev) => ({
      ...prev,
      images: (prev.images || []).filter((_, i) => i !== index),
    }));
  }, []);

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
            width: 'min(640px, 95vw)',
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
            {development ? 'Chỉnh sửa dự án' : 'Thêm dự án mới'}
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
            {/* Developer Select */}
            <div>
              <label
                style={{ display: 'block', color: tokens.color.muted, fontSize: 13, marginBottom: 6 }}
              >
                Chủ đầu tư <span style={{ color: tokens.color.error }}>*</span>
              </label>
              <select
                value={form.developerId}
                onChange={(e) => updateField('developerId', e.target.value)}
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
                <option value="">-- Chọn chủ đầu tư --</option>
                {developers.map((dev) => (
                  <option key={dev.id} value={dev.id}>
                    {dev.name}
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
                  Tên dự án <span style={{ color: tokens.color.error }}>*</span>
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => updateField('name', e.target.value)}
                  placeholder="VD: Vinhomes Grand Park"
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
                  Mã dự án <span style={{ color: tokens.color.error }}>*</span>
                </label>
                <input
                  type="text"
                  value={form.code}
                  onChange={(e) => updateField('code', e.target.value.toUpperCase())}
                  placeholder="VD: VGP"
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

            {/* Address */}
            <div>
              <label
                style={{ display: 'block', color: tokens.color.muted, fontSize: 13, marginBottom: 6 }}
              >
                Địa chỉ
              </label>
              <input
                type="text"
                value={form.address || ''}
                onChange={(e) => updateField('address', e.target.value)}
                placeholder="Số nhà, đường..."
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

            {/* District & City Row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label
                  style={{ display: 'block', color: tokens.color.muted, fontSize: 13, marginBottom: 6 }}
                >
                  Quận/Huyện
                </label>
                <input
                  type="text"
                  value={form.district || ''}
                  onChange={(e) => updateField('district', e.target.value)}
                  placeholder="VD: Quận 9"
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
                  Tỉnh/Thành phố
                </label>
                <input
                  type="text"
                  value={form.city || ''}
                  onChange={(e) => updateField('city', e.target.value)}
                  placeholder="VD: TP. Hồ Chí Minh"
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
              <label
                style={{ display: 'block', color: tokens.color.muted, fontSize: 13, marginBottom: 6 }}
              >
                Mô tả
              </label>
              <textarea
                value={form.description || ''}
                onChange={(e) => updateField('description', e.target.value)}
                placeholder="Giới thiệu về dự án..."
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

            {/* Thumbnail */}
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
                <div style={{ marginTop: 8 }}>
                  <img
                    src={resolveMediaUrl(form.thumbnail)}
                    alt="Thumbnail preview"
                    style={{
                      height: 80,
                      maxWidth: 160,
                      objectFit: 'cover',
                      borderRadius: tokens.radius.sm,
                      background: 'rgba(255,255,255,0.05)',
                    }}
                  />
                </div>
              )}
            </div>

            {/* Gallery Images */}
            <div>
              <label
                style={{ display: 'block', color: tokens.color.muted, fontSize: 13, marginBottom: 6 }}
              >
                Thư viện ảnh
              </label>
              <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                <input
                  type="text"
                  value={newImageUrl}
                  onChange={(e) => setNewImageUrl(e.target.value)}
                  placeholder="Nhập URL ảnh..."
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
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addImage();
                    }
                  }}
                />
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={addImage}
                  style={{
                    padding: '10px 16px',
                    background: 'rgba(255,255,255,0.05)',
                    border: `1px solid ${tokens.color.border}`,
                    borderRadius: tokens.radius.md,
                    color: tokens.color.text,
                    cursor: 'pointer',
                  }}
                >
                  <i className="ri-add-line" />
                </motion.button>
              </div>
              {form.images && form.images.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {form.images.map((img, idx) => (
                    <div
                      key={idx}
                      style={{
                        position: 'relative',
                        width: 80,
                        height: 60,
                      }}
                    >
                      <img
                        src={resolveMediaUrl(img)}
                        alt={`Gallery ${idx + 1}`}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          borderRadius: tokens.radius.sm,
                        }}
                      />
                      <motion.button
                        type="button"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => removeImage(idx)}
                        style={{
                          position: 'absolute',
                          top: -6,
                          right: -6,
                          width: 20,
                          height: 20,
                          borderRadius: '50%',
                          background: tokens.color.error,
                          border: 'none',
                          color: '#fff',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 12,
                        }}
                      >
                        <i className="ri-close-line" />
                      </motion.button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Stats Row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label
                  style={{ display: 'block', color: tokens.color.muted, fontSize: 13, marginBottom: 6 }}
                >
                  Tổng số tòa
                </label>
                <input
                  type="number"
                  value={form.totalBuildings || ''}
                  onChange={(e) =>
                    updateField('totalBuildings', e.target.value ? parseInt(e.target.value) : undefined)
                  }
                  placeholder="VD: 10"
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
                <label
                  style={{ display: 'block', color: tokens.color.muted, fontSize: 13, marginBottom: 6 }}
                >
                  Tổng số căn hộ
                </label>
                <input
                  type="number"
                  value={form.totalUnits || ''}
                  onChange={(e) =>
                    updateField('totalUnits', e.target.value ? parseInt(e.target.value) : undefined)
                  }
                  placeholder="VD: 5000"
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

            {/* Year Row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label
                  style={{ display: 'block', color: tokens.color.muted, fontSize: 13, marginBottom: 6 }}
                >
                  Năm khởi công
                </label>
                <input
                  type="number"
                  value={form.startYear || ''}
                  onChange={(e) =>
                    updateField('startYear', e.target.value ? parseInt(e.target.value) : undefined)
                  }
                  placeholder="VD: 2020"
                  min={2000}
                  max={2100}
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
                  Năm hoàn thành
                </label>
                <input
                  type="number"
                  value={form.completionYear || ''}
                  onChange={(e) =>
                    updateField('completionYear', e.target.value ? parseInt(e.target.value) : undefined)
                  }
                  placeholder="VD: 2025"
                  min={2000}
                  max={2100}
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
              ) : development ? (
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
  development: InteriorDevelopment;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

function DeleteModal({ development, onClose, onConfirm }: DeleteModalProps) {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    setDeleting(true);
    setError(null);
    try {
      await onConfirm();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể xóa dự án');
    } finally {
      setDeleting(false);
    }
  };

  const hasDependencies = Boolean(development.buildingCount && development.buildingCount > 0);

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
          <h3 style={{ margin: '0 0 8px', color: tokens.color.text, fontSize: 18 }}>Xóa dự án?</h3>
          <p style={{ margin: 0, color: tokens.color.muted, fontSize: 14 }}>
            Bạn có chắc muốn xóa <strong style={{ color: tokens.color.text }}>{development.name}</strong>
            ?
            {hasDependencies && (
              <span style={{ display: 'block', marginTop: 8, color: tokens.color.warning }}>
                ⚠️ Dự án này có {development.buildingCount} tòa nhà. Không thể xóa.
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

export function DevelopmentsTab() {
  const [developments, setDevelopments] = useState<InteriorDevelopment[]>([]);
  const [developers, setDevelopers] = useState<InteriorDeveloper[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filterDeveloperId, setFilterDeveloperId] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingDevelopment, setEditingDevelopment] = useState<InteriorDevelopment | null>(null);
  const [deletingDevelopment, setDeletingDevelopment] = useState<InteriorDevelopment | null>(null);

  // Fetch developers for filter dropdown
  const fetchDevelopers = useCallback(async () => {
    try {
      const response = await interiorDevelopersApi.list({ limit: 100 });
      setDevelopers(response.data || []);
    } catch (err) {
      console.error('Failed to fetch developers:', err);
    }
  }, []);

  // Fetch developments
  const fetchDevelopments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await interiorDevelopmentsApi.list({
        developerId: filterDeveloperId || undefined,
        search: search || undefined,
      });
      setDevelopments(response.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể tải danh sách');
    } finally {
      setLoading(false);
    }
  }, [search, filterDeveloperId]);

  useEffect(() => {
    fetchDevelopers();
  }, [fetchDevelopers]);

  useEffect(() => {
    fetchDevelopments();
  }, [fetchDevelopments]);

  // Create development
  const handleCreate = async (data: CreateDevelopmentInput) => {
    await interiorDevelopmentsApi.create(data);
    await fetchDevelopments();
  };

  // Update development
  const handleUpdate = async (data: UpdateDevelopmentInput) => {
    if (!editingDevelopment) return;
    await interiorDevelopmentsApi.update(editingDevelopment.id, data);
    await fetchDevelopments();
  };

  // Delete development
  const handleDelete = async () => {
    if (!deletingDevelopment) return;
    await interiorDevelopmentsApi.delete(deletingDevelopment.id);
    await fetchDevelopments();
  };

  // Toggle active status
  const handleToggleActive = async (development: InteriorDevelopment) => {
    try {
      await interiorDevelopmentsApi.update(development.id, { isActive: !development.isActive });
      await fetchDevelopments();
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
          {/* Developer Filter */}
          <select
            value={filterDeveloperId}
            onChange={(e) => setFilterDeveloperId(e.target.value)}
            style={{
              padding: '8px 12px',
              borderRadius: tokens.radius.md,
              border: `1px solid ${tokens.color.border}`,
              background: tokens.color.background,
              color: tokens.color.text,
              fontSize: 14,
              outline: 'none',
              minWidth: 180,
            }}
          >
            <option value="">Tất cả chủ đầu tư</option>
            {developers.map((dev) => (
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
            setEditingDevelopment(null);
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
          Thêm dự án
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
              onClick={fetchDevelopments}
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
        ) : developments.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center' }}>
            <i className="ri-community-line" style={{ fontSize: 48, color: tokens.color.muted }} />
            <p style={{ color: tokens.color.muted, marginTop: 12 }}>
              {search || filterDeveloperId ? 'Không tìm thấy kết quả' : 'Chưa có dự án nào'}
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
                  Dự án
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
                  Chủ đầu tư
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
                  Mã
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
                  Tòa nhà
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
              {developments.map((development) => (
                <motion.tr
                  key={development.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  style={{ borderBottom: `1px solid ${tokens.color.border}` }}
                >
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      {development.thumbnail ? (
                        <img
                          src={resolveMediaUrl(development.thumbnail)}
                          alt={development.name}
                          style={{
                            width: 48,
                            height: 36,
                            borderRadius: tokens.radius.sm,
                            objectFit: 'cover',
                            background: 'rgba(255,255,255,0.05)',
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            width: 48,
                            height: 36,
                            borderRadius: tokens.radius.sm,
                            background: `${tokens.color.primary}20`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <i
                            className="ri-community-line"
                            style={{ fontSize: 18, color: tokens.color.primary }}
                          />
                        </div>
                      )}
                      <div>
                        <div style={{ color: tokens.color.text, fontWeight: 500 }}>
                          {development.name}
                        </div>
                        {(development.district || development.city) && (
                          <div style={{ color: tokens.color.muted, fontSize: 12 }}>
                            {[development.district, development.city].filter(Boolean).join(', ')}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ color: tokens.color.muted, fontSize: 13 }}>
                      {development.developer?.name || '-'}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                    <span
                      style={{
                        padding: '2px 8px',
                        borderRadius: tokens.radius.sm,
                        background: 'rgba(255,255,255,0.05)',
                        color: tokens.color.text,
                        fontSize: 12,
                        fontFamily: 'monospace',
                      }}
                    >
                      {development.code}
                    </span>
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
                      {development.buildingCount || 0}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleToggleActive(development)}
                      style={{
                        padding: '4px 10px',
                        borderRadius: tokens.radius.sm,
                        background: development.isActive
                          ? `${tokens.color.success}20`
                          : `${tokens.color.error}20`,
                        color: development.isActive ? tokens.color.success : tokens.color.error,
                        fontSize: 12,
                        fontWeight: 600,
                        border: 'none',
                        cursor: 'pointer',
                      }}
                    >
                      {development.isActive ? 'Hiển thị' : 'Ẩn'}
                    </motion.button>
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => {
                          setEditingDevelopment(development);
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
                        onClick={() => setDeletingDevelopment(development)}
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
          <DevelopmentModal
            development={editingDevelopment}
            developers={developers}
            onClose={() => {
              setShowModal(false);
              setEditingDevelopment(null);
            }}
            onSave={async (data) => {
              if (editingDevelopment) {
                await handleUpdate(data as UpdateDevelopmentInput);
              } else {
                await handleCreate(data as CreateDevelopmentInput);
              }
            }}
          />
        )}
        {deletingDevelopment && (
          <DeleteModal
            development={deletingDevelopment}
            onClose={() => setDeletingDevelopment(null)}
            onConfirm={handleDelete}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
