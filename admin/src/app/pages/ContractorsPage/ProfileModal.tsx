/**
 * Profile Modal Component
 *
 * Displays contractor profile details in a modal.
 */

import { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { tokens } from '../../../theme';
import { Button } from '../../components/Button';
import type { Contractor, ContractorProfile } from './types';
import { STATUS_COLORS, STATUS_LABELS, type VerificationStatus } from './types';

interface ProfileModalProps {
  show: boolean;
  contractor: Contractor | null;
  detail: ContractorProfile | null;
  loading: boolean;
  onClose: () => void;
  onVerify: (action: 'VERIFIED' | 'REJECTED') => void;
}

export const ProfileModal = memo(function ProfileModal({
  show,
  contractor,
  detail,
  loading,
  onClose,
  onVerify,
}: ProfileModalProps) {
  return (
    <AnimatePresence>
      {show && contractor && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{ position: 'fixed', inset: 0, background: tokens.color.overlay, zIndex: 9998 }}
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
                width: 'min(800px, 100%)',
                maxHeight: '90vh',
                background: tokens.color.surface,
                borderRadius: tokens.radius.lg,
                border: `1px solid ${tokens.color.border}`,
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              {/* Header */}
              <ModalHeader contractor={contractor} onClose={onClose} />

              {/* Content */}
              <div style={{ flex: 1, overflow: 'auto', padding: 24 }}>
                {loading ? (
                  <LoadingState />
                ) : detail ? (
                  <ProfileContent detail={detail} />
                ) : (
                  <EmptyState />
                )}
              </div>

              {/* Footer */}
              {detail && detail.user.verificationStatus === 'PENDING' && (
                <ModalFooter onClose={onClose} onVerify={onVerify} />
              )}
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
});

// Modal Header
function ModalHeader({ contractor, onClose }: { contractor: Contractor; onClose: () => void }) {
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
        <h3 style={{ color: tokens.color.text, fontSize: 18, fontWeight: 600, margin: 0 }}>
          Hồ sơ Nhà thầu
        </h3>
        <p style={{ color: tokens.color.muted, fontSize: 13, margin: '4px 0 0' }}>
          {contractor.name} - {contractor.email}
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
  onVerify,
}: {
  onClose: () => void;
  onVerify: (action: 'VERIFIED' | 'REJECTED') => void;
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
        onClick={() => onVerify('REJECTED')}
        style={{ background: tokens.color.errorBg, borderColor: `${tokens.color.error}50`, color: tokens.color.error }}
      >
        <i className="ri-close-line" style={{ marginRight: 8 }} />
        Từ chối
      </Button>
      <Button onClick={() => onVerify('VERIFIED')}>
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
      <p>Không có thông tin hồ sơ</p>
    </div>
  );
}

// Profile Content
function ProfileContent({ detail }: { detail: ContractorProfile }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <BasicInfoSection detail={detail} />
      {detail.user.badges && detail.user.badges.length > 0 && (
        <BadgesSection badges={detail.user.badges} />
      )}
      <StatusSection detail={detail} />
      {detail.description && <DescriptionSection description={detail.description} />}
      {detail.specialties && detail.specialties.length > 0 && (
        <SpecialtiesSection specialties={detail.specialties} />
      )}
      <DocumentsSection detail={detail} />
      {detail.portfolioImages && detail.portfolioImages.length > 0 && (
        <PortfolioSection images={detail.portfolioImages} />
      )}
      {detail.certificates && detail.certificates.length > 0 && (
        <CertificatesSection certificates={detail.certificates} />
      )}
    </div>
  );
}

