/**
 * SelectInput Component
 * Reusable select input with label
 * Requirements: 3.4
 */

import { tokens } from '@app/shared';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectInputProps {
  label: string;
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
}

export function SelectInput({ label, value, options, onChange }: SelectInputProps) {
  return (
    <div>
      <label
        style={{
          display: 'block',
          marginBottom: 6,
          color: tokens.color.text,
          fontSize: 13,
          fontWeight: 500,
        }}
      >
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: '100%',
          padding: '10px 12px',
          borderRadius: tokens.radius.md,
          border: `1px solid ${tokens.color.border}`,
          background: tokens.color.surface,
          color: tokens.color.text,
          fontSize: 14,
        }}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
