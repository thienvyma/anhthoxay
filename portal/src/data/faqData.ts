/**
 * FAQ Data Structure
 *
 * Categories: Homeowner, Contractor, Payment, General
 *
 * **Feature: bidding-phase6-portal**
 * **Requirements: 24.2**
 */

export type FAQCategory = 'homeowner' | 'contractor' | 'payment' | 'general';

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: FAQCategory;
  keywords: string[];
}

export interface FAQCategoryInfo {
  id: FAQCategory;
  name: string;
  icon: string;
  description: string;
}

/**
 * FAQ Categories with metadata
 */
export const FAQ_CATEGORIES: FAQCategoryInfo[] = [
  {
    id: 'homeowner',
    name: 'Chủ nhà',
    icon: 'ri-home-4-line',
    description: 'Câu hỏi dành cho chủ nhà về đăng dự án và chọn nhà thầu',
  },
  {
    id: 'contractor',
    name: 'Nhà thầu',
    icon: 'ri-tools-line',
    description: 'Câu hỏi dành cho nhà thầu về đấu giá và hồ sơ',
  },
  {
    id: 'payment',
    name: 'Thanh toán',
    icon: 'ri-wallet-3-line',
    description: 'Câu hỏi về đặt cọc, phí dịch vụ và thanh toán',
  },
  {
    id: 'general',
    name: 'Chung',
    icon: 'ri-question-line',
    description: 'Câu hỏi chung về nền tảng và tài khoản',
  },
];

/**
 * FAQ Items organized by category
 */
