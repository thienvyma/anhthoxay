/**
 * FormSection Component
 * Reusable form section with icon and title
 * Requirements: 3.4
 */

import { tokens } from '../../../../../theme';
import type { ReactNode } from 'react';

interface FormSectionProps {
  icon: string;
  iconColor?: string;
  title: string;
  bgColor?: string;
  borderColor?: string;
  children: ReactNode;
}

export function FormSection({
  icon,
  iconColor,
  title,
  bgColor = tokens.color.surfaceAlt,
  borderColor = tokens.color.border,
  children,
}: FormSectionProps) {
  return (
    <div
      style={{
        background: bgColor,
        border: `1px solid ${borderColor}`,
        borderRadius: tokens.radius.md,
        padding: 16,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <i className={icon} style={{ fontSize: 18, color: iconColor || tokens.color.primary }} />
        <label style={{ color: tokens.color.text, fontSize: 14, fontWeight: 600, margin: 0 }}>
          {title}
        </label>
      </div>
      {children}
    </div>
  );
}
