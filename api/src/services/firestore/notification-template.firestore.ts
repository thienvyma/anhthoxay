/**
 * Notification Template Firestore Service
 *
 * Firestore implementation for notification template management.
 * Stores templates in `notificationTemplates/{type}`
 *
 * @module services/firestore/notification-template.firestore
 * @requirements 6.4
 */

import * as admin from 'firebase-admin';
import { BaseFirestoreService } from './base.firestore';
import { getFirestore } from '../firebase-admin.service';
import type { FirestoreNotificationTemplate } from '../../types/firestore.types';
import { logger } from '../../utils/logger';

// ============================================
// TYPES
// ============================================

export type NotificationTemplateType =
  | 'BID_RECEIVED'
  | 'BID_APPROVED'
  | 'BID_REJECTED'
  | 'BID_SELECTED'
  | 'BID_NOT_SELECTED'
  | 'PROJECT_MATCHED'
  | 'PROJECT_APPROVED'
  | 'PROJECT_REJECTED'
  | 'ESCROW_PENDING'
  | 'ESCROW_HELD'
  | 'ESCROW_RELEASED'
  | 'ESCROW_PARTIAL_RELEASED'
  | 'ESCROW_REFUNDED'
  | 'ESCROW_DISPUTED'
  | 'NEW_MESSAGE'
  | 'MILESTONE_REQUESTED'
  | 'MILESTONE_CONFIRMED'
  | 'MILESTONE_DISPUTED'
  | 'DISPUTE_RESOLVED'
  | 'BID_DEADLINE_REMINDER'
  | 'NO_BIDS_REMINDER'
  | 'ESCROW_PENDING_REMINDER'
  | 'REVIEW_REMINDER';

export interface CreateNotificationTemplateInput {
  type: NotificationTemplateType;
  emailSubject: string;
  emailBody: string;
  smsBody: string;
  inAppTitle: string;
  inAppBody: string;
  variables: string[];
}

export interface UpdateNotificationTemplateInput {
  emailSubject?: string;
  emailBody?: string;
  smsBody?: string;
  inAppTitle?: string;
  inAppBody?: string;
  variables?: string[];
}

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

