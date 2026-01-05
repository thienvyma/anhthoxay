/**
 * VariantForm - Variant form modal component for ProductForm
 *
 * Feature: furniture-product-restructure
 * Requirements: 4.2, 4.3
 */

import { useMemo } from 'react';
import { tokens } from '../../../../theme';
import { ResponsiveModal } from '../../../../components/responsive';
import { Button } from '../../../components/Button';
import { Input } from '../../../components/Input';
import { Select } from '../../../components/Select';
import type { FurnitureMaterial, CreateVariantInput } from '../types';

export interface VariantFormProps {
  isOpen: boolean;
  isEditing: boolean;
  variantForm: CreateVariantInput;
  materials: FurnitureMaterial[];
  onClose: () => void;
  onSave: () => void;
  onFormChange: (data: CreateVariantInput) => void;
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

const pricingTypeOptions = [
  { value: 'LINEAR', label: 'Mét dài (LINEAR)' },
  { value: 'M2', label: 'Mét vuông (M2)' },
];

export function VariantForm({
  isOpen,
  isEditing,
  variantForm,
  materials,
  onClose,
  onSave,
  onFormChange,
}: VariantFormProps) {
  const calculatedPrice = useMemo(() => {
    if (!variantForm.pricePerUnit || !variantForm.length) return 0;
    return calculateVariantPrice(
      variantForm.pricePerUnit,
      variantForm.pricingType,
      variantForm.length,
      variantForm.width
    );
  }, [variantForm.pricePerUnit, variantForm.pricingType, variantForm.length, variantForm.width]);

  return (
    <ResponsiveModal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Chỉnh sửa biến thể' : 'Thêm biến thể mới'}
      size="md"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Hủy</Button>
          <Button onClick={onSave}>{isEditing ? 'Cập nhật' : 'Thêm'}</Button>
        </>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <Select 
          label="Chất liệu *" 
          value={variantForm.materialId} 
          onChange={(val) => onFormChange({ ...variantForm, materialId: val })} 
          options={materials.filter(m => m.isActive).map((m) => ({ value: m.id, label: m.name }))} 
          placeholder="Chọn chất liệu" 
          fullWidth 
        />
        <Select 
          label="Cách tính giá *" 
          value={variantForm.pricingType} 
          onChange={(val) => onFormChange({ ...variantForm, pricingType: val as 'LINEAR' | 'M2' })} 
          options={pricingTypeOptions} 
          fullWidth 
        />
        <Input 
          label="Giá trên 1 mét (VNĐ) *" 
          type="number" 
          value={variantForm.pricePerUnit} 
          onChange={(val) => onFormChange({ ...variantForm, pricePerUnit: parseFloat(val) || 0 })} 
          placeholder="VD: 1500000" 
          fullWidth 
        />
        <div style={{ display: 'flex', gap: 12 }}>
          <Input 
            label="Chiều dài (m) *" 
            type="number" 
            value={variantForm.length} 
            onChange={(val) => onFormChange({ ...variantForm, length: parseFloat(val) || 0 })} 
            placeholder="VD: 2.5" 
            fullWidth 
          />
          {variantForm.pricingType === 'M2' && (
            <Input 
              label="Chiều rộng (m) *" 
              type="number" 
              value={variantForm.width ?? 0} 
              onChange={(val) => onFormChange({ ...variantForm, width: parseFloat(val) || 0 })} 
              placeholder="VD: 1.2" 
              fullWidth 
            />
          )}
        </div>

        {/* Auto-calculate preview */}
        <div style={{ 
          padding: 12, 
          background: tokens.color.surfaceHover, 
          borderRadius: 8, 
          border: `1px solid ${tokens.color.border}` 
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: tokens.color.muted, fontSize: 14 }}>Giá tính toán:</span>
            <span style={{ color: tokens.color.primary, fontSize: 16, fontWeight: 600 }}>
              {formatPrice(calculatedPrice)}
            </span>
          </div>
          <div style={{ marginTop: 8, fontSize: 12, color: tokens.color.muted }}>
            {variantForm.pricingType === 'M2' 
              ? `${formatPrice(variantForm.pricePerUnit)}/m² × ${variantForm.length}m × ${variantForm.width || 0}m`
              : `${formatPrice(variantForm.pricePerUnit)}/m × ${variantForm.length}m`
            }
          </div>
        </div>

        <Input 
          label="Thứ tự hiển thị" 
          type="number" 
          value={variantForm.order || 0} 
          onChange={(val) => onFormChange({ ...variantForm, order: parseInt(val) || 0 })} 
          placeholder="0" 
          fullWidth 
        />
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <input 
            type="checkbox" 
            id="variant-active" 
            checked={variantForm.isActive ?? true} 
            onChange={(e) => onFormChange({ ...variantForm, isActive: e.target.checked })} 
            style={{ width: 18, height: 18, cursor: 'pointer' }} 
          />
          <label htmlFor="variant-active" style={{ color: tokens.color.text, cursor: 'pointer' }}>
            Hiển thị biến thể
          </label>
        </div>
      </div>
    </ResponsiveModal>
  );
}

export default VariantForm;
