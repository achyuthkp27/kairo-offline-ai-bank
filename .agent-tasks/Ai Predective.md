You are an expert React Native + AI engineer.

I'm building Kairo — a personal finance AI app. It already has RAG, tool calling, anomaly detection, and a hybrid SQL + LLM architecture.

TASK: Add a Persistent AI Memory Layer.

Requirements:
1. Create an `ai_memory` table in SQLite with fields: id, key, value, category, created_at, updated_at
   - categories: preference, behavior, insight, persona

2. Build a MemoryService (TypeScript) with:
   - saveMemory(key, value, category)
   - getRelevantMemories(userMessage: string): string[]
   - Uses keyword + semantic matching to pick top 5 relevant memories

3. Before every LLM call, inject relevant memories into the system prompt like:
   "USER MEMORY CONTEXT:
   - User prefers UPI payments
   - User dislikes subscriptions
   - User frequently checks dining expenses"

4. After every LLM response, extract and auto-save new memories using a lightweight extraction prompt.

5. Add a "Kairo knows you" screen showing all saved memories with delete option.

Stack: React Native, SQLite, existing Gemini/Claude API integration.
Keep all processing on-device. No cloud memory storage.

Show me the full implementation with file structure.