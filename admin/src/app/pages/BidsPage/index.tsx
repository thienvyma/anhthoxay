/**
 * Bids Management Page
 *
 * Admin page for managing contractor bids.
 *
 * **Feature: bidding-phase2-core**
 * **Requirements: 10.3, 10.5, 11.1, 11.2, 11.3**
 */

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { tokens } from '@app/shared';
import { bidsApi, projectsApi } from '../../api';
import { useToast } from '../../components/Toast';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { ResponsiveStack } from '../../../components/responsive';
import { useResponsive } from '../../../hooks/useResponsive';
import { BidTable } from './BidTable';
import { BidDetailModal } from './BidDetailModal';
import { ApprovalModal } from './ApprovalModal';
import { TABS, STATUS_COLORS, type BidStatus, type BidListItem, type Bid } from './types';
import type { ProjectListItem } from '../../types';

interface BidsPageProps {
  embedded?: boolean;
}

export function BidsPage({ embedded = false }: BidsPageProps) {
  const toast = useToast();
  const { isMobile } = useResponsive();
  const [bids, setBids] = useState<BidListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<BidStatus | 'ALL'>('ALL');
  const [projectFilter, setProjectFilter] = useState<string>('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [tabCounts, setTabCounts] = useState<Record<string, number>>({});

  // Filter options
  const [projects, setProjects] = useState<ProjectListItem[]>([]);

  // Modal states
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [selectedBid, setSelectedBid] = useState<BidListItem | null>(null);
  const [bidDetail, setBidDetail] = useState<Bid | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Approval form states
  const [approvalAction, setApprovalAction] = useState<'approve' | 'reject'>('approve');
  const [approvalNote, setApprovalNote] = useState('');
  const [saving, setSaving] = useState(false);

  // Load bids
  const loadBids = useCallback(async () => {
    setLoading(true);
    try {
      const result = await bidsApi.list({
        status: statusFilter === 'ALL' ? undefined : statusFilter,
        projectId: projectFilter || undefined,
        search: search || undefined,
        page,
        limit: 20,
      });
      setBids(result.data);
      setTotalPages(result.totalPages);
      setTotal(result.total);
    } catch (error) {
      console.error('Failed to load bids:', error);
      toast.error('Không thể tải danh sách bid');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, projectFilter, search, page, toast]);

  // Load tab counts
  const loadTabCounts = useCallback(async () => {
    try {
      const statuses: (BidStatus | undefined)[] = [
        undefined, // ALL
        'PENDING',
        'APPROVED',
        'REJECTED',
        'SELECTED',
        'WITHDRAWN',
      ];
      const results = await Promise.all(
        statuses.map((status) => bidsApi.list({ status, limit: 1 }))
      );
      const counts: Record<string, number> = {
        ALL: results[0].total,
        PENDING: results[1].total,
        APPROVED: results[2].total,
        REJECTED: results[3].total,
        SELECTED: results[4].total,
        WITHDRAWN: results[5].total,
      };
      setTabCounts(counts);
    } catch (error) {
      console.error('Failed to load tab counts:', error);
    }
  }, []);

  // Load filter options (projects)
  const loadFilterOptions = useCallback(async () => {
    try {
      const projectsData = await projectsApi.list({ limit: 100 });
      setProjects(projectsData.data);
    } catch (error) {
      console.error('Failed to load filter options:', error);
    }
  }, []);

  useEffect(() => {
    loadBids();
  }, [loadBids]);

  useEffect(() => {
    loadTabCounts();
  }, [loadTabCounts]);

  useEffect(() => {
    loadFilterOptions();
  }, [loadFilterOptions]);

  // Handlers
  const handleViewDetail = useCallback(async (bid: BidListItem) => {
    setSelectedBid(bid);
    setShowDetailModal(true);
    setLoadingDetail(true);
    try {
      const detail = await bidsApi.get(bid.id);
      setBidDetail(detail);
    } catch (error) {
      console.error('Failed to load bid detail:', error);
      toast.error('Không thể tải thông tin chi tiết');
    } finally {
      setLoadingDetail(false);
    }
  }, [toast]);

  const handleOpenApprovalModal = useCallback((bid: BidListItem, action: 'approve' | 'reject') => {
    setSelectedBid(bid);
    setApprovalAction(action);
    setApprovalNote('');
    setShowApprovalModal(true);
  }, []);

  const handleApproval = useCallback(async () => {
    if (!selectedBid) return;
    setSaving(true);
    try {
      if (approvalAction === 'approve') {
        await bidsApi.approve(selectedBid.id, approvalNote || undefined);
        toast.success('Đã duyệt bid thành công!');
      } else {
        if (!approvalNote.trim()) {
          toast.error('Vui lòng nhập lý do từ chối');
          setSaving(false);
          return;
        }
        await bidsApi.reject(selectedBid.id, approvalNote);
        toast.success('Đã từ chối bid');
      }
      setShowApprovalModal(false);
      setShowDetailModal(false);
      setSelectedBid(null);
      loadBids();
      loadTabCounts();
    } catch (error) {
      console.error('Failed to process approval:', error);
      toast.error(error instanceof Error ? error.message : 'Thao tác thất bại');
    } finally {
      setSaving(false);
    }
  }, [selectedBid, approvalAction, approvalNote, toast, loadBids, loadTabCounts]);

  const closeModals = useCallback(() => {
    setShowDetailModal(false);
    setShowApprovalModal(false);
    setSelectedBid(null);
    setBidDetail(null);
    setApprovalNote('');
  }, []);

  return (
    <div>
      {/* Header - hidden when embedded */}
      {!embedded && (
        <div style={{ marginBottom: 24 }}>
          <h2 style={{ color: tokens.color.text, fontSize: isMobile ? 20 : 24, fontWeight: 600, margin: 0 }}>
            Quản lý Bid
          </h2>
          <p style={{ color: tokens.color.muted, fontSize: 14, margin: '4px 0 0' }}>
            Xét duyệt và quản lý các bid từ nhà thầu
          </p>
        </div>
      )}

      {/* Tabs */}
      <div style={{ 
        display: 'flex', 
        gap: 8, 
        marginBottom: 24, 
        flexWrap: 'wrap',
        overflowX: isMobile ? 'auto' : undefined,
        paddingBottom: isMobile ? 4 : 0,
      }}>
        {TABS.map((tab) => {
          const isActive = statusFilter === tab.status;
          const count = tabCounts[tab.status] || 0;
          const color = tab.status === 'ALL' ? tokens.color.primary : STATUS_COLORS[tab.status as BidStatus];
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
                padding: isMobile ? '8px 12px' : '10px 20px',
                borderRadius: tokens.radius.md,
                border: `1px solid ${isActive ? color : tokens.color.border}`,
                background: isActive ? `${color}15` : 'transparent',
                color: isActive ? color : tokens.color.muted,
                cursor: 'pointer',
                fontSize: isMobile ? 12 : 14,
                fontWeight: isActive ? 600 : 400,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                whiteSpace: 'nowrap',
                minHeight: '44px',
              }}
            >
              {isMobile ? tab.label.slice(0, 6) : tab.label}
              <span
                style={{
                  padding: '2px 6px',
                  borderRadius: tokens.radius.sm,
                  background: isActive ? color : tokens.color.border,
                  color: isActive ? '#fff' : tokens.color.muted,
                  fontSize: 11,
                  fontWeight: 600,
                }}
              >
                {count}
              </span>
            </motion.button>
          );
        })}
      </div>

      {/* Filters */}
      <ResponsiveStack
        direction={{ mobile: 'column', tablet: 'row', desktop: 'row' }}
        gap={16}
        style={{ marginBottom: 24 }}
      >
        <div style={{ flex: 1, minWidth: isMobile ? '100%' : 200, maxWidth: isMobile ? '100%' : 400 }}>
          <Input
            placeholder="Tìm theo mã bid..."
            value={search}
            onChange={(v) => {
              setSearch(v);
              setPage(1);
            }}
            fullWidth
          />
        </div>
        <select
          value={projectFilter}
          onChange={(e) => {
            setProjectFilter(e.target.value);
            setPage(1);
          }}
          style={{
            padding: '10px 16px',
            borderRadius: tokens.radius.md,
            border: `1px solid ${tokens.color.border}`,
            background: tokens.color.surface,
            color: tokens.color.text,
            fontSize: 14,
            minWidth: isMobile ? '100%' : 200,
            minHeight: '44px',
          }}
        >
          <option value="">Tất cả công trình</option>
          {projects.map((project) => (
            <option key={project.id} value={project.id}>
              {project.code} - {project.title}
            </option>
          ))}
        </select>
      </ResponsiveStack>

      {/* Bids Table */}
      <div
        style={{
          background: tokens.color.surface,
          borderRadius: tokens.radius.lg,
          border: `1px solid ${tokens.color.border}`,
          overflow: 'hidden',
        }}
      >
        <BidTable
          bids={bids}
          loading={loading}
          onViewDetail={handleViewDetail}
          onApprove={(bid) => handleOpenApprovalModal(bid, 'approve')}
          onReject={(bid) => handleOpenApprovalModal(bid, 'reject')}
        />
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <ResponsiveStack
          direction={{ mobile: 'row', tablet: 'row', desktop: 'row' }}
          justify="center"
          align="center"
          gap={8}
          style={{ marginTop: 24 }}
        >
          <Button variant="secondary" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
            <i className="ri-arrow-left-line" />
          </Button>
          <span style={{ padding: '8px 16px', color: tokens.color.text, fontSize: isMobile ? 12 : 14 }}>
            {isMobile ? `${page}/${totalPages}` : `Trang ${page} / ${totalPages} (${total} bid)`}
          </span>
          <Button
            variant="secondary"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            <i className="ri-arrow-right-line" />
          </Button>
        </ResponsiveStack>
      )}

      {/* Detail Modal */}
      <BidDetailModal
        show={showDetailModal}
        bid={selectedBid}
        detail={bidDetail}
        loading={loadingDetail}
        onClose={closeModals}
        onApprove={() => selectedBid && handleOpenApprovalModal(selectedBid, 'approve')}
        onReject={() => selectedBid && handleOpenApprovalModal(selectedBid, 'reject')}
      />

      {/* Approval Modal */}
      <ApprovalModal
        show={showApprovalModal}
        bid={selectedBid}
        action={approvalAction}
        note={approvalNote}
        saving={saving}
        onNoteChange={setApprovalNote}
        onConfirm={handleApproval}
        onClose={() => setShowApprovalModal(false)}
      />
    </div>
  );
}
