/**
 * ResponsiveTabs Component
 * Tab navigation that adapts to screen size
 *
 * Requirements: 5.1, 5.2, 5.3, 5.4, 12.3
 */

import React, { useRef, useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useResponsive } from '../../hooks/useResponsive';
import { tokens } from '@app/shared';

export interface Tab {
  /** Unique tab identifier */
  id: string;

  /** Tab label text */
  label: string;

  /** Optional icon class (Remix Icon) */
  icon?: string;

  /** Tab content */
  content: React.ReactNode;

  /** Disabled state */
  disabled?: boolean;
}

export interface ResponsiveTabsProps {
  /** Array of tabs */
  tabs: Tab[];

  /** Currently active tab ID */
  activeTab: string;

  /** Callback when tab changes */
  onTabChange: (tabId: string) => void;

  /** Mobile behavior mode */
  mobileMode?: 'scroll' | 'dropdown';

  /** Show icons only on mobile */
  iconOnlyMobile?: boolean;

  /** Additional CSS class */
  className?: string;

  /** Test ID for testing */
  testId?: string;
}

/**
 * ResponsiveTabs - Tab navigation that adapts to screen size
 *
 * @example
 * // Basic usage
 * <ResponsiveTabs
 *   tabs={[
 *     { id: 'general', label: 'General', icon: 'ri-settings-line', content: <GeneralTab /> },
 *     { id: 'users', label: 'Users', icon: 'ri-user-line', content: <UsersTab /> },
 *   ]}
 *   activeTab={activeTab}
 *   onTabChange={setActiveTab}
 * />
 *
 * @example
 * // Dropdown mode on mobile
 * <ResponsiveTabs
 *   tabs={tabs}
 *   activeTab={activeTab}
 *   onTabChange={setActiveTab}
 *   mobileMode="dropdown"
 * />
 */
