/**
 * Notification Service
 *
 * Business logic for notification management including creation,
 * listing, and marking as read.
 *
 * **Feature: bidding-phase3-matching**
 * **Requirements: 14.1-14.5**
 */

import { PrismaClient } from '@prisma/client';
import type {
  NotificationType,
  CreateNotificationInput,
  NotificationQuery,
} from '../schemas/notification.schema';

// ============================================
// TYPES
// ============================================

export interface NotificationData {
  projectId?: string;
  projectCode?: string;
  bidId?: string;
  bidCode?: string;
  escrowId?: string;
  escrowCode?: string;
  feeId?: string;
  feeCode?: string;
  amount?: number;
  reviewLink?: string; // Direct link to review form
}

export interface NotificationWithUser {
  id: string;
  userId: string;
  type: string;
  title: string;
  content: string;
  data: NotificationData | null;
  isRead: boolean;
  readAt: Date | null;
  createdAt: Date;
}

export interface NotificationListResult {
  data: NotificationWithUser[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    unreadCount: number;
  };
}

// ============================================
// NOTIFICATION TEMPLATES
// ============================================

interface NotificationTemplate {
  title: string;
  content: string;
}

type TemplateGenerator = (data: NotificationData) => NotificationTemplate;

const NOTIFICATION_TEMPLATES: Record<NotificationType, TemplateGenerator> = {
  // Bid notifications
  BID_RECEIVED: (data) => ({
    title: 'Bạn nhận được bid mới',
    content: `Dự án ${data.projectCode || ''} vừa nhận được một bid mới từ nhà thầu. Vui lòng kiểm tra và xem xét.`,
  }),
  BID_APPROVED: (data) => ({
    title: 'Bid của bạn đã được duyệt',
    content: `Bid ${data.bidCode || ''} của bạn cho dự án ${data.projectCode || ''} đã được admin duyệt. Chủ nhà có thể xem và chọn bid của bạn.`,
  }),
  BID_REJECTED: (data) => ({
    title: 'Bid của bạn bị từ chối',
    content: `Bid ${data.bidCode || ''} của bạn cho dự án ${data.projectCode || ''} đã bị từ chối. Vui lòng kiểm tra lý do và cập nhật nếu cần.`,
  }),
  BID_SELECTED: (data) => ({
    title: 'Chúc mừng! Bid của bạn đã được chọn',
    content: `Bid ${data.bidCode || ''} của bạn cho dự án ${data.projectCode || ''} đã được chủ nhà chọn. Vui lòng kiểm tra chi tiết và liên hệ với chủ nhà.`,
  }),
  BID_NOT_SELECTED: (data) => ({
    title: 'Bid không được chọn',
    content: `Bid ${data.bidCode || ''} của bạn cho dự án ${data.projectCode || ''} không được chọn. Chủ nhà đã chọn nhà thầu khác.`,
  }),
  // Escrow notifications
  ESCROW_PENDING: (data) => ({
    title: 'Đặt cọc đang chờ xác nhận',
    content: `Escrow ${data.escrowCode || ''} cho dự án ${data.projectCode || ''} đang chờ xác nhận thanh toán.`,
  }),
  ESCROW_HELD: (data) => ({
    title: 'Đặt cọc đã được xác nhận',
    content: `Escrow ${data.escrowCode || ''} cho dự án ${data.projectCode || ''} đã được xác nhận. Số tiền ${data.amount?.toLocaleString('vi-VN') || ''} VNĐ đang được giữ.`,
  }),
  ESCROW_PARTIAL_RELEASED: (data) => ({
    title: 'Một phần đặt cọc đã được giải phóng',
    content: `Một phần escrow ${data.escrowCode || ''} cho dự án ${data.projectCode || ''} đã được giải phóng. Số tiền: ${data.amount?.toLocaleString('vi-VN') || ''} VNĐ.`,
  }),
  ESCROW_RELEASED: (data) => ({
    title: 'Đặt cọc đã được giải phóng hoàn toàn',
    content: `Escrow ${data.escrowCode || ''} cho dự án ${data.projectCode || ''} đã được giải phóng hoàn toàn.`,
  }),
  ESCROW_REFUNDED: (data) => ({
    title: 'Đặt cọc đã được hoàn trả',
    content: `Escrow ${data.escrowCode || ''} cho dự án ${data.projectCode || ''} đã được hoàn trả.`,
  }),
  ESCROW_DISPUTED: (data) => ({
    title: 'Đặt cọc đang tranh chấp',
    content: `Escrow ${data.escrowCode || ''} cho dự án ${data.projectCode || ''} đang trong trạng thái tranh chấp. Admin sẽ xử lý.`,
  }),
  // Fee notifications
  FEE_PENDING: (data) => ({
    title: 'Phí dịch vụ cần thanh toán',
    content: `Phí ${data.feeCode || ''} cho dự án ${data.projectCode || ''} cần được thanh toán. Số tiền: ${data.amount?.toLocaleString('vi-VN') || ''} VNĐ.`,
  }),
  FEE_PAID: (data) => ({
    title: 'Phí dịch vụ đã thanh toán',
    content: `Phí ${data.feeCode || ''} cho dự án ${data.projectCode || ''} đã được xác nhận thanh toán.`,
  }),
  // Project notifications
  PROJECT_MATCHED: (data) => ({
    title: 'Dự án đã được ghép nối',
    content: `Dự án ${data.projectCode || ''} đã được ghép nối thành công. Bạn có thể xem thông tin liên hệ của đối tác.`,
  }),
  PROJECT_STARTED: (data) => ({
    title: 'Dự án đã bắt đầu',
    content: `Dự án ${data.projectCode || ''} đã chuyển sang trạng thái đang thi công.`,
  }),
  PROJECT_COMPLETED: (data) => ({
    title: 'Dự án đã hoàn thành',
    content: `Dự án ${data.projectCode || ''} đã được đánh dấu hoàn thành.`,
  }),
  // Milestone notifications
  MILESTONE_REQUESTED: (data) => ({
    title: 'Yêu cầu xác nhận milestone',
    content: `Nhà thầu đã yêu cầu xác nhận hoàn thành milestone cho dự án ${data.projectCode || ''}.`,
  }),
  MILESTONE_CONFIRMED: (data) => ({
    title: 'Milestone đã được xác nhận',
    content: `Milestone cho dự án ${data.projectCode || ''} đã được xác nhận hoàn thành.`,
  }),
  MILESTONE_DISPUTED: (data) => ({
    title: 'Milestone đang tranh chấp',
    content: `Milestone cho dự án ${data.projectCode || ''} đang trong trạng thái tranh chấp.`,
  }),
  // Message notifications
  NEW_MESSAGE: (data) => ({
    title: 'Bạn có tin nhắn mới',
    content: `Bạn có tin nhắn mới trong cuộc hội thoại cho dự án ${data.projectCode || ''}. Vui lòng kiểm tra.`,
  }),
};

