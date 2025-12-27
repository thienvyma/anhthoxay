/**
 * ContactInfoForm Component
 * Form for CONTACT_INFO section type
 * Requirements: 3.2
 */

import { Input } from '../../Input';
import { ArraySection } from './shared';
import type { DataRecord, UpdateFieldFn, AddArrayItemFn, RemoveArrayItemFn } from './shared';
import { generateUniqueId } from '../utils';

interface ContactInfoFormProps {
  data: DataRecord;
  updateField: UpdateFieldFn;
  addArrayItem: AddArrayItemFn;
  removeArrayItem: RemoveArrayItemFn;
}

export function ContactInfoForm({
  data,
  updateField,
  addArrayItem,
  removeArrayItem,
}: ContactInfoFormProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <Input
        label="Tiêu đề section"
        value={data.title || ''}
        onChange={(v) => updateField('title', v)}
        fullWidth
      />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
        <Input
          label="Số điện thoại"
          value={data.phone || ''}
          onChange={(v) => updateField('phone', v)}
          fullWidth
        />
        <Input
          label="Email"
          value={data.email || ''}
          onChange={(v) => updateField('email', v)}
          fullWidth
        />
      </div>
      <Input
        label="Địa chỉ"
        value={data.address || ''}
        onChange={(v) => updateField('address', v)}
        fullWidth
      />
      <ArraySection
        label="Giờ làm việc"
        items={data.hours || []}
        onAdd={() =>
          addArrayItem('hours', {
            _id: generateUniqueId(),
            day: 'Thứ 2 - Thứ 6',
            time: '08:00 - 18:00',
          })
        }
        onRemove={(idx) => removeArrayItem('hours', idx)}
        renderItem={(item, idx) => (
          <div style={{ display: 'flex', gap: 8 }}>
            <Input
              value={item.day || ''}
              onChange={(v) => updateField(`hours.${idx}.day`, v)}
              placeholder="Thứ 2 - Thứ 6"
              fullWidth
            />
            <Input
              value={item.time || ''}
              onChange={(v) => updateField(`hours.${idx}.time`, v)}
              placeholder="08:00 - 18:00"
              fullWidth
            />
          </div>
        )}
      />
      <Input
        label="Google Maps Embed URL"
        value={data.mapEmbedUrl || ''}
        onChange={(v) => updateField('mapEmbedUrl', v)}
        fullWidth
      />
    </div>
  );
}
