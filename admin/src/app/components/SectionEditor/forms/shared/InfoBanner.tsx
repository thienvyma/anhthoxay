/**
 * InfoBanner Component
 * Displays informational banner with icon and description
 * Requirements: 3.4
 */

import { tokens } from '../../../../../theme';

interface InfoBannerProps {
  icon: string;
  color: string;
  title: string;
  description: string;
}

export function InfoBanner({ icon, color, title, description }: InfoBannerProps) {
  return (
    <div
      style={{
        background: `${color}15`,
        border: `1px solid ${color}40`,
        borderRadius: tokens.radius.md,
        padding: '12px 16px',
        display: 'flex',
        alignItems: 'flex-start',
        gap: 12,
      }}
    >
      <i className={icon} style={{ fontSize: 20, color, marginTop: 2 }} />
      <div>
        <p
          style={{
            color: tokens.color.text,
            fontSize: 14,
            margin: 0,
            fontWeight: 500,
            marginBottom: 4,
          }}
        >
          {title}
        </p>
        <p
          style={{
            color: tokens.color.muted,
            fontSize: 13,
            margin: 0,
            lineHeight: 1.5,
          }}
        >
          {description}
        </p>
      </div>
    </div>
  );
}
