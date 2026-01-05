/**
 * useNavigation Hook
 * Navigation state and handlers for Layout
 *
 * Requirements: 6.2
 */

import { useState, useCallback, useEffect, useMemo } from 'react';
import { resolveMediaUrl, API_URL } from '@app/shared';
import type { RouteType } from '../../../types';

interface UseNavigationProps {
  onNavigate: (route: RouteType, slug?: string) => void;
}

export function useNavigation({ onNavigate }: UseNavigationProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [adminBackgroundImage, setAdminBackgroundImage] = useState<string | null>(null);

  // Load admin background from company settings
  useEffect(() => {
    const loadAdminBackground = async () => {
      try {
        const response = await fetch(`${API_URL}/settings/company`);
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data?.value?.adminBackgroundImage) {
            setAdminBackgroundImage(data.data.value.adminBackgroundImage);
          }
        }
      } catch (error) {
        console.error('Failed to load admin background:', error);
      }
    };
    loadAdminBackground();
  }, []);

  // Resolve admin background URL
  const resolvedAdminBgUrl = useMemo(() => {
    if (!adminBackgroundImage) return null;
    return resolveMediaUrl(adminBackgroundImage);
  }, [adminBackgroundImage]);

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
    setOpenDropdown((prev) => (prev === label ? null : label));
  }, []);

  // Toggle sidebar collapsed state
  const toggleSidebar = useCallback(() => {
    setSidebarCollapsed((prev) => !prev);
  }, []);

  // Open mobile menu
  const openMobileMenu = useCallback(() => {
    setMobileMenuOpen(true);
  }, []);

  // Close mobile menu
  const closeMobileMenu = useCallback(() => {
    setMobileMenuOpen(false);
  }, []);

  return {
    sidebarCollapsed,
    setSidebarCollapsed,
    mobileMenuOpen,
    openDropdown,
    resolvedAdminBgUrl,
    handleNavigate,
    toggleDropdown,
    toggleSidebar,
    openMobileMenu,
    closeMobileMenu,
  };
}
