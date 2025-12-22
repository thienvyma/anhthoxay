/**
 * ProjectCard Component
 *
 * Reusable card component for displaying project summary:
 * - Project title and description
 * - Status badge with color coding
 * - Bid count and deadline
 * - Region and budget info
 *
 * **Feature: bidding-phase6-portal**
 * **Requirements: 5.1, 9.1, 13.1**
 */

import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import type { Project, ProjectStatus } from '../api';

export interface ProjectCardProps {
  project: Project;
  /** Link destination when card is clicked */
  linkTo?: string;
  /** Show bid count (default: true for OPEN status) */
  showBidCount?: boolean;
  /** Show deadline countdown (default: true for OPEN status) */
  showDeadline?: boolean;
  /** Show owner info (only for matched projects) */
  showOwner?: boolean;
  /** Show bookmark button (for contractors) */
  showBookmark?: boolean;
  /** Is project bookmarked */
  isBookmarked?: boolean;
  /** Callback when bookmark is toggled */
  onBookmarkToggle?: (projectId: string) => void;
  /** Animation delay for staggered animations */
  animationDelay?: number;
  /** Variant: 'default' | 'compact' */
  variant?: 'default' | 'compact';
}

const STATUS_LABELS: Record<ProjectStatus, string> = {
  DRAFT: 'Nháp',
  PENDING_APPROVAL: 'Chờ duyệt',
  REJECTED: 'Bị từ chối',
  OPEN: 'Đang đấu giá',
  BIDDING_CLOSED: 'Hết hạn đấu giá',
  PENDING_MATCH: 'Chờ duyệt kết nối',
  MATCHED: 'Đã chọn nhà thầu',
  IN_PROGRESS: 'Đang thi công',
  COMPLETED: 'Hoàn thành',
  CANCELLED: 'Đã hủy',
};

const STATUS_COLORS: Record<ProjectStatus, string> = {
  DRAFT: '#71717a',
  PENDING_APPROVAL: '#f59e0b',
  REJECTED: '#ef4444',
  OPEN: '#3b82f6',
  BIDDING_CLOSED: '#8b5cf6',
  PENDING_MATCH: '#a855f7',
  MATCHED: '#22c55e',
  IN_PROGRESS: '#f59e0b',
  COMPLETED: '#22c55e',
  CANCELLED: '#71717a',
};

/**
 * Format budget range for display
 */
function formatBudget(min?: number, max?: number): string {
  if (!min && !max) return 'Chưa xác định';
  const format = (n: number) => new Intl.NumberFormat('vi-VN').format(n);
  if (min && max) return `${format(min)} - ${format(max)} VNĐ`;
  if (min) return `Từ ${format(min)} VNĐ`;
  if (max) return `Đến ${format(max)} VNĐ`;
  return 'Chưa xác định';
}

/**
 * Format date for display
 */
function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

/**
 * Calculate days remaining until deadline
 */
function getDaysRemaining(deadline?: string): { text: string; isUrgent: boolean } | null {
  if (!deadline) return null;
  const now = new Date();
  const deadlineDate = new Date(deadline);
  const diffMs = deadlineDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / 86400000);

  if (diffDays < 0) return { text: 'Đã hết hạn', isUrgent: true };
  if (diffDays === 0) return { text: 'Hết hạn hôm nay', isUrgent: true };
  if (diffDays === 1) return { text: 'Còn 1 ngày', isUrgent: true };
  if (diffDays <= 3) return { text: `Còn ${diffDays} ngày`, isUrgent: true };
  return { text: `Còn ${diffDays} ngày`, isUrgent: false };
}

