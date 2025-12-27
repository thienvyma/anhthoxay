/**
 * ButtonSection Component
 * Button configuration section (primary/secondary)
 * Requirements: 3.4
 */

import { tokens } from '@app/shared';
import { Input } from '../../../Input';
import type { DataRecord, UpdateFieldFn } from './types';

interface ButtonSectionProps {
  label: string;
  data: DataRecord;
  path: string;
  updateField: UpdateFieldFn;
  secondary?: boolean;
}

export function ButtonSection({
  label,
  data,
  path,
  updateField,
  secondary,
}: ButtonSectionProps) {
  return (
    <div
      style={{
        background: secondary
          ? 'rgba(100, 116, 139, 0.05)'
          : 'rgba(245, 211, 147, 0.05)',
        border: `1px solid ${secondary ? 'rgba(100, 116, 139, 0.2)' : 'rgba(245, 211, 147, 0.2)'}`,
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
          className={secondary ? 'ri-arrow-right-line' : 'ri-arrow-right-circle-fill'}
          style={{
            fontSize: 18,
            color: secondary ? tokens.color.muted : tokens.color.primary,
          }}
        />
        <label
          style={{
            color: tokens.color.text,
            fontSize: 14,
            fontWeight: 600,
            margin: 0,
          }}
        >
          {label}
        </label>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <Input
          label="Text nút"
          value={data.text || ''}
          onChange={(v) => updateField(`${path}.text`, v)}
          fullWidth
        />
        <Input
          label="Link"
          value={data.link || ''}
          onChange={(v) => updateField(`${path}.link`, v)}
          fullWidth
        />
      </div>
    </div>
  );
}
