/**
 * FurnitureQuote Section - Main Component
 * Feature: furniture-quotation
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 7.1, 7.2, 7.3, 7.6, 7.8
 */

import { useState, useEffect, useCallback, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { tokens, resolveMediaUrl } from '@app/shared';
import { useToast } from '../../components/Toast';
import {
  furnitureAPI,
  FurnitureDeveloper,
  FurnitureProject,
  FurnitureBuilding,
  FurnitureLayout,
  FurnitureApartmentType,
  FurnitureCategory,
  FurnitureProduct,
  FurnitureCombo,
  FurnitureFee,
  QuotationItem,
} from '../../api/furniture';
import { LeadForm, LeadData } from './LeadForm';

// ============================================
// TYPES
// ============================================

interface FurnitureQuoteData {
  title?: string;
  subtitle?: string;
  maxWidth?: number;
}

interface Props {
  data: FurnitureQuoteData;
}

interface Selections {
  developer: FurnitureDeveloper | null;
  project: FurnitureProject | null;
  building: FurnitureBuilding | null;
  floor: number | null;
  axis: number | null;
  layout: FurnitureLayout | null;
  apartmentTypeDetail: FurnitureApartmentType | null;
  selectionType: 'COMBO' | 'CUSTOM' | null;
  combo: FurnitureCombo | null;
  products: Array<{ product: FurnitureProduct; quantity: number }>;
}

interface QuotationResultData {
  basePrice: number;
  fees: Array<{ name: string; type: string; value: number; amount: number }>;
  totalPrice: number;
}

// ============================================
// HELPERS
// ============================================

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(value);
};

const calculateUnitNumber = (buildingCode: string, floor: number, axis: number): string => {
  return `${buildingCode}.${floor.toString().padStart(2, '0')}${axis.toString().padStart(2, '0')}`;
};

// ============================================
// STEP INDICATOR COMPONENT
// Requirements: 6.1 - Display steps 1-7 with current step highlighted
// ============================================

const StepIndicator = memo(function StepIndicator({
  currentStep,
  totalSteps,
  labels,
  onStepClick,
}: {
  currentStep: number;
  totalSteps: number;
  labels: string[];
  onStepClick?: (step: number) => void;
}) {
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

// ============================================
// SELECTION CARD COMPONENT
// ============================================

const SelectionCard = memo(function SelectionCard({
  title,
  subtitle,
  icon,
  imageUrl,
  isSelected,
  onClick,
}: {
  title: string;
  subtitle?: string;
  icon?: string;
  imageUrl?: string | null;
  isSelected?: boolean;
  onClick: () => void;
}) {
  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      style={{
        padding: '1rem 1.25rem',
        borderRadius: tokens.radius.md,
        background: isSelected ? `${tokens.color.primary}15` : tokens.color.surface,
        border: `2px solid ${isSelected ? tokens.color.primary : tokens.color.border}`,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        transition: 'all 0.2s ease',
      }}
    >
      {imageUrl ? (
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: tokens.radius.sm,
            background: `url(${resolveMediaUrl(imageUrl)}) center/cover`,
            flexShrink: 0,
          }}
        />
      ) : icon ? (
        <i className={icon} style={{ fontSize: '1.5rem', color: tokens.color.primary }} />
      ) : (
        <i className="ri-building-line" style={{ fontSize: '1.5rem', color: tokens.color.primary }} />
      )}
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 600, color: tokens.color.text }}>{title}</div>
        {subtitle && (
          <div style={{ fontSize: '0.8rem', color: tokens.color.muted }}>{subtitle}</div>
        )}
      </div>
      {isSelected && (
        <i className="ri-check-circle-fill" style={{ fontSize: '1.25rem', color: tokens.color.primary }} />
      )}
    </motion.div>
  );
});

// ============================================
// NAVIGATION BUTTONS COMPONENT
// Requirements: 6.1 - Next/Back buttons
// ============================================

