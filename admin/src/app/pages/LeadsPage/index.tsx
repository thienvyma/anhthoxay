import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { tokens } from '../../../theme';
import { Button } from '../../components/Button';
import { leadsApi } from '../../api';
import { ResponsiveTable } from '../../../components/responsive/ResponsiveTable';
import { ResponsiveStack } from '../../../components/responsive/ResponsiveStack';
import { useResponsive } from '../../../hooks/useResponsive';
import { 
  LeadDetailModal, 
  LeadMobileCard, 
  getLeadTableColumns,
  LeadFilters,
  LeadStats,
  BulkDeleteModal,
  LeadPagination,
  RelatedLeadsModal,
} from './components';
import type { SourceStats, DuplicateStats } from './components';
import { useBulkSelection, useSelectedLeadQuotations } from './hooks';
import type { CustomerLead } from './types';

// Debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

export function LeadsPage() {
  const { isMobile } = useResponsive();
  const [leads, setLeads] = useState<CustomerLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLead, setSelectedLead] = useState<CustomerLead | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterSource, setFilterSource] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [exporting, setExporting] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
  const [leadsWithFurnitureQuotes, setLeadsWithFurnitureQuotes] = useState<Set<string>>(new Set());
  
  // Duplicate management state
  const [duplicateStatus, setDuplicateStatus] = useState<'all' | 'duplicates_only' | 'no_duplicates'>('all');
  const [hasRelatedFilter, setHasRelatedFilter] = useState<boolean | null>(null);
  const [relatedLeadsModalLead, setRelatedLeadsModalLead] = useState<CustomerLead | null>(null);
  const [duplicateStats, setDuplicateStats] = useState<DuplicateStats>({ potentialDuplicates: 0, withRelatedLeads: 0 });
  
  const debouncedSearch = useDebounce(searchQuery, 500);
  const columns = useMemo(() => getLeadTableColumns(leadsWithFurnitureQuotes), [leadsWithFurnitureQuotes]);
  
  // Use extracted hooks - memoize clearOnChange dependencies
  const clearOnChangeDeps = useMemo(
    () => [currentPage, filterStatus, filterSource, debouncedSearch, duplicateStatus, hasRelatedFilter],
    [currentPage, filterStatus, filterSource, debouncedSearch, duplicateStatus, hasRelatedFilter]
  );
  const { selectedIds, toggleSelectAll, toggleSelectOne, clearSelection, selectedCount } = useBulkSelection(
    leads,
    { clearOnChange: clearOnChangeDeps }
  );
  const { quotations: furnitureQuotations, loading: loadingQuotations } = useSelectedLeadQuotations(selectedLead?.id ?? null);
  
  // Track if we're currently fetching to prevent duplicate calls
  const isFetchingRef = useRef(false);
  const isInitialMount = useRef(true);

  const fetchLeads = useCallback(async (resetPage = false) => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    
    setLoading(true);
    try {
      const pageToFetch = resetPage ? 1 : currentPage;
      if (resetPage && currentPage !== 1) {
        setCurrentPage(1);
      }
      
      const response = await leadsApi.list({
        search: debouncedSearch || undefined,
        status: filterStatus || undefined,
        source: filterSource || undefined,
        duplicateStatus: duplicateStatus !== 'all' ? duplicateStatus : undefined,
        hasRelated: hasRelatedFilter !== null ? hasRelatedFilter : undefined,
        page: pageToFetch,
        limit: 20,
      });
      
      setLeads(response.data);
      setTotalPages(response.totalPages);
      setTotal(response.total);
      
      // Calculate duplicate stats from response
      const potentialDuplicates = response.data.filter(l => l.isPotentialDuplicate).length;
      const withRelatedLeads = response.data.filter(l => l.hasRelatedLeads).length;
      setDuplicateStats({ potentialDuplicates, withRelatedLeads });
      
      // Check which leads have furniture quotations - batch check instead of individual calls
      const leadsToCheck = response.data.filter(l => l.source === 'FURNITURE_QUOTE');
      if (leadsToCheck.length > 0) {
        try {
          const { furnitureQuotationsApi } = await import('../../api/furniture');
          // Limit concurrent requests to avoid rate limiting
          const batchSize = 5;
          const withQuotes = new Set<string>();
          
          for (let i = 0; i < leadsToCheck.length; i += batchSize) {
            const batch = leadsToCheck.slice(i, i + batchSize);
            const quotesResults = await Promise.allSettled(
              batch.map(lead => furnitureQuotationsApi.list(lead.id))
            );
            batch.forEach((lead, idx) => {
              const result = quotesResults[idx];
              if (result.status === 'fulfilled' && result.value && result.value.length > 0) {
                withQuotes.add(lead.id);
              }
            });
          }
          setLeadsWithFurnitureQuotes(withQuotes);
        } catch {
          setLeadsWithFurnitureQuotes(new Set());
        }
      } else {
        setLeadsWithFurnitureQuotes(new Set());
      }
    } catch (error) {
      console.error('Failed to fetch leads:', error);
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  }, [debouncedSearch, filterStatus, filterSource, duplicateStatus, hasRelatedFilter, currentPage]);

  // Single useEffect for all fetch triggers
  useEffect(() => {
    // Skip initial mount - will be handled by the second effect
    if (isInitialMount.current) {
      isInitialMount.current = false;
      fetchLeads();
      return;
    }
    
    // For subsequent changes, reset page if filters changed
    fetchLeads(true);
  }, [debouncedSearch, filterStatus, filterSource, duplicateStatus, hasRelatedFilter]);

  // Separate effect for page changes only
  useEffect(() => {
    if (!isInitialMount.current) {
      fetchLeads();
    }
  }, [currentPage]);

  const updateLeadStatus = async (id: string, status: string) => {
    try {
      const updatedLead = await leadsApi.update(id, { status });
      if (selectedLead?.id === id && updatedLead) {
        setSelectedLead(updatedLead);
      }
      fetchLeads();
    } catch (error) {
      console.error('Failed to update lead:', error);
    }
  };

  const updateLeadNotes = async (id: string, notes: string) => {
    await leadsApi.update(id, { notes });
    fetchLeads();
  };

  const deleteLead = async (id: string) => {
    await leadsApi.delete(id);
    fetchLeads();
  };

  const handleBulkDelete = async () => {
    setBulkDeleting(true);
    try {
      await Promise.all(Array.from(selectedIds).map(id => leadsApi.delete(id)));
      clearSelection();
      setShowBulkDeleteConfirm(false);
      fetchLeads();
    } catch (error) {
      console.error('Bulk delete failed:', error);
    } finally {
      setBulkDeleting(false);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      await leadsApi.export({
        search: debouncedSearch || undefined,
        status: filterStatus || undefined,
      });
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setExporting(false);
    }
  };

  const handleMergeLeads = async (primaryId: string, secondaryIds: string[]) => {
    try {
      await leadsApi.merge(primaryId, secondaryIds);
      fetchLeads();
    } catch (error) {
      console.error('Merge failed:', error);
      throw error;
    }
  };

  const stats = useMemo(() => {
    const result: Record<string, number> = { NEW: 0, CONTACTED: 0, CONVERTED: 0, CANCELLED: 0 };
    leads.forEach(l => {
      if (result[l.status] !== undefined) result[l.status]++;
    });
    return result;
  }, [leads]);

  const sourceStats = useMemo<SourceStats>(() => {
    const result: SourceStats = { 
      FURNITURE_QUOTE: 0, 
      QUOTE_FORM: 0, 
      CONTACT_FORM: 0,
      withFurnitureQuotation: 0,
      withoutFurnitureQuotation: 0,
    };
    leads.forEach(l => {
      if (l.source === 'FURNITURE_QUOTE') {
        result.FURNITURE_QUOTE++;
        if (leadsWithFurnitureQuotes.has(l.id)) {
          result.withFurnitureQuotation++;
        } else {
          result.withoutFurnitureQuotation++;
        }
      } else if (l.source === 'QUOTE_FORM') {
        result.QUOTE_FORM++;
      } else {
        result.CONTACT_FORM++;
      }
    });
    return result;
  }, [leads, leadsWithFurnitureQuotes]);

  const renderMobileCard = useCallback((lead: CustomerLead) => (
    <LeadMobileCard 
      lead={lead} 
      onSelect={setSelectedLead} 
      isSelected={selectedIds.has(lead.id)}
      onToggleSelect={() => toggleSelectOne(lead.id)}
      hasFurnitureQuotation={leadsWithFurnitureQuotes.has(lead.id)}
    />
  ), [selectedIds, toggleSelectOne, leadsWithFurnitureQuotes]);

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto' }}>
      {/* Header */}
      <ResponsiveStack
        direction={{ mobile: 'column', tablet: 'row', desktop: 'row' }}
        justify="between"
        align={isMobile ? 'stretch' : 'center'}
        gap={16}
        style={{ marginBottom: 24 }}
      >
        <div>
          <h1 style={{ color: tokens.color.text, fontSize: isMobile ? 24 : 28, fontWeight: 700, margin: 0 }}>
            Khách hàng tiềm năng
          </h1>
          <p style={{ color: tokens.color.muted, margin: '8px 0 0' }}>
            {total} leads · Quản lý từ form báo giá và liên hệ
          </p>
        </div>
        <Button
          variant="outline"
          icon="ri-download-line"
          onClick={handleExport}
          disabled={exporting}
          style={isMobile ? { width: '100%' } : undefined}
        >
          {exporting ? 'Đang xuất...' : 'Xuất CSV'}
        </Button>
      </ResponsiveStack>

      {/* Bulk Actions Bar */}
      {selectedCount > 0 && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 16px',
          background: tokens.color.errorBg,
          border: `1px solid ${tokens.color.error}`,
          borderRadius: 8,
          marginBottom: 16,
        }}>
          <span style={{ color: tokens.color.text, fontSize: 14 }}>
            Đã chọn <strong>{selectedCount}</strong> khách hàng
          </span>
          <div style={{ display: 'flex', gap: 8 }}>
            <Button variant="outline" size="small" onClick={clearSelection}>
              Bỏ chọn
            </Button>
            <Button 
              variant="primary" 
              size="small" 
              onClick={() => setShowBulkDeleteConfirm(true)}
              style={{ background: tokens.color.error }}
            >
              <i className="ri-delete-bin-line" /> Xóa {selectedCount} leads
            </Button>
          </div>
        </div>
      )}

      <BulkDeleteModal
        isOpen={showBulkDeleteConfirm}
        selectedCount={selectedCount}
        isDeleting={bulkDeleting}
        onConfirm={handleBulkDelete}
        onCancel={() => setShowBulkDeleteConfirm(false)}
      />

      <LeadFilters
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        filterStatus={filterStatus}
        onStatusChange={setFilterStatus}
        filterSource={filterSource}
        onSourceChange={setFilterSource}
        sourceStats={sourceStats}
        totalLeads={leads.length}
        isMobile={isMobile}
        duplicateStatus={duplicateStatus}
        onDuplicateStatusChange={setDuplicateStatus}
        hasRelatedFilter={hasRelatedFilter}
        onHasRelatedChange={setHasRelatedFilter}
        duplicateStats={duplicateStats}
      />

      <LeadStats stats={stats} isMobile={isMobile} />

      <ResponsiveTable
        data={leads}
        columns={columns}
        loading={loading}
        emptyMessage={searchQuery || filterStatus ? 'Không tìm thấy kết quả' : 'Chưa có khách hàng nào'}
        getRowKey={(lead) => lead.id}
        onRowClick={setSelectedLead}
        renderMobileCard={renderMobileCard}
        selectable
        selectedIds={selectedIds}
        onToggleSelect={toggleSelectOne}
        onToggleSelectAll={toggleSelectAll}
        actions={(lead) => (
          <div style={{ display: 'flex', gap: 4 }}>
            {(lead.hasRelatedLeads || lead.isPotentialDuplicate) && (
              <Button 
                variant="outline" 
                size="small" 
                onClick={(e) => {
                  e?.stopPropagation();
                  setRelatedLeadsModalLead(lead);
                }}
                style={{ 
                  borderColor: lead.isPotentialDuplicate ? tokens.color.warning : tokens.color.info,
                  color: lead.isPotentialDuplicate ? tokens.color.warning : tokens.color.info,
                }}
              >
                <i className={lead.isPotentialDuplicate ? 'ri-git-merge-line' : 'ri-links-line'} />
              </Button>
            )}
            <Button variant="outline" size="small" onClick={() => setSelectedLead(lead)}>
              {isMobile ? <i className="ri-eye-line" /> : <><i className="ri-eye-line" /> Chi tiết</>}
            </Button>
          </div>
        )}
      />

      <LeadPagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        isMobile={isMobile}
      />

      <LeadDetailModal
        lead={selectedLead}
        onClose={() => setSelectedLead(null)}
        onStatusChange={updateLeadStatus}
        onNotesChange={updateLeadNotes}
        onDelete={deleteLead}
        furnitureQuotations={furnitureQuotations}
        loadingQuotations={loadingQuotations}
      />

      <RelatedLeadsModal
        lead={relatedLeadsModalLead}
        onClose={() => setRelatedLeadsModalLead(null)}
        onMerge={handleMergeLeads}
        onViewLead={(lead) => {
          setRelatedLeadsModalLead(null);
          setSelectedLead(lead);
        }}
      />
    </div>
  );
}
