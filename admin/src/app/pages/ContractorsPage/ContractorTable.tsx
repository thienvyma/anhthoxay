/**
 * Contractor Table Component
 *
 * Displays list of contractors in a table format.
 */

import { memo } from 'react';
import { motion } from 'framer-motion';
import { tokens } from '../../../theme';
import type { Contractor } from './types';
import { STATUS_COLORS, type VerificationStatus } from './types';

interface ContractorTableProps {
  contractors: Contractor[];
  loading: boolean;
  onViewProfile: (contractor: Contractor) => void;
  onVerify: (contractor: Contractor, action: 'VERIFIED' | 'REJECTED') => void;
}

export const ContractorTable = memo(function ContractorTable({
  contractors,
  loading,
  onViewProfile,
  onVerify,
}: ContractorTableProps) {
  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: tokens.color.muted }}>
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

  if (contractors.length === 0) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: tokens.color.muted }}>
        <i className="ri-user-search-line" style={{ fontSize: 48, display: 'block', marginBottom: 12 }} />
        <p>Không tìm thấy nhà thầu nào</p>
      </div>
    );
  }

  return (
    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
      <thead>
        <tr style={{ borderBottom: `1px solid ${tokens.color.border}` }}>
          <th style={thStyle}>Nhà thầu</th>
          <th style={thStyle}>Công ty</th>
          <th style={{ ...thStyle, textAlign: 'center' }}>Kinh nghiệm</th>
          <th style={{ ...thStyle, textAlign: 'center' }}>Đánh giá</th>
          <th style={thStyle}>Ngày đăng ký</th>
          <th style={{ ...thStyle, textAlign: 'right' }}>Thao tác</th>
        </tr>
      </thead>
      <tbody>
        {contractors.map((contractor) => (
          <ContractorRow
            key={contractor.id}
            contractor={contractor}
            onViewProfile={onViewProfile}
            onVerify={onVerify}
          />
        ))}
      </tbody>
    </table>
  );
});

// Table row component
const ContractorRow = memo(function ContractorRow({
  contractor,
  onViewProfile,
  onVerify,
}: {
  contractor: Contractor;
  onViewProfile: (contractor: Contractor) => void;
  onVerify: (contractor: Contractor, action: 'VERIFIED' | 'REJECTED') => void;
}) {
  const statusColor = STATUS_COLORS[contractor.verificationStatus as VerificationStatus];

  return (
    <tr style={{ borderBottom: `1px solid ${tokens.color.border}` }}>
      <td style={{ padding: '12px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              background: statusColor,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: tokens.color.text,
              fontWeight: 600,
              fontSize: 16,
            }}
          >
            {contractor.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <div style={{ color: tokens.color.text, fontWeight: 500 }}>{contractor.name}</div>
            <div style={{ color: tokens.color.muted, fontSize: 13 }}>{contractor.email}</div>
            {contractor.phone && (
              <div style={{ color: tokens.color.muted, fontSize: 12 }}>
                <i className="ri-phone-line" style={{ marginRight: 4 }} />
                {contractor.phone}
              </div>
            )}
          </div>
        </div>
      </td>
      <td style={{ padding: '12px 16px', color: tokens.color.text }}>
        {contractor.companyName || '-'}
      </td>
      <td style={{ padding: '12px 16px', textAlign: 'center', color: tokens.color.muted }}>
        {contractor.contractorProfile?.experience
          ? `${contractor.contractorProfile.experience} năm`
          : '-'}
      </td>
      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
          <i className="ri-star-fill" style={{ color: '#F59E0B' }} />
          <span style={{ color: tokens.color.text }}>{contractor.rating.toFixed(1)}</span>
        </div>
      </td>
      <td style={{ padding: '12px 16px', color: tokens.color.muted, fontSize: 13 }}>
        {new Date(contractor.createdAt).toLocaleDateString('vi-VN')}
      </td>
      <td style={{ padding: '12px 16px' }}>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <ActionButton
            icon="ri-eye-line"
            title="Xem hồ sơ"
            onClick={() => onViewProfile(contractor)}
            color={tokens.color.primary}
          />
          {contractor.verificationStatus === 'PENDING' && (
            <>
              <ActionButton
                icon="ri-check-line"
                title="Duyệt"
                onClick={() => onVerify(contractor, 'VERIFIED')}
                color={tokens.color.success}
                bgColor={tokens.color.successBg}
                borderColor={`${tokens.color.success}50`}
              />
              <ActionButton
                icon="ri-close-line"
                title="Từ chối"
                onClick={() => onVerify(contractor, 'REJECTED')}
                color={tokens.color.error}
                bgColor={tokens.color.errorBg}
                borderColor={`${tokens.color.error}50`}
              />
            </>
          )}
        </div>
      </td>
    </tr>
  );
});

// Action button component
function ActionButton({
  icon,
  title,
  onClick,
  color,
  bgColor = tokens.color.surfaceHover,
  borderColor = tokens.color.border,
}: {
  icon: string;
  title: string;
  onClick: () => void;
  color: string;
  bgColor?: string;
  borderColor?: string;
}) {
  return (
    <motion.button
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      onClick={onClick}
      title={title}
      style={{
        padding: 8,
        background: bgColor,
        border: `1px solid ${borderColor}`,
        borderRadius: tokens.radius.sm,
        color,
        cursor: 'pointer',
      }}
    >
      <i className={icon} />
    </motion.button>
  );
}

const thStyle: React.CSSProperties = {
  padding: '12px 16px',
  textAlign: 'left',
  color: tokens.color.muted,
  fontSize: 13,
  fontWeight: 500,
};
