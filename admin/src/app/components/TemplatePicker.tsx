import { tokens } from '../../theme';
import type { SectionKind } from '../types';

interface Template {
  id: string;
  name: string;
  description: string;
  data: Record<string, unknown>;
}

interface TemplatePickerProps {
  kind: SectionKind;
  onSelect: (data: Record<string, unknown>) => void;
  onClose: () => void;
}

// ATH Construction/Renovation Templates
const TEMPLATES: Partial<Record<SectionKind, Template[]>> = {
  HERO: [
    {
      id: 'hero-construction',
      name: 'Hero Cải Tạo Nhà',
      description: 'Banner chính cho dịch vụ cải tạo',
      data: {
        title: 'Anh Thợ Xây - Cải Tạo Nhà Chuyên Nghiệp',
        subtitle: 'Biến ngôi nhà cũ thành không gian sống mơ ước với dịch vụ cải tạo uy tín',
        imageUrl: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=1200&q=80',
        ctaText: 'Nhận Báo Giá Miễn Phí',
        ctaLink: '/bao-gia',
      },
    },
    {
      id: 'hero-renovation',
      name: 'Hero Sửa Chữa',
      description: 'Banner cho dịch vụ sửa chữa nhà',
      data: {
        title: 'Sửa Chữa Nhà Nhanh Chóng - Uy Tín',
        subtitle: 'Đội ngũ thợ lành nghề, thi công đúng tiến độ, giá cả hợp lý',
        imageUrl: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=1200&q=80',
        ctaText: 'Liên Hệ Ngay',
        ctaLink: '/lien-he',
      },
    },
  ],

  TESTIMONIALS: [
    {
      id: 'testimonials-customers',
      name: 'Đánh Giá Khách Hàng',
      description: 'Phản hồi từ khách hàng đã sử dụng dịch vụ',
      data: {
        title: 'Khách Hàng Nói Gì Về Chúng Tôi',
        subtitle: 'Đánh giá thực từ khách hàng đã sử dụng dịch vụ',
        testimonials: [
          {
            name: 'Anh Minh',
            role: 'Chủ nhà tại Quận 7',
            avatar: 'https://i.pravatar.cc/150?img=12',
            rating: 5,
            content: 'Đội ngũ làm việc rất chuyên nghiệp, đúng tiến độ và chất lượng thi công tốt. Rất hài lòng!',
          },
          {
            name: 'Chị Hương',
            role: 'Chủ căn hộ tại Quận 2',
            avatar: 'https://i.pravatar.cc/150?img=5',
            rating: 5,
            content: 'Giá cả hợp lý, thợ làm việc cẩn thận. Sẽ giới thiệu cho bạn bè.',
          },
        ],
      },
    },
  ],

  STATS: [
    {
      id: 'stats-achievements',
      name: 'Thành Tựu',
      description: 'Số liệu nổi bật của công ty',
      data: {
        title: 'Thành Tựu Của Chúng Tôi',
        subtitle: 'Những con số nói lên tất cả',
        stats: [
          { icon: 'ri-home-smile-line', value: 500, label: 'Công Trình Hoàn Thành', suffix: '+' },
          { icon: 'ri-user-smile-line', value: 1000, label: 'Khách Hàng Hài Lòng', suffix: '+' },
          { icon: 'ri-calendar-check-line', value: 10, label: 'Năm Kinh Nghiệm', suffix: '+' },
          { icon: 'ri-star-line', value: 4.9, label: 'Đánh Giá Trung Bình', prefix: '⭐' },
        ],
      },
    },
  ],

  CTA: [
    {
      id: 'cta-quote',
      name: 'CTA Báo Giá',
      description: 'Kêu gọi khách hàng nhận báo giá',
      data: {
        title: 'Sẵn Sàng Cải Tạo Ngôi Nhà Của Bạn?',
        subtitle: 'Liên hệ ngay để nhận báo giá miễn phí và tư vấn chuyên nghiệp',
        primaryButton: { text: 'Nhận Báo Giá Ngay', link: '/bao-gia' },
        secondaryButton: { text: 'Xem Dự Án', link: '/du-an' },
      },
    },
  ],

  FEATURES: [
    {
      id: 'features-services',
      name: 'Dịch Vụ Cải Tạo',
      description: 'Các dịch vụ cải tạo nhà',
      data: {
        title: 'Dịch Vụ Của Chúng Tôi',
        subtitle: 'Giải pháp cải tạo nhà toàn diện',
        features: [
          { icon: 'ri-paint-brush-line', title: 'Sơn Tường', description: 'Sơn mới, sửa chữa tường hư hỏng' },
          { icon: 'ri-layout-grid-line', title: 'Ốp Lát', description: 'Ốp gạch, lát sàn chuyên nghiệp' },
          { icon: 'ri-drop-line', title: 'Chống Thấm', description: 'Xử lý chống thấm, chống dột' },
          { icon: 'ri-flashlight-line', title: 'Điện Nước', description: 'Sửa chữa, lắp đặt hệ thống điện nước' },
        ],
        layout: 'grid',
      },
    },
  ],

  CONTACT_INFO: [
    {
      id: 'contact-full',
      name: 'Thông Tin Liên Hệ Đầy Đủ',
      description: 'Địa chỉ, SĐT, email và giờ làm việc',
      data: {
        title: 'Liên Hệ & Địa Chỉ',
        phone: '+84 123 456 789',
        email: 'contact@noithatnhanh.vn',
        address: '123 Đường ABC, Quận 1, TP.HCM',
        hours: [
          { day: 'Thứ 2 - Thứ 6', time: '08:00 - 18:00' },
          { day: 'Thứ 7', time: '08:00 - 12:00' },
        ],
        mapEmbedUrl: '',
        socialLinks: [
          { platform: 'facebook', url: 'https://facebook.com/noithatnhanh' },
          { platform: 'zalo', url: 'https://zalo.me/noithatnhanh' },
        ],
      },
    },
  ],

  RICH_TEXT: [
    {
      id: 'richtext-about',
      name: 'Giới Thiệu Công Ty',
      description: 'Nội dung giới thiệu về công ty',
      data: {
        content: `# Về Anh Thợ Xây

Chúng tôi là đơn vị chuyên cung cấp dịch vụ cải tạo, sửa chữa nhà ở với hơn 10 năm kinh nghiệm.

## Cam Kết Của Chúng Tôi

- **Chất lượng**: Thi công đúng tiêu chuẩn, vật liệu chính hãng
- **Tiến độ**: Hoàn thành đúng hẹn, không kéo dài
- **Giá cả**: Báo giá minh bạch, không phát sinh

## Liên Hệ

Hotline: 0123 456 789
Email: contact@noithatnhanh.vn`,
      },
    },
  ],
};

