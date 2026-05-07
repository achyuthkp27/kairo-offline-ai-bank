/**
 * Kairo — Local Database Architecture
 * Offline-first SQLite setup for accounts, transactions, and portfolio
 */

import * as SQLite from 'expo-sqlite';
import { MOCK_TRANSACTIONS } from '../utils/mockData';
import { useAccountStore } from '../store';

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
        status TEXT DEFAULT 'completed'
      );

      CREATE TABLE IF NOT EXISTS portfolio (
        id TEXT PRIMARY KEY,
        label TEXT NOT NULL,
        value REAL NOT NULL,
        category TEXT NOT NULL
      );
    `);

    // Check if seeded
    const accountCheck = await database.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM accounts'
    );

    if (accountCheck && accountCheck.count === 0) {
      console.log('Seeding initial data...');
      await seedDatabase(database);
    }
    
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
  }
};

const seedDatabase = async (database: SQLite.SQLiteDatabase) => {
  try {
    // 1. Seed Accounts
    const accounts = useAccountStore.getState().accounts;
    for (const acc of accounts) {
      await database.runAsync(
        'INSERT INTO accounts (id, name, balance, type, currency, cardNetwork, cardNumber, isActive) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [
          acc.id,
          acc.name,
          acc.balance,
          acc.type,
          acc.currency,
          acc.cardBrand || null,
          acc.cardNumber || null,
          acc.isActive ? 1 : 0
        ]
      );
    }

    // 2. Seed Transactions
    for (const txn of MOCK_TRANSACTIONS) {
      await database.runAsync(
        'INSERT INTO transactions (id, merchantName, category, type, amount, currency, timestamp, accountSource, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [
          txn.id,
          txn.merchantName,
          txn.category,
          txn.type,
          txn.amount,
          txn.currency,
          txn.date.getTime(),
          txn.accountSource,
          txn.status
        ]
      );
    }

    // 3. Seed Portfolio Data
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

    console.log('Database seeded successfully');
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
