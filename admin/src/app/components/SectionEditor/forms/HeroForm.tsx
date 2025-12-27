/**
 * HeroForm Component
 * Form for HERO section type
 * Requirements: 3.2
 */

import { Input, TextArea } from '../../Input';
import { InfoBanner, ImageSection, CTASection } from './shared';
import type { DataRecord, UpdateFieldFn } from './shared';

interface HeroFormProps {
  data: DataRecord;
  updateField: UpdateFieldFn;
}

export function HeroForm({ data, updateField }: HeroFormProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <InfoBanner
        icon="ri-information-line"
        color="#3B82F6"
        title="Hero Section"
        description="Banner chính của trang - hình ảnh sẽ được tự động tối ưu."
      />
      <Input
        label="Tiêu đề"
        value={data.title || ''}
        onChange={(v) => updateField('title', v)}
        required
        fullWidth
      />
      <TextArea
        label="Mô tả ngắn"
        value={data.subtitle || ''}
        onChange={(v) => updateField('subtitle', v)}
        fullWidth
      />
      <ImageSection
        label="Hình nền"
        value={data.imageUrl}
        onChange={(url) => updateField('imageUrl', url)}
      />
      <CTASection data={data} updateField={updateField} />
    </div>
  );
}
