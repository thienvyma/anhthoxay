/**
 * CategoryForm - Category form modal component for CatalogTab
 *
 * Feature: furniture-quotation
 * Requirements: 6.3
 */

import { motion } from 'framer-motion';
import { tokens } from '@app/shared';
import { ResponsiveModal } from '../../../../components/responsive';
import { Button } from '../../../components/Button';
import { Input, TextArea } from '../../../components/Input';
import type { FurnitureCategory, CreateCategoryInput } from '../types';

// Icon options for category selection
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

export interface CategoryFormProps {
  isOpen: boolean;
  editingCategory: FurnitureCategory | null;
  formData: CreateCategoryInput;
  loading: boolean;
  onClose: () => void;
  onSave: () => void;
  onFormChange: (data: CreateCategoryInput) => void;
}

export function CategoryForm({
  isOpen,
  editingCategory,
  formData,
  loading,
  onClose,
  onSave,
  onFormChange,
}: CategoryFormProps) {
  return (
    <ResponsiveModal
      isOpen={isOpen}
      onClose={onClose}
      title={editingCategory ? 'Sửa danh mục' : 'Thêm danh mục'}
      size="md"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Hủy
          </Button>
          <Button onClick={onSave} loading={loading}>
            {editingCategory ? 'Cập nhật' : 'Thêm'}
          </Button>
        </>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <Input
          label="Tên danh mục"
          value={formData.name}
          onChange={(val) => onFormChange({ ...formData, name: val })}
          placeholder="VD: Phòng khách"
          required
          fullWidth
        />

        <TextArea
          label="Mô tả"
          value={formData.description || ''}
          onChange={(val) => onFormChange({ ...formData, description: val })}
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
                onClick={() => onFormChange({ ...formData, icon: icon.value })}
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 10,
                  border: `2px solid ${
                    formData.icon === icon.value ? tokens.color.primary : tokens.color.border
                  }`,
                  background:
                    formData.icon === icon.value
                      ? `linear-gradient(135deg, ${tokens.color.primary}20, ${tokens.color.accent}10)`
                      : 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color:
                    formData.icon === icon.value ? tokens.color.primary : tokens.color.muted,
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
          value={formData.order || 0}
          onChange={(val) => onFormChange({ ...formData, order: parseInt(val) || 0 })}
          placeholder="0"
          fullWidth
        />

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <input
            type="checkbox"
            id="category-active"
            checked={formData.isActive}
            onChange={(e) => onFormChange({ ...formData, isActive: e.target.checked })}
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
  );
}

export default CategoryForm;
