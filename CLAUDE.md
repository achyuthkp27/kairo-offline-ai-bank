# Kairo - Finance AI App

Kairo is a React Native + Expo mobile banking app with embedded AI assistant capabilities using on-device LLM (Llama 3.2 via llama.rn) and Gemini API integration.

## Tech Stack

- **Framework**: React Native 0.81.5 + Expo SDK 54
- **Navigation**: expo-router v6 (file-based routing)
- **Database**: expo-sqlite for local SQLite storage
- **AI/LLM**: llama.rn for on-device Llama 3.2, Gemini API for cloud inference
- **State Management**: Zustand
- **Animations**: react-native-reanimated + moti
- **UI**: Custom components with lucide-react-native icons, expo-blur, expo-linear-gradient
- **Language**: TypeScript (strict mode)

## Folder Structure

```
app/                    # expo-router pages (file-based routing)
  (tabs)/               # Tab navigation screens
    _layout.tsx         # Tab navigator layout
    ai.tsx              # AI assistant chat screen
    dashboard.tsx       # Main dashboard
    transactions.tsx    # Transaction history
    wealth.tsx          # Wealth/portfolio view
  _layout.tsx           # Root layout
  index.tsx             # Entry/splash screen

src/
  ai/                   # AI engine, model management, Llama integration
  components/           # Reusable UI components
    ai/                 # AI-specific components (AIAssistantSheet, etc.)
    buttons/            # Button components
    charts/             # Chart components (DonutChart, Sparkline, etc.)
    common/             # Common components (GlassCard, ErrorBoundary, etc.)
    inputs/             # Input components
    layout/             # Layout components (DashboardHeader, etc.)
    notifications/      # Notification components
  db/                   # Database schema and migrations
  hooks/                # Custom React hooks
  services/             # Business logic services
  store/                # Zustand stores
  theme/                # Theme tokens and configuration
  utils/                # Utility functions and types
```

## Coding Conventions

### TypeScript
- Strict types on all functions, no `any`
- Export all service classes and hooks properly
- JSDoc comment on every exported function

### React Native / Expo
- Functional components only, no class components
- `useCallback` and `useMemo` on expensive operations
- All text inside `<Text>` components, never raw strings in JSX
- Use existing theme/design system tokens for all colors and spacing

### SQLite
- All schema changes go in a migration file under `db/migrations/`
- Every new table needs: `id`, `created_at`, `updated_at`
- Use parameterised queries, never string interpolation in SQL
- Add indexes on any column used in WHERE clauses

### LLM / AI Calls
- Never call the LLM synchronously on the main thread for UI responses
- Pre-computation and caching must run in background (background fetch / task queue)
- Direct user questions answered from cache/SQL first, LLM only as fallback
- Inject relevant memories from `ai_memory` table into every LLM system prompt

### Error Handling
- Every async function wrapped in try/catch
- User-facing errors shown as friendly messages, not raw error strings
- Log errors to console in dev, silent in production

## Performance Rules

**300ms response target**: All direct user-facing responses must return in under 300ms.

Heavy operations (LLM calls, embedding generation, large SQLite queries) must be:
- Run in background tasks
- Pre-computed and cached where possible
- Lazy-loaded on demand

## Using .agent-tasks/

The `.agent-tasks/` folder contains feature specifications for incremental development.

### Building a Task
Use the `/build-feature` command to build any task:
```
/build-feature <task-filename>
```

Example: `/build-feature persistent-memory.md`

### Workflow
1. Write your feature specification in `.agent-tasks/<name>.md`
2. Run `/build-feature <name>` to execute the full build pipeline
3. The build pipeline will: explore codebase → plan → implement → self-review → summarize

### Task File Format
Each task file should include:
- Task name
- Description
- Requirements
- Acceptance criteria
- Dependencies (if any)

## On-Device Only Principle

All user financial data stays on-device. No user data is sent to external services except the configured LLM API (Gemini). AI memories are stored locally in SQLite.