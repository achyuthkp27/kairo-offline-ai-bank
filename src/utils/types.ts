/**
 * Kairo — Type Definitions
 * Global TypeScript types
 */

// Navigation
export type RootStackParamList = {
  index: undefined;
  '(tabs)': undefined;
};

export type TabParamList = {
  dashboard: undefined;
  transactions: undefined;
  wealth: undefined;
  ai: undefined;
};

// Transaction types
export type TransactionType = 'debit' | 'credit';
export type TransactionCategory =
  | 'dining'
  | 'shopping'
  | 'bills'
  | 'fuel'
  | 'entertainment'
  | 'groceries'
  | 'travel'
  | 'transfer'
  | 'salary'
  | 'investment'
  | 'subscription'
  | 'health'
  | 'education'
  | 'income';

export interface Transaction {
  id: string;
  merchantName: string;
  merchantLogo?: string;
  category: TransactionCategory;
  type: TransactionType;
  amount: number;
  currency: string;
  date: Date;
  time: string;
  accountSource: string;
  description?: string;
  status: 'completed' | 'pending' | 'failed';
}

// Chart types
export interface ChartDataPoint {
  label: string;
  value: number;
  color?: string;
}

export interface SpendingCategory {
  name: string;
  amount: number;
  percentage: number;
  color: string;
  icon: string;
}

// Wealth types
export interface PortfolioAsset {
  name: string;
  value: number;
  allocation: number;
  change: number;
  color: string;
}

export interface NetWorthDataPoint {
  date: string;
  value: number;
}
