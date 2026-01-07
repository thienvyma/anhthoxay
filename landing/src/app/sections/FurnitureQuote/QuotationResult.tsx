/**
 * QuotationResult Component - Re-export from refactored module
 * Feature: furniture-quotation
 * Requirements: 7.6, 7.7, 7.8, 11.2
 * 
 * This file maintains backward compatibility by re-exporting from the
 * refactored QuotationResult module.
 * 
 * **Feature: production-readiness**
 * **Validates: Requirements FR-4.3**
 */

// Re-export everything from the refactored module
export {
  QuotationResult,
  default,
  // Types
  type SelectedProduct,
  type QuotationSelections,
  type LeadData,
  type QuotationResultProps,
  type QuotationResultData,
  // Sub-components
  NavigationButtons,
  QuotationPreview,
  SuccessView,
  // Hooks
  useQuotationData,
  useQuotationActions,
  // Utils
  formatCurrency,
  calculateUnitNumber,
  calculateQuotation,
} from './QuotationResult/index';
