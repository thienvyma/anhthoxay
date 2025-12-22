/**
 * Project Detail Modal Component
 *
 * Displays full project information in a modal.
 *
 * **Feature: bidding-phase2-core**
 * **Requirements: 10.4**
 */

import { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { tokens } from '@app/shared';
import { Button } from '../../components/Button';
import type { ProjectListItem, Project } from './types';
import { STATUS_COLORS, STATUS_LABELS } from './types';

interface ProjectDetailModalProps {
  show: boolean;
  project: ProjectListItem | null;
  detail: Project | null;
  loading: boolean;
  onClose: () => void;
  onApprove: () => void;
  onReject: () => void;
}

export const ProjectDetailModal = memo(function ProjectDetailModal({
  show,
  project,
  detail,
  loading,
  onClose,
  onApprove,
  onReject,
}: ProjectDetailModalProps) {
  return (
    <AnimatePresence>
      {show && project && (
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
              <ModalHeader project={project} onClose={onClose} />

              {/* Content */}
              <div style={{ flex: 1, overflow: 'auto', padding: 24 }}>
                {loading ? (
                  <LoadingState />
                ) : detail ? (
                  <ProjectContent detail={detail} />
                ) : (
                  <EmptyState />
                )}
              </div>

              {/* Footer */}
              {detail && detail.status === 'PENDING_APPROVAL' && (
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
function ModalHeader({ project, onClose }: { project: ProjectListItem; onClose: () => void }) {
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
            Chi tiết Công trình
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
            {project.code}
          </span>
        </div>
        <p style={{ color: tokens.color.muted, fontSize: 13, margin: '4px 0 0' }}>
          {project.title}
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
      <p>Không có thông tin công trình</p>
    </div>
  );
}

// Project Content
function ProjectContent({ detail }: { detail: Project }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <StatusSection detail={detail} />
      <BasicInfoSection detail={detail} />
      <OwnerSection detail={detail} />
      <LocationSection detail={detail} />
      <DetailsSection detail={detail} />
      {detail.images && detail.images.length > 0 && <ImagesSection images={detail.images} />}
      {detail.requirements && <RequirementsSection requirements={detail.requirements} />}
      <BiddingSection detail={detail} />
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
function StatusSection({ detail }: { detail: Project }) {
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
        {detail.publishedAt && (
          <span style={{ color: tokens.color.muted, fontSize: 13 }}>
            Đăng: {new Date(detail.publishedAt).toLocaleDateString('vi-VN')}
          </span>
        )}
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

// Basic Info Section
function BasicInfoSection({ detail }: { detail: Project }) {
  return (
    <Section icon="ri-building-line" title="Thông tin cơ bản">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
        <InfoItem label="Mã công trình" value={detail.code} />
        <InfoItem label="Tiêu đề" value={detail.title} />
        <InfoItem label="Danh mục" value={detail.category.name} />
        <InfoItem label="Khu vực" value={detail.region.name} />
      </div>
      {detail.description && (
        <div style={{ marginTop: 12 }}>
          <div style={{ color: tokens.color.muted, fontSize: 12, marginBottom: 4 }}>Mô tả</div>
          <p style={{ color: tokens.color.text, fontSize: 14, margin: 0, whiteSpace: 'pre-wrap' }}>
            {detail.description}
          </p>
        </div>
      )}
    </Section>
  );
}

// Owner Section
function OwnerSection({ detail }: { detail: Project }) {
  return (
    <Section icon="ri-user-line" title="Thông tin chủ nhà">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
        <InfoItem label="Họ tên" value={detail.owner.name} />
        <InfoItem label="Email" value={detail.owner.email} />
        <InfoItem label="Điện thoại" value={detail.owner.phone || '-'} />
      </div>
    </Section>
  );
}

// Location Section
function LocationSection({ detail }: { detail: Project }) {
  return (
    <Section icon="ri-map-pin-line" title="Địa điểm">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
        <InfoItem label="Khu vực" value={detail.region.name} />
        <InfoItem label="Địa chỉ" value={detail.address} />
      </div>
    </Section>
  );
}

// Details Section
function DetailsSection({ detail }: { detail: Project }) {
  const formatCurrency = (value: number | null) => {
    if (value === null) return '-';
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
  };

  return (
    <Section icon="ri-file-list-line" title="Chi tiết công trình">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
        <InfoItem label="Diện tích" value={detail.area ? `${detail.area} m²` : '-'} />
        <InfoItem label="Ngân sách tối thiểu" value={formatCurrency(detail.budgetMin)} />
        <InfoItem label="Ngân sách tối đa" value={formatCurrency(detail.budgetMax)} />
        <InfoItem label="Timeline mong muốn" value={detail.timeline || '-'} />
      </div>
    </Section>
  );
}

// Images Section
function ImagesSection({ images }: { images: string[] }) {
  return (
    <Section icon="ri-gallery-line" title={`Hình ảnh (${images.length})`}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 12 }}>
        {images.map((url, idx) => (
          <a
            key={idx}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              aspectRatio: '1',
              borderRadius: tokens.radius.md,
              overflow: 'hidden',
              border: `1px solid ${tokens.color.border}`,
            }}
          >
            <img src={url} alt={`Ảnh ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </a>
        ))}
      </div>
    </Section>
  );
}

// Requirements Section
function RequirementsSection({ requirements }: { requirements: string }) {
  return (
    <Section icon="ri-list-check" title="Yêu cầu đặc biệt">
      <p style={{ color: tokens.color.muted, fontSize: 14, margin: 0, whiteSpace: 'pre-wrap' }}>
        {requirements}
      </p>
    </Section>
  );
}

// Bidding Section
function BiddingSection({ detail }: { detail: Project }) {
  return (
    <Section icon="ri-auction-line" title="Thông tin đấu giá">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
        <InfoItem
          label="Hạn đấu giá"
          value={detail.bidDeadline ? new Date(detail.bidDeadline).toLocaleDateString('vi-VN') : '-'}
        />
        <InfoItem label="Số bid tối đa" value={String(detail.maxBids)} />
        <InfoItem label="Số bid hiện tại" value={String(detail.bidCount)} />
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
function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{ color: tokens.color.muted, fontSize: 12, marginBottom: 2 }}>{label}</div>
      <div style={{ color: tokens.color.text, fontSize: 14 }}>{value}</div>
    </div>
  );
}
