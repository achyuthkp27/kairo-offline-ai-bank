import { getDb } from '../db/database';
import { embeddingEngine } from '../ai/embeddingEngine';

const MAX_MEMORIES_TO_SCORE = 100;
const RELEVANCE_THRESHOLD = 0.3;

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
  static async saveMemory(key: string, value: string, category: AIMemory['category']) {
    const database = await getDb();
    const id = `mem_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const now = Date.now();

    embeddingEngine.generateEmbedding(value).then(async (embedding) => {
      try {
        await database.runAsync(
          'INSERT OR REPLACE INTO ai_memory (id, key, value, category, embedding, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [id, key, value, category, JSON.stringify(embedding), now, now]
        );
      } catch (e) {
        console.warn('[MemoryService] Failed to insert with embedding, falling back:', e);
        await database.runAsync(
          'INSERT OR REPLACE INTO ai_memory (id, key, value, category, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
          [id, key, value, category, now, now]
        );
      }
    }).catch(async (e) => {
      console.warn('[MemoryService] Embedding generation failed, saving without embedding:', e);
      await database.runAsync(
        'INSERT OR REPLACE INTO ai_memory (id, key, value, category, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
        [id, key, value, category, now, now]
      );
    });
  }

  static async getRelevantMemories(userMessage: string, limit: number = 5): Promise<AIMemory[]> {
    const database = await getDb();
    const memories = await database.getAllAsync<AIMemory>(
      'SELECT * FROM ai_memory ORDER BY updated_at DESC LIMIT ?',
      [MAX_MEMORIES_TO_SCORE]
    );

    if (memories.length === 0) return [];

    const queryEmbedding = await embeddingEngine.generateEmbedding(userMessage.toLowerCase());

    if (queryEmbedding.length === 0) {
      return memories.slice(0, limit);
    }

    const scoredMemories = memories.map(mem => {
      let score = 0;
      if (mem.embedding) {
        try {
          const memEmbedding = JSON.parse(mem.embedding);
          score = embeddingEngine.cosineSimilarity(queryEmbedding, memEmbedding);
        } catch (e) {
          console.warn('[MemoryService] Failed to parse memory embedding:', e);
        }
      }
      return { ...mem, _score: score };
    });

    const relevant = scoredMemories
      .filter(m => m._score > RELEVANCE_THRESHOLD)
      .sort((a, b) => b._score - a._score)
      .slice(0, limit);

    return relevant.map(({ embedding, _score, ...rest }) => rest as AIMemory);
  }

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
