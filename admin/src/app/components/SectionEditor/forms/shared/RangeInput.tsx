/**
 * RangeInput Component
 * Range slider input with label and value display
 * Requirements: 3.4
 */

import { tokens } from '../../../../../theme';

interface RangeInputProps {
  label: string;
  value: number;
  onChange: (v: number) => void;
}

export function RangeInput({ label, value, onChange }: RangeInputProps) {
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
        {label} (0-100)
      </label>
      <input
        type="range"
        min="0"
        max="100"
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value))}
        style={{
          width: '100%',
          height: 6,
          borderRadius: 3,
          cursor: 'pointer',
        }}
      />
      <p style={{ color: tokens.color.muted, fontSize: 12, marginTop: 4 }}>
        Hiện tại: {value}%
      </p>
    </div>
  );
}
