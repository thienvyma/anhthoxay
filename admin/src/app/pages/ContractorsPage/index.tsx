/**
 * Contractors Management Page
 *
 * Admin page for managing contractor verification.
 *
 * **Feature: bidding-phase1-foundation**
 * **Requirements: REQ-2.1**
 */

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { tokens } from '../../../theme';
import { contractorsApi } from '../../api';
import { useToast } from '../../components/Toast';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { ContractorTable } from './ContractorTable';
import { ProfileModal } from './ProfileModal';
import { VerifyModal } from './VerifyModal';
import { TABS, STATUS_COLORS, type VerificationStatus, type Contractor, type ContractorProfile } from './types';

export function ContractorsPage() {
  const toast = useToast();
  const [contractors, setContractors] = useState<Contractor[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<VerificationStatus>('PENDING');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [tabCounts, setTabCounts] = useState<Record<VerificationStatus, number>>({
    PENDING: 0,
    VERIFIED: 0,
    REJECTED: 0,
  });

  // Modal states
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [selectedContractor, setSelectedContractor] = useState<Contractor | null>(null);
  const [contractorDetail, setContractorDetail] = useState<ContractorProfile | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Verify form states
  const [verifyAction, setVerifyAction] = useState<'VERIFIED' | 'REJECTED'>('VERIFIED');
  const [verifyNote, setVerifyNote] = useState('');
  const [saving, setSaving] = useState(false);

  // Load contractors
  const loadContractors = useCallback(async () => {
    setLoading(true);
    try {
      const result = await contractorsApi.list({
        status: statusFilter,
        search: search || undefined,
        page,
        limit: 20,
      });
      setContractors(result.data);
      setTotalPages(result.totalPages);
    } catch (error) {
      console.error('Failed to load contractors:', error);
      toast.error('Không thể tải danh sách nhà thầu');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, search, page, toast]);

  // Load tab counts
  const loadTabCounts = useCallback(async () => {
    try {
      const [pending, verified, rejected] = await Promise.all([
        contractorsApi.list({ status: 'PENDING', limit: 1 }),
        contractorsApi.list({ status: 'VERIFIED', limit: 1 }),
        contractorsApi.list({ status: 'REJECTED', limit: 1 }),
      ]);
      setTabCounts({
        PENDING: pending.total,
        VERIFIED: verified.total,
        REJECTED: rejected.total,
      });
    } catch (error) {
      console.error('Failed to load tab counts:', error);
    }
  }, []);

  useEffect(() => {
    loadContractors();
  }, [loadContractors]);

  useEffect(() => {
    loadTabCounts();
  }, [loadTabCounts]);

  // Handlers
  const handleViewProfile = useCallback(async (contractor: Contractor) => {
    setSelectedContractor(contractor);
    setShowProfileModal(true);
    setLoadingDetail(true);
    try {
      const detail = await contractorsApi.get(contractor.id);
      setContractorDetail(detail);
    } catch (error) {
      console.error('Failed to load contractor detail:', error);
      toast.error('Không thể tải thông tin chi tiết');
    } finally {
      setLoadingDetail(false);
    }
  }, [toast]);

  const handleOpenVerifyModal = useCallback((contractor: Contractor, action: 'VERIFIED' | 'REJECTED') => {
    setSelectedContractor(contractor);
    setVerifyAction(action);
    setVerifyNote('');
    setShowVerifyModal(true);
  }, []);

  const handleVerify = useCallback(async () => {
    if (!selectedContractor) return;
    setSaving(true);
    try {
      await contractorsApi.verify(selectedContractor.id, {
        status: verifyAction,
        note: verifyNote || undefined,
      });
      toast.success(
        verifyAction === 'VERIFIED' ? 'Đã xác minh nhà thầu thành công!' : 'Đã từ chối nhà thầu'
      );
      setShowVerifyModal(false);
      setShowProfileModal(false);
      setSelectedContractor(null);
      loadContractors();
      loadTabCounts();
    } catch (error) {
      console.error('Failed to verify contractor:', error);
      toast.error(error instanceof Error ? error.message : 'Thao tác thất bại');
    } finally {
      setSaving(false);
    }
  }, [selectedContractor, verifyAction, verifyNote, toast, loadContractors, loadTabCounts]);

  const closeModals = useCallback(() => {
    setShowProfileModal(false);
    setShowVerifyModal(false);
    setSelectedContractor(null);
    setContractorDetail(null);
    setVerifyNote('');
  }, []);

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ color: tokens.color.text, fontSize: 24, fontWeight: 600, margin: 0 }}>
          Quản lý Nhà thầu
        </h2>
        <p style={{ color: tokens.color.muted, fontSize: 14, margin: '4px 0 0' }}>
          Xét duyệt và quản lý hồ sơ nhà thầu
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
        {TABS.map((tab) => {
          const isActive = statusFilter === tab.status;
          const count = tabCounts[tab.status] || 0;
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
                border: `1px solid ${isActive ? STATUS_COLORS[tab.status] : tokens.color.border}`,
                background: isActive ? `${STATUS_COLORS[tab.status]}15` : 'transparent',
                color: isActive ? STATUS_COLORS[tab.status] : tokens.color.muted,
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
                  background: isActive ? STATUS_COLORS[tab.status] : tokens.color.border,
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

      {/* Search */}
      <div style={{ marginBottom: 24, maxWidth: 400 }}>
        <Input
          placeholder="Tìm theo tên, email hoặc công ty..."
          value={search}
          onChange={(v) => {
            setSearch(v);
            setPage(1);
          }}
          fullWidth
        />
      </div>

      {/* Contractors Table */}
      <div
        style={{
          background: tokens.color.surface,
          borderRadius: tokens.radius.lg,
          border: `1px solid ${tokens.color.border}`,
          overflow: 'hidden',
        }}
      >
        <ContractorTable
          contractors={contractors}
          loading={loading}
          onViewProfile={handleViewProfile}
          onVerify={handleOpenVerifyModal}
        />
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 24 }}>
          <Button variant="secondary" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
            <i className="ri-arrow-left-line" />
          </Button>
          <span style={{ padding: '8px 16px', color: tokens.color.text }}>
            Trang {page} / {totalPages}
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

      {/* Profile Modal */}
      <ProfileModal
        show={showProfileModal}
        contractor={selectedContractor}
        detail={contractorDetail}
        loading={loadingDetail}
        onClose={closeModals}
        onVerify={(action) => selectedContractor && handleOpenVerifyModal(selectedContractor, action)}
      />

      {/* Verify Modal */}
      <VerifyModal
        show={showVerifyModal}
        contractor={selectedContractor}
        action={verifyAction}
        note={verifyNote}
        saving={saving}
        onNoteChange={setVerifyNote}
        onConfirm={handleVerify}
        onClose={() => setShowVerifyModal(false)}
      />
    </div>
  );
}
