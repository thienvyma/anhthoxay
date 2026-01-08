/**
 * Quotation Email Utilities
 * Handles PDF filename generation and email template creation
 *
 * **Feature: furniture-quotation-email**
 * **Validates: Requirements 3.5, 7.4**
 */

import type { PrismaClient } from '@prisma/client';

// Default email settings (fallback when no settings in DB)
export const defaultEmailSettings = {
  brandName: 'NỘI THẤT NHANH',
  tagline: 'Đối tác tin cậy cho ngôi nhà của bạn',
  subjectTemplate: '[NỘI THẤT NHANH] Báo giá nội thất - Căn hộ {{unitNumber}}',
  
  greetingTemplate: 'Xin chào {{leadName}},',
  introText: 'Cảm ơn bạn đã sử dụng dịch vụ báo giá nội thất của {{brandName}}. Chúng tôi đã chuẩn bị báo giá chi tiết cho căn hộ của bạn.',
  
  infoBoxTitle: 'Thông tin căn hộ',
  labelProject: 'Dự án',
  labelBuilding: 'Tòa nhà',
  labelUnit: 'Căn hộ',
  labelApartmentType: 'Loại căn hộ',
  
  attachmentNotice: 'Vui lòng xem file PDF đính kèm để biết chi tiết báo giá đầy đủ bao gồm danh sách sản phẩm, giá từng hạng mục và tổng chi phí.',
  disclaimerText: 'Báo giá này chỉ mang tính chất tham khảo. Giá thực tế có thể thay đổi tùy theo thời điểm, nguồn cung vật liệu và điều kiện thi công cụ thể. Vui lòng liên hệ với chúng tôi để được tư vấn chi tiết.',
  
  ctaQuestion: 'Bạn có câu hỏi hoặc cần tư vấn thêm?',
  ctaButtonText: 'Liên hệ ngay',
  ctaButtonLink: 'https://noithatnhanh.vn/lien-he',
  
  signatureClosing: 'Trân trọng,',
  signatureTeam: 'Đội ngũ tư vấn nội thất',
  
  footerCopyright: '© {{year}} NỘI THẤT NHANH',
  footerWebsite: 'noithatnhanh.vn',
  footerHotline: '1900-xxxx',
  spamNotice: 'Nếu bạn không thấy email này trong hộp thư đến, vui lòng kiểm tra thư mục Spam.',
};

export type EmailSettings = typeof defaultEmailSettings;

/**
 * Get email settings from database, fallback to defaults
 */
export async function getEmailSettings(prisma: PrismaClient): Promise<EmailSettings> {
  try {
    const setting = await prisma.settings.findUnique({ where: { key: 'email' } });
    if (setting?.value) {
      const parsed = JSON.parse(setting.value);
      return { ...defaultEmailSettings, ...parsed };
    }
  } catch (error) {
    console.error('Failed to load email settings:', error);
  }
  return defaultEmailSettings;
}

/**
 * Sanitize unit number for safe filename usage
 */
export function sanitizeFilename(unitNumber: string): string {
  return unitNumber
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9.-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
}

/**
 * Generate PDF filename for quotation
 */
export function generateQuotationFilename(unitNumber: string, date?: Date): string {
  const sanitizedUnit = sanitizeFilename(unitNumber);
  const dateStr = (date || new Date()).toISOString().split('T')[0];
  return `bao-gia-${sanitizedUnit}-${dateStr}.pdf`;
}

export interface QuotationEmailData {
  leadName: string;
  projectName: string;
  buildingName: string;
  unitNumber: string;
  apartmentType: string;
}

/**
 * Generate email subject for quotation
 */
export function generateQuotationEmailSubject(unitNumber: string, settings: EmailSettings = defaultEmailSettings): string {
  return settings.subjectTemplate.replace('{{unitNumber}}', unitNumber);
}


/**
 * Generate clean, professional Vietnamese email HTML template for quotation
 * Minimal design - no gradients, simple colors
 */
