/**
 * Kairo — Native Llama.cpp Engine
 * Runs on-device LLM inference using llama.rn and Metal acceleration
 */

import { initLlama, LlamaContext } from 'llama.rn';
import { NativeModules } from 'react-native';
import { useUIStore } from '../store';
import { fetchRecentTransactions, fetchTotalNetWorth } from '../db/database';
import { SemanticSearchService } from '../services/SemanticSearchService';
import { MemoryService } from '../services/MemoryService';
import { SubscriptionService, Subscription } from '../services/SubscriptionService';
import { PredictionService, Prediction } from '../services/PredictionService';
import { formatCurrency } from '../utils/formatters';
import { MODEL_PATH, checkModelExists } from './modelManager';

// Check once at module load — avoids repeated checks
const IS_NATIVE_AVAILABLE = !!NativeModules.RNLlama;

if (!IS_NATIVE_AVAILABLE) {
  console.warn(
    '[LlamaEngine] RNLlama native module not found. ' +
    'AI features disabled. Run "npx expo run:ios" for the native build.'
  );
}

export const LLAMA_CONFIG = {
  systemPrompt: `You are Kairo, an elite private banking AI concierge. Be professional, extremely concise, and authoritative. Keep conversational responses under 2 sentences.
CRITICAL RULES:
1. Rely ONLY on the live data provided in the prompt. Do NOT hallucinate account numbers, recipients, or features.
2. If the user asks to perform a system action (transfer funds, freeze card, list recipients), DO NOT ask for their account details. Instead, output ONLY this JSON block so the app can handle it:
\`\`\`json
{"action": "transfer", "details": "intent"}
\`\`\`
3. If the user asks to navigate (go to wealth, investments, transactions, etc), output ONLY this JSON block:
\`\`\`json
{"action": "navigate", "details": "wealth"} 
\`\`\`
Valid navigation details: "dashboard", "transactions", "wealth", "ai".`,
};

class LlamaEngine {
  private context: LlamaContext | null = null;
  private isGenerating = false;
  private isReady = false;
  private readyResolvers: (() => void)[] = [];
  private cachedNetWorth: number = 0;
  private cachedRecentTxns: any[] = [];
  private cachedSubscriptions: Subscription[] = [];
  private cachedPredictions: Prediction[] = [];
  private initPromise: Promise<boolean> | null = null;

  /** True if the native C++ module is available */
  get isNativeAvailable(): boolean {
    return IS_NATIVE_AVAILABLE;
  }

  private async waitForLock() {
    while (this.isGenerating) {
      await new Promise(r => setTimeout(r, 100));
    }
  }

  private async warmupKVCache() {
    if (!this.context) return;
    
    await this.waitForLock();
    this.isGenerating = true;
    try {
      const t0 = Date.now();
      console.log('[LlamaEngine] Pre-filling KV Cache + pre-caching DB context...');
      
      // Pre-cache database context in parallel with KV warmup
      const [netWorth, recentTxns] = await Promise.all([
        fetchTotalNetWorth(),
        fetchRecentTransactions(3),
      ]);
      this.cachedNetWorth = netWorth;
      this.cachedRecentTxns = recentTxns;
      console.log(`[LlamaEngine] DB pre-cached in ${Date.now() - t0}ms`);
      
      const dummyPrompt = `<|im_start|>system\n${LLAMA_CONFIG.systemPrompt}\n<|im_start|>assistant\n`;
      
      await new Promise<void>((resolve) => {
        this.context?.completion(
          { prompt: dummyPrompt, n_predict: 1, temperature: 0.1 },
          () => {}
        ).then(() => resolve()).catch(() => resolve());
      });
      
      console.log(`[LlamaEngine] Full warmup completed in ${Date.now() - t0}ms`);
    } catch (e) {
      console.log('[LlamaEngine] Warmup failed (non-critical):', e);
    } finally {
      this.isGenerating = false;
      this.isReady = true;
      this.readyResolvers.forEach(r => r());
      this.readyResolvers = [];
    }
  }

  /** Wait until the engine is fully warmed up */
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
        console.log('[LlamaEngine] Initializing native llama.cpp context...');

        this.context = await initLlama({
          model: MODEL_PATH,
          use_mlock: true,
          n_ctx: 1024,
          n_gpu_layers: 50,
          n_batch: 512,
          // Note: embeddings disabled — Qwen instruct models don't support embedding mode.
          // Semantic search uses keyword fallback instead.
        });
        console.log(`[LlamaEngine] Context initialized in ${Date.now() - t0}ms`);
        
        // Fire warmup in background (don't await)
        this.warmupKVCache();
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

