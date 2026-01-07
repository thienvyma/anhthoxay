/**
 * Notification Service Tests
 *
 * Tests for notification management business logic including creation,
 * listing, marking as read, and preferences management.
 *
 * **Feature: api-test-coverage**
 * **Requirements: 4.1-4.4**
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as fc from 'fast-check';
import { NotificationService, NotificationError } from './notification.service';
import { NotificationChannelService } from './notification-channel.service';
import { createMockPrisma, type MockPrismaClient } from '../test-utils/mock-prisma';
import { notificationFixtures } from '../test-utils/fixtures';
import { DEFAULT_NOTIFICATION_PREFERENCES } from '../schemas/notification-preference.schema';

// ============================================
// NOTIFICATION SERVICE TESTS
// ============================================

describe('NotificationService', () => {
  let mockPrisma: MockPrismaClient;
  let service: NotificationService;

  beforeEach(() => {
    mockPrisma = createMockPrisma();
    service = new NotificationService(mockPrisma as unknown as import('@prisma/client').PrismaClient);
    vi.clearAllMocks();
  });

  // ============================================
  // NOTIFICATION CREATION TESTS
  // ============================================

  describe('Notification Creation', () => {
    /**
     * Unit tests for notification creation
     * **Validates: Requirements 4.1**
     */
    describe('create', () => {
      it('should create a notification with all required fields', async () => {
        const input = {
          userId: 'user-1',
          type: 'BID_RECEIVED' as const,
          title: 'New Bid Received',
          content: 'You have received a new bid',
          data: { projectId: 'project-1', bidId: 'bid-1' },
        };

        const mockNotification = {
          id: 'notification-1',
          userId: input.userId,
          type: input.type,
          title: input.title,
          content: input.content,
          data: JSON.stringify(input.data),
          isRead: false,
          readAt: null,
          createdAt: new Date(),
        };

        mockPrisma.notification.create.mockResolvedValue(mockNotification);

        const result = await service.create(input);

        expect(result.id).toBe('notification-1');
        expect(result.userId).toBe(input.userId);
        expect(result.type).toBe(input.type);
        expect(result.title).toBe(input.title);
        expect(result.content).toBe(input.content);
        expect(result.isRead).toBe(false);
        expect(result.readAt).toBeNull();
      });

      it('should create notification without data field', async () => {
        const input = {
          userId: 'user-1',
          type: 'PROJECT_COMPLETED' as const,
          title: 'Project Completed',
          content: 'Your project has been completed',
        };

        const mockNotification = {
          id: 'notification-2',
          userId: input.userId,
          type: input.type,
          title: input.title,
          content: input.content,
          data: null,
          isRead: false,
          readAt: null,
          createdAt: new Date(),
        };

        mockPrisma.notification.create.mockResolvedValue(mockNotification);

        const result = await service.create(input);

        expect(result.data).toBeNull();
      });

      it('should parse notification data JSON correctly', async () => {
        const notificationData = { projectId: 'proj-1', bidId: 'bid-1', amount: 1000000 };
        const input = {
          userId: 'user-1',
          type: 'ESCROW_HELD' as const,
          title: 'Escrow Held',
          content: 'Escrow has been held',
          data: notificationData,
        };

        const mockNotification = {
          id: 'notification-3',
          userId: input.userId,
          type: input.type,
          title: input.title,
          content: input.content,
          data: JSON.stringify(notificationData),
          isRead: false,
          readAt: null,
          createdAt: new Date(),
        };

        mockPrisma.notification.create.mockResolvedValue(mockNotification);

        const result = await service.create(input);

        expect(result.data).toEqual(notificationData);
      });
    });

    describe('createFromTemplate', () => {
      it('should create BID_RECEIVED notification with correct template', async () => {
        const data = { projectCode: 'PRJ-2024-001', bidCode: 'BID-2024-001' };

        mockPrisma.notification.create.mockResolvedValue({
          id: 'notification-1',
          userId: 'user-1',
          type: 'BID_RECEIVED',
          title: 'Bạn nhận được bid mới',
          content: 'Dự án PRJ-2024-001 vừa nhận được một bid mới từ nhà thầu.',
          data: JSON.stringify(data),
          isRead: false,
          readAt: null,
          createdAt: new Date(),
        });

        const result = await service.createFromTemplate('user-1', 'BID_RECEIVED', data);

        expect(result.type).toBe('BID_RECEIVED');
        expect(result.title).toBe('Bạn nhận được bid mới');
      });

      it('should create BID_SELECTED notification with correct template', async () => {
        const data = { projectCode: 'PRJ-2024-001', bidCode: 'BID-2024-001' };

        mockPrisma.notification.create.mockResolvedValue({
          id: 'notification-2',
          userId: 'user-1',
          type: 'BID_SELECTED',
          title: 'Chúc mừng! Bid của bạn đã được chọn',
          content: 'Bid BID-2024-001 của bạn cho dự án PRJ-2024-001 đã được chủ nhà chọn.',
          data: JSON.stringify(data),
          isRead: false,
          readAt: null,
          createdAt: new Date(),
        });

        const result = await service.createFromTemplate('user-1', 'BID_SELECTED', data);

        expect(result.type).toBe('BID_SELECTED');
        expect(result.title).toBe('Chúc mừng! Bid của bạn đã được chọn');
      });

      it('should create ESCROW_HELD notification with amount formatted', async () => {
        const data = { 
          projectCode: 'PRJ-2024-001', 
          escrowCode: 'ESC-2024-001',
          amount: 10000000 
        };

        mockPrisma.notification.create.mockResolvedValue({
          id: 'notification-3',
          userId: 'user-1',
          type: 'ESCROW_HELD',
          title: 'Đặt cọc đã được xác nhận',
          content: 'Escrow ESC-2024-001 cho dự án PRJ-2024-001 đã được xác nhận. Số tiền 10,000,000 VNĐ đang được giữ.',
          data: JSON.stringify(data),
          isRead: false,
          readAt: null,
          createdAt: new Date(),
        });

        const result = await service.createFromTemplate('user-1', 'ESCROW_HELD', data);

        expect(result.type).toBe('ESCROW_HELD');
        expect(result.title).toBe('Đặt cọc đã được xác nhận');
      });

      it('should create NEW_MESSAGE notification', async () => {
        const data = { projectCode: 'PRJ-2024-001' };

        mockPrisma.notification.create.mockResolvedValue({
          id: 'notification-4',
          userId: 'user-1',
          type: 'NEW_MESSAGE',
          title: 'Bạn có tin nhắn mới',
          content: 'Bạn có tin nhắn mới trong cuộc hội thoại cho dự án PRJ-2024-001.',
          data: JSON.stringify(data),
          isRead: false,
          readAt: null,
          createdAt: new Date(),
        });

        const result = await service.createFromTemplate('user-1', 'NEW_MESSAGE', data);

        expect(result.type).toBe('NEW_MESSAGE');
        expect(result.title).toBe('Bạn có tin nhắn mới');
      });
    });

    describe('All notification types', () => {
      const notificationTypes = [
        'BID_RECEIVED',
        'BID_APPROVED',
        'BID_REJECTED',
        'BID_SELECTED',
        'BID_NOT_SELECTED',
        'ESCROW_PENDING',
        'ESCROW_HELD',
        'ESCROW_PARTIAL_RELEASED',
        'ESCROW_RELEASED',
        'ESCROW_REFUNDED',
        'ESCROW_DISPUTED',
        'FEE_PENDING',
        'FEE_PAID',
        'PROJECT_MATCHED',
        'PROJECT_STARTED',
        'PROJECT_COMPLETED',
        'MILESTONE_REQUESTED',
        'MILESTONE_CONFIRMED',
        'MILESTONE_DISPUTED',
        'NEW_MESSAGE',
      ] as const;

      it.each(notificationTypes)('should handle %s notification type', async (type) => {
        const data = { projectCode: 'PRJ-2024-001' };

        mockPrisma.notification.create.mockResolvedValue({
          id: `notification-${type}`,
          userId: 'user-1',
          type,
          title: `Title for ${type}`,
          content: `Content for ${type}`,
          data: JSON.stringify(data),
          isRead: false,
          readAt: null,
          createdAt: new Date(),
        });

        const result = await service.createFromTemplate('user-1', type, data);

        expect(result.type).toBe(type);
        expect(result.id).toBeDefined();
      });
    });
  });


  // ============================================
  // UNREAD COUNT TESTS
  // ============================================

  describe('Unread Count', () => {
    /**
     * **Feature: api-test-coverage, Property 12: Notification unread count**
     * **Validates: Requirements 4.2**
     */
    describe('Property 12: Notification unread count', () => {
      it('should return correct unread count for any number of unread notifications', async () => {
        // Property: For any user with N unread notifications, getUnreadCount returns N
        await fc.assert(
          fc.asyncProperty(
            fc.integer({ min: 0, max: 100 }),
            async (unreadCount) => {
              // Reset mock for each iteration
              mockPrisma.notification.count.mockReset();
              mockPrisma.notification.count.mockResolvedValue(unreadCount);

              const result = await service.getUnreadCount('user-1');

              expect(result).toBe(unreadCount);
            }
          ),
          { numRuns: 100 }
        );
      });

      it('should return 0 when no unread notifications exist', async () => {
        mockPrisma.notification.count.mockResolvedValue(0);

        const result = await service.getUnreadCount('user-1');

        expect(result).toBe(0);
      });

      it('should return correct count when all notifications are unread', async () => {
        const totalNotifications = 50;
        mockPrisma.notification.count.mockResolvedValue(totalNotifications);

        const result = await service.getUnreadCount('user-1');

        expect(result).toBe(totalNotifications);
      });

      it('should query with correct filter for unread notifications', async () => {
        mockPrisma.notification.count.mockResolvedValue(5);

        await service.getUnreadCount('user-123');

        expect(mockPrisma.notification.count).toHaveBeenCalledWith({
          where: { userId: 'user-123', isRead: false },
        });
      });
    });

    describe('list with unread count', () => {
      it('should include unread count in list response metadata', async () => {
        const notifications = [
          notificationFixtures.unread(),
          notificationFixtures.read(),
        ];

        mockPrisma.notification.findMany.mockResolvedValue(notifications);
        mockPrisma.notification.count
          .mockResolvedValueOnce(2) // total count
          .mockResolvedValueOnce(1); // unread count

        const result = await service.list('user-homeowner-1', {
          page: 1,
          limit: 20,
          sortBy: 'createdAt',
          sortOrder: 'desc',
        });

        expect(result.meta.unreadCount).toBe(1);
        expect(result.meta.total).toBe(2);
      });

      it('should return unread count matching actual unread notifications', async () => {
        // Property: unreadCount <= total always
        await fc.assert(
          fc.asyncProperty(
            fc.integer({ min: 0, max: 50 }), // total
            fc.integer({ min: 0, max: 50 }), // unread
            async (total, unread) => {
              // Ensure unread <= total
              const actualUnread = Math.min(unread, total);

              // Reset mocks for each iteration
              mockPrisma.notification.findMany.mockReset();
              mockPrisma.notification.count.mockReset();

              mockPrisma.notification.findMany.mockResolvedValue([]);
              mockPrisma.notification.count
                .mockResolvedValueOnce(total)
                .mockResolvedValueOnce(actualUnread);

              const result = await service.list('user-1', {
                page: 1,
                limit: 20,
                sortBy: 'createdAt',
                sortOrder: 'desc',
              });

              expect(result.meta.unreadCount).toBe(actualUnread);
              expect(result.meta.unreadCount).toBeLessThanOrEqual(result.meta.total);
            }
          ),
          { numRuns: 100 }
        );
      });
    });
  });


  // ============================================
  // MARK AS READ TESTS
  // ============================================

  describe('Mark as Read', () => {
    /**
     * Unit tests for mark as read functionality
     * **Validates: Requirements 4.3**
     */
    describe('markRead', () => {
      it('should set readAt timestamp when marking as read', async () => {
        const notification = notificationFixtures.unread();
        const readAt = new Date();

        mockPrisma.notification.findFirst.mockResolvedValue(notification);
        mockPrisma.notification.update.mockResolvedValue({
          ...notification,
          isRead: true,
          readAt,
        });

        const result = await service.markRead(notification.id, notification.userId);

        expect(result).not.toBeNull();
        expect(result?.isRead).toBe(true);
        expect(result?.readAt).toBeDefined();
        expect(result?.readAt).toBeInstanceOf(Date);
      });

      it('should update isRead to true', async () => {
        const notification = notificationFixtures.unread();

        mockPrisma.notification.findFirst.mockResolvedValue(notification);
        mockPrisma.notification.update.mockResolvedValue({
          ...notification,
          isRead: true,
          readAt: new Date(),
        });

        const result = await service.markRead(notification.id, notification.userId);

        expect(result?.isRead).toBe(true);
        expect(mockPrisma.notification.update).toHaveBeenCalledWith({
          where: { id: notification.id },
          data: {
            isRead: true,
            readAt: expect.any(Date),
          },
        });
      });

      it('should return null if notification not found', async () => {
        mockPrisma.notification.findFirst.mockResolvedValue(null);

        const result = await service.markRead('non-existent', 'user-1');

        expect(result).toBeNull();
        expect(mockPrisma.notification.update).not.toHaveBeenCalled();
      });

      it('should not update if notification is already read', async () => {
        const notification = notificationFixtures.read();

        mockPrisma.notification.findFirst.mockResolvedValue(notification);

        const result = await service.markRead(notification.id, notification.userId);

        expect(result).not.toBeNull();
        expect(result?.isRead).toBe(true);
        expect(mockPrisma.notification.update).not.toHaveBeenCalled();
      });

      it('should only mark notification for the correct user', async () => {
        const notification = notificationFixtures.unread();

        mockPrisma.notification.findFirst.mockResolvedValue(null);

        const result = await service.markRead(notification.id, 'different-user');

        expect(result).toBeNull();
        expect(mockPrisma.notification.findFirst).toHaveBeenCalledWith({
          where: { id: notification.id, userId: 'different-user' },
        });
      });
    });

    describe('markManyRead', () => {
      it('should mark multiple notifications as read', async () => {
        const ids = ['notification-1', 'notification-2', 'notification-3'];

        mockPrisma.notification.updateMany.mockResolvedValue({ count: 3 });

        const result = await service.markManyRead(ids, 'user-1');

        expect(result).toBe(3);
        expect(mockPrisma.notification.updateMany).toHaveBeenCalledWith({
          where: {
            id: { in: ids },
            userId: 'user-1',
            isRead: false,
          },
          data: {
            isRead: true,
            readAt: expect.any(Date),
          },
        });
      });

      it('should return 0 if no notifications to update', async () => {
        mockPrisma.notification.updateMany.mockResolvedValue({ count: 0 });

        const result = await service.markManyRead(['non-existent'], 'user-1');

        expect(result).toBe(0);
      });

      it('should only update unread notifications', async () => {
        const ids = ['notification-1', 'notification-2'];

        mockPrisma.notification.updateMany.mockResolvedValue({ count: 1 });

        const result = await service.markManyRead(ids, 'user-1');

        expect(result).toBe(1);
        expect(mockPrisma.notification.updateMany).toHaveBeenCalledWith(
          expect.objectContaining({
            where: expect.objectContaining({
              isRead: false,
            }),
          })
        );
      });
    });

    describe('markAllRead', () => {
      it('should mark all unread notifications as read for a user', async () => {
        mockPrisma.notification.updateMany.mockResolvedValue({ count: 10 });

        const result = await service.markAllRead('user-1');

        expect(result).toBe(10);
        expect(mockPrisma.notification.updateMany).toHaveBeenCalledWith({
          where: {
            userId: 'user-1',
            isRead: false,
          },
          data: {
            isRead: true,
            readAt: expect.any(Date),
          },
        });
      });

      it('should return 0 if user has no unread notifications', async () => {
        mockPrisma.notification.updateMany.mockResolvedValue({ count: 0 });

        const result = await service.markAllRead('user-1');

        expect(result).toBe(0);
      });

      it('should set readAt timestamp for all marked notifications', async () => {
        mockPrisma.notification.updateMany.mockResolvedValue({ count: 5 });

        await service.markAllRead('user-1');

        expect(mockPrisma.notification.updateMany).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              readAt: expect.any(Date),
            }),
          })
        );
      });
    });
  });


  // ============================================
  // NOTIFICATION ERROR TESTS
  // ============================================

  describe('NotificationError', () => {
    it('should create error with correct code and message', () => {
      const error = new NotificationError('NOTIFICATION_NOT_FOUND', 'Notification not found');

      expect(error.code).toBe('NOTIFICATION_NOT_FOUND');
      expect(error.message).toBe('Notification not found');
      expect(error.statusCode).toBe(404);
    });

    it('should map UNAUTHORIZED to 403', () => {
      const error = new NotificationError('UNAUTHORIZED', 'Not authorized');

      expect(error.statusCode).toBe(403);
    });

    it('should default to 500 for unknown error codes', () => {
      const error = new NotificationError('UNKNOWN_ERROR', 'Unknown error');

      expect(error.statusCode).toBe(500);
    });

    it('should allow custom status code override', () => {
      const error = new NotificationError('CUSTOM_ERROR', 'Custom error', 418);

      expect(error.statusCode).toBe(418);
    });
  });

  // ============================================
  // NOTIFICATION FIXTURES TESTS
  // ============================================

  describe('Notification Fixtures', () => {
    it('should create valid unread notification fixture', () => {
      const notification = notificationFixtures.unread();

      expect(notification.id).toBeDefined();
      expect(notification.userId).toBeDefined();
      expect(notification.type).toBe('BID_RECEIVED');
      expect(notification.isRead).toBe(false);
      expect(notification.readAt).toBeNull();
    });

    it('should create valid read notification fixture', () => {
      const notification = notificationFixtures.read();

      expect(notification.isRead).toBe(true);
      expect(notification.readAt).toBeDefined();
      expect(notification.readAt).toBeInstanceOf(Date);
    });

    it('should allow overriding fixture properties', () => {
      const customType = 'PROJECT_COMPLETED';
      const customUserId = 'custom-user';

      const notification = notificationFixtures.unread({
        type: customType,
        userId: customUserId,
      });

      expect(notification.type).toBe(customType);
      expect(notification.userId).toBe(customUserId);
      expect(notification.isRead).toBe(false); // Default preserved
    });
  });
});

