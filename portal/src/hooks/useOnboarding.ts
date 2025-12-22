/**
 * Onboarding State Management Hook
 *
 * Tracks onboarding completion status in localStorage and provides
 * methods to manage onboarding state.
 *
 * **Feature: bidding-phase6-portal, Property 11: Onboarding Completion Persistence**
 * **Validates: Requirements 19.4**
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../auth/AuthContext';

const ONBOARDING_STORAGE_KEY = 'portal_onboarding_completed';

export interface OnboardingState {
  isCompleted: boolean;
  completedAt: string | null;
  userId: string;
}

interface OnboardingStorage {
  [userId: string]: OnboardingState;
}

export interface UseOnboardingReturn {
  isCompleted: boolean;
  isLoading: boolean;
  shouldShowOnboarding: boolean;
  completeOnboarding: () => void;
  restartOnboarding: () => void;
  getOnboardingState: () => OnboardingState | null;
}

/**
 * Get onboarding storage from localStorage
 */
function getOnboardingStorage(): OnboardingStorage {
  try {
    const stored = localStorage.getItem(ONBOARDING_STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

/**
 * Save onboarding storage to localStorage
 */
function saveOnboardingStorage(storage: OnboardingStorage): void {
  try {
    localStorage.setItem(ONBOARDING_STORAGE_KEY, JSON.stringify(storage));
  } catch {
    console.error('Failed to save onboarding state to localStorage');
  }
}

/**
 * Hook for managing onboarding state
 */
export function useOnboarding(): UseOnboardingReturn {
  const { user, isLoading: authLoading } = useAuth();
  const [isCompleted, setIsCompleted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load onboarding state when user changes
  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!user?.id) {
      setIsCompleted(false);
      setIsLoading(false);
      return;
    }

    const storage = getOnboardingStorage();
    const userState = storage[user.id];
    setIsCompleted(userState?.isCompleted ?? false);
    setIsLoading(false);
  }, [user?.id, authLoading]);

  /**
   * Mark onboarding as completed for current user
   */
  const completeOnboarding = useCallback(() => {
    if (!user?.id) return;

    const storage = getOnboardingStorage();
    storage[user.id] = {
      isCompleted: true,
      completedAt: new Date().toISOString(),
      userId: user.id,
    };
    saveOnboardingStorage(storage);
    setIsCompleted(true);
  }, [user?.id]);

  /**
   * Reset onboarding state to show tour again
   */
  const restartOnboarding = useCallback(() => {
    if (!user?.id) return;

    const storage = getOnboardingStorage();
    storage[user.id] = {
      isCompleted: false,
      completedAt: null,
      userId: user.id,
    };
    saveOnboardingStorage(storage);
    setIsCompleted(false);
  }, [user?.id]);

  /**
   * Get current onboarding state for the user
   */
  const getOnboardingState = useCallback((): OnboardingState | null => {
    if (!user?.id) return null;
    const storage = getOnboardingStorage();
    return storage[user.id] || null;
  }, [user?.id]);

  // Determine if onboarding should be shown
  const shouldShowOnboarding = !isLoading && !authLoading && !!user && !isCompleted;

  return {
    isCompleted,
    isLoading: isLoading || authLoading,
    shouldShowOnboarding,
    completeOnboarding,
    restartOnboarding,
    getOnboardingState,
  };
}

/**
 * Utility function to check if onboarding is completed for a specific user
 * Can be used outside of React components
 */
export function isOnboardingCompleted(userId: string): boolean {
  const storage = getOnboardingStorage();
  return storage[userId]?.isCompleted ?? false;
}

/**
 * Utility function to mark onboarding as completed for a specific user
 * Can be used outside of React components
 */
export function markOnboardingCompleted(userId: string): void {
  const storage = getOnboardingStorage();
  storage[userId] = {
    isCompleted: true,
    completedAt: new Date().toISOString(),
    userId,
  };
  saveOnboardingStorage(storage);
}

/**
 * Utility function to reset onboarding for a specific user
 * Can be used outside of React components
 */
export function resetOnboarding(userId: string): void {
  const storage = getOnboardingStorage();
  storage[userId] = {
    isCompleted: false,
    completedAt: null,
    userId,
  };
  saveOnboardingStorage(storage);
}
