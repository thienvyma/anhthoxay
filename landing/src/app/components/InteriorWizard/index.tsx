import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { useCallback } from 'react';
import { StepIndicator } from './StepIndicator';
import { DeveloperStep } from './steps/DeveloperStep';
import { DevelopmentStep } from './steps/DevelopmentStep';
import { BuildingStep } from './steps/BuildingStep';
import { UnitStep } from './steps/UnitStep';
import { LayoutStep } from './steps/LayoutStep';
import { PackageStep } from './steps/PackageStep';
import { ResultStep } from './steps/ResultStep';
import { useInteriorWizard } from './hooks/useInteriorWizard';
import type { WizardStep } from './types';

const STEPS: WizardStep[] = [
  { id: 1, label: 'Chủ đầu tư', shortLabel: 'CĐT' },
  { id: 2, label: 'Dự án', shortLabel: 'DA' },
  { id: 3, label: 'Tòa nhà', shortLabel: 'Tòa' },
  { id: 4, label: 'Căn hộ', shortLabel: 'Căn' },
  { id: 5, label: 'Mặt bằng', shortLabel: 'MB' },
  { id: 6, label: 'Gói nội thất', shortLabel: 'Gói' },
  { id: 7, label: 'Báo giá', shortLabel: 'BG' },
];

export function InteriorWizard() {
  const {
    state,
    completedSteps,
    goToStep,
    nextStep,
    prevStep,
    setDeveloper,
    setDevelopment,
    setBuilding,
    setUnit,
    setPackage,
    setQuote,
    reset,
  } = useInteriorWizard();

  // Swipe threshold for navigation
  const SWIPE_THRESHOLD = 50;
  const SWIPE_VELOCITY_THRESHOLD = 500;

  // Handle swipe gestures for mobile navigation
  const handleDragEnd = useCallback(
    (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      const { offset, velocity } = info;

      // Check if swipe is significant enough
      const isSwipeLeft = offset.x < -SWIPE_THRESHOLD || velocity.x < -SWIPE_VELOCITY_THRESHOLD;
      const isSwipeRight = offset.x > SWIPE_THRESHOLD || velocity.x > SWIPE_VELOCITY_THRESHOLD;

      if (isSwipeLeft && state.currentStep < 7) {
        // Only allow forward navigation if current step is completed
        // For step 1, we need a developer selected
        // For other steps, we check completedSteps
        const canGoNext =
          state.currentStep === 1
            ? state.developer !== null
            : completedSteps.includes(state.currentStep);

        if (canGoNext) {
          nextStep();
        }
      } else if (isSwipeRight && state.currentStep > 1) {
        prevStep();
      }
    },
    [state.currentStep, state.developer, completedSteps, nextStep, prevStep]
  );

  // Animation variants
  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 300 : -300,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      x: direction > 0 ? -300 : 300,
      opacity: 0,
    }),
  };

  const renderStep = () => {
    switch (state.currentStep) {
      case 1:
        return (
          <DeveloperStep
            selected={state.developer}
            onSelect={(dev) => {
              setDeveloper(dev);
              nextStep();
            }}
          />
        );
      case 2:
        return (
          <DevelopmentStep
            developerId={state.developer?.id || ''}
            selected={state.development}
            onSelect={(dev) => {
              setDevelopment(dev);
              nextStep();
            }}
            onBack={prevStep}
          />
        );
      case 3:
        return (
          <BuildingStep
            developmentId={state.development?.id || ''}
            selected={state.building}
            onSelect={(building) => {
              setBuilding(building);
              nextStep();
            }}
            onBack={prevStep}
          />
        );
      case 4:
        return (
          <UnitStep
            building={state.building}
            selected={state.unit}
            onSelect={(unit, layout) => {
              setUnit(unit, layout);
              nextStep();
            }}
            onBack={prevStep}
          />
        );
      case 5:
        return (
          <LayoutStep
            layout={state.layout}
            unit={state.unit}
            onContinue={nextStep}
            onBack={prevStep}
          />
        );
      case 6:
        return (
          <PackageStep
            layoutId={state.layout?.id || ''}
            selected={state.package}
            onSelect={(pkg) => {
              setPackage(pkg);
              nextStep();
            }}
            onBack={prevStep}
          />
        );
      case 7:
        return (
          <ResultStep
            state={state}
            onQuoteCalculated={setQuote}
            onStartOver={reset}
            onBack={prevStep}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div
      style={{
        overflow: 'hidden',
      }}
    >
      {/* Step Indicator */}
      <StepIndicator
        steps={STEPS}
        currentStep={state.currentStep}
        onStepClick={goToStep}
        completedSteps={completedSteps}
      />

      {/* Step Content */}
      <div
        style={{
          minHeight: '400px',
          position: 'relative',
          overflow: 'hidden',
          touchAction: 'pan-y', // Allow vertical scroll, capture horizontal swipe
        }}
      >
        <AnimatePresence mode="wait" custom={state.direction}>
          <motion.div
            key={state.currentStep}
            custom={state.direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.2}
            onDragEnd={handleDragEnd}
            transition={{
              x: { type: 'spring', stiffness: 300, damping: 30 },
              opacity: { duration: 0.2 },
            }}
            style={{
              padding: '1.5rem',
              cursor: 'grab',
            }}
            whileDrag={{ cursor: 'grabbing' }}
          >
            {renderStep()}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

export default InteriorWizard;
