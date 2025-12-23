import { useState, useEffect, useCallback } from 'react';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { MobileNav } from './MobileNav';
import { useResponsive } from '../../hooks/useResponsive';
import { SkipLink } from '../SkipLink';
import { useEscapeKey } from '../../hooks/useKeyboardNavigation';

interface LayoutProps {
  children: React.ReactNode;
  showMobileNav?: boolean;
}

/**
 * Main layout component with accessibility features
 * Requirements: 26.1 - Keyboard navigation, 26.3 - ARIA labels
 */
export function Layout({ children, showMobileNav = true }: LayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { isMobile, isTablet, isDesktop } = useResponsive();

  // Auto-open sidebar on desktop, close on mobile/tablet
  useEffect(() => {
    if (isDesktop) {
      setIsSidebarOpen(true);
    } else {
      setIsSidebarOpen(false);
    }
  }, [isDesktop]);

  const toggleSidebar = useCallback(() => {
    setIsSidebarOpen(prev => !prev);
  }, []);

  const closeSidebar = useCallback(() => {
    if (isMobile || isTablet) {
      setIsSidebarOpen(false);
    }
  }, [isMobile, isTablet]);

  // Close sidebar on Escape key (mobile/tablet only)
  useEscapeKey(closeSidebar, isSidebarOpen && (isMobile || isTablet));

  // Calculate main content margin based on sidebar state and screen size
  const getMainMargin = () => {
    if (isMobile || isTablet) {
      return 0;
    }
    return isSidebarOpen ? 260 : 0;
  };

  // Calculate sidebar width based on screen size
  const getSidebarWidth = () => {
    if (isTablet) return 240;
    return 260;
  };

  return (
    <div className="portal-layout">
      {/* Skip link for keyboard navigation - Requirements: 26.1 */}
      <SkipLink targetId="main-content" />
      
      {/* Live region for screen reader announcements */}
      <div
        id="live-announcements"
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      />
      
      <Header onMenuToggle={toggleSidebar} isSidebarOpen={isSidebarOpen} />
      <Sidebar 
        isOpen={isSidebarOpen} 
        onClose={closeSidebar}
        width={getSidebarWidth()}
      />
      
      <main
        id="main-content"
        className="portal-main"
        role="main"
        aria-label="Nội dung chính"
        tabIndex={-1}
        style={{
          marginLeft: isMobile || isTablet ? 0 : (isSidebarOpen ? getMainMargin() : 0),
          transition: 'margin-left 0.3s ease',
          // Ensure content doesn't overflow when sidebar is open
          width: isMobile || isTablet ? '100%' : (isSidebarOpen ? `calc(100% - ${getMainMargin()}px)` : '100%'),
        }}
      >
        <div className="portal-content">
          {children}
        </div>
      </main>
      
      {/* Mobile bottom navigation - only visible on mobile */}
      {showMobileNav && <MobileNav isVisible={isMobile} />}
    </div>
  );
}
