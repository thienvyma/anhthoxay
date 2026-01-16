/**
 * QuotationResult Module - Re-exports
 * Feature: furniture-quotation
 */

// Main component
export { QuotationResult, default } from './QuotationResult';

// Types
export type {
  SelectedProduct,
  QuotationSelections,
  LeadData,
  QuotationResultProps,
  QuotationResultData,
} from './types';

// Sub-components (for testing or advanced usage)
export { NavigationButtons } from './NavigationButtons';
export { QuotationPreview } from './QuotationPreview';
export { SuccessView } from './SuccessView';

// Hooks
export { useQuotationData } from './useQuotationData';
export { useQuotationActions } from './useQuotationActions';

// Utils - calculateQuotation is local, formatCurrency/calculateUnitNumber from @app/shared
export { calculateQuotation } from './utils';
export { formatCurrency, calculateUnitNumber } from '@app/shared';
