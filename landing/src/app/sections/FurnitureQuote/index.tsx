/**
 * FurnitureQuote Section - Main Component (Refactored)
 * 
 * **Feature: codebase-refactor-large-files**
 * **Requirements: 3.5, 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 7.1, 7.2, 7.3, 7.6, 7.8**
 */

import { useState, useCallback, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { tokens } from '@app/shared';
import { useToast } from '../../components/Toast';
import { StepIndicator, ConfirmationStep } from './components';
import { LeadData } from './LeadForm';
import { useFurnitureData, useSelections, useQuotation, usePagination, useCompanyLogo } from './hooks';
import {
  DeveloperStep,
  ProjectStep,
  BuildingStep,
  UnitStep,
  LayoutStep,
  LeadInfoStep,
  ProductStep,
  QuotationResultStep,
} from './steps';
import { STEP_LABELS, TOTAL_STEPS } from './constants';
import type { FurnitureQuoteData } from './types';

interface Props {
  data: FurnitureQuoteData;
}

export const FurnitureQuoteSection = memo(function FurnitureQuoteSection({ data }: Props) {
  const toast = useToast();
  const { title = 'Báo Giá Nội Thất', subtitle = 'Chọn căn hộ và nhận báo giá nội thất ngay', maxWidth = 900 } = data;

  // Load quote logo from company settings
  const quoteLogo = useCompanyLogo('quote');

  // UI states
  const [currentStep, setCurrentStep] = useState(1);
  const [leadData, setLeadData] = useState<LeadData>({ name: '', phone: '', email: '' });

  // Custom hooks
  const { pageStates, setPage } = usePagination();
  const {
    selections,
    handleDeveloperSelect: onDeveloperSelect,
    handleProjectSelect: onProjectSelect,
    handleBuildingSelect: onBuildingSelect,
    handleFloorAxisSelect,
    handleApartmentTypeSelect: onApartmentTypeSelect,
    handleProductSelect,
    handleProductRemove,
    handleProductQuantityChange,
    handleFitInToggle,
    setFloor,
    setAxis,
    resetSelections,
  } = useSelections(null);

  const {
    developers,
    projects,
    buildings,
    apartmentTypes,
    categories,
    productGroups,
    fees,
    fitInFee,
    loading,
    error,
  } = useFurnitureData(selections);

  const {
    quotationResult,
    quotationId,
    submitting,
    emailStatus,
    emailError,
    emailErrorCode,
    calculateQuotation,
    getProductDisplayPrice,
    resetQuotation,
  } = useQuotation(
    selections,
    fees,
    fitInFee,
    leadData,
    (msg) => toast.error(msg),
    (msg) => toast.success(msg)
  );

  // Handlers with step navigation
  const handleDeveloperSelect = useCallback((dev: typeof selections.developer) => {
    if (dev) {
      onDeveloperSelect(dev);
      setCurrentStep(2);
    }
  }, [onDeveloperSelect]);

  const handleProjectSelect = useCallback((proj: typeof selections.project) => {
    if (proj) {
      onProjectSelect(proj);
      setCurrentStep(3);
    }
  }, [onProjectSelect]);

  const handleBuildingSelect = useCallback((bld: typeof selections.building) => {
    if (bld) {
      onBuildingSelect(bld);
      setCurrentStep(4);
    }
  }, [onBuildingSelect]);

  const handleUnitNext = useCallback(async () => {
    if (selections.floor && selections.axis !== null) {
      const layout = await handleFloorAxisSelect(selections.floor, selections.axis);
      if (layout) {
        setCurrentStep(5);
      } else {
        toast.error('Không tìm thấy thông tin căn hộ cho trục này');
      }
    } else {
      toast.error('Vui lòng chọn tầng và trục');
    }
  }, [selections.floor, selections.axis, handleFloorAxisSelect, toast]);

  const handleApartmentTypeSelect = useCallback((apt: typeof selections.apartmentTypeDetail) => {
    if (apt) {
      onApartmentTypeSelect(apt);
      setCurrentStep(6);
    }
  }, [onApartmentTypeSelect]);

  const handleLeadSubmit = useCallback((data: LeadData) => {
    setLeadData(data);
    setCurrentStep(7);
  }, []);

  const handleCalculateQuotation = useCallback(async () => {
    if (selections.products.length === 0) {
      toast.error('Vui lòng chọn ít nhất một sản phẩm');
      return;
    }
    if (!leadData.id && (!leadData.name || !leadData.phone || !leadData.email)) {
      toast.error('Vui lòng quay lại bước 6 để nhập thông tin liên hệ');
      setCurrentStep(6);
      return;
    }
    const success = await calculateQuotation();
    if (success) {
      setCurrentStep(9);
    }
  }, [selections.products.length, leadData, calculateQuotation, toast]);

  const handleStepClick = useCallback((step: number) => {
    if (step < currentStep) {
      setCurrentStep(step);
    }
  }, [currentStep]);

  const handleBack = useCallback(() => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  }, [currentStep]);

  const handleReset = useCallback(() => {
    setCurrentStep(1);
    resetSelections();
    setLeadData({ name: '', phone: '', email: '' });
    resetQuotation();
  }, [resetSelections, resetQuotation]);

  // Loading state
  if (loading) {
    return (
      <section style={{ padding: '4rem 1rem', minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          style={{
            width: 50,
            height: 50,
            borderRadius: '50%',
            borderWidth: '3px',
            borderStyle: 'solid',
            borderColor: `${tokens.color.border} ${tokens.color.border} ${tokens.color.border} ${tokens.color.primary}`,
          }}
        />
      </section>
    );
  }

  // Error state
  if (error) {
    return (
      <section style={{ padding: '4rem 1rem', minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '1rem' }}>
        <i className="ri-error-warning-line" style={{ fontSize: '3rem', color: tokens.color.primary }} />
        <p style={{ color: tokens.color.text, textAlign: 'center', maxWidth: 400 }}>
          {error.includes('Failed to fetch') || error.includes('NetworkError') || error.includes('404')
            ? 'Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng hoặc thử lại sau.'
            : error}
        </p>
        <button
          onClick={() => window.location.reload()}
          style={{
            padding: '0.75rem 1.5rem',
            borderRadius: tokens.radius.md,
            border: 'none',
            background: tokens.color.primary,
            color: '#111',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Thử lại
        </button>
      </section>
    );
  }

  return (
    <section style={{ padding: '4rem 1rem' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        {/* Header with optional logo */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          style={{ textAlign: 'center', marginBottom: '2rem' }}
        >
          {/* Quote Logo */}
          {quoteLogo && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              style={{ marginBottom: '1.5rem' }}
            >
              <img
                src={quoteLogo}
                alt="Logo"
                style={{
                  height: 'clamp(50px, 8vw, 80px)',
                  maxWidth: 'clamp(150px, 25vw, 250px)',
                  objectFit: 'contain',
                }}
              />
            </motion.div>
          )}
          <h2 style={{ fontSize: 'clamp(1.75rem, 5vw, 2.5rem)', fontWeight: 700, color: tokens.color.text, marginBottom: '0.75rem' }}>
            {title}
          </h2>
          <p style={{ fontSize: '1rem', color: tokens.color.muted, maxWidth: 500, margin: '0 auto' }}>
            {subtitle}
          </p>
        </motion.div>

        {/* Main Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          style={{
            maxWidth: maxWidth,
            margin: '0 auto',
            padding: '2rem',
            borderRadius: tokens.radius.lg,
            background: tokens.color.surface,
            border: `1px solid ${tokens.color.border}`,
          }}
        >
          {/* Step Indicator */}
          <StepIndicator
            currentStep={currentStep}
            totalSteps={TOTAL_STEPS}
            labels={[...STEP_LABELS]}
            onStepClick={handleStepClick}
          />

          <AnimatePresence mode="wait">
            {/* Step 1: Developer */}
            {currentStep === 1 && (
              <DeveloperStep
                developers={developers}
                selectedDeveloper={selections.developer}
                currentPage={pageStates.developers}
                onSelect={handleDeveloperSelect}
                onPageChange={(page) => setPage('developers', page)}
              />
            )}

            {/* Step 2: Project */}
            {currentStep === 2 && (
              <ProjectStep
                projects={projects}
                selectedProject={selections.project}
                selectedDeveloper={selections.developer}
                currentPage={pageStates.projects}
                onSelect={handleProjectSelect}
                onPageChange={(page) => setPage('projects', page)}
                onBack={handleBack}
              />
            )}

            {/* Step 3: Building */}
            {currentStep === 3 && (
              <BuildingStep
                buildings={buildings}
                selectedBuilding={selections.building}
                selectedProject={selections.project}
                currentPage={pageStates.buildings}
                onSelect={handleBuildingSelect}
                onPageChange={(page) => setPage('buildings', page)}
                onBack={handleBack}
              />
            )}

            {/* Step 4: Unit (Floor/Axis) */}
            {currentStep === 4 && selections.building && (
              <UnitStep
                building={selections.building}
                floor={selections.floor}
                axis={selections.axis}
                onFloorChange={setFloor}
                onAxisChange={setAxis}
                onNext={handleUnitNext}
                onBack={handleBack}
                nextDisabled={!selections.floor || selections.axis === null}
              />
            )}

            {/* Step 5: Layout */}
            {currentStep === 5 && (
              <LayoutStep
                apartmentTypes={apartmentTypes}
                selectedApartmentType={selections.apartmentTypeDetail}
                layout={selections.layout}
                currentPage={pageStates.layouts}
                onSelect={handleApartmentTypeSelect}
                onPageChange={(page) => setPage('layouts', page)}
                onBack={handleBack}
              />
            )}

            {/* Step 6: Lead Info */}
            {currentStep === 6 && (
              <LeadInfoStep
                initialData={leadData}
                onSubmit={handleLeadSubmit}
                onBack={handleBack}
              />
            )}

            {/* Step 7: Products */}
            {currentStep === 7 && (
              <ProductStep
                categories={categories}
                productGroups={productGroups}
                selectedProducts={selections.products}
                fitInFee={fitInFee}
                currentPage={pageStates.products}
                onProductSelect={handleProductSelect}
                onProductRemove={handleProductRemove}
                onQuantityChange={handleProductQuantityChange}
                onFitInToggle={handleFitInToggle}
                onPageChange={(page) => setPage('products', page)}
                onNext={() => setCurrentStep(8)}
                onBack={handleBack}
                getProductDisplayPrice={getProductDisplayPrice}
              />
            )}

            {/* Step 8: Confirmation */}
            {currentStep === 8 && (
              <ConfirmationStep
                products={selections.products}
                productGroups={productGroups}
                onVariantChange={(productBaseId, variant) => {
                  const group = productGroups.find(g => g.id === productBaseId);
                  if (group) {
                    handleProductSelect(productBaseId, group.name, variant, group.allowFitIn);
                  }
                }}
                onRemove={handleProductRemove}
                onQuantityChange={handleProductQuantityChange}
                onFitInToggle={handleFitInToggle}
                onBack={() => setCurrentStep(7)}
                onConfirm={handleCalculateQuotation}
                onAddMore={() => setCurrentStep(7)}
                submitting={submitting}
              />
            )}

            {/* Step 9: Quotation Result */}
            {currentStep === 9 && quotationResult && (
              <QuotationResultStep
                quotationId={quotationId}
                recipientEmail={leadData.email}
                onReset={handleReset}
                initialEmailStatus={emailStatus}
                initialEmailError={emailError}
                initialErrorCode={emailErrorCode}
              />
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </section>
  );
});
