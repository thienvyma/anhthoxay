import { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { tokens, API_URL, resolveMediaUrl } from '@app/shared';
import { useToast } from '../components/Toast';
import { SaveQuoteModal } from '../components/SaveQuoteModal';

// Types
interface Formula {
  id: string;
  name: string;
  expression: string;
}

interface ServiceCategory {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  coefficient: number;
  materialCategoryIds: string[];
  allowMaterials: boolean; // computed from materialCategoryIds.length > 0
  formula?: Formula | null;
}

interface MaterialCategory {
  id: string;
  name: string;
  icon?: string;
}

interface Material {
  id: string;
  name: string;
  categoryId: string;
  category: MaterialCategory;
  price: number;
  unit: string;
  imageUrl?: string;
}

interface UnitPrice {
  id: string;
  price: number;
  tag: string;
}

interface SelectedMaterial {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

interface QuoteResult {
  categoryName: string;
  area: number;
  coefficient: number;
  baseCost: number;
  materials: SelectedMaterial[];
  materialsCost: number;
  grandTotal: number;
}

interface QuoteCalculatorData {
  title?: string;
  subtitle?: string;
  defaultTab?: 'calculator' | 'consultation';
  calculatorTab?: {
    label?: string;
    icon?: string;
  };
  consultationTab?: {
    label?: string;
    icon?: string;
    title?: string;
    subtitle?: string;
    buttonText?: string;
    successMessage?: string;
  };
  showMaterials?: boolean;
  maxWidth?: number;
  disclaimerText?: string;
}

interface Props {
  data: QuoteCalculatorData;
}

// Format currency
const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(value);
};

// Step indicator component
const StepIndicator = memo(function StepIndicator({
  currentStep,
  totalSteps,
  labels,
}: {
  currentStep: number;
  totalSteps: number;
  labels: string[];
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '2rem' }}>
      {Array.from({ length: totalSteps }, (_, i) => {
        const stepNum = i + 1;
        const isActive = stepNum === currentStep;
        const isCompleted = stepNum < currentStep;
        return (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                background: isActive || isCompleted ? tokens.color.primary : tokens.color.surface,
                border: `2px solid ${isActive || isCompleted ? tokens.color.primary : tokens.color.border}`,
                color: isActive || isCompleted ? '#fff' : tokens.color.textMuted,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.875rem',
                fontWeight: 600,
                transition: 'all 0.3s ease',
              }}
            >
              {isCompleted ? <i className="ri-check-line" /> : stepNum}
            </div>
            <span
              style={{
                fontSize: '0.875rem',
                color: isActive ? tokens.color.text : tokens.color.textMuted,
                fontWeight: isActive ? 600 : 400,
              }}
              className="step-label"
            >
              {labels[i]}
            </span>
            {i < totalSteps - 1 && (
              <div
                style={{
                  width: 40,
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
        @media (max-width: 600px) {
          .step-label { display: none !important; }
        }
      `}</style>
    </div>
  );
});


// Material Selector Component
const MaterialSelector = memo(function MaterialSelector({
  materials,
  selectedMaterials,
  onToggle,
  onQuantityChange,
}: {
  materials: Material[];
  selectedMaterials: SelectedMaterial[];
  onToggle: (material: Material) => void;
  onQuantityChange: (id: string, quantity: number) => void;
}) {
  const groupedMaterials = useMemo(() => {
    const groups: Record<string, Material[]> = {};
    materials.forEach((m) => {
      const catName = m.category?.name || 'Khác';
      if (!groups[catName]) groups[catName] = [];
      groups[catName].push(m);
    });
    return groups;
  }, [materials]);

  const isSelected = useCallback((id: string) => selectedMaterials.some((m) => m.id === id), [selectedMaterials]);
  const getQuantity = useCallback((id: string) => selectedMaterials.find((m) => m.id === id)?.quantity || 1, [selectedMaterials]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {Object.entries(groupedMaterials).map(([category, items]) => (
        <div key={category}>
          <h4 style={{ margin: '0 0 0.75rem', fontSize: '1rem', fontWeight: 600, color: tokens.color.text, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <i className="ri-folder-line" style={{ color: tokens.color.primary }} />
            {category}
            <span style={{ fontSize: '0.75rem', color: tokens.color.textMuted, fontWeight: 400 }}>({items.length})</span>
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
            {items.map((material) => {
              const selected = isSelected(material.id);
              return (
                <motion.div
                  key={material.id}
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  style={{
                    borderRadius: tokens.radius.md,
                    background: selected ? `${tokens.color.primary}15` : tokens.color.surface,
                    border: `2px solid ${selected ? tokens.color.primary : tokens.color.border}`,
                    cursor: 'pointer',
                    overflow: 'hidden',
                    transition: 'all 0.2s ease',
                  }}
                  onClick={() => onToggle(material)}
                >
                  {/* Image */}
                  <div style={{ position: 'relative', width: '100%', height: '120px', background: tokens.color.background, overflow: 'hidden' }}>
                    {material.imageUrl ? (
                      <img
                        src={resolveMediaUrl(material.imageUrl)}
                        alt={material.name}
                        loading="lazy"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: `${tokens.color.primary}15` }}>
                        <i className="ri-image-line" style={{ fontSize: '2.5rem', color: 'rgba(255,255,255,0.3)' }} />
                      </div>
                    )}
                    {/* Selection indicator */}
                    <div
                      style={{
                        position: 'absolute',
                        top: '8px',
                        right: '8px',
                        width: 24,
                        height: 24,
                        borderRadius: '50%',
                        border: `2px solid ${selected ? tokens.color.primary : 'rgba(255,255,255,0.8)'}`,
                        background: selected ? tokens.color.primary : 'rgba(0,0,0,0.3)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {selected && <i className="ri-check-line" style={{ color: '#fff', fontSize: '14px' }} />}
                    </div>
                  </div>
                  {/* Info */}
                  <div style={{ padding: '0.75rem' }}>
                    <div style={{ fontWeight: 600, color: tokens.color.text, fontSize: '0.85rem', marginBottom: '0.25rem' }}>{material.name}</div>
                    <div style={{ fontSize: '0.9rem', color: tokens.color.primary, fontWeight: 600 }}>
                      {formatCurrency(material.price)}
                      <span style={{ fontSize: '0.75rem', color: tokens.color.textMuted, fontWeight: 400 }}>/{material.unit}</span>
                    </div>
                    {/* Quantity selector */}
                    {selected && (
                      <div
                        style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem', background: tokens.color.background, borderRadius: tokens.radius.sm }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={() => onQuantityChange(material.id, Math.max(1, getQuantity(material.id) - 1))}
                          style={{ width: 28, height: 28, borderRadius: '50%', border: `1px solid ${tokens.color.border}`, background: 'transparent', color: tokens.color.text, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        >
                          <i className="ri-subtract-line" />
                        </button>
                        <input
                          type="number"
                          min={1}
                          value={getQuantity(material.id)}
                          onChange={(e) => onQuantityChange(material.id, parseInt(e.target.value) || 1)}
                          style={{ width: 40, padding: '0.25rem', borderRadius: tokens.radius.sm, border: `1px solid ${tokens.color.border}`, background: tokens.color.surface, color: tokens.color.text, fontSize: '0.85rem', textAlign: 'center', boxSizing: 'border-box' }}
                        />
                        <button
                          onClick={() => onQuantityChange(material.id, getQuantity(material.id) + 1)}
                          style={{ width: 28, height: 28, borderRadius: '50%', border: `1px solid ${tokens.color.border}`, background: 'transparent', color: tokens.color.text, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        >
                          <i className="ri-add-line" />
                        </button>
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
});

// Import QuoteFormSection for consultation tab
import { QuoteFormSection } from './QuoteFormSection';

// Interface for QUOTE_FORM section data
interface QuoteFormSectionData {
  title?: string;
  subtitle?: string;
  buttonText?: string;
  showNameField?: boolean;
  showPhoneField?: boolean;
  showEmailField?: boolean;
  showContentField?: boolean;
  showAddressField?: boolean;
  customFields?: Array<{
    _id: string;
    name: string;
    label: string;
    type: 'text' | 'textarea' | 'number' | 'email' | 'tel' | 'select';
    placeholder?: string;
    required?: boolean;
    options?: string;
  }>;
  layout?: 'card' | 'simple' | 'glass';
  buttonColor?: string;
  successMessage?: string;
}


// Main QuoteCalculatorSection Component
export const QuoteCalculatorSection = memo(function QuoteCalculatorSection({ data }: Props) {
  const toast = useToast();
  const {
    title = 'Báo Giá & Dự Toán',
    subtitle = 'Tính toán chi phí cải tạo nhà nhanh chóng và chính xác',
    defaultTab = 'calculator',
    calculatorTab = { label: 'Dự Toán Nhanh', icon: 'ri-calculator-line' },
    consultationTab = { label: 'Đăng Ký Tư Vấn', icon: 'ri-phone-line' },
    showMaterials = true,
    maxWidth = 900,
    disclaimerText = '* Giá trên chỉ mang tính tham khảo. Liên hệ để được báo giá chính xác.',
  } = data;

  // Data states
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [unitPrices, setUnitPrices] = useState<UnitPrice[]>([]);
  const [quoteFormData, setQuoteFormData] = useState<QuoteFormSectionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Wizard states
  const [activeTab, setActiveTab] = useState<'calculator' | 'consultation'>(defaultTab);
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [area, setArea] = useState<number>(0);
  const [selectedMaterials, setSelectedMaterials] = useState<SelectedMaterial[]>([]);
  const [quoteResult, setQuoteResult] = useState<QuoteResult | null>(null);
  const [saveModalOpen, setSaveModalOpen] = useState(false);

  // Fetch data including QUOTE_FORM section for consultation tab
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [catRes, matRes, priceRes, quoteFormRes] = await Promise.all([
          fetch(`${API_URL}/service-categories`),
          fetch(`${API_URL}/materials`),
          fetch(`${API_URL}/unit-prices`),
          fetch(`${API_URL}/sections/by-kind/QUOTE_FORM`),
        ]);
        if (!catRes.ok || !matRes.ok || !priceRes.ok) throw new Error('Failed to fetch data');
        const [catJson, matJson, priceJson] = await Promise.all([catRes.json(), matRes.json(), priceRes.json()]);
        
        // Unwrap standardized response format { success: true, data: T }
        setCategories(catJson.data || catJson);
        setMaterials(matJson.data || matJson);
        setUnitPrices(priceJson.data || priceJson);
        
        // Load QUOTE_FORM section data if available
        if (quoteFormRes.ok) {
          const quoteFormJson = await quoteFormRes.json();
          // Unwrap standardized response format { success: true, data: T }
          const quoteFormSection = quoteFormJson.data || quoteFormJson;
          setQuoteFormData(quoteFormSection.data as QuoteFormSectionData);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Có lỗi xảy ra');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Get selected category object
  const currentCategory = useMemo(() => categories.find((c) => c.id === selectedCategory), [categories, selectedCategory]);

  // Filter materials based on selected category's materialCategoryIds
  const filteredMaterials = useMemo(() => {
    if (!currentCategory || !currentCategory.materialCategoryIds?.length) return [];
    return materials.filter(m => currentCategory.materialCategoryIds.includes(m.categoryId));
  }, [materials, currentCategory]);

  // Determine total steps based on category
  const totalSteps = useMemo(() => (currentCategory?.allowMaterials && showMaterials ? 4 : 3), [currentCategory, showMaterials]);
  const stepLabels = useMemo(
    () => (currentCategory?.allowMaterials && showMaterials ? ['Hạng mục', 'Diện tích', 'Vật dụng', 'Kết quả'] : ['Hạng mục', 'Diện tích', 'Kết quả']),
    [currentCategory, showMaterials]
  );

  // Calculate quote
  const calculateQuote = useCallback(() => {
    if (!currentCategory || area <= 0) return;

    const formula = currentCategory.formula;
    let basePrice = 0;

    if (formula) {
      const tagMatch = formula.expression.match(/\b([A-Z_]+)\b/g);
      if (tagMatch) {
        for (const tag of tagMatch) {
          if (tag === 'DIEN_TICH') continue;
          const unitPrice = unitPrices.find((p) => p.tag === tag);
          if (unitPrice) {
            basePrice = unitPrice.price;
            break;
          }
        }
      }
    }
    if (basePrice === 0) basePrice = 50000;

    const baseCost = area * basePrice * currentCategory.coefficient;
    const materialsCost = selectedMaterials.reduce((sum, m) => sum + m.price * m.quantity, 0);

    setQuoteResult({
      categoryName: currentCategory.name,
      area,
      coefficient: currentCategory.coefficient,
      baseCost,
      materials: selectedMaterials,
      materialsCost,
      grandTotal: baseCost + materialsCost,
    });
    setCurrentStep(totalSteps);
  }, [currentCategory, area, selectedMaterials, unitPrices, totalSteps]);

  // Handlers
  const handleCategorySelect = useCallback((id: string) => {
    setSelectedCategory(id);
    setSelectedMaterials([]);
    setQuoteResult(null);
    setCurrentStep(2);
  }, []);

  const handleAreaNext = useCallback(() => {
    if (area <= 0) {
      toast.error('Vui lòng nhập diện tích');
      return;
    }
    if (currentCategory?.allowMaterials && showMaterials) {
      setCurrentStep(3);
    } else {
      calculateQuote();
    }
  }, [area, currentCategory, showMaterials, calculateQuote, toast]);

  const handleMaterialToggle = useCallback((material: Material) => {
    setSelectedMaterials((prev) => {
      const exists = prev.find((m) => m.id === material.id);
      if (exists) return prev.filter((m) => m.id !== material.id);
      return [...prev, { id: material.id, name: material.name, price: material.price, quantity: 1 }];
    });
  }, []);

  const handleQuantityChange = useCallback((id: string, quantity: number) => {
    setSelectedMaterials((prev) => prev.map((m) => (m.id === id ? { ...m, quantity: Math.max(1, quantity) } : m)));
  }, []);

  const handleReset = useCallback(() => {
    setCurrentStep(1);
    setSelectedCategory(null);
    setArea(0);
    setSelectedMaterials([]);
    setQuoteResult(null);
  }, []);

  if (loading) {
    return (
      <section style={{ padding: '4rem 1rem', minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          style={{ width: 50, height: 50, borderRadius: '50%', borderWidth: '3px', borderStyle: 'solid', borderColor: `${tokens.color.border} ${tokens.color.border} ${tokens.color.border} ${tokens.color.primary}` }}
        />
      </section>
    );
  }

  if (error) {
    return (
      <section style={{ padding: '4rem 1rem', minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '1rem' }}>
        <i className="ri-error-warning-line" style={{ fontSize: '3rem', color: tokens.color.primary }} />
        <p style={{ color: tokens.color.text }}>{error}</p>
      </section>
    );
  }

  return (
    <section style={{ padding: '4rem 1rem' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h2 style={{ fontSize: 'clamp(1.75rem, 5vw, 2.5rem)', fontWeight: 700, color: tokens.color.text, marginBottom: '0.75rem' }}>{title}</h2>
          <p style={{ fontSize: '1rem', color: tokens.color.textMuted, maxWidth: 500, margin: '0 auto' }}>{subtitle}</p>
        </motion.div>

        {/* Tab Switcher */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginBottom: '2rem' }}>
          <button
            onClick={() => setActiveTab('calculator')}
            style={{
              padding: '0.75rem 1.5rem',
              borderRadius: tokens.radius.md,
              border: 'none',
              background: activeTab === 'calculator' ? tokens.color.primary : tokens.color.surface,
              color: activeTab === 'calculator' ? '#fff' : tokens.color.text,
              fontSize: '0.9rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <i className={calculatorTab.icon || 'ri-calculator-line'} />
            {calculatorTab.label || 'Dự Toán Nhanh'}
          </button>
          <button
            onClick={() => setActiveTab('consultation')}
            style={{
              padding: '0.75rem 1.5rem',
              borderRadius: tokens.radius.md,
              border: 'none',
              background: activeTab === 'consultation' ? tokens.color.primary : tokens.color.surface,
              color: activeTab === 'consultation' ? '#fff' : tokens.color.text,
              fontSize: '0.9rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <i className={consultationTab.icon || 'ri-phone-line'} />
            {consultationTab.label || 'Đăng Ký Tư Vấn'}
          </button>
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'calculator' ? (
            <motion.div
              key="calculator"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              style={{
                maxWidth: maxWidth,
                margin: '0 auto',
                padding: '2.5rem',
                borderRadius: tokens.radius.lg,
                background: tokens.color.surface,
                border: `1px solid ${tokens.color.border}`,
              }}
            >
              <StepIndicator currentStep={currentStep} totalSteps={totalSteps} labels={stepLabels} />

              <AnimatePresence mode="wait">
                {/* Step 1: Select Category */}
                {currentStep === 1 && (
                  <motion.div key="step1" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                    <h3 style={{ margin: '0 0 1rem', fontSize: '1.1rem', fontWeight: 600, color: tokens.color.text }}>Chọn hạng mục thi công</h3>
                    <div style={{ display: 'grid', gap: '0.75rem' }}>
                      {categories.map((cat) => (
                        <motion.div
                          key={cat.id}
                          whileHover={{ scale: 1.01 }}
                          whileTap={{ scale: 0.99 }}
                          onClick={() => handleCategorySelect(cat.id)}
                          style={{
                            padding: '1rem 1.25rem',
                            borderRadius: tokens.radius.md,
                            background: selectedCategory === cat.id ? `${tokens.color.primary}15` : tokens.color.background,
                            border: `1px solid ${selectedCategory === cat.id ? tokens.color.primary : tokens.color.border}`,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '1rem',
                          }}
                        >
                          {cat.icon && <i className={cat.icon} style={{ fontSize: '1.5rem', color: tokens.color.primary }} />}
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 600, color: tokens.color.text }}>{cat.name}</div>
                            {cat.description && <div style={{ fontSize: '0.8rem', color: tokens.color.textMuted }}>{cat.description}</div>}
                          </div>
                          <i className="ri-arrow-right-s-line" style={{ color: tokens.color.textMuted }} />
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* Step 2: Enter Area */}
                {currentStep === 2 && (
                  <motion.div key="step2" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                    <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.1rem', fontWeight: 600, color: tokens.color.text }}>Nhập diện tích thi công</h3>
                    <p style={{ margin: '0 0 1.5rem', fontSize: '0.875rem', color: tokens.color.textMuted }}>
                      Hạng mục: <strong style={{ color: tokens.color.primary }}>{currentCategory?.name}</strong>
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                      <input
                        type="number"
                        min={0}
                        value={area || ''}
                        onChange={(e) => setArea(parseFloat(e.target.value) || 0)}
                        autoFocus
                        style={{
                          flex: 1,
                          padding: '1rem',
                          borderRadius: tokens.radius.md,
                          border: `1px solid ${tokens.color.border}`,
                          background: tokens.color.background,
                          color: tokens.color.text,
                          fontSize: '1.5rem',
                          textAlign: 'center',
                          boxSizing: 'border-box',
                        }}
                        placeholder="0"
                      />
                      <span style={{ fontSize: '1.25rem', color: tokens.color.textMuted, fontWeight: 500 }}>m²</span>
                    </div>
                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                      <button onClick={() => setCurrentStep(1)} style={{ flex: 1, padding: '0.875rem', borderRadius: tokens.radius.md, border: `1px solid ${tokens.color.border}`, background: 'transparent', color: tokens.color.text, fontSize: '1rem', cursor: 'pointer' }}>
                        <i className="ri-arrow-left-line" /> Quay lại
                      </button>
                      <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleAreaNext} style={{ flex: 2, padding: '0.875rem', borderRadius: tokens.radius.md, border: 'none', background: tokens.color.primary, color: '#fff', fontSize: '1rem', fontWeight: 600, cursor: 'pointer' }}>
                        {currentCategory?.allowMaterials && showMaterials ? 'Tiếp tục' : 'Tính dự toán'} <i className="ri-arrow-right-line" />
                      </motion.button>
                    </div>
                  </motion.div>
                )}

                {/* Step 3: Select Materials */}
                {currentStep === 3 && currentCategory?.allowMaterials && showMaterials && (
                  <motion.div key="step3" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                    <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.1rem', fontWeight: 600, color: tokens.color.text }}>Chọn vật dụng (tùy chọn)</h3>
                    <p style={{ margin: '0 0 1.5rem', fontSize: '0.875rem', color: tokens.color.textMuted }}>{currentCategory?.name} - {area} m²</p>
                    <div style={{ maxHeight: 450, overflowY: 'auto', marginBottom: '1.5rem', paddingRight: '0.5rem' }}>
                      <MaterialSelector materials={filteredMaterials} selectedMaterials={selectedMaterials} onToggle={handleMaterialToggle} onQuantityChange={handleQuantityChange} />
                    </div>
                    {selectedMaterials.length > 0 && (
                      <div style={{ padding: '0.75rem', background: `${tokens.color.primary}10`, borderRadius: tokens.radius.md, marginBottom: '1rem' }}>
                        <div style={{ fontSize: '0.875rem', color: tokens.color.textMuted }}>Đã chọn {selectedMaterials.length} vật dụng</div>
                        <div style={{ fontSize: '1rem', fontWeight: 600, color: tokens.color.primary }}>+ {formatCurrency(selectedMaterials.reduce((sum, m) => sum + m.price * m.quantity, 0))}</div>
                      </div>
                    )}
                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                      <button onClick={() => setCurrentStep(2)} style={{ flex: 1, padding: '0.875rem', borderRadius: tokens.radius.md, border: `1px solid ${tokens.color.border}`, background: 'transparent', color: tokens.color.text, fontSize: '1rem', cursor: 'pointer' }}>
                        <i className="ri-arrow-left-line" /> Quay lại
                      </button>
                      <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={calculateQuote} style={{ flex: 2, padding: '0.875rem', borderRadius: tokens.radius.md, border: 'none', background: tokens.color.primary, color: '#fff', fontSize: '1rem', fontWeight: 600, cursor: 'pointer' }}>
                        Tính dự toán <i className="ri-calculator-line" />
                      </motion.button>
                    </div>
                  </motion.div>
                )}

                {/* Step 4 (or 3): Result */}
                {currentStep === totalSteps && quoteResult && (
                  <motion.div key="result" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                    <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                      <i className="ri-checkbox-circle-fill" style={{ fontSize: '3rem', color: tokens.color.primary }} />
                      <h3 style={{ margin: '0.5rem 0', fontSize: '1.25rem', fontWeight: 700, color: tokens.color.text }}>Kết Quả Dự Toán</h3>
                    </div>
                    <div style={{ padding: '1.25rem', borderRadius: tokens.radius.md, background: tokens.color.background, marginBottom: '1rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                        <span style={{ color: tokens.color.textMuted }}>Hạng mục:</span>
                        <span style={{ fontWeight: 500, color: tokens.color.text }}>{quoteResult.categoryName}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                        <span style={{ color: tokens.color.textMuted }}>Diện tích:</span>
                        <span style={{ fontWeight: 500, color: tokens.color.text }}>{quoteResult.area} m²</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                        <span style={{ color: tokens.color.textMuted }}>Chi phí thi công:</span>
                        <span style={{ fontWeight: 500, color: tokens.color.text }}>{formatCurrency(quoteResult.baseCost)}</span>
                      </div>
                      {quoteResult.materialsCost > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                          <span style={{ color: tokens.color.textMuted }}>Chi phí vật dụng:</span>
                          <span style={{ fontWeight: 500, color: tokens.color.text }}>{formatCurrency(quoteResult.materialsCost)}</span>
                        </div>
                      )}
                    </div>
                    <div style={{ padding: '1.25rem', borderRadius: tokens.radius.md, background: `linear-gradient(135deg, ${tokens.color.primary}20, ${tokens.color.primary}10)`, border: `1px solid ${tokens.color.primary}30`, marginBottom: '1.5rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '1rem', fontWeight: 600, color: tokens.color.text }}>TỔNG DỰ TOÁN</span>
                        <span style={{ fontSize: '1.5rem', fontWeight: 700, color: tokens.color.primary }}>{formatCurrency(quoteResult.grandTotal)}</span>
                      </div>
                    </div>
                    <p style={{ fontSize: '0.8rem', color: tokens.color.textMuted, textAlign: 'center', marginBottom: '1.5rem' }}>{disclaimerText}</p>
                    <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                      <button onClick={handleReset} style={{ flex: '1 1 100px', padding: '0.875rem', borderRadius: tokens.radius.md, border: `1px solid ${tokens.color.border}`, background: 'transparent', color: tokens.color.text, fontSize: '0.9rem', cursor: 'pointer' }}>
                        <i className="ri-refresh-line" /> Tính lại
                      </button>
                      <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => setSaveModalOpen(true)} style={{ flex: '1 1 150px', padding: '0.875rem', borderRadius: tokens.radius.md, border: 'none', background: tokens.color.success, color: '#fff', fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                        <i className="ri-save-line" /> Lưu Báo Giá
                      </motion.button>
                      <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => setActiveTab('consultation')} style={{ flex: '1 1 150px', padding: '0.875rem', borderRadius: tokens.radius.md, border: 'none', background: tokens.color.primary, color: '#111', fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                        <i className="ri-phone-line" /> Nhận Tư Vấn
                      </motion.button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ) : (
            <motion.div
              key="consultation"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              style={{
                maxWidth: maxWidth,
                margin: '0 auto',
              }}
            >
              {/* Use shared QUOTE_FORM section - syncs with admin edits */}
              <QuoteFormSection 
                data={quoteFormData || {
                  title: 'Đăng Ký Tư Vấn Trực Tiếp',
                  subtitle: 'Để lại thông tin, chúng tôi sẽ liên hệ bạn trong 24h',
                  buttonText: 'Đăng Ký Tư Vấn',
                  successMessage: 'Đăng ký thành công! Chúng tôi sẽ liên hệ bạn sớm.',
                  layout: 'card',
                }}
                noPadding
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Save Quote Modal */}
      {quoteResult && (
        <SaveQuoteModal
          isOpen={saveModalOpen}
          onClose={() => setSaveModalOpen(false)}
          quoteResult={quoteResult}
          onSuccess={handleReset}
        />
      )}
    </section>
  );
});

export default QuoteCalculatorSection;
