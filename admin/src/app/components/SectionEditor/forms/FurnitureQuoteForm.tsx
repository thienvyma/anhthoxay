/**
 * FurnitureQuoteForm Component
 * Form for FURNITURE_QUOTE section type
 * Requirements: 3.2
 */

import { tokens } from '@app/shared';
import { Input, TextArea } from '../../Input';
import { InfoBanner, ArraySection, FormSection, SelectInput } from './shared';
import type { DataRecord, UpdateFieldFn, AddArrayItemFn, RemoveArrayItemFn } from './shared';
import { generateUniqueId } from '../utils';

interface FurnitureQuoteFormProps {
  data: DataRecord;
  updateField: UpdateFieldFn;
  addArrayItem: AddArrayItemFn;
  removeArrayItem: RemoveArrayItemFn;
}

const FIELD_TYPES = [
  { value: 'text', label: 'Text' },
  { value: 'textarea', label: 'Textarea' },
  { value: 'phone', label: 'Điện thoại' },
  { value: 'email', label: 'Email' },
  { value: 'select', label: 'Dropdown' },
];

export function FurnitureQuoteForm({ data, updateField, addArrayItem, removeArrayItem }: FurnitureQuoteFormProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <InfoBanner
        icon="ri-sofa-line"
        color="#8b5cf6"
        title="Báo Giá Nội Thất"
        description="Quy trình step-by-step để khách hàng chọn căn hộ và nhận báo giá nội thất (combo hoặc custom)."
      />

      <FormSection icon="ri-text" iconColor="#8b5cf6" title="Tiêu đề & Mô tả" bgColor="rgba(139, 92, 246, 0.05)" borderColor="rgba(139, 92, 246, 0.2)">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Input label="Tiêu đề" value={data.title || ''} onChange={(v) => updateField('title', v)} placeholder="Báo Giá Nội Thất" fullWidth />
          <TextArea label="Mô tả" value={data.subtitle || ''} onChange={(v) => updateField('subtitle', v)} placeholder="Chọn căn hộ và nhận báo giá nội thất phù hợp" rows={2} fullWidth />
        </div>
      </FormSection>

      <FormSection icon="ri-list-settings-line" iconColor="#3B82F6" title="Cấu hình Form Thu Lead" bgColor="rgba(59, 130, 246, 0.05)" borderColor="rgba(59, 130, 246, 0.2)">
        <p style={{ color: tokens.color.muted, fontSize: 13, margin: '0 0 16px', lineHeight: 1.5 }}>Cấu hình các trường thông tin khách hàng cần thu thập trước khi chọn nội thất.</p>
        <ArraySection
          label={`Trường dữ liệu (${data.formFields?.length || 0})`}
          items={data.formFields || []}
          onAdd={() => addArrayItem('formFields', { _id: generateUniqueId(), name: 'custom_field', label: 'Trường mới', type: 'text', placeholder: '', required: false })}
          onRemove={(idx) => removeArrayItem('formFields', idx)}
          renderItem={(item, idx) => (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <Input label="Tên field (key)" value={item.name || ''} onChange={(v) => updateField(`formFields.${idx}.name`, v)} placeholder="phone" fullWidth />
                <Input label="Nhãn hiển thị" value={item.label || ''} onChange={(v) => updateField(`formFields.${idx}.label`, v)} placeholder="Số điện thoại" fullWidth />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <SelectInput label="Loại trường" value={item.type || 'text'} options={FIELD_TYPES} onChange={(v) => updateField(`formFields.${idx}.type`, v)} />
                <Input label="Placeholder" value={item.placeholder || ''} onChange={(v) => updateField(`formFields.${idx}.placeholder`, v)} placeholder="Nhập số điện thoại" fullWidth />
              </div>
              {item.type === 'select' && (
                <Input label="Các lựa chọn (phân cách bằng dấu phẩy)" value={item.options || ''} onChange={(v) => updateField(`formFields.${idx}.options`, v)} placeholder="Lựa chọn 1, Lựa chọn 2" fullWidth />
              )}
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <input type="checkbox" checked={item.required || false} onChange={(e) => updateField(`formFields.${idx}.required`, e.target.checked)} />
                <span style={{ color: tokens.color.text, fontSize: 13 }}>Bắt buộc</span>
              </label>
            </div>
          )}
        />
      </FormSection>

      <FormSection icon="ri-cursor-line" title="Nút & Thông báo" bgColor="rgba(245, 211, 147, 0.05)" borderColor="rgba(245, 211, 147, 0.2)">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Input label="Text nút tiếp tục" value={data.buttonText || ''} onChange={(v) => updateField('buttonText', v)} placeholder="Tiếp tục" fullWidth />
          <Input label="Thông báo thành công" value={data.successMessage || ''} onChange={(v) => updateField('successMessage', v)} placeholder="Cảm ơn bạn! Chúng tôi sẽ liên hệ sớm." fullWidth />
        </div>
      </FormSection>

      <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: tokens.radius.md, padding: 16, display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <i className="ri-information-line" style={{ fontSize: 20, color: '#10B981', marginTop: 2 }} />
        <div>
          <p style={{ color: tokens.color.text, fontSize: 14, margin: 0, fontWeight: 500, marginBottom: 4 }}>Dữ liệu nội thất được quản lý riêng</p>
          <p style={{ color: tokens.color.muted, fontSize: 13, margin: 0, lineHeight: 1.5 }}>Dữ liệu dự án, căn hộ, sản phẩm nội thất và combo được quản lý trong trang <strong>Nội thất</strong> của Admin panel.</p>
        </div>
      </div>
    </div>
  );
}
