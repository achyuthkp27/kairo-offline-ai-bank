/**
 * Kairo — Predictive Intelligence Service
 * Analyzes transaction history to forecast balances and detect anomalies
 */

import { getDb } from '../db/database';

export interface Prediction {
  id: string;
  type: 'balance_forecast' | 'spending_alert' | 'bill_prediction';
  message: string;
  confidence: number;
  severity: 'info' | 'warning' | 'positive';
  date: number;
}

export class PredictionService {
  /**
   * Generates predictions based on recent spending patterns
   */
  static async generatePredictions(): Promise<Prediction[]> {
    const database = await getDb();
    const predictions: Prediction[] = [];
    const now = Date.now();
    const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;
    const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;

    // 1. Balance Forecast
    const accounts = await database.getAllAsync<any>('SELECT balance FROM accounts');
    const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0);

    const recentDebits = await database.getAllAsync<any>(
      'SELECT amount FROM transactions WHERE type = "debit" AND timestamp >= ?',
      [thirtyDaysAgo]
    );
    
    if (recentDebits.length > 0) {
      const totalSpend30d = recentDebits.reduce((sum, txn) => sum + txn.amount, 0);
      const averageDailySpend = totalSpend30d / 30;
      
      const daysUntilZero = totalBalance / averageDailySpend;
      
      if (daysUntilZero < 10) {
        predictions.push({
          id: `pred_bal_${now}`,
          type: 'balance_forecast',
          message: `Your balance may fall below zero by next week at current spending rates.`,
          confidence: 0.85,
          severity: 'warning',
          date: now
        });
      }
    }

    // 2. Spending Pattern Alerts
    const weeklyDebits = await database.getAllAsync<any>(
      'SELECT amount, category FROM transactions WHERE type = "debit" AND timestamp >= ?',
      [sevenDaysAgo]
    );

    const categorySpend7d: Record<string, number> = {};
    weeklyDebits.forEach(txn => {
      categorySpend7d[txn.category] = (categorySpend7d[txn.category] || 0) + txn.amount;
    });

    const topCategory = Object.keys(categorySpend7d).sort((a, b) => categorySpend7d[b] - categorySpend7d[a])[0];
    if (topCategory && categorySpend7d[topCategory] > 10000) {
      predictions.push({
        id: `pred_spend_${now}`,
        type: 'spending_alert',
        message: `You are spending heavily on ${topCategory} this week.`,
        confidence: 0.9,
        severity: 'info',
        date: now
      });
    }

    return predictions;
  }
}
