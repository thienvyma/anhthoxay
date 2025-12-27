/**
 * StatsForm Component
 * Form for STATS section type
 * Requirements: 3.2
 */

import { Input, TextArea } from '../../Input';
import { IconPicker } from '../../IconPicker';
import { InfoBanner, ArraySection } from './shared';
import type { DataRecord, UpdateFieldFn, AddArrayItemFn, RemoveArrayItemFn } from './shared';
import { generateUniqueId } from '../utils';

interface StatsFormProps {
  data: DataRecord;
  updateField: UpdateFieldFn;
  addArrayItem: AddArrayItemFn;
  removeArrayItem: RemoveArrayItemFn;
}

export function StatsForm({
  data,
  updateField,
  addArrayItem,
  removeArrayItem,
}: StatsFormProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <InfoBanner
        icon="ri-bar-chart-fill"
        color="#3B82F6"
        title="Thống Kê"
        description="Hiển thị các con số ấn tượng."
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
        label="Số liệu"
        items={data.stats || []}
        onAdd={() =>
          addArrayItem('stats', {
            _id: generateUniqueId(),
            icon: 'ri-star-fill',
            value: '100',
            label: 'Số liệu mới',
            suffix: '+',
          })
        }
        onRemove={(idx) => removeArrayItem('stats', idx)}
        renderItem={(item, idx) => (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
            <IconPicker
              label="Icon"
              value={item.icon || ''}
              onChange={(v) => updateField(`stats.${idx}.icon`, v)}
            />
            <Input
              label="Giá trị"
              value={item.value || ''}
              onChange={(v) => updateField(`stats.${idx}.value`, v)}
              fullWidth
            />
            <Input
              label="Nhãn"
              value={item.label || ''}
              onChange={(v) => updateField(`stats.${idx}.label`, v)}
              fullWidth
            />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <Input
                label="Tiền tố"
                value={item.prefix || ''}
                onChange={(v) => updateField(`stats.${idx}.prefix`, v)}
                fullWidth
              />
              <Input
                label="Hậu tố"
                value={item.suffix || ''}
                onChange={(v) => updateField(`stats.${idx}.suffix`, v)}
                fullWidth
              />
            </div>
          </div>
        )}
      />
    </div>
  );
}
