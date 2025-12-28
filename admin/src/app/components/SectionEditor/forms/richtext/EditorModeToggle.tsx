/**
 * EditorModeToggle Component
 * Toggle between Visual and Markdown editor modes
 * Requirements: 4.5
 */

import { tokens } from '@app/shared';

interface EditorModeToggleProps {
  mode: 'visual' | 'markdown';
  onChange: (mode: 'visual' | 'markdown') => void;
}

export function EditorModeToggle({ mode, onChange }: EditorModeToggleProps) {
  return (
    <div style={{ 
      display: 'flex', 
      alignItems: 'center', 
      gap: 8, 
      padding: 12, 
      background: 'rgba(167, 139, 250, 0.1)', 
      border: '1px solid rgba(167, 139, 250, 0.3)', 
      borderRadius: tokens.radius.md 
    }}>
      <i className="ri-tools-line" style={{ color: '#a78bfa', fontSize: 18 }} />
      <span style={{ color: tokens.color.text, fontSize: 14, fontWeight: 500, marginRight: 'auto' }}>
        Chế độ soạn thảo:
      </span>
      <div style={{ 
        display: 'flex', 
        gap: 4, 
        background: 'rgba(0,0,0,0.2)', 
        borderRadius: tokens.radius.md, 
        padding: 4 
      }}>
        {(['visual', 'markdown'] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => onChange(m)}
            style={{
              padding: '6px 14px',
              fontSize: 13,
              fontWeight: 500,
              background: mode === m ? tokens.color.primary : 'transparent',
              color: mode === m ? '#111' : tokens.color.muted,
              border: 'none',
              borderRadius: tokens.radius.sm,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <i className={m === 'visual' ? 'ri-drag-drop-line' : 'ri-markdown-line'} />
            {m === 'visual' ? 'Visual' : 'Markdown'}
          </button>
        ))}
      </div>
    </div>
  );
}
