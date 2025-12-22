/**
 * Bid Detail Modal Component
 *
 * Displays full bid information in a modal.
 *
 * **Feature: bidding-phase2-core**
 * **Requirements: 11.4**
 */

import { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { tokens } from '@app/shared';
import { Button } from '../../components/Button';
import type { BidListItem, Bid } from './types';
import { STATUS_COLORS, STATUS_LABELS } from './types';

interface BidDetailModalProps {
  show: boolean;
  bid: BidListItem | null;
  detail: Bid | null;
  loading: boolean;
  onClose: () => void;
  onApprove: () => void;
  onReject: () => void;
}

export const BidDetailModal = memo(function BidDetailModal({
  show,
  bid,
  detail,
  loading,
  onClose,
  onApprove,
  onReject,
}: BidDetailModalProps) {
  return (
    <AnimatePresence>
      {show && bid && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 9998 }}
          />
          <div
            style={{
              position: 'fixed',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 9999,
              padding: 20,
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              style={{
                width: 'min(900px, 100%)',
                maxHeight: '90vh',
                background: tokens.color.surface,
                borderRadius: tokens.radius.lg,
                border: `1px solid ${tokens.color.border}`,
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              {/* Header */}
              <ModalHeader bid={bid} onClose={onClose} />

              {/* Content */}
              <div style={{ flex: 1, overflow: 'auto', padding: 24 }}>
                {loading ? (
                  <LoadingState />
                ) : detail ? (
                  <BidContent detail={detail} />
                ) : (
                  <EmptyState />
                )}
              </div>

              {/* Footer */}
              {detail && detail.status === 'PENDING' && (
                <ModalFooter onClose={onClose} onApprove={onApprove} onReject={onReject} />
              )}
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
});

// Modal Header
function ModalHeader({ bid, onClose }: { bid: BidListItem; onClose: () => void }) {
  return (
    <div
      style={{
        padding: 24,
        borderBottom: `1px solid ${tokens.color.border}`,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}
    >
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <h3 style={{ color: tokens.color.text, fontSize: 18, fontWeight: 600, margin: 0 }}>
            Chi tiết Bid
          </h3>
          <span
            style={{
              fontFamily: 'monospace',
              fontSize: 13,
              color: tokens.color.primary,
              background: `${tokens.color.primary}15`,
              padding: '4px 8px',
              borderRadius: tokens.radius.sm,
            }}
          >
            {bid.code}
          </span>
        </div>
        <p style={{ color: tokens.color.muted, fontSize: 13, margin: '4px 0 0' }}>
          Công trình: {bid.project.title}
        </p>
      </div>
      <button
        onClick={onClose}
        style={{
          background: 'transparent',
          border: 'none',
          color: tokens.color.muted,
          cursor: 'pointer',
          fontSize: 20,
        }}
      >
        <i className="ri-close-line" />
      </button>
    </div>
  );
}

// Modal Footer
function ModalFooter({
  onClose,
  onApprove,
  onReject,
}: {
  onClose: () => void;
  onApprove: () => void;
  onReject: () => void;
}) {
  return (
    <div
      style={{
        padding: 24,
        borderTop: `1px solid ${tokens.color.border}`,
        display: 'flex',
        gap: 12,
        justifyContent: 'flex-end',
      }}
    >
      <Button variant="secondary" onClick={onClose}>
        Đóng
      </Button>
      <Button
        variant="secondary"
        onClick={onReject}
        style={{ background: 'rgba(239, 68, 68, 0.1)', borderColor: 'rgba(239, 68, 68, 0.3)', color: '#EF4444' }}
      >
        <i className="ri-close-line" style={{ marginRight: 8 }} />
        Từ chối
      </Button>
      <Button onClick={onApprove}>
        <i className="ri-check-line" style={{ marginRight: 8 }} />
        Duyệt
      </Button>
    </div>
  );
}

// Loading State
function LoadingState() {
  return (
    <div style={{ textAlign: 'center', padding: 40, color: tokens.color.muted }}>
      <motion.i
        className="ri-loader-4-line"
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        style={{ fontSize: 32 }}
      />
      <p>Đang tải...</p>
    </div>
  );
}

// Empty State
function EmptyState() {
  return (
    <div style={{ textAlign: 'center', padding: 40, color: tokens.color.muted }}>
      <i className="ri-file-unknow-line" style={{ fontSize: 48, display: 'block', marginBottom: 12 }} />
      <p>Không có thông tin bid</p>
    </div>
  );
}

// Bid Content
function BidContent({ detail }: { detail: Bid }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <StatusSection detail={detail} />
      <BidInfoSection detail={detail} />
      <ContractorSection detail={detail} />
      <ProjectSection detail={detail} />
      <ProposalSection detail={detail} />
      {detail.attachments && detail.attachments.length > 0 && (
        <AttachmentsSection attachments={detail.attachments} />
      )}
      {detail.reviewNote && <ReviewNoteSection note={detail.reviewNote} />}
    </div>
  );
}

// Section wrapper
function Section({ icon, title, children }: { icon: string; title: string; children: React.ReactNode }) {
  return (
    <div
      style={{
        padding: 16,
        background: 'rgba(255,255,255,0.02)',
        borderRadius: tokens.radius.md,
        border: `1px solid ${tokens.color.border}`,
      }}
    >
      <h4 style={{ color: tokens.color.text, fontSize: 14, fontWeight: 600, margin: '0 0 12px' }}>
        <i className={icon} style={{ marginRight: 8 }} />
        {title}
      </h4>
      {children}
    </div>
  );
}

// Status Section
function StatusSection({ detail }: { detail: Bid }) {
  const status = detail.status;
  const color = STATUS_COLORS[status];
  const label = STATUS_LABELS[status];

  return (
    <Section icon="ri-shield-check-line" title="Trạng thái">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <span
          style={{
            padding: '6px 12px',
            borderRadius: tokens.radius.sm,
            background: `${color}20`,
            color: color,
            fontSize: 13,
            fontWeight: 600,
          }}
        >
          {label}
        </span>
        {detail.reviewedAt && (
          <span style={{ color: tokens.color.muted, fontSize: 13 }}>
            Duyệt: {new Date(detail.reviewedAt).toLocaleDateString('vi-VN')}
          </span>
        )}
        <span style={{ color: tokens.color.muted, fontSize: 13 }}>
          Tạo: {new Date(detail.createdAt).toLocaleDateString('vi-VN')}
        </span>
      </div>
    </Section>
  );
}

// Bid Info Section
function BidInfoSection({ detail }: { detail: Bid }) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
  };

  return (
    <Section icon="ri-auction-line" title="Thông tin Bid">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
        <InfoItem label="Mã bid" value={detail.code} />
        <InfoItem label="Giá đề xuất" value={formatCurrency(detail.price)} highlight />
        <InfoItem label="Timeline" value={detail.timeline} />
      </div>
    </Section>
  );
}

// Contractor Section
function ContractorSection({ detail }: { detail: Bid }) {
  const verificationColors: Record<string, string> = {
    PENDING: '#F59E0B',
    VERIFIED: '#10B981',
    REJECTED: '#EF4444',
  };
  const verificationLabels: Record<string, string> = {
    PENDING: 'Chờ xác minh',
    VERIFIED: 'Đã xác minh',
    REJECTED: 'Bị từ chối',
  };

  return (
    <Section icon="ri-user-line" title="Thông tin Nhà thầu">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
        <InfoItem label="Họ tên" value={detail.contractor.name} />
        <InfoItem label="Email" value={detail.contractor.email} />
        <InfoItem label="Điện thoại" value={detail.contractor.phone || '-'} />
        <InfoItem label="Công ty" value={detail.contractor.companyName || '-'} />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 12, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <i className="ri-star-fill" style={{ color: '#F59E0B' }} />
          <span style={{ color: tokens.color.text, fontWeight: 600 }}>
            {detail.contractor.rating.toFixed(1)}
          </span>
          <span style={{ color: tokens.color.muted, fontSize: 13 }}>đánh giá</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <i className="ri-building-line" style={{ color: tokens.color.primary }} />
          <span style={{ color: tokens.color.text, fontWeight: 600 }}>
            {detail.contractor.totalProjects}
          </span>
          <span style={{ color: tokens.color.muted, fontSize: 13 }}>dự án</span>
        </div>
        <span
          style={{
            padding: '4px 10px',
            borderRadius: tokens.radius.sm,
            background: `${verificationColors[detail.contractor.verificationStatus]}20`,
            color: verificationColors[detail.contractor.verificationStatus],
            fontSize: 12,
            fontWeight: 600,
          }}
        >
          {verificationLabels[detail.contractor.verificationStatus]}
        </span>
      </div>
    </Section>
  );
}

// Project Section
function ProjectSection({ detail }: { detail: Bid }) {
  const projectStatusColors: Record<string, string> = {
    DRAFT: '#6B7280',
    PENDING_APPROVAL: '#F59E0B',
    REJECTED: '#EF4444',
    OPEN: '#10B981',
    BIDDING_CLOSED: '#8B5CF6',
    MATCHED: '#3B82F6',
    IN_PROGRESS: '#06B6D4',
    COMPLETED: '#22C55E',
    CANCELLED: '#9CA3AF',
  };
  const projectStatusLabels: Record<string, string> = {
    DRAFT: 'Nháp',
    PENDING_APPROVAL: 'Chờ duyệt',
    REJECTED: 'Bị từ chối',
    OPEN: 'Đang mở',
    BIDDING_CLOSED: 'Đóng đấu giá',
    MATCHED: 'Đã ghép',
    IN_PROGRESS: 'Đang thực hiện',
    COMPLETED: 'Hoàn thành',
    CANCELLED: 'Đã hủy',
  };

  return (
    <Section icon="ri-building-4-line" title="Thông tin Công trình">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
        <InfoItem label="Mã công trình" value={detail.project.code} />
        <InfoItem label="Tiêu đề" value={detail.project.title} />
        <div>
          <div style={{ color: tokens.color.muted, fontSize: 12, marginBottom: 2 }}>Trạng thái</div>
          <span
            style={{
              padding: '4px 10px',
              borderRadius: tokens.radius.sm,
              background: `${projectStatusColors[detail.project.status]}20`,
              color: projectStatusColors[detail.project.status],
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            {projectStatusLabels[detail.project.status]}
          </span>
        </div>
      </div>
    </Section>
  );
}

// Proposal Section
function ProposalSection({ detail }: { detail: Bid }) {
  return (
    <Section icon="ri-file-text-line" title="Đề xuất chi tiết">
      <p style={{ color: tokens.color.text, fontSize: 14, margin: 0, whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
        {detail.proposal}
      </p>
    </Section>
  );
}

// Attachments Section
function AttachmentsSection({ attachments }: { attachments: Bid['attachments'] }) {
  return (
    <Section icon="ri-attachment-line" title={`Tệp đính kèm (${attachments.length})`}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {attachments.map((attachment, idx) => (
          <a
            key={idx}
            href={attachment.url}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '10px 12px',
              background: 'rgba(255,255,255,0.02)',
              borderRadius: tokens.radius.sm,
              border: `1px solid ${tokens.color.border}`,
              textDecoration: 'none',
              color: tokens.color.text,
              transition: 'all 0.2s',
            }}
          >
            <i
              className={getFileIcon(attachment.type)}
              style={{ fontSize: 20, color: tokens.color.primary }}
            />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 500 }}>{attachment.name}</div>
              <div style={{ fontSize: 12, color: tokens.color.muted }}>
                {attachment.type}
                {attachment.size && ` • ${formatFileSize(attachment.size)}`}
              </div>
            </div>
            <i className="ri-external-link-line" style={{ color: tokens.color.muted }} />
          </a>
        ))}
      </div>
    </Section>
  );
}

// Review Note Section
function ReviewNoteSection({ note }: { note: string }) {
  return (
    <Section icon="ri-message-2-line" title="Ghi chú xét duyệt">
      <div
        style={{
          padding: 12,
          background: 'rgba(239, 68, 68, 0.1)',
          borderRadius: tokens.radius.sm,
          color: '#EF4444',
          fontSize: 13,
        }}
      >
        {note}
      </div>
    </Section>
  );
}

// Helper Components
function InfoItem({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div>
      <div style={{ color: tokens.color.muted, fontSize: 12, marginBottom: 2 }}>{label}</div>
      <div
        style={{
          color: highlight ? tokens.color.primary : tokens.color.text,
          fontSize: highlight ? 16 : 14,
          fontWeight: highlight ? 600 : 400,
        }}
      >
        {value}
      </div>
    </div>
  );
}

// Helper functions
function getFileIcon(mimeType: string): string {
  if (mimeType.startsWith('image/')) return 'ri-image-line';
  if (mimeType.includes('pdf')) return 'ri-file-pdf-line';
  if (mimeType.includes('word') || mimeType.includes('document')) return 'ri-file-word-line';
  if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return 'ri-file-excel-line';
  return 'ri-file-line';
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
