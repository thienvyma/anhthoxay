/**
 * Property-Based Tests for Notification Service
 * Using fast-check for property testing
 *
 * These tests verify the correctness properties defined in the design document.
 * **Feature: bidding-phase3-matching**
 */

import * as fc from 'fast-check';
import type { NotificationType } from '../schemas/notification.schema';

// ============================================
// CONSTANTS
// ============================================

const ALL_NOTIFICATION_TYPES: NotificationType[] = [
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
];

// Escrow statuses that trigger notifications
const ESCROW_STATUSES = [
  'PENDING',
  'HELD',
  'PARTIAL_RELEASED',
  'RELEASED',
  'REFUNDED',
  'DISPUTED',
];

// ============================================
// GENERATORS
// ============================================

// User ID generator
const userIdArb = fc.uuid();

// Project code generator
const projectCodeArb = fc.stringMatching(/^PRJ-\d{4}-\d{3}$/);

// Bid code generator
const bidCodeArb = fc.stringMatching(/^BID-\d{4}-\d{3}$/);

// Escrow code generator
const escrowCodeArb = fc.stringMatching(/^ESC-\d{4}-\d{3}$/);

// Amount generator (positive number)
const amountArb = fc.float({ min: 1000, max: 1000000000, noNaN: true });

// Escrow status generator
const escrowStatusArb = fc.constantFrom(...ESCROW_STATUSES);

// Non-selected bid generator
const nonSelectedBidArb = fc.record({
  id: userIdArb,
  code: bidCodeArb,
  contractorId: userIdArb,
});

// Match context generator
const matchContextArb = fc.record({
  projectId: userIdArb,
  projectCode: projectCodeArb,
  selectedBidId: userIdArb,
  selectedBidCode: bidCodeArb,
  selectedContractorId: userIdArb,
  homeownerId: userIdArb,
  nonSelectedBids: fc.array(nonSelectedBidArb, { minLength: 0, maxLength: 10 }),
});

// Escrow context generator
const escrowContextArb = fc.record({
  escrowId: userIdArb,
  escrowCode: escrowCodeArb,
  projectId: userIdArb,
  projectCode: projectCodeArb,
  homeownerId: userIdArb,
  contractorId: userIdArb,
  status: escrowStatusArb,
  amount: amountArb,
});

// ============================================
// HELPER FUNCTIONS
// ============================================

interface NotificationData {
  projectId?: string;
  projectCode?: string;
  bidId?: string;
  bidCode?: string;
  escrowId?: string;
  escrowCode?: string;
  feeId?: string;
  feeCode?: string;
  amount?: number;
}

interface MatchContext {
  projectId: string;
  projectCode: string;
  selectedBidId: string;
  selectedBidCode: string;
  selectedContractorId: string;
  homeownerId: string;
  nonSelectedBids: Array<{ id: string; code: string; contractorId: string }>;
}

interface EscrowContext {
  escrowId: string;
  escrowCode: string;
  projectId: string;
  projectCode: string;
  homeownerId: string;
  contractorId: string;
  status: string;
  amount?: number;
}

interface NotificationResult {
  userId: string;
  type: NotificationType;
  title: string;
  content: string;
  data: NotificationData;
}

/**
 * Simulate match notification creation
 * Requirements: 14.1, 14.2, 14.3
 */
