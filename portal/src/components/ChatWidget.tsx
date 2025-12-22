/**
 * ChatWidget Component
 *
 * Chat widget with dropdown for displaying conversations:
 * - Badge with unread count
 * - Conversation list sidebar
 * - Chat interface
 * - Typing indicator
 *
 * **Feature: bidding-phase6-portal**
 * **Requirements: 17.1, 17.2, 17.3, 17.4, 17.5**
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { chatApi, type Conversation, type Message } from '../api';
import { useAuth } from '../auth/AuthContext';

export interface ChatWidgetProps {
  /** Maximum number of conversations to show in dropdown */
  maxConversations?: number;
  /** Polling interval in milliseconds (0 to disable) */
  pollingInterval?: number;
  /** Custom class name */
  className?: string;
}

/**
 * Format time ago for display
 */
function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Vừa xong';
  if (diffMins < 60) return `${diffMins}p`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays < 7) return `${diffDays}d`;
  return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
}

/**
 * Get the other participant in a conversation
 */
function getOtherParticipant(conversation: Conversation, currentUserId?: string) {
  return conversation.participants.find((p) => p.id !== currentUserId);
}

/**
 * Calculate total unread count from conversations
 */
function getTotalUnreadCount(conversations: Conversation[]): number {
  return conversations.reduce((sum, conv) => sum + (conv.unreadCount || 0), 0);
}

