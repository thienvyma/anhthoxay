/**
 * VariantSelectionModal Component
 * Modal/Drawer for selecting product variants with Fit-in option and quantity
 * 
 * **Feature: furniture-product-restructure**
 * **Validates: Requirements 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 7.8, 7.9, 7.10, 7.11**
 */

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { tokens, resolveMediaUrl } from '@app/shared';
import { useThrottledCallback } from '../../../hooks/useThrottle';
import type { ProductBaseGroup, ProductVariantForLanding, FurnitureFee } from '../../../api/furniture';
import type { SelectedProduct } from '../types';

interface VariantSelectionModalProps {
  /** Product group to display */
  product: ProductBaseGroup | null;
  /** Whether the modal is open */
  isOpen: boolean;
  /** Close handler */
  onClose: () => void;
  /** Selection handler */
  onSelect: (selection: SelectedProduct) => void;
  /** Existing selection for editing */
  existingSelection?: SelectedProduct | null;
  /** Fit-in fee configuration */
  fitInFee: FurnitureFee | null;
  /** Loading state */
  isLoading?: boolean;
}

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(value);
};

/**
 * VariantSelectionModal - Modal for selecting product variants
 * 
 * Features:
 * - Display product info (image, name, description)
 * - Radio buttons/cards for variant selection
 * - Update image when variant with imageUrl is selected
 * - Fit-in checkbox with calculated fee
 * - Quantity input (1-99)
 * - Real-time total calculation
 * - Mobile: full-screen drawer from bottom (viewport < 768px)
 * - Desktop: centered overlay with max-width 600px
 * - Loading skeleton while fetching data
 */
