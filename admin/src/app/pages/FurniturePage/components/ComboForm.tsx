/**
 * ComboForm - Combo form modal component for ComboTab
 *
 * Feature: furniture-quotation
 * Requirements: 6.5
 */

import { useRef } from 'react';
import { motion } from 'framer-motion';
import { tokens } from '@app/shared';
import { ResponsiveModal } from '../../../../components/responsive';
import { Button } from '../../../components/Button';
import { Input, TextArea } from '../../../components/Input';
import type { FurnitureCombo, FurnitureProduct, CreateComboInput } from '../types';

// Apartment type options
const APARTMENT_TYPE_OPTIONS = [
  { value: '1pn', label: '1 Phòng ngủ' },
  { value: '2pn', label: '2 Phòng ngủ' },
  { value: '3pn', label: '3 Phòng ngủ' },
  { value: '1pn+', label: '1 Phòng ngủ+' },
  { value: 'penhouse', label: 'Penhouse' },
  { value: 'shophouse', label: 'Shophouse' },
];

export interface ComboFormProps {
  isOpen: boolean;
  editingCombo: FurnitureCombo | null;
  formData: CreateComboInput;
  products: FurnitureProduct[];
  loading: boolean;
  uploadingImage: boolean;
  onClose: () => void;
  onSave: () => void;
  onFormChange: (data: CreateComboInput) => void;
  onImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onToggleApartmentType: (type: string) => void;
  onToggleProduct: (productId: string) => void;
  onUpdateQuantity: (productId: string, quantity: number) => void;
}

