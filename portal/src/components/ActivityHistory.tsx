/**
 * Activity History Component
 *
 * Displays user activity history in a timeline view with icons per activity type.
 *
 * **Feature: bidding-phase6-portal**
 * **Requirements: 23.2**
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { activityApi, type Activity, type ActivityType } from '../api';
import { useToast } from './Toast';

// Activity type configuration
const ACTIVITY_CONFIG: Record<
  ActivityType,
  { icon: string; color: string; bgColor: string; label: string }
> = {
  PROJECT_CREATED: {
    icon: 'ri-add-circle-line',
    color: '#3b82f6',
    bgColor: 'rgba(59, 130, 246, 0.15)',
    label: 'Tạo công trình',
  },
  PROJECT_SUBMITTED: {
    icon: 'ri-send-plane-line',
    color: '#8b5cf6',
    bgColor: 'rgba(139, 92, 246, 0.15)',
    label: 'Gửi duyệt',
  },
  PROJECT_APPROVED: {
    icon: 'ri-checkbox-circle-line',
    color: '#22c55e',
    bgColor: 'rgba(34, 197, 94, 0.15)',
    label: 'Được duyệt',
  },
  PROJECT_REJECTED: {
    icon: 'ri-close-circle-line',
    color: '#ef4444',
    bgColor: 'rgba(239, 68, 68, 0.15)',
    label: 'Bị từ chối',
  },
  BID_SUBMITTED: {
    icon: 'ri-file-text-line',
    color: '#f59e0b',
    bgColor: 'rgba(245, 158, 11, 0.15)',
    label: 'Gửi đề xuất',
  },
  BID_APPROVED: {
    icon: 'ri-checkbox-circle-line',
    color: '#22c55e',
    bgColor: 'rgba(34, 197, 94, 0.15)',
    label: 'Đề xuất được duyệt',
  },
  BID_REJECTED: {
    icon: 'ri-close-circle-line',
    color: '#ef4444',
    bgColor: 'rgba(239, 68, 68, 0.15)',
    label: 'Đề xuất bị từ chối',
  },
  BID_SELECTED: {
    icon: 'ri-trophy-line',
    color: '#f5d393',
    bgColor: 'rgba(245, 211, 147, 0.15)',
    label: 'Được chọn',
  },
  MATCH_CREATED: {
    icon: 'ri-link-line',
    color: '#06b6d4',
    bgColor: 'rgba(6, 182, 212, 0.15)',
    label: 'Ghép nối',
  },
  PROJECT_STARTED: {
    icon: 'ri-play-circle-line',
    color: '#3b82f6',
    bgColor: 'rgba(59, 130, 246, 0.15)',
    label: 'Bắt đầu thi công',
  },
  PROJECT_COMPLETED: {
    icon: 'ri-flag-line',
    color: '#22c55e',
    bgColor: 'rgba(34, 197, 94, 0.15)',
    label: 'Hoàn thành',
  },
  REVIEW_WRITTEN: {
    icon: 'ri-star-line',
    color: '#f59e0b',
    bgColor: 'rgba(245, 158, 11, 0.15)',
    label: 'Đánh giá',
  },
};

// Filter options
const FILTER_OPTIONS: { value: ActivityType | ''; label: string }[] = [
  { value: '', label: 'Tất cả' },
  { value: 'PROJECT_CREATED', label: 'Tạo công trình' },
  { value: 'PROJECT_SUBMITTED', label: 'Gửi duyệt' },
  { value: 'PROJECT_APPROVED', label: 'Được duyệt' },
  { value: 'PROJECT_REJECTED', label: 'Bị từ chối' },
  { value: 'BID_SUBMITTED', label: 'Gửi đề xuất' },
  { value: 'BID_APPROVED', label: 'Đề xuất được duyệt' },
  { value: 'BID_REJECTED', label: 'Đề xuất bị từ chối' },
  { value: 'BID_SELECTED', label: 'Được chọn' },
  { value: 'MATCH_CREATED', label: 'Ghép nối' },
  { value: 'PROJECT_STARTED', label: 'Bắt đầu thi công' },
  { value: 'PROJECT_COMPLETED', label: 'Hoàn thành' },
  { value: 'REVIEW_WRITTEN', label: 'Đánh giá' },
];

interface ActivityHistoryProps {
  /** Maximum number of items to show (for compact view) */
  maxItems?: number;
  /** Show filters */
  showFilters?: boolean;
  /** Show "View All" link */
  showViewAll?: boolean;
  /** Custom class name */
  className?: string;
}

