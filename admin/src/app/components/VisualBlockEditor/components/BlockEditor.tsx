import { tokens } from '../../../../theme';
import { Input, TextArea } from '../../Input';
import { ImageDropzone } from '../../ImageDropzone';
import type { Block } from '../types';
import { RichTextInput } from './RichTextInput';
import { AlignmentSelector } from './AlignmentSelector';

interface BlockEditorProps {
  block: Block;
  onUpdate: (data: Record<string, unknown>) => void;
}

export function BlockEditor({ block, onUpdate }: BlockEditorProps) {
  const { type, data } = block;

  switch (type) {
    case 'heading':
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Input label="Nội dung tiêu đề" value={(data.text as string) || ''} onChange={(v) => onUpdate({ text: v })} fullWidth />
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <div>
              <label style={{ display: 'block', marginBottom: 6, color: tokens.color.text, fontSize: 13, fontWeight: 500 }}>Cấp độ</label>
              <div style={{ display: 'flex', gap: 8 }}>
                {[1, 2, 3].map((level) => (
                  <button key={level} type="button" onClick={() => onUpdate({ level })}
                    style={{ padding: '6px 16px', background: data.level === level ? tokens.color.primary : tokens.color.surfaceHover, color: data.level === level ? '#111' : tokens.color.text, border: `1px solid ${data.level === level ? tokens.color.primary : tokens.color.border}`, borderRadius: tokens.radius.sm, cursor: 'pointer', fontSize: 14 - level, fontWeight: 600 }}>
                    H{level}
                  </button>
                ))}
              </div>
            </div>
            <AlignmentSelector value={data.align as string} onChange={(v) => onUpdate({ align: v })} />
          </div>
        </div>
      );

    case 'paragraph':
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <RichTextInput label="Nội dung" value={(data.text as string) || ''} onChange={(v) => onUpdate({ text: v })} />
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <AlignmentSelector value={data.align as string} onChange={(v) => onUpdate({ align: v })} />
            <ColorPicker label="Màu nền" value={(data.backgroundColor as string) || '#ffffff'} defaultValue="#ffffff" onChange={(v) => onUpdate({ backgroundColor: v === '#ffffff' ? undefined : v })} onClear={() => onUpdate({ backgroundColor: undefined })} />
            <ColorPicker label="Màu chữ" value={(data.textColor as string) || '#374151'} defaultValue="#374151" onChange={(v) => onUpdate({ textColor: v === '#374151' ? undefined : v })} onClear={() => onUpdate({ textColor: undefined })} />
          </div>
        </div>
      );

    case 'list':
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" onClick={() => onUpdate({ ordered: false })}
              style={{ padding: '6px 12px', background: !data.ordered ? tokens.color.primary : tokens.color.surfaceHover, color: !data.ordered ? '#111' : tokens.color.text, border: `1px solid ${!data.ordered ? tokens.color.primary : tokens.color.border}`, borderRadius: tokens.radius.sm, cursor: 'pointer', fontSize: 13 }}>
              <i className="ri-list-unordered" style={{ marginRight: 6 }} />Bullet
            </button>
            <button type="button" onClick={() => onUpdate({ ordered: true })}
              style={{ padding: '6px 12px', background: data.ordered ? tokens.color.primary : tokens.color.surfaceHover, color: data.ordered ? '#111' : tokens.color.text, border: `1px solid ${data.ordered ? tokens.color.primary : tokens.color.border}`, borderRadius: tokens.radius.sm, cursor: 'pointer', fontSize: 13 }}>
              <i className="ri-list-ordered" style={{ marginRight: 6 }} />Số
            </button>
          </div>
          <TextArea label="Các mục (mỗi dòng 1 mục)" value={((data.items as string[]) || []).join('\n')} onChange={(v) => onUpdate({ items: v.split('\n').filter(Boolean) })} rows={4} fullWidth />
        </div>
      );

    case 'quote':
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <TextArea label="Nội dung trích dẫn" value={(data.text as string) || ''} onChange={(v) => onUpdate({ text: v })} rows={3} fullWidth />
          <Input label="Tác giả (tùy chọn)" value={(data.author as string) || ''} onChange={(v) => onUpdate({ author: v })} fullWidth />
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <ColorPicker label="Màu glass" value={(data.glassColor as string) || '#F5D393'} defaultValue="#F5D393" onChange={(v) => onUpdate({ glassColor: v })} onReset={() => onUpdate({ glassColor: '#F5D393' })} />
            <ColorPicker label="Màu chữ" value={(data.textColor as string) || '#4b5563'} defaultValue="#4b5563" onChange={(v) => onUpdate({ textColor: v === '#4b5563' ? undefined : v })} onClear={() => onUpdate({ textColor: undefined })} />
          </div>
        </div>
      );

    case 'image':
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <ImageDropzone value={(data.url as string) || ''} onChange={(url) => onUpdate({ url })} onRemove={() => onUpdate({ url: '' })} height={150} />
          <Input label="Alt text" value={(data.alt as string) || ''} onChange={(v) => onUpdate({ alt: v })} placeholder="Mô tả hình ảnh" fullWidth />
          <Input label="Caption (tùy chọn)" value={(data.caption as string) || ''} onChange={(v) => onUpdate({ caption: v })} fullWidth />
        </div>
      );

    case 'callout':
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <label style={{ display: 'block', marginBottom: 6, color: tokens.color.text, fontSize: 13, fontWeight: 500 }}>Loại</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {[
                { value: 'info', label: 'Thông tin', color: '#3B82F6', icon: 'ri-information-line' },
                { value: 'success', label: 'Thành công', color: '#10B981', icon: 'ri-checkbox-circle-line' },
                { value: 'warning', label: 'Cảnh báo', color: '#F59E0B', icon: 'ri-alert-line' },
                { value: 'error', label: 'Lỗi', color: '#EF4444', icon: 'ri-error-warning-line' },
              ].map((opt) => (
                <button key={opt.value} type="button" onClick={() => onUpdate({ type: opt.value, icon: opt.icon })}
                  style={{ padding: '6px 12px', background: data.type === opt.value ? `${opt.color}20` : tokens.color.surfaceHover, color: data.type === opt.value ? opt.color : tokens.color.text, border: `1px solid ${data.type === opt.value ? opt.color : tokens.color.border}`, borderRadius: tokens.radius.sm, cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <i className={opt.icon} />{opt.label}
                </button>
              ))}
            </div>
          </div>
          <TextArea label="Nội dung" value={(data.text as string) || ''} onChange={(v) => onUpdate({ text: v })} rows={3} fullWidth />
        </div>
      );

    case 'divider':
      return (
        <div>
          <label style={{ display: 'block', marginBottom: 6, color: tokens.color.text, fontSize: 13, fontWeight: 500 }}>Kiểu đường kẻ</label>
          <div style={{ display: 'flex', gap: 8 }}>
            {['solid', 'dashed', 'dotted'].map((style) => (
              <button key={style} type="button" onClick={() => onUpdate({ style })}
                style={{ padding: '8px 16px', background: data.style === style ? tokens.color.primary : tokens.color.surfaceHover, color: data.style === style ? '#111' : tokens.color.text, border: `1px solid ${data.style === style ? tokens.color.primary : tokens.color.border}`, borderRadius: tokens.radius.sm, cursor: 'pointer', fontSize: 13, textTransform: 'capitalize' }}>
                {style}
              </button>
            ))}
          </div>
        </div>
      );

    case 'columns':
      return (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <TextArea label="Cột trái" value={(data.left as string) || ''} onChange={(v) => onUpdate({ left: v })} rows={4} fullWidth />
          <TextArea label="Cột phải" value={(data.right as string) || ''} onChange={(v) => onUpdate({ right: v })} rows={4} fullWidth />
        </div>
      );

    default:
      return <p style={{ color: tokens.color.muted }}>Editor chưa hỗ trợ block này</p>;
  }
}

