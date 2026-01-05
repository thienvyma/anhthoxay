/**
 * CTASection Component
 * Call-to-action button configuration
 * Requirements: 3.4
 */

import { tokens } from '../../../../../theme';
import { Input } from '../../../Input';
import type { DataRecord, UpdateFieldFn } from './types';

interface CTASectionProps {
  data: DataRecord;
  updateField: UpdateFieldFn;
}

export function CTASection({ data, updateField }: CTASectionProps) {
  return (
    <div
      style={{
        background: 'rgba(245, 211, 147, 0.05)',
        border: '1px solid rgba(245, 211, 147, 0.2)',
        borderRadius: tokens.radius.md,
        padding: 16,
      }}
    >
      <div
        style={{
          marginBottom: 12,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <i
          className="ri-cursor-line"
          style={{ fontSize: 18, color: tokens.color.primary }}
        />
        <label
          style={{
            color: tokens.color.text,
            fontSize: 14,
            fontWeight: 600,
            margin: 0,
          }}
        >
          Nút Call-to-Action
        </label>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <Input
          label="Text nút"
          value={data.ctaText || ''}
          onChange={(v) => updateField('ctaText', v)}
          placeholder="Nhận Báo Giá"
          fullWidth
        />
        <Input
          label="Link"
          value={data.ctaLink || ''}
          onChange={(v) => updateField('ctaLink', v)}
          placeholder="/bao-gia"
          fullWidth
        />
      </div>
    </div>
  );
}
