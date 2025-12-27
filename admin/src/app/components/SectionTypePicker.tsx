import { motion } from 'framer-motion';
import { tokens } from '@app/shared';
import type { SectionKind } from '../types';

interface SectionTypePickerProps {
  onSelect: (type: SectionKind) => void;
  onCancel: () => void;
}

// Section types for ANH THỢ XÂY - Construction/Renovation business
const sectionTypes: Array<{
  type: SectionKind;
  icon: string;
  label: string;
  description: string;
  color: string;
  example: string;
}> = [
  // Hero & Banners
  {
    type: 'HERO',
    icon: 'ri-image-2-line',
    label: 'Hero Banner',
    description: 'Banner chính với hình ảnh, tiêu đề và nút CTA',
    color: '#f59e0b',
    example: 'Trang chủ, landing page',
  },
  {
    type: 'HERO_SIMPLE',
    icon: 'ri-layout-top-line',
    label: 'Hero Đơn Giản',
    description: 'Hero nhẹ cho các trang phụ',
    color: '#fb923c',
    example: 'Trang liên hệ, giới thiệu',
  },
  {
    type: 'BANNER',
    icon: 'ri-megaphone-line',
    label: 'Banner Thông Báo',
    description: 'Thanh thông báo quan trọng',
    color: '#f97316',
    example: 'Khuyến mãi, sự kiện',
  },
  // Services & Features
  {
    type: 'SERVICES',
    icon: 'ri-service-line',
    label: 'Dịch Vụ',
    description: 'Danh sách các dịch vụ cải tạo nhà',
    color: '#3b82f6',
    example: 'Sơn tường, ốp lát, điện nước',
  },
  {
    type: 'FEATURES',
    icon: 'ri-star-line',
    label: 'Tính Năng / Ưu Điểm',
    description: 'Highlight các ưu điểm của dịch vụ',
    color: '#3b82f6',
    example: 'Chất lượng, uy tín, giá tốt',
  },
  {
    type: 'QUOTE_FORM',
    icon: 'ri-file-list-3-line',
    label: 'Form Đăng Ký Tư Vấn',
    description: 'Form đăng ký tư vấn đơn giản',
    color: '#10b981',
    example: 'Form liên hệ, tư vấn',
  },
  {
    type: 'QUOTE_CALCULATOR',
    icon: 'ri-calculator-line',
    label: 'Dự Toán & Tư Vấn',
    description: 'Section 2 tab: Dự toán nhanh + Đăng ký tư vấn',
    color: '#f59e0b',
    example: 'Trang báo giá /bao-gia',
  },
  // Content
  {
    type: 'STATS',
    icon: 'ri-bar-chart-box-line',
    label: 'Thống Kê',
    description: 'Số liệu ấn tượng về công ty',
    color: '#10b981',
    example: 'Năm kinh nghiệm, khách hàng',
  },
  {
    type: 'TESTIMONIALS',
    icon: 'ri-chat-quote-line',
    label: 'Đánh Giá Khách Hàng',
    description: 'Nhận xét và đánh giá từ khách hàng',
    color: '#8b5cf6',
    example: 'Hiển thị 3-6 đánh giá',
  },
  {
    type: 'MISSION_VISION',
    icon: 'ri-flag-line',
    label: 'Sứ Mệnh & Tầm Nhìn',
    description: 'Giới thiệu sứ mệnh và tầm nhìn công ty',
    color: '#0ea5e9',
    example: 'Trang giới thiệu',
  },
  {
    type: 'CORE_VALUES',
    icon: 'ri-heart-3-line',
    label: 'Giá Trị Cốt Lõi',
    description: 'Các giá trị và nguyên tắc của công ty',
    color: '#ec4899',
    example: 'Chất lượng, uy tín, tận tâm',
  },
  {
    type: 'RICH_TEXT',
    icon: 'ri-file-text-line',
    label: 'Nội Dung Tùy Chỉnh',
    description: 'Nội dung HTML tùy chỉnh',
    color: '#64748b',
    example: 'Chính sách, điều khoản',
  },
  {
    type: 'ABOUT',
    icon: 'ri-information-line',
    label: 'Giới Thiệu',
    description: 'Thông tin về công ty',
    color: '#0ea5e9',
    example: 'Trang giới thiệu',
  },
  {
    type: 'FAQ',
    icon: 'ri-question-answer-line',
    label: 'Câu Hỏi Thường Gặp',
    description: 'Danh sách FAQ',
    color: '#6366f1',
    example: 'Hỗ trợ khách hàng',
  },
  // Call to Action
  {
    type: 'CTA',
    icon: 'ri-flashlight-line',
    label: 'Kêu Gọi Hành Động',
    description: 'Khuyến khích khách hàng liên hệ/đặt lịch',
    color: '#f59e0b',
    example: 'Nhận báo giá miễn phí',
  },
  {
    type: 'CALL_TO_ACTION',
    icon: 'ri-megaphone-fill',
    label: 'CTA Nâng Cao',
    description: 'CTA với nút chính và phụ',
    color: '#f59e0b',
    example: 'Liên hệ ngay',
  },
  // Contact & Social
  {
    type: 'CONTACT_INFO',
    icon: 'ri-map-pin-line',
    label: 'Thông Tin Liên Hệ',
    description: 'Địa chỉ, điện thoại, email',
    color: '#6366f1',
    example: 'Footer hoặc trang liên hệ',
  },
  {
    type: 'QUICK_CONTACT',
    icon: 'ri-contacts-line',
    label: 'Liên Hệ Nhanh',
    description: 'Thẻ liên hệ nhanh với hiệu ứng glass',
    color: '#10b981',
    example: 'Điện thoại, Email, Địa chỉ',
  },
  {
    type: 'SOCIAL_MEDIA',
    icon: 'ri-share-line',
    label: 'Mạng Xã Hội',
    description: 'Liên kết mạng xã hội',
    color: '#a855f7',
    example: 'Facebook, Zalo, YouTube',
  },
  {
    type: 'FOOTER_SOCIAL',
    icon: 'ri-share-forward-line',
    label: 'Social Footer',
    description: 'Liên kết mạng xã hội cho footer',
    color: '#64748b',
    example: 'Icon mạng xã hội',
  },
  // Blog
  {
    type: 'FEATURED_BLOG_POSTS',
    icon: 'ri-article-line',
    label: 'Bài Viết Nổi Bật',
    description: 'Hiển thị bài viết blog nổi bật',
    color: '#8b5cf6',
    example: 'Tin tức, kinh nghiệm xây dựng',
  },
  {
    type: 'BLOG_LIST',
    icon: 'ri-list-check',
    label: 'Danh Sách Blog',
    description: 'Danh sách bài viết với bộ lọc',
    color: '#8b5cf6',
    example: 'Trang blog',
  },
  // Floating Actions
  {
    type: 'FAB_ACTIONS',
    icon: 'ri-customer-service-2-fill',
    label: 'Nút Hành Động Nổi',
    description: 'Nút cố định góc màn hình (gọi, chat, Zalo)',
    color: '#f5d393',
    example: 'Hiển thị trên mọi trang',
  },
  // Marketplace
  {
    type: 'MARKETPLACE',
    icon: 'ri-store-2-line',
    label: 'Sàn Giao Dịch',
    description: 'Hiển thị công trình đang tìm nhà thầu (OPEN status)',
    color: '#06b6d4',
    example: 'Trang chủ, thu hút nhà thầu',
  },
  // Media
  {
    type: 'FEATURED_SLIDESHOW',
    icon: 'ri-slideshow-3-line',
    label: 'Slideshow Nổi Bật',
    description: 'Hiển thị các hình ảnh được đánh dấu nổi bật dạng slideshow',
    color: '#ec4899',
    example: 'Trang chủ, giới thiệu',
  },
  {
    type: 'MEDIA_GALLERY',
    icon: 'ri-gallery-line',
    label: 'Thư Viện Ảnh',
    description: 'Hiển thị toàn bộ ảnh với phân trang và lightbox',
    color: '#8b5cf6',
    example: 'Trang gallery, portfolio',
  },
  {
    type: 'VIDEO_SHOWCASE',
    icon: 'ri-video-line',
    label: 'Video Showcase',
    description: 'Hiển thị video tự động chạy (upload hoặc link YouTube/Vimeo)',
    color: '#ef4444',
    example: 'Giới thiệu công ty, dự án',
  },
  // Furniture Quotation
  {
    type: 'FURNITURE_QUOTE',
    icon: 'ri-sofa-line',
    label: 'Báo Giá Nội Thất',
    description: 'Quy trình chọn căn hộ và báo giá nội thất step-by-step',
    color: '#8b5cf6',
    example: 'Trang báo giá nội thất',
  },
];

