import { useState, useRef, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { tokens, resolveMediaUrl } from '@app/shared';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { mediaApi } from '../api';
import { MediaAsset } from '../types';
import { OptimizedImage } from '../components/OptimizedImage';
import { useToast } from '../components/Toast';

type MediaFilter = 'all' | 'materials' | 'blog' | 'sections' | 'unused';

interface MediaUsageInfo {
  usedIn: string[];
  count: number;
}

export function MediaPage() {
  const toast = useToast();
  const [uploading, setUploading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [mediaFiles, setMediaFiles] = useState<MediaAsset[]>([]);
  const [selectedFile, setSelectedFile] = useState<MediaAsset | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filter, setFilter] = useState<MediaFilter>('all');
  const [editFormData, setEditFormData] = useState({
    alt: '',
    tags: '',
  });
  const [mediaUsage, setMediaUsage] = useState<Record<string, MediaUsageInfo>>({});
  const [usageSummary, setUsageSummary] = useState({ total: 0, materials: 0, blog: 0, sections: 0, unused: 0 });
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadMedia();
    loadMediaUsage();
  }, []);

  const loadMedia = async () => {
    try {
      setLoading(true);
      const data = await mediaApi.list();
      setMediaFiles(data);
    } catch (error) {
      console.error('Failed to load media:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMediaUsage = async () => {
    try {
      const data = await mediaApi.getUsage();
      setMediaUsage(data.usage || {});
      setUsageSummary(data.summary || { total: 0, materials: 0, blog: 0, sections: 0, unused: 0 });
    } catch (error) {
      console.error('Failed to load media usage:', error);
    }
  };

  const handleSyncMedia = async () => {
    setSyncing(true);
    try {
      const data = await mediaApi.sync();
      toast.success(data.message || 'Đồng bộ thành công!');
      // Reload media and usage
      await loadMedia();
      await loadMediaUsage();
    } catch (error) {
      toast.error('Lỗi: ' + (error as Error).message);
    } finally {
      setSyncing(false);
    }
  };

  async function handleFileUpload(files: FileList | null) {
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      const uploadPromises = Array.from(files).map(file => mediaApi.upload(file));
      const results = await Promise.all(uploadPromises);
      setMediaFiles((prev) => [...results, ...prev]);
      toast.success(`${results.length} file(s) uploaded successfully!`);
      loadMediaUsage(); // Refresh usage data
    } catch (error) {
      toast.error('Upload failed: ' + (error as Error).message);
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Xóa file này? Hành động không thể hoàn tác!')) return;
    try {
      await mediaApi.delete(id);
      setMediaFiles((prev) => prev.filter((f) => f.id !== id));
      toast.success('Đã xóa thành công!');
      loadMediaUsage(); // Refresh usage data
    } catch (error) {
      toast.error('Delete failed: ' + (error as Error).message);
    }
  }

  const handleEditClick = useCallback((file: MediaAsset) => {
    setSelectedFile(file);
    setEditFormData({
      alt: file.alt || '',
      tags: file.tags || '',
    });
    setShowEditModal(true);
  }, []);

  const handleSaveEdit = useCallback(async () => {
    if (!selectedFile) return;
    try {
      const updated = await mediaApi.updateMetadata(selectedFile.id, editFormData);
      
      setMediaFiles((prev) =>
        prev.map((f) =>
          f.id === selectedFile.id ? { ...f, ...updated } : f
        )
      );
      
      setShowEditModal(false);
      setSelectedFile(null);
      toast.success('Metadata updated successfully!');
    } catch (error) {
      toast.error('Save failed: ' + (error as Error).message);
    }
  }, [selectedFile, editFormData, toast]);

  const copyToClipboard = useCallback((url: string) => {
    const fullUrl = resolveMediaUrl(url);
    navigator.clipboard.writeText(fullUrl);
    toast.info('URL copied to clipboard!');
  }, [toast]);

  // Get usage info for a file
  const getUsageInfo = useCallback((fileId: string): MediaUsageInfo => {
    return mediaUsage[fileId] || { usedIn: [], count: 0 };
  }, [mediaUsage]);

  // Filtering logic based on usage
  const filteredFiles = mediaFiles.filter(file => {
    // Search filter
    const matchesSearch = 
      (file.alt?.toLowerCase().includes(searchQuery.toLowerCase()) || false) ||
      (file.caption?.toLowerCase().includes(searchQuery.toLowerCase()) || false) ||
      (file.tags?.toLowerCase().includes(searchQuery.toLowerCase()) || false) ||
      file.url.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (!matchesSearch) return false;
    
    // Usage filter
    if (filter === 'all') return true;
    
    const usage = mediaUsage[file.id];
    if (!usage) {
      return filter === 'unused';
    }
    
    if (filter === 'materials') return usage.usedIn.includes('materials');
    if (filter === 'blog') return usage.usedIn.includes('blog');
    if (filter === 'sections') return usage.usedIn.includes('sections');
    if (filter === 'unused') return usage.count === 0;
    
    return true;
  });

  // Sort by createdAt desc
  const sortedFiles = [...filteredFiles].sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const totalSize = mediaFiles.reduce((acc, file) => acc + (file.size || 0), 0);
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  if (loading) {
    return (
      <div style={{ padding: 60, textAlign: 'center' }}>
        <motion.i
          className="ri-loader-4-line"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          style={{ fontSize: 48, display: 'block', marginBottom: 16, color: tokens.color.primary }}
        />
        <p style={{ color: tokens.color.muted }}>Đang tải thư viện...</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto', padding: '0 24px' }}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          marginBottom: 32,
          background: 'rgba(12,12,16,0.7)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '24px',
          padding: '28px 32px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <motion.div
              whileHover={{ scale: 1.05, rotate: 15 }}
              transition={{ type: 'spring', stiffness: 300 }}
              style={{
                width: 64,
                height: 64,
                borderRadius: '20px',
                background: `linear-gradient(135deg, ${tokens.color.primary}, ${tokens.color.accent})`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 32,
                color: '#0b0c0f',
                boxShadow: '0 8px 24px rgba(245,211,147,0.3)',
              }}
            >
              <i className="ri-gallery-line" />
            </motion.div>
            <div>
              <h1
                style={{
                  fontSize: 36,
                  fontWeight: 700,
                  color: tokens.color.text,
                  margin: 0,
                  background: `linear-gradient(135deg, ${tokens.color.primary}, ${tokens.color.accent})`,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                Media Library
              </h1>
              <p style={{ color: tokens.color.muted, fontSize: 15, margin: '4px 0 0 0' }}>
                {usageSummary.total} files • {formatBytes(totalSize)}
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => handleFileUpload(e.target.files)}
              style={{ display: 'none' }}
            />
            <Button
              variant="secondary"
              icon="ri-refresh-line"
              onClick={handleSyncMedia}
              loading={syncing}
            >
              Sync DB
            </Button>
            <Button
              variant="primary"
              icon="ri-upload-cloud-line"
              onClick={() => fileInputRef.current?.click()}
              loading={uploading}
              size="large"
            >
              Upload Files
            </Button>
          </div>
        </div>

        {/* Toolbar */}
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Search */}
          <div style={{ flex: 1, minWidth: 200 }}>
            <Input
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Tìm kiếm theo tên, caption, tags..."
              icon="ri-search-line"
              fullWidth
            />
          </div>

          {/* Filter Buttons */}
          <div style={{ display: 'flex', gap: 8, background: 'rgba(255,255,255,0.05)', borderRadius: '12px', padding: 4, flexWrap: 'wrap' }}>
            {[
              { value: 'all' as MediaFilter, label: 'Tất cả', icon: 'ri-image-line', count: usageSummary.total },
              { value: 'materials' as MediaFilter, label: 'Vật dụng', icon: 'ri-tools-line', count: usageSummary.materials },
              { value: 'blog' as MediaFilter, label: 'Blog', icon: 'ri-article-line', count: usageSummary.blog },
              { value: 'sections' as MediaFilter, label: 'Sections', icon: 'ri-layout-line', count: usageSummary.sections },
              { value: 'unused' as MediaFilter, label: 'Chưa dùng', icon: 'ri-question-line', count: usageSummary.unused },
            ].map(({ value, label, icon, count }) => (
              <motion.button
                key={value}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setFilter(value)}
                style={{
                  padding: '8px 16px',
                  background: filter === value ? `linear-gradient(135deg, ${tokens.color.primary}, ${tokens.color.accent})` : 'transparent',
                  border: 'none',
                  borderRadius: '8px',
                  color: filter === value ? '#0b0c0f' : tokens.color.muted,
                  cursor: 'pointer',
                  fontSize: 14,
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <i className={icon} />
                {label} ({count})
              </motion.button>
            ))}
          </div>

          {/* View Mode */}
          <div style={{ display: 'flex', gap: 8, background: 'rgba(255,255,255,0.05)', borderRadius: '12px', padding: 4 }}>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setViewMode('grid')}
              style={{
                padding: '8px 16px',
                background: viewMode === 'grid' ? `linear-gradient(135deg, ${tokens.color.primary}, ${tokens.color.accent})` : 'transparent',
                border: 'none',
                borderRadius: '8px',
                color: viewMode === 'grid' ? '#0b0c0f' : tokens.color.muted,
                cursor: 'pointer',
                fontSize: 18,
                fontWeight: 600,
              }}
            >
              <i className="ri-grid-line" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setViewMode('list')}
              style={{
                padding: '8px 16px',
                background: viewMode === 'list' ? `linear-gradient(135deg, ${tokens.color.primary}, ${tokens.color.accent})` : 'transparent',
                border: 'none',
                borderRadius: '8px',
                color: viewMode === 'list' ? '#0b0c0f' : tokens.color.muted,
                cursor: 'pointer',
                fontSize: 18,
                fontWeight: 600,
              }}
            >
              <i className="ri-list-check" />
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Media Grid/List */}
      {sortedFiles.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, background: 'rgba(12,12,16,0.5)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
          <i className="ri-gallery-line" style={{ fontSize: 64, color: tokens.color.border, marginBottom: 16, display: 'block' }} />
          <p style={{ color: tokens.color.muted, marginBottom: 20, fontSize: 15 }}>
            {searchQuery ? 'Không tìm thấy file nào' : 
              filter === 'materials' ? 'Chưa có ảnh nào dùng trong Vật dụng' :
              filter === 'blog' ? 'Chưa có ảnh nào dùng trong Blog' :
              filter === 'sections' ? 'Chưa có ảnh nào dùng trong Sections' :
              filter === 'unused' ? 'Không có ảnh nào chưa sử dụng' :
              'Chưa có file nào. Upload để bắt đầu!'}
          </p>
          {!searchQuery && filter === 'all' && (
            <Button onClick={() => fileInputRef.current?.click()} icon="ri-upload-cloud-line" variant="secondary">
              Upload Files
            </Button>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 20 }}>
          {sortedFiles.map((file, index) => (
            <MediaCard
              key={file.id}
              file={file}
              index={index}
              usageInfo={getUsageInfo(file.id)}
              onEdit={handleEditClick}
              onDelete={handleDelete}
              onCopy={copyToClipboard}
            />
          ))}
        </div>
      ) : (
        <div style={{ background: 'rgba(12,12,16,0.7)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.08)', overflow: 'hidden' }}>
          {sortedFiles.map((file, index) => (
            <motion.div
              key={file.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.02 }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                padding: 16,
                borderBottom: index < sortedFiles.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
              }}
            >
              <OptimizedImage
                src={resolveMediaUrl(file.url)}
                alt={file.alt || 'Media'}
                loading="lazy"
                style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: '8px' }}
              />
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <div style={{ fontSize: 14, color: tokens.color.text, fontWeight: 600 }}>
                    {file.alt || 'Untitled'}
                  </div>
                  <UsageBadges usedIn={getUsageInfo(file.id).usedIn} />
                </div>
                <div style={{ fontSize: 12, color: tokens.color.muted }}>
                  {file.width && file.height ? `${file.width} × ${file.height}` : 'Unknown'} • {new Date(file.createdAt).toLocaleDateString('vi-VN')}
                  {file.tags && <> • {file.tags}</>}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => copyToClipboard(file.url)}
                  style={{
                    padding: '8px 12px',
                    background: 'rgba(245,211,147,0.1)',
                    border: '1px solid rgba(245,211,147,0.2)',
                    borderRadius: '8px',
                    color: tokens.color.primary,
                    cursor: 'pointer',
                    fontSize: 14,
                  }}
                >
                  <i className="ri-file-copy-line" />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => handleEditClick(file)}
                  style={{
                    padding: '8px 12px',
                    background: 'rgba(59,130,246,0.1)',
                    border: '1px solid rgba(59,130,246,0.2)',
                    borderRadius: '8px',
                    color: '#3b82f6',
                    cursor: 'pointer',
                    fontSize: 14,
                  }}
                >
                  <i className="ri-edit-line" />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => handleDelete(file.id)}
                  style={{
                    padding: '8px 12px',
                    background: 'rgba(239,68,68,0.1)',
                    border: '1px solid rgba(239,68,68,0.2)',
                    borderRadius: '8px',
                    color: tokens.color.error,
                    cursor: 'pointer',
                    fontSize: 14,
                  }}
                >
                  <i className="ri-delete-bin-line" />
                </motion.button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedFile && (
        <EditMediaModal
          file={selectedFile}
          formData={editFormData}
          onFormChange={setEditFormData}
          onSave={handleSaveEdit}
          onClose={() => {
            setShowEditModal(false);
            setSelectedFile(null);
          }}
        />
      )}
    </div>
  );
}

