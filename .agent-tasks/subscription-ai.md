You are an expert React Native + AI engineer.

I'm building Kairo — a personal finance AI app.

TASK: Build a Subscription Intelligence Module.

Requirements:
1. SubscriptionDetector service:
   - Scan all transactions for recurring patterns (monthly/yearly)
   - Match against a known subscription merchant list (Netflix, Spotify, Prime, iCloud, Zomato Pro, etc.)
   - Detect unknown recurring payments by pattern alone (same amount, ~30 day interval)

2. Subscription Dashboard screen:
   - Total monthly subscription cost (big headline number)
   - Cards for each subscription: logo/icon, name, amount, next renewal date
   - Tag: "Essential" / "Rarely Used" / "Duplicate" — AI-classified
   - "Cancel Simulation": show projected annual savings if cancelled

3. AI Chat Integration:
   - "You have 8 active subscriptions totaling ₹4,850/month"
   - "Your iCloud storage renews in 3 days"
   - "You have 2 similar music streaming subscriptions"

4. Smart Alerts:
   - 3-day renewal warning notifications
   - Duplicate subscription detection alert
   - "Unused subscription" alert if no related activity in 60 days

Stack: React Native, SQLite, existing notification system.
Include the merchant pattern-matching dictionary and full UI code.