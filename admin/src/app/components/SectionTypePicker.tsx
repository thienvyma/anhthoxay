import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { tokens } from '../../theme';
import type { SectionKind } from '../types';

interface SectionTypePickerProps {
  onSelect: (type: SectionKind) => void;
  onCancel: () => void;
}

// Category definitions
const categories = [
  { id: 'all', label: 'Tất cả', icon: 'ri-apps-line' },
  { id: 'hero', label: 'Hero & Banner', icon: 'ri-layout-top-line' },
  { id: 'content', label: 'Nội dung', icon: 'ri-file-text-line' },
  { id: 'services', label: 'Dịch vụ', icon: 'ri-service-line' },
  { id: 'contact', label: 'Liên hệ', icon: 'ri-contacts-line' },
  { id: 'media', label: 'Media', icon: 'ri-image-line' },
  { id: 'cta', label: 'CTA', icon: 'ri-megaphone-line' },
  { id: 'other', label: 'Khác', icon: 'ri-more-line' },
] as const;

type CategoryId = (typeof categories)[number]['id'];

// Section types organized by category
const sectionTypes: Array<{
  type: SectionKind;
  icon: string;
  label: string;
  description: string;
  color: string;
  category: CategoryId;
}> = [
  // Hero & Banners
  {
    type: 'HERO',
    icon: 'ri-image-2-line',
    label: 'Hero Banner',
    description: 'Banner chính với hình ảnh, tiêu đề và nút CTA',
    color: '#f59e0b',
    category: 'hero',
  },
  {
    type: 'HERO_SIMPLE',
    icon: 'ri-layout-top-line',
    label: 'Hero Đơn Giản',
    description: 'Hero nhẹ cho các trang phụ',
    color: '#fb923c',
    category: 'hero',
  },
  {
    type: 'BANNER',
    icon: 'ri-megaphone-line',
    label: 'Banner Thông Báo',
    description: 'Thanh thông báo khuyến mãi, sự kiện',
    color: '#f97316',
    category: 'hero',
  },

  // Services & Features
  {
    type: 'SERVICES',
    icon: 'ri-service-line',
    label: 'Dịch Vụ',
    description: 'Danh sách các dịch vụ cải tạo nhà',
    color: '#3b82f6',
    category: 'services',
  },
  {
    type: 'FEATURES',
    icon: 'ri-star-line',
    label: 'Tính Năng / Ưu Điểm',
    description: 'Highlight các ưu điểm của dịch vụ',
    color: '#3b82f6',
    category: 'services',
  },
  {
    type: 'CORE_VALUES',
    icon: 'ri-heart-3-line',
    label: 'Giá Trị Cốt Lõi',
    description: 'Các giá trị và nguyên tắc của công ty',
    color: '#ec4899',
    category: 'services',
  },
  {
    type: 'STATS',
    icon: 'ri-bar-chart-box-line',
    label: 'Thống Kê',
    description: 'Số liệu ấn tượng về công ty',
    color: '#10b981',
    category: 'services',
  },

  // Content
  {
    type: 'ABOUT',
    icon: 'ri-information-line',
    label: 'Giới Thiệu',
    description: 'Thông tin về công ty',
    color: '#0ea5e9',
    category: 'content',
  },
  {
    type: 'MISSION_VISION',
    icon: 'ri-flag-line',
    label: 'Sứ Mệnh & Tầm Nhìn',
    description: 'Giới thiệu sứ mệnh và tầm nhìn',
    color: '#0ea5e9',
    category: 'content',
  },
  {
    type: 'TESTIMONIALS',
    icon: 'ri-chat-quote-line',
    label: 'Đánh Giá Khách Hàng',
    description: 'Nhận xét và đánh giá từ khách hàng',
    color: '#8b5cf6',
    category: 'content',
  },
  {
    type: 'FAQ',
    icon: 'ri-question-answer-line',
    label: 'Câu Hỏi Thường Gặp',
    description: 'Danh sách FAQ',
    color: '#6366f1',
    category: 'content',
  },
  {
    type: 'RICH_TEXT',
    icon: 'ri-file-text-line',
    label: 'Nội Dung Tùy Chỉnh',
    description: 'Nội dung HTML tùy chỉnh',
    color: '#64748b',
    category: 'content',
  },
  {
    type: 'FEATURED_BLOG_POSTS',
    icon: 'ri-article-line',
    label: 'Bài Viết Nổi Bật',
    description: 'Hiển thị bài viết blog nổi bật',
    color: '#8b5cf6',
    category: 'content',
  },
  {
    type: 'BLOG_LIST',
    icon: 'ri-list-check',
    label: 'Danh Sách Blog',
    description: 'Danh sách bài viết với bộ lọc',
    color: '#8b5cf6',
    category: 'content',
  },

  // Contact & Social
  {
    type: 'CONTACT_INFO',
    icon: 'ri-map-pin-line',
    label: 'Thông Tin Liên Hệ',
    description: 'Địa chỉ, điện thoại, email, bản đồ',
    color: '#6366f1',
    category: 'contact',
  },
  {
    type: 'QUICK_CONTACT',
    icon: 'ri-contacts-line',
    label: 'Liên Hệ Nhanh',
    description: 'Thẻ liên hệ nhanh với hiệu ứng glass',
    color: '#10b981',
    category: 'contact',
  },
  {
    type: 'QUOTE_FORM',
    icon: 'ri-file-list-3-line',
    label: 'Form Đăng Ký Tư Vấn',
    description: 'Form đăng ký tư vấn đơn giản',
    color: '#10b981',
    category: 'contact',
  },
  {
    type: 'QUOTE_CALCULATOR',
    icon: 'ri-calculator-line',
    label: 'Dự Toán & Tư Vấn',
    description: 'Dự toán nhanh + Đăng ký tư vấn',
    color: '#f59e0b',
    category: 'contact',
  },
  {
    type: 'SOCIAL_MEDIA',
    icon: 'ri-share-line',
    label: 'Mạng Xã Hội',
    description: 'Liên kết Facebook, Zalo, YouTube',
    color: '#a855f7',
    category: 'contact',
  },
  {
    type: 'FOOTER_SOCIAL',
    icon: 'ri-share-forward-line',
    label: 'Social Footer',
    description: 'Icon mạng xã hội cho footer',
    color: '#64748b',
    category: 'contact',
  },

  // Media
  {
    type: 'FEATURED_SLIDESHOW',
    icon: 'ri-slideshow-3-line',
    label: 'Slideshow Nổi Bật',
    description: 'Hình ảnh nổi bật dạng slideshow',
    color: '#ec4899',
    category: 'media',
  },
  {
    type: 'MEDIA_GALLERY',
    icon: 'ri-gallery-line',
    label: 'Thư Viện Ảnh',
    description: 'Gallery ảnh với phân trang và lightbox',
    color: '#8b5cf6',
    category: 'media',
  },
  {
    type: 'VIDEO_SHOWCASE',
    icon: 'ri-video-line',
    label: 'Video Showcase',
    description: 'Video tự động chạy (upload/YouTube)',
    color: '#ef4444',
    category: 'media',
  },

  // CTA
  {
    type: 'CTA',
    icon: 'ri-flashlight-line',
    label: 'Kêu Gọi Hành Động',
    description: 'Khuyến khích khách hàng liên hệ',
    color: '#f59e0b',
    category: 'cta',
  },
  {
    type: 'CALL_TO_ACTION',
    icon: 'ri-megaphone-fill',
    label: 'CTA Nâng Cao',
    description: 'CTA với nút chính và phụ',
    color: '#f59e0b',
    category: 'cta',
  },
  {
    type: 'FAB_ACTIONS',
    icon: 'ri-customer-service-2-fill',
    label: 'Nút Hành Động Nổi',
    description: 'Nút cố định góc màn hình (gọi, chat)',
    color: tokens.color.primary,
    category: 'cta',
  },

  // Other
  {
    type: 'MARKETPLACE',
    icon: 'ri-store-2-line',
    label: 'Sàn Giao Dịch',
    description: 'Công trình đang tìm nhà thầu',
    color: '#06b6d4',
    category: 'other',
  },
  {
    type: 'FURNITURE_QUOTE',
    icon: 'ri-sofa-line',
    label: 'Báo Giá Nội Thất',
    description: 'Quy trình chọn căn hộ và báo giá',
    color: '#8b5cf6',
    category: 'other',
  },
  {
    type: 'LEGAL_CONTENT',
    icon: 'ri-shield-check-line',
    label: 'Chính Sách & Điều Khoản',
    description: 'Privacy Policy & Terms of Use',
    color: '#10b981',
    category: 'other',
  },
];

