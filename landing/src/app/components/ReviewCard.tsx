/**
 * Review Card Component
 *
 * Displays a single review with rating, comment, contractor response,
 * helpful voting, and report functionality.
 *
 * **Feature: bidding-phase5-review**
 * **Requirements: 11.1-11.4, 18.1-18.4, 19.1, 19.2**
 */

import { useState } from 'react';
import { tokens } from '@app/shared';
import { StarRating } from './StarRating';
import { ReportModal } from './ReportModal';

// ============================================
// TYPES
// ============================================

export interface PublicReview {
  id: string;
  projectId: string;
  projectCode: string;
  projectTitle: string;
  reviewerName: string;
  rating: number;
  comment: string | null;
  images: string[];
  qualityRating: number | null;
  timelinessRating: number | null;
  communicationRating: number | null;
  valueRating: number | null;
  response: string | null;
  respondedAt: Date | string | null;
  helpfulCount: number;
  isMostHelpful: boolean;
  createdAt: Date | string;
}

interface ReviewCardProps {
  review: PublicReview;
  /** Whether the current user has voted this review as helpful */
  hasVoted?: boolean;
  /** Whether the user is authenticated (can vote/report) */
  isAuthenticated?: boolean;
  /** Callback when helpful vote is toggled */
  onVoteHelpful?: (reviewId: string, hasVoted: boolean) => Promise<void>;
  /** Callback when report is submitted */
  onReport?: (reviewId: string, reason: string, description?: string) => Promise<void>;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('vi-VN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function formatTimeAgo(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Hôm nay';
  if (diffDays === 1) return 'Hôm qua';
  if (diffDays < 7) return `${diffDays} ngày trước`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} tuần trước`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} tháng trước`;
  return `${Math.floor(diffDays / 365)} năm trước`;
}

// ============================================
// COMPONENT
// ============================================