// ============================================
// NOTIFICATION SERVICE CLASS
// ============================================

export class NotificationService {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  // ============================================
  // CREATE OPERATIONS
  // ============================================

  /**
   * Create a single notification
   * Requirements: 14.5 - Include relevant project and bid information
   *
   * @param input - Notification input data
   * @returns Created notification
   */
  async create(input: CreateNotificationInput): Promise<NotificationWithUser> {
    const notification = await this.prisma.notification.create({
      data: {
        userId: input.userId,
        type: input.type,
        title: input.title,
        content: input.content,
        data: input.data ? JSON.stringify(input.data) : null,
      },
    });

    return this.transformNotification(notification);
  }

  /**
   * Create notification using template
   *
   * @param userId - User ID to notify
   * @param type - Notification type
   * @param data - Notification data
   * @returns Created notification
   */
  async createFromTemplate(
    userId: string,
    type: NotificationType,
    data: NotificationData
  ): Promise<NotificationWithUser> {
    const template = NOTIFICATION_TEMPLATES[type](data);

    return this.create({
      userId,
      type,
      title: template.title,
      content: template.content,
      data,
    });
  }

  /**
   * Create notifications for bid selection (match)
   * Requirements: 14.1, 14.2, 14.3 - Notify selected contractor, homeowner, and non-selected contractors
   *
   * @param context - Match context with project, bid, and user info
   * @returns Array of created notifications
   */
  async createMatchNotifications(context: {
    projectId: string;
    projectCode: string;
    selectedBidId: string;
    selectedBidCode: string;
    selectedContractorId: string;
    homeownerId: string;
    nonSelectedBids: Array<{ id: string; code: string; contractorId: string }>;
  }): Promise<NotificationWithUser[]> {
    const notifications: NotificationWithUser[] = [];
    const data: NotificationData = {
      projectId: context.projectId,
      projectCode: context.projectCode,
      bidId: context.selectedBidId,
      bidCode: context.selectedBidCode,
    };

    // Requirements: 14.1 - Notify selected contractor
    const contractorNotification = await this.createFromTemplate(
      context.selectedContractorId,
      'BID_SELECTED',
      data
    );
    notifications.push(contractorNotification);

    // Requirements: 14.2 - Notify homeowner
    const homeownerNotification = await this.createFromTemplate(
      context.homeownerId,
      'PROJECT_MATCHED',
      data
    );
    notifications.push(homeownerNotification);

    // Requirements: 14.3 - Notify non-selected contractors
    for (const bid of context.nonSelectedBids) {
      const notSelectedNotification = await this.createFromTemplate(
        bid.contractorId,
        'BID_NOT_SELECTED',
        {
          projectId: context.projectId,
          projectCode: context.projectCode,
          bidId: bid.id,
          bidCode: bid.code,
        }
      );
      notifications.push(notSelectedNotification);
    }

    return notifications;
  }

