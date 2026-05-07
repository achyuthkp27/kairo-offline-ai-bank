import { createTransaction, updateAccountBalance } from '../db/database';
import { useAccountStore } from '../store';
import { TransactionCategory } from '../utils/types';

export const TransferService = {
  /**
   * Executes a real-time transfer:
   * 1. Deducts amount from local SQLite
   * 2. Updates the global AccountStore (UI State)
   * 3. Creates a new transaction record
   */
  async performTransfer(
    amount: number, 
    recipientName: string, 
    category: TransactionCategory = 'transfer'
  ) {
    const { accounts, activeAccountIndex, updateBalance } = useAccountStore.getState();
    const activeAccount = accounts[activeAccountIndex];

    if (activeAccount.balance < amount) {
      throw new Error('Insufficient funds');
    }

    const newBalance = activeAccount.balance - amount;
    const txnId = `txn_${Date.now()}`;

    // 1. Update Database
    await updateAccountBalance(activeAccount.id, newBalance);
    
    // 2. Create Transaction record
    await createTransaction({
      id: txnId,
      merchantName: recipientName,
      category,
      type: 'debit',
      amount: amount,
      currency: '₹',
      timestamp: Date.now(),
      accountSource: activeAccount.name,
      status: 'completed'
    });

    // 3. Update UI State
    updateBalance(activeAccount.id, newBalance);

    return { success: true, txnId };
  },

  /**
   * Simulates adding funds to an account
   */
  async addFunds(amount: number) {
    const { accounts, activeAccountIndex, updateBalance } = useAccountStore.getState();
    const activeAccount = accounts[activeAccountIndex];

    const newBalance = activeAccount.balance + amount;
    const txnId = `add_${Date.now()}`;

    await updateAccountBalance(activeAccount.id, newBalance);
    
    await createTransaction({
      id: txnId,
      merchantName: 'Self Transfer (Add Funds)',
      category: 'income',
      type: 'credit',
      amount: amount,
      currency: '₹',
      timestamp: Date.now(),
      accountSource: activeAccount.name,
      status: 'completed'
    });

    updateBalance(activeAccount.id, newBalance);

    return { success: true, txnId };
  }
};
