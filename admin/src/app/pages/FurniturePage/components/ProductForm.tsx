/**
 * ProductForm - Product form modal component for CatalogTab
 *
 * Feature: furniture-quotation
 * Requirements: 6.3
 */

import { useRef } from 'react';
import { tokens } from '@app/shared';
import { ResponsiveModal } from '../../../../components/responsive';
import { Button } from '../../../components/Button';
import { Input, TextArea } from '../../../components/Input';
import { Select } from '../../../components/Select';
import type { FurnitureCategory, FurnitureProduct, CreateProductInput } from '../types';

export interface ProductFormProps {
  isOpen: boolean;
  editingProduct: FurnitureProduct | null;
  formData: CreateProductInput;
  categories: FurnitureCategory[];
  loading: boolean;
  uploadingImage: boolean;
  onClose: () => void;
  onSave: () => void;
  onFormChange: (data: CreateProductInput) => void;
  onImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function ProductForm({
  isOpen,
  editingProduct,
  formData,
  categories,
  loading,
  uploadingImage,
  onClose,
  onSave,
  onFormChange,
  onImageUpload,
}: ProductFormProps) {
  const imageInputRef = useRef<HTMLInputElement>(null);

  return (
    <ResponsiveModal
      isOpen={isOpen}
      onClose={onClose}
      title={editingProduct ? 'Sửa sản phẩm' : 'Thêm sản phẩm'}
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Hủy
          </Button>
          <Button onClick={onSave} loading={loading}>
            {editingProduct ? 'Cập nhật' : 'Thêm'}
          </Button>
        </>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <Input
          label="Tên sản phẩm"
          value={formData.name}
          onChange={(val) => onFormChange({ ...formData, name: val })}
          placeholder="VD: Sofa góc L"
          required
          fullWidth
        />

        <Select
          label="Danh mục"
          value={formData.categoryId}
          onChange={(val) => onFormChange({ ...formData, categoryId: val })}
          options={[
            { value: '', label: '-- Chọn danh mục --' },
            ...categories.map((c) => ({ value: c.id, label: c.name })),
          ]}
        />

        <Input
          label="Giá (VNĐ)"
          type="number"
          value={formData.price}
          onChange={(val) => onFormChange({ ...formData, price: parseFloat(val) || 0 })}
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
                background: formData.imageUrl
                  ? `url(${formData.imageUrl}) center/cover`
                  : tokens.color.surfaceHover,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              {!formData.imageUrl && (
                <i className="ri-image-add-line" style={{ fontSize: 32, color: tokens.color.muted }} />
              )}
            </div>

            <div style={{ flex: 1 }}>
              <input
                ref={imageInputRef}
                type="file"
                accept="image/*"
                onChange={onImageUpload}
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
              {formData.imageUrl && (
                <Button
                  variant="ghost"
                  size="small"
                  onClick={() => onFormChange({ ...formData, imageUrl: '' })}
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
          value={formData.description || ''}
          onChange={(val) => onFormChange({ ...formData, description: val })}
          placeholder="Mô tả chi tiết sản phẩm..."
          rows={3}
          fullWidth
        />

        <Input
          label="Kích thước"
          value={formData.dimensions || ''}
          onChange={(val) => onFormChange({ ...formData, dimensions: val })}
          placeholder="VD: 200x90x85 cm"
          fullWidth
        />

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
            checked={formData.isActive}
            onChange={(e) => onFormChange({ ...formData, isActive: e.target.checked })}
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
  );
}

export default ProductForm;
