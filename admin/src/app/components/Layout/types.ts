/**
 * Layout Types
 * Type definitions for Layout component
 *
 * Requirements: 6.1, 6.2
 */

import type { ReactNode } from 'react';
import type { RouteType } from '../../types';

export interface LayoutProps {
  children: ReactNode;
  currentRoute: RouteType;
  currentPageSlug?: string;
  onNavigate: (route: RouteType, slug?: string) => void;
  onLogout: () => void;
  userEmail?: string;
}

export type MenuItemSingle = {
  type: 'item';
  route: RouteType;
  icon: string;
  label: string;
};

export type MenuItemDropdown = {
  type: 'dropdown';
  icon: string;
  label: string;
  badge?: string;
  children: Array<{ route: RouteType; icon: string; label: string }>;
};

export type MenuItem = MenuItemSingle | MenuItemDropdown;

export interface ComingSoonItem {
  route: RouteType;
  icon: string;
  label: string;
}
