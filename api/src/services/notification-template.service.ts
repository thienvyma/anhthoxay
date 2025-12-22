/**
 * Notification Template Service
 *
 * Business logic for notification template management including
 * CRUD operations and variable replacement.
 *
 * **Feature: bidding-phase4-communication**
 * **Requirements: 17.1, 17.2, 17.3, 17.4**
 */

import { PrismaClient } from '@prisma/client';
import type {
  CreateNotificationTemplateInput,
  UpdateNotificationTemplateInput,
  NotificationTemplateQuery,
  NotificationTemplateResponse,
  NotificationTemplateType,
  RenderedTemplate,
} from '../schemas/notification-template.schema';
import { DEFAULT_NOTIFICATION_TEMPLATES } from '../schemas/notification-template.schema';

// ============================================
// NOTIFICATION TEMPLATE SERVICE CLASS
// ============================================

export class NotificationTemplateService {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  // ============================================
  // TEMPLATE CRUD OPERATIONS
  // ============================================

  /**
   * Get a template by type
   * Requirements: 17.1 - Use predefined templates for each notification type
   *
   * @param type - Template type
   * @returns Template or null
   */
  async getTemplate(type: NotificationTemplateType): Promise<NotificationTemplateResponse | null> {
    const template = await this.prisma.notificationTemplate.findUnique({
      where: { type },
    });

    if (!template) {
      return null;
    }

    return this.transformTemplate(template);
  }

  /**
   * Get a template by type, creating default if not exists
   * Requirements: 17.1 - Use predefined templates for each notification type
   *
   * @param type - Template type
   * @returns Template
   */
  async getOrCreateTemplate(type: NotificationTemplateType): Promise<NotificationTemplateResponse> {
    let template = await this.prisma.notificationTemplate.findUnique({
      where: { type },
    });

    if (!template) {
      // Find default template
      const defaultTemplate = DEFAULT_NOTIFICATION_TEMPLATES.find(t => t.type === type);
      
      if (!defaultTemplate) {
        throw new NotificationTemplateError(
          'TEMPLATE_NOT_FOUND',
          `No default template found for type: ${type}`,
          404
        );
      }

      // Create template from default
      template = await this.prisma.notificationTemplate.create({
        data: {
          type,
          emailSubject: defaultTemplate.emailSubject,
          emailBody: defaultTemplate.emailBody,
          smsBody: defaultTemplate.smsBody,
          inAppTitle: defaultTemplate.inAppTitle,
          inAppBody: defaultTemplate.inAppBody,
          variables: JSON.stringify(defaultTemplate.variables),
          version: 1,
        },
      });
    }

    return this.transformTemplate(template);
  }

  /**
   * List all templates
   * Requirements: 17.1 - List templates by type
   *
   * @param query - Query parameters
   * @returns List of templates
   */
  async listTemplates(query?: NotificationTemplateQuery): Promise<NotificationTemplateResponse[]> {
    const where = query?.type ? { type: query.type } : {};

    const templates = await this.prisma.notificationTemplate.findMany({
      where,
      orderBy: { type: 'asc' },
    });

    return templates.map(t => this.transformTemplate(t));
  }

  /**
   * Create a new template
   * Requirements: 17.1, 17.2 - Create templates with Vietnamese content
   *
   * @param data - Template data
   * @returns Created template
   */
  async createTemplate(data: CreateNotificationTemplateInput): Promise<NotificationTemplateResponse> {
    // Check if template already exists
    const existing = await this.prisma.notificationTemplate.findUnique({
      where: { type: data.type },
    });

    if (existing) {
      throw new NotificationTemplateError(
        'TEMPLATE_EXISTS',
        `Template for type ${data.type} already exists`,
        409
      );
    }

    const template = await this.prisma.notificationTemplate.create({
      data: {
        type: data.type,
        emailSubject: data.emailSubject,
        emailBody: data.emailBody,
        smsBody: data.smsBody,
        inAppTitle: data.inAppTitle,
        inAppBody: data.inAppBody,
        variables: JSON.stringify(data.variables),
        version: 1,
      },
    });

    return this.transformTemplate(template);
  }

  /**
   * Update an existing template
   * Requirements: 17.2, 17.4 - Edit template with version tracking
   *
   * @param type - Template type
   * @param data - Update data
   * @returns Updated template
   */
  async updateTemplate(
    type: NotificationTemplateType,
    data: UpdateNotificationTemplateInput
  ): Promise<NotificationTemplateResponse> {
    const existing = await this.prisma.notificationTemplate.findUnique({
      where: { type },
    });

    if (!existing) {
      throw new NotificationTemplateError(
        'TEMPLATE_NOT_FOUND',
        `Template for type ${type} not found`,
        404
      );
    }

    // Increment version for audit trail
    const updateData: Record<string, unknown> = {
      version: existing.version + 1,
      updatedAt: new Date(),
    };

    if (data.emailSubject !== undefined) updateData.emailSubject = data.emailSubject;
    if (data.emailBody !== undefined) updateData.emailBody = data.emailBody;
    if (data.smsBody !== undefined) updateData.smsBody = data.smsBody;
    if (data.inAppTitle !== undefined) updateData.inAppTitle = data.inAppTitle;
    if (data.inAppBody !== undefined) updateData.inAppBody = data.inAppBody;
    if (data.variables !== undefined) updateData.variables = JSON.stringify(data.variables);

    const template = await this.prisma.notificationTemplate.update({
      where: { type },
      data: updateData,
    });

    return this.transformTemplate(template);
  }

