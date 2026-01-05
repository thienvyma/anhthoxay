/**
 * FurnitureQuote Types
 * Shared type definitions for FurnitureQuote section components
 * Requirements: 7.4, 7.5
 * 
 * **Feature: furniture-product-restructure**
 */

import type {
  FurnitureDeveloper,
  FurnitureProject,
  FurnitureBuilding,
  FurnitureLayout,
  FurnitureApartmentType,
  ProductVariantForLanding,
} from '../../api/furniture';

// Re-export component props types
export type { StepIndicatorProps } from './components/StepIndicator';
export type { SelectionCardProps } from './components/SelectionCard';
export type { NavigationButtonsProps } from './components/NavigationButtons';

// ============================================
// DATA TYPES
// ============================================

export interface FurnitureQuoteData {
  title?: string;
  subtitle?: string;
  maxWidth?: number;
}

/**
 * Selected product with variant and Fit-in selection
 * 
 * **Feature: furniture-product-restructure**
 * **Validates: Requirements 7.5**
 */
export interface SelectedProduct {
  productBaseId: string;          // NEW: ProductBase ID
  productName: string;            // Product base name
  variant: ProductVariantForLanding;  // Selected material variant (NEW type)
  quantity: number;
  fitInSelected: boolean;         // Whether Fit-in is selected
  allowFitIn: boolean;            // NEW: Whether product allows Fit-in
}

export interface Selections {
  developer: FurnitureDeveloper | null;
  project: FurnitureProject | null;
  building: FurnitureBuilding | null;
  floor: number | null;
  axis: number | null;
  layout: FurnitureLayout | null;
  apartmentTypeDetail: FurnitureApartmentType | null;
  products: SelectedProduct[];    // Updated to use SelectedProduct
}

export interface QuotationResultData {
  basePrice: number;
  fitInFeesTotal?: number;        // Total Fit-in fees
  fees: Array<{ name: string; type: string; value: number; amount: number }>;
  totalPrice: number;
}
