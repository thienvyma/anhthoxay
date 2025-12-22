/**
 * Review Form Component
 *
 * Multi-criteria review form for homeowners to rate contractors.
 * Displays 4 star rating selectors with Vietnamese labels.
 *
 * **Feature: bidding-phase5-review**
 * **Requirements: 17.1 - Multi-criteria rating input with Vietnamese labels**
 */

import { tokens } from '@app/shared';
import { useState, useCallback } from 'react';
import { StarRating } from './StarRating';

// Multi-criteria rating labels in Vietnamese
const CRITERIA_LABELS = {
  quality: 'Chất lượng công việc',
  timeliness: 'Đúng tiến độ',
  communication: 'Giao tiếp',
  value: 'Giá cả hợp lý',
} as const;

// Weights for calculating overall rating (must match backend)
const CRITERIA_WEIGHTS = {
  quality: 0.30,
  timeliness: 0.25,
  communication: 0.20,
  value: 0.25,
} as const;

export interface ReviewFormData {
  qualityRating: number;
  timelinessRating: number;
  communicationRating: number;
  valueRating: number;
  comment: string;
  images: string[];
}

interface ReviewFormProps {
  /** Project ID being reviewed */
  projectId: string;
  /** Project code for display */
  projectCode: string;
  /** Contractor name for display */
  contractorName: string;
  /** Callback when form is submitted */
  onSubmit: (data: ReviewFormData) => Promise<void>;
  /** Callback when form is cancelled */
  onCancel?: () => void;
  /** Initial values for editing */
  initialValues?: Partial<ReviewFormData>;
  /** Whether the form is in loading state */
  loading?: boolean;
}

/**
 * Calculate weighted average rating from multi-criteria ratings
 */
function calculateOverallRating(criteria: {
  quality: number;
  timeliness: number;
  communication: number;
  value: number;
}): number {
  const ratings: Array<{ value: number; weight: number }> = [];

  if (criteria.quality > 0) {
    ratings.push({ value: criteria.quality, weight: CRITERIA_WEIGHTS.quality });
  }
  if (criteria.timeliness > 0) {
    ratings.push({ value: criteria.timeliness, weight: CRITERIA_WEIGHTS.timeliness });
  }
  if (criteria.communication > 0) {
    ratings.push({ value: criteria.communication, weight: CRITERIA_WEIGHTS.communication });
  }
  if (criteria.value > 0) {
    ratings.push({ value: criteria.value, weight: CRITERIA_WEIGHTS.value });
  }

  if (ratings.length === 0) return 0;

  const totalWeight = ratings.reduce((sum, r) => sum + r.weight, 0);
  const weightedSum = ratings.reduce((sum, r) => sum + r.value * r.weight, 0);

  return Math.round((weightedSum / totalWeight) * 10) / 10;
}

