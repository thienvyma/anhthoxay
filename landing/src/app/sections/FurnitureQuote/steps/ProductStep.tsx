/**
 * ProductStep - Step 7: Furniture Selection
 * 
 * **Feature: codebase-refactor-large-files**
 * **Requirements: 3.4, 6.1, 6.2, 6.3, 6.9, 6.10, 7.1, 7.2, 7.3, 7.4, 7.5**
 */

import { memo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { tokens, resolveMediaUrl } from '@app/shared';
import { FurnitureCategory, FurnitureFee, ProductBaseGroup, ProductVariantForLanding } from '../../../api/furniture';
import { Pagination, NavigationButtons } from '../components';
import { ITEMS_PER_PAGE, formatCurrency } from '../constants';
import type { SelectedProduct } from '../types';

interface ProductStepProps {
  categories: FurnitureCategory[];
  productGroups: ProductBaseGroup[];
  selectedProducts: SelectedProduct[];
  fitInFee: FurnitureFee | null;
  currentPage: number;
  onProductSelect: (productBaseId: string, productName: string, variant: ProductVariantForLanding, allowFitIn: boolean) => void;
  onProductRemove: (productBaseId: string) => void;
  onQuantityChange: (productBaseId: string, quantity: number) => void;
  onFitInToggle: (productBaseId: string) => void;
  onPageChange: (page: number) => void;
  onNext: () => void;
  onBack: () => void;
  getProductDisplayPrice: (variant: ProductVariantForLanding, fitInSelected: boolean, quantity: number) => number;
}

export const ProductStep = memo(function ProductStep({
  categories,
  productGroups,
  selectedProducts,
  fitInFee,
  currentPage,
  onProductSelect,
  onProductRemove,
  onQuantityChange,
  onFitInToggle,
  onPageChange,
  onNext,
  onBack,
  getProductDisplayPrice,
}: ProductStepProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Filter product groups by category and search query
  let filteredGroups = selectedCategory
    ? productGroups.filter(g => g.categoryId === selectedCategory)
    : productGroups;
  
  if (searchQuery.trim()) {
    const query = searchQuery.toLowerCase().trim();
    filteredGroups = filteredGroups.filter(g => 
      g.name.toLowerCase().includes(query)
    );
  }
  
  const totalPages = Math.ceil(filteredGroups.length / ITEMS_PER_PAGE);
  const paginatedGroups = filteredGroups.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  return (
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

      {/* Search Input */}
      <div style={{ marginBottom: '1rem' }}>
        <div style={{ position: 'relative' }}>
          <i 
            className="ri-search-line" 
            style={{ 
              position: 'absolute', 
              left: '0.75rem', 
              top: '50%', 
              transform: 'translateY(-50%)', 
              color: tokens.color.muted,
              fontSize: '1rem',
            }} 
          />
          <input
            type="text"
            placeholder="Tìm kiếm sản phẩm..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              onPageChange(1);
            }}
            style={{
              width: '100%',
              padding: '0.75rem 0.75rem 0.75rem 2.5rem',
              borderRadius: tokens.radius.md,
              border: `1px solid ${tokens.color.border}`,
              background: tokens.color.background,
              color: tokens.color.text,
              fontSize: '0.875rem',
            }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              style={{
                position: 'absolute',
                right: '0.75rem',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'transparent',
                border: 'none',
                color: tokens.color.muted,
                cursor: 'pointer',
                padding: '0.25rem',
              }}
            >
              <i className="ri-close-line" />
            </button>
          )}
        </div>
      </div>

      {/* Category Filter */}
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
        <button
          onClick={() => {
            setSelectedCategory(null);
            onPageChange(1);
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
              onPageChange(1);
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

      {/* Products Grid */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`${selectedCategory}-${currentPage}-${searchQuery}`}
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -10 }}
          transition={{ duration: 0.2 }}
          style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1rem' }}
        >
          {paginatedGroups.map((group) => (
            <ProductCard
              key={group.id}
              group={group}
              selectedProduct={selectedProducts.find((p) => p.productBaseId === group.id)}
              fitInFee={fitInFee}
              onSelect={onProductSelect}
              onRemove={onProductRemove}
              onQuantityChange={onQuantityChange}
              onFitInToggle={onFitInToggle}
              getProductDisplayPrice={getProductDisplayPrice}
            />
          ))}
        </motion.div>
      </AnimatePresence>
      
      {/* Empty State */}
      {filteredGroups.length === 0 && (
        <EmptyState searchQuery={searchQuery} />
      )}
      
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={onPageChange}
        itemsPerPage={ITEMS_PER_PAGE}
        totalItems={filteredGroups.length}
      />

      {/* Selected Products Summary */}
      {selectedProducts.length > 0 && (
        <SelectedSummary 
          products={selectedProducts} 
          getProductDisplayPrice={getProductDisplayPrice} 
        />
      )}

      <NavigationButtons
        onBack={onBack}
        onNext={onNext}
        nextLabel="Tiếp tục xác nhận"
        nextDisabled={selectedProducts.length === 0}
        showBack={true}
      />
    </motion.div>
  );
});

