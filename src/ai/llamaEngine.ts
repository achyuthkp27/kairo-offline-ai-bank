import { initLlama, LlamaContext } from 'llama.rn';
import { NativeModules, Alert } from 'react-native';
import { useUIStore } from '../store';
import { fetchRecentTransactions, fetchTotalNetWorth, TransactionRow } from '../db/database';
import { SemanticSearchService } from '../services/SemanticSearchService';
import { MemoryService, AIMemory } from '../services/MemoryService';
import { SubscriptionService, Subscription } from '../services/SubscriptionService';
import { PredictionService, Prediction } from '../services/PredictionService';
import { getBudgetSummary, getBudgetsWithProgress, BudgetWithProgress } from '../services/BudgetService';
import { SavingsGoalService, SavingsGoal } from '../services/SavingsGoalService';
import { BillService, Bill } from '../services/BillService';
import { DebtService, DebtPayoffPlan } from '../services/DebtService';
import { InvestmentService, PortfolioAnalysis } from '../services/InvestmentService';
import { formatCurrency } from '../utils/formatters';
import { MODEL_PATH, checkModelExists } from './modelManager';
import {
  MODEL_CONFIG,
  INFERENCE_CONFIG,
  FAST_QUERY_CONFIG,
  ONE_SHOT_CONFIG,
  RAG_CONFIG,
  ANOMALY_CONFIG,
} from '../config/model-config';
import {
  SYSTEM_PROMPTS,
} from '../config/ai-prompts';

const IS_NATIVE_AVAILABLE = !!NativeModules.RNLlama;

if (!IS_NATIVE_AVAILABLE) {
  console.warn(
    '[LlamaEngine] RNLlama native module not found. ' +
    'Run "npx expo run:ios" for the native build.'
  );
}
const ANOMALY_THRESHOLD = 5000;
const ANOMALY_N_PREDICT = 64;

export const LLAMA_CONFIG = {
  systemPrompt: SYSTEM_PROMPTS.MAIN,
};

const STOP_WORDS = new Set([
  'what', 'when', 'where', 'which', 'who', 'whom', 'this', 'that', 'these',
  'those', 'have', 'has', 'had', 'doing', 'because', 'until', 'while', 'about',
  'against', 'between', 'into', 'through', 'during', 'before', 'after', 'above',
  'below', 'under', 'again', 'further', 'then', 'once', 'here', 'there', 'some',
  'such', 'only', 'same', 'than', 'very', 'will', 'just', 'should', 'show',
  'tell', 'give', 'mine', 'need', 'want', 'please', 'could', 'would', 'take',
  'can', 'get', 'see', 'use', 'like', 'know', 'also',
]);

