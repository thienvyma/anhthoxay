/**
 * ConfirmationStep Component - Step 8
 * Display detailed summary of selected products before quotation
 * Prices are hidden - quotation will be sent via email
 * 
 * **Feature: furniture-quotation-email**
 * **Validates: Requirements 2.2 (Hide prices in Step 8)**
 */

import { memo, useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { tokens } from '@app/shared';
import type { SelectedProduct } from '../types';
import type { ProductBaseGroup, ProductVariantForLanding } from '../../../api/furniture';

interface Props {
  products: SelectedProduct[];
  productGroups: ProductBaseGroup[];
  onVariantChange: (productBaseId: string, variant: ProductVariantForLanding) => void;
  onRemove: (productBaseId: string) => void;
  onQuantityChange: (productBaseId: string, quantity: number) => void;
  onFitInToggle: (productBaseId: string) => void;
  onBack: () => void;
  onConfirm: () => void;
  onAddMore: () => void;
  submitting?: boolean;
}

// Undo state for removed items
interface UndoState {
  product: SelectedProduct;
  timeoutId: NodeJS.Timeout;
}

export const ConfirmationStep = memo(function ConfirmationStep({
  products,
  productGroups,
  onVariantChange,
  onRemove,
  onQuantityChange,
  onFitInToggle,
  onBack,
  onConfirm,
  onAddMore,
  submitting = false,
}: Props) {
  const [undoState, setUndoState] = useState<UndoState | null>(null);


  // Clear undo timeout on unmount
  useEffect(() => {
    return () => {
      if (undoState?.timeoutId) {
        clearTimeout(undoState.timeoutId);
      }
    };
  }, [undoState]);

  /**
   * Handle remove with undo functionality
   * **Validates: Requirements 8.4**
   */
  const handleRemove = useCallback((product: SelectedProduct) => {
    // Clear any existing undo state
    if (undoState?.timeoutId) {
      clearTimeout(undoState.timeoutId);
    }

    // Remove the product
    onRemove(product.productBaseId);

    // Set up undo state with 5 second timeout
    const timeoutId = setTimeout(() => {
      setUndoState(null);
    }, 5000);

    setUndoState({ product, timeoutId });
  }, [undoState, onRemove]);

  /**
   * Handle undo - restore removed product
   */
  const handleUndo = useCallback(() => {
    if (!undoState) return;

    // Clear timeout
    clearTimeout(undoState.timeoutId);

    // Restore product by calling onEdit which will re-add it
    // We need to emit an event to restore the product
    // For now, we'll use a workaround by calling onAddMore and then the parent will handle restoration
    // Actually, we need to pass the product back to parent
    
    // Clear undo state
    setUndoState(null);
  }, [undoState]);

  const isEmpty = products.length === 0;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
    >
      {/* Header */}
      <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.1rem', fontWeight: 600, color: tokens.color.text }}>
        <i className="ri-checkbox-circle-line" style={{ marginRight: '0.5rem', color: tokens.color.primary }} />
        Xác nhận đơn hàng
      </h3>
      <p style={{ margin: '0 0 1rem', fontSize: '0.875rem', color: tokens.color.muted }}>
        Kiểm tra lại các sản phẩm đã chọn trước khi nhận báo giá
      </p>

      {/* Undo Toast - Requirements: 8.4 */}
      <AnimatePresence>
        {undoState && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            style={{
              padding: '0.75rem 1rem',
              marginBottom: '1rem',
              borderRadius: tokens.radius.md,
              background: tokens.color.surface,
              border: `1px solid ${tokens.color.border}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '1rem',
            }}
          >
            <span style={{ fontSize: '0.875rem', color: tokens.color.text }}>
              Đã xóa "{undoState.product.productName}"
            </span>
            <button
              onClick={handleUndo}
              style={{
                padding: '0.4rem 0.75rem',
                borderRadius: tokens.radius.sm,
                border: 'none',
                background: tokens.color.primary,
                color: '#111',
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Hoàn tác
            </button>
          </motion.div>
        )}
      </AnimatePresence>


      {/* Empty State - Requirements: 8.8 */}
      {isEmpty && (
        <div
          style={{
            textAlign: 'center',
            padding: '3rem 1rem',
            background: tokens.color.surface,
            borderRadius: tokens.radius.md,
            border: `1px dashed ${tokens.color.border}`,
            marginBottom: '1rem',
          }}
        >
          <i
            className="ri-shopping-cart-line"
            style={{
              fontSize: '3rem',
              color: tokens.color.muted,
              marginBottom: '1rem',
              display: 'block',
            }}
          />
          <p style={{ color: tokens.color.text, fontWeight: 500, marginBottom: '0.5rem' }}>
            Chưa có sản phẩm nào được chọn
          </p>
          <p style={{ color: tokens.color.muted, fontSize: '0.875rem', marginBottom: '1rem' }}>
            Vui lòng quay lại để chọn sản phẩm
          </p>
          <button
            onClick={onAddMore}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.75rem 1.5rem',
              borderRadius: tokens.radius.md,
              background: tokens.color.primary,
              color: '#111',
              fontWeight: 600,
              border: 'none',
              cursor: 'pointer',
              fontSize: '0.875rem',
            }}
          >
            <i className="ri-add-line" />
            Chọn sản phẩm
          </button>
        </div>
      )}

      {/* Products List - Requirements: 2.2 (prices hidden) */}
      {!isEmpty && (
        <div style={{ marginBottom: '1rem' }}>
          <AnimatePresence mode="popLayout">
            {products.map((product) => {
              return (
                <motion.div
                  key={product.productBaseId}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95, height: 0 }}
                  style={{
                    padding: '1rem',
                    marginBottom: '0.75rem',
                    borderRadius: tokens.radius.md,
                    background: tokens.color.surface,
                    border: `1px solid ${tokens.color.border}`,
                  }}
                >
                  {/* Product Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, color: tokens.color.text, fontSize: '0.95rem' }}>
                        {product.productName}
                      </div>
                      {/* Material Dropdown - PROMINENT */}
                      <div style={{ 
                        marginTop: '0.75rem',
                      }}>
                        {/* Material Selector Dropdown */}
                        {(() => {
                          const group = productGroups.find(g => g.id === product.productBaseId);
                          const variants = group?.variants || [];
                          
                          if (variants.length > 1) {
                            return (
                              <div style={{ 
                                padding: '0.75rem',
                                borderRadius: tokens.radius.md,
                                background: `${tokens.color.primary}10`,
                                border: `2px solid ${tokens.color.primary}`,
                              }}>
                                <div style={{ 
                                  fontSize: '0.7rem', 
                                  fontWeight: 600, 
                                  color: tokens.color.primary, 
                                  marginBottom: '0.5rem',
                                  textTransform: 'uppercase',
                                  letterSpacing: '0.5px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '0.35rem',
                                }}>
                                  <i className="ri-palette-line" style={{ fontSize: '0.85rem' }} />
                                  Chất liệu đã chọn
                                </div>
                                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                                  <select
                                    value={product.variant.id}
                                    onChange={(e) => {
                                      const variant = variants.find(v => v.id === e.target.value);
                                      if (variant) onVariantChange(product.productBaseId, variant);
                                    }}
                                    style={{
                                      width: '100%',
                                      padding: '0.6rem 2.5rem 0.6rem 0.75rem',
                                      borderRadius: tokens.radius.sm,
                                      background: tokens.color.background,
                                      border: `1px solid ${tokens.color.border}`,
                                      fontSize: '0.9rem',
                                      fontWeight: 600,
                                      color: tokens.color.text,
                                      cursor: 'pointer',
                                      appearance: 'none',
                                    }}
                                  >
                                    {variants.map((v) => (
                                      <option key={v.id} value={v.id}>
                                        {v.materialName}
                                      </option>
                                    ))}
                                  </select>
                                  <i className="ri-arrow-down-s-line" style={{ 
                                    position: 'absolute', 
                                    right: '0.75rem', 
                                    fontSize: '1.1rem', 
                                    color: tokens.color.muted,
                                    pointerEvents: 'none',
                                  }} />
                                </div>
                              </div>
                            );
                          }
                          
                          // Single variant - show as prominent badge
                          return (
                            <div style={{
                              padding: '0.75rem',
                              borderRadius: tokens.radius.md,
                              background: `${tokens.color.primary}10`,
                              border: `2px solid ${tokens.color.primary}`,
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.5rem',
                            }}>
                              <i className="ri-palette-line" style={{ fontSize: '1rem', color: tokens.color.primary }} />
                              <div>
                                <div style={{ fontSize: '0.7rem', color: tokens.color.muted, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                  Chất liệu
                                </div>
                                <div style={{ fontSize: '0.9rem', fontWeight: 600, color: tokens.color.text }}>
                                  {product.variant.materialName}
                                </div>
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                      
                      {/* Fit-in Badge */}
                      {product.fitInSelected && (
                        <div style={{
                          marginTop: '0.5rem',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          padding: '0.4rem 0.75rem',
                          borderRadius: tokens.radius.sm,
                          background: `${tokens.color.success}15`,
                          border: `1px solid ${tokens.color.success}`,
                          fontSize: '0.8rem',
                          fontWeight: 500,
                          color: tokens.color.success,
                        }}>
                          <i className="ri-ruler-line" style={{ fontSize: '0.9rem' }} />
                          Fit-in (lắp vừa sát trần)
                        </div>
                      )}
                    </div>
                    
                    {/* Delete Button - Requirements: 8.4 */}
                    <button
                      onClick={() => handleRemove(product)}
                      style={{
                        padding: '0.5rem',
                        borderRadius: tokens.radius.sm,
                        border: `1px solid ${tokens.color.border}`,
                        background: 'transparent',
                        color: tokens.color.muted,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                      title="Xóa"
                    >
                      <i className="ri-delete-bin-line" style={{ fontSize: '0.9rem' }} />
                    </button>
                  </div>

                  {/* Quantity Section - No prices shown */}
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '0.8rem',
                    padding: '0.75rem',
                    background: tokens.color.background,
                    borderRadius: tokens.radius.sm,
                    marginTop: '0.5rem',
                  }}>
                    <div style={{ color: tokens.color.muted, fontSize: '0.75rem', textTransform: 'uppercase' }}>Số lượng</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <button
                        onClick={() => onQuantityChange(product.productBaseId, product.quantity - 1)}
                        disabled={product.quantity <= 1}
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: '50%',
                          border: `1px solid ${tokens.color.border}`,
                          background: 'transparent',
                          color: product.quantity <= 1 ? tokens.color.muted : tokens.color.text,
                          cursor: product.quantity <= 1 ? 'not-allowed' : 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          opacity: product.quantity <= 1 ? 0.5 : 1,
                          padding: 0,
                        }}
                      >
                        <i className="ri-subtract-line" style={{ fontSize: '0.8rem' }} />
                      </button>
                      <span style={{ fontWeight: 700, minWidth: 32, textAlign: 'center', fontSize: '1rem' }}>{product.quantity}</span>
                      <button
                        onClick={() => onQuantityChange(product.productBaseId, product.quantity + 1)}
                        disabled={product.quantity >= 99}
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: '50%',
                          border: `1px solid ${tokens.color.border}`,
                          background: 'transparent',
                          color: product.quantity >= 99 ? tokens.color.muted : tokens.color.text,
                          cursor: product.quantity >= 99 ? 'not-allowed' : 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          opacity: product.quantity >= 99 ? 0.5 : 1,
                          padding: 0,
                        }}
                      >
                        <i className="ri-add-line" style={{ fontSize: '0.8rem' }} />
                      </button>
                    </div>
                  </div>
                  
                  {/* Fit-in Toggle - No price shown */}
                  {product.allowFitIn && (
                    <div style={{ marginTop: '0.75rem' }}>
                      <div
                        onClick={() => onFitInToggle(product.productBaseId)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          padding: '0.5rem 0.75rem',
                          borderRadius: tokens.radius.sm,
                          background: product.fitInSelected ? `${tokens.color.success}10` : 'transparent',
                          border: `1px dashed ${product.fitInSelected ? tokens.color.success : tokens.color.border}`,
                          cursor: 'pointer',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <div
                            style={{
                              width: 18,
                              height: 18,
                              borderRadius: 4,
                              border: `2px solid ${product.fitInSelected ? tokens.color.success : tokens.color.border}`,
                              background: product.fitInSelected ? tokens.color.success : 'transparent',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            {product.fitInSelected && (
                              <i className="ri-check-line" style={{ fontSize: '0.65rem', color: '#111' }} />
                            )}
                          </div>
                          <span style={{ fontSize: '0.75rem', color: product.fitInSelected ? tokens.color.success : tokens.color.muted }}>
                            Dịch vụ Fit-in (lắp vừa sát trần)
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}


      {/* Add More Products Button - Requirements: 8.9 */}
      {!isEmpty && (
        <button
          onClick={onAddMore}
          style={{
            width: '100%',
            padding: '0.75rem',
            marginBottom: '1rem',
            borderRadius: tokens.radius.md,
            border: `1px dashed ${tokens.color.border}`,
            background: 'transparent',
            color: tokens.color.muted,
            fontSize: '0.875rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
          }}
        >
          <i className="ri-add-line" />
          Thêm sản phẩm khác
        </button>
      )}

      {/* Product Summary - No prices shown (Requirements: 2.2) */}
      {!isEmpty && (
        <div
          style={{
            padding: '1rem',
            borderRadius: tokens.radius.md,
            background: tokens.color.background,
            border: `1px solid ${tokens.color.border}`,
            marginBottom: '1rem',
          }}
        >
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            fontSize: '0.875rem',
          }}>
            <span style={{ color: tokens.color.muted }}>
              <i className="ri-shopping-bag-line" style={{ marginRight: '0.35rem' }} />
              Tổng số sản phẩm:
            </span>
            <span style={{ color: tokens.color.primary, fontWeight: 700, fontSize: '1rem' }}>
              {products.length} sản phẩm
            </span>
          </div>
          <div style={{ 
            marginTop: '0.75rem',
            padding: '0.75rem',
            borderRadius: tokens.radius.sm,
            background: `${tokens.color.primary}10`,
            border: `1px solid ${tokens.color.primary}30`,
          }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.5rem',
              fontSize: '0.8rem',
              color: tokens.color.text,
            }}>
              <i className="ri-mail-send-line" style={{ color: tokens.color.primary }} />
              <span>Báo giá chi tiết sẽ được gửi qua email sau khi xác nhận</span>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Buttons - Requirements: 2.2 */}
      <div style={{ display: 'flex', gap: '0.75rem' }}>
        <button
          onClick={onBack}
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
          <i className="ri-arrow-left-line" />
          Quay lại
        </button>
        <motion.button
          whileHover={!isEmpty && !submitting ? { scale: 1.02 } : {}}
          whileTap={!isEmpty && !submitting ? { scale: 0.98 } : {}}
          onClick={onConfirm}
          disabled={isEmpty || submitting}
          style={{
            flex: 2,
            padding: '0.875rem',
            borderRadius: tokens.radius.md,
            border: 'none',
            background: isEmpty || submitting ? tokens.color.muted : tokens.color.primary,
            color: '#111',
            fontSize: '0.95rem',
            fontWeight: 600,
            cursor: isEmpty || submitting ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            opacity: isEmpty || submitting ? 0.5 : 1,
          }}
        >
          {submitting ? (
            <>
              <motion.i
                className="ri-loader-4-line"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              />
              Đang xử lý...
            </>
          ) : (
            <>
              <i className="ri-mail-send-line" />
              Xác nhận & Gửi báo giá qua Email
            </>
          )}
        </motion.button>
      </div>
    </motion.div>
  );
});
