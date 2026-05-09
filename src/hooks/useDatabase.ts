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
  createSavingsGoal,
  updateSavingsGoal,
  deleteSavingsGoal,
  addToSavingsGoal,
} from '../db/database';
import { Transaction } from '../utils/types';

/** Raw row shape coming back from SQLite */
interface PortfolioRow {
  id: string;
  label: string;
  value: number;
  category: string;
  companySymbol?: string;
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
  companySymbol?: string;
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

// ─── Accounts ───────────────────────────────────────────

export interface AccountItem {
  id: string;
  name: string;
  balance: number;
  type: string;
  currency: string;
  cardNetwork?: string;
  cardNumber?: string;
  isActive: boolean;
}

export const useAccounts = () => {
  const [accounts, setAccounts] = useState<AccountItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const database = await getDb();
      const rows = await database.getAllAsync<AccountItem>(
        'SELECT * FROM accounts ORDER BY balance DESC'
      );
      setAccounts(rows.map(r => ({
        ...r,
        isActive: Boolean(r.isActive),
      })));
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to load accounts';
      setError(message);
      console.error('[useAccounts] Failed to load:', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { accounts, isLoading, error, refresh: load };
};

// ─── Savings Goals ───────────────────────────────────────

export interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline: number;
  category: string;
  monthlyContribution: number;
  isCompleted: boolean;
}

export const useSavingsGoals = () => {
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const database = await getDb();
      const rows = await database.getAllAsync<SavingsGoal>(
        'SELECT * FROM savings_goals WHERE isCompleted = 0 ORDER BY deadline ASC'
      );
      setGoals(rows.map(r => ({
        ...r,
        isCompleted: Boolean(r.isCompleted),
      })));
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to load savings goals';
      setError(message);
      console.error('[useSavingsGoals] Failed to load:', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const addGoal = useCallback(async (name: string, targetAmount: number, deadline: number, category: string, monthlyContribution: number) => {
    try {
      const id = `goal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      await createSavingsGoal({ id, name, targetAmount, deadline, category, monthlyContribution });
      await load();
    } catch (e) {
      console.error('[useSavingsGoals] Failed to add goal:', e);
      throw e;
    }
  }, [load]);

  const updateGoal = useCallback(async (id: string, updates: Partial<Pick<SavingsGoal, 'name' | 'targetAmount' | 'currentAmount' | 'deadline' | 'monthlyContribution'>>) => {
    try {
      await updateSavingsGoal(id, updates);
      await load();
    } catch (e) {
      console.error('[useSavingsGoals] Failed to update goal:', e);
      throw e;
    }
  }, [load]);

  const deleteGoal = useCallback(async (id: string) => {
    try {
      await deleteSavingsGoal(id);
      await load();
    } catch (e) {
      console.error('[useSavingsGoals] Failed to delete goal:', e);
      throw e;
    }
  }, [load]);

  const addToGoal = useCallback(async (id: string, amount: number) => {
    try {
      await addToSavingsGoal(id, amount);
      await load();
    } catch (e) {
      console.error('[useSavingsGoals] Failed to add to goal:', e);
      throw e;
    }
  }, [load]);

  useEffect(() => {
    load();
  }, [load]);

  return { goals, isLoading, error, refresh: load, addGoal, updateGoal, deleteGoal, addToGoal };
};

// ─── Bills ───────────────────────────────────────────

export interface Bill {
  id: string;
  name: string;
  amount: number;
  dueDate: number;
  category: string;
  isRecurring: boolean;
  isPaid: boolean;
}

export const useBills = () => {
  const [bills, setBills] = useState<Bill[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const database = await getDb();
      const rows = await database.getAllAsync<Bill>(
        'SELECT * FROM bills WHERE isPaid = 0 ORDER BY dueDate ASC'
      );
      setBills(rows.map(r => ({
        ...r,
        isRecurring: Boolean(r.isRecurring),
        isPaid: Boolean(r.isPaid),
      })));
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to load bills';
      setError(message);
      console.error('[useBills] Failed to load:', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { bills, isLoading, error, refresh: load };
};

// ─── Debts / Liabilities ────────────────────────────────

export interface Debt {
  id: string;
  name: string;
  type: string;
  initialAmount: number;
  currentBalance: number;
  interestRate: number;
  minimumPayment: number;
  dueDate: number;
}

export const useDebts = () => {
  const [debts, setDebts] = useState<Debt[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const database = await getDb();
      const rows = await database.getAllAsync<Debt>(
        'SELECT * FROM debts ORDER BY currentBalance DESC'
      );
      setDebts(rows);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to load debts';
      setError(message);
      console.error('[useDebts] Failed to load:', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { debts, isLoading, error, refresh: load };
};