const DEFAULT_TEMPLATES: CreateNotificationTemplateInput[] = [
  {
    type: 'BID_RECEIVED',
    emailSubject: 'Bạn có báo giá mới cho công trình {{projectCode}}',
    emailBody: '<p>Xin chào {{homeownerName}},</p><p>Công trình <strong>{{projectTitle}}</strong> ({{projectCode}}) của bạn vừa nhận được một báo giá mới.</p><p><strong>Giá đề xuất:</strong> {{bidPrice}} VNĐ</p>',
    smsBody: 'Công trình {{projectCode}} có báo giá mới: {{bidPrice}} VNĐ.',
    inAppTitle: 'Báo giá mới',
    inAppBody: 'Công trình {{projectCode}} vừa nhận được báo giá {{bidPrice}} VNĐ.',
    variables: ['homeownerName', 'projectTitle', 'projectCode', 'bidPrice', 'bidTimeline'],
  },
  {
    type: 'BID_APPROVED',
    emailSubject: 'Báo giá của bạn đã được duyệt - {{projectCode}}',
    emailBody: '<p>Xin chào {{contractorName}},</p><p>Báo giá <strong>{{bidCode}}</strong> của bạn cho công trình {{projectCode}} đã được duyệt.</p>',
    smsBody: 'Báo giá {{bidCode}} đã được duyệt cho công trình {{projectCode}}.',
    inAppTitle: 'Báo giá được duyệt',
    inAppBody: 'Báo giá {{bidCode}} cho công trình {{projectCode}} đã được duyệt.',
    variables: ['contractorName', 'bidCode', 'projectCode'],
  },
  {
    type: 'BID_REJECTED',
    emailSubject: 'Báo giá của bạn không được duyệt - {{projectCode}}',
    emailBody: '<p>Xin chào {{contractorName}},</p><p>Báo giá <strong>{{bidCode}}</strong> của bạn cho công trình {{projectCode}} không được duyệt.</p><p><strong>Lý do:</strong> {{rejectReason}}</p>',
    smsBody: 'Báo giá {{bidCode}} không được duyệt. Lý do: {{rejectReason}}',
    inAppTitle: 'Báo giá không được duyệt',
    inAppBody: 'Báo giá {{bidCode}} cho công trình {{projectCode}} không được duyệt.',
    variables: ['contractorName', 'bidCode', 'projectCode', 'rejectReason'],
  },
  {
    type: 'BID_SELECTED',
    emailSubject: 'Chúc mừng! Báo giá của bạn đã được chọn - {{projectCode}}',
    emailBody: '<p>Xin chào {{contractorName}},</p><p>Chúc mừng! Báo giá <strong>{{bidCode}}</strong> của bạn đã được chủ nhà chọn cho công trình {{projectCode}}.</p>',
    smsBody: 'Chúc mừng! Báo giá {{bidCode}} đã được chọn cho công trình {{projectCode}}.',
    inAppTitle: 'Báo giá được chọn',
    inAppBody: 'Chúc mừng! Báo giá {{bidCode}} đã được chọn cho công trình {{projectCode}}.',
    variables: ['contractorName', 'bidCode', 'projectCode'],
  },
  {
    type: 'BID_NOT_SELECTED',
    emailSubject: 'Báo giá của bạn không được chọn - {{projectCode}}',
    emailBody: '<p>Xin chào {{contractorName}},</p><p>Báo giá <strong>{{bidCode}}</strong> của bạn cho công trình {{projectCode}} không được chọn.</p>',
    smsBody: 'Báo giá {{bidCode}} không được chọn cho công trình {{projectCode}}.',
    inAppTitle: 'Báo giá không được chọn',
    inAppBody: 'Báo giá {{bidCode}} cho công trình {{projectCode}} không được chọn.',
    variables: ['contractorName', 'bidCode', 'projectCode'],
  },
  {
    type: 'PROJECT_MATCHED',
    emailSubject: 'Công trình {{projectCode}} đã được ghép nối thành công',
    emailBody: '<p>Xin chào {{homeownerName}},</p><p>Công trình <strong>{{projectTitle}}</strong> ({{projectCode}}) đã được ghép nối với nhà thầu.</p>',
    smsBody: 'Công trình {{projectCode}} đã được ghép nối. Vui lòng hoàn tất đặt cọc.',
    inAppTitle: 'Ghép nối thành công',
    inAppBody: 'Công trình {{projectCode}} đã được ghép nối với nhà thầu.',
    variables: ['homeownerName', 'projectTitle', 'projectCode'],
  },
  {
    type: 'PROJECT_APPROVED',
    emailSubject: 'Công trình {{projectCode}} đã được duyệt',
    emailBody: '<p>Xin chào {{homeownerName}},</p><p>Công trình <strong>{{projectTitle}}</strong> ({{projectCode}}) của bạn đã được duyệt.</p>',
    smsBody: 'Công trình {{projectCode}} đã được duyệt và đang mở nhận báo giá.',
    inAppTitle: 'Công trình được duyệt',
    inAppBody: 'Công trình {{projectCode}} đã được duyệt và đang mở nhận báo giá.',
    variables: ['homeownerName', 'projectTitle', 'projectCode'],
  },
  {
    type: 'PROJECT_REJECTED',
    emailSubject: 'Công trình {{projectCode}} không được duyệt',
    emailBody: '<p>Xin chào {{homeownerName}},</p><p>Công trình <strong>{{projectTitle}}</strong> ({{projectCode}}) của bạn không được duyệt.</p><p><strong>Lý do:</strong> {{rejectReason}}</p>',
    smsBody: 'Công trình {{projectCode}} không được duyệt. Lý do: {{rejectReason}}',
    inAppTitle: 'Công trình không được duyệt',
    inAppBody: 'Công trình {{projectCode}} không được duyệt. Lý do: {{rejectReason}}',
    variables: ['homeownerName', 'projectTitle', 'projectCode', 'rejectReason'],
  },
  {
    type: 'ESCROW_PENDING',
    emailSubject: 'Đặt cọc đang chờ xác nhận - {{projectCode}}',
    emailBody: '<p>Xin chào,</p><p>Đặt cọc cho công trình {{projectCode}} đang chờ xác nhận.</p><p><strong>Số tiền:</strong> {{amount}} VNĐ</p>',
    smsBody: 'Đặt cọc {{escrowCode}} ({{amount}} VNĐ) đang chờ xác nhận.',
    inAppTitle: 'Đặt cọc chờ xác nhận',
    inAppBody: 'Đặt cọc {{escrowCode}} cho công trình {{projectCode}} đang chờ xác nhận.',
    variables: ['projectCode', 'escrowCode', 'amount'],
  },
  {
    type: 'ESCROW_HELD',
    emailSubject: 'Đặt cọc đã được xác nhận - {{projectCode}}',
    emailBody: '<p>Xin chào,</p><p>Đặt cọc cho công trình {{projectCode}} đã được xác nhận.</p><p><strong>Số tiền:</strong> {{amount}} VNĐ</p>',
    smsBody: 'Đặt cọc {{escrowCode}} ({{amount}} VNĐ) đã được xác nhận.',
    inAppTitle: 'Đặt cọc xác nhận',
    inAppBody: 'Đặt cọc {{escrowCode}} cho công trình {{projectCode}} đã được xác nhận.',
    variables: ['projectCode', 'escrowCode', 'amount'],
  },
  {
    type: 'ESCROW_RELEASED',
    emailSubject: 'Đặt cọc đã được giải phóng - {{projectCode}}',
    emailBody: '<p>Xin chào,</p><p>Đặt cọc cho công trình {{projectCode}} đã được giải phóng hoàn toàn.</p>',
    smsBody: 'Đặt cọc {{escrowCode}} đã được giải phóng hoàn toàn.',
    inAppTitle: 'Đặt cọc giải phóng',
    inAppBody: 'Đặt cọc {{escrowCode}} cho công trình {{projectCode}} đã được giải phóng.',
    variables: ['projectCode', 'escrowCode'],
  },
  {
    type: 'ESCROW_PARTIAL_RELEASED',
    emailSubject: 'Một phần đặt cọc đã được giải phóng - {{projectCode}}',
    emailBody: '<p>Xin chào,</p><p>Một phần đặt cọc cho công trình {{projectCode}} đã được giải phóng.</p><p><strong>Số tiền:</strong> {{amount}} VNĐ</p>',
    smsBody: 'Một phần đặt cọc {{escrowCode}} ({{amount}} VNĐ) đã được giải phóng.',
    inAppTitle: 'Giải phóng một phần',
    inAppBody: 'Một phần đặt cọc {{escrowCode}} ({{amount}} VNĐ) đã được giải phóng.',
    variables: ['projectCode', 'escrowCode', 'amount'],
  },
  {
    type: 'ESCROW_REFUNDED',
    emailSubject: 'Đặt cọc đã được hoàn trả - {{projectCode}}',
    emailBody: '<p>Xin chào,</p><p>Đặt cọc cho công trình {{projectCode}} đã được hoàn trả.</p>',
    smsBody: 'Đặt cọc {{escrowCode}} đã được hoàn trả.',
    inAppTitle: 'Đặt cọc hoàn trả',
    inAppBody: 'Đặt cọc {{escrowCode}} cho công trình {{projectCode}} đã được hoàn trả.',
    variables: ['projectCode', 'escrowCode'],
  },
  {
    type: 'ESCROW_DISPUTED',
    emailSubject: 'Đặt cọc đang tranh chấp - {{projectCode}}',
    emailBody: '<p>Xin chào,</p><p>Đặt cọc cho công trình {{projectCode}} đang trong trạng thái tranh chấp.</p>',
    smsBody: 'Đặt cọc {{escrowCode}} đang tranh chấp. Admin sẽ xem xét.',
    inAppTitle: 'Đặt cọc tranh chấp',
    inAppBody: 'Đặt cọc {{escrowCode}} cho công trình {{projectCode}} đang tranh chấp.',
    variables: ['projectCode', 'escrowCode'],
  },
  {
    type: 'NEW_MESSAGE',
    emailSubject: 'Bạn có tin nhắn mới - {{projectCode}}',
    emailBody: '<p>Xin chào {{recipientName}},</p><p>Bạn có tin nhắn mới từ {{senderName}} trong cuộc hội thoại cho công trình {{projectCode}}.</p>',
    smsBody: 'Bạn có tin nhắn mới từ {{senderName}} cho công trình {{projectCode}}.',
    inAppTitle: 'Tin nhắn mới',
    inAppBody: 'Bạn có tin nhắn mới từ {{senderName}} cho công trình {{projectCode}}.',
    variables: ['recipientName', 'senderName', 'projectCode'],
  },
  {
    type: 'MILESTONE_REQUESTED',
    emailSubject: 'Yêu cầu xác nhận milestone - {{projectCode}}',
    emailBody: '<p>Xin chào {{homeownerName}},</p><p>Nhà thầu đã yêu cầu xác nhận hoàn thành milestone <strong>{{milestoneName}}</strong> cho công trình {{projectCode}}.</p>',
    smsBody: 'Nhà thầu yêu cầu xác nhận milestone {{milestoneName}} cho {{projectCode}}.',
    inAppTitle: 'Yêu cầu xác nhận milestone',
    inAppBody: 'Nhà thầu yêu cầu xác nhận milestone {{milestoneName}} cho {{projectCode}}.',
    variables: ['homeownerName', 'milestoneName', 'projectCode'],
  },
  {
    type: 'MILESTONE_CONFIRMED',
    emailSubject: 'Milestone đã được xác nhận - {{projectCode}}',
    emailBody: '<p>Xin chào,</p><p>Milestone <strong>{{milestoneName}}</strong> cho công trình {{projectCode}} đã được xác nhận hoàn thành.</p>',
    smsBody: 'Milestone {{milestoneName}} cho {{projectCode}} đã được xác nhận.',
    inAppTitle: 'Milestone xác nhận',
    inAppBody: 'Milestone {{milestoneName}} cho {{projectCode}} đã được xác nhận.',
    variables: ['milestoneName', 'projectCode'],
  },
  {
    type: 'MILESTONE_DISPUTED',
    emailSubject: 'Milestone đang tranh chấp - {{projectCode}}',
    emailBody: '<p>Xin chào,</p><p>Milestone <strong>{{milestoneName}}</strong> cho công trình {{projectCode}} đang trong trạng thái tranh chấp.</p>',
    smsBody: 'Milestone {{milestoneName}} cho {{projectCode}} đang tranh chấp.',
    inAppTitle: 'Milestone tranh chấp',
    inAppBody: 'Milestone {{milestoneName}} cho {{projectCode}} đang tranh chấp.',
    variables: ['milestoneName', 'projectCode', 'disputeReason'],
  },
  {
    type: 'DISPUTE_RESOLVED',
    emailSubject: 'Tranh chấp đã được giải quyết - {{projectCode}}',
    emailBody: '<p>Xin chào,</p><p>Tranh chấp cho công trình {{projectCode}} đã được giải quyết.</p><p><strong>Kết quả:</strong> {{resolution}}</p>',
    smsBody: 'Tranh chấp cho {{projectCode}} đã được giải quyết: {{resolution}}',
    inAppTitle: 'Tranh chấp giải quyết',
    inAppBody: 'Tranh chấp cho {{projectCode}} đã được giải quyết.',
    variables: ['projectCode', 'resolution'],
  },
  {
    type: 'BID_DEADLINE_REMINDER',
    emailSubject: 'Nhắc nhở: Hạn chót đấu giá sắp đến - {{projectCode}}',
    emailBody: '<p>Xin chào {{homeownerName}},</p><p>Công trình <strong>{{projectTitle}}</strong> ({{projectCode}}) sắp hết hạn nhận báo giá.</p>',
    smsBody: 'Công trình {{projectCode}} sắp hết hạn nhận báo giá: {{deadline}}.',
    inAppTitle: 'Hạn chót sắp đến',
    inAppBody: 'Công trình {{projectCode}} sắp hết hạn nhận báo giá.',
    variables: ['homeownerName', 'projectTitle', 'projectCode', 'deadline'],
  },
  {
    type: 'NO_BIDS_REMINDER',
    emailSubject: 'Công trình {{projectCode}} chưa có báo giá',
    emailBody: '<p>Xin chào {{homeownerName}},</p><p>Công trình <strong>{{projectTitle}}</strong> ({{projectCode}}) vẫn chưa nhận được báo giá nào.</p>',
    smsBody: 'Công trình {{projectCode}} chưa có báo giá. Hãy xem xét điều chỉnh.',
    inAppTitle: 'Chưa có báo giá',
    inAppBody: 'Công trình {{projectCode}} vẫn chưa nhận được báo giá nào.',
    variables: ['homeownerName', 'projectTitle', 'projectCode'],
  },
  {
    type: 'ESCROW_PENDING_REMINDER',
    emailSubject: 'Nhắc nhở: Đặt cọc đang chờ xác nhận - {{projectCode}}',
    emailBody: '<p>Xin chào,</p><p>Đặt cọc cho công trình {{projectCode}} vẫn đang chờ xác nhận.</p>',
    smsBody: 'Đặt cọc {{escrowCode}} vẫn đang chờ xác nhận. Vui lòng hoàn tất.',
    inAppTitle: 'Đặt cọc chờ xác nhận',
    inAppBody: 'Đặt cọc {{escrowCode}} cho {{projectCode}} vẫn đang chờ xác nhận.',
    variables: ['projectCode', 'escrowCode'],
  },
  {
    type: 'REVIEW_REMINDER',
    emailSubject: 'Nhắc nhở: Đánh giá nhà thầu - {{projectCode}}',
    emailBody: '<p>Xin chào {{homeownerName}},</p><p>Công trình <strong>{{projectTitle}}</strong> ({{projectCode}}) đã hoàn thành. Hãy đánh giá nhà thầu.</p>',
    smsBody: 'Công trình {{projectCode}} đã hoàn thành. Hãy đánh giá nhà thầu.',
    inAppTitle: 'Đánh giá nhà thầu',
    inAppBody: 'Công trình {{projectCode}} đã hoàn thành. Hãy đánh giá nhà thầu.',
    variables: ['homeownerName', 'projectTitle', 'projectCode'],
  },
];