// Helper component for color picker
function ColorPicker({ label, value, defaultValue, onChange, onClear, onReset }: {
  label: string;
  value: string;
  defaultValue: string;
  onChange: (v: string) => void;
  onClear?: () => void;
  onReset?: () => void;
}) {
  const showClear = onClear && value !== defaultValue;
  return (
    <div>
      <label style={{ display: 'block', marginBottom: 6, color: tokens.color.text, fontSize: 13, fontWeight: 500 }}>{label}</label>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <input type="color" value={value} onChange={(e) => onChange(e.target.value)}
          style={{ width: 36, height: 28, padding: 0, border: `1px solid ${tokens.color.border}`, borderRadius: tokens.radius.sm, cursor: 'pointer', background: 'transparent' }} />
        <span style={{ fontSize: 11, color: tokens.color.muted }}>{value === defaultValue ? (onClear ? 'Không' : defaultValue) : value}</span>
        {showClear && (
          <button type="button" onClick={onClear}
            style={{ padding: '2px 6px', fontSize: 10, background: tokens.color.surfaceHover, border: `1px solid ${tokens.color.border}`, borderRadius: tokens.radius.sm, color: tokens.color.muted, cursor: 'pointer' }}>
            Xóa
          </button>
        )}
        {onReset && (
          <button type="button" onClick={onReset}
            style={{ padding: '2px 6px', fontSize: 10, background: tokens.color.surfaceHover, border: `1px solid ${tokens.color.border}`, borderRadius: tokens.radius.sm, color: tokens.color.muted, cursor: 'pointer' }}>
            Reset
          </button>
        )}
      </div>
    </div>
  );
}
