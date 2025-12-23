import { useState, useEffect, useCallback, useMemo } from 'react';
import { tokens } from '@app/shared';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { leadsApi } from '../api';
import { ResponsiveTable, TableColumn } from '../../components/responsive/ResponsiveTable';
import { ResponsiveGrid } from '../../components/responsive/ResponsiveGrid';
import { ResponsiveModal } from '../../components/responsive/ResponsiveModal';
import { ResponsiveStack } from '../../components/responsive/ResponsiveStack';
import { useResponsive } from '../../hooks/useResponsive';
import type { CustomerLead, StatusHistoryEntry } from '../types';

const statusColors: Record<string, { bg: string; text: string }> = {
  NEW: { bg: 'rgba(59,130,246,0.2)', text: '#3b82f6' },
  CONTACTED: { bg: 'rgba(245,158,11,0.2)', text: '#f59e0b' },
  CONVERTED: { bg: 'rgba(16,185,129,0.2)', text: '#10b981' },
  CANCELLED: { bg: 'rgba(239,68,68,0.2)', text: '#ef4444' },
};

const statusLabels: Record<string, string> = {
  NEW: 'Mới',
  CONTACTED: 'Đã liên hệ',
  CONVERTED: 'Đã chuyển đổi',
  CANCELLED: 'Đã hủy',
};

// Debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

