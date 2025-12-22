import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth, type UserRole } from '../../auth/AuthContext';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  width?: number;
}

export interface MenuItem {
  path: string;
  label: string;
  icon: string;
  badge?: number;
  roles?: UserRole[];
}

// Menu items for Homeowner role
const homeownerMenuItems: MenuItem[] = [
  { path: '/homeowner', label: 'Dashboard', icon: 'ri-dashboard-line' },
  { path: '/homeowner/projects', label: 'Dự án của tôi', icon: 'ri-folder-line' },
  { path: '/homeowner/projects/new', label: 'Tạo dự án', icon: 'ri-add-circle-line' },
  { path: '/homeowner/notifications', label: 'Thông báo', icon: 'ri-notification-3-line' },
];

// Menu items for Contractor role
const contractorMenuItems: MenuItem[] = [
  { path: '/contractor', label: 'Dashboard', icon: 'ri-dashboard-line' },
  { path: '/contractor/marketplace', label: 'Marketplace', icon: 'ri-store-2-line' },
  { path: '/contractor/my-bids', label: 'Bid của tôi', icon: 'ri-auction-line' },
  { path: '/contractor/saved-projects', label: 'Đã lưu', icon: 'ri-bookmark-line' },
  { path: '/contractor/profile', label: 'Hồ sơ', icon: 'ri-user-line' },
  { path: '/contractor/notifications', label: 'Thông báo', icon: 'ri-notification-3-line' },
];

// Helper function to get menu items based on role
export function getMenuItemsForRole(role: UserRole | undefined): MenuItem[] {
  if (role === 'CONTRACTOR') {
    return contractorMenuItems;
  }
  if (role === 'HOMEOWNER') {
    return homeownerMenuItems;
  }
  // Admin can see both, default to homeowner
  if (role === 'ADMIN') {
    return homeownerMenuItems;
  }
  return [];
}

export function Sidebar({ isOpen, onClose, width = 260 }: SidebarProps) {
  const { user } = useAuth();
  const location = useLocation();

  const menuItems = getMenuItemsForRole(user?.role);

  const isActive = (path: string) => {
    // Exact match for dashboard routes
    if (path === '/homeowner' || path === '/contractor') {
      return location.pathname === path;
    }
    // Prefix match for other routes
    return location.pathname.startsWith(path);
  };

  return (
    <>
      {/* Overlay for mobile */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="sidebar-overlay mobile-only"
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside
        id="sidebar-nav"
        className={`portal-sidebar ${isOpen ? 'open' : ''}`}
        style={{ width }}
        role="navigation"
        aria-label="Điều hướng chính"
        aria-hidden={!isOpen}
      >
        <nav style={{ padding: 16 }}>
          {/* User info card */}
          <div className="sidebar-user-card" aria-label="Thông tin người dùng">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div className="sidebar-user-avatar" aria-hidden="true">
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="sidebar-user-name">
                  {user?.name || 'User'}
                </div>
                <div className="sidebar-user-role">
                  {user?.role === 'CONTRACTOR' ? 'Nhà thầu' : 'Chủ nhà'}
                </div>
              </div>
            </div>

            {/* Verification status for contractors */}
            {user?.role === 'CONTRACTOR' && (
              <div
                className={`verification-badge ${
                  user.verificationStatus === 'VERIFIED'
                    ? 'verified'
                    : user.verificationStatus === 'PENDING'
                    ? 'pending'
                    : 'rejected'
                }`}
                role="status"
                aria-label={`Trạng thái xác minh: ${
                  user.verificationStatus === 'VERIFIED'
                    ? 'Đã xác minh'
                    : user.verificationStatus === 'PENDING'
                    ? 'Chờ xác minh'
                    : 'Chưa xác minh'
                }`}
              >
                <i
                  className={
                    user.verificationStatus === 'VERIFIED'
                      ? 'ri-verified-badge-line'
                      : user.verificationStatus === 'PENDING'
                      ? 'ri-time-line'
                      : 'ri-error-warning-line'
                  }
                  aria-hidden="true"
                />
                {user.verificationStatus === 'VERIFIED'
                  ? 'Đã xác minh'
                  : user.verificationStatus === 'PENDING'
                  ? 'Chờ xác minh'
                  : 'Chưa xác minh'}
              </div>
            )}
          </div>

          {/* Menu items */}
          <ul className="sidebar-menu" role="menubar" aria-label="Menu chính">
            {menuItems.map((item) => (
              <li key={item.path} role="none">
                <NavLink
                  to={item.path}
                  onClick={onClose}
                  className={`sidebar-menu-item ${isActive(item.path) ? 'active' : ''}`}
                  aria-current={isActive(item.path) ? 'page' : undefined}
                  role="menuitem"
                >
                  <i className={item.icon} style={{ fontSize: 20 }} aria-hidden="true" />
                  <span>{item.label}</span>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className="sidebar-badge" aria-label={`${item.badge} mục mới`}>
                      {item.badge > 99 ? '99+' : item.badge}
                    </span>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>

          {/* Bottom links */}
          <div className="sidebar-bottom" role="group" aria-label="Liên kết phụ">
            <NavLink to="/" className="sidebar-bottom-link">
              <i className="ri-home-line" style={{ fontSize: 20 }} aria-hidden="true" />
              Về trang chủ
            </NavLink>

            <NavLink to="/help" className="sidebar-bottom-link">
              <i className="ri-question-line" style={{ fontSize: 20 }} aria-hidden="true" />
              Trợ giúp
            </NavLink>
          </div>
        </nav>
      </aside>
    </>
  );
}
