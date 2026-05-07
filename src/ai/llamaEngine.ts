/**
 * Kairo — Native Llama.cpp Engine
 * Runs on-device LLM inference using llama.rn and Metal acceleration
 */

import { initLlama, LlamaContext } from 'llama.rn';
import { useUIStore } from '../store';
import { fetchRecentTransactions, fetchTotalNetWorth, searchTransactions } from '../db/database';
import { formatCurrency } from '../utils/formatters';
import { MODEL_PATH, checkModelExists } from './modelManager';

export const LLAMA_CONFIG = {
  systemPrompt: `You are Kairo, an elite private banking AI concierge for high-net-worth individuals. Be professional, concise, and authoritative. Use bullet points. No emojis or slang. Rely only on live data provided.
If the user asks to navigate, go to a page, or view investments/transactions, you MUST append this JSON at the end of your response:
\`\`\`json
{"action": "navigate", "details": "wealth"} 
\`\`\`
Valid navigation details are: "dashboard", "transactions", "wealth", "ai".
For other actions, use format: {"action": "freeze_card", "details": "card_id"}`,
};

class LlamaEngine {
  private context: LlamaContext | null = null;
  private isGenerating = false;
  private isReady = false;
  private readyResolvers: (() => void)[] = [];
  private cachedNetWorth: number = 0;
  private cachedRecentTxns: any[] = [];

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
      console.log('[LlamaEngine] Warmup failed', e);
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
    const exists = await checkModelExists();
    if (!exists) {
      console.warn('[LlamaEngine] Model not found locally. Please download first.');
      return false;
    }

    if (this.context) {
      return true; // Already initialized
    }

    const t0 = Date.now();
    console.log('[LlamaEngine] Initializing native llama.cpp context...');
    try {
      this.context = await initLlama({
        model: MODEL_PATH,
        use_mlock: true,
        n_ctx: 1024,       // Reduced from 2048 — faster init
        n_gpu_layers: 50,
        n_batch: 512,       // Larger batch = faster prefill
      });
      console.log(`[LlamaEngine] Context initialized in ${Date.now() - t0}ms`);
      
      // Fire warmup in background (don't await — let it run async)
      this.warmupKVCache();
      
      return true;
    } catch (error) {
      console.error('[LlamaEngine] Failed to initialize model:', error);
      throw error;
    }
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
    const [netWorth, recentTxns, ...keywordResults] = await Promise.all([
      this.cachedNetWorth > 0 ? Promise.resolve(this.cachedNetWorth) : fetchTotalNetWorth(),
      this.cachedRecentTxns.length > 0 ? Promise.resolve(this.cachedRecentTxns) : fetchRecentTransactions(3),
      ...topKeywords.map(word => searchTransactions(word, 2)),
    ]);
    
    console.log(`[LlamaEngine] Context built in ${Date.now() - t0}ms`);
    
    // Refresh cache for next query (non-blocking)
    Promise.all([fetchTotalNetWorth(), fetchRecentTransactions(3)]).then(([nw, txns]) => {
      this.cachedNetWorth = nw;
      this.cachedRecentTxns = txns;
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
    if (!this.context) throw new Error('Model not initialized');
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
    console.log('[LlamaEngine] Model unloaded.');
  }

  async runAnomalyDetection() {
    if (this.isGenerating) {
      console.log('[LlamaEngine] Skipping anomaly detection, engine is busy.');
      return;
    }
    
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
          { prompt, n_predict: 128, temperature: 0.1, stop: ['<|im_end|>'] },
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
