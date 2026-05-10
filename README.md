# Kairo — AI-Powered Personal Finance OS

<p align="center">
  <img src="https://img.shields.io/badge/React%20Native-0.81.5-61DAFB?style=for-the-badge&logo=react" alt="React Native">
  <img src="https://img.shields.io/badge/Expo%20SDK-54-000020?style=for-the-badge&logo=expo" alt="Expo SDK">
  <img src="https://img.shields.io/badge/TypeScript-5.9-3178C6?style=for-the-badge&logo=typescript" alt="TypeScript">
  <img src="https://img.shields.io/badge/AI-On--Device%20LLM-FF6B6B?style=for-the-badge" alt="AI">
  <img src="https://img.shields.io/badge/Platform-iOS%20%7C%20Android-000000?style=for-the-badge" alt="Platform">
</p>

<p align="center">
  <strong>Kairo</strong> is a premium mobile banking application that combines traditional financial management with embedded AI capabilities. All data stays on-device — your financial privacy is non-negotiable.
</p>

<p align="center">
  <a href="#-features">Features</a> ·
  <a href="#-tech-stack">Tech Stack</a> ·
  <a href="#-getting-started">Getting Started</a> ·
  <a href="#-architecture">Architecture</a> ·
  <a href="#-ai-engine">AI Engine</a> ·
  <a href="#-database-schema">Database</a>
</p>

---

## Features

### Banking
- **Multi-account management** — Savings, Credit, Investment, Crypto, and Travel accounts
- **Account carousel** — Swipeable cards with balance visibility toggle
- **Money transfers** — Swipe-to-pay gesture for instant transfers
- **QR code payments** — Merchant payments via camera scanning
- **Deposits** — Add money to any account instantly

### Wealth Management
- **Net worth tracking** — Real-time calculation of assets minus liabilities
- **Investment portfolio** — Track stocks, mutual funds, crypto, and fixed deposits
- **Asset allocation charts** — Interactive rotatable pie charts
- **Savings goals** — Progress tracking with deadline management
- **Debt payoff planning** — Strategic debt elimination recommendations
- **Bill reminders** — Due date notifications for recurring payments

### AI Assistant (Luxe-Bot)
- **On-device LLM inference** — Powered by Qwen 2.5 3B (GGUF format)
- **Voice input** — Speak your questions naturally
- **Streaming responses** — Real-time token generation
- **Memory persistence** — Learns your preferences over time
- **Semantic transaction search** — Find transactions by natural language queries
- **Anomaly detection** — Fraud alerts on unusual transactions
- **Financial insights** — Budget alerts, spending patterns, and predictions

### Gamification
- **Financial health score** — Gamified scoring of your financial wellness
- **Savings streaks** — Motivation through daily savings tracking
- **Achievement badges** — Rewards for financial milestones

---

## Tech Stack

| Category | Technology |
|----------|------------|
| **Framework** | React Native 0.81.5 + New Architecture |
| **Runtime** | Expo SDK 54 |
| **Navigation** | expo-router v6 (file-based routing) |
| **Language** | TypeScript 5.9 (strict mode) |
| **Database** | expo-sqlite (local SQLite) |
| **State** | Zustand v5 |
| **Animations** | react-native-reanimated v4 + moti |
| **UI Effects** | expo-blur, expo-linear-gradient |
| **Icons** | lucide-react-native |
| **Security** | expo-secure-store, expo-crypto, expo-local-authentication |
| **AI/LLM** | llama.rn (Qwen 2.5 3B GGUF) |
| **Voice** | @react-native-voice/voice |

---

## Getting Started

### Prerequisites

- **Node.js** 19.x or higher
- **npm** or **yarn**
- **Xcode** 15+ (for iOS development)
- **Android Studio** (for Android development)
- **CocoaPods** (iOS native dependencies)

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/kairo-ai-bank.git
cd kairo-ai-bank

# Install dependencies
npm install

# Install iOS native dependencies
npx pod-install
```

### Running the App

#### Development Mode

```bash
# Start Metro bundler and run on iOS Simulator
npx expo run:ios

# Or start Metro separately
npx expo start

# Then run on a specific platform
npx expo run:ios --device
```

#### Release Mode

```bash
# Build and run release version on iOS Simulator
npx expo run:ios --configuration Release

# Build and run on a physical iOS device
npx expo run:ios --configuration Release --device
```

#### Other Platforms

```bash
# Android
npx expo run:android

# Web
npm run web

# Start development server
npm start
```

### Type Checking & Linting

```bash
# TypeScript type checking
npm run typecheck

