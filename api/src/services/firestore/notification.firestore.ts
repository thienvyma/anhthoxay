/**
 * Notification Firestore Service
 *
 * Firestore implementation for notification management.
 * Stores notifications in `users/{userId}/notifications/{notificationId}`
 *
 * @module services/firestore/notification.firestore
 * @requirements 6.3
 */

import * as admin from 'firebase-admin';
import { SubcollectionFirestoreService, type QueryOptions } from './base.firestore';
import { getFirestore } from '../firebase-admin.service';
import type {
  FirestoreNotification,
  FirestoreNotificationPreference,
  NotificationType,
} from '../../types/firestore.types';
import { logger } from '../../utils/logger';

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
  reviewLink?: string;
  conversationId?: string;
}

export interface CreateNotificationInput {
  userId: string;
  type: NotificationType;
  title: string;
  content: string;
  data?: NotificationData;
  channels?: string[];
}

export interface NotificationQuery {
  type?: NotificationType;
  isRead?: boolean;
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface NotificationListResult {
  data: FirestoreNotification[];
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
  BID_SELECTED: (data) => ({
    title: 'Chúc mừng! Bid của bạn đã được chọn',
    content: `Bid ${data.bidCode || ''} của bạn cho dự án ${data.projectCode || ''} đã được chủ nhà chọn.`,
  }),
  BID_NOT_SELECTED: (data) => ({
    title: 'Bid không được chọn',
    content: `Bid ${data.bidCode || ''} của bạn cho dự án ${data.projectCode || ''} không được chọn.`,
  }),
  ESCROW_HELD: (data) => ({
    title: 'Đặt cọc đã được xác nhận',
    content: `Escrow ${data.escrowCode || ''} cho dự án ${data.projectCode || ''} đã được xác nhận. Số tiền ${data.amount?.toLocaleString('vi-VN') || ''} VNĐ đang được giữ.`,
  }),
  ESCROW_RELEASED: (data) => ({
    title: 'Đặt cọc đã được giải phóng hoàn toàn',
    content: `Escrow ${data.escrowCode || ''} cho dự án ${data.projectCode || ''} đã được giải phóng hoàn toàn.`,
  }),
  ESCROW_PARTIAL_RELEASED: (data) => ({
    title: 'Một phần đặt cọc đã được giải phóng',
    content: `Một phần escrow ${data.escrowCode || ''} cho dự án ${data.projectCode || ''} đã được giải phóng. Số tiền: ${data.amount?.toLocaleString('vi-VN') || ''} VNĐ.`,
  }),
  ESCROW_REFUNDED: (data) => ({
    title: 'Đặt cọc đã được hoàn trả',
    content: `Escrow ${data.escrowCode || ''} cho dự án ${data.projectCode || ''} đã được hoàn trả.`,
  }),
  ESCROW_DISPUTED: (data) => ({
    title: 'Đặt cọc đang tranh chấp',
    content: `Escrow ${data.escrowCode || ''} cho dự án ${data.projectCode || ''} đang trong trạng thái tranh chấp.`,
  }),
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
  DISPUTE_RESOLVED: (data) => ({
    title: 'Tranh chấp đã được giải quyết',
    content: `Tranh chấp cho dự án ${data.projectCode || ''} đã được giải quyết.`,
  }),
  NEW_MESSAGE: (data) => ({
    title: 'Bạn có tin nhắn mới',
    content: `Bạn có tin nhắn mới trong cuộc hội thoại cho dự án ${data.projectCode || ''}.`,
  }),
  BID_DEADLINE_REMINDER: (data) => ({
    title: 'Nhắc nhở: Hạn chót đấu giá sắp đến',
    content: `Dự án ${data.projectCode || ''} sắp hết hạn nhận bid. Hãy kiểm tra các bid đã nhận.`,
  }),
  NO_BIDS_REMINDER: (data) => ({
    title: 'Dự án chưa có bid',
    content: `Dự án ${data.projectCode || ''} vẫn chưa nhận được bid nào. Hãy xem xét điều chỉnh yêu cầu.`,
  }),
  ESCROW_PENDING: (data) => ({
    title: 'Đặt cọc đang chờ xác nhận',
    content: `Escrow ${data.escrowCode || ''} cho dự án ${data.projectCode || ''} đang chờ xác nhận thanh toán.`,
  }),
  REVIEW_REMINDER: (data) => ({
    title: 'Nhắc nhở: Đánh giá nhà thầu',
    content: `Dự án ${data.projectCode || ''} đã hoàn thành. Hãy đánh giá nhà thầu để giúp cộng đồng.`,
  }),
};

// ============================================
// NOTIFICATION ERROR CLASS
// ============================================

export class NotificationFirestoreError extends Error {
  code: string;
  statusCode: number;