// Styles using tokens
const styles = {
  overlay: {
    position: 'fixed' as const,
    inset: 0,
    background: tokens.color.overlay,
    backdropFilter: 'blur(4px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: tokens.zIndex.modal,
    padding: tokens.space.md,
  },
  modal: {
    background: tokens.color.surface,
    borderRadius: tokens.radius.lg,
    border: `1px solid ${tokens.color.border}`,
    width: '100%',
    maxWidth: '64rem',
    maxHeight: '90vh',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column' as const,
  },
  modalSmall: {
    background: tokens.color.surface,
    borderRadius: tokens.radius.lg,
    border: `1px solid ${tokens.color.border}`,
    padding: tokens.space.xl,
    maxWidth: '28rem',
  },
  header: {
    padding: tokens.space.lg,
    borderBottom: `1px solid ${tokens.color.border}`,
  },
  headerContent: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: tokens.font.size.xl,
    fontWeight: tokens.font.weight.semibold,
    color: tokens.color.text,
    display: 'flex',
    alignItems: 'center',
    gap: tokens.space.sm,
  },
  subtitle: {
    fontSize: tokens.font.size.sm,
    color: tokens.color.textMuted,
    marginTop: tokens.space.xs,
  },
  closeButton: {
    background: 'transparent',
    border: 'none',
    color: tokens.color.textMuted,
    cursor: 'pointer',
    padding: tokens.space.xs,
    borderRadius: tokens.radius.sm,
    transition: 'color 0.2s',
  },
  content: {
    flex: 1,
    overflowY: 'auto' as const,
    padding: tokens.space.lg,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: tokens.space.md,
  },
  templateCard: {
    position: 'relative' as const,
    background: tokens.color.surfaceAlt,
    border: `1px solid ${tokens.color.border}`,
    borderRadius: tokens.radius.md,
    padding: tokens.space.lg,
    textAlign: 'left' as const,
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  templateCardHover: {
    borderColor: tokens.color.info,
    boxShadow: `0 4px 12px rgba(59, 130, 246, 0.15)`,
  },
  templateIcon: {
    width: '40px',
    height: '40px',
    borderRadius: tokens.radius.md,
    background: 'linear-gradient(135deg, #3B82F6, #8B5CF6)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  templateTitle: {
    color: tokens.color.text,
    fontWeight: tokens.font.weight.semibold,
    marginBottom: tokens.space.xs,
    transition: 'color 0.2s',
  },
  templateDescription: {
    fontSize: tokens.font.size.sm,
    color: tokens.color.textMuted,
  },
  templateHint: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.space.sm,
    fontSize: tokens.font.size.xs,
    color: tokens.color.muted,
  },
  footer: {
    padding: tokens.space.md,
    borderTop: `1px solid ${tokens.color.border}`,
    background: tokens.color.surfaceAlt,
  },
  cancelButton: {
    width: '100%',
    padding: `${tokens.space.sm} ${tokens.space.md}`,
    background: tokens.color.surfaceHover,
    border: 'none',
    borderRadius: tokens.radius.md,
    color: tokens.color.text,
    cursor: 'pointer',
    transition: 'background 0.2s',
    fontWeight: tokens.font.weight.medium,
  },
  emptyText: {
    color: tokens.color.textMuted,
    marginBottom: tokens.space.md,
  },
};