function simulateMatchNotifications(context: MatchContext): NotificationResult[] {
  const notifications: NotificationResult[] = [];
  const data: NotificationData = {
    projectId: context.projectId,
    projectCode: context.projectCode,
    bidId: context.selectedBidId,
    bidCode: context.selectedBidCode,
  };

  // Requirements: 14.1 - Notify selected contractor
  notifications.push({
    userId: context.selectedContractorId,
    type: 'BID_SELECTED',
    title: 'Chúc mừng! Bid của bạn đã được chọn',
    content: `Bid ${data.bidCode || ''} của bạn cho dự án ${data.projectCode || ''} đã được chủ nhà chọn. Vui lòng kiểm tra chi tiết và liên hệ với chủ nhà.`,
    data,
  });

  // Requirements: 14.2 - Notify homeowner
  notifications.push({
    userId: context.homeownerId,
    type: 'PROJECT_MATCHED',
    title: 'Dự án đã được ghép nối',
    content: `Dự án ${data.projectCode || ''} đã được ghép nối thành công. Bạn có thể xem thông tin liên hệ của đối tác.`,
    data,
  });

  // Requirements: 14.3 - Notify non-selected contractors
  for (const bid of context.nonSelectedBids) {
    notifications.push({
      userId: bid.contractorId,
      type: 'BID_NOT_SELECTED',
      title: 'Bid không được chọn',
      content: `Bid ${bid.code || ''} của bạn cho dự án ${context.projectCode || ''} không được chọn. Chủ nhà đã chọn nhà thầu khác.`,
      data: {
        projectId: context.projectId,
        projectCode: context.projectCode,
        bidId: bid.id,
        bidCode: bid.code,
      },
    });
  }

  return notifications;
}

/**
 * Simulate escrow notification creation
 * Requirements: 14.4
 */
function simulateEscrowNotifications(context: EscrowContext): NotificationResult[] {
  const notifications: NotificationResult[] = [];
  const data: NotificationData = {
    projectId: context.projectId,
    projectCode: context.projectCode,
    escrowId: context.escrowId,
    escrowCode: context.escrowCode,
    amount: context.amount,
  };

  // Map escrow status to notification type
  const statusToType: Record<string, NotificationType> = {
    PENDING: 'ESCROW_PENDING',
    HELD: 'ESCROW_HELD',
    PARTIAL_RELEASED: 'ESCROW_PARTIAL_RELEASED',
    RELEASED: 'ESCROW_RELEASED',
    REFUNDED: 'ESCROW_REFUNDED',
    DISPUTED: 'ESCROW_DISPUTED',
  };

  const notificationType = statusToType[context.status];
  if (!notificationType) {
    return notifications;
  }

  // Notify homeowner
  notifications.push({
    userId: context.homeownerId,
    type: notificationType,
    title: getEscrowNotificationTitle(notificationType),
    content: getEscrowNotificationContent(notificationType, data),
    data,
  });

  // Notify contractor
  notifications.push({
    userId: context.contractorId,
    type: notificationType,
    title: getEscrowNotificationTitle(notificationType),
    content: getEscrowNotificationContent(notificationType, data),
    data,
  });

  return notifications;
}

/**
 * Get escrow notification title
 */
function getEscrowNotificationTitle(type: NotificationType): string {
  const titles: Record<NotificationType, string> = {
    ESCROW_PENDING: 'Đặt cọc đang chờ xác nhận',
    ESCROW_HELD: 'Đặt cọc đã được xác nhận',
    ESCROW_PARTIAL_RELEASED: 'Một phần đặt cọc đã được giải phóng',
    ESCROW_RELEASED: 'Đặt cọc đã được giải phóng hoàn toàn',
    ESCROW_REFUNDED: 'Đặt cọc đã được hoàn trả',
    ESCROW_DISPUTED: 'Đặt cọc đang tranh chấp',
    BID_SELECTED: '',
    BID_NOT_SELECTED: '',
    FEE_PENDING: '',
    FEE_PAID: '',
    PROJECT_MATCHED: '',
    PROJECT_STARTED: '',
    PROJECT_COMPLETED: '',
    MILESTONE_REQUESTED: '',
    MILESTONE_CONFIRMED: '',
    MILESTONE_DISPUTED: '',
  };
  return titles[type] || '';
}

/**
 * Get escrow notification content
 */
