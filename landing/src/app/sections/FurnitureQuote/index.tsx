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
  FurnitureApartmentType,
  FurnitureCategory,
  FurnitureProduct,
  FurnitureFee,
  QuotationItem,
} from '../../api/furniture';
import { LeadForm, LeadData } from './LeadForm';
import { StepIndicator, SelectionCard, NavigationButtons, Pagination } from './components';
import type { FurnitureQuoteData, Selections, QuotationResultData } from './types';

interface Props {
  data: FurnitureQuoteData;
}

// ============================================
// CONSTANTS
// ============================================

const ITEMS_PER_PAGE = 6; // Number of items per page for pagination

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
    products: [],
  });

  // Lead data
  const [leadData, setLeadData] = useState<LeadData>({ name: '', phone: '' });

  // Quotation result
  const [quotationResult, setQuotationResult] = useState<QuotationResultData | null>(null);
  const [quotationId, setQuotationId] = useState<string | null>(null);

  // Pagination states for each step
  const [pageStates, setPageStates] = useState({
    developers: 1,
    projects: 1,
    buildings: 1,
    layouts: 1,
    products: 1,
  });

  // Category filter for products
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Step labels - Requirements: 6.1
  const stepLabels = ['Chủ đầu tư', 'Dự án', 'Tòa nhà', 'Căn hộ', 'Layout', 'Thông tin', 'Nội thất', 'Báo giá'];
  const totalSteps = 8;

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

  // Fetch products and categories for custom selection
  useEffect(() => {
    if (selections.apartmentTypeDetail) {
      Promise.all([furnitureAPI.getCategories(), furnitureAPI.getProducts()])
        .then(([cats, prods]) => {
          setCategories(cats);
          setProducts(prods);
        })
        .catch(console.error);
    }
  }, [selections.apartmentTypeDetail]);

  // Fetch fees
  useEffect(() => {
    if (selections.apartmentTypeDetail) {
      furnitureAPI.getFees()
        .then(setFees)
        .catch(console.error);
    }
  }, [selections.apartmentTypeDetail]);

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
    if (selections.products.length === 0) {
      toast.error('Vui lòng chọn ít nhất một sản phẩm');
      return;
    }

    // Validate lead data exists (from step 6)
    if (!leadData.id && (!leadData.name || !leadData.phone)) {
      toast.error('Vui lòng quay lại bước 6 để nhập thông tin liên hệ');
      setCurrentStep(6);
      return;
    }

    setSubmitting(true);

    try {
      // Calculate quotation
      const basePrice = selections.products.reduce((sum, p) => sum + p.product.price * p.quantity, 0);
      const items: QuotationItem[] = [];
      
      selections.products.forEach((p) => {
        items.push({
          productId: p.product.id,
          name: p.product.name,
          price: p.product.price,
          quantity: p.quantity,
        });
      });

      // Apply fees
      const feesBreakdown = fees.filter(f => f.isActive).map((f) => ({
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
        // Use leadId if available (from LeadForm), otherwise pass leadData for API to create new lead
        const quotationPayload: Parameters<typeof furnitureAPI.createQuotation>[0] = {
          developerName: selections.developer.name,
          projectName: selections.project.name,
          buildingName: selections.building.name,
          buildingCode: selections.building.code,
          floor: selections.floor,
          axis: selections.axis,
          apartmentType: selections.apartmentTypeDetail.apartmentType,
          items,
        };

        // Only add layoutImageUrl if it's a valid non-empty string
        // Convert relative path to full URL using resolveMediaUrl
        if (selections.apartmentTypeDetail.imageUrl && selections.apartmentTypeDetail.imageUrl.trim() !== '') {
          quotationPayload.layoutImageUrl = resolveMediaUrl(selections.apartmentTypeDetail.imageUrl);
        }

        // If leadId exists (from LeadForm submission), use it; otherwise pass leadData
        if (leadData.id) {
          quotationPayload.leadId = leadData.id;
        } else {
          quotationPayload.leadData = {
            name: leadData.name,
            phone: leadData.phone,
            email: leadData.email || undefined,
          };
        }

        // Debug log
        console.log('[FurnitureQuote] Creating quotation with payload:', JSON.stringify(quotationPayload, null, 2));

        const quotation = await furnitureAPI.createQuotation(quotationPayload);
        
        // Store quotation ID and result, then move to step 8
        setQuotationId(quotation.id);
        setQuotationResult({ basePrice, fees: feesBreakdown, totalPrice });
        setCurrentStep(8);
        toast.success('Báo giá đã được tạo thành công!');
        return;
      }

      setQuotationResult({ basePrice, fees: feesBreakdown, totalPrice });
      setCurrentStep(8);
      toast.success('Báo giá đã được tạo thành công!');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Có lỗi xảy ra');
    } finally {
      setSubmitting(false);
    }
  }, [selections, fees, leadData, toast, setCurrentStep]);

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
                {(() => {
                  const totalPages = Math.ceil(developers.length / ITEMS_PER_PAGE);
                  const paginatedDevelopers = developers.slice(
                    (pageStates.developers - 1) * ITEMS_PER_PAGE,
                    pageStates.developers * ITEMS_PER_PAGE
                  );
                  return (
                    <>
                      <AnimatePresence mode="wait">
                        <motion.div
                          key={pageStates.developers}
                          initial={{ opacity: 0, x: 10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -10 }}
                          transition={{ duration: 0.2 }}
                          style={{ display: 'grid', gap: '0.75rem' }}
                        >
                          {paginatedDevelopers.map((dev) => (
                            <SelectionCard
                              key={dev.id}
                              title={dev.name}
                              icon="ri-building-4-line"
                              isSelected={selections.developer?.id === dev.id}
                              onClick={() => handleDeveloperSelect(dev)}
                            />
                          ))}
                        </motion.div>
                      </AnimatePresence>
                      <Pagination
                        currentPage={pageStates.developers}
                        totalPages={totalPages}
                        onPageChange={(page) => setPageStates(prev => ({ ...prev, developers: page }))}
                        itemsPerPage={ITEMS_PER_PAGE}
                        totalItems={developers.length}
                      />
                    </>
                  );
                })()}
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
                {(() => {
                  const totalPages = Math.ceil(projects.length / ITEMS_PER_PAGE);
                  const paginatedProjects = projects.slice(
                    (pageStates.projects - 1) * ITEMS_PER_PAGE,
                    pageStates.projects * ITEMS_PER_PAGE
                  );
                  return (
                    <>
                      <AnimatePresence mode="wait">
                        <motion.div
                          key={pageStates.projects}
                          initial={{ opacity: 0, x: 10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -10 }}
                          transition={{ duration: 0.2 }}
                          style={{ display: 'grid', gap: '0.75rem' }}
                        >
                          {paginatedProjects.map((proj) => (
                            <SelectionCard
                              key={proj.id}
                              title={proj.name}
                              subtitle={`Mã: ${proj.code}`}
                              icon="ri-community-line"
                              isSelected={selections.project?.id === proj.id}
                              onClick={() => handleProjectSelect(proj)}
                            />
                          ))}
                        </motion.div>
                      </AnimatePresence>
                      <Pagination
                        currentPage={pageStates.projects}
                        totalPages={totalPages}
                        onPageChange={(page) => setPageStates(prev => ({ ...prev, projects: page }))}
                        itemsPerPage={ITEMS_PER_PAGE}
                        totalItems={projects.length}
                      />
                    </>
                  );
                })()}
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
                {(() => {
                  const totalPages = Math.ceil(buildings.length / ITEMS_PER_PAGE);
                  const paginatedBuildings = buildings.slice(
                    (pageStates.buildings - 1) * ITEMS_PER_PAGE,
                    pageStates.buildings * ITEMS_PER_PAGE
                  );
                  return (
                    <>
                      <AnimatePresence mode="wait">
                        <motion.div
                          key={pageStates.buildings}
                          initial={{ opacity: 0, x: 10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -10 }}
                          transition={{ duration: 0.2 }}
                          style={{ display: 'grid', gap: '0.75rem' }}
                        >
                          {paginatedBuildings.map((bld) => (
                            <SelectionCard
                              key={bld.id}
                              title={bld.name}
                              subtitle={`Mã: ${bld.code} • ${bld.maxFloor} tầng • ${bld.maxAxis + 1} trục`}
                              icon="ri-building-line"
                              isSelected={selections.building?.id === bld.id}
                              onClick={() => handleBuildingSelect(bld)}
                            />
                          ))}
                        </motion.div>
                      </AnimatePresence>
                      <Pagination
                        currentPage={pageStates.buildings}
                        totalPages={totalPages}
                        onPageChange={(page) => setPageStates(prev => ({ ...prev, buildings: page }))}
                        itemsPerPage={ITEMS_PER_PAGE}
                        totalItems={buildings.length}
                      />
                    </>
                  );
                })()}
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

                {(() => {
                  const totalPages = Math.ceil(apartmentTypes.length / ITEMS_PER_PAGE);
                  const paginatedLayouts = apartmentTypes.slice(
                    (pageStates.layouts - 1) * ITEMS_PER_PAGE,
                    pageStates.layouts * ITEMS_PER_PAGE
                  );
                  return (
                    <>
                      <AnimatePresence mode="wait">
                        <motion.div
                          key={pageStates.layouts}
                          initial={{ opacity: 0, x: 10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -10 }}
                          transition={{ duration: 0.2 }}
                          style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1rem' }}
                        >
                          {paginatedLayouts.map((apt) => (
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
                        </motion.div>
                      </AnimatePresence>
                      <Pagination
                        currentPage={pageStates.layouts}
                        totalPages={totalPages}
                        onPageChange={(page) => setPageStates(prev => ({ ...prev, layouts: page }))}
                        itemsPerPage={ITEMS_PER_PAGE}
                        totalItems={apartmentTypes.length}
                      />
                    </>
                  );
                })()}

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

                {/* Custom Selection - Requirements: 7.3, 7.4, 7.5 */}
                <div>
                  {/* Category Filter */}
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                    <button
                      onClick={() => {
                        setSelectedCategory(null);
                        setPageStates(prev => ({ ...prev, products: 1 }));
                      }}
                      style={{
                        padding: '0.5rem 1rem',
                        borderRadius: tokens.radius.sm,
                        border: `1px solid ${selectedCategory === null ? tokens.color.primary : tokens.color.border}`,
                        background: selectedCategory === null ? `${tokens.color.primary}15` : tokens.color.surface,
                        color: selectedCategory === null ? tokens.color.primary : tokens.color.text,
                        fontSize: '0.875rem',
                        cursor: 'pointer',
                        fontWeight: selectedCategory === null ? 600 : 400,
                      }}
                    >
                      Tất cả
                    </button>
                    {categories.map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => {
                          setSelectedCategory(cat.id);
                          setPageStates(prev => ({ ...prev, products: 1 }));
                        }}
                        style={{
                          padding: '0.5rem 1rem',
                          borderRadius: tokens.radius.sm,
                          border: `1px solid ${selectedCategory === cat.id ? tokens.color.primary : tokens.color.border}`,
                          background: selectedCategory === cat.id ? `${tokens.color.primary}15` : tokens.color.surface,
                          color: selectedCategory === cat.id ? tokens.color.primary : tokens.color.text,
                          fontSize: '0.875rem',
                          cursor: 'pointer',
                          fontWeight: selectedCategory === cat.id ? 600 : 400,
                        }}
                      >
                        {cat.icon && <i className={cat.icon} style={{ marginRight: '0.25rem' }} />}
                        {cat.name}
                      </button>
                    ))}
                  </div>

                  {/* Products Grid with Pagination */}
                  {(() => {
                    const filteredProducts = selectedCategory
                      ? products.filter(p => p.categoryId === selectedCategory)
                      : products;
                    const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);
                    const paginatedProducts = filteredProducts.slice(
                      (pageStates.products - 1) * ITEMS_PER_PAGE,
                      pageStates.products * ITEMS_PER_PAGE
                    );
                    
                    return (
                      <>
                        <AnimatePresence mode="wait">
                          <motion.div
                            key={`${selectedCategory}-${pageStates.products}`}
                            initial={{ opacity: 0, x: 10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -10 }}
                            transition={{ duration: 0.2 }}
                            style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1rem' }}
                          >
                            {paginatedProducts.map((product) => {
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
                          </motion.div>
                        </AnimatePresence>
                        
                        {filteredProducts.length === 0 && (
                          <p style={{ textAlign: 'center', color: tokens.color.muted, padding: '2rem' }}>
                            Không có sản phẩm nào trong danh mục này
                          </p>
                        )}
                        
                        <Pagination
                          currentPage={pageStates.products}
                          totalPages={totalPages}
                          onPageChange={(page) => setPageStates(prev => ({ ...prev, products: page }))}
                          itemsPerPage={ITEMS_PER_PAGE}
                          totalItems={filteredProducts.length}
                        />
                      </>
                    );
                  })()}

                  {/* Selected Products Summary */}
                  {selections.products.length > 0 && (
                    <div
                      style={{
                        padding: '1rem',
                        borderRadius: tokens.radius.md,
                        background: `${tokens.color.primary}10`,
                        border: `1px solid ${tokens.color.primary}`,
                        marginBottom: '1rem',
                        marginTop: '1rem',
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

                <NavigationButtons
                  onBack={handleBack}
                  onNext={handleCalculateQuotation}
                  nextLabel={submitting ? 'Đang xử lý...' : 'Xem báo giá'}
                  nextDisabled={submitting || selections.products.length === 0}
                  showBack={true}
                />
              </motion.div>
            )}

            {/* Step 8: Quotation Result - Requirements: 7.6, 7.7, 7.8 */}
            {currentStep === 8 && quotationResult && (
              <motion.div
                key="step8"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                {/* Success Header */}
                <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                  >
                    <i
                      className="ri-checkbox-circle-fill"
                      style={{ fontSize: '2.5rem', color: tokens.color.primary }}
                    />
                  </motion.div>
                  <h3 style={{ margin: '0.5rem 0 0.25rem', fontSize: '1.1rem', fontWeight: 700, color: tokens.color.text }}>
                    Báo giá của bạn
                  </h3>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: tokens.color.muted }}>
                    Chúng tôi sẽ liên hệ với bạn sớm nhất
                  </p>
                </div>

                {/* Quotation Card - PDF Style */}
                <div
                  style={{
                    borderRadius: tokens.radius.md,
                    background: tokens.color.background,
                    border: `1px solid ${tokens.color.border}`,
                    overflow: 'hidden',
                    marginBottom: '1rem',
                  }}
                >
                  {/* Header - Company Info */}
                  <div
                    style={{
                      padding: '1rem 1.25rem',
                      borderBottom: `1px solid ${tokens.color.border}`,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 700, color: tokens.color.primary, fontSize: '1.25rem', fontFamily: 'serif' }}>
                        ANH THỢ XÂY
                      </div>
                      <div style={{ fontSize: '0.875rem', fontWeight: 600, color: tokens.color.text, marginTop: '0.25rem' }}>
                        BÁO GIÁ NỘI THẤT
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', fontSize: '0.75rem', color: tokens.color.muted }}>
                      <div>Ngày: <span style={{ color: tokens.color.primary }}>{new Date().toLocaleDateString('vi-VN')}</span></div>
                      {quotationId && <div>Mã: <span style={{ color: tokens.color.primary }}>{quotationId.slice(-8).toUpperCase()}</span></div>}
                    </div>
                  </div>

                  {/* Apartment Info Section */}
                  <div style={{ padding: '1rem 1.25rem', borderBottom: `1px solid ${tokens.color.border}` }}>
                    <div style={{ fontSize: '0.7rem', fontWeight: 600, color: tokens.color.primary, marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      <i className="ri-building-line" style={{ marginRight: '0.35rem' }} />
                      THÔNG TIN CĂN HỘ
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem 1.5rem', fontSize: '0.8rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: tokens.color.muted }}>Chủ đầu tư:</span>
                        <span style={{ color: tokens.color.primary, fontWeight: 500 }}>{selections.developer?.name}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: tokens.color.muted }}>Dự án:</span>
                        <span style={{ color: tokens.color.primary, fontWeight: 500 }}>{selections.project?.name}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: tokens.color.muted }}>Tòa nhà:</span>
                        <span style={{ color: tokens.color.primary, fontWeight: 500 }}>{selections.building?.name}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: tokens.color.muted }}>Căn hộ:</span>
                        <span style={{ color: tokens.color.primary, fontWeight: 500 }}>
                          {selections.floor && selections.axis !== null && selections.building && 
                            calculateUnitNumber(selections.building.code, selections.floor, selections.axis)}
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: tokens.color.muted }}>Loại:</span>
                        <span style={{ color: tokens.color.primary, fontWeight: 500 }}>{selections.apartmentTypeDetail?.apartmentType.toUpperCase()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Selection Type Section */}
                  <div style={{ padding: '1rem 1.25rem', borderBottom: `1px solid ${tokens.color.border}` }}>
                    <div style={{ fontSize: '0.7rem', fontWeight: 600, color: tokens.color.primary, marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      <i className="ri-checkbox-circle-line" style={{ marginRight: '0.35rem' }} />
                      NỘI THẤT ĐÃ CHỌN
                    </div>
                    <div style={{ fontSize: '0.85rem', color: tokens.color.text }}>
                      <span><i className="ri-sofa-line" style={{ marginRight: '0.35rem', color: tokens.color.primary }} />{selections.products.length} sản phẩm</span>
                    </div>
                  </div>

                  {/* Products Table - PDF Style */}
                  {selections.products.length > 0 && (
                    <div style={{ padding: '1rem 1.25rem', borderBottom: `1px solid ${tokens.color.border}` }}>
                      <div style={{ fontSize: '0.7rem', fontWeight: 600, color: tokens.color.primary, marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        <i className="ri-list-check" style={{ marginRight: '0.35rem' }} />
                        SẢN PHẨM ĐÃ CHỌN
                      </div>
                      {/* Table Header */}
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: '1fr 50px 90px 100px',
                          gap: '0.5rem',
                          padding: '0.5rem 0',
                          borderBottom: `1px solid ${tokens.color.border}`,
                          fontSize: '0.7rem',
                          color: tokens.color.muted,
                          fontWeight: 500,
                        }}
                      >
                        <span>Sản phẩm</span>
                        <span style={{ textAlign: 'right' }}>SL</span>
                        <span style={{ textAlign: 'right' }}>Đơn giá</span>
                        <span style={{ textAlign: 'right' }}>Thành tiền</span>
                      </div>
                      {/* Table Rows */}
                      {selections.products.map((item) => (
                        <div
                          key={item.product.id}
                          style={{
                            display: 'grid',
                            gridTemplateColumns: '1fr 50px 90px 100px',
                            gap: '0.5rem',
                            padding: '0.6rem 0',
                            borderBottom: `1px dashed ${tokens.color.border}`,
                            fontSize: '0.8rem',
                          }}
                        >
                          <span style={{ color: tokens.color.text }}>{item.product.name}</span>
                          <span style={{ textAlign: 'right', color: tokens.color.text }}>x{item.quantity}</span>
                          <span style={{ textAlign: 'right', color: tokens.color.muted }}>{formatCurrency(item.product.price)}</span>
                          <span style={{ textAlign: 'right', color: tokens.color.primary, fontWeight: 600 }}>
                            {formatCurrency(item.product.price * item.quantity)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Price Details Section - PDF Style */}
                  <div style={{ padding: '1rem 1.25rem' }}>
                    <div style={{ fontSize: '0.7rem', fontWeight: 600, color: tokens.color.primary, marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      <i className="ri-money-dollar-circle-line" style={{ marginRight: '0.35rem' }} />
                      CHI TIẾT GIÁ
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.85rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: tokens.color.muted }}>Giá nội thất:</span>
                        <span style={{ color: tokens.color.text, fontWeight: 500 }}>{formatCurrency(quotationResult.basePrice)} đ</span>
                      </div>
                      {quotationResult.fees.map((fee, idx) => (
                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: tokens.color.muted }}>
                            {fee.name}{fee.type === 'PERCENTAGE' ? ` (${fee.value}%)` : ''}:
                          </span>
                          <span style={{ color: tokens.color.text, fontWeight: 500 }}>{formatCurrency(fee.amount)} đ</span>
                        </div>
                      ))}
                      {/* Total */}
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          paddingTop: '0.75rem',
                          marginTop: '0.5rem',
                          borderTop: `2px solid ${tokens.color.primary}`,
                        }}
                      >
                        <span style={{ fontWeight: 700, color: tokens.color.primary, fontSize: '0.9rem' }}>TỔNG CỘNG:</span>
                        <span style={{ fontSize: '1.35rem', fontWeight: 700, color: tokens.color.primary }}>
                          {formatCurrency(quotationResult.totalPrice)} đ
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Footer Note */}
                  <div
                    style={{
                      padding: '0.75rem 1.25rem',
                      background: tokens.color.surface,
                      borderTop: `1px solid ${tokens.color.border}`,
                      textAlign: 'center',
                      fontSize: '0.7rem',
                      color: tokens.color.muted,
                      fontStyle: 'italic',
                    }}
                  >
                    Báo giá này chỉ mang tính chất tham khảo. Giá thực tế có thể thay đổi tùy theo thời điểm và điều kiện cụ thể.
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  {quotationId && (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={async () => {
                        try {
                          await furnitureAPI.downloadQuotationPdf(quotationId);
                        } catch {
                          toast.error('Không thể tải PDF');
                        }
                      }}
                      style={{
                        flex: 1,
                        padding: '0.875rem',
                        borderRadius: tokens.radius.md,
                        border: 'none',
                        background: `linear-gradient(135deg, ${tokens.color.primary}, ${tokens.color.accent})`,
                        color: '#111',
                        fontSize: '0.95rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
                      }}
                    >
                      <i className="ri-file-pdf-line" /> Tải PDF
                    </motion.button>
                  )}
                  <button
                    onClick={handleReset}
                    style={{
                      flex: 1,
                      padding: '0.875rem',
                      borderRadius: tokens.radius.md,
                      border: `1px solid ${tokens.color.border}`,
                      background: 'transparent',
                      color: tokens.color.text,
                      fontSize: '0.95rem',
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


