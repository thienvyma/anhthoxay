/**
 * FurnitureSelector Component - Step 6 for Furniture Selection (Combo/Custom)
 * Feature: furniture-quotation
 * Requirements: 7.1, 7.2, 7.3, 7.4, 7.5
 */

import { useState, useEffect, useCallback, memo, useMemo } from 'react';
import { motion } from 'framer-motion';
import { tokens, resolveMediaUrl } from '@app/shared';
import {
  furnitureAPI,
  FurnitureCategory,
  FurnitureProduct,
  FurnitureCombo,
} from '../../api/furniture';

// ============================================
// TYPES
// ============================================

export type SelectionType = 'COMBO' | 'CUSTOM';
export type SortOrder = 'asc' | 'desc';

export interface SelectedProduct {
  product: FurnitureProduct;
  quantity: number;
}

export interface FurnitureSelectorProps {
  apartmentType: string;
  onSelect: (selection: FurnitureSelection) => void;
  onBack: () => void;
  onError: (message: string) => void;
}

export interface FurnitureSelection {
  selectionType: SelectionType;
  combo: FurnitureCombo | null;
  products: SelectedProduct[];
  totalPrice: number;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Format currency in Vietnamese format
 */
const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(value);
};

// ============================================
// NAVIGATION BUTTONS COMPONENT
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
// SELECTION TYPE TOGGLE COMPONENT
// Requirements: 7.1 - Two buttons: Combo and Custom
// ============================================

const SelectionTypeToggle = memo(function SelectionTypeToggle({
  selectionType,
  onSelect,
}: {
  selectionType: SelectionType | null;
  onSelect: (type: SelectionType) => void;
}) {
  return (
    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
      <button
        onClick={() => onSelect('COMBO')}
        style={{
          flex: 1,
          padding: '1rem',
          borderRadius: tokens.radius.md,
          border: `2px solid ${selectionType === 'COMBO' ? tokens.color.primary : tokens.color.border}`,
          background: selectionType === 'COMBO' ? `${tokens.color.primary}15` : 'transparent',
          color: tokens.color.text,
          fontSize: '1rem',
          fontWeight: 600,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.5rem',
          transition: 'all 0.2s ease',
        }}
      >
        <i className="ri-gift-line" style={{ color: tokens.color.primary }} />
        Combo
      </button>
      <button
        onClick={() => onSelect('CUSTOM')}
        style={{
          flex: 1,
          padding: '1rem',
          borderRadius: tokens.radius.md,
          border: `2px solid ${selectionType === 'CUSTOM' ? tokens.color.primary : tokens.color.border}`,
          background: selectionType === 'CUSTOM' ? `${tokens.color.primary}15` : 'transparent',
          color: tokens.color.text,
          fontSize: '1rem',
          fontWeight: 600,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.5rem',
          transition: 'all 0.2s ease',
        }}
      >
        <i className="ri-settings-line" style={{ color: tokens.color.primary }} />
        Tùy chỉnh
      </button>
    </div>
  );
});

// ============================================
// COMBO CARD COMPONENT
// Requirements: 7.2 - Display combo cards with image, name, price
// ============================================