export function TemplatePicker({ kind, onSelect, onClose }: TemplatePickerProps) {
  const templates = TEMPLATES[kind] || [];

  if (templates.length === 0) {
    return (
      <div 
        style={styles.overlay}
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            onClose();
          }
        }}
      >
        <div 
          style={styles.modalSmall}
          onClick={(e) => e.stopPropagation()}
        >
          <p style={styles.emptyText}>Chưa có template cho loại section này.</p>
          <button
            onClick={onClose}
            style={styles.cancelButton}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = tokens.color.border;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = tokens.color.surfaceHover;
            }}
          >
            Đóng
          </button>
        </div>
      </div>
    );
  }

  return (
    <div 
      style={styles.overlay}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div 
        style={styles.modal}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={styles.header}>
          <div style={styles.headerContent}>
            <div>
              <h2 style={styles.title}>
                <i className="ri-sparkling-line" style={{ fontSize: '20px', color: tokens.color.primary }} />
                Chọn Template
              </h2>
              <p style={styles.subtitle}>
                Bắt đầu với template có sẵn cho {kind.toLowerCase().replace('_', ' ')}
              </p>
            </div>
            <button
              onClick={onClose}
              style={styles.closeButton}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = tokens.color.text;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = tokens.color.textMuted;
              }}
            >
              <svg style={{ width: '24px', height: '24px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div style={styles.content}>
          <div style={styles.grid}>
            {templates.map((template) => (
              <button
                key={template.id}
                onClick={() => {
                  onSelect(template.data);
                  onClose();
                }}
                style={styles.templateCard}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = tokens.color.info;
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.15)';
                  const titleEl = e.currentTarget.querySelector('h3');
                  if (titleEl) (titleEl as HTMLElement).style.color = tokens.color.info;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = tokens.color.border;
                  e.currentTarget.style.boxShadow = 'none';
                  const titleEl = e.currentTarget.querySelector('h3');
                  if (titleEl) (titleEl as HTMLElement).style.color = tokens.color.text;
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: tokens.space.md, marginBottom: tokens.space.md }}>
                  <div style={styles.templateIcon}>
                    <i className="ri-star-line" style={{ fontSize: '20px', color: 'white' }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <h3 style={styles.templateTitle}>
                      {template.name}
                    </h3>
                    <p style={styles.templateDescription}>{template.description}</p>
                  </div>
                </div>

                <div style={styles.templateHint}>
                  <i className="ri-flashlight-line" style={{ fontSize: '14px' }} />
                  <span>Nhấn để sử dụng template</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div style={styles.footer}>
          <button
            onClick={onClose}
            style={styles.cancelButton}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = tokens.color.border;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = tokens.color.surfaceHover;
            }}
          >
            Hủy
          </button>
        </div>
      </div>
    </div>
  );
}
