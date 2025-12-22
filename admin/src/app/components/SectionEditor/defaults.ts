import { tokens } from '@app/shared';
import type { SectionKind } from './types';
import { generateUniqueId } from './utils';

export function getDefaultData(sectionKind: SectionKind): Record<string, unknown> {
  switch (sectionKind) {
    case 'HERO':
      return {
        title: 'Anh Thợ Xây - Cải Tạo Nhà Chuyên Nghiệp',
        subtitle: 'Biến ngôi nhà cũ thành không gian sống mơ ước với dịch vụ cải tạo uy tín',
        imageUrl: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=1200&q=80',
        ctaText: 'Nhận Báo Giá Miễn Phí',
        ctaLink: '/bao-gia',
      };
    case 'HERO_SIMPLE':
      return {
        title: 'Liên Hệ',
        subtitle: 'Chúng tôi luôn sẵn sàng tư vấn',
        description: 'Hãy liên hệ với chúng tôi để được tư vấn miễn phí về dự án cải tạo nhà của bạn',
        backgroundImage: '',
        backgroundOverlay: 60,
        textAlign: 'center',
      };
    case 'TESTIMONIALS':
      return {
        title: 'Khách Hàng Nói Gì Về Chúng Tôi',
        subtitle: 'Đánh giá thực từ khách hàng đã sử dụng dịch vụ',
        testimonials: [
          {
            _id: generateUniqueId(),
            name: 'Anh Minh',
            role: 'Chủ nhà tại Quận 7',
            avatar: 'https://i.pravatar.cc/150?img=1',
            rating: 5,
            content: 'Đội ngũ làm việc rất chuyên nghiệp, đúng tiến độ và chất lượng thi công tốt.',
          },
        ],
      };
    case 'STATS':
      return {
        title: 'Thành Tựu Của Chúng Tôi',
        subtitle: 'Những con số nói lên tất cả',
        stats: [
          { _id: generateUniqueId(), icon: 'ri-home-smile-line', value: 500, label: 'Công Trình Hoàn Thành', suffix: '+' },
          { _id: generateUniqueId(), icon: 'ri-user-smile-line', value: 1000, label: 'Khách Hàng Hài Lòng', suffix: '+' },
          { _id: generateUniqueId(), icon: 'ri-calendar-check-line', value: 10, label: 'Năm Kinh Nghiệm', suffix: '+' },
          { _id: generateUniqueId(), icon: 'ri-star-line', value: 4.9, label: 'Đánh Giá Trung Bình', prefix: '⭐' },
        ],
      };
    case 'CTA':
    case 'CALL_TO_ACTION':
      return {
        title: 'Sẵn Sàng Cải Tạo Ngôi Nhà Của Bạn?',
        subtitle: 'Liên hệ ngay để nhận báo giá miễn phí và tư vấn chuyên nghiệp',
        primaryButton: { text: 'Nhận Báo Giá Ngay', link: '/bao-gia' },
        secondaryButton: { text: 'Xem Dự Án', link: '/du-an' },
      };
    case 'CONTACT_INFO':
      return {
        title: 'Liên Hệ & Địa Chỉ',
        phone: '+84 123 456 789',
        email: 'contact@anhthoxay.com',
        address: '123 Đường ABC, Quận 1, TP.HCM',
        hours: [
          { _id: generateUniqueId(), day: 'Thứ 2 - Thứ 6', time: '08:00 - 18:00' },
          { _id: generateUniqueId(), day: 'Thứ 7', time: '08:00 - 12:00' },
        ],
        mapEmbedUrl: '',
        socialLinks: [
          { _id: generateUniqueId(), platform: 'facebook', url: 'https://facebook.com' },
          { _id: generateUniqueId(), platform: 'zalo', url: 'https://zalo.me' },
        ],
      };
    case 'FEATURED_BLOG_POSTS':
      return { title: 'Kiến Thức Cải Tạo Nhà', subtitle: 'Cập nhật tin tức và mẹo hay', limit: 3 };
    case 'RICH_TEXT':
      return { content: '# Giới Thiệu\n\nViết nội dung của bạn tại đây...' };
    case 'BANNER':
      return { text: 'Khuyến mãi đặc biệt - Giảm 10% cho khách hàng mới!', href: '/bao-gia' };
    case 'SOCIAL_MEDIA':
      return {
        title: 'Kết nối với chúng tôi',
        subtitle: 'Theo dõi để cập nhật dự án mới',
        links: [
          { _id: generateUniqueId(), platform: 'facebook', url: 'https://facebook.com', icon: 'ri-facebook-fill' },
          { _id: generateUniqueId(), platform: 'youtube', url: 'https://youtube.com', icon: 'ri-youtube-fill' },
          { _id: generateUniqueId(), platform: 'tiktok', url: 'https://tiktok.com', icon: 'ri-tiktok-fill' },
        ],
        layout: 'horizontal',
      };
    case 'FEATURES':
      return {
        title: 'Dịch Vụ Của Chúng Tôi',
        subtitle: 'Giải pháp cải tạo nhà toàn diện',
        features: [
          { _id: generateUniqueId(), icon: 'ri-paint-brush-line', title: 'Sơn Tường', description: 'Sơn mới, sửa chữa tường hư hỏng' },
          { _id: generateUniqueId(), icon: 'ri-layout-grid-line', title: 'Ốp Lát', description: 'Ốp gạch, lát sàn chuyên nghiệp' },
          { _id: generateUniqueId(), icon: 'ri-drop-line', title: 'Chống Thấm', description: 'Xử lý chống thấm, chống dột' },
          { _id: generateUniqueId(), icon: 'ri-flashlight-line', title: 'Điện Nước', description: 'Sửa chữa, lắp đặt hệ thống điện nước' },
        ],
        layout: 'grid',
      };
    case 'MISSION_VISION':
      return {
        title: 'Sứ Mệnh & Tầm Nhìn',
        subtitle: 'Định hướng phát triển của Anh Thợ Xây',
        mission: { icon: 'ri-target-line', title: 'Sứ Mệnh', content: 'Mang đến dịch vụ cải tạo nhà chất lượng cao với giá cả hợp lý.' },
        vision: { icon: 'ri-eye-line', title: 'Tầm Nhìn', content: 'Trở thành đơn vị cải tạo nhà uy tín hàng đầu tại Việt Nam.' },
      };
    case 'CORE_VALUES':
      return {
        title: 'Giá Trị Cốt Lõi',
        subtitle: 'Những giá trị định hình thương hiệu',
        values: [
          { _id: generateUniqueId(), icon: 'ri-checkbox-circle-line', title: 'Chất Lượng', description: 'Cam kết thi công đúng tiêu chuẩn' },
          { _id: generateUniqueId(), icon: 'ri-time-line', title: 'Đúng Tiến Độ', description: 'Hoàn thành công trình đúng hẹn' },
          { _id: generateUniqueId(), icon: 'ri-money-dollar-circle-line', title: 'Giá Hợp Lý', description: 'Báo giá minh bạch, không phát sinh' },
        ],
      };
    case 'FAB_ACTIONS':
      return {
        mainIcon: 'ri-customer-service-2-fill',
        mainColor: '#F5D393',
        actions: [
          { _id: generateUniqueId(), icon: 'ri-phone-fill', label: 'Gọi ngay', href: 'tel:+84123456789', color: '#10b981' },
          { _id: generateUniqueId(), icon: 'ri-calculator-line', label: 'Báo giá', href: '/bao-gia', color: '#f59e0b' },
        ],
      };
    case 'FOOTER_SOCIAL':
      return {
        title: 'Kết Nối Với Chúng Tôi',
        subtitle: 'Theo dõi chúng tôi trên mạng xã hội',
        platforms: [
          { _id: generateUniqueId(), name: 'facebook', url: 'https://facebook.com' },
          { _id: generateUniqueId(), name: 'zalo', url: 'https://zalo.me' },
        ],
        layout: 'circular',
      };
    case 'QUICK_CONTACT':
      return {
        title: 'Liên Hệ Ngay',
        phone: '+84 123 456 789',
        email: 'contact@anhthoxay.com',
        address: '123 Đường ABC, Quận 1, TP.HCM',
      };
    case 'QUOTE_FORM':
      return {
        title: 'Đăng Ký Tư Vấn Trực Tiếp',
        subtitle: 'Để lại thông tin, chúng tôi sẽ liên hệ bạn trong 24h',
        buttonText: 'Đăng Ký Tư Vấn',
        showNameField: true,
        showPhoneField: true,
        showEmailField: true,
        showContentField: true,
        showAddressField: false,
        customFields: [],
        layout: 'card',
        buttonColor: tokens.color.primary,
        successMessage: 'Đăng ký thành công! Chúng tôi sẽ liên hệ bạn sớm.',
      };
    case 'QUOTE_CALCULATOR':
      return {
        title: 'Báo Giá & Dự Toán',
        subtitle: 'Tính toán chi phí cải tạo nhà nhanh chóng và chính xác',
        defaultTab: 'calculator',
        calculatorTab: {
          label: 'Dự Toán Nhanh',
          icon: 'ri-calculator-line',
        },
        consultationTab: {
          label: 'Đăng Ký Tư Vấn',
          icon: 'ri-phone-line',
          title: 'Đăng Ký Tư Vấn Trực Tiếp',
          subtitle: 'Để lại thông tin, chúng tôi sẽ liên hệ bạn trong 24h',
          buttonText: 'Đăng Ký Tư Vấn',
          successMessage: 'Đăng ký thành công! Chúng tôi sẽ liên hệ bạn sớm.',
        },
        showMaterials: true,
        maxWidth: 900,
      };
    case 'ABOUT':
      return {
        badge: 'Về Chúng Tôi',
        title: 'Anh Thợ Xây - Đối Tác Tin Cậy',
        description: 'Với hơn 10 năm kinh nghiệm trong lĩnh vực cải tạo nhà, chúng tôi tự hào mang đến dịch vụ chất lượng cao với giá cả hợp lý.',
        imageUrl: '',
      };
    case 'FAQ':
      return {
        title: 'Câu Hỏi Thường Gặp',
        items: [
          { _id: generateUniqueId(), question: 'Chi phí cải tạo nhà được tính như thế nào?', answer: 'Chi phí được tính dựa trên diện tích, hạng mục công việc và vật liệu sử dụng. Bạn có thể sử dụng công cụ báo giá online để ước tính chi phí.' },
          { _id: generateUniqueId(), question: 'Thời gian thi công mất bao lâu?', answer: 'Thời gian thi công phụ thuộc vào quy mô công trình. Thông thường từ 1-4 tuần cho các hạng mục cơ bản.' },
          { _id: generateUniqueId(), question: 'Có bảo hành sau thi công không?', answer: 'Có, chúng tôi bảo hành từ 6-12 tháng tùy theo hạng mục công việc.' },
        ],
      };
    case 'BLOG_LIST':
      return {
        title: 'Tất Cả Bài Viết',
        perPage: 6,
      };
    case 'SERVICES':
      return {
        title: 'Dịch Vụ Của Chúng Tôi',
        subtitle: 'Giải pháp cải tạo nhà toàn diện',
        services: [
          { _id: generateUniqueId(), icon: 'ri-paint-brush-line', title: 'Sơn Tường', description: 'Sơn mới, sơn lại tường trong nhà và ngoài trời' },
          { _id: generateUniqueId(), icon: 'ri-layout-grid-line', title: 'Ốp Lát', description: 'Ốp gạch, lát sàn chuyên nghiệp' },
          { _id: generateUniqueId(), icon: 'ri-drop-line', title: 'Chống Thấm', description: 'Xử lý chống thấm, chống dột hiệu quả' },
        ],
      };
    case 'INTERIOR_WIZARD':
      return {
        title: 'Báo Giá Nội Thất',
        subtitle: 'Chọn căn hộ và gói nội thất để nhận báo giá chi tiết ngay lập tức',
        showHeader: true,
        maxWidth: 1200,
        backgroundStyle: 'default',
        headerIcon: 'ri-home-smile-fill',
      };
    case 'INTERIOR_QUOTE':
      return {
        title: 'Báo Giá Nội Thất',
        subtitle: 'Chọn căn hộ và gói nội thất để nhận báo giá chi tiết ngay lập tức',
        showHeader: true,
      };
    case 'INTERIOR_PRICING_TABLE':
      return {
        title: 'Bảng Báo Giá Nội Thất',
        subtitle: 'Chọn gói nội thất phù hợp với nhu cầu và ngân sách của bạn',
        fetchFromApi: true,
        showFeatures: true,
        showCta: true,
        ctaText: 'Liên hệ tư vấn',
        ctaLink: '/noi-that',
        columns: 3,
      };
    default:
      return {};
  }
}
