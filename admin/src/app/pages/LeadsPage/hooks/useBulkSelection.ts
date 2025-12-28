import { useState, useCallback, useEffect, useRef } from 'react';

export interface UseBulkSelectionReturn {
  selectedIds: Set<string>;
  isAllSelected: boolean;
  toggleSelectAll: () => void;
  toggleSelectOne: (id: string) => void;
  clearSelection: () => void;
  selectedCount: number;
}

interface UseBulkSelectionOptions {
  /** Dependencies that should clear selection when changed */
  clearOnChange?: unknown[];
}

/**
 * Hook for managing bulk selection state
 * @param items - Array of items with id property
 * @param options - Configuration options
 */
export function useBulkSelection<T extends { id: string }>(
  items: T[],
  options: UseBulkSelectionOptions = {}
): UseBulkSelectionReturn {
  const { clearOnChange = [] } = options;
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  
  // Store previous values to detect actual changes
  const prevValuesRef = useRef<string>('');

  const isAllSelected = items.length > 0 && selectedIds.size === items.length;
  const selectedCount = selectedIds.size;

  const toggleSelectAll = useCallback(() => {
    if (selectedIds.size === items.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(items.map(item => item.id)));
    }
  }, [items, selectedIds.size]);

  const toggleSelectOne = useCallback((id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  // Clear selection when dependencies change (using JSON stringify for comparison)
  useEffect(() => {
    const currentValues = JSON.stringify(clearOnChange);
    if (prevValuesRef.current && prevValuesRef.current !== currentValues) {
      setSelectedIds(new Set());
    }
    prevValuesRef.current = currentValues;
  }, [clearOnChange]);

  return {
    selectedIds,
    isAllSelected,
    toggleSelectAll,
    toggleSelectOne,
    clearSelection,
    selectedCount,
  };
}
