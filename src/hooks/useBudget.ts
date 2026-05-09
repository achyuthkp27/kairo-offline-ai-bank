/**
 * useBudget — Hook for budget data and calculations
 */

import { useState, useEffect, useCallback } from 'react';
import {
  getBudgetsWithProgress,
  getBudgetSummary,
  recalculateAllSpending,
  updateBudgetLimit,
  getOverBudgetCategories,
  BudgetWithProgress,
} from '../services/BudgetService';

interface BudgetState {
  budgets: BudgetWithProgress[];
  summary: {
    totalLimit: number;
    totalSpent: number;
    totalRemaining: number;
    percentage: number;
    overBudgetCategories: string[];
  };
  isLoading: boolean;
  error: string | null;
}

export const useBudget = () => {
  const [state, setState] = useState<BudgetState>({
    budgets: [],
    summary: {
      totalLimit: 0,
      totalSpent: 0,
      totalRemaining: 0,
      percentage: 0,
      overBudgetCategories: [],
    },
    isLoading: true,
    error: null,
  });

  const loadBudgets = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      // Recalculate first to ensure accuracy
      await recalculateAllSpending();

      const [budgets, summary] = await Promise.all([
        getBudgetsWithProgress(),
        getBudgetSummary(),
      ]);

      setState({
        budgets,
        summary,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to load budgets',
      }));
    }
  }, []);

  // Load on mount
  useEffect(() => {
    loadBudgets();
  }, [loadBudgets]);

  const updateLimit = useCallback(async (category: string, newLimit: number) => {
    try {
      await updateBudgetLimit(category, newLimit);
      await loadBudgets(); // Reload after update
    } catch (error) {
      console.error('[useBudget] Failed to update limit:', error);
    }
  }, [loadBudgets]);

  const refresh = useCallback(async () => {
    await loadBudgets();
  }, [loadBudgets]);

  return {
    budgets: state.budgets,
    summary: state.summary,
    isLoading: state.isLoading,
    error: state.error,
    updateLimit,
    refresh,
  };
};

export type { BudgetWithProgress };