/**
 * Projects Page Types
 *
 * **Feature: bidding-phase2-core**
 * **Requirements: 10.1**
 */

import type { Project, ProjectListItem, ProjectStatus } from '../../types';

export const STATUS_COLORS: Record<ProjectStatus, string> = {
  DRAFT: '#6B7280',
  PENDING_APPROVAL: '#F59E0B',
  REJECTED: '#EF4444',
  OPEN: '#10B981',
  BIDDING_CLOSED: '#8B5CF6',
  PENDING_MATCH: '#F97316',
  MATCHED: '#3B82F6',
  IN_PROGRESS: '#06B6D4',
  COMPLETED: '#22C55E',
  CANCELLED: '#9CA3AF',
};

export const STATUS_LABELS: Record<ProjectStatus, string> = {
  DRAFT: 'Nháp',
  PENDING_APPROVAL: 'Chờ duyệt',
  REJECTED: 'Bị từ chối',
  OPEN: 'Đang mở',
  BIDDING_CLOSED: 'Đóng đấu giá',
  PENDING_MATCH: 'Chờ duyệt kết nối',
  MATCHED: 'Đã ghép',
  IN_PROGRESS: 'Đang thực hiện',
  COMPLETED: 'Hoàn thành',
  CANCELLED: 'Đã hủy',
};

export const TABS: Array<{ status: ProjectStatus | 'ALL'; label: string }> = [
  { status: 'ALL', label: 'Tất cả' },
  { status: 'PENDING_APPROVAL', label: 'Chờ duyệt' },
  { status: 'OPEN', label: 'Đang mở' },
  { status: 'REJECTED', label: 'Bị từ chối' },
  { status: 'BIDDING_CLOSED', label: 'Đóng đấu giá' },
  { status: 'MATCHED', label: 'Đã ghép' },
];

export type { Project, ProjectListItem, ProjectStatus };
