import { useEffect, useState } from 'react';
import { InsightEngine, type AIInsight } from '../services/InsightEngine';
import type { KairoNotification } from '../store/notificationStore';
import { logger } from '../utils';

interface UseDashboardInsightsParams {
  notifications: KairoNotification[];
  addNotification: (notification: Omit<KairoNotification, 'id' | 'date' | 'isRead'>) => void;
}

export const useDashboardInsights = ({
  notifications,
  addNotification,
}: UseDashboardInsightsParams) => {
  const [insights, setInsights] = useState<AIInsight[]>([]);

  useEffect(() => {
    const loadInsights = async () => {
      try {
        const newInsights = await InsightEngine.generateDailyFeed();
        setInsights(newInsights);

        newInsights.forEach((insight) => {
          if (insight.severity === 'alert' || insight.severity === 'warning') {
            const alreadyNotified = notifications.some(
              (notification) =>
                notification.title === insight.title &&
                notification.message === insight.description
            );
            if (!alreadyNotified) {
              addNotification({
                title: insight.title,
                message: insight.description,
                type: insight.type === 'alert' ? 'security' : 'insight',
              });
            }
          }
        });
      } catch (error) {
        logger.warn('Failed to generate dashboard insights', error);
      }
    };

    loadInsights();
  }, [addNotification, notifications]);

  return { insights };
};
