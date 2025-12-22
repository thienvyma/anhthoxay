// Settings Page Type Definitions - ANH THỢ XÂY

export interface CompanySettings {
  name: string;
  description: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  workingHours: string;
  backgroundImage?: string;
}

// Announcement - Thông báo cho trang User (sẽ phát triển sau)
export interface AnnouncementSettings {
  enabled: boolean;
  text: string;
  link?: string;
  linkText?: string;
  backgroundColor: string;
  textColor: string;
}

// Popup Banner - Cửa sổ popup quảng cáo trên Landing
export interface PopupSettings {
  enabled: boolean;
  title: string;
  content: string;
  imageUrl?: string;
  buttonText?: string;
  buttonLink?: string;
  showOnce: boolean; // Chỉ hiển thị 1 lần/session
  delaySeconds: number; // Delay trước khi hiển thị
}

// Combined Promo Settings
export interface PromoSettings {
  announcement: AnnouncementSettings;
  popup: PopupSettings;
}

export interface CTALink {
  text: string;
  href: string;
  icon?: string;
}

export interface HeaderConfig {
  logo?: { text?: string; icon?: string; imageUrl?: string; animateIcon?: boolean };
  navigation?: Array<{ label: string; route: string; icon?: string }>;
  cta?: { 
    text?: string; 
    link?: string; 
    variant?: 'primary' | 'outline';
    // Support multiple links for dropdown
    links?: CTALink[];
  };
  options?: { sticky?: boolean; transparent?: boolean; showSearch?: boolean };
}

export interface FooterConfig {
  brand?: { text?: string; icon?: string; tagline?: string };
  quickLinks?: Array<{ label: string; link: string }>;
  newsletter?: { title?: string; placeholder?: string; buttonText?: string };
  social?: Array<{ platform: string; url: string; icon: string }>;
  copyright?: { text?: string };
}

export type SettingsTab = 'account' | 'layout' | 'company' | 'promo' | 'integrations';

// Glass Morphism Design Tokens (matching landing page)
export const glass = {
  background: 'rgba(12,12,16,0.7)',
  border: '1px solid rgba(255,255,255,0.08)',
  blur: 'blur(20px)',
  shadow: '0 8px 32px rgba(0,0,0,0.3)',
  hoverBorder: '1px solid rgba(245,211,147,0.3)',
  hoverShadow: '0 12px 48px rgba(245,211,147,0.15)',
};

// Default values - ATH Construction
export const defaultCompanySettings: CompanySettings = {
  name: 'Anh Thợ Xây',
  description: 'Dịch vụ cải tạo nhà & căn hộ chuyên nghiệp',
  address: '123 Đường ABC, Quận 1, TP.HCM',
  phone: '0909 123 456',
  email: 'contact@anhthoxay.vn',
  website: 'https://anhthoxay.vn',
  workingHours: 'T2 - T7: 8:00 - 18:00',
};

export const defaultAnnouncementSettings: AnnouncementSettings = {
  enabled: false,
  text: '🎉 Khuyến mãi đặc biệt: Giảm 10% cho khách hàng mới!',
  link: '/bao-gia',
  linkText: 'Xem ngay',
  backgroundColor: '#f5d393',
  textColor: '#111111',
};

export const defaultPopupSettings: PopupSettings = {
  enabled: false,
  title: 'Ưu đãi đặc biệt!',
  content: 'Đăng ký tư vấn ngay hôm nay để nhận ưu đãi giảm 15% cho dịch vụ cải tạo nhà.',
  imageUrl: '',
  buttonText: 'Nhận ưu đãi',
  buttonLink: '/bao-gia',
  showOnce: true,
  delaySeconds: 3,
};

export const defaultPromoSettings: PromoSettings = {
  announcement: defaultAnnouncementSettings,
  popup: defaultPopupSettings,
};

export const defaultHeaderConfig: HeaderConfig = {
  logo: { text: 'Anh Thợ Xây', icon: 'ri-building-2-fill', animateIcon: true },
  navigation: [
    { label: 'Trang chủ', route: '/', icon: 'ri-home-4-line' },
    { label: 'Báo giá', route: '/bao-gia', icon: 'ri-calculator-line' },
    { label: 'Nội thất', route: '/noi-that', icon: 'ri-home-smile-line' },
    { label: 'Blog', route: '/blog', icon: 'ri-article-line' },
    { label: 'Chính sách', route: '/chinh-sach', icon: 'ri-shield-check-line' },
  ],
  cta: { 
    text: 'Báo giá ngay', 
    link: 'ri-price-tag-3-line', 
    variant: 'primary',
    links: [
      { text: 'Báo giá xây dựng', href: '/bao-gia', icon: 'ri-calculator-line' },
      { text: 'Báo giá nội thất', href: '/noi-that', icon: 'ri-home-smile-line' },
    ],
  },
  options: { sticky: true, transparent: false, showSearch: false },
};

export const defaultFooterConfig: FooterConfig = {
  brand: { text: 'Anh Thợ Xây', icon: 'ri-building-2-fill', tagline: 'Dịch vụ cải tạo nhà chuyên nghiệp' },
  quickLinks: [
    { label: 'Giới thiệu', link: '/about' },
    { label: 'Báo giá', link: '/bao-gia' },
    { label: 'Blog', link: '/blog' },
    { label: 'Liên hệ', link: '/contact' },
  ],
  newsletter: {
    title: 'Đăng ký nhận tin',
    placeholder: 'Email của bạn',
    buttonText: 'Đăng ký',
  },
  social: [
    { platform: 'Facebook', url: 'https://facebook.com', icon: 'ri-facebook-fill' },
    { platform: 'Zalo', url: 'https://zalo.me', icon: 'ri-chat-3-fill' },
    { platform: 'Youtube', url: 'https://youtube.com', icon: 'ri-youtube-fill' },
  ],
  copyright: { text: `© ${new Date().getFullYear()} Anh Thợ Xây. All rights reserved.` },
};

// Re-export API_URL from shared for convenience
export { API_URL } from '@app/shared';
