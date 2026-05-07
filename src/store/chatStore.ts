/**
 * Kairo — Chat Store
 * Persists AI chat messages in Zustand so conversations survive
 * across bottom sheet open/close cycles.
 */

import { create } from 'zustand';

export interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  isStreaming?: boolean;
  action?: any;
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
