/**
 * StepIndicator Component
 * Requirements: 6.1 - Display steps 1-7 with current step highlighted
 */

import { memo } from 'react';
import { motion } from 'framer-motion';
import { tokens } from '@app/shared';
export interface StepIndicatorProps {
  currentStep: number;
  totalSteps: number;
  labels: string[];
  onStepClick?: (step: number) => void;
}

export const StepIndicator = memo(function StepIndicator({
  currentStep,
  totalSteps,
  labels,
  onStepClick,
}: StepIndicatorProps) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.25rem',
        marginBottom: '2rem',
        flexWrap: 'wrap',
        padding: '0 1rem',
      }}
    >
      {Array.from({ length: totalSteps }, (_, i) => {
        const stepNum = i + 1;
        const isActive = stepNum === currentStep;
        const isCompleted = stepNum < currentStep;
        const canClick = isCompleted && onStepClick;

        return (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <motion.div
              whileHover={canClick ? { scale: 1.1 } : {}}
              whileTap={canClick ? { scale: 0.95 } : {}}
              onClick={() => canClick && onStepClick(stepNum)}
              style={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                background: isActive || isCompleted 
                  ? `linear-gradient(135deg, ${tokens.color.primary}40, ${tokens.color.primary}20)` 
                  : tokens.color.surface,
                border: `2px solid ${isActive || isCompleted ? tokens.color.primary : tokens.color.border}`,
                color: isActive || isCompleted ? tokens.color.primary : tokens.color.muted,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: canClick ? 'pointer' : 'default',
                transition: 'all 0.3s ease',
                backdropFilter: isActive || isCompleted ? 'blur(8px)' : 'none',
                boxShadow: isActive ? `0 0 12px ${tokens.color.primary}40` : 'none',
              }}
            >
              {stepNum}
            </motion.div>
            <span
              className="step-label"
              style={{
                fontSize: '0.75rem',
                color: isActive ? tokens.color.text : tokens.color.muted,
                fontWeight: isActive ? 600 : 400,
                whiteSpace: 'nowrap',
              }}
            >
              {labels[i]}
            </span>
            {i < totalSteps - 1 && (
              <div
                style={{
                  width: 16,
                  height: 2,
                  background: isCompleted ? tokens.color.primary : tokens.color.border,
                  transition: 'all 0.3s ease',
                }}
              />
            )}
          </div>
        );
      })}
      <style>{`
        @media (max-width: 768px) {
          .step-label { display: none !important; }
        }
      `}</style>
    </div>
  );
});