  /**
   * Create notification for escrow status change
   * Requirements: 14.4 - Notify both parties on escrow changes
   *
   * @param context - Escrow context
   * @returns Array of created notifications
   */
  async createEscrowNotification(context: {
    escrowId: string;
    escrowCode: string;
    projectId: string;
    projectCode: string;
    homeownerId: string;
    contractorId: string;
    status: string;
    amount?: number;
  }): Promise<NotificationWithUser[]> {
    const notifications: NotificationWithUser[] = [];
    const data: NotificationData = {
      projectId: context.projectId,
      projectCode: context.projectCode,
      escrowId: context.escrowId,
      escrowCode: context.escrowCode,
      amount: context.amount,
    };

    // Map escrow status to notification type
    const statusToType: Record<string, NotificationType> = {
      PENDING: 'ESCROW_PENDING',
      HELD: 'ESCROW_HELD',
      PARTIAL_RELEASED: 'ESCROW_PARTIAL_RELEASED',
      RELEASED: 'ESCROW_RELEASED',
      REFUNDED: 'ESCROW_REFUNDED',
      DISPUTED: 'ESCROW_DISPUTED',
    };

    const notificationType = statusToType[context.status];
    if (!notificationType) {
      return notifications;
    }

    // Notify homeowner
    const homeownerNotification = await this.createFromTemplate(
      context.homeownerId,
      notificationType,
      data
    );
    notifications.push(homeownerNotification);

    // Notify contractor
    const contractorNotification = await this.createFromTemplate(
      context.contractorId,
      notificationType,
      data
    );
    notifications.push(contractorNotification);

    return notifications;
  }

  /**
   * Create notification when a bid is received
   * Requirements: 12.1 - Notify homeowner when bid is received
   *
   * @param context - Bid received context
   * @returns Created notification
   */
  async createBidReceivedNotification(context: {
    bidId: string;
    bidCode: string;
    projectId: string;
    projectCode: string;
    homeownerId: string;
  }): Promise<NotificationWithUser> {
    const data: NotificationData = {
      projectId: context.projectId,
      projectCode: context.projectCode,
      bidId: context.bidId,
      bidCode: context.bidCode,
    };

    return this.createFromTemplate(context.homeownerId, 'BID_RECEIVED', data);
  }

  /**
   * Create notification when a bid is approved
   * Requirements: 12.2 - Notify contractor when bid is approved
   *
   * @param context - Bid approved context
   * @returns Created notification
   */
  async createBidApprovedNotification(context: {
    bidId: string;
    bidCode: string;
    projectId: string;
    projectCode: string;
    contractorId: string;
  }): Promise<NotificationWithUser> {
    const data: NotificationData = {
      projectId: context.projectId,
      projectCode: context.projectCode,
      bidId: context.bidId,
      bidCode: context.bidCode,
    };

    return this.createFromTemplate(context.contractorId, 'BID_APPROVED', data);
  }

  /**
   * Create notification when a bid is rejected
   *
   * @param context - Bid rejected context
   * @returns Created notification
   */
  async createBidRejectedNotification(context: {
    bidId: string;
    bidCode: string;
    projectId: string;
    projectCode: string;
    contractorId: string;
  }): Promise<NotificationWithUser> {
    const data: NotificationData = {
      projectId: context.projectId,
      projectCode: context.projectCode,
      bidId: context.bidId,
      bidCode: context.bidCode,
    };

    return this.createFromTemplate(context.contractorId, 'BID_REJECTED', data);
  }

