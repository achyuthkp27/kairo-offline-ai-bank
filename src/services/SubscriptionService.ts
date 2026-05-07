/**
 * Kairo — Subscription Intelligence Service
 * Analyzes transaction history to detect recurring payments deterministically
 */

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

const KNOWN_SUBSCRIPTIONS = ['Netflix', 'Spotify', 'Amazon Prime', 'Apple', 'iCloud', 'Zomato', 'Swiggy', 'Gym', 'Youtube'];

export class SubscriptionService {
  /**
   * Scans transaction history and clusters them into subscriptions
   */
  static async detectSubscriptions(): Promise<Subscription[]> {
    const database = await getDb();
    const t0 = Date.now();
    
    // Fetch all debits
    const debits = await database.getAllAsync<any>(
      'SELECT merchantName, amount, currency, timestamp FROM transactions WHERE type = ? ORDER BY timestamp DESC',
      ['debit']
    );
    
    const merchantMap = new Map<string, any[]>();
    
    // Group by merchant and exact amount
    for (const txn of debits) {
      const key = `${txn.merchantName.trim().toLowerCase()}_${txn.amount}`;
      if (!merchantMap.has(key)) {
        merchantMap.set(key, []);
      }
      merchantMap.get(key)!.push(txn);
    }
    
    const subscriptions: Subscription[] = [];
    
    merchantMap.forEach((txns, key) => {
      // A subscription needs at least 2 occurrences
      if (txns.length < 2) return;
      
      const latest = txns[0];
      const previous = txns[1];
      const daysBetween = (latest.timestamp - previous.timestamp) / (1000 * 60 * 60 * 24);
      
      let frequency: 'monthly' | 'yearly' | null = null;
      if (daysBetween >= 25 && daysBetween <= 35) {
        frequency = 'monthly';
      } else if (daysBetween >= 350 && daysBetween <= 380) {
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
    
    console.log(`[SubscriptionService] Detected ${subscriptions.length} subscriptions in ${Date.now() - t0}ms`);
    return subscriptions;
  }
}
