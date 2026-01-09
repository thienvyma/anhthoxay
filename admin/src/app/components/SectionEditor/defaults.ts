import { tokens } from '@app/shared';
import type { SectionKind } from './types';
import { generateUniqueId } from './utils';

export function getDefaultData(sectionKind: SectionKind): Record<string, unknown> {
  switch (sectionKind) {
    case 'HERO':
      return {
        title: 'Nội Thất Nhanh - Thiết Kế Nội Thất Chuyên Nghiệp',
        subtitle: 'Biến ngôi nhà của bạn thành không gian sống mơ ước với dịch vụ nội thất uy tín',
        imageUrl: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=1200&q=80',
        ctaText: 'Nhận Báo Giá Miễn Phí',
        ctaLink: '/bao-gia',
      };
    case 'HERO_SIMPLE':
      return {
        title: 'Liên Hệ',
        subtitle: 'Chúng tôi luôn sẵn sàng tư vấn',
        description: 'Hãy liên hệ với chúng tôi để được tư vấn miễn phí về dự án nội thất của bạn',
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
        email: 'contact@noithatnhanh.vn',
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
        subtitle: 'Định hướng phát triển của Nội Thất Nhanh',
        mission: { icon: 'ri-target-line', title: 'Sứ Mệnh', content: 'Mang đến dịch vụ thiết kế nội thất chất lượng cao với giá cả hợp lý.' },
        vision: { icon: 'ri-eye-line', title: 'Tầm Nhìn', content: 'Trở thành đơn vị thiết kế nội thất uy tín hàng đầu tại Việt Nam.' },
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
        email: 'contact@noithatnhanh.vn',
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
        subtitle: 'Tính toán chi phí nội thất nhanh chóng và chính xác',
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
        title: 'Nội Thất Nhanh - Đối Tác Tin Cậy',
        description: 'Với hơn 10 năm kinh nghiệm trong lĩnh vực thiết kế nội thất, chúng tôi tự hào mang đến dịch vụ chất lượng cao với giá cả hợp lý.',
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
    case 'FEATURED_SLIDESHOW':
      return {
        title: 'Dự Án Nổi Bật',
        subtitle: 'Những công trình tiêu biểu của chúng tôi',
        autoPlay: true,
        interval: 5000,
        showDots: true,
        showArrows: true,
      };
    case 'MEDIA_GALLERY':
      return {
        title: 'Thư Viện Hình Ảnh',
        subtitle: 'Khám phá các dự án đã hoàn thành',
        columns: 3,
        gap: 16,
        showLightbox: true,
        perPage: 12,
      };
    case 'VIDEO_SHOWCASE':
      return {
        title: 'Video Giới Thiệu',
        subtitle: 'Xem video về dịch vụ của chúng tôi',
        videoUrl: '',
        youtubeId: '',
        autoPlay: false,
        muted: true,
        loop: true,
        showControls: true,
        aspectRatio: '16:9',
      };
    case 'BLOG_LIST':
      return {
        title: 'Tất Cả Bài Viết',
        subtitle: 'Kiến thức và kinh nghiệm về nội thất',
        perPage: 9,
        showSearch: true,
        showCategories: true,
      };
    case 'MARKETPLACE':
      return {
        title: 'Công trình đang tìm nhà thầu',
        subtitle: 'Khám phá các dự án xây dựng đang chờ báo giá từ nhà thầu uy tín',
        showStats: true,
        limit: 6,
        ctaText: 'Xem tất cả công trình',
        ctaLink: '/portal/marketplace',
        registerText: 'Đăng ký làm nhà thầu',
        registerLink: '/portal/auth/register?type=contractor',
      };
    case 'FURNITURE_QUOTE':
      return {
        title: 'Báo Giá Nội Thất',
        subtitle: 'Chọn căn hộ và nhận báo giá nội thất phù hợp',
        formFields: [
          { _id: generateUniqueId(), name: 'name', type: 'text', label: 'Họ và tên', required: true, placeholder: 'Nhập họ và tên' },
          { _id: generateUniqueId(), name: 'phone', type: 'phone', label: 'Số điện thoại', required: true, placeholder: 'Nhập số điện thoại' },
          { _id: generateUniqueId(), name: 'email', type: 'email', label: 'Email', required: false, placeholder: 'Nhập email (không bắt buộc)' },
        ],
        buttonText: 'Tiếp tục',
        successMessage: 'Cảm ơn bạn! Chúng tôi sẽ liên hệ sớm.',
      };
    case 'LEGAL_CONTENT':
      return {
        documentType: 'privacy_policy',
        companyName: 'Nội Thất Nhanh',
        companyAddress: '123 Đường ABC, Quận 1, TP. Hồ Chí Minh',
        companyEmail: 'contact@noithatnhanh.vn',
        companyPhone: '+84 123 456 789',
        effectiveDate: new Date().toISOString().split('T')[0],
        lastUpdated: new Date().toISOString().split('T')[0],
        // Privacy Policy sections
        privacyPolicy: {
          introduction: 'Chúng tôi cam kết bảo vệ quyền riêng tư của bạn. Chính sách này giải thích cách chúng tôi thu thập, sử dụng và bảo vệ thông tin cá nhân của bạn.',
          dataCollection: [
            { _id: generateUniqueId(), title: 'Thông tin cá nhân', description: 'Họ tên, số điện thoại, email, địa chỉ khi bạn đăng ký tài khoản hoặc gửi yêu cầu báo giá.' },
            { _id: generateUniqueId(), title: 'Thông tin dự án', description: 'Chi tiết về công trình, diện tích, yêu cầu thiết kế và ngân sách dự kiến.' },
            { _id: generateUniqueId(), title: 'Thông tin kỹ thuật', description: 'Địa chỉ IP, loại trình duyệt, thiết bị sử dụng và thời gian truy cập.' },
          ],
          dataUsage: [
            { _id: generateUniqueId(), title: 'Cung cấp dịch vụ', description: 'Xử lý yêu cầu báo giá, kết nối với nhà thầu phù hợp và hỗ trợ khách hàng.' },
            { _id: generateUniqueId(), title: 'Cải thiện trải nghiệm', description: 'Phân tích hành vi người dùng để nâng cao chất lượng dịch vụ và giao diện.' },
            { _id: generateUniqueId(), title: 'Liên lạc', description: 'Gửi thông báo về dự án, khuyến mãi và cập nhật dịch vụ (có thể hủy đăng ký).' },
          ],
          dataProtection: 'Chúng tôi áp dụng các biện pháp bảo mật tiêu chuẩn ngành bao gồm mã hóa SSL, tường lửa và kiểm soát truy cập để bảo vệ dữ liệu của bạn.',
          dataSharing: 'Chúng tôi không bán hoặc cho thuê thông tin cá nhân. Dữ liệu chỉ được chia sẻ với nhà thầu khi bạn đồng ý kết nối, hoặc khi pháp luật yêu cầu.',
          userRights: [
            { _id: generateUniqueId(), title: 'Quyền truy cập', description: 'Bạn có quyền yêu cầu xem thông tin cá nhân chúng tôi lưu trữ về bạn.' },
            { _id: generateUniqueId(), title: 'Quyền chỉnh sửa', description: 'Bạn có thể cập nhật hoặc sửa đổi thông tin cá nhân bất cứ lúc nào.' },
            { _id: generateUniqueId(), title: 'Quyền xóa', description: 'Bạn có thể yêu cầu xóa tài khoản và dữ liệu liên quan.' },
            { _id: generateUniqueId(), title: 'Quyền từ chối', description: 'Bạn có thể từ chối nhận email marketing bất cứ lúc nào.' },
          ],
          cookies: 'Chúng tôi sử dụng cookies để cải thiện trải nghiệm duyệt web. Bạn có thể tắt cookies trong cài đặt trình duyệt, nhưng một số tính năng có thể bị ảnh hưởng.',
        },
        // Terms of Use sections
        termsOfUse: {
          introduction: 'Bằng việc sử dụng website và dịch vụ của chúng tôi, bạn đồng ý tuân thủ các điều khoản sau đây.',
          serviceDescription: 'Nội Thất Nhanh là nền tảng kết nối chủ nhà với nhà thầu nội thất uy tín. Chúng tôi cung cấp công cụ báo giá, quản lý dự án và hệ thống đánh giá.',
          userObligations: [
            { _id: generateUniqueId(), title: 'Thông tin chính xác', description: 'Cung cấp thông tin trung thực khi đăng ký và sử dụng dịch vụ.' },
            { _id: generateUniqueId(), title: 'Bảo mật tài khoản', description: 'Giữ bí mật thông tin đăng nhập và chịu trách nhiệm về hoạt động tài khoản.' },
            { _id: generateUniqueId(), title: 'Sử dụng hợp pháp', description: 'Không sử dụng dịch vụ cho mục đích bất hợp pháp hoặc gây hại.' },
            { _id: generateUniqueId(), title: 'Tôn trọng người khác', description: 'Không đăng nội dung xúc phạm, spam hoặc quấy rối người dùng khác.' },
          ],
          intellectualProperty: 'Tất cả nội dung trên website bao gồm logo, thiết kế, văn bản và hình ảnh thuộc sở hữu của Nội Thất Nhanh hoặc đối tác được cấp phép.',
          liability: [
            { _id: generateUniqueId(), title: 'Giới hạn trách nhiệm', description: 'Chúng tôi không chịu trách nhiệm về chất lượng công việc của nhà thầu. Mọi thỏa thuận là giữa chủ nhà và nhà thầu.' },
            { _id: generateUniqueId(), title: 'Tranh chấp', description: 'Chúng tôi hỗ trợ giải quyết tranh chấp nhưng quyết định cuối cùng thuộc về các bên liên quan.' },
            { _id: generateUniqueId(), title: 'Gián đoạn dịch vụ', description: 'Chúng tôi không đảm bảo dịch vụ hoạt động liên tục 100% và không chịu trách nhiệm về thiệt hại do gián đoạn.' },
          ],
          paymentTerms: 'Thanh toán được thực hiện trực tiếp giữa chủ nhà và nhà thầu. Nội Thất Nhanh có thể thu phí dịch vụ theo quy định công khai trên website.',
          termination: 'Chúng tôi có quyền đình chỉ hoặc chấm dứt tài khoản vi phạm điều khoản mà không cần thông báo trước.',
          disputeResolution: 'Mọi tranh chấp sẽ được giải quyết theo pháp luật Việt Nam. Tòa án có thẩm quyền là Tòa án nhân dân TP. Hồ Chí Minh.',
          changes: 'Chúng tôi có quyền cập nhật điều khoản bất cứ lúc nào. Thay đổi sẽ có hiệu lực ngay khi đăng tải trên website.',
        },
        showTableOfContents: true,
        layout: 'tabs',
      };
    default:
      return {};
  }
}