export function ReviewForm({
  projectCode,
  contractorName,
  onSubmit,
  onCancel,
  initialValues,
  loading = false,
}: ReviewFormProps) {
  const [qualityRating, setQualityRating] = useState(initialValues?.qualityRating ?? 0);
  const [timelinessRating, setTimelinessRating] = useState(initialValues?.timelinessRating ?? 0);
  const [communicationRating, setCommunicationRating] = useState(initialValues?.communicationRating ?? 0);
  const [valueRating, setValueRating] = useState(initialValues?.valueRating ?? 0);
  const [comment, setComment] = useState(initialValues?.comment ?? '');
  const [error, setError] = useState<string | null>(null);

  // Calculate overall rating
  const overallRating = calculateOverallRating({
    quality: qualityRating,
    timeliness: timelinessRating,
    communication: communicationRating,
    value: valueRating,
  });

  // Check if all criteria are rated
  const allCriteriaRated =
    qualityRating > 0 &&
    timelinessRating > 0 &&
    communicationRating > 0 &&
    valueRating > 0;

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);

      // Validate all criteria are rated
      if (!allCriteriaRated) {
        setError('Vui lòng đánh giá tất cả các tiêu chí');
        return;
      }

      try {
        await onSubmit({
          qualityRating,
          timelinessRating,
          communicationRating,
          valueRating,
          comment,
          images: [], // TODO: Implement image upload
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Có lỗi xảy ra');
      }
    },
    [qualityRating, timelinessRating, communicationRating, valueRating, comment, allCriteriaRated, onSubmit]
  );

  return (
    <form onSubmit={handleSubmit}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h3
          style={{
            color: tokens.color.text,
            fontSize: 20,
            fontWeight: 600,
            marginBottom: 8,
          }}
        >
          Đánh giá nhà thầu
        </h3>
        <p style={{ color: tokens.color.textMuted, fontSize: 14 }}>
          Dự án: <strong>{projectCode}</strong> • Nhà thầu: <strong>{contractorName}</strong>
        </p>
      </div>

      {/* Multi-criteria ratings */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
          marginBottom: 24,
          padding: 20,
          background: 'rgba(255,255,255,0.03)',
          borderRadius: 12,
          border: `1px solid ${tokens.color.border}`,
        }}
      >
        <StarRating
          label={CRITERIA_LABELS.quality}
          value={qualityRating}
          onChange={setQualityRating}
          size={28}
        />
        <StarRating
          label={CRITERIA_LABELS.timeliness}
          value={timelinessRating}
          onChange={setTimelinessRating}
          size={28}
        />
        <StarRating
          label={CRITERIA_LABELS.communication}
          value={communicationRating}
          onChange={setCommunicationRating}
          size={28}
        />
        <StarRating
          label={CRITERIA_LABELS.value}
          value={valueRating}
          onChange={setValueRating}
          size={28}
        />

        {/* Overall rating display */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingTop: 16,
            borderTop: `1px solid ${tokens.color.border}`,
            marginTop: 8,
          }}
        >
          <span
            style={{
              color: tokens.color.text,
              fontSize: 14,
              fontWeight: 600,
            }}
          >
            Đánh giá tổng thể
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <StarRating value={Math.round(overallRating)} readOnly size={24} />
            <span
              style={{
                color: overallRating > 0 ? '#FFB800' : tokens.color.muted,
                fontSize: 18,
                fontWeight: 700,
              }}
            >
              {overallRating > 0 ? overallRating.toFixed(1) : '-'}
            </span>
          </div>
        </div>
      </div>

      {/* Comment */}
      <div style={{ marginBottom: 24 }}>
        <label
          style={{
            display: 'block',
            color: tokens.color.text,
            fontSize: 14,
            fontWeight: 500,
            marginBottom: 8,
          }}
        >
          Nhận xét (tùy chọn)
        </label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Chia sẻ trải nghiệm của bạn với nhà thầu này..."
          maxLength={2000}
          style={{
            width: '100%',
            minHeight: 120,
            padding: 12,
            background: 'rgba(255,255,255,0.05)',
            border: `1px solid ${tokens.color.border}`,
            borderRadius: 8,
            color: tokens.color.text,
            fontSize: 14,
            resize: 'vertical',
          }}
        />
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            marginTop: 4,
          }}
        >
          <span style={{ color: tokens.color.muted, fontSize: 12 }}>
            {comment.length}/2000
          </span>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div
          style={{
            padding: 12,
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: 8,
            marginBottom: 16,
          }}
        >
          <p style={{ color: '#EF4444', fontSize: 14, margin: 0 }}>
            <i className="ri-error-warning-line" style={{ marginRight: 8 }} />
            {error}
          </p>
        </div>
      )}

      {/* Actions */}
      <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            style={{
              padding: '12px 24px',
              background: 'transparent',
              border: `1px solid ${tokens.color.border}`,
              borderRadius: 8,
              color: tokens.color.text,
              fontSize: 14,
              fontWeight: 500,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.5 : 1,
            }}
          >
            Hủy
          </button>
        )}
        <button
          type="submit"
          disabled={loading || !allCriteriaRated}
          style={{
            padding: '12px 24px',
            background: allCriteriaRated ? tokens.color.primary : tokens.color.muted,
            border: 'none',
            borderRadius: 8,
            color: '#fff',
            fontSize: 14,
            fontWeight: 600,
            cursor: loading || !allCriteriaRated ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.7 : 1,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          {loading && (
            <i
              className="ri-loader-4-line"
              style={{
                animation: 'spin 1s linear infinite',
              }}
            />
          )}
          Gửi đánh giá
        </button>
      </div>
    </form>
  );
}

export default ReviewForm;
