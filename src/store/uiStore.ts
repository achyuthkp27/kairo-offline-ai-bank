import { create } from 'zustand';

interface UIState {
  appContext: string;
  setAppContext: (context: string) => void;
}

export const useUIStore = create<UIState>((set) => ({
  appContext: 'Dashboard Home',
  setAppContext: (appContext) => set({ appContext }),
}));
