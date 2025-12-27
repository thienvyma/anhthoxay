/**
 * CatalogTab - Furniture Product Catalog Management
 *
 * Feature: furniture-quotation
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7
 */

import { useState, useCallback, useMemo, useRef } from 'react';
import { motion } from 'framer-motion';
import { tokens } from '@app/shared';
import { ResponsiveGrid, ResponsiveModal } from '../../../components/responsive';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { Input, TextArea } from '../../components/Input';
import { Select } from '../../components/Select';
import { useToast } from '../../components/Toast';
import {
  furnitureCategoriesApi,
  furnitureProductsApi,
} from '../../api/furniture';
import { mediaApi } from '../../api/content';
import type {
  CatalogTabProps,
  FurnitureCategory,
  FurnitureProduct,
  CreateCategoryInput,
  UpdateCategoryInput,
  CreateProductInput,
  UpdateProductInput,
} from './types';

// ========== MODAL TYPES ==========
type ModalType = 'category' | 'product' | 'deleteCategory' | 'deleteProduct' | null;

// ========== ICON OPTIONS ==========
const ICON_OPTIONS = [
  { value: 'ri-sofa-line', label: 'Sofa' },
  { value: 'ri-armchair-line', label: 'Ghế' },
  { value: 'ri-hotel-bed-line', label: 'Giường' },
  { value: 'ri-door-line', label: 'Cửa' },
  { value: 'ri-lightbulb-line', label: 'Đèn' },
  { value: 'ri-tv-line', label: 'TV' },
  { value: 'ri-fridge-line', label: 'Tủ lạnh' },
  { value: 'ri-home-line', label: 'Nhà' },
  { value: 'ri-store-line', label: 'Cửa hàng' },
  { value: 'ri-archive-line', label: 'Tủ' },
  { value: 'ri-table-line', label: 'Bàn' },
  { value: 'ri-window-line', label: 'Cửa sổ' },
  { value: 'ri-paint-brush-line', label: 'Sơn' },
  { value: 'ri-tools-line', label: 'Dụng cụ' },
  { value: 'ri-plant-line', label: 'Cây cảnh' },
  { value: 'ri-cup-line', label: 'Ly/Cốc' },
];

