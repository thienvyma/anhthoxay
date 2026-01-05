/**
 * MappingTab - Product-Apartment Mapping Management
 *
 * Feature: furniture-product-restructure
 * Requirements: 5.1, 5.5
 *
 * This component provides:
 * - Display mappings at ProductBase level (not variant level)
 * - Bulk mapping feature for multiple products
 */

import { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { resolveMediaUrl } from '@app/shared';
import { tokens } from '../../../theme';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { useToast } from '../../components/Toast';
import { furnitureProductBasesApi } from '../../api/furniture';
import { AddMappingModal } from './components/AddMappingModal';
import type {
  FurnitureCategory,
  ProductBaseWithDetails,
  ProductBaseMapping,
  ProductMappingInput,
} from './types';

// ========== TYPES ==========
export interface MappingTabProps {
  productBases: ProductBaseWithDetails[];
  categories: FurnitureCategory[];
  onRefresh: () => void;
}

// ========== COMPONENT ==========
export function MappingTab({ productBases, categories, onRefresh }: MappingTabProps) {
  const toast = useToast();

  // Selection state for bulk mapping
  const [selectedProductIds, setSelectedProductIds] = useState<Set<string>>(new Set());
  const [selectAll, setSelectAll] = useState(false);

  // Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');

  // Modal state
  const [showAddMappingModal, setShowAddMappingModal] = useState(false);
  const [bulkMappingMode, setBulkMappingMode] = useState(false);
  const [singleProductId, setSingleProductId] = useState<string | null>(null);

  // Loading state
  const [loading, setLoading] = useState(false);
  const [deletingMappingId, setDeletingMappingId] = useState<string | null>(null);

  // Expanded product state
  const [expandedProductId, setExpandedProductId] = useState<string | null>(null);

  // Filtered products
  const filteredProducts = useMemo(() => {
    let filtered = productBases;
    if (selectedCategoryId) {
      filtered = filtered.filter((p) => p.categoryId === selectedCategoryId);
    }
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter((p) => p.name.toLowerCase().includes(query));
    }
    return filtered;
  }, [productBases, selectedCategoryId, searchQuery]);

  // Handle select all toggle
  const handleSelectAll = useCallback(() => {
    if (selectAll) {
      setSelectedProductIds(new Set());
    } else {
      setSelectedProductIds(new Set(filteredProducts.map((p) => p.id)));
    }
    setSelectAll(!selectAll);
  }, [selectAll, filteredProducts]);

  // Handle individual product selection
  const handleSelectProduct = useCallback((productId: string) => {
    setSelectedProductIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(productId)) {
        newSet.delete(productId);
      } else {
        newSet.add(productId);
      }
      return newSet;
    });
  }, []);

  // Open add mapping modal for single product
  const openSingleMapping = useCallback((productId: string) => {
    setSingleProductId(productId);
    setBulkMappingMode(false);
    setShowAddMappingModal(true);
  }, []);

  // Open add mapping modal for bulk mapping
  const openBulkMapping = useCallback(() => {
    if (selectedProductIds.size === 0) {
      toast.error('Vui lòng chọn ít nhất một sản phẩm');
      return;
    }
    setSingleProductId(null);
    setBulkMappingMode(true);
    setShowAddMappingModal(true);
  }, [selectedProductIds.size, toast]);

  // Handle add mapping
  const handleAddMapping = async (mapping: ProductMappingInput) => {
    setLoading(true);
    try {
      if (bulkMappingMode) {
        // Bulk mapping
        const productIds = Array.from(selectedProductIds);
        const result = await furnitureProductBasesApi.bulkMapping(productIds, mapping);
        
        if (result.created > 0) {
          toast.success(`Đã thêm ánh xạ cho ${result.created} sản phẩm`);
        }
        if (result.skipped > 0) {
          toast.info(`${result.skipped} sản phẩm đã có ánh xạ này`);
        }
        if (result.errors && result.errors.length > 0) {
          toast.warning(`${result.errors.length} sản phẩm gặp lỗi`);
        }
        
        setSelectedProductIds(new Set());
        setSelectAll(false);
      } else if (singleProductId) {
        // Single product mapping
        await furnitureProductBasesApi.addMapping(singleProductId, mapping);
        toast.success('Đã thêm ánh xạ thành công');
      }
      
      onRefresh();
      setShowAddMappingModal(false);
    } catch (error) {
      toast.error('Lỗi: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  // Handle delete mapping
  const handleDeleteMapping = async (productId: string, mappingId: string) => {
    if (!confirm('Bạn có chắc muốn xóa ánh xạ này?')) return;
    
    setDeletingMappingId(mappingId);
    try {
      await furnitureProductBasesApi.removeMapping(productId, mappingId);
      toast.success('Đã xóa ánh xạ');
      onRefresh();
    } catch (error) {
      toast.error('Lỗi: ' + (error as Error).message);
    } finally {
      setDeletingMappingId(null);
    }
  };

  // Toggle expanded product
  const toggleExpanded = (productId: string) => {
    setExpandedProductId((prev) => (prev === productId ? null : productId));
  };

  // Get category name
  const getCategoryName = (categoryId: string) => {
    const category = categories.find((c) => c.id === categoryId);
    return category?.name || 'N/A';
  };

  return (
    <div style={{ padding: 24 }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 24,
          flexWrap: 'wrap',
          gap: 16,
        }}
      >
        <h3 style={{ color: tokens.color.text, margin: 0, fontSize: 20, fontWeight: 600 }}>
          Ánh xạ sản phẩm - Căn hộ
        </h3>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button onClick={onRefresh} variant="outline" disabled={loading}>
            <i className="ri-refresh-line" /> Làm mới
          </Button>
        </div>
      </div>

      {/* Filters and Bulk Actions */}
      <Card style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          {/* Search */}
          <div style={{ flex: '1 1 200px', minWidth: 200 }}>
            <Input
              label="Tìm kiếm sản phẩm"
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Nhập tên sản phẩm..."
              fullWidth
            />
          </div>

          {/* Category filter */}
          <div style={{ flex: '0 0 200px' }}>
            <label style={{ display: 'block', marginBottom: 8, color: tokens.color.text, fontSize: 14 }}>
              Danh mục
            </label>
            <select
              value={selectedCategoryId}
              onChange={(e) => setSelectedCategoryId(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: 8,
                border: `1px solid ${tokens.color.border}`,
                background: tokens.color.surface,
                color: tokens.color.text,
                fontSize: 14,
                cursor: 'pointer',
              }}
            >
              <option value="">Tất cả danh mục</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Bulk mapping button */}
          <div style={{ flex: '0 0 auto' }}>
            <Button
              onClick={openBulkMapping}
              disabled={selectedProductIds.size === 0 || loading}
              style={{ marginTop: 24 }}
            >
              <i className="ri-links-line" /> Ánh xạ hàng loạt ({selectedProductIds.size})
            </Button>
          </div>
        </div>
      </Card>

      {/* Products List */}
      <Card>
        {/* Select all header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '12px 16px',
            borderBottom: `1px solid ${tokens.color.border}`,
            background: tokens.color.surfaceHover,
          }}
        >
          <input
            type="checkbox"
            checked={selectAll && filteredProducts.length > 0}
            onChange={handleSelectAll}
            style={{ width: 18, height: 18, cursor: 'pointer' }}
            disabled={filteredProducts.length === 0}
          />
          <span style={{ color: tokens.color.text, fontSize: 14, fontWeight: 500 }}>
            {selectAll ? 'Bỏ chọn tất cả' : 'Chọn tất cả'} ({filteredProducts.length} sản phẩm)
          </span>
        </div>

        {/* Products */}
        {filteredProducts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 48, color: tokens.color.muted }}>
            <i className="ri-inbox-line" style={{ fontSize: 48, marginBottom: 12, display: 'block' }} />
            {searchQuery || selectedCategoryId
              ? 'Không tìm thấy sản phẩm phù hợp'
              : 'Chưa có sản phẩm nào'}
          </div>
        ) : (
          <div>
            {filteredProducts.map((product) => (
              <ProductMappingRow
                key={product.id}
                product={product}
                categoryName={getCategoryName(product.categoryId)}
                isSelected={selectedProductIds.has(product.id)}
                isExpanded={expandedProductId === product.id}
                deletingMappingId={deletingMappingId}
                onSelect={() => handleSelectProduct(product.id)}
                onToggleExpand={() => toggleExpanded(product.id)}
                onAddMapping={() => openSingleMapping(product.id)}
                onDeleteMapping={(mappingId) => handleDeleteMapping(product.id, mappingId)}
              />
            ))}
          </div>
        )}
      </Card>

      {/* Add Mapping Modal */}
      <AddMappingModal
        isOpen={showAddMappingModal}
        onClose={() => setShowAddMappingModal(false)}
        onAdd={handleAddMapping}
      />
    </div>
  );
}

