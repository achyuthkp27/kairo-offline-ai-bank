/**
 * NotificationService — Local push notifications for transaction alerts
 * Uses expo-notifications for local-only notifications (no server required)
 */

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { getDb } from '../db/database';
import { logger } from '../utils';

// Notification categories
export type NotificationCategory = 'transaction_alerts' | 'balance_warnings' | 'payment_reminders';

export interface NotificationPreference {
  id: string;
  category: NotificationCategory;
  enabled: boolean;
  created_at: number;
  updated_at: number;
}

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Request notification permissions from the user
 * Returns true if granted, false otherwise
 */
export const requestNotificationPermissions = async (): Promise<boolean> => {
  if (!Device.isDevice) {
    logger.warn('Push notifications require a physical device');
    return false;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  if (existingStatus === 'granted') {
    return true;
  }

  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
};

/**
 * Get all notification preferences from database
 */
export const getNotificationPreferences = async (): Promise<NotificationPreference[]> => {
  const database = await getDb();
  const rows = await database.getAllAsync<{
    id: string;
    category: string;
    enabled: number;
    created_at: number;
    updated_at: number;
  }>('SELECT * FROM notification_preferences');

  return rows.map(row => ({
    ...row,
    category: row.category as NotificationCategory,
    enabled: row.enabled === 1,
  }));
};

/**
 * Update a single notification preference
 */
export const updateNotificationPreference = async (
  category: NotificationCategory,
  enabled: boolean
): Promise<void> => {
  const database = await getDb();
  const now = Date.now();
  await database.runAsync(
    'UPDATE notification_preferences SET enabled = ?, updated_at = ? WHERE category = ?',
    [enabled ? 1 : 0, now, category]
  );
};

/**
 * Check if a notification category is enabled
 */
export const isNotificationEnabled = async (category: NotificationCategory): Promise<boolean> => {
  const prefs = await getNotificationPreferences();
  const found = prefs.find(p => p.category === category);
  return found?.enabled ?? false;
};

/**
 * Send a local notification for a large transaction
 */
export const notifyLargeTransaction = async (
  merchantName: string,
  amount: number,
  currency: string = '₹'
): Promise<void> => {
  const enabled = await isNotificationEnabled('transaction_alerts');
  if (!enabled) return;

  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Large Transaction Detected',
      body: `${currency}${amount.toLocaleString()} sent to ${merchantName}`,
      data: { type: 'transaction', screen: 'transactions' },
    },
    trigger: null, // Immediate
  });
};

/**
 * Send a low balance warning notification
 */
export const notifyLowBalance = async (
  balance: number,
  currency: string = '₹'
): Promise<void> => {
  const enabled = await isNotificationEnabled('balance_warnings');
  if (!enabled) return;

  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Low Balance Alert',
      body: `Your account balance is ${currency}${balance.toLocaleString()}. Consider adding funds.`,
      data: { type: 'balance', screen: 'dashboard' },
    },
    trigger: null,
  });
};

/**
 * Check balance and send notification if below threshold
 */
export const checkAndNotifyLowBalance = async (
  currentBalance: number,
  threshold: number = 100
): Promise<void> => {
  if (currentBalance < threshold) {
    await notifyLowBalance(currentBalance);
  }
};

/**
 * Schedule a daily balance check notification (9am)
 * Note: This uses local notifications which work offline
 */
export const scheduleDailyBalanceCheck = async (): Promise<string | null> => {
  const enabled = await isNotificationEnabled('balance_warnings');
  if (!enabled) return null;

  // Cancel any existing daily notifications first
  await Notifications.cancelAllScheduledNotificationsAsync();

  const identifier = await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Daily Balance Check',
      body: 'Tap to view your account balance',
      data: { type: 'balance_check', screen: 'dashboard' },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: 9,
      minute: 0,
    },
  });

  return identifier;
};

/**
 * Cancel all scheduled notifications
 */
export const cancelAllScheduledNotifications = async (): Promise<void> => {
  await Notifications.cancelAllScheduledNotificationsAsync();
};

/**
 * Add notification response listener
 */
export const addNotificationResponseListener = (
  callback: (response: Notifications.NotificationResponse) => void
): Notifications.EventSubscription => {
  return Notifications.addNotificationResponseReceivedListener(callback);
};

/**
 * Add notification received listener
 */
export const addNotificationReceivedListener = (
  callback: (notification: Notifications.Notification) => void
): Notifications.EventSubscription => {
  return Notifications.addNotificationReceivedListener(callback);
};