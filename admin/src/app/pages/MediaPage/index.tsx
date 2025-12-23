// Media Page - Main Component
/**
 * Media Page - Media library management with responsive layout
 *
 * Requirements: 7.1, 7.2, 7.3, 7.4, 7.5
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { tokens, resolveMediaUrl } from '@app/shared';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { mediaApi } from '../../api';
import { MediaAsset } from '../../types';
import { OptimizedImage } from '../../components/OptimizedImage';
import { useToast } from '../../components/Toast';
import { ResponsiveGrid, ResponsiveStack } from '../../../components/responsive';
import { useResponsive } from '../../../hooks/useResponsive';

import { MediaCard } from './MediaCard';
import { EditMediaModal } from './EditMediaModal';
import { FilterTabs } from './FilterTabs';
import { UsageBadges } from './UsageBadges';
import type { MediaUsageInfo, DynamicCategory, EditMediaFormData } from './types';

export function MediaPage() {
  const toast = useToast();
  const { isMobile } = useResponsive();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // State
  const [uploading, setUploading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [mediaFiles, setMediaFiles] = useState<MediaAsset[]>([]);
  const [selectedFile, setSelectedFile] = useState<MediaAsset | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filter, setFilter] = useState<string>('all');
  const [editFormData, setEditFormData] = useState<EditMediaFormData>({ alt: '', tags: '' });
  const [mediaUsage, setMediaUsage] = useState<Record<string, MediaUsageInfo>>({});
  const [dynamicCategories, setDynamicCategories] = useState<Record<string, DynamicCategory>>({});
  const [usageSummary, setUsageSummary] = useState({ total: 0, blog: 0, sections: 0, unused: 0 });

  // Load data
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
      setUsageSummary({
        total: data.summary?.total || 0,
        blog: data.summary?.blog || 0,
        sections: data.summary?.sections || 0,
        unused: data.summary?.unused || 0,
      });
      setDynamicCategories(data.categories || {});
    } catch (error) {
      console.error('Failed to load media usage:', error);
    }
  };

  // Handlers
  const handleSyncMedia = async () => {
    setSyncing(true);
    try {
      const data = await mediaApi.sync();
      toast.success(data.message || 'Đồng bộ thành công!');
      await loadMedia();
      await loadMediaUsage();
    } catch (error) {
      toast.error('Lỗi: ' + (error as Error).message);
    } finally {
      setSyncing(false);
    }
  };

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      const uploadPromises = Array.from(files).map(file => mediaApi.upload(file));
      const results = await Promise.all(uploadPromises);
      setMediaFiles((prev) => [...results, ...prev]);
      toast.success(`${results.length} file(s) uploaded!`);
      loadMediaUsage();
    } catch (error) {
      toast.error('Upload failed: ' + (error as Error).message);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Xóa file này? Hành động không thể hoàn tác!')) return;
    try {
      await mediaApi.delete(id);
      setMediaFiles((prev) => prev.filter((f) => f.id !== id));
      toast.success('Đã xóa!');
      loadMediaUsage();
    } catch (error) {
      toast.error('Delete failed: ' + (error as Error).message);
    }
  };

  const handleEditClick = useCallback((file: MediaAsset) => {
    setSelectedFile(file);
    setEditFormData({ alt: file.alt || '', tags: file.tags || '' });
    setShowEditModal(true);
  }, []);

  const handleSaveEdit = useCallback(async () => {
    if (!selectedFile) return;
    try {
      const updated = await mediaApi.updateMetadata(selectedFile.id, editFormData);
      setMediaFiles((prev) => prev.map((f) => f.id === selectedFile.id ? { ...f, ...updated } : f));
      setShowEditModal(false);
      setSelectedFile(null);
      toast.success('Saved!');
    } catch (error) {
      toast.error('Save failed: ' + (error as Error).message);
    }
  }, [selectedFile, editFormData, toast]);

  const copyToClipboard = useCallback((url: string) => {
    navigator.clipboard.writeText(resolveMediaUrl(url));
    toast.info('URL copied!');
  }, [toast]);

  const getUsageInfo = useCallback((fileId: string): MediaUsageInfo => {
    return mediaUsage[fileId] || { usedIn: [], count: 0 };
  }, [mediaUsage]);

  // Filtering
  const filteredFiles = mediaFiles.filter(file => {
    const matchesSearch = 
      (file.alt?.toLowerCase().includes(searchQuery.toLowerCase()) || false) ||
      (file.tags?.toLowerCase().includes(searchQuery.toLowerCase()) || false) ||
      file.url.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (!matchesSearch) return false;
    if (filter === 'all') return true;
    
    const usage = mediaUsage[file.id];
    if (!usage) return filter === 'unused';
    if (filter === 'unused') return usage.count === 0;
    
    // Check if filter matches any usedIn (base or dynamic)
    return usage.usedIn.includes(filter);
  });

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
        <p style={{ color: tokens.color.muted }}>Đang tải thư viện...</p>
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
          background: 'rgba(12,12,16,0.7)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: isMobile ? '16px' : '24px',
          padding: isMobile ? '16px' : '24px 28px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
        }}
      >
        {/* Title Row */}
        <ResponsiveStack
          direction={{ mobile: 'column', tablet: 'row', desktop: 'row' }}
          align={isMobile ? 'stretch' : 'center'}
          justify="between"
          gap={isMobile ? 16 : 0}
          style={{ marginBottom: 20 }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 12 : 16 }}>
            <motion.div
              whileHover={{ scale: 1.05, rotate: 15 }}
              style={{
                width: isMobile ? 44 : 56,
                height: isMobile ? 44 : 56,
                borderRadius: isMobile ? '12px' : '16px',
                background: `linear-gradient(135deg, ${tokens.color.primary}, ${tokens.color.accent})`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: isMobile ? 22 : 28,
                color: '#0b0c0f',
              }}
            >
              <i className="ri-gallery-line" />
            </motion.div>
            <div>
              <h1 style={{
                fontSize: isMobile ? 22 : 28,
                fontWeight: 700,
                color: tokens.color.text,
                margin: 0,
                background: `linear-gradient(135deg, ${tokens.color.primary}, ${tokens.color.accent})`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}>
                Media Library
              </h1>
              <p style={{ color: tokens.color.muted, fontSize: isMobile ? 12 : 14, margin: '2px 0 0 0' }}>
                {usageSummary.total} files • {formatBytes(totalSize)}
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, width: isMobile ? '100%' : 'auto' }}>
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
              style={isMobile ? { flex: 1 } : undefined}
            >
              {isMobile ? '' : 'Sync'}
            </Button>
            <Button 
              variant="primary" 
              icon="ri-upload-cloud-line" 
              onClick={() => fileInputRef.current?.click()} 
              loading={uploading}
              style={isMobile ? { flex: 1 } : undefined}
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

          <div style={{ 
            display: 'flex', 
            gap: 12, 
            alignItems: 'center', 
            flexWrap: 'wrap',
            overflowX: isMobile ? 'auto' : undefined,
            paddingBottom: isMobile ? 4 : 0,
          }}>
            <FilterTabs
              filter={filter}
              setFilter={setFilter}
              dynamicCategories={dynamicCategories}
              usageSummary={usageSummary}
            />

            {/* View Mode */}
            <div style={{ display: 'flex', gap: 4, background: 'rgba(255,255,255,0.05)', borderRadius: '8px', padding: 3 }}>
              {(['grid', 'list'] as const).map((mode) => (
                <motion.button
                  key={mode}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setViewMode(mode)}
                  style={{
                    padding: '6px 12px',
                    background: viewMode === mode ? `linear-gradient(135deg, ${tokens.color.primary}, ${tokens.color.accent})` : 'transparent',
                    border: 'none',
                    borderRadius: '6px',
                    color: viewMode === mode ? '#0b0c0f' : tokens.color.muted,
                    cursor: 'pointer',
                    fontSize: 16,
                    minWidth: '44px',
                    minHeight: '44px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <i className={mode === 'grid' ? 'ri-grid-line' : 'ri-list-check'} />
                </motion.button>
              ))}
            </div>
          </div>
        </ResponsiveStack>
      </motion.div>

      {/* Content */}
      {sortedFiles.length === 0 ? (
        <EmptyState 
          searchQuery={searchQuery} 
          filter={filter} 
          dynamicCategories={dynamicCategories}
          onUpload={() => fileInputRef.current?.click()} 
        />
      ) : viewMode === 'grid' ? (
        <ResponsiveGrid
          cols={{ mobile: 2, tablet: 3, desktop: 4 }}
          gap={{ mobile: 12, tablet: 16, desktop: 16 }}
        >
          {sortedFiles.map((file, index) => (
            <MediaCard
              key={file.id}
              file={file}
              index={index}
              usageInfo={getUsageInfo(file.id)}
              dynamicCategories={dynamicCategories}
              onEdit={handleEditClick}
              onDelete={handleDelete}
              onCopy={copyToClipboard}
            />
          ))}
        </ResponsiveGrid>
      ) : (
        <ListView 
          files={sortedFiles} 
          getUsageInfo={getUsageInfo}
          dynamicCategories={dynamicCategories}
          onEdit={handleEditClick}
          onDelete={handleDelete}
          onCopy={copyToClipboard}
        />
      )}

      {/* Edit Modal */}
      {showEditModal && selectedFile && (
        <EditMediaModal
          file={selectedFile}
          formData={editFormData}
          onFormChange={setEditFormData}
          onSave={handleSaveEdit}
          onClose={() => { setShowEditModal(false); setSelectedFile(null); }}
        />
      )}
    </div>
  );
}

