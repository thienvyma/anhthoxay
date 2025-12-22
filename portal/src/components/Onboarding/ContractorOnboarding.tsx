/**
 * Contractor Onboarding Component
 *
 * Provides a verification checklist with progress indicator for new contractors.
 * Highlights the steps needed to complete verification:
 * - Complete profile information
 * - Upload ID card (front and back)
 * - Add portfolio images
 * - Submit for verification
 *
 * **Feature: bidding-phase6-portal**
 * **Validates: Requirements 19.2**
 */

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useOnboarding } from '../../hooks/useOnboarding';
import { useAuth } from '../../auth/AuthContext';
import { contractorProfileApi, type ContractorProfile } from '../../api';

export interface VerificationChecklistItem {
  id: string;
  label: string;
  description: string;
  icon: string;
  isCompleted: boolean;
  action?: () => void;
}

interface ContractorOnboardingProps {
  onComplete?: () => void;
  onSkip?: () => void;
}

export function ContractorOnboarding({ onComplete, onSkip }: ContractorOnboardingProps) {
  const { shouldShowOnboarding, completeOnboarding } = useOnboarding();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [isVisible, setIsVisible] = useState(false);
  const [profile, setProfile] = useState<ContractorProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Verification status
  const isVerified = user?.verificationStatus === 'VERIFIED';
  const isPending = user?.verificationStatus === 'PENDING';

  // Load contractor profile to check completion status
  const loadProfile = useCallback(async () => {
    setIsLoading(true);
    try {
      const profileData = await contractorProfileApi.getProfile();
      setProfile(profileData);
    } catch {
      // Profile might not exist yet
      setProfile(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (shouldShowOnboarding && user?.role === 'CONTRACTOR') {
      loadProfile();
    }
  }, [shouldShowOnboarding, user?.role, loadProfile]);

  // Show onboarding after profile is loaded
  useEffect(() => {
    if (shouldShowOnboarding && !isLoading && user?.role === 'CONTRACTOR') {
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [shouldShowOnboarding, isLoading, user?.role]);

  // Build checklist items based on profile state
  const getChecklistItems = useCallback((): VerificationChecklistItem[] => {
    const hasDescription = !!profile?.description?.trim();
    const hasIdCardFront = !!profile?.idCardFront;
    const hasIdCardBack = !!profile?.idCardBack;
    const hasIdCard = hasIdCardFront && hasIdCardBack;
    const hasPortfolio = (profile?.portfolioImages?.length || 0) > 0;
    const hasSubmitted = isPending || isVerified;

    return [
      {
        id: 'profile',
        label: 'Hoàn thiện hồ sơ',
        description: 'Thêm mô tả về bản thân và kinh nghiệm',
        icon: 'ri-user-settings-line',
        isCompleted: hasDescription,
        action: () => {
          handleClose();
          navigate('/contractor/profile');
        },
      },
      {
        id: 'idCard',
        label: 'Tải lên CMND/CCCD',
        description: 'Xác minh danh tính với CMND/CCCD',
        icon: 'ri-id-card-line',
        isCompleted: hasIdCard,
        action: () => {
          handleClose();
          navigate('/contractor/profile');
        },
      },
      {
        id: 'portfolio',
        label: 'Thêm ảnh portfolio',
        description: 'Chia sẻ các công trình đã thực hiện',
        icon: 'ri-image-line',
        isCompleted: hasPortfolio,
        action: () => {
          handleClose();
          navigate('/contractor/profile');
        },
      },
      {
        id: 'submit',
        label: 'Gửi xác minh',
        description: 'Gửi hồ sơ để được xét duyệt',
        icon: 'ri-send-plane-line',
        isCompleted: hasSubmitted,
        action: () => {
          handleClose();
          navigate('/contractor/profile');
        },
      },
    ];
  }, [profile, isPending, isVerified, navigate]);

  const checklistItems = getChecklistItems();
  const completedCount = checklistItems.filter((item) => item.isCompleted).length;
  const totalCount = checklistItems.length;
  const progressPercentage = (completedCount / totalCount) * 100;

  const handleClose = () => {
    setIsVisible(false);
  };

  const handleComplete = () => {
    completeOnboarding();
    setIsVisible(false);
    onComplete?.();
  };

  const handleSkip = () => {
    completeOnboarding();
    setIsVisible(false);
    onSkip?.();
  };

  const handleGoToProfile = () => {
    handleClose();
    navigate('/contractor/profile');
  };

  // Don't show for non-contractors or if already verified
  if (!isVisible || !shouldShowOnboarding || user?.role !== 'CONTRACTOR') {
    return null;
  }

  // If already verified, just show success and complete
  if (isVerified) {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.7)',
            zIndex: 9998,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onClick={handleComplete}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            style={{
              background: '#1f1f23',
              border: '1px solid rgba(34, 197, 94, 0.3)',
              borderRadius: 16,
              padding: 32,
              maxWidth: 400,
              textAlign: 'center',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                background: 'rgba(34, 197, 94, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 20px',
              }}
            >
              <i className="ri-verified-badge-fill" style={{ fontSize: 32, color: '#22c55e' }} />
            </div>
            <h3 style={{ fontSize: 20, fontWeight: 600, color: '#e4e7ec', marginBottom: 8 }}>
              Tài khoản đã xác minh!
            </h3>
            <p style={{ fontSize: 14, color: '#a1a1aa', marginBottom: 24 }}>
              Bạn có thể bắt đầu tham gia đấu giá các dự án ngay bây giờ.
            </p>
            <button
              onClick={handleComplete}
              style={{
                background: '#22c55e',
                border: 'none',
                color: 'white',
                fontSize: 14,
                fontWeight: 600,
                padding: '12px 24px',
                borderRadius: 8,
                cursor: 'pointer',
              }}
            >
              Bắt đầu
            </button>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    );
  }

  return (
    <AnimatePresence>
      {/* Overlay */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.7)',
          zIndex: 9998,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 20,
        }}
        onClick={handleSkip}
      >
        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ duration: 0.3 }}
          style={{
            background: '#1f1f23',
            border: '1px solid rgba(245, 211, 147, 0.2)',
            borderRadius: 16,
            padding: 28,
            maxWidth: 440,
            width: '100%',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: '50%',
                background: 'rgba(245, 211, 147, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
              }}
            >
              <i className="ri-shield-check-line" style={{ fontSize: 28, color: '#f5d393' }} />
            </div>
            <h3 style={{ fontSize: 20, fontWeight: 600, color: '#e4e7ec', marginBottom: 8 }}>
              Chào mừng đến với Anh Thợ Xây!
            </h3>
            <p style={{ fontSize: 14, color: '#a1a1aa' }}>
              Hoàn thành các bước sau để xác minh tài khoản và bắt đầu nhận dự án.
            </p>
          </div>

          {/* Progress Bar */}
          <div style={{ marginBottom: 24 }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 8,
              }}
            >
              <span style={{ fontSize: 13, color: '#a1a1aa' }}>Tiến độ xác minh</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#f5d393' }}>
                {completedCount}/{totalCount}
              </span>
            </div>
            <div
              style={{
                height: 8,
                background: 'rgba(255, 255, 255, 0.1)',
                borderRadius: 4,
                overflow: 'hidden',
              }}
            >
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progressPercentage}%` }}
                transition={{ duration: 0.5, delay: 0.2 }}
                style={{
                  height: '100%',
                  background: 'linear-gradient(90deg, #f5d393, #e9b949)',
                  borderRadius: 4,
                }}
              />
            </div>
          </div>

          {/* Checklist */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
            {checklistItems.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 + index * 0.1 }}
                onClick={item.action}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: 14,
                  background: item.isCompleted
                    ? 'rgba(34, 197, 94, 0.1)'
                    : 'rgba(255, 255, 255, 0.03)',
                  border: `1px solid ${
                    item.isCompleted ? 'rgba(34, 197, 94, 0.3)' : 'rgba(255, 255, 255, 0.08)'
                  }`,
                  borderRadius: 10,
                  cursor: item.action ? 'pointer' : 'default',
                  transition: 'all 0.2s',
                }}
              >
                {/* Status Icon */}
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 10,
                    background: item.isCompleted
                      ? 'rgba(34, 197, 94, 0.2)'
                      : 'rgba(255, 255, 255, 0.05)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  {item.isCompleted ? (
                    <i className="ri-check-line" style={{ fontSize: 20, color: '#22c55e' }} />
                  ) : (
                    <i className={item.icon} style={{ fontSize: 20, color: '#71717a' }} />
                  )}
                </div>

                {/* Content */}
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 500,
                      color: item.isCompleted ? '#22c55e' : '#e4e7ec',
                      marginBottom: 2,
                    }}
                  >
                    {item.label}
                  </div>
                  <div style={{ fontSize: 12, color: '#71717a' }}>{item.description}</div>
                </div>

                {/* Arrow */}
                {!item.isCompleted && item.action && (
                  <i className="ri-arrow-right-s-line" style={{ fontSize: 20, color: '#52525b' }} />
                )}
              </motion.div>
            ))}
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 12 }}>
            <button
              onClick={handleSkip}
              style={{
                flex: 1,
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#a1a1aa',
                fontSize: 14,
                padding: '12px 20px',
                borderRadius: 8,
                cursor: 'pointer',
              }}
            >
              Để sau
            </button>
            <button
              onClick={handleGoToProfile}
              style={{
                flex: 1,
                background: '#f5d393',
                border: 'none',
                color: '#1a1a1e',
                fontSize: 14,
                fontWeight: 600,
                padding: '12px 20px',
                borderRadius: 8,
                cursor: 'pointer',
              }}
            >
              Bắt đầu xác minh
            </button>
          </div>

          {/* Pending Status Note */}
          {isPending && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{
                marginTop: 16,
                padding: 12,
                background: 'rgba(245, 158, 11, 0.1)',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                borderRadius: 8,
                display: 'flex',
                alignItems: 'center',
                gap: 10,
              }}
            >
              <i className="ri-time-line" style={{ fontSize: 18, color: '#f59e0b' }} />
              <span style={{ fontSize: 13, color: '#f59e0b' }}>
                Hồ sơ của bạn đang được xem xét. Chúng tôi sẽ thông báo khi hoàn tất.
              </span>
            </motion.div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

/**
 * Export checklist items for testing purposes
 */
export function getVerificationChecklistItems(
  profile: ContractorProfile | null,
  isPending: boolean,
  isVerified: boolean
): VerificationChecklistItem[] {
  const hasDescription = !!profile?.description?.trim();
  const hasIdCardFront = !!profile?.idCardFront;
  const hasIdCardBack = !!profile?.idCardBack;
  const hasIdCard = hasIdCardFront && hasIdCardBack;
  const hasPortfolio = (profile?.portfolioImages?.length || 0) > 0;
  const hasSubmitted = isPending || isVerified;

  return [
    {
      id: 'profile',
      label: 'Hoàn thiện hồ sơ',
      description: 'Thêm mô tả về bản thân và kinh nghiệm',
      icon: 'ri-user-settings-line',
      isCompleted: hasDescription,
    },
    {
      id: 'idCard',
      label: 'Tải lên CMND/CCCD',
      description: 'Xác minh danh tính với CMND/CCCD',
      icon: 'ri-id-card-line',
      isCompleted: hasIdCard,
    },
    {
      id: 'portfolio',
      label: 'Thêm ảnh portfolio',
      description: 'Chia sẻ các công trình đã thực hiện',
      icon: 'ri-image-line',
      isCompleted: hasPortfolio,
    },
    {
      id: 'submit',
      label: 'Gửi xác minh',
      description: 'Gửi hồ sơ để được xét duyệt',
      icon: 'ri-send-plane-line',
      isCompleted: hasSubmitted,
    },
  ];
}
