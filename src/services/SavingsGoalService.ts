/**
 * SavingsGoalService — Financial goal tracking with AI coaching
 */

import { getDb } from '../db/database';

export interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline: number;
  category: 'emergency' | 'purchase' | 'investment' | 'travel' | 'other';
  monthlyContribution: number;
  created_at: number;
  updated_at: number;
  isCompleted: boolean;
}

export interface GoalWithProgress extends SavingsGoal {
  percentage: number;
  monthsRemaining: number;
  projectedAmount: number;
  onTrack: boolean;
  recommendation?: string;
}

export class SavingsGoalService {
  static async getGoals(): Promise<GoalWithProgress[]> {
    const database = await getDb();
    const goals = await database.getAllAsync<SavingsGoal>(
      'SELECT * FROM savings_goals WHERE isCompleted = 0 ORDER BY deadline ASC'
    );

    const now = Date.now();
    return goals.map(goal => {
      const timeRemaining = goal.deadline - now;
      const monthsRemaining = Math.max(0, Math.ceil(timeRemaining / (30 * 24 * 60 * 60 * 1000)));
      const amountNeeded = goal.targetAmount - goal.currentAmount;
      const monthlyNeeded = monthsRemaining > 0 ? amountNeeded / monthsRemaining : amountNeeded;
      const projectedAmount = goal.currentAmount + (goal.monthlyContribution * (12 - new Date().getMonth()));
      const percentage = (goal.currentAmount / goal.targetAmount) * 100;
      const onTrack = projectedAmount >= goal.targetAmount * 0.9;

      let recommendation: string | undefined;
      if (!onTrack && monthlyNeeded > goal.monthlyContribution * 1.5) {
        recommendation = `Increase monthly savings by ₹${Math.round(monthlyNeeded - goal.monthlyContribution)} to reach your goal`;
      } else if (onTrack) {
        recommendation = `You're on track! Keep saving ₹${goal.monthlyContribution}/month`;
      }

      return {
        ...goal,
        percentage: Math.min(percentage, 100),
        monthsRemaining,
        projectedAmount,
        onTrack,
        recommendation
      };
    });
  }

  static async getGoalSummary(): Promise<{
    totalGoals: number;
    onTrack: number;
    atRisk: number;
    totalSaved: number;
    totalTarget: number;
    closestGoal: GoalWithProgress | null;
  }> {
    const goals = await this.getGoals();
    
    if (goals.length === 0) {
      return { totalGoals: 0, onTrack: 0, atRisk: 0, totalSaved: 0, totalTarget: 0, closestGoal: null };
    }

    const onTrack = goals.filter(g => g.onTrack).length;
    const atRisk = goals.length - onTrack;
    const totalSaved = goals.reduce((sum, g) => sum + g.currentAmount, 0);
    const totalTarget = goals.reduce((sum, g) => sum + g.targetAmount, 0);
    const closestGoal = goals.reduce((a, b) => a.monthsRemaining < b.monthsRemaining ? a : b);

    return { totalGoals: goals.length, onTrack, atRisk, totalSaved, totalTarget, closestGoal };
  }

  static async createGoal(
    name: string,
    targetAmount: number,
    deadline: number,
    category: SavingsGoal['category'],
    monthlyContribution: number
  ): Promise<string> {
    const database = await getDb();
    const id = `goal_${Date.now()}`;
    const now = Date.now();

    await database.runAsync(
      `INSERT INTO savings_goals (id, name, targetAmount, currentAmount, deadline, category, monthlyContribution, created_at, updated_at, isCompleted)
       VALUES (?, ?, ?, 0, ?, ?, ?, ?, ?, 0)`,
      [id, name, targetAmount, deadline, category, monthlyContribution, now, now]
    );

    return id;
  }

  static async updateContribution(goalId: string, newMonthly: number): Promise<void> {
    const database = await getDb();
    await database.runAsync(
      'UPDATE savings_goals SET monthlyContribution = ?, updated_at = ? WHERE id = ?',
      [newMonthly, Date.now(), goalId]
    );
  }

  static async addFunds(goalId: string, amount: number): Promise<void> {
    const database = await getDb();
    const goal = await database.getFirstAsync<SavingsGoal>(
      'SELECT * FROM savings_goals WHERE id = ?',
      [goalId]
    );
    
    if (goal) {
      const newAmount = goal.currentAmount + amount;
      const isCompleted = newAmount >= goal.targetAmount;
      await database.runAsync(
        'UPDATE savings_goals SET currentAmount = ?, updated_at = ?, isCompleted = ? WHERE id = ?',
        [newAmount, Date.now(), isCompleted ? 1 : 0, goalId]
      );
    }
  }

  static async getAISummary(): Promise<string> {
    const summary = await this.getGoalSummary();
    if (summary.totalGoals === 0) return 'No savings goals set yet.';

    let text = `SAVINGS GOALS: ${summary.totalGoals} active. Total saved: ₹${summary.totalSaved.toLocaleString()} of ₹${summary.totalTarget.toLocaleString()}. `;
    if (summary.onTrack > 0) text += `${summary.onTrack} on track. `;
    if (summary.atRisk > 0) text += `${summary.atRisk} at risk.`;
    
    if (summary.closestGoal) {
      text += ` Nearest: ${summary.closestGoal.name} (${Math.round(summary.closestGoal.percentage)}%) due ${new Date(summary.closestGoal.deadline).toLocaleDateString()}`;
    }
    return text;
  }
}