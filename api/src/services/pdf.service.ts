/**
 * PDF Service Module
 *
 * Handles PDF generation for furniture quotations
 *
 * **Feature: furniture-quotation**
 * **Requirements: 8.2**
 * 
 * **Font Setup:**
 * For Vietnamese text support, download Noto Sans fonts to api/fonts/:
 * - NotoSans-Regular.ttf
 * - NotoSans-Bold.ttf
 * 
 * Download from: https://fonts.google.com/noto/specimen/Noto+Sans
 * Or use: https://github.com/googlefonts/noto-fonts/tree/main/hinted/ttf/NotoSans
 */

import PDFDocument from 'pdfkit';
import type { FurnitureQuotation, FurniturePdfSettings } from '@prisma/client';
import { PrismaClient } from '@prisma/client';
import * as path from 'path';
import * as fs from 'fs';

// ============================================
// TYPES
// ============================================

/**
 * Quotation item with material and Fit-in support
 * 
 * **Feature: furniture-product-mapping**
 * **Validates: Requirements 8.3**
 */
export interface QuotationItem {
  productId: string;
  name: string;
  material?: string;              // NEW: Material variant
  price: number;                  // Base price (calculatedPrice)
  quantity: number;
  fitInSelected?: boolean;        // NEW: Whether Fit-in is selected
  fitInFee?: number;              // NEW: Fit-in fee amount (if selected)
}

export interface QuotationFee {
  name: string;
  type: 'FIXED' | 'PERCENTAGE';
  value: number;
  amount: number;
}

// Default settings (used if no settings in DB)
const DEFAULT_SETTINGS: Omit<FurniturePdfSettings, 'id' | 'createdAt' | 'updatedAt'> = {
  companyName: 'ANH THO XAY',
  companyTagline: 'Doi tac tin cay cho ngoi nha cua ban',
  companyLogo: null,
  documentTitle: 'BAO GIA NOI THAT',
  primaryColor: '#F5D393',
  textColor: '#333333',
  mutedColor: '#666666',
  borderColor: '#E0E0E0',
  companyNameSize: 24,
  documentTitleSize: 18,
  sectionTitleSize: 12,
  bodyTextSize: 10,
  footerTextSize: 8,
  apartmentInfoTitle: 'THONG TIN CAN HO',
  productsTitle: 'SAN PHAM DA CHON',
  priceDetailsTitle: 'CHI TIET GIA',
  contactInfoTitle: 'THONG TIN LIEN HE',
  totalLabel: 'TONG CONG',
  footerNote: 'Bao gia nay chi mang tinh chat tham khao. Gia thuc te co the thay doi tuy theo thoi diem va dieu kien cu the.',
  footerCopyright: '© ANH THO XAY - Doi tac tin cay cho ngoi nha cua ban',
  contactPhone: null,
  contactEmail: null,
  contactAddress: null,
  contactWebsite: null,
  additionalNotes: null,
  validityDays: 30,
  showLayoutImage: true,
  showItemsTable: true,
  showFeeDetails: true,
  showContactInfo: false,
  showValidityDate: true,
  showQuotationCode: true,
};

// ============================================
// FONT HELPERS
// ============================================

/**
 * Check if fonts directory exists and has required fonts
 */
function getFontsPath(): { regular: string | null; bold: string | null } {
  const fontsDir = path.join(__dirname, '../../fonts');
  const regularPath = path.join(fontsDir, 'NotoSans-Regular.ttf');
  const boldPath = path.join(fontsDir, 'NotoSans-Bold.ttf');
  
  return {
    regular: fs.existsSync(regularPath) ? regularPath : null,
    bold: fs.existsSync(boldPath) ? boldPath : null,
  };
}

/**
 * Remove Vietnamese diacritics for fallback font support
 */
