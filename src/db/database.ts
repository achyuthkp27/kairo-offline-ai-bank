/**
 * Kairo — Local Database Architecture
 * Offline-first SQLite setup for accounts, transactions, and portfolio
 */

import * as SQLite from 'expo-sqlite';
import { MOCK_TRANSACTIONS } from '../utils/mockData';
import { useAccountStore } from '../store';
import { logger } from '../utils/logger';
import { runMigrations } from './migrations';

export interface TransactionRow {
  id: string;
  merchantName: string;
  category: string;
  type: 'credit' | 'debit';
  amount: number;
  currency: string;
  timestamp: number;
  accountSource: string;
  status: 'completed' | 'pending' | 'failed';
  embedding?: string;
}

// Open or create the database
let db: SQLite.SQLiteDatabase | null = null;

export const getDb = async () => {
  if (!db) {
    db = await SQLite.openDatabaseAsync('kairo_ai_bank.db');
  }
  return db;
};

/**
 * Execute multiple writes atomically.
 */
export const runInTransaction = async <T>(fn: (database: SQLite.SQLiteDatabase) => Promise<T>): Promise<T> => {
  const database = await getDb();
  let result: T | undefined;
  await database.withTransactionAsync(async () => {
    result = await fn(database);
  });
  return result as T;
};

