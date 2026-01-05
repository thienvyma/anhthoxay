/**
 * FurnitureQuote Constants
 * Shared constants for FurnitureQuote section
 * 
 * **Feature: codebase-refactor-large-files**
 * **Requirements: 3.1**
 */

// ============================================
// PAGINATION
// ============================================

/** Number of items per page for pagination */
export const ITEMS_PER_PAGE = 6;

// ============================================
// STEP CONFIGURATION
// ============================================

/** Step labels for the quotation wizard */
export const STEP_LABELS = [
  'Chủ đầu tư',
  'Dự án',
  'Tòa nhà',
  'Căn hộ',
  'Layout',
  'Thông tin',
  'Nội thất',
  'Xác nhận',
  'Báo giá',
] as const;

/** Total number of steps in the wizard */
export const TOTAL_STEPS = 9;

// ============================================
// VALIDATION
// ============================================

/** Minimum quantity for products */
export const MIN_QUANTITY = 1;

/** Maximum quantity for products */
export const MAX_QUANTITY = 99;

// ============================================
// HELPERS
// ============================================

/**
 * Format currency in Vietnamese format
 */
export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(value);
};

/**
 * Calculate unit number from building code, floor and axis
 */
export const calculateUnitNumber = (buildingCode: string, floor: number, axis: number): string => {
  return `${buildingCode}.${floor.toString().padStart(2, '0')}${axis.toString().padStart(2, '0')}`;
};
