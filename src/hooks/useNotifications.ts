/**
 * useNotifications — Hook for managing notification state and permissions
 */

import { useState, useEffect, useCallback } from 'react';
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import {
  requestNotificationPermissions,
  getNotificationPreferences,
  updateNotificationPreference,
  NotificationCategory,
  addNotificationResponseListener,
} from '../services/NotificationService';

interface NotificationState {
  permissionsGranted: boolean;
  preferences: Map<NotificationCategory, boolean>;
  isLoading: boolean;
}

export const useNotifications = () => {
  const [state, setState] = useState<NotificationState>({
    permissionsGranted: false,
    preferences: new Map(),
    isLoading: true,
  });

  // Load preferences from database
  const loadPreferences = useCallback(async () => {
    try {
      const prefs = await getNotificationPreferences();
      const prefMap = new Map<NotificationCategory, boolean>();
      prefs.forEach(p => prefMap.set(p.category, p.enabled));
      setState(prev => ({
        ...prev,
        preferences: prefMap,
        isLoading: false,
      }));
    } catch (error) {
      console.error('[useNotifications] Failed to load preferences:', error);
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, []);

  // Request permissions on mount
  useEffect(() => {
    const init = async () => {
      const granted = await requestNotificationPermissions();
      setState(prev => ({ ...prev, permissionsGranted: granted }));
      await loadPreferences();
    };
    init();

    // Listen for notification taps and navigate
    const subscription = addNotificationResponseListener(response => {
      const data = response.notification.request.content.data;
      if (data?.screen) {
        const route = data.screen === 'transactions'
          ? '/transactions'
          : data.screen === 'dashboard'
            ? '/dashboard'
            : '/dashboard';
        router.push(route);
      }
    });

    return () => {
      subscription.remove();
    };
  }, [loadPreferences]);

  // Toggle a notification category
  const toggleCategory = useCallback(async (category: NotificationCategory) => {
    const currentEnabled = state.preferences.get(category) ?? true;
    const newEnabled = !currentEnabled;

    try {
      await updateNotificationPreference(category, newEnabled);
      setState(prev => {
        const newPrefs = new Map(prev.preferences);
        newPrefs.set(category, newEnabled);
        return { ...prev, preferences: newPrefs };
      });
    } catch (error) {
      console.error('[useNotifications] Failed to toggle preference:', error);
    }
  }, [state.preferences]);

  return {
    permissionsGranted: state.permissionsGranted,
    preferences: state.preferences,
    isLoading: state.isLoading,
    toggleCategory,
    reloadPreferences: loadPreferences,
  };
};