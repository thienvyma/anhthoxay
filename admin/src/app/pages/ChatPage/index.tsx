/**
 * Chat Management Page
 *
 * Admin interface for viewing and managing conversations.
 *
 * **Feature: bidding-phase4-communication**
 * **Requirements: 14.1-14.4, 18.1-18.4**
 */

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { tokens } from '../../../theme';
import { chatApi } from '../../api';
import type { Conversation } from '../../types';
import { ConversationList } from './ConversationList';
import { ConversationDetail } from './ConversationDetail';

interface ChatPageProps {
  embedded?: boolean;
}

export function ChatPage({ embedded = false }: ChatPageProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState<{
    isClosed?: boolean;
    projectId?: string;
  }>({});

  const fetchConversations = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await chatApi.list({
        page,
        limit: 20,
        ...filters,
      });
      setConversations(response.data);
      setTotalPages(response.totalPages);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể tải danh sách cuộc hội thoại');
    } finally {
      setLoading(false);
    }
  }, [page, filters]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  const handleSelectConversation = async (conversation: Conversation) => {
    try {
      const detail = await chatApi.get(conversation.id);
      setSelectedConversation(detail);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể tải chi tiết cuộc hội thoại');
    }
  };

  const handleCloseConversation = async (conversationId: string, reason?: string) => {
    try {
      await chatApi.close(conversationId, reason);
      await fetchConversations();
      if (selectedConversation?.id === conversationId) {
        const updated = await chatApi.get(conversationId);
        setSelectedConversation(updated);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể đóng cuộc hội thoại');
    }
  };

  const handleSendSystemMessage = async (conversationId: string, content: string) => {
    try {
      await chatApi.sendSystemMessage(conversationId, content);
      if (selectedConversation?.id === conversationId) {
        const updated = await chatApi.get(conversationId);
        setSelectedConversation(updated);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể gửi tin nhắn');
    }
  };

  const handleFilterChange = (newFilters: typeof filters) => {
    setFilters(newFilters);
    setPage(1);
  };

  return (
    <div>
      {/* Header - hidden when embedded */}
      {!embedded && (
        <div style={{ marginBottom: 24 }}>
          <h2 style={{ color: tokens.color.text, fontSize: 24, fontWeight: 600, margin: 0 }}>
            Quản lý Chat
          </h2>
          <p style={{ color: tokens.color.muted, fontSize: 14, margin: '4px 0 0' }}>
            Xem và quản lý các cuộc hội thoại giữa chủ nhà và nhà thầu
          </p>
        </div>
      )}

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            marginBottom: 16,
            padding: 16,
            background: tokens.color.errorBg,
            border: `1px solid ${tokens.color.error}50`,
            borderRadius: tokens.radius.md,
            color: tokens.color.error,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span>{error}</span>
          <button
            onClick={() => setError(null)}
            style={{
              background: 'none',
              border: 'none',
              color: tokens.color.error,
              cursor: 'pointer',
              padding: 4,
              fontSize: 16,
            }}
          >
            <i className="ri-close-line" />
          </button>
        </motion.div>
      )}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 2fr',
          gap: 24,
        }}
      >
        {/* Conversation List */}
        <ConversationList
          conversations={conversations}
          selectedId={selectedConversation?.id}
          loading={loading}
          page={page}
          totalPages={totalPages}
          filters={filters}
          onSelect={handleSelectConversation}
          onPageChange={setPage}
          onFilterChange={handleFilterChange}
        />

        {/* Conversation Detail */}
        {selectedConversation ? (
          <ConversationDetail
            conversation={selectedConversation}
            onClose={handleCloseConversation}
            onSendSystemMessage={handleSendSystemMessage}
          />
        ) : (
          <div
            style={{
              background: tokens.color.surface,
              borderRadius: tokens.radius.lg,
              border: `1px solid ${tokens.color.border}`,
              padding: 48,
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: 400,
            }}
          >
            <i
              className="ri-chat-3-line"
              style={{
                fontSize: 64,
                color: tokens.color.muted,
                marginBottom: 16,
                opacity: 0.5,
              }}
            />
            <p style={{ color: tokens.color.muted, fontSize: 16, margin: 0 }}>
              Chọn một cuộc hội thoại để xem chi tiết
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default ChatPage;
