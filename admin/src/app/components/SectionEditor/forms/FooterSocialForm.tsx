/**
 * FooterSocialForm Component
 * Form for FOOTER_SOCIAL section type
 * Requirements: 3.2
 */

import { Input } from '../../Input';
import { InfoBanner, ArraySection } from './shared';
import type { DataRecord, UpdateFieldFn, AddArrayItemFn, RemoveArrayItemFn } from './shared';
import { generateUniqueId } from '../utils';

interface FooterSocialFormProps {
  data: DataRecord;
  updateField: UpdateFieldFn;
  addArrayItem: AddArrayItemFn;
  removeArrayItem: RemoveArrayItemFn;
}

export function FooterSocialForm({
  data,
  updateField,
  addArrayItem,
  removeArrayItem,
}: FooterSocialFormProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <InfoBanner
        icon="ri-share-forward-line"
        color="#6366F1"
        title="Footer Social"
        description="Social links hiển thị ở footer."
      />
      <Input
        label="Tiêu đề"
        value={data.title || ''}
        onChange={(v) => updateField('title', v)}
        fullWidth
      />
      <ArraySection
        label="Nền tảng"
        items={data.platforms || []}
        onAdd={() =>
          addArrayItem('platforms', {
            _id: generateUniqueId(),
            name: 'facebook',
            url: 'https://facebook.com',
          })
        }
        onRemove={(idx) => removeArrayItem('platforms', idx)}
        renderItem={(item, idx) => (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 12 }}>
            <Input
              label="Tên (facebook, youtube...)"
              value={item.name || ''}
              onChange={(v) => updateField(`platforms.${idx}.name`, v)}
              fullWidth
            />
            <Input
              label="URL"
              value={item.url || ''}
              onChange={(v) => updateField(`platforms.${idx}.url`, v)}
              fullWidth
            />
          </div>
        )}
      />
    </div>
  );
}
