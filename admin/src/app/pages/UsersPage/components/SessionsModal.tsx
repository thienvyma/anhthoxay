/**
 * SessionsModal Component
 * Modal for viewing and managing user sessions
 * Requirements: 2.5
 */

import { motion } from 'framer-motion';
import { tokens } from '@app/shared';
import { ResponsiveModal, ResponsiveStack } from '../../../../components/responsive';
import type { SessionsModalProps } from '../types';

export function SessionsModal({
  isOpen,
  user,
  sessions,
  onClose,
  onRevokeSession,
  isMobile,
}: SessionsModalProps) {
  return (
    <ResponsiveModal
      isOpen={isOpen && !!user}
      onClose={onClose}
      title="Phiên đăng nhập"
      size="lg"
    >
      <div style={{ marginBottom: 16 }}>
        <p style={{ color: tokens.color.muted, fontSize: 14, margin: 0 }}>
          {user?.name} ({user?.email})
        </p>
      </div>

      {sessions.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            color: tokens.color.muted,
            padding: 40,
          }}
        >
          <i
            className="ri-device-line"
            style={{ fontSize: 48, display: 'block', marginBottom: 12 }}
          />
          <p>Không có phiên đăng nhập nào</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {sessions.map((session) => (
            <div
              key={session.id}
              style={{
                padding: isMobile ? 12 : 16,
                background: 'rgba(255,255,255,0.02)',
                borderRadius: tokens.radius.md,
                border: `1px solid ${tokens.color.border}`,
              }}
            >
              <ResponsiveStack
                direction={{ mobile: 'column', tablet: 'row', desktop: 'row' }}
                justify="between"
                align={isMobile ? 'stretch' : 'center'}
                gap={12}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      color: tokens.color.text,
                      fontSize: 14,
                      marginBottom: 4,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: isMobile ? 'normal' : 'nowrap',
                    }}
                  >
                    <i className="ri-device-line" style={{ marginRight: 8 }} />
                    {session.userAgent || 'Unknown device'}
                  </div>
                  <div
                    style={{
                      color: tokens.color.muted,
                      fontSize: 12,
                      lineHeight: 1.5,
                    }}
                  >
                    IP: {session.ipAddress || 'Unknown'}
                    <br />
                    Tạo: {new Date(session.createdAt).toLocaleString('vi-VN')}
                    <br />
                    Hết hạn: {new Date(session.expiresAt).toLocaleString('vi-VN')}
                  </div>
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => onRevokeSession(session.id)}
                  style={{
                    padding: '8px 16px',
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    borderRadius: tokens.radius.sm,
                    color: '#EF4444',
                    cursor: 'pointer',
                    fontSize: 12,
                    fontWeight: 500,
                    minHeight: '44px',
                    width: isMobile ? '100%' : 'auto',
                  }}
                >
                  Thu hồi
                </motion.button>
              </ResponsiveStack>
            </div>
          ))}
        </div>
      )}
    </ResponsiveModal>
  );
}
