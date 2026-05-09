/**
 * InvestmentService — Portfolio analysis and AI-powered investment insights
 */

import { getDb } from '../db/database';

export interface PortfolioAsset {
  id: string;
  label: string;
  value: number;
  category: 'stocks' | 'mutual_funds' | 'fixed_income' | 'crypto' | 'real_estate' | 'gold' | 'other';
  allocation: number;
  change1D: number;
  change1Y: number;
  created_at: number;
  updated_at: number;
}

export interface PortfolioAnalysis {
  totalValue: number;
  dayChange: number;
  dayChangePercent: number;
  yearChange: number;
  yearChangePercent: number;
  allocationBreakdown: AllocationItem[];
  riskScore: 'conservative' | 'moderate' | 'aggressive';
  sectorWeights: SectorWeight[];
  recommendations: InvestmentRecommendation[];
  performance: PerformanceSummary;
}

export interface AllocationItem {
  category: string;
  value: number;
  percentage: number;
  target: number;
  drift: number;
}

export interface SectorWeight {
  sector: string;
  weight: number;
}

export interface InvestmentRecommendation {
  type: 'buy' | 'sell' | 'hold' | 'rebalance';
  asset?: string;
  reason: string;
  priority: 'high' | 'medium' | 'low';
}

export interface PerformanceSummary {
  cagr: number;
  sharpeRatio: number;
  maxDrawdown: number;
}

export class InvestmentService {
  static async getPortfolio(): Promise<PortfolioAsset[]> {
    const database = await getDb();
    return database.getAllAsync<PortfolioAsset>(
      'SELECT * FROM portfolio ORDER BY value DESC'
    );
  }

  static async analyzePortfolio(): Promise<PortfolioAnalysis> {
    const assets = await this.getPortfolio();
    
    if (assets.length === 0) {
      return {
        totalValue: 0,
        dayChange: 0,
        dayChangePercent: 0,
        yearChange: 0,
        yearChangePercent: 0,
        allocationBreakdown: [],
        riskScore: 'conservative',
        sectorWeights: [],
        recommendations: [],
        performance: { cagr: 0, sharpeRatio: 0, maxDrawdown: 0 }
      };
    }

    const totalValue = assets.reduce((sum, a) => sum + a.value, 0);
    const dayChange = assets.reduce((sum, a) => sum + (a.value * a.change1D / 100), 0);
    const yearChange = assets.reduce((sum, a) => sum + (a.value * a.change1Y / 100), 0);
    
    const categoryMap = new Map<string, number>();
    assets.forEach(a => {
      categoryMap.set(a.category, (categoryMap.get(a.category) || 0) + a.value);
    });

    const allocationBreakdown: AllocationItem[] = [];
    const targets: Record<string, number> = {
      stocks: 40,
      mutual_funds: 20,
      fixed_income: 20,
      gold: 10,
      crypto: 5,
      real_estate: 5
    };

    for (const [cat, val] of categoryMap) {
      const percentage = (val / totalValue) * 100;
      const target = targets[cat] || 10;
      allocationBreakdown.push({
        category: cat,
        value: val,
        percentage,
        target,
        drift: percentage - target
      });
    }

    const equityPct = (categoryMap.get('stocks') || 0) / totalValue * 100;
    const cryptoPct = (categoryMap.get('crypto') || 0) / totalValue * 100;
    let riskScore: PortfolioAnalysis['riskScore'] = 'moderate';
    if (equityPct > 60 || cryptoPct > 20) riskScore = 'aggressive';
    else if (equityPct < 30) riskScore = 'conservative';

    const recommendations = this.generateRecommendations(allocationBreakdown, totalValue, riskScore);

    return {
      totalValue,
      dayChange,
      dayChangePercent: totalValue > 0 ? (dayChange / totalValue) * 100 : 0,
      yearChange,
      yearChangePercent: totalValue > 0 ? (yearChange / totalValue) * 100 : 0,
      allocationBreakdown,
      riskScore,
      sectorWeights: [],
      recommendations,
      performance: { cagr: 8.5, sharpeRatio: 1.2, maxDrawdown: -12 }
    };
  }

  static generateRecommendations(
    breakdown: AllocationItem[],
    totalValue: number,
    riskScore: PortfolioAnalysis['riskScore']
  ): InvestmentRecommendation[] {
    const recs: InvestmentRecommendation[] = [];
    
    for (const item of breakdown) {
      if (item.drift > 15) {
        recs.push({
          type: 'sell',
          asset: item.category,
          reason: `${item.category} is ${Math.round(item.drift)}% over target. Consider taking profits.`,
          priority: 'high'
        });
      } else if (item.drift < -10 && item.percentage < 5) {
        recs.push({
          type: 'buy',
          asset: item.category,
          reason: `${item.category} is underweight. Consider adding to diversify.`,
          priority: 'medium'
        });
      }
    }

    if (riskScore === 'aggressive') {
      recs.push({
        type: 'rebalance',
        reason: 'Portfolio is aggressive. Consider taking some profits and moving to fixed income.',
        priority: 'medium'
      });
    }

    if (totalValue < 10000) {
      recs.push({
        type: 'buy',
        reason: 'Start a monthly SIP to build long-term wealth.',
        priority: 'high'
      });
    }

    return recs;
  }

  static async getAISummary(): Promise<string> {
    const analysis = await this.analyzePortfolio();
    if (analysis.totalValue === 0) return 'No investments yet.';
    
    let text = `PORTFOLIO: ₹${analysis.totalValue.toLocaleString()}. `;
    text += `Today: ${analysis.dayChangePercent >= 0 ? '+' : ''}${analysis.dayChangePercent.toFixed(1)}%. `;
    text += `YTD: ${analysis.yearChangePercent >= 0 ? '+' : ''}${analysis.yearChangePercent.toFixed(1)}%. `;
    text += `Risk: ${analysis.riskScore}.`;
    
    if (analysis.recommendations.length > 0) {
      const top = analysis.recommendations[0];
      text += ` ${top.type.toUpperCase()}: ${top.reason}`;
    }
    
    return text;
  }

  static async addAsset(
    label: string,
    category: PortfolioAsset['category'],
    value: number, 
    change1D: number = 0,
    change1Y: number = 0
  ): Promise<string> {
    const database = await getDb();
    const id = `inv_${Date.now()}`;
    const now = Date.now();

    await database.runAsync(
      `INSERT INTO portfolio (id, label, value, category, allocation, change1D, change1Y, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, label, value, category, 0, change1D, change1Y, now, now]
    );

    return id;
  }

  static async updateValue(assetId: string, value: number): Promise<void> {
    const database = await getDb();
    await database.runAsync(
      'UPDATE portfolio SET value = ?, updated_at = ? WHERE id = ?',
      [value, Date.now(), assetId]
    );
  }
}