/**
 * Message Bubble Component
 *
 * Displays a single message with read receipts indicator and search highlighting.
 *
 * **Feature: bidding-phase4-communication**
 * **Requirements: 18.2, 18.4 - Show "Đã xem" indicator with timestamp
 * **Requirements: 19.2 - Highlight matching text
 */

import { memo, useMemo } from 'react';
import { tokens } from '@app/shared';
import type { ChatMessage, ReadReceipt } from '../../types';

interface MessageBubbleProps {
  message: ChatMessage;
  senderInfo?: {
    id: string;
    name: string;
    email: string;
    avatar: string | null;
    role: string;
  };
  readReceipts?: ReadReceipt[];
  onViewReadReceipts: () => void;
  highlightQuery?: string;
}

export const MessageBubble = memo(function MessageBubble({
  message,
  senderInfo,
  readReceipts,
  onViewReadReceipts,
  highlightQuery,
}: MessageBubbleProps) {
  const isSystem = message.type === 'SYSTEM';
  const isDeleted = message.isDeleted;

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Highlight matching text - Requirements: 19.2
  const highlightedContent = useMemo(() => {
    if (!highlightQuery?.trim()) return message.content;

    const escapedQuery = highlightQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const parts = message.content.split(new RegExp(`(${escapedQuery})`, 'gi'));

    return parts.map((part, index) =>
      part.toLowerCase() === highlightQuery.toLowerCase() ? (
        <mark
          key={index}
          style={{
            background: tokens.color.warning,
            color: '#000',
            padding: '0 2px',
            borderRadius: 2,
          }}
        >
          {part}
        </mark>
      ) : (
        part
      )
    );
  }, [message.content, highlightQuery]);

  const roleColors: Record<string, { bg: string; text: string }> = {
    HOMEOWNER: { bg: 'rgba(34, 197, 94, 0.15)', text: '#22c55e' },
    CONTRACTOR: { bg: 'rgba(59, 130, 246, 0.15)', text: '#3b82f6' },
    ADMIN: { bg: 'rgba(168, 85, 247, 0.15)', text: '#a855f7' },
  };

  const roleLabels: Record<string, string> = {
    HOMEOWNER: 'Chủ nhà',
    CONTRACTOR: 'Nhà thầu',
    ADMIN: 'Admin',
  };

  // System message style
  if (isSystem) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <div
          style={{
            background: 'rgba(255,255,255,0.05)',
            color: tokens.color.muted,
            fontSize: 13,
            padding: '8px 16px',
            borderRadius: 20,
            maxWidth: '80%',
            textAlign: 'center',
          }}
        >
          <span style={{ fontStyle: 'italic' }}>{message.content}</span>
          <span style={{ fontSize: 11, marginLeft: 8, opacity: 0.7 }}>{formatTime(message.createdAt)}</span>
        </div>
      </div>
    );
  }

  // Deleted message
  if (isDeleted) {
    return (
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: tokens.color.muted,
            fontSize: 14,
            fontWeight: 500,
            flexShrink: 0,
          }}
        >
          {senderInfo?.name?.charAt(0) || '?'}
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{ fontSize: 13, fontWeight: 500, color: tokens.color.text }}>
              {senderInfo?.name || 'Người dùng'}
            </span>
            <span style={{ fontSize: 11, color: tokens.color.muted }}>{formatTime(message.createdAt)}</span>
          </div>
          <div
            style={{
              background: 'rgba(255,255,255,0.05)',
              color: tokens.color.muted,
              fontStyle: 'italic',
              padding: '10px 14px',
              borderRadius: tokens.radius.md,
            }}
          >
            Tin nhắn đã bị xóa
          </div>
        </div>
      </div>
    );
  }

  // Regular message
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
      {/* Avatar */}
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: '50%',
          background: `${tokens.color.primary}20`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: tokens.color.primary,
          fontSize: 14,
          fontWeight: 600,
          flexShrink: 0,
          overflow: 'hidden',
        }}
      >
        {senderInfo?.avatar ? (
          <img
            src={senderInfo.avatar}
            alt={senderInfo.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          senderInfo?.name?.charAt(0) || '?'
        )}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Sender info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 13, fontWeight: 500, color: tokens.color.text }}>
            {senderInfo?.name || 'Người dùng'}
          </span>
          <span style={{ fontSize: 11, color: tokens.color.muted }}>{formatTime(message.createdAt)}</span>
          {senderInfo?.role && roleColors[senderInfo.role] && (
            <span
              style={{
                fontSize: 10,
                padding: '2px 8px',
                borderRadius: 10,
                background: roleColors[senderInfo.role].bg,
                color: roleColors[senderInfo.role].text,
                fontWeight: 500,
              }}
            >
              {roleLabels[senderInfo.role] || senderInfo.role}
            </span>
          )}
        </div>

        {/* Message content */}
        <div
          style={{
            background: 'rgba(255,255,255,0.05)',
            padding: '10px 14px',
            borderRadius: tokens.radius.md,
            display: 'inline-block',
            maxWidth: '80%',
          }}
        >
          <p
            style={{
              color: tokens.color.text,
              fontSize: 14,
              margin: 0,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
            }}
          >
            {highlightedContent}
          </p>

          {/* Attachments */}
          {message.attachments && message.attachments.length > 0 && (
            <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
              {message.attachments.map((attachment, index) => (
                <a
                  key={index}
                  href={attachment.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    fontSize: 13,
                    color: tokens.color.primary,
                    textDecoration: 'none',
                  }}
                >
                  <i className="ri-attachment-2" />
                  {attachment.name}
                </a>
              ))}
            </div>
          )}
        </div>

        {/* Read receipts indicator */}
        <div style={{ marginTop: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
          {message.readBy && message.readBy.length > 0 ? (
            <button
              onClick={onViewReadReceipts}
              style={{
                background: 'none',
                border: 'none',
                padding: 0,
                fontSize: 11,
                color: tokens.color.primary,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <i className="ri-check-double-line" />
              Đã xem ({message.readBy.length})
            </button>
          ) : message.isRead ? (
            <span
              style={{
                fontSize: 11,
                color: tokens.color.muted,
                display: 'flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <i className="ri-check-line" />
              Đã xem
            </span>
          ) : (
            <span style={{ fontSize: 11, color: tokens.color.muted }}>Chưa đọc</span>
          )}
        </div>

        {/* Read receipts detail */}
        {readReceipts && readReceipts.length > 0 && (
          <div
            style={{
              marginTop: 8,
              padding: 10,
              background: 'rgba(255,255,255,0.03)',
              borderRadius: tokens.radius.sm,
              fontSize: 12,
            }}
          >
            <p style={{ fontWeight: 500, color: tokens.color.text, margin: '0 0 6px' }}>Đã xem bởi:</p>
            <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
              {readReceipts.map((receipt) => (
                <li
                  key={receipt.userId}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    color: tokens.color.muted,
                    padding: '2px 0',
                  }}
                >
                  <span>{receipt.user?.name || 'Người dùng'}</span>
                  <span style={{ opacity: 0.5 }}>•</span>
                  <span style={{ opacity: 0.7 }}>{formatDate(receipt.readAt)}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
});
