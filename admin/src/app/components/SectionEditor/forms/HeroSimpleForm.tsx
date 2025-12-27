/**
 * HeroSimpleForm Component
 * Form for HERO_SIMPLE section type
 * Requirements: 3.2
 */

import { Input, TextArea } from '../../Input';
import { InfoBanner, ImageSection, RangeInput, RadioGroup } from './shared';
import type { DataRecord, UpdateFieldFn } from './shared';

interface HeroSimpleFormProps {
  data: DataRecord;
  updateField: UpdateFieldFn;
}

export function HeroSimpleForm({ data, updateField }: HeroSimpleFormProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <InfoBanner
        icon="ri-layout-top-line"
        color="#fb923c"
        title="Hero Đơn Giản"
        description="Hero nhẹ cho các trang phụ."
      />
      <Input
        label="Tiêu đề"
        value={data.title || ''}
        onChange={(v) => updateField('title', v)}
        required
        fullWidth
      />
      <Input
        label="Badge"
        value={data.subtitle || ''}
        onChange={(v) => updateField('subtitle', v)}
        fullWidth
      />
      <TextArea
        label="Mô tả"
        value={data.description || ''}
        onChange={(v) => updateField('description', v)}
        fullWidth
      />
      <ImageSection
        label="Hình nền (tùy chọn)"
        value={data.backgroundImage}
        onChange={(url) => updateField('backgroundImage', url)}
      />
      <RangeInput
        label="Độ tối overlay"
        value={data.backgroundOverlay || 60}
        onChange={(v) => updateField('backgroundOverlay', v)}
      />
      <RadioGroup
        label="Căn chỉnh text"
        options={['left', 'center', 'right']}
        value={data.textAlign || 'center'}
        onChange={(v) => updateField('textAlign', v)}
      />
    </div>
  );
}
