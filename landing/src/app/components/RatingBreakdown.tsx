/**
 * Rating Breakdown Component
 *
 * Displays multi-criteria rating breakdown with bar chart visualization.
 * Shows average ratings for each criteria (quality, timeliness, communication, value).
 *
 * **Feature: bidding-phase5-review**
 * **Requirements: 17.3 - Display breakdown by each criteria**
 * **Requirements: 22.3 - Show response time**
 */

import { tokens } from '@app/shared';
import { StarRating } from './StarRating';
import { ResponseTimeDisplay } from './ResponseTimeDisplay';

// Multi-criteria rating labels in Vietnamese
const CRITERIA_LABELS = {
  quality: 'Chất lượng công việc',
  timeliness: 'Đúng tiến độ',
  communication: 'Giao tiếp',
  value: 'Giá cả hợp lý',
} as const;

export interface RatingBreakdownData {
  /** Total number of reviews */
  totalReviews: number;
  /** Overall average rating */
  averageRating: number;
  /** Rating distribution (1-5 stars) */
  ratingDistribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
  /** Average quality rating (null if no data) */
  averageQualityRating: number | null;
  /** Average timeliness rating (null if no data) */
  averageTimelinessRating: number | null;
  /** Average communication rating (null if no data) */
  averageCommunicationRating: number | null;
  /** Average value rating (null if no data) */
  averageValueRating: number | null;
  /** Average response time in hours (null if no data) - Requirements: 22.3 */
  averageResponseTime?: number | null;
}

interface RatingBreakdownProps {
  /** Rating breakdown data */
  data: RatingBreakdownData;
  /** Whether to show the rating distribution */
  showDistribution?: boolean;
  /** Compact mode for smaller displays */
  compact?: boolean;
}

/**
 * Rating bar component for individual criteria
 */
function RatingBar({
  label,
  value,
  maxValue = 5,
}: {
  label: string;
  value: number | null;
  maxValue?: number;
}) {
  const percentage = value !== null ? (value / maxValue) * 100 : 0;
  const hasValue = value !== null && value > 0;

  return (
    <div style={{ marginBottom: 12 }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 6,
        }}
      >
        <span
          style={{
            color: tokens.color.text,
            fontSize: 13,
            fontWeight: 500,
          }}
        >
          {label}
        </span>
        <span
          style={{
            color: hasValue ? '#FFB800' : tokens.color.muted,
            fontSize: 13,
            fontWeight: 600,
          }}
        >
          {hasValue ? value.toFixed(1) : '-'}
        </span>
      </div>
      <div
        style={{
          height: 8,
          background: 'rgba(255,255,255,0.1)',
          borderRadius: 4,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${percentage}%`,
            background: hasValue
              ? `linear-gradient(90deg, #FFB800 0%, #FF9500 100%)`
              : 'transparent',
            borderRadius: 4,
            transition: 'width 0.3s ease',
          }}
        />
      </div>
    </div>
  );
}

/**
 * Distribution bar for star ratings
 */
