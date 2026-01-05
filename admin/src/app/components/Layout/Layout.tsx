/**
 * Layout Component
 * Main layout with responsive sidebar and navigation
 *
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5
 */

import { memo } from 'react';
import { tokens } from '../../../theme';
import { useResponsive } from '../../../hooks/useResponsive';
import type { LayoutProps } from './types';
import { menuItems, comingSoonItems, SIDEBAR_WIDTH, SIDEBAR_COLLAPSED_WIDTH } from './constants';
import { useNavigation } from './hooks';
import { Sidebar } from './Sidebar';
import { MobileSidebar } from './MobileSidebar';
import { Header } from './Header';

export const Layout = memo(function Layout({
  children,
  currentRoute,
  currentPageSlug,
  onNavigate,
  onLogout,
  userEmail,
}: LayoutProps) {
  const { isMobile, isTablet, breakpoint } = useResponsive();

  const {
    sidebarCollapsed,
    mobileMenuOpen,
    openDropdown,
    resolvedAdminBgUrl,
    handleNavigate,
    toggleDropdown,
    toggleSidebar,
    openMobileMenu,
    closeMobileMenu,
  } = useNavigation({ onNavigate });

  // Calculate sidebar width based on state
  const sidebarWidth = sidebarCollapsed ? SIDEBAR_COLLAPSED_WIDTH : SIDEBAR_WIDTH;

  return (
    <div
      style={{
        display: 'flex',
        minHeight: '100vh',
        background: tokens.color.background,
        position: 'relative',
      }}
      data-breakpoint={breakpoint}
    >
      {/* Admin Background Image - no overlay */}
      {resolvedAdminBgUrl && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundImage: `url(${resolvedAdminBgUrl})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            opacity: 0.08,
            zIndex: 0,
            pointerEvents: 'none',
          }}
        />
      )}

      {/* Desktop Sidebar */}
      {!isMobile && (
        <Sidebar
          collapsed={sidebarCollapsed}
          currentRoute={currentRoute}
          menuItems={menuItems}
          comingSoonItems={comingSoonItems}
          openDropdown={openDropdown}
          userEmail={userEmail}
          onNavigate={handleNavigate}
          onToggleDropdown={toggleDropdown}
          onToggleSidebar={toggleSidebar}
          onLogout={onLogout}
        />
      )}

      {/* Mobile Menu Overlay */}
      {isMobile && (
        <MobileSidebar
          isOpen={mobileMenuOpen}
          currentRoute={currentRoute}
          menuItems={menuItems}
          comingSoonItems={comingSoonItems}
          openDropdown={openDropdown}
          userEmail={userEmail}
          onClose={closeMobileMenu}
          onNavigate={handleNavigate}
          onToggleDropdown={toggleDropdown}
          onLogout={onLogout}
        />
      )}

      {/* Main Content */}
      <div
        style={{
          flex: 1,
          marginLeft: isMobile ? 0 : sidebarWidth,
          transition: 'margin-left 0.3s ease',
          minWidth: 0,
          maxWidth: '100vw',
          overflowX: 'hidden',
        }}
      >
        {/* Top Bar */}
        <Header
          currentRoute={currentRoute}
          currentPageSlug={currentPageSlug}
          menuItems={menuItems}
          isMobile={isMobile}
          isTablet={isTablet}
          onOpenMobileMenu={openMobileMenu}
        />

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
});