const NavigationButtons = memo(function NavigationButtons({
  onBack,
  onNext,
  backLabel = 'Quay lại',
  nextLabel = 'Tiếp tục',
  nextDisabled = false,
  showBack = true,
}: {
  onBack?: () => void;
  onNext?: () => void;
  backLabel?: string;
  nextLabel?: string;
  nextDisabled?: boolean;
  showBack?: boolean;
}) {
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

// ============================================
// MAIN COMPONENT
// ============================================

export const FurnitureQuoteSection = memo(function FurnitureQuoteSection({ data }: Props) {
  const toast = useToast();
  const { title = 'Báo Giá Nội Thất', subtitle = 'Chọn căn hộ và nhận báo giá nội thất ngay', maxWidth = 900 } = data;

  // Data states
  const [developers, setDevelopers] = useState<FurnitureDeveloper[]>([]);
  const [projects, setProjects] = useState<FurnitureProject[]>([]);
  const [buildings, setBuildings] = useState<FurnitureBuilding[]>([]);
  const [apartmentTypes, setApartmentTypes] = useState<FurnitureApartmentType[]>([]);
  const [categories, setCategories] = useState<FurnitureCategory[]>([]);
  const [products, setProducts] = useState<FurnitureProduct[]>([]);
  const [combos, setCombos] = useState<FurnitureCombo[]>([]);
  const [fees, setFees] = useState<FurnitureFee[]>([]);

  // UI states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  // Selection states
  const [selections, setSelections] = useState<Selections>({
    developer: null,
    project: null,
    building: null,
    floor: null,
    axis: null,
    layout: null,
    apartmentTypeDetail: null,
    selectionType: null,
    combo: null,
    products: [],
  });

  // Lead data
  const [leadData, setLeadData] = useState<LeadData>({ name: '', phone: '' });

  // Quotation result
  const [quotationResult, setQuotationResult] = useState<QuotationResultData | null>(null);

  // Step labels - Requirements: 6.1
  const stepLabels = ['Chủ đầu tư', 'Dự án', 'Tòa nhà', 'Căn hộ', 'Layout', 'Thông tin', 'Nội thất'];
  const totalSteps = 7;

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const devs = await furnitureAPI.getDevelopers();
        setDevelopers(devs);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Có lỗi xảy ra');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Fetch projects when developer changes
  useEffect(() => {
    if (selections.developer) {
      furnitureAPI.getProjects(selections.developer.id).then(setProjects).catch(console.error);
    } else {
      setProjects([]);
    }
  }, [selections.developer]);

  // Fetch buildings when project changes
  useEffect(() => {
    if (selections.project) {
      furnitureAPI.getBuildings(selections.project.id).then(setBuildings).catch(console.error);
    } else {
      setBuildings([]);
    }
  }, [selections.project]);

  // Fetch apartment types when layout is determined
  useEffect(() => {
    if (selections.layout && selections.building) {
      furnitureAPI
        .getApartmentTypes(selections.building.code, selections.layout.apartmentType)
        .then(setApartmentTypes)
        .catch(console.error);
    } else {
      setApartmentTypes([]);
    }
  }, [selections.layout, selections.building]);

  // Fetch combos when apartment type is selected
  useEffect(() => {
    if (selections.apartmentTypeDetail) {
      furnitureAPI
        .getCombos(selections.apartmentTypeDetail.apartmentType)
        .then(setCombos)
        .catch(console.error);
    } else {
      setCombos([]);
    }
  }, [selections.apartmentTypeDetail]);

  // Fetch products and categories for custom selection
  useEffect(() => {
    if (selections.selectionType === 'CUSTOM') {
      Promise.all([furnitureAPI.getCategories(), furnitureAPI.getProducts()])
        .then(([cats, prods]) => {
          setCategories(cats);
          setProducts(prods);
        })
        .catch(console.error);
    }
  }, [selections.selectionType]);

  // Fetch fees
  useEffect(() => {
    if (selections.selectionType) {
      furnitureAPI.getFees(selections.selectionType).then(setFees).catch(console.error);
    }
  }, [selections.selectionType]);

  // ============================================
  // HANDLERS
  // ============================================

  const handleDeveloperSelect = useCallback((dev: FurnitureDeveloper) => {
    setSelections((prev) => ({
      ...prev,
      developer: dev,
      project: null,
      building: null,
      floor: null,
      axis: null,
      layout: null,
      apartmentTypeDetail: null,
      selectionType: null,
      combo: null,
      products: [],
    }));
    setCurrentStep(2);
  }, []);

  const handleProjectSelect = useCallback((proj: FurnitureProject) => {
    setSelections((prev) => ({
      ...prev,
      project: proj,
      building: null,
      floor: null,
      axis: null,
      layout: null,
      apartmentTypeDetail: null,
      selectionType: null,
      combo: null,
      products: [],
    }));
    setCurrentStep(3);
  }, []);

  const handleBuildingSelect = useCallback((bld: FurnitureBuilding) => {
    setSelections((prev) => ({
      ...prev,
      building: bld,
      floor: null,
      axis: null,
      layout: null,
      apartmentTypeDetail: null,
      selectionType: null,
      combo: null,
      products: [],
    }));
    setCurrentStep(4);
  }, []);

  const handleFloorAxisSelect = useCallback(
    async (floor: number, axis: number) => {
      if (!selections.building) return;

      try {
        const layout = await furnitureAPI.getLayoutByAxis(selections.building.code, axis);
        if (!layout) {
          toast.error('Không tìm thấy thông tin căn hộ cho trục này');
          return;
        }

        setSelections((prev) => ({
          ...prev,
          floor,
          axis,
          layout,
          apartmentTypeDetail: null,
          selectionType: null,
          combo: null,
          products: [],
        }));
        setCurrentStep(5);
      } catch {
        toast.error('Có lỗi xảy ra khi tìm thông tin căn hộ');
      }
    },
    [selections.building, toast]
  );

  const handleApartmentTypeSelect = useCallback((apt: FurnitureApartmentType) => {
    setSelections((prev) => ({
      ...prev,
      apartmentTypeDetail: apt,
      selectionType: null,
      combo: null,
      products: [],
    }));
    setCurrentStep(6);
  }, []);

  // Handle lead form submission - now receives data from LeadForm component
  // Requirements: 5.5, 6.11 - Store leadId for quotation, proceed to furniture selection
  const handleLeadSubmit = useCallback((data: LeadData) => {
    setLeadData(data);
    setCurrentStep(7);
  }, []);

  const handleSelectionTypeSelect = useCallback((type: 'COMBO' | 'CUSTOM') => {
    setSelections((prev) => ({
      ...prev,
      selectionType: type,
      combo: null,
      products: [],
    }));
  }, []);

  const handleComboSelect = useCallback((combo: FurnitureCombo) => {
    setSelections((prev) => ({ ...prev, combo, products: [] }));
  }, []);

  const handleProductToggle = useCallback((product: FurnitureProduct) => {
    setSelections((prev) => {
      const exists = prev.products.find((p) => p.product.id === product.id);
      if (exists) {
        return { ...prev, products: prev.products.filter((p) => p.product.id !== product.id) };
      }
      return { ...prev, products: [...prev.products, { product, quantity: 1 }] };
    });
  }, []);

  const handleProductQuantityChange = useCallback((productId: string, quantity: number) => {
    setSelections((prev) => ({
      ...prev,
      products: prev.products.map((p) =>
        p.product.id === productId ? { ...p, quantity: Math.max(1, quantity) } : p
      ),
    }));
  }, []);

  const handleCalculateQuotation = useCallback(async () => {
    if (!selections.selectionType) {
      toast.error('Vui lòng chọn loại nội thất');
      return;
    }

    if (selections.selectionType === 'COMBO' && !selections.combo) {
      toast.error('Vui lòng chọn combo');
      return;
    }

    if (selections.selectionType === 'CUSTOM' && selections.products.length === 0) {
      toast.error('Vui lòng chọn ít nhất một sản phẩm');
      return;
    }

    setSubmitting(true);

    try {
      // Calculate quotation
      let basePrice = 0;
      const items: QuotationItem[] = [];

      if (selections.selectionType === 'COMBO' && selections.combo) {
        basePrice = selections.combo.price;
        items.push({
          productId: selections.combo.id,
          name: selections.combo.name,
          price: selections.combo.price,
          quantity: 1,
        });
      } else {
        basePrice = selections.products.reduce((sum, p) => sum + p.product.price * p.quantity, 0);
        selections.products.forEach((p) => {
          items.push({
            productId: p.product.id,
            name: p.product.name,
            price: p.product.price,
            quantity: p.quantity,
          });
        });
      }

      // Apply fees
      const applicableFees = fees.filter(
        (f) => f.applicability === 'BOTH' || f.applicability === selections.selectionType
      );

      const feesBreakdown = applicableFees.map((f) => ({
        name: f.name,
        type: f.type,
        value: f.value,
        amount: f.type === 'FIXED' ? f.value : (basePrice * f.value) / 100,
      }));

      const totalFees = feesBreakdown.reduce((sum, f) => sum + f.amount, 0);
      const totalPrice = basePrice + totalFees;

      // Create quotation via API
      if (selections.developer && selections.project && selections.building && 
          selections.floor && selections.axis !== null && selections.apartmentTypeDetail) {
        await furnitureAPI.createQuotation({
          leadData: {
            name: leadData.name,
            phone: leadData.phone,
            email: leadData.email,
          },
          developerName: selections.developer.name,
          projectName: selections.project.name,
          buildingName: selections.building.name,
          buildingCode: selections.building.code,
          floor: selections.floor,
          axis: selections.axis,
          apartmentType: selections.apartmentTypeDetail.apartmentType,
          layoutImageUrl: selections.apartmentTypeDetail.imageUrl || undefined,
          selectionType: selections.selectionType,
          comboId: selections.combo?.id,
          comboName: selections.combo?.name,
          items,
        });
      }

      setQuotationResult({ basePrice, fees: feesBreakdown, totalPrice });
      toast.success('Báo giá đã được tạo thành công!');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Có lỗi xảy ra');
    } finally {
      setSubmitting(false);
    }
  }, [selections, fees, leadData, toast]);

  // Step click handler - Requirements: 6.1 - Allow clicking previous steps to go back
  const handleStepClick = useCallback((step: number) => {
    if (step < currentStep) {
      setCurrentStep(step);
    }
  }, [currentStep]);

  // Back button handler
  const handleBack = useCallback(() => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  }, [currentStep]);

  // Reset handler
  const handleReset = useCallback(() => {
    setCurrentStep(1);
    setSelections({
      developer: null,
      project: null,
      building: null,
      floor: null,
      axis: null,
      layout: null,
      apartmentTypeDetail: null,
      selectionType: null,
      combo: null,
      products: [],
    });
    setLeadData({ name: '', phone: '' });
    setQuotationResult(null);
  }, []);

  // ============================================
  // RENDER
  // ============================================

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
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          style={{ textAlign: 'center', marginBottom: '2rem' }}
        >
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
          {/* Step Indicator - Requirements: 6.1 */}
          <StepIndicator
            currentStep={currentStep}
            totalSteps={totalSteps}
            labels={stepLabels}
            onStepClick={handleStepClick}
          />

          <AnimatePresence mode="wait">
            {/* Step 1: Select Developer - Requirements: 6.1 */}
            {currentStep === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <h3 style={{ margin: '0 0 1rem', fontSize: '1.1rem', fontWeight: 600, color: tokens.color.text }}>
                  <i className="ri-building-4-line" style={{ marginRight: '0.5rem', color: tokens.color.primary }} />
                  Chọn chủ đầu tư
                </h3>
                <div style={{ display: 'grid', gap: '0.75rem' }}>
                  {developers.map((dev) => (
                    <SelectionCard
                      key={dev.id}
                      title={dev.name}
                      icon="ri-building-4-line"
                      isSelected={selections.developer?.id === dev.id}
                      onClick={() => handleDeveloperSelect(dev)}
                    />
                  ))}
                </div>
                {developers.length === 0 && (
                  <p style={{ textAlign: 'center', color: tokens.color.muted, padding: '2rem' }}>
                    Chưa có dữ liệu chủ đầu tư
                  </p>
                )}
              </motion.div>
            )}

            {/* Step 2: Select Project - Requirements: 6.2 */}
            {currentStep === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.1rem', fontWeight: 600, color: tokens.color.text }}>
                  <i className="ri-community-line" style={{ marginRight: '0.5rem', color: tokens.color.primary }} />
                  Chọn dự án
                </h3>
                <p style={{ margin: '0 0 1rem', fontSize: '0.875rem', color: tokens.color.muted }}>
                  Chủ đầu tư: <strong style={{ color: tokens.color.primary }}>{selections.developer?.name}</strong>
                </p>
                <div style={{ display: 'grid', gap: '0.75rem' }}>
                  {projects.map((proj) => (
                    <SelectionCard
                      key={proj.id}
                      title={proj.name}
                      subtitle={`Mã: ${proj.code}`}
                      icon="ri-community-line"
                      isSelected={selections.project?.id === proj.id}
                      onClick={() => handleProjectSelect(proj)}
                    />
                  ))}
                </div>
                {projects.length === 0 && (
                  <p style={{ textAlign: 'center', color: tokens.color.muted, padding: '2rem' }}>
                    Chưa có dự án nào
                  </p>
                )}
                <NavigationButtons onBack={handleBack} showBack={true} />
              </motion.div>
            )}

            {/* Step 3: Select Building - Requirements: 6.3 */}
            {currentStep === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.1rem', fontWeight: 600, color: tokens.color.text }}>
                  <i className="ri-building-line" style={{ marginRight: '0.5rem', color: tokens.color.primary }} />
                  Chọn tòa nhà
                </h3>
                <p style={{ margin: '0 0 1rem', fontSize: '0.875rem', color: tokens.color.muted }}>
                  Dự án: <strong style={{ color: tokens.color.primary }}>{selections.project?.name}</strong>
                </p>
                <div style={{ display: 'grid', gap: '0.75rem' }}>
                  {buildings.map((bld) => (
                    <SelectionCard
                      key={bld.id}
                      title={bld.name}
                      subtitle={`Mã: ${bld.code} • ${bld.maxFloor} tầng • ${bld.maxAxis + 1} trục`}
                      icon="ri-building-line"
                      isSelected={selections.building?.id === bld.id}
                      onClick={() => handleBuildingSelect(bld)}
                    />
                  ))}
                </div>
                {buildings.length === 0 && (
                  <p style={{ textAlign: 'center', color: tokens.color.muted, padding: '2rem' }}>
                    Chưa có tòa nhà nào
                  </p>
                )}
                <NavigationButtons onBack={handleBack} showBack={true} />
              </motion.div>
            )}

            {/* Step 4: Select Floor and Axis - Requirements: 6.4, 6.5 */}
            {currentStep === 4 && selections.building && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.1rem', fontWeight: 600, color: tokens.color.text }}>
                  <i className="ri-home-line" style={{ marginRight: '0.5rem', color: tokens.color.primary }} />
                  Chọn căn hộ
                </h3>
                <p style={{ margin: '0 0 1rem', fontSize: '0.875rem', color: tokens.color.muted }}>
                  Tòa: <strong style={{ color: tokens.color.primary }}>{selections.building.name}</strong>
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                  {/* Floor Selection */}
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500, color: tokens.color.text }}>
                      Tầng
                    </label>
                    <select
                      value={selections.floor || ''}
                      onChange={(e) => setSelections((prev) => ({ ...prev, floor: parseInt(e.target.value) || null }))}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        borderRadius: tokens.radius.md,
                        border: `1px solid ${tokens.color.border}`,
                        background: tokens.color.background,
                        color: tokens.color.text,
                        fontSize: '1rem',
                      }}
                    >
                      <option value="">Chọn tầng</option>
                      {Array.from({ length: selections.building.maxFloor }, (_, i) => i + 1).map((floor) => (
                        <option key={floor} value={floor}>
                          Tầng {floor}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Axis Selection */}
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500, color: tokens.color.text }}>
                      Trục
                    </label>
                    <select
                      value={selections.axis !== null ? selections.axis : ''}
                      onChange={(e) => setSelections((prev) => ({ ...prev, axis: e.target.value !== '' ? parseInt(e.target.value) : null }))}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        borderRadius: tokens.radius.md,
                        border: `1px solid ${tokens.color.border}`,
                        background: tokens.color.background,
                        color: tokens.color.text,
                        fontSize: '1rem',
                      }}
                    >
                      <option value="">Chọn trục</option>
                      {Array.from({ length: selections.building.maxAxis + 1 }, (_, i) => i).map((axis) => (
                        <option key={axis} value={axis}>
                          Trục {axis.toString().padStart(2, '0')}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Unit Number Preview - Requirements: 6.5 */}
                {selections.floor && selections.axis !== null && (
                  <div
                    style={{
                      padding: '1rem',
                      borderRadius: tokens.radius.md,
                      background: `${tokens.color.primary}15`,
                      border: `1px solid ${tokens.color.primary}`,
                      marginBottom: '1rem',
                    }}
                  >
                    <div style={{ fontSize: '0.875rem', color: tokens.color.muted }}>Số căn hộ:</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700, color: tokens.color.primary }}>
                      {calculateUnitNumber(selections.building.code, selections.floor, selections.axis)}
                    </div>
                  </div>
                )}

                <NavigationButtons
                  onBack={handleBack}
                  onNext={() => {
                    if (selections.floor && selections.axis !== null) {
                      handleFloorAxisSelect(selections.floor, selections.axis);
                    } else {
                      toast.error('Vui lòng chọn tầng và trục');
                    }
                  }}
                  nextDisabled={!selections.floor || selections.axis === null}
                  showBack={true}
                />
              </motion.div>
            )}

            {/* Step 5: Select Layout - Requirements: 6.8, 6.9, 6.10 */}
            {currentStep === 5 && (
              <motion.div
                key="step5"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.1rem', fontWeight: 600, color: tokens.color.text }}>
                  <i className="ri-layout-line" style={{ marginRight: '0.5rem', color: tokens.color.primary }} />
                  Chọn layout căn hộ
                </h3>
                <p style={{ margin: '0 0 1rem', fontSize: '0.875rem', color: tokens.color.muted }}>
                  Loại căn hộ: <strong style={{ color: tokens.color.primary }}>{selections.layout?.apartmentType?.toUpperCase()}</strong>
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1rem' }}>
                  {apartmentTypes.map((apt) => (
                    <motion.div
                      key={apt.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleApartmentTypeSelect(apt)}
                      style={{
                        borderRadius: tokens.radius.md,
                        background: selections.apartmentTypeDetail?.id === apt.id ? `${tokens.color.primary}15` : tokens.color.surface,
                        border: `2px solid ${selections.apartmentTypeDetail?.id === apt.id ? tokens.color.primary : tokens.color.border}`,
                        cursor: 'pointer',
                        overflow: 'hidden',
                      }}
                    >
                      {apt.imageUrl && (
                        <div style={{ width: '100%', height: 180, background: tokens.color.background }}>
                          <img
                            src={resolveMediaUrl(apt.imageUrl)}
                            alt={apt.apartmentType}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        </div>
                      )}
                      <div style={{ padding: '1rem' }}>
                        <div style={{ fontWeight: 600, color: tokens.color.text, marginBottom: '0.25rem' }}>
                          {apt.apartmentType.toUpperCase()}
                        </div>
                        {apt.description && (
                          <div style={{ fontSize: '0.8rem', color: tokens.color.muted }}>{apt.description}</div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>

                {apartmentTypes.length === 0 && (
                  <p style={{ textAlign: 'center', color: tokens.color.muted, padding: '2rem' }}>
                    Không tìm thấy thông tin layout
                  </p>
                )}

                <NavigationButtons onBack={handleBack} showBack={true} />
              </motion.div>
            )}

            {/* Step 6: Lead Form - Requirements: 5.4, 5.5, 6.11 */}
            {currentStep === 6 && (
              <motion.div
                key="step6"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <LeadForm
                  onSubmit={handleLeadSubmit}
                  initialData={leadData}
                  formConfig={{
                    title: 'Thông tin liên hệ',
                    subtitle: 'Vui lòng nhập thông tin để nhận báo giá',
                    buttonText: 'Tiếp tục chọn nội thất',
                  }}
                />
                
                {/* Back button */}
                <button
                  onClick={handleBack}
                  style={{
                    width: '100%',
                    marginTop: '0.75rem',
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
                  <i className="ri-arrow-left-line" /> Quay lại
                </button>
              </motion.div>
            )}

            {/* Step 7: Furniture Selection - Requirements: 7.1, 7.2, 7.3, 7.4, 7.5 */}
            {currentStep === 7 && (
              <motion.div
                key="step7"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <h3 style={{ margin: '0 0 1rem', fontSize: '1.1rem', fontWeight: 600, color: tokens.color.text }}>
                  <i className="ri-sofa-line" style={{ marginRight: '0.5rem', color: tokens.color.primary }} />
                  Chọn nội thất
                </h3>

                {/* Selection Type Toggle - Requirements: 7.1 */}
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
                  <button
                    onClick={() => handleSelectionTypeSelect('COMBO')}
                    style={{
                      flex: 1,
                      padding: '1rem',
                      borderRadius: tokens.radius.md,
                      border: `2px solid ${selections.selectionType === 'COMBO' ? tokens.color.primary : tokens.color.border}`,
                      background: selections.selectionType === 'COMBO' ? `${tokens.color.primary}15` : 'transparent',
                      color: tokens.color.text,
                      fontSize: '1rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                    }}
                  >
                    <i className="ri-gift-line" style={{ color: tokens.color.primary }} />
                    Combo
                  </button>
                  <button
                    onClick={() => handleSelectionTypeSelect('CUSTOM')}
                    style={{
                      flex: 1,
                      padding: '1rem',
                      borderRadius: tokens.radius.md,
                      border: `2px solid ${selections.selectionType === 'CUSTOM' ? tokens.color.primary : tokens.color.border}`,
                      background: selections.selectionType === 'CUSTOM' ? `${tokens.color.primary}15` : 'transparent',
                      color: tokens.color.text,
                      fontSize: '1rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                    }}
                  >
                    <i className="ri-settings-line" style={{ color: tokens.color.primary }} />
                    Tùy chỉnh
                  </button>
                </div>

                {/* Combo Selection - Requirements: 7.2 */}
                {selections.selectionType === 'COMBO' && (
                  <div style={{ display: 'grid', gap: '0.75rem', marginBottom: '1rem' }}>
                    {combos.map((combo) => (
                      <motion.div
                        key={combo.id}
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        onClick={() => handleComboSelect(combo)}
                        style={{
                          padding: '1rem',
                          borderRadius: tokens.radius.md,
                          background: selections.combo?.id === combo.id ? `${tokens.color.primary}15` : tokens.color.background,
                          border: `2px solid ${selections.combo?.id === combo.id ? tokens.color.primary : tokens.color.border}`,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '1rem',
                        }}
                      >
                        {combo.imageUrl && (
                          <div
                            style={{
                              width: 80,
                              height: 80,
                              borderRadius: tokens.radius.sm,
                              background: `url(${resolveMediaUrl(combo.imageUrl)}) center/cover`,
                              flexShrink: 0,
                            }}
                          />
                        )}
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 600, color: tokens.color.text }}>{combo.name}</div>
                          {combo.description && (
                            <div style={{ fontSize: '0.8rem', color: tokens.color.muted, marginTop: '0.25rem' }}>
                              {combo.description}
                            </div>
                          )}
                          <div style={{ fontSize: '1.1rem', fontWeight: 700, color: tokens.color.primary, marginTop: '0.5rem' }}>
                            {formatCurrency(combo.price)}
                          </div>
                        </div>
                        {selections.combo?.id === combo.id && (
                          <i className="ri-check-circle-fill" style={{ fontSize: '1.5rem', color: tokens.color.primary }} />
                        )}
                      </motion.div>
                    ))}
                    {combos.length === 0 && (
                      <p style={{ textAlign: 'center', color: tokens.color.muted, padding: '2rem' }}>
                        Không có combo nào cho loại căn hộ này
                      </p>
                    )}
                  </div>
                )}

                {/* Custom Selection - Requirements: 7.3, 7.4, 7.5 */}
                {selections.selectionType === 'CUSTOM' && (
                  <div>
                    {/* Category Filter */}
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                      {categories.map((cat) => (
                        <button
                          key={cat.id}
                          style={{
                            padding: '0.5rem 1rem',
                            borderRadius: tokens.radius.sm,
                            border: `1px solid ${tokens.color.border}`,
                            background: tokens.color.surface,
                            color: tokens.color.text,
                            fontSize: '0.875rem',
                            cursor: 'pointer',
                          }}
                        >
                          {cat.icon && <i className={cat.icon} style={{ marginRight: '0.25rem' }} />}
                          {cat.name}
                        </button>
                      ))}
                    </div>

                    {/* Products Grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                      {products.map((product) => {
                        const isSelected = selections.products.some((p) => p.product.id === product.id);
                        const selectedProduct = selections.products.find((p) => p.product.id === product.id);
                        return (
                          <motion.div
                            key={product.id}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => handleProductToggle(product)}
                            style={{
                              borderRadius: tokens.radius.md,
                              background: isSelected ? `${tokens.color.primary}15` : tokens.color.background,
                              border: `2px solid ${isSelected ? tokens.color.primary : tokens.color.border}`,
                              cursor: 'pointer',
                              overflow: 'hidden',
                            }}
                          >
                            {product.imageUrl && (
                              <div style={{ width: '100%', height: 120, background: tokens.color.surface }}>
                                <img
                                  src={resolveMediaUrl(product.imageUrl)}
                                  alt={product.name}
                                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                />
                              </div>
                            )}
                            <div style={{ padding: '0.75rem' }}>
                              <div style={{ fontWeight: 600, color: tokens.color.text, fontSize: '0.85rem' }}>
                                {product.name}
                              </div>
                              <div style={{ fontSize: '0.9rem', fontWeight: 600, color: tokens.color.primary, marginTop: '0.25rem' }}>
                                {formatCurrency(product.price)}
                              </div>
                              {isSelected && selectedProduct && (
                                <div
                                  style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <button
                                    onClick={() => handleProductQuantityChange(product.id, selectedProduct.quantity - 1)}
                                    style={{
                                      width: 24,
                                      height: 24,
                                      borderRadius: '50%',
                                      border: `1px solid ${tokens.color.border}`,
                                      background: 'transparent',
                                      color: tokens.color.text,
                                      cursor: 'pointer',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                    }}
                                  >
                                    <i className="ri-subtract-line" style={{ fontSize: '0.75rem' }} />
                                  </button>
                                  <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>{selectedProduct.quantity}</span>
                                  <button
                                    onClick={() => handleProductQuantityChange(product.id, selectedProduct.quantity + 1)}
                                    style={{
                                      width: 24,
                                      height: 24,
                                      borderRadius: '50%',
                                      border: `1px solid ${tokens.color.border}`,
                                      background: 'transparent',
                                      color: tokens.color.text,
                                      cursor: 'pointer',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                    }}
                                  >
                                    <i className="ri-add-line" style={{ fontSize: '0.75rem' }} />
                                  </button>
                                </div>
                              )}
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>

                    {/* Selected Products Summary */}
                    {selections.products.length > 0 && (
                      <div
                        style={{
                          padding: '1rem',
                          borderRadius: tokens.radius.md,
                          background: `${tokens.color.primary}10`,
                          border: `1px solid ${tokens.color.primary}`,
                          marginBottom: '1rem',
                        }}
                      >
                        <div style={{ fontSize: '0.875rem', color: tokens.color.muted }}>
                          Đã chọn {selections.products.length} sản phẩm
                        </div>
                        <div style={{ fontSize: '1.25rem', fontWeight: 700, color: tokens.color.primary }}>
                          {formatCurrency(selections.products.reduce((sum, p) => sum + p.product.price * p.quantity, 0))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <NavigationButtons
                  onBack={handleBack}
                  onNext={handleCalculateQuotation}
                  nextLabel={submitting ? 'Đang xử lý...' : 'Xem báo giá'}
                  nextDisabled={
                    submitting ||
                    !selections.selectionType ||
                    (selections.selectionType === 'COMBO' && !selections.combo) ||
                    (selections.selectionType === 'CUSTOM' && selections.products.length === 0)
                  }
                  showBack={true}
                />
              </motion.div>
            )}

            {/* Quotation Result */}
            {quotationResult && (
              <motion.div
                key="result"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                  >
                    <i
                      className="ri-checkbox-circle-fill"
                      style={{ fontSize: '4rem', color: tokens.color.primary }}
                    />
                  </motion.div>
                  <h3 style={{ margin: '1rem 0 0.5rem', fontSize: '1.5rem', fontWeight: 700, color: tokens.color.text }}>
                    Báo giá của bạn
                  </h3>
                </div>

                {/* Summary */}
                <div
                  style={{
                    padding: '1.5rem',
                    borderRadius: tokens.radius.md,
                    background: tokens.color.background,
                    marginBottom: '1.5rem',
                  }}
                >
                  {/* Apartment Info */}
                  <div style={{ marginBottom: '1rem', paddingBottom: '1rem', borderBottom: `1px solid ${tokens.color.border}` }}>
                    <div style={{ fontSize: '0.875rem', color: tokens.color.muted }}>Căn hộ</div>
                    <div style={{ fontWeight: 600, color: tokens.color.text }}>
                      {selections.building?.name} - {selections.floor && selections.axis !== null && calculateUnitNumber(selections.building?.code || '', selections.floor, selections.axis)}
                    </div>
                    <div style={{ fontSize: '0.875rem', color: tokens.color.muted }}>
                      {selections.apartmentTypeDetail?.apartmentType.toUpperCase()}
                    </div>
                  </div>

                  {/* Price Breakdown */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: tokens.color.muted }}>Giá nội thất</span>
                      <span style={{ fontWeight: 600, color: tokens.color.text }}>{formatCurrency(quotationResult.basePrice)}</span>
                    </div>
                    {quotationResult.fees.map((fee, idx) => (
                      <div key={idx} style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: tokens.color.muted }}>
                          {fee.name} {fee.type === 'PERCENTAGE' && `(${fee.value}%)`}
                        </span>
                        <span style={{ color: tokens.color.text }}>{formatCurrency(fee.amount)}</span>
                      </div>
                    ))}
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        paddingTop: '0.75rem',
                        marginTop: '0.5rem',
                        borderTop: `2px solid ${tokens.color.border}`,
                      }}
                    >
                      <span style={{ fontWeight: 700, color: tokens.color.text }}>Tổng cộng</span>
                      <span style={{ fontSize: '1.5rem', fontWeight: 700, color: tokens.color.primary }}>
                        {formatCurrency(quotationResult.totalPrice)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button
                    onClick={handleReset}
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
                    <i className="ri-refresh-line" /> Báo giá mới
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </section>
  );
});