export function generateQuotationEmailHtml(data: QuotationEmailData, settings: EmailSettings = defaultEmailSettings): string {
  const { leadName, projectName, buildingName, unitNumber, apartmentType } = data;
  const currentYear = new Date().getFullYear().toString();

  const greeting = settings.greetingTemplate.replace('{{leadName}}', leadName);
  const intro = settings.introText.replace('{{brandName}}', settings.brandName);
  const copyright = settings.footerCopyright.replace('{{year}}', currentYear);

  return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Báo giá nội thất - ${unitNumber}</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f9f9f9;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9f9f9; padding: 20px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border: 1px solid #e0e0e0;">
          
          <!-- Header -->
          <tr>
            <td style="padding: 24px 30px; border-bottom: 2px solid #d4a84b;">
              <h1 style="margin: 0; font-size: 22px; color: #333; font-weight: 600;">${settings.brandName}</h1>
              <p style="margin: 4px 0 0 0; font-size: 13px; color: #666;">${settings.tagline}</p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 30px;">
              
              <!-- Greeting -->
              <p style="margin: 0 0 16px 0; font-size: 15px;">${greeting.replace(leadName, `<strong>${leadName}</strong>`)}</p>
              <p style="margin: 0 0 24px 0; font-size: 15px; color: #444;">${intro}</p>
              
              <!-- Info Box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8f8f8; border: 1px solid #e8e8e8; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 16px 20px;">
                    <p style="margin: 0 0 12px 0; font-size: 14px; font-weight: 600; color: #333;">${settings.infoBoxTitle}</p>
                    <table width="100%" cellpadding="0" cellspacing="0" style="font-size: 14px;">
                      <tr>
                        <td style="padding: 6px 0; color: #666; width: 120px;">${settings.labelProject}:</td>
                        <td style="padding: 6px 0; color: #333;">${projectName}</td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0; color: #666;">${settings.labelBuilding}:</td>
                        <td style="padding: 6px 0; color: #333;">${buildingName}</td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0; color: #666;">${settings.labelUnit}:</td>
                        <td style="padding: 6px 0; color: #333;">${unitNumber}</td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0; color: #666;">${settings.labelApartmentType}:</td>
                        <td style="padding: 6px 0; color: #333;">${apartmentType.toUpperCase()}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              
              <!-- Attachment Notice -->
              <p style="margin: 0 0 16px 0; font-size: 14px; color: #333;">
                <strong>📎 File đính kèm:</strong> ${settings.attachmentNotice}
              </p>
              
              <!-- Disclaimer -->
              <p style="margin: 0 0 24px 0; font-size: 13px; color: #666; font-style: italic; padding: 12px; background-color: #fffbf0; border-left: 3px solid #d4a84b;">
                <strong>Lưu ý:</strong> ${settings.disclaimerText}
              </p>
              
              <!-- CTA -->
              <p style="margin: 0 0 16px 0; font-size: 14px; color: #444;">${settings.ctaQuestion}</p>
              <p style="margin: 0 0 24px 0;">
                <a href="${settings.ctaButtonLink}" style="display: inline-block; background-color: #d4a84b; color: #fff; text-decoration: none; padding: 10px 24px; font-size: 14px; font-weight: 500; border-radius: 4px;">${settings.ctaButtonText}</a>
              </p>
              
              <!-- Signature -->
              <p style="margin: 24px 0 0 0; padding-top: 20px; border-top: 1px solid #e8e8e8; font-size: 14px; color: #444;">
                ${settings.signatureClosing}<br>
                <strong style="color: #d4a84b;">${settings.brandName}</strong><br>
                <span style="font-size: 13px; color: #666;">${settings.signatureTeam}</span>
              </p>
              
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 16px 30px; background-color: #f5f5f5; border-top: 1px solid #e0e0e0;">
              <p style="margin: 0 0 4px 0; font-size: 12px; color: #666;">${copyright}</p>
              <p style="margin: 0 0 8px 0; font-size: 12px; color: #888;">Website: ${settings.footerWebsite} | Hotline: ${settings.footerHotline}</p>
              <p style="margin: 0; font-size: 11px; color: #999; font-style: italic;">${settings.spamNotice}</p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
