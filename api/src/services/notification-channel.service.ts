/**
 * Notification Channel Service
 *
 * Business logic for multi-channel notification management including
 * preferences, email, SMS, and in-app notifications.
 *
 * **Feature: bidding-phase4-communication**
 * **Requirements: 8.1-8.4, 9.1-9.4, 10.1-10.4, 11.1-11.4**
 */

import { PrismaClient } from '@prisma/client';
import type {
  UpdateNotificationPreferenceInput,
  NotificationPreferenceResponse,
  SendNotificationInput,
  BulkSendNotificationInput,
} from '../schemas/notification-preference.schema';
import { DEFAULT_NOTIFICATION_PREFERENCES } from '../schemas/notification-preference.schema';
import { UnsubscribeService } from './unsubscribe.service';

// ============================================
// TYPES
// ============================================

export interface NotificationDeliveryResult {
  notificationId: string;
  channels: {
    inApp: boolean;
    email: boolean;
    sms: boolean;
  };
  errors: {
    email?: string;
    sms?: string;
  };
}

export interface EmailConfig {
  provider: 'sendgrid' | 'ses' | 'mock';
  apiKey?: string;
  from: string;
  fromName: string;
  baseUrl?: string; // Base URL for unsubscribe links
}

export interface SMSConfig {
  provider: 'twilio' | 'local' | 'mock';
  accountSid?: string;
  authToken?: string;
  from: string;
}

// ============================================
// NOTIFICATION CHANNEL SERVICE CLASS
// ============================================

export class NotificationChannelService {
  private prisma: PrismaClient;
  private emailConfig: EmailConfig;
  private smsConfig: SMSConfig;
  private unsubscribeService: UnsubscribeService;

  constructor(
    prisma: PrismaClient,
    emailConfig?: Partial<EmailConfig>,
    smsConfig?: Partial<SMSConfig>
  ) {
    this.prisma = prisma;
    this.unsubscribeService = new UnsubscribeService(prisma);
    
    // Default to mock providers for development
    this.emailConfig = {
      provider: 'mock',
      from: 'noreply@noithatnhanh.vn',
      fromName: 'Nội Thất Nhanh',
      baseUrl: process.env.APP_URL || 'https://noithatnhanh.vn',
      ...emailConfig,
    };
    
    this.smsConfig = {
      provider: 'mock',
      from: '+84123456789',
      ...smsConfig,
    };
  }

  // ============================================
  // PREFERENCE MANAGEMENT
  // ============================================

  /**
   * Get notification preferences for a user
   * Requirements: 9.1 - Create default preferences if not exists
   *
   * @param userId - User ID
   * @returns Notification preferences
   */
  async getPreferences(userId: string): Promise<NotificationPreferenceResponse> {
    let preference = await this.prisma.notificationPreference.findUnique({
      where: { userId },
    });

    // Create default preferences if not exists
    if (!preference) {
      preference = await this.createDefaultPreferences(userId);
    }

    return this.transformPreference(preference);
  }

  /**
   * Update notification preferences for a user
   * Requirements: 9.2 - Validate and save new settings
   *
   * @param userId - User ID
   * @param data - Preference updates
   * @returns Updated preferences
   */
  async updatePreferences(
    userId: string,
    data: UpdateNotificationPreferenceInput
  ): Promise<NotificationPreferenceResponse> {
    // Ensure preferences exist
    const existing = await this.prisma.notificationPreference.findUnique({
      where: { userId },
    });

    if (!existing) {
      // Create with defaults then apply updates
      await this.createDefaultPreferences(userId);
    }

    const updated = await this.prisma.notificationPreference.update({
      where: { userId },
      data: {
        ...data,
        updatedAt: new Date(),
      },
    });

    return this.transformPreference(updated);
  }

