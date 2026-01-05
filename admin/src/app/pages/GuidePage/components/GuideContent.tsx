/**
 * GuideContent - Reusable components for rendering guide content
 *
 * Provides styled components for headings, lists, info boxes, warning boxes,
 * images, and code blocks used throughout the guide pages.
 *
 * **Feature: admin-guide-api-keys**
 * **Requirements: 1.4**
 */

import { ReactNode, CSSProperties } from 'react';
import { tokens } from '../../../../theme';

// ============================================================================
// Section Component - Main content wrapper
// ============================================================================

interface SectionProps {
  children: ReactNode;
  style?: CSSProperties;
}

export function Section({ children, style }: SectionProps) {
  return (
    <div
      style={{
        marginBottom: 32,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

// ============================================================================
// Heading Components
// ============================================================================

interface HeadingProps {
  children: ReactNode;
  icon?: string;
  style?: CSSProperties;
}

export function Heading1({ children, icon, style }: HeadingProps) {
  return (
    <h2
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        fontSize: 22,
        fontWeight: 600,
        color: tokens.color.text,
        margin: '0 0 16px 0',
        paddingBottom: 12,
        borderBottom: `1px solid ${tokens.color.border}`,
        ...style,
      }}
    >
      {icon && <i className={icon} style={{ color: tokens.color.primary }} />}
      {children}
    </h2>
  );
}

export function Heading2({ children, icon, style }: HeadingProps) {
  return (
    <h3
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        fontSize: 18,
        fontWeight: 600,
        color: tokens.color.text,
        margin: '24px 0 12px 0',
        ...style,
      }}
    >
      {icon && <i className={icon} style={{ color: tokens.color.accent }} />}
      {children}
    </h3>
  );
}

export function Heading3({ children, icon, style }: HeadingProps) {
  return (
    <h4
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        fontSize: 16,
        fontWeight: 600,
        color: tokens.color.text,
        margin: '16px 0 8px 0',
        ...style,
      }}
    >
      {icon && <i className={icon} style={{ color: tokens.color.muted }} />}
      {children}
    </h4>
  );
}

// ============================================================================
// Paragraph Component
// ============================================================================

interface ParagraphProps {
  children: ReactNode;
  style?: CSSProperties;
}

export function Paragraph({ children, style }: ParagraphProps) {
  return (
    <p
      style={{
        fontSize: 15,
        lineHeight: 1.7,
        color: tokens.color.textMuted,
        margin: '0 0 16px 0',
        ...style,
      }}
    >
      {children}
    </p>
  );
}

// ============================================================================
// List Components
// ============================================================================

interface ListProps {
  children: ReactNode;
  ordered?: boolean;
  style?: CSSProperties;
}

export function List({ children, ordered = false, style }: ListProps) {
  const Tag = ordered ? 'ol' : 'ul';
  return (
    <Tag
      style={{
        margin: '0 0 16px 0',
        paddingLeft: 24,
        color: tokens.color.textMuted,
        fontSize: 15,
        lineHeight: 1.8,
        ...style,
      }}
    >
      {children}
    </Tag>
  );
}

interface ListItemProps {
  children: ReactNode;
  icon?: string;
  style?: CSSProperties;
}

export function ListItem({ children, icon, style }: ListItemProps) {
  if (icon) {
    return (
      <li
        style={{
          listStyle: 'none',
          display: 'flex',
          alignItems: 'flex-start',
          gap: 10,
          marginBottom: 8,
          marginLeft: -24,
          ...style,
        }}
      >
        <i className={icon} style={{ color: tokens.color.primary, marginTop: 4, fontSize: 14 }} />
        <span>{children}</span>
      </li>
    );
  }
  return (
    <li style={{ marginBottom: 8, ...style }}>
      {children}
    </li>
  );
}

// ============================================================================
// Info Box Component
// ============================================================================

interface InfoBoxProps {
  children: ReactNode;
  title?: string;
  icon?: string;
  style?: CSSProperties;
}

export function InfoBox({ children, title, icon = 'ri-information-line', style }: InfoBoxProps) {
  return (
    <div
      style={{
        padding: 16,
        background: `${tokens.color.info}10`,
        border: `1px solid ${tokens.color.info}30`,
        borderRadius: tokens.radius.md,
        marginBottom: 16,
        ...style,
      }}
    >
      {title && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            marginBottom: 8,
            fontWeight: 600,
            color: tokens.color.info,
            fontSize: 14,
          }}
        >
          <i className={icon} />
          {title}
        </div>
      )}
      <div style={{ color: tokens.color.textMuted, fontSize: 14, lineHeight: 1.6 }}>
        {children}
      </div>
    </div>
  );
}

