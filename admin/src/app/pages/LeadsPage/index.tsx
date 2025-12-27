import { useState, useEffect, useCallback, useMemo } from 'react';
import { tokens } from '@app/shared';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { leadsApi } from '../../api';
import { furnitureQuotationsApi } from '../../api/furniture';
import { ResponsiveTable } from '../../../components/responsive/ResponsiveTable';
import { ResponsiveGrid } from '../../../components/responsive/ResponsiveGrid';
import { ResponsiveStack } from '../../../components/responsive/ResponsiveStack';
import { useResponsive } from '../../../hooks/useResponsive';
import { LeadDetailModal, LeadMobileCard, getLeadTableColumns } from './components';
import { statusColors, statusLabels } from './types';
import type { CustomerLead, FurnitureQuotation } from './types';

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
  const [filterSource, setFilterSource] = useState<string>(''); // Filter by source
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [exporting, setExporting] = useState(false);
  
  // Bulk selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
  
  // Furniture quotation history state
  const [furnitureQuotations, setFurnitureQuotations] = useState<FurnitureQuotation[]>([]);
  const [loadingQuotations, setLoadingQuotations] = useState(false);
  
  // Track which leads have furniture quotations
  const [leadsWithFurnitureQuotes, setLeadsWithFurnitureQuotes] = useState<Set<string>>(new Set());
  
  const debouncedSearch = useDebounce(searchQuery, 300);
  const columns = useMemo(() => getLeadTableColumns(leadsWithFurnitureQuotes), [leadsWithFurnitureQuotes]);

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    try {
      const response = await leadsApi.list({
        search: debouncedSearch || undefined,
        status: filterStatus || undefined,
        page: currentPage,
        limit: 20,
      });
      
      // Filter by source if selected
      let filteredData = response.data;
      if (filterSource) {
        filteredData = response.data.filter(lead => lead.source === filterSource);
      }
      
      setLeads(filteredData);
      setTotalPages(response.totalPages);
      setTotal(filterSource ? filteredData.length : response.total);
      
      // Check which leads have furniture quotations
      const leadsToCheck = filteredData.filter(l => l.source === 'FURNITURE_QUOTE');
      if (leadsToCheck.length > 0) {
        const quotesPromises = leadsToCheck.map(lead => 
          furnitureQuotationsApi.list(lead.id).catch(() => [])
        );
        const quotesResults = await Promise.all(quotesPromises);
        const withQuotes = new Set<string>();
        leadsToCheck.forEach((lead, idx) => {
          if (quotesResults[idx] && quotesResults[idx].length > 0) {
            withQuotes.add(lead.id);
          }
        });
        setLeadsWithFurnitureQuotes(withQuotes);
      } else {
        setLeadsWithFurnitureQuotes(new Set());
      }
    } catch (error) {
      console.error('Failed to fetch leads:', error);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, filterStatus, filterSource, currentPage]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, filterStatus, filterSource]);

  // Fetch furniture quotations when a lead is selected
  useEffect(() => {
    if (selectedLead) {
      setLoadingQuotations(true);
      furnitureQuotationsApi.list(selectedLead.id)
        .then(setFurnitureQuotations)
        .catch((error) => {
          console.error('Failed to fetch furniture quotations:', error);
          setFurnitureQuotations([]);
        })
        .finally(() => setLoadingQuotations(false));
    } else {
      setFurnitureQuotations([]);
    }
  }, [selectedLead]);

  const updateLeadStatus = async (id: string, status: string) => {
    try {
      const updatedLead = await leadsApi.update(id, { status });
      // Update selectedLead immediately with the response
      if (selectedLead?.id === id && updatedLead) {
        setSelectedLead(updatedLead);
      }
      // Refresh the list
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

  // Bulk selection handlers
  const toggleSelectAll = useCallback(() => {
    if (selectedIds.size === leads.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(leads.map(l => l.id)));
    }
  }, [leads, selectedIds.size]);

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

  const handleBulkDelete = async () => {
    setBulkDeleting(true);
    try {
      await Promise.all(Array.from(selectedIds).map(id => leadsApi.delete(id)));
      setSelectedIds(new Set());
      setShowBulkDeleteConfirm(false);
      fetchLeads();
    } catch (error) {
      console.error('Bulk delete failed:', error);
    } finally {
      setBulkDeleting(false);
    }
  };

  // Clear selection when page/filter changes
  useEffect(() => {
    setSelectedIds(new Set());
  }, [currentPage, filterStatus, filterSource, debouncedSearch]);

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

  // Stats from current filter
  const stats = useMemo(() => {
    const result: Record<string, number> = { NEW: 0, CONTACTED: 0, CONVERTED: 0, CANCELLED: 0 };
    leads.forEach(l => {
      if (result[l.status] !== undefined) result[l.status]++;
    });
    return result;
  }, [leads]);

  // Source stats
  const sourceStats = useMemo(() => {
    const result = { 
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
      {selectedIds.size > 0 && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 16px',
          background: 'rgba(239, 68, 68, 0.1)',
          border: `1px solid ${tokens.color.error}`,
          borderRadius: 8,
          marginBottom: 16,
        }}>
          <span style={{ color: tokens.color.text, fontSize: 14 }}>
            Đã chọn <strong>{selectedIds.size}</strong> khách hàng
          </span>
          <div style={{ display: 'flex', gap: 8 }}>
            <Button variant="outline" size="small" onClick={() => setSelectedIds(new Set())}>
              Bỏ chọn
            </Button>
            <Button 
              variant="primary" 
              size="small" 
              onClick={() => setShowBulkDeleteConfirm(true)}
              style={{ background: tokens.color.error }}
            >
              <i className="ri-delete-bin-line" /> Xóa {selectedIds.size} leads
            </Button>
          </div>
        </div>
      )}

      {/* Bulk Delete Confirm Modal */}
      {showBulkDeleteConfirm && (
        <>
          <div 
            onClick={() => setShowBulkDeleteConfirm(false)}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.7)',
              zIndex: 9998,
            }} 
          />
          <div style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: tokens.color.surface,
            border: `1px solid ${tokens.color.border}`,
            borderRadius: 12,
            padding: 24,
            maxWidth: 400,
            width: '90%',
            zIndex: 9999,
          }}>
            <h3 style={{ color: tokens.color.text, margin: '0 0 16px', fontSize: 18 }}>
              <i className="ri-error-warning-line" style={{ color: tokens.color.error, marginRight: 8 }} />
              Xác nhận xóa hàng loạt
            </h3>
            <p style={{ color: tokens.color.muted, marginBottom: 20 }}>
              Bạn có chắc muốn xóa <strong style={{ color: tokens.color.error }}>{selectedIds.size}</strong> khách hàng? 
              Hành động này không thể hoàn tác.
            </p>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <Button 
                variant="outline" 
                onClick={() => setShowBulkDeleteConfirm(false)}
                disabled={bulkDeleting}
              >
                Hủy
              </Button>
              <Button 
                variant="primary" 
                onClick={handleBulkDelete}
                disabled={bulkDeleting}
                style={{ background: tokens.color.error }}
              >
                {bulkDeleting ? (
                  <><i className="ri-loader-4-line" style={{ animation: 'spin 1s linear infinite' }} /> Đang xóa...</>
                ) : (
                  <><i className="ri-delete-bin-line" /> Xóa {selectedIds.size} leads</>
                )}
              </Button>
            </div>
          </div>
        </>
      )}

      {/* Search & Filters */}
      <ResponsiveStack
        direction={{ mobile: 'column', tablet: 'row', desktop: 'row' }}
        gap={16}
        style={{ marginBottom: 16 }}
      >
        <div style={{ position: 'relative', flex: 1, minWidth: isMobile ? '100%' : 250 }}>
          <i className="ri-search-line" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: tokens.color.muted }} />
          <input
            type="text"
            placeholder="Tìm theo tên, SĐT, email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 12px 10px 40px',
              background: 'rgba(255,255,255,0.05)',
              border: `1px solid ${tokens.color.border}`,
              borderRadius: 8,
              color: tokens.color.text,
              fontSize: 14,
            }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: tokens.color.muted, cursor: 'pointer' }}
            >
              <i className="ri-close-line" />
            </button>
          )}
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', overflowX: isMobile ? 'auto' : undefined, paddingBottom: isMobile ? 4 : 0 }}>
          {['', 'NEW', 'CONTACTED', 'CONVERTED', 'CANCELLED'].map(status => (
            <Button
              key={status || 'ALL'}
              variant={filterStatus === status ? 'primary' : 'outline'}
              size="small"
              onClick={() => setFilterStatus(status)}
            >
              {status === '' ? 'Tất cả' : (isMobile ? statusLabels[status].slice(0, 3) : statusLabels[status])}
            </Button>
          ))}
        </div>
      </ResponsiveStack>

      {/* Source Filter - Furniture Quote Focus */}
      <div style={{ 
        display: 'flex', 
        gap: 8, 
        flexWrap: 'wrap', 
        marginBottom: 24,
        padding: 12,
        background: 'rgba(255,255,255,0.02)',
        borderRadius: 8,
        border: `1px solid ${tokens.color.border}`,
      }}>
        <span style={{ color: tokens.color.muted, fontSize: 13, display: 'flex', alignItems: 'center', marginRight: 8 }}>
          <i className="ri-filter-3-line" style={{ marginRight: 4 }} /> Nguồn:
        </span>
        <Button
          variant={filterSource === '' ? 'primary' : 'outline'}
          size="small"
          onClick={() => setFilterSource('')}
        >
          Tất cả ({leads.length})
        </Button>
        <Button
          variant={filterSource === 'FURNITURE_QUOTE' ? 'primary' : 'outline'}
          size="small"
          onClick={() => setFilterSource('FURNITURE_QUOTE')}
          style={filterSource === 'FURNITURE_QUOTE' ? { background: '#8B5CF6' } : { borderColor: '#8B5CF6', color: '#8B5CF6' }}
        >
          <i className="ri-sofa-line" /> Nội thất ({sourceStats.FURNITURE_QUOTE})
        </Button>
        <Button
          variant={filterSource === 'QUOTE_FORM' ? 'primary' : 'outline'}
          size="small"
          onClick={() => setFilterSource('QUOTE_FORM')}
        >
          <i className="ri-calculator-line" /> Báo giá ({sourceStats.QUOTE_FORM})
        </Button>
        <Button
          variant={filterSource === 'CONTACT_FORM' ? 'primary' : 'outline'}
          size="small"
          onClick={() => setFilterSource('CONTACT_FORM')}
        >
          <i className="ri-mail-line" /> Liên hệ ({sourceStats.CONTACT_FORM})
        </Button>
        
        {/* Furniture quotation status indicator */}
        {filterSource === 'FURNITURE_QUOTE' && (
          <div style={{ 
            display: 'flex', 
            gap: 12, 
            marginLeft: 'auto',
            alignItems: 'center',
          }}>
            <span style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 4, 
              fontSize: 12,
              color: tokens.color.success,
            }}>
              <i className="ri-checkbox-circle-fill" /> Đã báo giá: {sourceStats.withFurnitureQuotation}
            </span>
            <span style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 4, 
              fontSize: 12,
              color: tokens.color.warning,
            }}>
              <i className="ri-time-line" /> Chưa báo giá: {sourceStats.withoutFurnitureQuotation}
            </span>
          </div>
        )}
      </div>

      {/* Stats */}
      <ResponsiveGrid cols={{ mobile: 2, tablet: 4, desktop: 4 }} gap={{ mobile: 12, tablet: 16, desktop: 16 }} style={{ marginBottom: 24 }}>
        {Object.entries(statusLabels).map(([status, label]) => {
          const count = stats[status] || 0;
          const colors = statusColors[status];
          return (
            <Card key={status} style={{ padding: isMobile ? 12 : 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 8 : 12 }}>
                <div style={{ width: isMobile ? 40 : 48, height: isMobile ? 40 : 48, borderRadius: 12, background: colors.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: isMobile ? 18 : 24, fontWeight: 700, color: colors.text }}>{count}</span>
                </div>
                <div>
                  <div style={{ color: tokens.color.muted, fontSize: isMobile ? 11 : 13 }}>{label}</div>
                  <div style={{ color: tokens.color.text, fontSize: isMobile ? 14 : 18, fontWeight: 600 }}>{count} leads</div>
                </div>
              </div>
            </Card>
          );
        })}
      </ResponsiveGrid>

      {/* Leads Table */}
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
          <Button variant="outline" size="small" onClick={() => setSelectedLead(lead)}>
            {isMobile ? <i className="ri-eye-line" /> : <><i className="ri-eye-line" /> Chi tiết</>}
          </Button>
        )}
      />

      {/* Pagination */}
      {totalPages > 1 && (
        <ResponsiveStack direction={{ mobile: 'row', tablet: 'row', desktop: 'row' }} justify="center" align="center" gap={8} style={{ marginTop: 24 }}>
          <Button variant="outline" size="small" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>
            <i className="ri-arrow-left-s-line" />
          </Button>
          {!isMobile && Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            let pageNum: number;
            if (totalPages <= 5) pageNum = i + 1;
            else if (currentPage <= 3) pageNum = i + 1;
            else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i;
            else pageNum = currentPage - 2 + i;
            return (
              <Button key={pageNum} variant={currentPage === pageNum ? 'primary' : 'outline'} size="small" onClick={() => setCurrentPage(pageNum)}>
                {pageNum}
              </Button>
            );
          })}
          {isMobile && <span style={{ color: tokens.color.muted, fontSize: 13, padding: '0 8px' }}>{currentPage}/{totalPages}</span>}
          <Button variant="outline" size="small" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>
            <i className="ri-arrow-right-s-line" />
          </Button>
        </ResponsiveStack>
      )}

      {/* Lead Detail Modal */}
      <LeadDetailModal
        lead={selectedLead}
        onClose={() => setSelectedLead(null)}
        onStatusChange={updateLeadStatus}
        onNotesChange={updateLeadNotes}
        onDelete={deleteLead}
        furnitureQuotations={furnitureQuotations}
        loadingQuotations={loadingQuotations}
      />
    </div>
  );
}