export function ChatWidget({
  maxConversations = 5,
  pollingInterval = 30000,
  className,
}: ChatWidgetProps) {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  // Typing indicator state - will be used with WebSocket integration
  const [typingUsers] = useState<string[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const unreadCount = getTotalUnreadCount(conversations);

  // Fetch conversations
  const fetchConversations = useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      const result = await chatApi.getConversations({
        page: 1,
        limit: maxConversations,
      });
      setConversations(result.data);
    } catch (error) {
      console.error('Failed to fetch conversations:', error);
    }
  }, [isAuthenticated, maxConversations]);

  // Fetch messages for selected conversation
  const fetchMessages = useCallback(async (conversationId: string) => {
    setIsLoading(true);
    try {
      const result = await chatApi.getMessages(conversationId, {
        page: 1,
        limit: 50,
      });
      setMessages(result.data.reverse()); // Reverse to show oldest first
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // Polling for new conversations/messages
  useEffect(() => {
    if (!isAuthenticated || pollingInterval <= 0) return;

    const interval = setInterval(() => {
      fetchConversations();
      if (selectedConversation) {
        fetchMessages(selectedConversation.id);
      }
    }, pollingInterval);

    return () => clearInterval(interval);
  }, [isAuthenticated, pollingInterval, fetchConversations, fetchMessages, selectedConversation]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSelectedConversation(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle conversation click
  const handleConversationClick = async (conversation: Conversation) => {
    setSelectedConversation(conversation);
    await fetchMessages(conversation.id);

    // Mark as read
    if (conversation.unreadCount && conversation.unreadCount > 0) {
      try {
        await chatApi.markAsRead(conversation.id);
        setConversations((prev) =>
          prev.map((c) => (c.id === conversation.id ? { ...c, unreadCount: 0 } : c))
        );
      } catch (error) {
        console.error('Failed to mark as read:', error);
      }
    }
  };

  // Handle send message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedConversation || !newMessage.trim() || isSending) return;

    setIsSending(true);
    try {
      const message = await chatApi.sendMessage(selectedConversation.id, {
        content: newMessage.trim(),
        type: 'TEXT',
      });
      setMessages((prev) => [...prev, message]);
      setNewMessage('');

      // Update conversation's last message
      setConversations((prev) =>
        prev.map((c) =>
          c.id === selectedConversation.id ? { ...c, lastMessage: message } : c
        )
      );
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setIsSending(false);
    }
  };

  // Handle back to conversation list
  const handleBack = () => {
    setSelectedConversation(null);
    setMessages([]);
  };

  // Handle open full chat
  const handleOpenFullChat = () => {
    navigate('/chat');
    setIsOpen(false);
    setSelectedConversation(null);
  };

  if (!isAuthenticated) return null;

  return (
    <div ref={dropdownRef} style={{ position: 'relative' }} className={className}>
      {/* Chat Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="header-icon-btn"
        aria-label="Tin nhắn"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <i className="ri-chat-3-line" style={{ fontSize: 22 }} />
        {unreadCount > 0 && (
          <span className="notification-badge" aria-label={`${unreadCount} tin nhắn chưa đọc`}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="dropdown-menu chat-dropdown"
            style={{ width: 360, maxHeight: 480 }}
            role="dialog"
            aria-label="Tin nhắn"
          >
            {selectedConversation ? (
              // Chat Interface
              <ChatInterface
                conversation={selectedConversation}
                messages={messages}
                newMessage={newMessage}
                isLoading={isLoading}
                isSending={isSending}
                typingUsers={typingUsers}
                currentUserId={user?.id}
                onBack={handleBack}
                onSendMessage={handleSendMessage}
                onMessageChange={setNewMessage}
                messagesEndRef={messagesEndRef}
              />
            ) : (
              // Conversation List
              <ConversationList
                conversations={conversations}
                currentUserId={user?.id}
                onConversationClick={handleConversationClick}
                onOpenFullChat={handleOpenFullChat}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/**
 * Conversation List Component
 */
function ConversationList({
  conversations,
  currentUserId,
  onConversationClick,
  onOpenFullChat,
}: {
  conversations: Conversation[];
  currentUserId?: string;
  onConversationClick: (conversation: Conversation) => void;
  onOpenFullChat: () => void;
}) {
  return (
    <>
      {/* Header */}
      <div className="dropdown-header">
        <span style={{ fontWeight: 600, color: '#e4e7ec' }}>Tin nhắn</span>
      </div>

      {/* Conversation List */}
      <div className="chat-list" style={{ maxHeight: 360, overflowY: 'auto' }}>
        {conversations.length === 0 ? (
          <div style={{ padding: 24, textAlign: 'center', color: '#71717a' }}>
            <i
              className="ri-chat-3-line"
              style={{ fontSize: 32, marginBottom: 8, display: 'block' }}
            />
            Chưa có cuộc trò chuyện
          </div>
        ) : (
          conversations.map((conversation) => {
            const otherUser = getOtherParticipant(conversation, currentUserId);
            const hasUnread = (conversation.unreadCount || 0) > 0;

            return (
              <button
                key={conversation.id}
                onClick={() => onConversationClick(conversation)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '12px 16px',
                  width: '100%',
                  background: hasUnread ? 'rgba(245, 211, 147, 0.05)' : 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'background 0.2s',
                  textAlign: 'left',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = hasUnread
                    ? 'rgba(245, 211, 147, 0.05)'
                    : 'transparent';
                }}
              >
                {/* Avatar */}
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: '50%',
                    background: '#f5d393',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#0b0c0f',
                    fontWeight: 600,
                    fontSize: 16,
                    flexShrink: 0,
                  }}
                >
                  {otherUser?.name?.charAt(0).toUpperCase() || '?'}
                </div>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: 2,
                    }}
                  >
                    <span
                      style={{
                        fontWeight: hasUnread ? 600 : 500,
                        color: '#e4e7ec',
                        fontSize: 14,
                      }}
                    >
                      {otherUser?.name || 'Người dùng'}
                    </span>
                    {conversation.lastMessage && (
                      <span style={{ fontSize: 11, color: '#71717a' }}>
                        {formatTimeAgo(conversation.lastMessage.createdAt)}
                      </span>
                    )}
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 13,
                        color: hasUnread ? '#e4e7ec' : '#a1a1aa',
                        fontWeight: hasUnread ? 500 : 400,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        flex: 1,
                      }}
                    >
                      {conversation.lastMessage?.content || 'Chưa có tin nhắn'}
                    </span>
                    {hasUnread && (
                      <span
                        style={{
                          minWidth: 20,
                          height: 20,
                          padding: '0 6px',
                          background: '#f5d393',
                          color: '#0b0c0f',
                          fontSize: 11,
                          fontWeight: 600,
                          borderRadius: 10,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {conversation.unreadCount}
                      </span>
                    )}
                  </div>
                  {/* Project info */}
                  {conversation.project && (
                    <div style={{ fontSize: 11, color: '#71717a', marginTop: 4 }}>
                      {conversation.project.title}
                    </div>
                  )}
                </div>
              </button>
            );
          })
        )}
      </div>

      {/* Footer */}
      <button onClick={onOpenFullChat} className="dropdown-footer">
        Mở chat
      </button>
    </>
  );
}

/**
 * Chat Interface Component
 */
function ChatInterface({
  conversation,
  messages,
  newMessage,
  isLoading,
  isSending,
  typingUsers,
  currentUserId,
  onBack,
  onSendMessage,
  onMessageChange,
  messagesEndRef,
}: {
  conversation: Conversation;
  messages: Message[];
  newMessage: string;
  isLoading: boolean;
  isSending: boolean;
  typingUsers: string[];
  currentUserId?: string;
  onBack: () => void;
  onSendMessage: (e: React.FormEvent) => void;
  onMessageChange: (value: string) => void;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
}) {
  const otherUser = getOtherParticipant(conversation, currentUserId);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 480 }}>
      {/* Header */}
      <div
        style={{
          padding: '12px 16px',
          borderBottom: '1px solid #27272a',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <button
          onClick={onBack}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#a1a1aa',
            cursor: 'pointer',
            padding: 4,
          }}
          aria-label="Quay lại"
        >
          <i className="ri-arrow-left-line" style={{ fontSize: 20 }} />
        </button>
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: '50%',
            background: '#f5d393',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#0b0c0f',
            fontWeight: 600,
            fontSize: 14,
          }}
        >
          {otherUser?.name?.charAt(0).toUpperCase() || '?'}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600, color: '#e4e7ec', fontSize: 14 }}>
            {otherUser?.name || 'Người dùng'}
          </div>
          {conversation.project && (
            <div style={{ fontSize: 11, color: '#71717a' }}>
              {conversation.project.title}
            </div>
          )}
        </div>
      </div>

      {/* Messages */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: 16,
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
        }}
      >
        {isLoading ? (
          <div style={{ textAlign: 'center', color: '#71717a', padding: 20 }}>
            <i className="ri-loader-4-line spinner" style={{ fontSize: 24 }} />
          </div>
        ) : messages.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#71717a', padding: 20 }}>
            Bắt đầu cuộc trò chuyện
          </div>
        ) : (
          messages.map((message) => {
            const isOwn = message.senderId === currentUserId;
            const isSystem = message.type === 'SYSTEM';

            if (isSystem) {
              return (
                <div
                  key={message.id}
                  style={{
                    textAlign: 'center',
                    fontSize: 12,
                    color: '#71717a',
                    padding: '8px 0',
                  }}
                >
                  {message.content}
                </div>
              );
            }

            return (
              <div
                key={message.id}
                style={{
                  display: 'flex',
                  justifyContent: isOwn ? 'flex-end' : 'flex-start',
                }}
              >
                <div
                  style={{
                    maxWidth: '75%',
                    padding: '10px 14px',
                    borderRadius: 12,
                    background: isOwn ? '#f5d393' : '#27272a',
                    color: isOwn ? '#0b0c0f' : '#e4e7ec',
                    fontSize: 14,
                    lineHeight: 1.4,
                  }}
                >
                  {message.content}
                  <div
                    style={{
                      fontSize: 10,
                      color: isOwn ? 'rgba(0,0,0,0.5)' : '#71717a',
                      marginTop: 4,
                      textAlign: 'right',
                    }}
                  >
                    {formatTimeAgo(message.createdAt)}
                  </div>
                </div>
              </div>
            );
          })
        )}

        {/* Typing Indicator */}
        {typingUsers.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0' }}>
            <div
              style={{
                display: 'flex',
                gap: 4,
                padding: '8px 12px',
                background: '#27272a',
                borderRadius: 12,
              }}
            >
              <span
                className="typing-dot"
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  background: '#71717a',
                  animation: 'typing 1.4s infinite',
                  animationDelay: '0s',
                }}
              />
              <span
                className="typing-dot"
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  background: '#71717a',
                  animation: 'typing 1.4s infinite',
                  animationDelay: '0.2s',
                }}
              />
              <span
                className="typing-dot"
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  background: '#71717a',
                  animation: 'typing 1.4s infinite',
                  animationDelay: '0.4s',
                }}
              />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={onSendMessage}
        style={{
          padding: 12,
          borderTop: '1px solid #27272a',
          display: 'flex',
          gap: 8,
        }}
      >
        <input
          type="text"
          value={newMessage}
          onChange={(e) => onMessageChange(e.target.value)}
          placeholder="Nhập tin nhắn..."
          className="input"
          style={{ flex: 1, padding: '10px 14px' }}
          disabled={isSending || conversation.isClosed}
        />
        <button
          type="submit"
          className="btn btn-primary"
          style={{ padding: '10px 14px' }}
          disabled={!newMessage.trim() || isSending || conversation.isClosed}
        >
          {isSending ? (
            <i className="ri-loader-4-line spinner" />
          ) : (
            <i className="ri-send-plane-fill" />
          )}
        </button>
      </form>
    </div>
  );
}

export default ChatWidget;
