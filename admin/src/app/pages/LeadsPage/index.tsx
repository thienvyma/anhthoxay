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
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [exporting, setExporting] = useState(false);
  
  // Furniture quotation history state
  const [furnitureQuotations, setFurnitureQuotations] = useState<FurnitureQuotation[]>([]);
  const [loadingQuotations, setLoadingQuotations] = useState(false);
  
  const debouncedSearch = useDebounce(searchQuery, 300);
  const columns = useMemo(() => getLeadTableColumns(), []);

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    try {
      const response = await leadsApi.list({
        search: debouncedSearch || undefined,
        status: filterStatus || undefined,
        page: currentPage,
        limit: 20,
      });
      setLeads(response.data);
      setTotalPages(response.totalPages);
      setTotal(response.total);
    } catch (error) {
      console.error('Failed to fetch leads:', error);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, filterStatus, currentPage]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, filterStatus]);

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
      await leadsApi.update(id, { status });
      fetchLeads();
      if (selectedLead?.id === id) {
        const response = await leadsApi.list({ search: id, limit: 1 });
        if (response.data.length > 0) {
          setSelectedLead(response.data[0]);
        }
      }
    } catch (error) {
      console.error('Failed to update lead:', error);
    }
  };

  const updateLeadNotes = async (id: string, notes: string) => {
    await leadsApi.update(id, { notes });
    fetchLeads();
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

  // Stats from current filter
  const stats = useMemo(() => {
    const result: Record<string, number> = { NEW: 0, CONTACTED: 0, CONVERTED: 0, CANCELLED: 0 };
    leads.forEach(l => {
      if (result[l.status] !== undefined) result[l.status]++;
    });
    return result;
  }, [leads]);

  const renderMobileCard = useCallback((lead: CustomerLead) => (
    <LeadMobileCard lead={lead} onSelect={setSelectedLead} />
  ), []);

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

      {/* Search & Filters */}
      <ResponsiveStack
        direction={{ mobile: 'column', tablet: 'row', desktop: 'row' }}
        gap={16}
        style={{ marginBottom: 24 }}
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
        furnitureQuotations={furnitureQuotations}
        loadingQuotations={loadingQuotations}
      />
    </div>
  );
}