// UsageBadges Component
interface UsageBadgesProps {
  usedIn: string[];
}

function UsageBadges({ usedIn }: UsageBadgesProps) {
  const badgeConfig: Record<string, { label: string; icon: string; bg: string; color: string }> = {
    materials: { label: 'Vật dụng', icon: 'ri-tools-line', bg: 'rgba(16,185,129,0.2)', color: '#10b981' },
    blog: { label: 'Blog', icon: 'ri-article-line', bg: 'rgba(59,130,246,0.2)', color: '#3b82f6' },
    sections: { label: 'Sections', icon: 'ri-layout-line', bg: 'rgba(168,85,247,0.2)', color: '#a855f7' },
  };

  if (usedIn.length === 0) {
    return (
      <span style={{ padding: '2px 8px', background: 'rgba(239,68,68,0.2)', borderRadius: '6px', fontSize: 11, color: '#ef4444', fontWeight: 600 }}>
        Chưa dùng
      </span>
    );
  }

  return (
    <>
      {usedIn.map(usage => {
        const config = badgeConfig[usage];
        if (!config) return null;
        return (
          <span
            key={usage}
            style={{
              padding: '2px 8px',
              background: config.bg,
              borderRadius: '6px',
              fontSize: 11,
              color: config.color,
              fontWeight: 600,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <i className={config.icon} style={{ fontSize: 10 }} />
            {config.label}
          </span>
        );
      })}
    </>
  );
}

// MediaCard Component
interface MediaCardProps {
  file: MediaAsset;
  index: number;
  usageInfo: MediaUsageInfo;
  onEdit: (file: MediaAsset) => void;
  onDelete: (id: string) => void;
  onCopy: (url: string) => void;
}

function MediaCard({ file, index, usageInfo, onEdit, onDelete, onCopy }: MediaCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.03 }}
      whileHover={{ y: -4 }}
      style={{
        position: 'relative',
        background: 'rgba(12,12,16,0.7)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '16px',
        overflow: 'hidden',
        boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
      }}
    >
      {/* Usage Badges */}
      <div style={{ position: 'absolute', top: 8, right: 8, zIndex: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
        <UsageBadges usedIn={usageInfo.usedIn} />
      </div>

      {/* Image */}
      <div style={{ aspectRatio: '1', overflow: 'hidden', background: '#000' }}>
        <OptimizedImage
          src={resolveMediaUrl(file.url)}
          alt={file.alt || 'Media'}
          loading="lazy"
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      </div>

      {/* Info */}
      <div style={{ padding: 12 }}>
        <div style={{ fontSize: 13, color: tokens.color.text, fontWeight: 600, marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {file.alt || 'Untitled'}
        </div>
        <div style={{ fontSize: 11, color: tokens.color.muted, marginBottom: 8 }}>
          {file.width && file.height ? `${file.width} × ${file.height}` : 'Unknown size'}
          {file.tags && (
            <>
              <br />
              <span style={{ color: tokens.color.primary, fontSize: 10 }}>{file.tags}</span>
            </>
          )}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 6 }}>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onCopy(file.url)}
            style={{
              flex: 1,
              padding: '8px',
              background: 'rgba(245,211,147,0.1)',
              border: '1px solid rgba(245,211,147,0.2)',
              borderRadius: '8px',
              color: tokens.color.primary,
              cursor: 'pointer',
              fontSize: 16,
            }}
            title="Copy URL"
          >
            <i className="ri-file-copy-line" />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onEdit(file)}
            style={{
              flex: 1,
              padding: '8px',
              background: 'rgba(59,130,246,0.1)',
              border: '1px solid rgba(59,130,246,0.2)',
              borderRadius: '8px',
              color: '#3b82f6',
              cursor: 'pointer',
              fontSize: 16,
            }}
            title="Edit"
          >
            <i className="ri-edit-line" />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onDelete(file.id)}
            style={{
              flex: 1,
              padding: '8px',
              background: 'rgba(239,68,68,0.1)',
              border: '1px solid rgba(239,68,68,0.2)',
              borderRadius: '8px',
              color: tokens.color.error,
              cursor: 'pointer',
              fontSize: 16,
            }}
            title="Delete"
          >
            <i className="ri-delete-bin-line" />
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}

