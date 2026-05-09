/**
 * Kairo — Model Configuration
 * Centralized magic numbers and model settings
 */

export const MODEL_CONFIG = {
  // Context window
  N_CTX: 4096,
  N_GPU_LAYERS: 50,
  N_BATCH: 512,
  USE_MLOCK: true,
} as const;

export const INFERENCE_CONFIG = {
  // Token generation
  N_PREDICT: 1024,
  TEMPERATURE: 0.7,
  TOP_K: 40,
  TOP_P: 0.9,
  STOP_TOKEN: '<|im_end|>' as const,
} as const;

export const FAST_QUERY_CONFIG = {
  N_PREDICT: 128,
  TEMPERATURE: 0.5,
  TOP_K: 30,
  TOP_P: 0.85,
  STOP_TOKEN: '<|im_end|>' as const,
} as const;

export const ONE_SHOT_CONFIG = {
  N_PREDICT: 64,
  TEMPERATURE: 0.1,
  STOP_TOKEN: '<|im_end|>' as const,
} as const;

// RAG Configuration
export const RAG_CONFIG = {
  MAX_HISTORY_MESSAGES: 6,
  MAX_RAG_KEYWORDS: 2,
  MAX_RAG_RESULTS_PER_KEYWORD: 3,
  MAX_RELEVANT_MEMORIES: 5,
  MAX_RECENT_TRANSACTIONS: 15,
  CACHE_TTL_MS: 60000,
  SEMANTIC_SEARCH_LIMIT: 3,
  MAX_TRANSACTIONS_TO_SCORE: 50,
} as const;

// Anomaly Detection
export const ANOMALY_CONFIG = {
  THRESHOLD: 5000,
  N_PREDICT: 64,
} as const;

// Auth Configuration
export const AUTH_CONFIG = {
  MAX_LOGIN_ATTEMPTS: 5,
  LOCKOUT_DURATION_MS: 30000,
  PBKDF2_ITERATIONS: 10000,
} as const;

// Rate Limiting
export const RATE_LIMIT_CONFIG = {
  MAX_REQUESTS_PER_MINUTE: 30,
  MAX_TOKENS_PER_MINUTE: 50000,
} as const;

// UI Configuration
export const UI_CONFIG = {
  STREAM_BATCH_INTERVAL_MS: 50,
  ANIMATION_DURATION_MS: 250,
  DEBOUNCE_DELAY_MS: 300,
} as const;

// Database
export const DB_CONFIG = {
  NAME: 'kairo_ai_bank.db',
  CACHE_TTL_MS: 60000,
} as const;

// Export configs as union type for easy switching
export type InferenceConfig = typeof INFERENCE_CONFIG;
export type FastQueryConfig = typeof FAST_QUERY_CONFIG;