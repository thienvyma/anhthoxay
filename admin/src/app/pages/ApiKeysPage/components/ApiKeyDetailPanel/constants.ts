/**
 * Constants for ApiKeyDetailPanel component
 *
 * **Feature: admin-guide-api-keys**
 */

import type { EndpointGroup } from '../../../../api/api-keys';
import type { EndpointGroupDetail } from './types';

/**
 * Endpoint group details for display
 */
export const ENDPOINT_GROUP_DETAILS: Record<EndpointGroup, EndpointGroupDetail> = {
  leads: {
    label: 'Leads',
    description: 'Quản lý khách hàng tiềm năng',
    adminPage: 'Admin → Khách hàng',
    icon: 'ri-user-follow-line',
    endpoints: [
      { method: 'GET', path: '/api/external/leads', desc: 'Lấy danh sách leads' },
      { method: 'POST', path: '/api/external/leads', desc: 'Tạo lead mới' },
      { method: 'GET', path: '/api/external/leads/stats', desc: 'Thống kê leads' },
    ],
  },
  blog: {
    label: 'Blog',
    description: 'Quản lý bài viết',
    adminPage: 'Admin → Blog',
    icon: 'ri-article-line',
    endpoints: [
      { method: 'GET', path: '/api/external/blog/posts', desc: 'Danh sách bài viết' },
      { method: 'GET', path: '/api/external/blog/posts/:slug', desc: 'Chi tiết bài viết' },
      { method: 'GET', path: '/api/external/blog/categories', desc: 'Danh sách danh mục' },
    ],
  },
  projects: {
    label: 'Công trình',
    description: 'Quản lý dự án xây dựng',
    adminPage: 'Admin → Công trình',
    icon: 'ri-building-line',
    endpoints: [
      { method: 'GET', path: '/api/external/projects', desc: 'Danh sách công trình' },
      { method: 'GET', path: '/api/external/projects/:id', desc: 'Chi tiết công trình' },
    ],
  },
  contractors: {
    label: 'Nhà thầu',
    description: 'Quản lý nhà thầu',
    adminPage: 'Admin → Nhà thầu',
    icon: 'ri-team-line',
    endpoints: [
      { method: 'GET', path: '/api/external/contractors', desc: 'Danh sách nhà thầu' },
    ],
  },
  reports: {
    label: 'Báo cáo',
    description: 'Xem thống kê',
    adminPage: 'Admin → Dashboard',
    icon: 'ri-bar-chart-box-line',
    endpoints: [
      { method: 'GET', path: '/api/external/reports/dashboard', desc: 'Thống kê tổng quan' },
    ],
  },
  pricing: {
    label: 'Cấu hình giá',
    description: 'Hạng mục, đơn giá, công thức',
    adminPage: 'Admin → Cấu hình giá',
    icon: 'ri-money-dollar-circle-line',
    endpoints: [
      { method: 'GET', path: '/api/external/pricing/service-categories', desc: 'Danh sách hạng mục' },
      { method: 'POST', path: '/api/external/pricing/service-categories', desc: 'Tạo hạng mục' },
      { method: 'PUT', path: '/api/external/pricing/service-categories/:id', desc: 'Cập nhật hạng mục' },
      { method: 'DELETE', path: '/api/external/pricing/service-categories/:id', desc: 'Xóa hạng mục' },
      { method: 'GET', path: '/api/external/pricing/unit-prices', desc: 'Danh sách đơn giá' },
      { method: 'POST', path: '/api/external/pricing/unit-prices', desc: 'Tạo đơn giá' },
      { method: 'PUT', path: '/api/external/pricing/unit-prices/:id', desc: 'Cập nhật đơn giá' },
      { method: 'DELETE', path: '/api/external/pricing/unit-prices/:id', desc: 'Xóa đơn giá' },
      { method: 'GET', path: '/api/external/pricing/formulas', desc: 'Danh sách công thức' },
      { method: 'POST', path: '/api/external/pricing/formulas', desc: 'Tạo công thức' },
      { method: 'POST', path: '/api/external/pricing/calculate-quote', desc: 'Tính báo giá' },
    ],
  },
  furniture: {
    label: 'Nội thất',
    description: 'Danh mục, vật dụng, dự án và báo giá nội thất',
    adminPage: 'Admin → Cấu hình giá → Nội thất',
    icon: 'ri-home-gear-line',
    endpoints: [
      // Categories & Materials
      { method: 'GET', path: '/api/external/furniture/categories', desc: 'Danh sách danh mục' },
      { method: 'GET', path: '/api/external/furniture/categories/:id', desc: 'Chi tiết danh mục' },
      { method: 'POST', path: '/api/external/furniture/categories', desc: 'Tạo danh mục' },
      { method: 'PUT', path: '/api/external/furniture/categories/:id', desc: 'Cập nhật danh mục' },
      { method: 'DELETE', path: '/api/external/furniture/categories/:id', desc: 'Xóa danh mục' },
      { method: 'GET', path: '/api/external/furniture/materials', desc: 'Danh sách vật dụng' },
      { method: 'GET', path: '/api/external/furniture/materials/:id', desc: 'Chi tiết vật dụng' },
      { method: 'POST', path: '/api/external/furniture/materials', desc: 'Tạo vật dụng' },
      { method: 'PUT', path: '/api/external/furniture/materials/:id', desc: 'Cập nhật vật dụng' },
      { method: 'DELETE', path: '/api/external/furniture/materials/:id', desc: 'Xóa vật dụng' },
      { method: 'PUT', path: '/api/external/furniture/materials/reorder', desc: 'Sắp xếp vật dụng' },
      { method: 'PUT', path: '/api/external/furniture/categories/reorder', desc: 'Sắp xếp danh mục' },
      // Developers
      { method: 'GET', path: '/api/external/furniture/developers', desc: 'Danh sách chủ đầu tư' },
      { method: 'GET', path: '/api/external/furniture/developers/:id', desc: 'Chi tiết chủ đầu tư' },
      { method: 'POST', path: '/api/external/furniture/developers', desc: 'Tạo chủ đầu tư' },
      { method: 'PUT', path: '/api/external/furniture/developers/:id', desc: 'Cập nhật chủ đầu tư' },
      { method: 'DELETE', path: '/api/external/furniture/developers/:id', desc: 'Xóa chủ đầu tư' },
      // Projects
      { method: 'GET', path: '/api/external/furniture/projects', desc: 'Danh sách dự án' },
      { method: 'GET', path: '/api/external/furniture/projects/:id', desc: 'Chi tiết dự án' },
      { method: 'POST', path: '/api/external/furniture/projects', desc: 'Tạo dự án' },
      { method: 'PUT', path: '/api/external/furniture/projects/:id', desc: 'Cập nhật dự án' },
      { method: 'DELETE', path: '/api/external/furniture/projects/:id', desc: 'Xóa dự án' },
      // Buildings
      { method: 'GET', path: '/api/external/furniture/buildings', desc: 'Danh sách tòa nhà' },
      { method: 'GET', path: '/api/external/furniture/buildings/:id', desc: 'Chi tiết tòa nhà' },
      { method: 'POST', path: '/api/external/furniture/buildings', desc: 'Tạo tòa nhà' },
      { method: 'PUT', path: '/api/external/furniture/buildings/:id', desc: 'Cập nhật tòa nhà' },
      { method: 'DELETE', path: '/api/external/furniture/buildings/:id', desc: 'Xóa tòa nhà' },
      // Layouts
      { method: 'GET', path: '/api/external/furniture/layouts', desc: 'Danh sách bố trí căn hộ' },
      { method: 'GET', path: '/api/external/furniture/layouts/:id', desc: 'Chi tiết bố trí' },
      { method: 'POST', path: '/api/external/furniture/layouts', desc: 'Tạo bố trí' },
      { method: 'PUT', path: '/api/external/furniture/layouts/:id', desc: 'Cập nhật bố trí' },
      { method: 'DELETE', path: '/api/external/furniture/layouts/:id', desc: 'Xóa bố trí' },
      // Apartment Types
      { method: 'GET', path: '/api/external/furniture/apartment-types', desc: 'Danh sách loại căn hộ' },
      { method: 'GET', path: '/api/external/furniture/apartment-types/:id', desc: 'Chi tiết loại căn hộ' },
      { method: 'POST', path: '/api/external/furniture/apartment-types', desc: 'Tạo loại căn hộ' },
      { method: 'PUT', path: '/api/external/furniture/apartment-types/:id', desc: 'Cập nhật loại căn hộ' },
      { method: 'DELETE', path: '/api/external/furniture/apartment-types/:id', desc: 'Xóa loại căn hộ' },
      // Quotations
      { method: 'GET', path: '/api/external/furniture/quotations', desc: 'Danh sách báo giá' },
      { method: 'GET', path: '/api/external/furniture/quotations/:id', desc: 'Chi tiết báo giá' },
    ],
  },
  media: {
    label: 'Media',
    description: 'Hình ảnh và tệp tin',
    adminPage: 'Admin → Media',
    icon: 'ri-image-line',
    endpoints: [
      { method: 'GET', path: '/api/external/media', desc: 'Danh sách media' },
      { method: 'POST', path: '/api/external/media/upload', desc: 'Upload file' },
      { method: 'DELETE', path: '/api/external/media/:filename', desc: 'Xóa file' },
    ],
  },
  settings: {
    label: 'Cài đặt',
    description: 'Cài đặt hệ thống',
    adminPage: 'Admin → Cài đặt',
    icon: 'ri-settings-3-line',
    endpoints: [
      { method: 'GET', path: '/api/external/settings', desc: 'Lấy cài đặt' },
      { method: 'PUT', path: '/api/external/settings', desc: 'Cập nhật cài đặt' },
    ],
  },
};

/**
 * Endpoint group labels for display
 */
export const ENDPOINT_GROUP_LABELS: Record<EndpointGroup, string> = {
  leads: 'Leads',
  blog: 'Blog',
  projects: 'Công trình',
  contractors: 'Nhà thầu',
  reports: 'Báo cáo',
  pricing: 'Cấu hình giá',
  furniture: 'Nội thất',
  media: 'Media',
  settings: 'Cài đặt',
};
