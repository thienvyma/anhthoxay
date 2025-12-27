/**
 * QuickContactForm Component
 * Form for QUICK_CONTACT section type
 * Requirements: 3.2
 */

import { Input } from '../../Input';
import { InfoBanner } from './shared';
import type { DataRecord, UpdateFieldFn } from './shared';

interface QuickContactFormProps {
  data: DataRecord;
  updateField: UpdateFieldFn;
}

export function QuickContactForm({ data, updateField }: QuickContactFormProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <InfoBanner
        icon="ri-contacts-fill"
        color="#F59E0B"
        title="Liên Hệ Nhanh"
        description="Card liên hệ nhanh với thông tin cơ bản."
      />
      <Input
        label="Tiêu đề"
        value={data.title || ''}
        onChange={(v) => updateField('title', v)}
        placeholder="Liên Hệ Nhanh"
        fullWidth
      />
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
      <Input
        label="Địa chỉ"
        value={data.address || ''}
        onChange={(v) => updateField('address', v)}
        fullWidth
      />
    </div>
  );
}