function removeVietnameseDiacritics(str: string): string {
  const diacriticsMap: Record<string, string> = {
    'à': 'a', 'á': 'a', 'ả': 'a', 'ã': 'a', 'ạ': 'a',
    'ă': 'a', 'ằ': 'a', 'ắ': 'a', 'ẳ': 'a', 'ẵ': 'a', 'ặ': 'a',
    'â': 'a', 'ầ': 'a', 'ấ': 'a', 'ẩ': 'a', 'ẫ': 'a', 'ậ': 'a',
    'đ': 'd',
    'è': 'e', 'é': 'e', 'ẻ': 'e', 'ẽ': 'e', 'ẹ': 'e',
    'ê': 'e', 'ề': 'e', 'ế': 'e', 'ể': 'e', 'ễ': 'e', 'ệ': 'e',
    'ì': 'i', 'í': 'i', 'ỉ': 'i', 'ĩ': 'i', 'ị': 'i',
    'ò': 'o', 'ó': 'o', 'ỏ': 'o', 'õ': 'o', 'ọ': 'o',
    'ô': 'o', 'ồ': 'o', 'ố': 'o', 'ổ': 'o', 'ỗ': 'o', 'ộ': 'o',
    'ơ': 'o', 'ờ': 'o', 'ớ': 'o', 'ở': 'o', 'ỡ': 'o', 'ợ': 'o',
    'ù': 'u', 'ú': 'u', 'ủ': 'u', 'ũ': 'u', 'ụ': 'u',
    'ư': 'u', 'ừ': 'u', 'ứ': 'u', 'ử': 'u', 'ữ': 'u', 'ự': 'u',
    'ỳ': 'y', 'ý': 'y', 'ỷ': 'y', 'ỹ': 'y', 'ỵ': 'y',
    'À': 'A', 'Á': 'A', 'Ả': 'A', 'Ã': 'A', 'Ạ': 'A',
    'Ă': 'A', 'Ằ': 'A', 'Ắ': 'A', 'Ẳ': 'A', 'Ẵ': 'A', 'Ặ': 'A',
    'Â': 'A', 'Ầ': 'A', 'Ấ': 'A', 'Ẩ': 'A', 'Ẫ': 'A', 'Ậ': 'A',
    'Đ': 'D',
    'È': 'E', 'É': 'E', 'Ẻ': 'E', 'Ẽ': 'E', 'Ẹ': 'E',
    'Ê': 'E', 'Ề': 'E', 'Ế': 'E', 'Ể': 'E', 'Ễ': 'E', 'Ệ': 'E',
    'Ì': 'I', 'Í': 'I', 'Ỉ': 'I', 'Ĩ': 'I', 'Ị': 'I',
    'Ò': 'O', 'Ó': 'O', 'Ỏ': 'O', 'Õ': 'O', 'Ọ': 'O',
    'Ô': 'O', 'Ồ': 'O', 'Ố': 'O', 'Ổ': 'O', 'Ỗ': 'O', 'Ộ': 'O',
    'Ơ': 'O', 'Ờ': 'O', 'Ớ': 'O', 'Ở': 'O', 'Ỡ': 'O', 'Ợ': 'O',
    'Ù': 'U', 'Ú': 'U', 'Ủ': 'U', 'Ũ': 'U', 'Ụ': 'U',
    'Ư': 'U', 'Ừ': 'U', 'Ứ': 'U', 'Ử': 'U', 'Ữ': 'U', 'Ự': 'U',
    'Ỳ': 'Y', 'Ý': 'Y', 'Ỷ': 'Y', 'Ỹ': 'Y', 'Ỵ': 'Y',
  };
  
  return str.split('').map(char => diacriticsMap[char] || char).join('');
}

// ============================================
// PDF SERVICE
// ============================================

/**
 * Get PDF settings from database or use defaults
 */
async function getPdfSettings(prisma?: PrismaClient): Promise<typeof DEFAULT_SETTINGS> {
  if (!prisma) return DEFAULT_SETTINGS;

  try {
    const settings = await prisma.furniturePdfSettings.findUnique({ where: { id: 'default' } });
    if (settings) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { id: _id, createdAt: _createdAt, updatedAt: _updatedAt, ...rest } = settings;
      return rest;
    }
  } catch {
    // Ignore errors, use defaults
  }
  return DEFAULT_SETTINGS;
}

/**
 * Generate a PDF document for a furniture quotation
 * @param quotation - The quotation data
 * @param prisma - Optional Prisma client to fetch settings
 * @returns Buffer containing the PDF
 * _Requirements: 8.2_
 */
