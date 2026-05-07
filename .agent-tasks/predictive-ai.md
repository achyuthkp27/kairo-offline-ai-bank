You are an expert React Native + AI engineer.

I'm building Kairo — a personal finance AI app with existing transaction history in SQLite.

TASK: Build a Predictive Intelligence Engine.

Requirements:
1. PredictionService (TypeScript) that runs daily and generates:
   - Balance forecast: "Your balance may fall below ₹10,000 by Friday"
   - Bill predictions: detect recurring payments, predict next due date
   - Spending pattern alerts: "You usually order food on weekends"
   - Unusual activity warnings

2. Algorithm:
   - Analyze last 90 days of transactions
   - Detect recurring transactions (same merchant ± 3 days, similar amount ± 15%)
   - Use 7-day and 30-day rolling averages for spending patterns
   - Forecast balance using average daily spend rate

3. AI Insight Cards UI:
   - Horizontal scrollable cards on home screen
   - Each card: icon + short prediction text + confidence indicator
   - Card types: warning (red), info (blue), positive (green)
   - Auto-refresh every morning at 9am using background task

4. Integrate predictions into chat:
   When user asks about finances, prepend top 3 predictions to context.

Stack: React Native, SQLite, existing LLM integration.
Show complete implementation with sample prediction output