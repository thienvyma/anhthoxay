/**
 * Conversation Detail Component
 *
 * Displays conversation messages with read receipts and search functionality.
 *
 * **Feature: bidding-phase4-communication**
 * **Requirements: 14.2-14.4, 18.2, 18.4, 19.1-19.4**
 */

import { useState, useEffect, useRef, useCallback, memo } from 'react';
import { motion } from 'framer-motion';
import { tokens } from '../../../theme';
import { chatApi } from '../../api';
import type { Conversation, ChatMessage, ReadReceipt } from '../../types';
import { MessageBubble } from './MessageBubble';
import { CloseConversationModal } from './CloseConversationModal';

interface ConversationDetailProps {
  conversation: Conversation;
  onClose: (conversationId: string, reason?: string) => Promise<void>;
  onSendSystemMessage: (conversationId: string, content: string) => Promise<void>;
}

export const ConversationDetail = memo(function ConversationDetail({
  conversation,
  onClose,
  onSendSystemMessage,
}: ConversationDetailProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [systemMessage, setSystemMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [readReceipts, setReadReceipts] = useState<Record<string, ReadReceipt[]>>({});

  // Search state - Requirements: 19.1-19.4
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<ChatMessage[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [highlightedMessageId, setHighlightedMessageId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const fetchMessages = useCallback(async () => {
    try {
      setLoading(true);
      const response = await chatApi.getMessages(conversation.id, { limit: 100 });
      // Messages come in desc order, reverse for display
      setMessages(response.data.reverse());
    } catch (err) {
      console.error('Failed to fetch messages:', err);
    } finally {
      setLoading(false);
    }
  }, [conversation.id]);

  useEffect(() => {
    fetchMessages();
    // Reset search when conversation changes
    setSearchQuery('');
    setSearchResults([]);
    setShowSearch(false);
    setHighlightedMessageId(null);
  }, [fetchMessages]);

  useEffect(() => {
    // Scroll to bottom when messages change (only if not searching)
    if (!showSearch) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, showSearch]);

  // Search messages - Requirements: 19.1
  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      setIsSearching(true);
      const response = await chatApi.searchMessages(conversation.id, {
        q: searchQuery.trim(),
        limit: 50,
      });
      setSearchResults(response.data);
    } catch (err) {
      console.error('Failed to search messages:', err);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, [conversation.id, searchQuery]);

  // Debounced search
  useEffect(() => {
    if (!showSearch) return;

    const timer = setTimeout(() => {
      handleSearch();
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, showSearch, handleSearch]);

  // Scroll to message on click - Requirements: 19.3
  const scrollToMessage = useCallback((messageId: string) => {
    setHighlightedMessageId(messageId);
    const messageElement = messageRefs.current[messageId];
    if (messageElement) {
      messageElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // Remove highlight after animation
      setTimeout(() => setHighlightedMessageId(null), 2000);
    }
  }, []);

  const handleSendSystemMessage = async () => {
    if (!systemMessage.trim() || sending) return;

    try {
      setSending(true);
      await onSendSystemMessage(conversation.id, systemMessage);
      setSystemMessage('');
      await fetchMessages();
    } finally {
      setSending(false);
    }
  };

  const handleViewReadReceipts = async (messageId: string) => {
    if (readReceipts[messageId]) {
      // Toggle off if already loaded
      setReadReceipts((prev) => {
        const next = { ...prev };
        delete next[messageId];
        return next;
      });
      return;
    }

    try {
      const receipts = await chatApi.getReadReceipts(messageId);
      setReadReceipts((prev) => ({ ...prev, [messageId]: receipts }));
    } catch (err) {
      console.error('Failed to fetch read receipts:', err);
    }
  };

  const getParticipantInfo = useCallback(
    (userId: string) => {
      const participant = conversation.participants.find((p) => p.userId === userId);
      return participant?.user;
    },
    [conversation.participants]
  );

  return (
    <div
      style={{
        background: tokens.color.surface,
        borderRadius: tokens.radius.lg,
        border: `1px solid ${tokens.color.border}`,
        display: 'flex',
        flexDirection: 'column',
        height: 700,
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: 16,
          borderBottom: `1px solid ${tokens.color.border}`,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h3 style={{ color: tokens.color.text, fontSize: 16, fontWeight: 600, margin: 0 }}>
              {conversation.project?.title || 'Cuộc hội thoại'}
            </h3>
            <p style={{ color: tokens.color.muted, fontSize: 13, margin: '4px 0 0' }}>
              {conversation.project?.code && <span style={{ marginRight: 8 }}>Mã: {conversation.project.code}</span>}
              <span>
                {conversation.participants
                  .filter((p) => p.isActive)
                  .map((p) => p.user?.name)
                  .join(' • ')}
              </span>
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {/* Search toggle button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                setShowSearch(!showSearch);
                if (showSearch) {
                  setSearchQuery('');
                  setSearchResults([]);
                  setHighlightedMessageId(null);
                }
              }}
              style={{
                padding: '8px 12px',
                background: showSearch ? `${tokens.color.primary}20` : tokens.color.background,
                border: `1px solid ${showSearch ? tokens.color.primary : tokens.color.border}`,
                borderRadius: tokens.radius.md,
                color: showSearch ? tokens.color.primary : tokens.color.muted,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                fontSize: 13,
              }}
              title="Tìm kiếm tin nhắn"
            >
              <i className="ri-search-line" />
            </motion.button>
            {!conversation.isClosed ? (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowCloseModal(true)}
                style={{
                  padding: '8px 16px',
                  background: tokens.color.errorBg,
                  border: `1px solid ${tokens.color.error}50`,
                  borderRadius: tokens.radius.md,
                  color: tokens.color.error,
                  cursor: 'pointer',
                  fontSize: 13,
                  fontWeight: 500,
                }}
              >
                Đóng hội thoại
              </motion.button>
            ) : (
              <span
                style={{
                  padding: '8px 16px',
                  background: tokens.color.surfaceHover,
                  border: `1px solid ${tokens.color.border}`,
                  borderRadius: tokens.radius.md,
                  color: tokens.color.muted,
                  fontSize: 13,
                }}
              >
                Đã đóng{' '}
                {conversation.closedAt && `lúc ${new Date(conversation.closedAt).toLocaleString('vi-VN')}`}
              </span>
            )}
          </div>
        </div>

        {/* Search input */}
        {showSearch && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            style={{ marginTop: 12 }}
          >
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm kiếm tin nhắn..."
                autoFocus
                style={{
                  width: '100%',
                  padding: '10px 12px 10px 36px',
                  background: tokens.color.background,
                  border: `1px solid ${tokens.color.border}`,
                  borderRadius: tokens.radius.md,
                  color: tokens.color.text,
                  fontSize: 14,
                  outline: 'none',
                }}
              />
              <i
                className="ri-search-line"
                style={{
                  position: 'absolute',
                  left: 12,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: tokens.color.muted,
                }}
              />
              {isSearching && (
                <motion.i
                  className="ri-loader-4-line"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  style={{
                    position: 'absolute',
                    right: 12,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: tokens.color.primary,
                  }}
                />
              )}
            </div>

            {/* Search results */}
            {searchQuery.trim() && (
              <div
                style={{
                  marginTop: 8,
                  maxHeight: 200,
                  overflowY: 'auto',
                  background: tokens.color.background,
                  border: `1px solid ${tokens.color.border}`,
                  borderRadius: tokens.radius.md,
                }}
              >
                {searchResults.length === 0 && !isSearching ? (
                  <div
                    style={{
                      padding: 16,
                      textAlign: 'center',
                      color: tokens.color.muted,
                      fontSize: 13,
                    }}
                  >
                    Không tìm thấy tin nhắn nào phù hợp với "{searchQuery}"
                  </div>
                ) : (
                  searchResults.map((result) => (
                    <button
                      key={result.id}
                      onClick={() => scrollToMessage(result.id)}
                      style={{
                        width: '100%',
                        padding: 12,
                        textAlign: 'left',
                        background: 'transparent',
                        border: 'none',
                        borderBottom: `1px solid ${tokens.color.border}`,
                        cursor: 'pointer',
                        transition: 'background 0.2s',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = tokens.color.surfaceHover;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent';
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <span style={{ fontSize: 12, fontWeight: 500, color: tokens.color.text }}>
                          {getParticipantInfo(result.senderId)?.name || 'Người dùng'}
                        </span>
                        <span style={{ fontSize: 11, color: tokens.color.muted }}>
                          {new Date(result.createdAt).toLocaleString('vi-VN')}
                        </span>
                      </div>
                      <p
                        style={{
                          fontSize: 13,
                          color: tokens.color.muted,
                          margin: 0,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                        }}
                      >
                        {result.content}
                      </p>
                    </button>
                  ))
                )}
              </div>
            )}
          </motion.div>
        )}
      </div>

      {/* Messages */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: 16,
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
        }}
      >
        {loading ? (
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              height: '100%',
            }}
          >
            <motion.i
              className="ri-loader-4-line"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              style={{ fontSize: 32, color: tokens.color.primary }}
            />
          </div>
        ) : messages.length === 0 ? (
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              height: '100%',
              color: tokens.color.muted,
            }}
          >
            Chưa có tin nhắn nào
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              ref={(el) => {
                messageRefs.current[message.id] = el;
              }}
              style={{
                transition: 'all 0.3s',
                background: highlightedMessageId === message.id ? `${tokens.color.warning}20` : 'transparent',
                margin: highlightedMessageId === message.id ? '-8px' : 0,
                padding: highlightedMessageId === message.id ? 8 : 0,
                borderRadius: tokens.radius.md,
                boxShadow:
                  highlightedMessageId === message.id ? `0 0 0 2px ${tokens.color.warning}` : 'none',
              }}
            >
              <MessageBubble
                message={message}
                senderInfo={getParticipantInfo(message.senderId)}
                readReceipts={readReceipts[message.id]}
                onViewReadReceipts={() => handleViewReadReceipts(message.id)}
                highlightQuery={showSearch ? searchQuery : undefined}
              />
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* System Message Input */}
      {!conversation.isClosed && (
        <div
          style={{
            padding: 16,
            borderTop: `1px solid ${tokens.color.border}`,
          }}
        >
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              type="text"
              value={systemMessage}
              onChange={(e) => setSystemMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendSystemMessage()}
              placeholder="Gửi tin nhắn hệ thống..."
              disabled={sending}
              style={{
                flex: 1,
                padding: '10px 14px',
                background: tokens.color.background,
                border: `1px solid ${tokens.color.border}`,
                borderRadius: tokens.radius.md,
                color: tokens.color.text,
                fontSize: 14,
                outline: 'none',
                opacity: sending ? 0.6 : 1,
              }}
            />
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleSendSystemMessage}
              disabled={!systemMessage.trim() || sending}
              style={{
                padding: '10px 20px',
                background: !systemMessage.trim() || sending ? tokens.color.muted : tokens.color.primary,
                border: 'none',
                borderRadius: tokens.radius.md,
                color: !systemMessage.trim() || sending ? '#fff' : '#111',
                fontSize: 14,
                fontWeight: 500,
                cursor: !systemMessage.trim() || sending ? 'not-allowed' : 'pointer',
                opacity: !systemMessage.trim() || sending ? 0.5 : 1,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              {sending ? (
                <>
                  <motion.i
                    className="ri-loader-4-line"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  />
                  Đang gửi...
                </>
              ) : (
                <>
                  <i className="ri-send-plane-line" />
                  Gửi
                </>
              )}
            </motion.button>
          </div>
          <p style={{ fontSize: 12, color: tokens.color.muted, margin: '8px 0 0' }}>
            Tin nhắn sẽ được gửi dưới dạng tin nhắn hệ thống
          </p>
        </div>
      )}

      {/* Close Modal */}
      {showCloseModal && (
        <CloseConversationModal
          onClose={() => setShowCloseModal(false)}
          onConfirm={async (reason) => {
            await onClose(conversation.id, reason);
            setShowCloseModal(false);
          }}
        />
      )}
    </div>
  );
});