// ============================================
// ERROR CLASS
// ============================================

export class NotificationTemplateFirestoreError extends Error {
  code: string;
  statusCode: number;

  constructor(code: string, message: string, statusCode?: number) {
    super(message);
    this.code = code;
    this.name = 'NotificationTemplateFirestoreError';

    const statusMap: Record<string, number> = {
      TEMPLATE_NOT_FOUND: 404,
      TEMPLATE_ALREADY_EXISTS: 409,
      INVALID_TEMPLATE_TYPE: 400,
      RENDER_ERROR: 400,
    };

    this.statusCode = statusCode || statusMap[code] || 500;
  }
}

// ============================================
// TEMPLATE BASE SERVICE
// ============================================

class TemplateBaseService extends BaseFirestoreService<FirestoreNotificationTemplate> {
  constructor() {
    super('notificationTemplates');
  }
}

// ============================================
// MAIN SERVICE
// ============================================

export class NotificationTemplateFirestoreService {
  private baseService: TemplateBaseService;
  private db: admin.firestore.Firestore | null = null;

  constructor() {
    this.baseService = new TemplateBaseService();
  }

  private async getDb(): Promise<admin.firestore.Firestore> {
    if (!this.db) {
      this.db = await getFirestore();
    }
    return this.db;
  }

