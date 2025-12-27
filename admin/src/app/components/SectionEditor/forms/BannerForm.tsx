/**
 * BannerForm Component
 * Form for BANNER section type
 * Requirements: 3.2
 */

import { Input } from '../../Input';
import type { DataRecord, UpdateFieldFn } from './shared';

interface BannerFormProps {
  data: DataRecord;
  updateField: UpdateFieldFn;
}

export function BannerForm({ data, updateField }: BannerFormProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Input
        label="Nội dung thông báo"
        value={data.text || ''}
        onChange={(v) => updateField('text', v)}
        required
        fullWidth
      />
      <Input
        label="Link (tùy chọn)"
        value={data.href || ''}
        onChange={(v) => updateField('href', v)}
        fullWidth
      />
    </div>
  );
}
