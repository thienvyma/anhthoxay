/**
 * Fees Management Page
 *
 * Admin page for managing fee transactions (win fees, verification fees).
 *
 * **Feature: bidding-phase3-matching**
 * **Requirements: 13.1, 13.2, 13.4, 13.5**
 */

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { tokens } from '@app/shared';
import { feesApi } from '../../api';
import { useToast } from '../../components/Toast';
import { Button } from '../../components/Button';
import { FeeTable } from './FeeTable';
import { FeeDetailModal } from './FeeDetailModal';
import { 
  TABS, 
  FEE_STATUS_COLORS, 
  type FeeStatus, 
  type FeeType,
  type FeeListItem, 
  type FeeTransaction,
  type FeeAction,
} from './types';

interface FeesPageProps {
  embedded?: boolean;
}

export function FeesPage({ embedded = false }: FeesPageProps) {
  const toast = useToast();
  const [fees, setFees] = useState<FeeListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<FeeStatus | 'ALL'>('ALL');
  const [typeFilter, setTypeFilter] = useState<FeeType | 'ALL'>('ALL');
  const [searchCode, setSearchCode] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [tabCounts, setTabCounts] = useState<Record<string, number>>({});
  const [exporting, setExporting] = useState(false);

  // Modal states
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedFee, setSelectedFee] = useState<FeeListItem | null>(null);
  const [feeDetail, setFeeDetail] = useState<FeeTransaction | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [saving, setSaving] = useState(false);

  // Load fees
  const loadFees = useCallback(async () => {
    setLoading(true);
    try {
      const result = await feesApi.list({
        status: statusFilter === 'ALL' ? undefined : statusFilter,
        type: typeFilter === 'ALL' ? undefined : typeFilter,
        code: searchCode || undefined,
        page,
        limit: 20,
      });
      setFees(result.data);
      setTotalPages(result.totalPages);
      setTotal(result.total);
    } catch (error) {
      console.error('Failed to load fees:', error);
      toast.error('Không thể tải danh sách phí');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, typeFilter, searchCode, page, toast]);

  // Load tab counts
  const loadTabCounts = useCallback(async () => {
    try {
      const statuses: (FeeStatus | undefined)[] = [
        undefined, // ALL
        'PENDING',
        'PAID',
        'CANCELLED',
      ];
      const results = await Promise.all(
        statuses.map((status) => feesApi.list({ status, limit: 1 }))
      );
      const counts: Record<string, number> = {
        ALL: results[0].total,
        PENDING: results[1].total,
        PAID: results[2].total,
        CANCELLED: results[3].total,
      };
      setTabCounts(counts);
    } catch (error) {
      console.error('Failed to load tab counts:', error);
    }
  }, []);

  useEffect(() => {
    loadFees();
  }, [loadFees]);

  useEffect(() => {
    loadTabCounts();
  }, [loadTabCounts]);

  // Handlers
  const handleViewDetail = useCallback(async (fee: FeeListItem) => {
    setSelectedFee(fee);
    setShowDetailModal(true);
    setLoadingDetail(true);
    try {
      const detail = await feesApi.get(fee.id);
      setFeeDetail(detail);
    } catch (error) {
      console.error('Failed to load fee detail:', error);
      toast.error('Không thể tải thông tin chi tiết');
    } finally {
      setLoadingDetail(false);
    }
  }, [toast]);

  const handleFeeAction = useCallback(async (fee: FeeListItem, action: FeeAction, reason?: string) => {
    setSaving(true);
    try {
      switch (action) {
        case 'markPaid':
          await feesApi.markPaid(fee.id);
          toast.success('Đã đánh dấu thanh toán thành công!');
          break;
        case 'cancel':
          if (!reason?.trim()) {
            toast.error('Vui lòng nhập lý do hủy');
            setSaving(false);
            return;
          }
          await feesApi.cancel(fee.id, reason);
          toast.success('Đã hủy phí giao dịch!');
          break;
      }
      
      setShowDetailModal(false);
      setSelectedFee(null);
      setFeeDetail(null);
      loadFees();
      loadTabCounts();
    } catch (error) {
      console.error('Failed to process fee action:', error);
      toast.error(error instanceof Error ? error.message : 'Thao tác thất bại');
    } finally {
      setSaving(false);
    }
  }, [toast, loadFees, loadTabCounts]);

  const handleExportCsv = useCallback(async () => {
    setExporting(true);
    try {
      await feesApi.exportCsv({
        status: statusFilter === 'ALL' ? undefined : statusFilter,
        type: typeFilter === 'ALL' ? undefined : typeFilter,
      });
      toast.success('Đã xuất file CSV thành công!');
    } catch (error) {
      console.error('Failed to export CSV:', error);
      toast.error('Xuất CSV thất bại');
    } finally {
      setExporting(false);
    }
  }, [statusFilter, typeFilter, toast]);

  const closeModals = useCallback(() => {
    setShowDetailModal(false);
    setSelectedFee(null);
    setFeeDetail(null);
  }, []);

  return (
    <div>
      {/* Header - hidden when embedded */}
      {!embedded && (
        <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <h2 style={{ color: tokens.color.text, fontSize: 24, fontWeight: 600, margin: 0 }}>
              Quản lý Phí
            </h2>
            <p style={{ color: tokens.color.muted, fontSize: 14, margin: '4px 0 0' }}>
              Quản lý phí thắng thầu và phí xác minh từ nhà thầu
            </p>
          </div>
          <Button
            variant="secondary"
            onClick={handleExportCsv}
            disabled={exporting}
            style={{ display: 'flex', alignItems: 'center', gap: 8 }}
          >
            {exporting ? (
              <motion.i
                className="ri-loader-4-line"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              />
            ) : (
              <i className="ri-download-2-line" />
            )}
            Xuất CSV
          </Button>
        </div>
      )}

      {/* Filters */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap', alignItems: 'center' }}>
        {/* Search by code */}
        <div style={{ position: 'relative', flex: '1 1 200px', maxWidth: 300 }}>
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
            placeholder="Tìm theo mã phí..."
            value={searchCode}
            onChange={(e) => {
              setSearchCode(e.target.value);
              setPage(1);
            }}
            style={{
              width: '100%',
              padding: '10px 12px 10px 40px',
              background: tokens.color.surface,
              border: `1px solid ${tokens.color.border}`,
              borderRadius: tokens.radius.md,
              color: tokens.color.text,
              fontSize: 14,
            }}
          />
        </div>

        {/* Type filter */}
        <select
          value={typeFilter}
          onChange={(e) => {
            setTypeFilter(e.target.value as FeeType | 'ALL');
            setPage(1);
          }}
          style={{
            padding: '10px 16px',
            background: tokens.color.surface,
            border: `1px solid ${tokens.color.border}`,
            borderRadius: tokens.radius.md,
            color: tokens.color.text,
            fontSize: 14,
            cursor: 'pointer',
          }}
        >
          <option value="ALL">Tất cả loại phí</option>
          <option value="WIN_FEE">Phí thắng thầu</option>
          <option value="VERIFICATION_FEE">Phí xác minh</option>
        </select>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
        {TABS.map((tab) => {
          const isActive = statusFilter === tab.status;
          const count = tabCounts[tab.status] || 0;
          const color = tab.status === 'ALL' ? tokens.color.primary : FEE_STATUS_COLORS[tab.status as FeeStatus];
          return (
            <motion.button
              key={tab.status}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                setStatusFilter(tab.status);
                setPage(1);
              }}
              style={{
                padding: '10px 20px',
                borderRadius: tokens.radius.md,
                border: `1px solid ${isActive ? color : tokens.color.border}`,
                background: isActive ? `${color}15` : 'transparent',
                color: isActive ? color : tokens.color.muted,
                cursor: 'pointer',
                fontSize: 14,
                fontWeight: isActive ? 600 : 400,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              {tab.label}
              <span
                style={{
                  padding: '2px 8px',
                  borderRadius: tokens.radius.sm,
                  background: isActive ? color : tokens.color.border,
                  color: isActive ? '#fff' : tokens.color.muted,
                  fontSize: 12,
                  fontWeight: 600,
                }}
              >
                {count}
              </span>
            </motion.button>
          );
        })}
      </div>

      {/* Fees Table */}
      <div
        style={{
          background: tokens.color.surface,
          borderRadius: tokens.radius.lg,
          border: `1px solid ${tokens.color.border}`,
          overflow: 'hidden',
        }}
      >
        <FeeTable
          fees={fees}
          loading={loading}
          onViewDetail={handleViewDetail}
          onFeeAction={handleFeeAction}
        />
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, marginTop: 24 }}>
          <Button variant="secondary" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
            <i className="ri-arrow-left-line" />
          </Button>
          <span style={{ padding: '8px 16px', color: tokens.color.text }}>
            Trang {page} / {totalPages} ({total} phí)
          </span>
          <Button
            variant="secondary"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            <i className="ri-arrow-right-line" />
          </Button>
        </div>
      )}

      {/* Detail Modal */}
      <FeeDetailModal
        show={showDetailModal}
        fee={selectedFee}
        detail={feeDetail}
        loading={loadingDetail}
        saving={saving}
        onClose={closeModals}
        onFeeAction={handleFeeAction}
      />
    </div>
  );
}
