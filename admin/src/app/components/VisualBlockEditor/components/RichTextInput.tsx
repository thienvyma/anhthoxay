import { useState, useCallback } from 'react';
import { tokens } from '../../../../theme';
import { Button } from '../../Button';
import { Input } from '../../Input';

interface RichTextInputProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
}

export function RichTextInput({ label, value, onChange }: RichTextInputProps) {
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkText, setLinkText] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  
  const textareaRef = useCallback(
    (node: HTMLTextAreaElement | null) => {
      if (node) {
        node.style.height = 'auto';
        node.style.height = Math.max(100, node.scrollHeight) + 'px';
      }
    },
    [value]
  );

  const wrapSelection = (prefix: string, suffix: string) => {
    const textarea = document.querySelector(`textarea[data-rich-input="${label}"]`) as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);

    if (selectedText) {
      const newValue = value.substring(0, start) + prefix + selectedText + suffix + value.substring(end);
      onChange(newValue);
    }
  };

  const insertLink = () => {
    if (linkText && linkUrl) {
      const linkHtml = `<a href="${linkUrl}">${linkText}</a>`;
      const textarea = document.querySelector(`textarea[data-rich-input="${label}"]`) as HTMLTextAreaElement;
      if (textarea) {
        const start = textarea.selectionStart;
        const newValue = value.substring(0, start) + linkHtml + value.substring(start);
        onChange(newValue);
      }
      setShowLinkModal(false);
      setLinkText('');
      setLinkUrl('');
    }
  };

  return (
    <div>
      <label style={{ display: 'block', marginBottom: 6, color: tokens.color.text, fontSize: 13, fontWeight: 500 }}>
        {label}
      </label>
      
      {/* Formatting Toolbar */}
      <div style={{
        display: 'flex',
        gap: 4,
        padding: 8,
        background: tokens.color.surfaceAlt,
        borderRadius: `${tokens.radius.sm} ${tokens.radius.sm} 0 0`,
        border: `1px solid ${tokens.color.border}`,
        borderBottom: 'none',
        flexWrap: 'wrap',
      }}>
        <button type="button" onClick={() => wrapSelection('<strong>', '</strong>')} title="In đậm (Ctrl+B)"
          style={{ padding: '4px 8px', background: tokens.color.surfaceHover, border: `1px solid ${tokens.color.border}`, borderRadius: tokens.radius.sm, color: tokens.color.text, cursor: 'pointer', fontSize: 13, fontWeight: 700 }}>
          B
        </button>
        <button type="button" onClick={() => wrapSelection('<em>', '</em>')} title="In nghiêng (Ctrl+I)"
          style={{ padding: '4px 8px', background: tokens.color.surfaceHover, border: `1px solid ${tokens.color.border}`, borderRadius: tokens.radius.sm, color: tokens.color.text, cursor: 'pointer', fontSize: 13, fontStyle: 'italic' }}>
          I
        </button>
        <button type="button" onClick={() => wrapSelection('<u>', '</u>')} title="Gạch chân"
          style={{ padding: '4px 8px', background: tokens.color.surfaceHover, border: `1px solid ${tokens.color.border}`, borderRadius: tokens.radius.sm, color: tokens.color.text, cursor: 'pointer', fontSize: 13, textDecoration: 'underline' }}>
          U
        </button>
        
        <div style={{ width: 1, background: tokens.color.border, margin: '0 4px' }} />
        
        <button type="button" onClick={() => setShowLinkModal(true)} title="Chèn link"
          style={{ padding: '4px 8px', background: tokens.color.surfaceHover, border: `1px solid ${tokens.color.border}`, borderRadius: tokens.radius.sm, color: tokens.color.text, cursor: 'pointer', fontSize: 13, display: 'flex', alignItems: 'center', gap: 4 }}>
          <i className="ri-link" style={{ fontSize: 14 }} />
          Link
        </button>

        <div style={{ width: 1, background: tokens.color.border, margin: '0 4px' }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <input
            type="color"
            defaultValue="#F5D393"
            onChange={(e) => wrapSelection(`<span style="color:${e.target.value}">`, '</span>')}
            title="Chọn màu chữ"
            style={{ width: 28, height: 24, padding: 0, border: `1px solid ${tokens.color.border}`, borderRadius: tokens.radius.sm, cursor: 'pointer', background: 'transparent' }}
          />
          <span style={{ fontSize: 11, color: tokens.color.muted }}>Màu</span>
        </div>
        
        <button type="button" onClick={() => wrapSelection('<mark>', '</mark>')} title="Highlight"
          style={{ padding: '4px 8px', background: tokens.color.surfaceHover, border: `1px solid ${tokens.color.border}`, borderRadius: tokens.radius.sm, color: tokens.color.text, cursor: 'pointer', fontSize: 13, display: 'flex', alignItems: 'center', gap: 4 }}>
          <i className="ri-mark-pen-line" style={{ fontSize: 14 }} />
        </button>
      </div>
      
      <textarea
        ref={textareaRef}
        data-rich-input={label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: '100%',
          minHeight: 100,
          padding: 12,
          borderRadius: `0 0 ${tokens.radius.sm} ${tokens.radius.sm}`,
          border: `1px solid ${tokens.color.border}`,
          background: tokens.color.background,
          color: tokens.color.text,
          fontSize: 14,
          lineHeight: 1.6,
          resize: 'vertical',
          outline: 'none',
          fontFamily: 'inherit',
        }}
        placeholder="Nhập nội dung... Có thể dùng HTML tags như <strong>, <em>, <a href='...'>"
      />
      
      <p style={{ marginTop: 6, fontSize: 11, color: tokens.color.muted }}>
        💡 Chọn text rồi click nút để format. Hỗ trợ HTML: &lt;strong&gt;, &lt;em&gt;, &lt;a href="..."&gt;, &lt;span style="color:..."&gt;
      </p>
      
      {/* Link Modal */}
      {showLinkModal && (
        <>
          <div onClick={() => setShowLinkModal(false)} style={{ position: 'fixed', inset: 0, background: tokens.color.overlay, zIndex: 9998 }} />
          <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 'min(400px, 90vw)', background: tokens.color.surface, border: `1px solid ${tokens.color.border}`, borderRadius: tokens.radius.lg, padding: 20, zIndex: 9999 }}>
            <h4 style={{ margin: '0 0 16px', color: tokens.color.text, fontSize: 16 }}>
              <i className="ri-link" style={{ marginRight: 8 }} />
              Chèn Link
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <Input label="Văn bản hiển thị" value={linkText} onChange={setLinkText} placeholder="Ví dụ: Click vào đây" fullWidth />
              <Input label="URL" value={linkUrl} onChange={setLinkUrl} placeholder="https://example.com" fullWidth />
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
                <Button variant="secondary" size="small" onClick={() => setShowLinkModal(false)}>Hủy</Button>
                <Button variant="primary" size="small" onClick={insertLink} disabled={!linkText || !linkUrl}>Chèn</Button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
