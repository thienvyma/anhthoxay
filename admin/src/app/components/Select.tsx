import { tokens } from '../../theme';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[] | string[];
  placeholder?: string;
  fullWidth?: boolean;
  disabled?: boolean;
}

export function Select({
  label,
  value,
  onChange,
  options,
  placeholder,
  fullWidth = true,
  disabled = false,
}: SelectProps) {
  // Normalize options to SelectOption format
  const normalizedOptions: SelectOption[] = options.map(opt =>
    typeof opt === 'string' ? { value: opt, label: opt } : opt
  );

  return (
    <div style={{ width: fullWidth ? '100%' : 'auto' }}>
      {label && (
        <label
          style={{
            color: tokens.color.text,
            fontSize: 13,
            marginBottom: 6,
            display: 'block',
            fontWeight: 500,
          }}
        >
          {label}
        </label>
      )}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        style={{
          width: '100%',
          padding: '10px 14px',
          borderRadius: tokens.radius.md,
          background: tokens.color.background,
          border: `1px solid ${tokens.color.border}`,
          color: tokens.color.text,
          fontSize: 14,
          cursor: disabled ? 'not-allowed' : 'pointer',
          outline: 'none',
          appearance: 'none',
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2371717A' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'right 12px center',
          paddingRight: 36,
          transition: 'border-color 0.15s ease',
        }}
        onFocus={(e) => {
          e.target.style.borderColor = tokens.color.primary;
        }}
        onBlur={(e) => {
          e.target.style.borderColor = tokens.color.border;
        }}
      >
        {placeholder && (
          <option value="" disabled style={{ color: tokens.color.muted }}>
            {placeholder}
          </option>
        )}
        {normalizedOptions.map((opt) => (
          <option
            key={opt.value}
            value={opt.value}
            style={{
              background: tokens.color.surface,
              color: tokens.color.text,
              padding: '8px 12px',
            }}
          >
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
