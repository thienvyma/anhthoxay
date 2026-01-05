/**
 * CheckboxGroup Component
 * Reusable checkbox group
 * Requirements: 3.4
 */

import { tokens } from '../../../../../theme';
import type { DataRecord, UpdateFieldFn } from './types';

interface CheckboxOption {
  key: string;
  label: string;
  defaultValue: boolean;
}

interface CheckboxGroupProps {
  options: CheckboxOption[];
  data: DataRecord;
  updateField: UpdateFieldFn;
}

export function CheckboxGroup({ options, data, updateField }: CheckboxGroupProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {options.map(({ key, label, defaultValue }) => (
        <label
          key={key}
          style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}
        >
          <input
            type="checkbox"
            checked={data[key] !== undefined ? Boolean(data[key]) : defaultValue}
            onChange={(e) => updateField(key, e.target.checked)}
          />
          <span style={{ color: tokens.color.text, fontSize: 13 }}>{label}</span>
        </label>
      ))}
    </div>
  );
}