// ============================================================================
// Warning Box Component
// ============================================================================

interface WarningBoxProps {
  children: ReactNode;
  title?: string;
  icon?: string;
  style?: CSSProperties;
}

export function WarningBox({ children, title, icon = 'ri-alert-line', style }: WarningBoxProps) {
  return (
    <div
      style={{
        padding: 16,
        background: `${tokens.color.warning}10`,
        border: `1px solid ${tokens.color.warning}30`,
        borderRadius: tokens.radius.md,
        marginBottom: 16,
        ...style,
      }}
    >
      {title && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            marginBottom: 8,
            fontWeight: 600,
            color: tokens.color.warning,
            fontSize: 14,
          }}
        >
          <i className={icon} />
          {title}
        </div>
      )}
      <div style={{ color: tokens.color.textMuted, fontSize: 14, lineHeight: 1.6 }}>
        {children}
      </div>
    </div>
  );
}

// ============================================================================
// Success Box Component
// ============================================================================

interface SuccessBoxProps {
  children: ReactNode;
  title?: string;
  icon?: string;
  style?: CSSProperties;
}

export function SuccessBox({ children, title, icon = 'ri-checkbox-circle-line', style }: SuccessBoxProps) {
  return (
    <div
      style={{
        padding: 16,
        background: `${tokens.color.success}10`,
        border: `1px solid ${tokens.color.success}30`,
        borderRadius: tokens.radius.md,
        marginBottom: 16,
        ...style,
      }}
    >
      {title && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            marginBottom: 8,
            fontWeight: 600,
            color: tokens.color.success,
            fontSize: 14,
          }}
        >
          <i className={icon} />
          {title}
        </div>
      )}
      <div style={{ color: tokens.color.textMuted, fontSize: 14, lineHeight: 1.6 }}>
        {children}
      </div>
    </div>
  );
}

// ============================================================================
// Code Block Component
// ============================================================================

interface CodeBlockProps {
  children: string;
  language?: string;
  title?: string;
  style?: CSSProperties;
}

