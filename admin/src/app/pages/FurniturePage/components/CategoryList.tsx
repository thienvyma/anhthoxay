/**
 * CategoryList - Category list component for CatalogTab
 *
 * Feature: furniture-quotation
 * Requirements: 6.1
 */

import { motion } from 'framer-motion';
import { tokens } from '../../../../theme';
import { Card } from '../../../components/Card';
import { Button } from '../../../components/Button';
import type { FurnitureCategory } from '../types';

export interface CategoryListProps {
  categories: FurnitureCategory[];
  selectedCategoryId: string;
  totalProducts: number;
  onSelectCategory: (categoryId: string) => void;
  onAddCategory: () => void;
  onEditCategory: (category: FurnitureCategory) => void;
  onDeleteCategory: (categoryId: string) => void;
  getCategoryProductCount: (categoryId: string) => number;
}

export function CategoryList({
  categories,
  selectedCategoryId,
  totalProducts,
  onSelectCategory,
  onAddCategory,
  onEditCategory,
  onDeleteCategory,
  getCategoryProductCount,
}: CategoryListProps) {
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
          Danh mục ({categories.length})
        </h4>
        <Button variant="outline" size="small" onClick={onAddCategory}>
          <i className="ri-add-line" /> Thêm
        </Button>
      </div>

      {/* Categories list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {/* All categories option */}
        <motion.div
          whileHover={{ scale: 1.01 }}
          onClick={() => onSelectCategory('')}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 16px',
            borderRadius: 12,
            background: !selectedCategoryId ? `${tokens.color.primary}15` : 'transparent',
            border: `1px solid ${!selectedCategoryId ? tokens.color.primary : tokens.color.border}`,
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                background: tokens.color.surfaceHover,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: tokens.color.muted,
              }}
            >
              <i className="ri-apps-line" style={{ fontSize: 18 }} />
            </div>
            <span style={{ color: tokens.color.text, fontWeight: 500 }}>Tất cả</span>
          </div>
          <span
            style={{
              background: tokens.color.surfaceHover,
              padding: '4px 10px',
              borderRadius: 12,
              fontSize: 12,
              color: tokens.color.muted,
            }}
          >
            {totalProducts}
          </span>
        </motion.div>

        {/* Category items */}
        {categories.map((category) => (
          <motion.div
            key={category.id}
            whileHover={{ scale: 1.01 }}
            onClick={() => onSelectCategory(category.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 16px',
              borderRadius: 12,
              background:
                selectedCategoryId === category.id ? `${tokens.color.primary}15` : 'transparent',
              border: `1px solid ${
                selectedCategoryId === category.id ? tokens.color.primary : tokens.color.border
              }`,
              cursor: 'pointer',
              transition: 'all 0.2s',
              opacity: category.isActive ? 1 : 0.5,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 8,
                  background: `${tokens.color.primary}15`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: tokens.color.primary,
                  flexShrink: 0,
                }}
              >
                <i className={category.icon || 'ri-folder-line'} style={{ fontSize: 18 }} />
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div
                  style={{
                    color: tokens.color.text,
                    fontWeight: 500,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {category.name}
                </div>
                {!category.isActive && (
                  <span style={{ fontSize: 11, color: tokens.color.warning }}>Đã ẩn</span>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span
                style={{
                  background: tokens.color.surfaceHover,
                  padding: '4px 10px',
                  borderRadius: 12,
                  fontSize: 12,
                  color: tokens.color.muted,
                }}
              >
                {getCategoryProductCount(category.id)}
              </span>
              <Button
                variant="ghost"
                size="small"
                onClick={(e) => {
                  e?.stopPropagation();
                  onEditCategory(category);
                }}
                style={{ padding: 6 }}
              >
                <i className="ri-edit-line" />
              </Button>
              <Button
                variant="ghost"
                size="small"
                onClick={(e) => {
                  e?.stopPropagation();
                  onDeleteCategory(category.id);
                }}
                style={{ padding: 6, color: tokens.color.error }}
              >
                <i className="ri-delete-bin-line" />
              </Button>
            </div>
          </motion.div>
        ))}

        {categories.length === 0 && (
          <div
            style={{
              textAlign: 'center',
              padding: 32,
              color: tokens.color.muted,
            }}
          >
            <i className="ri-folder-add-line" style={{ fontSize: 32, marginBottom: 8, display: 'block' }} />
            Chưa có danh mục nào
          </div>
        )}
      </div>
    </Card>
  );
}

export default CategoryList;