export const initDatabase = async () => {
  try {
    const database = await getDb();
    
    // Create Tables
    await database.execAsync(`
      PRAGMA journal_mode = WAL;

      CREATE TABLE IF NOT EXISTS accounts (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        balance REAL NOT NULL,
        type TEXT NOT NULL,
        currency TEXT DEFAULT '₹',
        cardNetwork TEXT,
        cardNumber TEXT,
        isActive INTEGER DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS transactions (
        id TEXT PRIMARY KEY,
        merchantName TEXT NOT NULL,
        category TEXT NOT NULL,
        type TEXT NOT NULL,
        amount REAL NOT NULL,
        currency TEXT DEFAULT '₹',
        timestamp INTEGER NOT NULL,
        accountSource TEXT NOT NULL,
        status TEXT DEFAULT 'completed',
        embedding TEXT
      );

      CREATE TABLE IF NOT EXISTS portfolio (
        id TEXT PRIMARY KEY,
        label TEXT NOT NULL,
        value REAL NOT NULL,
        category TEXT NOT NULL,
        companySymbol TEXT,
        allocation REAL DEFAULT 0,
        change1D REAL DEFAULT 0,
        change1Y REAL DEFAULT 0,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS ai_memory (
        id TEXT PRIMARY KEY,
        key TEXT NOT NULL,
        value TEXT NOT NULL,
        category TEXT NOT NULL,
        embedding TEXT,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS notification_preferences (
        id TEXT PRIMARY KEY,
        category TEXT NOT NULL UNIQUE,
        enabled INTEGER DEFAULT 1,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS budgets (
        id TEXT PRIMARY KEY,
        category TEXT NOT NULL UNIQUE,
        limit_amount REAL NOT NULL,
        spent_amount REAL DEFAULT 0,
        month INTEGER NOT NULL,
        year INTEGER NOT NULL,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS savings_goals (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        targetAmount REAL NOT NULL,
        currentAmount REAL DEFAULT 0,
        deadline INTEGER NOT NULL,
        category TEXT NOT NULL,
        monthlyContribution REAL NOT NULL,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        isCompleted INTEGER DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS bills (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        amount REAL NOT NULL,
        dueDate INTEGER NOT NULL,
        category TEXT NOT NULL,
        isRecurring INTEGER DEFAULT 0,
        recurMonthDays TEXT,
        isPaid INTEGER DEFAULT 0,
        paidAt INTEGER,
        reminderDays INTEGER DEFAULT 3,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS debts (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        initialAmount REAL NOT NULL,
        currentBalance REAL NOT NULL,
        interestRate REAL NOT NULL,
        minimumPayment REAL NOT NULL,
        dueDate INTEGER NOT NULL,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_transactions_timestamp ON transactions(timestamp DESC);
      CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category);
      CREATE INDEX IF NOT EXISTS idx_transactions_account_source ON transactions(accountSource);
      CREATE INDEX IF NOT EXISTS idx_ai_memory_updated_at ON ai_memory(updated_at DESC);
      CREATE INDEX IF NOT EXISTS idx_ai_memory_category ON ai_memory(category);
      CREATE INDEX IF NOT EXISTS idx_budgets_month_year ON budgets(month, year);
      CREATE INDEX IF NOT EXISTS idx_savings_goals_deadline ON savings_goals(deadline);
      CREATE INDEX IF NOT EXISTS idx_bills_due_date ON bills(dueDate);
      CREATE INDEX IF NOT EXISTS idx_debts_due_date ON debts(dueDate);
    `);

    await runMigrations(database);

    // 1. Check & Seed Accounts
    const accountCheck = await database.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM accounts');
    if (accountCheck && accountCheck.count === 0) {
      logger.info('Seeding accounts...');
      const accounts = useAccountStore.getState().accounts;
      for (const acc of accounts) {
        await database.runAsync(
          'INSERT INTO accounts (id, name, balance, type, currency, cardNetwork, cardNumber, isActive) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
          [acc.id, acc.name, acc.balance, acc.type, acc.currency, acc.cardBrand || null, acc.cardNumber || null, acc.isActive ? 1 : 0]
        );
      }
    }

    // 2. Check & Seed Transactions
    const txnCheck = await database.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM transactions');
    if (txnCheck && txnCheck.count < MOCK_TRANSACTIONS.length) {
      logger.info('Re-seeding transactions (count was ' + txnCheck.count + ')...');
      // Clear existing to avoid duplicates if count was low but not zero
      await database.runAsync('DELETE FROM transactions');
      
      for (const txn of MOCK_TRANSACTIONS) {
        await database.runAsync(
          'INSERT INTO transactions (id, merchantName, category, type, amount, currency, timestamp, accountSource, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [txn.id, txn.merchantName, txn.category, txn.type, txn.amount, txn.currency, txn.date.getTime(), txn.accountSource, txn.status]
        );
      }
    }

    // 3. Check & Seed Portfolio
    const portfolioCheck = await database.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM portfolio');
    if (portfolioCheck && portfolioCheck.count === 0) {
      logger.info('Seeding portfolio...');
      const portfolioData = [
        { id: 'p1', label: 'Netflix Inc.', value: 450000, category: 'stocks', companySymbol: 'NFLX' },
        { id: 'p2', label: 'Apple Inc.', value: 650000, category: 'stocks', companySymbol: 'AAPL' },
        { id: 'p3', label: 'Spotify Tech', value: 380000, category: 'stocks', companySymbol: 'SPOT' },
        { id: 'p4', label: 'Alphabet (YouTube)', value: 520000, category: 'stocks', companySymbol: 'GOOGL' },
        { id: 'p5', label: 'Mutual Funds', value: 850000, category: 'funds' },
        { id: 'p6', label: 'Fixed Deposits', value: 450000, category: 'deposits' },
        { id: 'p7', label: 'Crypto', value: 360500, category: 'crypto' },
      ];
      for (const item of portfolioData) {
        const now = Date.now();
        await database.runAsync(
          'INSERT INTO portfolio (id, label, value, category, companySymbol, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [item.id, item.label, item.value, item.category, item.companySymbol || null, now, now]
        );
      }
    }

    // 4. Seed Default Notification Preferences
    const notifCheck = await database.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM notification_preferences');
    if (notifCheck && notifCheck.count === 0) {
      logger.info('Seeding notification preferences...');
      const defaultPrefs = [
        { id: 'notif_1', category: 'transaction_alerts', enabled: 1 },
        { id: 'notif_2', category: 'balance_warnings', enabled: 1 },
        { id: 'notif_3', category: 'payment_reminders', enabled: 1 },
      ];
      const now = Date.now();
      for (const pref of defaultPrefs) {
        await database.runAsync(
          'INSERT INTO notification_preferences (id, category, enabled, created_at, updated_at) VALUES (?, ?, ?, ?, ?)',
          [pref.id, pref.category, pref.enabled, now, now]
        );
      }
    }

    // 5. Seed Default Budgets
    const budgetCheck = await database.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM budgets');
    if (budgetCheck && budgetCheck.count === 0) {
      logger.info('Seeding budgets...');
      const now = Date.now();
      const currentMonth = new Date().getMonth() + 1;
      const currentYear = new Date().getFullYear();
      const defaultBudgets = [
        { id: 'budget_1', category: 'dining', limit: 10000 },
        { id: 'budget_2', category: 'shopping', limit: 15000 },
        { id: 'budget_3', category: 'transport', limit: 5000 },
        { id: 'budget_4', category: 'bills', limit: 8000 },
        { id: 'budget_5', category: 'entertainment', limit: 5000 },
      ];
      for (const bgt of defaultBudgets) {
        await database.runAsync(
          'INSERT INTO budgets (id, category, limit_amount, spent_amount, month, year, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
          [bgt.id, bgt.category, bgt.limit, 0, currentMonth, currentYear, now, now]
        );
      }
    }

    // 6. Seed AI Memory
    const memoryCheck = await database.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM ai_memory');
    if (memoryCheck && memoryCheck.count === 0) {
      logger.info('Seeding AI memory...');
      const now = Date.now();
      const defaultMemories = [
        { id: 'mem_1', key: 'user_preference', value: 'Prefers dark mode for better focus', category: 'preference' },
        { id: 'mem_2', key: 'user_behavior', value: 'Usually orders from Swiggy on weekends', category: 'behavior' },
        { id: 'mem_3', key: 'financial_insight', value: 'Monthly savings rate is consistently above 30%', category: 'insight' },
        { id: 'mem_4', key: 'user_persona', value: 'Early tech adopter with focus on efficiency', category: 'persona' },
      ];
      for (const mem of defaultMemories) {
        await database.runAsync(
          'INSERT INTO ai_memory (id, key, value, category, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
          [mem.id, mem.key, mem.value, mem.category, now, now]
        );
      }
    }

    // 7. Seed Savings Goals
    const goalsCheck = await database.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM savings_goals');
    if (goalsCheck && goalsCheck.count === 0) {
      logger.info('Seeding savings goals...');
      const now = Date.now();
      const defaultGoals = [
        { id: 'goal_1', name: 'MacBook Pro M4', target: 250000, current: 85000, category: 'electronics', monthly: 15000 },
        { id: 'goal_2', name: 'Japan Trip', target: 400000, current: 120000, category: 'travel', monthly: 20000 },
        { id: 'goal_3', name: 'Emergency Fund', target: 600000, current: 450000, category: 'savings', monthly: 10000 },
      ];
      for (const goal of defaultGoals) {
        const deadline = now + (365 * 24 * 60 * 60 * 1000); // 1 year from now
        await database.runAsync(
          'INSERT INTO savings_goals (id, name, targetAmount, currentAmount, deadline, category, monthlyContribution, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [goal.id, goal.name, goal.target, goal.current, deadline, goal.category, goal.monthly, now, now]
        );
      }
    }

    // 8. Seed Bills
    const billsCheck = await database.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM bills');
    if (billsCheck && billsCheck.count === 0) {
      logger.info('Seeding bills...');
      const now = Date.now();
      const defaultBills = [
        { id: 'bill_1', name: 'Rent', amount: 45000, category: 'housing', day: 1 },
        { id: 'bill_2', name: 'Electricity', amount: 3500, category: 'utilities', day: 15 },
        { id: 'bill_3', name: 'Gym Membership', amount: 2500, category: 'health', day: 5 },
      ];
      for (const bill of defaultBills) {
        const dueDate = new Date();
        dueDate.setDate(bill.day);
        if (dueDate.getTime() < now) dueDate.setMonth(dueDate.getMonth() + 1);
        
        await database.runAsync(
          'INSERT INTO bills (id, name, amount, dueDate, category, isRecurring, recurMonthDays, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [bill.id, bill.name, bill.amount, dueDate.getTime(), bill.category, 1, String(bill.day), now, now]
        );
      }
    }

    logger.info('Database sync/seeding completed');
  } catch (error) {
    logger.error('Error seeding database', error);
    throw error;
  }
};

