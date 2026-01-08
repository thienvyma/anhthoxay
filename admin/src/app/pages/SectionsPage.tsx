import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { tokens } from '../../theme';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { pagesApi, sectionsApi } from '../api';
import type { Page, Section, SectionKind } from '../types';
import { SectionEditor } from '../components/SectionEditor';
import { SectionTypePicker } from '../components/SectionTypePicker';
import { SectionsList } from '../components/SectionsList';
import { PageSelectorBar } from '../components/PageSelectorBar';
import { useToast } from '../components/Toast';
import { useResponsive } from '../../hooks/useResponsive';
import { addPageToHeaderNav, removePageFromHeaderNav } from '../utils/headerSync';

export function SectionsPage({ pageSlug = 'home' }: { pageSlug?: string }) {
  const toast = useToast();
  const { isMobile } = useResponsive();
  const [pages, setPages] = useState<Page[]>([]);
  const [page, setPage] = useState<Page | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingSection, setEditingSection] = useState<Section | null>(null);
  const [creatingSection, setCreatingSection] = useState<SectionKind | null>(null);
  const [showTypePicker, setShowTypePicker] = useState(false);
  const [showLivePreview, setShowLivePreview] = useState(false);
  const [previewKey, setPreviewKey] = useState(0);

  useEffect(() => {
    loadPages();
  }, []);

  async function loadPages() {
    try {
      const data = await pagesApi.list();
      setPages(data);
      // Auto-select page based on pageSlug or default to first page
      const selectedPage = data.find(p => p.slug === pageSlug) || data[0];
      if (selectedPage) {
        await loadPage(selectedPage.slug);
      }
    } catch (error) {
      console.error('Failed to load pages:', error);
    } finally {
      setLoading(false);
    }
  }

  async function loadPage(slug: string) {
    try {
      const data = await pagesApi.get(slug);
      setPage(data);
    } catch (error) {
      console.error('Failed to load page:', error);
    }
  }

  async function handleSelectPage(selectedPage: Page) {
    // Update pages list with the new page data (for isActive toggle)
    setPages(prev => prev.map(p => p.id === selectedPage.id ? selectedPage : p));
    
    // If page has sections already loaded (e.g., from toggle or already selected), just update state
    // Check for sections array existence (even empty array is valid)
    if (Array.isArray(selectedPage.sections)) {
      setPage(selectedPage);
      return;
    }
    
    // Otherwise, fetch full page data with sections from API
    await loadPage(selectedPage.slug);
  }

  async function handleCreatePage(data: { slug: string; title: string }) {
    const newPage = await pagesApi.create(data);
    
    // Auto-sync: Add new page to header navigation
    let headerSyncSuccess = false;
    try {
      headerSyncSuccess = await addPageToHeaderNav(data.slug, data.title);
    } catch (err) {
      console.error('[SectionsPage] Failed to sync header nav:', err);
    }
    
    // Refresh pages list and select the new page
    await loadPages();
    if (newPage) {
      await loadPage(newPage.slug);
    }
    
    if (headerSyncSuccess) {
      toast.success(`Trang "${data.title}" đã được tạo và thêm vào menu!`);
    } else {
      toast.success(`Trang "${data.title}" đã được tạo nhưng không thể thêm vào menu. Vui lòng thêm thủ công trong Settings > Layout.`);
    }
  }

  async function handleEditPage(slug: string, data: { title: string }) {
    await pagesApi.update(slug, data);
    // Refresh pages list to show updated title
    await loadPages();
  }

  async function handleDeletePage(slug: string) {
    await pagesApi.delete(slug);
    
    // Auto-sync: Remove page from header navigation
    let headerSyncSuccess = false;
    try {
      headerSyncSuccess = await removePageFromHeaderNav(slug);
    } catch (err) {
      console.error('[SectionsPage] Failed to remove page from header nav:', err);
    }
    
    // Refresh pages list after deletion
    await loadPages();
    
    if (headerSyncSuccess) {
      toast.success('Trang đã được xóa và gỡ khỏi menu!');
    } else {
      toast.success('Trang đã được xóa nhưng không thể gỡ khỏi menu. Vui lòng xóa thủ công trong Settings > Layout.');
    }
  }

  async function handleDeleteSection(sectionId: string) {
    if (!confirm('Are you sure you want to delete this section?')) return;
    if (!page) return;
    try {
      await sectionsApi.delete(sectionId);
      await loadPage(page.slug);
    } catch (error) {
      console.error('Failed to delete section:', error);
    }
  }

  async function handleReorder(reorderedSections: Section[]) {
    if (!page) return;
    try {
      // Optimistically update UI
      setPage(prev => prev ? { ...prev, sections: reorderedSections } : null);
      
      // Save to backend
      await sectionsApi.reorder(reorderedSections.map(s => ({ id: s.id, order: s.order })));
    } catch (error) {
      console.error('Failed to reorder sections:', error);
      // Reload to revert on error
      await loadPage(page.slug);
    }
  }

  async function handleSaveSection(sectionId: string | null, data: unknown, syncAll?: boolean) {
    if (!page) return;
    try {
      if (sectionId) {
        // Update existing section (with optional sync to all sections of same kind)
        await sectionsApi.update(sectionId, { data, syncAll });
      } else if (creatingSection) {
        // Create new section
        await sectionsApi.create(page.slug, { kind: creatingSection, data });
      }
      await loadPage(page.slug);
      // Reload live preview iframe
      setPreviewKey(prev => prev + 1);
      setEditingSection(null);
      setCreatingSection(null);
      toast.success(syncAll ? 'Section đã được lưu và đồng bộ!' : 'Section đã được lưu!');
    } catch (error) {
      console.error('Failed to save section:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to save section';
      toast.error(`Lỗi: ${errorMessage}`);
      throw error;
    }
  }

  async function handleDeleteSectionWithPreview(sectionId: string) {
    await handleDeleteSection(sectionId);
    // Reload live preview iframe
    setPreviewKey(prev => prev + 1);
  }

  async function handleReorderWithPreview(reorderedSections: Section[]) {
    await handleReorder(reorderedSections);
    // Reload live preview iframe
    setPreviewKey(prev => prev + 1);
  }

  // ATH Construction/Renovation section types
  const sectionTypes: Array<{ kind: SectionKind; icon: string; label: string; description: string }> = [
    { kind: 'HERO', icon: 'ri-layout-top-line', label: 'Hero Banner', description: 'Banner chính với CTA' },
    { kind: 'HERO_SIMPLE', icon: 'ri-layout-top-fill', label: 'Hero Đơn Giản', description: 'Hero nhẹ cho trang phụ' },
    { kind: 'FEATURED_BLOG_POSTS', icon: 'ri-article-line', label: 'Bài Viết Nổi Bật', description: 'Hiển thị bài blog mới nhất' },
    { kind: 'TESTIMONIALS', icon: 'ri-message-3-line', label: 'Đánh Giá Khách Hàng', description: 'Phản hồi từ khách hàng' },
    { kind: 'STATS', icon: 'ri-bar-chart-line', label: 'Thống Kê', description: 'Hiển thị số liệu nổi bật' },
    { kind: 'FEATURES', icon: 'ri-star-line', label: 'Tính Năng/Dịch Vụ', description: 'Các dịch vụ cải tạo nhà' },
    { kind: 'MISSION_VISION', icon: 'ri-flag-line', label: 'Sứ Mệnh & Tầm Nhìn', description: 'Giới thiệu công ty' },
    { kind: 'CORE_VALUES', icon: 'ri-heart-3-line', label: 'Giá Trị Cốt Lõi', description: 'Cam kết chất lượng' },
    { kind: 'CTA', icon: 'ri-megaphone-line', label: 'Kêu Gọi Hành Động', description: 'Nút CTA đơn giản' },
    { kind: 'CALL_TO_ACTION', icon: 'ri-megaphone-fill', label: 'CTA Đầy Đủ', description: 'CTA với 2 nút' },
    { kind: 'CONTACT_INFO', icon: 'ri-contacts-line', label: 'Thông Tin Liên Hệ', description: 'Địa chỉ, SĐT, email' },
    { kind: 'SOCIAL_MEDIA', icon: 'ri-share-line', label: 'Mạng Xã Hội', description: 'Link social media' },
    { kind: 'FAB_ACTIONS', icon: 'ri-customer-service-line', label: 'Nút Nổi', description: 'Nút liên hệ nhanh góc màn hình' },
    { kind: 'FOOTER_SOCIAL', icon: 'ri-share-forward-line', label: 'Footer Social', description: 'Social links ở footer' },
    { kind: 'QUICK_CONTACT', icon: 'ri-contacts-fill', label: 'Liên Hệ Nhanh', description: 'Card liên hệ nhanh' },
    { kind: 'RICH_TEXT', icon: 'ri-text', label: 'Nội Dung Tùy Chỉnh', description: 'Markdown/HTML content' },
    { kind: 'BANNER', icon: 'ri-notification-line', label: 'Thông Báo', description: 'Banner thông báo' },
    { kind: 'QUOTE_CALCULATOR', icon: 'ri-calculator-line', label: 'Dự Toán & Tư Vấn', description: 'Wizard dự toán chi phí xây dựng' },
    { kind: 'QUOTE_FORM', icon: 'ri-file-list-3-line', label: 'Form Báo Giá', description: 'Form đăng ký tư vấn' },
    { kind: 'LEGAL_CONTENT', icon: 'ri-shield-check-line', label: 'Chính Sách & Điều Khoản', description: 'Privacy Policy & Terms of Use' },
  ];

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 60, color: tokens.color.muted }}>
        <motion.i
          className="ri-loader-4-line"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          style={{ fontSize: 48, display: 'block', marginBottom: 16 }}
        />
        Loading sections...
      </div>
    );
  }

  return (
    <div style={{ 
      maxWidth: showLivePreview ? '100%' : 1400, 
      margin: '0 auto', 
      height: isMobile ? 'auto' : '100vh', 
      overflow: isMobile ? 'visible' : 'hidden', 
      display: 'flex', 
      flexDirection: 'column', 
      padding: isMobile ? 0 : '0 20px',
      minHeight: isMobile ? 'auto' : '100vh',
    }}>
      {/* Page Selector Bar */}
      <PageSelectorBar
        pages={pages}
        selectedPage={page}
        onSelectPage={handleSelectPage}
        onCreatePage={handleCreatePage}
        onEditPage={handleEditPage}
        onDeletePage={handleDeletePage}
        onRefresh={loadPages}
      />

      {/* Actions Bar */}
      <div style={{ 
        marginBottom: isMobile ? 16 : 24, 
        display: 'flex', 
        flexDirection: isMobile ? 'column' : 'row',
        alignItems: isMobile ? 'stretch' : 'center', 
        justifyContent: 'space-between',
        gap: isMobile ? 12 : 16,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              width: isMobile ? 36 : 40,
              height: isMobile ? 36 : 40,
              borderRadius: tokens.radius.md,
              background: `${tokens.color.primary}15`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: isMobile ? 18 : 20,
              color: tokens.color.primary,
              flexShrink: 0,
            }}
          >
            <i className="ri-layout-grid-line" />
          </div>
          <div>
            <h2 style={{ fontSize: isMobile ? 18 : 24, fontWeight: 700, color: tokens.color.text, margin: 0 }}>
              Page Sections
            </h2>
            <p style={{ color: tokens.color.muted, fontSize: isMobile ? 12 : 14, margin: 0 }}>
              {isMobile ? 'Tap to edit' : 'Drag sections to reorder • Click to edit'}
            </p>
          </div>
        </div>
        <div style={{ 
          display: 'flex', 
          gap: isMobile ? 8 : 12,
          flexWrap: 'wrap',
        }}>
          {!isMobile && (
            <Button 
              onClick={() => setShowLivePreview(!showLivePreview)} 
              icon={showLivePreview ? 'ri-layout-left-line' : 'ri-layout-right-line'}
              variant="secondary"
            >
              {showLivePreview ? 'Hide' : 'Show'} Live Preview
            </Button>
          )}
          <Button 
            onClick={() => setShowTypePicker(true)} 
            icon="ri-add-line"
            style={{ flex: isMobile ? 1 : 'none' }}
          >
            {isMobile ? 'Add' : 'Add Section'}
          </Button>
        </div>
      </div>


      {/* Main Content with Split Layout */}
      <div style={{ 
        display: 'flex', 
        flex: 1, 
        gap: isMobile ? 16 : 24, 
        overflow: isMobile ? 'visible' : 'hidden',
        paddingBottom: 20,
        flexDirection: isMobile ? 'column' : 'row',
      }}>
        {/* Left Panel - Sections List */}
        <div style={{ 
          flex: showLivePreview && !isMobile ? '0 0 50%' : '1 1 100%',
          overflow: isMobile ? 'visible' : 'auto',
          maxWidth: showLivePreview && !isMobile ? '50%' : '1400px',
          margin: showLivePreview && !isMobile ? 0 : '0 auto',
          width: '100%',
        }}>

          {!page?.sections || page.sections.length === 0 ? (
            <Card title="No Sections Yet" icon="ri-layout-grid-line">
              <div style={{ textAlign: 'center', padding: 60, color: tokens.color.muted }}>
                <i className="ri-layout-grid-line" style={{ fontSize: 64, display: 'block', marginBottom: 16, opacity: 0.3 }} />
                <h3 style={{ fontSize: 20, fontWeight: 600, color: tokens.color.text, marginBottom: 8 }}>
                  Start Building Your Page
                </h3>
                <p style={{ fontSize: 15, marginBottom: 24 }}>
                  Add your first section to get started
                </p>
                <Button onClick={() => setShowTypePicker(true)} icon="ri-add-line">
                  Add First Section
                </Button>
              </div>
            </Card>
          ) : (
            <Card 
              title={`${page.sections.length} Section${page.sections.length > 1 ? 's' : ''}`}
              subtitle="Drag sections to reorder • Click to edit"
              icon="ri-list-ordered"
            >
              <SectionsList
                sections={page.sections}
                sectionTypes={sectionTypes}
                categoryColors={{
                  'Hero & Banners': tokens.color.primary,
                  'Content': '#3B82F6',
                  'Blog': '#8B5CF6',
                  'Social Proof': '#F59E0B',
                  'Call to Action': '#EF4444',
                  'Forms & Contact': '#06B6D4',
                }}
                onEdit={setEditingSection}
                onDelete={handleDeleteSectionWithPreview}
                onReorder={handleReorderWithPreview}
              />
            </Card>
          )}
        </div>

        {/* Right Panel - Live Preview */}
        {showLivePreview && !isMobile && (
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 50 }}
            style={{ 
              flex: '0 0 50%',
              background: tokens.color.surface,
              borderRadius: tokens.radius.lg,
              border: `1px solid ${tokens.color.border}`,
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div style={{
              padding: '12px 16px',
              background: tokens.color.surfaceAlt,
              borderBottom: `1px solid ${tokens.color.border}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: tokens.color.success,
                }} />
                <span style={{ color: tokens.color.text, fontSize: 14, fontWeight: 600 }}>
                  Live Preview
                </span>
              </div>
              <button
                onClick={() => setPreviewKey(prev => prev + 1)}
                style={{
                  background: tokens.color.surfaceHover,
                  border: `1px solid ${tokens.color.border}`,
                  color: tokens.color.text,
                  padding: '6px 12px',
                  borderRadius: tokens.radius.sm,
                  fontSize: 13,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <i className="ri-refresh-line" />
                Refresh
              </button>
            </div>
            <iframe
              key={previewKey}
              src={`http://localhost:4200/${page?.slug === 'home' ? '' : page?.slug || ''}`}
              style={{
                flex: 1,
                border: 'none',
                width: '100%',
                background: '#fff',
              }}
              title="Live Preview"
            />
          </motion.div>
        )}
      </div>

      {/* Section Type Picker Modal */}
      <AnimatePresence>
        {showTypePicker && (
          <SectionTypePicker
            onSelect={(type) => {
              setCreatingSection(type);
              setShowTypePicker(false);
            }}
            onCancel={() => setShowTypePicker(false)}
          />
        )}
      </AnimatePresence>

      {/* Section Editor Modal */}
      <AnimatePresence mode="wait">
        {(editingSection || creatingSection) && (
          <SectionEditor
            key={editingSection?.id || `new-${creatingSection}`}
            section={editingSection}
            kind={creatingSection || editingSection?.kind || 'HERO'}
            onSave={(data, syncAll) => handleSaveSection(editingSection?.id || null, data, syncAll)}
            onCancel={() => {
              setEditingSection(null);
              setCreatingSection(null);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

