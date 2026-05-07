/**
 * Kairo — Account Store
 * Manages account data, active card, and balance visibility
 */

import { create } from 'zustand';

export type AccountType = 'savings' | 'credit' | 'investment' | 'crypto' | 'travel';
export type CardBrand = 'visa' | 'mastercard' | 'rupay';

export interface Account {
  id: string;
  type: AccountType;
  name: string;
  cardNumber: string;
  lastFour: string;
  expiryDate: string;
  balance: number;
  currency: string;
  cardBrand: CardBrand;
  gradientColors: readonly [string, string, string];
  isActive: boolean;
  isFrozen: boolean;
}

export interface AccountDetails {
  availableBalance: number;
  currentEMI: number;
  rewardPoints: number;
  creditScore: number;
  cashbackEarned: number;
  fdMaturityStatus: string;
  sipProgress: number;
  monthlyInterest: number;
}

interface AccountState {
  accounts: Account[];
  activeAccountIndex: number;
  isBalanceVisible: boolean;
  accountDetails: AccountDetails;

  setActiveAccount: (index: number) => void;
  toggleBalanceVisibility: () => void;
  toggleCardFreeze: (id: string) => void;
  updateBalance: (id: string, amount: number) => void;
}

// Premium fake account data
const mockAccounts: Account[] = [
  {
    id: 'acc_001',
    type: 'savings',
    name: 'Platinum Savings',
    cardNumber: '4532 •••• •••• 7821',
    lastFour: '7821',
    expiryDate: '09/28',
    balance: 1245280.00,
    currency: '₹',
    cardBrand: 'visa',
    gradientColors: ['#1A2E3D', '#0B2948', '#061A2E'],
    isActive: true,
    isFrozen: false,
  },
  {
    id: 'acc_002',
    type: 'credit',
    name: 'Centurion Credit',
    cardNumber: '5412 •••• •••• 3456',
    lastFour: '3456',
    expiryDate: '12/27',
    balance: 487500.00,
    currency: '₹',
    cardBrand: 'mastercard',
    gradientColors: ['#3D1A2E', '#2E0D1A', '#1A0811'],
    isActive: false,
    isFrozen: false,
  },
  {
    id: 'acc_003',
    type: 'investment',
    name: 'Growth Portfolio',
    cardNumber: '6521 •••• •••• 9012',
    lastFour: '9012',
    expiryDate: '03/29',
    balance: 3250000.00,
    currency: '₹',
    cardBrand: 'visa',
    gradientColors: ['#1A3D2E', '#0D2E1A', '#081A0D'],
    isActive: false,
    isFrozen: false,
  },
  {
    id: 'acc_004',
    type: 'crypto',
    name: 'Crypto Vault',
    cardNumber: '8923 •••• •••• 4567',
    lastFour: '4567',
    expiryDate: '06/28',
    balance: 892450.00,
    currency: '₹',
    cardBrand: 'visa',
    gradientColors: ['#2E1A3D', '#1A0D2E', '#110820'],
    isActive: false,
    isFrozen: false,
  },
  {
    id: 'acc_005',
    type: 'travel',
    name: 'World Elite Travel',
    cardNumber: '3782 •••• •••• 8901',
    lastFour: '8901',
    expiryDate: '11/27',
    balance: 175000.00,
    currency: '₹',
    cardBrand: 'mastercard',
    gradientColors: ['#3D2E1A', '#2E1A0D', '#1A1108'],
    isActive: false,
    isFrozen: false,
  },
];

const mockDetails: AccountDetails = {
  availableBalance: 1245280.00,
  currentEMI: 24500.00,
  rewardPoints: 42850,
  creditScore: 812,
  cashbackEarned: 8750.00,
  fdMaturityStatus: '₹5,00,000 matures on 15 Aug 2026',
  sipProgress: 68,
  monthlyInterest: 4125.00,
};

export const useAccountStore = create<AccountState>((set) => ({
  accounts: mockAccounts,
  activeAccountIndex: 0,
  isBalanceVisible: true,
  accountDetails: mockDetails,

  setActiveAccount: (index: number) => {
    set((state) => ({
      activeAccountIndex: index,
      accounts: state.accounts.map((acc, i) => ({
        ...acc,
        isActive: i === index,
      })),
    }));
  },

  toggleBalanceVisibility: () => {
    set((state) => ({ isBalanceVisible: !state.isBalanceVisible }));
  },

  toggleCardFreeze: (id: string) => {
    set((state) => ({
      accounts: state.accounts.map((acc) =>
        acc.id === id ? { ...acc, isFrozen: !acc.isFrozen } : acc
      ),
    }));
  },

  updateBalance: (id: string, amount: number) => {
    set((state) => ({
      accounts: state.accounts.map((acc) =>
        acc.id === id ? { ...acc, balance: amount } : acc
      ),
    }));
  },
}));
