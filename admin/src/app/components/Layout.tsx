import { ReactNode, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { tokens } from '@app/shared';
import type { RouteType } from '../types';

interface LayoutProps {
  children: ReactNode;
  currentRoute: RouteType;
  currentPageSlug?: string;
  onNavigate: (route: RouteType, slug?: string) => void;
  onLogout: () => void;
  userEmail?: string;
}

export function Layout({ children, currentRoute, currentPageSlug, onNavigate, onLogout, userEmail }: LayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const menuItems: Array<{ route: RouteType; icon: string; label: string }> = [
    { route: 'dashboard', icon: 'ri-dashboard-3-line', label: 'Dashboard' },
    { route: 'pages', icon: 'ri-pages-line', label: 'Pages & Sections' },
    { route: 'preview', icon: 'ri-tv-line', label: 'Live Preview' },
    { route: 'leads', icon: 'ri-contacts-book-line', label: 'Khách hàng' },
    { route: 'bidding', icon: 'ri-auction-line', label: 'Quản lý Đấu thầu' },
    { route: 'bidding-settings', icon: 'ri-settings-4-line', label: 'Cài đặt Đấu thầu' },
    { route: 'contractors', icon: 'ri-building-2-line', label: 'Quản lý Nhà thầu' },
    { route: 'interior', icon: 'ri-home-smile-line', label: 'Nội thất' },
    { route: 'pricing-config', icon: 'ri-calculator-line', label: 'Cấu hình báo giá' },
    { route: 'media', icon: 'ri-gallery-line', label: 'Media & Gallery' },
    { route: 'blog-manager', icon: 'ri-quill-pen-line', label: 'Blog Manager' },
    { route: 'users', icon: 'ri-user-settings-line', label: 'Quản lý tài khoản' },
    { route: 'settings', icon: 'ri-settings-3-line', label: 'Settings' },
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: tokens.color.background }}>
      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: sidebarCollapsed ? 80 : 260 }}
        style={{
          background: 'rgba(15,16,20,0.98)',
          borderRight: `1px solid ${tokens.color.border}`,
          display: 'flex',
          flexDirection: 'column',
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
          zIndex: 100,
          transition: 'width 0.3s ease',
        }}
        className="desktop-sidebar"
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
                <div style={{ color: tokens.color.text, fontWeight: 600, fontSize: 16 }}>Admin</div>
                <div style={{ color: tokens.color.muted, fontSize: 12 }}>Dashboard</div>
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
              }}
            >
              <i className="ri-menu-fold-line" />
            </motion.button>
          )}
        </div>

        {/* Menu Items */}
        <nav style={{ flex: 1, padding: sidebarCollapsed ? '12px 8px' : '12px', overflowY: 'auto' }}>
          {menuItems.map((item) => {
            const isActive = currentRoute === item.route;
            return (
              <motion.button
                key={item.route}
                whileHover={{ scale: 1.02, x: 4 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  onNavigate(item.route);
                  setMobileMenuOpen(false);
                }}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: sidebarCollapsed ? '12px' : '12px 16px',
                  marginBottom: 4,
                  background: isActive
                    ? `linear-gradient(90deg, ${tokens.color.primary}15, transparent)`
                    : 'transparent',
                  border: 'none',
                  borderLeft: isActive ? `3px solid ${tokens.color.primary}` : '3px solid transparent',
                  borderRadius: tokens.radius.md,
                  color: isActive ? tokens.color.primary : tokens.color.muted,
                  cursor: 'pointer',
                  fontSize: 15,
                  fontWeight: isActive ? 600 : 400,
                  transition: 'all 0.2s',
                  justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
                }}
                title={sidebarCollapsed ? item.label : undefined}
              >
                <i className={item.icon} style={{ fontSize: 20 }} />
                {!sidebarCollapsed && <span>{item.label}</span>}
              </motion.button>
            );
          })}
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
            }}
          >
            <i className="ri-menu-unfold-line" />
          </motion.button>
        )}

        {/* User Info */}
        {!sidebarCollapsed && (
          <div
            style={{
              padding: '16px',
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
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <div style={{ color: tokens.color.text, fontSize: 14, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {userEmail || 'Admin'}
              </div>
              <div style={{ color: tokens.color.muted, fontSize: 12 }}>Administrator</div>
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
              }}
              title="Logout"
            >
              <i className="ri-logout-circle-line" />
            </motion.button>
          </div>
        )}
      </motion.aside>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
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
                zIndex: 998,
              }}
              className="mobile-only"
            />
            <motion.div
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              style={{
                position: 'fixed',
                left: 0,
                top: 0,
                bottom: 0,
                width: 280,
                background: 'rgba(15,16,20,0.98)',
                borderRight: `1px solid ${tokens.color.border}`,
                zIndex: 999,
                display: 'flex',
                flexDirection: 'column',
              }}
              className="mobile-only"
            >
              {/* Same content as desktop sidebar */}
              <div style={{ padding: '24px', borderBottom: `1px solid ${tokens.color.border}` }}>
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
                    <div style={{ color: tokens.color.text, fontWeight: 600, fontSize: 16 }}>Admin</div>
                    <div style={{ color: tokens.color.muted, fontSize: 12 }}>Dashboard</div>
                  </div>
                </div>
              </div>

              <nav style={{ flex: 1, padding: '12px', overflowY: 'auto' }}>
                {menuItems.map((item) => {
                  const isActive = currentRoute === item.route;
                  return (
                    <button
                      key={item.route}
                      onClick={() => {
                        onNavigate(item.route);
                        setMobileMenuOpen(false);
                      }}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        padding: '12px 16px',
                        marginBottom: 4,
                        background: isActive ? `linear-gradient(90deg, ${tokens.color.primary}15, transparent)` : 'transparent',
                        border: 'none',
                        borderLeft: isActive ? `3px solid ${tokens.color.primary}` : '3px solid transparent',
                        borderRadius: tokens.radius.md,
                        color: isActive ? tokens.color.primary : tokens.color.muted,
                        cursor: 'pointer',
                        fontSize: 15,
                        fontWeight: isActive ? 600 : 400,
                      }}
                    >
                      <i className={item.icon} style={{ fontSize: 20 }} />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </nav>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div
        style={{
          flex: 1,
          marginLeft: sidebarCollapsed ? 80 : 260,
          transition: 'margin-left 0.3s ease',
        }}
        className="main-content"
      >
        {/* Top Bar */}
        <header
          style={{
            background: 'rgba(15,16,20,0.95)',
            borderBottom: `1px solid ${tokens.color.border}`,
            padding: '16px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            position: 'sticky',
            top: 0,
            zIndex: 90,
            backdropFilter: 'blur(10px)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
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
                display: 'none',
              }}
              className="mobile-only-flex"
            >
              <i className="ri-menu-line" />
            </motion.button>

            <h1 style={{ color: tokens.color.text, fontSize: 24, fontWeight: 600, margin: 0 }}>
              {menuItems.find((item) => item.route === currentRoute)?.label || 'Dashboard'}
              {currentRoute === 'sections' && currentPageSlug && (
                <span style={{ color: tokens.color.muted, fontSize: 16, fontWeight: 400, marginLeft: 8 }}>
                  / {currentPageSlug}
                </span>
              )}
            </h1>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {/* Quick Actions */}
            <motion.a
              href="http://localhost:4200"
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              style={{
                padding: '8px 16px',
                background: 'rgba(255,255,255,0.05)',
                border: `1px solid ${tokens.color.border}`,
                borderRadius: tokens.radius.md,
                color: tokens.color.text,
                textDecoration: 'none',
                fontSize: 14,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <i className="ri-external-link-line" />
              <span className="desktop-only">View Site</span>
            </motion.a>
          </div>
        </header>

        {/* Page Content */}
        <main style={{ padding: 24 }}>{children}</main>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .desktop-sidebar {
            display: none;
          }
          .main-content {
            margin-left: 0 !important;
          }
          .mobile-only {
            display: block !important;
          }
          .mobile-only-flex {
            display: flex !important;
          }
        }
        @media (min-width: 769px) {
          .mobile-only {
            display: none !important;
          }
          .mobile-only-flex {
            display: none !important;
          }
        }
        .desktop-only {
          display: inline;
        }
        @media (max-width: 640px) {
          .desktop-only {
            display: none;
          }
        }
      `}</style>
    </div>
  );
}

