/**
 * CatalogTab - Furniture Product Catalog Management
 *
 * Feature: furniture-quotation
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7
 */

import { useState, useCallback, useMemo, useRef } from 'react';
import { tokens } from '@app/shared';
import { ResponsiveGrid, ResponsiveModal } from '../../../components/responsive';
import { Button } from '../../components/Button';
import { useToast } from '../../components/Toast';
import {
  furnitureCategoriesApi,
  furnitureProductsApi,
} from '../../api/furniture';
import { mediaApi } from '../../api/content';
import {
  CategoryList,
  ProductGrid,
  CategoryForm,
  ProductForm,
} from './components';
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
      if (imageInputRef.current) {
        imageInputRef.current.value = '';
      }
    }
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
        <CategoryList
          categories={categories}
          selectedCategoryId={selectedCategoryId}
          totalProducts={products.length}
          onSelectCategory={setSelectedCategoryId}
          onAddCategory={() => openCategoryModal()}
          onEditCategory={openCategoryModal}
          onDeleteCategory={openDeleteCategoryModal}
          getCategoryProductCount={getCategoryProductCount}
        />

        {/* Right column: Products grid */}
        <ProductGrid
          products={filteredProducts}
          categories={categories}
          selectedCategoryId={selectedCategoryId}
          onAddProduct={() => openProductModal()}
          onEditProduct={openProductModal}
          onDeleteProduct={openDeleteProductModal}
          disabled={categories.length === 0}
        />
      </ResponsiveGrid>

      {/* Category Form Modal */}
      <CategoryForm
        isOpen={modalType === 'category'}
        editingCategory={editingCategory}
        formData={categoryForm}
        loading={loading}
        onClose={closeModal}
        onSave={handleSaveCategory}
        onFormChange={setCategoryForm}
      />

      {/* Product Form Modal */}
      <ProductForm
        isOpen={modalType === 'product'}
        editingProduct={editingProduct}
        formData={productForm}
        categories={categories}
        loading={loading}
        uploadingImage={uploadingImage}
        onClose={closeModal}
        onSave={handleSaveProduct}
        onFormChange={setProductForm}
        onImageUpload={handleImageUpload}
      />

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
