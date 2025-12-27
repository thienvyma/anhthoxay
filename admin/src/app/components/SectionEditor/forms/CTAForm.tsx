/**
 * CTAForm Component
 * Form for CTA/CALL_TO_ACTION section type
 * Requirements: 3.2
 */

import { Input, TextArea } from '../../Input';
import { ButtonSection } from './shared';
import type { DataRecord, UpdateFieldFn } from './shared';

interface CTAFormProps {
  data: DataRecord;
  updateField: UpdateFieldFn;
}

export function CTAForm({ data, updateField }: CTAFormProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <Input
        label="Tiêu đề"
        value={data.title || ''}
        onChange={(v) => updateField('title', v)}
        required
        fullWidth
      />
      <TextArea
        label="Mô tả"
        value={data.subtitle || ''}
        onChange={(v) => updateField('subtitle', v)}
        fullWidth
      />
      <ButtonSection
        label="Nút chính"
        data={data.primaryButton || {}}
        path="primaryButton"
        updateField={updateField}
      />
      <ButtonSection
        label="Nút phụ (tùy chọn)"
        data={data.secondaryButton || {}}
        path="secondaryButton"
        updateField={updateField}
        secondary
      />
    </div>
  );
}
