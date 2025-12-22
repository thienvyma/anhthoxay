/**
 * useSavedProjects Hook
 *
 * Custom hook for managing saved projects state.
 *
 * **Feature: bidding-phase6-portal**
 * **Requirements: 21.1, 21.2, 21.3**
 */

import { useState, useEffect, useCallback } from 'react';
import { savedProjectsApi, type SavedProject } from '../api';
import { useToast } from '../components/Toast';

interface UseSavedProjectsReturn {
  savedProjectIds: Set<string>;
  isLoading: boolean;
  toggleSave: (projectId: string) => Promise<void>;
  isSaved: (projectId: string) => boolean;
  refreshSavedProjects: () => Promise<void>;
}

export function useSavedProjects(): UseSavedProjectsReturn {
  const [savedProjectIds, setSavedProjectIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const { showToast } = useToast();

  // Load saved projects on mount
  const refreshSavedProjects = useCallback(async () => {
    try {
      setIsLoading(true);
      const result = await savedProjectsApi.getSavedProjects({ limit: 100 });
      const ids = new Set(result.data.map((sp: SavedProject) => sp.projectId));
      setSavedProjectIds(ids);
    } catch (error) {
      console.error('Failed to load saved projects:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshSavedProjects();
  }, [refreshSavedProjects]);

  // Toggle save/unsave
  const toggleSave = useCallback(async (projectId: string) => {
    const wasSaved = savedProjectIds.has(projectId);
    
    // Optimistic update
    setSavedProjectIds((prev) => {
      const next = new Set(prev);
      if (wasSaved) {
        next.delete(projectId);
      } else {
        next.add(projectId);
      }
      return next;
    });

    try {
      if (wasSaved) {
        await savedProjectsApi.unsaveProject(projectId);
        showToast('Đã bỏ lưu dự án', 'success');
      } else {
        await savedProjectsApi.saveProject(projectId);
        showToast('Đã lưu dự án', 'success');
      }
    } catch (error) {
      // Revert on error
      setSavedProjectIds((prev) => {
        const next = new Set(prev);
        if (wasSaved) {
          next.add(projectId);
        } else {
          next.delete(projectId);
        }
        return next;
      });
      
      const message = error instanceof Error ? error.message : 'Có lỗi xảy ra';
      showToast(message, 'error');
    }
  }, [savedProjectIds, showToast]);

  // Check if a project is saved
  const isSaved = useCallback((projectId: string) => {
    return savedProjectIds.has(projectId);
  }, [savedProjectIds]);

  return {
    savedProjectIds,
    isLoading,
    toggleSave,
    isSaved,
    refreshSavedProjects,
  };
}

export default useSavedProjects;
