/**
 * Unsubscribe Service
 *
 * Business logic for email unsubscribe functionality.
 *
 * **Feature: bidding-phase4-communication**
 * **Requirements: 21.1, 21.2, 21.3, 21.4**
 */

import { PrismaClient } from '@prisma/client';
import { randomBytes } from 'crypto';
import type {
  UnsubscribePreferencesInput,
  UnsubscribePageData,
  UnsubscribeResult,
} from '../schemas/unsubscribe.schema';
import { isCriticalNotificationType } from '../schemas/unsubscribe.schema';
import { DEFAULT_NOTIFICATION_PREFERENCES } from '../schemas/notification-preference.schema';

// ============================================
// UNSUBSCRIBE SERVICE CLASS
// ============================================

export class UnsubscribeService {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  // ============================================
  // TOKEN MANAGEMENT
  // ============================================

  /**
   * Generate a unique unsubscribe token for a user
   * Requirements: 21.1 - Generate unique token per user
   *
   * @param userId - User ID
   * @returns Generated token
   */
  async generateToken(userId: string): Promise<string> {
    const token = randomBytes(32).toString('hex');

    await this.prisma.user.update({
      where: { id: userId },
      data: { unsubscribeToken: token },
    });

    return token;
  }

  /**
   * Get or create unsubscribe token for a user
   * Requirements: 21.1 - Generate unique token per user
   *
   * @param userId - User ID
   * @returns Unsubscribe token
   */
  async getOrCreateToken(userId: string): Promise<string> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { unsubscribeToken: true },
    });

    if (user?.unsubscribeToken) {
      return user.unsubscribeToken;
    }

    return this.generateToken(userId);
  }

  /**
   * Validate unsubscribe token and get user
   * Requirements: 21.3 - Validate token
   *
   * @param token - Unsubscribe token
   * @returns User ID if valid, null otherwise
   */
  async validateToken(token: string): Promise<string | null> {
    const user = await this.prisma.user.findUnique({
      where: { unsubscribeToken: token },
      select: { id: true },
    });

    return user?.id || null;
  }

  // ============================================
  // UNSUBSCRIBE PAGE DATA
  // ============================================

  /**
   * Get data for unsubscribe landing page
   * Requirements: 21.2 - Show preference options
   *
   * @param token - Unsubscribe token
   * @returns Page data or null if token invalid
   */
  async getPageData(token: string): Promise<UnsubscribePageData | null> {
    const user = await this.prisma.user.findUnique({
      where: { unsubscribeToken: token },
      select: {
        email: true,
        name: true,
        notificationPreference: {
          select: {
            emailEnabled: true,
            emailBidReceived: true,
            emailBidApproved: true,
            emailProjectMatched: true,
            emailNewMessage: true,
            emailEscrowReleased: true,
          },
        },
      },
    });

    if (!user) {
      return null;
    }

    // Use default preferences if not set
    const preferences = user.notificationPreference || {
      emailEnabled: DEFAULT_NOTIFICATION_PREFERENCES.emailEnabled,
      emailBidReceived: DEFAULT_NOTIFICATION_PREFERENCES.emailBidReceived,
      emailBidApproved: DEFAULT_NOTIFICATION_PREFERENCES.emailBidApproved,
      emailProjectMatched: DEFAULT_NOTIFICATION_PREFERENCES.emailProjectMatched,
      emailNewMessage: DEFAULT_NOTIFICATION_PREFERENCES.emailNewMessage,
      emailEscrowReleased: DEFAULT_NOTIFICATION_PREFERENCES.emailEscrowReleased,
    };

    return {
      email: this.maskEmail(user.email),
      name: user.name,
      preferences,
    };
  }

  // ============================================
  // UNSUBSCRIBE OPERATIONS
  // ============================================

  /**
   * Update preferences via unsubscribe
   * Requirements: 21.3, 21.4 - Update preferences, still send critical notifications
   *
   * @param input - Unsubscribe preferences input
   * @returns Unsubscribe result
   */
  async updatePreferences(input: UnsubscribePreferencesInput): Promise<UnsubscribeResult> {
    const { token, unsubscribeAll, ...preferences } = input;

    // Validate token
    const user = await this.prisma.user.findUnique({
      where: { unsubscribeToken: token },
      select: { id: true },
    });

    if (!user) {
      throw new UnsubscribeError('INVALID_TOKEN', 'Token không hợp lệ hoặc đã hết hạn', 400);
    }

    // Prepare update data
    let updateData: Record<string, boolean> = {};

    if (unsubscribeAll) {
      // Unsubscribe from all non-critical emails
      // Requirements: 21.4 - Still send critical notifications (escrow, match)
      updateData = {
        emailEnabled: false,
        emailBidReceived: false,
        emailBidApproved: false,
        // Keep critical notifications enabled
        emailProjectMatched: true, // Critical
        emailNewMessage: false,
        emailEscrowReleased: true, // Critical
      };
    } else {
      // Apply selective preferences
      // Ensure critical notifications stay enabled
      updateData = {
        ...preferences,
        // Override critical notifications to stay enabled
        emailProjectMatched: preferences.emailProjectMatched ?? true,
        emailEscrowReleased: preferences.emailEscrowReleased ?? true,
      };
    }

    // Ensure notification preference exists
    const existingPref = await this.prisma.notificationPreference.findUnique({
      where: { userId: user.id },
    });

    let updatedPreference;

    if (existingPref) {
      updatedPreference = await this.prisma.notificationPreference.update({
        where: { userId: user.id },
        data: {
          ...updateData,
          updatedAt: new Date(),
        },
      });
    } else {
      updatedPreference = await this.prisma.notificationPreference.create({
        data: {
          userId: user.id,
          ...DEFAULT_NOTIFICATION_PREFERENCES,
          ...updateData,
        },
      });
    }

    return {
      success: true,
      message: unsubscribeAll
        ? 'Bạn đã hủy đăng ký nhận email. Bạn vẫn sẽ nhận được thông báo quan trọng về giao dịch và đặt cọc.'
        : 'Cài đặt thông báo đã được cập nhật thành công.',
      preferences: {
        emailEnabled: updatedPreference.emailEnabled,
        emailBidReceived: updatedPreference.emailBidReceived,
        emailBidApproved: updatedPreference.emailBidApproved,
        emailProjectMatched: updatedPreference.emailProjectMatched,
        emailNewMessage: updatedPreference.emailNewMessage,
        emailEscrowReleased: updatedPreference.emailEscrowReleased,
      },
    };
  }

  /**
   * Quick unsubscribe from all non-critical emails
   * Requirements: 21.3, 21.4 - Update preferences immediately
   *
   * @param token - Unsubscribe token
   * @returns Unsubscribe result
   */
  async quickUnsubscribe(token: string): Promise<UnsubscribeResult> {
    return this.updatePreferences({
      token,
      unsubscribeAll: true,
    });
  }

  // ============================================
  // EMAIL TEMPLATE HELPERS
  // ============================================

  /**
   * Generate unsubscribe URL for email footer
   * Requirements: 21.1 - Include in email footer
   *
   * @param token - Unsubscribe token
   * @param baseUrl - Base URL of the application
   * @returns Full unsubscribe URL
   */
  generateUnsubscribeUrl(token: string, baseUrl: string): string {
    return `${baseUrl}/unsubscribe?token=${token}`;
  }

  /**
   * Generate email footer HTML with unsubscribe link
   * Requirements: 21.1 - Include unsubscribe link in footer
   *
   * @param token - Unsubscribe token
   * @param baseUrl - Base URL of the application
   * @returns HTML footer string
   */
  generateEmailFooter(token: string, baseUrl: string): string {
    const unsubscribeUrl = this.generateUnsubscribeUrl(token, baseUrl);
    const preferencesUrl = `${baseUrl}/unsubscribe?token=${token}&action=preferences`;

    return `
      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280; text-align: center;">
        <p>Bạn nhận được email này vì đã đăng ký tài khoản tại Anh Thợ Xây.</p>
        <p>
          <a href="${preferencesUrl}" style="color: #2563eb; text-decoration: underline;">Quản lý cài đặt thông báo</a>
          &nbsp;|&nbsp;
          <a href="${unsubscribeUrl}" style="color: #2563eb; text-decoration: underline;">Hủy đăng ký nhận email</a>
        </p>
        <p style="margin-top: 10px;">© ${new Date().getFullYear()} Anh Thợ Xây. Mọi quyền được bảo lưu.</p>
      </div>
    `.trim();
  }

  /**
   * Check if notification type should be sent despite unsubscribe
   * Requirements: 21.4 - Still send critical notifications
   *
   * @param type - Notification type
   * @returns True if notification should always be sent
   */
  shouldSendCriticalNotification(type: string): boolean {
    return isCriticalNotificationType(type);
  }

  // ============================================
  // HELPER FUNCTIONS
  // ============================================

  /**
   * Mask email for privacy on unsubscribe page
   * Example: john.doe@example.com -> j***e@example.com
   */
  private maskEmail(email: string): string {
    const [localPart, domain] = email.split('@');
    if (localPart.length <= 2) {
      return `${localPart[0]}***@${domain}`;
    }
    return `${localPart[0]}***${localPart[localPart.length - 1]}@${domain}`;
  }
}

// ============================================
// UNSUBSCRIBE ERROR CLASS
// ============================================

export class UnsubscribeError extends Error {
  code: string;
  statusCode: number;

  constructor(code: string, message: string, statusCode?: number) {
    super(message);
    this.code = code;
    this.name = 'UnsubscribeError';

    const statusMap: Record<string, number> = {
      INVALID_TOKEN: 400,
      TOKEN_EXPIRED: 400,
      USER_NOT_FOUND: 404,
    };

    this.statusCode = statusCode || statusMap[code] || 500;
  }
}
