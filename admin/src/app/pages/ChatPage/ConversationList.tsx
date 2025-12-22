/**
 * Conversation List Component
 *
 * Displays list of conversations with filtering and pagination.
 *
 * **Feature: bidding-phase4-communication**
 * **Requirements: 14.1**
 */

import { memo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { tokens } from '@app/shared';
import type { Conversation } from '../../types';

interface ConversationListProps {
  conversations: Conversation[];
  selectedId?: string;
  loading: boolean;
  page: number;
  totalPages: number;
  filters: {
    isClosed?: boolean;
    projectId?: string;
  };
  onSelect: (conversation: Conversation) => void;
  onPageChange: (page: number) => void;
  onFilterChange: (filters: { isClosed?: boolean; projectId?: string }) => void;
}

export const ConversationList = memo(function ConversationList({
  conversations,
  selectedId,
  loading,
  page,
  totalPages,
  filters,
  onSelect,
  onPageChange,
  onFilterChange,
}: ConversationListProps) {
  const formatDate = useCallback((dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    } else if (days === 1) {
      return 'Hôm qua';
    } else if (days < 7) {
      return `${days} ngày trước`;
    }
    return date.toLocaleDateString('vi-VN');
  }, []);

  const getParticipantNames = useCallback((conversation: Conversation) => {
    return conversation.participants
      .filter((p) => p.isActive)
      .map((p) => p.user?.name || 'Người dùng')
      .join(', ');
  }, []);

  return (
    <div
      style={{
        background: tokens.color.surface,
        borderRadius: tokens.radius.lg,
        border: `1px solid ${tokens.color.border}`,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        maxHeight: 700,
      }}
    >
      {/* Filters */}
      <div
        style={{
          padding: 16,
          borderBottom: `1px solid ${tokens.color.border}`,
        }}
      >
        <select
          value={filters.isClosed === undefined ? '' : filters.isClosed.toString()}
          onChange={(e) =>
            onFilterChange({
              ...filters,
              isClosed: e.target.value === '' ? undefined : e.target.value === 'true',
            })
          }
          style={{
            width: '100%',
            padding: '10px 12px',
            background: tokens.color.background,
            border: `1px solid ${tokens.color.border}`,
            borderRadius: tokens.radius.md,
            color: tokens.color.text,
            fontSize: 14,
            cursor: 'pointer',
            outline: 'none',
          }}
        >
          <option value="">Tất cả trạng thái</option>
          <option value="false">Đang mở</option>
          <option value="true">Đã đóng</option>
        </select>
      </div>

      {/* Conversation List */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {loading ? (
          <div
            style={{
              padding: 48,
              textAlign: 'center',
              color: tokens.color.muted,
            }}
          >
            <motion.i
              className="ri-loader-4-line"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              style={{ fontSize: 32, display: 'block', marginBottom: 12 }}
            />
            <p style={{ margin: 0 }}>Đang tải...</p>
          </div>
        ) : conversations.length === 0 ? (
          <div
            style={{
              padding: 48,
              textAlign: 'center',
              color: tokens.color.muted,
            }}
          >
            <i
              className="ri-chat-off-line"
              style={{ fontSize: 48, display: 'block', marginBottom: 12, opacity: 0.5 }}
            />
            <p style={{ margin: 0 }}>Không có cuộc hội thoại nào</p>
          </div>
        ) : (
          conversations.map((conversation) => {
            const isSelected = selectedId === conversation.id;
            return (
              <motion.button
                key={conversation.id}
                whileHover={{ backgroundColor: isSelected ? undefined : 'rgba(255,255,255,0.05)' }}
                onClick={() => onSelect(conversation)}
                style={{
                  width: '100%',
                  padding: 16,
                  textAlign: 'left',
                  background: isSelected
                    ? `linear-gradient(135deg, ${tokens.color.primary}15, ${tokens.color.primary}05)`
                    : 'transparent',
                  border: 'none',
                  borderBottom: `1px solid ${tokens.color.border}`,
                  borderLeft: isSelected ? `3px solid ${tokens.color.primary}` : '3px solid transparent',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span
                        style={{
                          fontWeight: 600,
                          color: tokens.color.text,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {conversation.project?.code || 'Không có dự án'}
                      </span>
                      {conversation.isClosed && (
                        <span
                          style={{
                            padding: '2px 8px',
                            fontSize: 11,
                            background: 'rgba(255,255,255,0.1)',
                            color: tokens.color.muted,
                            borderRadius: tokens.radius.sm,
                          }}
                        >
                          Đã đóng
                        </span>
                      )}
                    </div>
                    <p
                      style={{
                        fontSize: 13,
                        color: tokens.color.muted,
                        margin: 0,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {getParticipantNames(conversation)}
                    </p>
                    {conversation.lastMessage && (
                      <p
                        style={{
                          fontSize: 13,
                          color: tokens.color.muted,
                          margin: '4px 0 0',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          opacity: 0.7,
                        }}
                      >
                        {conversation.lastMessage.type === 'SYSTEM' && (
                          <span style={{ fontStyle: 'italic' }}>[Hệ thống] </span>
                        )}
                        {conversation.lastMessage.content}
                      </p>
                    )}
                  </div>
                  <span
                    style={{
                      fontSize: 11,
                      color: tokens.color.muted,
                      marginLeft: 8,
                      whiteSpace: 'nowrap',
                      opacity: 0.7,
                    }}
                  >
                    {formatDate(conversation.updatedAt)}
                  </span>
                </div>
              </motion.button>
            );
          })
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div
          style={{
            padding: 12,
            borderTop: `1px solid ${tokens.color.border}`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <button
            onClick={() => onPageChange(page - 1)}
            disabled={page === 1}
            style={{
              padding: '6px 12px',
              fontSize: 13,
              background: page === 1 ? 'transparent' : tokens.color.background,
              border: `1px solid ${tokens.color.border}`,
              borderRadius: tokens.radius.sm,
              color: page === 1 ? tokens.color.muted : tokens.color.text,
              cursor: page === 1 ? 'not-allowed' : 'pointer',
              opacity: page === 1 ? 0.5 : 1,
            }}
          >
            <i className="ri-arrow-left-s-line" />
          </button>
          <span style={{ fontSize: 13, color: tokens.color.muted }}>
            Trang {page} / {totalPages}
          </span>
          <button
            onClick={() => onPageChange(page + 1)}
            disabled={page === totalPages}
            style={{
              padding: '6px 12px',
              fontSize: 13,
              background: page === totalPages ? 'transparent' : tokens.color.background,
              border: `1px solid ${tokens.color.border}`,
              borderRadius: tokens.radius.sm,
              color: page === totalPages ? tokens.color.muted : tokens.color.text,
              cursor: page === totalPages ? 'not-allowed' : 'pointer',
              opacity: page === totalPages ? 0.5 : 1,
            }}
          >
            <i className="ri-arrow-right-s-line" />
          </button>
        </div>
      )}
    </div>
  );
});
