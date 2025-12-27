/**
 * NavigationButtons Component
 * Requirements: 6.1, 7.2 - Next/Back buttons for wizard navigation
 */

import { memo } from 'react';
import { motion } from 'framer-motion';
import { tokens } from '@app/shared';
export interface NavigationButtonsProps {
  onBack?: () => void;
  onNext?: () => void;
  backLabel?: string;
  nextLabel?: string;
  nextDisabled?: boolean;
  showBack?: boolean;
}

export const NavigationButtons = memo(function NavigationButtons({
  onBack,
  onNext,
  backLabel = 'Quay lại',
  nextLabel = 'Tiếp tục',
  nextDisabled = false,
  showBack = true,
}: NavigationButtonsProps) {
  return (
    <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
      {showBack && onBack && (
        <button
          onClick={onBack}
          style={{
            flex: 1,
            padding: '0.875rem',
            borderRadius: tokens.radius.md,
            border: `1px solid ${tokens.color.border}`,
            background: 'transparent',
            color: tokens.color.text,
            fontSize: '1rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
          }}
        >
          <i className="ri-arrow-left-line" /> {backLabel}
        </button>
      )}
      {onNext && (
        <motion.button
          whileHover={!nextDisabled ? { scale: 1.02 } : {}}
          whileTap={!nextDisabled ? { scale: 0.98 } : {}}
          onClick={onNext}
          disabled={nextDisabled}
          style={{
            flex: 2,
            padding: '0.875rem',
            borderRadius: tokens.radius.md,
            border: 'none',
            background: nextDisabled ? tokens.color.muted : tokens.color.primary,
            color: nextDisabled ? tokens.color.text : '#111',
            fontSize: '1rem',
            fontWeight: 600,
            cursor: nextDisabled ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            opacity: nextDisabled ? 0.5 : 1,
          }}
        >
          {nextLabel} <i className="ri-arrow-right-line" />
        </motion.button>
      )}
    </div>
  );
});