const ComboCard = memo(function ComboCard({
  combo,
  isSelected,
  onSelect,
}: {
  combo: FurnitureCombo;
  isSelected: boolean;
  onSelect: () => void;
}) {
  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      onClick={onSelect}
      style={{
        padding: '1rem',
        borderRadius: tokens.radius.md,
        background: isSelected ? `${tokens.color.primary}15` : tokens.color.background,
        border: `2px solid ${isSelected ? tokens.color.primary : tokens.color.border}`,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        transition: 'all 0.2s ease',
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
      {!combo.imageUrl && (
        <div
          style={{
            width: 80,
            height: 80,
            borderRadius: tokens.radius.sm,
            background: tokens.color.surface,
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <i className="ri-gift-line" style={{ fontSize: '2rem', color: tokens.color.muted }} />
        </div>
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
      {isSelected && (
        <i className="ri-check-circle-fill" style={{ fontSize: '1.5rem', color: tokens.color.primary }} />
      )}
    </motion.div>
  );
});

// ============================================
// COMBO SELECTION VIEW
// Requirements: 7.2 - Fetch combos filtered by apartmentType
// ============================================

const ComboSelectionView = memo(function ComboSelectionView({
  combos,
  selectedCombo,
  onSelect,
  loading,
}: {
  combos: FurnitureCombo[];
  selectedCombo: FurnitureCombo | null;
  onSelect: (combo: FurnitureCombo) => void;
  loading: boolean;
}) {
  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          style={{
            width: 32,
            height: 32,
            borderRadius: '50%',
            borderWidth: '3px',
            borderStyle: 'solid',
            borderColor: `${tokens.color.border} ${tokens.color.border} ${tokens.color.border} ${tokens.color.primary}`,
          }}
        />
      </div>
    );
  }

  if (combos.length === 0) {
    return (
      <div
        style={{
          textAlign: 'center',
          padding: '2rem',
          background: tokens.color.background,
          borderRadius: tokens.radius.md,
          border: `1px dashed ${tokens.color.border}`,
        }}
      >
        <i className="ri-gift-line" style={{ fontSize: '2.5rem', color: tokens.color.muted, display: 'block', marginBottom: '0.5rem' }} />
        <p style={{ color: tokens.color.muted, margin: 0 }}>
          Không có combo nào cho loại căn hộ này
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gap: '0.75rem' }}>
      {combos.map((combo) => (
        <ComboCard
          key={combo.id}
          combo={combo}
          isSelected={selectedCombo?.id === combo.id}
          onSelect={() => onSelect(combo)}
        />
      ))}
    </div>
  );
});


// ============================================
// PRODUCT CARD COMPONENT
// Requirements: 7.5 - Display products as cards with add to selection
// ============================================

const ProductCard = memo(function ProductCard({
  product,
  isSelected,
  quantity,
  onToggle,
  onQuantityChange,
}: {
  product: FurnitureProduct;
  isSelected: boolean;
  quantity: number;
  onToggle: () => void;
  onQuantityChange: (quantity: number) => void;
}) {
  const handleQuantityClick = useCallback(
    (e: React.MouseEvent, delta: number) => {
      e.stopPropagation();
      const newQuantity = Math.max(1, quantity + delta);
      onQuantityChange(newQuantity);
    },
    [quantity, onQuantityChange]
  );

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onToggle}
      style={{
        borderRadius: tokens.radius.md,
        background: isSelected ? `${tokens.color.primary}15` : tokens.color.background,
        border: `2px solid ${isSelected ? tokens.color.primary : tokens.color.border}`,
        cursor: 'pointer',
        overflow: 'hidden',
        transition: 'all 0.2s ease',
      }}
    >
      {product.imageUrl ? (
        <div style={{ width: '100%', height: 120, background: tokens.color.surface }}>
          <img
            src={resolveMediaUrl(product.imageUrl)}
            alt={product.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        </div>
      ) : (
        <div
          style={{
            width: '100%',
            height: 120,
            background: tokens.color.surface,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <i className="ri-image-line" style={{ fontSize: '2rem', color: tokens.color.muted }} />
        </div>
      )}
      <div style={{ padding: '0.75rem' }}>
        <div style={{ fontWeight: 600, color: tokens.color.text, fontSize: '0.85rem' }}>
          {product.name}
        </div>
        <div style={{ fontSize: '0.9rem', fontWeight: 600, color: tokens.color.primary, marginTop: '0.25rem' }}>
          {formatCurrency(product.price)}
        </div>
        {isSelected && (
          <div
            style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={(e) => handleQuantityClick(e, -1)}
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
            <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>{quantity}</span>
            <button
              onClick={(e) => handleQuantityClick(e, 1)}
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
});

// ============================================
// CATEGORY FILTER COMPONENT
// Requirements: 7.4 - Category filter dropdown
// ============================================

const CategoryFilter = memo(function CategoryFilter({
  categories,
  selectedCategoryId,
  onSelect,
}: {
  categories: FurnitureCategory[];
  selectedCategoryId: string | null;
  onSelect: (categoryId: string | null) => void;
}) {
  return (
    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
      <button
        onClick={() => onSelect(null)}
        style={{
          padding: '0.5rem 1rem',
          borderRadius: tokens.radius.sm,
          border: `1px solid ${selectedCategoryId === null ? tokens.color.primary : tokens.color.border}`,
          background: selectedCategoryId === null ? `${tokens.color.primary}15` : tokens.color.surface,
          color: selectedCategoryId === null ? tokens.color.primary : tokens.color.text,
          fontSize: '0.875rem',
          fontWeight: selectedCategoryId === null ? 600 : 400,
          cursor: 'pointer',
          transition: 'all 0.2s ease',
        }}
      >
        Tất cả
      </button>
      {categories.map((cat) => (
        <button
          key={cat.id}
          onClick={() => onSelect(cat.id)}
          style={{
            padding: '0.5rem 1rem',
            borderRadius: tokens.radius.sm,
            border: `1px solid ${selectedCategoryId === cat.id ? tokens.color.primary : tokens.color.border}`,
            background: selectedCategoryId === cat.id ? `${tokens.color.primary}15` : tokens.color.surface,
            color: selectedCategoryId === cat.id ? tokens.color.primary : tokens.color.text,
            fontSize: '0.875rem',
            fontWeight: selectedCategoryId === cat.id ? 600 : 400,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
        >
          {cat.icon && <i className={cat.icon} style={{ marginRight: '0.25rem' }} />}
          {cat.name}
        </button>
      ))}
    </div>
  );
});

// ============================================
// PRICE SORT DROPDOWN
// Requirements: 7.4 - Price sort dropdown (low to high, high to low)
// ============================================

const PriceSortDropdown = memo(function PriceSortDropdown({
  sortOrder,
  onSort,
}: {
  sortOrder: SortOrder | null;
  onSort: (order: SortOrder | null) => void;
}) {
  return (
    <div style={{ marginBottom: '1rem' }}>
      <select
        value={sortOrder || ''}
        onChange={(e) => onSort(e.target.value ? (e.target.value as SortOrder) : null)}
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
        <option value="">Sắp xếp theo giá</option>
        <option value="asc">Giá thấp đến cao</option>
        <option value="desc">Giá cao đến thấp</option>
      </select>
    </div>
  );
});


// ============================================
// SELECTED PRODUCTS SUMMARY
// Requirements: 7.5 - Show running total
// ============================================

const SelectedProductsSummary = memo(function SelectedProductsSummary({
  products,
  totalPrice,
}: {
  products: SelectedProduct[];
  totalPrice: number;
}) {
  if (products.length === 0) return null;

  return (
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
        Đã chọn {products.length} sản phẩm
      </div>
      <div style={{ fontSize: '1.25rem', fontWeight: 700, color: tokens.color.primary }}>
        {formatCurrency(totalPrice)}
      </div>
    </div>
  );
});

// ============================================
// CUSTOM SELECTION VIEW
// Requirements: 7.3, 7.4, 7.5 - Custom selection with filters and running total
// ============================================

const CustomSelectionView = memo(function CustomSelectionView({
  categories,
  products,
  selectedProducts,
  onToggleProduct,
  onQuantityChange,
  loading,
}: {
  categories: FurnitureCategory[];
  products: FurnitureProduct[];
  selectedProducts: SelectedProduct[];
  onToggleProduct: (product: FurnitureProduct) => void;
  onQuantityChange: (productId: string, quantity: number) => void;
  loading: boolean;
}) {
  // Local state for filters
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder | null>(null);

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    let result = [...products];

    // Filter by category
    if (selectedCategoryId) {
      result = result.filter((p) => p.categoryId === selectedCategoryId);
    }

    // Sort by price
    if (sortOrder === 'asc') {
      result.sort((a, b) => a.price - b.price);
    } else if (sortOrder === 'desc') {
      result.sort((a, b) => b.price - a.price);
    }

    return result;
  }, [products, selectedCategoryId, sortOrder]);

  // Calculate total price
  const totalPrice = useMemo(() => {
    return selectedProducts.reduce((sum, p) => sum + p.product.price * p.quantity, 0);
  }, [selectedProducts]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          style={{
            width: 32,
            height: 32,
            borderRadius: '50%',
            borderWidth: '3px',
            borderStyle: 'solid',
            borderColor: `${tokens.color.border} ${tokens.color.border} ${tokens.color.border} ${tokens.color.primary}`,
          }}
        />
      </div>
    );
  }

  return (
    <div>
      {/* Filters Row */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'flex-start', marginBottom: '1rem' }}>
        <div style={{ flex: 1, minWidth: 200 }}>
          <CategoryFilter
            categories={categories}
            selectedCategoryId={selectedCategoryId}
            onSelect={setSelectedCategoryId}
          />
        </div>
        <PriceSortDropdown sortOrder={sortOrder} onSort={setSortOrder} />
      </div>

      {/* Products Grid */}
      {filteredProducts.length > 0 ? (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
            gap: '1rem',
            marginBottom: '1rem',
          }}
        >
          {filteredProducts.map((product) => {
            const selectedProduct = selectedProducts.find((p) => p.product.id === product.id);
            const isSelected = !!selectedProduct;
            return (
              <ProductCard
                key={product.id}
                product={product}
                isSelected={isSelected}
                quantity={selectedProduct?.quantity || 1}
                onToggle={() => onToggleProduct(product)}
                onQuantityChange={(qty) => onQuantityChange(product.id, qty)}
              />
            );
          })}
        </div>
      ) : (
        <div
          style={{
            textAlign: 'center',
            padding: '2rem',
            background: tokens.color.background,
            borderRadius: tokens.radius.md,
            border: `1px dashed ${tokens.color.border}`,
            marginBottom: '1rem',
          }}
        >
          <i className="ri-shopping-bag-line" style={{ fontSize: '2.5rem', color: tokens.color.muted, display: 'block', marginBottom: '0.5rem' }} />
          <p style={{ color: tokens.color.muted, margin: 0 }}>
            Không có sản phẩm nào trong danh mục này
          </p>
        </div>
      )}

      {/* Selected Products Summary */}
      <SelectedProductsSummary products={selectedProducts} totalPrice={totalPrice} />
    </div>
  );
});


// ============================================
// MAIN FURNITURE SELECTOR COMPONENT
// Requirements: 7.1, 7.2, 7.3, 7.4, 7.5
// ============================================

export const FurnitureSelector = memo(function FurnitureSelector({
  apartmentType,
  onSelect,
  onBack,
  onError,
}: FurnitureSelectorProps) {
  // Selection state
  const [selectionType, setSelectionType] = useState<SelectionType | null>(null);
  const [selectedCombo, setSelectedCombo] = useState<FurnitureCombo | null>(null);
  const [selectedProducts, setSelectedProducts] = useState<SelectedProduct[]>([]);

  // Data state
  const [combos, setCombos] = useState<FurnitureCombo[]>([]);
  const [categories, setCategories] = useState<FurnitureCategory[]>([]);
  const [products, setProducts] = useState<FurnitureProduct[]>([]);

  // Loading state
  const [loadingCombos, setLoadingCombos] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(false);

  // Fetch combos when COMBO is selected
  // Requirements: 7.2 - Fetch combos filtered by apartmentType
  useEffect(() => {
    if (selectionType === 'COMBO') {
      setLoadingCombos(true);
      furnitureAPI
        .getCombos(apartmentType)
        .then(setCombos)
        .catch((err) => {
          onError(err instanceof Error ? err.message : 'Không thể tải danh sách combo');
        })
        .finally(() => setLoadingCombos(false));
    }
  }, [selectionType, apartmentType, onError]);

  // Fetch categories and products when CUSTOM is selected
  // Requirements: 7.3 - Fetch categories and products
  useEffect(() => {
    if (selectionType === 'CUSTOM') {
      setLoadingProducts(true);
      Promise.all([furnitureAPI.getCategories(), furnitureAPI.getProducts()])
        .then(([cats, prods]) => {
          setCategories(cats);
          setProducts(prods);
        })
        .catch((err) => {
          onError(err instanceof Error ? err.message : 'Không thể tải danh sách sản phẩm');
        })
        .finally(() => setLoadingProducts(false));
    }
  }, [selectionType, onError]);

  // Handle selection type change
  // Requirements: 7.1 - Expand selected option
  const handleSelectionTypeChange = useCallback((type: SelectionType) => {
    setSelectionType(type);
    // Reset selections when switching type
    setSelectedCombo(null);
    setSelectedProducts([]);
  }, []);

  // Handle combo selection
  // Requirements: 7.2 - Click to select
  const handleComboSelect = useCallback((combo: FurnitureCombo) => {
    setSelectedCombo(combo);
  }, []);

  // Handle product toggle
  // Requirements: 7.5 - Add to selection with quantity
  const handleProductToggle = useCallback((product: FurnitureProduct) => {
    setSelectedProducts((prev) => {
      const exists = prev.find((p) => p.product.id === product.id);
      if (exists) {
        return prev.filter((p) => p.product.id !== product.id);
      }
      return [...prev, { product, quantity: 1 }];
    });
  }, []);

  // Handle product quantity change
  const handleProductQuantityChange = useCallback((productId: string, quantity: number) => {
    setSelectedProducts((prev) =>
      prev.map((p) => (p.product.id === productId ? { ...p, quantity: Math.max(1, quantity) } : p))
    );
  }, []);

  // Calculate total price
  const totalPrice = useMemo(() => {
    if (selectionType === 'COMBO' && selectedCombo) {
      return selectedCombo.price;
    }
    if (selectionType === 'CUSTOM') {
      return selectedProducts.reduce((sum, p) => sum + p.product.price * p.quantity, 0);
    }
    return 0;
  }, [selectionType, selectedCombo, selectedProducts]);

  // Handle next button click
  const handleNext = useCallback(() => {
    if (!selectionType) {
      onError('Vui lòng chọn loại nội thất');
      return;
    }

    if (selectionType === 'COMBO' && !selectedCombo) {
      onError('Vui lòng chọn combo');
      return;
    }

    if (selectionType === 'CUSTOM' && selectedProducts.length === 0) {
      onError('Vui lòng chọn ít nhất một sản phẩm');
      return;
    }

    onSelect({
      selectionType,
      combo: selectedCombo,
      products: selectedProducts,
      totalPrice,
    });
  }, [selectionType, selectedCombo, selectedProducts, totalPrice, onSelect, onError]);

  // Check if next button should be disabled
  const isNextDisabled = useMemo(() => {
    if (!selectionType) return true;
    if (selectionType === 'COMBO' && !selectedCombo) return true;
    if (selectionType === 'CUSTOM' && selectedProducts.length === 0) return true;
    return false;
  }, [selectionType, selectedCombo, selectedProducts]);

  return (
    <motion.div
      key="furniture-selector"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
    >
      {/* Header */}
      <h3
        style={{
          margin: '0 0 0.5rem',
          fontSize: '1.1rem',
          fontWeight: 600,
          color: tokens.color.text,
        }}
      >
        <i className="ri-sofa-line" style={{ marginRight: '0.5rem', color: tokens.color.primary }} />
        Chọn nội thất
      </h3>
      <p
        style={{
          margin: '0 0 1.5rem',
          fontSize: '0.875rem',
          color: tokens.color.muted,
        }}
      >
        Loại căn hộ:{' '}
        <strong style={{ color: tokens.color.primary }}>{apartmentType.toUpperCase()}</strong>
      </p>

      {/* Selection Type Toggle - Requirements: 7.1 */}
      <SelectionTypeToggle selectionType={selectionType} onSelect={handleSelectionTypeChange} />

      {/* Combo Selection View - Requirements: 7.2 */}
      {selectionType === 'COMBO' && (
        <ComboSelectionView
          combos={combos}
          selectedCombo={selectedCombo}
          onSelect={handleComboSelect}
          loading={loadingCombos}
        />
      )}

      {/* Custom Selection View - Requirements: 7.3, 7.4, 7.5 */}
      {selectionType === 'CUSTOM' && (
        <CustomSelectionView
          categories={categories}
          products={products}
          selectedProducts={selectedProducts}
          onToggleProduct={handleProductToggle}
          onQuantityChange={handleProductQuantityChange}
          loading={loadingProducts}
        />
      )}

      {/* Navigation Buttons */}
      <NavigationButtons
        onBack={onBack}
        onNext={handleNext}
        nextLabel="Xem báo giá"
        nextDisabled={isNextDisabled}
        showBack={true}
      />
    </motion.div>
  );
});

export default FurnitureSelector;
