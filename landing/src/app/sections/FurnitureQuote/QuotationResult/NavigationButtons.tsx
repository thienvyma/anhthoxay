/**
 * NavigationButtons Component
 * Feature: furniture-quotation
 */

import { memo } from 'react';
import { motion } from 'framer-motion';
import { tokens } from '@app/shared';

// ============================================
// NAVIGATION BUTTONS COMPONENT
// ============================================

interface NavigationButtonsProps {
  onBack?: () => void;
  onNext?: () => void;
  backLabel?: string;
  nextLabel?: string;
  nextDisabled?: boolean;
  showBack?: boolean;
  loading?: boolean;
}

export const NavigationButtons = memo(function NavigationButtons({
  onBack,
  onNext,
  backLabel = 'Quay lại',
  nextLabel = 'Tiếp tục',
  nextDisabled = false,
  showBack = true,
  loading = false,
}: NavigationButtonsProps) {
  return (
    <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
      {showBack && onBack && (
        <button
          onClick={onBack}
          disabled={loading}
          style={{
            flex: 1,
            padding: '0.875rem',
            borderRadius: tokens.radius.md,
            border: `1px solid ${tokens.color.border}`,
            background: 'transparent',
            color: tokens.color.text,
            fontSize: '1rem',
            cursor: loading ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            opacity: loading ? 0.5 : 1,
          }}
        >
          <i className="ri-arrow-left-line" /> {backLabel}
        </button>
      )}
      {onNext && (
        <motion.button
          whileHover={!nextDisabled && !loading ? { scale: 1.02 } : {}}
          whileTap={!nextDisabled && !loading ? { scale: 0.98 } : {}}
          onClick={onNext}
          disabled={nextDisabled || loading}
          style={{
            flex: 2,
            padding: '0.875rem',
            borderRadius: tokens.radius.md,
            border: 'none',
            background: nextDisabled || loading ? tokens.color.muted : tokens.color.primary,
            color: nextDisabled || loading ? tokens.color.text : '#111',
            fontSize: '1rem',
            fontWeight: 600,
            cursor: nextDisabled || loading ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            opacity: nextDisabled || loading ? 0.5 : 1,
          }}
        >
          {loading ? (
            <>
              <motion.span
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                style={{ display: 'inline-block' }}
              >
                <i className="ri-loader-4-line" />
              </motion.span>
              Đang xử lý...
            </>
          ) : (
            <>
              {nextLabel} <i className="ri-arrow-right-line" />
            </>
          )}
        </motion.button>
      )}
    </div>
  );
});

export default NavigationButtons;
