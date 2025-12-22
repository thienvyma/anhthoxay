/**
 * Response Time Display Component
 *
 * Displays contractor's average response time in a user-friendly format.
 * Shows "Thường phản hồi trong X giờ" or appropriate message.
 *
 * **Feature: bidding-phase5-review**
 * **Requirements: 22.3 - Show "Thường phản hồi trong X giờ"**
 */

import { tokens } from '@app/shared';

// ============================================
// TYPES
// ============================================

interface ResponseTimeDisplayProps {
  /** Average response time in hours */
  averageResponseTime: number | null;
  /** Compact mode for smaller displays */
  compact?: boolean;
  /** Show icon */
  showIcon?: boolean;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Format response time to human-readable Vietnamese string
 * Requirements: 22.3 - Show "Thường phản hồi trong X giờ"
 */
function formatResponseTime(hours: number): string {
  if (hours < 1) {
    const minutes = Math.round(hours * 60);
    if (minutes < 5) return 'vài phút';
    if (minutes < 30) return `${minutes} phút`;
    return '30 phút';
  }
  
  if (hours < 24) {
    const roundedHours = Math.round(hours);
    if (roundedHours === 1) return '1 giờ';
    return `${roundedHours} giờ`;
  }
  
  const days = Math.round(hours / 24);
  if (days === 1) return '1 ngày';
  if (days < 7) return `${days} ngày`;
  
  const weeks = Math.round(days / 7);
  if (weeks === 1) return '1 tuần';
  return `${weeks} tuần`;
}

/**
 * Get response time category for styling
 */
function getResponseTimeCategory(hours: number): 'fast' | 'normal' | 'slow' {
  if (hours <= 2) return 'fast';
  if (hours <= 24) return 'normal';
  return 'slow';
}

/**
 * Get color based on response time category
 */
function getResponseTimeColor(category: 'fast' | 'normal' | 'slow'): string {
  switch (category) {
    case 'fast':
      return '#22C55E'; // Green
    case 'normal':
      return '#FFB800'; // Yellow/Orange
    case 'slow':
      return tokens.color.muted;
  }
}

// ============================================
// COMPONENT
// ============================================

export function ResponseTimeDisplay({
  averageResponseTime,
  compact = false,
  showIcon = true,
}: ResponseTimeDisplayProps) {
  // No data available
  if (averageResponseTime === null || averageResponseTime === 0) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          color: tokens.color.muted,
          fontSize: compact ? 12 : 13,
        }}
      >
        {showIcon && (
          <i
            className="ri-time-line"
            style={{ fontSize: compact ? 14 : 16 }}
          />
        )}
        <span>Chưa có dữ liệu phản hồi</span>
      </div>
    );
  }

  const category = getResponseTimeCategory(averageResponseTime);
  const color = getResponseTimeColor(category);
  const formattedTime = formatResponseTime(averageResponseTime);

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        color: color,
        fontSize: compact ? 12 : 13,
      }}
    >
      {showIcon && (
        <i
          className={category === 'fast' ? 'ri-flashlight-line' : 'ri-time-line'}
          style={{ fontSize: compact ? 14 : 16 }}
        />
      )}
      <span>
        Thường phản hồi trong{' '}
        <strong style={{ fontWeight: 600 }}>{formattedTime}</strong>
      </span>
    </div>
  );
}

// ============================================
// BADGE VARIANT
// ============================================

interface ResponseTimeBadgeProps {
  /** Average response time in hours */
  averageResponseTime: number | null;
}

/**
 * Badge variant for compact display in cards
 */
export function ResponseTimeBadge({ averageResponseTime }: ResponseTimeBadgeProps) {
  if (averageResponseTime === null || averageResponseTime === 0) {
    return null;
  }

  const category = getResponseTimeCategory(averageResponseTime);
  const color = getResponseTimeColor(category);
  const formattedTime = formatResponseTime(averageResponseTime);

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding: '4px 8px',
        background: `${color}15`,
        border: `1px solid ${color}30`,
        borderRadius: 6,
        fontSize: 11,
        fontWeight: 500,
        color: color,
      }}
    >
      <i
        className={category === 'fast' ? 'ri-flashlight-fill' : 'ri-time-fill'}
        style={{ fontSize: 12 }}
      />
      <span>{formattedTime}</span>
    </div>
  );
}

export default ResponseTimeDisplay;
