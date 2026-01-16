/**
 * Media Library Page
 * Upload and manage images, mark as featured for slideshow
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { resolveMediaUrl } from '@app/shared';
import { tokens } from '../../../theme';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { mediaApi } from '../../api';
import { MediaAsset } from '../../types';
import { useToast } from '../../components/Toast';
import { ResponsiveGrid, ResponsiveStack, ResponsiveModal } from '../../../components/responsive';
import { useResponsive } from '../../../hooks/useResponsive';

export function MediaPage() {
  const toast = useToast();
  const { isMobile } = useResponsive();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // State
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [mediaFiles, setMediaFiles] = useState<MediaAsset[]>([]);
  const [selectedFile, setSelectedFile] = useState<MediaAsset | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [fileToDelete, setFileToDelete] = useState<MediaAsset | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'featured' | 'normal'>('all');

  // Load data
  useEffect(() => {
    loadMedia();
  }, []);

  const loadMedia = async () => {
    try {
      setLoading(true);
      const data = await mediaApi.list();
      setMediaFiles(data);
    } catch {
      toast.error('Không thể tải danh sách media');
    } finally {
      setLoading(false);
    }
  };

  // Handle file upload
  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      const uploadPromises = Array.from(files).map((file) => mediaApi.upload(file, 'gallery'));
      const results = await Promise.all(uploadPromises);
      setMediaFiles((prev) => [...results, ...prev]);
      toast.success(`Đã upload ${results.length} file!`);
    } catch (error) {
      toast.error('Upload thất bại: ' + (error as Error).message);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Handle delete - show confirm modal
  const handleDeleteClick = useCallback((file: MediaAsset) => {
    setFileToDelete(file);
    setShowDeleteModal(true);
  }, []);

  // Confirm delete
  const handleConfirmDelete = async () => {
    if (!fileToDelete) return;
    setDeleting(true);
    try {
      await mediaApi.delete(fileToDelete.id);
      setMediaFiles((prev) => prev.filter((f) => f.id !== fileToDelete.id));
      toast.success('Đã xóa!');
      setShowDeleteModal(false);
      setFileToDelete(null);
    } catch {
      toast.error('Không thể xóa file');
    } finally {
      setDeleting(false);
    }
  };

  // Handle toggle featured
  const handleToggleFeatured = async (file: MediaAsset) => {
    try {
      const updated = await mediaApi.updateMetadata(file.id, {
        isFeatured: !file.isFeatured,
      });
      setMediaFiles((prev) => prev.map((f) => (f.id === file.id ? { ...f, ...updated } : f)));
      toast.success(updated.isFeatured ? 'Đã đánh dấu Featured' : 'Đã bỏ Featured');
    } catch {
      toast.error('Không thể cập nhật');
    }
  };

  // Handle edit click
  const handleEditClick = useCallback((file: MediaAsset) => {
    setSelectedFile(file);
    setShowEditModal(true);
  }, []);

  // Handle save edit
  const handleSaveEdit = useCallback(
    async (data: { alt?: string; caption?: string; tags?: string }) => {
      if (!selectedFile) return;
      try {
        const updated = await mediaApi.updateMetadata(selectedFile.id, data);
        setMediaFiles((prev) => prev.map((f) => (f.id === selectedFile.id ? { ...f, ...updated } : f)));
        setShowEditModal(false);
        setSelectedFile(null);
        toast.success('Đã lưu!');
      } catch {
        toast.error('Không thể lưu');
      }
    },
    [selectedFile, toast]
  );

  // Copy URL
  const copyToClipboard = useCallback(
    (url: string) => {
      navigator.clipboard.writeText(resolveMediaUrl(url));
      toast.info('Đã copy URL!');
    },
    [toast]
  );

  // Filtering
  const filteredFiles = mediaFiles.filter((file) => {
    const matchesSearch =
      (file.alt?.toLowerCase().includes(searchQuery.toLowerCase()) || false) ||
      (file.tags?.toLowerCase().includes(searchQuery.toLowerCase()) || false) ||
      file.url.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;
    if (filter === 'all') return true;
    if (filter === 'featured') return file.isFeatured;
    if (filter === 'normal') return !file.isFeatured;
    return true;
  });

  const sortedFiles = [...filteredFiles].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const featuredCount = mediaFiles.filter((f) => f.isFeatured).length;

  // Loading state
  if (loading) {
    return (
      <div style={{ padding: 60, textAlign: 'center' }}>
        <motion.i
          className="ri-loader-4-line"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          style={{ fontSize: 48, display: 'block', marginBottom: 16, color: tokens.color.primary }}
        />
        <p style={{ color: tokens.color.muted }}>Đang tải...</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto', padding: isMobile ? '0 16px' : '0 24px' }}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          marginBottom: isMobile ? 20 : 32,
          background: tokens.color.surface,
          border: `1px solid ${tokens.color.border}`,
          borderRadius: isMobile ? tokens.radius.md : tokens.radius.lg,
          padding: isMobile ? '16px' : '24px',
        }}
      >
        <ResponsiveStack
          direction={{ mobile: 'column', tablet: 'row', desktop: 'row' }}
          align={isMobile ? 'stretch' : 'center'}
          justify="between"
          gap={16}
          style={{ marginBottom: 20 }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 12 : 16 }}>
            <div
              style={{
                width: isMobile ? 44 : 56,
                height: isMobile ? 44 : 56,
                borderRadius: isMobile ? '12px' : '16px',
                background: `${tokens.color.primary}15`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: isMobile ? 22 : 28,
                color: tokens.color.primary,
              }}
            >
              <i className="ri-gallery-line" />
            </div>
            <div>
              <h1
                style={{
                  fontSize: isMobile ? 22 : 28,
                  fontWeight: 700,
                  color: tokens.color.text,
                  margin: 0,
                }}
              >
                Media Library
              </h1>
              <p style={{ color: tokens.color.muted, fontSize: isMobile ? 12 : 14, margin: '2px 0 0 0' }}>
                {mediaFiles.length} files • {featuredCount} featured
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => handleFileUpload(e.target.files)}
              style={{ display: 'none' }}
            />
            <Button
              variant="primary"
              icon="ri-upload-cloud-line"
              onClick={() => fileInputRef.current?.click()}
              loading={uploading}
            >
              Upload
            </Button>
          </div>
        </ResponsiveStack>

        {/* Toolbar */}
        <ResponsiveStack
          direction={{ mobile: 'column', tablet: 'row', desktop: 'row' }}
          gap={12}
          align={isMobile ? 'stretch' : 'center'}
        >
          <div style={{ flex: 1, minWidth: isMobile ? '100%' : 200 }}>
            <Input
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Tìm kiếm..."
              icon="ri-search-line"
              fullWidth
            />
          </div>

          {/* Filter Tabs */}
          <div
            style={{
              display: 'flex',
              gap: 4,
              background: tokens.color.surfaceHover,
              borderRadius: tokens.radius.md,
              padding: 4,
            }}
          >
            {[
              { value: 'all', label: 'Tất cả', icon: 'ri-image-line' },
              { value: 'featured', label: 'Featured', icon: 'ri-star-line' },
              { value: 'normal', label: 'Thường', icon: 'ri-image-2-line' },
            ].map((tab) => (
              <motion.button
                key={tab.value}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setFilter(tab.value as typeof filter)}
                style={{
                  padding: '8px 16px',
                  background:
                    filter === tab.value
                      ? tokens.color.primary
                      : 'transparent',
                  border: 'none',
                  borderRadius: tokens.radius.sm,
                  color: filter === tab.value ? '#111' : tokens.color.muted,
                  cursor: 'pointer',
                  fontSize: 13,
                  fontWeight: filter === tab.value ? 500 : 400,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <i className={tab.icon} />
                {!isMobile && tab.label}
              </motion.button>
            ))}
          </div>
        </ResponsiveStack>
      </motion.div>

      {/* Info Banner */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        style={{
          marginBottom: 20,
          padding: '12px 16px',
          background: `${tokens.color.info}15`,
          border: `1px solid ${tokens.color.info}30`,
          borderRadius: tokens.radius.md,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <i className="ri-information-line" style={{ color: tokens.color.info, fontSize: 20 }} />
        <span style={{ color: tokens.color.text, fontSize: 13 }}>
          <strong>Landing Gallery Only</strong> - Trang này chỉ quản lý ảnh cho Gallery và Slideshow trên Landing Page.
          Đánh dấu <strong>Featured</strong> để hiển thị trong Slideshow.
          Ảnh cho Furniture, Materials, Blog được quản lý riêng trong từng module.
        </span>
      </motion.div>

      {/* Content */}
      {sortedFiles.length === 0 ? (
        <EmptyState searchQuery={searchQuery} filter={filter} onUpload={() => fileInputRef.current?.click()} />
      ) : (
        <ResponsiveGrid cols={{ mobile: 2, tablet: 3, desktop: 4 }} gap={{ mobile: 12, tablet: 16, desktop: 16 }}>
          {sortedFiles.map((file, index) => (
            <MediaCard
              key={file.id}
              file={file}
              index={index}
              onEdit={handleEditClick}
              onDelete={handleDeleteClick}
              onToggleFeatured={handleToggleFeatured}
              onCopy={copyToClipboard}
            />
          ))}
        </ResponsiveGrid>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedFile && (
        <EditMediaModal
          file={selectedFile}
          onSave={handleSaveEdit}
          onClose={() => {
            setShowEditModal(false);
            setSelectedFile(null);
          }}
        />
      )}

      {/* Delete Confirm Modal */}
      {showDeleteModal && fileToDelete && (
        <DeleteConfirmModal
          file={fileToDelete}
          deleting={deleting}
          onConfirm={handleConfirmDelete}
          onClose={() => {
            setShowDeleteModal(false);
            setFileToDelete(null);
          }}
        />
      )}
    </div>
  );
}

// Empty State
function EmptyState({
  searchQuery,
  filter,
  onUpload,
}: {
  searchQuery: string;
  filter: string;
  onUpload: () => void;
}) {
  const getEmptyMessage = () => {
    if (searchQuery) return 'Không tìm thấy file nào';
    if (filter === 'featured') return 'Chưa có ảnh nào được đánh dấu Featured';
    if (filter === 'normal') return 'Không có ảnh thường';
    return 'Chưa có file nào. Upload để bắt đầu!';
  };

  return (
    <div
      style={{
        textAlign: 'center',
        padding: 60,
        background: tokens.color.surface,
        borderRadius: tokens.radius.lg,
        border: `1px solid ${tokens.color.border}`,
      }}
    >
      <i
        className="ri-gallery-line"
        style={{ fontSize: 64, color: tokens.color.border, marginBottom: 16, display: 'block' }}
      />
      <p style={{ color: tokens.color.muted, marginBottom: 20, fontSize: 15 }}>{getEmptyMessage()}</p>
      {!searchQuery && filter === 'all' && (
        <Button onClick={onUpload} icon="ri-upload-cloud-line" variant="primary">
          Upload Files
        </Button>
      )}
    </div>
  );
}

// Media Card Component
function MediaCard({
  file,
  index,
  onEdit,
  onDelete,
  onToggleFeatured,
  onCopy,
}: {
  file: MediaAsset;
  index: number;
  onEdit: (file: MediaAsset) => void;
  onDelete: (file: MediaAsset) => void;
  onToggleFeatured: (file: MediaAsset) => void;
  onCopy: (url: string) => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
      style={{
        background: tokens.color.surface,
        borderRadius: tokens.radius.lg,
        border: `1px solid ${file.isFeatured ? tokens.color.primary : tokens.color.border}`,
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {/* Image */}
      <div style={{ position: 'relative', paddingTop: '75%' }}>
        <img
          src={resolveMediaUrl(file.url)}
          alt={file.alt || 'Media'}
          loading="lazy"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        />

        {/* Featured Badge */}
        {file.isFeatured && (
          <div
            style={{
              position: 'absolute',
              top: 8,
              left: 8,
              padding: '4px 8px',
              borderRadius: tokens.radius.sm,
              background: tokens.color.primary,
              color: '#111',
              fontSize: 10,
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <i className="ri-star-fill" style={{ fontSize: 10 }} />
            FEATURED
          </div>
        )}

        {/* Hover Actions */}
        <motion.div
          initial={{ opacity: 0 }}
          whileHover={{ opacity: 1 }}
          style={{
            position: 'absolute',
            inset: 0,
            background: tokens.color.overlay,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
          }}
        >
          <ActionButton icon="ri-star-line" color={tokens.color.warning} onClick={() => onToggleFeatured(file)} title={file.isFeatured ? 'Bỏ Featured' : 'Đánh dấu Featured'} />
          <ActionButton icon="ri-file-copy-line" color={tokens.color.primary} onClick={() => onCopy(file.url)} title="Copy URL" />
          <ActionButton icon="ri-edit-line" color={tokens.color.info} onClick={() => onEdit(file)} title="Chỉnh sửa" />
          <ActionButton icon="ri-delete-bin-line" color={tokens.color.error} onClick={() => onDelete(file)} title="Xóa" />
        </motion.div>
      </div>

      {/* Info */}
      <div style={{ padding: 12 }}>
        <div
          style={{
            fontSize: 13,
            fontWeight: 500,
            color: tokens.color.text,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            marginBottom: 4,
          }}
        >
          {file.alt || 'Untitled'}
        </div>
        <div style={{ fontSize: 11, color: tokens.color.muted }}>
          {file.width && file.height ? `${file.width} × ${file.height}` : 'Unknown'} •{' '}
          {new Date(file.createdAt).toLocaleDateString('vi-VN')}
        </div>
      </div>
    </motion.div>
  );
}

// Action Button
function ActionButton({
  icon,
  color,
  onClick,
  title,
}: {
  icon: string;
  color: string;
  onClick: () => void;
  title: string;
}) {
  return (
    <motion.button
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      style={{
        padding: 10,
        background: `${color}20`,
        border: `1px solid ${color}40`,
        borderRadius: tokens.radius.md,
        color,
        cursor: 'pointer',
        fontSize: 16,
      }}
      title={title}
    >
      <i className={icon} />
    </motion.button>
  );
}

// Edit Media Modal
function EditMediaModal({
  file,
  onSave,
  onClose,
}: {
  file: MediaAsset;
  onSave: (data: { alt?: string; caption?: string; tags?: string }) => void;
  onClose: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    alt: file.alt || '',
    caption: file.caption || '',
    tags: file.tags || '',
  });

  const handleSubmit = async () => {
    setSaving(true);
    try {
      onSave(form);
    } finally {
      setSaving(false);
    }
  };

  return (
    <ResponsiveModal
      isOpen={true}
      onClose={onClose}
      title="Chỉnh sửa Media"
      size="md"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} style={{ width: '100%' }}>
            Hủy
          </Button>
          <Button variant="primary" onClick={handleSubmit} loading={saving} icon="ri-check-line" style={{ width: '100%' }}>
            Lưu
          </Button>
        </>
      }
    >
      {/* Preview */}
      <div style={{ marginBottom: 20 }}>
        <img
          src={resolveMediaUrl(file.url)}
          alt={file.alt || 'Media'}
          style={{ width: '100%', height: 200, objectFit: 'cover', borderRadius: tokens.radius.md }}
        />
      </div>

      {/* Form */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <Input
          label="Alt text (SEO)"
          value={form.alt}
          onChange={(v) => setForm((prev) => ({ ...prev, alt: v }))}
          placeholder="Mô tả hình ảnh cho SEO"
          fullWidth
        />
        <Input
          label="Caption"
          value={form.caption}
          onChange={(v) => setForm((prev) => ({ ...prev, caption: v }))}
          placeholder="Chú thích hình ảnh"
          fullWidth
        />
        <Input
          label="Tags"
          value={form.tags}
          onChange={(v) => setForm((prev) => ({ ...prev, tags: v }))}
          placeholder="tag1, tag2, tag3"
          fullWidth
        />
      </div>
    </ResponsiveModal>
  );
}

// Delete Confirm Modal
function DeleteConfirmModal({
  file,
  deleting,
  onConfirm,
  onClose,
}: {
  file: MediaAsset;
  deleting: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <ResponsiveModal
      isOpen={true}
      onClose={onClose}
      title="Xác nhận xóa"
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={deleting} style={{ width: '100%' }}>
            Hủy
          </Button>
          <Button variant="danger" onClick={onConfirm} loading={deleting} icon="ri-delete-bin-line" style={{ width: '100%' }}>
            Xóa
          </Button>
        </>
      }
    >
      <div style={{ textAlign: 'center' }}>
        {/* Preview */}
        <div style={{ marginBottom: 16 }}>
          <img
            src={resolveMediaUrl(file.url)}
            alt={file.alt || 'Media'}
            style={{
              width: 120,
              height: 120,
              objectFit: 'cover',
              borderRadius: tokens.radius.md,
              border: `2px solid ${tokens.color.error}40`,
            }}
          />
        </div>

        {/* Warning Icon */}
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: '50%',
            background: `${tokens.color.error}15`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
          }}
        >
          <i className="ri-error-warning-line" style={{ fontSize: 28, color: tokens.color.error }} />
        </div>

        {/* Message */}
        <p style={{ color: tokens.color.text, fontSize: 15, marginBottom: 8 }}>
          Bạn có chắc muốn xóa file này?
        </p>
        <p style={{ color: tokens.color.muted, fontSize: 13, margin: 0 }}>
          Hành động này không thể hoàn tác.
        </p>
      </div>
    </ResponsiveModal>
  );
}

export default MediaPage;
