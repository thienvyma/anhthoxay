/**
 * Regions Page Types
 *
 * **Feature: bidding-phase1-foundation**
 */

import { tokens } from '@app/shared';
import type { Region, RegionTreeNode } from '../../types';

export const LEVEL_LABELS: Record<number, string> = {
  1: 'Tỉnh/Thành phố',
  2: 'Quận/Huyện',
  3: 'Phường/Xã',
};

export const LEVEL_COLORS: Record<number, string> = {
  1: tokens.color.primary,
  2: '#10B981',
  3: '#6366F1',
};

export interface RegionFormData {
  name: string;
  slug: string;
  parentId: string | null;
  level: number;
  isActive: boolean;
  order: number;
}

export const defaultFormData: RegionFormData = {
  name: '',
  slug: '',
  parentId: null,
  level: 1,
  isActive: true,
  order: 0,
};

export type { Region, RegionTreeNode };