export function ReviewCard({
  review,
  hasVoted = false,
  isAuthenticated = false,
  onVoteHelpful,
  onReport,
}: ReviewCardProps) {
  const [isVoting, setIsVoting] = useState(false);
  const [localHasVoted, setLocalHasVoted] = useState(hasVoted);
  const [localHelpfulCount, setLocalHelpfulCount] = useState(review.helpfulCount);
  const [showReportModal, setShowReportModal] = useState(false);
  const [isReporting, setIsReporting] = useState(false);

  const handleVoteHelpful = async () => {
    if (!isAuthenticated || !onVoteHelpful || isVoting) return;

    setIsVoting(true);
    try {
      await onVoteHelpful(review.id, localHasVoted);
      // Optimistic update
      setLocalHasVoted(!localHasVoted);
      setLocalHelpfulCount((prev) => (localHasVoted ? prev - 1 : prev + 1));
    } catch (error) {
      console.error('Failed to vote:', error);
    } finally {
      setIsVoting(false);
    }
  };

  const handleReport = async (reason: string, description?: string) => {
    if (!onReport || isReporting) return;

    setIsReporting(true);
    try {
      await onReport(review.id, reason, description);
      setShowReportModal(false);
    } catch (error) {
      console.error('Failed to report:', error);
      throw error; // Re-throw to let modal handle error display
    } finally {
      setIsReporting(false);
    }
  };

  return (
    <div
      style={{
        padding: 20,
        background: review.isMostHelpful
          ? 'rgba(255,184,0,0.05)'
          : 'rgba(255,255,255,0.03)',
        borderRadius: 12,
        border: `1px solid ${
          review.isMostHelpful ? 'rgba(255,184,0,0.3)' : tokens.color.border
        }`,
        position: 'relative',
      }}
    >
      {/* Most Helpful Badge - Requirements: 18.4 */}
      {review.isMostHelpful && (
        <div
          style={{
            position: 'absolute',
            top: -10,
            left: 16,
            background: '#FFB800',
            color: '#000',
            fontSize: 11,
            fontWeight: 600,
            padding: '4px 10px',
            borderRadius: 4,
            display: 'flex',
            alignItems: 'center',
            gap: 4,
          }}
        >
          <i className="ri-thumb-up-fill" style={{ fontSize: 12 }} />
          Hữu ích nhất
        </div>
      )}

      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: 12,
          marginTop: review.isMostHelpful ? 8 : 0,
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span
              style={{
                color: tokens.color.text,
                fontSize: 14,
                fontWeight: 600,
              }}
            >
              {review.reviewerName}
            </span>
            <span
              style={{
                color: tokens.color.muted,
                fontSize: 12,
              }}
            >
              •
            </span>
            <span
              style={{
                color: tokens.color.textMuted,
                fontSize: 12,
              }}
              title={formatDate(review.createdAt)}
            >
              {formatTimeAgo(review.createdAt)}
            </span>
          </div>
          <div
            style={{
              color: tokens.color.textMuted,
              fontSize: 12,
              marginTop: 4,
            }}
          >
            Dự án: {review.projectCode}
          </div>
        </div>
        <StarRating value={review.rating} readOnly size={16} />
      </div>

      {/* Comment */}
      {review.comment && (
        <p
          style={{
            color: tokens.color.text,
            fontSize: 14,
            lineHeight: 1.6,
            margin: '0 0 12px 0',
          }}
        >
          {review.comment}
        </p>
      )}

      {/* Images */}
      {review.images && review.images.length > 0 && (
        <div
          style={{
            display: 'flex',
            gap: 8,
            marginBottom: 12,
            flexWrap: 'wrap',
          }}
        >
          {review.images.map((url, index) => (
            <img
              key={index}
              src={url}
              alt={`Review image ${index + 1}`}
              style={{
                width: 80,
                height: 80,
                objectFit: 'cover',
                borderRadius: 8,
                cursor: 'pointer',
              }}
            />
          ))}
        </div>
      )}

      {/* Multi-criteria ratings (if available) */}
      {(review.qualityRating ||
        review.timelinessRating ||
        review.communicationRating ||
        review.valueRating) && (
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 12,
            marginBottom: 12,
            padding: '10px 12px',
            background: 'rgba(255,255,255,0.03)',
            borderRadius: 8,
          }}
        >
          {review.qualityRating && (
            <CriteriaChip label="Chất lượng" value={review.qualityRating} />
          )}
          {review.timelinessRating && (
            <CriteriaChip label="Tiến độ" value={review.timelinessRating} />
          )}
          {review.communicationRating && (
            <CriteriaChip label="Giao tiếp" value={review.communicationRating} />
          )}
          {review.valueRating && (
            <CriteriaChip label="Giá cả" value={review.valueRating} />
          )}
        </div>
      )}

      {/* Contractor Response */}
      {review.response && (
        <div
          style={{
            marginTop: 12,
            padding: 12,
            background: 'rgba(255,255,255,0.05)',
            borderRadius: 8,
            borderLeft: `3px solid ${tokens.color.primary}`,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              marginBottom: 8,
            }}
          >
            <i
              className="ri-reply-line"
              style={{ color: tokens.color.primary, fontSize: 14 }}
            />
            <span
              style={{
                color: tokens.color.primary,
                fontSize: 12,
                fontWeight: 600,
              }}
            >
              Phản hồi từ nhà thầu
            </span>
            {review.respondedAt && (
              <span
                style={{
                  color: tokens.color.muted,
                  fontSize: 11,
                }}
              >
                • {formatTimeAgo(review.respondedAt)}
              </span>
            )}
          </div>
          <p
            style={{
              color: tokens.color.text,
              fontSize: 13,
              lineHeight: 1.5,
              margin: 0,
            }}
          >
            {review.response}
          </p>
        </div>
      )}

      {/* Actions - Requirements: 18.1, 19.1 */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: 16,
          paddingTop: 12,
          borderTop: `1px solid ${tokens.color.border}`,
        }}
      >
        {/* Helpful button - Requirements: 18.1 */}
        <button
          onClick={handleVoteHelpful}
          disabled={!isAuthenticated || isVoting}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '6px 12px',
            background: localHasVoted
              ? 'rgba(255,184,0,0.15)'
              : 'rgba(255,255,255,0.05)',
            border: `1px solid ${
              localHasVoted ? 'rgba(255,184,0,0.3)' : tokens.color.border
            }`,
            borderRadius: 6,
            color: localHasVoted ? '#FFB800' : tokens.color.textMuted,
            fontSize: 13,
            cursor: isAuthenticated ? 'pointer' : 'not-allowed',
            opacity: isVoting ? 0.6 : 1,
            transition: 'all 0.2s ease',
          }}
          title={
            isAuthenticated
              ? localHasVoted
                ? 'Bỏ đánh dấu hữu ích'
                : 'Đánh dấu hữu ích'
              : 'Đăng nhập để đánh giá'
          }
        >
          <i
            className={localHasVoted ? 'ri-thumb-up-fill' : 'ri-thumb-up-line'}
            style={{ fontSize: 14 }}
          />
          <span>Hữu ích</span>
          {localHelpfulCount > 0 && (
            <span
              style={{
                background: localHasVoted
                  ? 'rgba(255,184,0,0.2)'
                  : 'rgba(255,255,255,0.1)',
                padding: '2px 6px',
                borderRadius: 4,
                fontSize: 11,
                fontWeight: 600,
              }}
            >
              {localHelpfulCount}
            </span>
          )}
        </button>

        {/* Report button - Requirements: 19.1 */}
        {isAuthenticated && (
          <button
            onClick={() => setShowReportModal(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              padding: '6px 10px',
              background: 'transparent',
              border: 'none',
              color: tokens.color.muted,
              fontSize: 12,
              cursor: 'pointer',
              transition: 'color 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#FF4444';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = tokens.color.muted;
            }}
            title="Báo cáo đánh giá này"
          >
            <i className="ri-flag-line" style={{ fontSize: 14 }} />
            Báo cáo
          </button>
        )}
      </div>

      {/* Report Modal - Requirements: 19.1, 19.2 */}
      {showReportModal && (
        <ReportModal
          isOpen={showReportModal}
          onClose={() => setShowReportModal(false)}
          onSubmit={handleReport}
          isLoading={isReporting}
        />
      )}
    </div>
  );
}

// ============================================
// SUB-COMPONENTS
// ============================================

function CriteriaChip({ label, value }: { label: string; value: number }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        fontSize: 12,
        color: tokens.color.textMuted,
      }}
    >
      <span>{label}:</span>
      <span style={{ color: '#FFB800', fontWeight: 600 }}>{value}</span>
      <i
        className="ri-star-fill"
        style={{ color: '#FFB800', fontSize: 10 }}
      />
    </div>
  );
}

export default ReviewCard;