// Section wrapper
function Section({ icon, title, children }: { icon: string; title: string; children: React.ReactNode }) {
  return (
    <div
      style={{
        padding: 16,
        background: tokens.color.surfaceAlt,
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

// Basic Info Section
function BasicInfoSection({ detail }: { detail: ContractorProfile }) {
  return (
    <Section icon="ri-user-line" title="Thông tin cơ bản">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
        <InfoItem label="Họ tên" value={detail.user.name} />
        <InfoItem label="Email" value={detail.user.email} />
        <InfoItem label="Điện thoại" value={detail.user.phone || '-'} />
        <InfoItem label="Công ty" value={detail.user.companyName || '-'} />
        <InfoItem label="Mã số thuế" value={detail.user.taxCode || '-'} />
        <InfoItem label="GPKD" value={detail.user.businessLicense || '-'} />
        <InfoItem label="Kinh nghiệm" value={detail.experience ? `${detail.experience} năm` : '-'} />
        <InfoItem label="Đánh giá" value={`${detail.user.rating.toFixed(1)} ⭐`} />
        <InfoItem label="Dự án" value={`${detail.user.totalProjects} dự án`} />
      </div>
    </Section>
  );
}

// Status Section
function StatusSection({ detail }: { detail: ContractorProfile }) {
  const status = detail.user.verificationStatus as VerificationStatus;
  return (
    <Section icon="ri-shield-check-line" title="Trạng thái xác minh">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span
          style={{
            padding: '6px 12px',
            borderRadius: tokens.radius.sm,
            background: `${STATUS_COLORS[status]}20`,
            color: STATUS_COLORS[status],
            fontSize: 13,
            fontWeight: 600,
          }}
        >
          {STATUS_LABELS[status]}
        </span>
        {detail.user.verifiedAt && (
          <span style={{ color: tokens.color.muted, fontSize: 13 }}>
            Xác minh: {new Date(detail.user.verifiedAt).toLocaleDateString('vi-VN')}
          </span>
        )}
        {detail.submittedAt && (
          <span style={{ color: tokens.color.muted, fontSize: 13 }}>
            Gửi hồ sơ: {new Date(detail.submittedAt).toLocaleDateString('vi-VN')}
          </span>
        )}
      </div>
      {detail.user.verificationNote && (
        <div
          style={{
            marginTop: 12,
            padding: 12,
            background: tokens.color.errorBg,
            borderRadius: tokens.radius.sm,
            color: tokens.color.error,
            fontSize: 13,
          }}
        >
          <strong>Lý do từ chối:</strong> {detail.user.verificationNote}
        </div>
      )}
    </Section>
  );
}

// Description Section
function DescriptionSection({ description }: { description: string }) {
  return (
    <Section icon="ri-file-text-line" title="Giới thiệu">
      <p style={{ color: tokens.color.muted, fontSize: 14, margin: 0, whiteSpace: 'pre-wrap' }}>
        {description}
      </p>
    </Section>
  );
}

// Specialties Section
function SpecialtiesSection({ specialties }: { specialties: string[] }) {
  return (
    <Section icon="ri-tools-line" title="Chuyên môn">
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {specialties.map((specialty, idx) => (
          <span
            key={idx}
            style={{
              padding: '4px 12px',
              borderRadius: tokens.radius.sm,
              background: `${tokens.color.primary}20`,
              color: tokens.color.primary,
              fontSize: 13,
            }}
          >
            {specialty}
          </span>
        ))}
      </div>
    </Section>
  );
}

// Documents Section
function DocumentsSection({ detail }: { detail: ContractorProfile }) {
  return (
    <Section icon="ri-file-copy-line" title="Giấy tờ xác minh">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
        <DocumentPreview label="CMND/CCCD mặt trước" url={detail.idCardFront} />
        <DocumentPreview label="CMND/CCCD mặt sau" url={detail.idCardBack} />
        <DocumentPreview label="Giấy phép kinh doanh" url={detail.businessLicenseImage} />
      </div>
    </Section>
  );
}

// Portfolio Section
function PortfolioSection({ images }: { images: string[] }) {
  return (
    <Section icon="ri-gallery-line" title={`Portfolio (${images.length} ảnh)`}>
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
            <img src={url} alt={`Portfolio ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </a>
        ))}
      </div>
    </Section>
  );
}

// Certificates Section
function CertificatesSection({ certificates }: { certificates: Array<{ name: string; imageUrl?: string; issuedDate?: string }> }) {
  return (
    <Section icon="ri-award-line" title={`Chứng chỉ (${certificates.length})`}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {certificates.map((cert, idx) => (
          <div
            key={idx}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: 12,
              background: tokens.color.surfaceAlt,
              borderRadius: tokens.radius.sm,
              border: `1px solid ${tokens.color.border}`,
            }}
          >
            <i className="ri-medal-line" style={{ fontSize: 24, color: tokens.color.primary }} />
            <div style={{ flex: 1 }}>
              <div style={{ color: tokens.color.text, fontWeight: 500 }}>{cert.name}</div>
              {cert.issuedDate && (
                <div style={{ color: tokens.color.muted, fontSize: 12 }}>Cấp ngày: {cert.issuedDate}</div>
              )}
            </div>
            {cert.imageUrl && (
              <a href={cert.imageUrl} target="_blank" rel="noopener noreferrer" style={{ color: tokens.color.primary, fontSize: 13 }}>
                Xem ảnh
              </a>
            )}
          </div>
        ))}
      </div>
    </Section>
  );
}

// Badges Section - Requirement 21.4: Display earned badges prominently
const BADGE_INFO: Record<string, { name: string; description: string; icon: string; color: string }> = {
  ACTIVE_CONTRACTOR: {
    name: 'Nhà thầu Tích cực',
    description: 'Đã hoàn thành 10 dự án trở lên',
    icon: '🏆',
    color: tokens.color.warning,
  },
  HIGH_QUALITY: {
    name: 'Chất lượng Cao',
    description: 'Duy trì đánh giá 4.5+ trong 6 tháng',
    icon: '⭐',
    color: tokens.color.success,
  },
  FAST_RESPONDER: {
    name: 'Phản hồi Nhanh',
    description: 'Phản hồi 90%+ yêu cầu trong 24 giờ',
    icon: '⚡',
    color: tokens.color.info,
  },
};

function BadgesSection({ badges }: { badges: Array<{ id: string; badgeType: string; awardedAt: string }> }) {
  return (
    <Section icon="ri-trophy-line" title={`Huy hiệu (${badges.length})`}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
        {badges.map((badge) => {
          const info = BADGE_INFO[badge.badgeType] || {
            name: badge.badgeType,
            description: '',
            icon: '🏅',
            color: tokens.color.primary,
          };
          return (
            <div
              key={badge.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '10px 16px',
                background: `${info.color}15`,
                borderRadius: tokens.radius.md,
                border: `1px solid ${info.color}40`,
              }}
              title={info.description}
            >
              <span style={{ fontSize: 24 }}>{info.icon}</span>
              <div>
                <div style={{ color: info.color, fontWeight: 600, fontSize: 14 }}>{info.name}</div>
                <div style={{ color: tokens.color.muted, fontSize: 11 }}>
                  {new Date(badge.awardedAt).toLocaleDateString('vi-VN')}
                </div>
              </div>
            </div>
          );
        })}
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

function DocumentPreview({ label, url }: { label: string; url: string | null }) {
  return (
    <div>
      <div style={{ color: tokens.color.muted, fontSize: 12, marginBottom: 8 }}>{label}</div>
      {url ? (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'block',
            aspectRatio: '16/10',
            borderRadius: tokens.radius.md,
            overflow: 'hidden',
            border: `1px solid ${tokens.color.border}`,
            background: tokens.color.surfaceAlt,
          }}
        >
          <img src={url} alt={label} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </a>
      ) : (
        <div
          style={{
            aspectRatio: '16/10',
            borderRadius: tokens.radius.md,
            border: `1px dashed ${tokens.color.border}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: tokens.color.muted,
            fontSize: 13,
          }}
        >
          Chưa có
        </div>
      )}
    </div>
  );
}
