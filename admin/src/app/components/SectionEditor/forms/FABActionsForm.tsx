/**
 * FABActionsForm Component
 * Form for FAB_ACTIONS section type
 * Requirements: 3.2
 */

import { Input } from '../../Input';
import { IconPicker } from '../../IconPicker';
import { InfoBanner, ArraySection } from './shared';
import type { DataRecord, UpdateFieldFn, AddArrayItemFn, RemoveArrayItemFn } from './shared';
import { generateUniqueId } from '../utils';

interface FABActionsFormProps {
  data: DataRecord;
  updateField: UpdateFieldFn;
  addArrayItem: AddArrayItemFn;
  removeArrayItem: RemoveArrayItemFn;
}

export function FABActionsForm({
  data,
  updateField,
  addArrayItem,
  removeArrayItem,
}: FABActionsFormProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <InfoBanner
        icon="ri-customer-service-line"
        color="#EF4444"
        title="Nút Nổi (FAB)"
        description="Nút liên hệ nhanh góc màn hình."
      />
      <IconPicker
        label="Icon chính"
        value={data.mainIcon || ''}
        onChange={(v) => updateField('mainIcon', v)}
      />
      <Input
        label="Màu chính"
        value={data.mainColor || '#f5d393'}
        onChange={(v) => updateField('mainColor', v)}
        placeholder="#f5d393"
        fullWidth
      />
      <ArraySection
        label="Hành động"
        items={data.actions || []}
        onAdd={() =>
          addArrayItem('actions', {
            _id: generateUniqueId(),
            icon: 'ri-phone-fill',
            label: 'Gọi ngay',
            href: 'tel:0123456789',
            color: '#10B981',
          })
        }
        onRemove={(idx) => removeArrayItem('actions', idx)}
        renderItem={(item, idx) => (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <IconPicker
                label="Icon"
                value={item.icon || ''}
                onChange={(v) => updateField(`actions.${idx}.icon`, v)}
              />
              <Input
                label="Màu"
                value={item.color || ''}
                onChange={(v) => updateField(`actions.${idx}.color`, v)}
                placeholder="#10B981"
                fullWidth
              />
            </div>
            <Input
              label="Nhãn"
              value={item.label || ''}
              onChange={(v) => updateField(`actions.${idx}.label`, v)}
              fullWidth
            />
            <Input
              label="Link (tel:, mailto:, https://)"
              value={item.href || ''}
              onChange={(v) => updateField(`actions.${idx}.href`, v)}
              fullWidth
            />
          </div>
        )}
      />
    </div>
  );
}
