/**
 * ProductGrid - Product grid component for CatalogTab
 *
 * Feature: furniture-quotation, furniture-product-restructure
 * Requirements: 3.1, 4.1, 6.2
 */

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { resolveMediaUrl } from '@app/shared';
import { tokens } from '../../../../theme';
import { Card } from '../../../components/Card';
import { Button } from '../../../components/Button';
import type { FurnitureCategory, FurnitureMaterial, ProductBaseWithDetails } from '../types';

// Pagination config: 3 columns x 4 rows = 12 items per page
const ITEMS_PER_PAGE = 12;

export interface ProductGridProps {
  productBases: ProductBaseWithDetails[];
  categories: FurnitureCategory[];
  materials: FurnitureMaterial[];
  selectedCategoryId: string;
  onAddProduct: () => void;
  onEditProduct: (productBase: ProductBaseWithDetails) => void;
  onDeleteProduct: (productBaseId: string) => void;
  disabled?: boolean;
}

export function ProductGrid({
  productBases,
  categories,
  materials,
  selectedCategoryId,
  onAddProduct,
  onEditProduct,
  onDeleteProduct,
  disabled = false,
}: ProductGridProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedProductId, setExpandedProductId] = useState<string | null>(null);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price);
  };

  // Pagination logic
  const totalPages = Math.ceil(productBases.length / ITEMS_PER_PAGE);
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return productBases.slice(start, start + ITEMS_PER_PAGE);
  }, [productBases, currentPage]);

  // Reset to page 1 when products change (e.g., category filter)
  useMemo(() => {
    if (currentPage > Math.ceil(productBases.length / ITEMS_PER_PAGE)) {
      setCurrentPage(1);
    }
  }, [productBases.length, currentPage]);

  // Get material name by ID
  const getMaterialName = (materialId: string) => {
    const material = materials.find((m) => m.id === materialId);
    return material?.name || 'N/A';
  };

  // Toggle expanded state for a product
  const toggleExpanded = (productId: string) => {
    setExpandedProductId((prev) => (prev === productId ? null : productId));
  };

  return (
    <Card>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 16,
        }}
      >
        <h4 style={{ color: tokens.color.text, margin: 0, fontSize: 16, fontWeight: 600 }}>
          Sản phẩm ({productBases.length})
        </h4>
        <Button
          variant="outline"
          size="small"
          onClick={onAddProduct}
          disabled={disabled}
        >
          <i className="ri-add-line" /> Thêm
        </Button>
      </div>

      {/* Products grid - 3 columns */}
      {productBases.length > 0 ? (
        <>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 16,
            }}
          >
            {paginatedProducts.map((productBase) => (
              <motion.div
                key={productBase.id}
                whileHover={{ scale: 1.02 }}
                style={{
                  background: tokens.color.surfaceHover,
                  borderRadius: 12,
                  overflow: 'hidden',
                  border: `1px solid ${tokens.color.border}`,
                  opacity: productBase.isActive ? 1 : 0.6,
                }}
              >
                {/* Product image */}
                <div
                  style={{
                    width: '100%',
                    height: 120,
                    background: productBase.imageUrl
                      ? `url(${resolveMediaUrl(productBase.imageUrl)}) center/cover`
                      : tokens.color.surface,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                  }}
                >
                  {!productBase.imageUrl && (
                    <i className="ri-image-line" style={{ fontSize: 32, color: tokens.color.muted }} />
                  )}
                  {/* Variant count badge */}
                  <div
                    style={{
                      position: 'absolute',
                      top: 8,
                      right: 8,
                      background: tokens.color.primary,
                      color: '#fff',
                      padding: '2px 8px',
                      borderRadius: 12,
                      fontSize: 11,
                      fontWeight: 600,
                    }}
                  >
                    {productBase.variantCount} biến thể
                  </div>
                </div>

                {/* Product info */}
                <div style={{ padding: 12 }}>
                  <div
                    style={{
                      color: tokens.color.text,
                      fontWeight: 600,
                      fontSize: 14,
                      marginBottom: 4,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {productBase.name}
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      marginBottom: 8,
                      flexWrap: 'wrap',
                    }}
                  >
                    <span
                      style={{
                        background: tokens.color.surface,
                        padding: '2px 8px',
                        borderRadius: 6,
                        fontSize: 11,
                        color: tokens.color.muted,
                      }}
                    >
                      {categories.find((c) => c.id === productBase.categoryId)?.name || 'N/A'}
                    </span>
                    {productBase.allowFitIn && (
                      <span
                        style={{
                          background: `${tokens.color.success}20`,
                          padding: '2px 8px',
                          borderRadius: 6,
                          fontSize: 11,
                          color: tokens.color.success,
                        }}
                      >
                        Fit-in
                      </span>
                    )}
                    {!productBase.isActive && (
                      <span
                        style={{
                          background: `${tokens.color.warning}20`,
                          padding: '2px 8px',
                          borderRadius: 6,
                          fontSize: 11,
                          color: tokens.color.warning,
                        }}
                      >
                        Đã ẩn
                      </span>
                    )}
                  </div>

                  {/* Price range */}
                  <div
                    style={{
                      color: tokens.color.primary,
                      fontWeight: 700,
                      fontSize: 14,
                      marginBottom: 8,
                    }}
                  >
                    {productBase.priceRange ? (
                      productBase.priceRange.min === productBase.priceRange.max ? (
                        formatPrice(productBase.priceRange.min)
                      ) : (
                        <>
                          {formatPrice(productBase.priceRange.min)} - {formatPrice(productBase.priceRange.max)}
                        </>
                      )
                    ) : (
                      <span style={{ color: tokens.color.muted }}>Chưa có giá</span>
                    )}
                  </div>

                  {/* Expandable variants section */}
                  <div style={{ marginBottom: 8 }}>
                    <button
                      onClick={() => toggleExpanded(productBase.id)}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '6px 8px',
                        background: tokens.color.surface,
                        border: `1px solid ${tokens.color.border}`,
                        borderRadius: 6,
                        cursor: 'pointer',
                        color: tokens.color.text,
                        fontSize: 12,
                      }}
                    >
                      <span>Xem biến thể ({productBase.variantCount})</span>
                      <i
                        className={expandedProductId === productBase.id ? 'ri-arrow-up-s-line' : 'ri-arrow-down-s-line'}
                        style={{ fontSize: 16 }}
                      />
                    </button>
                    <AnimatePresence>
                      {expandedProductId === productBase.id && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          style={{ overflow: 'hidden' }}
                        >
                          <div
                            style={{
                              marginTop: 8,
                              background: tokens.color.surface,
                              borderRadius: 6,
                              border: `1px solid ${tokens.color.border}`,
                              maxHeight: 150,
                              overflowY: 'auto',
                            }}
                          >
                            {productBase.variants.map((variant, index) => (
                              <div
                                key={variant.id}
                                style={{
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                  padding: '6px 8px',
                                  borderBottom: index < productBase.variants.length - 1 ? `1px solid ${tokens.color.border}` : 'none',
                                  fontSize: 11,
                                }}
                              >
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                  <span style={{ color: tokens.color.text, fontWeight: 500 }}>
                                    {variant.material?.name || getMaterialName(variant.materialId)}
                                  </span>
                                  {!variant.isActive && (
                                    <span style={{ color: tokens.color.warning, fontSize: 10 }}>(Ẩn)</span>
                                  )}
                                </div>
                                <span style={{ color: tokens.color.primary, fontWeight: 600 }}>
                                  {formatPrice(variant.calculatedPrice)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: 8 }}>
                    <Button
                      variant="outline"
                      size="small"
                      onClick={() => onEditProduct(productBase)}
                      style={{ flex: 1 }}
                    >
                      <i className="ri-edit-line" /> Sửa
                    </Button>
                    <Button
                      variant="ghost"
                      size="small"
                      onClick={() => onDeleteProduct(productBase.id)}
                      style={{ color: tokens.color.error }}
                    >
                      <i className="ri-delete-bin-line" />
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: 8,
                marginTop: 20,
                paddingTop: 16,
                borderTop: `1px solid ${tokens.color.border}`,
              }}
            >
              <Button
                variant="ghost"
                size="small"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                style={{ padding: '6px 10px' }}
              >
                <i className="ri-arrow-left-s-line" />
              </Button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <Button
                  key={page}
                  variant={page === currentPage ? 'primary' : 'ghost'}
                  size="small"
                  onClick={() => setCurrentPage(page)}
                  style={{
                    padding: '6px 12px',
                    minWidth: 36,
                  }}
                >
                  {page}
                </Button>
              ))}

              <Button
                variant="ghost"
                size="small"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                style={{ padding: '6px 10px' }}
              >
                <i className="ri-arrow-right-s-line" />
              </Button>
            </div>
          )}
        </>
      ) : (
        <div
          style={{
            textAlign: 'center',
            padding: 48,
            color: tokens.color.muted,
          }}
        >
          <i className="ri-shopping-bag-line" style={{ fontSize: 48, marginBottom: 12, display: 'block' }} />
          {disabled
            ? 'Vui lòng tạo danh mục trước'
            : selectedCategoryId
            ? 'Không có sản phẩm trong danh mục này'
            : 'Chưa có sản phẩm nào'}
        </div>
      )}
    </Card>
  );
}

export default ProductGrid;
