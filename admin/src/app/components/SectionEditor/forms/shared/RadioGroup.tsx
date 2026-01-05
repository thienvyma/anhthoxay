/**
 * RadioGroup Component
 * Radio button group for single selection
 * Requirements: 3.4
 */

import { tokens } from '../../../../../theme';

interface RadioGroupProps {
  label: string;
  options: string[];
  value: string;
  onChange: (v: string) => void;
}

export function RadioGroup({ label, options, value, onChange }: RadioGroupProps) {
  return (
    <div>
      <label
        style={{
          display: 'block',
          marginBottom: 8,
          color: tokens.color.text,
          fontWeight: 500,
        }}
      >
        {label}
      </label>
      <div style={{ display: 'flex', gap: 12 }}>
        {options.map((opt) => (
          <label
            key={opt}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              cursor: 'pointer',
            }}
          >
            <input
              type="radio"
              checked={value === opt}
              onChange={() => onChange(opt)}
              style={{ cursor: 'pointer' }}
            />
            <span
              style={{
                fontSize: 13,
                color: tokens.color.text,
                textTransform: 'capitalize',
              }}
            >
              {opt}
            </span>
          </label>
        ))}
      </div>
    </div>
  );
}
