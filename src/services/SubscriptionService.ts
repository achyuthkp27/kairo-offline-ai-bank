import { getDb } from '../db/database';

export interface Subscription {
  id: string;
  merchantName: string;
  amount: number;
  currency: string;
  frequency: 'monthly' | 'yearly';
  nextRenewalDate: number;
  status: 'active' | 'cancelled';
  lastSeen: number;
  aiClassification: 'Essential' | 'Rarely Used' | 'Duplicate' | 'Unknown';
}

const KNOWN_SUBSCRIPTIONS = [
  'Netflix', 'Spotify', 'Amazon Prime', 'Apple', 'iCloud', 'Zomato', 'Swiggy',
  'Gym', 'Youtube', 'Jio', 'Airtel', 'Hotstar', 'Zepto', 'Blinkit',
  'Google One', 'Google Drive', 'Dropbox', 'Notion', 'Medium',
  'LinkedIn', 'ChatGPT', 'GitHub', 'Adobe', 'Canva',
];

const DAYS_RANGE_MONTHLY_MIN = 25;
const DAYS_RANGE_MONTHLY_MAX = 35;
const DAYS_RANGE_YEARLY_MIN = 350;
const DAYS_RANGE_YEARLY_MAX = 380;
const MIN_OCCURRENCES_FOR_SUBSCRIPTION = 2;

interface TransactionRow {
  merchantName: string;
  amount: number;
  currency: string;
  timestamp: number;
}

export class SubscriptionService {
  static async detectSubscriptions(): Promise<Subscription[]> {
    const database = await getDb();

    const debits = await database.getAllAsync<TransactionRow>(
      'SELECT merchantName, amount, currency, timestamp FROM transactions WHERE type = ? ORDER BY timestamp DESC',
      ['debit']
    );

    const merchantMap = new Map<string, TransactionRow[]>();

    for (const txn of debits) {
      const key = `${txn.merchantName.trim().toLowerCase()}_${txn.amount}`;
      if (!merchantMap.has(key)) {
        merchantMap.set(key, []);
      }
      merchantMap.get(key)!.push(txn);
    }

    const subscriptions: Subscription[] = [];

    merchantMap.forEach((txns, key) => {
      if (txns.length < MIN_OCCURRENCES_FOR_SUBSCRIPTION) return;

      const latest = txns[0];
      const previous = txns[1];
      const daysBetween = (latest.timestamp - previous.timestamp) / (1000 * 60 * 60 * 24);

      let frequency: 'monthly' | 'yearly' | null = null;
      if (daysBetween >= DAYS_RANGE_MONTHLY_MIN && daysBetween <= DAYS_RANGE_MONTHLY_MAX) {
        frequency = 'monthly';
      } else if (daysBetween >= DAYS_RANGE_YEARLY_MIN && daysBetween <= DAYS_RANGE_YEARLY_MAX) {
        frequency = 'yearly';
      }

      const isKnown = KNOWN_SUBSCRIPTIONS.some(k => latest.merchantName.toLowerCase().includes(k.toLowerCase()));

      if (frequency || isKnown) {
        const nextRenewalDate = latest.timestamp + (frequency === 'monthly' ? 30 : 365) * 24 * 60 * 60 * 1000;

        subscriptions.push({
          id: `sub_${latest.merchantName.replace(/\s+/g, '')}_${latest.amount}`,
          merchantName: latest.merchantName,
          amount: latest.amount,
          currency: latest.currency,
          frequency: frequency || 'monthly',
          nextRenewalDate,
          status: 'active',
          lastSeen: latest.timestamp,
          aiClassification: isKnown ? 'Essential' : 'Unknown'
        });
      }
    });

    return subscriptions;
  }
}