# ESLint
npm run lint
```

---

## Architecture

### Folder Structure

```
kairo-ai-bank/
├── app/                        # expo-router pages (file-based routing)
│   ├── _layout.tsx             # Root layout with fonts and providers
│   ├── index.tsx               # Login/registration with biometric auth
│   ├── accounts.tsx            # All accounts view
│   ├── bills.tsx               # Bills management
│   └── (tabs)/                # Tab navigator
│       ├── _layout.tsx        # Tab navigator with AI FAB
│       ├── dashboard.tsx       # Main dashboard
│       ├── transactions.tsx   # Transaction history
│       ├── wealth.tsx          # Wealth management
│       └── ai.tsx              # AI features tab
│
├── src/
│   ├── ai/                     # AI engine
│   │   ├── llamaEngine.ts     # Core LLM inference
│   │   ├── modelManager.ts    # Model download/management
│   │   └── embeddingEngine.ts # Semantic similarity
│   │
│   ├── animations/            # Animation presets
│   │
│   ├── assets/                # Static assets
│   │
│   ├── components/            # Reusable UI components
│   │   ├── ai/                # AI components
│   │   ├── buttons/           # Button components
│   │   ├── cards/             # Card components
│   │   ├── charts/            # Chart components
│   │   ├── common/            # Common components
│   │   ├── dashboard/          # Dashboard widgets
│   │   ├── gamification/       # Gamification elements
│   │   ├── inputs/            # Input components
│   │   ├── layout/            # Layout components
│   │   ├── notifications/      # Notification components
│   │   └── budget/            # Budget widgets
│   │
│   ├── config/                # Configuration
│   │   ├── ai-prompts.ts      # AI system prompts
│   │   └── model-config.ts    # LLM settings
│   │
│   ├── db/                    # Database layer
│   │   ├── database.ts        # SQLite queries
│   │   └── migrations/       # Database migrations
│   │
│   ├── hooks/                 # Custom React hooks
│   │
│   ├── services/              # Business logic
│   │   ├── BudgetService.ts
│   │   ├── BillService.ts
│   │   ├── DebtService.ts
│   │   ├── InsightEngine.ts
│   │   ├── InvestmentService.ts
│   │   ├── MemoryService.ts
│   │   ├── NotificationService.ts
│   │   ├── PredictionService.ts
│   │   ├── SavingsGoalService.ts
│   │   ├── SemanticSearchService.ts
│   │   ├── SubscriptionService.ts
│   │   └── TransferService.ts
│   │
│   ├── store/                 # Zustand stores
│   │
│   ├── theme/                 # Design system
│   │   ├── tokens.ts          # Colors, typography, spacing
│   │   ├── styles.ts          # Common styles
│   │   └── index.ts           # Barrel export
│   │
│   ├── utils/                 # Utilities
│   │   ├── types.ts           # TypeScript types
│   │   ├── formatters.ts      # Currency/date formatting
│   │   ├── validators.ts     # Input validation
│   │   └── mockData.ts        # Sample data
│   │
│   └── workers/              # Background workers
│       └── MemoryWorker.ts    # Memory extraction
│
└── README.md
```

### Navigation Structure

```
Root Stack Navigator
├── index (LoginScreen)
├── (tabs) [Tab Navigator]
│   ├── dashboard
│   ├── transactions
│   ├── wealth
│   └── ai
├── accounts (push)
└── bills (push)
```

### UI Overlays (not in navigation stack)

- `AIAssistantSheet` — Bottom sheet chat interface
- `NotificationSheet` — Notification center
- `QRScanner` — Camera modal
- `TransferModal` — Money transfer
- `AddMoneyModal` — Deposits

---

## AI Engine

### On-Device LLM

Kairo runs **Qwen 2.5 3B Instruct** (GGUF, Q4_K_M quantization) entirely on-device via `llama.rn`. No data leaves your phone.

```
Context Window: 4096 tokens
Quantization:   Q4_K_M (optimized for mobile)
Inference:     Streaming with token batching
```

### RAG Pipeline

Every AI query is augmented with relevant context:

1. **User Query** → Embedding generation
2. **Context Retrieval** from:
   - Recent transactions (15 most recent)
   - Net worth calculation
   - Budget status
   - Savings goals
   - Bills and debts
   - Investment portfolio
   - AI memories (5 most relevant)
   - Subscription patterns
3. **Response Generation** with streaming

### Specialized Personas

| Persona | Capability |
|---------|------------|
| `MAIN` | CFA-level financial advice, INR focus |
| `ANOMALY` | Fraud detection and alerts |
| `INVESTMENT` | Portfolio analysis and recommendations |
| `BUDGET_COACH` | Spending pattern analysis |
| `DEBT_ADVISOR` | Payoff strategy planning |
| `GOAL_COACH` | Savings progress motivation |
| `CASH_FLOW` | Income vs expense analysis |
| `TAX_OPTIMIZATION` | Tax savings recommendations |
| `RETIREMENT` | FIRE calculations |

### Memory System

- User preferences extracted via background workers
- Embedding-based relevance scoring
- Long-term preference persistence
- Semantic search across memories

### Semantic Search

- Keyword + embedding hybrid scoring (30/70 weight)
- 60-second cache for performance
- Transaction similarity matching

---

## Database Schema

### Core Tables

```sql
-- Multi-currency account support
CREATE TABLE accounts (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  balance REAL DEFAULT 0,
  type TEXT,          -- savings, credit, investment, crypto, travel
  currency TEXT DEFAULT 'INR',
  cardNetwork TEXT,
  cardNumber TEXT,
  isActive INTEGER DEFAULT 1
);

