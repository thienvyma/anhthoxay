/**
 * usePagination Hook
 * Manages pagination state for each step in FurnitureQuote
 * 
 * **Feature: codebase-refactor-large-files**
 * **Requirements: 3.2**
 */

import { useState, useCallback } from 'react';

export interface PageStates {
  developers: number;
  projects: number;
  buildings: number;
  layouts: number;
  products: number;
}

const initialPageStates: PageStates = {
  developers: 1,
  projects: 1,
  buildings: 1,
  layouts: 1,
  products: 1,
};

export function usePagination() {
  const [pageStates, setPageStates] = useState<PageStates>(initialPageStates);

  const setPage = useCallback((key: keyof PageStates, page: number) => {
    setPageStates(prev => ({ ...prev, [key]: page }));
  }, []);

  const resetPage = useCallback((key: keyof PageStates) => {
    setPageStates(prev => ({ ...prev, [key]: 1 }));
  }, []);

  const resetAllPages = useCallback(() => {
    setPageStates(initialPageStates);
  }, []);

  return {
    pageStates,
    setPage,
    resetPage,
    resetAllPages,
  };
}
