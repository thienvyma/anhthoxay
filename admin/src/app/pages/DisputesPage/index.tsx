/**
 * Disputes Management Page
 *
 * Admin page for managing disputes between homeowners and contractors.
 *
 * **Feature: bidding-phase3-matching**
 * **Requirements: 16.3, 16.4, 16.5**
 */

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { tokens } from '../../../theme';
import { disputesApi } from '../../api';
import { useToast } from '../../components/Toast';
import { Button } from '../../components/Button';
import { DisputeTable } from './DisputeTable';
import { DisputeDetailModal } from './DisputeDetailModal';
import { ResolveDisputeModal } from './ResolveDisputeModal';
import {
  TABS,
  DISPUTE_STATUS_COLORS,
  type DisputeStatus,
  type DisputeListItem,
  type Dispute,
  type DisputeResolutionType,
} from './types';

interface DisputesPageProps {
  embedded?: boolean;
}

export function DisputesPage({ embedded = false }: DisputesPageProps) {
  const toast = useToast();
  const [disputes, setDisputes] = useState<DisputeListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<DisputeStatus | 'ALL'>('ALL');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [tabCounts, setTabCounts] = useState<Record<string, number>>({});

  // Modal states
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [selectedDispute, setSelectedDispute] = useState<DisputeListItem | null>(null);
  const [disputeDetail, setDisputeDetail] = useState<Dispute | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [saving, setSaving] = useState(false);

  // Load disputes
  const loadDisputes = useCallback(async () => {
    setLoading(true);
    try {
      const result = await disputesApi.list({
        status: statusFilter === 'ALL' ? undefined : statusFilter,
        page,
        limit: 20,
      });
      setDisputes(result.data);
      setTotalPages(result.totalPages);
      setTotal(result.total);
    } catch (error) {
      console.error('Failed to load disputes:', error);
      toast.error('Không thể tải danh sách tranh chấp');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, page, toast]);

  // Load tab counts
  const loadTabCounts = useCallback(async () => {
    try {
      const statuses: (DisputeStatus | undefined)[] = [undefined, 'OPEN', 'RESOLVED'];
      const results = await Promise.all(
        statuses.map((status) => disputesApi.list({ status, limit: 1 }))
      );
      const counts: Record<string, number> = {
        ALL: results[0].total,
        OPEN: results[1].total,
        RESOLVED: results[2].total,
      };
      setTabCounts(counts);
    } catch (error) {
      console.error('Failed to load tab counts:', error);
    }
  }, []);

  useEffect(() => {
    loadDisputes();
  }, [loadDisputes]);

  useEffect(() => {
    loadTabCounts();
  }, [loadTabCounts]);

  // Handlers
  const handleViewDetail = useCallback(
    async (dispute: DisputeListItem) => {
      setSelectedDispute(dispute);
      setShowDetailModal(true);
      setLoadingDetail(true);
      try {
        const detail = await disputesApi.get(dispute.escrowId);
        setDisputeDetail(detail);
      } catch (error) {
        console.error('Failed to load dispute detail:', error);
        toast.error('Không thể tải thông tin chi tiết');
      } finally {
        setLoadingDetail(false);
      }
    },
    [toast]
  );

  const handleOpenResolveModal = useCallback(async (dispute: DisputeListItem) => {
    setSelectedDispute(dispute);
    setLoadingDetail(true);
    try {
      const detail = await disputesApi.get(dispute.escrowId);
      setDisputeDetail(detail);
      setShowResolveModal(true);
    } catch (error) {
      console.error('Failed to load dispute detail:', error);
    } finally {
      setLoadingDetail(false);
    }
  }, []);

  const handleResolve = useCallback(
    async (resolution: DisputeResolutionType, note: string) => {
      if (!selectedDispute) return;
      setSaving(true);
      try {
        await disputesApi.resolve(selectedDispute.escrowId, { resolution, note });
        toast.success('Đã giải quyết tranh chấp thành công!');
        setShowResolveModal(false);
        setShowDetailModal(false);
        setSelectedDispute(null);
        setDisputeDetail(null);
        loadDisputes();
        loadTabCounts();
      } catch (error) {
        console.error('Failed to resolve dispute:', error);
        toast.error(error instanceof Error ? error.message : 'Giải quyết tranh chấp thất bại');
      } finally {
        setSaving(false);
      }
    },
    [selectedDispute, toast, loadDisputes, loadTabCounts]
  );

  const closeModals = useCallback(() => {
    setShowDetailModal(false);
    setShowResolveModal(false);
    setSelectedDispute(null);
    setDisputeDetail(null);
  }, []);

  return (
    <div>
      {/* Header - hidden when embedded */}
      {!embedded && (
        <div style={{ marginBottom: 24 }}>
          <h2 style={{ color: tokens.color.text, fontSize: 24, fontWeight: 600, margin: 0 }}>
            Quản lý Tranh chấp
          </h2>
          <p style={{ color: tokens.color.muted, fontSize: 14, margin: '4px 0 0' }}>
            Xem xét và giải quyết tranh chấp giữa chủ nhà và nhà thầu
          </p>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
        {TABS.map((tab) => {
          const isActive = statusFilter === tab.status;
          const count = tabCounts[tab.status] || 0;
          const color =
            tab.status === 'ALL'
              ? tokens.color.primary
              : DISPUTE_STATUS_COLORS[tab.status as DisputeStatus];
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

      {/* Disputes Table */}
      <div
        style={{
          background: tokens.color.surface,
          borderRadius: tokens.radius.lg,
          border: `1px solid ${tokens.color.border}`,
          overflow: 'hidden',
        }}
      >
        <DisputeTable
          disputes={disputes}
          loading={loading}
          onViewDetail={handleViewDetail}
          onResolve={handleOpenResolveModal}
        />
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 8,
            marginTop: 24,
          }}
        >
          <Button
            variant="secondary"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            <i className="ri-arrow-left-line" />
          </Button>
          <span style={{ padding: '8px 16px', color: tokens.color.text }}>
            Trang {page} / {totalPages} ({total} tranh chấp)
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
      <DisputeDetailModal
        show={showDetailModal}
        dispute={selectedDispute}
        detail={disputeDetail}
        loading={loadingDetail}
        onClose={closeModals}
        onResolve={() => {
          setShowDetailModal(false);
          setShowResolveModal(true);
        }}
      />

      {/* Resolve Modal */}
      <ResolveDisputeModal
        show={showResolveModal}
        dispute={selectedDispute}
        detail={disputeDetail}
        saving={saving}
        onConfirm={handleResolve}
        onClose={() => setShowResolveModal(false)}
      />
    </div>
  );
}