  /**
   * Delete a template
   *
   * @param type - Template type
   */
  async deleteTemplate(type: NotificationTemplateType): Promise<void> {
    const existing = await this.prisma.notificationTemplate.findUnique({
      where: { type },
    });

    if (!existing) {
      throw new NotificationTemplateError(
        'TEMPLATE_NOT_FOUND',
        `Template for type ${type} not found`,
        404
      );
    }

    await this.prisma.notificationTemplate.delete({
      where: { type },
    });
  }

  // ============================================
  // TEMPLATE RENDERING
  // ============================================

  /**
   * Render a template with variable replacement
   * Requirements: 17.3 - Replace variables with actual values
   *
   * @param type - Template type
   * @param variables - Variables to replace
   * @returns Rendered template
   */
  async renderTemplate(
    type: NotificationTemplateType,
    variables: Record<string, string | number | boolean>
  ): Promise<RenderedTemplate> {
    const template = await this.getOrCreateTemplate(type);

    return {
      emailSubject: this.replaceVariables(template.emailSubject, variables),
      emailBody: this.replaceVariables(template.emailBody, variables),
      smsBody: this.replaceVariables(template.smsBody, variables),
      inAppTitle: this.replaceVariables(template.inAppTitle, variables),
      inAppBody: this.replaceVariables(template.inAppBody, variables),
    };
  }

  /**
   * Replace template variables with actual values
   * Requirements: 17.3 - Replace variables with actual values
   *
   * @param template - Template string with {{variable}} placeholders
   * @param variables - Variables to replace
   * @returns String with variables replaced
   */
  replaceVariables(
    template: string,
    variables: Record<string, string | number | boolean>
  ): string {
    let result = template;

    for (const [key, value] of Object.entries(variables)) {
      // Replace {{variable}} pattern
      const pattern = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      // Escape $ in replacement string to prevent special replacement patterns
      // In JavaScript's String.replace(), $$ becomes $, $& inserts matched substring, etc.
      const safeValue = String(value).replace(/\$/g, '$$$$');
      result = result.replace(pattern, safeValue);
    }

    return result;
  }

  /**
   * Validate that all required variables are provided
   *
   * @param template - Template to validate against
   * @param variables - Provided variables
   * @returns List of missing variables
   */
  validateVariables(
    template: NotificationTemplateResponse,
    variables: Record<string, string | number | boolean>
  ): string[] {
    const providedKeys = Object.keys(variables);
    const requiredKeys = template.variables;

    return requiredKeys.filter(key => !providedKeys.includes(key));
  }

  // ============================================
  // SEED DEFAULT TEMPLATES
  // ============================================

  /**
   * Seed all default templates
   * Requirements: 17.1 - Predefined templates for each notification type
   */
  async seedDefaultTemplates(): Promise<number> {
    let created = 0;

    for (const defaultTemplate of DEFAULT_NOTIFICATION_TEMPLATES) {
      const existing = await this.prisma.notificationTemplate.findUnique({
        where: { type: defaultTemplate.type },
      });

      if (!existing) {
        await this.prisma.notificationTemplate.create({
          data: {
            type: defaultTemplate.type,
            emailSubject: defaultTemplate.emailSubject,
            emailBody: defaultTemplate.emailBody,
            smsBody: defaultTemplate.smsBody,
            inAppTitle: defaultTemplate.inAppTitle,
            inAppBody: defaultTemplate.inAppBody,
            variables: JSON.stringify(defaultTemplate.variables),
            version: 1,
          },
        });
        created++;
      }
    }

    return created;
  }

  // ============================================
  // HELPER FUNCTIONS
  // ============================================

  /**
   * Transform Prisma template to response format
   */
  private transformTemplate(template: {
    id: string;
    type: string;
    emailSubject: string;
    emailBody: string;
    smsBody: string;
    inAppTitle: string;
    inAppBody: string;
    variables: string;
    version: number;
    createdAt: Date;
    updatedAt: Date;
  }): NotificationTemplateResponse {
    let variables: string[] = [];
    try {
      variables = JSON.parse(template.variables);
    } catch {
      variables = [];
    }

    return {
      id: template.id,
      type: template.type as NotificationTemplateType,
      emailSubject: template.emailSubject,
      emailBody: template.emailBody,
      smsBody: template.smsBody,
      inAppTitle: template.inAppTitle,
      inAppBody: template.inAppBody,
      variables,
      version: template.version,
      createdAt: template.createdAt,
      updatedAt: template.updatedAt,
    };
  }
}

// ============================================
// NOTIFICATION TEMPLATE ERROR CLASS
// ============================================

export class NotificationTemplateError extends Error {
  code: string;
  statusCode: number;

  constructor(code: string, message: string, statusCode?: number) {
    super(message);
    this.code = code;
    this.name = 'NotificationTemplateError';

    const statusMap: Record<string, number> = {
      TEMPLATE_NOT_FOUND: 404,
      TEMPLATE_EXISTS: 409,
      INVALID_VARIABLES: 400,
      RENDER_ERROR: 500,
    };

    this.statusCode = statusCode || statusMap[code] || 500;
  }
}