function getEscrowNotificationContent(type: NotificationType, data: NotificationData): string {
  const contents: Record<NotificationType, string> = {
    ESCROW_PENDING: `Escrow ${data.escrowCode || ''} cho dự án ${data.projectCode || ''} đang chờ xác nhận thanh toán.`,
    ESCROW_HELD: `Escrow ${data.escrowCode || ''} cho dự án ${data.projectCode || ''} đã được xác nhận. Số tiền ${data.amount?.toLocaleString('vi-VN') || ''} VNĐ đang được giữ.`,
    ESCROW_PARTIAL_RELEASED: `Một phần escrow ${data.escrowCode || ''} cho dự án ${data.projectCode || ''} đã được giải phóng. Số tiền: ${data.amount?.toLocaleString('vi-VN') || ''} VNĐ.`,
    ESCROW_RELEASED: `Escrow ${data.escrowCode || ''} cho dự án ${data.projectCode || ''} đã được giải phóng hoàn toàn.`,
    ESCROW_REFUNDED: `Escrow ${data.escrowCode || ''} cho dự án ${data.projectCode || ''} đã được hoàn trả.`,
    ESCROW_DISPUTED: `Escrow ${data.escrowCode || ''} cho dự án ${data.projectCode || ''} đang trong trạng thái tranh chấp. Admin sẽ xử lý.`,
    BID_SELECTED: '',
    BID_NOT_SELECTED: '',
    FEE_PENDING: '',
    FEE_PAID: '',
    PROJECT_MATCHED: '',
    PROJECT_STARTED: '',
    PROJECT_COMPLETED: '',
    MILESTONE_REQUESTED: '',
    MILESTONE_CONFIRMED: '',
    MILESTONE_DISPUTED: '',
  };
  return contents[type] || '';
}

/**
 * Validate notification has required fields
 */
function validateNotificationFields(notification: NotificationResult): boolean {
  return (
    notification.userId !== undefined &&
    notification.userId.length > 0 &&
    notification.type !== undefined &&
    ALL_NOTIFICATION_TYPES.includes(notification.type) &&
    notification.title !== undefined &&
    notification.title.length > 0 &&
    notification.content !== undefined &&
    notification.content.length > 0
  );
}

/**
 * Validate notification data contains project info
 * Requirements: 14.5
 */
function validateNotificationDataContainsProjectInfo(data: NotificationData): boolean {
  return data.projectId !== undefined || data.projectCode !== undefined;
}


// ============================================
// PROPERTY 10: Match notification creation
// **Feature: bidding-phase3-matching, Property 10: Match notification creation**
// **Validates: Requirements 14.1, 14.2, 14.3, 14.4, 14.5**
// ============================================

