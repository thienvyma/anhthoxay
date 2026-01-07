/**
 * Layout Constants
 * Menu items and configuration constants
 *
 * Requirements: 6.2
 */

import type { MenuItem, ComingSoonItem } from './types';

// Sidebar widths
export const SIDEBAR_WIDTH = 260;
export const SIDEBAR_COLLAPSED_WIDTH = 80;
export const MOBILE_SIDEBAR_WIDTH = 280;

// Menu items configuration
export const menuItems: MenuItem[] = [
  // Main features - đang sử dụng
  { type: 'item', route: 'dashboard', icon: 'ri-dashboard-3-line', label: 'Dashboard' },
  { type: 'item', route: 'pages', icon: 'ri-pages-line', label: 'Pages & Sections' },
  { type: 'item', route: 'media', icon: 'ri-gallery-line', label: 'Media Library' },
  { type: 'item', route: 'blog-manager', icon: 'ri-quill-pen-line', label: 'Blog Manager' },
  { type: 'item', route: 'leads', icon: 'ri-contacts-book-line', label: 'Khách hàng' },
  { type: 'item', route: 'furniture', icon: 'ri-sofa-line', label: 'Nội thất' },
  { type: 'item', route: 'users', icon: 'ri-user-settings-line', label: 'Quản lý tài khoản' },
  { type: 'item', route: 'rate-limits', icon: 'ri-shield-line', label: 'Rate Limit Monitor' },
  { type: 'item', route: 'guide', icon: 'ri-book-open-line', label: 'Hướng dẫn' },
  {
    type: 'dropdown',
    icon: 'ri-settings-3-line',
    label: 'Settings',
    children: [
      { route: 'settings', icon: 'ri-settings-line', label: 'Cài đặt chung' },
      { route: 'settings/api-keys', icon: 'ri-key-2-line', label: 'API Keys' },
    ],
  },
];

// Coming Soon items - tách riêng để hiển thị ở cuối
export const comingSoonItems: ComingSoonItem[] = [
  { route: 'pricing-config', icon: 'ri-calculator-line', label: 'Cấu hình báo giá' },
  { route: 'bidding', icon: 'ri-auction-line', label: 'Quản lý Đấu thầu' },
  { route: 'bidding-settings', icon: 'ri-settings-4-line', label: 'Cài đặt Đấu thầu' },
  { route: 'contractors', icon: 'ri-building-2-line', label: 'Quản lý Nhà thầu' },
];
