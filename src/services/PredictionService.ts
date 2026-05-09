import { getDb } from '../db/database';

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
const NINETY_DAYS_MS = 90 * 24 * 60 * 60 * 1000;

export interface Prediction {
  id: string;
  type: 'balance_forecast' | 'spending_alert' | 'bill_prediction' | 'trend_analysis' | 'savings_opportunity' | 'investment_hint';
  message: string;
  confidence: number;
  severity: 'info' | 'warning' | 'positive';
  date: number;
  amount?: number;
  action?: string;
}

interface AccountRow {
  balance: number;
}

interface TransactionRow {
  amount: number;
  category: string;
  timestamp: number;
  merchantName: string;
}

export class PredictionService {
  static async generatePredictions(): Promise<Prediction[]> {
    const database = await getDb();
    const predictions: Prediction[] = [];
    const now = Date.now();
    const thirtyDaysAgo = now - THIRTY_DAYS_MS;
    const sevenDaysAgo = now - SEVEN_DAYS_MS;
    const ninetyDaysAgo = now - NINETY_DAYS_MS;

    const accounts = await database.getAllAsync<AccountRow>('SELECT balance FROM accounts');
    if (accounts.length === 0) return predictions;
    
    const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0);

    // 1. Balance Forecast
    const recentDebits = await database.getAllAsync<TransactionRow>(
      'SELECT amount FROM transactions WHERE type = "debit" AND timestamp >= ?',
      [thirtyDaysAgo]
    );

    if (recentDebits.length > 0) {
      const totalSpend30d = recentDebits.reduce((sum, txn) => sum + txn.amount, 0);
      const averageDailySpend = totalSpend30d / 30;
      const daysUntilZero = averageDailySpend > 0 ? totalBalance / averageDailySpend : Infinity;

      if (daysUntilZero < 7) {
        predictions.push({
          id: `pred_bal_${now}`,
          type: 'balance_forecast',
          message: '⚠️ CRITICAL: Balance may hit zero in ${Math.round(daysUntilZero)} days at current rate!',
          confidence: 0.95,
          severity: 'warning',
          date: now
        });
      } else if (daysUntilZero < 14) {
        predictions.push({
          id: `pred_bal_${now}`,
          type: 'balance_forecast',
          message: `Balance low - ${Math.round(daysUntilZero)} days at current spending.`,
          confidence: 0.85,
          severity: 'warning',
          date: now
        });
      }
    }

    // 2. Spending Trend Analysis
    const previous90d = await database.getAllAsync<TransactionRow>(
      'SELECT amount, category FROM transactions WHERE type = "debit" AND timestamp >= ?',
      [ninetyDaysAgo]
    );

    if (previous90d.length > 10) {
      const last30 = previous90d.filter(t => t.timestamp >= thirtyDaysAgo);
      const prev30 = previous90d.filter(t => t.timestamp < thirtyDaysAgo);
      
      const last30Total = last30.reduce((sum, t) => sum + t.amount, 0);
      const prev30Total = prev30.reduce((sum, t) => sum + t.amount, 0);

      if (prev30Total > 0) {
        const change = ((last30Total - prev30Total) / prev30Total) * 100;
        
        if (change > 20) {
          predictions.push({
            id: `pred_trend_${now}`,
            type: 'trend_analysis',
            message: `Spending up ${Math.round(change)}% vs last month. ₹${(last30Total - prev30Total).toLocaleString()} more.`,
            confidence: 0.9,
            severity: 'warning',
            date: now,
            amount: change
          });
        } else if (change < -15) {
          predictions.push({
            id: `pred_trend_${now}`,
            type: 'trend_analysis',
            message: `Great job! Spending down ${Math.abs(Math.round(change))}% vs last month. Keep it up!`,
            confidence: 0.9,
            severity: 'positive',
            date: now
          });
        }
      }
    }

    // 3. Top Spending Category
    const weeklyDebits = await database.getAllAsync<TransactionRow>(
      'SELECT amount, category FROM transactions WHERE type = "debit" AND timestamp >= ?',
      [sevenDaysAgo]
    );

    const categorySpend7d: Record<string, number> = {};
    weeklyDebits.forEach(txn => {
      categorySpend7d[txn.category] = (categorySpend7d[txn.category] || 0) + txn.amount;
    });

    const sortedCategories = Object.entries(categorySpend7d).sort((a, b) => b[1] - a[1]);
    if (sortedCategories.length > 0 && sortedCategories[0][1] > 5000) {
      const [cat, amount] = sortedCategories[0];
      predictions.push({
        id: `pred_spend_${now}`,
        type: 'spending_alert',
        message: `Top spend: ${cat} - ₹${amount.toLocaleString()} this week`,
        confidence: 0.9,
        severity: amount > 15000 ? 'warning' : 'info',
        date: now,
        amount
      });
    }

    // 4. Savings Opportunity (unused subscriptions check)
    // This is covered by SubscriptionService, but add idle cash insight
    if (totalBalance > 50000) {
      const savingsInterest = totalBalance * 0.065 / 12; // Assume 6.5% FD rate
      predictions.push({
        id: `pred_savings_${now}`,
        type: 'savings_opportunity',
        message: `₹${Math.round(savingsInterest)}/month potential in FD. Consider automating savings.`,
        confidence: 0.8,
        severity: 'info',
        date: now,
        amount: Math.round(savingsInterest)
      });
    }

    // 5. Subscription Value Check
    const recentSubs = await database.getAllAsync<TransactionRow>(
      'SELECT merchantName, amount FROM transactions WHERE category = "subscription" AND timestamp >= ? ORDER BY timestamp DESC LIMIT 3',
      [sevenDaysAgo]
    );
    if (recentSubs.length >= 2) {
      const subTotal = recentSubs.reduce((sum, t) => sum + t.amount, 0);
      predictions.push({
        id: `pred_sub_${now}`,
        type: 'bill_prediction',
        message: `${recentSubs.length} subscriptions active - ₹${subTotal.toLocaleString()}/month`,
        confidence: 0.95,
        severity: 'info',
        date: now,
        amount: subTotal
      });
    }

    return predictions.slice(0, 5);
  }
}