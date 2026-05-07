/**
 * Kairo — Semantic Search Service
 * Performs hybrid semantic + keyword search over transactions locally
 */

import { getDb } from '../db/database';
import { embeddingEngine } from '../ai/embeddingEngine';

export class SemanticSearchService {
  /**
   * Search transactions using hybrid scoring (Semantic + Keyword)
   */
  static async searchTransactions(query: string, limit: number = 5): Promise<any[]> {
    const t0 = Date.now();
    
    // 1. Generate query embedding
    const queryEmbedding = await embeddingEngine.generateEmbedding(query.toLowerCase());
    
    // 2. Fetch all transactions (in a real app, you'd paginate or filter by date first)
    const database = await getDb();
    const transactions = await database.getAllAsync<any>('SELECT * FROM transactions');
    
    if (transactions.length === 0) return [];
    
    // If embedding failed or isn't ready, fallback to pure SQL keyword search
    if (queryEmbedding.length === 0) {
      console.warn('[SemanticSearch] Embedding failed, falling back to keyword search');
      const searchTerm = `%${query}%`;
      return await database.getAllAsync(
        'SELECT * FROM transactions WHERE merchantName LIKE ? OR category LIKE ? ORDER BY timestamp DESC LIMIT ?',
        [searchTerm, searchTerm, limit]
      );
    }
    
    // 3. Score each transaction
    const scoredTransactions = transactions.map(txn => {
      let semanticScore = 0;
      let keywordScore = 0;
      
      // Compute Semantic Score
      if (txn.embedding) {
        try {
          const txnEmbedding = JSON.parse(txn.embedding);
          semanticScore = embeddingEngine.cosineSimilarity(queryEmbedding, txnEmbedding);
        } catch (e) {
          // Ignore parse errors for old data
        }
      }
      
      // Compute Keyword Score (simple exact substring match gets a boost)
      const searchTarget = `${txn.merchantName} ${txn.category}`.toLowerCase();
      if (searchTarget.includes(query.toLowerCase())) {
        keywordScore = 1.0;
      }
      
      // Hybrid Score: 70% Semantic, 30% Keyword
      const finalScore = (semanticScore * 0.7) + (keywordScore * 0.3);
      
      return { ...txn, _score: finalScore };
    });
    
    // 4. Sort by score descending and return top matches
    scoredTransactions.sort((a, b) => b._score - a._score);
    
    const results = scoredTransactions.slice(0, limit).map(t => {
      // Remove embedding blob from memory before returning to UI
      const { embedding, _score, ...rest } = t;
      return rest;
    });
    
    console.log(`[SemanticSearch] Found ${results.length} results in ${Date.now() - t0}ms for "${query}"`);
    return results;
  }
}
