import { runInTransaction } from '../db/database';
import { useAccountStore } from '../store';
import { TransactionCategory } from '../utils/types';
import { notifyLargeTransaction, checkAndNotifyLowBalance } from './NotificationService';
import { logger, validateMoneyAmount, validateRecipientName } from '../utils';

const IDEMPOTENCY_KEYS = new Set<string>();
const IDEMPOTENCY_WINDOW_MS = 5_000;

export const TransferService = {
  /**
   * Executes a real-time transfer:
   * 1. Validates input and checks idempotency
   * 2. Deducts amount from local SQLite
   * 3. Updates the global AccountStore (UI State)
   * 4. Creates a new transaction record
   */
  async performTransfer(
    amount: number, 
    recipientName: string, 
    category: TransactionCategory = 'transfer'
  ) {
    const amountValidationError = validateMoneyAmount(amount);
    if (amountValidationError) throw new Error(amountValidationError);
    const recipientValidationError = validateRecipientName(recipientName);
    if (recipientValidationError) throw new Error(recipientValidationError);

    const normalizedRecipient = recipientName.trim().toLowerCase();
    const normalizedAmount = amount.toFixed(2);
    const idempotencyKey = `transfer:${normalizedRecipient}:${normalizedAmount}`;
    if (IDEMPOTENCY_KEYS.has(idempotencyKey)) {
      throw new Error('Duplicate transfer request detected. Please wait.');
    }
    IDEMPOTENCY_KEYS.add(idempotencyKey);
    setTimeout(() => IDEMPOTENCY_KEYS.delete(idempotencyKey), IDEMPOTENCY_WINDOW_MS);

    const { accounts, activeAccountIndex, updateBalance } = useAccountStore.getState();
    
    if (!accounts || accounts.length === 0) {
      throw new Error('No accounts available');
    }
    
    const activeAccount = accounts[activeAccountIndex];
    if (!activeAccount) {
      throw new Error('No active account selected');
    }

    if (activeAccount.balance < amount) {
      throw new Error('Insufficient funds');
    }

    const newBalance = activeAccount.balance - amount;
    const txnId = `txn_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

    try {
      await runInTransaction(async (database) => {
        await database.runAsync(
          'UPDATE accounts SET balance = ? WHERE id = ?',
          [newBalance, activeAccount.id]
        );

        await database.runAsync(
          'INSERT INTO transactions (id, merchantName, category, type, amount, currency, timestamp, accountSource, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [
            txnId,
            recipientName.trim(),
            category,
            'debit',
            amount,
            activeAccount.currency || '₹',
            Date.now(),
            activeAccount.name,
            'completed',
          ]
        );
      });

      updateBalance(activeAccount.id, newBalance);

      // Trigger notifications
      if (amount > 500) {
        notifyLargeTransaction(recipientName.trim(), amount, activeAccount.currency || '₹');
      }
      checkAndNotifyLowBalance(newBalance);

      return { success: true, txnId };
    } catch (error) {
      logger.error('Transfer transaction failed', error);
      IDEMPOTENCY_KEYS.delete(idempotencyKey);
      throw error;
    }
  },

  /**
   * Simulates adding funds to an account
   */
  async addFunds(amount: number) {
    const amountValidationError = validateMoneyAmount(amount);
    if (amountValidationError) throw new Error(amountValidationError);

    const { accounts, activeAccountIndex, updateBalance } = useAccountStore.getState();
    
    if (!accounts || accounts.length === 0) {
      throw new Error('No accounts available');
    }

    const activeAccount = accounts[activeAccountIndex];
    if (!activeAccount) {
      throw new Error('No active account selected');
    }

    const newBalance = activeAccount.balance + amount;
    const txnId = `add_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

    await runInTransaction(async (database) => {
      await database.runAsync(
        'UPDATE accounts SET balance = ? WHERE id = ?',
        [newBalance, activeAccount.id]
      );

      await database.runAsync(
        'INSERT INTO transactions (id, merchantName, category, type, amount, currency, timestamp, accountSource, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [
          txnId,
          'Self Transfer (Add Funds)',
          'income',
          'credit',
          amount,
          activeAccount.currency || '₹',
          Date.now(),
          activeAccount.name,
          'completed',
        ]
      );
    });

    updateBalance(activeAccount.id, newBalance);

    return { success: true, txnId };
  }
};
