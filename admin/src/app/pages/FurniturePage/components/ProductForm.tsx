/**
 * ProductForm - Product form modal component for CatalogTab
 *
 * Feature: furniture-product-mapping, furniture-product-restructure
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 6.1, 3.2, 3.3, 4.2, 4.3, 4.4, 4.5, 4.7
 */

import { useRef, useState, useEffect, useCallback } from 'react';
import { resolveMediaUrl } from '@app/shared';
import { tokens } from '../../../../theme';
import { ResponsiveModal } from '../../../../components/responsive';
import { Button } from '../../../components/Button';
import { Input, TextArea } from '../../../components/Input';
import { Select } from '../../../components/Select';
import { furnitureProductBasesApi } from '../../../api/furniture';
import { AddMappingModal } from './AddMappingModal';
import { VariantForm } from './VariantForm';
import type {
  FurnitureCategory,
  FurnitureMaterial,
  ProductBaseWithDetails,
  ProductBaseMapping,
  CreateProductBaseInput,
  CreateVariantInput,
  ProductMappingInput,
} from '../types';

export interface ProductFormProps {
  isOpen: boolean;
  editingProductBase: ProductBaseWithDetails | null;
  formData: CreateProductBaseInput;
  categories: FurnitureCategory[];
  materials?: FurnitureMaterial[];
  loading: boolean;
  uploadingImage: boolean;
  onClose: () => void;
  onSave: () => void;
  onFormChange: (data: CreateProductBaseInput) => void;
  onImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

function calculateVariantPrice(
  pricePerUnit: number,
  pricingType: 'LINEAR' | 'M2',
  length: number,
  width: number | null | undefined
): number {
  if (pricingType === 'M2') {
    return pricePerUnit * length * (width || 0);
  }
  return pricePerUnit * length;
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat('vi-VN').format(price) + ' ₫';
}

export function ProductForm({
  isOpen,
  editingProductBase,
  formData,
  categories,
  materials = [],
  loading,
  uploadingImage,
  onClose,
  onSave,
  onFormChange,
  onImageUpload,
}: ProductFormProps) {
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [mappings, setMappings] = useState<ProductBaseMapping[]>([]);
  const [loadingMappings, setLoadingMappings] = useState(false);
  const [showAddMappingModal, setShowAddMappingModal] = useState(false);
  const [deletingMappingId, setDeletingMappingId] = useState<string | null>(null);

  // Variant form state
  const [showVariantForm, setShowVariantForm] = useState(false);
  const [editingVariantIndex, setEditingVariantIndex] = useState<number | null>(null);
  const [variantForm, setVariantForm] = useState<CreateVariantInput>({
    materialId: '',
    pricePerUnit: 0,
    pricingType: 'LINEAR',
    length: 0,
    width: null,
    imageUrl: null,
    order: 0,
    isActive: true,
  });

  const loadMappings = useCallback(() => {
    if (editingProductBase) {
      setLoadingMappings(true);
      furnitureProductBasesApi.getMappings(editingProductBase.id)
        .then((res) => setMappings(res.mappings || []))
        .catch(() => setMappings([]))
        .finally(() => setLoadingMappings(false));
    } else {
      setMappings([]);
    }
  }, [editingProductBase]);

  useEffect(() => {
    if (isOpen) {
      loadMappings();
    }
  }, [editingProductBase, isOpen, loadMappings]);

  const handleAddMapping = async (mapping: ProductMappingInput) => {
    if (!editingProductBase) {
      // For new products, add to form data
      onFormChange({
        ...formData,
        mappings: [...(formData.mappings || []), mapping],
      });
      setShowAddMappingModal(false);
      return;
    }
    try {
      await furnitureProductBasesApi.addMapping(editingProductBase.id, mapping);
      loadMappings();
      setShowAddMappingModal(false);
    } catch (error) {
      console.error('Failed to add mapping:', error);
      alert('Không thể thêm ánh xạ. Vui lòng thử lại.');
    }
  };

  const handleDeleteMapping = async (mappingId: string) => {
    if (!editingProductBase) {
      // For new products, remove from form data
      onFormChange({
        ...formData,
        mappings: (formData.mappings || []).filter((_, i) => i.toString() !== mappingId),
      });
      return;
    }
    if (!confirm('Bạn có chắc muốn xóa ánh xạ này?')) return;
    
    setDeletingMappingId(mappingId);
    try {
      await furnitureProductBasesApi.removeMapping(editingProductBase.id, mappingId);
      loadMappings();
    } catch (error) {
      console.error('Failed to delete mapping:', error);
      alert('Không thể xóa ánh xạ. Vui lòng thử lại.');
    } finally {
      setDeletingMappingId(null);
    }
  };

  // Variant handlers
  const openVariantForm = (index?: number) => {
    if (index !== undefined && formData.variants[index]) {
      setEditingVariantIndex(index);
      setVariantForm(formData.variants[index]);
    } else {
      setEditingVariantIndex(null);
      setVariantForm({
        materialId: '',
        pricePerUnit: 0,
        pricingType: 'LINEAR',
        length: 0,
        width: null,
        imageUrl: null,
        order: formData.variants.length,
        isActive: true,
      });
    }
    setShowVariantForm(true);
  };

  const handleSaveVariant = () => {
    if (!variantForm.materialId) {
      alert('Vui lòng chọn chất liệu');
      return;
    }
    if (variantForm.pricePerUnit <= 0) {
      alert('Giá phải lớn hơn 0');
      return;
    }
    if (variantForm.length <= 0) {
      alert('Chiều dài phải lớn hơn 0');
      return;
    }
    if (variantForm.pricingType === 'M2' && (!variantForm.width || variantForm.width <= 0)) {
      alert('Chiều rộng phải lớn hơn 0 cho loại M2');
      return;
    }

    // Check for duplicate material
    const existingIndex = formData.variants.findIndex(
      (v, i) => v.materialId === variantForm.materialId && i !== editingVariantIndex
    );
    if (existingIndex !== -1) {
      alert('Chất liệu này đã tồn tại trong sản phẩm');
      return;
    }

    const newVariants = [...formData.variants];
    if (editingVariantIndex !== null) {
      newVariants[editingVariantIndex] = variantForm;
    } else {
      newVariants.push(variantForm);
    }
    onFormChange({ ...formData, variants: newVariants });
    setShowVariantForm(false);
  };

  const handleDeleteVariant = (index: number) => {
    if (formData.variants.length <= 1) {
      alert('Sản phẩm phải có ít nhất một biến thể');
      return;
    }
    if (!confirm('Bạn có chắc muốn xóa biến thể này?')) return;
    const newVariants = formData.variants.filter((_, i) => i !== index);
    onFormChange({ ...formData, variants: newVariants });
  };

  const getMaterialName = (materialId: string) => {
    const material = materials.find((m) => m.id === materialId);
    return material?.name || 'N/A';
  };

  return (
    <ResponsiveModal
      isOpen={isOpen}
      onClose={onClose}
      title={editingProductBase ? 'Chỉnh sửa sản phẩm' : 'Thêm sản phẩm mới'}
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={loading}>Hủy</Button>
          <Button onClick={onSave} loading={loading}>{editingProductBase ? 'Cập nhật' : 'Thêm mới'}</Button>
        </>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Basic Info */}
        <Input 
          label="Tên sản phẩm *" 
          value={formData.name} 
          onChange={(val) => onFormChange({ ...formData, name: val })} 
          placeholder="VD: Tủ quần áo" 
          fullWidth 
        />
        <Select 
          label="Danh mục *" 
          value={formData.categoryId} 
          onChange={(val) => onFormChange({ ...formData, categoryId: val })} 
          options={categories.map((c) => ({ value: c.id, label: c.name }))} 
          placeholder="Chọn danh mục" 
          fullWidth 
        />

        {/* Image */}
        <div>
          <label style={{ display: 'block', marginBottom: 8, color: tokens.color.text, fontSize: 14 }}>Hình ảnh</label>
          <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
            <div style={{ 
              width: 120, 
              height: 120, 
              borderRadius: 12, 
              border: `1px dashed ${tokens.color.border}`, 
              background: formData.imageUrl ? `url(${resolveMediaUrl(formData.imageUrl)}) center/cover` : tokens.color.surfaceHover, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              flexShrink: 0 
            }}>
              {!formData.imageUrl && <i className="ri-image-add-line" style={{ fontSize: 32, color: tokens.color.muted }} />}
            </div>
            <div style={{ flex: 1 }}>
              <input ref={imageInputRef} type="file" accept="image/*" onChange={onImageUpload} style={{ display: 'none' }} />
              <Button variant="outline" size="small" onClick={() => imageInputRef.current?.click()} loading={uploadingImage} style={{ marginBottom: 8 }}>
                <i className="ri-upload-2-line" /> Tải ảnh lên
              </Button>
              {formData.imageUrl && (
                <Button variant="ghost" size="small" onClick={() => onFormChange({ ...formData, imageUrl: null })} style={{ color: tokens.color.error, marginLeft: 8 }}>
                  <i className="ri-delete-bin-line" /> Xóa
                </Button>
              )}
              <p style={{ fontSize: 12, color: tokens.color.muted, margin: '8px 0 0' }}>Hỗ trợ: JPG, PNG, WebP. Tối đa 5MB.</p>
            </div>
          </div>
        </div>

        <TextArea 
          label="Mô tả" 
          value={formData.description || ''} 
          onChange={(val) => onFormChange({ ...formData, description: val || null })} 
          placeholder="Mô tả chi tiết sản phẩm..." 
          rows={3} 
          fullWidth 
        />

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <input 
            type="checkbox" 
            id="allow-fit-in" 
            checked={formData.allowFitIn || false} 
            onChange={(e) => onFormChange({ ...formData, allowFitIn: e.target.checked })} 
            style={{ width: 18, height: 18, cursor: 'pointer' }} 
          />
          <label htmlFor="allow-fit-in" style={{ color: tokens.color.text, cursor: 'pointer' }}>Cho phép chọn Fit-in</label>
        </div>

        <Input 
          label="Thứ tự hiển thị" 
          type="number" 
          value={formData.order || 0} 
          onChange={(val) => onFormChange({ ...formData, order: parseInt(val) || 0 })} 
          placeholder="0" 
          fullWidth 
        />

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <input 
            type="checkbox" 
            id="product-active" 
            checked={formData.isActive ?? true} 
            onChange={(e) => onFormChange({ ...formData, isActive: e.target.checked })} 
            style={{ width: 18, height: 18, cursor: 'pointer' }} 
          />
          <label htmlFor="product-active" style={{ color: tokens.color.text, cursor: 'pointer' }}>Hiển thị sản phẩm</label>
        </div>

        {/* Variants Section */}
        <div style={{ marginTop: 16, padding: 16, background: tokens.color.surfaceHover, borderRadius: 12, border: `1px solid ${tokens.color.border}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <label style={{ color: tokens.color.text, fontSize: 14, fontWeight: 600 }}>
              <i className="ri-stack-line" style={{ marginRight: 8, color: tokens.color.primary }} />
              Biến thể chất liệu ({formData.variants.length}) *
            </label>
            <Button variant="outline" size="small" onClick={() => openVariantForm()}>
              <i className="ri-add-line" /> Thêm biến thể
            </Button>
          </div>
          
          {formData.variants.length === 0 ? (
            <p style={{ color: tokens.color.warning, fontSize: 13, margin: 0 }}>
              <i className="ri-information-line" style={{ marginRight: 4 }} />
              Vui lòng thêm ít nhất một biến thể chất liệu
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {formData.variants.map((variant, index) => (
                <div 
                  key={index} 
                  style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    padding: '10px 12px', 
                    background: tokens.color.surface, 
                    borderRadius: 8, 
                    border: `1px solid ${tokens.color.border}` 
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{ color: tokens.color.text, fontWeight: 500, fontSize: 14 }}>
                        {getMaterialName(variant.materialId)}
                      </span>
                      {!variant.isActive && (
                        <span style={{ padding: '2px 6px', borderRadius: 4, background: `${tokens.color.warning}20`, color: tokens.color.warning, fontSize: 10 }}>Ẩn</span>
                      )}
                    </div>
                    <div style={{ color: tokens.color.muted, fontSize: 12 }}>
                      {variant.pricingType === 'M2' 
                        ? `${formatPrice(variant.pricePerUnit)}/m² × ${variant.length}m × ${variant.width || 0}m`
                        : `${formatPrice(variant.pricePerUnit)}/m × ${variant.length}m`
                      }
                      <span style={{ color: tokens.color.primary, fontWeight: 600, marginLeft: 8 }}>
                        = {formatPrice(calculateVariantPrice(variant.pricePerUnit, variant.pricingType, variant.length, variant.width))}
                      </span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <Button variant="ghost" size="small" onClick={() => openVariantForm(index)} style={{ padding: '4px 8px' }}>
                      <i className="ri-edit-line" style={{ fontSize: 14 }} />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="small" 
                      onClick={() => handleDeleteVariant(index)} 
                      style={{ padding: '4px 8px', color: tokens.color.error }}
                      disabled={formData.variants.length <= 1}
                    >
                      <i className="ri-delete-bin-line" style={{ fontSize: 14 }} />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Mappings Section */}
        <div style={{ marginTop: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <label style={{ color: tokens.color.text, fontSize: 14, fontWeight: 500 }}>
              Ánh xạ căn hộ ({editingProductBase ? mappings.length : (formData.mappings?.length || 0)})
            </label>
            <Button variant="outline" size="small" onClick={() => setShowAddMappingModal(true)}>
              <i className="ri-add-line" /> Thêm ánh xạ
            </Button>
          </div>
          {loadingMappings ? (
            <p style={{ color: tokens.color.muted, fontSize: 13 }}>Đang tải...</p>
          ) : (editingProductBase ? mappings : formData.mappings || []).length === 0 ? (
            <p style={{ color: tokens.color.muted, fontSize: 13 }}>Chưa có ánh xạ nào</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {(editingProductBase ? mappings : (formData.mappings || []).map((m, i) => ({ ...m, id: i.toString() }))).map((m) => (
                <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: tokens.color.surfaceHover, borderRadius: 6, fontSize: 13 }}>
                  <span style={{ color: tokens.color.text }}>{m.projectName} / {m.buildingCode} / {m.apartmentType}</span>
                  <Button
                    variant="ghost"
                    size="small"
                    onClick={() => handleDeleteMapping(m.id)}
                    loading={deletingMappingId === m.id}
                    style={{ color: tokens.color.error, padding: '4px 8px' }}
                  >
                    <i className="ri-delete-bin-line" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Add Mapping Modal */}
        {showAddMappingModal && (
          <AddMappingModal
            isOpen={showAddMappingModal}
            onClose={() => setShowAddMappingModal(false)}
            onAdd={handleAddMapping}
          />
        )}

        {/* Variant Form Modal - Using extracted component */}
        <VariantForm
          isOpen={showVariantForm}
          isEditing={editingVariantIndex !== null}
          variantForm={variantForm}
          materials={materials}
          onClose={() => setShowVariantForm(false)}
          onSave={handleSaveVariant}
          onFormChange={setVariantForm}
        />
      </div>
    </ResponsiveModal>
  );
}

export default ProductForm;
