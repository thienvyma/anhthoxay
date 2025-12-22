/**
 * Property-Based Tests for Notification Channel Service
 *
 * **Feature: bidding-phase4-communication**
 * **Properties: 7, 8**
 */

import * as fc from 'fast-check';
import { describe, it, expect } from 'vitest';

// ============================================
// NOTIFICATION TYPES
// ============================================

const NOTIFICATION_TYPES = [
  'BID_RECEIVED',
  'BID_SELECTED',
  'BID_NOT_SELECTED',
  'PROJECT_MATCHED',
  'NEW_MESSAGE',
  'ESCROW_HELD',
  'ESCROW_RELEASED',
  'ESCROW_REFUNDED',
] as const;

type NotificationType = (typeof NOTIFICATION_TYPES)[number];

// ============================================
// Type Definitions (isolated for testing)
// ============================================

interface NotificationPreference {
  id: string;
  userId: string;
  emailEnabled: boolean;
  emailBidReceived: boolean;
  emailBidApproved: boolean;
  emailProjectMatched: boolean;
  emailNewMessage: boolean;
  emailEscrowReleased: boolean;
  smsEnabled: boolean;
  smsBidReceived: boolean;
  smsBidApproved: boolean;
  smsProjectMatched: boolean;
  smsNewMessage: boolean;
  smsEscrowReleased: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// Default Preferences (matching schema)
// ============================================

const DEFAULT_NOTIFICATION_PREFERENCES = {
  // Email notifications - mostly enabled by default
  emailEnabled: true,
  emailBidReceived: true,
  emailBidApproved: true,
  emailProjectMatched: true,
  emailNewMessage: true,
  emailEscrowReleased: true,

  // SMS notifications - only critical ones enabled by default
  smsEnabled: true,
  smsBidReceived: false,
  smsBidApproved: true,
  smsProjectMatched: true,
  smsNewMessage: false,
  smsEscrowReleased: true,
} as const;

// ============================================
// Business Logic (isolated for testing)
// ============================================

/**
 * Simulates creating default notification preferences for a new user
 * Requirements: 9.1 - Create default notification preferences
 */
function createDefaultPreferences(userId: string): NotificationPreference {
  const now = new Date();
  return {
    id: `pref_${userId}`,
    userId,
    ...DEFAULT_NOTIFICATION_PREFERENCES,
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Validates that a preference object has all required fields with correct types
 */
function isValidPreference(pref: NotificationPreference): boolean {
  // Check required string fields
  if (typeof pref.id !== 'string' || pref.id.length === 0) return false;
  if (typeof pref.userId !== 'string' || pref.userId.length === 0) return false;

  // Check all boolean fields exist and are booleans
  const booleanFields = [
    'emailEnabled',
    'emailBidReceived',
    'emailBidApproved',
    'emailProjectMatched',
    'emailNewMessage',
    'emailEscrowReleased',
    'smsEnabled',
    'smsBidReceived',
    'smsBidApproved',
    'smsProjectMatched',
    'smsNewMessage',
    'smsEscrowReleased',
  ] as const;

  for (const field of booleanFields) {
    if (typeof pref[field] !== 'boolean') return false;
  }

  // Check date fields
  if (!(pref.createdAt instanceof Date)) return false;
  if (!(pref.updatedAt instanceof Date)) return false;

  return true;
}

/**
 * Checks if preference matches default values
 */
function matchesDefaultValues(pref: NotificationPreference): boolean {
  return (
    pref.emailEnabled === DEFAULT_NOTIFICATION_PREFERENCES.emailEnabled &&
    pref.emailBidReceived === DEFAULT_NOTIFICATION_PREFERENCES.emailBidReceived &&
    pref.emailBidApproved === DEFAULT_NOTIFICATION_PREFERENCES.emailBidApproved &&
    pref.emailProjectMatched === DEFAULT_NOTIFICATION_PREFERENCES.emailProjectMatched &&
    pref.emailNewMessage === DEFAULT_NOTIFICATION_PREFERENCES.emailNewMessage &&
    pref.emailEscrowReleased === DEFAULT_NOTIFICATION_PREFERENCES.emailEscrowReleased &&
    pref.smsEnabled === DEFAULT_NOTIFICATION_PREFERENCES.smsEnabled &&
    pref.smsBidReceived === DEFAULT_NOTIFICATION_PREFERENCES.smsBidReceived &&
    pref.smsBidApproved === DEFAULT_NOTIFICATION_PREFERENCES.smsBidApproved &&
    pref.smsProjectMatched === DEFAULT_NOTIFICATION_PREFERENCES.smsProjectMatched &&
    pref.smsNewMessage === DEFAULT_NOTIFICATION_PREFERENCES.smsNewMessage &&
    pref.smsEscrowReleased === DEFAULT_NOTIFICATION_PREFERENCES.smsEscrowReleased
  );
}

// ============================================
// Simulated Preference Store (for testing)
// ============================================

interface PreferenceStore {
  preferences: Map<string, NotificationPreference>;
}

/**
 * Get or create preferences for a user
 * This simulates the getPreferences method behavior
 */
function getOrCreatePreferences(
  store: PreferenceStore,
  userId: string
): { preference: NotificationPreference; wasCreated: boolean } {
  const existing = store.preferences.get(userId);
  if (existing) {
    return { preference: existing, wasCreated: false };
  }

  const newPref = createDefaultPreferences(userId);
  store.preferences.set(userId, newPref);
  return { preference: newPref, wasCreated: true };
}

// ============================================
// Generators
// ============================================

const userId = fc.uuid();

const preferenceStore = fc.record({
  preferences: fc.array(
    fc.record({
      userId: userId,
      preference: fc.record({
        id: fc.uuid(),
        userId: userId,
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
        createdAt: fc.date(),
        updatedAt: fc.date(),
      }),
    }),
    { maxLength: 10 }
  ).map((arr) => {
    const map = new Map<string, NotificationPreference>();
    arr.forEach((item) => {
      // Ensure userId matches in preference
      const pref = { ...item.preference, userId: item.userId };
      map.set(item.userId, pref);
    });
    return map;
  }),
});

// Generator for notification type
const notificationType = fc.constantFrom(...NOTIFICATION_TYPES);

// Generator for notification preference
const notificationPreference = fc.record({
  id: fc.uuid(),
  userId: fc.uuid(),
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
  createdAt: fc.date(),
  updatedAt: fc.date(),
});

// Generator for notification channels
const notificationChannels = fc.subarray(['EMAIL', 'SMS', 'IN_APP'] as const, {
  minLength: 1,
});

// ============================================
// PROPERTY 8: Default Preference Creation
// Requirements: 9.1
// ============================================

describe('Property 8: Default Preference Creation', () => {
  /**
   * **Feature: bidding-phase4-communication, Property 8: Default Preference Creation**
   * **Validates: Requirements 9.1**
   */

  it('should create valid preference object for any user ID', () => {
    fc.assert(
      fc.property(userId, (uid) => {
        const pref = createDefaultPreferences(uid);
        return isValidPreference(pref);
      }),
      { numRuns: 100 }
    );
  });

  it('should set userId correctly in created preference', () => {
    fc.assert(
      fc.property(userId, (uid) => {
        const pref = createDefaultPreferences(uid);
        return pref.userId === uid;
      }),
      { numRuns: 100 }
    );
  });

  it('should apply default values for all preference fields', () => {
    fc.assert(
      fc.property(userId, (uid) => {
        const pref = createDefaultPreferences(uid);
        return matchesDefaultValues(pref);
      }),
      { numRuns: 100 }
    );
  });

  it('should create preferences with email enabled by default', () => {
    fc.assert(
      fc.property(userId, (uid) => {
        const pref = createDefaultPreferences(uid);
        return (
          pref.emailEnabled === true &&
          pref.emailBidReceived === true &&
          pref.emailBidApproved === true &&
          pref.emailProjectMatched === true &&
          pref.emailNewMessage === true &&
          pref.emailEscrowReleased === true
        );
      }),
      { numRuns: 100 }
    );
  });

  it('should create preferences with SMS enabled only for critical notifications', () => {
    fc.assert(
      fc.property(userId, (uid) => {
        const pref = createDefaultPreferences(uid);
        // SMS enabled overall
        expect(pref.smsEnabled).toBe(true);
        // Critical notifications enabled
        expect(pref.smsBidApproved).toBe(true);
        expect(pref.smsProjectMatched).toBe(true);
        expect(pref.smsEscrowReleased).toBe(true);
        // Non-critical notifications disabled
        expect(pref.smsBidReceived).toBe(false);
        expect(pref.smsNewMessage).toBe(false);
        return true;
      }),
      { numRuns: 100 }
    );
  });

  it('should set createdAt and updatedAt timestamps', () => {
    fc.assert(
      fc.property(userId, (uid) => {
        const before = new Date();
        const pref = createDefaultPreferences(uid);
        const after = new Date();

        // Timestamps should be within the test execution window
        return (
          pref.createdAt >= before &&
          pref.createdAt <= after &&
          pref.updatedAt >= before &&
          pref.updatedAt <= after
        );
      }),
      { numRuns: 100 }
    );
  });

  it('should create unique preference for each user', () => {
    fc.assert(
      fc.property(
        fc.array(userId, { minLength: 2, maxLength: 10 }),
        (userIds) => {
          const uniqueUserIds = [...new Set(userIds)];
          const preferences = uniqueUserIds.map((uid) =>
            createDefaultPreferences(uid)
          );

          // Each preference should have unique userId
          const prefUserIds = preferences.map((p) => p.userId);
          const uniquePrefUserIds = [...new Set(prefUserIds)];

          return prefUserIds.length === uniquePrefUserIds.length;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should create default preferences when user has no existing preferences', () => {
    fc.assert(
      fc.property(preferenceStore, userId, (store, uid) => {
        // Ensure user doesn't have preferences
        const storeWithoutUser: PreferenceStore = {
          preferences: new Map(
            [...store.preferences].filter(([id]) => id !== uid)
          ),
        };

        const { preference, wasCreated } = getOrCreatePreferences(
          storeWithoutUser,
          uid
        );

        // Should be created with default values
        return wasCreated === true && matchesDefaultValues(preference);
      }),
      { numRuns: 100 }
    );
  });

  it('should return existing preferences when user already has preferences', () => {
    fc.assert(
      fc.property(preferenceStore, (store) => {
        // Get a user that has preferences
        const existingUserIds = [...store.preferences.keys()];
        if (existingUserIds.length === 0) return true; // Skip if no users

        const uid = existingUserIds[0];
        const existingPref = store.preferences.get(uid);
        if (!existingPref) return true; // Skip if preference not found

        const { preference, wasCreated } = getOrCreatePreferences(store, uid);

        // Should return existing preference, not create new
        return (
          wasCreated === false &&
          preference.id === existingPref.id &&
          preference.userId === existingPref.userId
        );
      }),
      { numRuns: 100 }
    );
  });

  it('should ensure preference store grows by 1 when creating for new user', () => {
    fc.assert(
      fc.property(preferenceStore, userId, (store, uid) => {
        // Ensure user doesn't have preferences
        const storeWithoutUser: PreferenceStore = {
          preferences: new Map(
            [...store.preferences].filter(([id]) => id !== uid)
          ),
        };

        const sizeBefore = storeWithoutUser.preferences.size;
        getOrCreatePreferences(storeWithoutUser, uid);
        const sizeAfter = storeWithoutUser.preferences.size;

        return sizeAfter === sizeBefore + 1;
      }),
      { numRuns: 100 }
    );
  });

  it('should not modify store when getting existing preferences', () => {
    fc.assert(
      fc.property(preferenceStore, (store) => {
        // Get a user that has preferences
        const existingUserIds = [...store.preferences.keys()];
        if (existingUserIds.length === 0) return true; // Skip if no users

        const uid = existingUserIds[0];
        const sizeBefore = store.preferences.size;

        getOrCreatePreferences(store, uid);

        const sizeAfter = store.preferences.size;

        // Store size should not change
        return sizeBefore === sizeAfter;
      }),
      { numRuns: 100 }
    );
  });
});

// ============================================
// PROPERTY 7: Notification Preference Filtering
// Requirements: 9.3, 9.4
// ============================================

/**
 * Business logic for checking if email is enabled for a notification type
 * This mirrors the isEmailEnabledForType method in the service
 */
function isEmailEnabledForType(
  preferences: NotificationPreference,
  type: NotificationType
): boolean {
  // First check if email is globally enabled
  if (!preferences.emailEnabled) {
    return false;
  }

  // Then check type-specific preference
  const typeMap: Record<NotificationType, keyof NotificationPreference> = {
    BID_RECEIVED: 'emailBidReceived',
    BID_SELECTED: 'emailBidApproved',
    BID_NOT_SELECTED: 'emailBidApproved',
    PROJECT_MATCHED: 'emailProjectMatched',
    NEW_MESSAGE: 'emailNewMessage',
    ESCROW_HELD: 'emailEscrowReleased',
    ESCROW_RELEASED: 'emailEscrowReleased',
    ESCROW_REFUNDED: 'emailEscrowReleased',
  };

  const preferenceKey = typeMap[type];
  return preferences[preferenceKey] as boolean;
}

/**
 * Business logic for checking if SMS is enabled for a notification type
 * This mirrors the isSMSEnabledForType method in the service
 */
function isSMSEnabledForType(
  preferences: NotificationPreference,
  type: NotificationType
): boolean {
  // First check if SMS is globally enabled
  if (!preferences.smsEnabled) {
    return false;
  }

  // Then check type-specific preference
  const typeMap: Record<NotificationType, keyof NotificationPreference> = {
    BID_RECEIVED: 'smsBidReceived',
    BID_SELECTED: 'smsBidApproved',
    BID_NOT_SELECTED: 'smsBidApproved',
    PROJECT_MATCHED: 'smsProjectMatched',
    NEW_MESSAGE: 'smsNewMessage',
    ESCROW_HELD: 'smsEscrowReleased',
    ESCROW_RELEASED: 'smsEscrowReleased',
    ESCROW_REFUNDED: 'smsEscrowReleased',
  };

  const preferenceKey = typeMap[type];
  return preferences[preferenceKey] as boolean;
}

/**
 * Simulates the channel filtering logic from the send method
 * Returns which channels should actually receive the notification
 */
function filterChannelsByPreferences(
  preferences: NotificationPreference,
  type: NotificationType,
  requestedChannels: readonly ('EMAIL' | 'SMS' | 'IN_APP')[]
): { email: boolean; sms: boolean; inApp: boolean } {
  return {
    // IN_APP is always sent if requested (no preference filtering)
    inApp: requestedChannels.includes('IN_APP'),
    // EMAIL is sent only if requested AND enabled in preferences
    email:
      requestedChannels.includes('EMAIL') &&
      isEmailEnabledForType(preferences, type),
    // SMS is sent only if requested AND enabled in preferences
    sms:
      requestedChannels.includes('SMS') &&
      isSMSEnabledForType(preferences, type),
  };
}

describe('Property 7: Notification Preference Filtering', () => {
  /**
   * **Feature: bidding-phase4-communication, Property 7: Notification Preference Filtering**
   * **Validates: Requirements 9.3, 9.4**
   */

  it('should not send email when emailEnabled is false', () => {
    fc.assert(
      fc.property(
        notificationPreference,
        notificationType,
        notificationChannels,
        (pref, type, channels) => {
          // Force emailEnabled to false
          const prefWithEmailDisabled = { ...pref, emailEnabled: false };

          const result = filterChannelsByPreferences(
            prefWithEmailDisabled,
            type,
            channels
          );

          // Email should never be sent when globally disabled
          return result.email === false;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should not send SMS when smsEnabled is false', () => {
    fc.assert(
      fc.property(
        notificationPreference,
        notificationType,
        notificationChannels,
        (pref, type, channels) => {
          // Force smsEnabled to false
          const prefWithSMSDisabled = { ...pref, smsEnabled: false };

          const result = filterChannelsByPreferences(
            prefWithSMSDisabled,
            type,
            channels
          );

          // SMS should never be sent when globally disabled
          return result.sms === false;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should not send email for BID_RECEIVED when emailBidReceived is false', () => {
    fc.assert(
      fc.property(notificationPreference, notificationChannels, (pref, channels) => {
        // Enable email globally but disable for BID_RECEIVED
        const prefWithBidReceivedDisabled = {
          ...pref,
          emailEnabled: true,
          emailBidReceived: false,
        };

        const result = filterChannelsByPreferences(
          prefWithBidReceivedDisabled,
          'BID_RECEIVED',
          channels
        );

        // Email should not be sent for BID_RECEIVED
        return result.email === false;
      }),
      { numRuns: 100 }
    );
  });

  it('should not send SMS for NEW_MESSAGE when smsNewMessage is false', () => {
    fc.assert(
      fc.property(notificationPreference, notificationChannels, (pref, channels) => {
        // Enable SMS globally but disable for NEW_MESSAGE
        const prefWithNewMessageDisabled = {
          ...pref,
          smsEnabled: true,
          smsNewMessage: false,
        };

        const result = filterChannelsByPreferences(
          prefWithNewMessageDisabled,
          'NEW_MESSAGE',
          channels
        );

        // SMS should not be sent for NEW_MESSAGE
        return result.sms === false;
      }),
      { numRuns: 100 }
    );
  });

  it('should send email when both global and type-specific preferences are enabled', () => {
    fc.assert(
      fc.property(notificationType, (type) => {
        // Create preference with all email options enabled
        const prefWithAllEnabled: NotificationPreference = {
          id: 'test-id',
          userId: 'test-user',
          emailEnabled: true,
          emailBidReceived: true,
          emailBidApproved: true,
          emailProjectMatched: true,
          emailNewMessage: true,
          emailEscrowReleased: true,
          smsEnabled: true,
          smsBidReceived: true,
          smsBidApproved: true,
          smsProjectMatched: true,
          smsNewMessage: true,
          smsEscrowReleased: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        const result = filterChannelsByPreferences(prefWithAllEnabled, type, [
          'EMAIL',
        ]);

        // Email should be sent when all preferences are enabled
        return result.email === true;
      }),
      { numRuns: 100 }
    );
  });

  it('should send SMS when both global and type-specific preferences are enabled', () => {
    fc.assert(
      fc.property(notificationType, (type) => {
        // Create preference with all SMS options enabled
        const prefWithAllEnabled: NotificationPreference = {
          id: 'test-id',
          userId: 'test-user',
          emailEnabled: true,
          emailBidReceived: true,
          emailBidApproved: true,
          emailProjectMatched: true,
          emailNewMessage: true,
          emailEscrowReleased: true,
          smsEnabled: true,
          smsBidReceived: true,
          smsBidApproved: true,
          smsProjectMatched: true,
          smsNewMessage: true,
          smsEscrowReleased: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        const result = filterChannelsByPreferences(prefWithAllEnabled, type, [
          'SMS',
        ]);

        // SMS should be sent when all preferences are enabled
        return result.sms === true;
      }),
      { numRuns: 100 }
    );
  });

  it('should always send IN_APP notifications regardless of preferences', () => {
    fc.assert(
      fc.property(
        notificationPreference,
        notificationType,
        (pref, type) => {
          // Even with all preferences disabled
          const prefWithAllDisabled = {
            ...pref,
            emailEnabled: false,
            smsEnabled: false,
          };

          const result = filterChannelsByPreferences(
            prefWithAllDisabled,
            type,
            ['IN_APP']
          );

          // IN_APP should always be sent
          return result.inApp === true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should not send to channels not in requested list', () => {
    fc.assert(
      fc.property(
        notificationPreference,
        notificationType,
        (pref, type) => {
          // Enable all preferences
          const prefWithAllEnabled = {
            ...pref,
            emailEnabled: true,
            emailBidReceived: true,
            emailBidApproved: true,
            emailProjectMatched: true,
            emailNewMessage: true,
            emailEscrowReleased: true,
            smsEnabled: true,
            smsBidReceived: true,
            smsBidApproved: true,
            smsProjectMatched: true,
            smsNewMessage: true,
            smsEscrowReleased: true,
          };

          // Only request IN_APP
          const result = filterChannelsByPreferences(
            prefWithAllEnabled,
            type,
            ['IN_APP']
          );

          // Email and SMS should not be sent even if enabled
          return result.email === false && result.sms === false && result.inApp === true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should respect type-specific email preferences for BID_SELECTED and BID_NOT_SELECTED', () => {
    fc.assert(
      fc.property(notificationPreference, notificationChannels, (pref, channels) => {
        // Enable email globally but disable for bid approval
        const prefWithBidApprovedDisabled = {
          ...pref,
          emailEnabled: true,
          emailBidApproved: false,
        };

        const resultSelected = filterChannelsByPreferences(
          prefWithBidApprovedDisabled,
          'BID_SELECTED',
          channels
        );

        const resultNotSelected = filterChannelsByPreferences(
          prefWithBidApprovedDisabled,
          'BID_NOT_SELECTED',
          channels
        );

        // Both should be filtered out since they use emailBidApproved
        return resultSelected.email === false && resultNotSelected.email === false;
      }),
      { numRuns: 100 }
    );
  });

  it('should respect type-specific SMS preferences for escrow events', () => {
    fc.assert(
      fc.property(notificationPreference, notificationChannels, (pref, channels) => {
        // Enable SMS globally but disable for escrow
        const prefWithEscrowDisabled = {
          ...pref,
          smsEnabled: true,
          smsEscrowReleased: false,
        };

        const resultHeld = filterChannelsByPreferences(
          prefWithEscrowDisabled,
          'ESCROW_HELD',
          channels
        );

        const resultReleased = filterChannelsByPreferences(
          prefWithEscrowDisabled,
          'ESCROW_RELEASED',
          channels
        );

        const resultRefunded = filterChannelsByPreferences(
          prefWithEscrowDisabled,
          'ESCROW_REFUNDED',
          channels
        );

        // All escrow events should be filtered out
        return (
          resultHeld.sms === false &&
          resultReleased.sms === false &&
          resultRefunded.sms === false
        );
      }),
      { numRuns: 100 }
    );
  });

  it('should filter channels independently for each channel type', () => {
    fc.assert(
      fc.property(notificationType, (type) => {
        // Enable email but disable SMS
        const pref: NotificationPreference = {
          id: 'test-id',
          userId: 'test-user',
          emailEnabled: true,
          emailBidReceived: true,
          emailBidApproved: true,
          emailProjectMatched: true,
          emailNewMessage: true,
          emailEscrowReleased: true,
          smsEnabled: false, // SMS globally disabled
          smsBidReceived: true,
          smsBidApproved: true,
          smsProjectMatched: true,
          smsNewMessage: true,
          smsEscrowReleased: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        const result = filterChannelsByPreferences(pref, type, [
          'EMAIL',
          'SMS',
          'IN_APP',
        ]);

        // Email should be sent, SMS should not, IN_APP should be sent
        return result.email === true && result.sms === false && result.inApp === true;
      }),
      { numRuns: 100 }
    );
  });

  it('should handle all notification types correctly with mixed preferences', () => {
    fc.assert(
      fc.property(
        notificationPreference,
        notificationType,
        (pref, type) => {
          const result = filterChannelsByPreferences(pref, type, [
            'EMAIL',
            'SMS',
            'IN_APP',
          ]);

          // Verify email filtering logic
          const expectedEmail = isEmailEnabledForType(pref, type);
          const expectedSMS = isSMSEnabledForType(pref, type);

          return (
            result.email === expectedEmail &&
            result.sms === expectedSMS &&
            result.inApp === true
          );
        }
      ),
      { numRuns: 100 }
    );
  });
});