  constructor(code: string, message: string, statusCode?: number) {
    super(message);
    this.code = code;
    this.name = 'NotificationFirestoreError';

    const statusMap: Record<string, number> = {
      NOTIFICATION_NOT_FOUND: 404,
      UNAUTHORIZED: 403,
    };

    this.statusCode = statusCode || statusMap[code] || 500;
  }
}

// ============================================
// NOTIFICATION SUBCOLLECTION SERVICE
// ============================================

class NotificationSubcollectionService extends SubcollectionFirestoreService<FirestoreNotification> {
  constructor() {
    super('users', 'notifications');
  }
}

// ============================================
// PREFERENCE SUBCOLLECTION SERVICE
// ============================================

class PreferenceSubcollectionService extends SubcollectionFirestoreService<FirestoreNotificationPreference> {
  constructor() {
    super('users', 'preferences');
  }

  async getNotificationPreference(userId: string): Promise<FirestoreNotificationPreference | null> {
    return this.getById(userId, 'notification');
  }

  async setNotificationPreference(
    userId: string,
    data: Partial<Omit<FirestoreNotificationPreference, 'id' | 'createdAt' | 'updatedAt'>>
  ): Promise<FirestoreNotificationPreference> {
    const existing = await this.getById(userId, 'notification');
    if (existing) {
      return this.update(userId, 'notification', data);
    }

    // Create with default values
    const db = await this.getDb();
    const now = new Date();
    const docRef = db.collection('users').doc(userId).collection('preferences').doc('notification');

    const defaultPreference: Omit<FirestoreNotificationPreference, 'id' | 'createdAt' | 'updatedAt'> = {
      userId,
      emailEnabled: true,
      emailBidReceived: true,
      emailBidApproved: true,
      emailProjectMatched: true,
      emailNewMessage: true,
      emailEscrowReleased: true,
      smsEnabled: false,
      smsBidReceived: false,
      smsBidApproved: false,
      smsProjectMatched: false,
      smsNewMessage: false,
      smsEscrowReleased: false,
      ...data,
    };

    await docRef.set({
      ...defaultPreference,
      createdAt: admin.firestore.Timestamp.fromDate(now),
      updatedAt: admin.firestore.Timestamp.fromDate(now),
    });

    return {
      id: 'notification',
      ...defaultPreference,
      createdAt: now,
      updatedAt: now,
    };
  }

  protected async getDb(): Promise<admin.firestore.Firestore> {
    return getFirestore();
  }
}

// ============================================
// MAIN NOTIFICATION FIRESTORE SERVICE
// ============================================

export class NotificationFirestoreService {
  private notificationService: NotificationSubcollectionService;
  private preferenceService: PreferenceSubcollectionService;
  private db: admin.firestore.Firestore | null = null;

  constructor() {
    this.notificationService = new NotificationSubcollectionService();
    this.preferenceService = new PreferenceSubcollectionService();
  }

  private async getDb(): Promise<admin.firestore.Firestore> {
    if (!this.db) {
      this.db = await getFirestore();
    }
    return this.db;
  }

  // ============================================
  // CREATE OPERATIONS
  // ============================================

  /**
   * Create a notification
   * @requirements 6.3
   */
  async create(input: CreateNotificationInput): Promise<FirestoreNotification> {
    const notification = await this.notificationService.create(input.userId, {
      userId: input.userId,
      type: input.type,
      title: input.title,
      content: input.content,
      data: input.data as Record<string, unknown>,
      channels: input.channels,
      isRead: false,
      emailSent: false,
      smsSent: false,
    });

    logger.debug('Created notification', {
      notificationId: notification.id,
      userId: input.userId,
      type: input.type,
    });

    return notification;
  }

