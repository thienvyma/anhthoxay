/**
 * Developers Tab - Manage interior developers (Chủ đầu tư)
 * Task 19.1: Full implementation with table and CRUD
 * Requirements: 1.1-1.6
 */

import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { tokens, resolveMediaUrl } from '@app/shared';
import { interiorDevelopersApi } from '../../api';
import type { InteriorDeveloper, CreateDeveloperInput, UpdateDeveloperInput } from '../../types';

// ========== DEVELOPER MODAL ==========

interface DeveloperModalProps {
  developer?: InteriorDeveloper | null;
  onClose: () => void;
  onSave: (data: CreateDeveloperInput | UpdateDeveloperInput) => Promise<void>;
}

function DeveloperModal({ developer, onClose, onSave }: DeveloperModalProps) {
  const [form, setForm] = useState<CreateDeveloperInput>({
    name: developer?.name || '',
    logo: developer?.logo || '',
    description: developer?.description || '',
    website: developer?.website || '',
    phone: developer?.phone || '',
    email: developer?.email || '',
    address: developer?.address || '',
    isActive: developer?.isActive ?? true,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setError('Tên chủ đầu tư là bắt buộc');
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
    <K extends keyof CreateDeveloperInput>(field: K, value: CreateDeveloperInput[K]) => {
      setForm((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

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
            width: 'min(560px, 95vw)',
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
          }}
        >
          <h3 style={{ margin: 0, color: tokens.color.text, fontSize: 16, fontWeight: 600 }}>
            {developer ? 'Chỉnh sửa chủ đầu tư' : 'Thêm chủ đầu tư mới'}
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
            {/* Name */}
            <div>
              <label
                style={{ display: 'block', color: tokens.color.muted, fontSize: 13, marginBottom: 6 }}
              >
                Tên chủ đầu tư <span style={{ color: tokens.color.error }}>*</span>
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => updateField('name', e.target.value)}
                placeholder="VD: Vingroup, Novaland..."
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

            {/* Logo URL */}
            <div>
              <label
                style={{ display: 'block', color: tokens.color.muted, fontSize: 13, marginBottom: 6 }}
              >
                Logo URL
              </label>
              <input
                type="text"
                value={form.logo || ''}
                onChange={(e) => updateField('logo', e.target.value)}
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
              {form.logo && (
                <div style={{ marginTop: 8 }}>
                  <img
                    src={resolveMediaUrl(form.logo)}
                    alt="Logo preview"
                    style={{
                      height: 40,
                      maxWidth: 120,
                      objectFit: 'contain',
                      borderRadius: tokens.radius.sm,
                      background: 'rgba(255,255,255,0.05)',
                    }}
                  />
                </div>
              )}
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
                placeholder="Giới thiệu về chủ đầu tư..."
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

            {/* Contact Info Row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label
                  style={{ display: 'block', color: tokens.color.muted, fontSize: 13, marginBottom: 6 }}
                >
                  Website
                </label>
                <input
                  type="text"
                  value={form.website || ''}
                  onChange={(e) => updateField('website', e.target.value)}
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
              </div>
              <div>
                <label
                  style={{ display: 'block', color: tokens.color.muted, fontSize: 13, marginBottom: 6 }}
                >
                  Điện thoại
                </label>
                <input
                  type="text"
                  value={form.phone || ''}
                  onChange={(e) => updateField('phone', e.target.value)}
                  placeholder="0901234567"
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

            {/* Email */}
            <div>
              <label
                style={{ display: 'block', color: tokens.color.muted, fontSize: 13, marginBottom: 6 }}
              >
                Email
              </label>
              <input
                type="email"
                value={form.email || ''}
                onChange={(e) => updateField('email', e.target.value)}
                placeholder="contact@example.com"
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
                placeholder="Địa chỉ văn phòng..."
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
              ) : developer ? (
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
  developer: InteriorDeveloper;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

function DeleteModal({ developer, onClose, onConfirm }: DeleteModalProps) {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    setDeleting(true);
    setError(null);
    try {
      await onConfirm();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể xóa chủ đầu tư');
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
          <h3 style={{ margin: '0 0 8px', color: tokens.color.text, fontSize: 18 }}>
            Xóa chủ đầu tư?
          </h3>
          <p style={{ margin: 0, color: tokens.color.muted, fontSize: 14 }}>
            Bạn có chắc muốn xóa <strong style={{ color: tokens.color.text }}>{developer.name}</strong>?
            {developer.developmentCount && developer.developmentCount > 0 && (
              <span style={{ display: 'block', marginTop: 8, color: tokens.color.warning }}>
                ⚠️ Chủ đầu tư này có {developer.developmentCount} dự án. Không thể xóa.
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
            disabled={deleting || Boolean(developer.developmentCount && developer.developmentCount > 0)}
            style={{
              flex: 1,
              padding: '10px 16px',
              background: tokens.color.error,
              border: 'none',
              borderRadius: tokens.radius.md,
              color: '#fff',
              fontSize: 14,
              fontWeight: 600,
              cursor: deleting || (developer.developmentCount && developer.developmentCount > 0) ? 'not-allowed' : 'pointer',
              opacity: (deleting || (developer.developmentCount && developer.developmentCount > 0)) ? 0.5 : 1,
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

export function DevelopersTab() {
  const [developers, setDevelopers] = useState<InteriorDeveloper[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingDeveloper, setEditingDeveloper] = useState<InteriorDeveloper | null>(null);
  const [deletingDeveloper, setDeletingDeveloper] = useState<InteriorDeveloper | null>(null);

  // Fetch developers
  const fetchDevelopers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await interiorDevelopersApi.list({ search: search || undefined });
      setDevelopers(response.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể tải danh sách');
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    fetchDevelopers();
  }, [fetchDevelopers]);

  // Create developer
  const handleCreate = async (data: CreateDeveloperInput) => {
    await interiorDevelopersApi.create(data);
    await fetchDevelopers();
  };

  // Update developer
  const handleUpdate = async (data: UpdateDeveloperInput) => {
    if (!editingDeveloper) return;
    await interiorDevelopersApi.update(editingDeveloper.id, data);
    await fetchDevelopers();
  };

  // Delete developer
  const handleDelete = async () => {
    if (!deletingDeveloper) return;
    await interiorDevelopersApi.delete(deletingDeveloper.id);
    await fetchDevelopers();
  };

  // Toggle active status
  const handleToggleActive = async (developer: InteriorDeveloper) => {
    try {
      await interiorDevelopersApi.update(developer.id, { isActive: !developer.isActive });
      await fetchDevelopers();
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
                fontSize: 16,
              }}
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm kiếm..."
              style={{
                width: 240,
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
            setEditingDeveloper(null);
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
          Thêm chủ đầu tư
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
              onClick={fetchDevelopers}
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
        ) : developers.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center' }}>
            <i className="ri-building-4-line" style={{ fontSize: 48, color: tokens.color.muted }} />
            <p style={{ color: tokens.color.muted, marginTop: 12 }}>
              {search ? 'Không tìm thấy kết quả' : 'Chưa có chủ đầu tư nào'}
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
                  Chủ đầu tư
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
              {developers.map((developer) => (
                <motion.tr
                  key={developer.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  style={{ borderBottom: `1px solid ${tokens.color.border}` }}
                >
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      {developer.logo ? (
                        <img
                          src={resolveMediaUrl(developer.logo)}
                          alt={developer.name}
                          style={{
                            width: 40,
                            height: 40,
                            borderRadius: tokens.radius.sm,
                            objectFit: 'contain',
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
                            className="ri-building-4-line"
                            style={{ fontSize: 20, color: tokens.color.primary }}
                          />
                        </div>
                      )}
                      <div>
                        <div style={{ color: tokens.color.text, fontWeight: 500 }}>{developer.name}</div>
                        {developer.website && (
                          <a
                            href={developer.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              color: tokens.color.muted,
                              fontSize: 12,
                              textDecoration: 'none',
                            }}
                          >
                            {developer.website.replace(/^https?:\/\//, '')}
                          </a>
                        )}
                      </div>
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
                      {developer.developmentCount || 0}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleToggleActive(developer)}
                      style={{
                        padding: '4px 10px',
                        borderRadius: tokens.radius.sm,
                        background: developer.isActive ? `${tokens.color.success}20` : `${tokens.color.error}20`,
                        color: developer.isActive ? tokens.color.success : tokens.color.error,
                        fontSize: 12,
                        fontWeight: 600,
                        border: 'none',
                        cursor: 'pointer',
                      }}
                    >
                      {developer.isActive ? 'Hiển thị' : 'Ẩn'}
                    </motion.button>
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => {
                          setEditingDeveloper(developer);
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
                        onClick={() => setDeletingDeveloper(developer)}
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
          <DeveloperModal
            developer={editingDeveloper}
            onClose={() => {
              setShowModal(false);
              setEditingDeveloper(null);
            }}
            onSave={async (data) => {
              if (editingDeveloper) {
                await handleUpdate(data as UpdateDeveloperInput);
              } else {
                await handleCreate(data as CreateDeveloperInput);
              }
            }}
          />
        )}
        {deletingDeveloper && (
          <DeleteModal
            developer={deletingDeveloper}
            onClose={() => setDeletingDeveloper(null)}
            onConfirm={handleDelete}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
