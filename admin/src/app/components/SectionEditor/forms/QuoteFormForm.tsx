/**
 * QuoteFormForm Component
 * Form for QUOTE_FORM section type
 * Requirements: 3.2
 */

import { tokens } from '@app/shared';
import { Input, TextArea } from '../../Input';
import { InfoBanner, ArraySection, FormSection, SelectInput, CheckboxGroup } from './shared';
import type { DataRecord, UpdateFieldFn, AddArrayItemFn, RemoveArrayItemFn } from './shared';
import { generateUniqueId } from '../utils';

interface QuoteFormFormProps {
  data: DataRecord;
  updateField: UpdateFieldFn;
  addArrayItem: AddArrayItemFn;
  removeArrayItem: RemoveArrayItemFn;
}

const DEFAULT_FIELDS = [
  { key: 'showNameField', label: 'Họ tên (bắt buộc)', defaultValue: true },
  { key: 'showPhoneField', label: 'Số điện thoại (bắt buộc)', defaultValue: true },
  { key: 'showEmailField', label: 'Email', defaultValue: true },
  { key: 'showContentField', label: 'Nội dung yêu cầu', defaultValue: true },
  { key: 'showAddressField', label: 'Địa chỉ', defaultValue: false },
];

const FIELD_TYPES = [
  { value: 'text', label: 'Text' },
  { value: 'textarea', label: 'Textarea' },
  { value: 'number', label: 'Số' },
  { value: 'email', label: 'Email' },
  { value: 'tel', label: 'Điện thoại' },
  { value: 'select', label: 'Dropdown' },
];

const LAYOUTS = [
  { value: 'card', label: 'Card (có viền)' },
  { value: 'simple', label: 'Đơn giản' },
  { value: 'glass', label: 'Glass effect' },
];

export function QuoteFormForm({ data, updateField, addArrayItem, removeArrayItem }: QuoteFormFormProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <InfoBanner
        icon="ri-calculator-line"
        color="#3B82F6"
        title="Form Báo Giá"
        description="Form để khách hàng yêu cầu báo giá. Dữ liệu sẽ được lưu vào Khách hàng tiềm năng."
      />
      <Input label="Tiêu đề" value={data.title || ''} onChange={(v) => updateField('title', v)} placeholder="Đăng kí tư vấn" fullWidth />
      <TextArea label="Mô tả" value={data.subtitle || ''} onChange={(v) => updateField('subtitle', v)} placeholder="Điền thông tin để nhận báo giá nhanh chóng" fullWidth />
      <Input label="Text nút gửi" value={data.buttonText || ''} onChange={(v) => updateField('buttonText', v)} placeholder="Gửi Yêu Cầu" fullWidth />

      <FormSection icon="ri-list-settings-line" iconColor="#3B82F6" title="Cấu hình trường dữ liệu" bgColor="rgba(59, 130, 246, 0.05)" borderColor="rgba(59, 130, 246, 0.2)">
        <CheckboxGroup options={DEFAULT_FIELDS} data={data} updateField={updateField} />
      </FormSection>

      <ArraySection
        label={`Trường tùy chỉnh (${data.customFields?.length || 0})`}
        items={data.customFields || []}
        onAdd={() => addArrayItem('customFields', { _id: generateUniqueId(), name: 'custom_field', label: 'Trường mới', type: 'text', placeholder: '', required: false })}
        onRemove={(idx) => removeArrayItem('customFields', idx)}
        renderItem={(item, idx) => (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Input label="Tên field (key)" value={item.name || ''} onChange={(v) => updateField(`customFields.${idx}.name`, v)} placeholder="custom_field" fullWidth />
              <Input label="Nhãn hiển thị" value={item.label || ''} onChange={(v) => updateField(`customFields.${idx}.label`, v)} placeholder="Nhãn" fullWidth />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <SelectInput label="Loại trường" value={item.type || 'text'} options={FIELD_TYPES} onChange={(v) => updateField(`customFields.${idx}.type`, v)} />
              <Input label="Placeholder" value={item.placeholder || ''} onChange={(v) => updateField(`customFields.${idx}.placeholder`, v)} fullWidth />
            </div>
            {item.type === 'select' && (
              <Input label="Các lựa chọn (phân cách bằng dấu phẩy)" value={item.options || ''} onChange={(v) => updateField(`customFields.${idx}.options`, v)} placeholder="Lựa chọn 1, Lựa chọn 2" fullWidth />
            )}
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <input type="checkbox" checked={item.required || false} onChange={(e) => updateField(`customFields.${idx}.required`, e.target.checked)} />
              <span style={{ color: tokens.color.text, fontSize: 13 }}>Bắt buộc</span>
            </label>
          </div>
        )}
      />

      <FormSection icon="ri-palette-line" title="Giao diện" bgColor="rgba(245, 211, 147, 0.05)" borderColor="rgba(245, 211, 147, 0.2)">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <SelectInput label="Layout" value={(data.layout as string) || 'card'} options={LAYOUTS} onChange={(v) => updateField('layout', v)} />
          <Input label="Màu nút" value={data.buttonColor || ''} onChange={(v) => updateField('buttonColor', v)} placeholder="#F5D393" fullWidth />
        </div>
      </FormSection>

      <Input label="Thông báo thành công" value={data.successMessage || ''} onChange={(v) => updateField('successMessage', v)} placeholder="Cảm ơn bạn! Chúng tôi sẽ liên hệ sớm nhất." fullWidth />
    </div>
  );
}
