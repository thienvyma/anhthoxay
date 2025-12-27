/**
 * FeaturesForm Component
 * Form for FEATURES and CORE_VALUES section types
 * Requirements: 3.2
 */

import { Input, TextArea } from '../../Input';
import { IconPicker } from '../../IconPicker';
import { InfoBanner, ArraySection } from './shared';
import type { DataRecord, UpdateFieldFn, AddArrayItemFn, RemoveArrayItemFn } from './shared';
import { generateUniqueId } from '../utils';

interface FeaturesFormProps {
  data: DataRecord;
  updateField: UpdateFieldFn;
  addArrayItem: AddArrayItemFn;
  removeArrayItem: RemoveArrayItemFn;
  kind: 'FEATURES' | 'CORE_VALUES';
}

export function FeaturesForm({
  data,
  updateField,
  addArrayItem,
  removeArrayItem,
  kind,
}: FeaturesFormProps) {
  const path = kind === 'FEATURES' ? 'features' : 'values';
  const items = data.features || data.values || [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <InfoBanner
        icon="ri-star-fill"
        color="#F59E0B"
        title={kind === 'FEATURES' ? 'Dịch Vụ/Tính Năng' : 'Giá Trị Cốt Lõi'}
        description="Highlight các điểm nổi bật."
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
        label={kind === 'FEATURES' ? 'Dịch vụ' : 'Giá trị'}
        items={items}
        onAdd={() =>
          addArrayItem(path, {
            _id: generateUniqueId(),
            icon: 'ri-star-line',
            title: 'Mục mới',
            description: 'Mô tả...',
          })
        }
        onRemove={(idx) => removeArrayItem(path, idx)}
        renderItem={(item, idx) => (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <IconPicker
              label="Icon"
              value={item.icon || ''}
              onChange={(v) => updateField(`${path}.${idx}.icon`, v)}
            />
            <Input
              label="Tiêu đề"
              value={item.title || ''}
              onChange={(v) => updateField(`${path}.${idx}.title`, v)}
              fullWidth
            />
            <TextArea
              label="Mô tả"
              value={item.description || ''}
              onChange={(v) => updateField(`${path}.${idx}.description`, v)}
              fullWidth
            />
          </div>
        )}
      />
    </div>
  );
}