export function ResponsiveTabs({
  tabs,
  activeTab,
  onTabChange,
  mobileMode = 'scroll',
  iconOnlyMobile = false,
  className = '',
  testId,
}: ResponsiveTabsProps) {
  const { isMobile, breakpoint } = useResponsive();
  const tabsContainerRef = useRef<HTMLDivElement>(null);
  const [showLeftFade, setShowLeftFade] = useState(false);
  const [showRightFade, setShowRightFade] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Find active tab
  const activeTabData = useMemo(
    () => tabs.find((t) => t.id === activeTab),
    [tabs, activeTab]
  );

  // Check scroll position for fade indicators
  const checkScroll = () => {
    const container = tabsContainerRef.current;
    if (!container) return;

    const { scrollLeft, scrollWidth, clientWidth } = container;
    setShowLeftFade(scrollLeft > 0);
    setShowRightFade(scrollLeft < scrollWidth - clientWidth - 1);
  };

  // Scroll active tab into view
  useEffect(() => {
    if (mobileMode === 'scroll' && tabsContainerRef.current) {
      const activeElement = tabsContainerRef.current.querySelector(
        `[data-tab-id="${activeTab}"]`
      ) as HTMLElement;

      if (activeElement) {
        activeElement.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
          inline: 'center',
        });
      }
    }
  }, [activeTab, mobileMode]);

  // Check scroll on mount and resize
  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, [tabs]);

  // Render dropdown mode for mobile
  if (isMobile && mobileMode === 'dropdown') {
    return (
      <div className={className} data-testid={testId}>
        {/* Dropdown trigger */}
        <div style={{ position: 'relative', marginBottom: tokens.space.md }}>
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
              padding: `${tokens.space.sm} ${tokens.space.md}`,
              backgroundColor: tokens.color.surface,
              border: `1px solid ${tokens.color.border}`,
              borderRadius: tokens.radius.md,
              color: tokens.color.text,
              fontSize: tokens.font.size.sm,
              cursor: 'pointer',
              minHeight: '44px',
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: tokens.space.sm }}>
              {activeTabData?.icon && (
                <i className={activeTabData.icon} style={{ fontSize: '18px' }} />
              )}
              {activeTabData?.label}
            </span>
            <i
              className={isDropdownOpen ? 'ri-arrow-up-s-line' : 'ri-arrow-down-s-line'}
              style={{ fontSize: '20px', color: tokens.color.textMuted }}
            />
          </button>

          {/* Dropdown menu */}
          {isDropdownOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                marginTop: tokens.space.xs,
                backgroundColor: tokens.color.surface,
                border: `1px solid ${tokens.color.border}`,
                borderRadius: tokens.radius.md,
                boxShadow: tokens.shadow.md,
                zIndex: tokens.zIndex.dropdown,
                overflow: 'hidden',
              }}
            >
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    if (!tab.disabled) {
                      onTabChange(tab.id);
                      setIsDropdownOpen(false);
                    }
                  }}
                  disabled={tab.disabled}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: tokens.space.sm,
                    width: '100%',
                    padding: `${tokens.space.sm} ${tokens.space.md}`,
                    backgroundColor:
                      tab.id === activeTab
                        ? tokens.color.surfaceHover
                        : 'transparent',
                    border: 'none',
                    color: tab.disabled
                      ? tokens.color.textMuted
                      : tokens.color.text,
                    fontSize: tokens.font.size.sm,
                    cursor: tab.disabled ? 'not-allowed' : 'pointer',
                    textAlign: 'left',
                    minHeight: '44px',
                    opacity: tab.disabled ? 0.5 : 1,
                  }}
                >
                  {tab.icon && (
                    <i className={tab.icon} style={{ fontSize: '18px' }} />
                  )}
                  {tab.label}
                  {tab.id === activeTab && (
                    <i
                      className="ri-check-line"
                      style={{
                        marginLeft: 'auto',
                        color: tokens.color.primary,
                      }}
                    />
                  )}
                </button>
              ))}
            </motion.div>
          )}
        </div>

        {/* Tab content */}
        <div>{activeTabData?.content}</div>
      </div>
    );
  }

  // Render scroll mode (default)
  return (
    <div className={className} data-testid={testId} data-breakpoint={breakpoint}>
      {/* Tab bar with scroll */}
      <div style={{ position: 'relative' }}>
        {/* Left fade indicator */}
        {showLeftFade && (
          <div
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              bottom: 0,
              width: '40px',
              background: `linear-gradient(to right, ${tokens.color.background}, transparent)`,
              pointerEvents: 'none',
              zIndex: 1,
            }}
          />
        )}

        {/* Tabs container */}
        <div
          ref={tabsContainerRef}
          onScroll={checkScroll}
          style={{
            display: 'flex',
            gap: tokens.space.xs,
            overflowX: 'auto',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            paddingBottom: tokens.space.xs,
            borderBottom: `1px solid ${tokens.color.border}`,
          }}
        >
          {tabs.map((tab) => {
            const isActive = tab.id === activeTab;
            const showLabel = !isMobile || !iconOnlyMobile || !tab.icon;

            return (
              <button
                key={tab.id}
                data-tab-id={tab.id}
                onClick={() => !tab.disabled && onTabChange(tab.id)}
                disabled={tab.disabled}
                title={isMobile && iconOnlyMobile && tab.icon ? tab.label : undefined}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: tokens.space.sm,
                  padding: isMobile
                    ? `${tokens.space.sm} ${tokens.space.md}`
                    : `${tokens.space.sm} ${tokens.space.lg}`,
                  backgroundColor: 'transparent',
                  border: 'none',
                  borderBottom: `2px solid ${
                    isActive ? tokens.color.primary : 'transparent'
                  }`,
                  color: isActive
                    ? tokens.color.primary
                    : tab.disabled
                    ? tokens.color.textMuted
                    : tokens.color.text,
                  fontSize: tokens.font.size.sm,
                  fontWeight: isActive
                    ? tokens.font.weight.medium
                    : tokens.font.weight.normal,
                  cursor: tab.disabled ? 'not-allowed' : 'pointer',
                  whiteSpace: 'nowrap',
                  minHeight: '44px',
                  minWidth: isMobile && iconOnlyMobile && tab.icon ? '44px' : 'auto',
                  justifyContent: 'center',
                  opacity: tab.disabled ? 0.5 : 1,
                  transition: 'all 0.2s',
                  marginBottom: '-1px',
                }}
              >
                {tab.icon && (
                  <i
                    className={tab.icon}
                    style={{
                      fontSize: isMobile ? '20px' : '18px',
                    }}
                  />
                )}
                {showLabel && tab.label}
              </button>
            );
          })}
        </div>

        {/* Right fade indicator */}
        {showRightFade && (
          <div
            style={{
              position: 'absolute',
              right: 0,
              top: 0,
              bottom: 0,
              width: '40px',
              background: `linear-gradient(to left, ${tokens.color.background}, transparent)`,
              pointerEvents: 'none',
              zIndex: 1,
            }}
          />
        )}
      </div>

      {/* Tab content */}
      <div style={{ paddingTop: tokens.space.lg }}>
        {activeTabData?.content}
      </div>
    </div>
  );
}

export default ResponsiveTabs;