// Edit Modal Component
interface EditMediaFormData {
  alt: string;
  tags: string;
}

interface EditMediaModalProps {
  file: MediaAsset;
  formData: EditMediaFormData;
  onFormChange: (data: EditMediaFormData) => void;
  onSave: () => void;
  onClose: () => void;
}

function EditMediaModal({ file, formData, onFormChange, onSave, onClose }: EditMediaModalProps) {
  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(4px)',
          zIndex: 9998,
        }}
      />
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: 20,
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          style={{
            width: 'min(700px, 100%)',
            maxHeight: '90vh',
            overflowY: 'auto',
            background: 'rgba(20,21,26,0.98)',
            borderRadius: tokens.radius.lg,
            border: `1px solid ${tokens.color.border}`,
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.6)',
          }}
        >
          <div style={{ padding: 24, borderBottom: `1px solid ${tokens.color.border}`, position: 'sticky', top: 0, background: 'rgba(20,21,26,0.98)', zIndex: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h2 style={{ fontSize: 20, fontWeight: 600, color: tokens.color.text, margin: 0 }}>
                Edit Media Metadata
              </h2>
              <motion.button
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: tokens.color.muted,
                  cursor: 'pointer',
                  fontSize: 24,
                }}
              >
                <i className="ri-close-line" />
              </motion.button>
            </div>
          </div>

          <div style={{ padding: 24 }}>
            <div style={{ marginBottom: 20 }}>
              <OptimizedImage
                src={resolveMediaUrl(file.url)}
                alt={file.alt || 'Media'}
                loading="eager"
                style={{ width: '100%', maxHeight: 300, objectFit: 'contain', borderRadius: tokens.radius.md, background: '#000' }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* SEO Info Box */}
              <div style={{ 
                padding: '12px 16px', 
                background: `${tokens.color.primary}10`, 
                border: `1px solid ${tokens.color.primary}30`,
                borderRadius: tokens.radius.md, 
                fontSize: 13, 
                color: tokens.color.muted,
                display: 'flex',
                alignItems: 'flex-start',
                gap: 10,
              }}>
                <i className="ri-seo-line" style={{ fontSize: 18, color: tokens.color.primary, marginTop: 2 }} />
                <div>
                  <strong style={{ color: tokens.color.text }}>SEO Tips:</strong> Alt text giúp Google hiểu nội dung ảnh. 
                  Mô tả ngắn gọn, chính xác những gì có trong ảnh.
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 14, fontWeight: 500, color: tokens.color.text, marginBottom: 8 }}>
                  Alt Text (Mô tả ảnh) *
                </label>
                <textarea
                  value={formData.alt}
                  onChange={(e) => onFormChange({ ...formData, alt: e.target.value })}
                  placeholder="Ví dụ: Logo công ty Anh Thợ Xây với hình ảnh thợ xây và bánh răng"
                  rows={2}
                  style={{
                    width: '100%',
                    padding: '10px 16px',
                    background: 'rgba(255,255,255,0.03)',
                    border: `1px solid ${tokens.color.border}`,
                    borderRadius: tokens.radius.md,
                    color: tokens.color.text,
                    fontSize: 14,
                    outline: 'none',
                    resize: 'vertical',
                    fontFamily: 'inherit',
                  }}
                />
                <p style={{ fontSize: 11, color: tokens.color.muted, marginTop: 4, marginBottom: 0 }}>
                  Quan trọng cho SEO và accessibility. Mô tả nội dung ảnh cho người dùng khiếm thị.
                </p>
              </div>

              <Input
                label="Tags (từ khóa tìm kiếm)"
                value={formData.tags}
                onChange={(value) => onFormChange({ ...formData, tags: value })}
                placeholder="logo, xây dựng, cải tạo nhà..."
                fullWidth
              />
              <p style={{ fontSize: 11, color: tokens.color.muted, marginTop: -12, marginBottom: 0 }}>
                Phân cách bằng dấu phẩy. Giúp tìm kiếm ảnh trong Media Library.
              </p>

              <div style={{ padding: '12px 16px', background: 'rgba(255,255,255,0.02)', borderRadius: tokens.radius.md, fontSize: 12, color: tokens.color.muted }}>
                <div><strong>URL:</strong> {file.url}</div>
                <div><strong>Size:</strong> {file.width} × {file.height} • {file.size ? `${Math.round(file.size / 1024)}KB` : 'Unknown'}</div>
                <div><strong>Uploaded:</strong> {new Date(file.createdAt).toLocaleString('vi-VN')}</div>
              </div>

              <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                <Button onClick={onSave} fullWidth>
                  <i className="ri-save-line" style={{ marginRight: 8 }} />
                  Save Changes
                </Button>
                <Button variant="secondary" onClick={onClose} fullWidth>
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </>
  );
}
