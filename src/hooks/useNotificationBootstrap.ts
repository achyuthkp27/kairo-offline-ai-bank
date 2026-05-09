import { useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { logger } from '../utils';

const NOTIFICATION_PERMISSION_ASKED_KEY = 'notification_permission_asked';

export const useNotificationBootstrap = () => {
  useEffect(() => {
    const checkNotifications = async () => {
      try {
        const hasAsked = await AsyncStorage.getItem(NOTIFICATION_PERMISSION_ASKED_KEY);
        if (!hasAsked) {
          const { requestNotificationPermissions } = await import('../services/NotificationService');
          await requestNotificationPermissions();
          await AsyncStorage.setItem(NOTIFICATION_PERMISSION_ASKED_KEY, 'true');
        }
      } catch (error) {
        logger.warn('Notification bootstrap failed', error);
      }
    };

    checkNotifications();
  }, []);
};