  async getByType(type: NotificationTemplateType): Promise<FirestoreNotificationTemplate | null> {
    return this.baseService.getById(type);
  }

  async getAll(): Promise<FirestoreNotificationTemplate[]> {
    return this.baseService.query({
      orderBy: [{ field: 'type', direction: 'asc' }],
    });
  }

  async getAllTypes(): Promise<NotificationTemplateType[]> {
    const templates = await this.getAll();
    return templates.map((t) => t.type as NotificationTemplateType);
  }

  async create(input: CreateNotificationTemplateInput): Promise<FirestoreNotificationTemplate> {
    const existing = await this.getByType(input.type);
    if (existing) {
      throw new NotificationTemplateFirestoreError(
        'TEMPLATE_ALREADY_EXISTS',
        `Template with type ${input.type} already exists`
      );
    }

    const db = await this.getDb();
    const now = new Date();
    const docRef = db.collection('notificationTemplates').doc(input.type);

    const template: Omit<FirestoreNotificationTemplate, 'id'> = {
      type: input.type,
      emailSubject: input.emailSubject,
      emailBody: input.emailBody,
      smsBody: input.smsBody,
      inAppTitle: input.inAppTitle,
      inAppBody: input.inAppBody,
      variables: input.variables,
      version: 1,
      createdAt: now,
      updatedAt: now,
    };

    await docRef.set({
      ...template,
      createdAt: admin.firestore.Timestamp.fromDate(now),
      updatedAt: admin.firestore.Timestamp.fromDate(now),
    });

    logger.info('Created notification template', { type: input.type });

    return { id: input.type, ...template };
  }

