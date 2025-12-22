/**
 * Notification Template Schemas
 *
 * Zod validation schemas for notification template operations.
 *
 * **Feature: bidding-phase4-communication**
 * **Requirements: 17.1, 17.2, 17.3, 17.4**
 */

import { z } from 'zod';

// ============================================
// NOTIFICATION TEMPLATE TYPE ENUM
// ============================================

/**
 * Notification template types
 * Requirements: 17.1 - Predefined templates for each notification type
 */
export const notificationTemplateTypeEnum = z.enum([
  'BID_RECEIVED',
  'BID_APPROVED',
  'BID_REJECTED',
  'BID_SELECTED',
  'BID_NOT_SELECTED',
  'PROJECT_MATCHED',
  'PROJECT_APPROVED',
  'PROJECT_REJECTED',
  'ESCROW_PENDING',
  'ESCROW_HELD',
  'ESCROW_RELEASED',
  'ESCROW_PARTIAL_RELEASED',
  'ESCROW_REFUNDED',
  'ESCROW_DISPUTED',
  'NEW_MESSAGE',
  'MILESTONE_REQUESTED',
  'MILESTONE_CONFIRMED',
  'MILESTONE_DISPUTED',
  'DISPUTE_RESOLVED',
  'BID_DEADLINE_REMINDER',
  'NO_BIDS_REMINDER',
  'ESCROW_PENDING_REMINDER',
]);

export type NotificationTemplateType = z.infer<typeof notificationTemplateTypeEnum>;

// ============================================
// CREATE TEMPLATE SCHEMA
// ============================================

/**
 * Schema for creating a notification template
 * Requirements: 17.1, 17.2 - Create templates with Vietnamese content
 */
export const CreateNotificationTemplateSchema = z.object({
  type: notificationTemplateTypeEnum,
  
  // Email template
  emailSubject: z.string().min(1, 'Email subject is required').max(200),
  emailBody: z.string().min(1, 'Email body is required').max(10000),
  
  // SMS template
  smsBody: z.string().min(1, 'SMS body is required').max(160, 'SMS must be 160 characters or less'),
  
  // In-app template
  inAppTitle: z.string().min(1, 'In-app title is required').max(200),
  inAppBody: z.string().min(1, 'In-app body is required').max(1000),
  
  // Variables available for this template
  variables: z.array(z.string()).default([]),
});

export type CreateNotificationTemplateInput = z.infer<typeof CreateNotificationTemplateSchema>;

// ============================================
// UPDATE TEMPLATE SCHEMA
// ============================================

/**
 * Schema for updating a notification template
 * Requirements: 17.2, 17.4 - Edit template with version tracking
 */
export const UpdateNotificationTemplateSchema = z.object({
  // Email template
  emailSubject: z.string().min(1).max(200).optional(),
  emailBody: z.string().min(1).max(10000).optional(),
  
  // SMS template
  smsBody: z.string().min(1).max(160, 'SMS must be 160 characters or less').optional(),
  
  // In-app template
  inAppTitle: z.string().min(1).max(200).optional(),
  inAppBody: z.string().min(1).max(1000).optional(),
  
  // Variables available for this template
  variables: z.array(z.string()).optional(),
});

export type UpdateNotificationTemplateInput = z.infer<typeof UpdateNotificationTemplateSchema>;

// ============================================
// TEMPLATE QUERY SCHEMA
// ============================================

/**
 * Schema for querying notification templates
 */
export const NotificationTemplateQuerySchema = z.object({
  type: notificationTemplateTypeEnum.optional(),
});

export type NotificationTemplateQuery = z.infer<typeof NotificationTemplateQuerySchema>;

// ============================================
// RENDER TEMPLATE INPUT SCHEMA
// ============================================

/**
 * Schema for rendering a template with variables
 * Requirements: 17.3 - Replace variables with actual values
 */
export const RenderTemplateInputSchema = z.object({
  type: notificationTemplateTypeEnum,
  variables: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])),
});

export type RenderTemplateInput = z.infer<typeof RenderTemplateInputSchema>;

// ============================================
// TEMPLATE RESPONSE TYPE
// ============================================

/**
 * Full notification template response type
 */