export function ActivityHistory({
  maxItems,
  showFilters = true,
  showViewAll = false,
  className = '',
}: ActivityHistoryProps) {
  const { showToast } = useToast();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [typeFilter, setTypeFilter] = useState<ActivityType | ''>('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    loadActivities();
  }, [page, typeFilter, startDate, endDate]);

  const loadActivities = async () => {
    setIsLoading(true);
    try {
      const query: {
        page: number;
        limit: number;
        type?: ActivityType;
        startDate?: string;
        endDate?: string;
      } = {
        page,
        limit: maxItems || 20,
      };

      if (typeFilter) {
        query.type = typeFilter;
      }
      if (startDate) {
        query.startDate = new Date(startDate).toISOString();
      }
      if (endDate) {
        query.endDate = new Date(endDate).toISOString();
      }

      const result = await activityApi.getActivities(query);
      setActivities(result.data);
      setTotalPages(result.meta.totalPages);
    } catch (error) {
      console.error('Failed to load activities:', error);
      showToast('Không thể tải lịch sử hoạt động', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Vừa xong';
    if (diffMins < 60) return `${diffMins} phút trước`;
    if (diffHours < 24) return `${diffHours} giờ trước`;
    if (diffDays < 7) return `${diffDays} ngày trước`;

    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const getDetailLink = (activity: Activity): string | null => {
    const data = activity.data as Record<string, unknown> | undefined;
    if (!data) return null;

    switch (activity.type) {
      case 'PROJECT_CREATED':
      case 'PROJECT_SUBMITTED':
      case 'PROJECT_APPROVED':
      case 'PROJECT_REJECTED':
      case 'PROJECT_STARTED':
      case 'PROJECT_COMPLETED':
      case 'MATCH_CREATED':
        return data.projectId ? `/homeowner/projects/${data.projectId}` : null;
      case 'BID_SUBMITTED':
      case 'BID_APPROVED':
      case 'BID_REJECTED':
      case 'BID_SELECTED':
        return data.bidId ? `/contractor/my-bids/${data.bidId}` : null;
      case 'REVIEW_WRITTEN':
        return data.projectId ? `/homeowner/projects/${data.projectId}` : null;
      default:
        return null;
    }
  };

  const clearFilters = () => {
    setTypeFilter('');
    setStartDate('');
    setEndDate('');
    setPage(1);
  };

  if (isLoading && activities.length === 0) {
    return (
      <div className={className} style={{ padding: 24, textAlign: 'center' }}>
        <i className="ri-loader-4-line spinner" style={{ fontSize: 24, color: '#f5d393' }} />
        <p style={{ color: '#a1a1aa', marginTop: 8 }}>Đang tải...</p>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Filters */}
      {showFilters && (
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 12,
            marginBottom: 20,
            alignItems: 'flex-end',
          }}
        >
          <div style={{ flex: '1 1 200px', minWidth: 150 }}>
            <label
              style={{
                display: 'block',
                fontSize: 13,
                color: '#a1a1aa',
                marginBottom: 6,
              }}
            >
              Loại hoạt động
            </label>
            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value as ActivityType | '');
                setPage(1);
              }}
              className="input"
              style={{ width: '100%' }}
            >
              {FILTER_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div style={{ flex: '1 1 150px', minWidth: 130 }}>
            <label
              style={{
                display: 'block',
                fontSize: 13,
                color: '#a1a1aa',
                marginBottom: 6,
              }}
            >
              Từ ngày
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setPage(1);
              }}
              className="input"
              style={{ width: '100%' }}
            />
          </div>

          <div style={{ flex: '1 1 150px', minWidth: 130 }}>
            <label
              style={{
                display: 'block',
                fontSize: 13,
                color: '#a1a1aa',
                marginBottom: 6,
              }}
            >
              Đến ngày
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setPage(1);
              }}
              className="input"
              style={{ width: '100%' }}
            />
          </div>

          {(typeFilter || startDate || endDate) && (
            <button
              type="button"
              onClick={clearFilters}
              style={{
                padding: '10px 16px',
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: 8,
                color: '#ef4444',
                cursor: 'pointer',
                fontSize: 14,
              }}
            >
              <i className="ri-close-line" style={{ marginRight: 4 }} />
              Xóa bộ lọc
            </button>
          )}
        </div>
      )}

      {/* Timeline */}
      {activities.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: 40,
            color: '#71717a',
          }}
        >
          <i className="ri-history-line" style={{ fontSize: 48, marginBottom: 12 }} />
          <p>Chưa có hoạt động nào</p>
        </div>
      ) : (
        <div style={{ position: 'relative' }}>
          {/* Timeline line */}
          <div
            style={{
              position: 'absolute',
              left: 20,
              top: 0,
              bottom: 0,
              width: 2,
              background: 'rgba(255, 255, 255, 0.1)',
            }}
          />

          {/* Activity items */}
          {activities.map((activity, index) => {
            const config = ACTIVITY_CONFIG[activity.type];
            const detailLink = getDetailLink(activity);

            return (
              <motion.div
                key={activity.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                style={{
                  display: 'flex',
                  gap: 16,
                  marginBottom: 16,
                  position: 'relative',
                }}
              >
                {/* Icon */}
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    background: config.bgColor,
                    border: `2px solid ${config.color}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    zIndex: 1,
                  }}
                >
                  <i className={config.icon} style={{ fontSize: 18, color: config.color }} />
                </div>

                {/* Content */}
                <div
                  style={{
                    flex: 1,
                    background: 'rgba(255, 255, 255, 0.02)',
                    borderRadius: 12,
                    padding: 16,
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      marginBottom: 4,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 12,
                        color: config.color,
                        fontWeight: 500,
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                      }}
                    >
                      {config.label}
                    </span>
                    <span style={{ fontSize: 12, color: '#71717a' }}>
                      {formatDate(activity.createdAt)}
                    </span>
                  </div>

                  <h4
                    style={{
                      fontSize: 15,
                      fontWeight: 600,
                      color: '#e4e7ec',
                      marginBottom: 4,
                    }}
                  >
                    {activity.title}
                  </h4>

                  {activity.description && (
                    <p style={{ fontSize: 14, color: '#a1a1aa', marginBottom: 8 }}>
                      {activity.description}
                    </p>
                  )}

                  {/* Detail link - Requirements: 23.4 */}
                  {detailLink && (
                    <Link
                      to={detailLink}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                        fontSize: 13,
                        color: '#f5d393',
                        textDecoration: 'none',
                      }}
                    >
                      Xem chi tiết
                      <i className="ri-arrow-right-line" />
                    </Link>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {!maxItems && totalPages > 1 && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: 8,
            marginTop: 24,
          }}
        >
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            style={{
              padding: '8px 16px',
              background: page === 1 ? 'rgba(255, 255, 255, 0.02)' : 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: 8,
              color: page === 1 ? '#52525b' : '#e4e7ec',
              cursor: page === 1 ? 'not-allowed' : 'pointer',
              fontSize: 14,
            }}
          >
            <i className="ri-arrow-left-line" />
          </button>

          <span
            style={{
              padding: '8px 16px',
              color: '#a1a1aa',
              fontSize: 14,
            }}
          >
            Trang {page} / {totalPages}
          </span>

          <button
            type="button"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            style={{
              padding: '8px 16px',
              background:
                page === totalPages ? 'rgba(255, 255, 255, 0.02)' : 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: 8,
              color: page === totalPages ? '#52525b' : '#e4e7ec',
              cursor: page === totalPages ? 'not-allowed' : 'pointer',
              fontSize: 14,
            }}
          >
            <i className="ri-arrow-right-line" />
          </button>
        </div>
      )}

      {/* View All link */}
      {showViewAll && activities.length > 0 && (
        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <Link
            to="/profile/activity"
            style={{
              color: '#f5d393',
              fontSize: 14,
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            Xem tất cả hoạt động
            <i className="ri-arrow-right-line" />
          </Link>
        </div>
      )}
    </div>
  );
}

export default ActivityHistory;