function DistributionBar({
  stars,
  count,
  total,
}: {
  stars: number;
  count: number;
  total: number;
}) {
  const percentage = total > 0 ? (count / total) * 100 : 0;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        marginBottom: 6,
      }}
    >
      <span
        style={{
          color: tokens.color.textMuted,
          fontSize: 12,
          width: 16,
          textAlign: 'right',
        }}
      >
        {stars}
      </span>
      <i
        className="ri-star-fill"
        style={{ color: '#FFB800', fontSize: 12 }}
      />
      <div
        style={{
          flex: 1,
          height: 6,
          background: 'rgba(255,255,255,0.1)',
          borderRadius: 3,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${percentage}%`,
            background: '#FFB800',
            borderRadius: 3,
            transition: 'width 0.3s ease',
          }}
        />
      </div>
      <span
        style={{
          color: tokens.color.muted,
          fontSize: 11,
          width: 30,
          textAlign: 'right',
        }}
      >
        {count}
      </span>
    </div>
  );
}

export function RatingBreakdown({
  data,
  showDistribution = true,
  compact = false,
}: RatingBreakdownProps) {
  const hasMultiCriteria =
    data.averageQualityRating !== null ||
    data.averageTimelinessRating !== null ||
    data.averageCommunicationRating !== null ||
    data.averageValueRating !== null;

  return (
    <div
      style={{
        padding: compact ? 16 : 20,
        background: 'rgba(255,255,255,0.03)',
        borderRadius: 12,
        border: `1px solid ${tokens.color.border}`,
      }}
    >
      {/* Overall Rating Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          marginBottom: hasMultiCriteria || showDistribution ? 20 : 0,
          paddingBottom: hasMultiCriteria || showDistribution ? 16 : 0,
          borderBottom: hasMultiCriteria || showDistribution
            ? `1px solid ${tokens.color.border}`
            : 'none',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: '12px 20px',
            background: 'rgba(255,184,0,0.1)',
            borderRadius: 12,
          }}
        >
          <span
            style={{
              color: '#FFB800',
              fontSize: compact ? 28 : 36,
              fontWeight: 700,
              lineHeight: 1,
            }}
          >
            {data.averageRating > 0 ? data.averageRating.toFixed(1) : '-'}
          </span>
          <StarRating
            value={Math.round(data.averageRating)}
            readOnly
            size={compact ? 14 : 16}
          />
        </div>
        <div>
          <p
            style={{
              color: tokens.color.text,
              fontSize: compact ? 14 : 16,
              fontWeight: 600,
              margin: 0,
            }}
          >
            {data.totalReviews > 0
              ? `${data.totalReviews} đánh giá`
              : 'Chưa có đánh giá'}
          </p>
          {data.totalReviews > 0 && (
            <p
              style={{
                color: tokens.color.textMuted,
                fontSize: 13,
                margin: '4px 0 0 0',
              }}
            >
              Điểm trung bình từ tất cả đánh giá
            </p>
          )}
          {/* Response Time Display - Requirements: 22.3 */}
          {data.averageResponseTime !== undefined && (
            <div style={{ marginTop: 8 }}>
              <ResponseTimeDisplay
                averageResponseTime={data.averageResponseTime}
                compact={compact}
              />
            </div>
          )}
        </div>
      </div>

      {/* Multi-criteria breakdown */}
      {hasMultiCriteria && (
        <div style={{ marginBottom: showDistribution ? 20 : 0 }}>
          <h4
            style={{
              color: tokens.color.text,
              fontSize: 14,
              fontWeight: 600,
              marginBottom: 12,
            }}
          >
            Chi tiết đánh giá
          </h4>
          <RatingBar
            label={CRITERIA_LABELS.quality}
            value={data.averageQualityRating}
          />
          <RatingBar
            label={CRITERIA_LABELS.timeliness}
            value={data.averageTimelinessRating}
          />
          <RatingBar
            label={CRITERIA_LABELS.communication}
            value={data.averageCommunicationRating}
          />
          <RatingBar
            label={CRITERIA_LABELS.value}
            value={data.averageValueRating}
          />
        </div>
      )}

      {/* Rating distribution */}
      {showDistribution && data.totalReviews > 0 && (
        <div>
          <h4
            style={{
              color: tokens.color.text,
              fontSize: 14,
              fontWeight: 600,
              marginBottom: 12,
            }}
          >
            Phân bố đánh giá
          </h4>
          {[5, 4, 3, 2, 1].map((stars) => (
            <DistributionBar
              key={stars}
              stars={stars}
              count={data.ratingDistribution[stars as 1 | 2 | 3 | 4 | 5]}
              total={data.totalReviews}
            />
          ))}
        </div>
      )}

      {/* Empty state */}
      {data.totalReviews === 0 && (
        <div
          style={{
            textAlign: 'center',
            padding: '20px 0',
          }}
        >
          <i
            className="ri-star-line"
            style={{
              fontSize: 32,
              color: tokens.color.muted,
              marginBottom: 8,
              display: 'block',
            }}
          />
          <p
            style={{
              color: tokens.color.textMuted,
              fontSize: 14,
              margin: 0,
            }}
          >
            Nhà thầu này chưa có đánh giá nào
          </p>
        </div>
      )}
    </div>
  );
}

export default RatingBreakdown;