export async function generateQuotationPDF(
  quotation: FurnitureQuotation,
  prisma?: PrismaClient
): Promise<Buffer> {
  const settings = await getPdfSettings(prisma);
  const fonts = getFontsPath();
  const hasVietnameseFont = fonts.regular !== null;

  // Helper to process text based on font availability
  const processText = (text: string): string => {
    if (hasVietnameseFont) return text;
    return removeVietnameseDiacritics(text);
  };

  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 50,
        info: {
          Title: `${processText(settings.documentTitle)} - ${quotation.unitNumber}`,
          Author: processText(settings.companyName),
          Subject: 'Furniture Quotation',
        },
      });

      // Register fonts for Vietnamese support
      let fontName = 'Helvetica';
      let fontNameBold = 'Helvetica-Bold';
      
      if (fonts.regular) {
        try {
          doc.registerFont('NotoSans', fonts.regular);
          fontName = 'NotoSans';
          if (fonts.bold) {
            doc.registerFont('NotoSans-Bold', fonts.bold);
            fontNameBold = 'NotoSans-Bold';
          } else {
            fontNameBold = 'NotoSans';
          }
        } catch (fontError) {
          console.warn('Failed to load custom fonts, using Helvetica:', fontError);
        }
      }
      
      doc.font(fontName);

      const chunks: Buffer[] = [];
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Parse JSON fields
      const items: QuotationItem[] =
        typeof quotation.items === 'string' ? JSON.parse(quotation.items) : quotation.items || [];
      const fees: QuotationFee[] =
        typeof quotation.fees === 'string' ? JSON.parse(quotation.fees) : quotation.fees || [];

      // Colors from settings
      const primaryColor = settings.primaryColor;
      const textColor = settings.textColor;
      const mutedColor = settings.mutedColor;
      const borderColor = settings.borderColor;

      // Font sizes from settings
      const companyNameSize = settings.companyNameSize;
      const documentTitleSize = settings.documentTitleSize;
      const sectionTitleSize = settings.sectionTitleSize;
      const bodyTextSize = settings.bodyTextSize;
      const footerTextSize = settings.footerTextSize;

      // ============================================
      // HEADER
      // ============================================

      // Company name (bold)
      doc.font(fontNameBold).fontSize(companyNameSize).fillColor(primaryColor).text(processText(settings.companyName), 50, 50, { align: 'left' });

      // Document title (bold)
      doc
        .font(fontNameBold)
        .fontSize(documentTitleSize)
        .fillColor(textColor)
        .text(processText(settings.documentTitle), 50, 50 + companyNameSize + 10, { align: 'left' });

      // Date and Code (regular)
      doc.font(fontName);
      const createdDate = new Date(quotation.createdAt);
      doc.fontSize(bodyTextSize).fillColor(mutedColor).text(processText(`Ngày: ${createdDate.toLocaleDateString('vi-VN')}`), 400, 50, { align: 'right' });

      if (settings.showQuotationCode) {
        doc.text(processText(`Mã: ${quotation.id.slice(-8).toUpperCase()}`), 400, 50 + bodyTextSize + 5, { align: 'right' });
      }

      // Horizontal line
      const headerEndY = 50 + companyNameSize + documentTitleSize + 30;
      doc.moveTo(50, headerEndY).lineTo(545, headerEndY).strokeColor(borderColor).stroke();

      // ============================================
      // APARTMENT INFO
      // ============================================

      let yPos = headerEndY + 20;

      doc.font(fontNameBold).fontSize(sectionTitleSize).fillColor(primaryColor).text(processText(settings.apartmentInfoTitle), 50, yPos);

      yPos += sectionTitleSize + 12;

      // Info table
      const infoData = [
        [processText('Chủ đầu tư:'), processText(quotation.developerName)],
        [processText('Dự án:'), processText(quotation.projectName)],
        [processText('Tòa nhà:'), processText(quotation.buildingName)],
        [processText('Số căn hộ:'), quotation.unitNumber],
        [processText('Loại căn hộ:'), quotation.apartmentType.toUpperCase()],
      ];

      doc.font(fontName).fontSize(bodyTextSize);
      for (const [label, value] of infoData) {
        doc.fillColor(mutedColor).text(label, 50, yPos, { width: 100 });
        doc.fillColor(textColor).text(value, 150, yPos);
        yPos += bodyTextSize + 8;
      }

      yPos += 15;

      // ============================================
      // SELECTION TYPE
      // ============================================

      doc.font(fontNameBold).fontSize(sectionTitleSize).fillColor(primaryColor).text(processText('LOAI LUA CHON'), 50, yPos);

      yPos += sectionTitleSize + 12;

      doc.font(fontName).fontSize(bodyTextSize).fillColor(textColor).text(processText('Tùy chọn sản phẩm'), 50, yPos);

      yPos += 30;

      // ============================================
      // ITEMS TABLE
      // ============================================

      if (settings.showItemsTable && items.length > 0) {
        doc.font(fontNameBold).fontSize(sectionTitleSize).fillColor(primaryColor).text(processText(settings.productsTitle), 50, yPos);

        yPos += sectionTitleSize + 12;

        // Table header
        const tableLeft = 50;
        const colWidths = [250, 60, 100, 85];
        const headers = [processText('Sản phẩm'), 'SL', processText('Đơn giá'), processText('Thành tiền')];

        doc.font(fontName).fontSize(bodyTextSize - 1).fillColor(mutedColor);

        let xPos = tableLeft;
        for (let i = 0; i < headers.length; i++) {
          const align = i === 0 ? 'left' : 'right';
          doc.text(headers[i], xPos, yPos, { width: colWidths[i], align });
          xPos += colWidths[i];
        }

        yPos += bodyTextSize + 5;

        // Table line
        doc.moveTo(tableLeft, yPos).lineTo(545, yPos).strokeColor(borderColor).stroke();

        yPos += 8;

        // Table rows
        doc.fontSize(bodyTextSize - 1).fillColor(textColor);
        for (const item of items) {
          // Check if we need a new page
          if (yPos > 700) {
            doc.addPage();
            yPos = 50;
          }

          // Calculate item total including Fit-in fee
          // **Feature: furniture-product-mapping**
          // **Validates: Requirements 8.3, 8.4**
          const itemBaseTotal = item.price * item.quantity;
          const itemFitInFee = item.fitInFee || 0;
          const itemTotal = itemBaseTotal + itemFitInFee;

          xPos = tableLeft;
          // Product name with material and Fit-in indicator
          let productDisplay = processText(item.name);
          if (item.material) {
            productDisplay += ` (${processText(item.material)})`;
          }
          if (item.fitInSelected && itemFitInFee > 0) {
            productDisplay += ' + Fit-in';
          }
          doc.text(productDisplay, xPos, yPos, { width: colWidths[0] });
          xPos += colWidths[0];
          doc.text(item.quantity.toString(), xPos, yPos, { width: colWidths[1], align: 'right' });
          xPos += colWidths[1];
          doc.text(formatCurrency(item.price), xPos, yPos, { width: colWidths[2], align: 'right' });
          xPos += colWidths[2];
          doc.text(formatCurrency(itemTotal), xPos, yPos, { width: colWidths[3], align: 'right' });

          yPos += bodyTextSize + 8;
        }

        yPos += 10;
      }

      // ============================================
      // PRICE BREAKDOWN
      // **Feature: furniture-product-mapping**
      // **Validates: Requirements 8.4**
      // ============================================

      if (settings.showFeeDetails) {
        // Check if we need a new page
        if (yPos > 650) {
          doc.addPage();
          yPos = 50;
        }

        doc.font(fontNameBold).fontSize(sectionTitleSize).fillColor(primaryColor).text(processText(settings.priceDetailsTitle), 50, yPos);

        yPos += sectionTitleSize + 12;

        // Price table
        const priceLeft = 300;
        const priceWidth = 245;

        // Base price (product prices without Fit-in)
        doc.font(fontName).fontSize(bodyTextSize).fillColor(mutedColor).text(processText('Giá nội thất:'), priceLeft, yPos, { width: 120 });
        doc.fillColor(textColor).text(formatCurrency(quotation.basePrice) + ' VNĐ', priceLeft + 120, yPos, {
          width: priceWidth - 120,
          align: 'right',
        });

        yPos += bodyTextSize + 10;

        // Calculate total Fit-in fees from items
        // _Requirements: 8.4_
        const totalFitInFees = items.reduce((sum, item) => sum + (item.fitInFee || 0), 0);
        if (totalFitInFees > 0) {
          doc.fillColor(mutedColor).text(processText('Phí Fit-in:'), priceLeft, yPos, { width: 120 });
          doc.fillColor(textColor).text(formatCurrency(totalFitInFees) + ' VNĐ', priceLeft + 120, yPos, {
            width: priceWidth - 120,
            align: 'right',
          });

          yPos += bodyTextSize + 10;
        }

        // Other fees (excluding FIT_IN which is already calculated per item)
        for (const fee of fees) {
          const feeLabel = fee.type === 'PERCENTAGE' ? processText(`${fee.name} (${fee.value}%):`) : processText(`${fee.name}:`);

          doc.fillColor(mutedColor).text(feeLabel, priceLeft, yPos, { width: 120 });
          doc.fillColor(textColor).text(formatCurrency(fee.amount) + ' VNĐ', priceLeft + 120, yPos, {
            width: priceWidth - 120,
            align: 'right',
          });

          yPos += bodyTextSize + 10;
        }

        // Total line
        doc.moveTo(priceLeft, yPos).lineTo(545, yPos).strokeColor(borderColor).stroke();

        yPos += 10;

        // Total
        doc.font(fontNameBold).fontSize(sectionTitleSize).fillColor(primaryColor).text(processText(`${settings.totalLabel}:`), priceLeft, yPos, { width: 120 });
        doc
          .fontSize(sectionTitleSize + 2)
          .fillColor(primaryColor)
          .text(formatCurrency(quotation.totalPrice) + ' VNĐ', priceLeft + 120, yPos, {
            width: priceWidth - 120,
            align: 'right',
          });
      }

      // ============================================
      // CONTACT INFO (if enabled)
      // ============================================

      if (
        settings.showContactInfo &&
        (settings.contactPhone || settings.contactEmail || settings.contactAddress || settings.contactWebsite)
      ) {
        yPos += 40;

        if (yPos > 680) {
          doc.addPage();
          yPos = 50;
        }

        doc.font(fontNameBold).fontSize(sectionTitleSize).fillColor(primaryColor).text(processText(settings.contactInfoTitle), 50, yPos);

        yPos += sectionTitleSize + 10;
        doc.font(fontName).fontSize(bodyTextSize).fillColor(textColor);

        if (settings.contactPhone) {
          doc.text(processText(`Điện thoại: ${settings.contactPhone}`), 50, yPos);
          yPos += bodyTextSize + 5;
        }
        if (settings.contactEmail) {
          doc.text(`Email: ${settings.contactEmail}`, 50, yPos);
          yPos += bodyTextSize + 5;
        }
        if (settings.contactAddress) {
          doc.text(processText(`Địa chỉ: ${settings.contactAddress}`), 50, yPos);
          yPos += bodyTextSize + 5;
        }
        if (settings.contactWebsite) {
          doc.text(`Website: ${settings.contactWebsite}`, 50, yPos);
          yPos += bodyTextSize + 5;
        }
      }

      // ============================================
      // ADDITIONAL NOTES (if any)
      // ============================================

      if (settings.additionalNotes) {
        yPos += 20;

        if (yPos > 680) {
          doc.addPage();
          yPos = 50;
        }

        doc.font(fontName).fontSize(bodyTextSize).fillColor(mutedColor).text(processText(settings.additionalNotes), 50, yPos, { width: 495 });
      }

      // ============================================
      // VALIDITY PERIOD
      // ============================================

      if (settings.showValidityDate && settings.validityDays > 0) {
        const validUntil = new Date(quotation.createdAt);
        validUntil.setDate(validUntil.getDate() + settings.validityDays);

        yPos += 30;
        if (yPos > 720) {
          doc.addPage();
          yPos = 50;
        }

        doc
          .font(fontName)
          .fontSize(footerTextSize + 1)
          .fillColor(mutedColor)
          .text(processText(`Báo giá có hiệu lực đến: ${validUntil.toLocaleDateString('vi-VN')}`), 50, yPos, {
            align: 'center',
            width: 495,
          });
      }

      // ============================================
      // FOOTER
      // ============================================

      const footerY = 750;

      doc.font(fontName).fontSize(footerTextSize).fillColor(mutedColor).text(processText(settings.footerNote), 50, footerY, { align: 'center', width: 495 });

      doc.text(processText(settings.footerCopyright), 50, footerY + footerTextSize + 7, { align: 'center', width: 495 });

      // Finalize PDF
      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Format number as Vietnamese currency
 */
function formatCurrency(value: number): string {
  return new Intl.NumberFormat('vi-VN').format(value);
}

export default { generateQuotationPDF };