// Sub-components
interface ProductCardProps {
  group: ProductBaseGroup;
  selectedProduct: SelectedProduct | undefined;
  fitInFee: FurnitureFee | null;
  onSelect: (productBaseId: string, productName: string, variant: ProductVariantForLanding, allowFitIn: boolean) => void;
  onRemove: (productBaseId: string) => void;
  onQuantityChange: (productBaseId: string, quantity: number) => void;
  onFitInToggle: (productBaseId: string) => void;
  getProductDisplayPrice: (variant: ProductVariantForLanding, fitInSelected: boolean, quantity: number) => number;
}

const ProductCard = memo(function ProductCard({
  group,
  selectedProduct,
  fitInFee,
  onSelect,
  onRemove,
  onQuantityChange,
  onFitInToggle,
  getProductDisplayPrice,
}: ProductCardProps) {
  const isSelected = !!selectedProduct;
  const displayVariant = selectedProduct?.variant || group.variants[0];

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      style={{
        borderRadius: tokens.radius.md,
        background: isSelected ? `${tokens.color.primary}15` : tokens.color.background,
        border: `2px solid ${isSelected ? tokens.color.primary : tokens.color.border}`,
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {/* Checkmark Badge */}
      {isSelected && (
        <div
          style={{
            position: 'absolute',
            top: '0.5rem',
            right: '0.5rem',
            width: 24,
            height: 24,
            borderRadius: '50%',
            background: tokens.color.primary,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10,
            boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
          }}
        >
          <i className="ri-check-line" style={{ fontSize: '0.875rem', color: '#111' }} />
        </div>
      )}
      
      {/* Product Image */}
      {(displayVariant?.imageUrl || group.imageUrl) && (
        <div 
          style={{ width: '100%', height: 120, background: tokens.color.surface, cursor: 'pointer' }}
          onClick={() => !isSelected && onSelect(group.id, group.name, displayVariant, group.allowFitIn)}
        >
          <img
            src={resolveMediaUrl(displayVariant?.imageUrl || group.imageUrl || '')}
            alt={group.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        </div>
      )}
      
      <div style={{ padding: '0.75rem' }}>
        {/* Product Name */}
        <div 
          style={{ fontWeight: 600, color: tokens.color.text, fontSize: '0.85rem', cursor: 'pointer' }}
          onClick={() => !isSelected && onSelect(group.id, group.name, displayVariant, group.allowFitIn)}
        >
          {group.name}
        </div>
        
        {/* Material Selector */}
        {group.variants.length > 1 && (
          <MaterialSelector
            variants={group.variants}
            selectedVariantId={selectedProduct?.variant.id || displayVariant.id}
            onSelect={(variant) => onSelect(group.id, group.name, variant, group.allowFitIn)}
          />
        )}
        
        {/* Single Material Display */}
        {group.variants.length === 1 && (
          <SingleMaterialDisplay materialName={displayVariant.materialName} />
        )}
        
        {/* Variant Count Badge */}
        {group.variantCount > 1 && (
          <div style={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: '0.25rem',
            marginTop: '0.25rem',
            padding: '0.15rem 0.4rem',
            borderRadius: tokens.radius.sm,
            background: tokens.color.surface,
            fontSize: '0.7rem',
            color: tokens.color.muted,
          }}>
            <i className="ri-palette-line" style={{ fontSize: '0.65rem' }} />
            {group.variantCount} chất liệu
          </div>
        )}
        
        {/* Price Display */}
        <div style={{ fontSize: '0.9rem', fontWeight: 600, color: tokens.color.primary, marginTop: '0.25rem' }}>
          {isSelected && selectedProduct
            ? formatCurrency(getProductDisplayPrice(selectedProduct.variant, selectedProduct.fitInSelected, selectedProduct.quantity))
            : group.priceRange && group.priceRange.min !== group.priceRange.max
              ? `${formatCurrency(group.priceRange.min)} - ${formatCurrency(group.priceRange.max)}`
              : formatCurrency(displayVariant.calculatedPrice)
          }
        </div>
        
        {/* Selection Controls */}
        {isSelected && selectedProduct && (
          <SelectionControls
            product={selectedProduct}
            productBaseId={group.id}
            fitInFee={fitInFee}
            onQuantityChange={onQuantityChange}
            onFitInToggle={onFitInToggle}
            onRemove={onRemove}
          />
        )}
        
        {/* Add Button */}
        {!isSelected && (
          <button
            onClick={() => onSelect(group.id, group.name, displayVariant, group.allowFitIn)}
            style={{
              width: '100%',
              marginTop: '0.5rem',
              padding: '0.5rem',
              borderRadius: tokens.radius.sm,
              border: `1px solid ${tokens.color.primary}`,
              background: 'transparent',
              color: tokens.color.primary,
              fontSize: '0.75rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <i className="ri-add-line" style={{ marginRight: '0.25rem' }} />
            Thêm
          </button>
        )}
      </div>
    </motion.div>
  );
});

interface MaterialSelectorProps {
  variants: ProductVariantForLanding[];
  selectedVariantId: string;
  onSelect: (variant: ProductVariantForLanding) => void;
}

const MaterialSelector = memo(function MaterialSelector({
  variants,
  selectedVariantId,
  onSelect,
}: MaterialSelectorProps) {
  return (
    <div style={{ marginTop: '0.75rem' }}>
      <div style={{ 
        fontSize: '0.7rem', 
        fontWeight: 600, 
        color: tokens.color.primary, 
        marginBottom: '0.35rem',
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
        display: 'flex',
        alignItems: 'center',
        gap: '0.35rem',
      }}>
        <i className="ri-palette-line" style={{ fontSize: '0.8rem' }} />
        Chất liệu
      </div>
      <select
        value={selectedVariantId}
        onChange={(e) => {
          const variant = variants.find(v => v.id === e.target.value);
          if (variant) onSelect(variant);
        }}
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          padding: '0.5rem 0.75rem',
          borderRadius: tokens.radius.sm,
          border: `1px solid ${tokens.color.primary}`,
          background: tokens.color.surface,
          color: tokens.color.text,
          fontSize: '0.8rem',
          fontWeight: 500,
          cursor: 'pointer',
        }}
      >
        {variants.map((v) => (
          <option key={v.id} value={v.id} style={{ background: tokens.color.surface, color: tokens.color.text }}>
            {v.materialName} - {formatCurrency(v.calculatedPrice)}
          </option>
        ))}
      </select>
    </div>
  );
});

const SingleMaterialDisplay = memo(function SingleMaterialDisplay({ materialName }: { materialName: string }) {
  return (
    <div style={{ 
      marginTop: '0.75rem',
      padding: '0.5rem 0.75rem',
      borderRadius: tokens.radius.md,
      background: `${tokens.color.primary}10`,
      border: `1px solid ${tokens.color.primary}40`,
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
    }}>
      <i className="ri-palette-line" style={{ fontSize: '0.9rem', color: tokens.color.primary }} />
      <span style={{ fontSize: '0.8rem', fontWeight: 600, color: tokens.color.text }}>
        {materialName}
      </span>
    </div>
  );
});

interface SelectionControlsProps {
  product: SelectedProduct;
  productBaseId: string;
  fitInFee: FurnitureFee | null;
  onQuantityChange: (productBaseId: string, quantity: number) => void;
  onFitInToggle: (productBaseId: string) => void;
  onRemove: (productBaseId: string) => void;
}

const SelectionControls = memo(function SelectionControls({
  product,
  productBaseId,
  fitInFee,
  onQuantityChange,
  onFitInToggle,
  onRemove,
}: SelectionControlsProps) {
  return (
    <div style={{ marginTop: '0.5rem' }} onClick={(e) => e.stopPropagation()}>
      {/* Fit-in Toggle */}
      {product.allowFitIn && (
        <div 
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.5rem', 
            marginBottom: '0.5rem',
            padding: '0.4rem',
            borderRadius: tokens.radius.sm,
            background: product.fitInSelected ? `${tokens.color.primary}20` : tokens.color.surface,
            cursor: 'pointer',
          }}
          onClick={() => onFitInToggle(productBaseId)}
        >
          <div
            style={{
              width: 18,
              height: 18,
              borderRadius: 4,
              border: `2px solid ${product.fitInSelected ? tokens.color.primary : tokens.color.border}`,
              background: product.fitInSelected ? tokens.color.primary : 'transparent',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {product.fitInSelected && (
              <i className="ri-check-line" style={{ fontSize: '0.7rem', color: '#111' }} />
            )}
          </div>
          <span style={{ fontSize: '0.75rem', color: tokens.color.text }}>
            Fit-in (lắp vừa sát trần)
            {fitInFee && fitInFee.isActive && fitInFee.value > 0 && (
              <span style={{ color: tokens.color.muted, marginLeft: '0.25rem' }}>
                (+{formatCurrency(fitInFee.type === 'FIXED' ? fitInFee.value : product.variant.calculatedPrice * fitInFee.value / 100)})
              </span>
            )}
          </span>
        </div>
      )}
      
      {/* Quantity Controls */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button
            onClick={() => onQuantityChange(productBaseId, product.quantity - 1)}
            disabled={product.quantity <= 1}
            style={{
              width: 24,
              height: 24,
              borderRadius: '50%',
              border: `1px solid ${tokens.color.border}`,
              background: 'transparent',
              color: product.quantity <= 1 ? tokens.color.muted : tokens.color.text,
              cursor: product.quantity <= 1 ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: product.quantity <= 1 ? 0.5 : 1,
            }}
          >
            <i className="ri-subtract-line" style={{ fontSize: '0.75rem' }} />
          </button>
          <span style={{ fontSize: '0.875rem', fontWeight: 600, minWidth: 24, textAlign: 'center' }}>{product.quantity}</span>
          <button
            onClick={() => onQuantityChange(productBaseId, product.quantity + 1)}
            disabled={product.quantity >= 99}
            style={{
              width: 24,
              height: 24,
              borderRadius: '50%',
              border: `1px solid ${tokens.color.border}`,
              background: 'transparent',
              color: product.quantity >= 99 ? tokens.color.muted : tokens.color.text,
              cursor: product.quantity >= 99 ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: product.quantity >= 99 ? 0.5 : 1,
            }}
          >
            <i className="ri-add-line" style={{ fontSize: '0.75rem' }} />
          </button>
        </div>
        
        {/* Remove Button */}
        <button
          onClick={() => onRemove(productBaseId)}
          style={{
            padding: '0.25rem 0.5rem',
            borderRadius: tokens.radius.sm,
            border: 'none',
            background: 'transparent',
            color: tokens.color.muted,
            cursor: 'pointer',
            fontSize: '0.7rem',
          }}
        >
          <i className="ri-delete-bin-line" />
        </button>
      </div>
    </div>
  );
});

const EmptyState = memo(function EmptyState({ searchQuery }: { searchQuery: string }) {
  return (
    <div style={{ 
      textAlign: 'center', 
      padding: '3rem 1rem',
      background: tokens.color.surface,
      borderRadius: tokens.radius.md,
      border: `1px dashed ${tokens.color.border}`,
    }}>
      <i 
        className="ri-inbox-line" 
        style={{ 
          fontSize: '3rem', 
          color: tokens.color.muted,
          marginBottom: '1rem',
          display: 'block',
        }} 
      />
      <p style={{ color: tokens.color.text, fontWeight: 500, marginBottom: '0.5rem' }}>
        {searchQuery 
          ? 'Không tìm thấy sản phẩm phù hợp'
          : 'Chưa có sản phẩm nào cho căn hộ này'
        }
      </p>
      <p style={{ color: tokens.color.muted, fontSize: '0.875rem', marginBottom: '1rem' }}>
        {searchQuery 
          ? 'Thử tìm kiếm với từ khóa khác'
          : 'Vui lòng liên hệ với chúng tôi để được hỗ trợ'
        }
      </p>
      {!searchQuery && (
        <a
          href="tel:0909123456"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.75rem 1.5rem',
            borderRadius: tokens.radius.md,
            background: tokens.color.primary,
            color: '#111',
            fontWeight: 600,
            textDecoration: 'none',
            fontSize: '0.875rem',
          }}
        >
          <i className="ri-phone-line" />
          Liên hệ hỗ trợ
        </a>
      )}
    </div>
  );
});

interface SelectedSummaryProps {
  products: SelectedProduct[];
  getProductDisplayPrice: (variant: ProductVariantForLanding, fitInSelected: boolean, quantity: number) => number;
}

const SelectedSummary = memo(function SelectedSummary({ products, getProductDisplayPrice }: SelectedSummaryProps) {
  const total = products.reduce((sum, p) => 
    sum + getProductDisplayPrice(p.variant, p.fitInSelected, p.quantity), 0
  );

  return (
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
        Đã chọn {products.length} sản phẩm
        {products.some(p => p.fitInSelected) && (
          <span style={{ marginLeft: '0.5rem', color: tokens.color.primary }}>
            (có Fit-in)
          </span>
        )}
      </div>
      <div style={{ fontSize: '1.25rem', fontWeight: 700, color: tokens.color.primary }}>
        {formatCurrency(total)}
      </div>
    </div>
  );
});
