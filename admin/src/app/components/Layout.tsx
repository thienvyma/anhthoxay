/**
 * Layout Component
 * Main layout with responsive sidebar and navigation
 *
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5
 */

import { ReactNode, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { tokens } from '@app/shared';
import { useResponsive } from '../../hooks/useResponsive';
import type { RouteType } from '../types';

interface LayoutProps {
  children: ReactNode;
  currentRoute: RouteType;
  currentPageSlug?: string;
  onNavigate: (route: RouteType, slug?: string) => void;
  onLogout: () => void;
  userEmail?: string;
}

// Sidebar widths
const SIDEBAR_WIDTH = 260;
const SIDEBAR_COLLAPSED_WIDTH = 80;

// Menu item types
type MenuItem = 
  | { type: 'item'; route: RouteType; icon: string; label: string }
  | { type: 'dropdown'; icon: string; label: string; badge?: string; children: Array<{ route: RouteType; icon: string; label: string }> };

export function Layout({
  children,
  currentRoute,
  currentPageSlug,
  onNavigate,
  onLogout,
  userEmail,
}: LayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const { isMobile, isTablet, breakpoint } = useResponsive();

  // Close mobile menu when navigating
  const handleNavigate = useCallback(
    (route: RouteType, slug?: string) => {
      onNavigate(route, slug);
      setMobileMenuOpen(false);
    },
    [onNavigate]
  );

  // Toggle dropdown
  const toggleDropdown = useCallback((label: string) => {
    setOpenDropdown(prev => prev === label ? null : label);
  }, []);

  const menuItems: MenuItem[] = [
    // Main features - đang sử dụng
    { type: 'item', route: 'dashboard', icon: 'ri-dashboard-3-line', label: 'Dashboard' },
    { type: 'item', route: 'pages', icon: 'ri-pages-line', label: 'Pages & Sections' },
    { type: 'item', route: 'media', icon: 'ri-gallery-line', label: 'Media Library' },
    { type: 'item', route: 'blog-manager', icon: 'ri-quill-pen-line', label: 'Blog Manager' },
    { type: 'item', route: 'leads', icon: 'ri-contacts-book-line', label: 'Khách hàng' },
    { type: 'item', route: 'furniture', icon: 'ri-sofa-line', label: 'Nội thất' },
    { type: 'item', route: 'users', icon: 'ri-user-settings-line', label: 'Quản lý tài khoản' },
    { type: 'item', route: 'settings', icon: 'ri-settings-3-line', label: 'Settings' },
  ];

  // Coming Soon items - tách riêng để hiển thị ở cuối
  const comingSoonItems: Array<{ route: RouteType; icon: string; label: string }> = [
    { route: 'pricing-config', icon: 'ri-calculator-line', label: 'Cấu hình báo giá' },
    { route: 'bidding', icon: 'ri-auction-line', label: 'Quản lý Đấu thầu' },
    { route: 'bidding-settings', icon: 'ri-settings-4-line', label: 'Cài đặt Đấu thầu' },
    { route: 'contractors', icon: 'ri-building-2-line', label: 'Quản lý Nhà thầu' },
  ];

  // Calculate sidebar width based on state
  const sidebarWidth = sidebarCollapsed ? SIDEBAR_COLLAPSED_WIDTH : SIDEBAR_WIDTH;

  // Check if any child route is active
  const isChildActive = (children: Array<{ route: RouteType }>) => {
    return children.some(child => currentRoute === child.route);
  };

  // Render single menu item
  const renderSingleItem = (
    item: { route: RouteType; icon: string; label: string },
    collapsed: boolean
  ) => {
    const isActive = currentRoute === item.route;
    return (
      <motion.button
        key={item.route}
        whileHover={{ scale: 1.02, x: 4 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => handleNavigate(item.route)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: collapsed ? '12px' : '12px 16px',
          marginBottom: 4,
          background: isActive
            ? `linear-gradient(90deg, ${tokens.color.primary}15, transparent)`
            : 'transparent',
          border: 'none',
          borderLeft: isActive
            ? `3px solid ${tokens.color.primary}`
            : '3px solid transparent',
          borderRadius: tokens.radius.md,
          color: isActive ? tokens.color.primary : tokens.color.muted,
          cursor: 'pointer',
          fontSize: 15,
          fontWeight: isActive ? 600 : 400,
          transition: 'all 0.2s',
          justifyContent: collapsed ? 'center' : 'flex-start',
          minHeight: '44px', // Touch target
        }}
        title={collapsed ? item.label : undefined}
      >
        <i className={item.icon} style={{ fontSize: 20 }} />
        {!collapsed && <span>{item.label}</span>}
      </motion.button>
    );
  };

  // Render dropdown menu item
  const renderDropdownItem = (
    item: { icon: string; label: string; badge?: string; children: Array<{ route: RouteType; icon: string; label: string }> },
    collapsed: boolean
  ) => {
    const isOpen = openDropdown === item.label;
    const hasActiveChild = isChildActive(item.children);

    if (collapsed) {
      // In collapsed mode, show as single button with tooltip
      return (
        <motion.button
          key={item.label}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => toggleDropdown(item.label)}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '12px',
            marginBottom: 4,
            background: hasActiveChild
              ? `linear-gradient(90deg, ${tokens.color.warning}15, transparent)`
              : 'transparent',
            border: 'none',
            borderLeft: hasActiveChild
              ? `3px solid ${tokens.color.warning}`
              : '3px solid transparent',
            borderRadius: tokens.radius.md,
            color: hasActiveChild ? tokens.color.warning : tokens.color.muted,
            cursor: 'pointer',
            fontSize: 20,
            minHeight: '44px',
            position: 'relative',
          }}
          title={item.label}
        >
          <i className={item.icon} />
          {item.badge && (
            <span style={{
              position: 'absolute',
              top: 6,
              right: 6,
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: tokens.color.warning,
            }} />
          )}
        </motion.button>
      );
    }

    return (
      <div key={item.label} style={{ marginBottom: 4 }}>
        <motion.button
          whileHover={{ scale: 1.02, x: 4 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => toggleDropdown(item.label)}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '12px 16px',
            background: hasActiveChild
              ? `linear-gradient(90deg, ${tokens.color.warning}15, transparent)`
              : 'transparent',
            border: 'none',
            borderLeft: hasActiveChild
              ? `3px solid ${tokens.color.warning}`
              : '3px solid transparent',
            borderRadius: tokens.radius.md,
            color: hasActiveChild ? tokens.color.warning : tokens.color.muted,
            cursor: 'pointer',
            fontSize: 15,
            fontWeight: hasActiveChild ? 600 : 400,
            transition: 'all 0.2s',
            minHeight: '44px',
          }}
        >
          <i className={item.icon} style={{ fontSize: 20 }} />
          <span style={{ flex: 1, textAlign: 'left' }}>{item.label}</span>
          {item.badge && (
            <span style={{
              padding: '2px 8px',
              borderRadius: tokens.radius.sm,
              background: `${tokens.color.warning}20`,
              color: tokens.color.warning,
              fontSize: 10,
              fontWeight: 600,
              textTransform: 'uppercase',
            }}>
              {item.badge}
            </span>
          )}
          <motion.i
            className="ri-arrow-down-s-line"
            animate={{ rotate: isOpen ? 180 : 0 }}
            style={{ fontSize: 18 }}
          />
        </motion.button>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              style={{ overflow: 'hidden', paddingLeft: 16 }}
            >
              {item.children.map(child => {
                const isActive = currentRoute === child.route;
                return (
                  <motion.button
                    key={child.route}
                    whileHover={{ x: 4 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleNavigate(child.route)}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '10px 12px',
                      marginTop: 4,
                      background: isActive
                        ? `${tokens.color.primary}10`
                        : 'transparent',
                      border: 'none',
                      borderRadius: tokens.radius.sm,
                      color: isActive ? tokens.color.primary : tokens.color.muted,
                      cursor: 'pointer',
                      fontSize: 14,
                      fontWeight: isActive ? 500 : 400,
                      transition: 'all 0.2s',
                      minHeight: '40px',
                    }}
                  >
                    <i className={child.icon} style={{ fontSize: 16 }} />
                    <span>{child.label}</span>
                  </motion.button>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  // Render menu item (handles both types)
  const renderMenuItem = (item: MenuItem, collapsed: boolean) => {
    if (item.type === 'dropdown') {
      return renderDropdownItem(item, collapsed);
    }
    return renderSingleItem(item, collapsed);
  };

  // Render Coming Soon section
  const renderComingSoonSection = (collapsed: boolean) => {
    if (collapsed) {
      return (
        <div style={{ 
          marginTop: 'auto',
          paddingTop: 16,
          borderTop: `1px solid ${tokens.color.border}`,
        }}>
          <div
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '12px',
              background: 'transparent',
              borderRadius: tokens.radius.md,
              color: tokens.color.muted,
              fontSize: 20,
              minHeight: '44px',
              position: 'relative',
              opacity: 0.6,
            }}
            title="Coming Soon"
          >
            <i className="ri-rocket-line" />
            <span style={{
              position: 'absolute',
              top: 4,
              right: 12,
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: tokens.color.warning,
            }} />
          </div>
        </div>
      );
    }

    return (
      <div style={{ 
        marginTop: 'auto',
        paddingTop: 24,
      }}>
        {/* Separator */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '0 16px',
          marginBottom: 12,
        }}>
          <div style={{ flex: 1, height: 1, background: tokens.color.border }} />
          <span style={{
            padding: '4px 10px',
            borderRadius: tokens.radius.pill,
            background: `${tokens.color.warning}15`,
            color: tokens.color.warning,
            fontSize: 10,
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            whiteSpace: 'nowrap',
          }}>
            <i className="ri-rocket-line" style={{ marginRight: 4 }} />
            Coming Soon
          </span>
          <div style={{ flex: 1, height: 1, background: tokens.color.border }} />
        </div>

        {/* Coming Soon Items */}
        {comingSoonItems.map(item => {
          const isActive = currentRoute === item.route;
          return (
            <motion.button
              key={item.route}
              whileHover={{ scale: 1.02, x: 4 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleNavigate(item.route)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '10px 16px',
                marginBottom: 4,
                background: isActive
                  ? `linear-gradient(90deg, ${tokens.color.warning}10, transparent)`
                  : 'transparent',
                border: 'none',
                borderLeft: isActive
                  ? `3px solid ${tokens.color.warning}`
                  : '3px solid transparent',
                borderRadius: tokens.radius.md,
                color: isActive ? tokens.color.warning : tokens.color.muted,
                cursor: 'pointer',
                fontSize: 14,
                fontWeight: isActive ? 600 : 400,
                transition: 'all 0.2s',
                justifyContent: 'flex-start',
                minHeight: '40px',
                opacity: 0.7,
                position: 'relative',
              }}
              title={item.label}
            >
              <i className={item.icon} style={{ fontSize: 18 }} />
              <span style={{ flex: 1, textAlign: 'left' }}>{item.label}</span>
              <span style={{
                padding: '2px 6px',
                borderRadius: tokens.radius.sm,
                background: `${tokens.color.warning}15`,
                color: tokens.color.warning,
                fontSize: 9,
                fontWeight: 600,
                textTransform: 'uppercase',
              }}>
                Soon
              </span>
            </motion.button>
          );
        })}
      </div>
    );
  };

  // Render user info section
  const renderUserInfo = (collapsed: boolean) => {
    if (collapsed) return null;

    return (
      <div
        style={{
          padding: isMobile ? '12px' : '16px',
          borderTop: `1px solid ${tokens.color.border}`,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            minWidth: 36,
            borderRadius: '50%',
            background: tokens.color.primary,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 16,
            color: '#111',
            fontWeight: 600,
          }}
        >
          {userEmail?.charAt(0).toUpperCase() || 'A'}
        </div>
        <div style={{ flex: 1, overflow: 'hidden', minWidth: 0 }}>
          <div
            style={{
              color: tokens.color.text,
              fontSize: 14,
              fontWeight: 500,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {userEmail || 'Admin'}
          </div>
          <div style={{ color: tokens.color.muted, fontSize: 12 }}>
            Administrator
          </div>
        </div>
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={onLogout}
          style={{
            background: 'transparent',
            border: 'none',
            color: tokens.color.error,
            cursor: 'pointer',
            fontSize: 18,
            minWidth: '44px',
            minHeight: '44px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          title="Logout"
        >
          <i className="ri-logout-circle-line" />
        </motion.button>
      </div>
    );
  };

  return (
    <div
      style={{
        display: 'flex',
        minHeight: '100vh',
        background: tokens.color.background,
      }}
      data-breakpoint={breakpoint}
    >
      {/* Desktop Sidebar */}
      {!isMobile && (
        <motion.aside
          initial={false}
          animate={{ width: sidebarWidth }}
          style={{
            background: 'rgba(15,16,20,0.98)',
            borderRight: `1px solid ${tokens.color.border}`,
            display: 'flex',
            flexDirection: 'column',
            position: 'fixed',
            left: 0,
            top: 0,
            bottom: 0,
            zIndex: tokens.zIndex.sticky,
            transition: 'width 0.3s ease',
          }}
        >
          {/* Logo */}
          <div
            style={{
              padding: sidebarCollapsed ? '24px 16px' : '24px',
              borderBottom: `1px solid ${tokens.color.border}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: sidebarCollapsed ? 'center' : 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: tokens.radius.md,
                  background: `linear-gradient(135deg, ${tokens.color.primary}, ${tokens.color.accent})`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 20,
                  color: '#111',
                }}
              >
                <i className="ri-admin-line" />
              </div>
              {!sidebarCollapsed && (
                <div>
                  <div
                    style={{
                      color: tokens.color.text,
                      fontWeight: 600,
                      fontSize: 16,
                    }}
                  >
                    Admin
                  </div>
                  <div style={{ color: tokens.color.muted, fontSize: 12 }}>
                    Dashboard
                  </div>
                </div>
              )}
            </div>
            {!sidebarCollapsed && (
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setSidebarCollapsed(true)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: tokens.color.muted,
                  cursor: 'pointer',
                  fontSize: 20,
                  minWidth: '44px',
                  minHeight: '44px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <i className="ri-menu-fold-line" />
              </motion.button>
            )}
          </div>

          {/* Menu Items */}
          <nav
            style={{
              flex: 1,
              padding: sidebarCollapsed ? '12px 8px' : '12px',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div>
              {menuItems.map((item) => renderMenuItem(item, sidebarCollapsed))}
            </div>
            {renderComingSoonSection(sidebarCollapsed)}
          </nav>

          {/* Collapse Button (when collapsed) */}
          {sidebarCollapsed && (
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setSidebarCollapsed(false)}
              style={{
                padding: '16px',
                background: 'transparent',
                border: 'none',
                borderTop: `1px solid ${tokens.color.border}`,
                color: tokens.color.muted,
                cursor: 'pointer',
                fontSize: 20,
                minHeight: '44px',
              }}
            >
              <i className="ri-menu-unfold-line" />
            </motion.button>
          )}

          {/* User Info */}
          {renderUserInfo(sidebarCollapsed)}
        </motion.aside>
      )}

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && isMobile && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(0,0,0,0.5)',
                zIndex: tokens.zIndex.overlay,
              }}
            />
            <motion.div
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              style={{
                position: 'fixed',
                left: 0,
                top: 0,
                bottom: 0,
                width: 280,
                background: 'rgba(15,16,20,0.98)',
                borderRight: `1px solid ${tokens.color.border}`,
                zIndex: tokens.zIndex.modal,
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              {/* Mobile Header */}
              <div
                style={{
                  padding: '16px',
                  borderBottom: `1px solid ${tokens.color.border}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: tokens.radius.md,
                      background: `linear-gradient(135deg, ${tokens.color.primary}, ${tokens.color.accent})`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 20,
                      color: '#111',
                    }}
                  >
                    <i className="ri-admin-line" />
                  </div>
                  <div>
                    <div
                      style={{
                        color: tokens.color.text,
                        fontWeight: 600,
                        fontSize: 16,
                      }}
                    >
                      Admin
                    </div>
                    <div style={{ color: tokens.color.muted, fontSize: 12 }}>
                      Dashboard
                    </div>
                  </div>
                </div>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setMobileMenuOpen(false)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: tokens.color.muted,
                    cursor: 'pointer',
                    fontSize: 24,
                    minWidth: '44px',
                    minHeight: '44px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <i className="ri-close-line" />
                </motion.button>
              </div>

              {/* Mobile Menu Items */}
              <nav style={{ flex: 1, padding: '12px', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
                <div>
                  {menuItems.map((item) => renderMenuItem(item, false))}
                </div>
                {renderComingSoonSection(false)}
              </nav>

              {/* Mobile User Info */}
              {renderUserInfo(false)}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div
        style={{
          flex: 1,
          marginLeft: isMobile ? 0 : sidebarWidth,
          transition: 'margin-left 0.3s ease',
          minWidth: 0, // Prevent flex overflow
          maxWidth: '100vw',
          overflowX: 'hidden',
        }}
      >
        {/* Top Bar */}
        <header
          style={{
            background: 'rgba(15,16,20,0.95)',
            borderBottom: `1px solid ${tokens.color.border}`,
            padding: isMobile ? '12px 16px' : '16px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            position: 'sticky',
            top: 0,
            zIndex: tokens.zIndex.sticky,
            backdropFilter: 'blur(10px)',
            gap: 12,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: isMobile ? 12 : 16,
              flex: 1,
              minWidth: 0,
            }}
          >
            {/* Mobile Menu Button */}
            {isMobile && (
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setMobileMenuOpen(true)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: tokens.color.text,
                  cursor: 'pointer',
                  fontSize: 24,
                  minWidth: '44px',
                  minHeight: '44px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <i className="ri-menu-line" />
              </motion.button>
            )}

            <h1
              style={{
                color: tokens.color.text,
                fontSize: isMobile ? 18 : isTablet ? 20 : 24,
                fontWeight: 600,
                margin: 0,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {(() => {
                // Find label from menu items (including dropdown children)
                for (const item of menuItems) {
                  if (item.type === 'item' && item.route === currentRoute) {
                    return item.label;
                  }
                  if (item.type === 'dropdown') {
                    const child = item.children.find(c => c.route === currentRoute);
                    if (child) return child.label;
                  }
                }
                return 'Dashboard';
              })()}
              {currentRoute === 'sections' && currentPageSlug && !isMobile && (
                <span
                  style={{
                    color: tokens.color.muted,
                    fontSize: 16,
                    fontWeight: 400,
                    marginLeft: 8,
                  }}
                >
                  / {currentPageSlug}
                </span>
              )}
            </h1>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: isMobile ? 8 : 12,
              flexShrink: 0,
            }}
          >
            {/* View Site Button */}
            <motion.a
              href="http://localhost:4200"
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              style={{
                padding: isMobile ? '8px 12px' : '8px 16px',
                background: 'rgba(255,255,255,0.05)',
                border: `1px solid ${tokens.color.border}`,
                borderRadius: tokens.radius.md,
                color: tokens.color.text,
                textDecoration: 'none',
                fontSize: 14,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                minHeight: '44px',
              }}
            >
              <i className="ri-external-link-line" />
              {!isMobile && <span>View Site</span>}
            </motion.a>
          </div>
        </header>

        {/* Page Content */}
        <main
          style={{
            padding: isMobile ? 12 : isTablet ? 20 : 24,
            maxWidth: '100%',
            overflowX: 'hidden',
          }}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
