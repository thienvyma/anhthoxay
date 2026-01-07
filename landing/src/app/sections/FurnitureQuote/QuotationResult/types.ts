/**
 * QuotationResult Types
 * Feature: furniture-quotation
 * Requirements: 7.6, 7.7, 7.8, 11.2
 */

import { FurnitureProduct, FeeBreakdown } from '../../../api/furniture';

// ============================================
// TYPES
// ============================================

export interface SelectedProduct {
  product: FurnitureProduct;
  quantity: number;
}

export interface QuotationSelections {
  developer: { id: string; name: string } | null;
  project: { id: string; name: string; code: string } | null;
  building: { id: string; name: string; code: string; maxFloor: number; maxAxis: number } | null;
  floor: number | null;
  axis: number | null;
  layout: { id: string; apartmentType: string } | null;
  apartmentTypeDetail: { id: string; apartmentType: string; imageUrl: string | null; description: string | null } | null;
  products: SelectedProduct[];
}

export interface LeadData {
  name: string;
  phone: string;
  email: string; // Required for quotation email delivery
}

export interface QuotationResultProps {
  selections: QuotationSelections;
  leadData: LeadData;
  onComplete: () => void;
  onBack: () => void;
  onError: (message: string) => void;
  onSuccess: (message: string) => void;
}

/**
 * Quotation result data structure
 * 
 * **Feature: furniture-product-mapping**
 * **Validates: Requirements 8.4**
 */
export interface QuotationResultData {
  basePrice: number;
  fitInFeesTotal?: number;        // Total Fit-in fees
  fees: FeeBreakdown[];
  totalPrice: number;
}