export function CodeBlock({ children, language, title, style }: CodeBlockProps) {
  return (
    <div
      style={{
        marginBottom: 16,
        borderRadius: tokens.radius.md,
        overflow: 'hidden',
        border: `1px solid ${tokens.color.border}`,
        ...style,
      }}
    >
      {title && (
        <div
          style={{
            padding: '8px 16px',
            background: tokens.color.surfaceHover,
            borderBottom: `1px solid ${tokens.color.border}`,
            fontSize: 12,
            fontWeight: 500,
            color: tokens.color.muted,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <i className="ri-code-line" />
          {title}
          {language && (
            <span
              style={{
                marginLeft: 'auto',
                padding: '2px 8px',
                background: tokens.color.surface,
                borderRadius: tokens.radius.sm,
                fontSize: 10,
                textTransform: 'uppercase',
              }}
            >
              {language}
            </span>
          )}
        </div>
      )}
      <pre
        style={{
          margin: 0,
          padding: 16,
          background: tokens.color.surface,
          overflow: 'auto',
          fontSize: 13,
          lineHeight: 1.6,
          color: tokens.color.text,
          fontFamily: 'monospace',
        }}
      >
        <code>{children}</code>
      </pre>
    </div>
  );
}

// ============================================================================
// Inline Code Component
// ============================================================================

interface InlineCodeProps {
  children: ReactNode;
  style?: CSSProperties;
}

export function InlineCode({ children, style }: InlineCodeProps) {
  return (
    <code
      style={{
        padding: '2px 6px',
        background: tokens.color.surface,
        border: `1px solid ${tokens.color.border}`,
        borderRadius: tokens.radius.sm,
        fontSize: 13,
        fontFamily: 'monospace',
        color: tokens.color.primary,
        ...style,
      }}
    >
      {children}
    </code>
  );
}

// ============================================================================
// Image Component
// ============================================================================

interface ImageProps {
  src: string;
  alt: string;
  caption?: string;
  style?: CSSProperties;
}

export function Image({ src, alt, caption, style }: ImageProps) {
  return (
    <figure
      style={{
        margin: '16px 0',
        ...style,
      }}
    >
      <img
        src={src}
        alt={alt}
        style={{
          maxWidth: '100%',
          borderRadius: tokens.radius.md,
          border: `1px solid ${tokens.color.border}`,
        }}
      />
      {caption && (
        <figcaption
          style={{
            marginTop: 8,
            fontSize: 13,
            color: tokens.color.muted,
            textAlign: 'center',
            fontStyle: 'italic',
          }}
        >
          {caption}
        </figcaption>
      )}
    </figure>
  );
}

// ============================================================================
// Step Component - For step-by-step instructions
// ============================================================================

interface StepProps {
  number: number;
  title: string;
  children: ReactNode;
  style?: CSSProperties;
}

export function Step({ number, title, children, style }: StepProps) {
  return (
    <div
      style={{
        display: 'flex',
        gap: 16,
        marginBottom: 24,
        ...style,
      }}
    >
      <div
        style={{
          width: 32,
          height: 32,
          minWidth: 32,
          borderRadius: '50%',
          background: `linear-gradient(135deg, ${tokens.color.primary}, ${tokens.color.accent})`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 14,
          fontWeight: 600,
          color: '#111',
        }}
      >
        {number}
      </div>
      <div style={{ flex: 1 }}>
        <div
          style={{
            fontSize: 16,
            fontWeight: 600,
            color: tokens.color.text,
            marginBottom: 8,
          }}
        >
          {title}
        </div>
        <div style={{ color: tokens.color.textMuted, fontSize: 14, lineHeight: 1.6 }}>
          {children}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Card Component - For feature highlights
// ============================================================================

interface CardProps {
  icon: string;
  title: string;
  children: ReactNode;
  style?: CSSProperties;
}

export function Card({ icon, title, children, style }: CardProps) {
  return (
    <div
      style={{
        padding: 20,
        background: tokens.color.surface,
        border: `1px solid ${tokens.color.border}`,
        borderRadius: tokens.radius.lg,
        ...style,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          marginBottom: 12,
        }}
      >
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: tokens.radius.md,
            background: `${tokens.color.primary}15`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 20,
            color: tokens.color.primary,
          }}
        >
          <i className={icon} />
        </div>
        <div style={{ fontSize: 16, fontWeight: 600, color: tokens.color.text }}>
          {title}
        </div>
      </div>
      <div style={{ color: tokens.color.textMuted, fontSize: 14, lineHeight: 1.6 }}>
        {children}
      </div>
    </div>
  );
}

// ============================================================================
// Grid Component - For card layouts
// ============================================================================

interface GridProps {
  children: ReactNode;
  columns?: number;
  gap?: number;
  style?: CSSProperties;
}

export function Grid({ children, gap = 16, style }: GridProps) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(auto-fit, minmax(280px, 1fr))`,
        gap,
        marginBottom: 24,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

// ============================================================================
// Divider Component
// ============================================================================

interface DividerProps {
  style?: CSSProperties;
}

export function Divider({ style }: DividerProps) {
  return (
    <hr
      style={{
        border: 'none',
        borderTop: `1px solid ${tokens.color.border}`,
        margin: '24px 0',
        ...style,
      }}
    />
  );
}

// ============================================================================
// Quick Link Component
// ============================================================================

interface QuickLinkProps {
  icon: string;
  title: string;
  description: string;
  href?: string;
  onClick?: () => void;
  style?: CSSProperties;
}

export function QuickLink({ icon, title, description, href, onClick, style }: QuickLinkProps) {
  const handleClick = () => {
    if (onClick) {
      onClick();
    } else if (href) {
      window.location.href = href;
    }
  };

  return (
    <button
      onClick={handleClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: 16,
        background: tokens.color.surface,
        border: `1px solid ${tokens.color.border}`,
        borderRadius: tokens.radius.md,
        cursor: 'pointer',
        textAlign: 'left',
        width: '100%',
        transition: 'all 0.2s',
        ...style,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = tokens.color.primary;
        e.currentTarget.style.background = tokens.color.surfaceHover;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = tokens.color.border;
        e.currentTarget.style.background = tokens.color.surface;
      }}
    >
      <div
        style={{
          width: 40,
          height: 40,
          minWidth: 40,
          borderRadius: tokens.radius.md,
          background: `${tokens.color.primary}15`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 18,
          color: tokens.color.primary,
        }}
      >
        <i className={icon} />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: tokens.color.text, marginBottom: 2 }}>
          {title}
        </div>
        <div style={{ fontSize: 12, color: tokens.color.muted }}>
          {description}
        </div>
      </div>
      <i className="ri-arrow-right-s-line" style={{ fontSize: 20, color: tokens.color.muted }} />
    </button>
  );
}
