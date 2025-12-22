/**
 * Homeowner Onboarding Component
 *
 * Provides a guided tour for new homeowners highlighting key features:
 * - Create Project
 * - View Bids
 * - Select Contractor
 *
 * Uses tooltips to explain each feature.
 *
 * **Feature: bidding-phase6-portal**
 * **Validates: Requirements 19.1, 19.3**
 */

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useOnboarding } from '../../hooks/useOnboarding';

export interface OnboardingStep {
  target: string;
  title: string;
  content: string;
  placement: 'top' | 'bottom' | 'left' | 'right';
}

const HOMEOWNER_STEPS: OnboardingStep[] = [
  {
    target: '.create-project-btn',
    title: 'Tạo dự án mới',
    content: 'Bắt đầu bằng cách đăng công trình của bạn. Mô tả chi tiết để nhận được đề xuất tốt nhất từ nhà thầu.',
    placement: 'bottom',
  },
  {
    target: '.project-list',
    title: 'Quản lý dự án',
    content: 'Theo dõi tất cả dự án của bạn tại đây. Xem trạng thái, số lượng bid và tiến độ.',
    placement: 'top',
  },
  {
    target: '.bid-list',
    title: 'Xem và so sánh đề xuất',
    content: 'Xem các đề xuất từ nhà thầu, so sánh giá và timeline để chọn nhà thầu phù hợp nhất.',
    placement: 'top',
  },
  {
    target: '.notification-bell',
    title: 'Thông báo',
    content: 'Nhận thông báo khi có bid mới, dự án được duyệt hoặc tin nhắn từ nhà thầu.',
    placement: 'bottom',
  },
];

interface HomeownerOnboardingProps {
  onComplete?: () => void;
  onSkip?: () => void;
}

