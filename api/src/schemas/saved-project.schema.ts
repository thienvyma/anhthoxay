/**
 * Saved Project Schemas
 *
 * Validation schemas for saved project operations.
 *
 * **Feature: bidding-phase6-portal**
 * **Requirements: 21.1, 21.2, 21.3**
 */

import { z } from 'zod';

// ============================================
// QUERY SCHEMAS
// ============================================

export const ListSavedProjectsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type ListSavedProjectsQuery = z.infer<typeof ListSavedProjectsQuerySchema>;

// ============================================
// RESPONSE TYPES
// ============================================

export interface SavedProjectResponse {
  id: string;
  projectId: string;
  project: {
    id: string;
    code: string;
    title: string;
    description: string;
    category?: {
      id: string;
      name: string;
    };
    region?: {
      id: string;
      name: string;
    };
    area?: number;
    budgetMin?: number;
    budgetMax?: number;
    timeline?: string;
    images?: string[];
    status: string;
    bidDeadline?: string;
    bidCount?: number;
    createdAt: string;
  };
  savedAt: string;
  isExpired: boolean;
}