// Empty State Component
function EmptyState({ 
  searchQuery, 
  filter, 
  dynamicCategories,
  onUpload 
}: { 
  searchQuery: string; 
  filter: string; 
  dynamicCategories: Record<string, DynamicCategory>;
  onUpload: () => void;
}) {
  const getEmptyMessage = () => {
    if (searchQuery) return 'Không tìm thấy file nào';
    if (filter === 'blog') return 'Chưa có ảnh nào dùng trong Blog';
    if (filter === 'sections') return 'Chưa có ảnh nào dùng trong Sections';
    if (filter === 'unused') return 'Không có ảnh nào chưa sử dụng';
    // Check dynamic categories
    const dynamicCat = dynamicCategories[filter];
    if (dynamicCat) return `Chưa có ảnh nào trong ${dynamicCat.label}`;
    return 'Chưa có file nào. Upload để bắt đầu!';
  };

  return (
    <div style={{ 
      textAlign: 'center', 
      padding: 60, 
      background: 'rgba(12,12,16,0.5)', 
      borderRadius: '16px', 
      border: '1px solid rgba(255,255,255,0.05)' 
    }}>
      <i className="ri-gallery-line" style={{ fontSize: 64, color: tokens.color.border, marginBottom: 16, display: 'block' }} />
      <p style={{ color: tokens.color.muted, marginBottom: 20, fontSize: 15 }}>{getEmptyMessage()}</p>
      {!searchQuery && filter === 'all' && (
        <Button onClick={onUpload} icon="ri-upload-cloud-line" variant="secondary">
          Upload Files
        </Button>
      )}
    </div>
  );
}

