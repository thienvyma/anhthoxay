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
  adminBackgroundImage?: string; // Hình nền cho Admin Panel
  // Logo management
  logos?: LogoItem[];
}

// Logo item for different positions
export interface LogoItem {
  id: string;
  name: string;
  url: string;
  position: LogoPosition;
}

export type LogoPosition = 'header' | 'footer' | 'pdf' | 'quote' | 'favicon';

// Announcement - Thông báo cho trang User (sẽ phát triển sau)
export interface AnnouncementSettings {
  enabled: boolean;
  text: string;
  link?: string;
  linkText?: string;
  backgroundColor: string;
  textColor: string;
}

// Media item for popup (image or video)
export interface PopupMedia {
  type: 'image' | 'video';
  url: string;
  // For video: can be uploaded file URL or external link (YouTube, etc.)
  isExternal?: boolean;
}

// Popup Banner - Cửa sổ popup quảng cáo trên Landing
export interface PopupSettings {
  enabled: boolean;
  title: string;
  content: string;
  // Legacy field - kept for backward compatibility
  imageUrl?: string;
  // New: Separate media for desktop and mobile
  desktopMedia?: PopupMedia;
  mobileMedia?: PopupMedia;
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

export interface HeaderNavItem {
  label: string;
  route: string;
  icon?: string;
  highlight?: boolean; // Làm nổi bật link đặc biệt (như Marketplace)
}

export interface HeaderConfig {
  logo?: { text?: string; icon?: string; imageUrl?: string; animateIcon?: boolean };
  navigation?: HeaderNavItem[];
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

export type SettingsTab = 'account' | 'layout' | 'company' | 'promo' | 'email' | 'integrations';

// Email Settings - Tùy chỉnh nội dung email báo giá
export interface EmailSettings {
  // Brand
  brandName: string;
  tagline: string;
  subjectTemplate: string;
  
  // Greeting & Intro
  greetingTemplate: string;
  introText: string;
  
  // Info Box Labels
  infoBoxTitle: string;
  labelProject: string;
  labelBuilding: string;
  labelUnit: string;
  labelApartmentType: string;
  
  // Attachment & Disclaimer
  attachmentNotice: string;
  disclaimerText: string;
  
  // CTA
  ctaQuestion: string;
  ctaButtonText: string;
  ctaButtonLink: string;
  
  // Signature
  signatureClosing: string;
  signatureTeam: string;
  
  // Footer
  footerCopyright: string;
  footerWebsite: string;
  footerHotline: string;
  spamNotice: string;
}

export const defaultEmailSettings: EmailSettings = {
  brandName: 'ANH THỢ XÂY',
  tagline: 'Đối tác tin cậy cho ngôi nhà của bạn',
  subjectTemplate: '[ANH THỢ XÂY] Báo giá nội thất - Căn hộ {{unitNumber}}',
  
  greetingTemplate: 'Xin chào {{leadName}},',
  introText: 'Cảm ơn bạn đã sử dụng dịch vụ báo giá nội thất của {{brandName}}. Chúng tôi đã chuẩn bị báo giá chi tiết cho căn hộ của bạn.',
  
  infoBoxTitle: '📍 Thông tin căn hộ',
  labelProject: 'Dự án',
  labelBuilding: 'Tòa nhà',
  labelUnit: 'Căn hộ',
  labelApartmentType: 'Loại căn hộ',
  
  attachmentNotice: 'Vui lòng xem file PDF đính kèm để biết chi tiết báo giá đầy đủ bao gồm danh sách sản phẩm, giá từng hạng mục và tổng chi phí.',
  disclaimerText: 'Báo giá này chỉ mang tính chất tham khảo. Giá thực tế có thể thay đổi tùy theo thời điểm, nguồn cung vật liệu và điều kiện thi công cụ thể. Vui lòng liên hệ với chúng tôi để được tư vấn chi tiết.',
  
  ctaQuestion: 'Bạn có câu hỏi hoặc cần tư vấn thêm?',
  ctaButtonText: 'Liên hệ ngay',
  ctaButtonLink: 'https://anhthoxay.com/lien-he',
  
  signatureClosing: 'Trân trọng,',
  signatureTeam: 'Đội ngũ tư vấn nội thất',
  
  footerCopyright: '© {{year}} ANH THỢ XÂY - Đối tác tin cậy cho ngôi nhà của bạn',
  footerWebsite: 'anhthoxay.com',
  footerHotline: '1900-xxxx',
  spamNotice: '📧 Nếu bạn không thấy email này trong hộp thư đến, vui lòng kiểm tra thư mục Spam hoặc Quảng cáo.',
};

// Glass Morphism Design Tokens (Light Mode for Admin)
export const glass = {
  background: '#F9FAFB',  // Light gray background
  border: '1px solid #E5E7EB',  // Visible border
  blur: 'blur(20px)',
  shadow: '0 2px 8px rgba(0,0,0,0.08)',
  hoverBorder: '1px solid rgba(245,211,147,0.5)',
  hoverShadow: '0 4px 16px rgba(245,211,147,0.15)',
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
  desktopMedia: undefined,
  mobileMedia: undefined,
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
