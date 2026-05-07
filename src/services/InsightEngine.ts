/**
 * Kairo — Insight Engine
 * Generates the daily AI Insight Feed using pre-computed predictions and patterns
 */

import { PredictionService } from './PredictionService';
import { SubscriptionService } from './SubscriptionService';

export interface AIInsight {
  id: string;
  title: string;
  description: string;
  type: 'spending' | 'saving' | 'alert' | 'subscription' | 'goal';
  severity: 'positive' | 'neutral' | 'info' | 'warning' | 'alert';
}

export class InsightEngine {
  /**
   * Generates a feed of insights for the dashboard
   */
  static async generateDailyFeed(): Promise<AIInsight[]> {
    const insights: AIInsight[] = [];
    const now = Date.now();
    
    // 1. Fetch Predictions
    const predictions = await PredictionService.generatePredictions();
    
    for (const pred of predictions) {
      if (pred.type === 'balance_forecast') {
        insights.push({
          id: `insight_bal_${now}`,
          title: 'Balance Warning',
          description: pred.message,
          type: 'alert',
          severity: pred.severity
        });
      } else if (pred.type === 'spending_alert') {
        insights.push({
          id: `insight_spend_${now}`,
          title: 'Spending Spike',
          description: pred.message,
          type: 'spending',
          severity: pred.severity
        });
      }
    }
    
    // 2. Fetch Subscriptions
    const subscriptions = await SubscriptionService.detectSubscriptions();
    const urgentSubs = subscriptions.filter(s => {
      const daysUntil = (s.nextRenewalDate - now) / (1000 * 60 * 60 * 24);
      return daysUntil >= 0 && daysUntil <= 3;
    });
    
    if (urgentSubs.length > 0) {
      insights.push({
        id: `insight_sub_${now}`,
        title: 'Upcoming Renewal',
        description: `Your ${urgentSubs[0].merchantName} subscription renews in a few days.`,
        type: 'subscription',
        severity: 'warning'
      });
    }
    
    // 3. Fallback positive insight if everything is fine
    if (insights.length === 0) {
      insights.push({
        id: `insight_ok_${now}`,
        title: 'Looking Good!',
        description: 'Your spending is on track and no unusual activity was detected.',
        type: 'saving',
        severity: 'positive'
      });
    }
    
    return insights;
  }
}