// List View Component
function ListView({ 
  files, 
  getUsageInfo,
  dynamicCategories,
  onEdit, 
  onDelete, 
  onCopy 
}: { 
  files: MediaAsset[];
  getUsageInfo: (id: string) => MediaUsageInfo;
  dynamicCategories: Record<string, DynamicCategory>;
  onEdit: (file: MediaAsset) => void;
  onDelete: (id: string) => void;
  onCopy: (url: string) => void;
}) {
  return (
    <div style={{ 
      background: 'rgba(12,12,16,0.7)', 
      borderRadius: '16px', 
      border: '1px solid rgba(255,255,255,0.08)', 
      overflow: 'hidden' 
    }}>
      {files.map((file, index) => (
        <motion.div
          key={file.id}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.02 }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            padding: 14,
            borderBottom: index < files.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
          }}
        >
          <OptimizedImage
            src={resolveMediaUrl(file.url)}
            alt={file.alt || 'Media'}
            loading="lazy"
            style={{ width: 56, height: 56, objectFit: 'cover', borderRadius: '8px' }}
          />
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <div style={{ fontSize: 14, color: tokens.color.text, fontWeight: 600 }}>
                {file.alt || 'Untitled'}
              </div>
              <UsageBadges usedIn={getUsageInfo(file.id).usedIn} dynamicCategories={dynamicCategories} />
            </div>
            <div style={{ fontSize: 12, color: tokens.color.muted }}>
              {file.width && file.height ? `${file.width} × ${file.height}` : 'Unknown'} • {new Date(file.createdAt).toLocaleDateString('vi-VN')}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            {[
              { icon: 'ri-file-copy-line', onClick: () => onCopy(file.url), color: tokens.color.primary },
              { icon: 'ri-edit-line', onClick: () => onEdit(file), color: tokens.color.info },
              { icon: 'ri-delete-bin-line', onClick: () => onDelete(file.id), color: tokens.color.error },
            ].map(({ icon, onClick, color }) => (
              <motion.button
                key={icon}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={onClick}
                style={{
                  padding: '8px 10px',
                  background: `${color}15`,
                  border: `1px solid ${color}30`,
                  borderRadius: '8px',
                  color,
                  cursor: 'pointer',
                  fontSize: 14,
                }}
              >
                <i className={icon} />
              </motion.button>
            ))}
          </div>
        </motion.div>
      ))}
    </div>
  );
}

export default MediaPage;