export function VariantSelectionModal({
  product,
  isOpen,
  onClose,
  onSelect,
  existingSelection,
  fitInFee,
  isLoading = false,
}: VariantSelectionModalProps) {
  // State for selection
  const [selectedVariant, setSelectedVariant] = useState<ProductVariantForLanding | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [fitInSelected, setFitInSelected] = useState(false);
  
  // Detect mobile viewport - Requirements: 7.9
  // Throttled resize handler with 100ms interval (Requirement 9.3)
  const [isMobile, setIsMobile] = useState(false);
  
  const checkMobile = useThrottledCallback(() => {
    setIsMobile(window.innerWidth < 768);
  }, 100);
  
  useEffect(() => {
    // Initial check
    setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [checkMobile]);
  
  // Initialize state when modal opens or product changes
  useEffect(() => {
    if (isOpen && product) {
      if (existingSelection) {
        // Pre-fill with existing selection - Requirements: 6.8
        setSelectedVariant(existingSelection.variant);
        setQuantity(existingSelection.quantity);
        setFitInSelected(existingSelection.fitInSelected);
      } else {
        // Default to none - force user to select variant to avoid confusion
        setSelectedVariant(null);
        setQuantity(1);
        setFitInSelected(false);
      }
    }
  }, [isOpen, product, existingSelection]);
  
  // Handle escape key - Requirements: 7.7
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Calculate Fit-in fee amount - Requirements: 7.4
  const calculateFitInFee = useCallback((variant: ProductVariantForLanding, qty: number): number => {
    if (!fitInFee) return 0;
    if (fitInFee.type === 'FIXED') {
      return fitInFee.value * qty;
    }
    return (variant.calculatedPrice * fitInFee.value / 100) * qty;
  }, [fitInFee]);
  
  // Calculate total price - Requirements: 7.5
  const calculateTotal = useCallback((): number => {
    if (!selectedVariant) return 0;
    let total = selectedVariant.calculatedPrice * quantity;
    if (fitInSelected && fitInFee) {
      total += calculateFitInFee(selectedVariant, quantity);
    }
    return total;
  }, [selectedVariant, quantity, fitInSelected, fitInFee, calculateFitInFee]);
  
  // Handle quantity change with validation - Requirements: 6.6
  const handleQuantityChange = useCallback((newQuantity: number) => {
    const validQuantity = Math.max(1, Math.min(99, newQuantity));
    setQuantity(validQuantity);
  }, []);
  
  // Handle add to list - Requirements: 7.6
  const handleAddToList = useCallback(() => {
    if (!product || !selectedVariant) return;
    
    onSelect({
      productBaseId: product.id,
      productName: product.name,
      variant: selectedVariant,
      quantity,
      fitInSelected,
      allowFitIn: product.allowFitIn,
    });
    onClose();
  }, [product, selectedVariant, quantity, fitInSelected, onSelect, onClose]);
  
  // Get display image - update when variant changes - Requirements: 7.3
  const displayImage = selectedVariant?.imageUrl || product?.imageUrl;
  
  if (!isOpen) return null;
  
  // Loading skeleton - Requirements: 7.11
  const LoadingSkeleton = () => (
    <div style={{ padding: '1.5rem' }}>
      <div style={{ 
        width: '100%', 
        height: 200, 
        background: tokens.color.surface, 
        borderRadius: tokens.radius.md,
        marginBottom: '1rem',
        animation: 'pulse 1.5s ease-in-out infinite',
      }} />
      <div style={{ 
        width: '60%', 
        height: 24, 
        background: tokens.color.surface, 
        borderRadius: tokens.radius.sm,
        marginBottom: '0.5rem',
      }} />
      <div style={{ 
        width: '40%', 
        height: 16, 
        background: tokens.color.surface, 
        borderRadius: tokens.radius.sm,
        marginBottom: '1rem',
      }} />
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        {[1, 2, 3].map(i => (
          <div key={i} style={{ 
            flex: 1, 
            height: 60, 
            background: tokens.color.surface, 
            borderRadius: tokens.radius.md,
          }} />
        ))}
      </div>
    </div>
  );
  
  // Modal content
  const ModalContent = () => (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      height: '100%',
      maxHeight: isMobile ? '100vh' : '90vh',
    }}>
      {/* Header */}
      <div style={{ 
        padding: '1rem 1.5rem', 
        borderBottom: `1px solid ${tokens.color.border}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexShrink: 0,
      }}>
        <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600, color: tokens.color.text }}>
          {existingSelection ? 'Chỉnh sửa sản phẩm' : 'Chọn sản phẩm'}
        </h3>
        <button
          onClick={onClose}
          style={{
            width: 32,
            height: 32,
            borderRadius: '50%',
            border: 'none',
            background: tokens.color.surface,
            color: tokens.color.text,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <i className="ri-close-line" style={{ fontSize: '1.25rem' }} />
        </button>
      </div>
      
      {/* Content */}
      <div style={{ 
        flex: 1, 
        overflowY: 'auto', 
        padding: '1.5rem',
      }}>
        {isLoading ? (
          <LoadingSkeleton />
        ) : product ? (
          <>
            {/* Product Image - Requirements: 7.1, 7.3 */}
            {displayImage && (
              <div style={{ 
                width: '100%', 
                height: 200, 
                borderRadius: tokens.radius.md,
                overflow: 'hidden',
                marginBottom: '1rem',
                background: tokens.color.surface,
              }}>
                <img
                  src={resolveMediaUrl(displayImage)}
                  alt={product.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>
            )}
            
            {/* Product Info - Requirements: 7.1 */}
            <div style={{ marginBottom: '1.5rem' }}>
              <h4 style={{ margin: '0 0 0.25rem', fontSize: '1.25rem', fontWeight: 600, color: tokens.color.text }}>
                {product.name}
              </h4>
              <div style={{ fontSize: '0.875rem', color: tokens.color.muted, marginBottom: '0.5rem' }}>
                {product.categoryName}
              </div>
              {product.description && (
                <p style={{ margin: 0, fontSize: '0.875rem', color: tokens.color.text, lineHeight: 1.5 }}>
                  {product.description}
                </p>
              )}
            </div>
            
            {/* Variant Selection - Requirements: 7.2 - PROMINENT */}
            {product.variants.length > 0 && (
              <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center',
                  gap: '0.5rem',
                  marginBottom: '0.75rem', 
                  padding: '0.75rem',
                  borderRadius: tokens.radius.md,
                  background: `${tokens.color.primary}10`,
                  border: `2px solid ${tokens.color.primary}`,
                }}>
                  <i className="ri-palette-line" style={{ fontSize: '1.25rem', color: tokens.color.primary }} />
                  <div>
                    <div style={{ fontSize: '1rem', fontWeight: 700, color: tokens.color.text }}>
                      Chọn chất liệu
                    </div>
                    <div style={{ fontSize: '0.75rem', color: tokens.color.muted }}>
                      Bắt buộc chọn để tiếp tục
                    </div>
                  </div>
                </div>
                {/* Warning when no variant selected */}
                {!selectedVariant && (
                  <div style={{
                    padding: '0.75rem',
                    marginBottom: '0.75rem',
                    borderRadius: tokens.radius.md,
                    background: `${tokens.color.warning}15`,
                    border: `1px solid ${tokens.color.warning}40`,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                  }}>
                    <i className="ri-error-warning-line" style={{ color: tokens.color.warning, fontSize: '1rem' }} />
                    <span style={{ fontSize: '0.8rem', color: tokens.color.warning }}>
                      Vui lòng chọn chất liệu để tiếp tục
                    </span>
                  </div>
                )}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {product.variants.map((variant) => (
                    <motion.div
                      key={variant.id}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setSelectedVariant(variant)}
                      style={{
                        padding: '1rem 1.25rem',
                        borderRadius: tokens.radius.md,
                        border: `2px solid ${selectedVariant?.id === variant.id ? tokens.color.primary : tokens.color.border}`,
                        background: selectedVariant?.id === variant.id ? `${tokens.color.primary}15` : tokens.color.surface,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        {/* Radio indicator */}
                        <div style={{
                          width: 24,
                          height: 24,
                          borderRadius: '50%',
                          border: `2px solid ${selectedVariant?.id === variant.id ? tokens.color.primary : tokens.color.border}`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}>
                          {selectedVariant?.id === variant.id && (
                            <div style={{
                              width: 12,
                              height: 12,
                              borderRadius: '50%',
                              background: tokens.color.primary,
                            }} />
                          )}
                        </div>
                        <span style={{ fontWeight: 600, color: tokens.color.text, fontSize: '0.95rem' }}>
                          {variant.materialName}
                        </span>
                      </div>
                      <span style={{ fontWeight: 700, color: tokens.color.primary, fontSize: '1rem' }}>
                        {formatCurrency(variant.calculatedPrice)}
                      </span>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
            
            {/* No variants message - Requirements: 7.8 */}
            {product.variants.length === 0 && (
              <div style={{ 
                padding: '2rem', 
                textAlign: 'center', 
                background: tokens.color.surface,
                borderRadius: tokens.radius.md,
                marginBottom: '1.5rem',
              }}>
                <i className="ri-error-warning-line" style={{ fontSize: '2rem', color: tokens.color.muted, marginBottom: '0.5rem', display: 'block' }} />
                <p style={{ margin: 0, color: tokens.color.muted }}>
                  Không có chất liệu nào khả dụng
                </p>
              </div>
            )}

            {/* Fit-in Option - Always show if product allows, price only if configured */}
            {product.allowFitIn && selectedVariant && (
              <div style={{ marginBottom: '1.5rem' }}>
                <motion.div
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setFitInSelected(!fitInSelected)}
                  style={{
                    padding: '0.75rem 1rem',
                    borderRadius: tokens.radius.md,
                    border: `2px solid ${fitInSelected ? tokens.color.primary : tokens.color.border}`,
                    background: fitInSelected ? `${tokens.color.primary}10` : tokens.color.surface,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    {/* Checkbox indicator */}
                    <div style={{
                      width: 20,
                      height: 20,
                      borderRadius: 4,
                      border: `2px solid ${fitInSelected ? tokens.color.primary : tokens.color.border}`,
                      background: fitInSelected ? tokens.color.primary : 'transparent',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      {fitInSelected && (
                        <i className="ri-check-line" style={{ fontSize: '0.75rem', color: '#111' }} />
                      )}
                    </div>
                    <div>
                      <span style={{ fontWeight: 500, color: tokens.color.text }}>
                        Dịch vụ Fit-in
                      </span>
                      <div style={{ fontSize: '0.75rem', color: tokens.color.muted }}>
                        Lắp vừa sát trần
                      </div>
                    </div>
                  </div>
                  {fitInFee && fitInFee.isActive && fitInFee.value > 0 && (
                    <span style={{ fontWeight: 600, color: tokens.color.primary }}>
                      +{formatCurrency(calculateFitInFee(selectedVariant, 1))}
                      {fitInFee.type === 'PERCENTAGE' && (
                        <span style={{ fontSize: '0.75rem', color: tokens.color.muted, marginLeft: '0.25rem' }}>
                          ({fitInFee.value}%)
                        </span>
                      )}
                    </span>
                  )}
                </motion.div>
              </div>
            )}
            
            {/* Quantity Input - Requirements: 7.5, 6.6 */}
            {selectedVariant && (
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '0.75rem', 
                  fontSize: '0.875rem', 
                  fontWeight: 600, 
                  color: tokens.color.text 
                }}>
                  Số lượng
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <button
                    onClick={() => handleQuantityChange(quantity - 1)}
                    disabled={quantity <= 1}
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: tokens.radius.md,
                      border: `1px solid ${tokens.color.border}`,
                      background: tokens.color.surface,
                      color: quantity <= 1 ? tokens.color.muted : tokens.color.text,
                      cursor: quantity <= 1 ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      opacity: quantity <= 1 ? 0.5 : 1,
                    }}
                  >
                    <i className="ri-subtract-line" style={{ fontSize: '1.25rem' }} />
                  </button>
                  <input
                    type="number"
                    min={1}
                    max={99}
                    value={quantity}
                    onChange={(e) => handleQuantityChange(parseInt(e.target.value) || 1)}
                    style={{
                      width: 80,
                      height: 40,
                      textAlign: 'center',
                      borderRadius: tokens.radius.md,
                      border: `1px solid ${tokens.color.border}`,
                      background: tokens.color.background,
                      color: tokens.color.text,
                      fontSize: '1rem',
                      fontWeight: 600,
                    }}
                  />
                  <button
                    onClick={() => handleQuantityChange(quantity + 1)}
                    disabled={quantity >= 99}
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: tokens.radius.md,
                      border: `1px solid ${tokens.color.border}`,
                      background: tokens.color.surface,
                      color: quantity >= 99 ? tokens.color.muted : tokens.color.text,
                      cursor: quantity >= 99 ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      opacity: quantity >= 99 ? 0.5 : 1,
                    }}
                  >
                    <i className="ri-add-line" style={{ fontSize: '1.25rem' }} />
                  </button>
                </div>
              </div>
            )}
          </>
        ) : null}
      </div>
      
      {/* Footer with Total and Add Button */}
      {product && (
        <div style={{ 
          padding: '1rem 1.5rem', 
          borderTop: `1px solid ${tokens.color.border}`,
          background: tokens.color.surface,
          flexShrink: 0,
        }}>
          {/* Total Price - Requirements: 7.5 */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: '1rem',
          }}>
            <span style={{ fontSize: '0.875rem', color: tokens.color.muted }}>Tổng cộng:</span>
            <span style={{ fontSize: '1.5rem', fontWeight: 700, color: selectedVariant ? tokens.color.primary : tokens.color.muted }}>
              {selectedVariant ? formatCurrency(calculateTotal()) : '---'}
            </span>
          </div>
          
          {/* Add Button - Requirements: 7.6 */}
          <motion.button
            whileHover={selectedVariant ? { scale: 1.02 } : {}}
            whileTap={selectedVariant ? { scale: 0.98 } : {}}
            onClick={handleAddToList}
            disabled={!selectedVariant}
            style={{
              width: '100%',
              padding: '1rem',
              borderRadius: tokens.radius.md,
              border: 'none',
              background: selectedVariant 
                ? tokens.color.primary
                : tokens.color.muted,
              color: '#111',
              fontSize: '1rem',
              fontWeight: 600,
              cursor: selectedVariant ? 'pointer' : 'not-allowed',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              opacity: selectedVariant ? 1 : 0.5,
            }}
          >
            {!selectedVariant ? (
              <>
                <i className="ri-error-warning-line" />
                Vui lòng chọn chất liệu
              </>
            ) : (
              <>
                <i className={existingSelection ? 'ri-check-line' : 'ri-add-line'} />
                {existingSelection ? 'Cập nhật' : 'Thêm vào danh sách'}
              </>
            )}
          </motion.button>
        </div>
      )}
    </div>
  );
  
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop - Requirements: 7.7 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.5)',
              zIndex: 1000,
            }}
          />
          
          {/* Modal/Drawer - Requirements: 7.9, 7.10 */}
          <motion.div
            initial={isMobile ? { y: '100%' } : { opacity: 0, scale: 0.95 }}
            animate={isMobile ? { y: 0 } : { opacity: 1, scale: 1 }}
            exit={isMobile ? { y: '100%' } : { opacity: 0, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            style={{
              position: 'fixed',
              zIndex: 1001,
              background: tokens.color.background,
              ...(isMobile ? {
                // Mobile: full-screen drawer from bottom - Requirements: 7.9
                bottom: 0,
                left: 0,
                right: 0,
                maxHeight: '90vh',
                borderTopLeftRadius: tokens.radius.lg,
                borderTopRightRadius: tokens.radius.lg,
              } : {
                // Desktop: centered overlay with max-width 600px - Requirements: 7.10
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '100%',
                maxWidth: 600,
                maxHeight: '90vh',
                borderRadius: tokens.radius.lg,
              }),
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              overflow: 'hidden',
            }}
          >
            <ModalContent />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default VariantSelectionModal;