export interface NotificationTemplateResponse {
  id: string;
  type: NotificationTemplateType;
  emailSubject: string;
  emailBody: string;
  smsBody: string;
  inAppTitle: string;
  inAppBody: string;
  variables: string[];
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// RENDERED TEMPLATE TYPE
// ============================================

/**
 * Rendered template with variables replaced
 */
export interface RenderedTemplate {
  emailSubject: string;
  emailBody: string;
  smsBody: string;
  inAppTitle: string;
  inAppBody: string;
}

// ============================================
// DEFAULT TEMPLATES
// ============================================

/**
 * Default notification templates in Vietnamese
 * Requirements: 17.1, 17.2 - Predefined templates with Vietnamese content
 */
export const DEFAULT_NOTIFICATION_TEMPLATES: CreateNotificationTemplateInput[] = [
  {
    type: 'BID_RECEIVED',
    emailSubject: 'Bạn có báo giá mới cho công trình {{projectCode}}',
    emailBody: `
      <p>Xin chào {{homeownerName}},</p>
      <p>Công trình <strong>{{projectTitle}}</strong> ({{projectCode}}) của bạn vừa nhận được một báo giá mới.</p>
      <p><strong>Giá đề xuất:</strong> {{bidPrice}} VNĐ</p>
      <p><strong>Thời gian thi công:</strong> {{bidTimeline}}</p>
      <p>Vui lòng đăng nhập để xem chi tiết và so sánh các báo giá.</p>
    `,
    smsBody: 'Công trình {{projectCode}} có báo giá mới: {{bidPrice}} VNĐ. Đăng nhập để xem chi tiết.',
    inAppTitle: 'Báo giá mới',
    inAppBody: 'Công trình {{projectCode}} vừa nhận được báo giá {{bidPrice}} VNĐ.',
    variables: ['homeownerName', 'projectTitle', 'projectCode', 'bidPrice', 'bidTimeline'],
  },
  {
    type: 'BID_APPROVED',
    emailSubject: 'Báo giá của bạn đã được duyệt - {{projectCode}}',
    emailBody: `
      <p>Xin chào {{contractorName}},</p>
      <p>Báo giá của bạn cho công trình <strong>{{projectTitle}}</strong> ({{projectCode}}) đã được duyệt.</p>
      <p>Chủ nhà có thể xem và chọn báo giá của bạn. Hãy chờ thông báo tiếp theo.</p>
    `,
    smsBody: 'Báo giá {{bidCode}} cho {{projectCode}} đã được duyệt. Chờ chủ nhà chọn.',
    inAppTitle: 'Báo giá được duyệt',
    inAppBody: 'Báo giá {{bidCode}} cho công trình {{projectCode}} đã được duyệt.',
    variables: ['contractorName', 'projectTitle', 'projectCode', 'bidCode'],
  },
  {
    type: 'BID_REJECTED',
    emailSubject: 'Báo giá của bạn không được duyệt - {{projectCode}}',
    emailBody: `
      <p>Xin chào {{contractorName}},</p>
      <p>Rất tiếc, báo giá của bạn cho công trình <strong>{{projectTitle}}</strong> ({{projectCode}}) không được duyệt.</p>
      <p><strong>Lý do:</strong> {{rejectReason}}</p>
      <p>Bạn có thể tạo báo giá mới nếu muốn.</p>
    `,
    smsBody: 'Báo giá {{bidCode}} không được duyệt. Lý do: {{rejectReason}}',
    inAppTitle: 'Báo giá không được duyệt',
    inAppBody: 'Báo giá {{bidCode}} không được duyệt. Lý do: {{rejectReason}}',
    variables: ['contractorName', 'projectTitle', 'projectCode', 'bidCode', 'rejectReason'],
  },
  {
    type: 'BID_SELECTED',
    emailSubject: 'Chúc mừng! Bạn đã được chọn - {{projectCode}}',
    emailBody: `
      <p>Xin chào {{contractorName}},</p>
      <p>Chúc mừng! Báo giá của bạn đã được chủ nhà chọn cho công trình <strong>{{projectTitle}}</strong> ({{projectCode}}).</p>
      <p><strong>Thông tin chủ nhà:</strong></p>
      <ul>
        <li>Tên: {{homeownerName}}</li>
        <li>Điện thoại: {{homeownerPhone}}</li>
        <li>Email: {{homeownerEmail}}</li>
        <li>Địa chỉ: {{projectAddress}}</li>
      </ul>
      <p>Vui lòng liên hệ chủ nhà để bắt đầu công việc.</p>
    `,
    smsBody: 'Chúc mừng! Bạn được chọn cho {{projectCode}}. Liên hệ: {{homeownerPhone}}',
    inAppTitle: 'Bạn đã được chọn!',
    inAppBody: 'Chúc mừng! Bạn được chọn cho công trình {{projectCode}}.',
    variables: ['contractorName', 'projectTitle', 'projectCode', 'homeownerName', 'homeownerPhone', 'homeownerEmail', 'projectAddress'],
  },
  {
    type: 'BID_NOT_SELECTED',
    emailSubject: 'Thông báo kết quả - {{projectCode}}',
    emailBody: `
      <p>Xin chào {{contractorName}},</p>
      <p>Cảm ơn bạn đã gửi báo giá cho công trình <strong>{{projectTitle}}</strong> ({{projectCode}}).</p>
      <p>Rất tiếc, chủ nhà đã chọn nhà thầu khác cho công trình này.</p>
      <p>Hãy tiếp tục tìm kiếm các công trình phù hợp khác trên hệ thống.</p>
    `,
    smsBody: 'Báo giá {{bidCode}} cho {{projectCode}} không được chọn. Cảm ơn bạn đã tham gia.',
    inAppTitle: 'Không được chọn',
    inAppBody: 'Báo giá {{bidCode}} cho công trình {{projectCode}} không được chọn.',
    variables: ['contractorName', 'projectTitle', 'projectCode', 'bidCode'],
  },
  {
    type: 'PROJECT_MATCHED',
    emailSubject: 'Công trình {{projectCode}} đã được ghép nối thành công',
    emailBody: `
      <p>Xin chào {{userName}},</p>
      <p>Công trình <strong>{{projectTitle}}</strong> ({{projectCode}}) đã được ghép nối thành công.</p>
      <p><strong>Giá thỏa thuận:</strong> {{bidPrice}} VNĐ</p>
      <p><strong>Tiền đặt cọc:</strong> {{escrowAmount}} VNĐ</p>
      <p>Vui lòng hoàn tất đặt cọc để bắt đầu công việc.</p>
    `,
    smsBody: '{{projectCode}} đã match. Đặt cọc: {{escrowAmount}} VNĐ. Đăng nhập để xem chi tiết.',
    inAppTitle: 'Ghép nối thành công',
    inAppBody: 'Công trình {{projectCode}} đã được ghép nối. Đặt cọc: {{escrowAmount}} VNĐ.',
    variables: ['userName', 'projectTitle', 'projectCode', 'bidPrice', 'escrowAmount'],
  },
  {
    type: 'PROJECT_APPROVED',
    emailSubject: 'Công trình {{projectCode}} đã được duyệt',
    emailBody: `
      <p>Xin chào {{homeownerName}},</p>
      <p>Công trình <strong>{{projectTitle}}</strong> ({{projectCode}}) của bạn đã được duyệt và đang mở nhận báo giá.</p>
      <p><strong>Hạn nhận báo giá:</strong> {{bidDeadline}}</p>
      <p>Các nhà thầu sẽ bắt đầu gửi báo giá cho bạn.</p>
    `,
    smsBody: 'Công trình {{projectCode}} đã được duyệt. Hạn nhận báo giá: {{bidDeadline}}.',
    inAppTitle: 'Công trình được duyệt',
    inAppBody: 'Công trình {{projectCode}} đã được duyệt và đang mở nhận báo giá.',
    variables: ['homeownerName', 'projectTitle', 'projectCode', 'bidDeadline'],
  },
  {
    type: 'PROJECT_REJECTED',
    emailSubject: 'Công trình {{projectCode}} không được duyệt',
    emailBody: `
      <p>Xin chào {{homeownerName}},</p>
      <p>Rất tiếc, công trình <strong>{{projectTitle}}</strong> ({{projectCode}}) của bạn không được duyệt.</p>
      <p><strong>Lý do:</strong> {{rejectReason}}</p>
      <p>Bạn có thể chỉnh sửa và gửi lại công trình.</p>
    `,
    smsBody: 'Công trình {{projectCode}} không được duyệt. Lý do: {{rejectReason}}',
    inAppTitle: 'Công trình không được duyệt',
    inAppBody: 'Công trình {{projectCode}} không được duyệt. Lý do: {{rejectReason}}',
    variables: ['homeownerName', 'projectTitle', 'projectCode', 'rejectReason'],
  },
  {
    type: 'ESCROW_HELD',
    emailSubject: 'Đặt cọc đã được xác nhận - {{projectCode}}',
    emailBody: `
      <p>Xin chào {{userName}},</p>
      <p>Tiền đặt cọc cho công trình <strong>{{projectTitle}}</strong> ({{projectCode}}) đã được xác nhận.</p>
      <p><strong>Số tiền:</strong> {{escrowAmount}} VNĐ</p>
      <p><strong>Mã escrow:</strong> {{escrowCode}}</p>
      <p>Công việc có thể bắt đầu ngay bây giờ.</p>
    `,
    smsBody: 'Đặt cọc {{escrowCode}} đã xác nhận: {{escrowAmount}} VNĐ. Công việc có thể bắt đầu.',
    inAppTitle: 'Đặt cọc xác nhận',
    inAppBody: 'Đặt cọc {{escrowCode}} đã được xác nhận: {{escrowAmount}} VNĐ.',
    variables: ['userName', 'projectTitle', 'projectCode', 'escrowAmount', 'escrowCode'],
  },
  {
    type: 'ESCROW_RELEASED',
    emailSubject: 'Tiền đặt cọc đã được giải phóng - {{projectCode}}',
    emailBody: `
      <p>Xin chào {{userName}},</p>
      <p>Tiền đặt cọc cho công trình <strong>{{projectTitle}}</strong> ({{projectCode}}) đã được giải phóng.</p>
      <p><strong>Số tiền:</strong> {{releasedAmount}} VNĐ</p>
      <p>Cảm ơn bạn đã sử dụng dịch vụ của chúng tôi.</p>
    `,
    smsBody: 'Escrow {{escrowCode}} đã giải phóng: {{releasedAmount}} VNĐ.',
    inAppTitle: 'Escrow giải phóng',
    inAppBody: 'Escrow {{escrowCode}} đã được giải phóng: {{releasedAmount}} VNĐ.',
    variables: ['userName', 'projectTitle', 'projectCode', 'releasedAmount', 'escrowCode'],
  },
  {
    type: 'NEW_MESSAGE',
    emailSubject: 'Tin nhắn mới từ {{senderName}} - {{projectCode}}',
    emailBody: `
      <p>Xin chào {{recipientName}},</p>
      <p>Bạn có tin nhắn mới từ <strong>{{senderName}}</strong> trong cuộc hội thoại về công trình {{projectCode}}.</p>
      <p><strong>Nội dung:</strong> {{messagePreview}}</p>
      <p>Đăng nhập để xem và trả lời.</p>
    `,
    smsBody: 'Tin nhắn mới từ {{senderName}} về {{projectCode}}. Đăng nhập để xem.',
    inAppTitle: 'Tin nhắn mới',
    inAppBody: '{{senderName}}: {{messagePreview}}',
    variables: ['recipientName', 'senderName', 'projectCode', 'messagePreview'],
  },
  {
    type: 'BID_DEADLINE_REMINDER',
    emailSubject: 'Nhắc nhở: Hạn nhận báo giá sắp hết - {{projectCode}}',
    emailBody: `
      <p>Xin chào {{homeownerName}},</p>
      <p>Công trình <strong>{{projectTitle}}</strong> ({{projectCode}}) sẽ hết hạn nhận báo giá trong 24 giờ nữa.</p>
      <p><strong>Số báo giá hiện tại:</strong> {{bidCount}}</p>
      <p>Hãy xem xét các báo giá và chọn nhà thầu phù hợp.</p>
    `,
    smsBody: '{{projectCode}} hết hạn nhận báo giá trong 24h. Có {{bidCount}} báo giá.',
    inAppTitle: 'Sắp hết hạn nhận báo giá',
    inAppBody: 'Công trình {{projectCode}} sẽ hết hạn nhận báo giá trong 24 giờ.',
    variables: ['homeownerName', 'projectTitle', 'projectCode', 'bidCount'],
  },
  {
    type: 'NO_BIDS_REMINDER',
    emailSubject: 'Công trình {{projectCode}} chưa có báo giá',
    emailBody: `
      <p>Xin chào {{homeownerName}},</p>
      <p>Công trình <strong>{{projectTitle}}</strong> ({{projectCode}}) đã đăng được 3 ngày nhưng chưa nhận được báo giá nào.</p>
      <p><strong>Gợi ý:</strong></p>
      <ul>
        <li>Kiểm tra lại mô tả công trình</li>
        <li>Điều chỉnh ngân sách nếu cần</li>
        <li>Thêm hình ảnh chi tiết</li>
      </ul>
    `,
    smsBody: '{{projectCode}} chưa có báo giá sau 3 ngày. Đăng nhập để xem gợi ý.',
    inAppTitle: 'Chưa có báo giá',
    inAppBody: 'Công trình {{projectCode}} chưa nhận được báo giá nào sau 3 ngày.',
    variables: ['homeownerName', 'projectTitle', 'projectCode'],
  },
  {
    type: 'ESCROW_PENDING_REMINDER',
    emailSubject: 'Nhắc nhở: Hoàn tất đặt cọc - {{projectCode}}',
    emailBody: `
      <p>Xin chào {{homeownerName}},</p>
      <p>Công trình <strong>{{projectTitle}}</strong> ({{projectCode}}) đang chờ đặt cọc.</p>
      <p><strong>Số tiền cần đặt cọc:</strong> {{escrowAmount}} VNĐ</p>
      <p>Vui lòng hoàn tất đặt cọc để nhà thầu có thể bắt đầu công việc.</p>
    `,
    smsBody: '{{projectCode}} chờ đặt cọc {{escrowAmount}} VNĐ. Hoàn tất để bắt đầu.',
    inAppTitle: 'Chờ đặt cọc',
    inAppBody: 'Công trình {{projectCode}} đang chờ đặt cọc {{escrowAmount}} VNĐ.',
    variables: ['homeownerName', 'projectTitle', 'projectCode', 'escrowAmount'],
  },
];
