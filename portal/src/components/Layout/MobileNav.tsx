import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';

interface MobileNavProps {
  isVisible?: boolean;
}

/**
 * Mobile bottom navigation bar for quick access to main sections
 * Only visible on mobile devices (< 640px)
 */
export function MobileNav({ isVisible = true }: MobileNavProps) {
  const { user } = useAuth();
  const location = useLocation();

  if (!isVisible || !user) return null;

  const homeownerNavItems = [
    { path: '/homeowner', icon: 'ri-dashboard-line', label: 'Home' },
    { path: '/homeowner/projects', icon: 'ri-folder-line', label: 'Dự án' },
    { path: '/homeowner/projects/new', icon: 'ri-add-circle-line', label: 'Tạo mới' },
    { path: '/homeowner/notifications', icon: 'ri-notification-3-line', label: 'Thông báo' },
  ];

  const contractorNavItems = [
    { path: '/contractor', icon: 'ri-dashboard-line', label: 'Home' },
    { path: '/contractor/marketplace', icon: 'ri-store-2-line', label: 'Việc làm' },
    { path: '/contractor/my-bids', icon: 'ri-auction-line', label: 'Bid' },
    { path: '/contractor/profile', icon: 'ri-user-line', label: 'Hồ sơ' },
  ];

  const navItems = user.role === 'CONTRACTOR' ? contractorNavItems : homeownerNavItems;

  const isActive = (path: string) => {
    if (path === '/homeowner' || path === '/contractor') {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="mobile-bottom-nav mobile-only" role="navigation" aria-label="Mobile navigation">
      {navItems.map((item) => (
        <Link
          key={item.path}
          to={item.path}
          className={`mobile-nav-item ${isActive(item.path) ? 'active' : ''}`}
          aria-current={isActive(item.path) ? 'page' : undefined}
        >
          <i className={item.icon} />
          <span>{item.label}</span>
        </Link>
      ))}
    </nav>
  );
}
