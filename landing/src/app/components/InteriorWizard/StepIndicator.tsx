import { tokens } from '@app/shared';
import { motion } from 'framer-motion';
import type { WizardStep } from './types';

interface StepIndicatorProps {
  steps: WizardStep[];
  currentStep: number;
  onStepClick: (step: number) => void;
  completedSteps: number[];
}

export function StepIndicator({
  steps,
  currentStep,
  onStepClick,
  completedSteps,
}: StepIndicatorProps) {
  return (
    <nav
      className="glass-effect-subtle"
      aria-label="Tiến trình báo giá"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'clamp(0.75rem, 2vw, 1.5rem) clamp(0.5rem, 2vw, 1rem)',
        borderBottom: `1px solid ${tokens.color.border}`,
        overflowX: 'auto',
        gap: 'clamp(0.125rem, 1vw, 0.25rem)',
        WebkitOverflowScrolling: 'touch',
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
      }}
    >
      {steps.map((step, index) => {
        const isCompleted = completedSteps.includes(step.id);
        const isCurrent = currentStep === step.id;
        const isClickable = isCompleted || step.id <= currentStep;

        return (
          <div
            key={step.id}
            style={{
              display: 'flex',
              alignItems: 'center',
            }}
          >
            {/* Step Circle */}
            <motion.button
              onClick={() => isClickable && onStepClick(step.id)}
              disabled={!isClickable}
              whileHover={isClickable ? { scale: 1.1 } : undefined}
              whileTap={isClickable ? { scale: 0.95 } : undefined}
              aria-label={`Bước ${step.id}: ${step.label}${isCompleted ? ' (Hoàn thành)' : isCurrent ? ' (Đang thực hiện)' : ''}`}
              aria-current={isCurrent ? 'step' : undefined}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 'clamp(0.25rem, 1vw, 0.5rem)',
                background: 'none',
                border: 'none',
                cursor: isClickable ? 'pointer' : 'default',
                padding: 'clamp(0.25rem, 1vw, 0.5rem)',
                minWidth: 'clamp(44px, 10vw, 60px)',
                touchAction: 'manipulation',
              }}
            >
              <motion.div
                animate={{
                  backgroundColor: isCurrent
                    ? tokens.color.primary
                    : isCompleted
                    ? tokens.color.success
                    : tokens.color.border,
                  borderColor: isCurrent
                    ? tokens.color.primary
                    : isCompleted
                    ? tokens.color.success
                    : tokens.color.border,
                }}
                style={{
                  width: 'clamp(28px, 6vw, 36px)',
                  height: 'clamp(28px, 6vw, 36px)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '2px solid',
                  color: isCurrent || isCompleted ? tokens.color.background : tokens.color.textMuted,
                  fontSize: 'clamp(0.75rem, 2vw, 0.875rem)',
                  fontWeight: 600,
                }}
              >
                {isCompleted && !isCurrent ? (
                  <i className="ri-check-line" style={{ fontSize: '1.25rem' }} />
                ) : (
                  step.id
                )}
              </motion.div>

              {/* Step Label - Hidden on mobile, show short label */}
              <span
                style={{
                  fontSize: '0.75rem',
                  fontWeight: isCurrent ? 600 : 400,
                  color: isCurrent
                    ? tokens.color.primary
                    : isCompleted
                    ? tokens.color.success
                    : tokens.color.textMuted,
                  whiteSpace: 'nowrap',
                }}
                className="step-label"
              >
                <span className="step-label-full">{step.label}</span>
                <span className="step-label-short">{step.shortLabel}</span>
              </span>
            </motion.button>

            {/* Connector Line */}
            {index < steps.length - 1 && (
              <div
                aria-hidden="true"
                style={{
                  width: 'clamp(12px, 3vw, 24px)',
                  height: '2px',
                  background: completedSteps.includes(step.id)
                    ? tokens.color.success
                    : tokens.color.border,
                  margin: '0 clamp(0.125rem, 0.5vw, 0.25rem)',
                  marginBottom: 'clamp(1rem, 3vw, 1.5rem)', // Align with circle
                  flexShrink: 0,
                }}
              />
            )}
          </div>
        );
      })}

      <style>{`
        .step-label-short {
          display: none;
        }
        
        @media (max-width: 768px) {
          .step-label-full {
            display: none;
          }
          .step-label-short {
            display: inline;
          }
        }
        
        @media (max-width: 480px) {
          .step-label {
            font-size: 0.65rem !important;
          }
        }
        
        /* Hide scrollbar but keep functionality */
        nav::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </nav>
  );
}

export default StepIndicator;