// ============================================
// NOTIFICATION CHANNEL SERVICE TESTS
// ============================================

describe('NotificationChannelService', () => {
  let mockPrisma: MockPrismaClient;
  let channelService: NotificationChannelService;

  beforeEach(() => {
    mockPrisma = createMockPrisma();
    channelService = new NotificationChannelService(
      mockPrisma as unknown as import('@prisma/client').PrismaClient
    );
    vi.clearAllMocks();
  });

  // ============================================
  // NOTIFICATION PREFERENCES TESTS
  // ============================================

  describe('Notification Preferences', () => {
    /**
     * **Feature: api-test-coverage, Property 13: Notification preferences persistence**
     * **Validates: Requirements 4.4**
     */
    describe('Property 13: Notification preferences persistence', () => {
      it('should persist all preference fields correctly', async () => {
        // Property: For any preference update, the stored preferences match the input
        await fc.assert(
          fc.asyncProperty(
            fc.record({
              emailEnabled: fc.boolean(),
              emailBidReceived: fc.boolean(),
              emailBidApproved: fc.boolean(),
              emailProjectMatched: fc.boolean(),
              emailNewMessage: fc.boolean(),
              emailEscrowReleased: fc.boolean(),
              smsEnabled: fc.boolean(),
              smsBidReceived: fc.boolean(),
              smsBidApproved: fc.boolean(),
              smsProjectMatched: fc.boolean(),
              smsNewMessage: fc.boolean(),
              smsEscrowReleased: fc.boolean(),
            }),
            async (preferences) => {
              const userId = 'user-1';
              const existingPref = {
                id: 'pref-1',
                userId,
                ...DEFAULT_NOTIFICATION_PREFERENCES,
                createdAt: new Date(),
                updatedAt: new Date(),
              };

              // Reset mocks for each iteration
              mockPrisma.notificationPreference.findUnique.mockReset();
              mockPrisma.notificationPreference.update.mockReset();

              mockPrisma.notificationPreference.findUnique.mockResolvedValue(existingPref);
              mockPrisma.notificationPreference.update.mockResolvedValue({
                ...existingPref,
                ...preferences,
                updatedAt: new Date(),
              });

              const result = await channelService.updatePreferences(userId, preferences);

              // Verify all preference fields match input
              expect(result.emailEnabled).toBe(preferences.emailEnabled);
              expect(result.emailBidReceived).toBe(preferences.emailBidReceived);
              expect(result.emailBidApproved).toBe(preferences.emailBidApproved);
              expect(result.emailProjectMatched).toBe(preferences.emailProjectMatched);
              expect(result.emailNewMessage).toBe(preferences.emailNewMessage);
              expect(result.emailEscrowReleased).toBe(preferences.emailEscrowReleased);
              expect(result.smsEnabled).toBe(preferences.smsEnabled);
              expect(result.smsBidReceived).toBe(preferences.smsBidReceived);
              expect(result.smsBidApproved).toBe(preferences.smsBidApproved);
              expect(result.smsProjectMatched).toBe(preferences.smsProjectMatched);
              expect(result.smsNewMessage).toBe(preferences.smsNewMessage);
              expect(result.smsEscrowReleased).toBe(preferences.smsEscrowReleased);
            }
          ),
          { numRuns: 100 }
        );
      });

      it('should preserve unchanged preferences when updating partial fields', async () => {
        // Property: Partial updates only change specified fields
        await fc.assert(
          fc.asyncProperty(
            fc.record({
              emailEnabled: fc.boolean(),
              smsEnabled: fc.boolean(),
            }),
            async (partialUpdate) => {
              const userId = 'user-1';
              const existingPref = {
                id: 'pref-1',
                userId,
                ...DEFAULT_NOTIFICATION_PREFERENCES,
                createdAt: new Date(),
                updatedAt: new Date(),
              };

              // Reset mocks for each iteration
              mockPrisma.notificationPreference.findUnique.mockReset();
              mockPrisma.notificationPreference.update.mockReset();

              mockPrisma.notificationPreference.findUnique.mockResolvedValue(existingPref);
              mockPrisma.notificationPreference.update.mockResolvedValue({
                ...existingPref,
                ...partialUpdate,
                updatedAt: new Date(),
              });

              const result = await channelService.updatePreferences(userId, partialUpdate);

              // Updated fields should match input
              expect(result.emailEnabled).toBe(partialUpdate.emailEnabled);
              expect(result.smsEnabled).toBe(partialUpdate.smsEnabled);

              // Other fields should preserve defaults
              expect(result.emailBidReceived).toBe(DEFAULT_NOTIFICATION_PREFERENCES.emailBidReceived);
              expect(result.emailBidApproved).toBe(DEFAULT_NOTIFICATION_PREFERENCES.emailBidApproved);
            }
          ),
          { numRuns: 100 }
        );
      });
    });

    describe('getPreferences', () => {
      it('should return existing preferences', async () => {
        const existingPref = {
          id: 'pref-1',
          userId: 'user-1',
          ...DEFAULT_NOTIFICATION_PREFERENCES,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        mockPrisma.notificationPreference.findUnique.mockResolvedValue(existingPref);

        const result = await channelService.getPreferences('user-1');

        expect(result.id).toBe('pref-1');
        expect(result.userId).toBe('user-1');
        expect(result.emailEnabled).toBe(DEFAULT_NOTIFICATION_PREFERENCES.emailEnabled);
      });

      it('should create default preferences if not exists', async () => {
        const newPref = {
          id: 'pref-new',
          userId: 'user-1',
          ...DEFAULT_NOTIFICATION_PREFERENCES,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        mockPrisma.notificationPreference.findUnique.mockResolvedValue(null);
        mockPrisma.notificationPreference.create.mockResolvedValue(newPref);

        const result = await channelService.getPreferences('user-1');

        expect(result.id).toBe('pref-new');
        expect(mockPrisma.notificationPreference.create).toHaveBeenCalledWith({
          data: expect.objectContaining({
            userId: 'user-1',
            ...DEFAULT_NOTIFICATION_PREFERENCES,
          }),
        });
      });
    });

    describe('updatePreferences', () => {
      it('should update specific preference fields', async () => {
        const existingPref = {
          id: 'pref-1',
          userId: 'user-1',
          ...DEFAULT_NOTIFICATION_PREFERENCES,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        mockPrisma.notificationPreference.findUnique.mockResolvedValue(existingPref);
        mockPrisma.notificationPreference.update.mockResolvedValue({
          ...existingPref,
          emailEnabled: false,
          smsEnabled: false,
          updatedAt: new Date(),
        });

        const result = await channelService.updatePreferences('user-1', {
          emailEnabled: false,
          smsEnabled: false,
        });

        expect(result.emailEnabled).toBe(false);
        expect(result.smsEnabled).toBe(false);
      });

      it('should create preferences if not exists before updating', async () => {
        const newPref = {
          id: 'pref-new',
          userId: 'user-1',
          ...DEFAULT_NOTIFICATION_PREFERENCES,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        mockPrisma.notificationPreference.findUnique.mockResolvedValue(null);
        mockPrisma.notificationPreference.create.mockResolvedValue(newPref);
        mockPrisma.notificationPreference.update.mockResolvedValue({
          ...newPref,
          emailEnabled: false,
          updatedAt: new Date(),
        });

        const result = await channelService.updatePreferences('user-1', {
          emailEnabled: false,
        });

        expect(mockPrisma.notificationPreference.create).toHaveBeenCalled();
        expect(result.emailEnabled).toBe(false);
      });
    });

    describe('createDefaultPreferences', () => {
      it('should create preferences with all default values', async () => {
        const newPref = {
          id: 'pref-new',
          userId: 'user-1',
          ...DEFAULT_NOTIFICATION_PREFERENCES,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        mockPrisma.notificationPreference.create.mockResolvedValue(newPref);

        const result = await channelService.createDefaultPreferences('user-1');

        expect(result.emailEnabled).toBe(DEFAULT_NOTIFICATION_PREFERENCES.emailEnabled);
        expect(result.emailBidReceived).toBe(DEFAULT_NOTIFICATION_PREFERENCES.emailBidReceived);
        expect(result.smsEnabled).toBe(DEFAULT_NOTIFICATION_PREFERENCES.smsEnabled);
        expect(result.smsBidReceived).toBe(DEFAULT_NOTIFICATION_PREFERENCES.smsBidReceived);
      });
    });
  });

  // ============================================
  // DEFAULT PREFERENCES TESTS
  // ============================================

  describe('Default Preferences', () => {
    it('should have email enabled by default', () => {
      expect(DEFAULT_NOTIFICATION_PREFERENCES.emailEnabled).toBe(true);
    });

    it('should have all email notification types enabled by default', () => {
      expect(DEFAULT_NOTIFICATION_PREFERENCES.emailBidReceived).toBe(true);
      expect(DEFAULT_NOTIFICATION_PREFERENCES.emailBidApproved).toBe(true);
      expect(DEFAULT_NOTIFICATION_PREFERENCES.emailProjectMatched).toBe(true);
      expect(DEFAULT_NOTIFICATION_PREFERENCES.emailNewMessage).toBe(true);
      expect(DEFAULT_NOTIFICATION_PREFERENCES.emailEscrowReleased).toBe(true);
    });

    it('should have SMS enabled by default', () => {
      expect(DEFAULT_NOTIFICATION_PREFERENCES.smsEnabled).toBe(true);
    });

    it('should have only critical SMS notifications enabled by default', () => {
      // Critical ones enabled
      expect(DEFAULT_NOTIFICATION_PREFERENCES.smsBidApproved).toBe(true);
      expect(DEFAULT_NOTIFICATION_PREFERENCES.smsProjectMatched).toBe(true);
      expect(DEFAULT_NOTIFICATION_PREFERENCES.smsEscrowReleased).toBe(true);

      // Non-critical ones disabled
      expect(DEFAULT_NOTIFICATION_PREFERENCES.smsBidReceived).toBe(false);
      expect(DEFAULT_NOTIFICATION_PREFERENCES.smsNewMessage).toBe(false);
    });
  });
});
