/**
 * SocialMediaForm Component
 * Form for SOCIAL_MEDIA section type
 * Requirements: 3.2
 */

import { Input, TextArea } from '../../Input';
import { IconPicker } from '../../IconPicker';
import { InfoBanner, ArraySection } from './shared';
import type { DataRecord, UpdateFieldFn, AddArrayItemFn, RemoveArrayItemFn } from './shared';
import { generateUniqueId } from '../utils';

interface SocialMediaFormProps {
  data: DataRecord;
  updateField: UpdateFieldFn;
  addArrayItem: AddArrayItemFn;
  removeArrayItem: RemoveArrayItemFn;
}

export function SocialMediaForm({
  data,
  updateField,
  addArrayItem,
  removeArrayItem,
}: SocialMediaFormProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <InfoBanner
        icon="ri-share-line"
        color="#E4405F"
        title="Mạng Xã Hội"
        description="Hiển thị các link mạng xã hội."
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
        label="Social Links"
        items={data.links || []}
        onAdd={() =>
          addArrayItem('links', {
            _id: generateUniqueId(),
            platform: 'Facebook',
            url: 'https://facebook.com',
            icon: 'ri-facebook-fill',
          })
        }
        onRemove={(idx) => removeArrayItem('links', idx)}
        renderItem={(item, idx) => (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Input
              label="Tên nền tảng"
              value={item.platform || ''}
              onChange={(v) => updateField(`links.${idx}.platform`, v)}
              fullWidth
            />
            <Input
              label="URL"
              value={item.url || ''}
              onChange={(v) => updateField(`links.${idx}.url`, v)}
              fullWidth
            />
            <IconPicker
              label="Icon"
              value={item.icon || ''}
              onChange={(v) => updateField(`links.${idx}.icon`, v)}
            />
          </div>
        )}
      />
    </div>
  );
}
