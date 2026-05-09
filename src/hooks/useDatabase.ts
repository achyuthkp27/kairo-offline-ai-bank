/**
 * Kairo — useDatabase Hooks
 * React hooks that read from the local SQLite database,
 * ensuring the UI and AI engine always see the same data source.
 */

import { useState, useEffect, useCallback } from 'react';
import {
  fetchRecentTransactions,
  fetchTotalNetWorth,
  fetchCategorySpending,
  fetchDailySpending,
  getDb,
  TransactionRow,
} from '../db/database';
import { Transaction } from '../utils/types';

/** Raw row shape coming back from SQLite */
interface PortfolioRow {
  id: string;
  label: string;
  value: number;
  category: string;
}

// ─── Transactions ────────────────────────────────────────

export const useTransactions = (limit: number = 20) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const rows = await fetchRecentTransactions(limit);
      const mapped: Transaction[] = rows.map((r: TransactionRow) => ({
        id: r.id,
        merchantName: r.merchantName,
        category: r.category as Transaction['category'],
        type: r.type as Transaction['type'],
        amount: r.amount,
        currency: r.currency,
        date: new Date(r.timestamp),
        time: new Date(r.timestamp).toLocaleTimeString('en-IN', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
        }),
        accountSource: r.accountSource,
        status: r.status as Transaction['status'],
      }));
      setTransactions(mapped);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to load transactions';
      setError(message);
      console.error('[useTransactions] Failed to load:', e);
    } finally {
      setIsLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    load();
  }, [load]);

  return { transactions, isLoading, error, refresh: load };
};

// ─── Net Worth ───────────────────────────────────────────

export const useNetWorth = () => {
  const [netWorth, setNetWorth] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const total = await fetchTotalNetWorth();
      setNetWorth(total);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to load net worth';
      setError(message);
      console.error('[useNetWorth] Failed to load:', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { netWorth, isLoading, error, refresh: load };
};

// ─── Portfolio ───────────────────────────────────────────

export interface PortfolioItem {
  id: string;
  label: string;
  value: number;
  category: string;
}

export const usePortfolio = () => {
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const database = await getDb();
      const rows = await database.getAllAsync<PortfolioRow>(
        'SELECT * FROM portfolio ORDER BY value DESC'
      );
      setPortfolio(rows);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to load portfolio';
      setError(message);
      console.error('[usePortfolio] Failed to load:', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { portfolio, isLoading, error, refresh: load };
};

// ─── Category Spending ───────────────────────────────────

export interface CategorySpending {
  category: string;
  total: number;
}

export const useCategorySpending = (days: number = 7) => {
  const [spending, setSpending] = useState<CategorySpending[]>([]);
  const [totalSpent, setTotalSpent] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const rows = await fetchCategorySpending(days);
      const mapped: CategorySpending[] = rows.map((r: { category: string; total: number }) => ({
        category: r.category,
        total: r.total,
      }));
      setSpending(mapped);
      setTotalSpent(mapped.reduce((sum, r) => sum + r.total, 0));
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to load category spending';
      setError(message);
      console.error('[useCategorySpending] Failed to load:', e);
    } finally {
      setIsLoading(false);
    }
  }, [days]);

  useEffect(() => {
    load();
  }, [load]);

  return { spending, totalSpent, isLoading, error, refresh: load };
};

export const useDailySpending = (days: number = 7) => {
  const [data, setData] = useState<{ day: string; value: number }[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const rows = await fetchDailySpending(days);
      
      // Map to last 7 days including empty days
      const daysArr = [];
      for (let i = days - 1; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        const dayLabel = d.toLocaleDateString('en-US', { weekday: 'short' }).charAt(0);
        
        const match = rows.find(r => r.date === dateStr);
        daysArr.push({
          day: dayLabel,
          value: match ? match.total : 0
        });
      }
      
      setData(daysArr);
    } catch (e) {
      console.error('[useDailySpending] Failed to load:', e);
    } finally {
      setIsLoading(false);
    }
  }, [days]);

  useEffect(() => {
    load();
  }, [load]);

  return { data, isLoading, refresh: load };
};
