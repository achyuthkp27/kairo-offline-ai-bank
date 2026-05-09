/**
 * BudgetService — Monthly budget tracking and category spending calculations
 */

import { getDb } from '../db/database';
import { TransactionCategory } from '../utils/types';

export interface Budget {
  id: string;
  category: string;
  limit_amount: number;
  spent_amount: number;
  month: number;
  year: number;
  created_at: number;
  updated_at: number;
}

export interface BudgetWithProgress extends Budget {
  percentage: number;
  status: 'safe' | 'warning' | 'over';
  remaining: number;
}

const categoryDisplayNames: Record<string, string> = {
  dining: 'Dining',
  shopping: 'Shopping',
  transport: 'Transport',
  bills: 'Bills',
  entertainment: 'Entertainment',
  groceries: 'Groceries',
  travel: 'Travel',
  fuel: 'Fuel',
};

/**
 * Get current month's budgets with calculated progress
 */
export const getBudgetsWithProgress = async (): Promise<BudgetWithProgress[]> => {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  const database = await getDb();
  const budgets = await database.getAllAsync<Budget>(
    'SELECT * FROM budgets WHERE month = ? AND year = ?',
    [month, year]
  );

  return budgets.map(budget => {
    const percentage = budget.limit_amount > 0
      ? (budget.spent_amount / budget.limit_amount) * 100
      : 0;
    const status = percentage >= 100 ? 'over' : percentage >= 80 ? 'warning' : 'safe';
    const remaining = budget.limit_amount - budget.spent_amount;

    return {
      ...budget,
      percentage: Math.min(percentage, 100),
      status,
      remaining: Math.max(remaining, 0),
    };
  });
};

/**
 * Get total budget summary for the month
 */
export const getBudgetSummary = async (): Promise<{
  totalLimit: number;
  totalSpent: number;
  totalRemaining: number;
  percentage: number;
  overBudgetCategories: string[];
}> => {
  const budgets = await getBudgetsWithProgress();

  const totalLimit = budgets.reduce((sum, b) => sum + b.limit_amount, 0);
  const totalSpent = budgets.reduce((sum, b) => sum + b.spent_amount, 0);
  const overBudgetCategories = budgets
    .filter(b => b.status === 'over')
    .map(b => categoryDisplayNames[b.category] || b.category);

  return {
    totalLimit,
    totalSpent,
    totalRemaining: totalLimit - totalSpent,
    percentage: totalLimit > 0 ? (totalSpent / totalLimit) * 100 : 0,
    overBudgetCategories,
  };
};

/**
 * Update spent amount for a category based on transactions
 * Call this when transactions are created or when syncing
 */
export const syncCategorySpending = async (category: string, amount: number): Promise<void> => {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  const database = await getDb();
  const existing = await database.getFirstAsync<Budget>(
    'SELECT * FROM budgets WHERE category = ? AND month = ? AND year = ?',
    [category, month, year]
  );

  if (existing) {
    await database.runAsync(
      'UPDATE budgets SET spent_amount = spent_amount + ?, updated_at = ? WHERE id = ?',
      [amount, Date.now(), existing.id]
    );
  }
};

/**
 * Recalculate all category spending from transactions
 */
export const recalculateAllSpending = async (): Promise<void> => {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  const startOfMonth = new Date(year, now.getMonth(), 1).getTime();

  const database = await getDb();

  // Get spending by category for current month
  const spending = await database.getAllAsync<{ category: string; total: number }>(
    `SELECT category, SUM(amount) as total FROM transactions
     WHERE type = 'debit' AND timestamp >= ?
     GROUP BY category`,
    [startOfMonth]
  );

  // Reset all budgets to 0 first
  await database.runAsync(
    'UPDATE budgets SET spent_amount = 0, updated_at = ? WHERE month = ? AND year = ?',
    [Date.now(), month, year]
  );

  // Update each category with actual spending
  for (const s of spending) {
    await database.runAsync(
      'UPDATE budgets SET spent_amount = ?, updated_at = ? WHERE category = ? AND month = ? AND year = ?',
      [s.total, Date.now(), s.category, month, year]
    );
  }
};

/**
 * Update budget limit for a category
 */
export const updateBudgetLimit = async (category: string, newLimit: number): Promise<void> => {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  const database = await getDb();
  await database.runAsync(
    'UPDATE budgets SET limit_amount = ?, updated_at = ? WHERE category = ? AND month = ? AND year = ?',
    [newLimit, Date.now(), category, month, year]
  );
};

/**
 * Get category display name
 */
export const getCategoryDisplayName = (category: string): string => {
  return categoryDisplayNames[category] || category;
};

/**
 * Check if any category is over budget (for notifications)
 */
export const getOverBudgetCategories = async (): Promise<string[]> => {
  const budgets = await getBudgetsWithProgress();
  return budgets
    .filter(b => b.status === 'over')
    .map(b => categoryDisplayNames[b.category] || b.category);
};