export function SectionTypePicker({ onSelect, onCancel }: SectionTypePickerProps) {
  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            onCancel();
          }
        }}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.8)',
          backdropFilter: 'blur(8px)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          onClick={(e) => {
            e.stopPropagation();
          }}
          style={{
            width: '100%',
            maxWidth: 1200,
            height: '90vh',
            maxHeight: '90vh',
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
            padding: 24,
            borderBottom: `1px solid ${tokens.color.border}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <h2 style={{ color: tokens.color.text, fontSize: 24, fontWeight: 700, margin: '0 0 4px' }}>
              Choose Section Type
            </h2>
            <p style={{ color: tokens.color.muted, fontSize: 14, margin: 0 }}>
              Select the type of content you want to add to your page
            </p>
          </div>
          <motion.button
            whileHover={{ scale: 1.1, rotate: 90 }}
            whileTap={{ scale: 0.9 }}
            onClick={onCancel}
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: `1px solid ${tokens.color.border}`,
              borderRadius: '50%',
              width: 40,
              height: 40,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: tokens.color.text,
              fontSize: 20,
            }}
          >
            <i className="ri-close-line" />
          </motion.button>
        </div>

        {/* Grid */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: 16,
            }}
          >
            {sectionTypes.map((section, index) => (
              <motion.div
                key={section.type}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ y: -4, boxShadow: `0 8px 24px ${section.color}40` }}
                onClick={() => onSelect(section.type)}
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: `1px solid ${tokens.color.border}`,
                  borderRadius: tokens.radius.lg,
                  padding: 20,
                  cursor: 'pointer',
                  transition: 'all 0.3s',
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
                    height: 3,
                    background: section.color,
                  }}
                />

                {/* Icon */}
                <div
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: tokens.radius.md,
                    background: `${section.color}20`,
                    border: `1px solid ${section.color}40`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 16,
                  }}
                >
                  <i className={section.icon} style={{ fontSize: 28, color: section.color }} />
                </div>

                {/* Label */}
                <h3
                  style={{
                    color: tokens.color.text,
                    fontSize: 18,
                    fontWeight: 600,
                    margin: '0 0 8px',
                  }}
                >
                  {section.label}
                </h3>

                {/* Description */}
                <p
                  style={{
                    color: tokens.color.muted,
                    fontSize: 14,
                    lineHeight: 1.5,
                    margin: '0 0 12px',
                  }}
                >
                  {section.description}
                </p>

                {/* Example */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    color: section.color,
                    fontSize: 12,
                    fontWeight: 500,
                  }}
                >
                  <i className="ri-lightbulb-line" />
                  {section.example}
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Footer tip */}
        <div
          style={{
            padding: 16,
            borderTop: `1px solid ${tokens.color.border}`,
            background: 'rgba(245,211,147,0.05)',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <i className="ri-information-line" style={{ color: tokens.color.primary, fontSize: 20 }} />
          <p style={{ color: tokens.color.muted, fontSize: 13, margin: 0 }}>
            💡 <strong>Tip:</strong> You can reorder sections anytime by dragging them in the Sections page
          </p>
        </div>
        </motion.div>
      </motion.div>
    </>
  );
}

