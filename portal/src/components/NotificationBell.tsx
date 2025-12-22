/**
 * NotificationBell Component
 *
 * Notification bell with dropdown for displaying notifications:
 * - Badge with unread count
 * - Dropdown with recent notifications
 * - Click to navigate to relevant page
 * - View all link
 *
 * **Feature: bidding-phase6-portal**
 * **Requirements: 16.1, 16.2, 16.3, 16.4**
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { notificationsApi, type Notification, type NotificationType } from '../api';
import { useAuth } from '../auth/AuthContext';

export interface NotificationBellProps {
  /** Maximum number of notifications to show in dropdown */
  maxItems?: number;
  /** Polling interval in milliseconds (0 to disable) */
  pollingInterval?: number;
  /** Custom class name */
  className?: string;
}

const NOTIFICATION_ICONS: Record<NotificationType, string> = {
  BID_SELECTED: 'ri-trophy-line',
  BID_NOT_SELECTED: 'ri-close-circle-line',
  ESCROW_HELD: 'ri-safe-2-line',
  ESCROW_RELEASED: 'ri-money-dollar-circle-line',
  ESCROW_PARTIAL_RELEASED: 'ri-money-dollar-circle-line',
  ESCROW_REFUNDED: 'ri-refund-2-line',
  ESCROW_DISPUTED: 'ri-error-warning-line',
  MILESTONE_REQUESTED: 'ri-flag-line',
  MILESTONE_CONFIRMED: 'ri-check-double-line',
  MILESTONE_DISPUTED: 'ri-error-warning-line',
  DISPUTE_RESOLVED: 'ri-scales-3-line',
  NEW_BID: 'ri-auction-line',
  PROJECT_APPROVED: 'ri-check-line',
  PROJECT_REJECTED: 'ri-close-line',
  NEW_MESSAGE: 'ri-message-3-line',
};

const NOTIFICATION_COLORS: Record<NotificationType, string> = {
  BID_SELECTED: '#22c55e',
  BID_NOT_SELECTED: '#71717a',
  ESCROW_HELD: '#3b82f6',
  ESCROW_RELEASED: '#22c55e',
  ESCROW_PARTIAL_RELEASED: '#f59e0b',
  ESCROW_REFUNDED: '#f59e0b',
  ESCROW_DISPUTED: '#ef4444',
  MILESTONE_REQUESTED: '#3b82f6',
  MILESTONE_CONFIRMED: '#22c55e',
  MILESTONE_DISPUTED: '#ef4444',
  DISPUTE_RESOLVED: '#22c55e',
  NEW_BID: '#f5d393',
  PROJECT_APPROVED: '#22c55e',
  PROJECT_REJECTED: '#ef4444',
  NEW_MESSAGE: '#3b82f6',
};

/**
 * Format time ago for display
 */
function formatTimeAgo(dateString: string): string {
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
  return date.toLocaleDateString('vi-VN');
}

/**
 * Get navigation path based on notification type and data
 */
function getNotificationPath(
  notification: Notification,
  userRole?: string
): string | null {
  const data = notification.data as Record<string, string> | undefined;

  switch (notification.type) {
    case 'NEW_BID':
    case 'BID_SELECTED':
    case 'BID_NOT_SELECTED':
      if (userRole === 'HOMEOWNER' && data?.projectId) {
        return `/homeowner/projects/${data.projectId}`;
      }
      if (userRole === 'CONTRACTOR' && data?.bidId) {
        return `/contractor/my-bids/${data.bidId}`;
      }
      return userRole === 'HOMEOWNER' ? '/homeowner/projects' : '/contractor/my-bids';

    case 'PROJECT_APPROVED':
    case 'PROJECT_REJECTED':
      if (data?.projectId) {
        return `/homeowner/projects/${data.projectId}`;
      }
      return '/homeowner/projects';

    case 'ESCROW_HELD':
    case 'ESCROW_RELEASED':
    case 'ESCROW_PARTIAL_RELEASED':
    case 'ESCROW_REFUNDED':
    case 'ESCROW_DISPUTED':
    case 'MILESTONE_REQUESTED':
    case 'MILESTONE_CONFIRMED':
    case 'MILESTONE_DISPUTED':
    case 'DISPUTE_RESOLVED':
      if (data?.projectId) {
        return userRole === 'HOMEOWNER'
          ? `/homeowner/projects/${data.projectId}`
          : `/contractor/my-bids/${data.bidId || ''}`;
      }
      return userRole === 'HOMEOWNER' ? '/homeowner/projects' : '/contractor/my-bids';

    case 'NEW_MESSAGE':
      return '/chat';

    default:
      return null;
  }
}

