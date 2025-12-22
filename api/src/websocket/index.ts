/**
 * WebSocket Module Entry Point
 *
 * Exports WebSocket handler and setup utilities.
 *
 * **Feature: bidding-phase4-communication**
 * **Requirements: 7.1, 7.2, 7.3, 7.4**
 */

export {
  WebSocketChatHandler,
  getWebSocketHandler,
  resetWebSocketHandler,
  type WebSocketClient,
  type WebSocketMessage,
  type BroadcastMessage,
  type TypingIndicator,
  type QueuedMessage,
} from './chat.handler';