export function ProjectCard({
  project,
  linkTo,
  showBidCount = true,
  showDeadline = true,
  showOwner = false,
  showBookmark = false,
  isBookmarked = false,
  onBookmarkToggle,
  animationDelay = 0,
  variant = 'default',
}: ProjectCardProps) {
  const deadline = getDaysRemaining(project.bidDeadline);
  const isOpen = project.status === 'OPEN';

  const handleBookmarkClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onBookmarkToggle?.(project.id);
  };

  const cardContent = (
    <div
      className="card project-card"
      style={{
        padding: variant === 'compact' ? 16 : 20,
        cursor: linkTo ? 'pointer' : 'default',
        transition: 'all 0.2s',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
      onMouseEnter={(e) => {
        if (linkTo) {
          e.currentTarget.style.borderColor = '#3f3f46';
          e.currentTarget.style.transform = 'translateY(-2px)';
        }
      }}
      onMouseLeave={(e) => {
        if (linkTo) {
          e.currentTarget.style.borderColor = '#27272a';
          e.currentTarget.style.transform = 'translateY(0)';
        }
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: 12,
        }}
      >
        <span
          className="badge"
          style={{
            background: `${STATUS_COLORS[project.status]}20`,
            color: STATUS_COLORS[project.status],
          }}
        >
          {STATUS_LABELS[project.status]}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {showBookmark && (
            <button
              onClick={handleBookmarkClick}
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: 4,
                color: isBookmarked ? '#f5d393' : '#71717a',
                transition: 'color 0.2s',
              }}
              aria-label={isBookmarked ? 'Bỏ lưu' : 'Lưu dự án'}
            >
              <i
                className={isBookmarked ? 'ri-bookmark-fill' : 'ri-bookmark-line'}
                style={{ fontSize: 18 }}
              />
            </button>
          )}
          <span style={{ fontSize: 12, color: '#71717a' }}>{project.code}</span>
        </div>
      </div>

      {/* Title */}
      <h3
        style={{
          fontSize: variant === 'compact' ? 14 : 16,
          fontWeight: 600,
          color: '#e4e7ec',
          marginBottom: 8,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {project.title}
      </h3>

      {/* Description */}
      <p
        style={{
          fontSize: 13,
          color: '#a1a1aa',
          marginBottom: 16,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          display: '-webkit-box',
          WebkitLineClamp: variant === 'compact' ? 1 : 2,
          WebkitBoxOrient: 'vertical',
          lineHeight: 1.5,
          minHeight: variant === 'compact' ? 20 : 39,
          flex: variant === 'compact' ? 0 : 1,
        }}
      >
        {project.description}
      </p>

      {/* Info Grid */}
      {variant !== 'compact' && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 12,
            marginBottom: 16,
          }}
        >
          <div>
            <div style={{ fontSize: 11, color: '#71717a', marginBottom: 2 }}>Khu vực</div>
            <div style={{ fontSize: 13, color: '#e4e7ec' }}>
              {project.region?.name || 'Chưa xác định'}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: '#71717a', marginBottom: 2 }}>Ngân sách</div>
            <div style={{ fontSize: 13, color: '#e4e7ec' }}>
              {formatBudget(project.budgetMin, project.budgetMax)}
            </div>
          </div>
        </div>
      )}

      {/* Category (compact variant) */}
      {variant === 'compact' && (
        <div style={{ marginBottom: 12 }}>
          <span style={{ fontSize: 12, color: '#71717a' }}>
            {project.category?.name || project.region?.name || 'Chưa phân loại'}
          </span>
        </div>
      )}

      {/* Owner Info (for matched projects) */}
      {showOwner && project.owner && (
        <div
          style={{
            padding: 12,
            background: 'rgba(34, 197, 94, 0.1)',
            borderRadius: 8,
            marginBottom: 16,
            border: '1px solid rgba(34, 197, 94, 0.2)',
          }}
        >
          <div
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: '#22c55e',
              marginBottom: 4,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <i className="ri-user-line" />
            Chủ nhà
          </div>
          <div style={{ fontSize: 14, color: '#e4e7ec' }}>{project.owner.name}</div>
        </div>
      )}

      {/* Footer */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingTop: 12,
          borderTop: '1px solid #27272a',
          marginTop: 'auto',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {isOpen && showBidCount && (
            <span style={{ fontSize: 12, color: '#71717a' }}>
              <i className="ri-file-list-3-line" style={{ marginRight: 4 }} />
              {project.bidCount || 0} đề xuất
            </span>
          )}
          {isOpen && showDeadline && deadline && (
            <span
              style={{
                fontSize: 12,
                color: deadline.isUrgent ? '#ef4444' : '#f59e0b',
              }}
            >
              <i className="ri-time-line" style={{ marginRight: 4 }} />
              {deadline.text}
            </span>
          )}
          {!isOpen && (
            <span style={{ fontSize: 12, color: '#71717a' }}>
              {formatDate(project.createdAt)}
            </span>
          )}
        </div>
        {linkTo && (
          <i className="ri-arrow-right-s-line" style={{ fontSize: 18, color: '#71717a' }} />
        )}
      </div>
    </div>
  );

  const wrappedContent = linkTo ? (
    <Link to={linkTo} style={{ textDecoration: 'none', display: 'block', height: '100%' }}>
      {cardContent}
    </Link>
  ) : (
    cardContent
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: animationDelay }}
      style={{ height: '100%' }}
    >
      {wrappedContent}
    </motion.div>
  );
}

export default ProjectCard;