/**
 * AI Retrieval Hooks:
 * Used later by the AI assistant to query the user's financial state locally.
 */
export const fetchRecentTransactions = async (limit: number = 5): Promise<TransactionRow[]> => {
  const database = await getDb();
  return await database.getAllAsync<TransactionRow>(
    'SELECT * FROM transactions ORDER BY timestamp DESC LIMIT ?',
    [limit]
  );
};

export const fetchTotalNetWorth = async (): Promise<number> => {
  const database = await getDb();
  const accountsResult = await database.getFirstAsync<{ total: number }>(
    'SELECT SUM(balance) as total FROM accounts'
  );
  const portfolioResult = await database.getFirstAsync<{ total: number }>(
    'SELECT SUM(value) as total FROM portfolio'
  );
  
  return (accountsResult?.total || 0) + (portfolioResult?.total || 0);
};

export const fetchCategorySpending = async (days: number = 30): Promise<{ category: string; total: number }[]> => {
  const database = await getDb();
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  
  return await database.getAllAsync<{ category: string; total: number }>(
    'SELECT category, SUM(amount) as total FROM transactions WHERE type = ? AND timestamp >= ? GROUP BY category ORDER BY total DESC',
    ['debit', cutoff]
  );
};

export const fetchDailySpending = async (days: number = 7): Promise<{ date: string; total: number }[]> => {
  const database = await getDb();
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  
  return await database.getAllAsync<{ date: string; total: number }>(
    "SELECT strftime('%Y-%m-%d', timestamp / 1000, 'unixepoch') as date, SUM(amount) as total FROM transactions WHERE type = 'debit' AND timestamp >= ? GROUP BY date ORDER BY date ASC",
    [cutoff]
  );
};

