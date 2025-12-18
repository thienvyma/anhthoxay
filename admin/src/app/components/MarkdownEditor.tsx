import { useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { tokens, resolveMediaUrl } from '@app/shared';

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: number;
  onImageUpload?: (file: File) => Promise<string>;
}

const TOOLBAR_BUTTONS = [
  { icon: 'ri-bold', action: 'bold', title: 'Bold (Ctrl+B)', wrap: ['**', '**'] },
  { icon: 'ri-italic', action: 'italic', title: 'Italic (Ctrl+I)', wrap: ['*', '*'] },
  { icon: 'ri-strikethrough', action: 'strike', title: 'Strikethrough', wrap: ['~~', '~~'] },
  { type: 'divider' },
  { icon: 'ri-h-1', action: 'h1', title: 'Heading 1', prefix: '# ' },
  { icon: 'ri-h-2', action: 'h2', title: 'Heading 2', prefix: '## ' },
  { icon: 'ri-h-3', action: 'h3', title: 'Heading 3', prefix: '### ' },
  { type: 'divider' },
  { icon: 'ri-list-unordered', action: 'ul', title: 'Bullet List', prefix: '- ' },
  { icon: 'ri-list-ordered', action: 'ol', title: 'Numbered List', prefix: '1. ' },
  { icon: 'ri-double-quotes-l', action: 'quote', title: 'Quote', prefix: '> ' },
  { type: 'divider' },
  { icon: 'ri-link', action: 'link', title: 'Link', wrap: ['[', '](url)'] },
  { icon: 'ri-image-line', action: 'image', title: 'Insert Image' },
  { icon: 'ri-code-line', action: 'code', title: 'Inline Code', wrap: ['`', '`'] },
  { icon: 'ri-code-box-line', action: 'codeblock', title: 'Code Block', wrap: ['```\n', '\n```'] },
];

