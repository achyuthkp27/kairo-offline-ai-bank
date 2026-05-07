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
  getDb,
} from '../db/database';
import { Transaction } from '../utils/types';

/** Raw row shape coming back from SQLite */
interface TransactionRow {
  id: string;
  merchantName: string;
  category: string;
  type: string;
  amount: number;
  currency: string;
  timestamp: number;
  accountSource: string;
  status: string;
}

interface PortfolioRow {
  id: string;
  label: string;
  value: number;
  category: string;
}

interface CategorySpendingRow {
  category: string;
  total: number;
}

// ─── Transactions ────────────────────────────────────────

export const useTransactions = (limit: number = 20) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const rows = (await fetchRecentTransactions(limit)) as TransactionRow[];
      const mapped: Transaction[] = rows.map((r) => ({
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
      console.error('[useTransactions] Failed to load:', e);
    } finally {
      setIsLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    load();
  }, [load]);

  return { transactions, isLoading, refresh: load };
};

// ─── Net Worth ───────────────────────────────────────────

export const useNetWorth = () => {
  const [netWorth, setNetWorth] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const total = await fetchTotalNetWorth();
      setNetWorth(total);
    } catch (e) {
      console.error('[useNetWorth] Failed to load:', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { netWorth, isLoading, refresh: load };
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

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const database = await getDb();
      const rows = (await database.getAllAsync(
        'SELECT * FROM portfolio ORDER BY value DESC'
      )) as PortfolioRow[];
      setPortfolio(rows);
    } catch (e) {
      console.error('[usePortfolio] Failed to load:', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { portfolio, isLoading, refresh: load };
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

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const rows = (await fetchCategorySpending(days)) as CategorySpendingRow[];
      setSpending(rows);
      setTotalSpent(rows.reduce((sum, r) => sum + r.total, 0));
    } catch (e) {
      console.error('[useCategorySpending] Failed to load:', e);
    } finally {
      setIsLoading(false);
    }
  }, [days]);

  useEffect(() => {
    load();
  }, [load]);

  return { spending, totalSpent, isLoading, refresh: load };
};