export function ComboForm({
  isOpen,
  editingCombo,
  formData,
  products,
  loading,
  uploadingImage,
  onClose,
  onSave,
  onFormChange,
  onImageUpload,
  onToggleApartmentType,
  onToggleProduct,
  onUpdateQuantity,
}: ComboFormProps) {
  const imageInputRef = useRef<HTMLInputElement>(null);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price);
  };

  const isProductSelected = (productId: string) => {
    return (formData.items || []).some((item) => item.productId === productId);
  };

  const getProductQuantity = (productId: string) => {
    const item = (formData.items || []).find((item) => item.productId === productId);
    return item?.quantity || 1;
  };

  return (
    <ResponsiveModal
      isOpen={isOpen}
      onClose={onClose}
      title={editingCombo ? 'Sửa Combo' : 'Thêm Combo'}
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Hủy
          </Button>
          <Button onClick={onSave} loading={loading}>
            {editingCombo ? 'Cập nhật' : 'Thêm'}
          </Button>
        </>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Basic Info */}
        <Input
          label="Tên Combo"
          value={formData.name}
          onChange={(val) => onFormChange({ ...formData, name: val })}
          placeholder="VD: Combo Phòng khách Hiện đại"
          required
          fullWidth
        />

        {/* Apartment Types Multi-select */}
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
            Loại căn hộ áp dụng <span style={{ color: tokens.color.error }}>*</span>
          </label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {APARTMENT_TYPE_OPTIONS.map((option) => {
              const isSelected = (formData.apartmentTypes || []).includes(option.value);
              return (
                <motion.button
                  key={option.value}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => onToggleApartmentType(option.value)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 20,
                    border: `2px solid ${isSelected ? tokens.color.primary : tokens.color.border}`,
                    background: isSelected
                      ? `linear-gradient(135deg, ${tokens.color.primary}20, ${tokens.color.accent}10)`
                      : 'transparent',
                    color: isSelected ? tokens.color.primary : tokens.color.text,
                    cursor: 'pointer',
                    fontSize: 13,
                    fontWeight: isSelected ? 600 : 400,
                    transition: 'all 0.2s',
                  }}
                >
                  {isSelected && <i className="ri-check-line" style={{ marginRight: 4 }} />}
                  {option.label}
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Price */}
        <Input
          label="Giá Combo (VNĐ)"
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

        {/* Description */}
        <TextArea
          label="Mô tả"
          value={formData.description || ''}
          onChange={(val) => onFormChange({ ...formData, description: val })}
          placeholder="Mô tả chi tiết về combo..."
          rows={3}
          fullWidth
        />

        {/* Product Selection */}
        <div>
          <label
            style={{
              display: 'block',
              color: tokens.color.text,
              fontSize: 14,
              fontWeight: 500,
              marginBottom: 12,
            }}
          >
            Sản phẩm trong Combo ({(formData.items || []).length} sản phẩm)
          </label>
          <div
            style={{
              maxHeight: 300,
              overflowY: 'auto',
              border: `1px solid ${tokens.color.border}`,
              borderRadius: 12,
              padding: 12,
            }}
          >
            {products.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {products.map((product) => {
                  const selected = isProductSelected(product.id);
                  const quantity = getProductQuantity(product.id);
                  return (
                    <motion.div
                      key={product.id}
                      whileHover={{ scale: 1.01 }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        padding: 12,
                        borderRadius: 10,
                        background: selected
                          ? `linear-gradient(135deg, ${tokens.color.primary}10, ${tokens.color.accent}05)`
                          : tokens.color.surfaceHover,
                        border: `1px solid ${selected ? tokens.color.primary : 'transparent'}`,
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                      }}
                      onClick={() => onToggleProduct(product.id)}
                    >
                      {/* Checkbox */}
                      <div
                        style={{
                          width: 22,
                          height: 22,
                          borderRadius: 6,
                          border: `2px solid ${selected ? tokens.color.primary : tokens.color.border}`,
                          background: selected ? tokens.color.primary : 'transparent',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        {selected && (
                          <i className="ri-check-line" style={{ fontSize: 14, color: '#0b0c0f' }} />
                        )}
                      </div>

                      {/* Product Image */}
                      <div
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 8,
                          background: product.imageUrl
                            ? `url(${product.imageUrl}) center/cover`
                            : tokens.color.surface,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        {!product.imageUrl && (
                          <i className="ri-image-line" style={{ fontSize: 16, color: tokens.color.muted }} />
                        )}
                      </div>

                      {/* Product Info */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontWeight: 500,
                            color: tokens.color.text,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {product.name}
                        </div>
                        <div style={{ fontSize: 12, color: tokens.color.primary, fontWeight: 600 }}>
                          {formatPrice(product.price)}
                        </div>
                      </div>

                      {/* Quantity Input */}
                      {selected && (
                        <div
                          style={{ display: 'flex', alignItems: 'center', gap: 8 }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <span style={{ fontSize: 12, color: tokens.color.muted }}>SL:</span>
                          <input
                            type="number"
                            min={1}
                            value={quantity}
                            onChange={(e) =>
                              onUpdateQuantity(product.id, parseInt(e.target.value) || 1)
                            }
                            style={{
                              width: 60,
                              padding: '4px 8px',
                              borderRadius: 6,
                              border: `1px solid ${tokens.color.border}`,
                              background: tokens.color.surface,
                              color: tokens.color.text,
                              fontSize: 13,
                              textAlign: 'center',
                            }}
                          />
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <div
                style={{
                  textAlign: 'center',
                  padding: 32,
                  color: tokens.color.muted,
                }}
              >
                <i className="ri-shopping-bag-line" style={{ fontSize: 32, marginBottom: 8, display: 'block' }} />
                Chưa có sản phẩm nào. Vui lòng thêm sản phẩm trong tab Catalog.
              </div>
            )}
          </div>
        </div>

        {/* Active Status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <input
            type="checkbox"
            id="combo-active"
            checked={formData.isActive}
            onChange={(e) => onFormChange({ ...formData, isActive: e.target.checked })}
            style={{ width: 18, height: 18, cursor: 'pointer' }}
          />
          <label htmlFor="combo-active" style={{ color: tokens.color.text, cursor: 'pointer' }}>
            Hiển thị combo cho khách hàng
          </label>
        </div>
      </div>
    </ResponsiveModal>
  );
}

export default ComboForm;