// ========== SUB-COMPONENTS ==========

interface ProductMappingRowProps {
  product: ProductBaseWithDetails;
  categoryName: string;
  isSelected: boolean;
  isExpanded: boolean;
  deletingMappingId: string | null;
  onSelect: () => void;
  onToggleExpand: () => void;
  onAddMapping: () => void;
  onDeleteMapping: (mappingId: string) => void;
}

function ProductMappingRow({
  product,
  categoryName,
  isSelected,
  isExpanded,
  deletingMappingId,
  onSelect,
  onToggleExpand,
  onAddMapping,
  onDeleteMapping,
}: ProductMappingRowProps) {
  const mappingCount = product.mappings?.length || 0;

  return (
    <div
      style={{
        borderBottom: `1px solid ${tokens.color.border}`,
      }}
    >
      {/* Product row */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '12px 16px',
          background: isSelected ? `${tokens.color.primary}08` : 'transparent',
        }}
      >
        {/* Checkbox */}
        <input
          type="checkbox"
          checked={isSelected}
          onChange={onSelect}
          style={{ width: 18, height: 18, cursor: 'pointer', flexShrink: 0 }}
        />

        {/* Product image */}
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: 8,
            background: product.imageUrl
              ? `url(${resolveMediaUrl(product.imageUrl)}) center/cover`
              : tokens.color.surfaceHover,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            border: `1px solid ${tokens.color.border}`,
          }}
        >
          {!product.imageUrl && (
            <i className="ri-image-line" style={{ fontSize: 20, color: tokens.color.muted }} />
          )}
        </div>

        {/* Product info */}
        <div style={{ flex: 1, minWidth: 0 }}>
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
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span
              style={{
                background: tokens.color.surfaceHover,
                padding: '2px 8px',
                borderRadius: 6,
                fontSize: 11,
                color: tokens.color.muted,
              }}
            >
              {categoryName}
            </span>
            <span
              style={{
                background: tokens.color.primary + '15',
                padding: '2px 8px',
                borderRadius: 6,
                fontSize: 11,
                color: tokens.color.primary,
              }}
            >
              {product.variantCount} biến thể
            </span>
            {!product.isActive && (
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
        </div>

        {/* Mapping count badge */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            flexShrink: 0,
          }}
        >
          <span
            style={{
              background: mappingCount > 0 ? `${tokens.color.success}15` : tokens.color.surfaceHover,
              color: mappingCount > 0 ? tokens.color.success : tokens.color.muted,
              padding: '4px 12px',
              borderRadius: 16,
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            {mappingCount} ánh xạ
          </span>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
          <Button variant="outline" size="small" onClick={onAddMapping}>
            <i className="ri-add-line" /> Thêm
          </Button>
          <Button
            variant="ghost"
            size="small"
            onClick={onToggleExpand}
            disabled={mappingCount === 0}
            style={{ padding: '6px 8px' }}
          >
            <i className={isExpanded ? 'ri-arrow-up-s-line' : 'ri-arrow-down-s-line'} style={{ fontSize: 18 }} />
          </Button>
        </div>
      </div>

      {/* Expanded mappings */}
      <AnimatePresence>
        {isExpanded && mappingCount > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{ overflow: 'hidden' }}
          >
            <div
              style={{
                padding: '12px 16px 12px 94px',
                background: tokens.color.surfaceHover,
              }}
            >
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {product.mappings.map((mapping) => (
                  <MappingBadge
                    key={mapping.id}
                    mapping={mapping}
                    isDeleting={deletingMappingId === mapping.id}
                    onDelete={() => onDeleteMapping(mapping.id)}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface MappingBadgeProps {
  mapping: ProductBaseMapping;
  isDeleting: boolean;
  onDelete: () => void;
}

function MappingBadge({ mapping, isDeleting, onDelete }: MappingBadgeProps) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '6px 12px',
        background: tokens.color.surface,
        borderRadius: 8,
        border: `1px solid ${tokens.color.border}`,
        fontSize: 12,
      }}
    >
      <span style={{ color: tokens.color.text }}>
        {mapping.projectName} / {mapping.buildingCode} / {mapping.apartmentType}
      </span>
      <button
        onClick={onDelete}
        disabled={isDeleting}
        style={{
          background: 'none',
          border: 'none',
          padding: 2,
          cursor: isDeleting ? 'wait' : 'pointer',
          color: tokens.color.error,
          opacity: isDeleting ? 0.5 : 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {isDeleting ? (
          <i className="ri-loader-4-line" style={{ fontSize: 14, animation: 'spin 1s linear infinite' }} />
        ) : (
          <i className="ri-close-line" style={{ fontSize: 14 }} />
        )}
      </button>
    </div>
  );
}

export default MappingTab;