export function NotificationBell({
  maxItems = 5,
  pollingInterval = 30000,
  className,
}: NotificationBellProps) {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      const result = await notificationsApi.getNotifications({
        page: 1,
        limit: maxItems,
      });
      setNotifications(result.data);
      setUnreadCount(result.unreadCount);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  }, [isAuthenticated, maxItems]);

  // Initial fetch
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Polling for new notifications
  useEffect(() => {
    if (!isAuthenticated || pollingInterval <= 0) return;

    const interval = setInterval(fetchNotifications, pollingInterval);
    return () => clearInterval(interval);
  }, [isAuthenticated, pollingInterval, fetchNotifications]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle notification click
  const handleNotificationClick = async (notification: Notification) => {
    // Mark as read if unread
    if (!notification.isRead) {
      try {
        await notificationsApi.markAsRead(notification.id);
        setNotifications((prev) =>
          prev.map((n) => (n.id === notification.id ? { ...n, isRead: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } catch (error) {
        console.error('Failed to mark notification as read:', error);
      }
    }

    // Navigate to relevant page
    const path = getNotificationPath(notification, user?.role);
    if (path) {
      navigate(path);
    }

    setIsOpen(false);
  };

  // Handle mark all as read
  const handleMarkAllAsRead = async () => {
    if (unreadCount === 0) return;

    setIsLoading(true);
    try {
      await notificationsApi.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle view all
  const handleViewAll = () => {
    const path =
      user?.role === 'CONTRACTOR' ? '/contractor/notifications' : '/homeowner/notifications';
    navigate(path);
    setIsOpen(false);
  };

  if (!isAuthenticated) return null;

  return (
    <div ref={dropdownRef} style={{ position: 'relative' }} className={className}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="header-icon-btn"
        aria-label="Thông báo"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <i className="ri-notification-3-line" style={{ fontSize: 22 }} />
        {unreadCount > 0 && (
          <span className="notification-badge" aria-label={`${unreadCount} thông báo chưa đọc`}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="dropdown-menu notification-dropdown"
            role="menu"
            aria-label="Thông báo"
          >
            {/* Header */}
            <div className="dropdown-header">
              <span style={{ fontWeight: 600, color: '#e4e7ec' }}>Thông báo</span>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  disabled={isLoading}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#f5d393',
                    cursor: isLoading ? 'not-allowed' : 'pointer',
                    fontSize: 12,
                    opacity: isLoading ? 0.5 : 1,
                  }}
                >
                  {isLoading ? 'Đang xử lý...' : 'Đánh dấu đã đọc'}
                </button>
              )}
            </div>

            {/* Notification List */}
            <div className="notification-list" role="list">
              {notifications.length === 0 ? (
                <div style={{ padding: 24, textAlign: 'center', color: '#71717a' }}>
                  <i
                    className="ri-notification-off-line"
                    style={{ fontSize: 32, marginBottom: 8, display: 'block' }}
                  />
                  Không có thông báo
                </div>
              ) : (
                notifications.map((notification) => (
                  <button
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`notification-item ${!notification.isRead ? 'unread' : ''}`}
                    role="menuitem"
                  >
                    <div
                      className="notification-icon"
                      style={{
                        background: `${NOTIFICATION_COLORS[notification.type]}20`,
                        color: NOTIFICATION_COLORS[notification.type],
                      }}
                    >
                      <i className={NOTIFICATION_ICONS[notification.type]} />
                    </div>
                    <div style={{ flex: 1, textAlign: 'left' }}>
                      <div style={{ fontWeight: 500, color: '#e4e7ec', fontSize: 14 }}>
                        {notification.title}
                      </div>
                      <div
                        style={{
                          color: '#a1a1aa',
                          fontSize: 13,
                          marginTop: 2,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          maxWidth: 240,
                        }}
                      >
                        {notification.content}
                      </div>
                      <div style={{ color: '#71717a', fontSize: 12, marginTop: 4 }}>
                        {formatTimeAgo(notification.createdAt)}
                      </div>
                    </div>
                    {!notification.isRead && <div className="unread-dot" />}
                  </button>
                ))
              )}
            </div>

            {/* Footer */}
            <button onClick={handleViewAll} className="dropdown-footer">
              Xem tất cả thông báo
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default NotificationBell;