  async update(
    type: NotificationTemplateType,
    input: UpdateNotificationTemplateInput
  ): Promise<FirestoreNotificationTemplate> {
    const existing = await this.getByType(type);
    if (!existing) {
      throw new NotificationTemplateFirestoreError(
        'TEMPLATE_NOT_FOUND',
        `Template with type ${type} not found`
      );
    }

    const db = await this.getDb();
    const now = new Date();
    const docRef = db.collection('notificationTemplates').doc(type);

    const updateData: Record<string, unknown> = {
      ...input,
      version: (existing.version || 1) + 1,
      updatedAt: admin.firestore.Timestamp.fromDate(now),
    };

    await docRef.update(updateData);

    logger.info('Updated notification template', { type, version: updateData.version });

    return { ...existing, ...input, version: updateData.version as number, updatedAt: now };
  }

  async delete(type: NotificationTemplateType): Promise<void> {
    const existing = await this.getByType(type);
    if (!existing) {
      throw new NotificationTemplateFirestoreError(
        'TEMPLATE_NOT_FOUND',
        `Template with type ${type} not found`
      );
    }

    const db = await this.getDb();
    await db.collection('notificationTemplates').doc(type).delete();

    logger.info('Deleted notification template', { type });
  }

  async render(
    type: NotificationTemplateType,
    variables: Record<string, string | number>
  ): Promise<RenderedTemplate> {
    const template = await this.getByType(type);
    if (!template) {
      throw new NotificationTemplateFirestoreError(
        'TEMPLATE_NOT_FOUND',
        `Template with type ${type} not found`
      );
    }

    return this.renderTemplate(template, variables);
  }

