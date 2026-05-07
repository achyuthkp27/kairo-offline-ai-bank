/**
 * Kairo — Local Database Architecture
 * Offline-first SQLite setup for accounts, transactions, and portfolio
 */

import * as SQLite from 'expo-sqlite';
import { MOCK_TRANSACTIONS } from '../utils/mockData';
import { useAccountStore } from '../store';

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
        category TEXT NOT NULL
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
    `);

    // 1. Check & Seed Accounts
    const accountCheck = await database.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM accounts');
    if (accountCheck && accountCheck.count === 0) {
      console.log('[DB] Seeding accounts...');
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
    if (txnCheck && txnCheck.count === 0) {
      console.log('[DB] Seeding transactions...');
      // Use a simpler loop without heavy embedding logic for the first boot to ensure reliability
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
      console.log('[DB] Seeding portfolio...');
      const portfolioData = [
        { id: 'p1', label: 'Indian Equities', value: 2150000, category: 'stocks' },
        { id: 'p2', label: 'Mutual Funds', value: 850000, category: 'funds' },
        { id: 'p3', label: 'Fixed Deposits', value: 450000, category: 'deposits' },
        { id: 'p4', label: 'Crypto', value: 360500, category: 'crypto' },
      ];
      for (const item of portfolioData) {
        await database.runAsync(
          'INSERT INTO portfolio (id, label, value, category) VALUES (?, ?, ?, ?)',
          [item.id, item.label, item.value, item.category]
        );
      }
    }

    console.log('Database sync/seeding completed');
  } catch (error) {
    console.error('Error seeding database:', error);
  }
};

/**
 * AI Retrieval Hooks:
 * Used later by the AI assistant to query the user's financial state locally.
 */
export const fetchRecentTransactions = async (limit: number = 5) => {
  const database = await getDb();
  return await database.getAllAsync(
    'SELECT * FROM transactions ORDER BY timestamp DESC LIMIT ?',
    [limit]
  );
};

export const fetchTotalNetWorth = async () => {
  const database = await getDb();
  const accountsResult = await database.getFirstAsync<{ total: number }>(
    'SELECT SUM(balance) as total FROM accounts'
  );
  const portfolioResult = await database.getFirstAsync<{ total: number }>(
    'SELECT SUM(value) as total FROM portfolio'
  );
  
  return (accountsResult?.total || 0) + (portfolioResult?.total || 0);
};

export const fetchCategorySpending = async (days: number = 30) => {
  const database = await getDb();
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  
  return await database.getAllAsync(
    'SELECT category, SUM(amount) as total FROM transactions WHERE type = ? AND timestamp >= ? GROUP BY category ORDER BY total DESC',
    ['debit', cutoff]
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