export const searchTransactions = async (query: string, limit: number = 5) => {
  const database = await getDb();
  const searchTerm = `%${query}%`;
  return await database.getAllAsync(
    'SELECT * FROM transactions WHERE merchantName LIKE ? OR category LIKE ? ORDER BY timestamp DESC LIMIT ?',
    [searchTerm, searchTerm, limit]
  );
};

export const createTransaction = async (txn: Omit<TransactionRow, 'embedding'>) => {
  const database = await getDb();
  await database.runAsync(
    'INSERT INTO transactions (id, merchantName, category, type, amount, currency, timestamp, accountSource, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [
      txn.id,
      txn.merchantName,
      txn.category,
      txn.type,
      txn.amount,
      txn.currency || '₹',
      txn.timestamp || Date.now(),
      txn.accountSource,
      txn.status || 'completed'
    ]
  );
};

export const updateAccountBalance = async (accountId: string, newBalance: number) => {
  const database = await getDb();
  await database.runAsync(
    'UPDATE accounts SET balance = ? WHERE id = ?',
    [newBalance, accountId]
  );
};

// ─── Savings Goals CRUD ─────────────────────────────────

export interface SavingsGoalRow {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline: number;
  category: string;
  monthlyContribution: number;
  created_at: number;
  updated_at: number;
  isCompleted: number;
}

export const createSavingsGoal = async (goal: Omit<SavingsGoalRow, 'created_at' | 'updated_at' | 'isCompleted' | 'currentAmount'>) => {
  const database = await getDb();
  const now = Date.now();
  await database.runAsync(
    `INSERT INTO savings_goals (id, name, targetAmount, currentAmount, deadline, category, monthlyContribution, created_at, updated_at, isCompleted)
     VALUES (?, ?, ?, 0, ?, ?, ?, ?, ?, 0)`,
    [goal.id, goal.name, goal.targetAmount, goal.deadline, goal.category, goal.monthlyContribution, now, now]
  );
};

export const fetchSavingsGoal = async (id: string): Promise<SavingsGoalRow | null> => {
  const database = await getDb();
  const result = await database.getFirstAsync<SavingsGoalRow>(
    'SELECT * FROM savings_goals WHERE id = ?',
    [id]
  );
  return result;
};

export const fetchAllSavingsGoals = async (includeCompleted: boolean = false): Promise<SavingsGoalRow[]> => {
  const database = await getDb();
  const query = includeCompleted 
    ? 'SELECT * FROM savings_goals ORDER BY deadline ASC' 
    : 'SELECT * FROM savings_goals WHERE isCompleted = 0 ORDER BY deadline ASC';
  return database.getAllAsync<SavingsGoalRow>(query);
};

export const updateSavingsGoal = async (id: string, updates: Partial<Pick<SavingsGoalRow, 'name' | 'targetAmount' | 'currentAmount' | 'deadline' | 'monthlyContribution' | 'isCompleted'>>) => {
  const database = await getDb();
  const now = Date.now();
  const fields = Object.keys(updates).map(k => `${k} = ?`).join(', ');
  const values = Object.values(updates);
  await database.runAsync(
    `UPDATE savings_goals SET ${fields}, updated_at = ? WHERE id = ?`,
    [...values, now, id]
  );
};

export const deleteSavingsGoal = async (id: string) => {
  const database = await getDb();
  await database.runAsync('DELETE FROM savings_goals WHERE id = ?', [id]);
};

export const addToSavingsGoal = async (id: string, amount: number) => {
  const database = await getDb();
  const now = Date.now();
  await database.runAsync(
    'UPDATE savings_goals SET currentAmount = currentAmount + ?, updated_at = ? WHERE id = ?',
    [amount, now, id]
  );
  // Check if goal is now complete
  const goal = await fetchSavingsGoal(id);
  if (goal && goal.currentAmount >= goal.targetAmount) {
    await database.runAsync('UPDATE savings_goals SET isCompleted = 1, updated_at = ? WHERE id = ?', [now, id]);
  }
};
