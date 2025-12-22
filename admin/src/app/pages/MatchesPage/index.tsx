/**
 * Matches Management Page
 *
 * Admin page for managing matched projects (homeowner-contractor pairs).
 *
 * **Feature: bidding-phase3-matching**
 * **Requirements: 12.1, 12.2, 12.5**
 */

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { tokens } from '@app/shared';
import { matchesApi, escrowsApi } from '../../api';
import { useToast } from '../../components/Toast';
import { Button } from '../../components/Button';
import { MatchTable } from './MatchTable';
import { MatchDetailModal } from './MatchDetailModal';
import { EscrowActionModal } from './EscrowActionModal';
import { 
  TABS, 
  ESCROW_STATUS_COLORS,
  PROJECT_STATUS_COLORS, 
  type EscrowStatus, 
  type MatchListItem, 
  type MatchDetails,
  type EscrowAction,
  type MatchAction,
} from './types';

interface MatchesPageProps {
  embedded?: boolean;
}

export function MatchesPage({ embedded = false }: MatchesPageProps) {
  const toast = useToast();
  const [matches, setMatches] = useState<MatchListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<EscrowStatus | 'ALL' | 'PENDING_MATCH'>('ALL');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [tabCounts, setTabCounts] = useState<Record<string, number>>({});

  // Modal states
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showEscrowModal, setShowEscrowModal] = useState(false);
  const [showMatchActionModal, setShowMatchActionModal] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<MatchListItem | null>(null);
  const [matchDetail, setMatchDetail] = useState<MatchDetails | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Escrow action states
  const [escrowAction, setEscrowAction] = useState<EscrowAction>('confirm');
  const [escrowAmount, setEscrowAmount] = useState<number>(0);
  const [escrowReason, setEscrowReason] = useState('');
  const [saving, setSaving] = useState(false);

  // Match action states
  const [matchAction, setMatchAction] = useState<MatchAction>('approve');
  const [matchNote, setMatchNote] = useState('');

  // Load matches
  const loadMatches = useCallback(async () => {
    setLoading(true);
    try {
      // For PENDING_MATCH, we don't pass escrow status filter
      const params: { status?: EscrowStatus; page: number; limit: number } = {
        page,
        limit: 20,
      };
      
      if (statusFilter !== 'ALL' && statusFilter !== 'PENDING_MATCH') {
        params.status = statusFilter;
      }
      
      const result = await matchesApi.list(params);
      
      // Filter by project status if PENDING_MATCH
      let filteredData = result.data;
      if (statusFilter === 'PENDING_MATCH') {
        filteredData = result.data.filter(m => m.project.status === 'PENDING_MATCH');
      }
      
      setMatches(filteredData);
      setTotalPages(result.totalPages);
      setTotal(statusFilter === 'PENDING_MATCH' ? filteredData.length : result.total);
    } catch (error) {
      console.error('Failed to load matches:', error);
      toast.error('Không thể tải danh sách match');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, page, toast]);

  // Load tab counts
  const loadTabCounts = useCallback(async () => {
    try {
      // Get all matches to count PENDING_MATCH
      const allResult = await matchesApi.list({ limit: 1000 });
      const pendingMatchCount = allResult.data.filter(m => m.project.status === 'PENDING_MATCH').length;
      
      const statuses: (EscrowStatus | undefined)[] = [
        undefined, // ALL
        'PENDING',
        'HELD',
        'PARTIAL_RELEASED',
        'DISPUTED',
        'RELEASED',
      ];
      const results = await Promise.all(
        statuses.map((status) => matchesApi.list({ status, limit: 1 }))
      );
      const counts: Record<string, number> = {
        ALL: results[0].total,
        PENDING_MATCH: pendingMatchCount,
        PENDING: results[1].total,
        HELD: results[2].total,
        PARTIAL_RELEASED: results[3].total,
        DISPUTED: results[4].total,
        RELEASED: results[5].total,
      };
      setTabCounts(counts);
    } catch (error) {
      console.error('Failed to load tab counts:', error);
    }
  }, []);

  useEffect(() => {
    loadMatches();
  }, [loadMatches]);

  useEffect(() => {
    loadTabCounts();
  }, [loadTabCounts]);

  // Handlers
  const handleViewDetail = useCallback(async (match: MatchListItem) => {
    setSelectedMatch(match);
    setShowDetailModal(true);
    setLoadingDetail(true);
    try {
      const detail = await matchesApi.get(match.project.id);
      setMatchDetail(detail);
    } catch (error) {
      console.error('Failed to load match detail:', error);
      toast.error('Không thể tải thông tin chi tiết');
    } finally {
      setLoadingDetail(false);
    }
  }, [toast]);

  const handleOpenEscrowModal = useCallback((match: MatchListItem, action: EscrowAction) => {
    setSelectedMatch(match);
    setEscrowAction(action);
    setEscrowAmount(0);
    setEscrowReason('');
    setShowEscrowModal(true);
  }, []);

  const handleEscrowAction = useCallback(async () => {
    if (!selectedMatch) return;
    setSaving(true);
    try {
      const escrowId = selectedMatch.escrow.id;
      
      switch (escrowAction) {
        case 'confirm':
          await escrowsApi.confirm(escrowId);
          toast.success('Đã xác nhận đặt cọc thành công!');
          break;
        case 'release':
          await escrowsApi.release(escrowId);
          toast.success('Đã giải phóng escrow thành công!');
          break;
        case 'partial':
          if (escrowAmount <= 0) {
            toast.error('Vui lòng nhập số tiền hợp lệ');
            setSaving(false);
            return;
          }
          await escrowsApi.partialRelease(escrowId, escrowAmount);
          toast.success('Đã giải phóng một phần escrow!');
          break;
        case 'refund':
          if (!escrowReason.trim()) {
            toast.error('Vui lòng nhập lý do hoàn tiền');
            setSaving(false);
            return;
          }
          await escrowsApi.refund(escrowId, escrowReason);
          toast.success('Đã hoàn tiền escrow!');
          break;
        case 'dispute':
          if (!escrowReason.trim()) {
            toast.error('Vui lòng nhập lý do tranh chấp');
            setSaving(false);
            return;
          }
          await escrowsApi.dispute(escrowId, escrowReason);
          toast.success('Đã đánh dấu tranh chấp!');
          break;
      }
      
      setShowEscrowModal(false);
      setShowDetailModal(false);
      setSelectedMatch(null);
      loadMatches();
      loadTabCounts();
    } catch (error) {
      console.error('Failed to process escrow action:', error);
      toast.error(error instanceof Error ? error.message : 'Thao tác thất bại');
    } finally {
      setSaving(false);
    }
  }, [selectedMatch, escrowAction, escrowAmount, escrowReason, toast, loadMatches, loadTabCounts]);

  const closeModals = useCallback(() => {
    setShowDetailModal(false);
    setShowEscrowModal(false);
    setShowMatchActionModal(false);
    setSelectedMatch(null);
    setMatchDetail(null);
    setEscrowReason('');
    setEscrowAmount(0);
    setMatchNote('');
  }, []);

  // Handle match action (approve/reject)
  const handleOpenMatchActionModal = useCallback((match: MatchListItem, action: MatchAction) => {
    setSelectedMatch(match);
    setMatchAction(action);
    setMatchNote('');
    setShowMatchActionModal(true);
  }, []);

  const handleMatchAction = useCallback(async () => {
    if (!selectedMatch) return;
    setSaving(true);
    try {
      if (matchAction === 'approve') {
        await matchesApi.approve(selectedMatch.project.id, matchNote || undefined);
        toast.success('Đã duyệt kết nối thành công! Escrow và phí giao dịch đã được tạo.');
      } else {
        if (!matchNote.trim()) {
          toast.error('Vui lòng nhập lý do từ chối');
          setSaving(false);
          return;
        }
        await matchesApi.reject(selectedMatch.project.id, matchNote);
        toast.success('Đã từ chối kết nối. Dự án quay lại trạng thái BIDDING_CLOSED.');
      }
      
      setShowMatchActionModal(false);
      setShowDetailModal(false);
      setSelectedMatch(null);
      setMatchNote('');
      loadMatches();
      loadTabCounts();
    } catch (error) {
      console.error('Failed to process match action:', error);
      toast.error(error instanceof Error ? error.message : 'Thao tác thất bại');
    } finally {
      setSaving(false);
    }
  }, [selectedMatch, matchAction, matchNote, toast, loadMatches, loadTabCounts]);

  return (
    <div>
      {/* Header - hidden when embedded */}
      {!embedded && (
        <div style={{ marginBottom: 24 }}>
          <h2 style={{ color: tokens.color.text, fontSize: 24, fontWeight: 600, margin: 0 }}>
            Quản lý Match
          </h2>
          <p style={{ color: tokens.color.muted, fontSize: 14, margin: '4px 0 0' }}>
            Quản lý các cặp chủ nhà - nhà thầu đã ghép và escrow
          </p>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
        {TABS.map((tab) => {
          const isActive = statusFilter === tab.status;
          const count = tabCounts[tab.status] || 0;
          const color = tab.status === 'ALL' 
            ? tokens.color.primary 
            : tab.status === 'PENDING_MATCH'
              ? PROJECT_STATUS_COLORS.PENDING_MATCH
              : ESCROW_STATUS_COLORS[tab.status as EscrowStatus];
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

      {/* Matches Table */}
      <div
        style={{
          background: tokens.color.surface,
          borderRadius: tokens.radius.lg,
          border: `1px solid ${tokens.color.border}`,
          overflow: 'hidden',
        }}
      >
        <MatchTable
          matches={matches}
          loading={loading}
          onViewDetail={handleViewDetail}
          onEscrowAction={handleOpenEscrowModal}
          onMatchAction={handleOpenMatchActionModal}
        />
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, marginTop: 24 }}>
          <Button variant="secondary" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
            <i className="ri-arrow-left-line" />
          </Button>
          <span style={{ padding: '8px 16px', color: tokens.color.text }}>
            Trang {page} / {totalPages} ({total} match)
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
      <MatchDetailModal
        show={showDetailModal}
        match={selectedMatch}
        detail={matchDetail}
        loading={loadingDetail}
        onClose={closeModals}
        onEscrowAction={(action) => selectedMatch && handleOpenEscrowModal(selectedMatch, action)}
      />

      {/* Escrow Action Modal */}
      <EscrowActionModal
        show={showEscrowModal}
        match={selectedMatch}
        action={escrowAction}
        amount={escrowAmount}
        reason={escrowReason}
        saving={saving}
        onAmountChange={setEscrowAmount}
        onReasonChange={setEscrowReason}
        onConfirm={handleEscrowAction}
        onClose={() => setShowEscrowModal(false)}
      />

      {/* Match Action Modal (Approve/Reject) */}
      {showMatchActionModal && selectedMatch && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={() => setShowMatchActionModal(false)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={(e) => e.stopPropagation()}
            style={{
              background: tokens.color.surface,
              borderRadius: tokens.radius.lg,
              padding: 24,
              width: '100%',
              maxWidth: 480,
              margin: 16,
            }}
          >
            <h3 style={{ color: tokens.color.text, margin: '0 0 16px' }}>
              {matchAction === 'approve' ? 'Duyệt kết nối' : 'Từ chối kết nối'}
            </h3>
            
            <div style={{ marginBottom: 16 }}>
              <p style={{ color: tokens.color.muted, fontSize: 14, margin: 0 }}>
                Dự án: <strong style={{ color: tokens.color.text }}>{selectedMatch.project.code}</strong>
              </p>
              <p style={{ color: tokens.color.muted, fontSize: 14, margin: '4px 0 0' }}>
                {selectedMatch.project.title}
              </p>
            </div>

            {matchAction === 'approve' ? (
              <div style={{ 
                padding: 16, 
                background: 'rgba(34, 197, 94, 0.1)', 
                borderRadius: tokens.radius.md,
                marginBottom: 16,
              }}>
                <p style={{ color: '#22C55E', fontSize: 14, margin: 0 }}>
                  <i className="ri-information-line" style={{ marginRight: 8 }} />
                  Khi duyệt kết nối, hệ thống sẽ:
                </p>
                <ul style={{ color: tokens.color.text, fontSize: 13, margin: '8px 0 0', paddingLeft: 24 }}>
                  <li>Tạo Escrow (tiền đặt cọc)</li>
                  <li>Tạo phí giao dịch cho nhà thầu</li>
                  <li>Gửi thông báo cho cả hai bên</li>
                  <li>Hiển thị thông tin liên hệ</li>
                </ul>
              </div>
            ) : (
              <div style={{ 
                padding: 16, 
                background: 'rgba(239, 68, 68, 0.1)', 
                borderRadius: tokens.radius.md,
                marginBottom: 16,
              }}>
                <p style={{ color: '#EF4444', fontSize: 14, margin: 0 }}>
                  <i className="ri-error-warning-line" style={{ marginRight: 8 }} />
                  Khi từ chối kết nối:
                </p>
                <ul style={{ color: tokens.color.text, fontSize: 13, margin: '8px 0 0', paddingLeft: 24 }}>
                  <li>Dự án quay lại trạng thái BIDDING_CLOSED</li>
                  <li>Chủ nhà có thể chọn nhà thầu khác</li>
                  <li>Gửi thông báo cho cả hai bên</li>
                </ul>
              </div>
            )}

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', color: tokens.color.text, fontSize: 14, marginBottom: 8 }}>
                {matchAction === 'approve' ? 'Ghi chú (tùy chọn)' : 'Lý do từ chối (bắt buộc)'}
              </label>
              <textarea
                value={matchNote}
                onChange={(e) => setMatchNote(e.target.value)}
                placeholder={matchAction === 'approve' ? 'Nhập ghi chú...' : 'Nhập lý do từ chối...'}
                style={{
                  width: '100%',
                  padding: 12,
                  borderRadius: tokens.radius.md,
                  border: `1px solid ${tokens.color.border}`,
                  background: tokens.color.background,
                  color: tokens.color.text,
                  fontSize: 14,
                  minHeight: 80,
                  resize: 'vertical',
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <Button variant="secondary" onClick={() => setShowMatchActionModal(false)} disabled={saving}>
                Hủy
              </Button>
              <Button
                variant={matchAction === 'approve' ? 'primary' : 'danger'}
                onClick={handleMatchAction}
                disabled={saving || (matchAction === 'reject' && !matchNote.trim())}
              >
                {saving ? (
                  <motion.i
                    className="ri-loader-4-line"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  />
                ) : matchAction === 'approve' ? (
                  <>
                    <i className="ri-check-line" style={{ marginRight: 8 }} />
                    Duyệt kết nối
                  </>
                ) : (
                  <>
                    <i className="ri-close-line" style={{ marginRight: 8 }} />
                    Từ chối
                  </>
                )}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
