import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../auth/AuthContext';
import { useOnboarding } from '../../hooks/useOnboarding';
import { HelpCenter } from '../HelpCenter';
import { ThemeToggle } from '../ThemeToggle';
import { useFocusTrap, useEscapeKey } from '../../hooks/useKeyboardNavigation';

interface HeaderProps {
  onMenuToggle: () => void;
  isSidebarOpen: boolean;
}

interface NotificationItem {
  id: string;
  title: string;
  content: string;
  isRead: boolean;
  createdAt: string;
  type: string;
}

export function Header({ onMenuToggle, isSidebarOpen }: HeaderProps) {
  const { user, logout } = useAuth();
  const { restartOnboarding, isCompleted: onboardingCompleted } = useOnboarding();
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showHelpCenter, setShowHelpCenter] = useState(false);
  
  // Mock data - will be replaced with real API calls
  const [unreadNotifications, setUnreadNotifications] = useState(3);
  const [unreadMessages] = useState(2);
  const [notifications, setNotifications] = useState<NotificationItem[]>([
    {
      id: '1',
      title: 'Bid mới',
      content: 'Bạn có bid mới cho dự án "Sơn nhà Q7"',
      isRead: false,
      createdAt: new Date().toISOString(),
      type: 'BID_RECEIVED',
    },
    {
      id: '2',
      title: 'Dự án được duyệt',
      content: 'Dự án "Sửa chữa nhà" đã được duyệt',
      isRead: false,
      createdAt: new Date(Date.now() - 3600000).toISOString(),
      type: 'PROJECT_APPROVED',
    },
    {
      id: '3',
      title: 'Tin nhắn mới',
      content: 'Bạn có tin nhắn mới từ nhà thầu',
      isRead: false,
      createdAt: new Date(Date.now() - 7200000).toISOString(),
      type: 'MESSAGE',
    },
  ]);

  const userMenuRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);
  const chatRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on Escape key
  const closeAllDropdowns = useCallback(() => {
    setShowUserMenu(false);
    setShowNotifications(false);
    setShowChat(false);
  }, []);

  useEscapeKey(closeAllDropdowns, showUserMenu || showNotifications || showChat);

  // Focus trap for dropdowns
  useFocusTrap(userMenuRef, showUserMenu);
  useFocusTrap(notificationRef, showNotifications);
  useFocusTrap(chatRef, showChat);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
      if (chatRef.current && !chatRef.current.contains(event.target as Node)) {
        setShowChat(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNotificationClick = (notification: NotificationItem) => {
    // Mark as read
    setNotifications(prev =>
      prev.map(n => (n.id === notification.id ? { ...n, isRead: true } : n))
    );
    setUnreadNotifications(prev => Math.max(0, prev - 1));
    setShowNotifications(false);
    
    // Navigate based on type
    if (notification.type === 'BID_RECEIVED' || notification.type === 'BID_SELECTED') {
      navigate(user?.role === 'HOMEOWNER' ? '/homeowner/projects' : '/contractor/my-bids');
    } else if (notification.type === 'PROJECT_APPROVED') {
      navigate('/homeowner/projects');
    } else if (notification.type === 'MESSAGE') {
      setShowChat(true);
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Vừa xong';
    if (diffMins < 60) return `${diffMins} phút trước`;
    if (diffHours < 24) return `${diffHours} giờ trước`;
    return `${diffDays} ngày trước`;
  };

  return (
    <header className="portal-header" role="banner">
      {/* Left side */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        {/* Mobile menu toggle */}
        <button
          onClick={onMenuToggle}
          className="mobile-only icon-btn"
          aria-label={isSidebarOpen ? 'Đóng menu điều hướng' : 'Mở menu điều hướng'}
          aria-expanded={isSidebarOpen}
          aria-controls="sidebar-nav"
        >
          <i className={isSidebarOpen ? 'ri-close-line' : 'ri-menu-line'} style={{ fontSize: 24 }} aria-hidden="true" />
        </button>

        <Link to="/" style={{ textDecoration: 'none' }} aria-label="Trang chủ Nội Thất Nhanh">
          <h1 style={{ fontSize: 20, fontWeight: 700, color: '#f5d393' }}>
            Nội Thất Nhanh
          </h1>
        </Link>

        {/* Desktop navigation links */}
        <nav className="desktop-only" style={{ display: 'flex', gap: 8, marginLeft: 24 }} aria-label="Điều hướng chính">
          <Link
            to="/marketplace"
            style={{
              padding: '8px 14px',
              borderRadius: 6,
              color: '#a1a1aa',
              textDecoration: 'none',
              fontSize: 14,
              fontWeight: 500,
              transition: 'color 0.2s',
            }}
          >
            Marketplace
          </Link>
          <Link
            to="/contractors"
            style={{
              padding: '8px 14px',
              borderRadius: 6,
              color: '#a1a1aa',
              textDecoration: 'none',
              fontSize: 14,
              fontWeight: 500,
              transition: 'color 0.2s',
            }}
          >
            Nhà thầu
          </Link>
        </nav>
      </div>

      {/* Right side */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }} role="group" aria-label="Công cụ người dùng">
        {/* Theme Toggle */}
        <ThemeToggle />

        {/* Help Center */}
        <button
          onClick={() => setShowHelpCenter(true)}
          className="header-icon-btn"
          aria-label="Mở trung tâm trợ giúp"
        >
          <i className="ri-question-line" style={{ fontSize: 22 }} aria-hidden="true" />
        </button>

        {/* Notifications */}
        <div ref={notificationRef} style={{ position: 'relative' }}>
          <button
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowChat(false);
              setShowUserMenu(false);
            }}
            className="header-icon-btn"
            aria-label={`Thông báo${unreadNotifications > 0 ? `, ${unreadNotifications} chưa đọc` : ''}`}
            aria-expanded={showNotifications}
            aria-haspopup="true"
          >
            <i className="ri-notification-3-line" style={{ fontSize: 22 }} aria-hidden="true" />
            {unreadNotifications > 0 && (
              <span className="notification-badge" aria-hidden="true">
                {unreadNotifications > 9 ? '9+' : unreadNotifications}
              </span>
            )}
          </button>

          <AnimatePresence>
            {showNotifications && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="dropdown-menu notification-dropdown"
                role="menu"
                aria-label="Danh sách thông báo"
              >
                <div className="dropdown-header">
                  <span style={{ fontWeight: 600, color: '#e4e7ec' }}>Thông báo</span>
                  {unreadNotifications > 0 && (
                    <button
                      onClick={() => {
                        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
                        setUnreadNotifications(0);
                      }}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#f5d393',
                        cursor: 'pointer',
                        fontSize: 12,
                      }}
                      aria-label="Đánh dấu tất cả đã đọc"
                    >
                      Đánh dấu đã đọc
                    </button>
                  )}
                </div>

                <div className="notification-list" role="list" aria-label="Thông báo gần đây">
                  {notifications.length === 0 ? (
                    <div style={{ padding: 24, textAlign: 'center', color: '#71717a' }}>
                      Không có thông báo
                    </div>
                  ) : (
                    notifications.map(notification => (
                      <button
                        key={notification.id}
                        onClick={() => handleNotificationClick(notification)}
                        className={`notification-item ${!notification.isRead ? 'unread' : ''}`}
                        role="menuitem"
                        aria-label={`${notification.title}: ${notification.content}${!notification.isRead ? ', chưa đọc' : ''}`}
                      >
                        <div className="notification-icon" aria-hidden="true">
                          <i
                            className={
                              notification.type === 'BID_RECEIVED'
                                ? 'ri-auction-line'
                                : notification.type === 'PROJECT_APPROVED'
                                ? 'ri-check-double-line'
                                : 'ri-message-3-line'
                            }
                          />
                        </div>
                        <div style={{ flex: 1, textAlign: 'left' }}>
                          <div style={{ fontWeight: 500, color: '#e4e7ec', fontSize: 14 }}>
                            {notification.title}
                          </div>
                          <div style={{ color: '#a1a1aa', fontSize: 13, marginTop: 2 }}>
                            {notification.content}
                          </div>
                          <div style={{ color: '#71717a', fontSize: 12, marginTop: 4 }}>
                            <time dateTime={notification.createdAt}>{formatTimeAgo(notification.createdAt)}</time>
                          </div>
                        </div>
                        {!notification.isRead && <div className="unread-dot" aria-hidden="true" />}
                      </button>
                    ))
                  )}
                </div>

                <Link
                  to={user?.role === 'CONTRACTOR' ? '/contractor/notifications' : '/homeowner/notifications'}
                  onClick={() => setShowNotifications(false)}
                  className="dropdown-footer"
                  role="menuitem"
                >
                  Xem tất cả thông báo
                </Link>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Chat */}
        <div ref={chatRef} style={{ position: 'relative' }}>
          <button
            onClick={() => {
              setShowChat(!showChat);
              setShowNotifications(false);
              setShowUserMenu(false);
            }}
            className="header-icon-btn"
            aria-label={`Tin nhắn${unreadMessages > 0 ? `, ${unreadMessages} chưa đọc` : ''}`}
            aria-expanded={showChat}
            aria-haspopup="true"
          >
            <i className="ri-chat-3-line" style={{ fontSize: 22 }} aria-hidden="true" />
            {unreadMessages > 0 && (
              <span className="notification-badge" aria-hidden="true">
                {unreadMessages > 9 ? '9+' : unreadMessages}
              </span>
            )}
          </button>

          <AnimatePresence>
            {showChat && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="dropdown-menu chat-dropdown"
                role="menu"
                aria-label="Danh sách tin nhắn"
              >
                <div className="dropdown-header">
                  <span style={{ fontWeight: 600, color: '#e4e7ec' }}>Tin nhắn</span>
                </div>

                <div className="chat-list" role="list">
                  {/* Placeholder for chat conversations */}
                  <div style={{ padding: 24, textAlign: 'center', color: '#71717a' }}>
                    <i className="ri-chat-3-line" style={{ fontSize: 32, marginBottom: 8, display: 'block' }} aria-hidden="true" />
                    Chưa có cuộc trò chuyện
                  </div>
                </div>

                <Link
                  to="/chat"
                  onClick={() => setShowChat(false)}
                  className="dropdown-footer"
                  role="menuitem"
                >
                  Mở chat
                </Link>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* User menu */}
        <div ref={userMenuRef} style={{ position: 'relative' }}>
          <button
            onClick={() => {
              setShowUserMenu(!showUserMenu);
              setShowNotifications(false);
              setShowChat(false);
            }}
            className="user-menu-btn"
            aria-label={`Menu người dùng: ${user?.name || 'User'}`}
            aria-expanded={showUserMenu}
            aria-haspopup="true"
          >
            <div className="user-avatar" aria-hidden="true">
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <span className="desktop-only" style={{ fontSize: 14 }}>
              {user?.name || 'User'}
            </span>
            <i className="ri-arrow-down-s-line" style={{ fontSize: 18, color: '#71717a' }} aria-hidden="true" />
          </button>

          <AnimatePresence>
            {showUserMenu && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="dropdown-menu user-dropdown"
                role="menu"
                aria-label="Menu tài khoản"
              >
                <div style={{ padding: '12px 16px', borderBottom: '1px solid #27272a' }}>
                  <div style={{ fontSize: 14, fontWeight: 500, color: '#e4e7ec' }}>{user?.name}</div>
                  <div style={{ fontSize: 12, color: '#71717a', marginTop: 2 }}>{user?.email}</div>
                  <div
                    style={{
                      marginTop: 8,
                      padding: '4px 8px',
                      borderRadius: 4,
                      fontSize: 11,
                      display: 'inline-block',
                      background: user?.role === 'CONTRACTOR' ? 'rgba(59, 130, 246, 0.15)' : 'rgba(34, 197, 94, 0.15)',
                      color: user?.role === 'CONTRACTOR' ? '#3b82f6' : '#22c55e',
                    }}
                  >
                    {user?.role === 'CONTRACTOR' ? 'Nhà thầu' : 'Chủ nhà'}
                  </div>
                </div>

                <div style={{ padding: 8 }} role="group" aria-label="Điều hướng tài khoản">
                  <Link
                    to={user?.role === 'CONTRACTOR' ? '/contractor' : '/homeowner'}
                    onClick={() => setShowUserMenu(false)}
                    className="dropdown-item"
                    role="menuitem"
                  >
                    <i className="ri-dashboard-line" aria-hidden="true" />
                    Dashboard
                  </Link>

                  <Link
                    to={user?.role === 'CONTRACTOR' ? '/contractor/profile' : '/homeowner/profile'}
                    onClick={() => setShowUserMenu(false)}
                    className="dropdown-item"
                    role="menuitem"
                  >
                    <i className="ri-user-line" aria-hidden="true" />
                    Hồ sơ
                  </Link>

                  <Link
                    to="/settings"
                    onClick={() => setShowUserMenu(false)}
                    className="dropdown-item"
                    role="menuitem"
                  >
                    <i className="ri-settings-3-line" aria-hidden="true" />
                    Cài đặt
                  </Link>

                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      setShowHelpCenter(true);
                    }}
                    className="dropdown-item"
                    role="menuitem"
                  >
                    <i className="ri-question-line" aria-hidden="true" />
                    Trợ giúp
                  </button>

                  {/* Restart Tour option - only show if onboarding was completed */}
                  {onboardingCompleted && (
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        restartOnboarding();
                        // Navigate to dashboard to show the tour
                        navigate(user?.role === 'CONTRACTOR' ? '/contractor' : '/homeowner');
                      }}
                      className="dropdown-item"
                      role="menuitem"
                    >
                      <i className="ri-refresh-line" aria-hidden="true" />
                      Xem lại hướng dẫn
                    </button>
                  )}
                </div>

                <div style={{ borderTop: '1px solid #27272a', padding: 8 }}>
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      logout();
                    }}
                    className="dropdown-item logout-btn"
                    role="menuitem"
                  >
                    <i className="ri-logout-box-line" aria-hidden="true" />
                    Đăng xuất
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Help Center Panel */}
      <HelpCenter
        isOpen={showHelpCenter}
        onClose={() => setShowHelpCenter(false)}
      />
    </header>
  );
}
