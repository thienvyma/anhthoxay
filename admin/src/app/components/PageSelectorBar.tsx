import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { tokens } from '@app/shared';
import { Button } from './Button';
import { Input } from './Input';
import { useToast } from './Toast';
import { pagesApi } from '../api';
import type { Page } from '../types';

interface PageSelectorBarProps {
  pages: Page[];
  selectedPage: Page | null;
  onSelectPage: (page: Page) => void;
  onCreatePage: (data: { slug: string; title: string }) => Promise<void>;
  onEditPage: (slug: string, data: { title: string }) => Promise<void>;
  onDeletePage: (slug: string) => Promise<void>;
  onRefresh: () => void;
}

export function PageSelectorBar({
  pages,
  selectedPage,
  onSelectPage,
  onCreatePage,
  onEditPage,
  onDeletePage,
  onRefresh,
}: PageSelectorBarProps) {
  const toast = useToast();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [formData, setFormData] = useState({ slug: '', title: '' });
  const [saving, setSaving] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[đĐ]/g, 'd')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      if (modalMode === 'create') {
        await onCreatePage({ slug: formData.slug, title: formData.title });
        toast.success('Trang mới đã được tạo!');
      } else if (selectedPage) {
        await onEditPage(selectedPage.slug, { title: formData.title });
        toast.success('Trang đã được cập nhật!');
      }
      handleCloseModal();
      onRefresh();
    } catch (error) {
      console.error('Failed to save page:', error);
      toast.error('Lưu trang thất bại');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!selectedPage) return;
    if (selectedPage.slug === 'home') {
      toast.warning('Không thể xóa trang chủ');
      return;
    }
    if (!confirm(`Delete page "${selectedPage.title || selectedPage.slug}"? All sections will be deleted!`)) return;
    
    try {
      await onDeletePage(selectedPage.slug);
      onRefresh();
      toast.success('Trang đã được xóa!');
      // Select first available page
      const remainingPages = pages.filter(p => p.slug !== selectedPage.slug);
      if (remainingPages.length > 0) {
        onSelectPage(remainingPages[0]);
      }
    } catch (error) {
      console.error('Failed to delete page:', error);
      toast.error('Xóa trang thất bại');
    }
  }

  function handleOpenCreateModal() {
    setModalMode('create');
    setFormData({ slug: '', title: '' });
    setShowModal(true);
  }

  function handleOpenEditModal() {
    if (!selectedPage) return;
    setModalMode('edit');
    setFormData({ slug: selectedPage.slug, title: selectedPage.title || '' });
    setShowModal(true);
  }

  function handleCloseModal() {
    setShowModal(false);
    setFormData({ slug: '', title: '' });
  }

  async function handleToggleActive() {
    if (!selectedPage) return;
    try {
      const newStatus = selectedPage.isActive === false ? true : false;
      
      await pagesApi.update(selectedPage.slug, { isActive: newStatus });
      
      // Update selected page locally - preserve existing sections to avoid reload
      const updatedPage: Page = {
        ...selectedPage,
        isActive: newStatus,
      };
      
      onSelectPage(updatedPage);
      toast.success(newStatus ? 'Trang đã được bật!' : 'Trang đã được tắt tạm thời!');
    } catch (error) {
      console.error('Failed to toggle page status:', error);
      toast.error('Cập nhật trạng thái thất bại');
    }
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          background: `linear-gradient(135deg, ${tokens.color.surface}, rgba(20,21,26,0.95))`,
          border: `1px solid ${tokens.color.border}`,
          borderRadius: tokens.radius.lg,
          padding: '20px 24px',
          marginBottom: 24,
          boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
          {/* Left: Page Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: tokens.radius.md,
                background: `linear-gradient(135deg, ${tokens.color.primary}, ${tokens.color.accent})`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 20,
                color: '#111',
                flexShrink: 0,
              }}
            >
              <i className="ri-pages-line" />
            </div>

            {/* Dropdown */}
            <div ref={dropdownRef} style={{ position: 'relative', flex: 1, maxWidth: 400 }}>
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => setShowDropdown(!showDropdown)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  background: 'rgba(255,255,255,0.05)',
                  border: `1px solid ${tokens.color.border}`,
                  borderRadius: tokens.radius.md,
                  color: tokens.color.text,
                  cursor: 'pointer',
                  fontSize: 16,
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                  transition: 'all 0.2s',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <i className="ri-file-text-line" style={{ color: tokens.color.primary, fontSize: 18 }} />
                  <span>{selectedPage?.title || selectedPage?.slug || 'Select a page'}</span>
                  {selectedPage && (
                    <span style={{ 
                      fontSize: 12, 
                      color: tokens.color.muted,
                      background: 'rgba(255,255,255,0.05)',
                      padding: '2px 8px',
                      borderRadius: tokens.radius.sm,
                    }}>
                      /{selectedPage.slug}
                    </span>
                  )}
                </div>
                <motion.i
                  className="ri-arrow-down-s-line"
                  animate={{ rotate: showDropdown ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                  style={{ fontSize: 20, color: tokens.color.muted }}
                />
              </motion.button>

              {/* Dropdown Menu */}
              <AnimatePresence>
                {showDropdown && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.15 }}
                    style={{
                      position: 'absolute',
                      top: 'calc(100% + 8px)',
                      left: 0,
                      right: 0,
                      background: 'rgba(20,21,26,0.98)',
                      border: `1px solid ${tokens.color.border}`,
                      borderRadius: tokens.radius.md,
                      boxShadow: '0 10px 40px rgba(0,0,0,0.4)',
                      zIndex: 100,
                      maxHeight: 400,
                      overflowY: 'auto',
                    }}
                  >
                    {pages.map((page) => (
                      <motion.button
                        key={page.id}
                        whileHover={{ background: 'rgba(255,255,255,0.08)' }}
                        onClick={() => {
                          onSelectPage(page);
                          setShowDropdown(false);
                        }}
                        style={{
                          width: '100%',
                          padding: '12px 16px',
                          background: selectedPage?.id === page.id ? 'rgba(245, 211, 147, 0.1)' : 'transparent',
                          border: 'none',
                          borderBottom: `1px solid ${tokens.color.border}`,
                          color: tokens.color.text,
                          cursor: 'pointer',
                          fontSize: 14,
                          textAlign: 'left',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: 12,
                          transition: 'background 0.2s',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <i 
                            className={selectedPage?.id === page.id ? 'ri-checkbox-circle-fill' : 'ri-file-text-line'} 
                            style={{ 
                              color: selectedPage?.id === page.id ? tokens.color.primary : tokens.color.muted,
                              fontSize: 16,
                            }} 
                          />
                          <span style={{ fontWeight: selectedPage?.id === page.id ? 600 : 400 }}>
                            {page.title || page.slug}
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          {/* ON/OFF Status Badge */}
                          <span style={{ 
                            fontSize: 10, 
                            fontWeight: 600,
                            color: page.isActive !== false ? '#10B981' : '#EF4444',
                            background: page.isActive !== false 
                              ? 'rgba(16, 185, 129, 0.15)' 
                              : 'rgba(239, 68, 68, 0.15)',
                            border: `1px solid ${page.isActive !== false ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                            padding: '2px 6px',
                            borderRadius: tokens.radius.sm,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 3,
                          }}>
                            <i 
                              className={page.isActive !== false ? 'ri-eye-line' : 'ri-eye-off-line'} 
                              style={{ fontSize: 10 }} 
                            />
                            {page.isActive !== false ? 'ON' : 'OFF'}
                          </span>
                          <span style={{ 
                            fontSize: 11, 
                            color: tokens.color.muted,
                            background: 'rgba(255,255,255,0.05)',
                            padding: '2px 6px',
                            borderRadius: tokens.radius.sm,
                          }}>
                            {page._count?.sections || 0} sections
                          </span>
                        </div>
                      </motion.button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Right: Actions */}
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {/* ON/OFF Toggle for selected page */}
            {selectedPage && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleToggleActive}
                title={selectedPage.isActive !== false ? 'Tắt trang này' : 'Bật trang này'}
                style={{
                  padding: '8px 14px',
                  background: selectedPage.isActive !== false 
                    ? 'rgba(16, 185, 129, 0.15)' 
                    : 'rgba(239, 68, 68, 0.15)',
                  border: `1px solid ${selectedPage.isActive !== false ? 'rgba(16, 185, 129, 0.4)' : 'rgba(239, 68, 68, 0.4)'}`,
                  borderRadius: tokens.radius.md,
                  color: selectedPage.isActive !== false ? '#10B981' : '#EF4444',
                  cursor: 'pointer',
                  fontSize: 13,
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <i className={selectedPage.isActive !== false ? 'ri-eye-line' : 'ri-eye-off-line'} style={{ fontSize: 16 }} />
                {selectedPage.isActive !== false ? 'ON' : 'OFF'}
              </motion.button>
            )}

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleOpenCreateModal}
              title="Create new page"
              style={{
                padding: '10px 16px',
                background: `linear-gradient(135deg, ${tokens.color.primary}, ${tokens.color.accent})`,
                border: 'none',
                borderRadius: tokens.radius.md,
                color: '#111',
                cursor: 'pointer',
                fontSize: 14,
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                boxShadow: `0 4px 12px ${tokens.color.primary}40`,
              }}
            >
              <i className="ri-add-line" style={{ fontSize: 16 }} />
              New Page
            </motion.button>

            {selectedPage && (
              <>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleOpenEditModal}
                  title="Edit page"
                  style={{
                    padding: '10px 12px',
                    background: 'rgba(255,255,255,0.05)',
                    border: `1px solid ${tokens.color.border}`,
                    borderRadius: tokens.radius.md,
                    color: tokens.color.primary,
                    cursor: 'pointer',
                    fontSize: 16,
                  }}
                >
                  <i className="ri-edit-line" />
                </motion.button>

                {selectedPage.slug !== 'home' && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleDelete}
                    title="Delete page"
                    style={{
                      padding: '10px 12px',
                      background: 'rgba(255,255,255,0.05)',
                      border: `1px solid ${tokens.color.border}`,
                      borderRadius: tokens.radius.md,
                      color: tokens.color.error,
                      cursor: 'pointer',
                      fontSize: 16,
                    }}
                  >
                    <i className="ri-delete-bin-line" />
                  </motion.button>
                )}

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => window.open(`http://localhost:4200/#/${selectedPage.slug}`, '_blank')}
                  title="Preview page"
                  style={{
                    padding: '10px 12px',
                    background: 'rgba(255,255,255,0.05)',
                    border: `1px solid ${tokens.color.border}`,
                    borderRadius: tokens.radius.md,
                    color: tokens.color.text,
                    cursor: 'pointer',
                    fontSize: 16,
                  }}
                >
                  <i className="ri-external-link-line" />
                </motion.button>
              </>
            )}
          </div>
        </div>

        {/* Page Info */}
        {selectedPage && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            style={{
              marginTop: 16,
              paddingTop: 16,
              borderTop: `1px solid ${tokens.color.border}`,
              display: 'flex',
              gap: 16,
              flexWrap: 'wrap',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: tokens.color.muted }}>
              <i className="ri-layout-grid-line" style={{ color: tokens.color.primary }} />
              <strong style={{ color: tokens.color.text }}>{selectedPage._count?.sections || 0}</strong> sections
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: tokens.color.muted }}>
              <i className="ri-time-line" style={{ color: tokens.color.primary }} />
              Updated: <strong style={{ color: tokens.color.text }}>
                {selectedPage.updatedAt ? new Date(selectedPage.updatedAt).toLocaleDateString('vi-VN') : '-'}
              </strong>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: tokens.color.muted }}>
              <i className="ri-link" style={{ color: tokens.color.primary }} />
              URL: <strong style={{ color: tokens.color.text }}>/{selectedPage.slug}</strong>
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleCloseModal}
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
                padding: '20px',
              }}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                style={{
                  width: 'min(500px, 100%)',
                  background: 'rgba(20,21,26,0.98)',
                  borderRadius: tokens.radius.lg,
                  border: `1px solid ${tokens.color.border}`,
                  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.6)',
                }}
              >
                <div style={{ padding: 24, borderBottom: `1px solid ${tokens.color.border}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <h2 style={{ fontSize: 20, fontWeight: 600, color: tokens.color.text, margin: 0 }}>
                      {modalMode === 'create' ? 'Create New Page' : 'Edit Page'}
                    </h2>
                    <motion.button
                      whileHover={{ scale: 1.1, rotate: 90 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={handleCloseModal}
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

                <form onSubmit={handleSave} style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
                  <Input
                    label="Page Title"
                    value={formData.title}
                    onChange={(value) => {
                      setFormData({
                        ...formData,
                        title: value,
                        slug: modalMode === 'create' ? generateSlug(value) : formData.slug,
                      });
                    }}
                    placeholder="About Us"
                    required
                    fullWidth
                  />

                  {modalMode === 'create' && (
                    <Input
                      label="Slug (URL)"
                      value={formData.slug}
                      onChange={(value) => setFormData({ ...formData, slug: value })}
                      placeholder="about"
                      required
                      fullWidth
                    />
                  )}

                  <div style={{ display: 'flex', gap: 12, paddingTop: 16 }}>
                    <Button type="submit" fullWidth disabled={saving}>
                      {saving ? (
                        <>
                          <motion.i
                            className="ri-loader-4-line"
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                            style={{ marginRight: 8 }}
                          />
                          Saving...
                        </>
                      ) : (
                        <>
                          <i className={modalMode === 'create' ? 'ri-add-line' : 'ri-save-line'} style={{ marginRight: 8 }} />
                          {modalMode === 'create' ? 'Create' : 'Update'} Page
                        </>
                      )}
                    </Button>
                    <Button type="button" variant="secondary" onClick={handleCloseModal} fullWidth disabled={saving}>
                      <i className="ri-close-line" style={{ marginRight: 8 }} />
                      Cancel
                    </Button>
                  </div>
                </form>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