export const FAQ_ITEMS: FAQItem[] = [
  // ===== HOMEOWNER FAQs =====
  {
    id: 'ho-1',
    category: 'homeowner',
    question: 'Làm thế nào để đăng dự án mới?',
    answer:
      'Để đăng dự án mới, bạn cần đăng nhập vào tài khoản chủ nhà, sau đó vào mục "Dự án" và nhấn nút "Tạo dự án mới". Điền đầy đủ thông tin về công trình bao gồm: tiêu đề, mô tả, danh mục, khu vực, diện tích, ngân sách dự kiến và tải lên hình ảnh. Sau khi hoàn tất, dự án sẽ được gửi đi để admin duyệt.',
    keywords: ['đăng dự án', 'tạo dự án', 'công trình mới', 'đăng công trình'],
  },
  {
    id: 'ho-2',
    category: 'homeowner',
    question: 'Dự án của tôi mất bao lâu để được duyệt?',
    answer:
      'Thông thường, dự án sẽ được duyệt trong vòng 24-48 giờ làm việc. Bạn sẽ nhận được thông báo qua email và trong ứng dụng khi dự án được duyệt hoặc cần chỉnh sửa. Nếu dự án bị từ chối, bạn có thể chỉnh sửa và gửi lại.',
    keywords: ['duyệt dự án', 'thời gian duyệt', 'chờ duyệt', 'xét duyệt'],
  },
  {
    id: 'ho-3',
    category: 'homeowner',
    question: 'Làm sao để chọn nhà thầu phù hợp?',
    answer:
      'Khi dự án của bạn nhận được các đề xuất (bid), bạn có thể xem chi tiết từng đề xuất bao gồm: giá, thời gian thực hiện, mô tả phương án và đánh giá của nhà thầu. Sử dụng tính năng "So sánh" để đặt các đề xuất cạnh nhau. Lưu ý rằng thông tin nhà thầu sẽ được ẩn danh cho đến khi bạn chọn một đề xuất.',
    keywords: ['chọn nhà thầu', 'so sánh bid', 'đề xuất', 'lựa chọn'],
  },
  {
    id: 'ho-4',
    category: 'homeowner',
    question: 'Tôi có thể hủy dự án sau khi đã đăng không?',
    answer:
      'Có, bạn có thể hủy dự án ở các trạng thái: Nháp, Chờ duyệt, hoặc Đang mở. Tuy nhiên, nếu dự án đã được ghép nối với nhà thầu (MATCHED), việc hủy sẽ ảnh hưởng đến tiền đặt cọc. Vui lòng liên hệ hỗ trợ nếu cần hủy dự án đã ghép nối.',
    keywords: ['hủy dự án', 'xóa dự án', 'cancel', 'hủy bỏ'],
  },
  {
    id: 'ho-5',
    category: 'homeowner',
    question: 'Thông tin của tôi có được bảo mật không?',
    answer:
      'Có, thông tin cá nhân của bạn (địa chỉ, số điện thoại, email) được bảo mật hoàn toàn. Nhà thầu chỉ có thể xem thông tin liên hệ của bạn sau khi bạn chọn đề xuất của họ và hoàn tất đặt cọc. Trước đó, họ chỉ thấy thông tin chung về dự án.',
    keywords: ['bảo mật', 'thông tin cá nhân', 'riêng tư', 'privacy'],
  },

  // ===== CONTRACTOR FAQs =====
  {
    id: 'co-1',
    category: 'contractor',
    question: 'Làm thế nào để trở thành nhà thầu trên nền tảng?',
    answer:
      'Để trở thành nhà thầu, bạn cần: 1) Đăng ký tài khoản với loại "Nhà thầu", 2) Hoàn thiện hồ sơ năng lực bao gồm mô tả, kinh nghiệm, chuyên môn, 3) Tải lên CMND/CCCD và giấy phép kinh doanh (nếu có), 4) Gửi hồ sơ xác minh. Admin sẽ xét duyệt trong 2-3 ngày làm việc.',
    keywords: ['đăng ký nhà thầu', 'trở thành nhà thầu', 'xác minh', 'verification'],
  },
  {
    id: 'co-2',
    category: 'contractor',
    question: 'Tại sao tôi cần xác minh hồ sơ?',
    answer:
      'Xác minh hồ sơ giúp tạo niềm tin với chủ nhà và đảm bảo chất lượng dịch vụ trên nền tảng. Chỉ nhà thầu đã xác minh mới có thể gửi đề xuất (bid) cho các dự án. Điều này cũng giúp bạn nổi bật hơn trong danh sách nhà thầu.',
    keywords: ['xác minh', 'verified', 'hồ sơ', 'tại sao xác minh'],
  },
  {
    id: 'co-3',
    category: 'contractor',
    question: 'Làm sao để gửi đề xuất (bid) cho dự án?',
    answer:
      'Sau khi hồ sơ được xác minh, bạn có thể: 1) Vào mục "Marketplace" để xem các dự án đang mở, 2) Chọn dự án phù hợp với chuyên môn, 3) Nhấn "Gửi đề xuất" và điền thông tin: giá, thời gian, mô tả phương án, 4) Đính kèm tài liệu nếu cần. Đề xuất sẽ được admin duyệt trước khi hiển thị cho chủ nhà.',
    keywords: ['gửi bid', 'đề xuất', 'đấu giá', 'tham gia dự án'],
  },
  {
    id: 'co-4',
    category: 'contractor',
    question: 'Tôi có thể chỉnh sửa hoặc rút đề xuất không?',
    answer:
      'Có, bạn có thể chỉnh sửa hoặc rút đề xuất khi nó đang ở trạng thái "Chờ duyệt" hoặc "Đã duyệt". Tuy nhiên, sau khi chủ nhà đã chọn đề xuất của bạn, bạn không thể rút lại. Việc rút đề xuất thường xuyên có thể ảnh hưởng đến đánh giá của bạn.',
    keywords: ['chỉnh sửa bid', 'rút bid', 'hủy đề xuất', 'withdraw'],
  },
  {
    id: 'co-5',
    category: 'contractor',
    question: 'Làm sao để tăng cơ hội được chọn?',
    answer:
      'Để tăng cơ hội được chọn: 1) Hoàn thiện hồ sơ với portfolio ấn tượng, 2) Viết đề xuất chi tiết, rõ ràng, 3) Đưa ra giá cạnh tranh và hợp lý, 4) Phản hồi nhanh khi được liên hệ, 5) Duy trì đánh giá tốt từ các dự án trước. Nhà thầu có badge "Nổi bật" sẽ được ưu tiên hiển thị.',
    keywords: ['tăng cơ hội', 'được chọn', 'tips', 'mẹo'],
  },

  // ===== PAYMENT FAQs =====
  {
    id: 'pa-1',
    category: 'payment',
    question: 'Tiền đặt cọc (escrow) hoạt động như thế nào?',
    answer:
      'Khi chủ nhà chọn một đề xuất, họ cần đặt cọc một khoản tiền (thường là 10% giá trị đề xuất). Tiền này được giữ bởi nền tảng và sẽ được giải phóng cho nhà thầu theo tiến độ công việc. Nếu có tranh chấp, admin sẽ xem xét và quyết định.',
    keywords: ['đặt cọc', 'escrow', 'tiền cọc', 'giữ tiền'],
  },
  {
    id: 'pa-2',
    category: 'payment',
    question: 'Phí dịch vụ được tính như thế nào?',
    answer:
      'Nhà thầu sẽ trả phí dịch vụ khi thắng thầu, thường là 5% giá trị đề xuất. Phí này được tính sau khi chủ nhà chọn đề xuất của bạn. Chủ nhà không phải trả phí dịch vụ. Chi tiết phí có thể xem trong phần Cài đặt > Phí dịch vụ.',
    keywords: ['phí dịch vụ', 'win fee', 'phí thắng thầu', 'commission'],
  },
  {
    id: 'pa-3',
    category: 'payment',
    question: 'Khi nào tiền đặt cọc được giải phóng?',
    answer:
      'Tiền đặt cọc được giải phóng theo các mốc tiến độ (milestone): 1) 50% khi hoàn thành nửa công việc và được chủ nhà xác nhận, 2) 50% còn lại khi hoàn thành toàn bộ và dự án được đánh dấu hoàn tất. Admin sẽ xử lý giải phóng trong 1-2 ngày làm việc.',
    keywords: ['giải phóng tiền', 'release escrow', 'milestone', 'tiến độ'],
  },
  {
    id: 'pa-4',
    category: 'payment',
    question: 'Tôi có thể được hoàn tiền đặt cọc không?',
    answer:
      'Chủ nhà có thể được hoàn tiền đặt cọc trong các trường hợp: 1) Hủy dự án trước khi nhà thầu bắt đầu công việc, 2) Nhà thầu vi phạm hợp đồng, 3) Tranh chấp được giải quyết có lợi cho chủ nhà. Quy trình hoàn tiền mất 3-5 ngày làm việc.',
    keywords: ['hoàn tiền', 'refund', 'trả lại tiền', 'hủy đặt cọc'],
  },
  {
    id: 'pa-5',
    category: 'payment',
    question: 'Làm sao để xử lý tranh chấp thanh toán?',
    answer:
      'Nếu có tranh chấp về thanh toán: 1) Liên hệ với đối tác qua chat để thương lượng, 2) Nếu không giải quyết được, tạo yêu cầu tranh chấp trong phần "Chi tiết dự án", 3) Admin sẽ xem xét bằng chứng từ cả hai bên, 4) Quyết định cuối cùng sẽ được thông báo trong 5-7 ngày.',
    keywords: ['tranh chấp', 'dispute', 'khiếu nại', 'giải quyết'],
  },

  // ===== GENERAL FAQs =====
  {
    id: 'ge-1',
    category: 'general',
    question: 'Anh Thợ Xây là gì?',
    answer:
      'Anh Thợ Xây là nền tảng kết nối chủ nhà với nhà thầu uy tín. Chúng tôi giúp chủ nhà tìm được nhà thầu phù hợp thông qua hệ thống đấu giá minh bạch, và giúp nhà thầu tiếp cận nhiều khách hàng tiềm năng. Nền tảng đảm bảo an toàn giao dịch qua hệ thống đặt cọc.',
    keywords: ['anh thợ xây', 'giới thiệu', 'về chúng tôi', 'nền tảng'],
  },
  {
    id: 'ge-2',
    category: 'general',
    question: 'Làm sao để đổi mật khẩu?',
    answer:
      'Để đổi mật khẩu: 1) Vào phần "Cài đặt" từ menu người dùng, 2) Chọn tab "Bảo mật", 3) Nhập mật khẩu hiện tại và mật khẩu mới, 4) Nhấn "Lưu thay đổi". Lưu ý: Sau khi đổi mật khẩu, bạn sẽ cần đăng nhập lại trên tất cả thiết bị.',
    keywords: ['đổi mật khẩu', 'password', 'bảo mật', 'change password'],
  },
  {
    id: 'ge-3',
    category: 'general',
    question: 'Tôi quên mật khẩu, phải làm sao?',
    answer:
      'Nếu quên mật khẩu: 1) Vào trang đăng nhập, 2) Nhấn "Quên mật khẩu", 3) Nhập email đã đăng ký, 4) Kiểm tra email và nhấn link đặt lại mật khẩu, 5) Tạo mật khẩu mới. Link có hiệu lực trong 24 giờ.',
    keywords: ['quên mật khẩu', 'forgot password', 'reset password', 'khôi phục'],
  },
  {
    id: 'ge-4',
    category: 'general',
    question: 'Làm sao để liên hệ hỗ trợ?',
    answer:
      'Bạn có thể liên hệ hỗ trợ qua: 1) Form liên hệ trong phần Trợ giúp, 2) Email: support@anhthoxay.vn, 3) Hotline: 1900-xxxx (8h-22h hàng ngày). Chúng tôi cam kết phản hồi trong vòng 24 giờ làm việc.',
    keywords: ['liên hệ', 'hỗ trợ', 'support', 'contact', 'hotline'],
  },
  {
    id: 'ge-5',
    category: 'general',
    question: 'Tôi có thể xóa tài khoản không?',
    answer:
      'Có, bạn có thể yêu cầu xóa tài khoản bằng cách liên hệ hỗ trợ. Lưu ý: 1) Tất cả dự án đang hoạt động phải được hoàn tất hoặc hủy, 2) Không còn khoản thanh toán chưa giải quyết, 3) Dữ liệu sẽ được xóa vĩnh viễn sau 30 ngày.',
    keywords: ['xóa tài khoản', 'delete account', 'hủy tài khoản', 'deactivate'],
  },
  {
    id: 'ge-6',
    category: 'general',
    question: 'Ứng dụng có hỗ trợ mobile không?',
    answer:
      'Hiện tại, Anh Thợ Xây hoạt động tốt trên trình duyệt mobile với giao diện responsive. Chúng tôi đang phát triển ứng dụng mobile native cho iOS và Android, dự kiến ra mắt trong thời gian tới. Đăng ký nhận thông báo để cập nhật!',
    keywords: ['mobile', 'ứng dụng', 'app', 'điện thoại', 'ios', 'android'],
  },
];

