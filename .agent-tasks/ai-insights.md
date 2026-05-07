You are an expert React Native + AI engineer.

I'm building Kairo — a personal finance AI app.

TASK: Build a Dynamic AI Financial Insights Feed.

Requirements:
1. InsightEngine service that generates daily insight cards:
   - Spending spike: "Dining increased 22% vs last week"
   - Savings win: "You saved more this month than last 3 months combined"
   - Large transaction: "₹8,500 Amazon purchase detected — your largest this month"
   - Goal progress: "82% toward your Japan trip goal"
   - Category leader: "Fuel is your top category this week"

2. Insight Card UI component:
   - Icon (category-specific) + headline + supporting number
   - Color-coded by sentiment: positive (green), neutral (blue), warning (amber), alert (red)
   - Swipeable card stack or vertical feed
   - Tap to expand → opens AI chat with that insight as context

3. Emotional tone system:
   - Salary credited → "🎉 Great news! Your salary of ₹X just landed."
   - Overspending → calm advisory tone, no judgment
   - Savings milestone → celebratory, encouraging

4. Auto-generation schedule:
   - Morning brief: top 3 insights for the day
   - Evening summary: how today went vs plan
   - Store last 30 days of insights in SQLite

Stack: React Native, SQLite, existing Gemini/LLM integration.
Show full InsightEngine logic + card component code.