  private renderTemplate(
    template: FirestoreNotificationTemplate,
    variables: Record<string, string | number>
  ): RenderedTemplate {
    const replaceVariables = (text: string): string => {
      return text.replace(/\{\{(\w+)\}\}/g, (match, varName) => {
        const value = variables[varName];
        if (value === undefined) {
          logger.warn('Missing template variable', { varName, templateType: template.type });
          return match;
        }
        return String(value);
      });
    };

    return {
      emailSubject: replaceVariables(template.emailSubject),
      emailBody: replaceVariables(template.emailBody),
      smsBody: replaceVariables(template.smsBody),
      inAppTitle: replaceVariables(template.inAppTitle),
      inAppBody: replaceVariables(template.inAppBody),
    };
  }

  async preview(
    type: NotificationTemplateType,
    variables: Record<string, string | number>
  ): Promise<RenderedTemplate> {
    return this.render(type, variables);
  }

  async seedDefaults(): Promise<{ created: number; skipped: number }> {
    let created = 0;
    let skipped = 0;

    for (const template of DEFAULT_TEMPLATES) {
      const existing = await this.getByType(template.type);
      if (existing) {
        skipped++;
        continue;
      }

      await this.create(template);
      created++;
    }

    logger.info('Seeded notification templates', { created, skipped });

    return { created, skipped };
  }

  async resetToDefaults(): Promise<{ updated: number; created: number }> {
    let updated = 0;
    let created = 0;

    for (const template of DEFAULT_TEMPLATES) {
      const existing = await this.getByType(template.type);
      if (existing) {
        await this.update(template.type, {
          emailSubject: template.emailSubject,
          emailBody: template.emailBody,
          smsBody: template.smsBody,
          inAppTitle: template.inAppTitle,
          inAppBody: template.inAppBody,
          variables: template.variables,
        });
        updated++;
      } else {
        await this.create(template);
        created++;
      }
    }

    logger.info('Reset notification templates to defaults', { updated, created });

    return { updated, created };
  }

  getDefaultTemplate(type: NotificationTemplateType): CreateNotificationTemplateInput | null {
    return DEFAULT_TEMPLATES.find((t) => t.type === type) || null;
  }

  getDefaultTemplateTypes(): NotificationTemplateType[] {
    return DEFAULT_TEMPLATES.map((t) => t.type);
  }
}

// Export singleton instance
export const notificationTemplateFirestoreService = new NotificationTemplateFirestoreService();
