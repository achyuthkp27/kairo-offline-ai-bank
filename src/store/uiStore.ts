import { create } from 'zustand';

interface UIState {
  appContext: string;
  isAISheetVisible: boolean;
  isNotificationSheetVisible: boolean;
  initialAIQuery: string;
  setAppContext: (context: string) => void;
  setAISheetVisible: (visible: boolean) => void;
  setNotificationSheetVisible: (visible: boolean) => void;
  setInitialAIQuery: (query: string) => void;
}

export const useUIStore = create<UIState>((set) => ({
  appContext: 'Dashboard Home',
  isAISheetVisible: false,
  isNotificationSheetVisible: false,
  initialAIQuery: '',
  setAppContext: (appContext) => set({ appContext }),
  setAISheetVisible: (isAISheetVisible) => set({ isAISheetVisible }),
  setNotificationSheetVisible: (isNotificationSheetVisible) => set({ isNotificationSheetVisible }),
  setInitialAIQuery: (initialAIQuery) => set({ initialAIQuery }),
}));
