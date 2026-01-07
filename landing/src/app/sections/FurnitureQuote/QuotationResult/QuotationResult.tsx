/**
 * QuotationResult Component - Main component for displaying quotation results
 * Feature: furniture-quotation
 * Requirements: 7.6, 7.7, 7.8
 */

import { memo } from 'react';
import { motion } from 'framer-motion';
import { tokens } from '@app/shared';

// Types
import { QuotationResultProps } from './types';

// Components
import { NavigationButtons } from './NavigationButtons';
import { QuotationPreview } from './QuotationPreview';
import { SuccessView } from './SuccessView';

// Hooks
import { useQuotationData } from './useQuotationData';
import { useQuotationActions } from './useQuotationActions';

// ============================================
// LOADING SPINNER COMPONENT
// ============================================

const LoadingSpinner = memo(function LoadingSpinner() {
  return (
    <motion.div
      key="loading"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '3rem',
      }}
    >
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        style={{
          width: 40,
          height: 40,
          borderRadius: '50%',
          borderWidth: '3px',
          borderStyle: 'solid',
          borderColor: `${tokens.color.border} ${tokens.color.border} ${tokens.color.border} ${tokens.color.primary}`,
        }}
      />
    </motion.div>
  );
});

// ============================================
// MAIN QUOTATION RESULT COMPONENT
// Requirements: 7.6, 7.7, 7.8
// ============================================

export const QuotationResult = memo(function QuotationResult({
  selections,
  leadData,
  onComplete,
  onBack,
  onError,
  onSuccess,
}: QuotationResultProps) {
  // Use custom hooks
  const { loading, quotationResult } = useQuotationData(selections, onError);
  const { submitting, submitted, quotationId, handleSubmit } = useQuotationActions(
    selections,
    leadData,
    quotationResult,
    onError,
    onSuccess
  );

  // Loading state
  if (loading) {
    return <LoadingSpinner />;
  }

  // Success state
  if (submitted && quotationResult) {
    return (
      <SuccessView
        quotationResult={quotationResult}
        selections={selections}
        quotationId={quotationId}
        onNewQuotation={onComplete}
        onError={onError}
      />
    );
  }

  // Preview state
  return (
    <motion.div
      key="quotation-result"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
    >
      {/* Header */}
      <h3
        style={{
          margin: '0 0 0.5rem',
          fontSize: '1.1rem',
          fontWeight: 600,
          color: tokens.color.text,
        }}
      >
        <i className="ri-file-list-3-line" style={{ marginRight: '0.5rem', color: tokens.color.primary }} />
        Xác nhận báo giá
      </h3>
      <p
        style={{
          margin: '0 0 1.5rem',
          fontSize: '0.875rem',
          color: tokens.color.muted,
        }}
      >
        Vui lòng kiểm tra thông tin trước khi xác nhận
      </p>

      {/* Quotation Preview */}
      {quotationResult && (
        <QuotationPreview selections={selections} quotationResult={quotationResult} />
      )}

      {/* Navigation Buttons */}
      <NavigationButtons
        onBack={onBack}
        onNext={handleSubmit}
        nextLabel="Xác nhận báo giá"
        nextDisabled={!quotationResult}
        showBack={true}
        loading={submitting}
      />
    </motion.div>
  );
});

export default QuotationResult;