  /**
   * Create default notification preferences for a new user
   * Requirements: 9.1 - Create default notification preferences
   *
   * @param userId - User ID
   * @returns Created preferences
   */
  async createDefaultPreferences(
    userId: string
  ): Promise<NotificationPreferenceResponse> {
    const preference = await this.prisma.notificationPreference.create({
      data: {
        userId,
        ...DEFAULT_NOTIFICATION_PREFERENCES,
      },
    });

    return this.transformPreference(preference);
  }


  // ============================================
  // NOTIFICATION SENDING
  // ============================================

  /**
   * Send notification to a user through configured channels
   * Requirements: 8.1, 9.3, 9.4 - Route to appropriate channels based on preferences
   *
   * @param input - Notification input
   * @returns Delivery result
   */
  async send(input: SendNotificationInput): Promise<NotificationDeliveryResult> {
    const { userId, type, title, content, data, channels } = input;

    // Get user preferences
    const preferences = await this.getPreferences(userId);

    // Get user info for email/SMS
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, phone: true, name: true },
    });

    if (!user) {
      throw new NotificationChannelError(
        'USER_NOT_FOUND',
        'Người dùng không tồn tại',
        404
      );
    }

    // Determine which channels to use
    const targetChannels = channels || ['IN_APP', 'EMAIL', 'SMS'];
    const result: NotificationDeliveryResult = {
      notificationId: '',
      channels: { inApp: false, email: false, sms: false },
      errors: {},
    };

    // Create in-app notification
    if (targetChannels.includes('IN_APP')) {
      const notification = await this.prisma.notification.create({
        data: {
          userId,
          type,
          title,
          content,
          data: data ? JSON.stringify(data) : null,
          channels: JSON.stringify(targetChannels),
        },
      });
      result.notificationId = notification.id;
      result.channels.inApp = true;
    }

    // Send email if enabled
    if (
      targetChannels.includes('EMAIL') &&
      preferences.emailEnabled &&
      this.isEmailEnabledForType(preferences, type)
    ) {
      try {
        await this.sendEmail(user.email, title, content, data, userId);
        result.channels.email = true;

        // Update notification with email status
        if (result.notificationId) {
          await this.prisma.notification.update({
            where: { id: result.notificationId },
            data: {
              emailSent: true,
              emailSentAt: new Date(),
            },
          });
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';
        result.errors.email = errorMessage;

        // Update notification with email error
        if (result.notificationId) {
          await this.prisma.notification.update({
            where: { id: result.notificationId },
            data: {
              emailError: errorMessage,
            },
          });
        }
      }
    }

    // Send SMS if enabled
    if (
      targetChannels.includes('SMS') &&
      preferences.smsEnabled &&
      this.isSMSEnabledForType(preferences, type) &&
      user.phone
    ) {
      try {
        await this.sendSMS(user.phone, this.truncateSMS(content));
        result.channels.sms = true;

        // Update notification with SMS status
        if (result.notificationId) {
          await this.prisma.notification.update({
            where: { id: result.notificationId },
            data: {
              smsSent: true,
              smsSentAt: new Date(),
            },
          });
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';
        result.errors.sms = errorMessage;

        // Update notification with SMS error
        if (result.notificationId) {
          await this.prisma.notification.update({
            where: { id: result.notificationId },
            data: {
              smsError: errorMessage,
            },
          });
        }
      }
    }

    return result;
  }

  /**
   * Send notifications to multiple users
   * Requirements: 8.1 - Support bulk notifications
   *
   * @param input - Bulk notification input
   * @returns Array of delivery results
   */
  async sendBulk(
    input: BulkSendNotificationInput
  ): Promise<NotificationDeliveryResult[]> {
    const { userIds, type, title, content, data, channels } = input;
    const results: NotificationDeliveryResult[] = [];

    for (const userId of userIds) {
      try {
        const result = await this.send({
          userId,
          type,
          title,
          content,
          data,
          channels,
        });
        results.push(result);
      } catch (error) {
        // Log error but continue with other users
        console.error(`Failed to send notification to user ${userId}:`, error);
        results.push({
          notificationId: '',
          channels: { inApp: false, email: false, sms: false },
          errors: {
            email: error instanceof Error ? error.message : 'Unknown error',
          },
        });
      }
    }

    return results;
  }


  // ============================================
  // EMAIL SERVICE
  // ============================================

  /**
   * Send email notification
   * Requirements: 10.1, 10.2, 10.3, 10.4, 21.1 - Send email with retry logic and unsubscribe link
   *
   * @param to - Recipient email
   * @param subject - Email subject
   * @param content - Email content
   * @param data - Template data
   * @param userId - User ID for unsubscribe token
   * @param retryCount - Current retry count
   */
  async sendEmail(
    to: string,
    subject: string,
    content: string,
    data?: Record<string, unknown>,
    userId?: string,
    retryCount = 0
  ): Promise<void> {
    const maxRetries = 3;

    try {
      // Get unsubscribe token if userId provided
      let unsubscribeToken: string | undefined;
      if (userId) {
        unsubscribeToken = await this.unsubscribeService.getOrCreateToken(userId);
      }

      const html = this.generateEmailHTML(subject, content, data, unsubscribeToken);

      if (this.emailConfig.provider === 'mock') {
        // Mock provider for development/testing
        // eslint-disable-next-line no-console -- Mock provider logging for development
        console.info(`[EMAIL MOCK] To: ${to}, Subject: ${subject}`);
        return;
      }

      if (this.emailConfig.provider === 'sendgrid') {
        await this.sendEmailViaSendGrid(to, subject, html);
      } else if (this.emailConfig.provider === 'ses') {
        await this.sendEmailViaSES(to, subject, html);
      }
    } catch (error) {
      // Retry with exponential backoff
      if (retryCount < maxRetries) {
        const delay = Math.pow(2, retryCount) * 1000; // 1s, 2s, 4s
        await this.sleep(delay);
        return this.sendEmail(to, subject, content, data, userId, retryCount + 1);
      }
      throw error;
    }
  }

  /**
   * Send email via SendGrid
   * Requirements: 10.1 - Use configured email provider
   */
  private async sendEmailViaSendGrid(
    to: string,
    subject: string,
    html: string
  ): Promise<void> {
    // SendGrid implementation would go here
    // For now, we'll use a mock implementation
    if (!this.emailConfig.apiKey) {
      throw new NotificationChannelError(
        'EMAIL_CONFIG_MISSING',
        'SendGrid API key not configured',
        500
      );
    }

    // In production, this would use @sendgrid/mail
    // eslint-disable-next-line no-console -- Mock provider logging for development
    console.info(`[SENDGRID] Sending email to ${to}: ${subject}, HTML length: ${html.length}`);
  }

  /**
   * Send email via AWS SES
   * Requirements: 10.1 - Use configured email provider
   */
  private async sendEmailViaSES(
    to: string,
    subject: string,
    html: string
  ): Promise<void> {
    // AWS SES implementation would go here
    // For now, we'll use a mock implementation
    // eslint-disable-next-line no-console -- Mock provider logging for development
    console.info(`[SES] Sending email to ${to}: ${subject}, HTML length: ${html.length}`);
  }

  /**
   * Generate HTML email content
   * Requirements: 10.2, 21.1 - Use HTML templates with Vietnamese content and unsubscribe link
   */
  private generateEmailHTML(
    subject: string,
    content: string,
    data?: Record<string, unknown>,
    unsubscribeToken?: string
  ): string {
    // Replace template variables
    let processedContent = content;
    if (data) {
      for (const [key, value] of Object.entries(data)) {
        processedContent = processedContent.replace(
          new RegExp(`{{${key}}}`, 'g'),
          String(value)
        );
      }
    }

    // Generate unsubscribe footer if token provided
    const unsubscribeFooter = unsubscribeToken
      ? this.unsubscribeService.generateEmailFooter(
          unsubscribeToken,
          this.emailConfig.baseUrl || 'https://noithatnhanh.vn'
        )
      : `
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280; text-align: center;">
          <p>© ${new Date().getFullYear()} ${this.emailConfig.fromName}. Mọi quyền được bảo lưu.</p>
          <p>Bạn nhận được email này vì đã đăng ký tài khoản tại ${this.emailConfig.fromName}.</p>
        </div>
      `.trim();

    return `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; }
    .footer { background: #f3f4f6; padding: 15px; text-align: center; font-size: 12px; color: #6b7280; border-radius: 0 0 8px 8px; }
    .button { display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${this.emailConfig.fromName}</h1>
    </div>
    <div class="content">
      <h2>${subject}</h2>
      <p>${processedContent}</p>
    </div>
    <div class="footer">
      ${unsubscribeFooter}
    </div>
  </div>
</body>
</html>
    `.trim();
  }


  // ============================================
  // SMS SERVICE
  // ============================================

  /**
   * Send SMS notification
   * Requirements: 11.1, 11.2, 11.3, 11.4 - Send SMS with retry logic
   *
   * @param to - Recipient phone number
   * @param message - SMS message (max 160 chars)
   * @param retryCount - Current retry count
   */
  async sendSMS(
    to: string,
    message: string,
    retryCount = 0
  ): Promise<void> {
    const maxRetries = 3;

    // Validate message length
    if (message.length > 160) {
      throw new NotificationChannelError(
        'SMS_TOO_LONG',
        'SMS message exceeds 160 characters',
        400
      );
    }

    try {
      if (this.smsConfig.provider === 'mock') {
        // Mock provider for development/testing
        // eslint-disable-next-line no-console -- Mock provider logging for development
        console.info(`[SMS MOCK] To: ${to}, Message: ${message}`);
        return;
      }

      if (this.smsConfig.provider === 'twilio') {
        await this.sendSMSViaTwilio(to, message);
      } else if (this.smsConfig.provider === 'local') {
        await this.sendSMSViaLocalProvider(to, message);
      }
    } catch (error) {
      // Retry with exponential backoff
      if (retryCount < maxRetries) {
        const delay = Math.pow(2, retryCount) * 1000; // 1s, 2s, 4s
        await this.sleep(delay);
        return this.sendSMS(to, message, retryCount + 1);
      }
      throw error;
    }
  }

  /**
   * Send SMS via Twilio
   * Requirements: 11.1 - Use configured SMS provider
   */
  private async sendSMSViaTwilio(to: string, message: string): Promise<void> {
    // Twilio implementation would go here
    // For now, we'll use a mock implementation
    if (!this.smsConfig.accountSid || !this.smsConfig.authToken) {
      throw new NotificationChannelError(
        'SMS_CONFIG_MISSING',
        'Twilio credentials not configured',
        500
      );
    }

    // In production, this would use twilio SDK
    // eslint-disable-next-line no-console -- Mock provider logging for development
    console.info(`[TWILIO] Sending SMS to ${to}: ${message}`);
  }

  /**
   * Send SMS via local provider (Vietnam)
   * Requirements: 11.1 - Use configured SMS provider
   */
  private async sendSMSViaLocalProvider(
    to: string,
    message: string
  ): Promise<void> {
    // Local Vietnam SMS provider implementation would go here
    // eslint-disable-next-line no-console -- Mock provider logging for development
    console.info(`[LOCAL SMS] Sending SMS to ${to}: ${message}`);
  }

  /**
   * Truncate message to 160 characters for SMS
   * Requirements: 11.2 - Format message within 160 characters
   */
  private truncateSMS(message: string): string {
    if (message.length <= 160) {
      return message;
    }
    return message.substring(0, 157) + '...';
  }

  // ============================================
  // HELPER FUNCTIONS
  // ============================================

  /**
   * Check if email is enabled for a specific notification type
   * Requirements: 9.3, 9.4 - Respect user preferences
   */
  private isEmailEnabledForType(
    preferences: NotificationPreferenceResponse,
    type: string
  ): boolean {
    const typeMap: Record<string, keyof NotificationPreferenceResponse> = {
      BID_RECEIVED: 'emailBidReceived',
      BID_SELECTED: 'emailBidApproved',
      BID_NOT_SELECTED: 'emailBidApproved',
      PROJECT_MATCHED: 'emailProjectMatched',
      NEW_MESSAGE: 'emailNewMessage',
      ESCROW_HELD: 'emailEscrowReleased',
      ESCROW_RELEASED: 'emailEscrowReleased',
      ESCROW_REFUNDED: 'emailEscrowReleased',
    };

    const preferenceKey = typeMap[type];
    if (!preferenceKey) {
      return true; // Default to enabled for unknown types
    }

    return preferences[preferenceKey] as boolean;
  }

  /**
   * Check if SMS is enabled for a specific notification type
   * Requirements: 9.3, 9.4 - Respect user preferences
   */
  private isSMSEnabledForType(
    preferences: NotificationPreferenceResponse,
    type: string
  ): boolean {
    const typeMap: Record<string, keyof NotificationPreferenceResponse> = {
      BID_RECEIVED: 'smsBidReceived',
      BID_SELECTED: 'smsBidApproved',
      BID_NOT_SELECTED: 'smsBidApproved',
      PROJECT_MATCHED: 'smsProjectMatched',
      NEW_MESSAGE: 'smsNewMessage',
      ESCROW_HELD: 'smsEscrowReleased',
      ESCROW_RELEASED: 'smsEscrowReleased',
      ESCROW_REFUNDED: 'smsEscrowReleased',
    };

    const preferenceKey = typeMap[type];
    if (!preferenceKey) {
      return false; // Default to disabled for unknown types (SMS is expensive)
    }

    return preferences[preferenceKey] as boolean;
  }

  /**
   * Transform preference from Prisma to response format
   */
  private transformPreference(preference: {
    id: string;
    userId: string;
    emailEnabled: boolean;
    emailBidReceived: boolean;
    emailBidApproved: boolean;
    emailProjectMatched: boolean;
    emailNewMessage: boolean;
    emailEscrowReleased: boolean;
    smsEnabled: boolean;
    smsBidReceived: boolean;
    smsBidApproved: boolean;
    smsProjectMatched: boolean;
    smsNewMessage: boolean;
    smsEscrowReleased: boolean;
    createdAt: Date;
    updatedAt: Date;
  }): NotificationPreferenceResponse {
    return {
      id: preference.id,
      userId: preference.userId,
      emailEnabled: preference.emailEnabled,
      emailBidReceived: preference.emailBidReceived,
      emailBidApproved: preference.emailBidApproved,
      emailProjectMatched: preference.emailProjectMatched,
      emailNewMessage: preference.emailNewMessage,
      emailEscrowReleased: preference.emailEscrowReleased,
      smsEnabled: preference.smsEnabled,
      smsBidReceived: preference.smsBidReceived,
      smsBidApproved: preference.smsBidApproved,
      smsProjectMatched: preference.smsProjectMatched,
      smsNewMessage: preference.smsNewMessage,
      smsEscrowReleased: preference.smsEscrowReleased,
      createdAt: preference.createdAt,
      updatedAt: preference.updatedAt,
    };
  }

  /**
   * Sleep helper for retry delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// ============================================
// NOTIFICATION CHANNEL ERROR CLASS
// ============================================

export class NotificationChannelError extends Error {
  code: string;
  statusCode: number;

  constructor(code: string, message: string, statusCode?: number) {
    super(message);
    this.code = code;
    this.name = 'NotificationChannelError';

    const statusMap: Record<string, number> = {
      USER_NOT_FOUND: 404,
      PREFERENCE_NOT_FOUND: 404,
      EMAIL_CONFIG_MISSING: 500,
      SMS_CONFIG_MISSING: 500,
      SMS_TOO_LONG: 400,
      EMAIL_SEND_FAILED: 500,
      SMS_SEND_FAILED: 500,
    };

    this.statusCode = statusCode || statusMap[code] || 500;
  }
}
