/**
 * PDF Service Module
 *
 * Handles PDF generation for furniture quotations
 *
 * **Feature: furniture-quotation**
 * **Requirements: 8.2**
 */

import PDFDocument from 'pdfkit';
import type { FurnitureQuotation } from '@prisma/client';

// ============================================
// TYPES
// ============================================

export interface QuotationItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
}

export interface QuotationFee {
  name: string;
  type: 'FIXED' | 'PERCENTAGE';
  value: number;
  amount: number;
}

// ============================================
// PDF SERVICE
// ============================================

/**
 * Generate a PDF document for a furniture quotation
 * @param quotation - The quotation data
 * @returns Buffer containing the PDF
 * _Requirements: 8.2_
 */
export async function generateQuotationPDF(quotation: FurnitureQuotation): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 50,
        info: {
          Title: `Báo giá nội thất - ${quotation.unitNumber}`,
          Author: 'ANH THỢ XÂY',
          Subject: 'Furniture Quotation',
        },
      });

      const chunks: Buffer[] = [];
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Parse JSON fields
      const items: QuotationItem[] = typeof quotation.items === 'string' 
        ? JSON.parse(quotation.items) 
        : (quotation.items || []);
      const fees: QuotationFee[] = typeof quotation.fees === 'string' 
        ? JSON.parse(quotation.fees) 
        : (quotation.fees || []);

      // Colors
      const primaryColor = '#F5D393';
      const textColor = '#333333';
      const mutedColor = '#666666';
      const borderColor = '#E0E0E0';

      // ============================================
      // HEADER
      // ============================================
      
      // Company name
      doc.fontSize(24)
        .fillColor(primaryColor)
        .text('ANH THỢ XÂY', 50, 50, { align: 'left' });
      
      // Document title
      doc.fontSize(18)
        .fillColor(textColor)
        .text('BÁO GIÁ NỘI THẤT', 50, 85, { align: 'left' });

      // Date
      const createdDate = new Date(quotation.createdAt);
      doc.fontSize(10)
        .fillColor(mutedColor)
        .text(`Ngày: ${createdDate.toLocaleDateString('vi-VN')}`, 400, 50, { align: 'right' });
      
      // Quotation ID
      doc.text(`Mã: ${quotation.id.slice(-8).toUpperCase()}`, 400, 65, { align: 'right' });

      // Horizontal line
      doc.moveTo(50, 115)
        .lineTo(545, 115)
        .strokeColor(borderColor)
        .stroke();

      // ============================================
      // APARTMENT INFO
      // ============================================
      
      let yPos = 135;
      
      doc.fontSize(12)
        .fillColor(primaryColor)
        .text('THÔNG TIN CĂN HỘ', 50, yPos);
      
      yPos += 25;

      // Info table
      const infoData = [
        ['Chủ đầu tư:', quotation.developerName],
        ['Dự án:', quotation.projectName],
        ['Tòa nhà:', quotation.buildingName],
        ['Số căn hộ:', quotation.unitNumber],
        ['Loại căn hộ:', quotation.apartmentType.toUpperCase()],
      ];

      doc.fontSize(10);
      for (const [label, value] of infoData) {
        doc.fillColor(mutedColor).text(label, 50, yPos, { width: 100 });
        doc.fillColor(textColor).text(value, 150, yPos);
        yPos += 18;
      }

      yPos += 15;

      // ============================================
      // SELECTION TYPE
      // ============================================
      
      doc.fontSize(12)
        .fillColor(primaryColor)
        .text('LOẠI LỰA CHỌN', 50, yPos);
      
      yPos += 25;

      const selectionLabel = quotation.selectionType === 'COMBO' ? 'Combo trọn gói' : 'Tùy chọn sản phẩm';
      doc.fontSize(10)
        .fillColor(textColor)
        .text(selectionLabel, 50, yPos);
      
      if (quotation.comboName) {
        yPos += 18;
        doc.fillColor(mutedColor).text('Tên combo:', 50, yPos, { width: 100 });
        doc.fillColor(textColor).text(quotation.comboName, 150, yPos);
      }

      yPos += 30;

      // ============================================
      // ITEMS TABLE
      // ============================================
      
      if (items.length > 0) {
        doc.fontSize(12)
          .fillColor(primaryColor)
          .text('SẢN PHẨM ĐÃ CHỌN', 50, yPos);
        
        yPos += 25;

        // Table header
        const tableLeft = 50;
        const colWidths = [250, 60, 100, 85];
        const headers = ['Sản phẩm', 'SL', 'Đơn giá', 'Thành tiền'];

        doc.fontSize(9)
          .fillColor(mutedColor);
        
        let xPos = tableLeft;
        for (let i = 0; i < headers.length; i++) {
          const align = i === 0 ? 'left' : 'right';
          doc.text(headers[i], xPos, yPos, { width: colWidths[i], align });
          xPos += colWidths[i];
        }

        yPos += 15;

        // Table line
        doc.moveTo(tableLeft, yPos)
          .lineTo(545, yPos)
          .strokeColor(borderColor)
          .stroke();

        yPos += 8;

        // Table rows
        doc.fontSize(9).fillColor(textColor);
        for (const item of items) {
          // Check if we need a new page
          if (yPos > 700) {
            doc.addPage();
            yPos = 50;
          }

          xPos = tableLeft;
          doc.text(item.name, xPos, yPos, { width: colWidths[0] });
          xPos += colWidths[0];
          doc.text(item.quantity.toString(), xPos, yPos, { width: colWidths[1], align: 'right' });
          xPos += colWidths[1];
          doc.text(formatCurrency(item.price), xPos, yPos, { width: colWidths[2], align: 'right' });
          xPos += colWidths[2];
          doc.text(formatCurrency(item.price * item.quantity), xPos, yPos, { width: colWidths[3], align: 'right' });
          
          yPos += 18;
        }

        yPos += 10;
      }

      // ============================================
      // PRICE BREAKDOWN
      // ============================================
      
      // Check if we need a new page
      if (yPos > 650) {
        doc.addPage();
        yPos = 50;
      }

      doc.fontSize(12)
        .fillColor(primaryColor)
        .text('CHI TIẾT GIÁ', 50, yPos);
      
      yPos += 25;

      // Price table
      const priceLeft = 300;
      const priceWidth = 245;

      // Base price
      doc.fontSize(10)
        .fillColor(mutedColor)
        .text('Giá cơ bản:', priceLeft, yPos, { width: 120 });
      doc.fillColor(textColor)
        .text(formatCurrency(quotation.basePrice) + ' VNĐ', priceLeft + 120, yPos, { width: priceWidth - 120, align: 'right' });
      
      yPos += 20;

      // Fees
      for (const fee of fees) {
        const feeLabel = fee.type === 'PERCENTAGE' 
          ? `${fee.name} (${fee.value}%):` 
          : `${fee.name}:`;
        
        doc.fillColor(mutedColor)
          .text(feeLabel, priceLeft, yPos, { width: 120 });
        doc.fillColor(textColor)
          .text(formatCurrency(fee.amount) + ' VNĐ', priceLeft + 120, yPos, { width: priceWidth - 120, align: 'right' });
        
        yPos += 20;
      }

      // Total line
      doc.moveTo(priceLeft, yPos)
        .lineTo(545, yPos)
        .strokeColor(borderColor)
        .stroke();
      
      yPos += 10;

      // Total
      doc.fontSize(12)
        .fillColor(primaryColor)
        .text('TỔNG CỘNG:', priceLeft, yPos, { width: 120 });
      doc.fontSize(14)
        .fillColor(primaryColor)
        .text(formatCurrency(quotation.totalPrice) + ' VNĐ', priceLeft + 120, yPos, { width: priceWidth - 120, align: 'right' });

      // ============================================
      // FOOTER
      // ============================================
      
      const footerY = 750;
      
      doc.fontSize(8)
        .fillColor(mutedColor)
        .text('Báo giá này chỉ mang tính chất tham khảo. Giá thực tế có thể thay đổi tùy theo thời điểm và điều kiện cụ thể.', 50, footerY, { align: 'center', width: 495 });
      
      doc.text('© ANH THỢ XÂY - Đối tác tin cậy cho ngôi nhà của bạn', 50, footerY + 15, { align: 'center', width: 495 });

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
