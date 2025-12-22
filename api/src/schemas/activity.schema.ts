/**
 * Activity Schema
 *
 * Validation schemas for activity history endpoints.
 *
 * **Feature: bidding-phase6-portal**
 * **Requirements: 23.1, 23.3**
 */

import { z } from 'zod';

// Activity types
export const ActivityTypeEnum = z.enum([
  'PROJECT_CREATED',
  'PROJECT_SUBMITTED',
  'PROJECT_APPROVED',
  'PROJECT_REJECTED',
  'BID_SUBMITTED',
  'BID_APPROVED',
  'BID_REJECTED',
  'BID_SELECTED',
  'MATCH_CREATED',
  'PROJECT_STARTED',
  'PROJECT_COMPLETED',
  'REVIEW_WRITTEN',
]);

export type ActivityType = z.infer<typeof ActivityTypeEnum>;

// Query schema for listing activities
export const ActivityQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  type: ActivityTypeEnum.optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

export type ActivityQuery = z.infer<typeof ActivityQuerySchema>;

// Activity response type
export interface Activity {
  id: string;
  userId: string;
  type: ActivityType;
  title: string;
  description?: string;
  data?: Record<string, unknown>;
  createdAt: string;
}
