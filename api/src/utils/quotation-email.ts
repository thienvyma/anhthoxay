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
  brandName: 'ANH THỢ XÂY',
  tagline: 'Đối tác tin cậy cho ngôi nhà của bạn',
  subjectTemplate: '[ANH THỢ XÂY] Báo giá nội thất - Căn hộ {{unitNumber}}',
  
  greetingTemplate: 'Xin chào {{leadName}},',
  introText: 'Cảm ơn bạn đã sử dụng dịch vụ báo giá nội thất của {{brandName}}. Chúng tôi đã chuẩn bị báo giá chi tiết cho căn hộ của bạn.',
  
  infoBoxTitle: '📍 Thông tin căn hộ',
  labelProject: 'Dự án',
  labelBuilding: 'Tòa nhà',
  labelUnit: 'Căn hộ',
  labelApartmentType: 'Loại căn hộ',
  
  attachmentNotice: 'Vui lòng xem file PDF đính kèm để biết chi tiết báo giá đầy đủ bao gồm danh sách sản phẩm, giá từng hạng mục và tổng chi phí.',
  disclaimerText: 'Báo giá này chỉ mang tính chất tham khảo. Giá thực tế có thể thay đổi tùy theo thời điểm, nguồn cung vật liệu và điều kiện thi công cụ thể. Vui lòng liên hệ với chúng tôi để được tư vấn chi tiết.',
  
  ctaQuestion: 'Bạn có câu hỏi hoặc cần tư vấn thêm?',
  ctaButtonText: 'Liên hệ ngay',
  ctaButtonLink: 'https://anhthoxay.com/lien-he',
  
  signatureClosing: 'Trân trọng,',
  signatureTeam: 'Đội ngũ tư vấn nội thất',
  
  footerCopyright: '© {{year}} ANH THỢ XÂY - Đối tác tin cậy cho ngôi nhà của bạn',
  footerWebsite: 'anhthoxay.com',
  footerHotline: '1900-xxxx',
  spamNotice: '📧 Nếu bạn không thấy email này trong hộp thư đến, vui lòng kiểm tra thư mục Spam hoặc Quảng cáo.',
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
 * Generate professional Vietnamese email HTML template for quotation
 * Uses settings from database for customizable content
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
  <style>
    body, table, td, p, a, li, blockquote { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    body { margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333333; background-color: #f5f5f5; }
    .email-container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
    .header { background: linear-gradient(135deg, #F5D393 0%, #E8C078 100%); padding: 30px 20px; text-align: center; }
    .header h1 { margin: 0; color: #333333; font-size: 28px; font-weight: 700; letter-spacing: 1px; }
    .header .tagline { margin: 8px 0 0 0; color: #555555; font-size: 14px; font-weight: 400; }
    .content { padding: 30px 25px; background-color: #ffffff; }
    .greeting { font-size: 16px; margin-bottom: 20px; }
    .greeting strong { color: #333333; }
    .info-box { background-color: #faf8f5; border-left: 4px solid #F5D393; padding: 20px; margin: 25px 0; border-radius: 0 8px 8px 0; }
    .info-box h3 { margin: 0 0 15px 0; color: #333333; font-size: 16px; font-weight: 600; }
    .info-box ul { margin: 0; padding: 0; list-style: none; }
    .info-box li { padding: 8px 0; border-bottom: 1px solid #eee; font-size: 14px; }
    .info-box li:last-child { border-bottom: none; }
    .info-box li strong { color: #666666; display: inline-block; min-width: 100px; }
    .attachment-notice { background-color: #e8f4e8; border: 1px solid #c3e6c3; border-radius: 8px; padding: 15px 20px; margin: 25px 0; display: flex; align-items: center; }
    .attachment-notice .icon { font-size: 24px; margin-right: 15px; }
    .attachment-notice p { margin: 0; font-size: 14px; color: #2d5a2d; }
    .note { background-color: #fff9e6; border: 1px solid #f0e6b8; border-radius: 8px; padding: 15px 20px; margin: 25px 0; font-size: 13px; color: #666666; font-style: italic; }
    .cta-section { text-align: center; margin: 30px 0; padding: 20px; background-color: #faf8f5; border-radius: 8px; }
    .cta-section p { margin: 0 0 15px 0; font-size: 14px; color: #666666; }
    .cta-button { display: inline-block; background: linear-gradient(135deg, #F5D393 0%, #E8C078 100%); color: #333333; text-decoration: none; padding: 12px 30px; border-radius: 25px; font-weight: 600; font-size: 14px; }
    .signature { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eeeeee; }
    .signature p { margin: 5px 0; font-size: 14px; }
    .signature .brand { color: #d4a84b; font-weight: 700; font-size: 16px; }
    .footer { background-color: #333333; padding: 25px 20px; text-align: center; }
    .footer p { margin: 5px 0; color: #999999; font-size: 12px; }
    .footer .copyright { color: #F5D393; font-weight: 500; }
    .footer .spam-notice { margin-top: 15px; padding-top: 15px; border-top: 1px solid #444444; font-style: italic; }
    @media only screen and (max-width: 600px) { .email-container { width: 100% !important; } .content { padding: 20px 15px !important; } .header h1 { font-size: 24px !important; } }
  </style>
</head>
<body>
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f5f5f5;">
    <tr>
      <td style="padding: 20px 10px;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" class="email-container" style="margin: 0 auto; max-width: 600px; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <tr>
            <td class="header" style="background: linear-gradient(135deg, #F5D393 0%, #E8C078 100%); padding: 30px 20px; text-align: center;">
              <h1 style="margin: 0; color: #333333; font-size: 28px; font-weight: 700; letter-spacing: 1px;">${settings.brandName}</h1>
              <p class="tagline" style="margin: 8px 0 0 0; color: #555555; font-size: 14px; font-weight: 400;">${settings.tagline}</p>
            </td>
          </tr>
          <tr>
            <td class="content" style="padding: 30px 25px; background-color: #ffffff;">
              <p class="greeting" style="font-size: 16px; margin-bottom: 20px;">${greeting.replace(leadName, `<strong>${leadName}</strong>`)}</p>
              <p style="font-size: 15px; color: #444444; margin-bottom: 20px;">${intro}</p>
              <div class="info-box" style="background-color: #faf8f5; border-left: 4px solid #F5D393; padding: 20px; margin: 25px 0; border-radius: 0 8px 8px 0;">
                <h3 style="margin: 0 0 15px 0; color: #333333; font-size: 16px; font-weight: 600;">${settings.infoBoxTitle}</h3>
                <ul style="margin: 0; padding: 0; list-style: none;">
                  <li style="padding: 8px 0; border-bottom: 1px solid #eee; font-size: 14px;"><strong style="color: #666666; display: inline-block; min-width: 100px;">${settings.labelProject}:</strong> ${projectName}</li>
                  <li style="padding: 8px 0; border-bottom: 1px solid #eee; font-size: 14px;"><strong style="color: #666666; display: inline-block; min-width: 100px;">${settings.labelBuilding}:</strong> ${buildingName}</li>
                  <li style="padding: 8px 0; border-bottom: 1px solid #eee; font-size: 14px;"><strong style="color: #666666; display: inline-block; min-width: 100px;">${settings.labelUnit}:</strong> ${unitNumber}</li>
                  <li style="padding: 8px 0; font-size: 14px;"><strong style="color: #666666; display: inline-block; min-width: 100px;">${settings.labelApartmentType}:</strong> ${apartmentType.toUpperCase()}</li>
                </ul>
              </div>
              <div class="attachment-notice" style="background-color: #e8f4e8; border: 1px solid #c3e6c3; border-radius: 8px; padding: 15px 20px; margin: 25px 0;">
                <span class="icon" style="font-size: 24px; margin-right: 15px;">📎</span>
                <p style="margin: 0; font-size: 14px; color: #2d5a2d;"><strong>File đính kèm:</strong> ${settings.attachmentNotice}</p>
              </div>
              <div class="note" style="background-color: #fff9e6; border: 1px solid #f0e6b8; border-radius: 8px; padding: 15px 20px; margin: 25px 0; font-size: 13px; color: #666666; font-style: italic;">
                <strong>⚠️ Lưu ý:</strong> ${settings.disclaimerText}
              </div>
              <div class="cta-section" style="text-align: center; margin: 30px 0; padding: 20px; background-color: #faf8f5; border-radius: 8px;">
                <p style="margin: 0 0 15px 0; font-size: 14px; color: #666666;">${settings.ctaQuestion}</p>
                <a href="${settings.ctaButtonLink}" class="cta-button" style="display: inline-block; background: linear-gradient(135deg, #F5D393 0%, #E8C078 100%); color: #333333; text-decoration: none; padding: 12px 30px; border-radius: 25px; font-weight: 600; font-size: 14px;">${settings.ctaButtonText}</a>
              </div>
              <div class="signature" style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eeeeee;">
                <p style="margin: 5px 0; font-size: 14px;">${settings.signatureClosing}</p>
                <p class="brand" style="color: #d4a84b; font-weight: 700; font-size: 16px; margin: 5px 0;">${settings.brandName}</p>
                <p style="margin: 5px 0; font-size: 13px; color: #888888;">${settings.signatureTeam}</p>
              </div>
            </td>
          </tr>
          <tr>
            <td class="footer" style="background-color: #333333; padding: 25px 20px; text-align: center;">
              <p class="copyright" style="margin: 5px 0; color: #F5D393; font-weight: 500; font-size: 12px;">${copyright}</p>
              <p style="margin: 5px 0; color: #999999; font-size: 12px;">Website: ${settings.footerWebsite} | Hotline: ${settings.footerHotline}</p>
              <p class="spam-notice" style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #444444; font-style: italic; color: #999999; font-size: 12px;">${settings.spamNotice}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
