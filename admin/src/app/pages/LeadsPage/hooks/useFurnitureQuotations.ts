import { useState, useEffect, useCallback } from 'react';
import { furnitureQuotationsApi } from '../../../api/furniture';
import type { FurnitureQuotation } from '../types';

export interface UseFurnitureQuotationsReturn {
  quotations: FurnitureQuotation[];
  loading: boolean;
  leadsWithQuotes: Set<string>;
  fetchQuotations: (leadId: string) => Promise<void>;
  checkLeadsForQuotations: (leadIds: string[]) => Promise<void>;
  clearQuotations: () => void;
}

/**
 * Hook for managing furniture quotation state
 */
export function useFurnitureQuotations(): UseFurnitureQuotationsReturn {
  const [quotations, setQuotations] = useState<FurnitureQuotation[]>([]);
  const [loading, setLoading] = useState(false);
  const [leadsWithQuotes, setLeadsWithQuotes] = useState<Set<string>>(new Set());

  const fetchQuotations = useCallback(async (leadId: string) => {
    setLoading(true);
    try {
      const data = await furnitureQuotationsApi.list(leadId);
      setQuotations(data);
    } catch (error) {
      console.error('Failed to fetch furniture quotations:', error);
      setQuotations([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const checkLeadsForQuotations = useCallback(async (leadIds: string[]) => {
    if (leadIds.length === 0) {
      setLeadsWithQuotes(new Set());
      return;
    }

    try {
      // Use Promise.allSettled to handle individual failures gracefully
      const results = await Promise.allSettled(
        leadIds.map(id => furnitureQuotationsApi.list(id))
      );
      
      const withQuotes = new Set<string>();
      leadIds.forEach((id, idx) => {
        const result = results[idx];
        if (result.status === 'fulfilled' && result.value && result.value.length > 0) {
          withQuotes.add(id);
        }
      });
      setLeadsWithQuotes(withQuotes);
    } catch {
      // If batch check fails, just set empty
      setLeadsWithQuotes(new Set());
    }
  }, []);

  const clearQuotations = useCallback(() => {
    setQuotations([]);
  }, []);

  return {
    quotations,
    loading,
    leadsWithQuotes,
    fetchQuotations,
    checkLeadsForQuotations,
    clearQuotations,
  };
}

/**
 * Hook for fetching quotations when a lead is selected
 */
export function useSelectedLeadQuotations(selectedLeadId: string | null) {
  const [quotations, setQuotations] = useState<FurnitureQuotation[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (selectedLeadId) {
      setLoading(true);
      furnitureQuotationsApi.list(selectedLeadId)
        .then(setQuotations)
        .catch((error) => {
          console.error('Failed to fetch furniture quotations:', error);
          setQuotations([]);
        })
        .finally(() => setLoading(false));
    } else {
      setQuotations([]);
    }
  }, [selectedLeadId]);

  return { quotations, loading };
}
