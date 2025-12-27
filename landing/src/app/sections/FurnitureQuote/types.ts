/**
 * FurnitureQuote Types
 * Shared type definitions for FurnitureQuote section components
 * Requirements: 7.4
 */

import type {
  FurnitureDeveloper,
  FurnitureProject,
  FurnitureBuilding,
  FurnitureLayout,
  FurnitureApartmentType,
  FurnitureProduct,
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

export interface Selections {
  developer: FurnitureDeveloper | null;
  project: FurnitureProject | null;
  building: FurnitureBuilding | null;
  floor: number | null;
  axis: number | null;
  layout: FurnitureLayout | null;
  apartmentTypeDetail: FurnitureApartmentType | null;
  products: Array<{ product: FurnitureProduct; quantity: number }>;
}

export interface QuotationResultData {
  basePrice: number;
  fees: Array<{ name: string; type: string; value: number; amount: number }>;
  totalPrice: number;
}