-- Transaction history with embeddings
CREATE TABLE transactions (
  id TEXT PRIMARY KEY,
  merchantName TEXT,
  category TEXT,
  type TEXT,          -- debit, credit
  amount REAL,
  currency TEXT,
  timestamp TEXT,
  accountSource TEXT,
  status TEXT,
  embedding TEXT      -- for semantic search
);

-- Investment portfolio
CREATE TABLE portfolio (
  id TEXT PRIMARY KEY,
  label TEXT,
  value REAL,
  category TEXT,     -- stocks, mutual_funds, crypto, fixed_deposits
  companySymbol TEXT,
  allocation REAL,
  change1D REAL,
  change1Y REAL
);

-- AI memory persistence
CREATE TABLE ai_memory (
  id TEXT PRIMARY KEY,
  key TEXT,
  value TEXT,
  category TEXT,
  embedding TEXT,
  updated_at TEXT
);

-- Budget tracking
CREATE TABLE budgets (
  id TEXT PRIMARY KEY,
  category TEXT,
  limit_amount REAL,
  spent_amount REAL DEFAULT 0,
  month INTEGER,
  year INTEGER
);

-- Savings goals
CREATE TABLE savings_goals (
  id TEXT PRIMARY KEY,
  name TEXT,
  targetAmount REAL,
  currentAmount REAL DEFAULT 0,
  deadline TEXT,
  category TEXT,
  monthlyContribution REAL,
  isCompleted INTEGER DEFAULT 0
);

-- Bill management
CREATE TABLE bills (
  id TEXT PRIMARY KEY,
  name TEXT,
  amount REAL,
  dueDate TEXT,
  category TEXT,
  isRecurring INTEGER,
  recurMonthDays TEXT,
  isPaid INTEGER DEFAULT 0,
  paidAt TEXT,
  reminderDays INTEGER
);

-- Debt tracking
CREATE TABLE debts (
  id TEXT PRIMARY KEY,
  name TEXT,
  type TEXT,
  initialAmount REAL,
  currentBalance REAL,
  interestRate REAL,
  minimumPayment REAL,
  dueDate TEXT
);
```

### Indexes

```sql
CREATE INDEX idx_transactions_timestamp ON transactions(timestamp);
CREATE INDEX idx_transactions_category ON transactions(category);
CREATE INDEX idx_transactions_account_source ON transactions(accountSource);
CREATE INDEX idx_ai_memory_updated_at ON ai_memory(updated_at);
CREATE INDEX idx_ai_memory_category ON ai_memory(category);
CREATE INDEX idx_budgets_month_year ON budgets(month, year);
CREATE INDEX idx_savings_goals_deadline ON savings_goals(deadline);
CREATE INDEX idx_bills_due_date ON bills(dueDate);
CREATE INDEX idx_debts_due_date ON debts(dueDate);
```

---

## Design System

### Color Palette (Dark Mode)

| Token | Hex | Usage |
|-------|-----|-------|
| `background` | `#0A0A0A` | App background |
| `accentBlue` | `#2E5BFF` | Primary actions |
| `accentCyan` | `#00D4FF` | Secondary accent |
| `success` | `#00FF99` | Positive values |
| `error` | `#FF4D6D` | Negative/Error |
| `warning` | `#FFB800` | Alerts |
| `gold` | `#D4AF37` | Premium features |

### Typography

- **Font**: Inter (400–900 weights)
- **Scale**: xs (11px) → hero (72px)

### Glassmorphism

```typescript
glass: {
  light:  { opacity: 0.06, blur: 20 },
  medium: { opacity: 0.10, blur: 40 },
  heavy:  { opacity: 0.15, blur: 60 },
}
```

---

## Security & Privacy

- **On-device only** — All financial data stays on your device
- **Biometric authentication** — Face ID / Touch ID for app access
- **Secure credential storage** — Passwords hashed with SHA256 (12,000 iterations)
- **No external data transmission** — Only configured LLM API calls

---

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## License

Private repository. All rights reserved.

---

<p align="center">
  <strong>Built with ❤️ for privacy-first finance</strong>
</p>
