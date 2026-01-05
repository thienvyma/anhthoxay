import { CSSProperties } from 'react';
import { tokens } from '../../theme';

interface InputProps {
  value: string | number;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: 'text' | 'email' | 'password' | 'number' | 'url' | 'tel' | 'date' | 'time';
  label?: string;
  error?: string;
  icon?: string;
  disabled?: boolean;
  required?: boolean;
  fullWidth?: boolean;
  style?: CSSProperties;
  autoComplete?: string;
  name?: string;
}

export function Input({
  value,
  onChange,
  placeholder,
  type = 'text',
  label,
  error,
  icon,
  disabled = false,
  required = false,
  fullWidth = false,
  style,
  autoComplete,
  name,
}: InputProps) {
  // Auto-determine autocomplete based on type if not provided
  const resolvedAutoComplete = autoComplete ?? (
    type === 'password' ? 'current-password' :
    type === 'email' ? 'email' :
    type === 'tel' ? 'tel' :
    type === 'url' ? 'url' :
    'off'
  );
  return (
    <div 
      style={{ width: fullWidth ? '100%' : 'auto', ...style }}
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
    >
      {label && (
        <label
          style={{
            display: 'block',
            color: tokens.color.text,
            fontSize: 13,
            fontWeight: 500,
            marginBottom: 6,
          }}
        >
          {label}
          {required && <span style={{ color: tokens.color.error, marginLeft: 4 }}>*</span>}
        </label>
      )}
      <div style={{ position: 'relative' }}>
        {icon && (
          <i
            className={icon}
            style={{
              position: 'absolute',
              left: 12,
              top: '50%',
              transform: 'translateY(-50%)',
              color: tokens.color.muted,
              fontSize: 16,
            }}
          />
        )}
        <input
          type={type}
          name={name}
          autoComplete={resolvedAutoComplete}
          value={value ?? ''}
          onChange={(e) => {
            e.stopPropagation();
            onChange(e.target.value);
          }}
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          onKeyDown={(e) => {
            e.stopPropagation();
            // Prevent Enter key from submitting form
            if (e.key === 'Enter') {
              e.preventDefault();
            }
          }}
          onKeyUp={(e) => e.stopPropagation()}
          onKeyPress={(e) => e.stopPropagation()}
          onInput={(e) => e.stopPropagation()}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          style={{
            width: '100%',
            padding: icon ? '10px 14px 10px 40px' : '10px 14px',
            background: tokens.color.background,
            border: `1px solid ${error ? tokens.color.error : tokens.color.border}`,
            borderRadius: tokens.radius.md,
            color: tokens.color.text,
            fontSize: 14,
            fontWeight: 400,
            outline: 'none',
            transition: 'border-color 0.15s ease',
          }}
          onFocus={(e) => {
            if (!error) {
              e.target.style.borderColor = tokens.color.primary;
            }
          }}
          onBlur={(e) => {
            if (!error) {
              e.target.style.borderColor = tokens.color.border;
            }
          }}
        />
      </div>
      {error && (
        <div style={{ color: tokens.color.error, fontSize: 12, marginTop: 4 }}>
          <i className="ri-error-warning-line" style={{ marginRight: 4 }} />
          {error}
        </div>
      )}
    </div>
  );
}

interface TextAreaProps {
  value: string | number;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  disabled?: boolean;
  required?: boolean;
  rows?: number;
  fullWidth?: boolean;
  style?: CSSProperties;
}

export function TextArea({
  value,
  onChange,
  placeholder,
  label,
  error,
  disabled = false,
  required = false,
  rows = 4,
  fullWidth = false,
  style,
}: TextAreaProps) {
  return (
    <div 
      style={{ width: fullWidth ? '100%' : 'auto', ...style }}
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
    >
      {label && (
        <label
          style={{
            display: 'block',
            color: tokens.color.text,
            fontSize: 13,
            fontWeight: 500,
            marginBottom: 6,
          }}
        >
          {label}
          {required && <span style={{ color: tokens.color.error, marginLeft: 4 }}>*</span>}
        </label>
      )}
      <textarea
        value={value ?? ''}
        onChange={(e) => {
          e.stopPropagation();
          onChange(e.target.value);
        }}
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
        onKeyUp={(e) => e.stopPropagation()}
        onKeyPress={(e) => e.stopPropagation()}
        onInput={(e) => e.stopPropagation()}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        rows={rows}
        style={{
          width: '100%',
          padding: '10px 14px',
          background: tokens.color.background,
          border: `1px solid ${error ? tokens.color.error : tokens.color.border}`,
          borderRadius: tokens.radius.md,
          color: tokens.color.text,
          fontSize: 14,
          fontWeight: 400,
          outline: 'none',
          resize: 'vertical',
          fontFamily: 'inherit',
          transition: 'border-color 0.15s ease',
        }}
        onFocus={(e) => {
          if (!error) {
            e.target.style.borderColor = tokens.color.primary;
          }
        }}
        onBlur={(e) => {
          if (!error) {
            e.target.style.borderColor = tokens.color.border;
          }
        }}
      />
      {error && (
        <div style={{ color: tokens.color.error, fontSize: 12, marginTop: 4 }}>
          <i className="ri-error-warning-line" style={{ marginRight: 4 }} />
          {error}
        </div>
      )}
    </div>
  );
}

