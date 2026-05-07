You are an expert React Native + AI engineer.

I'm building Kairo — a personal finance AI app with SQLite transaction storage.

TASK: Add Offline Semantic Transaction Search using local embeddings.

Requirements:
1. EmbeddingService:
   - Use @xenova/transformers (runs fully on-device, no API needed)
   - Model: Xenova/all-MiniLM-L6-v2 (small, fast, offline)
   - Generate embeddings for each transaction description on save
   - Store embeddings as BLOB in SQLite transactions table

2. SemanticSearchService:
   - Takes natural language query
   - Generates query embedding
   - Computes cosine similarity against all stored embeddings
   - Returns top 10 matches ranked by similarity score
   - Hybrid mode: combine semantic score (60%) + keyword match (40%)

3. Example mappings it should handle:
   - "coffee" → Starbucks, Blue Tokai, Café Coffee Day, Third Wave Coffee
   - "food delivery" → Swiggy, Zomato, Dunzo
   - "streaming" → Netflix, Prime, Hotstar, Spotify

4. Integrate into:
   - Chat: replace current keyword SQL search with semantic search
   - Transaction search bar: real-time semantic filtering
   - Insight generation: cluster transactions by semantic similarity

Show complete implementation. Handle first-run embedding generation gracefully (progress indicator).