/**
 * BidComparison Component
 *
 * Side-by-side comparison of up to 3 bids:
 * - Price comparison with lowest highlighted in green
 * - Timeline comparison with fastest highlighted in blue
 * - Proposal highlights
 * - Contractor rating comparison
 * - "Select This Bid" action
 *
 * **Feature: bidding-phase6-portal, Property 12: Bid Comparison Limit**
 * **Requirements: 20.1, 20.2, 20.3, 20.4**
 */

import { motion, AnimatePresence } from 'framer-motion';
import type { Bid } from '../api';

export interface BidComparisonProps {
  /** Bids to compare (max 3) */
  bids: Bid[];
  /** Callback when a bid is selected */
  onSelectBid: (bidId: string) => void;
  /** Callback to close the comparison view */
  onClose: () => void;
  /** Is selection in progress */
  isSelecting?: boolean;
  /** Currently selecting bid ID */
  selectingBidId?: string | null;
}

/** Maximum number of bids that can be compared */
export const MAX_COMPARISON_BIDS = 3;

/**
 * Format currency for display
 */
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Parse timeline string to days for comparison
 * Handles formats like "30 ngày", "2 tuần", "1 tháng"
 */
function parseTimelineToDays(timeline: string): number {
  const lower = timeline.toLowerCase().trim();
  
  // Match number followed by unit
  const match = lower.match(/(\d+)\s*(ngày|tuần|tháng|năm|days?|weeks?|months?|years?)/i);
  if (!match) {
    // Try to extract just a number
    const numMatch = lower.match(/(\d+)/);
    return numMatch ? parseInt(numMatch[1], 10) : Infinity;
  }
  
  const value = parseInt(match[1], 10);
  const unit = match[2].toLowerCase();
  
  if (unit.includes('ngày') || unit.includes('day')) return value;
  if (unit.includes('tuần') || unit.includes('week')) return value * 7;
  if (unit.includes('tháng') || unit.includes('month')) return value * 30;
  if (unit.includes('năm') || unit.includes('year')) return value * 365;
  
  return value;
}

/**
 * Find the bid with the lowest price
 */
function findLowestPriceBid(bids: Bid[]): string | null {
  if (bids.length === 0) return null;
  return bids.reduce((lowest, bid) => 
    bid.price < lowest.price ? bid : lowest
  ).id;
}

/**
 * Find the bid with the fastest timeline
 */
function findFastestTimelineBid(bids: Bid[]): string | null {
  if (bids.length === 0) return null;
  return bids.reduce((fastest, bid) => {
    const fastestDays = parseTimelineToDays(fastest.timeline);
    const bidDays = parseTimelineToDays(bid.timeline);
    return bidDays < fastestDays ? bid : fastest;
  }).id;
}

/**
 * Find the bid with the highest rating
 */
function findHighestRatingBid(bids: Bid[]): string | null {
  if (bids.length === 0) return null;
  const bidsWithRating = bids.filter(b => b.contractor?.rating !== undefined);
  if (bidsWithRating.length === 0) return null;
  return bidsWithRating.reduce((highest, bid) => 
    (bid.contractor?.rating || 0) > (highest.contractor?.rating || 0) ? bid : highest
  ).id;
}