export function SectionTypePicker({ onSelect, onCancel }: SectionTypePickerProps) {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<CategoryId>('all');

  // Filter sections based on search and category
  const filteredSections = useMemo(() => {
    return sectionTypes.filter((section) => {
      const matchesSearch =
        !search ||
        section.label.toLowerCase().includes(search.toLowerCase()) ||
        section.description.toLowerCase().includes(search.toLowerCase());
      const matchesCategory =
        activeCategory === 'all' || section.category === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [search, activeCategory]);

  // Count sections per category
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: sectionTypes.length };
    sectionTypes.forEach((s) => {
      counts[s.category] = (counts[s.category] || 0) + 1;
    });
    return counts;
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
      style={{
        position: 'fixed',
        inset: 0,
        background: tokens.color.overlay,
        backdropFilter: 'blur(8px)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 1000,
          height: '85vh',
          background: tokens.color.background,
          border: `1px solid ${tokens.color.border}`,
          borderRadius: tokens.radius.lg,
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >

        {/* Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: `1px solid ${tokens.color.border}`,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 16,
            }}
          >
            <div>
              <h2
                style={{
                  color: tokens.color.text,
                  fontSize: 20,
                  fontWeight: 700,
                  margin: 0,
                }}
              >
                Chọn loại Section
              </h2>
              <p
                style={{ color: tokens.color.muted, fontSize: 13, margin: '4px 0 0' }}
              >
                {filteredSections.length} sections có sẵn
              </p>
            </div>
            <motion.button
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
              onClick={onCancel}
              style={{
                background: tokens.color.surfaceHover,
                border: `1px solid ${tokens.color.border}`,
                borderRadius: '50%',
                width: 36,
                height: 36,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: tokens.color.text,
                fontSize: 18,
              }}
            >
              <i className="ri-close-line" />
            </motion.button>
          </div>

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
                fontSize: 18,
              }}
            />
            <input
              type="text"
              placeholder="Tìm kiếm section..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px 10px 40px',
                background: tokens.color.surface,
                border: `1px solid ${tokens.color.border}`,
                borderRadius: tokens.radius.md,
                color: tokens.color.text,
                fontSize: 14,
                outline: 'none',
              }}
            />
            {search && (
              <motion.button
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                onClick={() => setSearch('')}
                style={{
                  position: 'absolute',
                  right: 8,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'transparent',
                  border: 'none',
                  color: tokens.color.muted,
                  cursor: 'pointer',
                  padding: 4,
                }}
              >
                <i className="ri-close-circle-fill" />
              </motion.button>
            )}
          </div>
        </div>

        {/* Category Tabs */}
        <div
          style={{
            display: 'flex',
            gap: 4,
            padding: '12px 24px',
            borderBottom: `1px solid ${tokens.color.border}`,
            overflowX: 'auto',
            flexShrink: 0,
          }}
        >
          {categories.map((cat) => (
            <motion.button
              key={cat.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setActiveCategory(cat.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 14px',
                background:
                  activeCategory === cat.id
                    ? `${tokens.color.primary}20`
                    : 'transparent',
                border:
                  activeCategory === cat.id
                    ? `1px solid ${tokens.color.primary}40`
                    : `1px solid transparent`,
                borderRadius: tokens.radius.pill,
                color:
                  activeCategory === cat.id
                    ? tokens.color.primary
                    : tokens.color.muted,
                fontSize: 13,
                fontWeight: activeCategory === cat.id ? 600 : 400,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.2s',
              }}
            >
              <i className={cat.icon} style={{ fontSize: 16 }} />
              {cat.label}
              <span
                style={{
                  background:
                    activeCategory === cat.id
                      ? tokens.color.primary
                      : tokens.color.surfaceHover,
                  color: activeCategory === cat.id ? '#111' : tokens.color.muted,
                  padding: '2px 6px',
                  borderRadius: 10,
                  fontSize: 11,
                  fontWeight: 600,
                }}
              >
                {categoryCounts[cat.id] || 0}
              </span>
            </motion.button>
          ))}
        </div>

        {/* Grid */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
          <AnimatePresence mode="wait">
            {filteredSections.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 60,
                  color: tokens.color.muted,
                }}
              >
                <i
                  className="ri-search-line"
                  style={{ fontSize: 48, marginBottom: 16, opacity: 0.5 }}
                />
                <p style={{ margin: 0, fontSize: 16 }}>
                  Không tìm thấy section phù hợp
                </p>
                <button
                  onClick={() => {
                    setSearch('');
                    setActiveCategory('all');
                  }}
                  style={{
                    marginTop: 12,
                    padding: '8px 16px',
                    background: tokens.color.surface,
                    border: `1px solid ${tokens.color.border}`,
                    borderRadius: tokens.radius.md,
                    color: tokens.color.primary,
                    cursor: 'pointer',
                    fontSize: 14,
                  }}
                >
                  Xóa bộ lọc
                </button>
              </motion.div>
            ) : (
              <motion.div
                key={activeCategory + search}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                  gap: 12,
                }}
              >
                {filteredSections.map((section, index) => (
                  <motion.div
                    key={section.type}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.02 }}
                    whileHover={{
                      y: -2,
                      boxShadow: `0 4px 16px ${section.color}30`,
                    }}
                    onClick={() => onSelect(section.type)}
                    style={{
                      background: tokens.color.surfaceAlt,
                      border: `1px solid ${tokens.color.border}`,
                      borderRadius: tokens.radius.md,
                      padding: 16,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      position: 'relative',
                      overflow: 'hidden',
                    }}
                  >
                    {/* Color accent */}
                    <div
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        height: 2,
                        background: section.color,
                      }}
                    />

                    {/* Header row */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        marginBottom: 8,
                      }}
                    >
                      <div
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: tokens.radius.sm,
                          background: `${section.color}15`,
                          border: `1px solid ${section.color}30`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        <i
                          className={section.icon}
                          style={{ fontSize: 20, color: section.color }}
                        />
                      </div>
                      <h3
                        style={{
                          color: tokens.color.text,
                          fontSize: 14,
                          fontWeight: 600,
                          margin: 0,
                          lineHeight: 1.3,
                        }}
                      >
                        {section.label}
                      </h3>
                    </div>

                    {/* Description */}
                    <p
                      style={{
                        color: tokens.color.muted,
                        fontSize: 12,
                        lineHeight: 1.4,
                        margin: 0,
                      }}
                    >
                      {section.description}
                    </p>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '12px 20px',
            borderTop: `1px solid ${tokens.color.border}`,
            background: 'rgba(245,211,147,0.03)',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <i
            className="ri-lightbulb-line"
            style={{ color: tokens.color.primary, fontSize: 16 }}
          />
          <p style={{ color: tokens.color.muted, fontSize: 12, margin: 0 }}>
            Sau khi thêm, bạn có thể kéo thả để sắp xếp lại thứ tự sections
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}
