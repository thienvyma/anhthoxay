/**
 * Draft Storage Service
 *
 * Provides auto-save functionality for forms by storing drafts in localStorage.
 * Each draft includes a timestamp for age tracking.
 *
 * **Feature: bidding-phase6-portal**
 * **Requirements: 22.1, 22.2, 22.3, 22.4, 22.5**
 */

export interface DraftData<T = unknown> {
  data: T;
  savedAt: string;
  userId: string;
}

export interface DraftStorage {
  [key: string]: DraftData;
}

// Storage key prefix
const DRAFT_STORAGE_PREFIX = 'portal_draft_';

// Draft keys
export const DRAFT_KEYS = {
  PROJECT: 'project',
  BID: (projectId: string) => `bid_${projectId}`,
} as const;

// Auto-save interval in milliseconds (30 seconds)
export const AUTO_SAVE_INTERVAL = 30 * 1000;

// Draft expiration in days
export const DRAFT_EXPIRATION_DAYS = 30;

/**
 * Get the full storage key for a draft
 */
function getStorageKey(key: string, userId: string): string {
  return `${DRAFT_STORAGE_PREFIX}${userId}_${key}`;
}

/**
 * Save a draft to localStorage with timestamp
 */
export function saveDraft<T>(key: string, userId: string, data: T): void {
  try {
    const storageKey = getStorageKey(key, userId);
    const draft: DraftData<T> = {
      data,
      savedAt: new Date().toISOString(),
      userId,
    };
    localStorage.setItem(storageKey, JSON.stringify(draft));
  } catch (error) {
    console.error('Failed to save draft to localStorage:', error);
  }
}

/**
 * Get a draft from localStorage
 */
export function getDraft<T>(key: string, userId: string): DraftData<T> | null {
  try {
    const storageKey = getStorageKey(key, userId);
    const stored = localStorage.getItem(storageKey);
    if (!stored) return null;
    return JSON.parse(stored) as DraftData<T>;
  } catch (error) {
    console.error('Failed to get draft from localStorage:', error);
    return null;
  }
}

/**
 * Delete a draft from localStorage
 */
export function deleteDraft(key: string, userId: string): void {
  try {
    const storageKey = getStorageKey(key, userId);
    localStorage.removeItem(storageKey);
  } catch (error) {
    console.error('Failed to delete draft from localStorage:', error);
  }
}

/**
 * Check if a draft exists
 */
export function hasDraft(key: string, userId: string): boolean {
  const storageKey = getStorageKey(key, userId);
  return localStorage.getItem(storageKey) !== null;
}

/**
 * Get the age of a draft in days
 */
export function getDraftAge(key: string, userId: string): number | null {
  const draft = getDraft(key, userId);
  if (!draft) return null;

  const savedDate = new Date(draft.savedAt);
  const now = new Date();
  const diffMs = now.getTime() - savedDate.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  return diffDays;
}

/**
 * Check if a draft is expired (older than DRAFT_EXPIRATION_DAYS)
 */
export function isDraftExpired(key: string, userId: string): boolean {
  const age = getDraftAge(key, userId);
  if (age === null) return false;
  return age > DRAFT_EXPIRATION_DAYS;
}

/**
 * Format the draft saved time for display
 */
export function formatDraftTime(savedAt: string): string {
  const date = new Date(savedAt);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMinutes < 1) {
    return 'Vừa xong';
  } else if (diffMinutes < 60) {
    return `${diffMinutes} phút trước`;
  } else if (diffHours < 24) {
    return `${diffHours} giờ trước`;
  } else if (diffDays < 7) {
    return `${diffDays} ngày trước`;
  } else {
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }
}

/**
 * Clean up all expired drafts for a user
 */
export function cleanupExpiredDrafts(userId: string): void {
  try {
    const prefix = `${DRAFT_STORAGE_PREFIX}${userId}_`;
    const keysToRemove: string[] = [];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(prefix)) {
        const stored = localStorage.getItem(key);
        if (stored) {
          try {
            const draft = JSON.parse(stored) as DraftData;
            const savedDate = new Date(draft.savedAt);
            const now = new Date();
            const diffDays = (now.getTime() - savedDate.getTime()) / (1000 * 60 * 60 * 24);
            if (diffDays > DRAFT_EXPIRATION_DAYS) {
              keysToRemove.push(key);
            }
          } catch {
            // Invalid JSON, remove it
            keysToRemove.push(key);
          }
        }
      }
    }

    keysToRemove.forEach((key) => localStorage.removeItem(key));
  } catch (error) {
    console.error('Failed to cleanup expired drafts:', error);
  }
}

/**
 * Get all drafts for a user (for debugging/admin purposes)
 */
export function getAllDrafts(userId: string): Record<string, DraftData> {
  const drafts: Record<string, DraftData> = {};
  const prefix = `${DRAFT_STORAGE_PREFIX}${userId}_`;

  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(prefix)) {
        const stored = localStorage.getItem(key);
        if (stored) {
          try {
            const draftKey = key.replace(prefix, '');
            drafts[draftKey] = JSON.parse(stored) as DraftData;
          } catch {
            // Skip invalid entries
          }
        }
      }
    }
  } catch (error) {
    console.error('Failed to get all drafts:', error);
  }

  return drafts;
}