export function HomeownerOnboarding({ onComplete, onSkip }: HomeownerOnboardingProps) {
  const { shouldShowOnboarding, completeOnboarding } = useOnboarding();
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const MAX_RETRIES = 3;

  const handleComplete = useCallback(() => {
    completeOnboarding();
    setIsVisible(false);
    onComplete?.();
  }, [completeOnboarding, onComplete]);

  const handleSkip = useCallback(() => {
    completeOnboarding();
    setIsVisible(false);
    onSkip?.();
  }, [completeOnboarding, onSkip]);

  // Calculate tooltip position based on target element
  const calculatePosition = useCallback(() => {
    const step = HOMEOWNER_STEPS[currentStep];
    if (!step) {
      handleComplete();
      return;
    }

    const targetElement = document.querySelector(step.target);
    if (!targetElement) {
      // If target not found, retry a few times then skip
      console.warn(`Onboarding target not found: ${step.target}, retry: ${retryCount}`);
      
      if (retryCount < MAX_RETRIES) {
        // Retry after a delay
        setRetryCount(prev => prev + 1);
        return;
      }
      
      // Max retries reached, skip to next step or complete
      setRetryCount(0);
      if (currentStep < HOMEOWNER_STEPS.length - 1) {
        setCurrentStep(prev => prev + 1);
      } else {
        handleComplete();
      }
      return;
    }

    const rect = targetElement.getBoundingClientRect();
    
    // Check if element is visible
    if (rect.width === 0 || rect.height === 0) {
      console.warn(`Onboarding target not visible: ${step.target}`);
      
      if (retryCount < MAX_RETRIES) {
        setRetryCount(prev => prev + 1);
        return;
      }
      
      setRetryCount(0);
      if (currentStep < HOMEOWNER_STEPS.length - 1) {
        setCurrentStep(prev => prev + 1);
      } else {
        handleComplete();
      }
      return;
    }
    
    // Reset retry count on success
    setRetryCount(0);
    setTargetRect(rect);

    const tooltipWidth = 320;
    const tooltipHeight = 150;
    const padding = 16;

    let top = 0;
    let left = 0;

    switch (step.placement) {
      case 'top':
        top = rect.top - tooltipHeight - padding;
        left = rect.left + rect.width / 2 - tooltipWidth / 2;
        break;
      case 'bottom':
        top = rect.bottom + padding;
        left = rect.left + rect.width / 2 - tooltipWidth / 2;
        break;
      case 'left':
        top = rect.top + rect.height / 2 - tooltipHeight / 2;
        left = rect.left - tooltipWidth - padding;
        break;
      case 'right':
        top = rect.top + rect.height / 2 - tooltipHeight / 2;
        left = rect.right + padding;
        break;
    }

    // Keep tooltip within viewport
    left = Math.max(padding, Math.min(left, window.innerWidth - tooltipWidth - padding));
    top = Math.max(padding, Math.min(top, window.innerHeight - tooltipHeight - padding));

    setTooltipPosition({ top, left });
  }, [currentStep, handleComplete, retryCount]);

  // Retry finding target element with delay
  useEffect(() => {
    if (retryCount > 0 && retryCount <= MAX_RETRIES && isVisible) {
      const timer = setTimeout(() => {
        calculatePosition();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [retryCount, isVisible, calculatePosition]);

  // Show onboarding after a short delay
  useEffect(() => {
    if (shouldShowOnboarding) {
      const timer = setTimeout(() => {
        setIsVisible(true);
        calculatePosition();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [shouldShowOnboarding, calculatePosition]);

  // Recalculate position on window resize
  useEffect(() => {
    if (!isVisible) return;

    const handleResize = () => calculatePosition();
    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleResize);
    };
  }, [isVisible, calculatePosition]);

  // Recalculate when step changes
  useEffect(() => {
    if (isVisible) {
      calculatePosition();
    }
  }, [currentStep, isVisible, calculatePosition]);

  const handleNext = () => {
    if (currentStep < HOMEOWNER_STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  // Don't render anything if onboarding shouldn't be shown or no valid target
  if (!isVisible || !shouldShowOnboarding || !targetRect) {
    return null;
  }

  const step = HOMEOWNER_STEPS[currentStep];
  const isLastStep = currentStep === HOMEOWNER_STEPS.length - 1;
  const isFirstStep = currentStep === 0;

  return (
    <>
      {/* Overlay */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.7)',
          zIndex: 9998,
        }}
        onClick={handleSkip}
      />

      {/* Spotlight on target element */}
      {targetRect && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{
            position: 'fixed',
            top: targetRect.top - 8,
            left: targetRect.left - 8,
            width: targetRect.width + 16,
            height: targetRect.height + 16,
            borderRadius: 12,
            boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.7)',
            zIndex: 9999,
            pointerEvents: 'none',
          }}
        />
      )}

      {/* Tooltip */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          style={{
            position: 'fixed',
            top: tooltipPosition.top,
            left: tooltipPosition.left,
            width: 320,
            background: '#1f1f23',
            border: '1px solid rgba(245, 211, 147, 0.3)',
            borderRadius: 12,
            padding: 20,
            zIndex: 10000,
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)',
          }}
        >
          {/* Progress indicator */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
            {HOMEOWNER_STEPS.map((_, i) => (
              <div
                key={i}
                style={{
                  flex: 1,
                  height: 4,
                  borderRadius: 2,
                  background: i <= currentStep ? '#f5d393' : 'rgba(255, 255, 255, 0.1)',
                  transition: 'background 0.3s',
                }}
              />
            ))}
          </div>

          {/* Content */}
          <h4 style={{ fontSize: 16, fontWeight: 600, color: '#f5d393', marginBottom: 8 }}>
            {step.title}
          </h4>
          <p style={{ fontSize: 14, color: '#a1a1aa', lineHeight: 1.6, marginBottom: 20 }}>
            {step.content}
          </p>

          {/* Actions */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <button
              onClick={handleSkip}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#71717a',
                fontSize: 13,
                cursor: 'pointer',
                padding: '8px 0',
              }}
            >
              Bỏ qua
            </button>

            <div style={{ display: 'flex', gap: 8 }}>
              {!isFirstStep && (
                <button
                  onClick={handlePrev}
                  style={{
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: 'none',
                    color: '#e4e7ec',
                    fontSize: 13,
                    padding: '8px 16px',
                    borderRadius: 6,
                    cursor: 'pointer',
                  }}
                >
                  Quay lại
                </button>
              )}
              <button
                onClick={handleNext}
                style={{
                  background: '#f5d393',
                  border: 'none',
                  color: '#1a1a1e',
                  fontSize: 13,
                  fontWeight: 600,
                  padding: '8px 16px',
                  borderRadius: 6,
                  cursor: 'pointer',
                }}
              >
                {isLastStep ? 'Hoàn tất' : 'Tiếp theo'}
              </button>
            </div>
          </div>

          {/* Step counter */}
          <div style={{ textAlign: 'center', marginTop: 12, fontSize: 12, color: '#52525b' }}>
            {currentStep + 1} / {HOMEOWNER_STEPS.length}
          </div>
        </motion.div>
      </AnimatePresence>
    </>
  );
}
