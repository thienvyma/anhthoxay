/**
 * CatalogTab - Furniture Product Catalog Management
 *
 * Feature: furniture-quotation, furniture-product-restructure
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 3.1
 */

import { useState, useCallback, useMemo, useRef } from 'react';
import { tokens } from '../../../theme';
import { ResponsiveModal } from '../../../components/responsive';
import { Button } from '../../components/Button';
import { Input, TextArea } from '../../components/Input';
import { useToast } from '../../components/Toast';
import {
  furnitureCategoriesApi,
  furnitureProductBasesApi,
  furnitureMaterialsApi,
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
  FurnitureMaterial,
  CreateCategoryInput,
  UpdateCategoryInput,
  ProductBaseWithDetails,
  CreateProductBaseInput,
} from './types';

// ========== MODAL TYPES ==========
type ModalType = 'category' | 'product' | 'deleteCategory' | 'deleteProduct' | 'material' | 'deleteMaterial' | null;

// ========== COMPONENT ==========
export function CatalogTab({ categories, productBases, materials, onRefresh }: CatalogTabProps) {
  const toast = useToast();

  // Selection state
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [selectedMaterialId, setSelectedMaterialId] = useState<string>('');

  // Modal state
  const [modalType, setModalType] = useState<ModalType>(null);
  const [editingCategory, setEditingCategory] = useState<FurnitureCategory | null>(null);
  const [editingProductBase, setEditingProductBase] = useState<ProductBaseWithDetails | null>(null);
  const [editingMaterial, setEditingMaterial] = useState<FurnitureMaterial | null>(null);
  const [deletingCategoryId, setDeletingCategoryId] = useState<string>('');
  const [deletingProductBaseId, setDeletingProductBaseId] = useState<string>('');
  const [deletingMaterialId, setDeletingMaterialId] = useState<string>('');
  const [loading, setLoading] = useState(false);

  // Form state - Category
  const [categoryForm, setCategoryForm] = useState<CreateCategoryInput>({
    name: '',
    description: '',
    icon: 'ri-sofa-line',
    order: 0,
    isActive: true,
  });

  // Form state - Product Base
  const [productBaseForm, setProductBaseForm] = useState<CreateProductBaseInput>({
    name: '',
    categoryId: '',
    description: null,
    imageUrl: null,
    allowFitIn: false,
    order: 0,
    isActive: true,
    variants: [],
    mappings: [],
  });

  // Form state - Material
  const [materialForm, setMaterialForm] = useState<{ name: string; description: string; order: number; isActive: boolean }>({
    name: '',
    description: '',
    order: 0,
    isActive: true,
  });

  // Image upload ref
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Filtered product bases based on selected category and material
  const filteredProductBases = useMemo(() => {
    let filtered = productBases;
    if (selectedCategoryId) {
      filtered = filtered.filter((p) => p.categoryId === selectedCategoryId);
    }
    if (selectedMaterialId) {
      filtered = filtered.filter((p) => 
        p.variants.some((v) => v.materialId === selectedMaterialId)
      );
    }
    return filtered;
  }, [productBases, selectedCategoryId, selectedMaterialId]);

  // Get product count per category
  const getCategoryProductCount = useCallback(
    (categoryId: string) => {
      return productBases.filter((p) => p.categoryId === categoryId).length;
    },
    [productBases]
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
    (productBase?: ProductBaseWithDetails) => {
      setModalType('product');
      setEditingProductBase(productBase || null);
      setProductBaseForm({
        name: productBase?.name || '',
        categoryId: productBase?.categoryId || selectedCategoryId || '',
        description: productBase?.description || null,
        imageUrl: productBase?.imageUrl || null,
        allowFitIn: productBase?.allowFitIn || false,
        order: productBase?.order || 0,
        isActive: productBase?.isActive ?? true,
        variants: productBase?.variants.map((v) => ({
          materialId: v.materialId,
          pricePerUnit: v.pricePerUnit,
          pricingType: v.pricingType,
          length: v.length,
          width: v.width,
          imageUrl: v.imageUrl,
          order: v.order,
          isActive: v.isActive,
        })) || [],
        mappings: productBase?.mappings.map((m) => ({
          projectName: m.projectName,
          buildingCode: m.buildingCode,
          apartmentType: m.apartmentType,
        })) || [],
      });
    },
    [selectedCategoryId]
  );

  const openDeleteCategoryModal = useCallback((categoryId: string) => {
    setDeletingCategoryId(categoryId);
    setModalType('deleteCategory');
  }, []);

  const openDeleteProductModal = useCallback((productBaseId: string) => {
    setDeletingProductBaseId(productBaseId);
    setModalType('deleteProduct');
  }, []);

  // ========== MATERIAL MODAL HANDLERS ==========
  const openMaterialModal = useCallback((material?: FurnitureMaterial) => {
    setModalType('material');
    setEditingMaterial(material || null);
    setMaterialForm({
      name: material?.name || '',
      description: material?.description || '',
      order: material?.order || 0,
      isActive: material?.isActive ?? true,
    });
  }, []);

  const openDeleteMaterialModal = useCallback((materialId: string) => {
    setDeletingMaterialId(materialId);
    setModalType('deleteMaterial');
  }, []);

  const closeModal = useCallback(() => {
    setModalType(null);
    setEditingCategory(null);
    setEditingProductBase(null);
    setEditingMaterial(null);
    setDeletingCategoryId('');
    setDeletingProductBaseId('');
    setDeletingMaterialId('');
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

  // ========== PRODUCT BASE CRUD HANDLERS ==========
  const handleSaveProductBase = async () => {
    if (!productBaseForm.name.trim()) {
      toast.error('Vui lòng nhập tên sản phẩm');
      return;
    }
    if (!productBaseForm.categoryId) {
      toast.error('Vui lòng chọn danh mục');
      return;
    }
    if (productBaseForm.variants.length === 0) {
      toast.error('Vui lòng thêm ít nhất một biến thể');
      return;
    }
    setLoading(true);
    try {
      if (editingProductBase) {
        await furnitureProductBasesApi.update(editingProductBase.id, {
          name: productBaseForm.name,
          categoryId: productBaseForm.categoryId,
          description: productBaseForm.description,
          imageUrl: productBaseForm.imageUrl,
          allowFitIn: productBaseForm.allowFitIn,
          order: productBaseForm.order,
          isActive: productBaseForm.isActive,
        });
        toast.success('Cập nhật sản phẩm thành công');
      } else {
        await furnitureProductBasesApi.create(productBaseForm);
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

  const handleDeleteProductBase = async () => {
    if (!deletingProductBaseId) return;
    setLoading(true);
    try {
      await furnitureProductBasesApi.delete(deletingProductBaseId);
      toast.success('Đã xóa sản phẩm');
      onRefresh();
      closeModal();
    } catch (error) {
      toast.error('Lỗi: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  // ========== MATERIAL CRUD HANDLERS ==========
  const handleSaveMaterial = async () => {
    if (!materialForm.name.trim()) {
      toast.error('Vui lòng nhập tên chất liệu');
      return;
    }
    setLoading(true);
    try {
      if (editingMaterial) {
        await furnitureMaterialsApi.update(editingMaterial.id, materialForm);
        toast.success('Cập nhật chất liệu thành công');
      } else {
        await furnitureMaterialsApi.create(materialForm);
        toast.success('Thêm chất liệu thành công');
      }
      onRefresh();
      closeModal();
    } catch (error) {
      toast.error('Lỗi: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMaterial = async () => {
    if (!deletingMaterialId) return;
    setLoading(true);
    try {
      await furnitureMaterialsApi.delete(deletingMaterialId);
      toast.success('Đã xóa chất liệu');
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
      const result = await mediaApi.uploadFile(file, 'products');
      setProductBaseForm((prev) => ({ ...prev, imageUrl: result.url }));
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

      {/* Two-column layout with custom ratio */}
      <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
        {/* Left column: Categories + Materials (35%) */}
        <div style={{ flex: '0 0 320px', minWidth: 280, maxWidth: 380 }}>
          <CategoryList
            categories={categories}
            selectedCategoryId={selectedCategoryId}
            totalProducts={productBases.length}
            onSelectCategory={setSelectedCategoryId}
            onAddCategory={() => openCategoryModal()}
            onEditCategory={openCategoryModal}
            onDeleteCategory={openDeleteCategoryModal}
            getCategoryProductCount={getCategoryProductCount}
          />

          {/* Materials Section - Gộp vào cột danh mục */}
          <div style={{ marginTop: 24 }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 12,
              }}
            >
              <h4 style={{ color: tokens.color.text, margin: 0, fontSize: 16, fontWeight: 600 }}>
                <i className="ri-palette-line" style={{ marginRight: 8, color: tokens.color.primary }} />
                Chất liệu ({materials.length})
              </h4>
              <Button onClick={() => openMaterialModal()} size="small" variant="outline">
                <i className="ri-add-line" />
              </Button>
            </div>

            {/* Material Filter Dropdown */}
            <div style={{ marginBottom: 12 }}>
              <select
                value={selectedMaterialId}
                onChange={(e) => setSelectedMaterialId(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: 8,
                  border: `1px solid ${tokens.color.border}`,
                  background: tokens.color.surface,
                  color: tokens.color.text,
                  fontSize: 14,
                  cursor: 'pointer',
                }}
              >
                <option value="">Tất cả chất liệu</option>
                {materials.filter((m) => m.isActive).map((material) => (
                  <option key={material.id} value={material.id}>
                    {material.name}
                  </option>
                ))}
              </select>
            </div>

            <div
              style={{
                background: tokens.color.surface,
                borderRadius: 12,
                border: `1px solid ${tokens.color.border}`,
                overflow: 'hidden',
              }}
            >
              {materials.length === 0 ? (
                <div style={{ padding: 24, textAlign: 'center' }}>
                  <i className="ri-palette-line" style={{ fontSize: 32, color: tokens.color.muted, marginBottom: 8, display: 'block' }} />
                  <p style={{ color: tokens.color.muted, margin: 0, fontSize: 13 }}>Chưa có chất liệu</p>
                  <Button onClick={() => openMaterialModal()} variant="ghost" size="small" style={{ marginTop: 8 }}>
                    <i className="ri-add-line" /> Thêm mới
                  </Button>
                </div>
              ) : (
                <div style={{ maxHeight: 300, overflowY: 'auto' }}>
                  {materials.map((material) => (
                    <div
                      key={material.id}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '10px 12px',
                        borderBottom: `1px solid ${tokens.color.border}`,
                        background: selectedMaterialId === material.id ? `${tokens.color.primary}10` : 'transparent',
                      }}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ color: tokens.color.text, fontSize: 14, fontWeight: 500 }}>{material.name}</span>
                          {!material.isActive && (
                            <span style={{ padding: '2px 6px', borderRadius: 4, background: `${tokens.color.error}20`, color: tokens.color.error, fontSize: 10 }}>Ẩn</span>
                          )}
                        </div>
                        {material.description && (
                          <p style={{ color: tokens.color.muted, fontSize: 12, margin: '2px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{material.description}</p>
                        )}
                      </div>
                      <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                        <Button variant="ghost" size="small" onClick={() => openMaterialModal(material)} style={{ padding: '4px 6px' }}>
                          <i className="ri-edit-line" style={{ fontSize: 14 }} />
                        </Button>
                        <Button variant="ghost" size="small" onClick={() => openDeleteMaterialModal(material.id)} style={{ padding: '4px 6px', color: tokens.color.error }}>
                          <i className="ri-delete-bin-line" style={{ fontSize: 14 }} />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right column: Products grid (65%) */}
        <div style={{ flex: 1, minWidth: 400 }}>
          <ProductGrid
            productBases={filteredProductBases}
            categories={categories}
            materials={materials}
            selectedCategoryId={selectedCategoryId}
            onAddProduct={() => openProductModal()}
            onEditProduct={openProductModal}
            onDeleteProduct={openDeleteProductModal}
            disabled={categories.length === 0}
          />
        </div>
      </div>

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
        editingProductBase={editingProductBase}
        formData={productBaseForm}
        categories={categories}
        materials={materials}
        loading={loading}
        uploadingImage={uploadingImage}
        onClose={closeModal}
        onSave={handleSaveProductBase}
        onFormChange={setProductBaseForm}
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
            <Button variant="danger" onClick={handleDeleteProductBase} loading={loading}>
              Xóa
            </Button>
          </>
        }
      >
        {(() => {
          const deletingProduct = productBases.find((p) => p.id === deletingProductBaseId);
          const variantCount = deletingProduct?.variantCount || 0;
          const mappingCount = deletingProduct?.mappings?.length || 0;
          return (
            <div style={{ textAlign: 'center', padding: '16px 0' }}>
              <i
                className="ri-error-warning-line"
                style={{ fontSize: 48, color: tokens.color.warning, marginBottom: 16, display: 'block' }}
              />
              <p style={{ color: tokens.color.text, marginBottom: 8 }}>
                Bạn có chắc muốn xóa sản phẩm <strong>{deletingProduct?.name || ''}</strong>?
              </p>
              {(variantCount > 0 || mappingCount > 0) && (
                <div
                  style={{
                    background: `${tokens.color.warning}15`,
                    border: `1px solid ${tokens.color.warning}40`,
                    borderRadius: 8,
                    padding: 12,
                    marginTop: 12,
                    textAlign: 'left',
                  }}
                >
                  <p style={{ color: tokens.color.warning, fontSize: 13, fontWeight: 600, margin: '0 0 8px' }}>
                    <i className="ri-alert-line" style={{ marginRight: 6 }} />
                    Cảnh báo: Xóa sản phẩm sẽ đồng thời xóa:
                  </p>
                  <ul style={{ color: tokens.color.text, fontSize: 13, margin: 0, paddingLeft: 20 }}>
                    {variantCount > 0 && <li>{variantCount} biến thể chất liệu</li>}
                    {mappingCount > 0 && <li>{mappingCount} ánh xạ căn hộ</li>}
                  </ul>
                </div>
              )}
              <p style={{ color: tokens.color.muted, fontSize: 13, marginTop: 12 }}>
                Hành động này không thể hoàn tác.
              </p>
            </div>
          );
        })()}
      </ResponsiveModal>

      {/* Material Form Modal */}
      <ResponsiveModal
        isOpen={modalType === 'material'}
        onClose={closeModal}
        title={editingMaterial ? 'Chỉnh sửa chất liệu' : 'Thêm chất liệu mới'}
        size="sm"
        footer={
          <>
            <Button variant="outline" onClick={closeModal} disabled={loading}>
              Hủy
            </Button>
            <Button onClick={handleSaveMaterial} loading={loading}>
              {editingMaterial ? 'Cập nhật' : 'Thêm mới'}
            </Button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Input
            label="Tên chất liệu *"
            value={materialForm.name}
            onChange={(val) => setMaterialForm((prev) => ({ ...prev, name: val }))}
            placeholder="VD: Gỗ sồi, MDF, Da thật"
            fullWidth
          />
          <TextArea
            label="Mô tả"
            value={materialForm.description}
            onChange={(val) => setMaterialForm((prev) => ({ ...prev, description: val }))}
            placeholder="Mô tả chi tiết về chất liệu..."
            rows={3}
            fullWidth
          />
          <Input
            label="Thứ tự hiển thị"
            type="number"
            value={materialForm.order}
            onChange={(val) => setMaterialForm((prev) => ({ ...prev, order: parseInt(val) || 0 }))}
            placeholder="0"
            fullWidth
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <input
              type="checkbox"
              id="material-active"
              checked={materialForm.isActive}
              onChange={(e) => setMaterialForm((prev) => ({ ...prev, isActive: e.target.checked }))}
              style={{ width: 18, height: 18, cursor: 'pointer' }}
            />
            <label htmlFor="material-active" style={{ color: tokens.color.text, cursor: 'pointer' }}>
              Hiển thị chất liệu
            </label>
          </div>
        </div>
      </ResponsiveModal>

      {/* Delete Material Confirmation Modal */}
      <ResponsiveModal
        isOpen={modalType === 'deleteMaterial'}
        onClose={closeModal}
        title="Xác nhận xóa chất liệu"
        size="sm"
        footer={
          <>
            <Button variant="outline" onClick={closeModal} disabled={loading}>
              Hủy
            </Button>
            <Button variant="danger" onClick={handleDeleteMaterial} loading={loading}>
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
            Bạn có chắc muốn xóa chất liệu này?
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
