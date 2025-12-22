/**
 * Profile Preview Component
 *
 * Displays verification status banner and verification requirements info
 *
 * **Feature: code-refactoring**
 * **Requirements: 4.1, 4.2 - Extract preview section**
 */

import { motion } from 'framer-motion';

export interface ProfilePreviewProps {
  verificationStatus: string | undefined;
}

export function ProfilePreview({
  verificationStatus,
}: ProfilePreviewProps) {
  const isVerified = verificationStatus === 'VERIFIED';
  const isPending = verificationStatus === 'PENDING';
  const isRejected = verificationStatus === 'REJECTED';

  return (
    <>
      {/* Verification Status Banner */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        style={{
          background: isVerified
            ? 'rgba(34, 197, 94, 0.15)'
            : isPending
            ? 'rgba(245, 158, 11, 0.15)'
            : isRejected
            ? 'rgba(239, 68, 68, 0.15)'
            : 'rgba(59, 130, 246, 0.15)',
          border: `1px solid ${
            isVerified
              ? 'rgba(34, 197, 94, 0.4)'
              : isPending
              ? 'rgba(245, 158, 11, 0.4)'
              : isRejected
              ? 'rgba(239, 68, 68, 0.4)'
              : 'rgba(59, 130, 246, 0.4)'
          }`,
          borderRadius: 12,
          padding: 16,
          marginBottom: 24,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <i
          className={
            isVerified
              ? 'ri-verified-badge-line'
              : isPending
              ? 'ri-time-line'
              : isRejected
              ? 'ri-error-warning-line'
              : 'ri-shield-check-line'
          }
          style={{
            fontSize: 24,
            color: isVerified
              ? '#22c55e'
              : isPending
              ? '#f59e0b'
              : isRejected
              ? '#ef4444'
              : '#3b82f6',
          }}
        />
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600, color: '#e4e7ec', marginBottom: 2 }}>
            {isVerified
              ? 'Tài khoản đã xác minh'
              : isPending
              ? 'Đang chờ xác minh'
              : isRejected
              ? 'Hồ sơ bị từ chối'
              : 'Chưa xác minh'}
          </div>
          <div style={{ fontSize: 13, color: '#a1a1aa' }}>
            {isVerified
              ? 'Bạn có thể tham gia đấu giá các dự án'
              : isPending
              ? 'Hồ sơ của bạn đang được xem xét. Chúng tôi sẽ thông báo khi hoàn tất.'
              : isRejected
              ? 'Vui lòng cập nhật hồ sơ và gửi lại để được xem xét.'
              : 'Hoàn thiện hồ sơ và gửi xác minh để tham gia đấu giá.'}
          </div>
        </div>
      </motion.div>
    </>
  );
}

export interface VerificationRequirementsProps {
  description: string;
  idCardFront: string;
  idCardBack: string;
}

export function VerificationRequirements({
  description,
  idCardFront,
  idCardBack,
}: VerificationRequirementsProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.55 }}
      style={{
        marginTop: 24,
        padding: 16,
        background: 'rgba(59, 130, 246, 0.1)',
        border: '1px solid rgba(59, 130, 246, 0.3)',
        borderRadius: 8,
      }}
    >
      <h3 style={{ fontSize: 14, fontWeight: 600, color: '#3b82f6', marginBottom: 12 }}>
        <i className="ri-information-line" style={{ marginRight: 8 }} />
        Yêu cầu xác minh
      </h3>
      <ul
        style={{ margin: 0, paddingLeft: 20, color: '#a1a1aa', fontSize: 13, lineHeight: 1.8 }}
      >
        <li style={{ color: description.trim() ? '#22c55e' : '#a1a1aa' }}>
          {description.trim() ? '✓' : '○'} Mô tả về bản thân/công ty
        </li>
        <li style={{ color: idCardFront ? '#22c55e' : '#a1a1aa' }}>
          {idCardFront ? '✓' : '○'} Ảnh CMND/CCCD mặt trước
        </li>
        <li style={{ color: idCardBack ? '#22c55e' : '#a1a1aa' }}>
          {idCardBack ? '✓' : '○'} Ảnh CMND/CCCD mặt sau
        </li>
        <li style={{ color: '#a1a1aa' }}>○ Giấy phép kinh doanh (không bắt buộc)</li>
      </ul>
    </motion.div>
  );
}
