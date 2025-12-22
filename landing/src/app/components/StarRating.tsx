/**
 * Star Rating Component
 *
 * Reusable star rating selector for review forms.
 * Supports both display and interactive modes.
 *
 * **Feature: bidding-phase5-review**
 * **Requirements: 17.1 - Multi-criteria rating input**
 */

import { tokens } from '@app/shared';
import { useState } from 'react';

interface StarRatingProps {
  /** Current rating value (1-5) */
  value: number;
  /** Callback when rating changes (interactive mode) */
  onChange?: (value: number) => void;
  /** Size of stars in pixels */
  size?: number;
  /** Whether the rating is read-only */
  readOnly?: boolean;
  /** Label to display next to stars */
  label?: string;
  /** Show numeric value next to stars */
  showValue?: boolean;
}

export function StarRating({
  value,
  onChange,
  size = 24,
  readOnly = false,
  label,
  showValue = false,
}: StarRatingProps) {
  const [hoverValue, setHoverValue] = useState<number | null>(null);

  const displayValue = hoverValue ?? value;

  const handleClick = (rating: number) => {
    if (!readOnly && onChange) {
      onChange(rating);
    }
  };

  const handleMouseEnter = (rating: number) => {
    if (!readOnly) {
      setHoverValue(rating);
    }
  };

  const handleMouseLeave = () => {
    setHoverValue(null);
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      {label && (
        <span
          style={{
            color: tokens.color.text,
            fontSize: 14,
            fontWeight: 500,
            minWidth: 120,
          }}
        >
          {label}
        </span>
      )}
      <div
        style={{
          display: 'flex',
          gap: 4,
          cursor: readOnly ? 'default' : 'pointer',
        }}
        onMouseLeave={handleMouseLeave}
      >
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => handleClick(star)}
            onMouseEnter={() => handleMouseEnter(star)}
            disabled={readOnly}
            style={{
              background: 'none',
              border: 'none',
              padding: 0,
              cursor: readOnly ? 'default' : 'pointer',
              transition: 'transform 0.15s ease',
              transform: !readOnly && hoverValue === star ? 'scale(1.2)' : 'scale(1)',
            }}
            aria-label={`${star} sao`}
          >
            <i
              className={star <= displayValue ? 'ri-star-fill' : 'ri-star-line'}
              style={{
                fontSize: size,
                color: star <= displayValue ? '#FFB800' : tokens.color.muted,
                transition: 'color 0.15s ease',
              }}
            />
          </button>
        ))}
      </div>
      {showValue && (
        <span
          style={{
            color: tokens.color.textMuted,
            fontSize: 14,
            marginLeft: 4,
          }}
        >
          {value > 0 ? value.toFixed(1) : '-'}
        </span>
      )}
    </div>
  );
}

export default StarRating;
