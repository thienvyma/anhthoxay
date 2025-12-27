/**
 * ProductGrid - Product grid component for CatalogTab
 *
 * Feature: furniture-quotation
 * Requirements: 6.2
 */

import { motion } from 'framer-motion';
import { tokens } from '@app/shared';
import { ResponsiveGrid } from '../../../../components/responsive';
import { Card } from '../../../components/Card';
import { Button } from '../../../components/Button';
import type { FurnitureCategory, FurnitureProduct } from '../types';

export interface ProductGridProps {
  products: FurnitureProduct[];
  categories: FurnitureCategory[];
  selectedCategoryId: string;
  onAddProduct: () => void;
  onEditProduct: (product: FurnitureProduct) => void;
  onDeleteProduct: (productId: string) => void;
  disabled?: boolean;
}

export function ProductGrid({
  products,
  categories,
  selectedCategoryId,
  onAddProduct,
  onEditProduct,
  onDeleteProduct,
  disabled = false,
}: ProductGridProps) {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price);
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
          Sản phẩm ({products.length})
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

      {/* Products grid */}
      {products.length > 0 ? (
        <ResponsiveGrid cols={{ mobile: 1, tablet: 1, desktop: 2 }} gap={16}>
          {products.map((product) => (
            <motion.div
              key={product.id}
              whileHover={{ scale: 1.02 }}
              style={{
                background: tokens.color.surfaceHover,
                borderRadius: 12,
                overflow: 'hidden',
                border: `1px solid ${tokens.color.border}`,
                opacity: product.isActive ? 1 : 0.6,
              }}
            >
              {/* Product image */}
              <div
                style={{
                  width: '100%',
                  height: 120,
                  background: product.imageUrl
                    ? `url(${product.imageUrl}) center/cover`
                    : `linear-gradient(135deg, ${tokens.color.surface}, ${tokens.color.surfaceHover})`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {!product.imageUrl && (
                  <i className="ri-image-line" style={{ fontSize: 32, color: tokens.color.muted }} />
                )}
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
                  {product.name}
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    marginBottom: 8,
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
                    {categories.find((c) => c.id === product.categoryId)?.name || 'N/A'}
                  </span>
                  {!product.isActive && (
                    <span
                      style={{
                        background: tokens.color.warning + '20',
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

                <div
                  style={{
                    color: tokens.color.primary,
                    fontWeight: 700,
                    fontSize: 15,
                    marginBottom: 8,
                  }}
                >
                  {formatPrice(product.price)}
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: 8 }}>
                  <Button
                    variant="outline"
                    size="small"
                    onClick={() => onEditProduct(product)}
                    style={{ flex: 1 }}
                  >
                    <i className="ri-edit-line" /> Sửa
                  </Button>
                  <Button
                    variant="ghost"
                    size="small"
                    onClick={() => onDeleteProduct(product.id)}
                    style={{ color: tokens.color.error }}
                  >
                    <i className="ri-delete-bin-line" />
                  </Button>
                </div>
              </div>
            </motion.div>
          ))}
        </ResponsiveGrid>
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
