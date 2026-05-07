/**
 * Kairo — Persistent AI Memory Service
 * Manages extraction, storage, and retrieval of user context & preferences
 */

import { getDb } from '../db/database';
import { embeddingEngine } from '../ai/embeddingEngine';

export interface AIMemory {
  id: string;
  key: string;
  value: string;
  category: 'preference' | 'behavior' | 'insight' | 'persona';
  embedding?: string;
  created_at: number;
  updated_at: number;
}

export class MemoryService {
  /**
   * Saves a new memory and generates its semantic embedding in the background.
   */
  static async saveMemory(key: string, value: string, category: AIMemory['category']) {
    const database = await getDb();
    const id = `mem_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const now = Date.now();
    
    // Fire and forget embedding generation
    embeddingEngine.generateEmbedding(value).then(async (embedding) => {
      await database.runAsync(
        'INSERT OR REPLACE INTO ai_memory (id, key, value, category, embedding, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [id, key, value, category, JSON.stringify(embedding), now, now]
      );
      console.log(`[MemoryService] Saved new memory: ${value}`);
    }).catch(async () => {
      // Fallback without embedding if generator fails
      await database.runAsync(
        'INSERT OR REPLACE INTO ai_memory (id, key, value, category, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
        [id, key, value, category, now, now]
      );
    });
  }

  /**
   * Retrieve memories relevant to the user's current query using semantic search
   */
  static async getRelevantMemories(userMessage: string, limit: number = 5): Promise<AIMemory[]> {
    const database = await getDb();
    const memories = await database.getAllAsync<AIMemory>('SELECT * FROM ai_memory');
    
    if (memories.length === 0) return [];
    
    const queryEmbedding = await embeddingEngine.generateEmbedding(userMessage.toLowerCase());
    
    if (queryEmbedding.length === 0) {
      // Fallback to recent memories if embedding fails
      return memories.sort((a, b) => b.updated_at - a.updated_at).slice(0, limit);
    }
    
    const scoredMemories = memories.map(mem => {
      let score = 0;
      if (mem.embedding) {
        try {
          const memEmbedding = JSON.parse(mem.embedding);
          score = embeddingEngine.cosineSimilarity(queryEmbedding, memEmbedding);
        } catch (e) {}
      }
      return { ...mem, _score: score };
    });
    
    // Filter out low relevance memories (score < 0.3)
    const relevant = scoredMemories
      .filter(m => m._score > 0.3)
      .sort((a, b) => b._score - a._score)
      .slice(0, limit);
      
    return relevant.map(({ embedding, _score, ...rest }) => rest as AIMemory);
  }

  /**
   * Get all memories (for the "Kairo knows you" UI)
   */
  static async getAllMemories(): Promise<AIMemory[]> {
    const database = await getDb();
    const memories = await database.getAllAsync<AIMemory>('SELECT * FROM ai_memory ORDER BY updated_at DESC');
    return memories.map(({ embedding, ...rest }) => rest as AIMemory);
  }
  
  static async deleteMemory(id: string) {
    const database = await getDb();
    await database.runAsync('DELETE FROM ai_memory WHERE id = ?', [id]);
  }
}