  // Detect simple greetings that don't need RAG
  private isSimpleGreeting(query: string): boolean {
    const greetings = /^(hi|hello|hey|good\s*(morning|afternoon|evening)|sup|yo|howdy|greetings|what's up|whats up)[\s!?.]*$/i;
    return greetings.test(query.trim());
  }

  private async buildContextPrompt(userQuery: string, history: {role: 'user'|'assistant', content: string}[] = []): Promise<string> {
    const t0 = Date.now();
    
    // FAST PATH: Simple greetings skip all DB queries
    if (this.isSimpleGreeting(userQuery) && history.length === 0) {
      console.log(`[LlamaEngine] Fast-path greeting, skipping RAG`);
      let prompt = `<|im_start|>system\n${LLAMA_CONFIG.systemPrompt}\n<|im_end|>\n`;
      prompt += `<|im_start|>user\n${userQuery}<|im_end|>\n`;
      prompt += `<|im_start|>assistant\n`;
      return prompt;
    }
    
    // RAG: Keyword search for relevant transactions based on user query
    const stopWords = new Set(['what', 'when', 'where', 'which', 'who', 'whom', 'this', 'that', 'these', 'those', 'have', 'has', 'had', 'doing', 'because', 'until', 'while', 'about', 'against', 'between', 'into', 'through', 'during', 'before', 'after', 'above', 'below', 'under', 'again', 'further', 'then', 'once', 'here', 'there', 'some', 'such', 'only', 'same', 'than', 'very', 'will', 'just', 'should', 'show', 'tell', 'give', 'mine', 'need', 'want', 'please', 'could', 'would', 'take']);
    
    const words = userQuery.toLowerCase().replace(/[^\w\s]/gi, '').split(' ')
      .filter(w => w.length > 3 && !stopWords.has(w));
    const topKeywords = words.sort((a, b) => b.length - a.length).slice(0, 3);

    // Use pre-cached data for speed, with fresh fallback
    const [netWorth, recentTxns, relevantMemories, subscriptions, predictions, ...keywordResults] = await Promise.all([
      this.cachedNetWorth > 0 ? Promise.resolve(this.cachedNetWorth) : fetchTotalNetWorth(),
      this.cachedRecentTxns.length > 0 ? Promise.resolve(this.cachedRecentTxns) : fetchRecentTransactions(3),
      MemoryService.getRelevantMemories(userQuery, 3),
      this.cachedSubscriptions.length > 0 ? Promise.resolve(this.cachedSubscriptions) : SubscriptionService.detectSubscriptions(),
      this.cachedPredictions.length > 0 ? Promise.resolve(this.cachedPredictions) : PredictionService.generatePredictions(),
      ...topKeywords.map(word => SemanticSearchService.searchTransactions(word, 2)),
    ]);
    
    console.log(`[LlamaEngine] Context built in ${Date.now() - t0}ms`);
    
    // Refresh cache for next query (non-blocking)
    Promise.all([
      fetchTotalNetWorth(), 
      fetchRecentTransactions(3), 
      SubscriptionService.detectSubscriptions(),
      PredictionService.generatePredictions()
    ]).then(([nw, txns, subs, preds]) => {
      this.cachedNetWorth = nw;
      this.cachedRecentTxns = txns;
      this.cachedSubscriptions = subs;
      this.cachedPredictions = preds;
    });

    // Deduplicate RAG results by ID
    let relevantTxns: any[] = [];
    if (keywordResults.length > 0) {
      const allResults = keywordResults.flat();
      relevantTxns = allResults.filter((v: any, i: number, a: any[]) => a.findIndex((t: any) => t.id === v.id) === i);
    }
    
    // Qwen Instruct Format — keep prompt compact
    let prompt = `<|im_start|>system\n${LLAMA_CONFIG.systemPrompt}\n`;
    prompt += `[LIVE_DATA]: Net worth: ${formatCurrency(netWorth)}. Recent: ${JSON.stringify(recentTxns)}\n`;
    
    const uiContext = useUIStore.getState().appContext;
    if (uiContext) {
      prompt += `[CONTEXT]: Screen: ${uiContext}\n`;
    }

    if (relevantMemories && relevantMemories.length > 0) {
      prompt += `[USER_MEMORY]: ${relevantMemories.map(m => m.value).join('. ')}\n`;
    }

    if (subscriptions && subscriptions.length > 0) {
      const activeSubs = subscriptions.filter(s => s.status === 'active');
      const totalCost = activeSubs.reduce((sum, s) => sum + s.amount, 0);
      prompt += `[SUBSCRIPTIONS]: ${activeSubs.length} active. Total: ${formatCurrency(totalCost)}/mo. Details: ${JSON.stringify(activeSubs.map(s => ({name: s.merchantName, amount: s.amount, renews: new Date(s.nextRenewalDate).toLocaleDateString()})))}\n`;
    }

    if (predictions && predictions.length > 0) {
      prompt += `[PREDICTIONS]: ${predictions.map(p => p.message).join(' ')}\n`;
    }

    if (relevantTxns.length > 0) {
      prompt += `[RAG]: ${JSON.stringify(relevantTxns)}\n`;
    }
    
    prompt += `<|im_end|>\n`;

    // Only keep last 4 messages to limit prompt size
    const recentHistory = history.slice(-4);
    for (const msg of recentHistory) {
      if (!msg.content.trim()) continue;
      prompt += `<|im_start|>${msg.role}\n${msg.content}<|im_end|>\n`;
    }

    prompt += `<|im_start|>user\n${userQuery}<|im_end|>\n`;
    prompt += `<|im_start|>assistant\n`;
    
    return prompt;
  }

  /**
   * Proper Native Stream generator
   */
  async *generateNativeStream(prompt: string, history: {role: 'user'|'assistant', content: string}[] = []): AsyncGenerator<string, void, unknown> {
    if (!IS_NATIVE_AVAILABLE) throw new Error('Native AI not available');
    if (!this.context) {
      const success = await this.initializeModel();
      if (!success || !this.context) throw new Error('Model not initialized');
    }
    await this.waitForLock();
    this.isGenerating = true;
    
    try {
      const t0 = Date.now();
      const fullPrompt = await this.buildContextPrompt(prompt, history);
      console.log(`[LlamaEngine] Prompt length: ${fullPrompt.length} chars`);
      
      const tokenQueue: string[] = [];
      let completionDone = false;
      let completionError: Error | null = null;
      let firstTokenLogged = false;

      const completionPromise = this.context.completion(
        {
          prompt: fullPrompt,
          n_predict: 512,
          temperature: 0.7,
          top_k: 40,
          top_p: 0.9,
          stop: ['<|im_end|>'],
        },
        (data) => {
          if (data.token) {
            if (!firstTokenLogged) {
              console.log(`[LlamaEngine] ⚡ TTFT: ${Date.now() - t0}ms`);
              firstTokenLogged = true;
            }
            tokenQueue.push(data.token);
          }
        }
      );

      completionPromise
        .then(() => { completionDone = true; })
        .catch((err) => { completionError = err; completionDone = true; });

      while (!completionDone || tokenQueue.length > 0) {
        if (tokenQueue.length > 0) {
          yield tokenQueue.shift() as string;
        } else {
          await new Promise(r => setTimeout(r, 10));
        }
        if (completionError) throw completionError;
      }
    } finally {
      this.isGenerating = false;
    }
  }

  async unloadModel() {
    if (this.context) {
      await this.context.release();
      this.context = null;
    }
  }

  /**
   * Helper for background workers to get a complete response without streaming
   */
  async generateOneShot(prompt: string, n_predict: number = 64): Promise<string> {
    if (!IS_NATIVE_AVAILABLE) return '';
    if (!this.context) {
      const success = await this.initializeModel();
      if (!success || !this.context) return '';
    }
    await this.waitForLock();
    this.isGenerating = true;
    
    try {
      let responseText = '';
      await new Promise((resolve, reject) => {
        this.context?.completion(
          { prompt, n_predict, temperature: 0.1, stop: ['<|im_end|>'] },
          (data) => {
            if (data.token) responseText += data.token;
          }
        ).then(resolve).catch(reject);
      });
      return responseText.trim();
    } finally {
      this.isGenerating = false;
    }
  }

  async runAnomalyDetection() {
    if (!IS_NATIVE_AVAILABLE || this.isGenerating) return;
    
    this.isGenerating = true;
    try {
      const initialized = await this.initializeModel();
      if (!initialized || !this.context) return;

      const recentTxns = await fetchRecentTransactions(1);
      if (recentTxns.length === 0) return;

      const latestTxn = recentTxns[0] as any;
      // Skip small transactions to avoid annoying alerts in demo
      if (latestTxn.amount < 1000) return;

      console.log('[LlamaEngine] Running background anomaly detection...');
      const prompt = `<|im_start|>system\nYou are Kairo's security agent. Output strictly JSON.<|im_end|>\n<|im_start|>user\nAnalyze this transaction for anomalies: ${JSON.stringify(latestTxn)}. Is a ${latestTxn.amount} charge normal? Output JSON only: {"anomaly": boolean, "reason": "short reason"}.<|im_end|>\n<|im_start|>assistant\n`;
      
      let responseText = '';
      await new Promise((resolve, reject) => {
        this.context?.completion(
          { prompt, n_predict: 32, temperature: 0.1, stop: ['<|im_end|>'] },
          (data) => {
            if (data.token) responseText += data.token;
          }
        ).then(resolve).catch(reject);
      });

      console.log('[LlamaEngine] Anomaly result:', responseText);
      const match = responseText.match(/\{[\s\S]*\}/);
      if (match) {
        const result = JSON.parse(match[0]);
        if (result.anomaly) {
           const { Alert } = require('react-native');
           Alert.alert('⚠️ Kairo Security Alert', result.reason);
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