const GREETING_PATTERN = /^(hi|hello|hey|good\s*(morning|afternoon|evening)|sup|yo|howdy|greetings|what's up|whats up)[\s!?.]*$/i;

// Non-financial query patterns - skip heavy RAG fetching
const NON_FINANCIAL_PATTERNS = [
  /^(what\s+is|what's|define|explain)\s+(gst|goods\s+and\s+services\s+tax)/i,
  /^(what\s+is|what's|define|explain)\s+(income\s+tax|tax)/i,
  /^(how\s+does|explain)\s+(tax|taxation)/i,
  /^(what\s+is|explain)\s+(investment|stock|mutual\s+fund)/i,
  /^(what\s+is|explain)\s+(crypto|bitcoin|ethereum)/i,
  /^(what\s+is|explain)\s+(loan|interest\s+rate|mortgage)/i,
  /^(explain|what\s+is)\s+(epf|nps|retirement)/i,
  /^(what|how|why|when|where|who|can\s+i)\s+\w+\s*$/i, // General questions
  /^(help|thanks|thank\s+you|nice|cool|awesome)/i,
];

function isNonFinancialQuery(query: string): boolean {
  return NON_FINANCIAL_PATTERNS.some(pattern => pattern.test(query.trim()));
}

class LlamaEngine {
  private context: LlamaContext | null = null;
  private isGenerating = false;
  private isReady = false;
  private readyResolvers: (() => void)[] = [];
  private cachedNetWorth: number = 0;
  private cachedRecentTxns: TransactionRow[] = [];
  private cachedSubscriptions: Subscription[] = [];
  private cachedPredictions: Prediction[] = [];
  private initPromise: Promise<boolean> | null = null;
  private abortController: AbortController | null = null;

  get isNativeAvailable(): boolean {
    return IS_NATIVE_AVAILABLE;
  }

  private async waitForLock(): Promise<boolean> {
    const pollInterval = 10; // Reduced from 100ms for faster handoff
    const maxWait = 30000;
    let waited = 0;
    while (this.isGenerating) {
      await new Promise(r => setTimeout(r, pollInterval));
      waited += pollInterval;
      if (waited >= maxWait) {
        console.warn('[LlamaEngine] WaitForLock timeout — forcing release');
        this.isGenerating = false;
        return false;
      }
    }
    return true;
  }

  private sanitizeUserInput(input: string): string {
    return input
      .replace(/<\|im_start\|>/g, '')
      .replace(/<\|im_end\|>/g, '')
      .replace(/<\|/g, '')
      .replace(/\|>/g, '')
      .trim();
  }

  private truncatePrompt(prompt: string, maxChars: number): string {
    if (prompt.length <= maxChars) return prompt;
    
    // Reserve at least 20% for system prompt and 10% for the actual user query
    const systemEnd = prompt.indexOf('<|im_end|>\n') + '<|im_end|>\n'.length;
    const systemPart = prompt.slice(0, systemEnd);
    
    const userPartMatch = prompt.match(/<\|im_start|>user\n[\s\S]*?<\|im_end\|>\n<\|im_start|>assistant\n$/);
    const userPart = userPartMatch ? userPartMatch[0] : '';
    
    const budget = maxChars - systemPart.length - userPart.length - 200; // 200 for safety
    
    if (budget <= 0) {
      // Extremely tight context - just keep system and current user query
      return systemPart + '\n...' + userPart;
    }
    
    const middle = prompt.slice(systemEnd, prompt.length - userPart.length);
    const truncatedMiddle = '\n...' + middle.slice(-budget);
    
    return systemPart + truncatedMiddle + userPart;
  }

  private async warmupKVCache() {
    if (!this.context) return;
    const acquired = await this.waitForLock();
    if (!acquired) return;
    this.isGenerating = true;
    try {
      const t0 = Date.now();
      const [netWorth, recentTxns] = await Promise.all([
        fetchTotalNetWorth(),
        fetchRecentTransactions(RAG_CONFIG.MAX_RECENT_TRANSACTIONS),
      ]);
      this.cachedNetWorth = netWorth;
      this.cachedRecentTxns = recentTxns as TransactionRow[];

      const dummyPrompt = `<|im_start|>system\n${LLAMA_CONFIG.systemPrompt}\n<|im_start|>assistant\n`;
      await new Promise<void>((resolve) => {
        this.context?.completion(
          { prompt: dummyPrompt, n_predict: 1, temperature: 0.1 },
          () => {}
        ).then(() => resolve()).catch(() => resolve());
      });
    } catch (e) {
      console.log('[LlamaEngine] Warmup failed (non-critical):', e);
    } finally {
      this.isGenerating = false;
      this.isReady = true;
      this.readyResolvers.forEach(r => r());
      this.readyResolvers = [];
    }
  }

  waitUntilReady(): Promise<void> {
    if (this.isReady) return Promise.resolve();
    return new Promise(resolve => this.readyResolvers.push(resolve));
  }

  async initializeModel(): Promise<boolean> {
    if (!IS_NATIVE_AVAILABLE) return false;
    if (this.context) return true;
    if (this.initPromise) return this.initPromise;

    this.initPromise = (async () => {
      try {
        const exists = await checkModelExists();
        if (!exists) {
          console.warn('[LlamaEngine] Model not found locally. Please download first.');
          return false;
        }

        const t0 = Date.now();
        this.context = await initLlama({
          model: MODEL_PATH,
          use_mlock: MODEL_CONFIG.USE_MLOCK,
          n_ctx: MODEL_CONFIG.N_CTX,
          n_gpu_layers: MODEL_CONFIG.N_GPU_LAYERS,
          n_batch: MODEL_CONFIG.N_BATCH,
        });
        this.warmupKVCache().catch(e => console.warn('[LlamaEngine] Warmup failed:', e));
        return true;
      } catch (error) {
        console.error('[LlamaEngine] Failed to initialize model:', error);
        this.context = null;
        return false;
      }
    })();

    const result = await this.initPromise;
    this.initPromise = null;
    return result;
  }

  private isSimpleGreeting(query: string): boolean {
    return GREETING_PATTERN.test(query.trim());
  }

  private extractKeywords(userQuery: string): string[] {
    const words = userQuery.toLowerCase().replace(/[^\w\s]/gi, '').split(' ')
      .filter(w => w.length > 3 && !STOP_WORDS.has(w));
    return words.sort((a, b) => b.length - a.length).slice(0, RAG_CONFIG.MAX_RAG_KEYWORDS);
  }

  private async buildContextPrompt(userQuery: string, history: {role: 'user'|'assistant', content: string}[] = []): Promise<string> {
    const t0 = Date.now();
    const sanitizedQuery = this.sanitizeUserInput(userQuery);

    // Fast path for non-financial queries - skip heavy RAG
    if (history.length === 0 && isNonFinancialQuery(sanitizedQuery)) {
      console.log('[LlamaEngine] Fast path: non-financial query, skipping RAG');
      let prompt = `<|im_start|>system\n${SYSTEM_PROMPTS.MAIN}\n<|im_end|>\n`;
      prompt += `<|im_start|>user\n${sanitizedQuery}<|im_end|>\n`;
      prompt += `<|im_start|>assistant\n`;
      return prompt;
    }

    if (this.isSimpleGreeting(sanitizedQuery) && history.length === 0) {
      let prompt = `<|im_start|>system\n${LLAMA_CONFIG.systemPrompt}\n<|im_end|>\n`;
      prompt += `<|im_start|>user\n${sanitizedQuery}<|im_end|>\n`;
      prompt += `<|im_start|>assistant\n`;
      return prompt;
    }

    const queryLower = sanitizedQuery.toLowerCase();
    const needsBudget = queryLower.includes('budget') || queryLower.includes('spent') || queryLower.includes('limit');
    const needsGoals = queryLower.includes('goal') || queryLower.includes('save') || queryLower.includes('target');
    const needsBills = queryLower.includes('bill') || queryLower.includes('due') || queryLower.includes('pay');
    const needsDebt = queryLower.includes('debt') || queryLower.includes('loan') || queryLower.includes('interest') || queryLower.includes('owe');
    const needsInvestments = queryLower.includes('invest') || queryLower.includes('stock') || queryLower.includes('portfolio') || queryLower.includes('mutual');

    const topKeywords = this.extractKeywords(sanitizedQuery);

    const settled = await Promise.allSettled([
      this.cachedNetWorth > 0 ? Promise.resolve(this.cachedNetWorth) : fetchTotalNetWorth(),
      this.cachedRecentTxns.length > 0 ? Promise.resolve(this.cachedRecentTxns) : fetchRecentTransactions(RAG_CONFIG.MAX_RECENT_TRANSACTIONS),
      MemoryService.getRelevantMemories(sanitizedQuery, RAG_CONFIG.MAX_RELEVANT_MEMORIES),
      this.cachedSubscriptions.length > 0 ? Promise.resolve(this.cachedSubscriptions) : SubscriptionService.detectSubscriptions(),
      this.cachedPredictions.length > 0 ? Promise.resolve(this.cachedPredictions) : PredictionService.generatePredictions(),
      needsBudget ? getBudgetSummary() : Promise.resolve(null),
      needsGoals ? SavingsGoalService.getGoalSummary() : Promise.resolve(null),
      needsBills ? BillService.getBillSummary() : Promise.resolve(null),
      needsDebt ? DebtService.getDebtSummary() : Promise.resolve(null),
      needsInvestments ? InvestmentService.analyzePortfolio() : Promise.resolve(null),
      ...(topKeywords.length > 0 
        ? topKeywords.slice(0, 2).map(word => SemanticSearchService.searchTransactions(word, 3)) 
        : [])
    ]);

    const netWorth: number = settled[0].status === 'fulfilled' ? settled[0].value : 0;
    const recentTxns: TransactionRow[] = settled[1].status === 'fulfilled' ? settled[1].value as TransactionRow[] : [];
    const relevantMemories: AIMemory[] = settled[2].status === 'fulfilled' ? settled[2].value as AIMemory[] : [];
    const subscriptions: Subscription[] = settled[3].status === 'fulfilled' ? settled[3].value as Subscription[] : [];
    const predictions: Prediction[] = settled[4].status === 'fulfilled' ? settled[4].value as Prediction[] : [];
    const budgetSummary = settled[5].status === 'fulfilled' ? settled[5].value : null;
    const savingsGoals = settled[6].status === 'fulfilled' ? settled[6].value : null;
    const billSummary = settled[7].status === 'fulfilled' ? settled[7].value : null;
    const debtSummary = settled[8].status === 'fulfilled' ? settled[8].value : null;
    const portfolioAnalysis = settled[9].status === 'fulfilled' ? settled[9].value : null;
    const keywordResults = settled.slice(10).filter(r => r.status === 'fulfilled').map((r) => r.value as TransactionRow[]);

    const rejected = settled.filter(r => r.status === 'rejected');
    if (rejected.length > 0) {
      console.warn('[LlamaEngine] Context query failures:',
        rejected.map((r: PromiseRejectedResult) => r.reason instanceof Error ? r.reason.message : String(r.reason)));
    }

    Promise.allSettled([
      fetchTotalNetWorth(),
      fetchRecentTransactions(RAG_CONFIG.MAX_RECENT_TRANSACTIONS),
      SubscriptionService.detectSubscriptions(),
      PredictionService.generatePredictions()
    ]).then((results) => {
      const nw = results[0];
      const txns = results[1];
      const subs = results[2];
      const preds = results[3];
      if (nw.status === 'fulfilled') this.cachedNetWorth = nw.value;
      if (txns.status === 'fulfilled') this.cachedRecentTxns = txns.value as TransactionRow[];
      if (subs.status === 'fulfilled') this.cachedSubscriptions = subs.value as Subscription[];
      if (preds.status === 'fulfilled') this.cachedPredictions = preds.value as Prediction[];
    });

    let relevantTxns: TransactionRow[] = [];
    if (keywordResults.length > 0) {
      const allResults = keywordResults.flat();
      const seen = new Set<string>();
      relevantTxns = allResults.filter((v) => {
        if (seen.has(v.id)) return false;
        seen.add(v.id);
        return true;
      });
    }

    // 1. STATIC SYSTEM BLOCK (Preserves KV cache)
    let prompt = `<|im_start|>system\n${SYSTEM_PROMPTS.MAIN}\n<|im_end|>\n`;

    // 2. DYNAMIC CONTEXT BLOCK (User block context for better recall)
    prompt += `<|im_start|>system\n[KNOWLEDGE_CONTEXT]\n`;
    prompt += `[NET_WORTH]: ${formatCurrency(netWorth)}\n`;
    prompt += `[TRANSACTIONS]: ${JSON.stringify(recentTxns.map(t => ({ merchant: t.merchantName, amount: t.amount, category: t.category })))}\n`;

    const uiContext = useUIStore.getState().appContext;
    if (uiContext) {
      prompt += `[SCREEN]: ${uiContext}\n`;
    }

    if (budgetSummary && budgetSummary.totalLimit > 0) {
      prompt += `[BUDGET]: ${formatCurrency(budgetSummary.totalSpent)}/${formatCurrency(budgetSummary.totalLimit)} (${Math.round(budgetSummary.percentage)}%).`;
      if (budgetSummary.overBudgetCategories.length > 0) {
        prompt += ` OVER: ${budgetSummary.overBudgetCategories.join(', ')}.`;
      }
      prompt += '\n';
    }

    if (savingsGoals && savingsGoals.totalGoals > 0) {
      prompt += `[GOALS]: ${savingsGoals.totalGoals} goals, ₹${savingsGoals.totalSaved.toLocaleString()} saved of ₹${savingsGoals.totalTarget.toLocaleString()}.`;
      if (savingsGoals.closestGoal) {
        prompt += ` Nearest: ${savingsGoals.closestGoal.name} (${Math.round(savingsGoals.closestGoal.percentage)}%).`;
      }
      prompt += '\n';
    }

    if (billSummary && billSummary.totalBills > 0) {
      prompt += `[BILLS]: ₹${billSummary.totalDue.toLocaleString()} due.`;
      if (billSummary.overdueCount > 0) prompt += ` ${billSummary.overdueCount} OVERDUE!`;
      if (billSummary.dueSoonCount > 0) prompt += ` ${billSummary.dueSoonCount} due soon.`;
      prompt += '\n';
    }

    if (debtSummary && debtSummary.totalDebt > 0) {
      prompt += `[DEBT]: ₹${debtSummary.totalDebt.toLocaleString()}, ₹${debtSummary.totalMinimum}/mo min. ${debtSummary.recommendation}\n`;
    }

    if (portfolioAnalysis && portfolioAnalysis.totalValue > 0) {
      prompt += `[INVESTMENTS]: ₹${portfolioAnalysis.totalValue.toLocaleString()}, ${portfolioAnalysis.riskScore} risk. `;
      if (portfolioAnalysis.recommendations.length > 0) {
        prompt += portfolioAnalysis.recommendations[0].reason;
      }
      if (portfolioAnalysis.yearChangePercent !== 0) {
        prompt += ` YTD: ${portfolioAnalysis.yearChangePercent >= 0 ? '+' : ''}${portfolioAnalysis.yearChangePercent.toFixed(1)}%.`;
      }
      prompt += '\n';
    }

    // Emergency fund check
    const monthlyExpenses = budgetSummary?.totalSpent || recentTxns.reduce((sum, t) => sum + (t.type === 'debit' ? t.amount : 0), 0);
    const emergencyFundTarget = monthlyExpenses * 3;
    const hasEmergencyFund = netWorth > emergencyFundTarget;
    prompt += `[EMERGENCY_FUND]: Target: ₹${emergencyFundTarget.toLocaleString()}, Current: ${hasEmergencyFund ? '✅ Adequate' : '⚠️ Build up'}. Need ${Math.max(0, emergencyFundTarget - netWorth).toLocaleString()} more.\n`;

    if (relevantMemories.length > 0) {
      prompt += `[USER_PREFERENCES]: ${relevantMemories.map(m => m.value).join('. ')}\n`;
    }

    if (subscriptions.length > 0) {
      const activeSubs = subscriptions.filter((s) => s.status === 'active');
      if (activeSubs.length > 0) {
        const totalCost = activeSubs.reduce((sum, s) => sum + s.amount, 0);
        prompt += `[SUBSCRIPTIONS]: ${activeSubs.length} active, ₹${totalCost}/mo.\n`;
      }
    }

    if (predictions.length > 0) {
      prompt += `[INSIGHTS]: ${predictions.map(p => p.message).join('. ')}\n`;
    }

    if (relevantTxns.length > 0) {
      prompt += `[RELATED_TXNS]: ${JSON.stringify(relevantTxns.map(t => ({ merchant: t.merchantName, amount: t.amount })))}\n`;
    }

    prompt += `<|im_end|>\n`;

    const recentHistory = history.slice(-RAG_CONFIG.MAX_HISTORY_MESSAGES);
    for (const msg of recentHistory) {
      if (!msg.content.trim()) continue;
      prompt += `<|im_start|>${msg.role}\n${msg.content}<|im_end|>\n`;
    }

    prompt += `<|im_start|>user\n${sanitizedQuery}<|im_end|>\n`;
    prompt += `<|im_start|>assistant\n`;

    const maxTokensForPrompt = MODEL_CONFIG.N_CTX - INFERENCE_CONFIG.N_PREDICT - 200; // 200 for safety margin
    const trimmed = this.truncatePrompt(prompt, maxTokensForPrompt * 4);
    return trimmed;
  }

  cancelGeneration(): boolean {
    if (this.isGenerating && this.abortController) {
      this.abortController.abort();
      this.abortController = null;
      return true;
    }
    return false;
  }

  async *generateNativeStream(
    prompt: string,
    history: {role: 'user'|'assistant', content: string}[] = [],
    signal?: AbortSignal
  ): AsyncGenerator<string, void, unknown> {
    if (!IS_NATIVE_AVAILABLE) throw new Error('Native AI hardware acceleration not available');
    
    if (!this.context) {
      const success = await this.initializeModel();
      if (!success || !this.context) throw new Error('Neural engine failed to initialize');
    }

    const acquired = await this.waitForLock();
    if (!acquired) throw new Error('Neural engine busy — please try again in a moment');

    this.isGenerating = true;
    this.abortController = new AbortController();
    const mergedSignal = signal || this.abortController.signal;

    try {
      const fullPrompt = await this.buildContextPrompt(prompt, history);

      // Log context usage for debugging in development
      if (__DEV__) {
        console.log(`[LlamaEngine] Sending prompt (${fullPrompt.length} chars)`);
      }

      // Use faster config for non-financial queries
      const isFastQuery = history.length === 0 && isNonFinancialQuery(prompt);
      const config = isFastQuery ? FAST_QUERY_CONFIG : INFERENCE_CONFIG;

      const tokenQueue: string[] = [];
      let completionDone = false;
      let completionError: Error | null = null;

      const completionPromise = this.context.completion(
        {
          prompt: fullPrompt,
          n_predict: config.N_PREDICT,
          temperature: config.TEMPERATURE,
          top_k: config.TOP_K,
          top_p: config.TOP_P,
          stop: [config.STOP_TOKEN, '<|im_start|>', '<|im_end|>'],
        },
        (data) => {
          if (data.token) {
            tokenQueue.push(data.token);
          }
        }
      );

      completionPromise
        .then(() => { completionDone = true; })
        .catch((err) => { 
          console.error('[LlamaEngine] Completion error:', err);
          completionError = err; 
          completionDone = true; 
        });

      while (!completionDone || tokenQueue.length > 0) {
        if (mergedSignal.aborted) {
          throw new Error('Generation cancelled');
        }

        if (tokenQueue.length > 0) {
          yield tokenQueue.shift() as string;
        } else {
          await new Promise(r => setTimeout(r, 10));
        }

        if (completionError) {
          throw completionError;
        }
      }
    } catch (error) {
      this.isGenerating = false;
      this.abortController = null;
      console.error('[LlamaEngine] Generation failed:', error);
      throw error;
    } finally {
      this.isGenerating = false;
      this.abortController = null;
    }
  }

  async unloadModel() {
    if (this.context) {
      try {
        this.cancelGeneration();
        await this.context.release();
        this.context = null;
        this.isReady = false;
        this.cachedNetWorth = 0;
        this.cachedRecentTxns = [];
        this.cachedSubscriptions = [];
        this.cachedPredictions = [];
      } catch (e) {
        console.error('[LlamaEngine] Error unloading model:', e);
      }
    }
  }

  async generateOneShot(prompt: string, n_predict: number = ONE_SHOT_CONFIG.N_PREDICT): Promise<string> {
    if (!IS_NATIVE_AVAILABLE) return '';
    if (!this.context) {
      const success = await this.initializeModel();
      if (!success || !this.context) return '';
    }
    const acquired = await this.waitForLock();
    if (!acquired) return '';

    this.isGenerating = true;
    try {
      let responseText = '';
      await new Promise<void>((resolve, reject) => {
        this.context?.completion(
          {
            prompt,
            n_predict,
            temperature: ONE_SHOT_CONFIG.TEMPERATURE,
            stop: [ONE_SHOT_CONFIG.STOP_TOKEN],
          },
          (data) => {
            if (data.token) responseText += data.token;
          }
        ).then(() => resolve()).catch(reject);
      });
      return responseText.trim();
    } catch (error) {
      console.error('[LlamaEngine] OneShot failed:', error);
      return '';
    } finally {
      this.isGenerating = false;
    }
  }

  async runAnomalyDetection() {
    if (!IS_NATIVE_AVAILABLE || this.isGenerating) return;

    const initialized = await this.initializeModel();
    if (!initialized || !this.context) return;

    const recentTxns = await fetchRecentTransactions(1);
    if (recentTxns.length === 0) return;

    const latestTxn: TransactionRow = recentTxns[0] as TransactionRow;
    if (latestTxn.amount < ANOMALY_THRESHOLD) return;

    const acquired = await this.waitForLock();
    if (!acquired) return;

    this.isGenerating = true;
    try {
      const prompt = `<|im_start|>system\n${SYSTEM_PROMPTS.ANOMALY}<|im_end|>\n<|im_start|>user\nAnalyze this transaction for anomalies: ${JSON.stringify(latestTxn)}. Is a ${latestTxn.amount} charge normal? Output JSON only: {"anomaly": boolean, "reason": "short reason"}.<|im_end|>\n<|im_start|>assistant\n`;

      let responseText = '';
      await new Promise<void>((resolve, reject) => {
        this.context?.completion(
          { prompt, n_predict: ANOMALY_N_PREDICT, temperature: 0.1, stop: ['<|im_end|>'] },
          (data) => {
            if (data.token) responseText += data.token;
          }
        ).then(() => resolve()).catch(reject);
      });

      const match = responseText.match(/\{[\s\S]*\}/);
      if (match) {
        try {
          const result = JSON.parse(match[0]);
          if (result.anomaly) {
            Alert.alert('Kairo Security Alert', result.reason);
          }
        } catch (parseError) {
          console.warn('[LlamaEngine] Failed to parse anomaly response:', parseError);
        }
      }
    } catch (error) {
      console.error('[LlamaEngine] Anomaly detection failed', error);
    } finally {
      this.isGenerating = false;
    }
  }
}

export const llamaEngine = new LlamaEngine();
