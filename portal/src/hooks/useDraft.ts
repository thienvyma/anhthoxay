/**
 * Draft Auto-save Hook
 *
 * Provides auto-save functionality for forms with:
 * - Auto-save every 30 seconds
 * - Draft restoration on mount
 * - Draft cleanup on successful submission
 *
 * **Feature: bidding-phase6-portal**
 * **Requirements: 22.1, 22.2, 22.3, 22.4, 22.5**
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../auth/AuthContext';
import {
  saveDraft,
  getDraft,
  deleteDraft,
  hasDraft,
  isDraftExpired,
  formatDraftTime,
  AUTO_SAVE_INTERVAL,
  type DraftData,
} from '../services/draftStorage';

export interface UseDraftOptions<T> {
  /** Unique key for this draft (e.g., 'project' or 'bid_123') */
  draftKey: string;
  /** Initial form data */
  initialData: T;
  /** Callback when draft is restored */
  onRestore?: (data: T) => void;
  /** Whether auto-save is enabled (default: true) */
  autoSaveEnabled?: boolean;
  /** Custom auto-save interval in ms (default: 30000) */
  autoSaveInterval?: number;
}

export interface UseDraftReturn<T> {
  /** Whether a draft exists */
  hasDraft: boolean;
  /** Whether the draft is expired (older than 30 days) */
  isExpired: boolean;
  /** Draft metadata (savedAt, etc.) */
  draftInfo: DraftData<T> | null;
  /** Formatted time since last save */
  lastSavedText: string | null;
  /** Whether auto-save is currently active */
  isAutoSaving: boolean;
  /** Save draft manually */
  save: (data: T) => void;
  /** Restore draft data */
  restore: () => T | null;
  /** Delete the draft */
  clear: () => void;
  /** Show recovery modal state */
  showRecoveryModal: boolean;
  /** Set recovery modal visibility */
  setShowRecoveryModal: (show: boolean) => void;
  /** Handle continue with draft */
  handleContinueDraft: () => void;
  /** Handle start fresh */
  handleStartFresh: () => void;
}

/**
 * Hook for managing form draft auto-save
 */
export function useDraft<T>(options: UseDraftOptions<T>): UseDraftReturn<T> {
  const {
    draftKey,
    initialData,
    onRestore,
    autoSaveEnabled = true,
    autoSaveInterval = AUTO_SAVE_INTERVAL,
  } = options;

  const { user } = useAuth();
  const userId = user?.id || '';

  const [draftExists, setDraftExists] = useState(false);
  const [draftInfo, setDraftInfo] = useState<DraftData<T> | null>(null);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [showRecoveryModal, setShowRecoveryModal] = useState(false);

  const currentDataRef = useRef<T>(initialData);
  const autoSaveTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hasCheckedDraftRef = useRef(false);

  // Check for existing draft on mount
  useEffect(() => {
    if (!userId || hasCheckedDraftRef.current) return;

    const existingDraft = getDraft<T>(draftKey, userId);
    if (existingDraft) {
      setDraftExists(true);
      setDraftInfo(existingDraft);
      // Show recovery modal if draft exists
      setShowRecoveryModal(true);
    }
    hasCheckedDraftRef.current = true;
  }, [draftKey, userId]);

  // Auto-save timer
  useEffect(() => {
    if (!userId || !autoSaveEnabled) return;

    autoSaveTimerRef.current = setInterval(() => {
      setIsAutoSaving(true);
      saveDraft(draftKey, userId, currentDataRef.current);
      
      // Update draft info
      const updatedDraft = getDraft<T>(draftKey, userId);
      if (updatedDraft) {
        setDraftInfo(updatedDraft);
        setDraftExists(true);
      }
      
      // Reset auto-saving indicator after a short delay
      setTimeout(() => setIsAutoSaving(false), 500);
    }, autoSaveInterval);

    return () => {
      if (autoSaveTimerRef.current) {
        clearInterval(autoSaveTimerRef.current);
      }
    };
  }, [draftKey, userId, autoSaveEnabled, autoSaveInterval]);

  /**
   * Save draft manually
   */
  const save = useCallback(
    (data: T) => {
      if (!userId) return;
      currentDataRef.current = data;
      saveDraft(draftKey, userId, data);
      
      const updatedDraft = getDraft<T>(draftKey, userId);
      if (updatedDraft) {
        setDraftInfo(updatedDraft);
        setDraftExists(true);
      }
    },
    [draftKey, userId]
  );

  /**
   * Restore draft data
   */
  const restore = useCallback((): T | null => {
    if (!userId) return null;
    const draft = getDraft<T>(draftKey, userId);
    if (draft) {
      currentDataRef.current = draft.data;
      return draft.data;
    }
    return null;
  }, [draftKey, userId]);

  /**
   * Delete the draft
   */
  const clear = useCallback(() => {
    if (!userId) return;
    deleteDraft(draftKey, userId);
    setDraftExists(false);
    setDraftInfo(null);
  }, [draftKey, userId]);

  /**
   * Handle continue with draft
   */
  const handleContinueDraft = useCallback(() => {
    const data = restore();
    if (data && onRestore) {
      onRestore(data);
    }
    setShowRecoveryModal(false);
  }, [restore, onRestore]);

  /**
   * Handle start fresh
   */
  const handleStartFresh = useCallback(() => {
    clear();
    currentDataRef.current = initialData;
    setShowRecoveryModal(false);
  }, [clear, initialData]);

  /**
   * Update current data ref (for auto-save)
   */
  const updateCurrentData = useCallback((data: T) => {
    currentDataRef.current = data;
  }, []);

  // Expose updateCurrentData through save
  const saveWithUpdate = useCallback(
    (data: T) => {
      updateCurrentData(data);
      save(data);
    },
    [updateCurrentData, save]
  );

  // Check if draft is expired
  const isExpired = userId ? isDraftExpired(draftKey, userId) : false;

  // Format last saved time
  const lastSavedText = draftInfo ? formatDraftTime(draftInfo.savedAt) : null;

  return {
    hasDraft: draftExists,
    isExpired,
    draftInfo,
    lastSavedText,
    isAutoSaving,
    save: saveWithUpdate,
    restore,
    clear,
    showRecoveryModal,
    setShowRecoveryModal,
    handleContinueDraft,
    handleStartFresh,
  };
}

/**
 * Check if a draft exists for a specific key and user
 */
export function checkDraftExists(draftKey: string, userId: string): boolean {
  return hasDraft(draftKey, userId);
}
