/**
 * AboutForm Component
 * Form for ABOUT section type
 * Requirements: 3.2
 */

import { Input, TextArea } from '../../Input';
import { InfoBanner, ImageSection } from './shared';
import type { DataRecord, UpdateFieldFn } from './shared';

interface AboutFormProps {
  data: DataRecord;
  updateField: UpdateFieldFn;
}

export function AboutForm({ data, updateField }: AboutFormProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <InfoBanner
        icon="ri-building-2-line"
        color="#8B5CF6"
        title="Giới Thiệu"
        description="Section giới thiệu về công ty."
      />
      <Input
        label="Badge"
        value={data.badge || ''}
        onChange={(v) => updateField('badge', v)}
        placeholder="Về Chúng Tôi"
        fullWidth
      />
      <Input
        label="Tiêu đề"
        value={data.title || ''}
        onChange={(v) => updateField('title', v)}
        fullWidth
      />
      <TextArea
        label="Mô tả"
        value={data.description || ''}
        onChange={(v) => updateField('description', v)}
        rows={4}
        fullWidth
      />
      <ImageSection
        label="Hình ảnh"
        value={data.imageUrl}
        onChange={(url) => updateField('imageUrl', url)}
      />
    </div>
  );
}