  /**
   * Create notification from template
   */
  async createFromTemplate(
    userId: string,
    type: NotificationType,
    data: NotificationData
  ): Promise<FirestoreNotification> {
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
   * Create match notifications (bid selected)
   */
  async createMatchNotifications(context: {
    projectId: string;
    projectCode: string;
    selectedBidId: string;
    selectedBidCode: string;
    selectedContractorId: string;
    homeownerId: string;
    nonSelectedBids: Array<{ id: string; code: string; contractorId: string }>;
  }): Promise<FirestoreNotification[]> {
    const notifications: FirestoreNotification[] = [];
    const data: NotificationData = {
      projectId: context.projectId,
      projectCode: context.projectCode,
      bidId: context.selectedBidId,
      bidCode: context.selectedBidCode,
    };

    // Notify selected contractor
    const contractorNotification = await this.createFromTemplate(
      context.selectedContractorId,
      'BID_SELECTED',
      data
    );
    notifications.push(contractorNotification);

    // Notify non-selected contractors
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
   * Create escrow notification
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
  }): Promise<FirestoreNotification[]> {
    const notifications: FirestoreNotification[] = [];
    const data: NotificationData = {
      projectId: context.projectId,
      projectCode: context.projectCode,
      escrowId: context.escrowId,
      escrowCode: context.escrowCode,
      amount: context.amount,
    };

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
   * Create new message notification
   */
  async createNewMessageNotification(context: {
    conversationId: string;
    projectId?: string;
    projectCode?: string;
    recipientId: string;
    senderName: string;
  }): Promise<FirestoreNotification> {
    return this.createFromTemplate(context.recipientId, 'NEW_MESSAGE', {
      projectId: context.projectId,
      projectCode: context.projectCode,
      conversationId: context.conversationId,
    });
  }

  // ============================================
  // QUERY OPERATIONS
  // ============================================

  /**
   * List notifications for a user
   */
  async list(userId: string, query: NotificationQuery): Promise<NotificationListResult> {
    const { type, isRead, page, limit, sortBy = 'createdAt', sortOrder = 'desc' } = query;
    const where: QueryOptions<FirestoreNotification>['where'] = [];

    if (type) {
      where.push({ field: 'type', operator: '==', value: type });
    }
    if (isRead !== undefined) {
      where.push({ field: 'isRead', operator: '==', value: isRead });
    }

    const notifications = await this.notificationService.query(userId, {
      where: where.length > 0 ? where : undefined,
      orderBy: [{ field: sortBy, direction: sortOrder }],
      limit,
    });

    // Get total count
    const allNotifications = await this.notificationService.query(userId, {
      where: where.length > 0 ? where : undefined,
    });
    const total = allNotifications.length;

    // Get unread count
    const unreadNotifications = await this.notificationService.query(userId, {
      where: [{ field: 'isRead', operator: '==', value: false }],
    });
    const unreadCount = unreadNotifications.length;

    // Paginate
    const start = (page - 1) * limit;
    const paginatedData = notifications.slice(start, start + limit);

    return {
      data: paginatedData,
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
   */
  async getById(userId: string, id: string): Promise<FirestoreNotification | null> {
    return this.notificationService.getById(userId, id);
  }

  /**
   * Get unread count
   */
  async getUnreadCount(userId: string): Promise<number> {
    const unread = await this.notificationService.query(userId, {
      where: [{ field: 'isRead', operator: '==', value: false }],
    });
    return unread.length;
  }

  // ============================================
  // UPDATE OPERATIONS
  // ============================================

  /**
   * Mark notification as read
   */
  async markRead(userId: string, id: string): Promise<FirestoreNotification | null> {
    const notification = await this.notificationService.getById(userId, id);
    if (!notification) {
      return null;
    }

    if (notification.isRead) {
      return notification;
    }

    return this.notificationService.update(userId, id, {
      isRead: true,
      readAt: new Date(),
    });
  }

  /**
   * Mark all notifications as read
   */
  async markAllRead(userId: string): Promise<number> {
    const unread = await this.notificationService.query(userId, {
      where: [{ field: 'isRead', operator: '==', value: false }],
    });

    const db = await this.getDb();
    const batch = db.batch();
    const now = admin.firestore.Timestamp.fromDate(new Date());

    for (const notification of unread) {
      const docRef = db
        .collection('users')
        .doc(userId)
        .collection('notifications')
        .doc(notification.id);
      batch.update(docRef, { isRead: true, readAt: now, updatedAt: now });
    }

    await batch.commit();
    return unread.length;
  }

  // ============================================
  // PREFERENCE OPERATIONS
  // ============================================

  /**
   * Get notification preferences
   */
  async getPreferences(userId: string): Promise<FirestoreNotificationPreference> {
    const preference = await this.preferenceService.getNotificationPreference(userId);
    if (preference) {
      return preference;
    }

    // Return default preferences
    return this.preferenceService.setNotificationPreference(userId, {});
  }

  /**
   * Update notification preferences
   */
  async updatePreferences(
    userId: string,
    data: Partial<Omit<FirestoreNotificationPreference, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>
  ): Promise<FirestoreNotificationPreference> {
    return this.preferenceService.setNotificationPreference(userId, data);
  }

  // ============================================
  // REAL-TIME LISTENERS
  // ============================================

  /**
   * Set up real-time listener for user's notifications
   */
  onNotificationsSnapshot(
    userId: string,
    callback: (notifications: FirestoreNotification[]) => void
  ): () => void {
    let unsubscribe: (() => void) | null = null;

    this.getDb().then((db) => {
      unsubscribe = db
        .collection('users')
        .doc(userId)
        .collection('notifications')
        .orderBy('createdAt', 'desc')
        .limit(50)
        .onSnapshot((snapshot) => {
          const notifications = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate() || new Date(),
            updatedAt: doc.data().updatedAt?.toDate() || new Date(),
          })) as FirestoreNotification[];
          callback(notifications);
        });
    });

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }
}

// Export singleton instance
export const notificationFirestoreService = new NotificationFirestoreService();
