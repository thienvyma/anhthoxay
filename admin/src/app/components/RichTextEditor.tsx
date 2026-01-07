import { useState } from 'react';
import { motion } from 'framer-motion';
import DOMPurify, { Config } from 'dompurify';
import { tokens } from '../../theme';

// Configure DOMPurify for rich text preview
const DOMPURIFY_CONFIG: Config = {
  ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'a', 'code'],
  ALLOWED_ATTR: ['href', 'target', 'rel', 'style', 'class'],
};

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  rows?: number;
}

export function RichTextEditor({ value, onChange, label, placeholder, rows = 10 }: RichTextEditorProps) {
  const [showPreview, setShowPreview] = useState(true);

  const insertMarkdown = (before: string, after = '') => {
    const textarea = document.getElementById('rich-text-area') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    const newText = value.substring(0, start) + before + selectedText + after + value.substring(end);
    
    onChange(newText);
    
    // Restore focus and selection
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + before.length, end + before.length);
    }, 0);
  };

  const toolbar = [
    {
      icon: 'ri-bold',
      label: 'Bold',
      action: () => insertMarkdown('**', '**'),
    },
    {
      icon: 'ri-italic',
      label: 'Italic',
      action: () => insertMarkdown('_', '_'),
    },
    {
      icon: 'ri-code-line',
      label: 'Code',
      action: () => insertMarkdown('`', '`'),
    },
    {
      icon: 'ri-list-unordered',
      label: 'Bullet List',
      action: () => insertMarkdown('\n- ', ''),
    },
    {
      icon: 'ri-list-ordered',
      label: 'Numbered List',
      action: () => insertMarkdown('\n1. ', ''),
    },
    {
      icon: 'ri-link',
      label: 'Link',
      action: () => insertMarkdown('[', '](url)'),
    },
  ];

  const renderPreview = (markdown: string) => {
    // Simple markdown to HTML conversion
    let html = markdown;
    
    // Headers
    html = html.replace(/^### (.*$)/gim, '<h3 style="font-size: 20px; font-weight: 600; color: #e5e7eb; margin-bottom: 8px; margin-top: 16px;">$1</h3>');
    html = html.replace(/^## (.*$)/gim, '<h2 style="font-size: 24px; font-weight: 600; color: #e5e7eb; margin-bottom: 12px; margin-top: 24px;">$1</h2>');
    html = html.replace(/^# (.*$)/gim, '<h1 style="font-size: 30px; font-weight: 700; color: #f3f4f6; margin-bottom: 16px; margin-top: 32px;">$1</h1>');
    
    // Bold
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong style="font-weight: 600; color: #f3f4f6;">$1</strong>');
    
    // Italic
    html = html.replace(/_(.*?)_/g, '<em style="font-style: italic;">$1</em>');
    
    // Code
    html = html.replace(/`(.*?)`/g, '<code style="background: #1f2937; padding: 2px 6px; border-radius: 4px; font-size: 13px; color: #60a5fa;">$1</code>');
    
    // Links
    html = html.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" style="color: #60a5fa; text-decoration: underline;">$1</a>');
    
    // Lists
    html = html.replace(/^- (.*$)/gim, '<li style="margin-left: 16px;">$1</li>');
    html = html.replace(/^\d+\. (.*$)/gim, '<li style="margin-left: 16px;">$1</li>');
    html = html.replace(/(<li[\s\S]*<\/li>)/g, '<ul style="list-style: disc; margin: 8px 0;">$1</ul>');
    
    // Paragraphs
    html = html.split('\n\n').map(p => {
      if (!p.trim()) return '';
      if (p.startsWith('<h') || p.startsWith('<ul') || p.startsWith('<li')) return p;
      return `<p style="color: #d1d5db; margin-bottom: 12px;">${p}</p>`;
    }).join('\n');
    
    return html;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {label && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <label style={{ display: 'block', fontSize: 14, fontWeight: 500, color: tokens.color.text }}>
            {label}
          </label>
          <div style={{ fontSize: 12, color: tokens.color.muted }}>
            {value.length} characters
          </div>
        </div>
      )}
      
      {/* Toolbar */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: 4, 
        padding: 8,
        background: tokens.color.surfaceAlt,
        border: `1px solid ${tokens.color.border}`,
        borderRadius: `${tokens.radius.md} ${tokens.radius.md} 0 0`,
      }}>
        {toolbar.map((tool, idx) => {
          return (
            <motion.button
              key={idx}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                tool.action();
              }}
              title={tool.label}
              whileHover={{ scale: 1.1, background: tokens.color.surfaceHover }}
              whileTap={{ scale: 0.95 }}
              style={{
                padding: 8,
                background: 'transparent',
                border: 'none',
                borderRadius: tokens.radius.sm,
                color: tokens.color.muted,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              <i className={tool.icon} style={{ fontSize: 16 }} />
            </motion.button>
          );
        })}
        
        <div style={{ height: 24, width: 1, background: tokens.color.border, margin: '0 8px' }} />
        
        <div style={{ flex: 1 }} />
        
        <motion.button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setShowPreview(!showPreview);
          }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          style={{
            padding: '6px 12px',
            borderRadius: tokens.radius.md,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            transition: 'all 0.2s',
            fontSize: 13,
            fontWeight: 500,
            border: showPreview ? `1px solid ${tokens.color.primary}` : `1px solid ${tokens.color.border}`,
            background: showPreview 
              ? `${tokens.color.primary}15`
              : 'transparent',
            color: showPreview ? tokens.color.primary : tokens.color.muted,
            cursor: 'pointer',
          }}
        >
          <i className="ri-eye-line" style={{ fontSize: 16 }} />
          <span>{showPreview ? 'Hide' : 'Show'} Preview</span>
        </motion.button>
      </div>

      {/* Split View: Editor + Preview */}
      <div style={{ 
        border: `1px solid ${tokens.color.border}`,
        borderTop: 'none',
        borderRadius: `0 0 ${tokens.radius.md} ${tokens.radius.md}`,
        overflow: 'hidden',
        display: 'flex',
        minHeight: rows * 24 + 32,
      }}>
        {/* Editor Side */}
        <div style={{ 
          width: showPreview ? '50%' : '100%',
          display: 'flex',
          flexDirection: 'column',
          borderRight: showPreview ? `1px solid ${tokens.color.border}` : 'none',
        }}>
          <textarea
            id="rich-text-area"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
            onKeyUp={(e) => e.stopPropagation()}
            onKeyPress={(e) => e.stopPropagation()}
            onInput={(e) => e.stopPropagation()}
            placeholder={placeholder || 'Type here... Use markdown for formatting'}
            rows={rows}
            style={{
              flex: 1,
              width: '100%',
              background: tokens.color.surfaceAlt,
              padding: '12px 16px',
              color: tokens.color.text,
              border: 'none',
              outline: 'none',
              resize: 'none',
              fontFamily: 'ui-monospace, monospace',
              fontSize: 14,
              minHeight: rows * 24,
            }}
          />
          <div style={{ 
            padding: '8px 16px',
            background: tokens.color.overlay,
            borderTop: `1px solid ${tokens.color.border}`,
            fontSize: 12,
            color: tokens.color.muted,
          }}>
            <strong style={{ color: tokens.color.text }}>Markdown tips:</strong> **bold** _italic_ `code` [link](url) # Heading - List
          </div>
        </div>

        {/* Preview Side */}
        {showPreview && (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            style={{ 
              width: '50%',
              background: tokens.color.surfaceAlt,
              overflowY: 'auto',
            }}
          >
            <div style={{ 
              padding: '8px 16px',
              background: tokens.color.overlay,
              borderBottom: `1px solid ${tokens.color.border}`,
              fontSize: 11,
              color: tokens.color.muted,
              fontWeight: 500,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}>
              <i className="ri-eye-line" style={{ fontSize: 14 }} />
              Live Preview
            </div>
            <div
              style={{ 
                padding: 16,
                minHeight: rows * 24,
                lineHeight: 1.7,
              }}
              dangerouslySetInnerHTML={{ 
                __html: DOMPurify.sanitize(
                  renderPreview(value) || '<p style="color: #6b7280; font-style: italic;">Preview will appear here...</p>',
                  DOMPURIFY_CONFIG
                )
              }}
            />
          </motion.div>
        )}
      </div>
    </div>
  );
}