export function BidComparison({
  bids,
  onSelectBid,
  onClose,
  isSelecting = false,
  selectingBidId = null,
}: BidComparisonProps) {
  // Limit to max 3 bids
  const comparisonBids = bids.slice(0, MAX_COMPARISON_BIDS);
  
  // Find best values for highlighting
  const lowestPriceBidId = findLowestPriceBid(comparisonBids);
  const fastestTimelineBidId = findFastestTimelineBid(comparisonBids);
  const highestRatingBidId = findHighestRatingBid(comparisonBids);

  if (comparisonBids.length === 0) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: 20,
        }}
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="card"
          style={{
            padding: 0,
            maxWidth: 1200,
            width: '100%',
            maxHeight: '90vh',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div
            style={{
              padding: '20px 24px',
              borderBottom: '1px solid #27272a',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div>
              <h2 style={{ fontSize: 20, fontWeight: 600, color: '#e4e7ec', marginBottom: 4 }}>
                So sánh đề xuất
              </h2>
              <p style={{ fontSize: 13, color: '#71717a' }}>
                So sánh {comparisonBids.length} đề xuất để chọn nhà thầu phù hợp nhất
              </p>
            </div>
            <button
              onClick={onClose}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#71717a',
                cursor: 'pointer',
                padding: 8,
                borderRadius: 8,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              aria-label="Đóng"
            >
              <i className="ri-close-line" style={{ fontSize: 24 }} />
            </button>
          </div>

          {/* Legend */}
          <div
            style={{
              padding: '12px 24px',
              background: 'rgba(255, 255, 255, 0.02)',
              borderBottom: '1px solid #27272a',
              display: 'flex',
              gap: 24,
              flexWrap: 'wrap',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
              <span
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: 3,
                  background: '#22c55e',
                }}
              />
              <span style={{ color: '#a1a1aa' }}>Giá thấp nhất</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
              <span
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: 3,
                  background: '#3b82f6',
                }}
              />
              <span style={{ color: '#a1a1aa' }}>Thời gian nhanh nhất</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
              <span
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: 3,
                  background: '#f59e0b',
                }}
              />
              <span style={{ color: '#a1a1aa' }}>Đánh giá cao nhất</span>
            </div>
          </div>

          {/* Comparison Table */}
          <div
            style={{
              flex: 1,
              overflow: 'auto',
              padding: 24,
            }}
          >
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: `200px repeat(${comparisonBids.length}, 1fr)`,
                gap: 0,
              }}
            >
              {/* Header Row - Contractor Names */}
              <div style={{ padding: '16px 12px', fontWeight: 600, color: '#71717a' }}>
                Nhà thầu
              </div>
              {comparisonBids.map((bid, index) => (
                <div
                  key={bid.id}
                  style={{
                    padding: '16px 12px',
                    textAlign: 'center',
                    borderLeft: '1px solid #27272a',
                  }}
                >
                  <div
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: '50%',
                      background: '#f5d393',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#0b0c0f',
                      fontWeight: 600,
                      fontSize: 18,
                      margin: '0 auto 8px',
                    }}
                  >
                    {String.fromCharCode(65 + index)}
                  </div>
                  <div style={{ fontWeight: 600, color: '#e4e7ec' }}>
                    Nhà thầu {String.fromCharCode(65 + index)}
                  </div>
                  <div style={{ fontSize: 12, color: '#71717a', marginTop: 2 }}>
                    {bid.code}
                  </div>
                </div>
              ))}

              {/* Price Row */}
              <ComparisonRow label="Giá đề xuất">
                {comparisonBids.map((bid) => (
                  <ComparisonCell
                    key={bid.id}
                    isHighlighted={bid.id === lowestPriceBidId}
                    highlightColor="#22c55e"
                  >
                    <span style={{ fontSize: 18, fontWeight: 700 }}>
                      {formatCurrency(bid.price)}
                    </span>
                  </ComparisonCell>
                ))}
              </ComparisonRow>

              {/* Timeline Row */}
              <ComparisonRow label="Thời gian">
                {comparisonBids.map((bid) => (
                  <ComparisonCell
                    key={bid.id}
                    isHighlighted={bid.id === fastestTimelineBidId}
                    highlightColor="#3b82f6"
                  >
                    <span style={{ fontSize: 16, fontWeight: 600 }}>{bid.timeline}</span>
                  </ComparisonCell>
                ))}
              </ComparisonRow>

              {/* Rating Row */}
              <ComparisonRow label="Đánh giá">
                {comparisonBids.map((bid) => (
                  <ComparisonCell
                    key={bid.id}
                    isHighlighted={bid.id === highestRatingBidId}
                    highlightColor="#f59e0b"
                  >
                    {bid.contractor?.rating !== undefined ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center' }}>
                        <i className="ri-star-fill" style={{ color: '#f59e0b', fontSize: 18 }} />
                        <span style={{ fontSize: 16, fontWeight: 600 }}>
                          {bid.contractor.rating.toFixed(1)}
                        </span>
                      </div>
                    ) : (
                      <span style={{ color: '#71717a', fontSize: 14 }}>Chưa có</span>
                    )}
                  </ComparisonCell>
                ))}
              </ComparisonRow>

              {/* Projects Completed Row */}
              <ComparisonRow label="Số dự án">
                {comparisonBids.map((bid) => (
                  <ComparisonCell key={bid.id}>
                    <span style={{ fontSize: 16 }}>
                      {bid.contractor?.totalProjects ?? 0} dự án
                    </span>
                  </ComparisonCell>
                ))}
              </ComparisonRow>

              {/* Proposal Row */}
              <ComparisonRow label="Đề xuất" isLast>
                {comparisonBids.map((bid) => (
                  <ComparisonCell key={bid.id} isLast>
                    <p
                      style={{
                        fontSize: 13,
                        color: '#a1a1aa',
                        lineHeight: 1.6,
                        textAlign: 'left',
                        maxHeight: 120,
                        overflow: 'auto',
                      }}
                    >
                      {bid.proposal.length > 300
                        ? bid.proposal.substring(0, 300) + '...'
                        : bid.proposal}
                    </p>
                  </ComparisonCell>
                ))}
              </ComparisonRow>

              {/* Action Row */}
              <div style={{ padding: '16px 12px' }} />
              {comparisonBids.map((bid) => (
                <div
                  key={bid.id}
                  style={{
                    padding: '16px 12px',
                    textAlign: 'center',
                    borderLeft: '1px solid #27272a',
                  }}
                >
                  <button
                    className="btn btn-primary"
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                    }}
                    onClick={() => onSelectBid(bid.id)}
                    disabled={isSelecting}
                  >
                    {isSelecting && selectingBidId === bid.id ? (
                      <>
                        <i className="ri-loader-4-line spinner" style={{ marginRight: 8 }} />
                        Đang xử lý...
                      </>
                    ) : (
                      <>
                        <i className="ri-check-line" style={{ marginRight: 8 }} />
                        Chọn nhà thầu này
                      </>
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

/**
 * Comparison Row Component
 */
function ComparisonRow({
  label,
  children,
  isLast = false,
}: {
  label: string;
  children: React.ReactNode;
  isLast?: boolean;
}) {
  return (
    <>
      <div
        style={{
          padding: '16px 12px',
          fontWeight: 500,
          color: '#a1a1aa',
          fontSize: 14,
          borderTop: '1px solid #27272a',
          display: 'flex',
          alignItems: 'center',
          borderBottom: isLast ? '1px solid #27272a' : undefined,
        }}
      >
        {label}
      </div>
      {children}
    </>
  );
}

/**
 * Comparison Cell Component
 */
function ComparisonCell({
  children,
  isHighlighted = false,
  highlightColor,
  isLast = false,
}: {
  children: React.ReactNode;
  isHighlighted?: boolean;
  highlightColor?: string;
  isLast?: boolean;
}) {
  return (
    <div
      style={{
        padding: '16px 12px',
        textAlign: 'center',
        borderLeft: '1px solid #27272a',
        borderTop: '1px solid #27272a',
        borderBottom: isLast ? '1px solid #27272a' : undefined,
        background: isHighlighted && highlightColor
          ? `${highlightColor}15`
          : 'transparent',
        color: isHighlighted && highlightColor ? highlightColor : '#e4e7ec',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {children}
    </div>
  );
}

/**
 * Utility function to validate bid comparison selection
 * Used for property-based testing
 * 
 * **Feature: bidding-phase6-portal, Property 12: Bid Comparison Limit**
 * **Validates: Requirements 20.1**
 */
export function validateBidComparisonSelection(
  selectedBids: string[],
  newBidId: string
): { canAdd: boolean; reason?: string } {
  if (selectedBids.includes(newBidId)) {
    return { canAdd: true }; // Already selected, will toggle off
  }
  
  if (selectedBids.length >= MAX_COMPARISON_BIDS) {
    return {
      canAdd: false,
      reason: `Chỉ có thể so sánh tối đa ${MAX_COMPARISON_BIDS} đề xuất`,
    };
  }
  
  return { canAdd: true };
}

export default BidComparison;