  /**
   * Create notification for new message (offline users)
   * Requirements: 12.4 - Notify recipient if offline
   *
   * @param context - Message context
   * @returns Created notification
   */
  async createNewMessageNotification(context: {
    conversationId: string;
    projectId?: string;
    projectCode?: string;
    recipientId: string;
    senderName: string;
  }): Promise<NotificationWithUser> {
    const data: NotificationData = {
      projectId: context.projectId,
      projectCode: context.projectCode,
    };

    return this.createFromTemplate(context.recipientId, 'NEW_MESSAGE', data);
  }

  // ============================================
  // QUERY OPERATIONS
  // ============================================

  /**
   * List notifications for a user
   *
   * @param userId - User ID
   * @param query - Query parameters
   * @returns Paginated list of notifications
   */
  async list(
    userId: string,
    query: NotificationQuery
  ): Promise<NotificationListResult> {
    const { type, isRead, page, limit, sortBy, sortOrder } = query;
    const skip = (page - 1) * limit;

    const where = {
      userId,
      ...(type && { type }),
      ...(isRead !== undefined && { isRead }),
    };

    const [notifications, total, unreadCount] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      }),
      this.prisma.notification.count({ where }),
      this.prisma.notification.count({
        where: { userId, isRead: false },
      }),
    ]);

    return {
      data: notifications.map((n) => this.transformNotification(n)),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        unreadCount,
      },
    };
  }

  /**
   * Get notification by ID
   *
   * @param id - Notification ID
   * @param userId - User ID (for authorization)
   * @returns Notification or null
   */
  async getById(
    id: string,
    userId: string
  ): Promise<NotificationWithUser | null> {
    const notification = await this.prisma.notification.findFirst({
      where: { id, userId },
    });

    if (!notification) {
      return null;
    }

    return this.transformNotification(notification);
  }

  /**
   * Get unread count for a user
   *
   * @param userId - User ID
   * @returns Unread notification count
   */
  async getUnreadCount(userId: string): Promise<number> {
    return this.prisma.notification.count({
      where: { userId, isRead: false },
    });
  }

  // ============================================
  // UPDATE OPERATIONS
  // ============================================

  /**
   * Mark a notification as read
   *
   * @param id - Notification ID
   * @param userId - User ID (for authorization)
   * @returns Updated notification or null
   */
  async markRead(
    id: string,
    userId: string
  ): Promise<NotificationWithUser | null> {
    const notification = await this.prisma.notification.findFirst({
      where: { id, userId },
    });

    if (!notification) {
      return null;
    }

    if (notification.isRead) {
      return this.transformNotification(notification);
    }

    const updated = await this.prisma.notification.update({
      where: { id },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    return this.transformNotification(updated);
  }

  /**
   * Mark multiple notifications as read
   *
   * @param ids - Notification IDs
   * @param userId - User ID (for authorization)
   * @returns Number of updated notifications
   */
  async markManyRead(ids: string[], userId: string): Promise<number> {
    const result = await this.prisma.notification.updateMany({
      where: {
        id: { in: ids },
        userId,
        isRead: false,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    return result.count;
  }

  /**
   * Mark all notifications as read for a user
   *
   * @param userId - User ID
   * @returns Number of updated notifications
   */
  async markAllRead(userId: string): Promise<number> {
    const result = await this.prisma.notification.updateMany({
      where: {
        userId,
        isRead: false,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    return result.count;
  }

  // ============================================
  // HELPER FUNCTIONS
  // ============================================

  /**
   * Parse notification data JSON
   */
  private parseData(json: string | null): NotificationData | null {
    if (!json) return null;
    try {
      return JSON.parse(json) as NotificationData;
    } catch {
      return null;
    }
  }

  /**
   * Transform notification from Prisma to response format
   */
  private transformNotification(notification: {
    id: string;
    userId: string;
    type: string;
    title: string;
    content: string;
    data: string | null;
    isRead: boolean;
    readAt: Date | null;
    createdAt: Date;
  }): NotificationWithUser {
    return {
      id: notification.id,
      userId: notification.userId,
      type: notification.type,
      title: notification.title,
      content: notification.content,
      data: this.parseData(notification.data),
      isRead: notification.isRead,
      readAt: notification.readAt,
      createdAt: notification.createdAt,
    };
  }
}

// ============================================
// NOTIFICATION ERROR CLASS
// ============================================

export class NotificationError extends Error {
  code: string;
  statusCode: number;

  constructor(code: string, message: string, statusCode?: number) {
    super(message);
    this.code = code;
    this.name = 'NotificationError';

    const statusMap: Record<string, number> = {
      NOTIFICATION_NOT_FOUND: 404,
      UNAUTHORIZED: 403,
    };

    this.statusCode = statusCode || statusMap[code] || 500;
  }
}
