import { getDb } from '../db/database';
import { embeddingEngine } from '../ai/embeddingEngine';
import type { TransactionRow } from '../db/database';

const MAX_TRANSACTIONS_TO_SCORE = 50;
const embeddingCache = new Map<string, number[]>();
let cachedTransactions: TransactionRow[] | null = null;
let cacheTime = 0;
const CACHE_TTL_MS = 60000;

interface ScoredTransaction extends TransactionRow {
  _score: number;
}

export class SemanticSearchService {
  static async searchTransactions(query: string, limit: number = 3): Promise<TransactionRow[]> {
    const queryLower = query.toLowerCase().trim();
    if (!queryLower) return [];

    const now = Date.now();
    if (!cachedTransactions || now - cacheTime > CACHE_TTL_MS) {
      const database = await getDb();
      cachedTransactions = await database.getAllAsync<TransactionRow>(
        'SELECT * FROM transactions ORDER BY timestamp DESC LIMIT ?',
        [MAX_TRANSACTIONS_TO_SCORE]
      );
      cacheTime = now;
    }

    const transactions = cachedTransactions;
    if (transactions.length === 0) return [];

    let queryEmbedding: number[] | undefined = embeddingCache.get(queryLower);
    if (!queryEmbedding) {
      const generated = await embeddingEngine.generateEmbedding(queryLower);
      if (generated && generated.length > 0) {
        queryEmbedding = generated;
        embeddingCache.set(queryLower, generated);
      }
    }

    if (transactions.length === 0) return [];

    if (!queryEmbedding || queryEmbedding.length === 0) {
      const searchTerm = `%${queryLower}%`;
      const results = transactions.filter(t => 
        t.merchantName.toLowerCase().includes(queryLower) || 
        t.category.toLowerCase().includes(queryLower)
      );
      return results.slice(0, limit);
    }

    const scoredTransactions: ScoredTransaction[] = transactions.map(txn => {
      let semanticScore = 0;
      let keywordScore = 0;

      if (txn.embedding) {
        try {
          const txnEmbedding = JSON.parse(txn.embedding);
          semanticScore = embeddingEngine.cosineSimilarity(queryEmbedding, txnEmbedding);
        } catch (e) {
          console.warn('[SemanticSearch] Failed to parse transaction embedding:', e);
        }
      }

      const searchTarget = `${txn.merchantName} ${txn.category}`.toLowerCase();
      if (searchTarget.includes(queryLower)) {
        keywordScore = 1.0;
      }

      const finalScore = (semanticScore * 0.7) + (keywordScore * 0.3);
      return { ...txn, _score: finalScore };
    });

    scoredTransactions.sort((a, b) => b._score - a._score);

    return scoredTransactions.slice(0, limit).map(t => {
      const { _score, ...rest } = t;
      return rest;
    });
  }
}
