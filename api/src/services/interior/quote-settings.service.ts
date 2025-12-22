import { prisma } from '../../utils/prisma';
import type { UpdateQuoteSettingsInput } from '../../schemas/interior.schema';

export interface InteriorQuoteSettingsData {
  id: string;
  laborCostPerSqm: number;
  laborCostMin: number | null;
  laborCostMax: number | null;
  managementFeeType: 'FIXED' | 'PERCENTAGE';
  managementFeeValue: number;
  contingencyType: 'FIXED' | 'PERCENTAGE';
  contingencyValue: number;
  vatEnabled: boolean;
  vatPercent: number;
  maxDiscountPercent: number | null;
  quoteValidityDays: number;
  customFormula: string | null;
  showItemBreakdown: boolean;
  showRoomBreakdown: boolean;
  showPricePerSqm: boolean;
  companyName: string | null;
  companyPhone: string | null;
  companyEmail: string | null;
  companyAddress: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Get quote settings (singleton)
 */
export async function getQuoteSettings(): Promise<InteriorQuoteSettingsData> {
  let settings = await prisma.interiorQuoteSettings.findUnique({
    where: { id: 'default' },
  });

  // Create default settings if not exists
  if (!settings) {
    settings = await prisma.interiorQuoteSettings.create({
      data: {
        id: 'default',
        laborCostPerSqm: 500000,
        managementFeeType: 'PERCENTAGE',
        managementFeeValue: 5,
        contingencyType: 'PERCENTAGE',
        contingencyValue: 3,
        vatEnabled: true,
        vatPercent: 10,
        maxDiscountPercent: 15,
        quoteValidityDays: 30,
        showItemBreakdown: true,
        showRoomBreakdown: true,
        showPricePerSqm: true,
      },
    });
  }

  return {
    ...settings,
    managementFeeType: settings.managementFeeType as 'FIXED' | 'PERCENTAGE',
    contingencyType: settings.contingencyType as 'FIXED' | 'PERCENTAGE',
  };
}

/**
 * Update quote settings
 */
export async function updateQuoteSettings(
  data: UpdateQuoteSettingsInput
): Promise<InteriorQuoteSettingsData> {
  // Ensure settings exist
  await getQuoteSettings();

  const settings = await prisma.interiorQuoteSettings.update({
    where: { id: 'default' },
    data: {
      ...(data.laborCostPerSqm !== undefined && { laborCostPerSqm: data.laborCostPerSqm }),
      ...(data.laborCostMin !== undefined && { laborCostMin: data.laborCostMin }),
      ...(data.laborCostMax !== undefined && { laborCostMax: data.laborCostMax }),
      ...(data.managementFeeType !== undefined && { managementFeeType: data.managementFeeType }),
      ...(data.managementFeeValue !== undefined && { managementFeeValue: data.managementFeeValue }),
      ...(data.contingencyType !== undefined && { contingencyType: data.contingencyType }),
      ...(data.contingencyValue !== undefined && { contingencyValue: data.contingencyValue }),
      ...(data.vatEnabled !== undefined && { vatEnabled: data.vatEnabled }),
      ...(data.vatPercent !== undefined && { vatPercent: data.vatPercent }),
      ...(data.maxDiscountPercent !== undefined && { maxDiscountPercent: data.maxDiscountPercent }),
      ...(data.quoteValidityDays !== undefined && { quoteValidityDays: data.quoteValidityDays }),
      ...(data.customFormula !== undefined && { customFormula: data.customFormula }),
      ...(data.showItemBreakdown !== undefined && { showItemBreakdown: data.showItemBreakdown }),
      ...(data.showRoomBreakdown !== undefined && { showRoomBreakdown: data.showRoomBreakdown }),
      ...(data.showPricePerSqm !== undefined && { showPricePerSqm: data.showPricePerSqm }),
      ...(data.companyName !== undefined && { companyName: data.companyName }),
      ...(data.companyPhone !== undefined && { companyPhone: data.companyPhone }),
      ...(data.companyEmail !== undefined && { companyEmail: data.companyEmail }),
      ...(data.companyAddress !== undefined && { companyAddress: data.companyAddress }),
    },
  });

  return {
    ...settings,
    managementFeeType: settings.managementFeeType as 'FIXED' | 'PERCENTAGE',
    contingencyType: settings.contingencyType as 'FIXED' | 'PERCENTAGE',
  };
}