// ========== COMPONENT ==========
export function CatalogTab({ categories, products, onRefresh }: CatalogTabProps) {
  const toast = useToast();

  // Selection state
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');

  // Modal state
  const [modalType, setModalType] = useState<ModalType>(null);
  const [editingCategory, setEditingCategory] = useState<FurnitureCategory | null>(null);
  const [editingProduct, setEditingProduct] = useState<FurnitureProduct | null>(null);
  const [deletingCategoryId, setDeletingCategoryId] = useState<string>('');
  const [deletingProductId, setDeletingProductId] = useState<string>('');
  const [loading, setLoading] = useState(false);

  // Form state - Category
  const [categoryForm, setCategoryForm] = useState<CreateCategoryInput>({
    name: '',
    description: '',
    icon: 'ri-sofa-line',
    order: 0,
    isActive: true,
  });

  // Form state - Product
  const [productForm, setProductForm] = useState<CreateProductInput>({
    name: '',
    categoryId: '',
    price: 0,
    imageUrl: '',
    description: '',
    dimensions: '',
    order: 0,
    isActive: true,
  });

  // Image upload ref
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Filtered products based on selected category
  const filteredProducts = useMemo(() => {
    if (!selectedCategoryId) return products;
    return products.filter((p) => p.categoryId === selectedCategoryId);
  }, [products, selectedCategoryId]);

  // Get product count per category
  const getCategoryProductCount = useCallback(
    (categoryId: string) => {
      return products.filter((p) => p.categoryId === categoryId).length;
    },
    [products]
  );

  // ========== MODAL HANDLERS ==========
  const openCategoryModal = useCallback((category?: FurnitureCategory) => {
    setModalType('category');
    setEditingCategory(category || null);
    setCategoryForm({
      name: category?.name || '',
      description: category?.description || '',
      icon: category?.icon || 'ri-sofa-line',
      order: category?.order || 0,
      isActive: category?.isActive ?? true,
    });
  }, []);

  const openProductModal = useCallback(
    (product?: FurnitureProduct) => {
      setModalType('product');
      setEditingProduct(product || null);
      setProductForm({
        name: product?.name || '',
        categoryId: product?.categoryId || selectedCategoryId || '',
        price: product?.price || 0,
        imageUrl: product?.imageUrl || '',
        description: product?.description || '',
        dimensions: product?.dimensions || '',
        order: product?.order || 0,
        isActive: product?.isActive ?? true,
      });
    },
    [selectedCategoryId]
  );

  const openDeleteCategoryModal = useCallback((categoryId: string) => {
    setDeletingCategoryId(categoryId);
    setModalType('deleteCategory');
  }, []);

  const openDeleteProductModal = useCallback((productId: string) => {
    setDeletingProductId(productId);
    setModalType('deleteProduct');
  }, []);

  const closeModal = useCallback(() => {
    setModalType(null);
    setEditingCategory(null);
    setEditingProduct(null);
    setDeletingCategoryId('');
    setDeletingProductId('');
  }, []);


  // ========== CATEGORY CRUD HANDLERS ==========
  const handleSaveCategory = async () => {
    if (!categoryForm.name.trim()) {
      toast.error('Vui lòng nhập tên danh mục');
      return;
    }
    setLoading(true);
    try {
      if (editingCategory) {
        await furnitureCategoriesApi.update(editingCategory.id, categoryForm as UpdateCategoryInput);
        toast.success('Cập nhật danh mục thành công');
      } else {
        await furnitureCategoriesApi.create(categoryForm);
        toast.success('Thêm danh mục thành công');
      }
      onRefresh();
      closeModal();
    } catch (error) {
      toast.error('Lỗi: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCategory = async () => {
    if (!deletingCategoryId) return;
    setLoading(true);
    try {
      await furnitureCategoriesApi.delete(deletingCategoryId);
      toast.success('Đã xóa danh mục');
      if (selectedCategoryId === deletingCategoryId) {
        setSelectedCategoryId('');
      }
      onRefresh();
      closeModal();
    } catch (error) {
      toast.error('Lỗi: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  // ========== PRODUCT CRUD HANDLERS ==========
  const handleSaveProduct = async () => {
    if (!productForm.name.trim()) {
      toast.error('Vui lòng nhập tên sản phẩm');
      return;
    }
    if (!productForm.categoryId) {
      toast.error('Vui lòng chọn danh mục');
      return;
    }
    if (productForm.price <= 0) {
      toast.error('Giá sản phẩm phải lớn hơn 0');
      return;
    }
    setLoading(true);
    try {
      if (editingProduct) {
        await furnitureProductsApi.update(editingProduct.id, productForm as UpdateProductInput);
        toast.success('Cập nhật sản phẩm thành công');
      } else {
        await furnitureProductsApi.create(productForm);
        toast.success('Thêm sản phẩm thành công');
      }
      onRefresh();
      closeModal();
    } catch (error) {
      toast.error('Lỗi: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProduct = async () => {
    if (!deletingProductId) return;
    setLoading(true);
    try {
      await furnitureProductsApi.delete(deletingProductId);
      toast.success('Đã xóa sản phẩm');
      onRefresh();
      closeModal();
    } catch (error) {
      toast.error('Lỗi: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  // ========== IMAGE UPLOAD HANDLER ==========
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const result = await mediaApi.uploadFile(file);
      setProductForm((prev) => ({ ...prev, imageUrl: result.url }));
      toast.success('Tải ảnh lên thành công');
    } catch (error) {
      toast.error('Lỗi tải ảnh: ' + (error as Error).message);
    } finally {
      setUploadingImage(false);
      // Reset input
      if (imageInputRef.current) {
        imageInputRef.current.value = '';
      }
    }
  };

  // ========== FORMAT PRICE ==========
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price);
  };


  // ========== RENDER ==========
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
          Catalog Sản phẩm
        </h3>
        <Button onClick={onRefresh} disabled={loading}>
          <i className="ri-refresh-line" /> Làm mới
        </Button>
      </div>

      {/* Two-column layout */}
      <ResponsiveGrid cols={{ mobile: 1, tablet: 2, desktop: 2 }} gap={24}>
        {/* Left column: Categories list */}
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
            <Button variant="outline" size="small" onClick={() => openCategoryModal()}>
              <i className="ri-add-line" /> Thêm
            </Button>
          </div>

          {/* Categories list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {/* All categories option */}
            <motion.div
              whileHover={{ scale: 1.01 }}
              onClick={() => setSelectedCategoryId('')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 16px',
                borderRadius: 12,
                background: !selectedCategoryId
                  ? `linear-gradient(135deg, ${tokens.color.primary}20, ${tokens.color.accent}10)`
                  : 'transparent',
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
                {products.length}
              </span>
            </motion.div>

            {/* Category items */}
            {categories.map((category) => (
              <motion.div
                key={category.id}
                whileHover={{ scale: 1.01 }}
                onClick={() => setSelectedCategoryId(category.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 16px',
                  borderRadius: 12,
                  background:
                    selectedCategoryId === category.id
                      ? `linear-gradient(135deg, ${tokens.color.primary}20, ${tokens.color.accent}10)`
                      : 'transparent',
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
                      background: `linear-gradient(135deg, ${tokens.color.primary}, ${tokens.color.accent})`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#0b0c0f',
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
                      openCategoryModal(category);
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
                      openDeleteCategoryModal(category.id);
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


        {/* Right column: Products grid */}
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
              Sản phẩm ({filteredProducts.length})
            </h4>
            <Button
              variant="outline"
              size="small"
              onClick={() => openProductModal()}
              disabled={categories.length === 0}
            >
              <i className="ri-add-line" /> Thêm
            </Button>
          </div>

          {/* Products grid */}
          {filteredProducts.length > 0 ? (
            <ResponsiveGrid cols={{ mobile: 1, tablet: 1, desktop: 2 }} gap={16}>
              {filteredProducts.map((product) => (
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
                        onClick={() => openProductModal(product)}
                        style={{ flex: 1 }}
                      >
                        <i className="ri-edit-line" /> Sửa
                      </Button>
                      <Button
                        variant="ghost"
                        size="small"
                        onClick={() => openDeleteProductModal(product.id)}
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
              {categories.length === 0
                ? 'Vui lòng tạo danh mục trước'
                : selectedCategoryId
                ? 'Không có sản phẩm trong danh mục này'
                : 'Chưa có sản phẩm nào'}
            </div>
          )}
        </Card>
      </ResponsiveGrid>


      {/* Category Form Modal */}
      <ResponsiveModal
        isOpen={modalType === 'category'}
        onClose={closeModal}
        title={editingCategory ? 'Sửa danh mục' : 'Thêm danh mục'}
        size="md"
        footer={
          <>
            <Button variant="outline" onClick={closeModal} disabled={loading}>
              Hủy
            </Button>
            <Button onClick={handleSaveCategory} loading={loading}>
              {editingCategory ? 'Cập nhật' : 'Thêm'}
            </Button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Input
            label="Tên danh mục"
            value={categoryForm.name}
            onChange={(val) => setCategoryForm((prev) => ({ ...prev, name: val }))}
            placeholder="VD: Phòng khách"
            required
            fullWidth
          />

          <TextArea
            label="Mô tả"
            value={categoryForm.description || ''}
            onChange={(val) => setCategoryForm((prev) => ({ ...prev, description: val }))}
            placeholder="Mô tả ngắn về danh mục..."
            rows={3}
            fullWidth
          />

          <div>
            <label
              style={{
                display: 'block',
                color: tokens.color.text,
                fontSize: 14,
                fontWeight: 500,
                marginBottom: 8,
              }}
            >
              Icon
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {ICON_OPTIONS.map((icon) => (
                <motion.button
                  key={icon.value}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setCategoryForm((prev) => ({ ...prev, icon: icon.value }))}
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 10,
                    border: `2px solid ${
                      categoryForm.icon === icon.value ? tokens.color.primary : tokens.color.border
                    }`,
                    background:
                      categoryForm.icon === icon.value
                        ? `linear-gradient(135deg, ${tokens.color.primary}20, ${tokens.color.accent}10)`
                        : 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    color:
                      categoryForm.icon === icon.value ? tokens.color.primary : tokens.color.muted,
                    transition: 'all 0.2s',
                  }}
                  title={icon.label}
                >
                  <i className={icon.value} style={{ fontSize: 20 }} />
                </motion.button>
              ))}
            </div>
          </div>

          <Input
            label="Thứ tự hiển thị"
            type="number"
            value={categoryForm.order || 0}
            onChange={(val) => setCategoryForm((prev) => ({ ...prev, order: parseInt(val) || 0 }))}
            placeholder="0"
            fullWidth
          />

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <input
              type="checkbox"
              id="category-active"
              checked={categoryForm.isActive}
              onChange={(e) => setCategoryForm((prev) => ({ ...prev, isActive: e.target.checked }))}
              style={{ width: 18, height: 18, cursor: 'pointer' }}
            />
            <label
              htmlFor="category-active"
              style={{ color: tokens.color.text, cursor: 'pointer' }}
            >
              Hiển thị danh mục
            </label>
          </div>
        </div>
      </ResponsiveModal>


      {/* Product Form Modal */}
      <ResponsiveModal
        isOpen={modalType === 'product'}
        onClose={closeModal}
        title={editingProduct ? 'Sửa sản phẩm' : 'Thêm sản phẩm'}
        size="lg"
        footer={
          <>
            <Button variant="outline" onClick={closeModal} disabled={loading}>
              Hủy
            </Button>
            <Button onClick={handleSaveProduct} loading={loading}>
              {editingProduct ? 'Cập nhật' : 'Thêm'}
            </Button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Input
            label="Tên sản phẩm"
            value={productForm.name}
            onChange={(val) => setProductForm((prev) => ({ ...prev, name: val }))}
            placeholder="VD: Sofa góc L"
            required
            fullWidth
          />

          <Select
            label="Danh mục"
            value={productForm.categoryId}
            onChange={(val) => setProductForm((prev) => ({ ...prev, categoryId: val }))}
            options={[
              { value: '', label: '-- Chọn danh mục --' },
              ...categories.map((c) => ({ value: c.id, label: c.name })),
            ]}
          />

          <Input
            label="Giá (VNĐ)"
            type="number"
            value={productForm.price}
            onChange={(val) => setProductForm((prev) => ({ ...prev, price: parseFloat(val) || 0 }))}
            placeholder="0"
            required
            fullWidth
          />

          {/* Image upload */}
          <div>
            <label
              style={{
                display: 'block',
                color: tokens.color.text,
                fontSize: 14,
                fontWeight: 500,
                marginBottom: 8,
              }}
            >
              Hình ảnh
            </label>
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              {/* Preview */}
              <div
                style={{
                  width: 120,
                  height: 120,
                  borderRadius: 12,
                  border: `1px dashed ${tokens.color.border}`,
                  background: productForm.imageUrl
                    ? `url(${productForm.imageUrl}) center/cover`
                    : tokens.color.surfaceHover,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                {!productForm.imageUrl && (
                  <i className="ri-image-add-line" style={{ fontSize: 32, color: tokens.color.muted }} />
                )}
              </div>

              <div style={{ flex: 1 }}>
                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  style={{ display: 'none' }}
                />
                <Button
                  variant="outline"
                  size="small"
                  onClick={() => imageInputRef.current?.click()}
                  loading={uploadingImage}
                  style={{ marginBottom: 8 }}
                >
                  <i className="ri-upload-2-line" /> Tải ảnh lên
                </Button>
                {productForm.imageUrl && (
                  <Button
                    variant="ghost"
                    size="small"
                    onClick={() => setProductForm((prev) => ({ ...prev, imageUrl: '' }))}
                    style={{ color: tokens.color.error, marginLeft: 8 }}
                  >
                    <i className="ri-delete-bin-line" /> Xóa
                  </Button>
                )}
                <p style={{ fontSize: 12, color: tokens.color.muted, margin: '8px 0 0' }}>
                  Hỗ trợ: JPG, PNG, WebP. Tối đa 5MB.
                </p>
              </div>
            </div>
          </div>

          <TextArea
            label="Mô tả"
            value={productForm.description || ''}
            onChange={(val) => setProductForm((prev) => ({ ...prev, description: val }))}
            placeholder="Mô tả chi tiết sản phẩm..."
            rows={3}
            fullWidth
          />

          <Input
            label="Kích thước"
            value={productForm.dimensions || ''}
            onChange={(val) => setProductForm((prev) => ({ ...prev, dimensions: val }))}
            placeholder="VD: 200x90x85 cm"
            fullWidth
          />

          <Input
            label="Thứ tự hiển thị"
            type="number"
            value={productForm.order || 0}
            onChange={(val) => setProductForm((prev) => ({ ...prev, order: parseInt(val) || 0 }))}
            placeholder="0"
            fullWidth
          />

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <input
              type="checkbox"
              id="product-active"
              checked={productForm.isActive}
              onChange={(e) => setProductForm((prev) => ({ ...prev, isActive: e.target.checked }))}
              style={{ width: 18, height: 18, cursor: 'pointer' }}
            />
            <label
              htmlFor="product-active"
              style={{ color: tokens.color.text, cursor: 'pointer' }}
            >
              Hiển thị sản phẩm
            </label>
          </div>
        </div>
      </ResponsiveModal>


      {/* Delete Category Confirmation Modal */}
      <ResponsiveModal
        isOpen={modalType === 'deleteCategory'}
        onClose={closeModal}
        title="Xác nhận xóa danh mục"
        size="sm"
        footer={
          <>
            <Button variant="outline" onClick={closeModal} disabled={loading}>
              Hủy
            </Button>
            <Button variant="danger" onClick={handleDeleteCategory} loading={loading}>
              Xóa
            </Button>
          </>
        }
      >
        <div style={{ textAlign: 'center', padding: '16px 0' }}>
          <i
            className="ri-error-warning-line"
            style={{ fontSize: 48, color: tokens.color.warning, marginBottom: 16, display: 'block' }}
          />
          <p style={{ color: tokens.color.text, marginBottom: 8 }}>
            Bạn có chắc muốn xóa danh mục này?
          </p>
          <p style={{ color: tokens.color.muted, fontSize: 13 }}>
            Lưu ý: Không thể xóa danh mục nếu còn sản phẩm bên trong.
          </p>
        </div>
      </ResponsiveModal>

      {/* Delete Product Confirmation Modal */}
      <ResponsiveModal
        isOpen={modalType === 'deleteProduct'}
        onClose={closeModal}
        title="Xác nhận xóa sản phẩm"
        size="sm"
        footer={
          <>
            <Button variant="outline" onClick={closeModal} disabled={loading}>
              Hủy
            </Button>
            <Button variant="danger" onClick={handleDeleteProduct} loading={loading}>
              Xóa
            </Button>
          </>
        }
      >
        <div style={{ textAlign: 'center', padding: '16px 0' }}>
          <i
            className="ri-error-warning-line"
            style={{ fontSize: 48, color: tokens.color.warning, marginBottom: 16, display: 'block' }}
          />
          <p style={{ color: tokens.color.text }}>
            Bạn có chắc muốn xóa sản phẩm này?
          </p>
          <p style={{ color: tokens.color.muted, fontSize: 13, marginTop: 8 }}>
            Hành động này không thể hoàn tác.
          </p>
        </div>
      </ResponsiveModal>
    </div>
  );
}

export default CatalogTab;
