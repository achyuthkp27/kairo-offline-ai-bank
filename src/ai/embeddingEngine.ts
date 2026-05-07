/**
 * Kairo — Embedding Engine (Keyword Fallback)
 * 
 * The Qwen instruct model does NOT support native embedding mode.
 * This engine provides keyword-based similarity as a lightweight fallback,
 * so MemoryService and SemanticSearchService still function without crashing.
 */

class EmbeddingEngine {
  /**
   * Generates a "pseudo-embedding" using TF-like keyword hashing.
   * This is NOT a real semantic vector — it's a stable hash-based fingerprint
   * that allows basic keyword matching via cosine similarity.
   */
  async generateEmbedding(text: string): Promise<number[]> {
    if (!text || text.trim().length === 0) return [];

    // Simple bag-of-words hash embedding (128 dimensions)
    const dimensions = 128;
    const vec = new Array(dimensions).fill(0);
    const words = text.toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/).filter(w => w.length > 2);
    
    for (const word of words) {
      // Use a simple string hash to map words to vector positions
      let hash = 0;
      for (let i = 0; i < word.length; i++) {
        hash = ((hash << 5) - hash + word.charCodeAt(i)) | 0;
      }
      const idx = Math.abs(hash) % dimensions;
      vec[idx] += 1;
    }
    
    // Normalize the vector
    const magnitude = Math.sqrt(vec.reduce((sum, v) => sum + v * v, 0));
    if (magnitude > 0) {
      for (let i = 0; i < dimensions; i++) {
        vec[i] /= magnitude;
      }
    }
    
    return vec;
  }

  /**
   * Compute cosine similarity between two vectors
   */
  cosineSimilarity(vecA: number[], vecB: number[]): number {
    if (!vecA || !vecB || vecA.length === 0 || vecB.length === 0) return 0;
    
    // Handle mismatched lengths gracefully
    const len = Math.min(vecA.length, vecB.length);
    
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    for (let i = 0; i < len; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }
    
    if (normA === 0 || normB === 0) return 0;
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }
}

export const embeddingEngine = new EmbeddingEngine();