// QuoteData display component
function QuoteDataDisplay({ quoteData }: { quoteData: string | null }) {
  if (!quoteData) return null;
  
  try {
    const data = JSON.parse(quoteData);
    return (
      <div style={{ marginTop: 8 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <tbody>
            {data.categoryName && (
              <tr>
                <td style={{ padding: '4px 8px', color: tokens.color.muted }}>Hạng mục:</td>
                <td style={{ padding: '4px 8px', color: tokens.color.text }}>{data.categoryName}</td>
              </tr>
            )}
            {data.area && (
              <tr>
                <td style={{ padding: '4px 8px', color: tokens.color.muted }}>Diện tích:</td>
                <td style={{ padding: '4px 8px', color: tokens.color.text }}>{data.area} m²</td>
              </tr>
            )}
            {data.baseCost !== undefined && (
              <tr>
                <td style={{ padding: '4px 8px', color: tokens.color.muted }}>Chi phí cơ bản:</td>
                <td style={{ padding: '4px 8px', color: tokens.color.text }}>
                  {new Intl.NumberFormat('vi-VN').format(data.baseCost)} VNĐ
                </td>
              </tr>
            )}
            {data.materialsCost !== undefined && data.materialsCost > 0 && (
              <tr>
                <td style={{ padding: '4px 8px', color: tokens.color.muted }}>Vật dụng:</td>
                <td style={{ padding: '4px 8px', color: tokens.color.text }}>
                  {new Intl.NumberFormat('vi-VN').format(data.materialsCost)} VNĐ
                </td>
              </tr>
            )}
            {data.grandTotal !== undefined && (
              <tr style={{ borderTop: `1px solid ${tokens.color.border}` }}>
                <td style={{ padding: '8px', color: tokens.color.primary, fontWeight: 600 }}>Tổng cộng:</td>
                <td style={{ padding: '8px', color: tokens.color.primary, fontWeight: 600 }}>
                  {new Intl.NumberFormat('vi-VN').format(data.grandTotal)} VNĐ
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    );
  } catch {
    return (
      <pre style={{
        background: 'rgba(0,0,0,0.3)',
        padding: 8,
        borderRadius: 6,
        color: tokens.color.muted,
        fontSize: 11,
        overflow: 'auto',
        marginTop: 8,
      }}>
        {quoteData}
      </pre>
    );
  }
}

// Notes editor component
function NotesEditor({ 
  initialNotes, 
  onSave 
}: { 
  initialNotes: string | null; 
  onSave: (notes: string) => Promise<void>;
}) {
  const [notes, setNotes] = useState(initialNotes || '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(notes);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Thêm ghi chú..."
        style={{
          width: '100%',
          minHeight: 80,
          padding: 12,
          background: 'rgba(0,0,0,0.2)',
          border: `1px solid ${tokens.color.border}`,
          borderRadius: 8,
          color: tokens.color.text,
          fontSize: 14,
          resize: 'vertical',
        }}
      />
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
        <Button 
          variant="outline" 
          size="small" 
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? 'Đang lưu...' : 'Lưu ghi chú'}
        </Button>
        {saved && (
          <span style={{ color: '#10b981', fontSize: 13 }}>
            <i className="ri-check-line" /> Đã lưu
          </span>
        )}
      </div>
    </div>
  );
}

// Status history timeline
function StatusHistory({ history }: { history: string | null }) {
  if (!history) return null;
  
  try {
    const entries: StatusHistoryEntry[] = JSON.parse(history);
    if (entries.length === 0) return null;
    
    return (
      <div style={{ marginTop: 16 }}>
        <label style={{ color: tokens.color.muted, fontSize: 13, marginBottom: 8, display: 'block' }}>
          Lịch sử trạng thái
        </label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {entries.map((entry, idx) => (
            <div 
              key={idx}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 12px',
                background: 'rgba(0,0,0,0.2)',
                borderRadius: 6,
                fontSize: 13,
                flexWrap: 'wrap',
              }}
            >
              <span style={{ color: statusColors[entry.from]?.text || tokens.color.muted }}>
                {statusLabels[entry.from] || entry.from}
              </span>
              <i className="ri-arrow-right-line" style={{ color: tokens.color.muted }} />
              <span style={{ color: statusColors[entry.to]?.text || tokens.color.text }}>
                {statusLabels[entry.to] || entry.to}
              </span>
              <span style={{ color: tokens.color.muted, marginLeft: 'auto', fontSize: 12 }}>
                {new Date(entry.changedAt).toLocaleString('vi-VN')}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  } catch {
    return null;
  }
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
  
  const debouncedSearch = useDebounce(searchQuery, 300);

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

  // Table columns definition
  const columns: TableColumn<CustomerLead>[] = useMemo(() => [
    {
      key: 'name',
      header: 'Khách hàng',
      priority: 1,
      render: (_, row) => (
        <div>
          <div style={{ color: tokens.color.text, fontWeight: 500 }}>{row.name}</div>
          {row.quoteData && (
            <span style={{ fontSize: 11, color: tokens.color.primary }}>
              <i className="ri-calculator-line" /> Có báo giá
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'phone',
      header: 'Liên hệ',
      priority: 2,
      render: (_, row) => (
        <div>
          <div style={{ color: tokens.color.text }}>{row.phone}</div>
          {row.email && <div style={{ color: tokens.color.muted, fontSize: 13 }}>{row.email}</div>}
        </div>
      ),
    },
    {
      key: 'content',
      header: 'Nội dung',
      hideOnMobile: true,
      render: (value) => (
        <div style={{ 
          color: tokens.color.muted, 
          fontSize: 13, 
          overflow: 'hidden', 
          textOverflow: 'ellipsis', 
          whiteSpace: 'nowrap',
          maxWidth: 200,
        }}>
          {String(value)}
        </div>
      ),
    },
    {
      key: 'source',
      header: 'Nguồn',
      hideOnMobile: true,
      render: (value) => (
        <span style={{
          padding: '4px 8px',
          borderRadius: 6,
          background: 'rgba(255,255,255,0.05)',
          color: tokens.color.muted,
          fontSize: 12,
        }}>
          {String(value)}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Trạng thái',
      priority: 3,
      render: (value) => {
        const status = String(value);
        const colors = statusColors[status];
        return (
          <span style={{
            padding: '4px 12px',
            borderRadius: 20,
            background: colors?.bg || 'rgba(255,255,255,0.1)',
            color: colors?.text || tokens.color.text,
            fontSize: 13,
            fontWeight: 500,
          }}>
            {statusLabels[status] || status}
          </span>
        );
      },
    },
    {
      key: 'createdAt',
      header: 'Ngày tạo',
      hideOnMobile: true,
      render: (value) => (
        <span style={{ color: tokens.color.muted, fontSize: 13 }}>
          {new Date(String(value)).toLocaleDateString('vi-VN')}
        </span>
      ),
    },
  ], []);

  // Custom mobile card renderer
  const renderMobileCard = useCallback((lead: CustomerLead) => {
    const colors = statusColors[lead.status];
    return (
      <Card style={{ padding: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
          <div>
            <div style={{ color: tokens.color.text, fontWeight: 600, fontSize: 16 }}>{lead.name}</div>
            <div style={{ color: tokens.color.muted, fontSize: 13, marginTop: 4 }}>{lead.phone}</div>
            {lead.email && <div style={{ color: tokens.color.muted, fontSize: 12 }}>{lead.email}</div>}
          </div>
          <span style={{
            padding: '4px 10px',
            borderRadius: 20,
            background: colors?.bg || 'rgba(255,255,255,0.1)',
            color: colors?.text || tokens.color.text,
            fontSize: 12,
            fontWeight: 500,
          }}>
            {statusLabels[lead.status] || lead.status}
          </span>
        </div>
        
        {lead.content && (
          <div style={{ 
            color: tokens.color.muted, 
            fontSize: 13, 
            marginBottom: 12,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
          }}>
            {lead.content}
          </div>
        )}
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span style={{
              padding: '2px 6px',
              borderRadius: 4,
              background: 'rgba(255,255,255,0.05)',
              color: tokens.color.muted,
              fontSize: 11,
            }}>
              {lead.source}
            </span>
            {lead.quoteData && (
              <span style={{ fontSize: 11, color: tokens.color.primary }}>
                <i className="ri-calculator-line" /> Báo giá
              </span>
            )}
          </div>
          <Button variant="outline" size="small" onClick={() => setSelectedLead(lead)}>
            <i className="ri-eye-line" />
          </Button>
        </div>
      </Card>
    );
  }, []);

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
          <i 
            className="ri-search-line" 
            style={{ 
              position: 'absolute', 
              left: 12, 
              top: '50%', 
              transform: 'translateY(-50%)',
              color: tokens.color.muted,
            }} 
          />
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
              style={{
                position: 'absolute',
                right: 12,
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                color: tokens.color.muted,
                cursor: 'pointer',
              }}
            >
              <i className="ri-close-line" />
            </button>
          )}
        </div>
        <div style={{ 
          display: 'flex', 
          gap: 8, 
          flexWrap: 'wrap',
          overflowX: isMobile ? 'auto' : undefined,
          paddingBottom: isMobile ? 4 : 0,
        }}>
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
      <ResponsiveGrid
        cols={{ mobile: 2, tablet: 4, desktop: 4 }}
        gap={{ mobile: 12, tablet: 16, desktop: 16 }}
        style={{ marginBottom: 24 }}
      >
        {Object.entries(statusLabels).map(([status, label]) => {
          const count = stats[status] || 0;
          const colors = statusColors[status];
          return (
            <Card key={status} style={{ padding: isMobile ? 12 : 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 8 : 12 }}>
                <div style={{
                  width: isMobile ? 40 : 48,
                  height: isMobile ? 40 : 48,
                  borderRadius: 12,
                  background: colors.bg,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <span style={{ fontSize: isMobile ? 18 : 24, fontWeight: 700, color: colors.text }}>{count}</span>
                </div>
                <div>
                  <div style={{ color: tokens.color.muted, fontSize: isMobile ? 11 : 13 }}>{label}</div>
                  <div style={{ color: tokens.color.text, fontSize: isMobile ? 14 : 18, fontWeight: 600 }}>
                    {count} leads
                  </div>
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
        <ResponsiveStack
          direction={{ mobile: 'row', tablet: 'row', desktop: 'row' }}
          justify="center"
          align="center"
          gap={8}
          style={{ marginTop: 24 }}
        >
          <Button
            variant="outline"
            size="small"
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            <i className="ri-arrow-left-s-line" />
          </Button>
          {!isMobile && Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            let pageNum: number;
            if (totalPages <= 5) {
              pageNum = i + 1;
            } else if (currentPage <= 3) {
              pageNum = i + 1;
            } else if (currentPage >= totalPages - 2) {
              pageNum = totalPages - 4 + i;
            } else {
              pageNum = currentPage - 2 + i;
            }
            return (
              <Button
                key={pageNum}
                variant={currentPage === pageNum ? 'primary' : 'outline'}
                size="small"
                onClick={() => setCurrentPage(pageNum)}
              >
                {pageNum}
              </Button>
            );
          })}
          {isMobile && (
            <span style={{ color: tokens.color.muted, fontSize: 13, padding: '0 8px' }}>
              {currentPage}/{totalPages}
            </span>
          )}
          <Button
            variant="outline"
            size="small"
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
          >
            <i className="ri-arrow-right-s-line" />
          </Button>
        </ResponsiveStack>
      )}

      {/* Lead Detail Modal */}
      <ResponsiveModal
        isOpen={!!selectedLead}
        onClose={() => setSelectedLead(null)}
        title="Chi tiết khách hàng"
        size="lg"
      >
        {selectedLead && (
          <div style={{ display: 'grid', gap: 20 }}>
            {/* Basic Info */}
            <ResponsiveGrid
              cols={{ mobile: 1, tablet: 2, desktop: 2 }}
              gap={16}
            >
              <div>
                <label style={{ color: tokens.color.muted, fontSize: 13 }}>Họ tên</label>
                <div style={{ color: tokens.color.text, fontSize: 16, marginTop: 4 }}>{selectedLead.name}</div>
              </div>
              <div>
                <label style={{ color: tokens.color.muted, fontSize: 13 }}>Số điện thoại</label>
                <div style={{ color: tokens.color.text, fontSize: 16, marginTop: 4 }}>
                  <a href={`tel:${selectedLead.phone}`} style={{ color: tokens.color.primary }}>
                    {selectedLead.phone}
                  </a>
                </div>
              </div>
              {selectedLead.email && (
                <div>
                  <label style={{ color: tokens.color.muted, fontSize: 13 }}>Email</label>
                  <div style={{ color: tokens.color.text, fontSize: 16, marginTop: 4 }}>
                    <a href={`mailto:${selectedLead.email}`} style={{ color: tokens.color.primary }}>
                      {selectedLead.email}
                    </a>
                  </div>
                </div>
              )}
              <div>
                <label style={{ color: tokens.color.muted, fontSize: 13 }}>Nguồn</label>
                <div style={{ color: tokens.color.text, fontSize: 16, marginTop: 4 }}>{selectedLead.source}</div>
              </div>
            </ResponsiveGrid>

            {/* Content */}
            <div>
              <label style={{ color: tokens.color.muted, fontSize: 13 }}>Nội dung yêu cầu</label>
              <div style={{ 
                color: tokens.color.text, 
                fontSize: 14, 
                marginTop: 4, 
                whiteSpace: 'pre-wrap',
                padding: 12,
                background: 'rgba(0,0,0,0.2)',
                borderRadius: 8,
              }}>
                {selectedLead.content}
              </div>
            </div>

            {/* Quote Data */}
            {selectedLead.quoteData && (
              <div>
                <label style={{ color: tokens.color.muted, fontSize: 13 }}>Dữ liệu báo giá</label>
                <div style={{
                  background: 'rgba(0,0,0,0.2)',
                  padding: 12,
                  borderRadius: 8,
                  marginTop: 4,
                }}>
                  <QuoteDataDisplay quoteData={selectedLead.quoteData} />
                </div>
              </div>
            )}

            {/* Notes */}
            <div>
              <label style={{ color: tokens.color.muted, fontSize: 13, marginBottom: 8, display: 'block' }}>
                Ghi chú nội bộ
              </label>
              <NotesEditor
                initialNotes={selectedLead.notes}
                onSave={(notes) => updateLeadNotes(selectedLead.id, notes)}
              />
            </div>

            {/* Status */}
            <div>
              <label style={{ color: tokens.color.muted, fontSize: 13, marginBottom: 8, display: 'block' }}>
                Cập nhật trạng thái
              </label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {Object.entries(statusLabels).map(([status, label]) => (
                  <Button
                    key={status}
                    variant={selectedLead.status === status ? 'primary' : 'outline'}
                    size="small"
                    onClick={() => updateLeadStatus(selectedLead.id, status)}
                  >
                    {label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Status History */}
            <StatusHistory history={selectedLead.statusHistory} />
          </div>
        )}
      </ResponsiveModal>
    </div>
  );
}
