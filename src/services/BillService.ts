/**
 * BillService — Full bill tracking with due date reminders
 */

import { getDb } from '../db/database';

export interface Bill {
  id: string;
  name: string;
  amount: number;
  dueDate: number;
  category: 'utility' | 'rent' | 'insurance' | 'subscription' | 'loan' | 'other';
  isRecurring: boolean;
  recurMonthDays: number[];
  isPaid: boolean;
  paidAt?: number;
  reminderDays: number;
  created_at: number;
  updated_at: number;
}

export interface BillWithStatus extends Bill {
  daysUntilDue: number;
  isOverdue: boolean;
  isDueSoon: boolean;
  status: 'pending' | 'due_soon' | 'overdue' | 'paid';
}

export class BillService {
  static async getBills(): Promise<BillWithStatus[]> {
    const database = await getDb();
    const bills = await database.getAllAsync<Bill>(
      'SELECT * FROM bills ORDER BY dueDate ASC'
    );

    const now = Date.now();
    return bills.map(bill => {
      const daysUntilDue = Math.ceil((bill.dueDate - now) / (24 * 60 * 60 * 1000));
      const isOverdue = daysUntilDue < 0 && !bill.isPaid;
      const isDueSoon = daysUntilDue <= bill.reminderDays && daysUntilDue >= 0;
      let status: BillWithStatus['status'] = 'pending';
      
      if (bill.isPaid) status = 'paid';
      else if (isOverdue) status = 'overdue';
      else if (isDueSoon) status = 'due_soon';

      return { ...bill, daysUntilDue, isOverdue, isDueSoon, status };
    });
  }

  static async getUpcomingBills(days: number = 7): Promise<BillWithStatus[]> {
    const now = Date.now();
    const futureDate = now + (days * 24 * 60 * 60 * 1000);
    
    const bills = await this.getBills();
    return bills.filter(b => 
      b.status !== 'paid' && 
      (b.daysUntilDue <= days || b.isOverdue)
    );
  }

  static async getUnpaidBills(): Promise<BillWithStatus[]> {
    const bills = await this.getBills();
    return bills.filter(b => b.status !== 'paid');
  }

  static async getBillSummary(): Promise<{
    totalDue: number;
    overdueCount: number;
    dueSoonCount: number;
    totalBills: number;
    nextBill: BillWithStatus | null;
    overdueBills: BillWithStatus[];
  }> {
    const bills = await this.getBills();
    const unpaid = bills.filter(b => b.status !== 'paid');
    
    const overdueBills = unpaid.filter(b => b.isOverdue);
    const dueSoon = unpaid.filter(b => b.isDueSoon);
    const nextBill = unpaid.reduce((a, b) => a.daysUntilDue < b.daysUntilDue ? a : b, unpaid[0]);
    
    const totalDue = unpaid.reduce((sum, b) => sum + b.amount, 0);

    return {
      totalDue,
      overdueCount: overdueBills.length,
      dueSoonCount: dueSoon.length,
      totalBills: unpaid.length,
      nextBill: nextBill || null,
      overdueBills
    };
  }

  static async createBill(
    name: string,
    amount: number,
    dueDate: number,
    category: Bill['category'],
    isRecurring: boolean = false,
    recurMonthDays: number[] = [],
    reminderDays: number = 3
  ): Promise<string> {
    const database = await getDb();
    const id = `bill_${Date.now()}`;
    const now = Date.now();

    await database.runAsync(
      `INSERT INTO bills (id, name, amount, dueDate, category, isRecurring, recurMonthDays, isPaid, reminderDays, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?)`,
      [id, name, amount, dueDate, category, isRecurring ? 1 : 0, JSON.stringify(recurMonthDays), reminderDays, now, now]
    );

    return id;
  }

  static async markAsPaid(billId: string): Promise<void> {
    const database = await getDb();
    const bill = await database.getFirstAsync<Bill>('SELECT * FROM bills WHERE id = ?', [billId]);
    
    if (bill) {
      const now = Date.now();
      let nextDue = bill.dueDate;
      
      if (bill.isRecurring && bill.recurMonthDays?.length > 0) {
        const nextMonth = new Date(bill.dueDate);
        nextMonth.setMonth(nextMonth.getMonth() + 1);
        nextDue = nextMonth.getTime();
        
        await database.runAsync(
          'UPDATE bills SET isPaid = 0, dueDate = ?, updated_at = ? WHERE id = ?',
          [nextDue, now, billId]
        );
      } else {
        await database.runAsync(
          'UPDATE bills SET isPaid = 1, paidAt = ?, updated_at = ? WHERE id = ?',
          [now, now, billId]
        );
      }
    }
  }

  static async updateBill(billId: string, updates: Partial<Bill>): Promise<void> {
    const database = await getDb();
    const now = Date.now();
    
    if (updates.dueDate !== undefined) {
      await database.runAsync('UPDATE bills SET dueDate = ?, updated_at = ? WHERE id = ?', [updates.dueDate, now, billId]);
    }
    if (updates.amount !== undefined) {
      await database.runAsync('UPDATE bills SET amount = ?, updated_at = ? WHERE id = ?', [updates.amount, now, billId]);
    }
  }

  static async getAISummary(): Promise<string> {
    const summary = await this.getBillSummary();
    if (summary.totalBills === 0) return 'No bills to track.';
    
    let text = `BILLS: ₹${summary.totalDue.toLocaleString()} due. `;
    if (summary.overdueCount > 0) text += `${summary.overdueCount} OVERDUE! `;
    if (summary.dueSoonCount > 0) text += `${summary.dueSoonCount} due soon.`;
    
    if (summary.nextBill) {
      text += ` Next: ${summary.nextBill.name} (₹${summary.nextBill.amount}) due in ${summary.nextBill.daysUntilDue} days.`;
    }
    return text;
  }
}