/**
 * Kairo — Chat Store
 * Persists AI chat messages in Zustand so conversations survive
 * across bottom sheet open/close cycles.
 */

import { create } from 'zustand';

export type AIActionType = 
  | 'navigate' 
  | 'transfer' 
  | 'freeze' 
  | 'search'
  | 'setBudget'
  | 'createGoal'
  | 'payBill'
  | 'analyze'
  | 'advice'
  | 'view_returns'
  | 'view_investments'
  | 'view_portfolio'
  | 'view_budgets'
  | 'view_goals'
  | 'view_debts'
  | 'view_bills'
  | 'close';

export interface AIAction {
  action: AIActionType;
  details?: string;
}

export interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'assistant';
  isStreaming?: boolean;
  action?: AIAction | null;
}

interface ChatState {
  messages: ChatMessage[];
  setMessages: (msgs: ChatMessage[] | ((prev: ChatMessage[]) => ChatMessage[])) => void;
  clearChat: () => void;
}

export const useChatStore = create<ChatState>((set) => ({
  messages: [],
  setMessages: (msgs) => {
    set((state) => ({
      messages: typeof msgs === 'function' ? msgs(state.messages) : msgs,
    }));
  },
  clearChat: () => set({ messages: [] }),
}));
