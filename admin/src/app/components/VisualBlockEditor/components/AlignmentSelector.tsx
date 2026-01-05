import { tokens } from '../../../../theme';

interface AlignmentSelectorProps {
  value?: string;
  onChange: (v: string) => void;
}

export function AlignmentSelector({ value, onChange }: AlignmentSelectorProps) {
  const currentAlign = value || 'left';
  return (
    <div>
      <label style={{ display: 'block', marginBottom: 6, color: tokens.color.text, fontSize: 13, fontWeight: 500 }}>
        Căn chỉnh
      </label>
      <div style={{ display: 'flex', gap: 4 }}>
        {[
          { value: 'left', icon: 'ri-align-left', label: 'Trái' },
          { value: 'center', icon: 'ri-align-center', label: 'Giữa' },
          { value: 'right', icon: 'ri-align-right', label: 'Phải' },
        ].map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            title={opt.label}
            style={{
              padding: '6px 12px',
              background: currentAlign === opt.value ? tokens.color.primary : tokens.color.surfaceHover,
              color: currentAlign === opt.value ? '#111' : tokens.color.text,
              border: `1px solid ${currentAlign === opt.value ? tokens.color.primary : tokens.color.border}`,
              borderRadius: tokens.radius.sm,
              cursor: 'pointer',
              fontSize: 14,
            }}
          >
            <i className={opt.icon} />
          </button>
        ))}
      </div>
    </div>
  );
}