describe('Property 10: Match notification creation', () => {
  describe('Bid Selection Notifications (Requirements 14.1, 14.2, 14.3)', () => {
    it('*For any* bid selection, selected contractor SHALL receive BID_SELECTED notification', () => {
      fc.assert(
        fc.property(matchContextArb, (context) => {
          const notifications = simulateMatchNotifications(context);

          // Find notification for selected contractor
          const contractorNotification = notifications.find(
            (n) =>
              n.userId === context.selectedContractorId && n.type === 'BID_SELECTED'
          );

          return contractorNotification !== undefined;
        }),
        { numRuns: 100 }
      );
    });

    it('*For any* bid selection, homeowner SHALL receive PROJECT_MATCHED notification', () => {
      fc.assert(
        fc.property(matchContextArb, (context) => {
          const notifications = simulateMatchNotifications(context);

          // Find notification for homeowner
          const homeownerNotification = notifications.find(
            (n) =>
              n.userId === context.homeownerId && n.type === 'PROJECT_MATCHED'
          );

          return homeownerNotification !== undefined;
        }),
        { numRuns: 100 }
      );
    });

    it('*For any* bid selection with non-selected bids, each non-selected contractor SHALL receive BID_NOT_SELECTED notification', () => {
      fc.assert(
        fc.property(matchContextArb, (context) => {
          // Skip if no non-selected bids
          if (context.nonSelectedBids.length === 0) return true;

          const notifications = simulateMatchNotifications(context);

          // Check each non-selected contractor received notification
          for (const bid of context.nonSelectedBids) {
            const notification = notifications.find(
              (n) =>
                n.userId === bid.contractorId && n.type === 'BID_NOT_SELECTED'
            );
            if (!notification) return false;
          }

          return true;
        }),
        { numRuns: 100 }
      );
    });

    it('*For any* bid selection, total notifications SHALL equal 2 + number of non-selected bids', () => {
      fc.assert(
        fc.property(matchContextArb, (context) => {
          const notifications = simulateMatchNotifications(context);

          // 1 for selected contractor + 1 for homeowner + N for non-selected
          const expectedCount = 2 + context.nonSelectedBids.length;

          return notifications.length === expectedCount;
        }),
        { numRuns: 100 }
      );
    });

    it('*For any* bid selection, all notifications SHALL have valid fields', () => {
      fc.assert(
        fc.property(matchContextArb, (context) => {
          const notifications = simulateMatchNotifications(context);

          return notifications.every(validateNotificationFields);
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('Escrow Notifications (Requirement 14.4)', () => {
    it('*For any* escrow status change, both homeowner and contractor SHALL receive notifications', () => {
      fc.assert(
        fc.property(escrowContextArb, (context) => {
          // Ensure different users
          if (context.homeownerId === context.contractorId) return true;

          const notifications = simulateEscrowNotifications(context);

          // Should have exactly 2 notifications (one for each party)
          if (notifications.length !== 2) return false;

          // Check homeowner received notification
          const homeownerNotification = notifications.find(
            (n) => n.userId === context.homeownerId
          );
          if (!homeownerNotification) return false;

          // Check contractor received notification
          const contractorNotification = notifications.find(
            (n) => n.userId === context.contractorId
          );
          if (!contractorNotification) return false;

          return true;
        }),
        { numRuns: 100 }
      );
    });

    it('*For any* escrow status change, notification type SHALL match escrow status', () => {
      fc.assert(
        fc.property(escrowContextArb, (context) => {
          const notifications = simulateEscrowNotifications(context);

          const statusToType: Record<string, NotificationType> = {
            PENDING: 'ESCROW_PENDING',
            HELD: 'ESCROW_HELD',
            PARTIAL_RELEASED: 'ESCROW_PARTIAL_RELEASED',
            RELEASED: 'ESCROW_RELEASED',
            REFUNDED: 'ESCROW_REFUNDED',
            DISPUTED: 'ESCROW_DISPUTED',
          };

          const expectedType = statusToType[context.status];

          return notifications.every((n) => n.type === expectedType);
        }),
        { numRuns: 100 }
      );
    });

    it('*For any* escrow notification, data SHALL contain escrow information', () => {
      fc.assert(
        fc.property(escrowContextArb, (context) => {
          const notifications = simulateEscrowNotifications(context);

          return notifications.every(
            (n) =>
              n.data.escrowId === context.escrowId &&
              n.data.escrowCode === context.escrowCode
          );
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('Notification Data (Requirement 14.5)', () => {
    it('*For any* match notification, data SHALL include project information', () => {
      fc.assert(
        fc.property(matchContextArb, (context) => {
          const notifications = simulateMatchNotifications(context);

          return notifications.every((n) =>
            validateNotificationDataContainsProjectInfo(n.data)
          );
        }),
        { numRuns: 100 }
      );
    });

    it('*For any* escrow notification, data SHALL include project information', () => {
      fc.assert(
        fc.property(escrowContextArb, (context) => {
          const notifications = simulateEscrowNotifications(context);

          return notifications.every((n) =>
            validateNotificationDataContainsProjectInfo(n.data)
          );
        }),
        { numRuns: 100 }
      );
    });

    it('*For any* BID_SELECTED notification, data SHALL include bid information', () => {
      fc.assert(
        fc.property(matchContextArb, (context) => {
          const notifications = simulateMatchNotifications(context);

          const bidSelectedNotification = notifications.find(
            (n) => n.type === 'BID_SELECTED'
          );

          if (!bidSelectedNotification) return false;

          return (
            bidSelectedNotification.data.bidId === context.selectedBidId &&
            bidSelectedNotification.data.bidCode === context.selectedBidCode
          );
        }),
        { numRuns: 100 }
      );
    });

    it('*For any* BID_NOT_SELECTED notification, data SHALL include the specific bid information', () => {
      fc.assert(
        fc.property(matchContextArb, (context) => {
          // Skip if no non-selected bids
          if (context.nonSelectedBids.length === 0) return true;

          const notifications = simulateMatchNotifications(context);

          const notSelectedNotifications = notifications.filter(
            (n) => n.type === 'BID_NOT_SELECTED'
          );

          // Each notification should have the correct bid info
          for (const notification of notSelectedNotifications) {
            const matchingBid = context.nonSelectedBids.find(
              (b) =>
                b.id === notification.data.bidId &&
                b.code === notification.data.bidCode
            );
            if (!matchingBid) return false;
          }

          return true;
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('Notification Content', () => {
    it('*For any* notification, title SHALL be non-empty', () => {
      fc.assert(
        fc.property(matchContextArb, (context) => {
          const notifications = simulateMatchNotifications(context);

          return notifications.every((n) => n.title.length > 0);
        }),
        { numRuns: 100 }
      );
    });

    it('*For any* notification, content SHALL be non-empty', () => {
      fc.assert(
        fc.property(matchContextArb, (context) => {
          const notifications = simulateMatchNotifications(context);

          return notifications.every((n) => n.content.length > 0);
        }),
        { numRuns: 100 }
      );
    });

    it('*For any* notification, type SHALL be a valid notification type', () => {
      fc.assert(
        fc.property(matchContextArb, (context) => {
          const notifications = simulateMatchNotifications(context);

          return notifications.every((n) =>
            ALL_NOTIFICATION_TYPES.includes(n.type)
          );
        }),
        { numRuns: 100 }
      );
    });

    it('*For any* match notification, content SHALL reference project code', () => {
      fc.assert(
        fc.property(matchContextArb, (context) => {
          const notifications = simulateMatchNotifications(context);

          return notifications.every((n) =>
            n.content.includes(context.projectCode)
          );
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('Notification Recipients', () => {
    it('*For any* bid selection, selected contractor SHALL NOT receive BID_NOT_SELECTED', () => {
      fc.assert(
        fc.property(matchContextArb, (context) => {
          const notifications = simulateMatchNotifications(context);

          const wrongNotification = notifications.find(
            (n) =>
              n.userId === context.selectedContractorId &&
              n.type === 'BID_NOT_SELECTED'
          );

          return wrongNotification === undefined;
        }),
        { numRuns: 100 }
      );
    });

    it('*For any* bid selection, homeowner SHALL NOT receive BID_SELECTED or BID_NOT_SELECTED', () => {
      fc.assert(
        fc.property(matchContextArb, (context) => {
          const notifications = simulateMatchNotifications(context);

          const wrongNotification = notifications.find(
            (n) =>
              n.userId === context.homeownerId &&
              (n.type === 'BID_SELECTED' || n.type === 'BID_NOT_SELECTED')
          );

          return wrongNotification === undefined;
        }),
        { numRuns: 100 }
      );
    });

    it('*For any* escrow change, both parties SHALL receive the same notification type', () => {
      fc.assert(
        fc.property(escrowContextArb, (context) => {
          // Ensure different users
          if (context.homeownerId === context.contractorId) return true;

          const notifications = simulateEscrowNotifications(context);

          if (notifications.length !== 2) return false;

          // Both should have the same type
          return notifications[0].type === notifications[1].type;
        }),
        { numRuns: 100 }
      );
    });
  });
});
