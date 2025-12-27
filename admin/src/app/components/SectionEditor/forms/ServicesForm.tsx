/**
 * ServicesForm Component
 * Form for SERVICES section type
 * Requirements: 3.2
 */

import { Input, TextArea } from '../../Input';
import { IconPicker } from '../../IconPicker';
import { InfoBanner, ArraySection } from './shared';
import type { DataRecord, UpdateFieldFn, AddArrayItemFn, RemoveArrayItemFn } from './shared';
import { generateUniqueId } from '../utils';

interface ServicesFormProps {
  data: DataRecord;
  updateField: UpdateFieldFn;
  addArrayItem: AddArrayItemFn;
  removeArrayItem: RemoveArrayItemFn;
}

export function ServicesForm({
  data,
  updateField,
  addArrayItem,
  removeArrayItem,
}: ServicesFormProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <InfoBanner
        icon="ri-service-line"
        color="#F59E0B"
        title="Dịch Vụ"
        description="Danh sách các dịch vụ cung cấp."
      />
      <Input
        label="Tiêu đề"
        value={data.title || ''}
        onChange={(v) => updateField('title', v)}
        fullWidth
      />
      <TextArea
        label="Mô tả"
        value={data.subtitle || ''}
        onChange={(v) => updateField('subtitle', v)}
        fullWidth
      />
      <ArraySection
        label="Dịch vụ"
        items={data.services || []}
        onAdd={() =>
          addArrayItem('services', {
            _id: generateUniqueId(),
            icon: 'ri-paint-brush-line',
            title: 'Dịch vụ mới',
            description: 'Mô tả dịch vụ...',
          })
        }
        onRemove={(idx) => removeArrayItem('services', idx)}
        renderItem={(item, idx) => (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <IconPicker
              label="Icon"
              value={item.icon || ''}
              onChange={(v) => updateField(`services.${idx}.icon`, v)}
            />
            <Input
              label="Tiêu đề"
              value={item.title || ''}
              onChange={(v) => updateField(`services.${idx}.title`, v)}
              fullWidth
            />
            <TextArea
              label="Mô tả"
              value={item.description || ''}
              onChange={(v) => updateField(`services.${idx}.description`, v)}
              fullWidth
            />
          </div>
        )}
      />
    </div>
  );
}
