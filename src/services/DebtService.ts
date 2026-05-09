/**
 * DebtService — Debt payoff planning and optimization
 */

import { getDb } from '../db/database';

export interface Debt {
  id: string;
  name: string;
  type: 'credit_card' | 'personal_loan' | 'car_loan' | 'home_loan' | 'student_loan' | 'other';
  initialAmount: number;
  currentBalance: number;
  interestRate: number;
  minimumPayment: number;
  dueDate: number;
  created_at: number;
  updated_at: number;
}

export interface DebtPayoffPlan {
  debtId: string;
  strategy: 'avalanche' | 'snowball' | 'balanced';
  monthsToPayoff: number;
  totalInterest: number;
  totalPaid: number;
  monthlyPayment: number;
  extraPayment: number;
  projectedPayoffDate: number;
  steps: PayoffStep[];
}

export interface PayoffStep {
  month: number;
  payment: number;
  principal: number;
  interest: number;
  balance: number;
}

export interface DebtSummary {
  totalDebt: number;
  totalMinimum: number;
  debtCount: number;
  highestRate: number;
  averageRate: number;
  debtFreeDate: number | null;
  recommendedStrategy: 'avalanche' | 'snowball' | 'balanced';
  recommendation: string;
}

export class DebtService {
  static async getDebts(): Promise<Debt[]> {
    const database = await getDb();
    return database.getAllAsync<Debt>(
      'SELECT * FROM debts ORDER BY interestRate DESC'
    );
  }

  static async calculatePayoffPlan(
    debtId: string,
    extraPayment: number = 0,
    strategy: DebtPayoffPlan['strategy'] = 'avalanche'
  ): Promise<DebtPayoffPlan | null> {
    const debt = await (await this.getDebts()).find(d => d.id === debtId);
    if (!debt) return null;

    const months: PayoffStep[] = [];
    let balance = debt.currentBalance;
    let totalInterest = 0;
    const now = Date.now();
    let month = 0;

    while (balance > 0 && month < 360) {
      const monthlyRate = debt.interestRate / 100 / 12;
      const interestPayment = balance * monthlyRate;
      const payment = Math.min(debt.minimumPayment + extraPayment, balance + interestPayment);
      const principalPayment = payment - interestPayment;
      
      balance = Math.max(0, balance - principalPayment);
      totalInterest += interestPayment;
      month++;
      
      months.push({
        month,
        payment,
        principal: principalPayment,
        interest: interestPayment,
        balance
      });
    }

    const totalPaid = debt.currentBalance + totalInterest;
    const monthlyPayment = debt.minimumPayment + extraPayment;

    return {
      debtId,
      strategy,
      monthsToPayoff: month,
      totalInterest,
      totalPaid,
      monthlyPayment,
      extraPayment,
      projectedPayoffDate: now + (month * 30 * 24 * 60 * 60 * 1000),
      steps: months
    };
  }

  static async getDebtSummary(): Promise<DebtSummary> {
    const debts = await this.getDebts();
    
    if (debts.length === 0) {
      return {
        totalDebt: 0,
        totalMinimum: 0,
        debtCount: 0,
        highestRate: 0,
        averageRate: 0,
        debtFreeDate: null,
        recommendedStrategy: 'avalanche',
        recommendation: 'No debt. Great job!'
      };
    }

    const totalDebt = debts.reduce((sum, d) => sum + d.currentBalance, 0);
    const totalMinimum = debts.reduce((sum, d) => sum + d.minimumPayment, 0);
    const highestRate = Math.max(...debts.map(d => d.interestRate));
    const averageRate = debts.reduce((sum, d) => sum + d.interestRate, 0) / debts.length;
    
    const sortedByRate = [...debts].sort((a, b) => b.interestRate - a.interestRate);
    const avalanche = sortedByRate[0];
    const snowball = [...debts].sort((a, b) => a.currentBalance - b.currentBalance)[0];
    
    let recommendedStrategy: DebtSummary['recommendedStrategy'] = 'avalanche';
    let recommendation = '';
    
    if (highestRate > 15) {
      recommendedStrategy = 'avalanche';
      recommendation = `Focus on ${avalanche.name} (${avalanche.interestRate}%) first - highest interest.`;
    } else if (totalDebt < 50000) {
      recommendedStrategy = 'snowball';
      recommendation = `Pay off ${snowball.name} first for quick wins.`;
    } else {
      recommendedStrategy = 'balanced';
      recommendation = `Balance high-interest debt with smaller balances.`;
    }

    return {
      totalDebt,
      totalMinimum,
      debtCount: debts.length,
      highestRate,
      averageRate,
      debtFreeDate: null,
      recommendedStrategy,
      recommendation
    };
  }

  static async createDebt(
    name: string,
    type: Debt['type'],
    initialAmount: number,
    currentBalance: number,
    interestRate: number,
    minimumPayment: number,
    dueDate: number
  ): Promise<string> {
    const database = await getDb();
    const id = `debt_${Date.now()}`;
    const now = Date.now();

    await database.runAsync(
      `INSERT INTO debts (id, name, type, initialAmount, currentBalance, interestRate, minimumPayment, dueDate, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, name, type, initialAmount, currentBalance, interestRate, minimumPayment, dueDate, now, now]
    );

    return id;
  }

  static async updateBalance(debtId: string, newBalance: number): Promise<void> {
    const database = await getDb();
    await database.runAsync(
      'UPDATE debts SET currentBalance = ?, updated_at = ? WHERE id = ?',
      [newBalance, Date.now(), debtId]
    );
  }

  static async makePayment(debtId: string, amount: number): Promise<void> {
    const debts = await this.getDebts();
    const debt = debts.find(d => d.id === debtId);
    if (debt) {
      await this.updateBalance(debtId, Math.max(0, debt.currentBalance - amount));
    }
  }

  static async getAISummary(): Promise<string> {
    const summary = await this.getDebtSummary();
    if (summary.debtCount === 0) return 'No debt. Excellent!';
    
    let text = `DEBT: ₹${summary.totalDebt.toLocaleString()} across ${summary.debtCount} accounts. `;
    text += `Min payment: ₹${summary.totalMinimum}/month. `;
    text += summary.recommendation;
    
    return text;
  }
}