/**
 * Get FAQs by category
 */
export function getFAQsByCategory(category: FAQCategory): FAQItem[] {
  return FAQ_ITEMS.filter((item) => item.category === category);
}

/**
 * Search FAQs by query string
 * Searches in question, answer, and keywords
 */
export function searchFAQs(query: string): FAQItem[] {
  if (!query.trim()) return [];

  const normalizedQuery = query.toLowerCase().trim();
  const queryWords = normalizedQuery.split(/\s+/);

  return FAQ_ITEMS.filter((item) => {
    const searchText = [
      item.question.toLowerCase(),
      item.answer.toLowerCase(),
      ...item.keywords.map((k) => k.toLowerCase()),
    ].join(' ');

    // Match if all query words are found
    return queryWords.every((word) => searchText.includes(word));
  }).sort((a, b) => {
    // Prioritize matches in question over answer
    const aQuestionMatch = queryWords.some((word) =>
      a.question.toLowerCase().includes(word)
    );
    const bQuestionMatch = queryWords.some((word) =>
      b.question.toLowerCase().includes(word)
    );

    if (aQuestionMatch && !bQuestionMatch) return -1;
    if (!aQuestionMatch && bQuestionMatch) return 1;
    return 0;
  });
}

/**
 * Get category info by ID
 */
export function getCategoryInfo(categoryId: FAQCategory): FAQCategoryInfo | undefined {
  return FAQ_CATEGORIES.find((cat) => cat.id === categoryId);
}

export default FAQ_ITEMS;
