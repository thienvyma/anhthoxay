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
  { type: 'item', route: 'settings', icon: 'ri-settings-3-line', label: 'Cài đặt' },
];

// Coming Soon items - tách riêng để hiển thị ở cuối
export const comingSoonItems: ComingSoonItem[] = [
  { route: 'pricing-config', icon: 'ri-calculator-line', label: 'Cấu hình báo giá' },
];