export function MarkdownEditor({
  value,
  onChange,
  placeholder = 'Viết nội dung bài viết...',
  minHeight = 400,
  onImageUpload,
}: MarkdownEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const insertText = useCallback((before: string, after = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    const newText = value.substring(0, start) + before + selectedText + after + value.substring(end);
    
    onChange(newText);
    
    // Set cursor position
    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + before.length + selectedText.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  }, [value, onChange]);

  const insertPrefix = useCallback((prefix: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const lineStart = value.lastIndexOf('\n', start - 1) + 1;
    const newText = value.substring(0, lineStart) + prefix + value.substring(lineStart);
    
    onChange(newText);
    
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, start + prefix.length);
    }, 0);
  }, [value, onChange]);

  const handleToolbarClick = useCallback((button: typeof TOOLBAR_BUTTONS[0]) => {
    if ('wrap' in button && button.wrap) {
      insertText(button.wrap[0], button.wrap[1]);
    } else if ('prefix' in button && button.prefix) {
      insertPrefix(button.prefix);
    } else if (button.action === 'image') {
      fileInputRef.current?.click();
    }
  }, [insertText, insertPrefix]);

  const handleImageUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !onImageUpload) return;

    try {
      setIsUploading(true);
      const imageUrl = await onImageUpload(file);
      insertText(`![${file.name}](${imageUrl})\n`);
    } catch (error) {
      console.error('Failed to upload image:', error);
      alert('Upload ảnh thất bại');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }, [onImageUpload, insertText]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.ctrlKey || e.metaKey) {
      if (e.key === 'b') {
        e.preventDefault();
        insertText('**', '**');
      } else if (e.key === 'i') {
        e.preventDefault();
        insertText('*', '*');
      }
    }
  }, [insertText]);

  return (
    <div style={{
      border: `1px solid ${tokens.color.border}`,
      borderRadius: '16px',
      overflow: 'hidden',
      background: 'rgba(12,12,16,0.6)',
    }}>
      {/* Toolbar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        padding: '12px 16px',
        borderBottom: `1px solid ${tokens.color.border}`,
        background: 'rgba(0,0,0,0.2)',
        flexWrap: 'wrap',
      }}>
        {TOOLBAR_BUTTONS.map((button, index) => {
          if (button.type === 'divider') {
            return (
              <div
                key={`divider-${index}`}
                style={{
                  width: '1px',
                  height: '24px',
                  background: tokens.color.border,
                  margin: '0 8px',
                }}
              />
            );
          }

          return (
            <motion.button
              key={button.action}
              type="button"
              whileHover={{ scale: 1.1, background: 'rgba(245,211,147,0.15)' }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleToolbarClick(button)}
              disabled={isUploading && button.action === 'image'}
              title={button.title}
              style={{
                width: '36px',
                height: '36px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'rgba(255,255,255,0.05)',
                border: 'none',
                borderRadius: '8px',
                color: tokens.color.muted,
                cursor: 'pointer',
                fontSize: '18px',
                transition: 'all 0.2s',
              }}
            >
              {isUploading && button.action === 'image' ? (
                <i className="ri-loader-4-line" style={{ animation: 'spin 1s linear infinite' }} />
              ) : (
                <i className={button.icon} />
              )}
            </motion.button>
          );
        })}

        {/* Preview Toggle */}
        <div style={{ marginLeft: 'auto' }}>
          <motion.button
            type="button"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowPreview(!showPreview)}
            style={{
              padding: '8px 16px',
              background: showPreview ? tokens.color.primary : 'rgba(255,255,255,0.05)',
              border: 'none',
              borderRadius: '8px',
              color: showPreview ? '#111' : tokens.color.muted,
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <i className={showPreview ? 'ri-edit-line' : 'ri-eye-line'} />
            {showPreview ? 'Edit' : 'Preview'}
          </motion.button>
        </div>
      </div>

      {/* Editor / Preview */}
      {showPreview ? (
        <div
          style={{
            minHeight,
            padding: '20px',
            color: tokens.color.text,
            fontSize: '14px',
            lineHeight: 1.7,
            overflow: 'auto',
          }}
          dangerouslySetInnerHTML={{
            __html: simpleMarkdownToHtml(value) || '<p style="color: #666;">Chưa có nội dung...</p>'
          }}
        />
      ) : (
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          style={{
            width: '100%',
            minHeight,
            padding: '20px',
            background: 'transparent',
            border: 'none',
            color: tokens.color.text,
            fontSize: '14px',
            fontFamily: tokens.font.mono,
            lineHeight: 1.7,
            resize: 'vertical',
            outline: 'none',
          }}
        />
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageUpload}
        style={{ display: 'none' }}
      />

      {/* Help text */}
      <div style={{
        padding: '12px 16px',
        borderTop: `1px solid ${tokens.color.border}`,
        background: 'rgba(0,0,0,0.2)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        fontSize: '12px',
        color: tokens.color.muted,
      }}>
        <span>
          <i className="ri-markdown-line" style={{ marginRight: '6px' }} />
          Hỗ trợ Markdown
        </span>
        <span>
          {value.length} ký tự
        </span>
      </div>
    </div>
  );
}

// Helper to resolve image URLs
// Use shared resolveMediaUrl from @app/shared
function resolveImageUrl(url: string): string {
  return resolveMediaUrl(url);
}

// Simple markdown to HTML converter for preview
function simpleMarkdownToHtml(markdown: string): string {
  if (!markdown) return '';
  
  const html = markdown
    // Escape HTML (but not for image/link syntax)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    // Headers
    .replace(/^### (.+)$/gm, '<h3 style="color: white; margin: 16px 0 8px;">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 style="color: white; margin: 20px 0 10px;">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 style="color: white; margin: 24px 0 12px;">$1</h1>')
    // Bold & Italic
    .replace(/\*\*(.+?)\*\*/g, '<strong style="color: white;">$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/~~(.+?)~~/g, '<del>$1</del>')
    // Code
    .replace(/`([^`]+)`/g, '<code style="background: rgba(245,211,147,0.15); padding: 2px 6px; border-radius: 4px; color: #f5d393;">$1</code>')
    // Images - process before links to avoid conflict
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (_, alt, url) => {
      const resolvedUrl = resolveImageUrl(url);
      return `<img src="${resolvedUrl}" alt="${alt}" style="max-width: 100%; border-radius: 8px; margin: 16px 0;" />`;
    })
    // Links
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" style="color: #f5d393;">$1</a>')
    // Lists
    .replace(/^- (.+)$/gm, '<li style="margin-left: 20px;">$1</li>')
    .replace(/^\d+\. (.+)$/gm, '<li style="margin-left: 20px;">$1</li>')
    // Blockquote
    .replace(/^> (.+)$/gm, '<blockquote style="border-left: 3px solid #f5d393; padding-left: 16px; margin: 16px 0; color: rgba(255,255,255,0.8); font-style: italic;">$1</blockquote>')
    // Paragraphs
    .replace(/\n\n/g, '</p><p style="margin: 12px 0;">')
    .replace(/\n/g, '<br />');

  return `<p style="margin: 12px 0;">${html}</p>`;
}
